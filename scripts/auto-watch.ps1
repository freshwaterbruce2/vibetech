# Intelligent Auto-Watch System
# Monitors all projects and automatically restarts services when files change
param(
    [string[]]$Projects = @("root", "crypto"),
    [int]$DebounceMs = 2000,
    [switch]$IncludeTests,
    [switch]$Verbose
)

$Global:WatchJobs = @()
$Global:ServicePorts = @{
    "root"                  = 5173
    "crypto"                = 8000
    "vibe-lovable-frontend" = 8080
    "vibe-lovable-backend"  = 9001
}

function Write-WatchLog {
    param([string]$Message, [string]$Level = "INFO", [string]$Service = "WATCH")
    $Timestamp = Get-Date -Format "HH:mm:ss.fff"
    $Color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "RESTART" { "Magenta" }
        "INFO" { "Cyan" }
        default { "White" }
    }

    Write-Host "[$Timestamp] [$Service] $Message" -ForegroundColor $Color
}

function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

function Stop-ServiceOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess |
        Get-Process -Id { $_ } -ErrorAction SilentlyContinue

        foreach ($process in $processes) {
            Write-WatchLog "Stopping process $($process.ProcessName) (PID: $($process.Id)) on port $Port" "WARN"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-WatchLog "Could not stop service on port $Port" "ERROR"
    }
}

function Start-RootService {
    Write-WatchLog "Starting root development server..." "INFO" "ROOT"
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        pnpm run dev
    }
    return $job
}

function Start-CryptoService {
    $cryptoPath = "projects/crypto-enhanced"
    if (-not (Test-Path $cryptoPath)) {
        Write-WatchLog "Crypto project not found" "WARN" "CRYPTO"
        return $null
    }

    Write-WatchLog "Starting crypto trading system..." "INFO" "CRYPTO"
    $job = Start-Job -ScriptBlock {
        param($Path)
        Set-Location $Path
        if (Test-Path ".venv") {
            .\.venv\Scripts\python.exe start_live_trading.py
        }
        else {
            Write-Host "Virtual environment not found"
        }
    } -ArgumentList (Join-Path $PWD $cryptoPath)

    return $job
}

function Start-VibeServices {
    $vibePath = "projects/active/web-apps/vibe-tech-lovable"
    if (-not (Test-Path $vibePath)) {
        Write-WatchLog "Vibe-Tech Lovable project not found" "WARN" "VIBE"
        return @()
    }

    $jobs = @()

    # Frontend
    Write-WatchLog "Starting Vibe frontend..." "INFO" "VIBE-FE"
    $feJob = Start-Job -ScriptBlock {
        param($Path)
        Set-Location $Path
        pnpm run dev
    } -ArgumentList (Join-Path $PWD $vibePath)
    $jobs += $feJob

    # Backend
    $backendPath = Join-Path $vibePath "backend"
    if (Test-Path $backendPath) {
        Write-WatchLog "Starting Vibe backend..." "INFO" "VIBE-BE"
        $beJob = Start-Job -ScriptBlock {
            param($Path)
            Set-Location $Path
            pnpm run dev
        } -ArgumentList $backendPath
        $jobs += $beJob
    }

    return $jobs
}

function Watch-FileChanges {
    param([string]$Path, [string[]]$Extensions, [string]$ServiceName)

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $Path
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    # Filter for relevant file types
    $patterns = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.css", "*.scss", "*.py")
    if ($Extensions) { $patterns = $Extensions }

    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $name = $Event.SourceEventArgs.Name
        $changeType = $Event.SourceEventArgs.ChangeType

        # Check if file extension matches our patterns
        $shouldRestart = $false
        foreach ($pattern in $using:patterns) {
            if ($name -like $pattern) {
                $shouldRestart = $true
                break
            }
        }

        if ($shouldRestart -and -not $name.Contains("node_modules") -and -not $name.Contains(".git")) {
            Write-WatchLog "Detected change in $name, scheduling restart..." "RESTART" $using:ServiceName

            # Debounce - wait for multiple changes to settle
            Start-Sleep -Milliseconds $using:DebounceMs

            # Trigger restart
            $Global:RestartQueue += $using:ServiceName
        }
    }

    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
    Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action

    return $watcher
}

