#!/usr/bin/env powershell
# Enhanced User Prompt Submit Hook - Context-Aware Memory Capture
# Intelligently captures and stores context with learning integration

param(
    [string]$UserPrompt = "",
    [int]$PromptNumber = 0,
    [switch]$VerboseLogging = $false
)

# Configuration
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$LogPath = "$MemoryPath\logs"
$CounterFile = "$env:TEMP\claude_enhanced_prompt_counter.txt"

if (-not (Test-Path $LogPath)) { New-Item -ItemType Directory -Path $LogPath -Force | Out-Null }
$LogFile = Join-Path $LogPath "prompt-submit-$(Get-Date -Format 'yyyy-MM-dd').log"

function Write-EnhancedLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $LogEntry = "[$Timestamp] [$Level] [PROMPT-$PromptNumber] $Message"

    if ($VerboseLogging -or $Level -in @("ERROR", "WARN")) {
        switch ($Level) {
            "ERROR" { Write-Host $LogEntry -ForegroundColor Red }
            "WARN"  { Write-Host $LogEntry -ForegroundColor Yellow }
            "INFO"  { Write-Host $LogEntry -ForegroundColor DarkGreen }
            "DEBUG" { Write-Host $LogEntry -ForegroundColor DarkGray }
        }
    }

    Add-Content -Path $LogFile -Value $LogEntry
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

function Analyze-PromptContext {
    param([string]$Prompt)

    # Enhanced prompt analysis using 2025 best practices
    $Analysis = @{
        'is_task_request' = $false
        'is_question' = $false
        'is_command' = $false
        'is_code_related' = $false
        'is_error_related' = $false
        'is_completion_signal' = $false
        'is_agent_request' = $false
        'complexity_score' = 0
        'keywords' = @()
        'intent_category' = 'unknown'
        'tools_mentioned' = @()
        'files_mentioned' = @()
        'agents_mentioned' = @()
        'priority_level' = 'normal'
        'agent_context' = @{}
    }

    # Task detection patterns
    $TaskPatterns = @(
        'implement', 'create', 'build', 'develop', 'write', 'add', 'modify',
        'update', 'fix', 'debug', 'optimize', 'refactor', 'test', 'deploy'
    )

    # Question patterns
    $QuestionPatterns = @('what', 'how', 'why', 'when', 'where', 'which', 'who', '?')

    # Command patterns
    $CommandPatterns = @('run', 'execute', 'start', 'stop', 'install', 'remove', 'delete')

    # Error patterns
    $ErrorPatterns = @('error', 'exception', 'fail', 'broken', 'bug', 'issue', 'problem')

    # Completion signals
    $CompletionPatterns = @('done', 'finished', 'complete', 'thanks', 'thank you', 'good', 'perfect')

    # Code-related patterns
    $CodePatterns = @('function', 'class', 'method', 'variable', 'api', 'database', 'server', 'client')

    # File extensions and paths
    $FilePatterns = @('\.js', '\.py', '\.ts', '\.json', '\.md', '\.txt', '\.yml', '\.yaml', '\.config')

    # Tool mentions
    $ToolPatterns = @('npm', 'python', 'git', 'docker', 'kubectl', 'node', 'pip', 'yarn')

    # Agent detection patterns
    $AgentPatterns = @('agent', 'general-purpose', 'task tool', 'subagent', 'automated', 'trigger')

    # Agent activity patterns
    $AgentActivityPatterns = @('execute', 'run agent', 'trigger agent', 'agent task', 'delegate to')

    $LowerPrompt = $Prompt.ToLower()

    # Analyze patterns
    foreach ($pattern in $TaskPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_task_request = $true
            $Analysis.keywords += $pattern
            $Analysis.complexity_score += 2
        }
    }

    foreach ($pattern in $QuestionPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_question = $true
            $Analysis.keywords += $pattern
            $Analysis.complexity_score += 1
        }
    }

    foreach ($pattern in $CommandPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_command = $true
            $Analysis.keywords += $pattern
            $Analysis.complexity_score += 1
        }
    }

    foreach ($pattern in $ErrorPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_error_related = $true
            $Analysis.keywords += $pattern
            $Analysis.priority_level = 'high'
            $Analysis.complexity_score += 3
        }
    }

    foreach ($pattern in $CompletionPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_completion_signal = $true
            $Analysis.keywords += $pattern
        }
    }

    foreach ($pattern in $CodePatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_code_related = $true
            $Analysis.keywords += $pattern
            $Analysis.complexity_score += 2
        }
    }

    foreach ($pattern in $FilePatterns) {
        if ($Prompt -match $pattern) {
            $Matches = [regex]::Matches($Prompt, "[^\s]+$pattern")
            foreach ($match in $Matches) {
                $Analysis.files_mentioned += $match.Value
            }
            $Analysis.complexity_score += 1
        }
    }

    foreach ($pattern in $ToolPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.tools_mentioned += $pattern
            $Analysis.complexity_score += 1
        }
    }

    # Agent detection
    foreach ($pattern in $AgentPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_agent_request = $true
            $Analysis.agents_mentioned += $pattern
            $Analysis.complexity_score += 2
        }
    }

    foreach ($pattern in $AgentActivityPatterns) {
        if ($LowerPrompt -match "\b$pattern\b") {
            $Analysis.is_agent_request = $true
            $Analysis.agent_context['activity_detected'] = $pattern
            $Analysis.complexity_score += 1
        }
    }

    # Determine intent category
    if ($Analysis.is_error_related) {
        $Analysis.intent_category = 'debugging'
    } elseif ($Analysis.is_agent_request) {
        $Analysis.intent_category = 'agent_task'
    } elseif ($Analysis.is_task_request) {
        $Analysis.intent_category = 'development'
    } elseif ($Analysis.is_question) {
        $Analysis.intent_category = 'inquiry'
    } elseif ($Analysis.is_command) {
        $Analysis.intent_category = 'execution'
    } elseif ($Analysis.is_completion_signal) {
        $Analysis.intent_category = 'completion'
    } else {
        $Analysis.intent_category = 'conversation'
    }

    # Set priority based on complexity and patterns
    if ($Analysis.complexity_score -ge 5) {
        $Analysis.priority_level = 'high'
    } elseif ($Analysis.complexity_score -ge 3) {
        $Analysis.priority_level = 'medium'
    }

    return $Analysis
}

