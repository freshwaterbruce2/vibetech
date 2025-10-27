# Start DeepCode Editor in development mode
# Usage: .\dev.ps1

Write-Host "🚀 Starting DeepCode Editor..." -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies first..." -ForegroundColor Yellow
    pnpm install
}

# Start development server
Write-Host "🔨 Starting dev server on http://localhost:5174" -ForegroundColor Green
pnpm dev
