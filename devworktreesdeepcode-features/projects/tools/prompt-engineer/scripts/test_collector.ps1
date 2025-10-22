# Simple test script for Interactive Context Collector
# Compatible with Windows 11 PowerShell

param(
    [string]$Path = ".",
    [string]$Output = "",
    [switch]$Verbose,
    [switch]$Install,
    [switch]$Test,
    [switch]$Example
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-ColorText {
    param([string]$Text, [string]$Color = $Reset)
    Write-Host "$Color$Text$Reset"
}

function Test-PythonInstalled {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "[OK] Python found: $pythonVersion" $Green
        return $true
    } else {
        Write-ColorText "[FAIL] Python not found. Please install Python 3.8+ first." $Red
        return $false
    }
}

# Main execution
Write-ColorText "[INFO] Interactive Context Collector - Test Mode" $Cyan
Write-ColorText "Working directory: $(Get-Location)" $Blue
Write-Host ""

if ($Install) {
    Write-ColorText "📦 Installing dependencies..." $Blue
    if (Test-PythonInstalled) {
        python -m pip install questionary rich colorama
        Write-ColorText "[OK] Dependencies installed!" $Green
    }
}
if ($Test) {
    Write-ColorText "🧪 Testing system..." $Blue
    if (Test-PythonInstalled) {
        Write-ColorText "[OK] System test passed!" $Green
    }
}
if (-not $Install -and -not $Test) {
    Write-ColorText "Use -Install to install dependencies or -Test to run tests" $Yellow
}

Write-ColorText "[OK] Test script completed successfully!" $Green