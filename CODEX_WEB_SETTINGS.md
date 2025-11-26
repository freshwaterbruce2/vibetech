# Codex Web Interface Settings Guide

**For:** https://chatgpt.com/codex
**Repository:** freshwaterbruce2/vibetech
**Date:** 2025-11-25

---

## 🎯 How to Configure Codex Web Interface

### Step 1: Access Settings
1. Go to **https://chatgpt.com/codex**
2. Click **Settings** (gear icon)
3. Navigate to **General** tab

---

## 📋 Custom Instructions

### Where to Add
**Settings > General > Custom Instructions**

### What to Paste
Copy the entire content from `~/.codex/instructions.md` or use this condensed version:

```
PROJECT CONTEXT:
- Monorepo: freshwaterbruce2/vibetech (pnpm + Turborepo)
- Development directory: C:\dev
- Data storage: D:\databases, D:\logs, D:\learning, D:\vision
- Package manager: pnpm (NEVER npm/yarn)
- Platform: Windows 11, PowerShell

MANDATORY RULES:
- All files created after 2025-11-22 MUST be ≤360 lines
- All databases, logs, and data files MUST be stored on D:\ drive (NEVER in C:\dev)
- Use AGENTS.md files for project-specific guidance
- Follow Conventional Commits format (feat:, fix:, chore:, etc.)

BUILD & TEST COMMANDS:
- Run `pnpm typecheck` for TypeScript validation
- Run `pnpm test` for Vitest tests
- Run `pnpm lint` before commits
- Use `pnpm --filter <package>` for package-specific commands

CODE STANDARDS:
- TypeScript-first with strict mode
- Functional React components with hooks
- Tailwind CSS for styling
- 2-space indent, single quotes, trailing commas (Prettier)

WHEN MAKING CHANGES:
- Read related AGENTS.md files first
- Verify integration points before modifying
- Always add error handling and loading states
- Test locally before committing
- Update documentation when behavior changes
```

---

## 🌿 Branch Format

### Where to Configure
**Settings > General > Branch format**

### What to Enter
```
codex/{date}/{feature}
```

### Example Branches
```
codex/2025-11-25/fix-typescript-errors
codex/2025-11-25/implement-dxgi-acceleration
codex/2025-11-26/add-vision-system-tests
codex/2025-11-26/refactor-learning-service
```

### Benefits
✅ **Chronological organization** - Easy to see when work was done
✅ **Date filtering** - Find all work from a specific date
✅ **Clear feature naming** - Understand branch purpose at a glance
✅ **Automatic cleanup** - Old branches easy to identify and remove

### Available Tags
- `{date}` - Current date in YYYY-MM-DD format
- `{time}` - Current time in HH-MM format
- `{feature}` - Feature description (auto-generated or manual)

---

## 📊 Diff Display Format

### Where to Configure
**Settings > General > Diff display format**

### Recommended Setting
**Unified** ✅

### Why Unified?
✅ Better for reviewing monorepo changes
✅ Shows full context around modifications
✅ Easier to understand cross-file dependencies
✅ Standard format familiar to most developers

### Alternative: Split
- Side-by-side view
- Good for simple line-by-line comparisons
- Can be harder to read for large changes

---

## 🔍 Code Review Settings

### Where to Configure
**Settings > Code review**

### Recommended Settings

#### **Run tests before creating PR**
✅ **Enabled**
- Command: `pnpm test`
- Ensures all tests pass before PR creation

#### **Run linters for every code change**
✅ **Enabled**
- Commands: `pnpm lint && pnpm typecheck`
- Skip for: Documentation-only changes (*.md files)

#### **Require approval for specific changes**
✅ **Enabled for:**
- Dependency changes (`package.json`, `Cargo.toml`, `pnpm-lock.yaml`)
- Database schema modifications
- Security-sensitive code (auth, encryption, API keys)
- Breaking API changes
- Git operations (commits, pushes, force-push)

#### **Auto-approve safe operations**
✅ **Enabled for:**
- Formatting changes (Prettier)
- Linting fixes (ESLint auto-fix)
- Documentation updates
- Code comments
- TypeScript type additions (no logic changes)

---

## 🔗 Connectors (GitHub Integration)

### Where to Configure
**Settings > Connectors**

### Setup Steps

1. **Click "Connect GitHub"**
2. **Authorize OpenAI Codex** application
3. **Select repositories:**
   - ✅ freshwaterbruce2/vibetech (main monorepo)
   - Add others as needed

4. **Grant permissions:**
   - ✅ Read repository contents
   - ✅ Read/write code
   - ✅ Create pull requests
   - ✅ Read/write issues
   - ✅ Access commits and branches
   - ✅ Read/write workflows (optional)

