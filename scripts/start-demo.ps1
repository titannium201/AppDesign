#!/usr/bin/env pwsh
<#
.SYNOPSIS
  一键启动 TI 腿部恢复智能系统所有服务
.DESCRIPTION
  支持参数化选择启动的服务，方便调试：
    -All            启动全部服务（默认）
    -Api            仅启动 API Gateway (NestJS :3000)
    -Web3d          仅启动 Web-3D (Vite :5173)
    -Mobile         仅启动 Mobile (Expo :8081)
    -NoBuild        跳过 node_modules 检查和构建，直接启动
    -BackendMode    auto | compiled | watch（默认 auto = 有 dist 用编译版，无则 watch）
.EXAMPLE
  ./scripts/start-demo.ps1                           # 启动全部
  ./scripts/start-demo.ps1 -Api -Web3d               # 只调试后端+3D
  ./scripts/start-demo.ps1 -NoBuild                  # 跳过安装，已构建过直接用
  ./scripts/start-demo.ps1 -BackendMode watch        # 强制 watch 模式（热更新）
#>
param(
    [switch]$All,
    [switch]$Api,
    [switch]$Web3d,
    [switch]$Mobile,
    [switch]$NoBuild,
    [ValidateSet("auto", "compiled", "watch")]
    [string]$BackendMode = "auto"
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot | Split-Path -Parent
Set-Location $repoRoot

# 如果没有指定任何服务开关，默认启动全部
$startAll = (-not $Api -and -not $Web3d -and -not $Mobile) -or $All
$startApi = $startAll -or $Api
$startWeb3d = $startAll -or $Web3d
$startMobile = $startAll -or $Mobile

Write-Host @"
╔══════════════════════════════════════════════╗
║   TI 腿部恢复智能系统 - Demo 启动脚本        ║
║   后端 :3000 │ 3D :5173 │ Mobile :8081       ║
╚══════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ── 依赖检查 + 预构建 ──────────────────────
if (-not $NoBuild) {
    if (-not (Test-Path "$repoRoot\node_modules")) {
        Write-Host "[0] 安装依赖 (pnpm install) ..." -ForegroundColor Yellow
        pnpm install
        if ($LASTEXITCODE -ne 0) { throw "pnpm install 失败" }
    }

    # 预构建 shared / nirs-sdk / recovery-algo（上游包）
    Write-Host "[0] 预构建上游包 ..." -ForegroundColor Yellow
    $buildOrder = @(
        "packages/shared",
        "packages/nirs-sdk",
        "packages/recovery-algo"
    )
    foreach ($pkg in $buildOrder) {
        $pkgPath = Join-Path $repoRoot $pkg
        if (Test-Path $pkgPath) {
            Write-Host "  构建 $pkg ..." -ForegroundColor DarkGray
            Push-Location $pkgPath
            pnpm build 2>&1 | Out-Null
            Pop-Location
        }
    }

    # 构建 api-gateway（仅当 dist 不存在时）
    if ($startApi) {
        $apiDist = Join-Path $repoRoot "services\api-gateway\dist\main.js"
        if (-not (Test-Path $apiDist)) {
            Write-Host "[0] 构建 API Gateway ..." -ForegroundColor Yellow
            Push-Location "$repoRoot\services\api-gateway"
            pnpm build 2>&1 | Out-Null
            Pop-Location
        }
    }
}

# ── 启动服务 ──────────────────────────────
$suffix = if ($NoBuild) { " (skip build)" } else { "" }

if ($startApi) {
    $apiDist = Join-Path $repoRoot "services\api-gateway\dist\main.js"
    $useCompiled = ($BackendMode -eq "compiled") -or (($BackendMode -eq "auto") -and (Test-Path $apiDist))
    
    Write-Host "`n[API ] 启动 API Gateway → http://localhost:3000$suffix" -ForegroundColor Green
    if ($useCompiled) {
        Write-Host "       模式: 编译版 (node dist/main.js)" -ForegroundColor DarkGray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'API Gateway :3000'
cd '$repoRoot\services\api-gateway'
Write-Host 'API Gateway 启动中...' -ForegroundColor Green
node dist/main.js
"@ -WindowStyle Normal
    } else {
        Write-Host "       模式: watch (nest start --watch)" -ForegroundColor DarkGray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'API Gateway :3000 (watch)'
cd '$repoRoot\services\api-gateway'
Write-Host 'API Gateway watch 模式启动中...' -ForegroundColor Green
npx nest start --watch
"@ -WindowStyle Normal
    }
    Start-Sleep -Seconds 2
}

if ($startWeb3d) {
    Write-Host "[3D  ] 启动 Web-3D 肌肉查看器 → http://localhost:5173$suffix" -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'Web-3D :5173'
cd '$repoRoot\apps\web-3d'
Write-Host 'Web-3D 启动中...' -ForegroundColor Cyan
npx vite --host
"@ -WindowStyle Normal
}

if ($startMobile) {
    Write-Host "[MOB ] 启动 Mobile Expo → http://localhost:8081$suffix" -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'Mobile Expo :8081'
cd '$repoRoot\apps\mobile'
Write-Host 'Expo 启动中... 按 w 打开 Web 版' -ForegroundColor Magenta
`$env:CHOKIDAR_USEPOLLING=1
npx expo start --clear
"@ -WindowStyle Normal
}

Write-Host @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  服务已在新窗口启动，关闭对应窗口即可停止。
  常用快捷键:
    Web-3D 页面:  http://localhost:5173
    Mobile Web:   按 w 或在浏览器打开 :8081
    API 文档:     暂无（后续接入 Swagger）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Cyan
