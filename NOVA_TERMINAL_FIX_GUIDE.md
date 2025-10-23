# NOVA Agent Terminal Fix Guide
**Date**: October 20, 2025
**Problem**: PowerShell commands failing in bash shell

## Issue Diagnosis

NOVA Agent is running PowerShell commands in `/usr/bin/bash`, causing errors:
```
/usr/bin/bash: line 1: Get-ChildItem: command not found
/usr/bin/bash: line 1: Select-Object: command not found
/usr/bin/bash: line 1: Where-Object: command not found
```

## Root Cause

Windows Subsystem for Linux (WSL) or Git Bash is intercepting commands and trying to run PowerShell cmdlets as bash commands.

---

## Solution 1: Convert to Bash Equivalents (RECOMMENDED)

### PowerShell → Bash Command Translations

| PowerShell | Bash Equivalent |
|------------|-----------------|
| `Get-ChildItem -Path "C:\dev\projects" -Directory` | `find C:/dev/projects -type d` |
| `Get-ChildItem -Recurse -Depth 2` | `find -maxdepth 3 -type d` |
| `Select-Object FullName` | `awk '{print}'` or `cut -d'/' -f1-` |
| `Where-Object { $_.FullName -match "pattern" }` | `grep -E "pattern"` |
| `Sort-Object` | `sort` |
| `Measure-Object` | `wc -l` |

### Example Conversions

**List projects in active/crypto directories:**
```powershell
# OLD (PowerShell)
Get-ChildItem -Path "C:\dev\projects" -Directory -Recurse -Depth 2 |
  Select-Object FullName |
  Where-Object { $_.FullName -match "projects\(active|crypto)" }
```

```bash
# NEW (Bash)
find C:/dev/projects -maxdepth 3 -type d |
  grep -E "projects/(active|crypto)"
```

**Find large TypeScript files (>500 lines):**
```powershell
# OLD (PowerShell)
Get-ChildItem -Path "C:\dev\projects" -Filter "*.ts" -Recurse |
  Where-Object { (Get-Content $_.FullName).Count -gt 500 } |
  Select-Object FullName
```

```bash
# NEW (Bash)
find C:/dev/projects -name "*.ts" |
  xargs wc -l |
  awk '$1 > 500 {print $2}' |
  sort -rn
```

**Count files by extension:**
```powershell
# OLD (PowerShell)
Get-ChildItem -Path "C:\dev\projects" -Recurse |
  Group-Object Extension |
  Select-Object Count, Name
```

```bash
# NEW (Bash)
find C:/dev/projects -type f |
  sed 's/.*\.//' |
  sort |
  uniq -c |
  sort -rn
```

---

## Solution 2: Use PowerShell Wrapper

Wrap PowerShell commands explicitly:
```bash
powershell.exe -Command "Get-ChildItem -Path 'C:\dev\projects' -Directory -Recurse -Depth 2"
```

**Pros**: No command translation needed
**Cons**: Slower execution, requires PowerShell.exe

---

## Solution 3: Update .claude/settings.local.json

Add bash command permissions:
```json
{
  "permissions": {
    "allow": [
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(awk:*)",
      "Bash(sed:*)",
      "Bash(wc:*)",
      "Bash(sort:*)",
      "Bash(uniq:*)",
      "Bash(xargs:*)"
    ]
  }
}
```

---

## Solution 4: Detect Shell and Adapt

Add shell detection logic:
```typescript
// Detect current shell
const isWindows = process.platform === 'win32';
const shellType = process.env.SHELL?.includes('bash') ? 'bash' : 'powershell';

// Use appropriate command
const listCommand = shellType === 'bash'
  ? 'find C:/dev/projects -maxdepth 3 -type d'
  : 'Get-ChildItem -Path "C:\\dev\\projects" -Directory -Recurse -Depth 2';
```

---

## Recommended Workflow for NOVA

1. **Always check shell type first**:
   ```bash
   echo $SHELL
   ```

2. **Use bash commands by default on Windows** (WSL/Git Bash):
   - `find` instead of `Get-ChildItem`
   - `grep` instead of `Where-Object`
   - `awk` instead of `Select-Object`

3. **Only use PowerShell wrapper for complex operations**:
   - Registry access
   - Windows-specific cmdlets
   - .NET interop

---

## Quick Reference: Common Operations

### List directories
```bash
find C:/dev/projects -maxdepth 2 -type d
```

### Find files by pattern
```bash
find C:/dev/projects -name "*.ts" | head -20
```

### Count lines in files
```bash
wc -l file.ts
```

### Search in files
```bash
grep -r "pattern" C:/dev/projects
```

### Find large files
```bash
find C:/dev/projects -name "*.ts" -exec wc -l {} + | sort -rn | head -20
```

### Check directory size
```bash
du -sh C:/dev/projects/*
```

---

## Debugging Tips

1. **Test command in terminal first** before using in code
2. **Use absolute paths** with forward slashes on Windows (`C:/dev` not `C:\dev`)
3. **Quote paths with spaces**: `find "C:/Program Files" -maxdepth 1`
4. **Check environment**: `echo $PATH`, `which find`, `which grep`

---

## Status

- ✅ Bash equivalents documented
- ✅ PowerShell wrapper documented
- ✅ Settings.local.json updated with bash permissions
- ⏳ NOVA needs to implement bash command detection

---

**Next Action**: Update NOVA's command generation to use bash on Windows (WSL/Git Bash) by default.
