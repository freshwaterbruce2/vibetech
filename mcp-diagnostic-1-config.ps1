$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
Write-Output "════════════════════════════════════════"
Write-Output "  MCP CONFIGURATION"
Write-Output "════════════════════════════════════════"
Write-Output "Location: $configPath"
Write-Output ""
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    Write-Output "Status: ✓ Configuration file found"
    Write-Output ""
    Write-Output "Configured MCP Servers:"
    if ($config.mcpServers) {
        $config.mcpServers.PSObject.Properties | ForEach-Object {
            Write-Output ""
            Write-Output "  [$($_.Name)]"
            Write-Output "    Command: $($_.Value.command)"
            if ($_.Value.args) {
                Write-Output "    Args: $($_.Value.args -join ' ')"
            }
        }
    } else {
        Write-Output "  No MCP servers configured"
    }
} else {
    Write-Output "Status: ✗ Configuration file not found"
    Write-Output "Expected at: $configPath"
}
Write-Output ""
