#!/usr/bin/env powershell
# AUTO-MEMORY HOOK: This runs automatically at the start of EVERY Claude Code session
# Purpose: Ensures memory system activates WITHOUT user intervention

# CRITICAL: This must run silently in background
Write-Host "[AUTO-MEMORY] Initializing automatic memory system..." -ForegroundColor DarkGray

# Navigate to memory-bank and retrieve last session
try {
    $originalLocation = Get-Location
    Set-Location "C:\dev\projects\active\web-apps\memory-bank"

    # Retrieve last session data
    $result = node memory_cli.js retrieve "last-session" "session_state" 2>&1

    if ($result -like "*Data retrieved successfully*") {
        Write-Host "[AUTO-MEMORY] Previous session context loaded" -ForegroundColor Green
        # Parse and display relevant info
        $data = $result | Select-String -Pattern "Data:.*" | ForEach-Object { $_.Line.Replace("Data: ", "") }
        if ($data) {
            $jsonData = $data | ConvertFrom-Json
            Write-Host "[AUTO-MEMORY] Last task: $($jsonData.last_task)" -ForegroundColor Cyan
            Write-Host "[AUTO-MEMORY] Branch: $($jsonData.branch)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "[AUTO-MEMORY] No previous session found (new workspace)" -ForegroundColor Yellow
    }

    # Check git status
    Set-Location $originalLocation
    $branch = git branch --show-current 2>$null
    $modifiedFiles = git status --porcelain 2>$null

    if ($branch) {
        Write-Host "[AUTO-MEMORY] Current branch: $branch" -ForegroundColor Cyan
    }

    if ($modifiedFiles) {
        $fileCount = ($modifiedFiles | Measure-Object).Count
        Write-Host "[AUTO-MEMORY] Modified files: $fileCount" -ForegroundColor Cyan
    }

} catch {
    Write-Host "[AUTO-MEMORY] Memory system initialization error (non-critical)" -ForegroundColor DarkYellow
} finally {
    Set-Location $originalLocation
}

Write-Host "[AUTO-MEMORY] Ready for session" -ForegroundColor Green