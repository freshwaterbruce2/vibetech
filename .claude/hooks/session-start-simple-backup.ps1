#!/usr/bin/env powershell
# Session Start Hook - Automatic Context Loading
# Simple, reliable implementation using memory_cli.js

param(
    [string]$SessionId = "",
    [switch]$Silent = $false
)

$ErrorActionPreference = "SilentlyContinue"

function Get-LastSessionContext {
    try {
        $OriginalLocation = Get-Location
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"

        # Retrieve last session using memory CLI
        $Result = node memory_cli.js retrieve "last-session" "session_state" 2>&1 | Out-String

        Set-Location $OriginalLocation

        # Check if retrieval was successful
        if ($Result -like "*Data retrieved from*") {
            # Parse the JSON data from the output
            $JsonMatch = [regex]::Match($Result, '\{.*?\}', [System.Text.RegularExpressions.RegexOptions]::Singleline)
            if ($JsonMatch.Success) {
                return $JsonMatch.Value | ConvertFrom-Json
            }
        }

        return $null

    } catch {
        return $null
    }
}

function Get-CurrentGitContext {
    try {
        $Branch = git branch --show-current 2>$null
        $ModifiedCount = (git status --porcelain 2>$null | Measure-Object).Count

        return @{
            branch = $Branch
            modified_files = $ModifiedCount
            working_dir = (Get-Location).Path
        }
    } catch {
        return @{
            branch = "unknown"
            modified_files = 0
            working_dir = (Get-Location).Path
        }
    }
}

function Display-SessionWelcome {
    param($LastSession, $CurrentContext)

    if ($Silent) { return }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Claude Code Session Started" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Current context
    Write-Host "Current Context:" -ForegroundColor Green
    Write-Host "  Branch: $($CurrentContext.branch)" -ForegroundColor Gray
    Write-Host "  Working Dir: $($CurrentContext.working_dir)" -ForegroundColor Gray
    Write-Host "  Modified Files: $($CurrentContext.modified_files)" -ForegroundColor Gray

    # Last session info (if available)
    if ($LastSession) {
        Write-Host ""
        Write-Host "Last Session:" -ForegroundColor Yellow

        if ($LastSession.timestamp) {
            Write-Host "  Time: $($LastSession.timestamp)" -ForegroundColor Gray
        }

        if ($LastSession.branch) {
            Write-Host "  Branch: $($LastSession.branch)" -ForegroundColor Gray
        }

        if ($LastSession.working_dir) {
            Write-Host "  Location: $($LastSession.working_dir)" -ForegroundColor Gray
        }

        if ($LastSession.last_prompt) {
            $Preview = if ($LastSession.last_prompt.Length -gt 80) {
                $LastSession.last_prompt.Substring(0, 77) + "..."
            } else {
                $LastSession.last_prompt
            }
            Write-Host "  Last Task: $Preview" -ForegroundColor Gray
        }

        if ($LastSession.intent_category) {
            Write-Host "  Category: $($LastSession.intent_category)" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "New Session - No previous context found" -ForegroundColor Blue
    }

    Write-Host ""
    Write-Host "Memory System: Active" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
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

    # Get contexts
    $LastSession = Get-LastSessionContext
    $CurrentContext = Get-CurrentGitContext

    # Display welcome message
    Display-SessionWelcome -LastSession $LastSession -CurrentContext $CurrentContext

    # Save session start info for tracking
    try {
        $SessionStart = @{
            session_id = $SessionId
            start_time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            branch = $CurrentContext.branch
            working_dir = $CurrentContext.working_dir
        } | ConvertTo-Json -Compress

        $OriginalLocation = Get-Location
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"

        $Metadata = @{type="session_start"} | ConvertTo-Json -Compress
        node memory_cli.js store "session-start-$SessionId" $SessionStart $Metadata 2>&1 | Out-Null

        Set-Location $OriginalLocation
    } catch {
        # Silently fail if session start save doesn't work
    }

} catch {
    if (-not $Silent) {
        Write-Host "Memory system initialization error (non-critical)" -ForegroundColor Yellow
    }
}
