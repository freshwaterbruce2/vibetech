# PowerShell script to run the Interactive Context Collector
# Compatible with Windows 11 PowerShell

param(
    [string]$Path = ".",
    [string]$Output = "",
    [switch]$Verbose,
    [switch]$Install,
    [switch]$Test,
    [switch]$Example
)

$ErrorActionPreference = "Stop"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-ColorText {
    param([string]$Text, [string]$Color = $Reset)
    Write-Host "$Color$Text$Reset"
}

function Show-Help {
    Write-ColorText "[INFO] Interactive Context Collector - PowerShell Runner" $Cyan
    Write-ColorText "=" * 60 $Blue
    Write-Host ""
    Write-ColorText "USAGE:" $Yellow
    Write-Host "  .\scripts\run_collector.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorText "OPTIONS:" $Yellow
    Write-Host "  -Path [path]     Base path for context collection (default: current directory)"
    Write-Host "  -Output [file]   Output file path for results"
    Write-Host "  -Verbose         Enable verbose logging"
    Write-Host "  -Install         Install required dependencies"
    Write-Host "  -Test           Run unit tests"
    Write-Host "  -Example        Run example usage script"
    Write-Host ""
    Write-ColorText "EXAMPLES:" $Yellow
    Write-Host "  # Install dependencies"
    Write-Host "  .\scripts\run_collector.ps1 -Install"
    Write-Host ""
    Write-Host "  # Run interactive collector on current directory"
    Write-Host "  .\scripts\run_collector.ps1"
    Write-Host ""
    Write-Host "  # Run on specific path with output file"
    Write-Host "  .\scripts\run_collector.ps1 -Path C:\dev\my-project -Output results.json"
    Write-Host ""
    Write-Host "  # Run with verbose logging"
    Write-Host "  .\scripts\run_collector.ps1 -Verbose"
    Write-Host ""
    Write-Host "  # Run tests"
    Write-Host "  .\scripts\run_collector.ps1 -Test"
    Write-Host ""
    Write-Host "  # See example usage"
    Write-Host "  .\scripts\run_collector.ps1 -Example"
}

function Test-PythonInstalled {
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "[OK] Python found: $pythonVersion" $Green
            return $true
        }
    }
    catch {
        Write-ColorText "[FAIL] Python not found. Please install Python 3.8+ first." $Red
        return $false
    }
    return $false
}

function Install-Dependencies {
    Write-ColorText "📦 Installing dependencies..." $Blue
    
    if (-not (Test-PythonInstalled)) {
        exit 1
    }
    
    $requirementsFile = "requirements.txt"
    if (-not (Test-Path $requirementsFile)) {
        Write-ColorText "❌ requirements.txt not found in current directory" $Red
        exit 1
    }
    
    try {
        Write-ColorText "Installing packages from requirements.txt..." $Yellow
        python -m pip install -r $requirementsFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Dependencies installed successfully!" $Green
        } else {
            Write-ColorText "❌ Failed to install dependencies" $Red
            exit 1
        }
    }
    catch {
        Write-ColorText "❌ Error installing dependencies: $_" $Red
        exit 1
    }
}

function Run-Tests {
    Write-ColorText "🧪 Running unit tests..." $Blue
    
    if (-not (Test-PythonInstalled)) {
        exit 1
    }
    
    if (-not (Test-Path "tests")) {
        Write-ColorText "❌ tests directory not found" $Red
        exit 1
    }
    
    try {
        Write-ColorText "Running pytest..." $Yellow
        python -m pytest tests/ -v --tb=short
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ All tests passed!" $Green
        } else {
            Write-ColorText "❌ Some tests failed" $Red
            exit 1
        }
    }
    catch {
        Write-ColorText "❌ Error running tests: $_" $Red
        exit 1
    }
}

function Run-Example {
    Write-ColorText "📚 Running example usage script..." $Blue
    
    if (-not (Test-PythonInstalled)) {
        exit 1
    }
    
    $exampleScript = "examples\example_usage.py"
    if (-not (Test-Path $exampleScript)) {
        Write-ColorText "❌ Example script not found: $exampleScript" $Red
        exit 1
    }
    
    try {
        python $exampleScript
    }
    catch {
        Write-ColorText "❌ Error running example: $_" $Red
        exit 1
    }
}

function Run-Collector {
    Write-ColorText "🔍 Starting Interactive Context Collector..." $Blue
    
    if (-not (Test-PythonInstalled)) {
        exit 1
    }
    
    $collectorScript = "src\collectors\interactive_collector.py"
    if (-not (Test-Path $collectorScript)) {
        Write-ColorText "❌ Collector script not found: $collectorScript" $Red
        exit 1
    }
    
    # Build command arguments
    $args = @()
    
    if ($Path -ne ".") {
        $args += "--path"
        $args += $Path
    }
    
    if ($Output -ne "") {
        $args += "--output"
        $args += $Output
    }
    
    if ($Verbose) {
        $args += "--verbose"
    }
    
    try {
        Write-ColorText "Launching collector with args: $($args -join ' ')" $Yellow
        Write-ColorText "Use Ctrl+C to cancel at any time" $Magenta
        Write-Host ""
        
        if ($args.Count -gt 0) {
            python $collectorScript $args
        } else {
            python $collectorScript
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "`n✅ Context collection completed successfully!" $Green
        } else {
            Write-ColorText "`n❌ Context collection failed or was cancelled" $Red
        }
    }
    catch {
        Write-ColorText "❌ Error running collector: $_" $Red
        exit 1
    }
}

# Main execution logic
try {
    # Change to script directory
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    Set-Location $projectRoot
    
    Write-ColorText "🔍 Interactive Context Collector" $Cyan
    Write-ColorText "Working directory: $(Get-Location)" $Blue
    Write-Host ""
    
    # Handle different operations
    if ($Install) {
        Install-Dependencies
    }
    elseif ($Test) {
        Run-Tests
    }
    elseif ($Example) {
        Run-Example
    }
    else {
        # Check if dependencies might need to be installed
        $hasQuestionary = python -c "import questionary" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "⚠️  Dependencies may not be installed." $Yellow
            Write-ColorText "Run with -Install flag to install required packages." $Yellow
            Write-Host ""
            
            $choice = Read-Host "Install dependencies now? (y/N)"
            if ($choice -eq "y" -or $choice -eq "Y") {
                Install-Dependencies
                Write-Host ""
            }
        }
        
        Run-Collector
    }
}
catch {
    Write-ColorText "❌ Unexpected error: $_" $Red
    exit 1
}

# Show help if no arguments provided and not in interactive mode
if ($args.Count -eq 0 -and -not $Install -and -not $Test -and -not $Example) {
    Write-Host ""
    $msg = "Use -Install to install dependencies, -Test to run tests, or -Example for usage examples"
    Write-ColorText $msg $Blue
}