# Prompt Engineer - Simple Deploy Script
# Run this to deploy the application

param([string]$Env = "production")

Write-Host "`nDeploying Prompt Engineer v1.0.0 to $Env..." -ForegroundColor Cyan

# Check Python
Write-Host "`n[1/5] Checking Python..." -NoNewline
try {
    python --version | Out-Null
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "[2/5] Installing dependencies..." -NoNewline
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
    exit 1
}

# Test imports
Write-Host "[3/5] Testing imports..." -NoNewline
python -c "from src.collectors import CodeScanner" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
    exit 1
}

# Run smoke test
Write-Host "[4/5] Running smoke test..." -NoNewline
$output = python simple_example.py 2>&1
if ($output -match "completed successfully") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
    exit 1
}

# Health check
Write-Host "[5/5] Health check..." -NoNewline
python health_check.py 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
    exit 1
}

# Success
Write-Host "`nDeployment completed successfully!`n" -ForegroundColor Green
Write-Host "Run the application:" -ForegroundColor Cyan
Write-Host "  python -m src.collectors.interactive_collector`n" -ForegroundColor Yellow
