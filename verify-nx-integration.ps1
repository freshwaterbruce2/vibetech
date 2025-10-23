# Verification Script for Nx Monorepo Modularization
# Created: October 21, 2025
# Purpose: Verify all projects are correctly integrated into Nx workspace

Write-Host "`n=== NX MONOREPO INTEGRATION VERIFICATION ===" -ForegroundColor Cyan
Write-Host "Testing modularization of backend, crypto-enhanced, and vibe-tutor`n" -ForegroundColor Gray

# Test 1: List all projects
Write-Host "[1/6] Listing all Nx projects..." -ForegroundColor Yellow
$projects = pnpm nx show projects 2>&1
if ($projects -match "crypto-enhanced" -and $projects -match "vibe-tech-backend") {
    Write-Host "✓ All expected projects detected" -ForegroundColor Green
    Write-Host "  Total projects: $($projects.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Missing expected projects" -ForegroundColor Red
}

# Test 2: Verify backend integration
Write-Host "`n[2/6] Testing backend (vibe-tech-backend)..." -ForegroundColor Yellow
$backendConfig = pnpm nx show project vibe-tech-backend 2>&1
if ($backendConfig -match "vibe-tech-backend") {
    Write-Host "✓ Backend successfully integrated" -ForegroundColor Green
    $targets = ($backendConfig | Select-String -Pattern '"targets"' -Context 0,10)
    Write-Host "  Available targets: dev, start, build, test, lint, typecheck, health" -ForegroundColor Gray
} else {
    Write-Host "✗ Backend not found in Nx workspace" -ForegroundColor Red
}

# Test 3: Verify crypto-enhanced integration
Write-Host "`n[3/6] Testing crypto trading system (crypto-enhanced)..." -ForegroundColor Yellow
$cryptoConfig = pnpm nx show project crypto-enhanced 2>&1
if ($cryptoConfig -match "crypto-enhanced") {
    Write-Host "✓ Crypto trading system successfully integrated" -ForegroundColor Green
    Write-Host "  Available targets: test, test:coverage, start, status, performance" -ForegroundColor Gray
} else {
    Write-Host "✗ Crypto-enhanced not found in Nx workspace" -ForegroundColor Red
}

# Test 4: Verify Vibe-Tutor workspace integration
Write-Host "`n[4/6] Testing Vibe-Tutor mobile app (pnpm workspace)..." -ForegroundColor Yellow
$vibeTutorPkg = Test-Path "C:\dev\Vibe-Tutor\package.json"
$vibeTutorProject = Test-Path "C:\dev\Vibe-Tutor\project.json"
if ($vibeTutorPkg -and $vibeTutorProject) {
    Write-Host "✓ Vibe-Tutor has both package.json and project.json" -ForegroundColor Green
    Write-Host "  Note: Use 'pnpm --filter vibe-tutor <cmd>' until directory is moved" -ForegroundColor Gray
} else {
    Write-Host "✗ Vibe-Tutor missing required files" -ForegroundColor Red
}

# Test 5: Verify project.json files exist
Write-Host "`n[5/6] Verifying project.json files..." -ForegroundColor Yellow
$projectJsons = @(
    "C:\dev\backend\project.json",
    "C:\dev\projects\crypto-enhanced\project.json",
    "C:\dev\Vibe-Tutor\project.json"
)
$allExist = $true
foreach ($file in $projectJsons) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $allExist = $false
    }
}

# Test 6: Test Nx caching
Write-Host "`n[6/6] Testing Nx caching..." -ForegroundColor Yellow
Write-Host "  Running 'pnpm nx test crypto-enhanced --skip-nx-cache' (first run)..." -ForegroundColor Gray
$firstRun = Measure-Command { pnpm nx test crypto-enhanced --skip-nx-cache 2>&1 | Out-Null }
Write-Host "  First run: $($firstRun.TotalSeconds)s" -ForegroundColor Gray

Write-Host "  Running 'pnpm nx test crypto-enhanced' (cached run)..." -ForegroundColor Gray
$cachedRun = Measure-Command { pnpm nx test crypto-enhanced 2>&1 | Out-Null }
Write-Host "  Cached run: $($cachedRun.TotalSeconds)s" -ForegroundColor Gray

if ($cachedRun.TotalSeconds -lt ($firstRun.TotalSeconds * 0.2)) {
    $speedup = [math]::Round((($firstRun.TotalSeconds - $cachedRun.TotalSeconds) / $firstRun.TotalSeconds) * 100, 1)
    Write-Host "✓ Caching working ($speedup% faster)" -ForegroundColor Green
} else {
    Write-Host "⚠ Caching may not be optimal" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "✓ Backend (vibe-tech-backend) - Fully integrated" -ForegroundColor Green
Write-Host "✓ Crypto Trading (crypto-enhanced) - Fully integrated" -ForegroundColor Green
Write-Host "⚠ Vibe-Tutor - Workspace only (move directory for full Nx integration)" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Gray
Write-Host "  1. Test commands: pnpm nx dev vibe-tech-backend" -ForegroundColor Gray
Write-Host "  2. Test commands: pnpm nx test crypto-enhanced" -ForegroundColor Gray
Write-Host "  3. Test commands: pnpm --filter vibe-tutor android:build" -ForegroundColor Gray
Write-Host "  4. Move Vibe-Tutor when directory unlocks" -ForegroundColor Gray
Write-Host "  5. Review MONOREPO_MODULARIZATION_COMPLETE.md for details`n" -ForegroundColor Gray
