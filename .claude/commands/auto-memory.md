# Auto-Memory Command (DIAGNOSTIC ONLY)

This command verifies that the automatic memory system is working properly.

**IMPORTANT**: You should NEVER need to run this command! The memory system works completely automatically. This is only for troubleshooting.

## What it does:
- Tests that hooks are properly configured
- Verifies memory_cli.js is accessible
- Confirms auto-save and auto-load are working

## Usage:
```
/auto-memory
```

## Implementation:
```powershell
# Test automatic memory system
powershell -Command "
Write-Host '=== AUTOMATIC MEMORY SYSTEM TEST ===' -ForegroundColor Cyan
Write-Host ''

# Test hook configuration
if (Test-Path 'C:\dev\.claude\hooks\hook-config.json') {
    Write-Host '✓ Hook configuration found' -ForegroundColor Green
} else {
    Write-Host '✗ Hook configuration missing' -ForegroundColor Red
}

# Test session-start hook
if (Test-Path 'C:\dev\.claude\hooks\session-start.ps1') {
    Write-Host '✓ Session-start hook installed' -ForegroundColor Green
    & 'C:\dev\.claude\hooks\session-start.ps1'
} else {
    Write-Host '✗ Session-start hook missing' -ForegroundColor Red
}

# Test user-prompt-submit hook
if (Test-Path 'C:\dev\.claude\hooks\user-prompt-submit.ps1') {
    Write-Host '✓ User-prompt-submit hook installed' -ForegroundColor Green
} else {
    Write-Host '✗ User-prompt-submit hook missing' -ForegroundColor Red
}

# Test memory CLI
cd 'C:\dev\projects\active\web-apps\memory-bank'
$testResult = node memory_cli.js retrieve 'last-session' 'session_state' 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host '✓ Memory CLI functional' -ForegroundColor Green
} else {
    Write-Host '✗ Memory CLI error' -ForegroundColor Red
}

Write-Host ''
Write-Host 'REMEMBER: This system runs AUTOMATICALLY!' -ForegroundColor Yellow
Write-Host 'You never need to manually run memory commands.' -ForegroundColor Yellow
"
```

## Note:
The automatic memory system should:
1. Load previous session context when Claude Code starts
2. Save context periodically during conversations
3. Work without ANY user intervention

If this test fails, the hooks may need to be reinstalled.