#!/usr/bin/env powershell
# Test Agent Mappings

param([string]$TestProject)

$AgentsConfigPath = Join-Path $PSScriptRoot "agents.json"
$AgentsConfig = Get-Content $AgentsConfigPath -Raw | ConvertFrom-Json

if ($TestProject) {
    $Projects = @($TestProject)
} else {
    # Test all new mappings
    $Projects = @("Vibe-Subscription-Guard", "agents", "memory-bank")
}

Write-Host ""
Write-Host "Testing Agent Mappings" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

foreach ($ProjectName in $Projects) {
    $AgentName = $AgentsConfig.project_agents.$ProjectName

    if ($AgentName) {
        $AgentDef = $AgentsConfig.agent_definitions.$AgentName

        if ($AgentDef) {
            Write-Host "Project: $ProjectName" -ForegroundColor Yellow
            Write-Host "  Agent: $AgentName" -ForegroundColor White
            Write-Host "  Display Name: $($AgentDef.display_name)" -ForegroundColor White
            Write-Host "  Primary Directive: $($AgentDef.primary_directive)" -ForegroundColor Green
            Write-Host "  Expertise: $($AgentDef.expertise -join ', ')" -ForegroundColor Gray
            Write-Host ""
        } else {
            Write-Host "Project: $ProjectName - Agent definition missing!" -ForegroundColor Red
            Write-Host ""
        }
    } else {
        Write-Host "Project: $ProjectName - No agent mapping found!" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "Test Complete" -ForegroundColor Green
