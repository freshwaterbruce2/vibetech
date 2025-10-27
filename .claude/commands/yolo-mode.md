---
description: Auto-detect and fix issues autonomously (no arguments needed)
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, TodoWrite, SlashCommand
---

# YOLO Mode - Autonomous Auto-Fix

Automatically detect and fix issues without any input required. Analyzes git status, build errors, test failures, and recent changes to determine what needs fixing.

**WARNING:** This mode makes changes without asking. Only use on feature branches.

## Step 1: Safety Check

Execute in parallel:
```bash
git rev-parse --is-inside-work-tree 2>&1
```
```bash
git branch --show-current
```
```bash
git status --porcelain
```

If on `main` or `master`, STOP and report:
```
════════════════════════════════════════
  YOLO MODE - BLOCKED
════════════════════════════════════════

On protected branch. Create feature branch:
  git checkout -b yolo-auto-fix

════════════════════════════════════════
```

## Step 2: Auto-Detect Tasks

Run diagnostic commands in parallel to find issues:

```bash
pnpm run typecheck 2>&1 | head -n 50
```
```bash
pnpm run lint 2>&1 | head -n 50
```
```bash
pnpm run build 2>&1 | head -n 50
```
```bash
git status --short
```
```bash
git diff --stat
```

Use TodoWrite to create task list based on findings:
- TypeScript errors found → Add "Fix TypeScript errors" task
- Lint errors found → Add "Fix lint errors" task
- Build errors found → Add "Fix build errors" task
- Uncommitted changes → Add "Review and organize changes" task
- No errors found → Add "Code quality improvements" task

## Step 3: Autonomous Execution

### Priority Order (fix in this sequence):
1. **Build errors** (blocking)
2. **TypeScript errors** (blocking)
3. **Lint errors** (auto-fixable)
4. **Test failures** (if detected)
5. **Code quality** (if nothing else found)

### Execution Rules:
- **NO PROMPTS** - Never ask for permission
- **3 attempts max** per error type
- **Auto-fix first** - Try `--fix` flags before manual edits
- **Parallel fixes** - Fix independent issues simultaneously
- **Mark complete** - Update todos as you go

### For Each Issue Type:

**TypeScript Errors:**
```bash
pnpm run typecheck 2>&1 | head -n 100
```
- Read affected files
- Fix type errors with Edit tool
- Re-run typecheck to verify
- Max 3 iterations

**Lint Errors:**
```bash
pnpm run lint --fix 2>&1
```
- Let auto-fix handle it
- If still errors, read files and fix manually
- Re-run lint to verify

**Build Errors:**
```bash
pnpm run build 2>&1 | head -n 100
```
- Analyze error messages
- Fix import/export issues
- Fix configuration issues
- Re-run build to verify

**Uncommitted Changes:**
```bash
git diff --stat
git diff | head -n 200
```
- Review changes
- Complete partial work if obvious
- Clean up debug code
- Organize related changes

**No Issues Found:**
- Search for TODOs: `grep -r "TODO" src/ | head -n 20`
- Check for console.logs: `grep -r "console.log" src/ | head -n 20`
- Look for any .test.ts.broken files: `find . -name "*.broken" | head -n 10`
- Suggest optimizations

## Step 4: Validation & Report

After fixes, run quality pipeline:
```bash
pnpm run quality 2>&1
```

If passing:
```bash
git diff --stat
git diff | head -n 200
```

Report success:
```
════════════════════════════════════════
  YOLO MODE - COMPLETE
════════════════════════════════════════

Auto-detected and fixed:
[list completed tasks from TodoWrite]

Quality checks: PASSED

Changes summary:
[git diff --stat]

Next steps:
  git add .
  git commit -m "fix: auto-fix via yolo-mode"

Or rollback:
  git reset --hard HEAD

════════════════════════════════════════
```

If still failing:
```
════════════════════════════════════════
  YOLO MODE - NEEDS HELP
════════════════════════════════════════

Fixed: [completed tasks]
Blocked: [remaining issues]

Manual intervention needed for:
[describe blocking errors]

Partial changes made:
[git diff --stat]

════════════════════════════════════════
```

## Auto-Detection Logic

### What to look for:
1. **Modified files** - Finish incomplete work
2. **Error logs** - Fix recent failures
3. **Test files with .broken extension** - Try to fix and enable
4. **TypeScript // @ts-ignore** comments - Remove and fix properly
5. **Lint warnings** - Clean up code quality
6. **Outdated dependencies** - Suggest updates (but don't auto-update)

### What NOT to do:
- Don't create new features (only fix existing issues)
- Don't refactor without reason (only fix bugs)
- Don't modify crypto trading logic (too risky)
- Don't update major dependencies (breaking changes)
- Don't commit automatically (leave for user)

## Emergency Stop

User says "stop": Complete current edit, report progress, exit.

## Project-Specific Auto-Fixes

**deepcode-editor:**
- Check for failing tests: `pnpm test 2>&1 | head -n 100`
- Fix mock implementations
- Update TypeScript interfaces

**crypto-enhanced:**
- SKIP trading logic changes
- Only fix tests and utilities
- Verify with: `/crypto:status`

**Web apps:**
- Auto-fix Tailwind classes
- Fix React hooks warnings
- Update shadcn/ui imports

**Start autonomous execution now** - no further input needed.
