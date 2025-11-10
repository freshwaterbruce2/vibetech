# Test Production Build - Complete Integration Test
# Tests IPC Bridge + NOVA Agent + Vibe Code Studio

Write-Host "`n🧪 Testing Production Build - Full Integration" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# ============================================
# STEP 1: START IPC BRIDGE
# ============================================

Write-Host "📡 STEP 1: Starting IPC Bridge..." -ForegroundColor Green

Set-Location "C:\dev\backend\ipc-bridge"

# Check if dependencies installed
if (-not (Test-Path ".\node_modules")) {
    Write-Host "  Installing IPC Bridge dependencies..." -ForegroundColor Yellow
    npm install
}

# Start IPC Bridge in background
Write-Host "  Starting WebSocket server on port 5004..." -ForegroundColor Yellow
$ipcBridge = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\dev\backend\ipc-bridge; npm start" -PassThru

Start-Sleep -Seconds 3

# Verify it's running
$bridgeRunning = netstat -ano | Select-String ":5004.*LISTENING"
if ($bridgeRunning) {
    Write-Host "  ✅ IPC Bridge running on port 5004" -ForegroundColor Green
} else {
    Write-Host "  ❌ IPC Bridge failed to start!" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: BUILD VIBE CODE STUDIO (PRODUCTION)
# ============================================

Write-Host "`n📦 STEP 2: Building Vibe Code Studio (Production)..." -ForegroundColor Green

Set-Location "C:\dev\projects\active\desktop-apps\deepcode-editor"

# Clean
Write-Host "  Cleaning old builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist, out, release-builds, node_modules\.vite -ErrorAction SilentlyContinue

# Build
Write-Host "  Building production bundle..." -ForegroundColor Yellow
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Vibe build successful!" -ForegroundColor Green

    # Package
    Write-Host "`n  Packaging Electron app..." -ForegroundColor Yellow
    pnpm run electron:build:win

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Vibe packaged successfully!" -ForegroundColor Green
        $vibeExe = Get-ChildItem ".\release-builds" -Recurse -Include "Vibe*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($vibeExe) {
            Write-Host "  📁 Executable: $($vibeExe.FullName)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  ❌ Vibe packaging failed!" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Vibe build failed!" -ForegroundColor Red
}

# ============================================
# STEP 3: BUILD NOVA AGENT (PRODUCTION)
# ============================================

Write-Host "`n📦 STEP 3: Building NOVA Agent (Production)..." -ForegroundColor Green

Set-Location "C:\dev\projects\active\desktop-apps\nova-agent-current"

# Clean
Write-Host "  Cleaning old builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force src-tauri\target\release -ErrorAction SilentlyContinue

# Build Tauri (Frontend + Rust backend)
Write-Host "  Building Tauri app..." -ForegroundColor Yellow
Write-Host "  ⏰ Rust compilation may take 5-10 minutes..." -ForegroundColor Yellow

pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ NOVA build successful!" -ForegroundColor Green
    $novaExe = Get-ChildItem ".\src-tauri\target\release" -Include "nova-agent.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($novaExe) {
        Write-Host "  📁 Executable: $($novaExe.FullName)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ❌ NOVA build failed!" -ForegroundColor Red
}

# ============================================
# STEP 4: INTEGRATION TEST
# ============================================

Write-Host "`n`n🧪 STEP 4: Integration Test Instructions" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "IPC Bridge is running. Now test the integration:`n" -ForegroundColor Yellow

Write-Host "1️⃣  Start NOVA Agent (production build):" -ForegroundColor White
Write-Host "   cd C:\dev\projects\active\desktop-apps\nova-agent-current\src-tauri\target\release" -ForegroundColor Gray
Write-Host "   .\nova-agent.exe`n" -ForegroundColor Gray

Write-Host "2️⃣  Start Vibe Code Studio (production build):" -ForegroundColor White
Write-Host "   (Find the .exe in release-builds folder and run it)`n" -ForegroundColor Gray

Write-Host "3️⃣  Test Integration:" -ForegroundColor White
Write-Host "   ✓ Both apps show green IPC indicators" -ForegroundColor Gray
Write-Host "   ✓ NOVA Files tab → Right-click → 'Open in Vibe'" -ForegroundColor Gray
Write-Host "   ✓ File opens in Vibe Monaco editor" -ForegroundColor Gray
Write-Host "   ✓ No console errors`n" -ForegroundColor Gray

Write-Host "4️⃣  If everything works:" -ForegroundColor White
Write-Host "   git push origin yolo-auto-fix  (Vibe)" -ForegroundColor Gray
Write-Host "   git push origin master         (NOVA)`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# ============================================
# SUMMARY
# ============================================

Write-Host "`n📊 BUILD SUMMARY:`n" -ForegroundColor Cyan

$vibeStatus = if (Test-Path "C:\dev\projects\active\desktop-apps\deepcode-editor\release-builds") { "✅ READY" } else { "❌ FAILED" }
$novaStatus = if (Test-Path "C:\dev\projects\active\desktop-apps\nova-agent-current\src-tauri\target\release\nova-agent.exe") { "✅ READY" } else { "❌ FAILED" }

Write-Host "  Vibe Code Studio: $vibeStatus" -ForegroundColor $(if ($vibeStatus -like "*✅*") { "Green" } else { "Red" })
Write-Host "  NOVA Agent: $novaStatus" -ForegroundColor $(if ($novaStatus -like "*✅*") { "Green" } else { "Red" })
Write-Host "  IPC Bridge: ✅ RUNNING (PID $($ipcBridge.Id))`n" -ForegroundColor Green

Write-Host "To stop IPC Bridge later:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Id $($ipcBridge.Id) -Force`n" -ForegroundColor Gray

Set-Location "C:\dev"
