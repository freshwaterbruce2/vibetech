#!/usr/bin/env powershell
# Debug hook to see what data Claude Code actually sends

$LogFile = "D:\learning-system\logs\hook-debug-$(Get-Date -Format 'yyyy-MM-dd').log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

# Log environment variables
$EnvVars = Get-ChildItem Env: | Where-Object { $_.Name -like "CLAUDE*" } | ForEach-Object { "$($_.Name)=$($_.Value)" }
Add-Content -Path "$LogFile" -Value "[$Timestamp] Environment Variables: $($EnvVars -join ', ')" -ErrorAction SilentlyContinue

# Try to read STDIN
$StdinAvailable = -not [Console]::IsInputRedirected
Add-Content -Path "$LogFile" -Value "[$Timestamp] STDIN Available: $StdinAvailable" -ErrorAction SilentlyContinue

if ([Console]::IsInputRedirected) {
    $StdinData = @()
    $reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput())
    while ($null -ne ($line = $reader.ReadLine())) {
        $StdinData += $line
    }
    $JsonInput = $StdinData -join "`n"
    Add-Content -Path "$LogFile" -Value "[$Timestamp] STDIN Data: $JsonInput" -ErrorAction SilentlyContinue
} else {
    Add-Content -Path "$LogFile" -Value "[$Timestamp] No STDIN data" -ErrorAction SilentlyContinue
}

# Log command line args
Add-Content -Path "$LogFile" -Value "[$Timestamp] Args: $($args -join ', ')" -ErrorAction SilentlyContinue

exit 0
