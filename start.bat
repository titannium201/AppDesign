@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo +------------------------------------------------+
echo ^|  TI 腿部恢复智能系统 - 一键启动                ^|
echo +------------------------------------------------+
echo.
echo   [1] 启动全部 (API :3000 + 3D :5173 + Mobile Web :19006)
echo   [2] 仅后端 + 3D
echo   [3] 仅后端 + Mobile Web
echo   [4] 仅 3D + Mobile Web
echo   [5] 仅后端 API
echo   [6] 仅 Web-3D
echo   [7] 仅 Mobile Web (完整流程 - 浏览器打开)
echo.
set /p choice="请输入选项 (1-7, 默认1): "

if "!choice!"=="" set choice=1

if "!choice!"=="1" goto startAll
if "!choice!"=="2" goto startApi3D
if "!choice!"=="3" goto startApiMobile
if "!choice!"=="4" goto start3DMobile
if "!choice!"=="5" goto startApi
if "!choice!"=="6" goto start3D
if "!choice!"=="7" goto startMobile
goto startAll

:startAll
    echo 正在启动全部服务...
    echo [PRE] 清理残留端口...
    call :killPorts
    call :startApi
    timeout /t 3 /nobreak >nul
    call :start3D
    timeout /t 2 /nobreak >nul
    call :startMobile
    goto end

:startApi3D
    call :killPorts
    call :startApi
    timeout /t 3 /nobreak >nul
    call :start3D
    goto end

:startApiMobile
    call :killPorts
    call :startApi
    timeout /t 3 /nobreak >nul
    call :startMobile
    goto end

:start3DMobile
    call :killPorts
    call :start3D
    call :startMobile
    goto end

:startApi
    echo [API] 启动 API Gateway :3000
    start "API Gateway :3000" cmd /k "cd /d services\api-gateway & node dist\main.js"
    goto :eof

:start3D
    echo [3D] 启动 Web-3D :5173
    start "Web-3D :5173" cmd /k "cd /d apps\web-3d & npx vite --host"
    goto :eof

:startMobile
    echo [Mobile Web] 启动完整流程 Web 版 :19006
    start "Mobile Web :19006" cmd /k "cd /d apps\mobile & set CHOKIDAR_USEPOLLING=1 & set EXPO_OFFLINE=1 & node ..\..\node_modules\expo\bin\cli start --web --clear"
    goto :eof

:killPorts
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":19000 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":19001 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":19002 "') do taskkill /PID %%a /F 2>nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":19006 "') do taskkill /PID %%a /F 2>nul
    goto :eof

:end
echo.
echo ====================================================
echo  服务正在启动，请稍候...
echo  API Gateway:  http://localhost:3000/health
echo  Web-3D:      http://localhost:5173
echo  Mobile Web:  http://localhost:19006 (完整流程 - 登录/主页/扫描)
echo ====================================================
pause
