# Intelligent Cross-Project Dependency Synchronization
# Automatically manages and synchronizes dependencies across all projects
param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$CheckOnly,
    [string]$SyncType = "all" # all, versions, security, major
)

$Script:SyncResults = @{}
$Script:ProjectPaths = @{
    "root" = "."
    "vibe-frontend" = "projects/active/web-apps/vibe-tech-lovable"
    "vibe-backend" = "projects/active/web-apps/vibe-tech-lovable/backend"
    "crypto" = "projects/crypto-enhanced"
}

function Write-SyncLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "HH:mm:ss"
    $Color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "SYNC" { "Magenta" }
        "INFO" { "Cyan" }
        default { "White" }
    }

    Write-Host "[$Timestamp] [DEP-SYNC] $Message" -ForegroundColor $Color
}

function Get-PackageJson {
    param([string]$ProjectPath)

    $packagePath = Join-Path $ProjectPath "package.json"
    if (Test-Path $packagePath) {
        try {
            return Get-Content $packagePath | ConvertFrom-Json
        } catch {
            Write-SyncLog "Failed to parse package.json in $ProjectPath" "ERROR"
            return $null
        }
    }
    return $null
}

function Get-RequirementsTxt {
    param([string]$ProjectPath)

    $reqPath = Join-Path $ProjectPath "requirements.txt"
    if (Test-Path $reqPath) {
        $requirements = @{}
        $content = Get-Content $reqPath
        foreach ($line in $content) {
            if ($line -match "^([^=<>]+)[=<>]") {
                $packageName = $matches[1].Trim()
                $requirements[$packageName] = $line
            }
        }
        return $requirements
    }
    return @{}
}

function Compare-Versions {
    param([string]$Version1, [string]$Version2)

    # Remove common prefixes like ^, ~, >=
    $v1Clean = $Version1 -replace '^[\^~>=<]*', ''
    $v2Clean = $Version2 -replace '^[\^~>=<]*', ''

    try {
        $v1Parts = $v1Clean.Split('.') | ForEach-Object { [int]$_ }
        $v2Parts = $v2Clean.Split('.') | ForEach-Object { [int]$_ }

        for ($i = 0; $i -lt [Math]::Max($v1Parts.Length, $v2Parts.Length); $i++) {
            $v1Part = if ($i -lt $v1Parts.Length) { $v1Parts[$i] } else { 0 }
            $v2Part = if ($i -lt $v2Parts.Length) { $v2Parts[$i] } else { 0 }

            if ($v1Part -gt $v2Part) { return 1 }
            if ($v1Part -lt $v2Part) { return -1 }
        }
        return 0
    } catch {
        # Fallback to string comparison
        return [string]::Compare($v1Clean, $v2Clean)
    }
}

function Find-SharedDependencies {
    Write-SyncLog "Analyzing shared dependencies across projects..." "SYNC"

    $allDependencies = @{}
    $projectPackages = @{}

    # Collect all package.json files
    foreach ($project in $Script:ProjectPaths.Keys) {
        $path = $Script:ProjectPaths[$project]
        if ($project -ne "crypto") { # Skip Python project for now
            $packageJson = Get-PackageJson $path
            if ($packageJson) {
                $projectPackages[$project] = $packageJson

                # Merge dependencies and devDependencies
                if ($packageJson.dependencies) {
                    foreach ($dep in $packageJson.dependencies.PSObject.Properties) {
                        if (-not $allDependencies.ContainsKey($dep.Name)) {
                            $allDependencies[$dep.Name] = @{}
                        }
                        $allDependencies[$dep.Name][$project] = @{
                            version = $dep.Value
                            type = "dependency"
                        }
                    }
                }

                if ($packageJson.devDependencies) {
                    foreach ($dep in $packageJson.devDependencies.PSObject.Properties) {
                        if (-not $allDependencies.ContainsKey($dep.Name)) {
                            $allDependencies[$dep.Name] = @{}
                        }
                        $allDependencies[$dep.Name][$project] = @{
                            version = $dep.Value
                            type = "devDependency"
                        }
                    }
                }
            }
        }
    }

    return @{
        dependencies = $allDependencies
        packages = $projectPackages
    }
}

function Find-VersionConflicts {
    param($DependencyData)

    Write-SyncLog "Detecting version conflicts..." "SYNC"

    $conflicts = @{}

    foreach ($depName in $DependencyData.dependencies.Keys) {
        $depInfo = $DependencyData.dependencies[$depName]
        $versions = @{}

        foreach ($project in $depInfo.Keys) {
            $version = $depInfo[$project].version
            if (-not $versions.ContainsKey($version)) {
                $versions[$version] = @()
            }
            $versions[$version] += $project
        }

        if ($versions.Keys.Count -gt 1) {
            $conflicts[$depName] = $versions
        }
    }

    return $conflicts
}

