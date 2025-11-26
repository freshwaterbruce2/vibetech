# Workspace Manager - Central control for monorepo operations
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("status", "install", "clean", "dev", "build", "test", "health", "parallel")]
    [string]$Action,

    [string]$Project,
    [switch]$All,
    [switch]$Parallel,
    [string[]]$ProjectGroup = @()
)

# Load workspace configuration
$workspaceConfig = Get-Content "workspace.json" | ConvertFrom-Json

# Project Groups for Parallel Execution
$Global:ProjectGroups = @{
    "full-stack" = @("root", "backend", "memory-bank")
    "trading"    = @("crypto", "monitoring")
    "desktop"    = @("nova-agent", "taskmaster", "opcode")
    "web-apps"   = @("hotel-booking", "digital-content", "shipping-pwa", "vibe-lovable")
    "testing"    = @("root-test", "crypto-test", "vibe-test")
    "dev"        = @("root", "crypto", "vibe-lovable")
}

# Global job tracking for parallel execution
$Global:ParallelJobs = @{}
$Global:ServicePorts = @{
    "root"                  = 5173
    "backend"               = 3001
    "crypto"                = 8000
    "vibe-lovable-frontend" = 8080
    "vibe-lovable-backend"  = 9001
    "nova-agent"            = 3000
    "hotel-booking"         = 5174
    "digital-content"       = 3002
    "shipping-pwa"          = 5175
    "memory-bank"           = 8765
}

# Database configuration with 2025 best practices
$Global:DatabaseConfig = @{
    "main"        = @{
        "path"        = "D:\databases\database.db"
        "type"        = "SQLite"
        "description" = "Main unified database"
        "pragmas"     = @("journal_mode=WAL", "foreign_keys=ON", "temp_store=MEMORY", "synchronous=NORMAL")
    }
    "vibe-tech"   = @{
        "path"        = "D:\vibe-tech-data\vibetech.db"
        "type"        = "SQLite"
        "description" = "Vibe-Tech application database"
        "pragmas"     = @("journal_mode=WAL", "foreign_keys=ON", "temp_store=MEMORY")
    }
    "trading"     = @{
        "path"        = "projects\crypto-enhanced\trading.db"
        "type"        = "SQLite"
        "description" = "Crypto trading database"
        "pragmas"     = @("journal_mode=WAL", "foreign_keys=ON", "busy_timeout=10000")
    }
    "memory-bank" = @{
        "path"        = "projects\active\web-apps\memory-bank\long_term\memory.db"
        "type"        = "SQLite"
        "description" = "Memory system database"
        "pragmas"     = @("journal_mode=WAL", "foreign_keys=ON", "cache_size=10000")
    }
}

# Test database connectivity with 2025 best practices
function Test-DatabaseConnectivity {
    param([string]$DatabaseKey = "all")

    Write-Host "`n[DATABASE] Testing Database Connectivity" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    $databases = if ($DatabaseKey -eq "all") {
        $Global:DatabaseConfig.Keys
    }
    else {
        @($DatabaseKey)
    }

    $results = @()
    foreach ($db in $databases) {
        $config = $Global:DatabaseConfig[$db]
        $fullPath = if ($config.path -like "*:*") { $config.path } else { Join-Path $PWD $config.path }

        Write-Host "`n[$db] Database" -ForegroundColor Yellow
        Write-Host "  Path: $($config.path)" -ForegroundColor White
        Write-Host "  Type: $($config.type)" -ForegroundColor White

        $dbResult = @{
            Name   = $db
            Path   = $fullPath
            Status = "Unknown"
            Size   = 0
            Tables = 0
        }

        if (Test-Path $fullPath) {
            try {
                $size = (Get-Item $fullPath).Length / 1MB
                $dbResult.Size = [math]::Round($size, 2)
                Write-Host "  Status: [OK] Connected" -ForegroundColor Green
                Write-Host "  Size: $($dbResult.Size) MB" -ForegroundColor White
                $dbResult.Status = "Connected"

                # Test SQLite connectivity and apply pragmas if sqlite3 is available
                if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
                    # Apply performance pragmas (2025 best practices)
                    if ($config.pragmas) {
                        foreach ($pragma in $config.pragmas) {
                            & sqlite3 $fullPath "PRAGMA $pragma;" 2>$null
                        }
                        Write-Host "  Pragmas: Applied ($($config.pragmas -join ', '))" -ForegroundColor DarkGray
                    }

                    # Get table count
                    $tables = & sqlite3 $fullPath ".tables" 2>$null
                    if ($tables) {
                        $tableList = ($tables -split '\s+' | Where-Object { $_ })
                        $dbResult.Tables = $tableList.Count
                        Write-Host "  Tables: $($dbResult.Tables) found" -ForegroundColor White
                    }
                }
            }
            catch {
                Write-Host "  Status: [WARN] File exists but cannot read" -ForegroundColor Yellow
                Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
                $dbResult.Status = "Error"
            }
        }
        else {
            Write-Host "  Status: [ERROR] Not found" -ForegroundColor Red
            $dbResult.Status = "NotFound"
        }

        $results += $dbResult
    }

    return $results
}

