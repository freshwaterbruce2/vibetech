# Intelligent Environment Setup and Management
# Automatically detects, configures, and manages all project environments
param(
    [switch]$Force,
    [switch]$DryRun,
    [switch]$CheckOnly,
    [string]$Project = "all"
)

$Script:SetupResults = @{}

function Write-EnvLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "HH:mm:ss"
    $Color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "SETUP" { "Magenta" }
        "INFO" { "Cyan" }
        default { "White" }
    }

    Write-Host "[$Timestamp] [ENV-SETUP] $Message" -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-EnvLog "Checking system prerequisites..." "INFO"

    $prerequisites = @{
        node = @{ command = "node"; version = "--version"; required = "18.0.0" }
        npm = @{ command = "npm"; version = "--version"; required = "9.0.0" }
        python = @{ command = "python"; version = "--version"; required = "3.9.0" }
        git = @{ command = "git"; version = "--version"; required = "2.30.0" }
    }

    $results = @{}

    foreach ($tool in $prerequisites.Keys) {
        try {
            $version = & $prerequisites[$tool].command $prerequisites[$tool].version 2>&1 | Select-Object -First 1
            $results[$tool] = @{
                installed = $true
                version = $version
                status = "OK"
            }
            Write-EnvLog "✓ $tool found: $version" "SUCCESS"
        } catch {
            $results[$tool] = @{
                installed = $false
                version = "Not found"
                status = "MISSING"
            }
            Write-EnvLog "✗ $tool not found or not in PATH" "ERROR"
        }
    }

    return $results
}

function Set-EnvironmentVariables {
    param([string]$ProjectPath, [hashtable]$EnvVars)

    $envFile = Join-Path $ProjectPath ".env"
    $envLocalFile = Join-Path $ProjectPath ".env.local"

    if ($DryRun) {
        Write-EnvLog "[DRY RUN] Would create environment file at $envFile" "INFO"
        return
    }

    $envContent = @()
    foreach ($key in $EnvVars.Keys) {
        $envContent += "$key=$($EnvVars[$key])"
    }

    # Create .env file if it doesn't exist
    if (-not (Test-Path $envFile) -or $Force) {
        Write-EnvLog "Creating environment file: $envFile" "SETUP"
        Set-Content -Path $envFile -Value $envContent
    }

    # Create .env.local for local overrides
    if (-not (Test-Path $envLocalFile)) {
        $localContent = @(
            "# Local environment overrides",
            "# This file is git-ignored and safe for secrets",
            ""
        )
        Set-Content -Path $envLocalFile -Value $localContent
    }
}

function Setup-RootProject {
    Write-EnvLog "Setting up root project environment..." "SETUP"

    try {
        # Check if node_modules exists
        if (-not (Test-Path "node_modules") -or $Force) {
            if ($DryRun) {
                Write-EnvLog "[DRY RUN] Would run npm install" "INFO"
            } else {
                Write-EnvLog "Installing Node.js dependencies..." "INFO"
                npm install
                if ($LASTEXITCODE -ne 0) {
                    throw "npm install failed"
                }
            }
        }

        # Setup environment variables
        $rootEnvVars = @{
            "NODE_ENV" = "development"
            "VITE_DEV_MODE" = "true"
            "VITE_PORT" = "5173"
            "VITE_API_URL" = "http://localhost:3001"
        }

        Set-EnvironmentVariables -ProjectPath "." -EnvVars $rootEnvVars

        # Verify TypeScript configuration
        if (-not (Test-Path "tsconfig.json")) {
            Write-EnvLog "TypeScript configuration missing" "WARN"
        }

        $Script:SetupResults.root = @{ status = "SUCCESS"; message = "Root project configured successfully" }
        Write-EnvLog "✓ Root project environment ready" "SUCCESS"

    } catch {
        $Script:SetupResults.root = @{ status = "ERROR"; message = $_.Exception.Message }
        Write-EnvLog "✗ Root project setup failed: $($_.Exception.Message)" "ERROR"
    }
}

