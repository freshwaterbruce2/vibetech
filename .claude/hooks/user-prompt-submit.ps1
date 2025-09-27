#!/usr/bin/env powershell
# AUTO-SAVE HOOK: Automatically saves session context periodically
# This runs after significant user interactions

param(
    [string]$prompt = ""
)

# Keywords that trigger auto-save
$saveKeywords = @(
    "thank", "thanks", "goodbye", "bye", "done", "finished",
    "complete", "working", "implement", "fix", "create", "build"
)

$shouldSave = $false

# Check if prompt contains save-worthy keywords
foreach ($keyword in $saveKeywords) {
    if ($prompt -match $keyword) {
        $shouldSave = $true
        break
    }
}

# Also save periodically (every 5th interaction)
$interactionFile = "$env:TEMP\claude_interaction_count.txt"
$count = 1

if (Test-Path $interactionFile) {
    $count = [int](Get-Content $interactionFile) + 1
}

Set-Content $interactionFile -Value $count

if ($count % 5 -eq 0) {
    $shouldSave = $true
}

if ($shouldSave) {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $branch = git branch --show-current 2>$null

        # Extract task context from prompt
        $task = if ($prompt.Length -gt 100) {
            $prompt.Substring(0, 100) + "..."
        } else {
            $prompt
        }

        $sessionData = @{
            timestamp = $timestamp
            branch = $branch
            last_task = $task
            interaction_count = $count
        } | ConvertTo-Json -Compress

        # Save to memory bank
        $originalLocation = Get-Location
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"

        $result = node memory_cli.js store "last-session" $sessionData '{"type":"session_state"}' 2>&1

        if ($result -like "*Data stored*") {
            Write-Host "[AUTO-SAVE] Session context saved (interaction #$count)" -ForegroundColor DarkGreen
        }

        Set-Location $originalLocation
    } catch {
        # Silent failure - don't interrupt user workflow
    }
}