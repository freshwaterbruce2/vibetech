# Desktop Commander Setup Script
# Run this in PowerShell from C:\dev\desktop-commander

Write-Host "🚀 Desktop Commander Setup" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check for Node.js
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green

# Check for Rust
Write-Host "`nChecking for Rust..." -ForegroundColor Yellow
$cargo = Get-Command cargo -ErrorAction SilentlyContinue
if ($null -eq $cargo) {
    Write-Host "❌ Rust not found. Installing Rust..." -ForegroundColor Red
    Write-Host "Running: winget install Rustlang.Rust.MSVC" -ForegroundColor Cyan
    winget install Rustlang.Rust.MSVC
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    $cargo = Get-Command cargo -ErrorAction SilentlyContinue
    if ($null -eq $cargo) {
        Write-Host "❌ Rust installation failed. Please install manually from rustup.rs" -ForegroundColor Red
        exit 1
    }
}
$cargoVersion = cargo --version
Write-Host "✅ Rust $cargoVersion found" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Verify monorepo path
Write-Host "`nVerifying monorepo structure..." -ForegroundColor Yellow
$devPath = "C:\dev"
if (Test-Path $devPath) {
    Write-Host "✅ C:\dev found" -ForegroundColor Green
    
    # Check for key directories
    $tradingBotPath = Join-Path $devPath "projects\crypto-enhanced"
    $backendPath = Join-Path $devPath "backend"
    
    if (Test-Path $tradingBotPath) {
        Write-Host "  ✅ Trading bot directory found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Trading bot directory not found at $tradingBotPath" -ForegroundColor Yellow
    }
    
    if (Test-Path $backendPath) {
        Write-Host "  ✅ Backend directory found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend directory not found at $backendPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  C:\dev not found. You may need to update the monorepo path in src-tauri/src/main.rs" -ForegroundColor Yellow
}

Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'npm run tauri:dev' to start in development mode" -ForegroundColor White
Write-Host "  2. Or run 'npm run tauri:build' to create a production build" -ForegroundColor White
Write-Host "`nFor more information, see README.md" -ForegroundColor Cyan
