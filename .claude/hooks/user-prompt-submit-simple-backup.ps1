#!/usr/bin/env powershell
# User Prompt Submit Hook - Periodic Context Saving
# Simple, reliable implementation using memory_cli.js

param(
    [string]$UserPrompt = "",
    [int]$PromptNumber = 0,
    [switch]$Silent = $true  # Run silently by default
)

$ErrorActionPreference = "SilentlyContinue"

# Configuration
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$CounterFile = "$env:TEMP\claude_prompt_counter.txt"

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

function Get-SystemContext {
    $Context = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        branch = "unknown"
        working_dir = (Get-Location).Path
        modified_files = @()
        modified_count = 0
        session_id = $env:CLAUDE_SESSION_ID
    }

    try {
        $Context.branch = git branch --show-current 2>$null
        $ModifiedFiles = git status --porcelain 2>$null

        if ($ModifiedFiles) {
            $Context.modified_files = ($ModifiedFiles | ForEach-Object { $_.Substring(3) } | Select-Object -First 5)
            $Context.modified_count = ($ModifiedFiles | Measure-Object).Count
        }
    } catch {
        # Silently continue if git fails
    }

    return $Context
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

function Save-Context {
    param($Prompt, $Analysis, $SystemContext, $Counter)

    try {
        $OriginalLocation = Get-Location
        Set-Location $MemoryPath

        # Create last-session data
        $LastSessionData = @{
            timestamp = $SystemContext.timestamp
            branch = $SystemContext.branch
            working_dir = $SystemContext.working_dir
            modified_files = $SystemContext.modified_files
            last_prompt = if ($Prompt.Length -gt 200) {
                $Prompt.Substring(0, 197) + "..."
            } else {
                $Prompt
            }
            intent_category = $Analysis.category
            prompt_counter = $Counter
            session_id = $SystemContext.session_id
        }

        $Metadata = @{type="session_state"}

        # Create JSON strings (direct conversion, no file I/O)
        $DataJson = ($LastSessionData | ConvertTo-Json -Depth 10 -Compress)
        $MetaJson = ($Metadata | ConvertTo-Json -Compress)

        # Write to temp file for node to read (avoids PowerShell string escaping issues)
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

        if (-not $Silent) {
            Write-Host "Save result: $SaveResult" -ForegroundColor Gray
        }

        # Cleanup
        Remove-Item $TempScriptFile -Force -ErrorAction SilentlyContinue

        Set-Location $OriginalLocation

        if (-not $Silent) {
            Write-Host "Context saved (prompt $Counter)" -ForegroundColor DarkGreen
        }

        return $true

    } catch {
        return $false
    }
}

# Main execution
try {
    # Get and update counter
    $Counter = Get-PromptCounter
    $Counter++
    Set-PromptCounter $Counter

    if (-not $PromptNumber) { $PromptNumber = $Counter }

    # Analyze the prompt
    $PromptAnalysis = Analyze-Prompt -Prompt $UserPrompt

    # Get system context
    $SystemContext = Get-SystemContext

    # Decide whether to save
    $ShouldSave = Should-SaveContext -Counter $Counter -Analysis $PromptAnalysis

    if ($ShouldSave) {
        Save-Context -Prompt $UserPrompt -Analysis $PromptAnalysis -SystemContext $SystemContext -Counter $Counter
    }

} catch {
    # Silently fail - don't interrupt user workflow
}
