#!/usr/bin/env powershell
# COMPREHENSIVE AGENT & LEARNING SYSTEM VALIDATION
# Date: 09/27/2025
# Purpose: Validate Claude Code Development Agents and D: Drive Learning System

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " CLAUDE CODE AGENT & LEARNING SYSTEM VALIDATION" -ForegroundColor Cyan
Write-Host " Testing Agent Orchestration & Learning Integration" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0
$warnings = @()

# Helper function for test results
function Test-Result {
    param($TestName, $Condition, $PassMessage, $FailMessage)
    $script:totalTests++
    Write-Host -NoNewline "Testing $TestName... "
    if ($Condition) {
        Write-Host "PASS" -ForegroundColor Green
        Write-Host "  $PassMessage" -ForegroundColor DarkGray
        $script:passedTests++
        return $true
    } else {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "  $FailMessage" -ForegroundColor Yellow
        $script:failedTests++
        return $false
    }
}

# 1. D: DRIVE LEARNING SYSTEM
Write-Host "`n[1/8] D: DRIVE LEARNING SYSTEM" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor DarkGray

Test-Result "D:\learning-system" `
    (Test-Path "D:\learning-system") `
    "Learning system directory exists" `
    "Learning system directory missing"

Test-Result "agent_learning.db" `
    (Test-Path "D:\learning-system\agent_learning.db") `
    "Agent learning database found" `
    "Agent learning database missing"

Test-Result "learning_engine.py" `
    (Test-Path "D:\learning-system\learning_engine.py") `
    "Learning engine script present" `
    "Learning engine missing"

# 2. D: DRIVE DATABASES
Write-Host "`n[2/8] D: DRIVE DATABASES" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor DarkGray

Test-Result "D:\databases" `
    (Test-Path "D:\databases") `
    "Databases directory exists" `
    "Databases directory missing"

Test-Result "database.db" `
    (Test-Path "D:\databases\database.db") `
    "Main unified database found" `
    "Main database missing"

Test-Result "agent_tasks.db" `
    (Test-Path "D:\databases\agent_tasks.db") `
    "Agent tasks database found" `
    "Agent tasks database missing"

# 3. D: DRIVE MEMORY
Write-Host "`n[3/8] D: DRIVE MEMORY" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor DarkGray

Test-Result "D:\dev-memory" `
    (Test-Path "D:\dev-memory") `
    "Dev memory directory exists for bulk storage" `
    "Dev memory directory missing"

Test-Result "claude-code directory" `
    (Test-Path "D:\dev-memory\claude-code") `
    "Claude Code memory storage configured" `
    "Claude Code memory storage missing"

# 4. AGENT SYSTEM FILES
Write-Host "`n[4/8] AGENT SYSTEM FILES" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor DarkGray

Test-Result "agents directory" `
    (Test-Path "C:\dev\projects\active\agents") `
    "Agents directory exists" `
    "Agents directory missing"

Test-Result "agent_orchestrator.py" `
    (Test-Path "C:\dev\projects\active\agents\agent_orchestrator.py") `
    "Agent orchestrator found" `
    "Agent orchestrator missing"

Test-Result "learning_adapter.py" `
    (Test-Path "C:\dev\projects\active\agents\learning_adapter.py") `
    "Learning adapter found" `
    "Learning adapter missing"

Test-Result "yolo_mode.py" `
    (Test-Path "C:\dev\projects\active\agents\yolo_mode.py") `
    "YOLO Mode handler found" `
    "YOLO Mode handler missing"

Test-Result "agent_definitions.json" `
    (Test-Path "C:\dev\projects\active\agents\agent_definitions.json") `
    "Agent definitions configured" `
    "Agent definitions missing"

# 5. MONITORING & DASHBOARD
Write-Host "`n[5/8] MONITORING & DASHBOARD" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor DarkGray

Test-Result "monitoring directory" `
    (Test-Path "C:\dev\projects\active\agents\monitoring") `
    "Monitoring directory exists" `
    "Monitoring directory missing"

Test-Result "dashboard.py" `
    (Test-Path "C:\dev\projects\active\agents\monitoring\dashboard.py") `
    "Dashboard script found" `
    "Dashboard script missing"

# 6. DATABASE CONNECTIVITY
Write-Host "`n[6/8] DATABASE CONNECTIVITY" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor DarkGray