function Get-LatestVersions {
    param([string[]]$PackageNames)

    Write-SyncLog "Checking for latest versions..." "INFO"

    $latestVersions = @{}

    foreach ($package in $PackageNames) {
        try {
            if ($DryRun) {
                Write-SyncLog "[DRY RUN] Would check npm for latest version of $package" "INFO"
                $latestVersions[$package] = "unknown"
            } else {
                $npmInfo = npm view $package version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $latestVersions[$package] = $npmInfo.Trim()
                } else {
                    $latestVersions[$package] = "unknown"
                }
            }
        } catch {
            $latestVersions[$package] = "unknown"
        }
    }

    return $latestVersions
}

function Resolve-VersionConflicts {
    param($Conflicts, $DependencyData)

    Write-SyncLog "Resolving version conflicts..." "SYNC"

    $resolutions = @{}

    foreach ($packageName in $Conflicts.Keys) {
        $versions = $Conflicts[$packageName]
        $versionList = @($versions.Keys)

        # Find the highest version
        $highestVersion = $versionList[0]
        foreach ($version in $versionList) {
            if ((Compare-Versions $version $highestVersion) -gt 0) {
                $highestVersion = $version
            }
        }

        $resolutions[$packageName] = @{
            targetVersion = $highestVersion
            projects = @()
        }

        # Determine which projects need updates
        foreach ($project in $DependencyData.dependencies[$packageName].Keys) {
            $currentVersion = $DependencyData.dependencies[$packageName][$project].version
            if ($currentVersion -ne $highestVersion) {
                $resolutions[$packageName].projects += @{
                    name = $project
                    currentVersion = $currentVersion
                    newVersion = $highestVersion
                    type = $DependencyData.dependencies[$packageName][$project].type
                }
            }
        }
    }

    return $resolutions
}

function Update-PackageJson {
    param([string]$ProjectPath, [hashtable]$Updates)

    $packagePath = Join-Path $ProjectPath "package.json"
    if (-not (Test-Path $packagePath)) {
        return
    }

    if ($DryRun) {
        Write-SyncLog "[DRY RUN] Would update package.json in $ProjectPath" "INFO"
        foreach ($update in $Updates.Keys) {
            Write-SyncLog "  $update: $($Updates[$update].currentVersion) -> $($Updates[$update].newVersion)" "INFO"
        }
        return
    }

    try {
        $packageJson = Get-Content $packagePath | ConvertFrom-Json

        foreach ($packageName in $Updates.Keys) {
            $update = $Updates[$packageName]
            $newVersion = $update.newVersion
            $type = $update.type

            if ($type -eq "dependency" -and $packageJson.dependencies -and $packageJson.dependencies.PSObject.Properties.Name -contains $packageName) {
                $packageJson.dependencies.$packageName = $newVersion
                Write-SyncLog "Updated $packageName to $newVersion in dependencies" "SUCCESS"
            }

            if ($type -eq "devDependency" -and $packageJson.devDependencies -and $packageJson.devDependencies.PSObject.Properties.Name -contains $packageName) {
                $packageJson.devDependencies.$packageName = $newVersion
                Write-SyncLog "Updated $packageName to $newVersion in devDependencies" "SUCCESS"
            }
        }

        # Write back to file with proper formatting
        $jsonOutput = $packageJson | ConvertTo-Json -Depth 10
        Set-Content -Path $packagePath -Value $jsonOutput

    } catch {
        Write-SyncLog "Failed to update package.json in $ProjectPath : $($_.Exception.Message)" "ERROR"
    }
}

function Sync-SecurityUpdates {
    Write-SyncLog "Checking for security vulnerabilities..." "SYNC"

    foreach ($project in $Script:ProjectPaths.Keys) {
        $path = $Script:ProjectPaths[$project]
        if ($project -ne "crypto" -and (Test-Path (Join-Path $path "package.json"))) {
            Push-Location $path
            try {
                if ($DryRun) {
                    Write-SyncLog "[DRY RUN] Would run npm audit in $project" "INFO"
                } else {
                    Write-SyncLog "Running security audit for $project..." "INFO"
                    $auditResult = npm audit --json 2>$null

                    if ($LASTEXITCODE -ne 0) {
                        Write-SyncLog "Security vulnerabilities found in $project" "WARN"

                        # Attempt auto-fix
                        Write-SyncLog "Attempting to fix vulnerabilities..." "SYNC"
                        npm audit fix 2>$null

                        if ($LASTEXITCODE -eq 0) {
                            Write-SyncLog "Security issues fixed in $project" "SUCCESS"
                        } else {
                            Write-SyncLog "Manual intervention required for $project security issues" "WARN"
                        }
                    } else {
                        Write-SyncLog "No security vulnerabilities found in $project" "SUCCESS"
                    }
                }
            } finally {
                Pop-Location
            }
        }
    }
}