function Show-WorkspaceStatus {
    Write-Host "[WORKSPACE] Monorepo Workspace Status" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan

    # Root project status
    Write-Host "[ROOT] Root Project (vibe-tech-lovable)" -ForegroundColor Green
    Write-Host "  Type: React/TypeScript + Vite" -ForegroundColor White
    Write-Host "  Port: 5173" -ForegroundColor White
    Write-Host "  Status: $(if (Test-Path 'node_modules') { '[OK] Dependencies installed' } else { '[ERROR] Run pnpm install' })" -ForegroundColor $(if (Test-Path 'node_modules') { 'Green' } else { 'Red' })

    # Crypto trading system
    Write-Host "`n[CRYPTO] Crypto Enhanced Trading System" -ForegroundColor Green
    Write-Host "  Type: Python" -ForegroundColor White
    Write-Host "  Location: projects/crypto-enhanced" -ForegroundColor White
    $venvExists = Test-Path "projects/crypto-enhanced/.venv"
    Write-Host "  Status: $(if ($venvExists) { '[OK] Virtual environment ready' } else { '[ERROR] Run crypto:install' })" -ForegroundColor $(if ($venvExists) { 'Green' } else { 'Red' })

    # Vibe-Tech Lovable project
    if (Test-Path "projects/active/web-apps/vibe-tech-lovable") {
        Write-Host "`n[VIBE] Vibe-Tech Lovable" -ForegroundColor Green
        Write-Host "  Type: React + Node.js/Express" -ForegroundColor White
        Write-Host "  Frontend Port: 8080" -ForegroundColor White
        Write-Host "  Backend Port: 9001" -ForegroundColor White
        $frontendDeps = Test-Path "projects/active/web-apps/vibe-tech-lovable/node_modules"
        $backendDeps = Test-Path "projects/active/web-apps/vibe-tech-lovable/backend/node_modules"
        Write-Host "  Frontend: $(if ($frontendDeps) { '[OK] Ready' } else { '[ERROR] Needs setup' })" -ForegroundColor $(if ($frontendDeps) { 'Green' } else { 'Red' })
        Write-Host "  Backend: $(if ($backendDeps) { '[OK] Ready' } else { '[ERROR] Needs setup' })" -ForegroundColor $(if ($backendDeps) { 'Green' } else { 'Red' })
    }
}

function Install-WorkspaceProjects {
    Write-Host "[INSTALL] Installing workspace dependencies..." -ForegroundColor Blue

    if ($All -or $Project -eq "root" -or -not $Project) {
        Write-Host "[SETUP] Installing root dependencies..." -ForegroundColor Yellow
        pnpm install
    }

    if ($All -or $Project -eq "crypto") {
        Write-Host "[SETUP] Setting up crypto trading system..." -ForegroundColor Yellow
        Push-Location "projects/crypto-enhanced"
        try {
            python -m venv .venv
            .\.venv\Scripts\pip install -r requirements.txt
            Write-Host "[OK] Crypto system ready" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERROR] Failed to setup crypto system" -ForegroundColor Red
        }
        finally {
            Pop-Location
        }
    }
}

