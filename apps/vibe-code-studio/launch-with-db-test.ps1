# Launch script with database initialization verification

Write-Host "=== Deep Code Editor - Database Test Launch ===" -ForegroundColor Blue
Write-Host ""

# Check if D: drive is available
if (Test-Path "D:\") {
    Write-Host "✓ D: drive is available" -ForegroundColor Green

    # Check databases directory
    if (Test-Path "D:\databases") {
        Write-Host "✓ D:\databases directory exists" -ForegroundColor Green

        # Check for DeepCode database
        if (Test-Path "D:\databases\deepcode_database.db") {
            $dbSize = (Get-Item "D:\databases\deepcode_database.db").Length / 1MB
            Write-Host "✓ DeepCode database exists ($([math]::Round($dbSize, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "! DeepCode database will be created on first use" -ForegroundColor Yellow
        }
    } else {
        Write-Host "! D:\databases directory not found" -ForegroundColor Yellow
        Write-Host "  Creating directory..." -ForegroundColor Gray
        New-Item -ItemType Directory -Path "D:\databases" -Force | Out-Null
        Write-Host "✓ Created D:\databases directory" -ForegroundColor Green
    }
} else {
    Write-Host "✗ D: drive not available - will use fallback location" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Deep Code Editor..." -ForegroundColor Cyan
Write-Host "Watch the console for database initialization messages" -ForegroundColor Gray
Write-Host ""

# Set environment variable for verbose logging
$env:DEBUG = "DatabaseService*"

# Kill any existing processes on port 5174
$portProcess = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcess) {
    Write-Host "Killing process on port 5174 (PID: $portProcess)" -ForegroundColor Yellow
    Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Start the development server
try {
    npm run dev
} catch {
    Write-Host "Error starting app: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}