function Sync-PythonDependencies {
    $cryptoPath = $Script:ProjectPaths["crypto"]
    if (-not (Test-Path $cryptoPath)) {
        return
    }

    Write-SyncLog "Syncing Python dependencies..." "SYNC"

    Push-Location $cryptoPath
    try {
        if (Test-Path ".venv") {
            if ($DryRun) {
                Write-SyncLog "[DRY RUN] Would check Python package updates" "INFO"
            } else {
                Write-SyncLog "Checking for Python package updates..." "INFO"
                $pipList = .\.venv\Scripts\pip list --outdated --format=json 2>$null

                if ($LASTEXITCODE -eq 0 -and $pipList) {
                    $outdated = $pipList | ConvertFrom-Json
                    if ($outdated.Count -gt 0) {
                        Write-SyncLog "Found $($outdated.Count) outdated Python packages" "WARN"

                        if ($Force) {
                            Write-SyncLog "Updating Python packages..." "SYNC"
                            .\.venv\Scripts\pip install --upgrade -r requirements.txt
                        }
                    } else {
                        Write-SyncLog "All Python packages are up to date" "SUCCESS"
                    }
                }
            }
        }
    } finally {
        Pop-Location
    }
}

function Show-SyncSummary {
    param($DependencyData, $Conflicts, $Resolutions)

    Write-SyncLog "=== DEPENDENCY SYNCHRONIZATION SUMMARY ===" "INFO"

    $totalProjects = ($DependencyData.packages.Keys | Measure-Object).Count
    $totalDependencies = ($DependencyData.dependencies.Keys | Measure-Object).Count
    $conflictCount = ($Conflicts.Keys | Measure-Object).Count

    Write-SyncLog "Projects analyzed: $totalProjects" "INFO"
    Write-SyncLog "Unique dependencies: $totalDependencies" "INFO"
    Write-SyncLog "Version conflicts: $conflictCount" $(if ($conflictCount -eq 0) { "SUCCESS" } else { "WARN" })

    if ($conflictCount -gt 0 -and $Resolutions) {
        Write-SyncLog "Conflict resolutions:" "INFO"
        foreach ($package in $Resolutions.Keys) {
            $resolution = $Resolutions[$package]
            Write-SyncLog "  $package -> $($resolution.targetVersion)" "SUCCESS"
        }
    }
}

# Main execution
Write-SyncLog "🔄 Starting intelligent dependency synchronization..." "INFO"

if ($CheckOnly) {
    $dependencyData = Find-SharedDependencies
    $conflicts = Find-VersionConflicts $dependencyData
    Show-SyncSummary $dependencyData $conflicts $null
    exit 0
}

# Analyze dependencies
$dependencyData = Find-SharedDependencies
$conflicts = Find-VersionConflicts $dependencyData

if ($conflicts.Keys.Count -gt 0) {
    Write-SyncLog "Found $($conflicts.Keys.Count) version conflicts" "WARN"

    if ($SyncType -eq "all" -or $SyncType -eq "versions") {
        $resolutions = Resolve-VersionConflicts $conflicts $dependencyData

        # Apply updates
        foreach ($packageName in $resolutions.Keys) {
            $resolution = $resolutions[$packageName]
            foreach ($projectUpdate in $resolution.projects) {
                $projectPath = $Script:ProjectPaths[$projectUpdate.name]
                $updates = @{
                    $packageName = @{
                        currentVersion = $projectUpdate.currentVersion
                        newVersion = $projectUpdate.newVersion
                        type = $projectUpdate.type
                    }
                }
                Update-PackageJson $projectPath $updates
            }
        }
    }
} else {
    Write-SyncLog "No version conflicts found" "SUCCESS"
}

# Security updates
if ($SyncType -eq "all" -or $SyncType -eq "security") {
    Sync-SecurityUpdates
}

# Python dependencies
if ($SyncType -eq "all") {
    Sync-PythonDependencies
}

# Final summary
Show-SyncSummary $dependencyData $conflicts $(if ($conflicts.Keys.Count -gt 0) { $resolutions } else { $null })

Write-SyncLog "✅ Dependency synchronization complete!" "SUCCESS"