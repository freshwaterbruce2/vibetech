# Replace local UI component imports with @vibetech/ui in shipping-pwa
$projectPath = "C:\dev\projects\active\web-apps\shipping-pwa\src"

# Components to replace
$components = @('button', 'card', 'badge', 'input')

# Find all TypeScript/TSX files
$files = Get-ChildItem -Path $projectPath -Recurse -Include *.tsx,*.ts

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileChanged = $false

    foreach ($component in $components) {
        # Pattern 1: from "@/components/ui/button"
        $pattern1 = 'from ["'']@/components/ui/' + $component + '["'']'
        $replacement1 = 'from "@vibetech/ui"'

        if ($content -match $pattern1) {
            $content = $content -replace $pattern1, $replacement1
            $fileChanged = $true
            Write-Host "  Replaced $component import in $($file.Name)" -ForegroundColor Green
        }

        # Pattern 2: from "../components/ui/button" or similar relative paths
        $pattern2 = 'from ["'']\.\.?/[^"'']*/' + $component + '["'']'
        $relativeMatch = [regex]::Match($content, $pattern2)
        if ($relativeMatch.Success -and $relativeMatch.Value -like "*components/ui/$component*") {
            $content = $content -replace $pattern2, $replacement1
            $fileChanged = $true
            Write-Host "  Replaced relative $component import in $($file.Name)" -ForegroundColor Green
        }
    }

    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalReplacements++
    }
}

Write-Host "`nCompleted: $totalReplacements files updated" -ForegroundColor Cyan
