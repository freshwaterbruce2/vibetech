Write-Output "════════════════════════════════════════"
Write-Output "  MCP SERVER PROCESSES (Node.js)"
Write-Output "════════════════════════════════════════"
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Output "Status: ✓ Found running node processes"
    Write-Output ""
    Write-Output "Note: These may include MCP servers running via Node.js"
    Write-Output ""
    $nodeProcesses | Select-Object -First 5 | ForEach-Object {
        Write-Output "  PID: $($_.Id)"
        Write-Output "    Start Time: $($_.StartTime)"
        Write-Output "    Memory (MB): $([math]::Round($_.WorkingSet64 / 1MB, 2))"
        Write-Output ""
    }
    if ($nodeProcesses.Count -gt 5) {
        Write-Output "  ... and $($nodeProcesses.Count - 5) more node processes"
    }
} else {
    Write-Output "Status: ⚠ No node.js processes found"
    Write-Output ""
    Write-Output "This is normal if:"
    Write-Output "  - MCP servers are not currently active"
    Write-Output "  - MCP servers use different runtime (Python, etc.)"
}
Write-Output ""
