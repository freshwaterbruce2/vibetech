# Quick Workflow Status Checker
# Usage: .\tools\workflow-status.ps1

$currentBranch = git branch --show-current 2>$null

if (-not $currentBranch) {
    Write-Host "Not in a git repository" -ForegroundColor Red
    exit
}

if ($currentBranch -eq "main") {
    Write-Host "On main branch" -ForegroundColor Green
    exit
}

$commitsAhead = [int](git rev-list --count main..HEAD 2>$null)

Write-Host "`nGit Workflow Status" -ForegroundColor Cyan
Write-Host "Branch: $currentBranch" -ForegroundColor White
Write-Host "Commits ahead of main: $commitsAhead" -ForegroundColor White

if ($commitsAhead -eq 0) {
    Write-Host "Status: Up to date with main" -ForegroundColor Green
}
elseif ($commitsAhead -le 6) {
    Write-Host "Status: On track - merge at 10 commits" -ForegroundColor Green
}
elseif ($commitsAhead -le 9) {
    Write-Host "Status: Approaching 10 commits - prepare to merge" -ForegroundColor Yellow
}
elseif ($commitsAhead -eq 10) {
    Write-Host "Status: TIME TO MERGE! Run: git imerge" -ForegroundColor Magenta
}
else {
    Write-Host "Status: OVERDUE FOR MERGE! ($commitsAhead commits)" -ForegroundColor Red
    Write-Host "Action: Merge in batches of 10" -ForegroundColor Yellow
}

Write-Host "`nQuick Commands:" -ForegroundColor Cyan
Write-Host "  git commits-ahead  - Check count"
Write-Host "  git sync           - Pull main"
Write-Host "  git imerge         - Merge to main"
Write-Host ""
