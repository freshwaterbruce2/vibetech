# Memory Management PowerShell Wrapper
# Provides easy access to memory management functions from PowerShell

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$Arg1,

    [Parameter(Position=2)]
    [string]$Arg2,

    [Parameter(Position=3)]
    [string]$Arg3
)

$MemoryBankPath = "C:\dev\projects\memory-bank"
$NodeScript = "memory_cli.js"

# Change to memory-bank directory
Push-Location $MemoryBankPath

try {
    # Build arguments array
    $args = @($Command)
    if ($Arg1) { $args += $Arg1 }
    if ($Arg2) { $args += $Arg2 }
    if ($Arg3) { $args += $Arg3 }

    # Execute the Node.js CLI
    & node $NodeScript @args

    # Show quick tip for first-time users
    if ($Command -eq "help" -or $Command -eq "") {
        Write-Host ""
        Write-Host "💡 Quick Tips:" -ForegroundColor Yellow
        Write-Host "   .\memory.ps1 init      - Initialize system" -ForegroundColor Gray
        Write-Host "   .\memory.ps1 test      - Test functionality" -ForegroundColor Gray
        Write-Host "   .\memory.ps1 stats     - Check storage stats" -ForegroundColor Gray
        Write-Host "   .\memory.ps1 health    - Health check" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🚀 VS Code Integration:" -ForegroundColor Cyan
        Write-Host "   Use Ctrl+Shift+P -> Tasks: Run Task -> Memory System tasks" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Error running memory system: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
