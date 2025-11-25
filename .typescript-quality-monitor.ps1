$paths = @("C:\dev", "D:\")
$log = "C:\dev\.typescript-quality-monitor.log"
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$ts] Scanning projects..." -ForegroundColor Cyan
Add-Content -Path $log -Value "[$ts] Starting scan"

$allProj = @()
foreach ($p in $paths) {
    if (Test-Path $p) {
        $found = Get-ChildItem -Path $p -Recurse -Filter "tsconfig.json" -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch "node_modules|dist" } |
            ForEach-Object { $_.Directory.FullName } |
            Select-Object -Unique
        $allProj += $found
    }
}

Write-Host "Found $($allProj.Count) projects"
$errors = 0

foreach ($proj in $allProj) {
    $pkg = Join-Path $proj "package.json"
    if (-not (Test-Path $pkg)) { continue }

    Push-Location $proj
    $mgr = if (Test-Path "pnpm-lock.yaml") { "pnpm" } else { "npm" }

    $content = Get-Content $pkg -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($content.scripts.typecheck) {
        $out = & $mgr run typecheck 2>&1 | Out-String
        $errs = ($out | Select-String "error TS" | Measure-Object).Count
        if ($errs -gt 0) {
            $errors += $errs
            Write-Host "  $((Split-Path $proj -Leaf)): $errs errors" -ForegroundColor Yellow
        }
    }
    Pop-Location
}

if ($errors -gt 0) {
    Write-Host ""
    Write-Host "ALERT: $errors TypeScript errors found!" -ForegroundColor Red
    Add-Content -Path $log -Value "[$ts] ALERT: $errors errors"
} else {
    Write-Host ""
    Write-Host "All projects clean!" -ForegroundColor Green
    Add-Content -Path $log -Value "[$ts] Clean (0 errors)"
}
