---
allowed-tools: Bash(git:*), Bash(npm:*), Bash(python:*), Bash(sqlite3:*), Bash(find:*), Bash(grep:*)
description: Check health status across all projects in the monorepo
model: sonnet
---

# Project Health Status

Get a comprehensive health check across all active projects in the monorepo.

## Step 1: Web Application Status

Execute this bash command to check web app status:
```bash
cd C:\dev && npm run typecheck 2>&1 | head -5
```

Present with header:
```
════════════════════════════════════════
  WEB APPLICATION STATUS
════════════════════════════════════════
```

Show TypeScript status (passing/failing).

## Step 2: Crypto Trading System Status

Execute this bash command to check crypto system:
```bash
cd C:\dev\projects\crypto-enhanced && if [ -f trading.db ]; then sqlite3 trading.db "SELECT COUNT(*) FROM positions WHERE status='open';" 2>&1; else echo "Database not found"; fi
```

Present with header:
```
════════════════════════════════════════
  CRYPTO TRADING SYSTEM STATUS
════════════════════════════════════════
```

Show open positions count and system health.

## Step 3: Vibe-Tutor Mobile Status

Execute this bash command:
```bash
cd C:\dev\Vibe-Tutor && if [ -f package.json ]; then grep "version" package.json | head -1; else echo "Project not found"; fi
```

Present with header:
```
════════════════════════════════════════
  VIBE-TUTOR MOBILE STATUS
════════════════════════════════════════
```

Show current version.

## Step 4: Git Repository Status

Execute this bash command:
```bash
cd C:\dev && git status --short
```

Present with header:
```
════════════════════════════════════════
  GIT REPOSITORY STATUS
════════════════════════════════════════
```

Show modified files and git status.

## Step 5: Nx Cache Status

Execute this bash command:
```bash
powershell -Command "if (Test-Path 'C:\dev\node_modules\.cache\nx') { $size = (Get-ChildItem -Path 'C:\dev\node_modules\.cache\nx' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB; 'Cache size: {0:N2} MB' -f $size } else { 'Nx cache not found' }"
```

Present with header:
```
════════════════════════════════════════
  NX CACHE STATUS
════════════════════════════════════════
```

Show cache size.

## Step 6: Project Summary

Provide comprehensive summary:
```
════════════════════════════════════════
  MONOREPO HEALTH SUMMARY
════════════════════════════════════════

Active Projects:
✓ Web Application (React 19 + Vite + Nx)
✓ Crypto Trading (Python + SQLite)
✓ Vibe-Tutor Mobile (Capacitor + Android)
✓ Digital Content Builder
✓ Business Booking Platform
✓ Desktop Apps (Taskmaster, DeepCode Editor)

Quick Health Check:
[✓/✗] TypeScript compilation
[✓/✗] Git working tree clean
[✓/✗] Crypto system operational
[✓/✗] Nx cache healthy
[✓/✗] All dependencies installed

Recent Activity:
- Last commit: [show git log -1 --oneline]
- Modified files: [count from git status]
- Open positions: [count from crypto DB]
- Nx cache: [size]

════════════════════════════════════════
```

## Step 7: Recommendations

Based on status, provide recommendations:
```
════════════════════════════════════════
  RECOMMENDED ACTIONS
════════════════════════════════════════

${if git has changes}
Uncommitted Changes Detected:
- Review changes: git status
- Create commit: /git:smart-commit
- Or stash: git stash
${endif}

${if TypeScript errors}
TypeScript Issues Found:
- Run quality check: /web:quality-check fix
- Review errors: npm run typecheck
${endif}

${if Nx cache > 500MB}
Large Nx Cache:
- Consider clearing: /nx:cache-clear
- Current size: [size] MB
${endif}

${if crypto has open positions}
Open Trading Positions:
- Review positions: /crypto:position-check
- Check system: /crypto:status
${endif}

Maintenance Tasks:
✓ Run quality checks weekly: /web:quality-check
✓ Clear cache monthly: /nx:cache-clear deep
✓ Review dependencies monthly: npm outdated
✓ Backup trading DB weekly

Quick Fix Commands:
- /web:quality-check fix - Auto-fix linting
- /nx:cache-clear - Reset Nx cache
- /crypto:status - Trading system check
- /git:smart-commit - Commit changes

════════════════════════════════════════
```

**IMPORTANT EXECUTION NOTES:**
- Execute bash commands using the Bash tool
- All commands are read-only (no modifications)
- Provides snapshot of current project health
- Use for daily/weekly health checks
- All commands run from appropriate directories
