# OpenAI Codex Setup Guide for Vibetech Monorepo

**Date:** 2025-11-25
**Repository:** freshwaterbruce2/vibetech
**Workspace:** C:\dev (monorepo root)
**Data Storage:** D:\ drive (databases, logs, learning systems)

---

## ✅ Configuration Complete

### 1. Codex CLI Installation
- **Location:** `/c/Users/fresh_zxae3v6/AppData/Roaming/npm/codex`
- **Version:** Latest (using gpt-5.1-codex-max model)
- **Status:** ✅ Installed and configured

### 2. Configuration File
**Location:** `~/.codex/config.toml`

```toml
# Model Configuration
model = "gpt-5.1-codex-max"
model_reasoning_effort = "low"

# IMPORTANT: Sandbox mode OFF for real changes
sandbox_mode = "off"
approval_policy = "prompt"

# Workspace Configuration
[workspace]
root = "C:\\dev"

# D:\ drive access for data storage (per project architecture)
writable_roots = [
    "C:\\dev",
    "D:\\databases",
    "D:\\logs",
    "D:\\data",
    "D:\\learning",
    "D:\\vision",
    "D:\\config"
]

network_access = true

[mcp_servers."nx-mcp"]
type = "stdio"
command = "npx"
args = ["nx", "mcp"]
```

### 3. Ignore Patterns
**File:** `C:\dev\.codexignore` ✅ Created

Excludes: node_modules, build outputs, logs, caches, IDE files, secrets

**Note:** D:\ drive directories (databases, logs, learning, vision) are **accessible** via `writable_roots`

---

## 🔗 GitHub Integration Setup

### Step 1: Connect GitHub Account
1. Go to **https://chatgpt.com/codex**
2. Sign in with your ChatGPT Plus/Pro account
3. Click **Settings** > **Integrations**
4. Click **Connect GitHub**

### Step 2: Grant Repository Access
1. Authorize OpenAI Codex application
2. Select **freshwaterbruce2/vibetech** repository
3. Grant permissions:
   - ✅ Read repository contents
   - ✅ Read/write code
   - ✅ Create pull requests
   - ✅ Read/write issues
   - ✅ Access commits and branches

### Step 3: Verify Connection
```bash
# In Codex CLI or web interface
codex "Show me the current repository status"
```

Should display: **freshwaterbruce2/vibetech** connected

---

## 🚀 Using Codex for Real Changes

### Basic Commands

#### **Make Code Changes**
```bash
codex "Fix all TypeScript errors in apps/nova-agent"
codex "Add proper error handling to VisionService.ts"
codex "Implement the DXGI GPU acceleration in screen_capture.rs"
```

#### **Create Files**
```bash
codex "Create a new AGENTS.md file for apps/vibe-code-studio"
codex "Add unit tests for VisionPanel component"
```

#### **Git Operations**
```bash
codex "Create a commit with all the TypeScript fixes"
codex "Create a PR for the vision system implementation"
```

#### **Monorepo Operations (via Nx MCP)**
```bash
codex "Run tests for the nova-agent package"
codex "Build all affected packages"
codex "Show me the dependency graph for apps/vibe-code-studio"
```

---

## 📁 Project Structure Awareness

Codex is aware of your monorepo structure via `AGENTS.md` files:

### **Root Level** (`C:\dev\AGENTS.md`)
- Monorepo organization (pnpm workspaces, Turborepo)
- Build/test commands
- Coding standards
- Security guidelines

### **Nova Agent** (`C:\dev\apps\nova-agent\AGENTS.md`)
- Project overview (Tauri + React 19)
- Tech stack (Rust backend, TypeScript frontend)
- **360-line file size limit** (MANDATORY)
- **D:\ drive storage rule** (MANDATORY)
- Build commands, testing, architecture patterns

### **Vibe Code Studio** (Create AGENTS.md)
TODO: Add project-specific guidelines

---

## ⚙️ Approval Policies

### Current Setting: `prompt`
Codex will **ask for approval** before:
- Deleting files
- Modifying package.json dependencies
- Git commits and pushes
- Creating pull requests
- Running destructive commands

