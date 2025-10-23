---
allowed-tools: Bash(nx:*), Bash(git:*), Bash(pnpm:*)
description: Run smart, high-performance checks on affected packages in current branch
model: sonnet
---

# Monorepo Smart Check

You are a CI/CD expert. Analyze the current branch against main, identify only the packages that have been affected by the changes, then run the linter and test suite only for those affected packages and their direct dependents.

## Step 1: Detect Current Branch and Changed Files

Execute:
```bash
git rev-parse --abbrev-ref HEAD
```

Then show changed files:
```bash
git diff --name-only origin/main...HEAD
```

Present with header:
```
════════════════════════════════════════
  BRANCH ANALYSIS
════════════════════════════════════════
Current Branch: [branch name]
Changed Files: [count]
```

## Step 2: Identify Affected Projects

Execute:
```bash
pnpm nx show projects --affected --base=origin/main
```

If that fails, try:
```bash
pnpm nx show projects --affected --base=main
```

Present with header:
```
════════════════════════════════════════
  AFFECTED PROJECTS
════════════════════════════════════════
```

Show the list of affected projects with their types (app/lib).

If no projects affected, report:
"✓ No projects affected - all changes are isolated or documentation-only"

## Step 3: Run Linter on Affected

Execute:
```bash
pnpm nx affected --target=lint --base=origin/main
```

Present with header:
```
════════════════════════════════════════
  LINT RESULTS (Affected Only)
════════════════════════════════════════
```

Show complete linting output, highlighting any errors or warnings.

## Step 4: Run Tests on Affected

Execute:
```bash
pnpm nx affected --target=test --base=origin/main
```

Present with header:
```
════════════════════════════════════════
  TEST RESULTS (Affected Only)
════════════════════════════════════════
```

Show complete test output with pass/fail status.

## Step 5: Summary Report

Provide a comprehensive summary:
```
════════════════════════════════════════
  QUALITY CHECK SUMMARY
════════════════════════════════════════

Branch: [branch name]
Base: origin/main

Changed Projects: [count]
Affected Projects: [count] (including dependents)

LINT STATUS:
✓/✗ [project]: [status]
...

TEST STATUS:
✓/✗ [project]: [status]
...

OVERALL RESULT: ✓ PASS / ✗ FAIL

PERFORMANCE METRICS:
- Total Time: [time]
- Cache Hit Rate: [percentage]%
- Projects Skipped: [count] (unchanged)

NEXT STEPS:
[If failed: List specific failures to fix]
[If passed: "Ready for commit/PR"]
════════════════════════════════════════
```

## Step 6: Recommendations

Based on results, provide actionable recommendations:

IF FAILED:
- List specific files/lines with errors
- Suggest fixes for common issues
- Provide command to auto-fix linting: `pnpm nx affected --target=lint:fix --base=origin/main`

IF PASSED:
- Confirm branch is ready for pull request
- Suggest running full build if major changes
- Remind about commit message conventions

## Performance Notes

This command uses Nx's intelligent caching:
- Only runs checks on affected projects
- Uses cached results for unchanged code
- Runs tasks in parallel when possible
- Typical speedup: 60-80% faster than full check

Related Commands:
- View dependency graph: /nx:graph
- Clear cache: /nx:cache-clear
- Full quality check: /web:quality-check
