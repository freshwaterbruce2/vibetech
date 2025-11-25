# Pre-Commit Hooks Setup Guide

## Overview

This guide explains how to set up pre-commit hooks to ensure code quality before commits.

## Recommended Setup (Husky + lint-staged)

### Installation

Due to dependency conflicts, manual installation may be required:

```bash
# Try standard installation first
npm install -D husky lint-staged

# If that fails, try with legacy peer deps
npm install -D husky lint-staged --legacy-peer-deps

# Or use alternative: simple-git-hooks
npm install -D simple-git-hooks lint-staged
```

### Configuration

Add to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install",
    "precommit": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Initialize Husky

```bash
# Initialize husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run precommit"

# Create pre-push hook (optional)
npx husky add .husky/pre-push "npm run quality"
```

## Alternative: Manual Git Hooks

If Husky installation fails, use native git hooks:

### Create `.git/hooks/pre-commit`

```bash
#!/bin/sh
# Pre-commit hook for quality checks

echo "Running pre-commit quality checks..."

# Run linter
npm run lint:fix
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix errors before committing."
  exit 1
fi

# Run type checker
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix errors before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
```

### Make it executable

```bash
chmod +x .git/hooks/pre-commit
```

## Quality Gate Commands

These commands are run by pre-commit hooks:

```bash
# Lint and auto-fix
npm run lint:fix

# Type checking
npm run typecheck

# Full quality pipeline (for pre-push)
npm run quality
```

## Bypass Hooks (Emergency Only)

In rare cases when you need to bypass hooks:

```bash
git commit --no-verify -m "Emergency fix"
```

⚠️ **Use sparingly** - bypassing hooks can introduce issues.

## Current Status

**Pre-commit hooks:** Not yet installed due to npm dependency conflicts

**Recommended actions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install`
4. Try Husky installation again
5. Or use manual git hooks as fallback

## Testing Hooks

After setup, test your hooks:

```bash
# Make a small change
echo "test" >> test.txt

# Try to commit (hooks should run)
git add test.txt
git commit -m "test: verify pre-commit hooks"

# Clean up test
git reset HEAD~1
rm test.txt
```

## Troubleshooting

### Husky not working on Windows

```bash
# Ensure git bash is available
where git

# Ensure hooks are executable
chmod +x .husky/*
```

### lint-staged skipping files

```bash
# Ensure files are staged
git add <files>

# Run lint-staged manually
npx lint-staged
```

### Hooks running but not failing

Check the exit codes in your hook scripts. Non-zero exit codes fail the commit.

---

**Last Updated:** October 1, 2025
**Status:** Documented, awaiting installation