function Start-DevEnvironment {
    Write-Host "[START] Starting development environment..." -ForegroundColor Blue

    if ($Project -eq "root" -or -not $Project) {
        Write-Host "Starting root dev server (port 5173)..." -ForegroundColor Yellow
        Start-Process "pnpm" -ArgumentList "run", "dev"
    }

    if ($Project -eq "crypto") {
        Write-Host "Starting crypto trading system..." -ForegroundColor Yellow
        Push-Location "projects/crypto-enhanced"
        Start-Process ".\.venv\Scripts\python.exe" -ArgumentList "start_live_trading.py"
        Pop-Location
    }

    if ($Project -eq "vibe-lovable") {
        Write-Host "Starting Vibe-Tech Lovable..." -ForegroundColor Yellow
        Push-Location "projects/active/web-apps/vibe-tech-lovable"
        Start-Process "pnpm" -ArgumentList "run", "dev"
        Push-Location "backend"
        Start-Process "pnpm" -ArgumentList "run", "dev"
        Pop-Location
        Pop-Location
    }
}

function Test-WorkspaceHealth {
    Write-Host "[HEALTH] Running workspace health checks..." -ForegroundColor Blue

    # Database connectivity check (2025 best practice: verify data layer first)
    Write-Host "`nChecking database connectivity..." -ForegroundColor Yellow
    $dbResults = Test-DatabaseConnectivity
    $failedDbs = $dbResults | Where-Object { $_.Status -eq "NotFound" -or $_.Status -eq "Error" }
    if ($failedDbs.Count -gt 0) {
        Write-Host "[WARN] Database issues detected:" -ForegroundColor Yellow
        foreach ($db in $failedDbs) {
            Write-Host "  - $($db.Name): $($db.Status)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "[OK] All databases connected successfully" -ForegroundColor Green
    }

    # Root project health
    Write-Host "`nChecking root project..." -ForegroundColor Yellow
    pnpm run quality

    # Crypto system health
    if (Test-Path "projects/crypto-enhanced/.venv") {
        Write-Host "`nChecking crypto trading system..." -ForegroundColor Yellow
        Push-Location "projects/crypto-enhanced"
        .\.venv\Scripts\python.exe run_tests.py
        Pop-Location
    }
    else {
        Write-Host "[WARN] Crypto system not installed" -ForegroundColor Yellow
    }

    # Memory system health
    $memoryPath = "projects/active/web-apps/memory-bank"
    if (Test-Path "$memoryPath\monitoring_service.py") {
        Write-Host "`nChecking memory system..." -ForegroundColor Yellow
        Push-Location $memoryPath
        try {
            python -c "import monitoring_service; print('[OK] Memory system modules loaded')" 2>$null
        }
        catch {
            Write-Host "[WARN] Memory system check failed" -ForegroundColor Yellow
        }
        Pop-Location
    }
}

# Parallel Execution Functions
function Test-PortAvailable {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return -not $connection
    }
    catch {
        return $true
    }
}

