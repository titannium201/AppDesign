try {
    $resp = Invoke-WebRequest -Uri 'http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false' -UseBasicParsing
    Write-Host "OK" $resp.StatusCode "Size:" $resp.Content.Length
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "ERROR 500 body:"
    Write-Host $reader.ReadToEnd()
}
