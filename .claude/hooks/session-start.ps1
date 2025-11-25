#!/usr/bin/env powershell
# Session Start Hook - Robust Version with Timeout Protection
# Prevents Claude Code from hanging if memory system is unavailable

param(
    [string]$SessionId = "",
    [switch]$Silent = $false
)

$ErrorActionPreference = "SilentlyContinue"
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"

# TIMEOUT: Maximum seconds to wait for any operation
$TIMEOUT_SECONDS = 2

function Invoke-WithTimeout {
    param(
        [scriptblock]$ScriptBlock,
        [int]$TimeoutSeconds = 2
    )

    try {
        $job = Start-Job -ScriptBlock $ScriptBlock
        $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds

        if ($completed) {
            $result = Receive-Job -Job $job
            Remove-Job -Job $job -Force
            return $result
        } else {
            # Timeout - kill the job
            Remove-Job -Job $job -Force
            return $null
        }
    } catch {
        return $null
    }
}

function Get-EnhancedGitContext {
    $GitContext = @{
        branch = "unknown"
        modified_files = 0
        working_dir = (Get-Location).Path
    }

    try {
        $GitContext.branch = git branch --show-current 2>$null
        $Count = (git status --porcelain 2>$null | Measure-Object).Count
        $GitContext.modified_files = $Count
    } catch {
        # Keep defaults if git fails
    }

    return $GitContext
}

function Display-SimpleWelcome {
    param($GitContext)

    if ($Silent) { return }

    Write-Host ""
    Write-Host "CLAUDE CODE - Ready" -ForegroundColor Cyan
    Write-Host "Branch: $($GitContext.branch) | Modified: $($GitContext.modified_files) files" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    # Generate session ID if not provided
    if (-not $SessionId) {
        $SessionId = "session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }

    # Set session ID for other hooks to use
    $env:CLAUDE_SESSION_ID = $SessionId

    # Get git context (fast operation)
    $GitContext = Get-EnhancedGitContext

    # Display simple welcome (no hanging operations)
    Display-SimpleWelcome -GitContext $GitContext

    # OPTIONAL: Try to save session start with timeout protection
    # This won't block Claude Code startup if it fails
    $SaveResult = Invoke-WithTimeout -TimeoutSeconds $TIMEOUT_SECONDS -ScriptBlock {
        try {
            $OriginalLocation = Get-Location
            Set-Location "C:\dev\projects\active\web-apps\memory-bank"

            $SessionData = @{
                session_id = $args[0]
                start_time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                working_dir = $args[1]
            } | ConvertTo-Json -Compress

            node memory_cli.js store "session-start-$($args[0])" $SessionData 2>&1 | Out-Null

            Set-Location $OriginalLocation
        } catch {
            # Silently fail
        }
    } -ArgumentList $SessionId, $GitContext.working_dir

} catch {
    if (-not $Silent) {
        Write-Host "Session start (non-critical error ignored)" -ForegroundColor Yellow
    }
}
