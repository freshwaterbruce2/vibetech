#!/usr/bin/env powershell
# Test script for the Agent CLI

# Load the agent functions
$ScriptsPath = Split-Path -Parent $MyInvocation.MyCommand.Path

function agent {
    param([Parameter(Mandatory=$true)][string]$Task, [switch]$Force, [switch]$VerboseOutput)
    $AgentScript = Join-Path $ScriptsPath "agent.ps1"
    if (Test-Path $AgentScript) {
        & $AgentScript -Task $Task -Force:$Force -VerboseOutput:$VerboseOutput
    } else {
        Write-Host "Agent script not found: $AgentScript" -ForegroundColor Red
    }
}

Write-Host "Testing Enhanced Agent CLI..." -ForegroundColor Cyan
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray

# Test the agent command
agent "Create a dashboard component"