# Build Production Versions - NOVA Agent + Vibe Code Studio
# Run this after committing to test before pushing to GitHub

Write-Host "`nBuilding Production Versions..." -ForegroundColor Cyan
Write-Host "This will take 2-5 minutes`n" -ForegroundColor Yellow

$vibeSuccess = $false
$novaSuccess = $false

Write-Host "`nSTEP 1: Building Vibe Code Studio..." -ForegroundColor Green
Write-Host "Location: C:\dev\projects\active\desktop-apps\deepcode-editor`n" -ForegroundColor Gray

Set-Location "C:\dev\projects\active\desktop-apps\deepcode-editor"

Write-Host "  Cleaning old builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force release-builds -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

Write-Host "  Building TypeScript + Vite bundle..." -ForegroundColor Yellow
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Build successful!" -ForegroundColor Green
    Write-Host "`n  Packaging Electron app for Windows..." -ForegroundColor Yellow
    pnpm run electron:build:win
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Packaging successful!" -ForegroundColor Green
        $vibeSuccess = $true
        
        if (Test-Path ".\release-builds") {
            Write-Host "`n  Output:" -ForegroundColor Cyan
            Get-ChildItem ".\release-builds" -Recurse -Include *.exe | ForEach-Object {
                Write-Host "     $($_.FullName)" -ForegroundColor White
            }
        }
    } else {
        Write-Host "  Packaging failed!" -ForegroundColor Red
    }
} else {
    Write-Host "  Build failed!" -ForegroundColor Red
}

Write-Host "`n`nSTEP 2: Building NOVA Agent..." -ForegroundColor Green
Write-Host "Location: C:\dev\projects\active\desktop-apps\nova-agent-current`n" -ForegroundColor Gray

Set-Location "C:\dev\projects\active\desktop-apps\nova-agent-current"

Write-Host "  Cleaning old builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force src-tauri\target\release -ErrorAction SilentlyContinue

Write-Host "  Building Tauri app (Rust + React)..." -ForegroundColor Yellow
Write-Host "  This may take 3-5 minutes for Rust compilation..." -ForegroundColor Yellow

pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Build successful!" -ForegroundColor Green
    $novaSuccess = $true
    
    if (Test-Path ".\src-tauri\target\release") {
        Write-Host "`n  Output:" -ForegroundColor Cyan
        Get-ChildItem ".\src-tauri\target\release" -Include *.exe | ForEach-Object {
            Write-Host "     $($_.FullName)" -ForegroundColor White
        }
    }
} else {
    Write-Host "  Build failed!" -ForegroundColor Red
}

Write-Host "`n`n======================================================" -ForegroundColor Cyan
Write-Host "                  BUILD SUMMARY                        " -ForegroundColor Cyan
Write-Host "======================================================`n" -ForegroundColor Cyan

if ($vibeSuccess) {
    Write-Host "Vibe Code Studio: READY" -ForegroundColor Green
} else {
    Write-Host "Vibe Code Studio: FAILED" -ForegroundColor Red
}

if ($novaSuccess) {
    Write-Host "NOVA Agent: READY" -ForegroundColor Green
} else {
    Write-Host "NOVA Agent: FAILED" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

if ($vibeSuccess -and $novaSuccess) {
    Write-Host "ALL BUILDS SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the executables" -ForegroundColor White
    Write-Host "  2. Verify integration works" -ForegroundColor White
    Write-Host "  3. Push to GitHub if all good!" -ForegroundColor White
    Write-Host "`n  Run: git push" -ForegroundColor Yellow
} else {
    Write-Host "SOME BUILDS FAILED" -ForegroundColor Yellow
    Write-Host "`nCheck errors above and fix before pushing." -ForegroundColor White
}

Write-Host "`n======================================================`n" -ForegroundColor Cyan

Set-Location "C:\dev"
