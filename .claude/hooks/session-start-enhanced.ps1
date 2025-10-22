#!/usr/bin/env powershell
# Enhanced Session Start Hook with Learning Recommendations
# Shows specialist agent + learning insights from training data

param(
    [string]$SessionId = "",
    [switch]$Silent = $false
)

$ErrorActionPreference = "SilentlyContinue"
$MemoryPath = "C:\dev\projects\active\web-apps\memory-bank"
$TaskHistoryFile = "$MemoryPath\quick-access\recent-tasks.json"
$TrainingResultsFile = "$MemoryPath\training_results.json"

# Import base session start functionality
$BaseScript = Join-Path $PSScriptRoot "session-start.ps1"
if (Test-Path $BaseScript) {
    # Run base session start
    & $BaseScript -SessionId $SessionId -Silent:$Silent
}

function Get-LearningRecommendations {
    param([string]$ProjectName, [string]$SpecialistAgent)

    if (-not (Test-Path $TrainingResultsFile)) {
        return $null
    }

    try {
        $TrainingData = Get-Content $TrainingResultsFile -Raw | ConvertFrom-Json

        # Get insights for specialist agent
        $AgentInsights = $TrainingData.agent_insights.$SpecialistAgent

        if ($AgentInsights -and $AgentInsights.recommendations -and $AgentInsights.recommendations.Count -gt 0) {
            return $AgentInsights
        }

        return $null

    } catch {
        return $null
    }
}

function Show-LearningInsights {
    param($ProjectName, $SpecialistAgent)

    if ($Silent) { return }

    $Insights = Get-LearningRecommendations -ProjectName $ProjectName -SpecialistAgent $SpecialistAgent

    if ($Insights) {
        Write-Host ""
        Write-Host "LEARNING INSIGHTS" -ForegroundColor Magenta
        Write-Host "----------------" -ForegroundColor Magenta

        $Performance = $Insights.performance
        if ($Performance) {
            Write-Host "  Agent Performance:" -ForegroundColor Yellow
            Write-Host "    Success Rate    : $($Performance.success_rate * 100)%" -ForegroundColor White
            Write-Host "    Avg Exec Time   : $($Performance.avg_execution_time)s" -ForegroundColor White
            Write-Host "    Total Tasks     : $($Performance.total_executions)" -ForegroundColor White
        }

        if ($Insights.recommendations -and $Insights.recommendations.Count -gt 0) {
            Write-Host ""
            Write-Host "  Top Recommendations:" -ForegroundColor Yellow
            $TopRecs = $Insights.recommendations | Select-Object -First 3
            foreach ($rec in $TopRecs) {
                Write-Host "    - $rec" -ForegroundColor Gray
            }
        }

        if ($Insights.relevant_patterns -gt 0) {
            Write-Host ""
            Write-Host "  Relevant Patterns: $($Insights.relevant_patterns)" -ForegroundColor White
        }
    }
}

# Main execution
try {
    # Get current project context from git modified files
    $GitContext = @{
        working_dir = (Get-Location).Path
        modified_files = @()
    }

    try {
        $StatusLines = git status --porcelain 2>$null
        if ($StatusLines) {
            $GitContext.modified_files = ($StatusLines | ForEach-Object { $_.Substring(3) } | Select-Object -First 1)
        }
    } catch {}

    # Detect project
    $CurrentProject = 'workspace'
    if ($GitContext.modified_files -and $GitContext.modified_files.Count -gt 0) {
        $FirstFile = $GitContext.modified_files[0]
        if ($FirstFile -match 'projects/active/(?:web-apps|desktop-apps)/([^/]+)') {
            $CurrentProject = $matches[1]
        }
    } else {
        if ($GitContext.working_dir -match 'projects/active/(?:web-apps|desktop-apps)/([^/]+)') {
            $CurrentProject = $matches[1]
        }
    }

    # Get specialist agent for project
    $AgentsConfigPath = Join-Path $PSScriptRoot "..\agents.json"
    if (Test-Path $AgentsConfigPath) {
        $AgentsConfig = Get-Content $AgentsConfigPath -Raw | ConvertFrom-Json
        $SpecialistAgent = $AgentsConfig.project_agents.$CurrentProject

        if ($SpecialistAgent) {
            # Show learning insights for this agent
            Show-LearningInsights -ProjectName $CurrentProject -SpecialistAgent $SpecialistAgent
        }
    }

} catch {
    # Silently fail
}
