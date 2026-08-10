#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"
cd C:\ti-recovery\AppDesign\apps\mobile
$env:CHOKIDAR_USEPOLLING = "1"
Write-Host "Starting Expo with polling mode + cache clear..." -ForegroundColor Cyan
npx expo start --clear
