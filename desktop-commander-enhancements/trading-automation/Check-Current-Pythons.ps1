Write-Host "Current Python processes:"
Get-Process python* -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = $_
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
    Write-Host "  PID $($proc.Id) (Started: $($proc.StartTime)):" -ForegroundColor Cyan
    Write-Host "    $cmd" -ForegroundColor Gray
}
if ((Get-Process python* -ErrorAction SilentlyContinue).Count -eq 0) {
    Write-Host "  No Python processes found" -ForegroundColor Green
}
