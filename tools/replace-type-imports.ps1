# Replace Type Imports Script
# Updates deepcode-editor to use @vibetech/types package

param(
    [switch]$DryRun = $false
)

$projectPath = "C:\dev\projects\active\desktop-apps\deepcode-editor\src"
$replacements = @{
    # Tasks imports
    "from ['`"]\.\.?/types/tasks['`"]" = "from '@vibetech/types/tasks'"
    "from ['`"]\.\.?/\.\.?/types/tasks['`"]" = "from '@vibetech/types/tasks'"
    "from ['`"]\.\./\.\./types/tasks['`"]" = "from '@vibetech/types/tasks'"

    # Errorfix imports
    "from ['`"]\.\.?/types/errorfix['`"]" = "from '@vibetech/types/errorfix'"
    "from ['`"]\.\.?/\.\.?/types/errorfix['`"]" = "from '@vibetech/types/errorfix'"
    "from ['`"]\.\./\.\./types/errorfix['`"]" = "from '@vibetech/types/errorfix'"

    # Multifile imports
    "from ['`"]\.\.?/types/multifile['`"]" = "from '@vibetech/types/multifile'"
    "from ['`"]\.\.?/\.\.?/types/multifile['`"]" = "from '@vibetech/types/multifile'"
    "from ['`"]\.\./\.\./types/multifile['`"]" = "from '@vibetech/types/multifile'"
}

$filesModified = 0
$totalReplacements = 0

Write-Host "`n=== TYPE IMPORT REPLACEMENT STARTING ===`n" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE' })`n" -ForegroundColor Cyan

# Get all TypeScript files
$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.ts","*.tsx" -File | Where-Object {
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*dist*"
}

Write-Host "Found $($files.Count) TypeScript files to check`n" -ForegroundColor White

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileModified = $false

    # Apply each replacement pattern
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]

        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $fileModified = $true
            $totalReplacements++
        }
    }

    if ($fileModified) {
        $relativePath = $file.FullName.Substring($projectPath.Length + 1)

        if ($DryRun) {
            Write-Host "[DRY RUN] Would update: $relativePath" -ForegroundColor Yellow
        } else {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "[UPDATED] $relativePath" -ForegroundColor Green
        }

        $filesModified++
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Files modified: $filesModified" -ForegroundColor $(if ($filesModified -gt 0) { "Green" } else { "White" })
Write-Host "Total replacements: $totalReplacements" -ForegroundColor $(if ($totalReplacements -gt 0) { "Green" } else { "White" })

if ($DryRun) {
    Write-Host "`nRun without -DryRun to apply changes" -ForegroundColor Yellow
}
