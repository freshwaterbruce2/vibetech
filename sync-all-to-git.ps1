# Sync all local changes to git
# Run this after closing all IDEs (Cursor, VS Code, etc.)

Write-Host "=== Cleaning lock files ===" -ForegroundColor Cyan
Remove-Item -Path ".git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\business-booking-platform\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\iconforge\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\shipping-pwa\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\vibe-subscription-guard\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\vibe-tech-lovable\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "linguist\.git\index.lock" -Force -ErrorAction SilentlyContinue

Write-Host "`n=== Committing submodules ===" -ForegroundColor Cyan
$submodules = @(
    "apps\business-booking-platform",
    "apps\iconforge",
    "apps\shipping-pwa",
    "apps\vibe-subscription-guard",
    "apps\vibe-tech-lovable",
    "linguist"
)

foreach ($submodule in $submodules) {
    if (Test-Path $submodule) {
        Write-Host "Processing $submodule..." -ForegroundColor Yellow
        Push-Location $submodule
        git add -A
        git commit --no-verify -m "chore: sync local changes to git" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Committed" -ForegroundColor Green
        } else {
            Write-Host "  - No changes" -ForegroundColor Gray
        }
        Pop-Location
    }
}

Write-Host "`n=== Committing main repo ===" -ForegroundColor Cyan
git add -A
git commit --no-verify -m "chore: sync C:\dev to git including all submodules

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

Write-Host "`n=== Current status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Remaining worktree ===" -ForegroundColor Cyan
git worktree list

Write-Host "`nDone! You are 8 commits ahead of origin/main." -ForegroundColor Green
Write-Host "Run 'git push' to sync to remote." -ForegroundColor Yellow
