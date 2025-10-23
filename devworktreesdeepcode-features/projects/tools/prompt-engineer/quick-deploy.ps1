#!/usr/bin/env pwsh
# Simple Deployment Script for Prompt Engineer
# Version: 1.0.0

param(
    [Parameter()]
    [ValidateSet('dev', 'staging', 'production')]
    [string]$Environment = 'dev'
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Prompt Engineer - Quick Deploy v1.0.0          ║" -ForegroundColor Cyan
Write-Host "║   Environment: $Environment                            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$success = $true

try {
    # Step 1: Check Python
    Write-Host "[1/6] Checking Python..." -NoNewline
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -like "Python 3.*") {
        Write-Host " Done ($pythonVersion)" -ForegroundColor Green
    } else {
        throw "Python 3.8+ required"
    }

    # Step 2: Install dependencies
    Write-Host "[2/6] Installing dependencies..." -NoNewline
    pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Write-Host " ✅ Done" -ForegroundColor Green

    # Step 3: Test imports
    Write-Host "[3/6] Testing imports..." -NoNewline
    $importTest = python -c "from src.collectors import CodeScanner, GitAnalyzer; print('OK')" 2>&1
    if ($importTest -match "OK") {
        Write-Host " ✅ Done" -ForegroundColor Green
    } else {
        throw "Import test failed"
    }

    # Step 4: Run simple example
    Write-Host "[4/6] Running smoke test..." -NoNewline
    $exampleOutput = python simple_example.py 2>&1
    if ($exampleOutput -match "completed successfully") {
        Write-Host " ✅ Done" -ForegroundColor Green
    } else {
        throw "Smoke test failed"
    }

    # Step 5: Health check
    Write-Host "[5/6] Running health check..." -NoNewline
    $healthOutput = python health_check.py 2>&1
    if ($LASTEXITCODE -eq 0) {
        $health = $healthOutput | ConvertFrom-Json
        Write-Host " ✅ Healthy (found $($health.files) files)" -ForegroundColor Green
    } else {
        throw "Health check failed"
    }

    # Step 6: Configuration
    Write-Host "[6/6] Setting configuration..." -NoNewline
    switch ($Environment) {
        'dev' {
            $env:PROMPT_ENGINEER_DEBUG = "true"
            $env:PROMPT_ENGINEER_MAX_FILES = "100"
        }
        'staging' {
            $env:PROMPT_ENGINEER_DEBUG = "false"
            $env:PROMPT_ENGINEER_MAX_FILES = "500"
        }
        'production' {
            $env:PROMPT_ENGINEER_DEBUG = "false"
            $env:PROMPT_ENGINEER_MAX_FILES = "1000"
        }
    }
    Write-Host " ✅ Done" -ForegroundColor Green

} catch {
    $success = $false
    Write-Host " ❌ Failed" -ForegroundColor Red
    Write-Host "`nError: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n╔═══════════════════════════════════════════════════╗" -ForegroundColor $(if ($success) { "Green" } else { "Red" })
Write-Host "║              DEPLOYMENT SUMMARY                   ║" -ForegroundColor $(if ($success) { "Green" } else { "Red" })
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor $(if ($success) { "Green" } else { "Red" })

if ($success) {
    Write-Host "`n✅ Deployment completed successfully!`n" -ForegroundColor Green
    Write-Host "Quick start commands:" -ForegroundColor Cyan
    Write-Host "  Interactive mode:  " -NoNewline; Write-Host "python -m src.collectors.interactive_collector" -ForegroundColor Yellow
    Write-Host "  Simple example:    " -NoNewline; Write-Host "python simple_example.py" -ForegroundColor Yellow
    Write-Host "  Health check:      " -NoNewline; Write-Host "python health_check.py" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "`n❌ Deployment failed!`n" -ForegroundColor Red
    exit 1
}
