# Cleanup ports for integration testing

$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
if ($port5174) {
    Stop-Process -Id $port5174.OwningProcess -Force
    Write-Host "Port 5174 freed (PID: $($port5174.OwningProcess))"
} else {
    Write-Host "Port 5174 already free"
}

$port5004 = Get-NetTCPConnection -LocalPort 5004 -ErrorAction SilentlyContinue
if ($port5004) {
    Stop-Process -Id $port5004.OwningProcess -Force
    Write-Host "Port 5004 freed (PID: $($port5004.OwningProcess))"
} else {
    Write-Host "Port 5004 already free"
}

Write-Host "All ports cleaned!"
