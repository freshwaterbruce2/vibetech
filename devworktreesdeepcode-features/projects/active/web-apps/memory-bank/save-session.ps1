# Simple session saver for Claude Code Memory System
param(
    [string]$Key = "last-session",
    [string]$Task = "",
    [string]$Notes = ""
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$branch = git branch --show-current 2>$null
$currentDir = Get-Location | Select-Object -ExpandProperty Path

# Create simple session data
$sessionData = @{
    timestamp = $timestamp
    branch = if ($branch) { $branch } else { "unknown" }
    working_directory = $currentDir
    current_task = $Task
    notes = $Notes
}

# Convert to JSON and save to file
$dataFile = "$env:TEMP\session_data.json"
$sessionData | ConvertTo-Json | Out-File -FilePath $dataFile -Encoding utf8

# Save using memory CLI
Set-Location "C:\dev\projects\active\web-apps\memory-bank"
$dataJson = Get-Content $dataFile -Raw

# Use Node directly with the file
$result = node -e "
const fs = require('fs');
const MemoryManager = require('./memory_manager.js');
const manager = new MemoryManager();

async function save() {
    await manager.initialize();
    const data = JSON.parse(fs.readFileSync('$dataFile', 'utf8'));
    const metadata = { type: 'session_state' };
    const result = await manager.storeData('$Key', data, metadata);
    console.log(result.success ? 'Session saved successfully to ' + result.storage : 'Failed to save');
}

save().catch(console.error);
"

Write-Host $result

# Also save as current-project
if ($Key -eq "last-session") {
    $result2 = node -e "
    const fs = require('fs');
    const MemoryManager = require('./memory_manager.js');
    const manager = new MemoryManager();

    async function save() {
        await manager.initialize();
        const data = JSON.parse(fs.readFileSync('$dataFile', 'utf8'));
        const metadata = { type: 'project_context' };
        const result = await manager.storeData('current-project', data, metadata);
        console.log(result.success ? 'Project context updated' : 'Failed to update project');
    }

    save().catch(console.error);
    "

    Write-Host $result2
}

# Cleanup temp file
Remove-Item $dataFile -Force -ErrorAction SilentlyContinue