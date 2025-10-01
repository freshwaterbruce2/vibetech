---
allowed-tools: Bash(git:*), Bash(npm run quality:*), Bash(npm run lint:*), Bash(npm run typecheck:*)
description: Intelligent commit with automatic quality checks
argument-hint: <commit-message>
---

# Smart Git Commit

Create a git commit with automatic quality checks and validation.

## Pre-Commit Quality Checks:

!npm run lint 2>&1 | tail -10
!npm run typecheck 2>&1 | tail -10

## Git Status Review:

!git status --short
!git diff --stat

## Commit Process:

Based on the quality check results and git status:

1. **If quality checks pass:**
   - Stage appropriate files
   - Create commit with message: "$ARGUMENTS"
   - Verify commit creation

2. **If quality checks fail:**
   - Attempt automatic fixes with `npm run quality:fix`
   - Re-run checks
   - Proceed if fixes successful

3. **Smart staging:**
   - Exclude temporary files
   - Exclude node_modules
   - Exclude .env files
   - Include only relevant changes

## Execution:

Proceeding with commit process for: "$ARGUMENTS"

The commit will be created following the project's conventions with proper formatting and structure.

## Post-Commit:

After the commit, I'll:
- Show the commit hash and summary
- Display updated git log
- Suggest next steps (push, PR creation, etc.)

$ARGUMENTS