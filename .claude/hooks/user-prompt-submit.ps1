#!/usr/bin/env powershell
# User Prompt Submit Hook - Phase 1.5 Enhanced Context Saving
# Reliable Node.js + PowerShell foundation with performance metrics

param(
    [string]$UserPrompt = "",
    [int]$PromptNumber = 0,
    [switch]$Silent = $true  # Run silently by default
)

$ErrorActionPreference = "SilentlyContinue"

# Configuration
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$CounterFile = "$env:TEMP\claude_prompt_counter.txt"
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

function Get-PromptCounter {
    if (Test-Path $CounterFile) {
        try {
            return [int](Get-Content $CounterFile)
        } catch {
            return 0
        }
    }
    return 0
}

function Set-PromptCounter {
    param([int]$Count)
    Set-Content $CounterFile $Count
}

function Get-EnhancedSystemContext {
    $Context = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        branch = "unknown"
        working_dir = (Get-Location).Path
        modified_files = @()
        modified_count = 0
        session_id = $env:CLAUDE_SESSION_ID
        git_status_summary = @()
        recent_commits = @()
    }

    try {
        # Branch (lightweight operation)
        $Context.branch = git branch --show-current 2>$null

        # OPTIMIZED: Limit git status to first 10 lines only
        $StatusLines = git status --porcelain 2>$null | Select-Object -First 10
        if ($StatusLines) {
            $Context.modified_files = ($StatusLines | ForEach-Object { $_.Substring(3) } | Select-Object -First 5)
            # Get full count efficiently
            $FullCount = (git status --porcelain 2>$null | Measure-Object).Count
            $Context.modified_count = $FullCount
            # Store first 5 lines of git status for context
            $Context.git_status_summary = $StatusLines | Select-Object -First 5
        }

        # OPTIMIZED: Skip commits to save tokens (not critical for context)
        # $Commits = git log --oneline -3 2>$null
        # if ($Commits) {
        #     $Context.recent_commits = $Commits
        # }

    } catch {
        # Silently continue if git fails
    }

    return $Context
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

function Save-RecentTasks {
    param([array]$Tasks)

    try {
        $TaskData = @{
            tasks = $Tasks
            max_tasks = 5
            last_updated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }

        $TaskData | ConvertTo-Json -Depth 10 | Out-File -FilePath $TaskHistoryFile -Encoding UTF8
        return $true
    } catch {
        return $false
    }
}

function Update-TaskHistory {
    param($Prompt, $Analysis, $Timestamp, $Project)

    $Tasks = Get-RecentTasks

    # If this is a completion signal, mark recent tasks as completed
    if ($Analysis.is_completion) {
        $UpdatedTasks = @()
        foreach ($task in $Tasks) {
            $UpdatedTask = @{
                prompt = $task.prompt
                timestamp = $task.timestamp
                category = $task.category
                complexity = $task.complexity
                status = if ($task.status -eq "in_progress") { "completed" } else { $task.status }
                project = $task.project
            }
            if ($task.status -eq "in_progress") {
                $UpdatedTask.completed_at = $Timestamp
            } elseif ($task.completed_at) {
                $UpdatedTask.completed_at = $task.completed_at
            }
            $UpdatedTasks += $UpdatedTask
        }
        Save-RecentTasks -Tasks $UpdatedTasks
        return $UpdatedTasks
    }

    # If this is a task, add it to history
    if ($Analysis.is_task -or $Analysis.complexity -ge 3) {
        $NewTask = @{
            prompt = if ($Prompt.Length -gt 100) { $Prompt.Substring(0, 97) + "..." } else { $Prompt }
            timestamp = $Timestamp
            category = $Analysis.category
            complexity = $Analysis.complexity
            status = "in_progress"
            project = $Project
        }

        # Add to beginning of list
        $Tasks = @($NewTask) + $Tasks

        # Keep only last 5 tasks
        if ($Tasks.Count -gt 5) {
            $Tasks = $Tasks[0..4]
        }

        Save-RecentTasks -Tasks $Tasks
    }

    return $Tasks
}