5. **Verify connection:**
   - Should show "✅ Connected" status
   - Repository name should appear

### Test Connection
In Codex CLI or web chat:
```
codex "Show me the current git status"
codex "List all open pull requests"
codex "Show me recent commits"
```

Should display repository information correctly.

---

## 🌍 Environment Variables

### Where to Configure
**Settings > Environments**

### Recommended Variables

```env
# Required for Nova Agent
DEEPSEEK_API_KEY=<your-deepseek-api-key>

# Development settings
NODE_ENV=development

# Package manager
PNPM_HOME=C:\Users\fresh_zxae3v6\AppData\Roaming\npm

# Optional: Custom paths
NOVA_STORAGE_PATH=D:\
VISION_CACHE_PATH=D:\vision\capture-cache
```

### Security Notes
- ⚠️ **Never commit API keys** to repository
- ✅ Use environment variables for all secrets
- ✅ Codex will not expose these in PRs or commits
- ✅ Variables are stored securely in Codex settings

---

## 📈 Usage Monitoring

### Where to View
**Settings > Usage**

### What to Monitor
- **Tokens used** - Track API usage
- **Requests made** - Number of Codex operations
- **Code changes** - Files modified, lines added/removed
- **PRs created** - Pull requests generated
- **Tests run** - Automated test executions

### Recommendations
- Review usage weekly
- Set alerts for high token usage
- Monitor failed operations for patterns
- Adjust approval policies based on usage

---

## 🔒 Data Controls

### Where to Configure
**Settings > Data controls**

### Recommended Settings

#### **Code analysis**
✅ **Enabled**
- Allows Codex to understand codebase
- Required for intelligent suggestions

#### **Learning from your code**
Your choice:
- ✅ Enable: Improves Codex suggestions over time
- ❌ Disable: Keep code patterns private

#### **Share usage data**
Your choice:
- ✅ Enable: Helps improve Codex
- ❌ Disable: Keep usage private

#### **Exclude sensitive files**
✅ **Enabled**
- Auto-excludes: `.env`, `*.pem`, `*.key`
- Respects: `.codexignore` patterns
- Custom exclusions: Add as needed

---

## ✅ Configuration Checklist

After completing all settings, verify:

- [x] Custom instructions pasted
- [x] Branch format set to `codex/{date}/{feature}`
- [x] Diff display set to Unified
- [x] GitHub connector linked to freshwaterbruce2/vibetech
- [x] Environment variables configured (DEEPSEEK_API_KEY, etc.)
- [x] Code review settings enabled
- [x] Test automation configured
- [x] Sensitive file exclusions verified

---

## 🧪 Test Your Configuration

### Test 1: Custom Instructions
```
codex "What file size limit should I follow?"
```
**Expected:** "All files must be ≤360 lines"

### Test 2: Branch Creation
```
codex "Create a new branch for fixing TypeScript errors"
```
**Expected:** Branch named like `codex/2025-11-25/fix-typescript-errors`

### Test 3: Code Review
```
codex "Create a PR for the vision system implementation"
```
**Expected:**
- Tests run automatically
- Linter runs automatically
- PR created with proper format

### Test 4: GitHub Integration
```
codex "Show me open issues in the repository"
```
**Expected:** Lists issues from freshwaterbruce2/vibetech

---

## 📚 Additional Resources

### Codex Documentation
- **Official Docs:** https://developers.openai.com/codex/
- **CLI Reference:** https://developers.openai.com/codex/cli/reference
- **Local Config:** https://developers.openai.com/codex/local-config/

### Internal Documentation
- `~/.codex/config.toml` - CLI configuration
- `~/.codex/instructions.md` - Custom instructions (full version)
- `C:\dev\CODEX_SETUP_GUIDE.md` - Overall setup guide
- `C:\dev\.codexignore` - Ignore patterns

---

## 🆘 Troubleshooting

### Issue: "Custom instructions not being followed"
**Solution:** Re-paste instructions in web interface, ensure no formatting issues

### Issue: "Branch format not applying"
**Solution:** Check exact format in settings: `codex/{date}/{feature}` (no spaces)

### Issue: "GitHub integration failing"
**Solution:**
1. Disconnect and reconnect in Settings > Connectors
2. Re-authorize GitHub application
3. Verify repository permissions

### Issue: "Tests not running automatically"
**Solution:** Check Code review settings, ensure `pnpm test` command is correct

### Issue: "Environment variables not available"
**Solution:** Add variables in Settings > Environments, restart Codex session

---

**All settings configured! Ready to use Codex web interface! 🚀**
