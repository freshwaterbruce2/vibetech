#!/usr/bin/env powershell
param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Task,
    [switch]$Force = $false
)

# Configuration
$AgentSystemPath = "C:\dev\projects\active\agents"
$BridgeScript = Join-Path $AgentSystemPath "claude_code_bridge.py"

# Simple logging
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Gray
}

# Check prerequisites
function Test-System {
    Write-Log "Checking system prerequisites..."

    try {
        $null = python --version 2>&1
        Write-Log "Python found"
    } catch {
        Write-Host "ERROR: Python is required but not found" -ForegroundColor Red
        return $false
    }

    if (-not (Test-Path $BridgeScript)) {
        Write-Host "ERROR: Bridge script not found: $BridgeScript" -ForegroundColor Red
        return $false
    }

    return $true
}

# Main execution
Write-Host "`nEnhanced Agent System" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if (-not (Test-System)) {
    exit 1
}

$WorkingDirectory = (Get-Location).Path
Write-Log "Working directory: $WorkingDirectory"
Write-Log "Task: $Task"

try {
    # Navigate to agent system
    $OriginalLocation = Get-Location
    Set-Location $AgentSystemPath

    # Analyze task
    Write-Host "`nAnalyzing task..." -ForegroundColor Blue
    $AnalysisResult = python claude_code_bridge.py --analyze "$Task" --working-directory "$WorkingDirectory" 2>&1
    $ExitCode = $LASTEXITCODE

    # Restore location
    Set-Location $OriginalLocation

    if ($ExitCode -eq 0) {
        try {
            # Extract JSON from mixed output (it's the last line that starts with {)
            $JsonLine = ($AnalysisResult -split "`n" | Where-Object { $_ -match '^\{.*\}$' } | Select-Object -Last 1)

            if ($JsonLine) {
                $Analysis = $JsonLine | ConvertFrom-Json

                Write-Host "`nAnalysis Results:" -ForegroundColor Green
                Write-Host "  Task Type: $($Analysis.task_type)"
                Write-Host "  Complexity: $($Analysis.complexity)"
                Write-Host "  Selected Agents: $($Analysis.agents -join ', ')"
                Write-Host "  Parallel: $($Analysis.parallel)"
            } else {
                throw "No JSON found in output"
            }

            # Confirm execution
            if (-not $Force) {
                $Confirmation = Read-Host "`nExecute this task? (Y/N)"
                if ($Confirmation -notmatch '^[Yy]') {
                    Write-Host "Task cancelled" -ForegroundColor Yellow
                    exit 0
                }
            }

            Write-Host "`nTask routed to Claude Code interface..." -ForegroundColor Green
            Write-Host "The enhanced agent system has analyzed your request." -ForegroundColor Gray
            Write-Host "Check Claude Code for task execution." -ForegroundColor Gray

        } catch {
            Write-Host "Failed to parse analysis: $AnalysisResult" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Analysis failed: $AnalysisResult" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "Critical error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}