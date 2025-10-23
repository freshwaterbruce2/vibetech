#!/usr/bin/env powershell
# Custom Status Line - Real-time Context (< 100ms execution)
# Shows: [project:branch] Modified: N | Nx Cache: ✓/✗ | Time: HH:MM

$ErrorActionPreference = "SilentlyContinue"

try {
    # Quick git info
    $branch = git branch --show-current 2>$null
    if (-not $branch) { $branch = "no-repo" }

    # Modified files count
    $modified = 0
    $statusLines = git status --porcelain 2>$null
    if ($statusLines) {
        $modified = ($statusLines | Measure-Object).Count
    }

    # Nx cache status (ASCII-safe)
    $nxCache = if (Test-Path ".nx/cache") { "YES" } else { "NO" }

    # Project name (truncate if too long)
    $projectPath = Get-Location
    $project = Split-Path -Leaf $projectPath
    if ($project.Length -gt 25) {
        $project = $project.Substring(0, 22) + "..."
    }

    # Current time
    $time = Get-Date -Format "HH:mm"

    # Build status line
    $statusLine = "[$project`:$branch] Modified: $modified | Nx Cache: $nxCache | $time"

    Write-Output $statusLine

} catch {
    # Fallback if anything fails
    $project = Split-Path -Leaf (Get-Location)
    Write-Output "[$project] Status unavailable"
}