### Change Approval Policy (Optional)
Edit `~/.codex/config.toml`:

```toml
approval_policy = "auto"      # Auto-approve safe operations
approval_policy = "prompt"    # Ask before changes (CURRENT)
approval_policy = "manual"    # Require manual confirmation for all
```

---

## 🎯 Key Features Enabled

✅ **Real File Modifications** - Sandbox mode OFF
✅ **Git Integration** - Commits, branches, PRs
✅ **GitHub PR Creation** - Direct from Codex
✅ **Monorepo Awareness** - Nx MCP server for workspace operations
✅ **Multi-Drive Access** - C:\dev + D:\ drive (databases, logs, learning)
✅ **AGENTS.md Guidance** - Project-specific rules and conventions
✅ **Network Access** - npm, git, API calls

---

## 🧪 Test Configuration

### Test 1: Simple File Creation
```bash
codex "Create a test file at C:\dev\CODEX_TEST.md with current timestamp"
```

**Expected:** File created successfully

### Test 2: Read D:\ Drive
```bash
codex "List all databases in D:\databases\"
```

**Expected:** Shows database files (nova_activity.db, vision_analysis, etc.)

### Test 3: TypeScript Fix
```bash
codex "Run typecheck in apps/nova-agent and report any errors"
```

**Expected:** No errors (all fixed in previous session)

### Test 4: Git Status
```bash
codex "Show git status and suggest what to commit"
```

**Expected:** Shows modified files and suggestions

---

## 📚 Documentation & Resources

### Internal Documentation
- `C:\dev\AGENTS.md` - Monorepo guidelines
- `C:\dev\apps\nova-agent\AGENTS.md` - Nova Agent rules
- `C:\dev\apps\nova-agent\VISION_FRONTEND_COMPLETE.md` - Vision system docs
- `C:\dev\apps\nova-agent\START_NOVA_AGENT.md` - Startup guide

### External Resources
- **Codex Docs:** https://developers.openai.com/codex/
- **Codex CLI Reference:** https://developers.openai.com/codex/cli/reference
- **Codex Web Interface:** https://chatgpt.com/codex
- **GitHub Integration:** https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

---

## 🔒 Security Notes

### Protected Secrets
`.codexignore` excludes:
- `.env` files
- `*.pem`, `*.key` files
- API keys and tokens

### GitHub Token
⚠️ **WARNING:** Your git remote contains an embedded GitHub token:
```
userremote	https://github_pat_11BUUGJKY0...@github.com/freshwaterbruce2/crypto-bot.git
```

**Recommendation:** Use SSH keys or GitHub CLI instead of embedded tokens in remote URLs.

### Safe Operations
Codex will:
- ✅ Read code and suggest improvements
- ✅ Modify files with your approval
- ✅ Create commits with descriptive messages
- ❌ Never commit secrets or .env files
- ❌ Never force-push to main/master

---

## 🐛 Troubleshooting

### Issue: "Sandbox mode is enabled"
**Solution:** Check `~/.codex/config.toml` has `sandbox_mode = "off"`

### Issue: "Permission denied on D:\ drive"
**Solution:** Verify `writable_roots` in config includes D:\ paths

### Issue: "Cannot find module errors"
**Solution:** Run `pnpm install` in workspace root

### Issue: "GitHub integration not working"
**Solution:**
1. Go to https://chatgpt.com/codex
2. Settings > Integrations > GitHub
3. Reconnect and grant permissions

### Issue: "Nx MCP server not responding"
**Solution:**
```bash
npx nx --version  # Verify Nx is installed
pnpm install      # Reinstall dependencies
```

---

## ✨ Next Steps

1. ✅ Configuration complete
2. ⏭️ Connect GitHub integration (web interface)
3. ⏭️ Run test commands to verify setup
4. ⏭️ Create AGENTS.md for apps/vibe-code-studio
5. ⏭️ Start using Codex for development tasks!

---

**Ready to code with AI assistance! 🚀**
