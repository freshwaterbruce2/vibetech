---
applyTo: '**'
name: "Git & Commit Guidelines"
description: "Version control best practices and conventional commits"
---

## Git Workflow

### Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/payment-integration

# Bug fixes
fix/nonce-synchronization
fix/websocket-reconnection

# Copilot branches (auto-created)
copilot/issue-123-setup-instructions
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation changes
- **style**: Code style changes (formatting, whitespace)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependency changes
- **ci**: CI/CD configuration changes
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add OAuth2 login support

# Bug fix
fix(trading): use nanoseconds for Kraken API nonce

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(components): extract reusable Button component

# Multiple scopes
fix(backend,frontend): resolve CORS issue with API calls
```

### Commit Message Guidelines

1. **Subject line** (first line):
   - Max 72 characters
   - Imperative mood: "add" not "added" or "adds"
   - No period at the end
   - Capitalize first letter

2. **Body** (optional):
   - Wrap at 72 characters
   - Explain WHAT and WHY, not HOW
   - Separate from subject with blank line

3. **Footer** (optional):
   - Reference issues: `Closes #123`
   - Breaking changes: `BREAKING CHANGE: description`

### Good Examples

```bash
# Simple fix
fix(trading): prevent duplicate order submissions

# With body
feat(blog): add markdown support for blog posts

Add support for writing blog posts in markdown format with
syntax highlighting and code blocks. Improves content authoring
experience for technical articles.

# With issue reference
fix(api): handle timeout errors gracefully

Closes #456

# Breaking change
feat(auth)!: migrate to Auth0 for authentication

BREAKING CHANGE: Custom auth tokens are no longer supported.
Users must re-authenticate using Auth0.
```

### Bad Examples

```bash
# ❌ Too vague
fix: bug fixes

# ❌ Not imperative mood
feat: added new feature

# ❌ Too long subject
feat(components): add a new reusable button component with multiple variants and sizes that can be used across the application

# ❌ Missing type
update documentation for API endpoints

# ❌ Using emojis
feat: ✨ add sparkly new feature
```

## Pre-commit Quality Checks

The repository includes automated pre-commit hooks that run before each commit:

### Checks Performed

1. **File Size Validation** - Blocks files > 5MB
2. **Security Scan** - Detects secrets, API keys, tokens
3. **JavaScript/TypeScript Linting** - ESLint with auto-fix
4. **Python Linting** - Ruff check + format
5. **PowerShell Analysis** - PSScriptAnalyzer
6. **JSON/YAML Validation** - Syntax checking
7. **Merge Conflict Detection** - Prevents committing conflict markers
8. **Import Validation** - Warns about deep relative imports
9. **Trading System Safety** - Financial safety checks

### Bypass (Emergency Only)

```bash
# Skip all hooks (use sparingly!)
git commit --no-verify -m "emergency: fix critical production bug"
```

## Monorepo Workflow

### Incremental Merge Strategy

To prevent massive merge conflicts, merge feature branches to main every 10 commits:

```bash
# Check commits ahead of main
git log main..HEAD --oneline | wc -l

# When you hit 10 commits, merge to main:
git checkout main
git pull
git merge feature/your-branch --no-ff
git push origin main

# Continue working
git checkout feature/your-branch
```

### Git Aliases (Recommended)

Add to `.gitconfig`:

```bash
[alias]
  commits-ahead = "!git log main..HEAD --oneline | wc -l"
  sync = "!git checkout main && git pull && git checkout -"
  imerge = "!git checkout main && git pull && git merge @{-1} --no-ff && git push && git checkout @{-1}"
```

Usage:
```bash
git commits-ahead  # Show number of commits ahead of main
git sync           # Pull main and return to your branch
git imerge         # Incremental merge (full flow)
```

## Best Practices

### Commit Frequency

- Commit early and often
- Each commit should be a logical unit of work
- Atomic commits: one feature/fix per commit
- Aim for 10-15 commits per feature branch

### What to Commit

```bash
# ✅ DO commit
- Source code changes
- Configuration files
- Documentation updates
- Test files
- Package manifests (package.json, requirements.txt)

# ❌ DON'T commit
- node_modules/
- .venv/
- dist/, build/
- .env files (use .env.example instead)
- IDE settings (.vscode/, .idea/)
- OS files (.DS_Store, Thumbs.db)
- Log files (*.log)
- Database files (*.db, *.sqlite)
```

### Commit Message Tips

1. **Use the imperative mood**: "fix bug" not "fixed bug"
2. **Be specific**: "fix nonce error in Kraken API" not "fix bug"
3. **Reference issues**: Include issue numbers when relevant
4. **Explain why**: Use body to explain rationale for complex changes
5. **Keep it professional**: No emojis, slang, or informal language

## Handling Large Changes

### Breaking Large Features into Commits

```bash
# Good approach - multiple logical commits
git commit -m "feat(auth): add User model and database schema"
git commit -m "feat(auth): implement registration endpoint"
git commit -m "feat(auth): add JWT token generation"
git commit -m "feat(auth): create login UI component"
git commit -m "test(auth): add authentication flow tests"
```

### Using Branches Effectively

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Work on feature with multiple commits
# ...commits...

# Merge back to main when complete
git checkout main
git merge feature/user-authentication --no-ff
git branch -d feature/user-authentication
```

## Resolving Conflicts

### Prevention

- Merge main into your branch regularly
- Use incremental merge strategy (every 10 commits)
- Communicate with team about overlapping work

### Resolution

```bash
# Update your branch with latest main
git checkout feature/your-branch
git merge main

# Resolve conflicts in editor
# Look for conflict markers: <<<<<<<, =======, >>>>>>>

# Stage resolved files
git add resolved-file.ts

# Complete the merge
git commit -m "merge: resolve conflicts with main"
```

## Reviewing Changes

### Before Committing

```bash
# See what changed
git status
git diff

# See staged changes
git diff --staged

# Review specific file
git diff src/components/Button.tsx
```

### After Committing

```bash
# View recent commits
git log --oneline -10

# View specific commit
git show <commit-hash>

# View commit history with graph
git log --graph --oneline --all
```

## Special Cases

### Amending Last Commit

```bash
# Fix last commit message
git commit --amend -m "feat(auth): add OAuth2 support"

# Add forgotten files to last commit
git add forgotten-file.ts
git commit --amend --no-edit
```

⚠️ **Warning**: Never amend commits that have been pushed to shared branches!

### Reverting Changes

```bash
# Revert specific commit (creates new commit)
git revert <commit-hash>

# Discard uncommitted changes
git checkout -- file.ts

# Discard all uncommitted changes
git reset --hard HEAD
```

### Stashing Changes

```bash
# Save work in progress
git stash save "WIP: implementing new feature"

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{2}
```

## CI/CD Integration

### GitHub Actions Triggers

```yaml
# Triggers on commit to specific branches
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

### Commit-Based Workflows

- All tests run on commit to feature branch
- Linting and type checking enforced via pre-commit hooks
- Deployment triggered by merge to main
- Tag creation triggers release builds

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- Repository-specific: `GIT-COMMIT-GUIDE.md`
- Repository-specific: `MONOREPO_WORKFLOW.md`
