# MCP Server Setup Guide for Claude Code

This guide covers the Model Context Protocol (MCP) servers configured for this monorepo workspace.

## Current Configuration

**File:** `C:\dev\.mcp.json`

### Configured MCP Servers

1. **Nx MCP** - Monorepo intelligence
2. **Filesystem MCP** - Direct file operations
3. **Puppeteer MCP** - Browser automation
4. **GitHub MCP** - Repository management (requires API key)
5. **PostgreSQL MCP** - Database queries (supports SQLite)

---

## Server Details

### 1. Nx MCP (Active)

**Purpose:** Provides deep integration with Nx monorepo structure

**Features:**
- Workspace structure analysis
- Project dependency graph
- Running processes awareness
- Task execution intelligence

**Status:** ✓ Ready to use (no setup required)

**Usage:**
```
Ask me to "show the project graph" or "what projects are affected by this change?"
```

---

### 2. Filesystem MCP (Active)

**Purpose:** Direct filesystem operations via natural language

**Features:**
- Read/write/edit files faster than standard tools
- Directory navigation
- File search and manipulation
- Bulk operations

**Allowed Directories:**
- `C:\dev` (main workspace)
- `C:\dev\projects` (all projects)
- `D:\` (additional drive)

**Status:** ✓ Ready to use (no setup required)

**Usage:**
```
"List all TypeScript files in the crypto-enhanced project"
"Create a new config file in the web app directory"
```

---

### 3. Puppeteer MCP (Active)

**Purpose:** Browser automation and web interaction

**Features:**
- Navigate to URLs and interact with pages
- Take screenshots
- Execute JavaScript in browser context
- Form filling and clicking
- Console log capture

**Status:** ✓ Ready to use (no setup required)

**Usage:**
```
"Navigate to localhost:5173 and take a screenshot"
"Test the login form on the staging site"
"Check if the navbar renders correctly"
```

**Note:** Complements your existing Playwright testing setup

---

### 4. GitHub MCP (Requires Setup)

**Purpose:** Direct GitHub repository management

**Features:**
- Read repositories and code files
- Manage issues and PRs
- Analyze commits and code changes
- Trigger CI/CD workflows
- Search across repositories

**Status:** ⚠️ Requires API token

**Setup Instructions:**

#### Step 1: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "Claude Code MCP - C:\dev workspace"
4. Select scopes:
   - **For read-only** (recommended to start):
     - `repo:status` - Commit status
     - `public_repo` - Public repositories
   - **For full functionality**:
     - `repo` - Full repository access
     - `workflow` - GitHub Actions
     - `read:org` - Organization info
5. Generate token and copy it immediately (shown only once)

#### Step 2: Update Configuration

Edit `C:\dev\.mcp.json`:

```json
"github": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-github"
  ],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_actual_token_here"
  }
}
```

#### Step 3: Restart Claude Code

Restart Claude Code completely to load the new token.

**Security Notes:**
- Never commit `.mcp.json` with your real token to version control
- Token grants access to your GitHub account - protect it like a password
- Add `.mcp.json` to `.gitignore` if not already there

**Usage:**
```
"Create a PR for these changes"
"Show me recent issues labeled 'bug'"
"Analyze the last 10 commits for patterns"
"What's the status of CI on the main branch?"
```

---

### 5. PostgreSQL MCP (Active - SQLite Mode)

**Purpose:** Direct database queries and analysis

**Features:**
- Execute read-only SQL queries
- Schema exploration
- Table inspection
- Intelligent relationship discovery

**Current Configuration:**
- Database: `C:/dev/projects/crypto-enhanced/trading.db` (SQLite)
- Mode: Read-only (safe for production)

**Status:** ✓ Ready to use (no additional setup)

**Usage:**
```
"Show me the last 10 trades from the database"
"What's the schema of the orders table?"
"Count how many open positions we have"
"Analyze P&L by strategy over the last week"
```

**Adding More Databases:**

Edit `C:\dev\.mcp.json` to add PostgreSQL connections:

```json
"postgres": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://username:password@localhost:5432/database_name"
  ]
}
```

Or add multiple databases by creating separate server entries:

```json
"postgres-production": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://user:pass@prod-server:5432/prod_db"
  ]
},
"sqlite-trading": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "sqlite://C:/dev/projects/crypto-enhanced/trading.db"
  ]
}
```

---

## Testing MCP Connections

After completing setup, verify connections:

1. **Restart Claude Code completely**
2. Ask: "What MCP servers are connected?"
3. Test each server:
   - **Nx**: "Show me the Nx project graph"
   - **Filesystem**: "List files in C:\dev\projects\crypto-enhanced"
   - **Puppeteer**: "Navigate to https://example.com and take a screenshot"
   - **GitHub**: "Show me recent commits on this repository"
   - **PostgreSQL**: "Show tables in the trading database"

---

## Troubleshooting

### Server Not Connecting

**Issue:** MCP server shows "failed" or doesn't appear

**Solutions:**
1. Restart Claude Code completely
2. Check `~/.claude.json` or project `.mcp.json` for syntax errors (valid JSON)
3. Verify Node.js is installed: `node --version` (should be 18+)
4. Test NPX access: `npx -y @modelcontextprotocol/server-filesystem --help`
5. Check logs (if available) in `%APPDATA%\Claude\logs\`

### GitHub Token Issues

**Issue:** GitHub MCP not authenticating

**Solutions:**
1. Verify token format starts with `ghp_` (classic token)
2. Check token hasn't expired (GitHub → Settings → Developer settings)
3. Ensure token has correct scopes selected
4. Try regenerating the token with same scopes
5. Restart Claude Code after updating token

### Puppeteer Timeout

**Issue:** Browser operations timing out

**Solutions:**
1. Check internet connection
2. Verify no firewall blocking Chromium download
3. Try simpler command first: "Navigate to https://example.com"
4. On first use, may need to download Chromium (takes 1-2 minutes)

### Database Connection Failed

**Issue:** Cannot connect to SQLite/PostgreSQL

**Solutions:**
1. Verify database file exists: `Test-Path "C:/dev/projects/crypto-enhanced/trading.db"`
2. Check file permissions (read access required)
3. For PostgreSQL, verify connection string format
4. Test connection string with: `sqlite3 trading.db ".tables"` or `psql <connection_string>`

---

## Security Best Practices

### API Key Management

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive tokens
3. **Create read-only tokens** when possible
4. **Rotate tokens regularly** (every 90 days)
5. **Revoke unused tokens** immediately

### MCP Server Trust

Only install MCP servers from:
- Official Anthropic repositories (@modelcontextprotocol)
- Verified organizations (GitHub, Microsoft, Docker)
- Well-maintained open source projects with active communities

**Warning:** MCP servers have full system access through Claude Code. Only use trusted servers.

### Database Access

- **Default to read-only** queries (already configured)
- **Never expose production credentials** in config files
- **Use separate database users** with minimal permissions for MCP
- **Monitor query logs** for unexpected activity

---

## Advanced Configuration

### Adding Docker MCP (Optional)

Install Docker MCP Gateway:

```json
"docker": {
  "command": "docker",
  "args": [
    "mcp",
    "gateway",
    "run"
  ]
}
```

Requires: Docker Desktop with MCP Gateway enabled

### Custom Filesystem Roots

Restrict or expand filesystem access:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "C:\\dev\\projects\\active\\web-apps",
    "C:\\dev\\projects\\crypto-enhanced"
  ]
}
```