function Setup-CryptoProject {
    $cryptoPath = "projects/crypto-enhanced"

    if (-not (Test-Path $cryptoPath)) {
        Write-EnvLog "Crypto project not found, skipping..." "WARN"
        return
    }

    Write-EnvLog "Setting up crypto trading system environment..." "SETUP"

    Push-Location $cryptoPath
    try {
        # Check Python virtual environment
        if (-not (Test-Path ".venv") -or $Force) {
            if ($DryRun) {
                Write-EnvLog "[DRY RUN] Would create Python virtual environment" "INFO"
            } else {
                Write-EnvLog "Creating Python virtual environment..." "INFO"
                python -m venv .venv
                if ($LASTEXITCODE -ne 0) {
                    throw "Virtual environment creation failed"
                }
            }
        }

        # Install Python dependencies
        if ($DryRun) {
            Write-EnvLog "[DRY RUN] Would install Python requirements" "INFO"
        } else {
            Write-EnvLog "Installing Python dependencies..." "INFO"
            .\.venv\Scripts\pip install -r requirements.txt
            if ($LASTEXITCODE -ne 0) {
                throw "Python requirements installation failed"
            }
        }

        # Setup crypto environment variables
        $cryptoEnvVars = @{
            "PYTHON_ENV" = "development"
            "TRADING_MODE" = "simulation"
            "LOG_LEVEL" = "INFO"
            "DATABASE_PATH" = "trading.db"
            "KRAKEN_API_URL" = "https://api.kraken.com"
        }

        Set-EnvironmentVariables -ProjectPath "." -EnvVars $cryptoEnvVars

        # Check for API keys placeholder
        $envFile = ".env"
        if (Test-Path $envFile) {
            $envContent = Get-Content $envFile
            if (-not ($envContent -match "KRAKEN_API_KEY")) {
                if (-not $DryRun) {
                    Add-Content -Path $envFile -Value @(
                        "",
                        "# Kraken API Configuration (set in .env.local)",
                        "# KRAKEN_API_KEY=your_api_key_here",
                        "# KRAKEN_SECRET_KEY=your_secret_key_here"
                    )
                }
            }
        }

        $Script:SetupResults.crypto = @{ status = "SUCCESS"; message = "Crypto system configured successfully" }
        Write-EnvLog "✓ Crypto trading system environment ready" "SUCCESS"

    } catch {
        $Script:SetupResults.crypto = @{ status = "ERROR"; message = $_.Exception.Message }
        Write-EnvLog "✗ Crypto project setup failed: $($_.Exception.Message)" "ERROR"
    } finally {
        Pop-Location
    }
}

function Setup-VibeProject {
    $vibePath = "projects/active/web-apps/vibe-tech-lovable"

    if (-not (Test-Path $vibePath)) {
        Write-EnvLog "Vibe-Tech Lovable project not found, skipping..." "WARN"
        return
    }

    Write-EnvLog "Setting up Vibe-Tech Lovable environment..." "SETUP"

    Push-Location $vibePath
    try {
        # Setup frontend
        if (-not (Test-Path "node_modules") -or $Force) {
            if ($DryRun) {
                Write-EnvLog "[DRY RUN] Would install frontend dependencies" "INFO"
            } else {
                Write-EnvLog "Installing frontend dependencies..." "INFO"
                npm install
                if ($LASTEXITCODE -ne 0) {
                    throw "Frontend npm install failed"
                }
            }
        }

        # Setup backend
        $backendPath = "backend"
        if (Test-Path $backendPath) {
            Push-Location $backendPath
            try {
                if (-not (Test-Path "node_modules") -or $Force) {
                    if ($DryRun) {
                        Write-EnvLog "[DRY RUN] Would install backend dependencies" "INFO"
                    } else {
                        Write-EnvLog "Installing backend dependencies..." "INFO"
                        npm install
                        if ($LASTEXITCODE -ne 0) {
                            throw "Backend npm install failed"
                        }
                    }
                }

                # Backend environment variables
                $backendEnvVars = @{
                    "NODE_ENV" = "development"
                    "PORT" = "9001"
                    "DATABASE_PATH" = "D:\vibe-tech-data\vibetech.db"
                    "CORS_ORIGIN" = "http://localhost:8080"
                }

                Set-EnvironmentVariables -ProjectPath "." -EnvVars $backendEnvVars

            } finally {
                Pop-Location
            }
        }

        # Frontend environment variables
        $frontendEnvVars = @{
            "VITE_API_URL" = "http://localhost:9001"
            "VITE_PORT" = "8080"
            "VITE_DEV_MODE" = "true"
        }

        Set-EnvironmentVariables -ProjectPath "." -EnvVars $frontendEnvVars

        $Script:SetupResults.vibe = @{ status = "SUCCESS"; message = "Vibe project configured successfully" }
        Write-EnvLog "✓ Vibe-Tech Lovable environment ready" "SUCCESS"

    } catch {
        $Script:SetupResults.vibe = @{ status = "ERROR"; message = $_.Exception.Message }
        Write-EnvLog "✗ Vibe project setup failed: $($_.Exception.Message)" "ERROR"
    } finally {
        Pop-Location
    }
}

