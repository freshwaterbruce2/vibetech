---
allowed-tools: Bash(nx reset:*), Bash(rm:*), Bash(du:*), Bash(powershell:*)
description: Clear Nx cache and reset workspace state
argument-hint: [deep]
model: sonnet
---

# Clear Nx Cache

Reset Nx cache to resolve stale build artifacts, cache corruption, or force fresh rebuilds.

## Step 1: Check Current Cache Size

Execute this bash command to check cache size:
```bash
powershell -Command "if (Test-Path 'node_modules/.cache/nx') { $size = (Get-ChildItem -Path 'node_modules/.cache/nx' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB; '{0:N2} MB' -f $size } else { 'Cache directory not found' }"
```

Present with header:
```
════════════════════════════════════════
  CURRENT NX CACHE SIZE
════════════════════════════════════════
```

Show the cache size to user.

## Step 2: Clear Nx Cache

Mode: ${ARGUMENTS[0]:-standard}

### Standard Clear (default):

Execute this bash command:
```bash
nx reset
```

Present with header:
```
════════════════════════════════════════
  CLEARING NX CACHE
════════════════════════════════════════
```

Show output.

Report to user:
"✓ Nx cache cleared successfully"

### Deep Clear (if 'deep' argument provided):

Execute these bash commands sequentially:
```bash
nx reset
```

```bash
rm -rf node_modules/.cache
```

```bash
rm -rf .nx/cache
```

Present with header:
```
════════════════════════════════════════
  DEEP CACHE CLEAR
════════════════════════════════════════
```

Report to user:
```
✓ Nx cache cleared
✓ Node modules cache cleared
✓ Local .nx cache cleared
```

## Step 3: Verify Cache Cleared

Execute this bash command to verify:
```bash
powershell -Command "if (Test-Path 'node_modules/.cache/nx') { 'Cache directory still exists' } else { 'Cache successfully cleared' }"
```

Present with header:
```
════════════════════════════════════════
  VERIFICATION
════════════════════════════════════════
```

Show verification result.

## Step 4: Next Build Info

Explain what happens next:
```
════════════════════════════════════════
  NEXT BUILD BEHAVIOR
════════════════════════════════════════

After cache clear:
✓ Next build will be slower (no cache)
✓ All tasks will execute from scratch
✓ Cache will rebuild automatically
✓ Subsequent builds will use new cache

This is useful when:
- Experiencing stale build artifacts
- Cache corruption suspected
- Switching between major dependency versions
- Troubleshooting build issues
- After major monorepo changes

REBUILD TIME:
First build: [estimated based on project count] minutes
Cached builds: < 5 seconds for unchanged projects

Cache Rebuild Strategy:
1. Run full quality check: /web:quality-check
2. Let Nx rebuild cache for all projects
3. Future runs will be fast again

════════════════════════════════════════
```

## Step 5: Cache Configuration

Show current cache configuration:
```
════════════════════════════════════════
  NX CACHE CONFIGURATION
════════════════════════════════════════

Cache Location:
- Local: node_modules/.cache/nx
- Project: .nx/cache (if exists)
- Cloud: Nx Cloud (if configured)

Configuration: nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx/workspace/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "test",
          "lint",
          "typecheck"
        ]
      }
    }
  }
}

Current Setup:
- Caching: Enabled
- Remote cache: [Check if Nx Cloud configured]
- Cache directory: node_modules/.cache/nx

To disable cache temporarily:
  nx build --skip-nx-cache

To view cache stats:
  Check nx.json or Nx Cloud dashboard

════════════════════════════════════════
```

## Step 6: Related Troubleshooting

Provide troubleshooting guidance:
```
════════════════════════════════════════
  TROUBLESHOOTING TIPS
════════════════════════════════════════

If cache clear doesn't resolve issues:

1. Check for circular dependencies:
   /nx:graph

2. Verify project configuration:
   nx show project <project-name>

3. Check for TypeScript errors:
   npm run typecheck

4. Review build logs:
   nx build <project> --verbose

5. Check node_modules integrity:
   rm -rf node_modules && npm install

6. Verify git state:
   git status

Common Issues Resolved by Cache Clear:
✓ "Cannot find module" errors
✓ Stale type definitions
✓ Outdated build artifacts
✓ Dependency resolution conflicts
✓ Task output mismatches

Prevention:
- Clear cache after major dependency updates
- Use affected commands to minimize cache churn
- Regularly update Nx version
- Monitor cache size (should be < 500MB typically)

Related Commands:
- Run affected: /nx:affected
- View graph: /nx:graph
- Quality check: /web:quality-check

════════════════════════════════════════
```

$ARGUMENTS

**IMPORTANT EXECUTION NOTES:**
- Execute bash commands using the Bash tool
- Cache clear is safe and won't delete source code
- First build after clear will be slower
- Deep clear also removes node_modules cache
- All commands run from C:\dev as base directory
- Cache automatically rebuilds on next run