### Remote MCP Servers

For HTTP-based MCP servers:

```json
"remote-server": {
  "type": "http",
  "url": "https://api.example.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

---

## Performance Tips

1. **Disable unused servers** - Each server adds to context window
2. **Use specific commands** - More precise = faster response
3. **Prefer Filesystem MCP** over standard Read/Write for bulk operations
4. **Cache results** - Ask follow-up questions on same data
5. **Restart periodically** - Fresh connections if servers become slow

---

## Getting Help

### Documentation
- **Official MCP Docs**: https://modelcontextprotocol.io/
- **Claude Code MCP Guide**: https://docs.claude.com/en/docs/claude-code/mcp
- **Nx AI Integration**: https://nx.dev/getting-started/ai-integration

### Debugging
- Enable MCP debug mode: Launch Claude Code with `--mcp-debug` flag
- Check connection status: Ask "What MCP servers are connected?"
- Review logs: `%APPDATA%\Claude\logs\mcp-*.log`

### Community
- GitHub Discussions: https://github.com/modelcontextprotocol/
- Awesome MCP Servers: https://mcpservers.org/

---

## Changelog

**2025-10-11** - Initial setup
- Added Nx MCP (monorepo intelligence)
- Added Filesystem MCP (C:\dev, C:\dev\projects, D:\)
- Added Puppeteer MCP (browser automation)
- Added GitHub MCP (requires token setup)
- Added PostgreSQL MCP (SQLite mode for trading.db)

---

## Next Steps

1. ✓ Configure `.mcp.json` (completed)
2. ⚠️ Set up GitHub Personal Access Token (tomorrow)
3. ⚠️ Test all MCP connections
4. ⚠️ Add additional databases if needed
5. ⚠️ Explore advanced features

For questions about this setup, check CLAUDE.md or ask me directly.