# Test Python SQLite connectivity
Write-Host -NoNewline "Testing database connectivity... "
$dbTest = python .claude/test_db_connectivity.py 2>&1

$dbSuccess = $dbTest -match "SUCCESS"
Test-Result "Database Connectivity" `
    $dbSuccess `
    "$dbTest" `
    "Database connection failed: $dbTest"

# 7. AGENT LEARNING INTEGRATION
Write-Host "`n[7/8] AGENT LEARNING INTEGRATION" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor DarkGray

# Test learning adapter
Write-Host -NoNewline "Testing learning adapter... "
$adapterTest = python -c "
import sys
sys.path.append(r'C:\dev\projects\active\agents')
try:
    from learning_adapter import LearningAdapter
    adapter = LearningAdapter()
    print('SUCCESS: Learning adapter initialized')
except Exception as e:
    print(f'ERROR: {e}')
" 2>&1

$adapterSuccess = $adapterTest -match "SUCCESS"
Test-Result "Learning Adapter" `
    $adapterSuccess `
    "Adapter initialized successfully" `
    "Adapter initialization failed"

# 8. AGENT DEFINITIONS
Write-Host "`n[8/8] AGENT DEFINITIONS" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor DarkGray

# Check agent definitions
if (Test-Path "C:\dev\projects\active\agents\agent_definitions.json") {
    $agentDefs = Get-Content "C:\dev\projects\active\agents\agent_definitions.json" -Raw | ConvertFrom-Json
    $agentCount = ($agentDefs.agents | Get-Member -MemberType NoteProperty).Count

    Test-Result "Agent Definitions Count" `
        ($agentCount -gt 0) `
        "$agentCount agents defined" `
        "No agents defined"

    # List available agents
    if ($agentCount -gt 0) {
        Write-Host "`n  Available Agents:" -ForegroundColor Cyan
        $agentDefs.agents | Get-Member -MemberType NoteProperty | ForEach-Object {
            $agentName = $_.Name
            $agent = $agentDefs.agents.$agentName
            Write-Host "    - $agentName" -ForegroundColor White -NoNewline
            Write-Host " ($($agent.type)): $($agent.description)" -ForegroundColor DarkGray
        }
    }
}

# PERFORMANCE METRICS
Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host " PERFORMANCE METRICS" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Check learning database metrics
$metrics = python .claude/test_performance_metrics.py 2>&1

if ($metrics -notmatch "ERROR") {
    Write-Host $metrics -ForegroundColor Green
}

# SUMMARY
Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host " VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }

Write-Host "`nTests Run: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Gray" })
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

# Status determination
Write-Host "`n=========================================================" -ForegroundColor Cyan
if ($successRate -ge 90) {
    Write-Host " STATUS: AGENT SYSTEM FULLY OPERATIONAL" -ForegroundColor Green
    Write-Host " Learning system integrated and tracking performance!" -ForegroundColor Green
    Write-Host " YOLO MODE agents ready for automated tasks!" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host " STATUS: PARTIALLY OPERATIONAL" -ForegroundColor Yellow
    Write-Host " Most features working, some issues detected" -ForegroundColor Yellow
} else {
    Write-Host " STATUS: NEEDS ATTENTION" -ForegroundColor Red
    Write-Host " Several critical features need fixing" -ForegroundColor Red
}
Write-Host "=========================================================" -ForegroundColor Cyan

# Quick Commands
Write-Host "`nQUICK COMMANDS:" -ForegroundColor Yellow
Write-Host "- View Dashboard: " -NoNewline
Write-Host "python projects\active\agents\monitoring\dashboard.py" -ForegroundColor Cyan
Write-Host "- Launch Agent: " -NoNewline
Write-Host "python projects\active\agents\agent_launcher.py" -ForegroundColor Cyan
Write-Host "- Test YOLO Mode: " -NoNewline
Write-Host "python projects\active\agents\yolo_mode.py" -ForegroundColor Cyan
Write-Host "- Check Learning DB: " -NoNewline
Write-Host "sqlite3 D:\learning-system\agent_learning.db" -ForegroundColor Cyan

Write-Host "`nRun this test anytime with: " -NoNewline -ForegroundColor DarkGray
Write-Host "powershell .claude\validate-agent-system.ps1" -ForegroundColor White