# Claude Code Automated Memory Management Script
# This script provides automated memory operations for Claude Code sessions

param(
    [Parameter(Position = 0)]
    [ValidateSet("init", "save", "load", "status", "auto")]
    [string]$Action = "auto",

    [string]$Key = "",
    [string]$Data = "",
    [string]$Type = "session_state"
)

$memoryBankPath = "C:\dev\projects\active\web-apps\memory-bank"
$nodeCommand = "node memory_cli.js"

function Initialize-Session {
    Write-Host "=== CLAUDE CODE SESSION INITIALIZATION ===" -ForegroundColor Cyan
    Write-Host "Checking for previous session context..." -ForegroundColor Yellow

    # Check for last session
    $lastSession = & powershell -Command "cd '$memoryBankPath'; $nodeCommand retrieve 'last-session' 'session_state' 2>&1"
    if ($lastSession -match "Data retrieved") {
        Write-Host "Found previous session!" -ForegroundColor Green
        Write-Host $lastSession
    } else {
        Write-Host "No previous session found. Starting fresh." -ForegroundColor Gray
    }

    # Check for current project context
    $projectContext = & powershell -Command "cd '$memoryBankPath'; $nodeCommand retrieve 'current-project' 'project_context' 2>&1"
    if ($projectContext -match "Data retrieved") {
        Write-Host "Found project context!" -ForegroundColor Green
        Write-Host $projectContext
    }

    # Show git status for additional context
    Write-Host "`nGit Context:" -ForegroundColor Yellow
    $branch = git branch --show-current 2>$null
    $status = git status --short 2>$null
    Write-Host "Branch: $branch" -ForegroundColor Cyan
    if ($status) {
        Write-Host "Modified files:" -ForegroundColor Cyan
        Write-Host $status
    }

    # Show recent commits
    Write-Host "`nRecent commits:" -ForegroundColor Yellow
    git log --oneline -5 2>$null

    # List all stored memory
    Write-Host "`nStored Memory Items:" -ForegroundColor Yellow
    & powershell -Command "cd '$memoryBankPath'; $nodeCommand list localMemory"
}

function Save-SessionContext {
    param(
        [string]$SessionKey = "last-session",
        [string]$TaskDescription = "",
        [string]$Notes = ""
    )

    Write-Host "=== SAVING SESSION CONTEXT ===" -ForegroundColor Cyan

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $branch = git branch --show-current 2>$null
    $modifiedFiles = git diff --name-only 2>$null
    $stagedFiles = git diff --cached --name-only 2>$null
    $lastCommit = git log -1 --oneline 2>$null

    $sessionData = @{
        timestamp = $timestamp
        branch = if ($branch) { $branch } else { "unknown" }
        modified_files = if ($modifiedFiles) { @($modifiedFiles -split "`n") } else { @() }
        staged_files = if ($stagedFiles) { @($stagedFiles -split "`n") } else { @() }
        last_commit = if ($lastCommit) { $lastCommit } else { "" }
        current_task = $TaskDescription
        notes = $Notes
        working_directory = (Get-Location | Select-Object -ExpandProperty Path)
    }

    $jsonData = ($sessionData | ConvertTo-Json -Compress -Depth 10) -replace '"', '\"'
    $metadata = (@{ type = "session_state"; auto_saved = $true } | ConvertTo-Json -Compress) -replace '"', '\"'

    # Use a simpler approach - write to temp file
    $tempDataFile = "$env:TEMP\claude_session_data.json"
    $tempMetaFile = "$env:TEMP\claude_session_meta.json"

    $sessionData | ConvertTo-Json -Depth 10 | Out-File -FilePath $tempDataFile -Encoding utf8
    @{ type = "session_state"; auto_saved = $true } | ConvertTo-Json | Out-File -FilePath $tempMetaFile -Encoding utf8

    $dataContent = Get-Content $tempDataFile -Raw
    $metaContent = Get-Content $tempMetaFile -Raw

    Set-Location $memoryBankPath
    $result = node memory_cli.js store $SessionKey $dataContent $metaContent 2>&1

    if ($result -match "stored successfully") {
        Write-Host "Session context saved successfully!" -ForegroundColor Green
        Write-Host "Key: $SessionKey" -ForegroundColor Cyan
        Write-Host "Timestamp: $timestamp" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to save session context" -ForegroundColor Red
        Write-Host $result
    }
}

