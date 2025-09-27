# Memory Status Command (OPTIONAL - System works automatically without this!)

Check the memory system status and statistics. This is an OPTIONAL diagnostic tool.

**IMPORTANT**: The memory system works COMPLETELY AUTOMATICALLY. You do NOT need this command for normal operation. Claude Code automatically:
- Checks memory at session start
- Saves context periodically
- Archives old data to D:\ drive
- Routes large files intelligently

This command is only for troubleshooting or curiosity.

## Usage
```
/memory-status
```

## What it shows:
- Current memory storage statistics
- Files stored on C:\ drive (fast access)
- Files stored on D:\ drive (bulk storage)
- Recent session saves
- System health status

## Implementation:
```powershell
# Show memory statistics
powershell -Command "
cd 'C:\dev\projects\active\web-apps\memory-bank'
Write-Host '=== MEMORY SYSTEM STATUS (Diagnostic Only) ===' -ForegroundColor Cyan
Write-Host 'Note: This system runs AUTOMATICALLY without user intervention!' -ForegroundColor Yellow
Write-Host ''
node memory_cli.js stats
Write-Host ''
node memory_cli.js list
Write-Host ''
Write-Host 'Remember: You never need to run commands - everything is automatic!' -ForegroundColor Green
"
```

## Remember:
This command is **COMPLETELY OPTIONAL**. The memory system works automatically in the background without any user intervention!