function New-GitIgnoreEntries {
    $gitignorePath = ".gitignore"
    $requiredEntries = @(
        "",
        "# Environment files",
        ".env.local",
        ".env.*.local",
        "",
        "# IDE files",
        ".vscode/settings.json",
        ".idea/",
        "",
        "# OS files",
        ".DS_Store",
        "Thumbs.db",
        "",
        "# Logs",
        "logs/",
        "*.log",
        "",
        "# Cache",
        ".nx/cache",
        ".turbo",
        "node_modules/.cache/"
    )

    if (Test-Path $gitignorePath) {
        $existingContent = Get-Content $gitignorePath
        $newEntries = @()

        foreach ($entry in $requiredEntries) {
            if ($entry -and $entry -notin $existingContent) {
                $newEntries += $entry
            }
        }

        if ($newEntries.Count -gt 0 -and -not $DryRun) {
            Add-Content -Path $gitignorePath -Value $newEntries
            Write-EnvLog "Added $($newEntries.Count) entries to .gitignore" "SUCCESS"
        }
    }
}

function Show-SetupSummary {
    Write-EnvLog "=== ENVIRONMENT SETUP SUMMARY ===" "INFO"

    foreach ($project in $Script:SetupResults.Keys) {
        $result = $Script:SetupResults[$project]
        $status = if ($result.status -eq "SUCCESS") { "✓" } else { "✗" }
        $color = if ($result.status -eq "SUCCESS") { "SUCCESS" } else { "ERROR" }

        Write-EnvLog "$status $project : $($result.message)" $color
    }

    $successCount = ($Script:SetupResults.Values | Where-Object { $_.status -eq "SUCCESS" }).Count
    $totalCount = $Script:SetupResults.Count

    Write-EnvLog "Overall: $successCount/$totalCount projects configured successfully" $(
        if ($successCount -eq $totalCount) { "SUCCESS" } else { "WARN" }
    )
}

# Main execution
Write-EnvLog "🔧 Starting intelligent environment setup..." "INFO"

if ($CheckOnly) {
    $prereqs = Test-Prerequisites
    Show-SetupSummary
    exit 0
}

# Check prerequisites first
$prerequisites = Test-Prerequisites
$missingTools = $prerequisites.Values | Where-Object { -not $_.installed }

if ($missingTools.Count -gt 0 -and -not $Force) {
    Write-EnvLog "Missing prerequisites. Use -Force to continue anyway." "ERROR"
    exit 1
}

# Setup projects based on selection
if ($Project -eq "all" -or $Project -eq "root") {
    Setup-RootProject
}

if ($Project -eq "all" -or $Project -eq "crypto") {
    Setup-CryptoProject
}

if ($Project -eq "all" -or $Project -eq "vibe") {
    Setup-VibeProject
}

# Update .gitignore
New-GitIgnoreEntries

# Show summary
Show-SetupSummary

Write-EnvLog "✅ Environment setup complete!" "SUCCESS"