#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Monorepo Parallel Orchestration System
    Execute multiple projects simultaneously with intelligent resource management

.DESCRIPTION
    This script provides a unified interface for running multiple projects in parallel
    within the monorepo. It leverages existing infrastructure including workspace-manager,
    auto-watch, and the enhanced hook system for intelligent orchestration.

.PARAMETER Group
    Predefined project group to execute (full-stack, trading, desktop, web-apps, testing, dev)

.PARAMETER Projects
    Specific projects to run in parallel

.PARAMETER Watch
    Enable file watching and auto-restart

.PARAMETER Dashboard
    Open monitoring dashboard in browser

.PARAMETER LogLevel
    Logging verbosity (Quiet, Normal, Verbose, Debug)

.EXAMPLE
    .\Start-ParallelMonorepo.ps1 -Group dev
    Start the default development group (root, crypto, vibe)

.EXAMPLE
    .\Start-ParallelMonorepo.ps1 -Group full-stack -Watch
    Start full-stack group with file watching

.EXAMPLE
    .\Start-ParallelMonorepo.ps1 -Projects @("root", "crypto") -Dashboard
    Start specific projects and open monitoring dashboard
#>

[CmdletBinding()]
param(
    [ValidateSet("full-stack", "trading", "desktop", "web-apps", "testing", "dev")]
    [string]$Group = "dev",

    [string[]]$Projects = @(),

    [switch]$Watch,

    [switch]$Dashboard,

    [ValidateSet("Quiet", "Normal", "Verbose", "Debug")]
    [string]$LogLevel = "Normal",

    [switch]$NoMemoryIntegration,

    [switch]$AutoQuality,

    [int]$MaxParallel = 5
)

# Set strict mode for reliability
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Load configuration
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootPath = Split-Path -Parent $ScriptPath

# Import workspace manager functions
. "$ScriptPath\workspace-manager.ps1" -Action status | Out-Null

# Configuration with database integration
$Global:OrchestrationConfig = @{
    MaxConcurrentProjects = $MaxParallel
    PortAllocationStart = 3000
    HealthCheckInterval = 30
    AutoRestartOnFailure = $true
    LogPath = "$RootPath\logs\parallel"
    MemoryBankPath = "$RootPath\projects\active\web-apps\memory-bank"
    DatabasePaths = @{
        "main" = "D:\databases\database.db"
        "vibe-tech" = "D:\vibe-tech-data\vibetech.db"
        "memory" = "$RootPath\projects\active\web-apps\memory-bank\long_term\memory.db"
        "trading" = "$RootPath\projects\crypto-enhanced\trading.db"
    }
}

# Ensure log directory exists
if (-not (Test-Path $Global:OrchestrationConfig.LogPath)) {
    New-Item -ItemType Directory -Path $Global:OrchestrationConfig.LogPath -Force | Out-Null
}

# Logging function
function Write-OrchestratorLog {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Component = "ORCHESTRATOR"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $logMessage = "[$timestamp] [$Level] [$Component] $Message"

    # Console output based on log level
    $shouldOutput = $false
    switch ($LogLevel) {
        "Quiet" { $shouldOutput = ($Level -eq "ERROR") }
        "Normal" { $shouldOutput = ($Level -in @("ERROR", "WARN", "INFO")) }
        "Verbose" { $shouldOutput = ($Level -ne "DEBUG") }
        "Debug" { $shouldOutput = $true }
    }

    if ($shouldOutput) {
        switch ($Level) {
            "ERROR" { Write-Host $logMessage -ForegroundColor Red }
            "WARN"  { Write-Host $logMessage -ForegroundColor Yellow }
            "INFO"  { Write-Host $logMessage -ForegroundColor Green }
            "SUCCESS" { Write-Host $logMessage -ForegroundColor Cyan }
            "DEBUG" { Write-Host $logMessage -ForegroundColor DarkGray }
            default { Write-Host $logMessage }
        }
    }

    # File logging
    $logFile = Join-Path $Global:OrchestrationConfig.LogPath "orchestrator-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $logFile -Value $logMessage
}

