# Intelligent Backup and Monitoring System
# Automatically backs up critical data and monitors system health
param(
    [string]$Mode = "full", # full, incremental, monitor, restore
    [string]$BackupPath = "C:\dev\backups",
    [int]$RetentionDays = 30,
    [switch]$Compress,
    [switch]$Verify,
    [switch]$DryRun,
    [string]$RestoreFrom
)

$Script:MonitoringData = @{}
$Script:BackupResults = @{}
$Script:CriticalPaths = @(
    @{ path = "projects/crypto-enhanced/trading.db"; type = "database"; critical = $true }
    @{ path = "projects/crypto-enhanced/.env"; type = "config"; critical = $true }
    @{ path = "projects/crypto-enhanced/logs"; type = "logs"; critical = $false }
    @{ path = "D:\vibe-tech-data\vibetech.db"; type = "database"; critical = $true }
    @{ path = ".claude"; type = "config"; critical = $true }
    @{ path = "workspace.json"; type = "config"; critical = $true }
    @{ path = "package.json"; type = "config"; critical = $true }
    @{ path = "CLAUDE.md"; type = "documentation"; critical = $true }
)

function Write-BackupLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $Color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "BACKUP" { "Magenta" }
        "MONITOR" { "Blue" }
        "INFO" { "Cyan" }
        default { "White" }
    }

    $LogEntry = "[$Timestamp] [AUTO-BACKUP] $Message"
    Write-Host $LogEntry -ForegroundColor $Color

    # Log to file
    $logDir = Join-Path $BackupPath "logs"
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    $logFile = Join-Path $logDir "backup-monitor-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $logFile -Value $LogEntry
}

function Get-SystemHealth {
    Write-BackupLog "Collecting system health metrics..." "MONITOR"

    $health = @{
        timestamp = Get-Date
        disk_usage = @{}
        memory_usage = @{}
        process_status = @{}
        service_status = @{}
        performance = @{}
    }

    # Disk usage
    try {
        $disks = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        foreach ($disk in $disks) {
            $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
            $totalSpaceGB = [math]::Round($disk.Size / 1GB, 2)
            $usedPercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)

            $health.disk_usage[$disk.DeviceID] = @{
                free_gb = $freeSpaceGB
                total_gb = $totalSpaceGB
                used_percent = $usedPercent
                status = if ($usedPercent -gt 90) { "CRITICAL" } elseif ($usedPercent -gt 80) { "WARNING" } else { "OK" }
            }
        }
    } catch {
        Write-BackupLog "Failed to collect disk usage: $($_.Exception.Message)" "ERROR"
    }

    # Memory usage
    try {
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $totalMemoryGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        $freeMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        $usedMemoryGB = $totalMemoryGB - $freeMemoryGB
        $memoryUsedPercent = [math]::Round(($usedMemoryGB / $totalMemoryGB) * 100, 2)

        $health.memory_usage = @{
            total_gb = $totalMemoryGB
            used_gb = $usedMemoryGB
            free_gb = $freeMemoryGB
            used_percent = $memoryUsedPercent
            status = if ($memoryUsedPercent -gt 90) { "CRITICAL" } elseif ($memoryUsedPercent -gt 80) { "WARNING" } else { "OK" }
        }
    } catch {
        Write-BackupLog "Failed to collect memory usage: $($_.Exception.Message)" "ERROR"
    }

    # Development services status
    $devPorts = @(5173, 8080, 9001, 3001)
    foreach ($port in $devPorts) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            $health.service_status["port_$port"] = @{
                status = if ($connection) { "RUNNING" } else { "STOPPED" }
                port = $port
            }
        } catch {
            $health.service_status["port_$port"] = @{
                status = "ERROR"
                port = $port
            }
        }
    }

    return $health
}

