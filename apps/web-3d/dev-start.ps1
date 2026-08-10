$outLog = 'C:\ti-recovery\AppDesign\apps\web-3d\dev-live-out.log'
$errLog = 'C:\ti-recovery\AppDesign\apps\web-3d\dev-live-err.log'
$proc = Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory 'C:\ti-recovery\AppDesign\apps\web-3d' -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
Write-Host "started pid" $proc.Id
Start-Sleep -Seconds 18
Write-Host "ready"