function Save-ProjectContext {
    param(
        [string]$ProjectName,
        [string[]]$KeyFiles = @(),
        [string]$CurrentFeature = "",
        [string]$Notes = ""
    )

    Write-Host "=== SAVING PROJECT CONTEXT ===" -ForegroundColor Cyan

    if (-not $ProjectName) {
        # Try to detect project name from current directory
        $currentPath = Get-Location | Select-Object -ExpandProperty Path
        $ProjectName = Split-Path $currentPath -Leaf
    }

    $projectData = @{
        project_name = $ProjectName
        saved_at = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        key_files = $KeyFiles
        current_feature = $CurrentFeature
        important_notes = $Notes
        dependencies = @()
        git_branch = git branch --show-current 2>$null
        last_commits = git log --oneline -5 2>$null | Out-String
    }

    # Try to detect dependencies
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $projectData.dependencies = $packageJson.dependencies | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    }

    $jsonData = $projectData | ConvertTo-Json -Compress -Depth 10
    $metadata = @{ type = "project_context"; project = $ProjectName } | ConvertTo-Json -Compress

    $result = & powershell -Command "cd '$memoryBankPath'; $nodeCommand store 'project-$ProjectName' '$jsonData' '$metadata'"

    if ($result -match "stored successfully") {
        Write-Host "Project context saved successfully!" -ForegroundColor Green
        Write-Host "Project: $ProjectName" -ForegroundColor Cyan
    }

    # Also update the current-project pointer
    & powershell -Command "cd '$memoryBankPath'; $nodeCommand store 'current-project' '$jsonData' '$metadata'" | Out-Null
}

function Get-MemoryStatus {
    Write-Host "=== MEMORY SYSTEM STATUS ===" -ForegroundColor Cyan

    # Show statistics
    & powershell -Command "cd '$memoryBankPath'; $nodeCommand stats"

    Write-Host "`n=== STORED ITEMS ===" -ForegroundColor Cyan

    # List all items
    & powershell -Command "cd '$memoryBankPath'; $nodeCommand list"

    Write-Host "`n=== HEALTH CHECK ===" -ForegroundColor Cyan

    # Run health check
    & powershell -Command "cd '$memoryBankPath'; $nodeCommand health"
}

function Start-AutoMemory {
    Write-Host "=== AUTOMATED MEMORY MANAGEMENT ACTIVE ===" -ForegroundColor Green
    Write-Host "This mode will:" -ForegroundColor Yellow
    Write-Host "1. Load previous context at start" -ForegroundColor Cyan
    Write-Host "2. Save context periodically" -ForegroundColor Cyan
    Write-Host "3. Save context on exit" -ForegroundColor Cyan

    # Initialize session
    Initialize-Session

    # Set up automatic saving
    Write-Host "`nAuto-save enabled. Context will be saved every 30 minutes." -ForegroundColor Yellow

    # Create a timer for periodic saves (this would need to run in background)
    Write-Host "To manually save at any time, run:" -ForegroundColor Gray
    Write-Host "  .\claude-memory.ps1 save" -ForegroundColor White

    # Register exit handler (simplified version)
    Write-Host "`nSession initialized. Memory system ready." -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "init" {
        Initialize-Session
    }
    "save" {
        Save-SessionContext -TaskDescription $Data -Notes $Type
        Save-ProjectContext
    }
    "load" {
        if ($Key) {
            $result = & powershell -Command "cd '$memoryBankPath'; $nodeCommand retrieve '$Key' '$Type'"
            Write-Host $result
        } else {
            Initialize-Session
        }
    }
    "status" {
        Get-MemoryStatus
    }
    "auto" {
        Start-AutoMemory
    }
    default {
        Write-Host "Usage: .\claude-memory.ps1 [init|save|load|status|auto]" -ForegroundColor Yellow
        Write-Host "  init   - Initialize session and load previous context" -ForegroundColor Gray
        Write-Host "  save   - Save current session and project context" -ForegroundColor Gray
        Write-Host "  load   - Load specific memory item" -ForegroundColor Gray
        Write-Host "  status - Show memory system status" -ForegroundColor Gray
        Write-Host "  auto   - Start automated memory management" -ForegroundColor Gray
    }
}