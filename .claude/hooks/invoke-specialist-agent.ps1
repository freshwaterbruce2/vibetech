#!/usr/bin/env powershell
# Invoke Specialist Agent Hook
# Automatically invokes specialist agents based on task analysis

param(
    [string]$TaskDescription = "",
    [string]$ProjectContext = "",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "SilentlyContinue"
$OrchestratorPath = "C:\dev\projects\active\web-apps\memory-bank\agent_orchestrator.py"

function Get-AgentRecommendation {
    param([string]$Task, [string]$Project)

    if (-not (Test-Path $OrchestratorPath)) {
        return $null
    }

    try {
        $result = python $OrchestratorPath $Task $Project 2>$null
        if ($result) {
            return $result | ConvertFrom-Json
        }
    } catch {
        return $null
    }

    return $null
}

function Invoke-SpecialistAgent {
    param([string]$AgentName, [string]$Task)

    Write-Host ""
    Write-Host "AUTO-INVOKING SPECIALIST AGENT" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host "  Agent: $AgentName" -ForegroundColor Yellow
    Write-Host "  Task: $Task" -ForegroundColor White
    Write-Host ""

    # Output agent invocation command for Claude Code to recognize
    Write-Output "@$AgentName"
    Write-Output "Task: $Task"
}

# Main execution
if (-not $TaskDescription) {
    Write-Host "Usage: invoke-specialist-agent.ps1 -TaskDescription 'your task' [-ProjectContext 'project-name']" -ForegroundColor Red
    exit 1
}

# Get recommendation from orchestrator
$recommendation = Get-AgentRecommendation -Task $TaskDescription -Project $ProjectContext

if (-not $recommendation -or -not $recommendation.recommended) {
    Write-Host "No specialist agent recommended for this task" -ForegroundColor Gray
    exit 0
}

# Display recommendation
Write-Host ""
Write-Host "AGENT RECOMMENDATION" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "  Agent: $($recommendation.display_name)" -ForegroundColor Yellow
Write-Host "  Confidence: $($recommendation.confidence)" -ForegroundColor White
Write-Host "  Task Type: $($recommendation.task_type)" -ForegroundColor White
Write-Host ""
Write-Host "  Reasons:" -ForegroundColor Yellow
foreach ($reason in $recommendation.reasons) {
    Write-Host "    - $reason" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Performance Targets:" -ForegroundColor Yellow
Write-Host "    Success Rate: $([math]::Round($recommendation.performance_targets.target_success_rate * 100, 2))%" -ForegroundColor White
Write-Host "    Execution Time: $([math]::Round($recommendation.performance_targets.target_execution_time, 2))s" -ForegroundColor White

# Auto-invoke if confidence is high enough
if ($recommendation.confidence -ge 3.0 -and -not $DryRun) {
    Write-Host ""
    Write-Host "Auto-invoking (confidence >= 3.0)..." -ForegroundColor Green
    Invoke-SpecialistAgent -AgentName $recommendation.agent -Task $TaskDescription
} else {
    if ($DryRun) {
        Write-Host ""
        Write-Host "[DRY RUN] Would auto-invoke $($recommendation.agent)" -ForegroundColor Magenta
    } else {
        Write-Host ""
        Write-Host "Confidence below threshold (< 3.0), manual invocation required" -ForegroundColor Yellow
        Write-Host "Use: @$($recommendation.agent)" -ForegroundColor Cyan
    }
}

exit 0
