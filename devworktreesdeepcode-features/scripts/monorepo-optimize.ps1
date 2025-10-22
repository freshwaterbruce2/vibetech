# Monorepo Optimization Script
# Consolidates cleanup scripts and optimizes directory structure

param(
    [switch]$DryRun,
    [switch]$Deep,
    [switch]$CleanCache,
    [switch]$AnalyzeSize
)

Write-Host "🚀 Monorepo Optimization Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Get current directory size if analyzing
if ($AnalyzeSize) {
    Write-Host "📊 Analyzing directory sizes..." -ForegroundColor Yellow
    $sizeBefore = (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Current total size: $([math]::Round($sizeBefore, 2)) MB" -ForegroundColor Green
}

# Define cleanup patterns
$cleanupPatterns = @(
    "fix-*.ps1",
    "fix-*.bat",
    "claude-code-fix.ps1",
    "*.log",
    "nx-init.log"
)

$deepCleanPatterns = @(
    "node_modules",
    ".nx/cache",
    ".turbo",
    "dist",
    "playwright-report",
    "**/__pycache__",
    "**/*.pyc"
)

# Function to show what would be deleted
function Show-CleanupPreview {
    param($patterns, $description)

    Write-Host "🔍 $description cleanup preview:" -ForegroundColor Yellow
    foreach ($pattern in $patterns) {
        $items = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
        if ($items) {
            foreach ($item in $items) {
                Write-Host "  - $($item.FullName)" -ForegroundColor Gray
            }
        }
    }
}

# Function to perform cleanup
function Invoke-Cleanup {
    param($patterns, $description)

    Write-Host "🧹 Performing $description cleanup..." -ForegroundColor Green
    foreach ($pattern in $patterns) {
        try {
            $items = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
            foreach ($item in $items) {
                if ($DryRun) {
                    Write-Host "  [DRY RUN] Would remove: $($item.FullName)" -ForegroundColor Yellow
                } else {
                    Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    Write-Host "  ✓ Removed: $($item.Name)" -ForegroundColor Green
                }
            }
        }
        catch {
            Write-Host "  ⚠️  Could not remove $pattern" -ForegroundColor Yellow
        }
    }
}

# Consolidate fix scripts into tools directory
function Optimize-FixScripts {
    Write-Host "📦 Consolidating fix scripts..." -ForegroundColor Blue

    if (-not (Test-Path "tools")) {
        if (-not $DryRun) { New-Item -ItemType Directory -Name "tools" }
        Write-Host "  ✓ Created tools directory" -ForegroundColor Green
    }

    $fixScripts = Get-ChildItem -Path "fix-*.*" -ErrorAction SilentlyContinue
    foreach ($script in $fixScripts) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would move: $($script.Name) -> tools/" -ForegroundColor Yellow
        } else {
            Move-Item -Path $script.FullName -Destination "tools/" -ErrorAction SilentlyContinue
            Write-Host "  ✓ Moved: $($script.Name)" -ForegroundColor Green
        }
    }
}

# Main execution
if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Show-CleanupPreview $cleanupPatterns "Standard"
    if ($Deep) {
        Show-CleanupPreview $deepCleanPatterns "Deep"
    }
} else {
    # Standard cleanup
    Invoke-Cleanup $cleanupPatterns "standard"

    # Deep cleanup if requested
    if ($Deep) {
        Invoke-Cleanup $deepCleanPatterns "deep"
    }

    # Consolidate fix scripts
    Optimize-FixScripts

    # Clean cache if requested
    if ($CleanCache) {
        Write-Host "🗑️  Cleaning cache directories..." -ForegroundColor Blue
        $cachePaths = @(".nx/cache", ".turbo", "node_modules/.cache")
        Invoke-Cleanup $cachePaths "cache"
    }
}

# Show size difference if analyzing
if ($AnalyzeSize -and -not $DryRun) {
    $sizeAfter = (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    $sizeSaved = $sizeBefore - $sizeAfter
    Write-Host "📊 Size after cleanup: $([math]::Round($sizeAfter, 2)) MB" -ForegroundColor Green
    Write-Host "💾 Space saved: $([math]::Round($sizeSaved, 2)) MB" -ForegroundColor Cyan
}

Write-Host "✅ Monorepo optimization complete!" -ForegroundColor Green