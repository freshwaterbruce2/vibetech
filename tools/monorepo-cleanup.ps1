# Monorepo Cleanup Script
# Removes unused files, build artifacts, and organizes the workspace

param(
    [switch]$DryRun = $true,
    [switch]$Aggressive = $false
)

$cleanupLog = @()
$totalSaved = 0

function Log-Cleanup {
    param($message, $color = "White")
    Write-Host $message -ForegroundColor $color
    $script:cleanupLog += $message
}

function Remove-SafeItem {
    param($path, $description)

    if (Test-Path $path) {
        $size = (Get-Item $path -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB

        if ($DryRun) {
            Log-Cleanup "[DRY RUN] Would remove: $description ($path) - $([math]::Round($size, 2)) MB" "Yellow"
        } else {
            Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
            Log-Cleanup "[REMOVED] $description - $([math]::Round($size, 2)) MB" "Green"
            $script:totalSaved += $size
        }
    }
}

Log-Cleanup "`n=== MONOREPO CLEANUP STARTING ===" "Cyan"
Log-Cleanup "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE CLEANUP' })" "Cyan"

# 1. Remove duplicate UI components now using @vibetech/ui
Log-Cleanup "`n--- Phase 1: Remove Duplicate UI Components ---" "Magenta"
$duplicateComponents = @(
    "C:\dev\projects\active\web-apps\shipping-pwa\src\components\ui\button.tsx",
    "C:\dev\projects\active\web-apps\shipping-pwa\src\components\ui\card.tsx",
    "C:\dev\projects\active\web-apps\shipping-pwa\src\components\ui\badge.tsx",
    "C:\dev\projects\active\web-apps\shipping-pwa\src\components\ui\input.tsx"
)

foreach ($component in $duplicateComponents) {
    Remove-SafeItem $component "Duplicate UI component (now in @vibetech/ui)"
}

# 2. Remove build artifacts
Log-Cleanup "`n--- Phase 2: Build Artifacts ---" "Magenta"
$buildDirs = Get-ChildItem -Path "C:\dev\projects" -Recurse -Directory -Include "dist", "build", ".next", ".nuxt", "out" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($dir in $buildDirs) {
    Remove-SafeItem $dir.FullName "Build directory"
}

# 3. Remove cache directories
Log-Cleanup "`n--- Phase 3: Cache Directories ---" "Magenta"
$cacheDirs = Get-ChildItem -Path "C:\dev\projects" -Recurse -Directory -Include ".cache", ".vite", ".turbo", ".parcel-cache", ".nx" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($dir in $cacheDirs) {
    Remove-SafeItem $dir.FullName "Cache directory"
}

# 4. Remove test coverage reports
Log-Cleanup "`n--- Phase 4: Test Coverage Reports ---" "Magenta"
$coverageDirs = Get-ChildItem -Path "C:\dev\projects" -Recurse -Directory -Include "coverage", ".nyc_output", "test-results" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($dir in $coverageDirs) {
    Remove-SafeItem $dir.FullName "Coverage report"
}

# 5. Remove old lockfiles if using pnpm
Log-Cleanup "`n--- Phase 5: Old Lockfiles ---" "Magenta"
$oldLockfiles = Get-ChildItem -Path "C:\dev\projects" -Recurse -File -Include "package-lock.json", "yarn.lock" -ErrorAction SilentlyContinue

foreach ($file in $oldLockfiles) {
    Remove-SafeItem $file.FullName "Old lockfile (using pnpm now)"
}

# 6. Remove .DS_Store and Thumbs.db
Log-Cleanup "`n--- Phase 6: OS Junk Files ---" "Magenta"
$osJunk = Get-ChildItem -Path "C:\dev" -Recurse -File -Include ".DS_Store", "Thumbs.db", "desktop.ini" -ErrorAction SilentlyContinue

foreach ($file in $osJunk) {
    Remove-SafeItem $file.FullName "OS junk file"
}

# 7. Remove duplicate documentation (if aggressive mode)
if ($Aggressive) {
    Log-Cleanup "`n--- Phase 7: Duplicate Documentation (AGGRESSIVE) ---" "Magenta"

    # Find duplicate README files
    $readmes = Get-ChildItem -Path "C:\dev\projects" -Recurse -File -Filter "README*.md" -ErrorAction SilentlyContinue |
        Group-Object Name |
        Where-Object { $_.Count -gt 1 }

    foreach ($group in $readmes) {
        Log-Cleanup "Found $($group.Count) copies of $($group.Name)" "Yellow"
    }
}

# 8. Find large files
Log-Cleanup "`n--- Phase 8: Large Files Audit ---" "Magenta"
$largeFiles = Get-ChildItem -Path "C:\dev\projects" -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 10MB -and $_.FullName -notlike "*node_modules*" } |
    Sort-Object Length -Descending |
    Select-Object -First 10

foreach ($file in $largeFiles) {
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Log-Cleanup "[LARGE FILE] $($file.FullName) - $sizeMB MB" "Yellow"
}

# 9. Remove old test output files
Log-Cleanup "`n--- Phase 9: Test Output Files ---" "Magenta"
$testOutputs = Get-ChildItem -Path "C:\dev\projects\active\desktop-apps\deepcode-editor" -File -Filter "test_output*.txt" -ErrorAction SilentlyContinue

foreach ($file in $testOutputs) {
    Remove-SafeItem $file.FullName "Test output file"
}

# 10. Clean up temporary markdown files
Log-Cleanup "`n--- Phase 10: Temporary Documentation ---" "Magenta"
$tempDocs = @(
    "C:\dev\projects\active\desktop-apps\deepcode-editor\DATABASE_INIT_FIXES.md",
    "C:\dev\projects\active\desktop-apps\deepcode-editor\DATABASE_IPC_TODO.md",
    "C:\dev\projects\active\desktop-apps\deepcode-editor\LOADING_ISSUE_INVESTIGATION_LOG.md",
    "C:\dev\projects\active\desktop-apps\deepcode-editor\GIT_COMMIT_MESSAGE.txt",
    "C:\dev\nul"
)

foreach ($doc in $tempDocs) {
    if (Test-Path $doc) {
        Remove-SafeItem $doc "Temporary documentation file"
    }
}

# Summary
Log-Cleanup "`n=== CLEANUP SUMMARY ===" "Cyan"
Log-Cleanup "Mode: $(if ($DryRun) { 'DRY RUN - No files were deleted' } else { 'LIVE - Files were deleted' })" "Cyan"
Log-Cleanup "Total space that would be saved: $([math]::Round($totalSaved, 2)) MB" "Green"

if ($DryRun) {
    Log-Cleanup "`nRun with -DryRun:`$false to perform actual cleanup" "Yellow"
}

# Save log
$logPath = "C:\dev\cleanup-log-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
$cleanupLog | Out-File $logPath
Log-Cleanup "`nLog saved to: $logPath" "Cyan"
