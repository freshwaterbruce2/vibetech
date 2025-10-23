Get-Process | Where-Object { $_.ProcessName -match 'desktop-commander' } | Stop-Process -Force
Write-Host "Desktop Commander processes killed"
