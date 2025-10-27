#!/usr/bin/env powershell
# Session Start Hook - Phase 1.5 Enhanced Context Loading
# Reliable Node.js + PowerShell foundation with rich features

param(
    [string]$SessionId = "",
    [switch]$Silent = $false
)

$ErrorActionPreference = "SilentlyContinue"
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$TaskHistoryFile = "$MemoryPath\quick-access\recent-tasks.json"

function Get-MemorySystemPhase {
    try {
        $ConfigPath = Join-Path $MemoryPath "memory_config.json"
        if (Test-Path $ConfigPath) {
            $Config = Get-Content $ConfigPath | ConvertFrom-Json
            return $Config.memorySystem.phase
        }
    } catch {}
    return "1.0"
}

function Get-LastSessionContext {
    try {
        $OriginalLocation = Get-Location
        Set-Location $MemoryPath

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

function Get-EnhancedGitContext {
    $GitContext = @{
        branch = "unknown"
        modified_files = 0
        working_dir = (Get-Location).Path
        status_summary = @()
        recent_commits = @()
    }

    try {
        # Branch name
        $GitContext.branch = git branch --show-current 2>$null

        # OPTIMIZED: Modified files count only (skip full status)
        $Count = (git status --porcelain 2>$null | Measure-Object).Count
        $GitContext.modified_files = $Count

        # OPTIMIZED: Only show first 3 status lines if count is reasonable
        if ($Count -le 50) {
            $GitContext.status_summary = git status --porcelain 2>$null | Select-Object -First 3
        }

        # OPTIMIZED: Skip commits to save tokens (not critical for session start)
        # $Commits = git log --oneline -3 2>$null
        # if ($Commits) {
        #     $GitContext.recent_commits = $Commits
        # }

    } catch {
        # Keep defaults if git fails
    }

    return $GitContext
}

function Get-RecentTasks {
    try {
        if (Test-Path $TaskHistoryFile) {
            $Content = Get-Content $TaskHistoryFile -Raw | ConvertFrom-Json
            return $Content.tasks
        }
    } catch {
        # Return empty if file doesn't exist or is invalid
    }
    return @()
}

function Get-ProjectContext {
    param([string]$FilePath)

    # Normalize path separators to forward slashes
    $NormalizedPath = $FilePath -replace '\\', '/'

    # Check most specific git status patterns first
    if ($NormalizedPath -match '^projects/([^/]+)/') {
        return $matches[1]
    }

    if ($NormalizedPath -match '^apps/([^/]+)/') {
        return $matches[1]
    }

    # Handle nested project structure BEFORE general patterns
    # projects/active/web-apps/project-name or projects/active/desktop-apps/project-name
    if ($NormalizedPath -match 'projects/active/(?:web-apps|desktop-apps)/([^/]+)') {
        return $matches[1]
    }

    # Handle direct project structure: projects/project-name (but not projects/active)
    if ($NormalizedPath -match 'projects/(?!active)([^/]+)(?:/|$)') {
        return $matches[1]
    }

    # Handle apps structure: apps/project-name
    if ($NormalizedPath -match 'apps/([^/]+)(?:/|$)') {
        return $matches[1]
    }

    # Handle active-projects structure: active-projects/project-name
    if ($NormalizedPath -match 'active-projects/([^/]+)') {
        return $matches[1]
    }

    # Fallback: check for common project patterns in path
    if ($NormalizedPath -match 'crypto-enhanced') {
        return 'crypto-enhanced'
    }
    if ($NormalizedPath -match 'digital-content-builder') {
        return 'digital-content-builder'
    }
    if ($NormalizedPath -match 'business-booking-platform') {
        return 'business-booking-platform'
    }
    if ($NormalizedPath -match 'Vibe-Tutor') {
        return 'Vibe-Tutor'
    }
    if ($NormalizedPath -match 'memory-bank') {
        return 'memory-bank'
    }

    # Default: workspace (root-level files)
    return 'workspace'
}

function Filter-TasksByProject {
    param([array]$Tasks, [string]$CurrentProject)

    if (-not $Tasks -or $Tasks.Count -eq 0) {
        return @()
    }

    # Filter: show tasks from current project OR workspace tasks
    $Filtered = @($Tasks | Where-Object {
        $_.project -eq $CurrentProject -or $_.project -eq 'workspace'
    })

    return $Filtered
}

function Get-SpecialistAgent {
    param([string]$ProjectName)

    $AgentsConfigPath = Join-Path $PSScriptRoot "..\agents.json"

    if (-not (Test-Path $AgentsConfigPath)) {
        return $null
    }

    try {
        $AgentsConfig = Get-Content $AgentsConfigPath -Raw | ConvertFrom-Json

        # Look up agent for this project
        $AgentName = $AgentsConfig.project_agents.$ProjectName

        if ($AgentName) {
            $AgentDef = $AgentsConfig.agent_definitions.$AgentName
            if ($AgentDef) {
                return @{
                    name = $AgentName
                    display_name = $AgentDef.display_name
                    description = $AgentDef.description
                    expertise = $AgentDef.expertise
                    primary_directive = $AgentDef.primary_directive
                }
            }
        }

        return $null
    } catch {
        return $null
    }
}

function Display-EnhancedWelcome {
    param($LastSession, $GitContext, $Phase, $RecentTasks, $CurrentProject, $SpecialistAgent)

    if ($Silent) { return }

    Write-Host ""
    Write-Host "CLAUDE CODE - Phase $Phase" -ForegroundColor Cyan

    # Display current project context (OPTIMIZED: Simplified banner)
    $ProjectDisplay = if ($CurrentProject -eq 'workspace') {
        "Workspace (Root)"
    } else {
        $CurrentProject
    }

    # Display context with optional specialist agent
    if ($SpecialistAgent) {
        Write-Host "Project: $ProjectDisplay | Agent: @$($SpecialistAgent.name)" -ForegroundColor Yellow
    } else {
        Write-Host "Project: $ProjectDisplay" -ForegroundColor Yellow
    }
    Write-Host ""

    # OPTIMIZED: Simplified current context (removed verbose git details)
    Write-Host "Branch: $($GitContext.branch) | Modified: $($GitContext.modified_files) files" -ForegroundColor White

    # OPTIMIZED: Only show git status if file count is small
    if ($GitContext.status_summary.Count -gt 0) {
        Write-Host "Recent changes: $(($GitContext.status_summary | Select-Object -First 2) -join ', ')" -ForegroundColor Gray
    }

    # OPTIMIZED: Simplified last session (removed verbose details)
    if ($LastSession -and $LastSession.last_prompt) {
        Write-Host ""
        $Preview = if ($LastSession.last_prompt.Length -gt 60) {
            $LastSession.last_prompt.Substring(0, 57) + "..."
        } else {
            $LastSession.last_prompt
        }
        Write-Host "Last: $Preview" -ForegroundColor Magenta
    }

    # OPTIMIZED: Simplified recent tasks (only show in-progress)
    if ($RecentTasks -and $RecentTasks.Count -gt 0) {
        $FilteredTasks = Filter-TasksByProject -Tasks $RecentTasks -CurrentProject $CurrentProject
        $InProgressTasks = @($FilteredTasks | Where-Object { $_.status -eq "in_progress" })

        if ($InProgressTasks.Count -gt 0) {
            Write-Host ""
            Write-Host "In Progress:" -ForegroundColor Yellow
            foreach ($task in ($InProgressTasks | Select-Object -First 2)) {
                Write-Host "  - $($task.prompt)" -ForegroundColor White
            }
        }
    }

    Write-Host ""
    Write-Host "Memory System Active | Optimized for performance" -ForegroundColor Green
    Write-Host ""
}

# Main execution
try {
    # Get memory system phase
    $Phase = Get-MemorySystemPhase

    # Generate session ID if not provided
    if (-not $SessionId) {
        $SessionId = "session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }

    # Set session ID for other hooks to use
    $env:CLAUDE_SESSION_ID = $SessionId

    # Get enhanced contexts
    $LastSession = Get-LastSessionContext
    $GitContext = Get-EnhancedGitContext
    $RecentTasks = Get-RecentTasks

    # Detect current project from working directory
    $CurrentProject = Get-ProjectContext -FilePath $GitContext.working_dir

    # Get specialist agent for current project
    $SpecialistAgent = Get-SpecialistAgent -ProjectName $CurrentProject

    # Display enhanced welcome message
    Display-EnhancedWelcome -LastSession $LastSession -GitContext $GitContext -Phase $Phase -RecentTasks $RecentTasks -CurrentProject $CurrentProject -SpecialistAgent $SpecialistAgent

    # Save session start info for tracking
    try {
        $SessionStart = @{
            session_id = $SessionId
            start_time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            branch = $GitContext.branch
            working_dir = $GitContext.working_dir
            modified_files = $GitContext.modified_files
            phase = $Phase
        } | ConvertTo-Json -Compress

        $OriginalLocation = Get-Location
        Set-Location $MemoryPath

        $Metadata = @{type="session_start"; phase=$Phase} | ConvertTo-Json -Compress
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