function Get-SystemContext {
    $Context = @{
        'git_info' = @{}
        'project_info' = @{}
        'system_info' = @{}
        'environment' = @{}
    }

    try {
        # Git context
        $Context.git_info.branch = git branch --show-current 2>$null
        $Context.git_info.status = git status --porcelain 2>$null | Measure-Object | Select-Object -ExpandProperty Count
        $Context.git_info.last_commit = git log -1 --format="%h %s" 2>$null

        # Project context
        $Context.project_info.working_dir = Get-Location | Select-Object -ExpandProperty Path
        $Context.project_info.modified_files = if ($Context.git_info.status -gt 0) {
            git status --porcelain 2>$null | ForEach-Object { $_.Substring(3) } | Select-Object -First 5
        } else { @() }

        # System context
        $Context.system_info.timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $Context.system_info.session_id = $env:CLAUDE_SESSION_ID
        $Context.system_info.memory_usage = [System.GC]::GetTotalMemory($false) / 1MB

        # Environment context
        $Context.environment.temp_files = (Get-ChildItem $env:TEMP -File | Measure-Object).Count
        $Context.environment.process_count = (Get-Process | Measure-Object).Count

    } catch {
        Write-EnhancedLog "Error gathering system context: $($_.Exception.Message)" "WARN"
    }

    return $Context
}

function Should-SaveContext {
    param($PromptAnalysis, $Counter)

    # Save on every 3rd prompt (increased frequency)
    if ($Counter % 3 -eq 0) { return $true }

    # Always save high-priority prompts
    if ($PromptAnalysis.priority_level -eq 'high') { return $true }

    # Save complex development tasks
    if ($PromptAnalysis.complexity_score -ge 4) { return $true }

    # Save completion signals
    if ($PromptAnalysis.is_completion_signal) { return $true }

    # Save error-related prompts
    if ($PromptAnalysis.is_error_related) { return $true }

    # Save prompts with file mentions
    if ($PromptAnalysis.files_mentioned.Count -gt 0) { return $true }

    return $false
}

