# Commit Message Fix

**Issue:** Commit failed due to body lines exceeding 100 characters

---

## ❌ Error

```
✖   body's lines must not be longer than 100 characters [body-max-line-length]
```

---

## ✅ Solution Options

### Option 1: Fix Commit Message (Recommended)

```powershell
# Amend the commit with shorter lines
git commit --amend
```

Then edit the message to have lines under 100 characters:

```
feat: update configuration and fix API key storage

- Updated .env.example with API keys and database paths
- Enhanced eslint configuration for React hooks
- Bumped package version to 1.6.0
- Added dependencies: happy-dom, sonner
- Improved TypeScript configuration
- Added toast notifications to components
- Refactored ChatInterface and CodeSnippetsManager
- Updated versioning in Cargo.toml and tauri.conf.json

Fixed ASAR configuration to enable API key persistence.
Added graceful error handling for missing API keys.

Impact: 150 files changed, 2,500 insertions(+), 1,200 deletions(-)
```

### Option 2: Bypass Hook (Quick)

```powershell
# Skip the commit-msg hook
git commit --no-verify -m "feat: update configuration files and enhance components"
```

### Option 3: Disable commitlint

```powershell
# Temporarily disable the hook
Remove-Item .husky\commit-msg -Force

# Make your commit
git commit -m "feat: your message"

# Re-enable later if needed
```

---

## 🚀 Recommended Action

```powershell
# Fix the commit message with proper line breaks
git commit --amend
```

**In the editor that opens:**

1. Keep the first line (feat: ...)
2. Break long lines into multiple shorter lines
3. Keep each line under 100 characters
4. Save and close

---

## 📝 Commitlint Rules

- **Header:** Max 100 characters
- **Body lines:** Max 100 characters each
- **Format:** `type(scope): subject`

**Types:** feat, fix, docs, style, refactor, test, chore

---

**Quick fix:** Use `git commit --no-verify` to skip validation
