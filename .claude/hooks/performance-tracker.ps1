#!/usr/bin/env powershell
# Performance Tracker - Wrapper for measuring hook execution times
# Usage: & performance-tracker.ps1 -HookName "session-start" -HookScript { & .\.claude\hooks\session-start.ps1 }

param(
    [Parameter(Mandatory=$true)]
    [string]$HookName,

    [Parameter(Mandatory=$true)]
    [scriptblock]$HookScript
)

$ErrorActionPreference = "SilentlyContinue"
$PerfLogFile = "$env:TEMP\claude_hook_perf.jsonl"

try {
    # Start timing
    $startTime = Get-Date

    # Execute the hook
    $result = & $HookScript

    # Calculate duration
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds

    # Log performance data
    $perfData = @{
        hook = $HookName
        duration_ms = [math]::Round($duration, 2)
        timestamp = $startTime.ToString("o")
        success = $true
    }

    # Append to JSONL log
    $perfData | ConvertTo-Json -Compress >> $PerfLogFile

    # Return hook result
    return $result

} catch {
    # Log failure
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds

    $perfData = @{
        hook = $HookName
        duration_ms = [math]::Round($duration, 2)
        timestamp = $startTime.ToString("o")
        success = $false
        error = $_.Exception.Message
    }

    $perfData | ConvertTo-Json -Compress >> $PerfLogFile

    # Re-throw error
    throw
}
