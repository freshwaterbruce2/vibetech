#!/usr/bin/env powershell
<#
.SYNOPSIS
Setup script for the Enhanced Agent CLI

.DESCRIPTION
Configures the PowerShell environment to enable direct agent commands from any directory
#>

param(
    [switch]$Force = $false
)

$ScriptsPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProfilePath = $PROFILE

Write-Host "Setting up Enhanced Agent CLI..." -ForegroundColor Cyan
Write-Host "Scripts Path: $ScriptsPath" -ForegroundColor Gray
Write-Host "Profile Path: $ProfilePath" -ForegroundColor Gray

# Create profile if it doesn't exist
if (-not (Test-Path $ProfilePath)) {
    Write-Host "Creating PowerShell profile..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $ProfilePath -Force | Out-Null
}

# Read current profile
$ProfileContent = Get-Content $ProfilePath -ErrorAction SilentlyContinue

# Check if agent functions are already configured
$AgentFunctionExists = $ProfileContent | Where-Object { $_ -match "function agent" }

if ($AgentFunctionExists -and -not $Force) {
    Write-Host "Agent CLI functions already configured in PowerShell profile" -ForegroundColor Green
    Write-Host "Use -Force to reconfigure" -ForegroundColor Gray
} else {
    Write-Host "Adding agent functions to PowerShell profile..." -ForegroundColor Yellow

    # Add agent functions to profile
    $AgentConfig = @"

# Enhanced Agent System CLI Functions
function agent {
    param([Parameter(Mandatory=`$true)][string]`$Task, [switch]`$Force, [switch]`$Verbose)
    `$AgentScript = Join-Path "$ScriptsPath" "agent.ps1"
    if (Test-Path `$AgentScript) {
        & `$AgentScript -Task `$Task -Force:`$Force -Verbose:`$Verbose
    } else {
        Write-Host "❌ Agent script not found: `$AgentScript" -ForegroundColor Red
    }
}

function Invoke-Agent {
    param([Parameter(Mandatory=`$true)][string]`$Task, [switch]`$Force, [switch]`$Verbose)
    `$InvokeAgentScript = Join-Path "$ScriptsPath" "Invoke-Agent.ps1"
    if (Test-Path `$InvokeAgentScript) {
        & `$InvokeAgentScript -Task `$Task -Force:`$Force -Verbose:`$Verbose
    } else {
        Write-Host "❌ Invoke-Agent script not found: `$InvokeAgentScript" -ForegroundColor Red
    }
}

Write-Host "Enhanced Agent CLI loaded - Use 'agent `"your task`"' to trigger agents" -ForegroundColor Green
"@

    Add-Content -Path $ProfilePath -Value $AgentConfig
    Write-Host "Agent CLI functions added to PowerShell profile" -ForegroundColor Green
}

Write-Host "`nTo activate immediately, run:" -ForegroundColor Cyan
Write-Host "   . `$PROFILE" -ForegroundColor White
Write-Host "`nOr restart PowerShell for the changes to take effect automatically." -ForegroundColor Gray

Write-Host "`nUsage Examples:" -ForegroundColor Cyan
Write-Host '   agent "Create a dashboard component"' -ForegroundColor White
Write-Host '   agent "Fix the authentication bug" -Verbose' -ForegroundColor White
Write-Host '   agent "Optimize database performance" -Force' -ForegroundColor White

Write-Host "`nAgent CLI setup complete!" -ForegroundColor Green