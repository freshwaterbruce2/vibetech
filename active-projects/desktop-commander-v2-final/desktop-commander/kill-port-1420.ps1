$connections = Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object {
        $processId = $_.OwningProcess
        Write-Host "Killing process $processId on port 1420"
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port 1420 freed"
} else {
    Write-Host "No process found on port 1420"
}
