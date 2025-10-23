---
allowed-tools: Bash(git:*), Bash(gh:*), Bash(pnpm:*), Read, Write, Edit, Glob, Grep, mcp__nx-mcp__nx_workspace, mcp__nx-mcp__nx_project_details
description: Automate complete bug-fix workflow from GitHub issue to pull request
argument-hint: <github-issue-url>
model: sonnet
---

# Automated Bug Fix Workflow

I will automate the entire bug-fix workflow. Provide a GitHub issue URL as an argument.

## Required Argument

GitHub Issue URL: ${ARGUMENTS[0]}

If no argument provided, respond:
```
ERROR: GitHub issue URL required

Usage: /fix-bug <github-issue-url>

Example:
  /fix-bug https://github.com/user/repo/issues/123
```

## Step 1: Read the GitHub Issue

Execute:
```bash
gh issue view ${ARGUMENTS[0]} --json title,body,labels,number
```

Parse the issue and present:
```
════════════════════════════════════════
  ISSUE ANALYSIS
════════════════════════════════════════
Issue #: [number]
Title: [title]
Labels: [labels]

Description:
[body content]
════════════════════════════════════════
```

## Step 2: Analyze Monorepo to Identify Target Package

Use the nx_workspace MCP tool to understand project structure:
- Read CLAUDE.md for architecture overview
- Identify which package(s) are affected based on issue description
- Use Grep/Glob tools to locate relevant files

Present:
```
════════════════════════════════════════
  TARGET IDENTIFICATION
════════════════════════════════════════
Affected Projects: [project names]
Relevant Files:
  - [file path 1]
  - [file path 2]
  ...

Reasoning: [explain why these projects/files were selected]
════════════════════════════════════════
```

## Step 3: Create Feature Branch

Execute:
```bash
git checkout -b fix/${ISSUE_NUMBER}
```

Where ${ISSUE_NUMBER} is extracted from the GitHub URL.

Confirm:
```
✓ Created branch: fix/[issue-number]
```

## Step 4: Generate Code Fix

Using Read/Edit/Write tools:
1. Read the relevant files identified in Step 2
2. Analyze the bug based on issue description
3. Generate the fix
4. Apply the fix using Edit tool

Present each file changed:
```
════════════════════════════════════════
  CODE CHANGES
════════════════════════════════════════
File: [path]

Changes:
[diff-style summary of changes]

Reasoning: [explain the fix]
════════════════════════════════════════
```

## Step 5: Generate Unit Test

Create or update a test file to validate the fix:
1. Locate existing test file or create new one
2. Write test case that reproduces the bug
3. Ensure test passes with the fix applied

Present:
```
════════════════════════════════════════
  TEST COVERAGE
════════════════════════════════════════
Test File: [path]

New Test Case:
[test code summary]

Purpose: [what this test validates]
════════════════════════════════════════
```

## Step 6: Verify Fix with Quality Checks

Execute:
```bash
pnpm nx affected --target=lint,test --base=main
```

Present results:
```
════════════════════════════════════════
  VERIFICATION
════════════════════════════════════════
Lint: ✓ PASS / ✗ FAIL
Tests: ✓ PASS / ✗ FAIL

[Show any errors if failed]
════════════════════════════════════════
```

IF FAILED:
- Fix the issues automatically
- Re-run verification
- Repeat until all checks pass

## Step 7: Commit Changes

Execute:
```bash
git add [changed files]
git commit -m "$(cat <<'EOF'
fix: resolve issue #${ISSUE_NUMBER}

[Brief description of the fix]

- [Bullet point of key changes]
- [Another key change]

Closes #${ISSUE_NUMBER}

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Confirm:
```
✓ Changes committed successfully
```

## Step 8: Create Pull Request

Execute:
```bash
git push -u origin fix/${ISSUE_NUMBER}
gh pr create --title "fix: resolve issue #${ISSUE_NUMBER}" --body "$(cat <<'EOF'
## Summary
Fixes #${ISSUE_NUMBER}

## Changes
[Bullet list of changes made]

## Testing
- [X] Unit tests added/updated
- [X] All tests passing
- [X] Lint checks passing

## Verification
[Explain how the fix was verified]

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Present final result:
```
════════════════════════════════════════
  PULL REQUEST CREATED
════════════════════════════════════════
PR URL: [github url]
Branch: fix/[issue-number]
Status: Ready for review

Files Changed: [count]
Tests Added: [count]
All Checks: ✓ PASSING

Next Steps:
1. Review the PR at the URL above
2. Request review from team members
3. Merge when approved
════════════════════════════════════════
```

## Error Handling

If any step fails:
1. Explain the error clearly
2. Suggest manual intervention if needed
3. Do not proceed to next steps
4. Clean up (delete branch if created)

## Notes

- Uses conventional commit format
- Automatically closes issue when PR is merged
- Includes comprehensive testing
- Follows monorepo best practices
- Tags you for review automatically
