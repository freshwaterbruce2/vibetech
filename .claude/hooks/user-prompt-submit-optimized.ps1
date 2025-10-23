#!/usr/bin/env powershell
# User Prompt Submit Hook - OPTIMIZED WITH SMART TRIGGERING (Phase 3)
# Target: <20ms for simple prompts, <200ms for complex tasks

param(
    [string]$UserPrompt = "",
    [int]$PromptNumber = 0,
    [switch]$Silent = $true
)

$ErrorActionPreference = "SilentlyContinue"
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$CounterFile = "$env:TEMP\claude_prompt_counter.txt"
$TaskHistoryFile = "$MemoryPath\quick-access\recent-tasks.json"

# QUICK CLASSIFICATION (<5ms)
function Get-PromptType {
    param([string]$prompt)

    $lower = $prompt.ToLower().Trim()
    $length = $prompt.Length

    # Simple question patterns
    if ($lower -match '^\s*(what|how|why|when|where|which|who|explain|show|list|tell me)\b') {
        return @{ type = 'question'; complexity = 1 }
    }

    # Completion/acknowledgment patterns
    if ($lower -match '\b(thanks|thank you|good|great|perfect|ok|okay|done|finished|complete)\s*$' -and $length -lt 50) {
        return @{ type = 'completion'; complexity = 0 }
    }

    # Task indicators
    $taskWords = @('implement', 'create', 'build', 'develop', 'write', 'add', 'modify', 'update', 'fix', 'debug', 'refactor')
    $hasTaskWord = $false
    foreach ($word in $taskWords) {
        if ($lower -match "\b$word\b") {
            $hasTaskWord = $true
            break
        }
    }

    # Error/debugging indicators
    $isError = $lower -match '\b(error|exception|fail|broken|bug|issue|problem)\b'

    # Calculate complexity
    $complexity = 1
    if ($hasTaskWord) { $complexity += 2 }
    if ($isError) { $complexity += 2 }
    if ($length -gt 100) { $complexity += 1 }
    if ($length -gt 300) { $complexity += 1 }

    $type = 'task'
    if ($hasTaskWord) { $type = 'development' }
    if ($isError) { $type = 'debugging' }

    return @{
        type = $type
        complexity = $complexity
        is_task = $hasTaskWord -or $complexity -ge 3
        is_error = $isError
    }
}

# MINIMAL PROCESSING (<20ms)
function Process-SimplePrompt {
    param([int]$counter)

    # Just increment counter
    Set-Content $CounterFile $counter
}