function Analyze-Prompt {
    param([string]$Prompt)

    $Analysis = @{
        is_task = $false
        is_question = $false
        is_completion = $false
        is_error = $false
        complexity = 0
        category = "conversation"
    }

    $Lower = $Prompt.ToLower()

    # Task indicators
    $TaskWords = @('implement', 'create', 'build', 'develop', 'write', 'add', 'modify', 'update', 'fix', 'debug')
    foreach ($word in $TaskWords) {
        if ($Lower -match "\b$word\b") {
            $Analysis.is_task = $true
            $Analysis.complexity += 2
            $Analysis.category = "development"
        }
    }

    # Question indicators
    if ($Lower -match "\b(what|how|why|when|where|which|who|\?)\b") {
        $Analysis.is_question = $true
        $Analysis.complexity += 1
        $Analysis.category = "inquiry"
    }

    # Completion indicators
    if ($Lower -match "\b(done|finished|complete|thanks|thank you|good|perfect)\b") {
        $Analysis.is_completion = $true
        $Analysis.category = "completion"
    }

    # Error indicators
    if ($Lower -match "\b(error|exception|fail|broken|bug|issue|problem)\b") {
        $Analysis.is_error = $true
        $Analysis.complexity += 3
        $Analysis.category = "debugging"
    }

    return $Analysis
}

function Should-SaveContext {
    param($Counter, $Analysis)

    # Save every 3rd prompt
    if ($Counter % 3 -eq 0) { return $true }

    # Save on completion signals
    if ($Analysis.is_completion) { return $true }

    # Save on errors
    if ($Analysis.is_error) { return $true }

    # Save complex tasks
    if ($Analysis.complexity -ge 4) { return $true }

    return $false
}

function Get-AgentRecommendation {
    param([string]$TaskDescription, [string]$ProjectContext)

    $OrchestratorPath = "C:\dev\projects\active\web-apps\memory-bank\agent_orchestrator.py"

    if (-not (Test-Path $OrchestratorPath)) {
        return $null
    }

    try {
        $result = python $OrchestratorPath $TaskDescription $ProjectContext 2>$null
        if ($result) {
            return $result | ConvertFrom-Json
        }
    } catch {
        return $null
    }

    return $null
}

