$logDir = "$env:APPDATA\Claude\logs\"
Write-Output "════════════════════════════════════════"
Write-Output "  MCP SERVER LOGS"
Write-Output "════════════════════════════════════════"
Write-Output "Log Directory: $logDir"
Write-Output ""
if (Test-Path $logDir) {
    Write-Output "Status: ✓ Log directory found"
    Write-Output ""
    Write-Output "Available MCP log files:"
    $mcpLogs = Get-ChildItem $logDir -Filter "mcp*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($mcpLogs) {
        $mcpLogs | ForEach-Object {
            Write-Output "  - $($_.Name) (Modified: $($_.LastWriteTime), Size: $([math]::Round($_.Length / 1KB, 2)) KB)"
        }
    } else {
        Write-Output "  No MCP log files found"
    }
} else {
    Write-Output "Status: ✗ Log directory does not exist"
}
Write-Output ""
