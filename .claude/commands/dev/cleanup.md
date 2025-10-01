---
allowed-tools: Bash(rm:*), Bash(find:*), Bash(du:*), Bash(powershell:*)
argument-hint: [quick|deep|analyze]
description: Smart cleanup of temporary files and caches
---

# Development Environment Cleanup

Perform intelligent cleanup of temporary files, caches, and logs while preserving important data.

## Cleanup Mode: ${1:-quick}

## Analysis Phase:

!find . -type d -name "__pycache__" 2>/dev/null | head -10
!find . -type d -name "node_modules" -prune -o -name "*.log" -type f -print 2>/dev/null | head -10
!du -sh ./.next 2>/dev/null || echo "No Next.js cache found"
!du -sh ./dist 2>/dev/null || echo "No dist folder found"

## Cleanup Strategy:

Based on mode "${1:-quick}":

### Quick Cleanup (default):
- Python __pycache__ directories
- Temporary log files (keeping last 1000 lines of important logs)
- Build artifacts in dist/
- Next.js cache
- npm/yarn cache (if over 1GB)

### Deep Cleanup:
- Everything from quick cleanup
- Old node_modules (with confirmation)
- Database backups older than 30 days
- Git ignored files (with review)
- Docker dangling images

### Analyze Only:
- Show space usage report
- Identify largest directories
- List cleanup candidates
- No deletion performed

## Space Report:

!powershell -Command "Get-ChildItem -Path . -Directory | ForEach-Object { $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB; if ($size -gt 10) { '{0:N2} MB - {1}' -f $size, $_.Name } } | Sort-Object -Descending | Select-Object -First 10"

## Special Handling:

Protected items that will NOT be deleted:
- .env files
- database.db files
- trading.db and related files
- Production configuration files
- Git repository data

## Execution:

Performing ${1:-quick} cleanup based on the analysis above...

## Post-Cleanup:

After cleanup, I'll provide:
- Space reclaimed summary
- Items cleaned count
- Verification of protected files
- Recommendations for regular maintenance

$ARGUMENTS