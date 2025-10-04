#!/usr/bin/env powershell
# Post-Tool-Use Hook - Learning System Integration
# Captures tool results after execution and updates learning system

param(
    [string]$ToolName = "Unknown",
    [string]$Success = "true",
    [string]$ToolOutput = ""
)

# Configuration
$LearningSystemPath = "D:\learning-system"
$LogPath = "$LearningSystemPath\logs"
$DatabasePath = "$LearningSystemPath\agent_learning.db"

# Ensure log directory exists
if (-not (Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

$LogFile = Join-Path $LogPath "tool-usage-$(Get-Date -Format 'yyyy-MM-dd').log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

# Determine success status
$SuccessBool = $Success -eq "true"
$Status = if ($SuccessBool) { "SUCCESS" } else { "FAILURE" }

# Log tool result (quote variables for security)
$LogEntry = "[$Timestamp] [POST-TOOL] Tool: $ToolName | Status: $Status"
Add-Content -Path "$LogFile" -Value "$LogEntry" -ErrorAction SilentlyContinue

# Try to update database with results (non-blocking)
try {
    $MistakeType = if (-not $SuccessBool) { "tool_execution_failure" } else { "none" }

    # Sanitize inputs to prevent SQL injection
    $SafeToolName = "$ToolName" -replace "'", "''"
    $SafeTimestamp = "$Timestamp" -replace "'", "''"
    $SafeMistakeType = "$MistakeType" -replace "'", "''"

    # If tool failed, log as mistake
    if (-not $SuccessBool) {
        $MistakeId = [guid]::NewGuid().ToString()
        $SafeDescription = "Tool $SafeToolName failed during execution"
        $SafeContext = "Tool: $SafeToolName"

        $Query = @"
INSERT INTO agent_mistakes (
    id, agent_id, mistake_type, mistake_category,
    description, context_when_occurred, identified_at
) VALUES (
    '$MistakeId', 'claude-code', '$SafeMistakeType', 'execution',
    '$SafeDescription', '$SafeContext', '$SafeTimestamp'
);
"@
        sqlite3 "$DatabasePath" "$Query" 2>$null
    }

    # Update execution log with completion
    $UpdateQuery = @"
UPDATE agent_executions
SET completed_at = '$SafeTimestamp',
    success = $(if ($SuccessBool) { 1 } else { 0 })
WHERE tools_used = '$SafeToolName'
  AND completed_at IS NULL
ORDER BY started_at DESC
LIMIT 1;
"@
    sqlite3 "$DatabasePath" "$UpdateQuery" 2>$null

} catch {
    # Silent failure - don't block Claude Code execution
}

# Exit successfully
exit 0
