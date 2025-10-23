Write-Output "════════════════════════════════════════"
Write-Output "  RUNNING CLAUDE PROCESSES"
Write-Output "════════════════════════════════════════"
$claudeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*Claude*" } -ErrorAction SilentlyContinue
if ($claudeProcesses) {
    Write-Output "Status: ✓ Found running Claude processes"
    Write-Output ""
    $claudeProcesses | ForEach-Object {
        Write-Output "  Process: $($_.ProcessName)"
        Write-Output "    PID: $($_.Id)"
        Write-Output "    Start Time: $($_.StartTime)"
        Write-Output "    Memory (MB): $([math]::Round($_.WorkingSet64 / 1MB, 2))"
        Write-Output ""
    }
} else {
    Write-Output "Status: ⚠ No running Claude processes found"
    Write-Output ""
    Write-Output "If Claude Desktop should be running:"
    Write-Output "  1. Check if Claude Desktop is actually open"
    Write-Output "  2. Look in Task Manager for 'Claude' process"
    Write-Output "  3. Try restarting Claude Desktop completely"
}
Write-Output ""
