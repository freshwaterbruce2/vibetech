# Codex CLI Setup Guide for VibeTech Monorepo

## Current Installation Status

✅ **Codex CLI v0.63.0** - Already installed (latest version as of Nov 21, 2025)
✅ **Configuration File** - Created at `C:\Users\fresh_zxae3v6\.codex\config.toml`
✅ **AGENTS.md** - Enhanced with Codex-specific guidance  
✅ **MCP Servers** - Configured for filesystem, SQLite, GitHub, and Desktop Commander v3

---

## Quick Start

### 1. Authenticate Codex CLI

**Option A: Sign in with ChatGPT (Recommended)**

```bash
codex
# When prompted, select "Sign in with ChatGPT"
# Follow the browser authentication flow
# Benefits: Automatic API key configuration + promotional credits
#   - ChatGPT Plus: $5 in API credits
#   - ChatGPT Pro: $50 in API credits
```

**Option B: Use API Key**

```bash
# Set your OpenAI API key (get from https://platform.openai.com/api-keys)
export OPENAI_API_KEY="sk-..."

# Or add to PowerShell profile for persistence
$env:OPENAI_API_KEY="sk-..."
```

### 2. Verify Installation

```bash
# Check Codex version
codex --version
# Expected output: codex-cli 0.63.0

# Verify configuration
cat ~/.codex/config.toml

# Test basic functionality
cd C:\dev
codex "List all projects in this monorepo"
```

### 3. Test MCP Servers

```bash
# Launch Codex and verify MCP servers are loaded
codex

# In the Codex session, ask:
# "What MCP servers are available?"
# Expected: filesystem, filesystem-data, sqlite, desktop-commander, github

# Test filesystem access
# "List files in D:\databases"

# Test Desktop Commander
# "Use desktop-commander to check system information"
```

---

## Configuration Details

### Model & Reasoning

- **Primary Model**: `gpt-5.1-codex-max`
- **Context Window**: 192K tokens (196,608 tokens)
- **Reasoning Effort**: `medium` (adjustable: minimal, low, medium, high)
- **Reasoning Summary**: `concise` (options: auto, concise, detailed, none)
- **Verbosity**: `medium` (controls output length)

### Approval & Sandbox

- **Approval Policy**: `on-failure`
  - Codex runs trusted commands automatically
  - Asks permission when commands fail in sandbox
  - Allows retries outside sandbox with approval

- **Sandbox Mode**: `workspace-write`
  - Read access: Entire filesystem
  - Write access: C:\dev workspace + D:\ data directories
  - Network access: **Enabled** (for npm/pnpm installations)
  - Windows sandbox: **Experimental mode enabled**

### MCP Servers Configured

| Server | Purpose | Access Path |
|--------|---------|-------------|
| **filesystem** | Monorepo access | C:\dev |
| **filesystem-data** | Data storage | D:\ (logs, databases, data, learning) |
| **sqlite** | Database operations | D:\databases |
| **desktop-commander** | Windows automation | Custom built MCP server |
| **github** | PR/issue management | Requires GITHUB_TOKEN env var |

### Profiles for Different Workflows

Switch profiles using `codex --profile <name>`:

| Profile | Use Case | Approval Policy | Sandbox Mode | Reasoning |
|---------|----------|-----------------|--------------|-----------|
| **default** | General development | on-failure | workspace-write | medium |
| **crypto** | Trading system work | untrusted | workspace-write | high |
| **quick** | Fast experiments | on-request | read-only | low |
| **production** | Deployments | untrusted | read-only | high + detailed |

**Example usage:**
```bash
# Use crypto profile for trading system development
cd C:\dev\projects\crypto-enhanced
codex --profile crypto "Review the trading engine for potential bugs"

# Use quick profile for fast exploration
codex --profile quick "Explain how the Nova Agent IPC bridge works"
```

---

## Workspace Navigation

### AGENTS.md File Discovery

Codex automatically reads AGENTS.md files in this order:

1. `~/.codex/AGENTS.md` - Personal preferences (optional)
2. `C:\dev\AGENTS.md` - **Root monorepo guidelines** ✅
3. Project-specific AGENTS.md files as needed

### Monorepo-Aware Commands

```bash
# Launch Codex from monorepo root
cd C:\dev
codex

# Workspace-aware tasks
codex "Build all projects using Nx"
codex "Run tests for affected projects"
codex "Add a new shared package for authentication"
```

---

## Testing the Setup

Run these 7 tests to verify everything works:

### Test 1: Basic Functionality
```bash
cd C:\dev
codex "List all pnpm workspaces in this monorepo"
```

### Test 2: File Access (C:\dev)
```bash
codex "Read the package.json for nova-agent-current"
```

### Test 3: File Access (D:\ drive)
```bash
codex "List all databases in D:\databases"
```

### Test 4: SQLite MCP
```bash
codex "Show the schema for D:\databases\agent_learning.db"
```

### Test 5: Desktop Commander v3
```bash
codex "Use desktop-commander to check CPU and memory usage"
```

### Test 6: Nx Integration
```bash
codex "Show which projects depend on @vibetech/shared-ipc"
```

### Test 7: Sandbox Enforcement
```bash
codex "Try to create a test file in C:\Windows\System32"
```

---

## Troubleshooting

### MCP Server Not Loading
```bash
# Verify MCP server packages are installed
npx @modelcontextprotocol/server-filesystem --help

# Check Desktop Commander v3 is built
cd C:\dev\apps\desktop-commander-v3
pnpm build
ls dist/index.js
```

### Path Errors on Windows
Ensure paths in config.toml use double backslashes:
```toml
args = ["C:\\dev\\apps\\desktop-commander-v3\\dist\\index.js"]
```

### GitHub MCP Not Working
```powershell
# Set GITHUB_TOKEN environment variable
$env:GITHUB_TOKEN="ghp_..."
```

---

## Next Steps

1. **Authenticate**: Run `codex` and sign in with ChatGPT
2. **Test**: Run the 7 tests above to verify everything works
3. **Explore**: Try using Codex for real tasks in the monorepo
4. **Customize**: Adjust config.toml and AGENTS.md as needed

---

## Resources

- **Official Docs**: https://developers.openai.com/codex/
- **GitHub Repo**: https://github.com/openai/codex
- **Configuration**: https://developers.openai.com/codex/local-config/
- **Monorepo AGENTS.md**: `C:\dev\AGENTS.md`
- **Config File**: `C:\Users\fresh_zxae3v6\.codex\config.toml`
