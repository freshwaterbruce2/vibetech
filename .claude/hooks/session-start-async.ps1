#!/usr/bin/env powershell
# Session Start Hook - OPTIMIZED ASYNC VERSION (Phase 3)
# Target: <100ms for instant display, background loading for full context

param(
    [string]$SessionId = "",
    [switch]$Silent = $false
)

$ErrorActionPreference = "SilentlyContinue"
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$CacheFile = "$env:TEMP\claude_session_cache.json"

# INSTANT DISPLAY (<50ms) - Show cached data immediately
function Show-CachedContext {
    if (-not $Silent) {
        Write-Host ""
        Write-Host "================================================================================" -ForegroundColor Cyan
        Write-Host "  CLAUDE CODE - SESSION STARTING" -ForegroundColor Cyan
        Write-Host "================================================================================" -ForegroundColor Cyan
        Write-Host ""
    }

    # Quick git context (< 20ms)
    $branch = git branch --show-current 2>$null
    $modified = (git status --porcelain 2>$null | Measure-Object).Count
    $project = Split-Path -Leaf (Get-Location)

    if (-not $Silent) {
        Write-Host "QUICK CONTEXT" -ForegroundColor Green
        Write-Host "-------------" -ForegroundColor Green
        Write-Host "  Project: $project" -ForegroundColor White
        Write-Host "  Branch: $branch" -ForegroundColor White
        Write-Host "  Modified: $modified files" -ForegroundColor White
        Write-Host ""
    }

    # Load cached context if available
    if (Test-Path $CacheFile) {
        try {
            $cached = Get-Content $CacheFile -Raw | ConvertFrom-Json
            $age = [math]::Round(((Get-Date) - [datetime]$cached.timestamp).TotalMinutes, 1)

            if ($age -lt 60 -and -not $Silent) {
                Write-Host "CACHED CONTEXT (${age}m ago)" -ForegroundColor DarkGray
                Write-Host "-------------------------------" -ForegroundColor DarkGray
                if ($cached.last_session) {
                    Write-Host "  Last Task: $($cached.last_session.last_prompt)" -ForegroundColor DarkGray
                }
                if ($cached.specialist_agent) {
                    Write-Host "  Specialist: @$($cached.specialist_agent.name)" -ForegroundColor DarkGray
                }
                Write-Host ""
            }
        } catch {
            # Ignore cache errors
        }
    }

    if (-not $Silent) {
        Write-Host "Loading full context in background..." -ForegroundColor DarkCyan
        Write-Host "================================================================================" -ForegroundColor Cyan
        Write-Host ""
    }
}