function Invoke-SpecialistAgent {
    param($Recommendation, [string]$Prompt)

    if (-not $Recommendation -or -not $Recommendation.recommended) {
        return
    }

    # Display recommendation
    Write-Host ""
    Write-Host "SPECIALIST AGENT RECOMMENDATION" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "  Agent: $($Recommendation.display_name)" -ForegroundColor Yellow
    Write-Host "  Confidence: $([math]::Round($Recommendation.confidence, 2))" -ForegroundColor White
    Write-Host "  Task Type: $($Recommendation.task_type)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Inherited From:" -ForegroundColor Yellow
    foreach ($agent in $Recommendation.inherited_from) {
        Write-Host "    - $agent" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "  Reasons:" -ForegroundColor Yellow
    foreach ($reason in $Recommendation.reasons) {
        Write-Host "    - $reason" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "  Performance Targets:" -ForegroundColor Yellow
    if ($Recommendation.performance_targets) {
        $successRate = [math]::Round($Recommendation.performance_targets.target_success_rate * 100, 2)
        $execTime = [math]::Round($Recommendation.performance_targets.target_execution_time, 2)
        Write-Host "    Success Rate: ${successRate}%" -ForegroundColor White
        Write-Host "    Execution Time: ${execTime}s" -ForegroundColor White
    }

    # Auto-invoke if confidence is high enough
    if ($Recommendation.confidence -ge 3.0) {
        Write-Host ""
        Write-Host "AUTO-INVOKING SPECIALIST (confidence >= 3.0)" -ForegroundColor Green
        Write-Host ""

        # Output the agent invocation marker for Claude Code to recognize
        Write-Output ""
        Write-Output "Specialist agent recommended: @$($Recommendation.agent)"
        Write-Output "This agent has proven expertise with this type of task."
        Write-Output ""
    }
}

function Save-EnhancedContext {
    param($Prompt, $Analysis, $SystemContext, $Counter, $Phase)

    # Start performance timer
    $StartTime = Get-Date

    try {
        $OriginalLocation = Get-Location
        Set-Location $MemoryPath

        # Create enhanced last-session data
        $LastSessionData = @{
            timestamp = $SystemContext.timestamp
            branch = $SystemContext.branch
            working_dir = $SystemContext.working_dir
            modified_files = $SystemContext.modified_files
            modified_count = $SystemContext.modified_count
            git_status_summary = $SystemContext.git_status_summary
            recent_commits = $SystemContext.recent_commits
            last_prompt = if ($Prompt.Length -gt 200) {
                $Prompt.Substring(0, 197) + "..."
            } else {
                $Prompt
            }
            intent_category = $Analysis.category
            complexity_score = $Analysis.complexity
            prompt_counter = $Counter
            session_id = $SystemContext.session_id
            phase = $Phase
        }

        $Metadata = @{
            type = "session_state"
            phase = $Phase
            complexity = $Analysis.complexity
        }

        # Create JSON strings
        $DataJson = ($LastSessionData | ConvertTo-Json -Depth 10 -Compress)
        $MetaJson = ($Metadata | ConvertTo-Json -Compress)

        # Write Node.js script for storage (avoids PowerShell string escaping)
        $TempScriptFile = Join-Path $env:TEMP "claude_store_$Counter.js"
        $NodeScript = @"
const fs = require('fs');
const MemoryManager = require('$($MemoryPath.Replace('\', '\\'))\\memory_manager.js');

async function store() {
    const manager = new MemoryManager();
    const data = $DataJson;
    const metadata = $MetaJson;
    const result = await manager.storeData('last-session', data, metadata);
    if (result.success) {
        console.log('SUCCESS');
    } else {
        console.log('ERROR: ' + result.error);
    }
}

store().catch(err => console.log('ERROR: ' + err.message));
"@

        $NodeScript | Out-File -FilePath $TempScriptFile -Encoding ASCII

        # Execute the script
        $OriginalLocation2 = Get-Location
        Set-Location $MemoryPath
        $SaveResult = node $TempScriptFile 2>&1
        Set-Location $OriginalLocation2

        # Cleanup
        Remove-Item $TempScriptFile -Force -ErrorAction SilentlyContinue
        Set-Location $OriginalLocation

        # Calculate performance metrics
        $EndTime = Get-Date
        $DurationMs = [math]::Round(($EndTime - $StartTime).TotalMilliseconds, 1)

        # Display result with performance metrics
        if (-not $Silent) {
            if ($SaveResult -like "*SUCCESS*") {
                Write-Host "Context saved successfully (${DurationMs}ms)" -ForegroundColor DarkGreen
            } else {
                Write-Host "Context save result: $SaveResult (${DurationMs}ms)" -ForegroundColor Yellow
            }
        }

        return $true

    } catch {
        # Calculate duration even on failure
        $EndTime = Get-Date
        $DurationMs = [math]::Round(($EndTime - $StartTime).TotalMilliseconds, 1)

        if (-not $Silent) {
            Write-Host "Context save failed (${DurationMs}ms)" -ForegroundColor Red
        }
        return $false
    }
}

# Main execution
try {
    # Get memory system phase
    $Phase = Get-MemorySystemPhase

    # Get and update counter
    $Counter = Get-PromptCounter
    $Counter++
    Set-PromptCounter $Counter

    if (-not $PromptNumber) { $PromptNumber = $Counter }

    # Analyze the prompt
    $PromptAnalysis = Analyze-Prompt -Prompt $UserPrompt

    # Get enhanced system context
    $SystemContext = Get-EnhancedSystemContext

    # Detect current project from first modified file or working directory
    $CurrentProject = 'workspace'
    if ($SystemContext.modified_files -and $SystemContext.modified_files.Count -gt 0) {
        # Use first modified file to determine project
        $CurrentProject = Get-ProjectContext -FilePath $SystemContext.modified_files[0]
    } else {
        # Fallback to working directory
        $CurrentProject = Get-ProjectContext -FilePath $SystemContext.working_dir
    }

    # Update task history (runs every time to keep task state current)
    $RecentTasks = Update-TaskHistory -Prompt $UserPrompt -Analysis $PromptAnalysis -Timestamp $SystemContext.timestamp -Project $CurrentProject

    # OPTIMIZED: Only get agent recommendation for very complex tasks (complexity >= 5)
    # This reduces Python orchestrator calls significantly
    if ($PromptAnalysis.complexity -ge 5 -or ($PromptAnalysis.is_error -and $PromptAnalysis.complexity -ge 4)) {
        $AgentRecommendation = Get-AgentRecommendation -TaskDescription $UserPrompt -ProjectContext $CurrentProject
        if ($AgentRecommendation) {
            Invoke-SpecialistAgent -Recommendation $AgentRecommendation -Prompt $UserPrompt
        }
    }

    # Decide whether to save
    $ShouldSave = Should-SaveContext -Counter $Counter -Analysis $PromptAnalysis

    if ($ShouldSave) {
        Save-EnhancedContext -Prompt $UserPrompt -Analysis $PromptAnalysis -SystemContext $SystemContext -Counter $Counter -Phase $Phase
    }

} catch {
    # Silently fail - don't interrupt user workflow
}