# Health check function
function Test-ProjectHealth {
    param([string]$ProjectName)

    $job = $Global:ParallelJobs[$ProjectName]
    if (-not $job) {
        return @{ Healthy = $false; Reason = "Job not found" }
    }

    if ($job.State -ne "Running") {
        return @{ Healthy = $false; Reason = "Job state: $($job.State)" }
    }

    # Check port if applicable
    $port = $Global:ServicePorts[$ProjectName]
    if ($port) {
        $portAvailable = -not (Test-PortAvailable $port)
        if (-not $portAvailable) {
            return @{ Healthy = $false; Reason = "Port $port not responding" }
        }
    }

    return @{ Healthy = $true; Reason = "Running normally" }
}

# Database health check function
function Test-DatabaseHealth {
    Write-OrchestratorLog "Checking database connectivity..." "INFO"

    $allHealthy = $true
    foreach ($dbName in $Global:OrchestrationConfig.DatabasePaths.Keys) {
        $dbPath = $Global:OrchestrationConfig.DatabasePaths[$dbName]

        if (Test-Path $dbPath) {
            try {
                $size = [math]::Round((Get-Item $dbPath).Length / 1MB, 2)
                Write-OrchestratorLog "[$dbName] Database OK - Size: ${size}MB - Path: $dbPath" "SUCCESS"

                # Apply SQLite performance optimizations if available
                if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
                    & sqlite3 $dbPath "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA temp_store=MEMORY;" 2>$null
                }
            } catch {
                Write-OrchestratorLog "[$dbName] Database error: $($_.Exception.Message)" "ERROR"
                $allHealthy = $false
            }
        } else {
            # Create directory if it doesn't exist (except for D:\ drive databases)
            if ($dbPath -notlike "D:\*") {
                $dbDir = Split-Path $dbPath -Parent
                if (-not (Test-Path $dbDir)) {
                    New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
                    Write-OrchestratorLog "[$dbName] Created database directory: $dbDir" "INFO"
                }
            } else {
                Write-OrchestratorLog "[$dbName] Database not found: $dbPath" "WARN"
            }
        }
    }

    return $allHealthy
}

# Memory integration
function Initialize-MemoryIntegration {
    if ($NoMemoryIntegration) {
        Write-OrchestratorLog "Memory integration disabled" "INFO"
        return
    }

    $memoryCliPath = Join-Path $Global:OrchestrationConfig.MemoryBankPath "memory_system_cli.py"
    if (Test-Path $memoryCliPath) {
        Write-OrchestratorLog "Initializing memory integration..." "INFO"

        try {
            $initResult = & python $memoryCliPath init 2>&1
            Write-OrchestratorLog "Memory integration ready" "SUCCESS"

            # Store orchestration context
            $context = @{
                timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                projects = if ($Projects.Count -gt 0) { $Projects } else { $Global:ProjectGroups[$Group] }
                group = $Group
                options = @{
                    watch = $Watch.IsPresent
                    dashboard = $Dashboard.IsPresent
                    autoQuality = $AutoQuality.IsPresent
                }
            } | ConvertTo-Json

            $contextFile = Join-Path $Global:OrchestrationConfig.MemoryBankPath "short_term\orchestration_context.json"
            Set-Content -Path $contextFile -Value $context

        } catch {
            Write-OrchestratorLog "Memory integration failed: $($_.Exception.Message)" "WARN"
        }
    } else {
        Write-OrchestratorLog "Memory bank not found, continuing without integration" "DEBUG"
    }
}

# Dashboard launcher
function Start-MonitoringDashboard {
    Write-OrchestratorLog "Starting monitoring dashboard..." "INFO"

    # Check if monitoring service is available
    $monitoringPath = Join-Path $Global:OrchestrationConfig.MemoryBankPath "monitoring_service.py"
    if (Test-Path $monitoringPath) {
        $monitorJob = Start-Job -Name "MonoRepo-Dashboard" -ScriptBlock {
            param($Path)
            Set-Location (Split-Path $Path -Parent)
            python (Split-Path $Path -Leaf)
        } -ArgumentList $monitoringPath

        $Global:ParallelJobs["monitoring-dashboard"] = $monitorJob

        # Wait for service to start
        Start-Sleep -Seconds 3

        # Open dashboard in browser
        Start-Process "http://localhost:8765"
        Write-OrchestratorLog "Dashboard available at http://localhost:8765" "SUCCESS"
    } else {
        Write-OrchestratorLog "Monitoring service not found" "WARN"
    }
}

