# FILE_CLEANUP_EXECUTE.ps1
# Automated cleanup script for deepcode-editor project
# Generated: November 6, 2025

param(
    [switch]$DryRun = $false,
    [switch]$SkipPhase2 = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = "C:\dev\projects\active\desktop-apps\deepcode-editor"

# Change to project directory
Set-Location $projectRoot

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "       DeepCode Editor - File Cleanup Script" -ForegroundColor Cyan
Write-Host "       Generated: November 6, 2025" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "[DRY RUN] DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
    Write-Host ""
}

# Phase 1: Delete test outputs and backups
Write-Host "Phase 1: Deleting test outputs and backups..." -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor DarkGray

$testFiles = @(
    "test-output.txt",
    "test-output-iteration2.txt",
    "test-results.json",
    "test-failures-analysis.txt",
    "test-summary.txt"
)

$backupFiles = @(
    "electron\database-handler.ts.backup"
)

$deletedCount = 0
$deletedSize = 0

foreach ($file in ($testFiles + $backupFiles)) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $sizeKB = [math]::Round($size / 1KB, 2)

        if ($DryRun) {
            Write-Host "  [DRY RUN] Would delete: $file ($sizeKB KB)" -ForegroundColor Yellow
        } else {
            Remove-Item $file -Force
            Write-Host "  [OK] Deleted: $file ($sizeKB KB)" -ForegroundColor Green
        }

        $deletedCount++
        $deletedSize += $size
    } else {
        Write-Host "  [SKIP] Not found: $file" -ForegroundColor DarkGray
    }
}

$deletedSizeMB = [math]::Round($deletedSize / 1MB, 2)
Write-Host "`n[OK] Phase 1 Complete: $deletedCount files deleted (~$deletedSizeMB MB)" -ForegroundColor Green

# Phase 2: Move root docs to archive
if (-not $SkipPhase2) {
    Write-Host "`nPhase 2: Moving root documentation to archive..." -ForegroundColor Cyan
    Write-Host "------------------------------------------------" -ForegroundColor DarkGray

    $archiveDir = "docs\archive\cleanup-2025-11-06"

    if (-not (Test-Path $archiveDir)) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would create: $archiveDir" -ForegroundColor Yellow
        } else {
            New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
            Write-Host "  [OK] Created archive directory: $archiveDir" -ForegroundColor Green
        }
    } else {
        Write-Host "  [OK] Archive directory exists: $archiveDir" -ForegroundColor Gray
    }

    $filesToMove = @(
        "BACKGROUND_AGENT_SESSION_SUMMARY.md",
        "COMPLETION_SUMMARY_OCT_22_2025.md",
        "DEBUG_SESSION_2025-10-16.md",
        "FINAL_DELIVERY_SUMMARY.md",
        "FINAL_SESSION_SUMMARY.md",
        "FINAL_SESSION_SUMMARY_2025-10-25.md",
        "FINAL_SESSION_SUMMARY_OCT_21_2025.md",
        "MODULAR_REFACTOR_SUMMARY.md",
        "PROJECT_ANALYSIS_FINAL.md",
        "SESSION_LEARNINGS_2025-10-25_E2E_MIGRATION.md",
        "SESSION_PROGRESS_2025-10-25.md",
        "SESSION_STATUS_OCT_22_2025.md",
        "TEST_COVERAGE_FINAL_SUMMARY.md",
        "TEST_COVERAGE_IMPROVEMENT_SUMMARY.md",
        "TEST_COVERAGE_SESSION_2_SUMMARY.md",
        "TYPESCRIPT_CLEANUP_SESSION.md",
        "YOLO_MODE_FINAL_SUMMARY_OCT_22_2025.md"
    )

    $movedCount = 0
    foreach ($file in $filesToMove) {
        if (Test-Path $file) {
            if ($DryRun) {
                Write-Host "  [DRY RUN] Would move: $file -> $archiveDir\" -ForegroundColor Yellow
            } else {
                Move-Item $file "$archiveDir\" -Force
                Write-Host "  [OK] Moved: $file" -ForegroundColor Green
            }
            $movedCount++
        } else {
            Write-Host "  [SKIP] Not found: $file" -ForegroundColor DarkGray
        }
    }

    Write-Host "`n[OK] Phase 2 Complete: $movedCount files moved to archive" -ForegroundColor Green
} else {
    Write-Host "`n[SKIP] Phase 2 Skipped (use without -SkipPhase2 to enable)" -ForegroundColor Yellow
}

# Phase 3: Verification
Write-Host "`nPhase 3: Verification..." -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor DarkGray

$rootMdFiles = Get-ChildItem -Path . -Filter "*.md" -File | Where-Object { $_.Name -notlike "node_modules*" }
$rootMdCount = $rootMdFiles.Count

Write-Host "  Root .md files remaining: $rootMdCount" -ForegroundColor Gray
Write-Host "    (Essential docs + active summaries)" -ForegroundColor DarkGray

if (Test-Path "docs\archive\cleanup-2025-11-06") {
    $archivedFiles = Get-ChildItem -Path "docs\archive\cleanup-2025-11-06" -Filter "*.md"
    $archivedCount = $archivedFiles.Count
    Write-Host "  Files in new archive: $archivedCount" -ForegroundColor Gray
}

$testOutputsRemaining = @(Get-ChildItem -Path . -Filter "test-*.txt" -File) + @(Get-ChildItem -Path . -Filter "test-*.json" -File)
$testOutputCount = $testOutputsRemaining.Count
if ($testOutputCount -eq 0) {
    Write-Host "  [OK] No test output files remaining" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Warning: $testOutputCount test output files still present" -ForegroundColor Yellow
}

$backupsRemaining = Get-ChildItem -Path . -Filter "*.backup" -Recurse
$backupCount = $backupsRemaining.Count
if ($backupCount -eq 0) {
    Write-Host "  [OK] No backup files remaining" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Warning: $backupCount backup files still present" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "                    CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] DRY RUN - No changes were made" -ForegroundColor Yellow
    Write-Host "  Run without -DryRun to execute cleanup" -ForegroundColor Gray
} else {
    Write-Host "  [SUCCESS] Cleanup completed successfully!" -ForegroundColor Green
    Write-Host "  Disk space recovered: ~$deletedSizeMB MB" -ForegroundColor Cyan
    Write-Host "  Files deleted: $deletedCount" -ForegroundColor Cyan
    if (-not $SkipPhase2) {
        Write-Host "  Files archived: $movedCount" -ForegroundColor Cyan
    }
    Write-Host "  Root directory reduction: ~63%" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review FILE_CLEANUP_PLAN.md for details" -ForegroundColor Gray
Write-Host "  2. Run git status to see changes" -ForegroundColor Gray
Write-Host "  3. Commit cleanup changes if satisfied" -ForegroundColor Gray
Write-Host ""

# Exit with success
exit 0