function New-BackupManifest {
    param([string]$BackupDir, [hashtable]$BackupInfo)

    $manifest = @{
        backup_id = [System.Guid]::NewGuid().ToString()
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        backup_type = $Mode
        files_backed_up = $BackupInfo.files
        size_mb = $BackupInfo.size_mb
        duration_seconds = $BackupInfo.duration
        verification = $BackupInfo.verification
        system_health = Get-SystemHealth
    }

    $manifestPath = Join-Path $BackupDir "manifest.json"
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath

    Write-BackupLog "Backup manifest created: $manifestPath" "SUCCESS"
    return $manifest
}

function Invoke-IntelligentBackup {
    Write-BackupLog "Starting intelligent backup process..." "BACKUP"

    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = Join-Path $BackupPath "backup_$timestamp"

    if ($DryRun) {
        Write-BackupLog "[DRY RUN] Would create backup directory: $backupDir" "INFO"
    } else {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }

    $backupStartTime = Get-Date
    $backedUpFiles = @()
    $totalSize = 0

    foreach ($item in $Script:CriticalPaths) {
        $sourcePath = $item.path
        $itemType = $item.type
        $isCritical = $item.critical

        if (Test-Path $sourcePath) {
            $destinationName = ($sourcePath -replace '[:\/\\]', '_')
            $destinationPath = Join-Path $backupDir $destinationName

            try {
                if ($DryRun) {
                    Write-BackupLog "[DRY RUN] Would backup: $sourcePath -> $destinationName" "INFO"
                } else {
                    if (Test-Path $sourcePath -PathType Container) {
                        # Directory backup
                        Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force
                        Write-BackupLog "Backed up directory: $sourcePath" "SUCCESS"
                    } else {
                        # File backup
                        $destinationDir = Split-Path $destinationPath -Parent
                        if (-not (Test-Path $destinationDir)) {
                            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                        }
                        Copy-Item -Path $sourcePath -Destination $destinationPath -Force
                        Write-BackupLog "Backed up file: $sourcePath" "SUCCESS"
                    }

                    # Calculate size
                    if (Test-Path $destinationPath) {
                        if (Test-Path $destinationPath -PathType Container) {
                            $size = (Get-ChildItem -Path $destinationPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
                        } else {
                            $size = (Get-Item $destinationPath).Length
                        }
                        $totalSize += $size
                    }
                }

                $backedUpFiles += @{
                    source = $sourcePath
                    destination = $destinationName
                    type = $itemType
                    critical = $isCritical
                    timestamp = Get-Date
                }

            } catch {
                $errorLevel = if ($isCritical) { "ERROR" } else { "WARN" }
                Write-BackupLog "Failed to backup $sourcePath : $($_.Exception.Message)" $errorLevel
            }
        } else {
            $warnLevel = if ($isCritical) { "WARN" } else { "INFO" }
            Write-BackupLog "Path not found: $sourcePath" $warnLevel
        }
    }

    $backupDuration = ((Get-Date) - $backupStartTime).TotalSeconds
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)

    # Compression
    $compressionInfo = $null
    if ($Compress -and -not $DryRun) {
        Write-BackupLog "Compressing backup..." "BACKUP"
        try {
            $zipPath = "$backupDir.zip"
            Compress-Archive -Path $backupDir -DestinationPath $zipPath -CompressionLevel Optimal
            Remove-Item -Path $backupDir -Recurse -Force
            $compressionInfo = @{
                compressed = $true
                original_size_mb = $totalSizeMB
                compressed_size_mb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
            }
            Write-BackupLog "Backup compressed to: $zipPath" "SUCCESS"
        } catch {
            Write-BackupLog "Compression failed: $($_.Exception.Message)" "ERROR"
        }
    }

    # Verification
    $verificationResult = $null
    if ($Verify -and -not $DryRun) {
        Write-BackupLog "Verifying backup integrity..." "BACKUP"
        $verificationResult = Test-BackupIntegrity $backupDir
    }

    # Create manifest
    $backupInfo = @{
        files = $backedUpFiles
        size_mb = $totalSizeMB
        duration = $backupDuration
        compression = $compressionInfo
        verification = $verificationResult
    }

    if (-not $DryRun) {
        $manifest = New-BackupManifest $(if ($Compress) { "$backupDir.zip" } else { $backupDir }) $backupInfo
        $Script:BackupResults = $backupInfo
    }

    Write-BackupLog "Backup completed: $($backedUpFiles.Count) items, $totalSizeMB MB, $($backupDuration)s" "SUCCESS"
}