# Auto quality checker
function Start-AutoQualityMonitor {
    if (-not $AutoQuality) {
        return
    }

    Write-OrchestratorLog "Starting auto quality monitor..." "INFO"

    $qualityJob = Start-Job -Name "MonoRepo-Quality" -ScriptBlock {
        param($RootPath, $Interval)
        while ($true) {
            Start-Sleep -Seconds $Interval
            Set-Location $RootPath
            & npm run quality:fix --silent
        }
    } -ArgumentList $RootPath, 300 # Run every 5 minutes

    $Global:ParallelJobs["quality-monitor"] = $qualityJob
    Write-OrchestratorLog "Auto quality checks enabled (5-minute interval)" "SUCCESS"
}

# File watcher integration
function Start-FileWatcher {
    if (-not $Watch) {
        return
    }

    Write-OrchestratorLog "Starting file watcher..." "INFO"

    $watchProjects = if ($Projects.Count -gt 0) { $Projects } else { $Global:ProjectGroups[$Group] }

    $watcherJob = Start-Job -Name "MonoRepo-Watcher" -ScriptBlock {
        param($ScriptPath, $Projects)
        & "$ScriptPath\auto-watch.ps1" -Projects $Projects -IncludeTests
    } -ArgumentList $ScriptPath, $watchProjects

    $Global:ParallelJobs["file-watcher"] = $watcherJob
    Write-OrchestratorLog "File watching enabled for: $($watchProjects -join ', ')" "SUCCESS"
}

# Main orchestration function
function Start-Orchestration {
    Write-Host @"

╔══════════════════════════════════════════════╗
║     Monorepo Parallel Orchestration System    ║
║            Production-Grade Execution          ║
╚══════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-OrchestratorLog "Starting orchestration..." "INFO"
    Write-OrchestratorLog "Configuration: Group=$Group, Watch=$Watch, Dashboard=$Dashboard" "DEBUG"

    # Initialize subsystems
    Initialize-MemoryIntegration

    # Check database connectivity
    $dbHealthy = Test-DatabaseHealth
    if (-not $dbHealthy) {
        Write-OrchestratorLog "Some databases are not available, but continuing with orchestration" "WARN"
    }

    # Determine projects to start
    $projectsToStart = if ($Projects.Count -gt 0) {
        $Projects
    } else {
        $Global:ProjectGroups[$Group]
    }

    Write-OrchestratorLog "Projects to start: $($projectsToStart -join ', ')" "INFO"

    # Check for running instances
    if ($Global:ParallelJobs.Count -gt 0) {
        Write-OrchestratorLog "Found existing parallel jobs" "WARN"
        Write-Host "Existing jobs detected. Stop them first? (Y/N): " -NoNewline -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq 'Y') {
            Stop-ParallelEnvironment
        }
    }

    # Start projects with intelligent sequencing
    $startupSequence = @{
        "backend" = @()                    # No dependencies
        "memory-bank" = @()                # No dependencies
        "crypto" = @()                      # No dependencies
        "root" = @("backend")               # Depends on backend
        "vibe-lovable" = @("backend")       # Depends on backend
    }

    $started = @()
    $maxAttempts = 3
    $attempts = 0

    while ($started.Count -lt $projectsToStart.Count -and $attempts -lt $maxAttempts) {
        foreach ($project in $projectsToStart) {
            if ($project -in $started) {
                continue
            }

            # Check dependencies
            $deps = $startupSequence[$project]
            $depsReady = $true
            if ($deps) {
                foreach ($dep in $deps) {
                    if ($dep -in $projectsToStart -and $dep -notin $started) {
                        $depsReady = $false
                        break
                    }
                }
            }

            if ($depsReady) {
                Write-OrchestratorLog "Starting $project..." "INFO"
                Start-ParallelProject -ProjectName $project
                $started += $project
                Start-Sleep -Milliseconds 1000 # Stagger startups
            }
        }
        $attempts++
    }

    # Start auxiliary services
    if ($Watch) { Start-FileWatcher }
    if ($Dashboard) { Start-MonitoringDashboard }
    if ($AutoQuality) { Start-AutoQualityMonitor }

    # Show final status
    Show-ParallelStatus

    Write-Host @"