function Save-EnhancedContext {
    param($Prompt, $Analysis, $SystemContext, $Counter)

    try {
        $OriginalLocation = Get-Location
        Set-Location $MemoryPath

        # Create comprehensive context data
        $ContextData = @{
            'prompt_info' = @{
                'text' = $Prompt
                'counter' = $Counter
                'analysis' = $Analysis
                'timestamp' = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            }
            'system_context' = $SystemContext
            'memory_metadata' = @{
                'capture_reason' = Get-CaptureReason -Analysis $Analysis -Counter $Counter
                'compression_candidate' = $Prompt.Length -gt 1000
                'retention_priority' = Get-RetentionPriority -Analysis $Analysis
            }
        }

        # Use enhanced memory manager for storage
        $SaveScript = @"
import asyncio
import json
import sys
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType

async def save_prompt_context(context_data):
    manager = EnhancedMemoryManager()

    # Determine memory type based on analysis
    analysis = context_data['prompt_info']['analysis']

    if analysis['is_completion_signal']:
        memory_type = MemoryType.EPISODIC
    elif analysis['is_agent_request']:
        memory_type = MemoryType.PROCEDURAL
    elif analysis['priority_level'] == 'high':
        memory_type = MemoryType.SHORT_TERM
    elif analysis['is_task_request']:
        memory_type = MemoryType.PROCEDURAL
    else:
        memory_type = MemoryType.SEMANTIC

    # Create unique key
    session_id = context_data['system_context']['system_info']['session_id'] or 'default'
    counter = context_data['prompt_info']['counter']
    key = f'prompt-context-{session_id}-{counter}'

    # Store context
    result = await manager.store_memory(
        key,
        context_data,
        memory_type,
        {
            'session_id': session_id,
            'counter': counter,
            'intent_category': analysis['intent_category'],
            'priority_level': analysis['priority_level'],
            'type': 'prompt_context',
            'is_agent_request': analysis.get('is_agent_request', False),
            'agents_mentioned': analysis.get('agents_mentioned', []),
            'agent_context': analysis.get('agent_context', {}),
            'tools_mentioned': analysis.get('tools_mentioned', [])
        }
    )

    # Update last-session context for quick retrieval
    last_session_data = {
        'timestamp': context_data['prompt_info']['timestamp'],
        'branch': context_data['system_context']['git_info']['branch'],
        'last_prompt': context_data['prompt_info']['text'][:200] + '...' if len(context_data['prompt_info']['text']) > 200 else context_data['prompt_info']['text'],
        'intent_category': analysis['intent_category'],
        'working_dir': context_data['system_context']['project_info']['working_dir'],
        'modified_files': context_data['system_context']['project_info']['modified_files'],
        'prompt_counter': counter
    }

    last_session_result = await manager.store_memory(
        'last-session',
        last_session_data,
        MemoryType.SHORT_TERM,
        {
            'session_id': session_id,
            'type': 'session_state',
            'auto_update': True
        }
    )

    return {
        'context_saved': result,
        'session_updated': last_session_result
    }

if __name__ == '__main__':
    context_data = json.loads(sys.argv[1])
    result = asyncio.run(save_prompt_context(context_data))
    print(json.dumps(result))
"@

        $TempScript = Join-Path $env:TEMP "save_prompt_context.py"
        $SaveScript | Out-File -FilePath $TempScript -Encoding UTF8

        $ContextJson = $ContextData | ConvertTo-Json -Depth 10 -Compress
        $SaveResult = python $TempScript $ContextJson 2>&1
        Remove-Item $TempScript -Force -ErrorAction SilentlyContinue

        if ($LASTEXITCODE -eq 0) {
            $ResultData = $SaveResult | ConvertFrom-Json
            Write-EnhancedLog "Enhanced context saved successfully" "INFO"

            if ($VerboseLogging) {
                Write-EnhancedLog "Saved to memory type: $($Analysis.intent_category)" "DEBUG"
                Write-EnhancedLog "Priority level: $($Analysis.priority_level)" "DEBUG"
            }
        } else {
            Write-EnhancedLog "Enhanced context save failed: $SaveResult" "ERROR"
            # Fallback to basic save
            Save-BasicContext -Prompt $Prompt -Analysis $Analysis -SystemContext $SystemContext -Counter $Counter
        }

        Set-Location $OriginalLocation

    } catch {
        Write-EnhancedLog "Error in enhanced context save: $($_.Exception.Message)" "ERROR"
        Save-BasicContext -Prompt $Prompt -Analysis $Analysis -SystemContext $SystemContext -Counter $Counter
    }
}

function Save-BasicContext {
    param($Prompt, $Analysis, $SystemContext, $Counter)

    try {
        $OriginalLocation = Get-Location
        Set-Location $MemoryPath

        # Fallback to basic memory CLI
        $BasicContextData = @{
            'timestamp' = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            'prompt_counter' = $Counter
            'intent_category' = $Analysis.intent_category
            'priority_level' = $Analysis.priority_level
            'branch' = $SystemContext.git_info.branch
            'working_dir' = $SystemContext.project_info.working_dir
        }

        $JsonData = $BasicContextData | ConvertTo-Json -Compress
        $Metadata = @{type="session_state"} | ConvertTo-Json -Compress

        $Result = node memory_cli.js store "last-session" $JsonData $Metadata 2>&1

        if ($Result -like "*successfully*") {
            Write-EnhancedLog "Basic context saved as fallback" "INFO"
        } else {
            Write-EnhancedLog "Basic context save also failed: $Result" "WARN"
        }

        Set-Location $OriginalLocation

    } catch {
        Write-EnhancedLog "Complete failure in context saving: $($_.Exception.Message)" "ERROR"
    }
}

