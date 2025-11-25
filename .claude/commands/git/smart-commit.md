---
description: Analyze staged changes and generate a conventional commit message
model: opus
---

You are an expert at analyzing code changes and writing concise, meaningful git commit messages following the conventional commits specification.

## Step 1: Verify Git Repository

Execute this command to check if we're in a git repository:
```bash
git rev-parse --is-inside-work-tree 2>&1
```

If this command fails or returns an error, report to the user:
```
════════════════════════════════════════
  GIT SMART COMMIT - ERROR
════════════════════════════════════════

This directory is not a git repository.

To initialize a git repository:
  git init

════════════════════════════════════════
```

And STOP execution.

## Step 2: Check for Staged Changes

Execute this command to get the list of staged files:
```bash
git diff --cached --name-only
```

If this command returns no output (no staged files), report to the user:
```
════════════════════════════════════════
  GIT SMART COMMIT - NO CHANGES
════════════════════════════════════════

No changes staged for commit.

To stage files:
  git add <file>           # Stage specific file
  git add .                # Stage all changes
  git add -p               # Stage interactively

To see unstaged changes:
  git status

════════════════════════════════════════
```

And STOP execution.

## Step 3: Analyze Staged Changes

Execute this command to get the full diff of staged changes:
```bash
git diff --cached
```

Also get the list of changed files with stats:
```bash
git diff --cached --stat
```

Analyze the diff carefully to understand:
- What files were changed (look at file extensions and paths)
- What type of changes were made (additions, deletions, modifications)
- The purpose and scope of the changes
- Whether this is a new feature, bug fix, documentation update, refactoring, etc.

## Step 4: Review Recent Commit History

Execute this command to see the last 10 commit messages for style reference:
```bash
git log -10 --pretty=format:"%s"
```

This will help you match the existing commit message style in this repository.

## Step 5: Determine Conventional Commit Type

Based on your analysis, choose the most appropriate conventional commit prefix:

- **feat:** A new feature or functionality
- **fix:** A bug fix
- **docs:** Documentation changes only
- **style:** Code style changes (formatting, missing semicolons, etc.) - no logic changes
- **refactor:** Code refactoring - neither fixes a bug nor adds a feature
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **build:** Changes to build system or dependencies (package.json, webpack, etc.)
- **ci:** Changes to CI/CD configuration (GitHub Actions, etc.)
- **chore:** Other changes that don't modify src or test files (maintenance tasks)
- **revert:** Reverting a previous commit

**Guidelines for choosing:**
- If multiple file types are changed, pick the most significant change
- Documentation-only changes (*.md files) = `docs:`
- New files in src/ or components/ = likely `feat:`
- Changes to existing functionality = likely `fix:` or `refactor:`
- Test files only = `test:`
- Package.json or similar = `build:` or `chore:`

## Step 6: Generate Commit Message

Create a commit message that follows these rules:

1. **Format:** `<type>: <subject>`
   - Optional scope: `<type>(<scope>): <subject>`
   - Example: `feat(auth): add JWT token validation`

2. **Subject Rules:**
   - Use imperative mood ("Add feature" not "Added feature")
   - Don't capitalize first letter after colon
   - No period at the end
   - Maximum 50 characters (ideally)
   - Be specific and concise

3. **Good Examples:**
   - `feat: add user authentication endpoint`
   - `fix: resolve memory leak in WebSocket connection`
   - `docs: update API documentation for v2.0`
   - `refactor: simplify database query logic`
   - `test: add unit tests for payment processing`

4. **Bad Examples:**
   - `feat: stuff` (too vague)
   - `Fixed the bug` (not using conventional format)
   - `feat: Added new feature for users to be able to...` (too long)

## Step 7: Present Suggestion to User

Present your analysis and suggestion to the user in this format:

```
════════════════════════════════════════
  GIT SMART COMMIT - ANALYSIS
════════════════════════════════════════

Changed Files:
[list the files from --stat output]

Analysis:
[2-3 sentences explaining what you determined the changes do]

Commit Type: [chosen type]
Reasoning: [1 sentence explaining why you chose this type]

────────────────────────────────────────
Suggested Commit Message:
────────────────────────────────────────

[type]: [your generated message]

────────────────────────────────────────

Does this commit message accurately describe your changes?

Reply with:
  - "yes" or "approve" to commit with this message
  - "no" or "reject" to cancel
  - Or provide your own commit message to use instead

════════════════════════════════════════
```

## Step 8: Wait for User Response

STOP and wait for the user to respond. Do not proceed to the next step until the user provides input.

## Step 9: Execute Commit (if approved)

If the user approves (says "yes", "approve", "ok", "looks good", etc.), execute:

```bash
git commit -m "[the generated commit message]"
```

Show the output of the git commit command to the user.

Then report:
```
════════════════════════════════════════
  COMMIT SUCCESSFUL
════════════════════════════════════════

Your changes have been committed with message:
[the commit message]

Next steps:
  - git push              # Push to remote
  - git log -1            # View the commit
  - /git:smart-commit     # Commit more changes

════════════════════════════════════════
```

If the user provides their own message instead, use that message for the commit.

If the user rejects (says "no", "reject", "cancel", etc.), report:
```
════════════════════════════════════════
  COMMIT CANCELLED
════════════════════════════════════════

No changes were committed.

Your staged changes remain staged and ready.

You can:
  - Run /git:smart-commit again for a new suggestion
  - Commit manually with: git commit -m "your message"
  - Modify staged files: git add <file>

════════════════════════════════════════
```

**IMPORTANT EXECUTION NOTES:**
- Execute all git commands using the Bash tool
- This is an interactive command - you MUST wait for user approval before committing
- Never commit without explicit user approval
- Analyze the code diff thoroughly to write meaningful messages
- Match the existing commit style from recent history
- If the user is unsure, offer 2-3 alternative commit messages
- The quality of the analysis and message is more important than speed