╔══════════════════════════════════════════════╗
║           Orchestration Complete!             ║
╚══════════════════════════════════════════════╝

Available Commands:
  Show-ParallelStatus       - View all running services
  Watch-ParallelLogs -All   - Monitor all logs
  Stop-ParallelEnvironment  - Stop all services

Tips:
  • Press Ctrl+C to stop this session
  • Logs are available in: $($Global:OrchestrationConfig.LogPath)
  • Memory context saved for future optimization

"@ -ForegroundColor Green
}

# Health monitoring loop
function Start-HealthMonitor {
    Write-OrchestratorLog "Starting health monitor..." "INFO"

    $monitorJob = Start-Job -Name "MonoRepo-HealthMonitor" -ScriptBlock {
        param($Interval)
        while ($true) {
            Start-Sleep -Seconds $Interval

            foreach ($kvp in $Global:ParallelJobs.GetEnumerator()) {
                $projectName = $kvp.Key
                $health = Test-ProjectHealth -ProjectName $projectName

                if (-not $health.Healthy -and $Global:OrchestrationConfig.AutoRestartOnFailure) {
                    Write-Host "[$projectName] Unhealthy: $($health.Reason), restarting..." -ForegroundColor Yellow

                    # Stop the unhealthy job
                    Stop-Job -Job $kvp.Value -ErrorAction SilentlyContinue
                    Remove-Job -Job $kvp.Value -ErrorAction SilentlyContinue

                    # Restart it
                    Start-ParallelProject -ProjectName $projectName
                }
            }
        }
    } -ArgumentList $Global:OrchestrationConfig.HealthCheckInterval

    $Global:ParallelJobs["health-monitor"] = $monitorJob
}

# Graceful shutdown handler
function Stop-Orchestration {
    Write-OrchestratorLog "Shutting down orchestration..." "WARN"

    # Save session state to memory bank
    if (-not $NoMemoryIntegration) {
        $sessionState = @{
            endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            projects = $Global:ParallelJobs.Keys
            duration = ((Get-Date) - $script:StartTime).TotalMinutes
        } | ConvertTo-Json

        $stateFile = Join-Path $Global:OrchestrationConfig.MemoryBankPath "short_term\last_session.json"
        Set-Content -Path $stateFile -Value $sessionState -ErrorAction SilentlyContinue
    }

    # Stop all jobs
    Stop-ParallelEnvironment

    Write-OrchestratorLog "Orchestration stopped" "SUCCESS"
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-Orchestration
}

# Trap Ctrl+C
[Console]::TreatControlCAsInput = $false
$null = Register-EngineEvent -SourceIdentifier "ControlC" -Action {
    Write-Host "`nReceived shutdown signal..." -ForegroundColor Yellow
    Stop-Orchestration
    exit 0
}

# Script entry point
try {
    $script:StartTime = Get-Date

    # Start orchestration
    Start-Orchestration

    # Start health monitoring
    Start-HealthMonitor

    # Keep script running for monitoring
    Write-OrchestratorLog "Orchestrator ready. Press Ctrl+C to stop." "SUCCESS"

    while ($true) {
        Start-Sleep -Seconds 5

        # Check for failed jobs and report
        foreach ($kvp in $Global:ParallelJobs.GetEnumerator()) {
            if ($kvp.Value.State -eq "Failed") {
                $error = Receive-Job -Job $kvp.Value -ErrorAction SilentlyContinue
                if ($error) {
                    Write-OrchestratorLog "[$($kvp.Key)] Error: $error" "ERROR"
                }
            }
        }
    }
} catch {
    Write-OrchestratorLog "Fatal error: $($_.Exception.Message)" "ERROR"
    Write-OrchestratorLog "Stack trace: $($_.ScriptStackTrace)" "DEBUG"
    Stop-Orchestration
    exit 1
} finally {
    # Cleanup
    [Console]::TreatControlCAsInput = $false
}