function Get-CaptureReason {
    param($Analysis, $Counter)

    $Reasons = @()

    if ($Counter % 3 -eq 0) { $Reasons += "periodic_save" }
    if ($Analysis.priority_level -eq 'high') { $Reasons += "high_priority" }
    if ($Analysis.complexity_score -ge 4) { $Reasons += "complex_task" }
    if ($Analysis.is_completion_signal) { $Reasons += "completion_signal" }
    if ($Analysis.is_error_related) { $Reasons += "error_handling" }
    if ($Analysis.files_mentioned.Count -gt 0) { $Reasons += "file_references" }

    return $Reasons -join ", "
}

function Get-RetentionPriority {
    param($Analysis)

    if ($Analysis.is_error_related) { return "high" }
    if ($Analysis.is_completion_signal) { return "medium" }
    if ($Analysis.complexity_score -ge 4) { return "medium" }
    if ($Analysis.is_task_request) { return "medium" }
    return "normal"
}

# Main execution
try {
    Write-EnhancedLog "Enhanced prompt submit hook initiated" "INFO"

    # Get and update counter
    $Counter = Get-PromptCounter
    $Counter++
    Set-PromptCounter $Counter

    if (-not $PromptNumber) { $PromptNumber = $Counter }

    # Analyze the prompt
    $PromptAnalysis = Analyze-PromptContext -Prompt $UserPrompt

    Write-EnhancedLog "Prompt analysis - Intent: $($PromptAnalysis.intent_category), Priority: $($PromptAnalysis.priority_level), Complexity: $($PromptAnalysis.complexity_score)" "INFO"

    # Get system context
    $SystemContext = Get-SystemContext

    # Decide whether to save context
    $ShouldSave = Should-SaveContext -PromptAnalysis $PromptAnalysis -Counter $Counter

    if ($ShouldSave) {
        Write-EnhancedLog "Saving enhanced context (Reason: $(Get-CaptureReason -Analysis $PromptAnalysis -Counter $Counter))" "INFO"
        Save-EnhancedContext -Prompt $UserPrompt -Analysis $PromptAnalysis -SystemContext $SystemContext -Counter $Counter
    } else {
        Write-EnhancedLog "Context save skipped (counter: $Counter, criteria not met)" "DEBUG"
    }

    # ENHANCED AGENT ROUTING - New Feature
    if ($PromptAnalysis.is_task_request -or $PromptAnalysis.complexity_score -ge 3) {
        Write-EnhancedLog "Task detected - Analyzing for agent routing" "INFO"

        try {
            # Route task through Claude Code Bridge
            $OriginalLocation = Get-Location
            Set-Location "C:\dev\projects\active\agents"

            $AgentRouting = python claude_code_bridge.py --analyze "$UserPrompt" 2>&1

            if ($LASTEXITCODE -eq 0) {
                Write-EnhancedLog "Agent routing analysis complete: $AgentRouting" "INFO"

                # Save routing recommendations to context
                $RoutingContext = @{
                    'routing_analysis' = $AgentRouting
                    'routing_timestamp' = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                    'routing_enabled' = $true
                }

                # Store routing context for Claude Code to use
                $RoutingFile = Join-Path $env:TEMP "claude_agent_routing_$Counter.json"
                $RoutingContext | ConvertTo-Json -Depth 5 | Out-File -FilePath $RoutingFile -Encoding UTF8

                Write-EnhancedLog "Routing context saved to: $RoutingFile" "DEBUG"
            } else {
                Write-EnhancedLog "Agent routing analysis failed: $AgentRouting" "WARN"
            }

            Set-Location $OriginalLocation

        } catch {
            Write-EnhancedLog "Error in agent routing: $($_.Exception.Message)" "ERROR"
        }
    }

    # Log high-value interactions
    if ($PromptAnalysis.priority_level -eq 'high' -or $PromptAnalysis.complexity_score -ge 4) {
        Write-EnhancedLog "High-value interaction detected - Enhanced tracking active" "INFO"
    }

} catch {
    Write-EnhancedLog "Critical error in enhanced prompt submit hook: $($_.Exception.Message)" "ERROR"
}

Write-EnhancedLog "Enhanced prompt submit hook completed" "DEBUG"