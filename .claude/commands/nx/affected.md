---
allowed-tools: Bash(nx affected:*), Bash(nx show:*), Bash(git:*)
description: Check and run tasks for affected projects in Nx workspace
argument-hint: [task]
model: sonnet
---

# Nx Affected Projects

Intelligently run tasks only on projects affected by your changes, dramatically reducing CI/CD time and development feedback loops.

## Step 1: Detect Base Branch

Execute this bash command to find the base branch:
```bash
git rev-parse --abbrev-ref HEAD
```

Present with header:
```
════════════════════════════════════════
  CURRENT BRANCH
════════════════════════════════════════
```

Show current branch name.

## Step 2: Show Affected Projects

Execute this bash command to show affected projects:
```bash
nx show projects --affected --base=origin/main
```

On feature branches, also try:
```bash
nx show projects --affected --base=main
```

Present with header:
```
════════════════════════════════════════
  AFFECTED PROJECTS
════════════════════════════════════════
```

Show the list of affected projects.

If no projects affected, report:
"✓ No projects affected - all changes are isolated or no changes detected"

## Step 3: Explain What's Affected

Provide detailed explanation:
```
════════════════════════════════════════
  IMPACT ANALYSIS
════════════════════════════════════════

Changed Files: [count]
Affected Projects: [count]
Dependent Projects: [count]

HOW NX DETERMINES "AFFECTED":
1. Detects changed files since base branch
2. Maps files to owning projects
3. Includes projects that depend on changed projects
4. Uses dependency graph for transitive impact

BASE COMPARISON:
- Base: origin/main (or main)
- Current: [current branch]
- Commits ahead: [count]

This means:
✓ Only affected projects will be tested/built
✓ Unchanged projects use cached results
✓ Faster feedback loops in development
✓ Reduced CI/CD execution time

════════════════════════════════════════
```

## Step 4: Run Task on Affected (if task argument provided)

Task: ${ARGUMENTS[0]:-none}

If task provided (e.g., `test`, `build`, `lint`), execute:

```bash
nx affected --target=${ARGUMENTS[0]:-test} --base=origin/main
```

Present with header:
```
════════════════════════════════════════
  RUNNING: ${ARGUMENTS[0]:-test} (Affected Only)
════════════════════════════════════════
```

Show complete output.

After execution, provide performance summary:
```
════════════════════════════════════════
  PERFORMANCE SUMMARY
════════════════════════════════════════

Tasks Executed: [count]
Tasks From Cache: [count]
Tasks Skipped: [count]
Total Time: [time]

Cache Hit Rate: [percentage]%

Time Savings:
- Without Nx: ~[estimated time for all projects]
- With Nx affected: [actual time]
- Savings: [percentage]% faster

════════════════════════════════════════
```

## Step 5: Available Tasks

If no task specified, show available options:
```
════════════════════════════════════════
  AVAILABLE TASKS
════════════════════════════════════════

Common tasks you can run on affected projects:

Quality Checks:
  /nx:affected lint          # Lint affected projects
  /nx:affected test          # Test affected projects
  /nx:affected typecheck     # TypeScript check affected
  /nx:affected build         # Build affected projects

Combined:
  nx affected --target=lint,test,build --parallel

View Graph:
  nx affected:graph          # Visual affected projects

Custom Tasks:
  /nx:affected <task-name>   # Run any defined task

════════════════════════════════════════
```

## Step 6: CI/CD Integration Tips

Provide CI/CD guidance:
```
════════════════════════════════════════
  CI/CD OPTIMIZATION
════════════════════════════════════════

Use affected in your GitHub Actions:

\`\`\`yaml
- name: Run affected tests
  run: nx affected --target=test --base=origin/main

- name: Build affected projects
  run: nx affected --target=build --parallel
\`\`\`

PERFORMANCE IMPACT:
- Typical CI reduction: 60-80% faster
- Pull requests: Only test what changed
- Main branch: Full test suite
- Nx Cloud: Share cache across machines

CONFIGURATION:
Located in: nx.json
- defaultBase: 'main'
- affected settings
- cache configuration

Related Commands:
- View graph: /nx:graph
- Clear cache: /nx:cache-clear
- Run quality: /web:quality-check

════════════════════════════════════════
```

$ARGUMENTS

**IMPORTANT EXECUTION NOTES:**
- Execute bash commands using the Bash tool
- Affected is determined by git diff from base branch
- Works best with feature branch workflow
- Uses Nx dependency graph for impact analysis
- Supports parallel execution with --parallel flag
- Cache is shared across affected runs
- All commands run from C:\dev as base directory