function Start-ParallelProject {
    param(
        [string]$ProjectName,
        [hashtable]$Config = @{}
    )

    Write-Host "[START] Starting $ProjectName..." -ForegroundColor Yellow

    $job = $null
    switch ($ProjectName) {
        "root" {
            if (Test-PortAvailable 5173) {
                $job = Start-Job -Name "MonoRepo-Root" -ScriptBlock {
                    Set-Location $using:PWD
                    pnpm run dev
                }
            }
            else {
                else {
                    Write-Host "[WARN] Port 5173 already in use for root project" -ForegroundColor Yellow
                }
            }
            "backend" {
                if (Test-PortAvailable 3001) {
                    $job = Start-Job -Name "MonoRepo-Backend" -ScriptBlock {
                        Set-Location "$using:PWD\backend"
                        pnpm start
                    }
                }
                else {
                    else {
                        Write-Host "[WARN] Port 3001 already in use for backend" -ForegroundColor Yellow
                    }
                }
                "crypto" {
                    $cryptoPath = "projects/crypto-enhanced"
                    if ((Test-Path "$cryptoPath\.venv") -and (Test-PortAvailable 8000)) {
                        $job = Start-Job -Name "MonoRepo-Crypto" -ScriptBlock {
                            Set-Location "$using:PWD\projects\crypto-enhanced"
                            .\.venv\Scripts\python.exe start_live_trading.py
                        }
                    }
                    else {
                        Write-Host "[WARN] Crypto system not ready or port 8000 in use" -ForegroundColor Yellow
                    }
                }
                "vibe-lovable" {
                    # Start both frontend and backend for Vibe
                    $vibePath = "projects/active/web-apps/vibe-tech-lovable"
                    if (Test-Path $vibePath) {
                        # Frontend
                        if (Test-PortAvailable 8080) {
                            $feJob = Start-Job -Name "MonoRepo-Vibe-Frontend" -ScriptBlock {
                                Set-Location "$using:PWD\$using:vibePath"
                                pnpm run dev
                            }
                            $Global:ParallelJobs["vibe-lovable-frontend"] = $feJob
                        }

                        # Backend
                        if (Test-PortAvailable 9001) {
                            $beJob = Start-Job -Name "MonoRepo-Vibe-Backend" -ScriptBlock {
                                Set-Location "$using:PWD\$using:vibePath\backend"
                                pnpm run dev
                            }
                            $Global:ParallelJobs["vibe-lovable-backend"] = $beJob
                        }
                        return # Early return since we handle two jobs
                    }
                }
                "memory-bank" {
                    $memoryPath = "projects/active/web-apps/memory-bank"
                    if (Test-Path "$memoryPath\monitoring_service.py") {
                        $job = Start-Job -Name "MonoRepo-MemoryBank" -ScriptBlock {
                            Set-Location "$using:PWD\$using:memoryPath"
                            python monitoring_service.py
                        }
                    }
                }
                "monitoring" {
                    Write-Host "Starting monitoring dashboard..." -ForegroundColor Yellow
                    $job = Start-Job -Name "MonoRepo-Monitoring" -ScriptBlock {
                        Set-Location $using:PWD
                        # Start monitoring service
                        & "$using:PWD\scripts\auto-watch.ps1" -Projects @("root", "crypto") -Verbose
                    }
                }
                default {
                    Write-Host "[ERROR] Unknown project: $ProjectName" -ForegroundColor Red
                }
            }

            if ($job) {
                $Global:ParallelJobs[$ProjectName] = $job
                Write-Host "[OK] $ProjectName started (Job ID: $($job.Id))" -ForegroundColor Green
            }

            return $job
        }

        function Start-ParallelEnvironment {
            param(
                [string[]]$Projects = @()
            )

            Write-Host "`n[PARALLEL] Starting Parallel Execution Environment" -ForegroundColor Cyan
            Write-Host "==========================================" -ForegroundColor Cyan

            # Determine which projects to start
            $projectsToStart = @()

            if ($Projects.Count -eq 0 -and $ProjectGroup.Count -gt 0) {
                # Use project groups
                foreach ($group in $ProjectGroup) {
                    if ($Global:ProjectGroups.ContainsKey($group)) {
                        $projectsToStart += $Global:ProjectGroups[$group]
                        Write-Host "[GROUP] Loading group '$group': $($Global:ProjectGroups[$group] -join ', ')" -ForegroundColor Blue
                    }
                    else {
                        Write-Host "[WARN] Unknown project group: $group" -ForegroundColor Yellow
                    }
                }
            }
            elseif ($Projects.Count -gt 0) {
                $projectsToStart = $Projects
            }
            else {
                # Default to dev group
                $projectsToStart = $Global:ProjectGroups["dev"]
                Write-Host "[DEFAULT] Using default 'dev' group: $($projectsToStart -join ', ')" -ForegroundColor Blue
            }

            # Start projects in parallel
            Write-Host "`nStarting projects in parallel..." -ForegroundColor Cyan
            foreach ($project in $projectsToStart) {
                Start-ParallelProject -ProjectName $project
                Start-Sleep -Milliseconds 500 # Brief delay to avoid port conflicts
            }

            # Show status
            Show-ParallelStatus
        }

        function Show-ParallelStatus {
            Write-Host "`n[STATUS] Parallel Execution Status" -ForegroundColor Cyan
            Write-Host "============================" -ForegroundColor Cyan

            if ($Global:ParallelJobs.Count -eq 0) {
                Write-Host "No parallel jobs running" -ForegroundColor Yellow
                return
            }

            foreach ($kvp in $Global:ParallelJobs.GetEnumerator()) {
                $job = $kvp.Value
                $projectName = $kvp.Key
                $port = $Global:ServicePorts[$projectName]

                $status = switch ($job.State) {
                    "Running" { "[RUNNING]" }
                    "Completed" { "[COMPLETED]" }
                    "Failed" { "[FAILED]" }
                    "Stopped" { "[STOPPED]" }
                    default { "[$($job.State)]" }
                }

                Write-Host "$status - $projectName (Job: $($job.Id))" -NoNewline
                if ($port) {
                    Write-Host " - Port: $port" -NoNewline
                }
                Write-Host ""
            }

            Write-Host "`nUse 'Stop-ParallelEnvironment' to stop all jobs" -ForegroundColor DarkGray
        }

        function Stop-ParallelEnvironment {
            Write-Host "`n[STOP] Stopping Parallel Environment" -ForegroundColor Red
            Write-Host "================================" -ForegroundColor Red

            foreach ($kvp in $Global:ParallelJobs.GetEnumerator()) {
                $job = $kvp.Value
                $projectName = $kvp.Key

                Write-Host "Stopping $projectName (Job: $($job.Id))..." -ForegroundColor Yellow
                Stop-Job -Job $job -ErrorAction SilentlyContinue
                Remove-Job -Job $job -ErrorAction SilentlyContinue
            }

            $Global:ParallelJobs = @{}
            Write-Host "[OK] All parallel jobs stopped" -ForegroundColor Green
        }

        function Watch-ParallelLogs {
            param(
                [string]$ProjectName = "",
                [switch]$All
            )

            Write-Host "[LOGS] Monitoring Parallel Job Logs" -ForegroundColor Cyan
            Write-Host "===============================" -ForegroundColor Cyan
            Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor DarkGray

            try {
                while ($true) {
                    foreach ($kvp in $Global:ParallelJobs.GetEnumerator()) {
                        $job = $kvp.Value
                        $name = $kvp.Key

                        if (($ProjectName -and $name -ne $ProjectName) -and -not $All) {
                            continue
                        }

                        # Get new output
                        $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
                        if ($output) {
                            Write-Host "[$name]" -ForegroundColor Cyan -NoNewline
                            Write-Host " $output"
                        }
                    }

                    Start-Sleep -Seconds 1
                }
            }
            catch {
                Write-Host "`nLog monitoring stopped" -ForegroundColor Yellow
            }
        }

        # Execute action
        switch ($Action) {
            "status" {
                if ($Parallel) {
                    Show-ParallelStatus
                }
                else {
                    Show-WorkspaceStatus
                }
            }
            "install" { Install-WorkspaceProjects }
            "clean" {
                Write-Host "[CLEAN] Cleaning workspace..." -ForegroundColor Blue
                pnpm run workspace:clean
            }
            "dev" {
                if ($Parallel) {
                    Start-ParallelEnvironment -Projects $ProjectGroup
                }
                else {
                    Start-DevEnvironment
                }
            }
            "build" {
                Write-Host "[BUILD] Building workspace..." -ForegroundColor Blue
                pnpm run build
            }
            "test" {
                Write-Host "[TEST] Testing workspace..." -ForegroundColor Blue
                pnpm run test
            }
            "health" {
                Test-WorkspaceHealth
            }
            "parallel" {
                Start-ParallelEnvironment -Projects $ProjectGroup
            }
        }