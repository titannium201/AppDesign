$ports = 3000,5173,8081,19000,19001,19002
foreach($port in $ports) {
    $procIds = netstat -ano | Select-String ":$port " | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
    foreach($procId in $procIds) {
        if($procId -and ($procId -ne '0')) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Killed PID $procId on port $port"
        }
    }
}