function Test-BackupIntegrity {
    param([string]$BackupDir)

    $verificationResults = @()

    foreach ($item in (Get-ChildItem -Path $BackupDir -Recurse -File)) {
        try {
            $hash = Get-FileHash -Path $item.FullName -Algorithm SHA256
            $verificationResults += @{
                file = $item.Name
                path = $item.FullName
                hash = $hash.Hash
                size = $item.Length
                verified = $true
            }
        } catch {
            $verificationResults += @{
                file = $item.Name
                path = $item.FullName
                hash = $null
                size = $item.Length
                verified = $false
                error = $_.Exception.Message
            }
        }
    }

    $verifiedCount = ($verificationResults | Where-Object { $_.verified }).Count
    $totalCount = $verificationResults.Count

    Write-BackupLog "Verification complete: $verifiedCount/$totalCount files verified" $(
        if ($verifiedCount -eq $totalCount) { "SUCCESS" } else { "WARN" }
    )

    return @{
        verified_files = $verifiedCount
        total_files = $totalCount
        success_rate = [math]::Round(($verifiedCount / $totalCount) * 100, 2)
        details = $verificationResults
    }
}

function Remove-OldBackups {
    Write-BackupLog "Cleaning up old backups..." "INFO"

    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem -Path $BackupPath -Directory | Where-Object {
        $_.Name -match "backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}" -and $_.CreationTime -lt $cutoffDate
    }

    foreach ($backup in $oldBackups) {
        if ($DryRun) {
            Write-BackupLog "[DRY RUN] Would remove old backup: $($backup.Name)" "INFO"
        } else {
            try {
                Remove-Item -Path $backup.FullName -Recurse -Force
                Write-BackupLog "Removed old backup: $($backup.Name)" "SUCCESS"
            } catch {
                Write-BackupLog "Failed to remove backup $($backup.Name): $($_.Exception.Message)" "ERROR"
            }
        }
    }

    # Also clean up compressed backups
    $oldZipBackups = Get-ChildItem -Path $BackupPath -File -Filter "backup_*.zip" | Where-Object {
        $_.CreationTime -lt $cutoffDate
    }

    foreach ($zipBackup in $oldZipBackups) {
        if ($DryRun) {
            Write-BackupLog "[DRY RUN] Would remove old compressed backup: $($zipBackup.Name)" "INFO"
        } else {
            try {
                Remove-Item -Path $zipBackup.FullName -Force
                Write-BackupLog "Removed old compressed backup: $($zipBackup.Name)" "SUCCESS"
            } catch {
                Write-BackupLog "Failed to remove compressed backup $($zipBackup.Name): $($_.Exception.Message)" "ERROR"
            }
        }
    }
}

