# Automated Quality Check System
# Runs comprehensive quality checks automatically when triggered
param(
    [string]$TriggerType = "manual",
    [string]$ChangedFiles = "",
    [switch]$SkipTests,
    [switch]$QuickMode,
    [switch]$Silent
)

$ErrorActionPreference = "Continue"

function Write-AutoLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "HH:mm:ss"
    $Color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "INFO" { "Cyan" }
        default { "White" }
    }

    if (-not $Silent) {
        Write-Host "[$Timestamp] $Message" -ForegroundColor $Color
    }
}

function Test-ProjectHealth {
    param([string]$ProjectPath = ".")

    $health = @{
        linting = $false
        typecheck = $false
        tests = $false
        build = $false
        score = 0
    }

    Push-Location $ProjectPath
    try {
        # ESLint check
        Write-AutoLog "Running ESLint..." "INFO"
        $lintResult = npm run lint 2>&1
        $health.linting = $LASTEXITCODE -eq 0
        if ($health.linting) { $health.score += 25 }

        # TypeScript check
        Write-AutoLog "Checking TypeScript..." "INFO"
        $typeResult = npm run typecheck 2>&1
        $health.typecheck = $LASTEXITCODE -eq 0
        if ($health.typecheck) { $health.score += 25 }

        # Tests (if not skipped)
        if (-not $SkipTests -and -not $QuickMode) {
            Write-AutoLog "Running tests..." "INFO"
            $testResult = npm run test 2>&1
            $health.tests = $LASTEXITCODE -eq 0
            if ($health.tests) { $health.score += 25 }
        } else {
            $health.tests = $true
            $health.score += 25
        }

        # Build check
        if (-not $QuickMode) {
            Write-AutoLog "Testing build..." "INFO"
            $buildResult = npm run build 2>&1
            $health.build = $LASTEXITCODE -eq 0
            if ($health.build) { $health.score += 25 }
        } else {
            $health.build = $true
            $health.score += 25
        }

    } finally {
        Pop-Location
    }

    return $health
}

function Test-CryptoSystemHealth {
    $cryptoPath = "projects/crypto-enhanced"
    if (-not (Test-Path $cryptoPath)) {
        return @{ score = 100; message = "Crypto system not present" }
    }

    Write-AutoLog "Checking crypto trading system..." "INFO"
    Push-Location $cryptoPath
    try {
        if (Test-Path ".venv") {
            $testResult = .\.venv\Scripts\python.exe run_tests.py 2>&1
            $success = $LASTEXITCODE -eq 0
            return @{
                score = if ($success) { 100 } else { 0 }
                message = if ($success) { "All tests passed" } else { "Tests failed" }
            }
        } else {
            return @{ score = 0; message = "Virtual environment not setup" }
        }
    } finally {
        Pop-Location
    }
}

function Invoke-SmartCleanup {
    Write-AutoLog "Running smart cleanup..." "INFO"

    # Clean temporary files
    $tempPatterns = @("*.tmp", "*.temp", "*.log")
    foreach ($pattern in $tempPatterns) {
        Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Remove-Item -Force
    }

    # Clean cache if too large
    $cacheSize = 0
    $cachePaths = @(".nx", ".turbo", "node_modules/.cache")
    foreach ($path in $cachePaths) {
        if (Test-Path $path) {
            $size = (Get-ChildItem -Path $path -Recurse -File | Measure-Object -Property Length -Sum).Sum
            $cacheSize += $size
        }
    }

    if ($cacheSize -gt 500MB) {
        Write-AutoLog "Cache size exceeded 500MB, cleaning..." "WARN"
        foreach ($path in $cachePaths) {
            if (Test-Path $path) {
                Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Send-HealthReport {
    param($RootHealth, $CryptoHealth)

    $overallScore = ($RootHealth.score + $CryptoHealth.score) / 2
    $status = switch ($overallScore) {
        { $_ -ge 90 } { "EXCELLENT" }
        { $_ -ge 75 } { "GOOD" }
        { $_ -ge 50 } { "FAIR" }
        default { "NEEDS_ATTENTION" }
    }

    Write-AutoLog "=== AUTOMATED QUALITY REPORT ===" "INFO"
    Write-AutoLog "Overall Health: $status ($overallScore%)" $(if ($overallScore -ge 75) { "SUCCESS" } else { "WARN" })
    Write-AutoLog "Root Project: $($RootHealth.score)%" $(if ($RootHealth.score -ge 75) { "SUCCESS" } else { "WARN" })
    Write-AutoLog "Crypto System: $($CryptoHealth.score)% - $($CryptoHealth.message)" $(if ($CryptoHealth.score -ge 75) { "SUCCESS" } else { "WARN" })

    # Store health data for monitoring
    $healthData = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        trigger = $TriggerType
        overall_score = $overallScore
        root_health = $RootHealth
        crypto_health = $CryptoHealth
    }

    $healthJson = $healthData | ConvertTo-Json -Depth 3 -Compress
    $healthFile = "logs/auto-quality-$(Get-Date -Format 'yyyy-MM-dd').json"

    if (-not (Test-Path "logs")) { New-Item -ItemType Directory -Name "logs" -Force | Out-Null }
    Add-Content -Path $healthFile -Value $healthJson

    return $overallScore
}

# Main execution
Write-AutoLog "🔍 Starting automated quality check (trigger: $TriggerType)" "INFO"

# Smart cleanup first
Invoke-SmartCleanup

# Check root project health
$rootHealth = Test-ProjectHealth

# Check crypto system health
$cryptoHealth = Test-CryptoSystemHealth

# Generate and send report
$overallScore = Send-HealthReport $rootHealth $cryptoHealth

# Auto-fix common issues if score is low
if ($overallScore -lt 75 -and -not $QuickMode) {
    Write-AutoLog "Score below 75%, attempting auto-fixes..." "WARN"

    if (-not $rootHealth.linting) {
        Write-AutoLog "Attempting ESLint auto-fix..." "INFO"
        npm run lint:fix 2>&1 | Out-Null
    }
}

Write-AutoLog "✅ Automated quality check complete" "SUCCESS"
exit $(if ($overallScore -ge 75) { 0 } else { 1 })