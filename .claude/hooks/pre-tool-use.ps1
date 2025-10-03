#!/usr/bin/env powershell
# Pre-Tool-Use Hook - Learning System Integration
# Captures tool usage before execution and logs to learning system

param(
    [string]$ToolName = "Unknown",
    [string]$ToolInput = ""
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

# Log tool usage
$LogEntry = "[$Timestamp] [PRE-TOOL] Tool: $ToolName"
Add-Content -Path $LogFile -Value $LogEntry -ErrorAction SilentlyContinue

# Try to log to database (non-blocking)
try {
    $SessionId = [guid]::NewGuid().ToString()
    $TaskType = "tool_execution"

    # Simple SQL insert for tool tracking
    $Query = @"
INSERT OR IGNORE INTO agent_executions (execution_id, agent_id, task_type, tools_used, started_at)
VALUES ('$SessionId', 'claude-code', '$TaskType', '$ToolName', '$Timestamp');
"@

    # Execute database insert (silently fail if table doesn't exist)
    sqlite3 $DatabasePath "$Query" 2>$null
} catch {
    # Silent failure - don't block Claude Code execution
}

# Exit successfully
exit 0
