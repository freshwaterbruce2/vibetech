#!/usr/bin/env powershell
<#
.SYNOPSIS
Simple alias for Invoke-Agent command

.DESCRIPTION
Provides a short "agent" command for triggering the enhanced agent system

.EXAMPLE
agent "Create a dashboard component"

.EXAMPLE
agent "Fix the authentication bug" -Verbose
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Task,

    [switch]$Force = $false,
    [switch]$VerboseOutput = $false
)

# Call the main Invoke-Agent script
$InvokeAgentPath = Join-Path $PSScriptRoot "Invoke-Agent.ps1"

if (Test-Path $InvokeAgentPath) {
    & $InvokeAgentPath -Task $Task -Force:$Force -Verbose:$VerboseOutput
} else {
    Write-Host "❌ Invoke-Agent.ps1 not found at: $InvokeAgentPath" -ForegroundColor Red
    exit 1
}