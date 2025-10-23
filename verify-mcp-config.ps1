# MCP Configuration Validator
# Validates .mcp.json configuration and tests MCP server availability

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MCP Configuration Validator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .mcp.json exists
$configPath = "C:\dev\.mcp.json"
if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: .mcp.json not found at $configPath" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Found .mcp.json" -ForegroundColor Green
Write-Host ""

# Parse and validate JSON
try {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    Write-Host "OK: Valid JSON syntax" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Invalid JSON syntax: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Configured MCP Servers:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

# Validate each server
$serverCount = 0
$validServers = 0

foreach ($server in $config.mcpServers.PSObject.Properties) {
    $serverCount++
    $name = $server.Name
    $serverConfig = $server.Value

    Write-Host ""
    Write-Host "[$name]" -ForegroundColor Cyan
    Write-Host "  Type: $($serverConfig.type)" -ForegroundColor Gray
    Write-Host "  Command: $($serverConfig.command)" -ForegroundColor Gray
    Write-Host "  Args: $($serverConfig.args -join ' ')" -ForegroundColor Gray

    # Validate required fields
    $isValid = $true

    if (-not $serverConfig.type) {
        Write-Host "  ERROR: Missing 'type' field" -ForegroundColor Red
        $isValid = $false
    } elseif ($serverConfig.type -ne "stdio" -and $serverConfig.type -ne "http" -and $serverConfig.type -ne "sse") {
        Write-Host "  ERROR: Invalid type: $($serverConfig.type)" -ForegroundColor Red
        $isValid = $false
    }

    if (-not $serverConfig.command) {
        Write-Host "  ERROR: Missing 'command' field" -ForegroundColor Red
        $isValid = $false
    }

    # Check if command exists
    if ($serverConfig.command -eq "cmd") {
        Write-Host "  OK: Command wrapper: cmd.exe" -ForegroundColor Green
    } elseif (Get-Command $serverConfig.command -ErrorAction SilentlyContinue) {
        Write-Host "  OK: Command exists: $($serverConfig.command)" -ForegroundColor Green
    } else {
        Write-Host "  WARN: Command not found in PATH: $($serverConfig.command)" -ForegroundColor Yellow
    }

    if ($isValid) {
        Write-Host "  OK: Configuration valid" -ForegroundColor Green
        $validServers++
    } else {
        Write-Host "  ERROR: Configuration invalid" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total servers: $serverCount" -ForegroundColor Gray
Write-Host "  Valid: $validServers" -ForegroundColor Green
Write-Host "  Invalid: $($serverCount - $validServers)" -ForegroundColor $(if ($serverCount -eq $validServers) { "Gray" } else { "Red" })
Write-Host ""

if ($validServers -eq $serverCount) {
    Write-Host "SUCCESS: All MCP servers are properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart Claude Code to load the configuration" -ForegroundColor Gray
    Write-Host "  2. Use /mcp command to check server status" -ForegroundColor Gray
    Write-Host "  3. Test MCP tools in your prompts" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Some servers have configuration issues" -ForegroundColor Yellow
    Write-Host "  Review the issues above and fix the .mcp.json file" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