function Restart-Service {
    param([string]$ServiceName)

    Write-WatchLog "Restarting $ServiceName service..." "RESTART" $ServiceName

    # Stop existing service
    $port = $Global:ServicePorts[$ServiceName]
    if ($port) {
        Stop-ServiceOnPort $port
    }

    # Stop existing job
    $existingJob = $Global:WatchJobs | Where-Object { $_.Name -eq $ServiceName }
    if ($existingJob) {
        Stop-Job -Job $existingJob -ErrorAction SilentlyContinue
        Remove-Job -Job $existingJob -ErrorAction SilentlyContinue
        $Global:WatchJobs = $Global:WatchJobs | Where-Object { $_.Name -ne $ServiceName }
    }

    # Start new service
    $newJob = switch ($ServiceName) {
        "root" { Start-RootService }
        "crypto" { Start-CryptoService }
        "vibe-frontend" { Start-VibeServices | Select-Object -First 1 }
        "vibe-backend" { Start-VibeServices | Select-Object -Last 1 }
        default { $null }
    }

    if ($newJob) {
        $newJob.Name = $ServiceName
        $Global:WatchJobs += $newJob
        Write-WatchLog "$ServiceName service restarted successfully" "SUCCESS" $ServiceName
    }

    # Run quality check if enabled
    if ($IncludeTests) {
        Start-Job -ScriptBlock {
            Set-Location $using:PWD
            & ".\scripts\auto-quality-check.ps1" -TriggerType "file_change" -QuickMode -Silent
        } | Out-Null
    }
}

# Main execution
Write-WatchLog "🚀 Starting intelligent auto-watch system..." "INFO"
Write-WatchLog "Monitoring projects: $($Projects -join ', ')" "INFO"

# Initialize restart queue
$Global:RestartQueue = @()

# Start initial services
foreach ($project in $Projects) {
    $jobs = switch ($project) {
        "root" { @(Start-RootService) }
        "crypto" { @(Start-CryptoService) }
        "vibe" { Start-VibeServices }
        default { @() }
    }

    foreach ($job in $jobs) {
        if ($job) {
            $job.Name = $project
            $Global:WatchJobs += $job
        }
    }
}

# Setup file watchers
$watchers = @()

if ("root" -in $Projects) {
    $rootWatcher = Watch-FileChanges -Path "." -ServiceName "root"
    $watchers += $rootWatcher
}

if ("crypto" -in $Projects -and (Test-Path "projects/crypto-enhanced")) {
    $cryptoWatcher = Watch-FileChanges -Path "projects/crypto-enhanced" -Extensions @("*.py") -ServiceName "crypto"
    $watchers += $cryptoWatcher
}

# Main monitoring loop
Write-WatchLog "✅ Auto-watch system active. Press Ctrl+C to stop." "SUCCESS"

try {
    while ($true) {
        # Process restart queue
        if ($Global:RestartQueue.Count -gt 0) {
            $toRestart = $Global:RestartQueue | Sort-Object | Get-Unique
            $Global:RestartQueue = @()

            foreach ($service in $toRestart) {
                Restart-Service $service
            }
        }

        # Check job status
        foreach ($job in $Global:WatchJobs) {
            if ($job.State -eq "Failed") {
                Write-WatchLog "Service $($job.Name) failed, restarting..." "ERROR" $job.Name
                Restart-Service $job.Name
            }
        }

        Start-Sleep -Seconds 1
    }
}
catch {
    Write-WatchLog "Watch system interrupted" "WARN"
}
finally {
    # Cleanup
    Write-WatchLog "Cleaning up watchers and jobs..." "INFO"

    foreach ($watcher in $watchers) {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
    }

    foreach ($job in $Global:WatchJobs) {
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue
    }

    Write-WatchLog "🛑 Auto-watch system stopped" "INFO"
}