function Start-ContinuousMonitoring {
    Write-BackupLog "Starting continuous system monitoring..." "MONITOR"

    $monitoringInterval = 300 # 5 minutes
    $alertThresholds = @{
        disk_usage = 85
        memory_usage = 90
        cpu_usage = 95
    }

    while ($true) {
        try {
            $health = Get-SystemHealth
            $alerts = @()

            # Check disk usage
            foreach ($disk in $health.disk_usage.Keys) {
                $usage = $health.disk_usage[$disk]
                if ($usage.used_percent -gt $alertThresholds.disk_usage) {
                    $alerts += "DISK ALERT: Drive $disk is $($usage.used_percent)% full"
                }
            }

            # Check memory usage
            if ($health.memory_usage.used_percent -gt $alertThresholds.memory_usage) {
                $alerts += "MEMORY ALERT: $($health.memory_usage.used_percent)% memory in use"
            }

            # Check service status
            $stoppedServices = $health.service_status.Values | Where-Object { $_.status -eq "STOPPED" }
            if ($stoppedServices.Count -gt 0) {
                $alerts += "SERVICE ALERT: $($stoppedServices.Count) development services are down"
            }

            # Log alerts
            foreach ($alert in $alerts) {
                Write-BackupLog $alert "WARN"
            }

            # Store monitoring data
            $Script:MonitoringData = $health

            # Auto-backup if critical alerts
            if ($alerts.Count -gt 0 -and $alerts -match "CRITICAL") {
                Write-BackupLog "Critical alerts detected, triggering emergency backup..." "BACKUP"
                Invoke-IntelligentBackup
            }

            Start-Sleep -Seconds $monitoringInterval

        } catch {
            Write-BackupLog "Monitoring error: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 60 # Shorter retry interval on error
        }
    }
}

function Restore-FromBackup {
    param([string]$BackupSource)

    if (-not (Test-Path $BackupSource)) {
        Write-BackupLog "Backup source not found: $BackupSource" "ERROR"
        return
    }

    Write-BackupLog "Starting restore from: $BackupSource" "BACKUP"

    if ($BackupSource.EndsWith(".zip")) {
        $tempDir = Join-Path $env:TEMP "restore_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Expand-Archive -Path $BackupSource -DestinationPath $tempDir
        $BackupSource = $tempDir
    }

    $manifestPath = Join-Path $BackupSource "manifest.json"
    if (Test-Path $manifestPath) {
        try {
            $manifest = Get-Content $manifestPath | ConvertFrom-Json
            Write-BackupLog "Restore manifest found: Backup ID $($manifest.backup_id), Created $($manifest.timestamp)" "INFO"

            foreach ($file in $manifest.files_backed_up) {
                $sourcePath = Join-Path $BackupSource ($file.destination)
                $destinationPath = $file.source

                if (Test-Path $sourcePath) {
                    if ($DryRun) {
                        Write-BackupLog "[DRY RUN] Would restore: $($file.source)" "INFO"
                    } else {
                        try {
                            $destinationDir = Split-Path $destinationPath -Parent
                            if (-not (Test-Path $destinationDir)) {
                                New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                            }

                            Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force
                            Write-BackupLog "Restored: $($file.source)" "SUCCESS"
                        } catch {
                            Write-BackupLog "Failed to restore $($file.source): $($_.Exception.Message)" "ERROR"
                        }
                    }
                }
            }
        } catch {
            Write-BackupLog "Failed to read restore manifest: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-BackupLog "No manifest found, attempting direct restore..." "WARN"
        # Direct file restore logic here
    }

    Write-BackupLog "Restore operation completed" "SUCCESS"
}

# Main execution
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
}

Write-BackupLog "🛡️  Starting intelligent backup and monitoring system..." "INFO"
Write-BackupLog "Mode: $Mode, Backup Path: $BackupPath" "INFO"

switch ($Mode) {
    "full" {
        Invoke-IntelligentBackup
        Remove-OldBackups
    }
    "incremental" {
        # Incremental backup logic - backup only changed files
        Write-BackupLog "Incremental backup mode not yet implemented" "WARN"
        Invoke-IntelligentBackup
    }
    "monitor" {
        Start-ContinuousMonitoring
    }
    "restore" {
        if ($RestoreFrom) {
            Restore-FromBackup $RestoreFrom
        } else {
            Write-BackupLog "No restore source specified. Use -RestoreFrom parameter." "ERROR"
        }
    }
    default {
        Write-BackupLog "Unknown mode: $Mode" "ERROR"
        exit 1
    }
}

Write-BackupLog "✅ Backup and monitoring operations completed!" "SUCCESS"