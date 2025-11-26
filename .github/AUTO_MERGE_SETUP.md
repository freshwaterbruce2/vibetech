# Auto-Merge Setup Guide

## Current Branch Protection Issue

Your repo has these protections on `main`:

- Cannot update protected ref directly
- Changes must be made through a pull request
- 5 required status checks

## Setup Options

### Option 1: Enable GitHub Auto-merge (Recommended)

1. **Enable in Repo Settings:**
   - Go to **Settings → General → Pull Requests**
   - Check **"Allow auto-merge"**
   - Check **"Automatically delete head branches"**

2. **When creating PRs:**
   - After CI passes, click "Enable auto-merge" button
   - Select "Squash and merge"
   - PR auto-merges when all checks pass

### Option 2: Use the Auto-merge Workflow

The `.github/workflows/auto-merge.yml` workflow will:

- Auto-enable merge for PRs from repo owner
- Auto-merge Dependabot PRs
- Auto-merge PRs with `auto-merge` label

**Requirements:**

- Enable auto-merge in repo settings first
- Workflow uses `GITHUB_TOKEN` (no PAT needed for basic usage)

### Option 3: Bypass Branch Protection (Admin Only)

Admins can push directly with `--no-verify` and GitHub bypasses rules.
This is what we did today - not recommended for team workflows.

## Recommended Workflow

1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes and commit
3. Push and create PR: `gh pr create --fill`
4. Enable auto-merge: `gh pr merge --auto --squash`
5. PR merges automatically when CI passes

## CLI Commands

```bash
# Create PR with auto-merge enabled
gh pr create --fill && gh pr merge --auto --squash

# Enable auto-merge on existing PR
gh pr merge <PR_NUMBER> --auto --squash

# Merge immediately (if checks pass)
gh pr merge <PR_NUMBER> --squash --delete-branch
```

## Status Check Requirements

Your repo requires these 5 checks to pass:

1. Lint
2. TypeScript check
3. Unit tests
4. Build
5. (Check your repo settings for the 5th)

**Note:** The pre-existing 392 test failures will block auto-merge until fixed.