# BACKGROUND LOADING - Non-blocking full context load
function Start-BackgroundContextLoad {
    param([string]$sid)

    $job = Start-Job -ScriptBlock {
        param($SessionId, $MemoryPath, $CacheFile, $WorkingDir)

        $ErrorActionPreference = "SilentlyContinue"
        Set-Location $WorkingDir

        # Full context gathering
        $context = @{
            timestamp = Get-Date -Format "o"
            session_id = $SessionId
        }

        # Git context (detailed)
        $context.branch = git branch --show-current 2>$null
        $statusLines = git status --porcelain 2>$null
        if ($statusLines) {
            $context.modified_files = $statusLines | Select-Object -First 5
            $context.modified_count = ($statusLines | Measure-Object).Count
        }
        $context.recent_commits = git log --oneline -3 2>$null

        # Project detection
        $workingDir = Get-Location
        $firstModified = if ($context.modified_files) { $context.modified_files[0] } else { $workingDir.Path }
        $normalizedPath = $firstModified -replace '\\', '/'

        $project = 'workspace'
        if ($normalizedPath -match 'projects/active/(?:web-apps|desktop-apps)/([^/]+)') {
            $project = $matches[1]
        } elseif ($normalizedPath -match 'projects/(?!active)([^/]+)') {
            $project = $matches[1]
        }
        $context.project = $project

        # Specialist agent lookup
        $agentsConfigPath = "C:\dev\.claude\agents.json"
        if (Test-Path $agentsConfigPath) {
            try {
                $agentsConfig = Get-Content $agentsConfigPath -Raw | ConvertFrom-Json
                $agentName = $agentsConfig.project_agents.$project
                if ($agentName) {
                    $context.specialist_agent = @{
                        name = $agentName
                        display_name = $agentsConfig.agent_definitions.$agentName.display_name
                        primary_directive = $agentsConfig.agent_definitions.$agentName.primary_directive
                    }
                }
            } catch {}
        }

        # Last session context (if memory system available)
        if (Test-Path "$MemoryPath\memory_cli.js") {
            try {
                $originalLoc = Get-Location
                Set-Location $MemoryPath
                $result = node memory_cli.js retrieve "last-session" "session_state" 2>&1 | Out-String
                Set-Location $originalLoc

                if ($result -like "*Data retrieved from*") {
                    $jsonMatch = [regex]::Match($result, '\{.*?\}', [System.Text.RegularExpressions.RegexOptions]::Singleline)
                    if ($jsonMatch.Success) {
                        $context.last_session = $jsonMatch.Value | ConvertFrom-Json
                    }
                }
            } catch {}
        }

        # Task history
        $taskFile = "$MemoryPath\quick-access\recent-tasks.json"
        if (Test-Path $taskFile) {
            try {
                $taskData = Get-Content $taskFile -Raw | ConvertFrom-Json
                $context.recent_tasks = $taskData.tasks | Where-Object {
                    $_.project -eq $project -or $_.project -eq 'workspace'
                } | Select-Object -First 3
            } catch {}
        }

        # Save to cache
        $context | ConvertTo-Json -Depth 10 | Out-File -FilePath $CacheFile -Encoding UTF8

        return $context

    } -ArgumentList $sid, $MemoryPath, $CacheFile, (Get-Location).Path

    return $job
}

# MAIN EXECUTION
try {
    $startTime = Get-Date

    # Generate session ID
    if (-not $SessionId) {
        $SessionId = "session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }
    $env:CLAUDE_SESSION_ID = $SessionId

    # STEP 1: Instant display (<50ms)
    Show-CachedContext

    $displayTime = [math]::Round(((Get-Date) - $startTime).TotalMilliseconds, 0)

    # STEP 2: Launch background job (non-blocking)
    $job = Start-BackgroundContextLoad -sid $SessionId

    # STEP 3: Wait up to 2 seconds for job completion (optional)
    $completed = Wait-Job $job -Timeout 2

    if ($completed) {
        $result = Receive-Job $job

        # Display full context if job completed quickly
        if ($result -and -not $Silent) {
            Write-Host ""
            Write-Host "FULL CONTEXT LOADED" -ForegroundColor Green
            Write-Host "-------------------" -ForegroundColor Green

            if ($result.specialist_agent) {
                Write-Host "  Specialist: @$($result.specialist_agent.name) ($($result.specialist_agent.display_name))" -ForegroundColor Yellow
                Write-Host "  Directive: $($result.specialist_agent.primary_directive)" -ForegroundColor DarkYellow
            }

            if ($result.recent_tasks -and $result.recent_tasks.Count -gt 0) {
                Write-Host ""
                Write-Host "  Recent Tasks:" -ForegroundColor Cyan
                foreach ($task in $result.recent_tasks) {
                    $icon = if ($task.status -eq "in_progress") { "[!]" } else { "[X]" }
                    Write-Host "    $icon $($task.prompt)" -ForegroundColor Gray
                }
            }

            Write-Host ""
        }

        Remove-Job $job -Force
    } else {
        # Job still running - let it finish in background
        if (-not $Silent) {
            Write-Host "Full context still loading... (will be cached for next session)" -ForegroundColor DarkGray
        }
    }

    $totalTime = [math]::Round(((Get-Date) - $startTime).TotalMilliseconds, 0)

    if (-not $Silent) {
        Write-Host "Session ready! (Display: ${displayTime}ms, Total: ${totalTime}ms)" -ForegroundColor DarkGreen
        Write-Host ""
    }

} catch {
    if (-not $Silent) {
        Write-Host "Session start completed with warnings" -ForegroundColor Yellow
    }
}
