# Permanent PATH Fix Script - Run as Administrator

Write-Host "=== Desktop Commander PATH Fix ===" -ForegroundColor Green

# Get current system and user PATH
$systemPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")

Write-Host "Cleaning System PATH..." -ForegroundColor Cyan
$systemPathArray = $systemPath -split ';' | Select-Object -Unique | Where-Object { $_ -ne '' }

# Essential Windows directories that must be present
$essentialPaths = @(
    "C:\Windows\System32",
    "C:\Windows",
    "C:\Windows\System32\Wbem",
    "C:\Windows\System32\WindowsPowerShell\v1.0\"
)

# Add missing essential paths
foreach ($path in $essentialPaths) {
    if ($systemPathArray -notcontains $path -and (Test-Path $path)) {
        Write-Host "Adding missing essential path: $path" -ForegroundColor Yellow
        $systemPathArray += $path
    }
}

$cleanSystemPath = $systemPathArray -join ';'

Write-Host "Cleaning User PATH..." -ForegroundColor Cyan
$cleanUserPath = ($userPath -split ';' | Select-Object -Unique | Where-Object { $_ -ne '' }) -join ';'

Write-Host "Setting permanent PATH..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("PATH", $cleanSystemPath, "Machine")
[Environment]::SetEnvironmentVariable("PATH", $cleanUserPath, "User")

Write-Host "PATH cleanup complete! Restart PowerShell to see changes." -ForegroundColor Green
