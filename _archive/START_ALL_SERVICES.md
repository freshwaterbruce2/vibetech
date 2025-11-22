# 🚀 QUICK START - ALL SERVICES

## ONE-COMMAND STARTUP (PowerShell)

### Option 1: Start All Services in Background
```powershell
# Run this from C:\dev\

# Start backend services
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd D:\task-registry; python task_intelligence_api.py" -WindowStyle Normal
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd D:\ml-service; python app.py" -WindowStyle Normal
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd C:\dev\backend\workflow-engine; npm start" -WindowStyle Normal
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd C:\dev\backend\ipc-bridge; npm start" -WindowStyle Normal

Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify services
Write-Host "🔍 Checking services..." -ForegroundColor Cyan
try {
    Invoke-RestMethod http://127.0.0.1:5001/api/health | Out-Null
    Write-Host "✅ Task Intelligence API (5001) - Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Task Intelligence API (5001) - Failed" -ForegroundColor Red
}

try {
    Invoke-RestMethod http://127.0.0.1:5002/api/health | Out-Null
    Write-Host "✅ ML Intelligence API (5002) - Running" -ForegroundColor Green
} catch {
    Write-Host "❌ ML Intelligence API (5002) - Failed" -ForegroundColor Red
}

try {
    Invoke-RestMethod http://127.0.0.1:5003/api/health | Out-Null
    Write-Host "✅ Workflow Engine (5003) - Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Workflow Engine (5003) - Failed" -ForegroundColor Red
}

try {
    Test-NetConnection localhost -Port 5004 -InformationLevel Quiet | Out-Null
    Write-Host "✅ IPC Bridge (5004) - Running" -ForegroundColor Green
} catch {
    Write-Host "❌ IPC Bridge (5004) - Failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Backend services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Now start the apps:" -ForegroundColor Cyan
Write-Host "   Terminal 1: cd C:\dev\projects\active\desktop-apps\nova-agent-current; npm run tauri dev"
Write-Host "   Terminal 2: cd C:\dev\projects\active\desktop-apps\deepcode-editor; npm run dev:electron"
```

### Option 2: Windows Terminal Layout (Recommended)
```powershell
# Save this as: start-all-services.ps1
# Creates a Windows Terminal with all services in tabs

wt `
  new-tab --title "Task API" pwsh -NoExit -Command "cd D:\task-registry; python task_intelligence_api.py" `; `
  new-tab --title "ML API" pwsh -NoExit -Command "cd D:\ml-service; python app.py" `; `
  new-tab --title "Workflow" pwsh -NoExit -Command "cd C:\dev\backend\workflow-engine; npm start" `; `
  new-tab --title "IPC Bridge" pwsh -NoExit -Command "cd C:\dev\backend\ipc-bridge; npm start" `; `
  new-tab --title "NOVA" pwsh -NoExit -Command "cd C:\dev\projects\active\desktop-apps\nova-agent-current; Write-Host 'Ready to start NOVA. Run: npm run tauri dev' -ForegroundColor Green" `; `
  new-tab --title "Vibe" pwsh -NoExit -Command "cd C:\dev\projects\active\desktop-apps\deepcode-editor; Write-Host 'Ready to start Vibe. Run: npm run dev:electron' -ForegroundColor Green"
```

---

## MANUAL STEP-BY-STEP

### Backend Services (4 terminals)
```powershell
# Terminal 1
cd D:\task-registry
python task_intelligence_api.py

# Terminal 2
cd D:\ml-service
python app.py

# Terminal 3
cd C:\dev\backend\workflow-engine
npm start

# Terminal 4
cd C:\dev\backend\ipc-bridge
npm start
```

### Desktop Apps (2 more terminals)
```powershell
# Terminal 5 - NOVA
cd C:\dev\projects\active\desktop-apps\nova-agent-current
npm run tauri dev

# Terminal 6 - Vibe
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run dev:electron
```

---

## QUICK HEALTH CHECK

```powershell
# Check all services
@(5001, 5002, 5003) | ForEach-Object {
    try {
        $response = Invoke-RestMethod "http://127.0.0.1:$_/api/health" -TimeoutSec 2
        Write-Host "✅ Port $_ - OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ Port $_ - DOWN" -ForegroundColor Red
    }
}

# Check IPC Bridge (WebSocket)
if (Test-NetConnection localhost -Port 5004 -InformationLevel Quiet) {
    Write-Host "✅ Port 5004 (IPC Bridge) - OK" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5004 (IPC Bridge) - DOWN" -ForegroundColor Red
}
```

---

## STOP ALL SERVICES

```powershell
# Kill all services by port
@(5001, 5002, 5003, 5004) | ForEach-Object {
    $port = $_
    $connections = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    $connections | ForEach-Object {
        $pid = $_.ToString().Split(' ')[-1]
        Write-Host "Stopping process on port $port (PID: $pid)"
        taskkill /PID $pid /F 2>$null
    }
}
```

---

## TESTING SHORTCUTS

Once everything is running:

### In NOVA Agent:
- `Ctrl+Shift+P` → @vibe command palette
- `🧠 Intelligence` tab → Task tracking

### In Vibe Code Studio:
- `Ctrl+Shift+P` → @nova command palette
- `Ctrl+Shift+T` → Task intelligence panel

---

See `P3_DEV_TESTING_GUIDE.md` for detailed testing procedures!