# FULL PROCESSING (<200ms)
function Process-ComplexTask {
    param($prompt, $analysis, $counter, $timestamp)

    # Update counter
    Set-Content $CounterFile $counter

    # Get system context
    $context = @{
        timestamp = $timestamp
        branch = git branch --show-current 2>$null
        working_dir = (Get-Location).Path
    }

    # Detect project
    $statusLines = git status --porcelain 2>$null
    $firstFile = if ($statusLines) { ($statusLines | Select-Object -First 1) -replace '^\s*\S+\s+', '' } else { $context.working_dir }
    $normalizedPath = $firstFile -replace '\\', '/'

    $project = 'workspace'
    if ($normalizedPath -match 'projects/active/(?:web-apps|desktop-apps)/([^/]+)') {
        $project = $matches[1]
    } elseif ($normalizedPath -match 'projects/(?!active)([^/]+)') {
        $project = $matches[1]
    }

    # Update task history
    if ($analysis.is_task) {
        try {
            $tasks = @()
            if (Test-Path $TaskHistoryFile) {
                $taskData = Get-Content $TaskHistoryFile -Raw | ConvertFrom-Json
                $tasks = $taskData.tasks
            }

            # Add new task
            $newTask = @{
                prompt = if ($prompt.Length -gt 100) { $prompt.Substring(0, 97) + "..." } else { $prompt }
                timestamp = $timestamp
                category = $analysis.type
                complexity = $analysis.complexity
                status = "in_progress"
                project = $project
            }

            $tasks = @($newTask) + $tasks
            if ($tasks.Count -gt 5) {
                $tasks = $tasks[0..4]
            }

            # Save
            $taskData = @{
                tasks = $tasks
                max_tasks = 5
                last_updated = $timestamp
            }
            $taskData | ConvertTo-Json -Depth 10 | Out-File -FilePath $TaskHistoryFile -Encoding UTF8
        } catch {
            # Silent failure
        }
    }

    # Agent orchestrator (only for high-complexity tasks)
    if ($analysis.complexity -ge 4 -and -not $Silent) {
        $orchestratorPath = "$MemoryPath\agent_orchestrator.py"
        if (Test-Path $orchestratorPath) {
            try {
                $recommendation = python $orchestratorPath $prompt $project 2>$null | ConvertFrom-Json
                if ($recommendation -and $recommendation.confidence -ge 3.0) {
                    Write-Host ""
                    Write-Host "SPECIALIST RECOMMENDED: @$($recommendation.agent)" -ForegroundColor Yellow
                    Write-Host "Confidence: $([math]::Round($recommendation.confidence, 2)) | $($recommendation.task_type)" -ForegroundColor Gray
                    Write-Host ""
                }
            } catch {
                # Silent failure
            }
        }
    }

    # Context saving (every 3rd complex prompt)
    if ($counter % 3 -eq 0) {
        try {
            $sessionData = @{
                timestamp = $timestamp
                branch = $context.branch
                working_dir = $context.working_dir
                last_prompt = if ($prompt.Length -gt 200) { $prompt.Substring(0, 197) + "..." } else { $prompt }
                intent_category = $analysis.type
                complexity_score = $analysis.complexity
                prompt_counter = $counter
            }

            $tempScript = "$env:TEMP\claude_store_$counter.js"
            $dataJson = ($sessionData | ConvertTo-Json -Depth 10 -Compress) -replace '"', '\"'
            $nodeScript = @"
const MemoryManager = require('$($MemoryPath.Replace('\', '\\'))\\memory_manager.js');
async function store() {
    const manager = new MemoryManager();
    const data = $dataJson;
    await manager.storeData('last-session', data, {type:'session_state'});
}
store().catch(()=>{});
"@
            $nodeScript | Out-File -FilePath $tempScript -Encoding ASCII

            $originalLoc = Get-Location
            Set-Location $MemoryPath
            node $tempScript 2>&1 | Out-Null
            Set-Location $originalLoc
            Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
        } catch {
            # Silent failure
        }
    }
}

# MAIN EXECUTION
try {
    $startTime = Get-Date

    # Get and increment counter
    $counter = 0
    if (Test-Path $CounterFile) {
        try { $counter = [int](Get-Content $CounterFile) } catch { $counter = 0 }
    }
    $counter++

    # STEP 1: Quick classification (< 5ms)
    $analysis = Get-PromptType -prompt $UserPrompt

    # STEP 2: Route based on complexity
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    if ($analysis.complexity -le 1) {
        # Simple prompt - minimal processing (<20ms)
        Process-SimplePrompt -counter $counter
    } else {
        # Complex task - full processing (<200ms)
        Process-ComplexTask -prompt $UserPrompt -analysis $analysis -counter $counter -timestamp $timestamp
    }

    $duration = [math]::Round(((Get-Date) - $startTime).TotalMilliseconds, 0)

    # Performance logging (optional)
    if ($env:CLAUDE_HOOK_PERF_LOGGING -eq '1') {
        $perfLog = @{
            hook = 'user-prompt-submit'
            duration_ms = $duration
            complexity = $analysis.complexity
            type = $analysis.type
            timestamp = Get-Date -Format "o"
        }
        $perfLog | ConvertTo-Json -Compress >> "$env:TEMP\claude_hook_perf.jsonl"
    }

} catch {
    # Silent failure - never interrupt workflow
}
