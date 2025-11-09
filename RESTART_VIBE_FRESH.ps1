# Restart Vibe Code Studio with Fresh Build
# Clears all caches to ensure latest fixes are loaded

Write-Host "`n🔄 Restarting Vibe Code Studio with Fresh Build..." -ForegroundColor Cyan

# Stop any running Electron/Vite processes
Write-Host "`n1️⃣ Stopping old processes..." -ForegroundColor Yellow
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Navigate to Vibe directory
Set-Location "C:\dev\projects\active\desktop-apps\deepcode-editor"

# Clear Vite cache
Write-Host "`n2️⃣ Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".vite" -ErrorAction SilentlyContinue

# Clear dist folders
Write-Host "`n3️⃣ Clearing old builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue

# Start fresh dev server
Write-Host "`n4️⃣ Starting fresh development server..." -ForegroundColor Green
pnpm run dev

Write-Host "`n✅ Vibe Code Studio restarting with all fixes!" -ForegroundColor Green
