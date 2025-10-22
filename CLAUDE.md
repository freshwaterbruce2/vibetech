# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **fully modularized Nx monorepo** with the following project categories:
1. **Web Applications** (projects/active/web-apps/) - React 19 + TypeScript SPAs with Vite 7
2. **Desktop Applications** (projects/active/desktop-apps/) - Electron/Tauri apps with React
3. **Mobile Applications** (Vibe-Tutor/) - Capacitor PWAs with native Android/iOS support
4. **Backend Services** (backend/) - Node.js/Express API servers
5. **Python Services** (projects/crypto-enhanced/) - Live cryptocurrency trading with Kraken API
6. **Shared Libraries** (packages/) - Reusable npm packages (@nova/*, @vibetech/ui)

### Nx Integration Status (Updated: 2025-10-20)

All projects are now integrated into the Nx workspace with proper `project.json` configurations:

**✅ Fully Integrated Projects:**
- `backend` - Node.js/Express backend with Nx caching
- `crypto-enhanced` - Python trading system with custom Nx executors
- `vibe-tutor` - Capacitor mobile app with Android build targets
- `digital-content-builder` - AI content generation platform
- `business-booking-platform` - Hotel booking platform
- `nova-agent` - Desktop AI assistant
- `shipping-pwa` - Walmart DC shipping PWA
- All packages (@nova/*, @vibetech/ui)

**⚠️ Known Issues:**
- **Root duplication**: `C:\dev\src\` is a duplicate of `vibe-tech-lovable` (requires consolidation)
- **Vibe-Tutor location**: Currently at root `Vibe-Tutor/`, should be moved to `projects/active/mobile-apps/vibe-tutor/` when not locked

**Benefits of Nx Integration:**
- **80-90% faster builds** with local caching
- **Affected-only CI/CD** (only build/test changed projects)
- **Cross-language support** (TypeScript, Python, JavaScript)
- **Dependency graph** visualization (`pnpm nx graph`)
- **Remote caching** via Nx Cloud (configured)

### Capacitor Projects in Monorepo

**Vibe-Tutor** (`C:\dev\Vibe-Tutor`) - AI-powered homework manager for students
- **Type**: PWA + Capacitor Android app
- **Tech Stack**: React 19 + TypeScript + Vite + Capacitor 7
- **Status**: Production ready (v1.0.5)
- **Documentation**: See `Vibe-Tutor/CLAUDE.md` for mobile-specific guidance
- **Key Learning**: Always use Tailwind v3 (not CDN) and explicit CapacitorHttp for Android

**Important Notes for Capacitor Development**:
- ⚠️ Never use Tailwind CSS from CDN - Android WebView incompatible with v4
- ⚠️ Never rely on automatic fetch() patching - Use `CapacitorHttp.request()` explicitly
- ⚠️ Always increment `versionCode` on each Android build to force cache clear
- ⚠️ Test on real devices, not just emulators or browsers

### Workspace Web Applications

**business-booking-platform** (`projects/active/web-apps/business-booking-platform`) - Production Hotel Booking Platform
- **Type**: React 19 + TypeScript + Vite web application
- **Version**: 2.0.0 (Production-ready)
- **Features**: AI-powered search, Square payment integration, passion-based hotel matching
- **Tech Stack**: React Query, React Router 7, shadcn/ui, Tailwind CSS 4
- **Documentation**: See `projects/active/web-apps/business-booking-platform/CLAUDE.md`
- **Status**: ✅ Production-ready with comprehensive features and testing

**IconForge** (`projects/active/web-apps/iconforge`) - AI-Powered Icon Creation Platform
- **Type**: React 19 + TypeScript + Vite web application
- **Version**: 1.0.0 (Development)
- **Features**: Fabric.js canvas editor, DALL-E 3 AI generation, real-time collaboration (Socket.io + Yjs)
- **Tech Stack**: Fabric.js, Fastify backend, TanStack Query, Zustand, Tailwind CSS 3.4.18, Clerk Auth
- **Database**: SQLite (D:\databases\database.db - unified database)
- **Documentation**: See `projects/active/web-apps/iconforge/PRD_SUMMARY.md`
- **Status**: 🚧 In Development - Phase 1 MVP

**Other Active Web Apps**:
- `shipping-pwa` - PWA for Walmart DC shipping management with offline support
- `vibe-tech-lovable` - Portfolio website with 3D graphics and React Three Fiber
- `digital-content-builder` - AI-powered content generation with DeepSeek integration
- `memory-bank` - Memory management system for Claude Code

## Key Commands

### Web Application (Root Directory)

**Package Manager:** pnpm 9.15.0 (migrated from npm for 59.5% disk space savings via hard links)

```bash
# Development
pnpm run dev                # Start dev server (port 5173)
pnpm run build              # Production build
pnpm run preview            # Preview production build

# Quality Checks (run before commits)
pnpm run quality            # Full pipeline: lint + typecheck + build (Nx-powered)
pnpm run quality:fix        # Auto-fix lint issues + typecheck
pnpm run quality:affected   # Only run checks on changed projects
pnpm run lint               # ESLint check only
pnpm run typecheck          # TypeScript compilation check

# Nx Monorepo Commands (with intelligent caching)
pnpm run build:all          # Build all projects with caching
pnpm run lint:all           # Lint all projects
pnpm run test:all           # Test all projects
pnpm nx graph               # Visualize project dependencies

# Testing
pnpm run test               # Run Playwright tests
pnpm run test:ui            # Playwright UI mode
pnpm run test:unit          # Run unit tests
pnpm run test:unit:coverage # Run with coverage report

# Package Management
pnpm install                # Install all workspace dependencies
pnpm add <package>          # Add dependency to root workspace
pnpm add <package> --filter <project>  # Add to specific project
```

### Backend (backend/)
```bash
# Development
pnpm nx dev vibe-tech-backend        # Start with nodemon
pnpm nx start vibe-tech-backend      # Production start
pnpm nx health vibe-tech-backend     # Health check

# Run via workspace
pnpm --filter vibe-tech-backend dev
```

### Vibe-Tutor Mobile App (Vibe-Tutor/)
```bash
# Web development
pnpm nx dev vibe-tutor               # Vite dev server
pnpm nx build vibe-tutor             # Production build

# Android development
pnpm nx android:sync vibe-tutor      # Sync web assets
pnpm nx android:build vibe-tutor     # Build APK
pnpm nx android:deploy vibe-tutor    # Full build + install

# Direct commands (alternative)
pnpm --filter vibe-tutor android:full-build
```

### Crypto Trading System (projects/crypto-enhanced)
```bash
# Nx-integrated commands (recommended)
pnpm nx test crypto-enhanced         # Run Python tests with caching
pnpm nx test:coverage crypto-enhanced # Coverage report
pnpm nx status crypto-enhanced        # Check system status
pnpm nx start crypto-enhanced         # Start live trading

# Setup (Traditional - still supported)
cd projects/crypto-enhanced
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Setup (Docker - Recommended)
cd projects/crypto-enhanced
cp .env.example .env       # Configure API keys
docker-compose up -d       # Start in background
docker-compose logs -f     # Follow logs
docker-compose down        # Stop trading

# Live Trading (Direct)
python start_live_trading.py  # Starts live trading (requires manual YES confirmation)
echo YES | python start_live_trading.py  # Auto-confirm for automation

# Testing & Development
python run_tests.py        # Run test suite
python test_api_status.py  # Check Kraken API connectivity
python check_orders.py      # Check current orders

# Docker Management
docker-compose ps          # Check status
docker-compose restart     # Restart trading bot
docker-compose exec crypto-trader python check_orders.py  # Run commands inside container
```

## High-Level Architecture

### Web Application Stack
- **Frontend**: React 19 + TypeScript 5.9 + Vite 7
- **UI Components**: shadcn/ui (Radix UI primitives) + Tailwind CSS 4
- **State Management**: React Query 5 (TanStack Query)
- **Routing**: React Router v7
- **Forms**: React Hook Form 7 + Zod 4 validation
- **3D Graphics**: Three.js 0.180 + React Three Fiber 9
- **Monorepo**: Nx 21.6 with intelligent caching
- **Package Manager**: pnpm 9.15.0 (59.5% disk space savings via content-addressable storage with hard links)

### Trading System Architecture
```
crypto-enhanced/
├── kraken_client.py       # REST API client with rate limiting
├── websocket_manager.py   # WebSocket V2 real-time data
├── trading_engine.py      # Strategy execution (momentum, mean reversion)
├── database.py            # SQLite persistence layer
├── nonce_manager.py       # API nonce synchronization
└── start_live_trading.py  # Main entry point
```

**Key Components Interaction**:
- WebSocket manager subscribes to ticker/execution channels
- Trading engine processes market data through strategies
- Kraken client executes orders with proper nonce management
- Database logs all trades, orders, and performance metrics

## Critical Configuration

### Trading System Risk Parameters (Current Status: OPERATIONAL WITH MONITORING)
- **Max Position Size**: $10 per trade (safety-first configuration)
- **Max Total Exposure**: $10 (1 position maximum)
- **Trading Pair**: XLM/USD only
- **Account Balance**: ~$135 USD (verify with `python check_status.py`)
- **Strategies**: Mean Reversion, Range Trading, Scalping (all enabled)
- **Database**: SQLite (trading.db) for state persistence
- **System Status**: Post sell-logic fix (8 critical bugs resolved Oct 13)
- **Monitoring**: 30-day validation active (started Oct 13, 2025)

### 30-Day Monitoring & Capital Scaling Decision
The system now includes comprehensive performance monitoring to validate profitability before scaling capital:

**Key Files:**
- `performance_monitor.py` - FIFO P&L calculation, win rate, expectancy, profit factor
- `check_status.py` - Quick daily dashboard (balance, positions, 7-day metrics)
- `setup_monitoring.ps1` - Automated daily snapshots at 11:59 PM

**Readiness Criteria (All 4 required before adding capital):**
1. Minimum 50 complete trades (statistical significance)
2. Win rate ≥52% (above break-even with fees)
3. Positive expectancy >$0.01 per trade (edge exists)
4. Max drawdown <30% (acceptable risk)

**Validation Timeline:**
- Started: October 13, 2025
- Complete: November 12, 2025 (30 days)
- Decision: Review `python performance_monitor.py monthly` after validation period
- **NO CAPITAL SCALING until system shows "READY TO SCALE"**

**Daily Commands:**
```bash
python check_status.py              # Quick dashboard
python performance_monitor.py weekly   # Detailed 7-day report
python performance_monitor.py monthly  # 30-day validation report
```

### Build Configuration
- **Desktop Apps**: Use Tauri (NOT Electron) - smaller bundles, better performance
- **Python**: Use .venv virtual environments
- **Node**: Fresh node_modules installation required per project

## Active Development Patterns

### YOLO Mode Workflow
When using `/yolo-mode <task>`:
1. **Investigate** - Analyze with Grep/Glob/Read tools in parallel
2. **Search** - Deep exploration of relevant files
3. **Apply** - Make changes without confirmation prompts
4. **Test** - Run quality checks automatically
5. **Iterate** - Fix errors and repeat until perfect

## Phase 1.5 Memory System

The workspace includes an intelligent memory system that provides context-aware assistance across sessions.

### Core Features

**1. Task Persistence**
- Automatically tracks tasks across Claude Code sessions
- Stores up to 5 recent tasks with metadata (timestamp, complexity, category, project)
- Tasks marked as `in_progress` or `completed` based on completion signals
- Storage: `projects/active/web-apps/memory-bank/quick-access/recent-tasks.json`

**2. Project-Aware Context Tracking**
- Automatically detects current project from git modified files or working directory
- Filters task history to show only relevant tasks for current project
- Workspace tasks visible across all project contexts
- Supported project structures:
  - `projects/[project-name]/`
  - `projects/active/web-apps/[project-name]/`
  - `projects/active/desktop-apps/[project-name]/`
  - `active-projects/[project-name]/`

**3. Proactive Agent System**
- Specialist agents automatically available based on project context
- Each agent includes anti-duplication directives as PRIMARY DIRECTIVE
- Configuration: `.claude/agents.json`
- Agent definitions: `.claude/agents/*.md`

### Specialist Agents

**Crypto Trading Expert** (`@crypto-expert`)
- **Expertise**: Python, AsyncIO, Kraken API, WebSocket, Trading Algorithms
- **Primary Directive**: Anti-Duplication & Code Quality
- **Projects**: crypto-enhanced

**Web Application Expert** (`@webapp-expert`)
- **Expertise**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Primary Directive**: Anti-Duplication & Component Reusability
- **Projects**: digital-content-builder, business-booking-platform, shipping-pwa, vibe-tech-lovable

**Desktop Application Expert** (`@desktop-expert`)
- **Expertise**: React, TypeScript, Tauri, Electron
- **Primary Directive**: Anti-Duplication & Performance Optimization
- **Projects**: taskmaster, deepcode-editor, nova-agent-current, productivity-dashboard, desktop-commander-v2-final

**Mobile Application Expert** (`@mobile-expert`)
- **Expertise**: Capacitor, React Native, PWA, iOS, Android
- **Primary Directive**: Anti-Duplication & Native Performance
- **Projects**: Vibe-Tutor

**Backend API Expert** (`@backend-expert`)
- **Expertise**: Node.js, TypeScript, Python, REST API, Databases
- **Primary Directive**: Anti-Duplication & Security
- **Projects**: memory-bank

**DevOps & Infrastructure Expert** (`@devops-expert`)
- **Expertise**: Docker, GitHub Actions, CI/CD, Deployment, Monitoring
- **Primary Directive**: Anti-Duplication & Automation
- **Projects**: Available for workspace-level infrastructure tasks

### Session Start Display

When starting a Claude Code session, you'll see:
```
CONTEXT: [project-name] | Specialist Agent: @[agent-name] is available
         [Agent Display Name] - [Primary Directive]

RECENT WORK
----------------
  In Progress:
    [!] fix nonce synchronization error
        Category: debugging | Started: 2025-10-09 16:40:48
```

### Anti-Duplication Workflow

All specialist agents follow this workflow before implementing new code:
1. **Search** existing codebase for similar implementations
2. **Document** all duplicates found with file paths
3. **Propose** refactoring to consolidate logic
4. **Implement** reusable abstractions
5. **Delete** redundant code after migration

### Memory System Files

- **Configuration**: `.claude/agents.json` - Project-to-agent mappings
- **Agent Definitions**: `.claude/agents/*.md` - Specialist instructions
- **Task History**: `projects/active/web-apps/memory-bank/quick-access/recent-tasks.json`
- **Hooks**:
  - `.claude/hooks/session-start.ps1` - Display context on session start
  - `.claude/hooks/user-prompt-submit.ps1` - Track tasks on user input

## Custom Slash Commands

The monorepo includes custom automation commands in `.claude/commands/` for frequent tasks:

### Web Development Commands
- **`/web:restart-server`** - Restart digital-content-builder dev server with health checks
- **`/web:test-all`** - Run all PowerShell test suites with consolidated reporting
- **`/web:quality-check [fix]`** - Complete quality pipeline (lint + typecheck + build)
- **`/web:component-create <name> [type]`** - Generate new React component with TypeScript

### Crypto Trading Commands
- **`/crypto:status`** - Comprehensive trading system health check (database + logs + processes)
- **`/crypto:trading-status`** - Quick check of positions, orders, and system health
- **`/crypto:position-check`** - Analyze current positions with risk metrics

### Development Utilities
- **`/dev:port-check <port>`** - Check if port is in use and identify process
- **`/dev:parallel-dev [web|crypto|both]`** - Start dev servers in parallel
- **`/dev:cleanup [quick|deep|analyze]`** - Smart cleanup of temp files and caches

### Git & Quality Commands
- **`/git:smart-commit [message]`** - AI-powered conventional commit message generator (uses Opus model)
- **`/mcp:debug`** - Diagnose MCP server issues with config, logs, and process checks
- **`/list-commands`** - Show all available custom commands with descriptions

**Usage Tips:**
- Commands support arguments: `/dev:port-check 5173`
- Some commands auto-fix issues: `/web:quality-check fix`
- Interactive commands wait for approval: `/git:smart-commit`
- View command source: `.claude/commands/<category>/<name>.md`

### Database Operations
```bash
# Check trading database
sqlite3 trading.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"
sqlite3 trading.db "SELECT COUNT(*) FROM positions WHERE status='open';"

# Unified database (D:\databases\database.db)
Test-DatabaseConnections   # PowerShell command
```

### Cleanup & Maintenance
```bash
# Quick cleanup (weekly)
.\tools\cleanup-scripts\Quick-Cleanup-Execute.ps1 -DryRun 0

# Deep cleanup (monthly)
.\tools\cleanup-scripts\Execute-Deep-Cleanup.ps1 -RemoveNodeModules 1

# Log rotation for crypto-enhanced
tail -10000 trading_new.log > temp.log && mv temp.log trading_new.log
```

## WebSocket V2 Integration

The trading system uses Kraken's WebSocket V2 API for real-time data:
- Automatic reconnection on disconnect
- Token-based authentication for private channels
- Subscriptions: ticker (public), executions & balances (private)
- Heartbeat monitoring for connection health

## Testing Approach

### Web Application
- Playwright for E2E testing
- Vitest for unit tests with React Testing Library
- Run `npm run test:ui` for interactive debugging
- Run `npm run test:unit:coverage` for coverage reports
- Tests located in `tests/` and `src/**/*.test.tsx`
- Target: 80%+ coverage (enforced in vitest.config.ts)

### Trading System
- pytest with async support and pytest-cov for coverage
- Mock WebSocket responses for unit tests
- Run with `.venv\Scripts\python.exe run_tests.py`
- Run `npm run crypto:coverage` for coverage reports
- Test files in `tests/` subdirectory
- Target: 90%+ coverage for critical trading paths

### Coverage Commands
```bash
# Run all coverage reports
npm run test:coverage

# Python only
npm run crypto:coverage

# React only
npm run test:unit:coverage

# View HTML reports
npm run crypto:coverage:report    # Python
start coverage/index.html         # React

# Nx optimized (parallel execution with caching)
npm run test:coverage:all
```

### Test Priority Areas (See TEST_PRIORITY_ACTION_PLAN.md)
**Python Critical:**
1. kraken_client.py (API error handling, financial safety)
2. strategies.py (trading decision logic)
3. trading_engine.py (shutdown and error recovery)

**React Critical:**
1. src/pages/ (error boundaries, loading states)
2. src/components/ (form validation, conditional logic)
3. src/hooks/ (async operations, race conditions)

## Git Hooks & Pre-commit Quality Gates

The repository includes an enhanced pre-commit hook (`.git/hooks/pre-commit`) that runs automatically before each commit:

### Pre-commit Checks (10 total)
1. **File Size Validation** - Blocks files >5MB from being committed
2. **Security Scan** - Detects hardcoded secrets, API keys, tokens in code
3. **JavaScript/TypeScript** - ESLint with auto-fix, checks for console.log/debugger
4. **Python Linting** - Ruff check + format, warns about print statements
5. **PowerShell Analysis** - PSScriptAnalyzer for script quality
6. **Rust Formatting** - rustfmt for .rs files
7. **JSON/YAML Validation** - Syntax validation for config files
8. **Merge Conflict Detection** - Prevents committing conflict markers
9. **Import Validation** - Warns about deep relative imports (../../../)
10. **Trading System Safety** - Financial safety checks before code changes

### Trading System Safety Check (Critical)
The pre-commit hook includes safety validation for the crypto trading system:

**Blocks commits if:**
- More than 5 failed orders in last 24 hours
- More than 10 errors in last 100 log lines
- Missing critical files (config.py, nonce_state_primary.json)

**Warns if:**
- 1-5 failed orders detected (acceptable range)
- Open positions with P&L < -$5

**Why This Matters:**
Prevents committing code changes when the trading system is unhealthy, reducing risk of compounding issues during live trading.

**Performance:**
- Target: <5 seconds execution time
- Typical: 2-3 seconds for clean commits
- Uses parallel checks where possible

**Bypass (Emergency Only):**
```bash
git commit --no-verify -m "emergency fix"  # Skip all hooks
```

## Current State Tracking

Check these locations for system state:
- **Git Status**: Modified files indicate active work areas
- **Trading Logs**: `logs/trading.log` and `trading_new.log`
- **Session Status**: `projects/crypto-enhanced/SESSION_STATUS.md`
- **Database State**: `trading.db` for orders/positions

## CI/CD Pipeline Optimizations (2025-10-09)

### Nx Monorepo Integration
The monorepo uses **Nx 21.6.3** with @nx/js plugin for intelligent build caching and affected-only builds:
- **Local caching**: 80-90% faster repeated builds with Nx cache
- **Affected detection**: Only builds/tests changed projects (`npm run quality:affected`)
- **Parallel execution**: Tasks run concurrently when possible
- **Project graph**: Visualize dependencies with `nx graph`

**Performance Impact:**
- Typecheck: 854ms → 160ms (81% faster with cache)
- CI Pipeline: ~15-20min → ~3-5min (75% faster)
- Deployments: ~25min → ~5-8min (70% faster)

**Latest Updates (2025-10-10):**
- **Tailwind CSS:** Downgraded 4 → 3.4.18 (stable, production-ready)
  - Reason: V4 `@apply` directive incompatibilities with `@layer components`
  - Workspace fix: Removed v4 from nova-agent-current causing hoisting conflicts
  - See: `TAILWIND_V3_DOWNGRADE.md`, `TAILWIND_V3_DOWNGRADE_SUCCESS.md`, `TAILWIND_V3_COMPLETION_SUMMARY.md`
- React 19, React Router 7, Zod 4 - all stable
- All Radix UI components updated to latest
- All quality checks passing
- Added 6 custom slash commands for workflow automation
- Enhanced pre-commit hook with trading system safety checks

### Smart Change Detection
GitHub Actions workflows now use `dorny/paths-filter` to:
- Detect which projects changed (web, crypto, tools)
- Skip unnecessary jobs (saves ~80% CI time)
- Only deploy affected applications

### Docker Deployment
Crypto trading system is now containerized:
- Dockerfile with health checks
- docker-compose for local development
- Automated builds in CI/CD
- Resource limits for safety

## Recent System Updates (2025-09-30)

### Crypto Trading System - Major Fixes Completed
The trading system has been successfully restored to full functionality:

**Key Fixes Applied:**
1. **API Authentication**: Fixed with new Kraken API keys (~$98 USD balance)
2. **Nonce Synchronization**: Changed from microseconds to nanoseconds (`int(time.time() * 1000000000)`)
3. **Codebase Cleanup**: Organized 29 Python files into logical categories
4. **Error Handling**: Replaced complex enums with simple error classes in `errors_simple.py`
5. **WebSocket Methods**: Fixed `run()/disconnect()` to `start()/stop()`
6. **Trading Engine**: Fixed initialization parameter order and enabled strategies

**Current Status:**
- System is configured and ready for live trading
- Strategies enabled: Mean Reversion + Scalping
- WebSocket V2 integration for real-time data
- Database initialized (0 trades currently)
- Requires explicit YES confirmation to start trading

**Core File Structure (29 Python files):**
- **Core Trading**: `kraken_client.py`, `websocket_manager.py`, `trading_engine.py`, `database.py`, `strategies.py`
- **Configuration**: `config.py`, `nonce_manager.py`, `timestamp_utils.py`, `instance_lock.py`
- **Error Handling**: `errors_simple.py`, `circuit_breaker.py`
- **Entry Points**: `start_live_trading.py`, `check_orders.py`, `run_tests.py`, `api_server.py`
- **Validation**: `startup_validator.py`, `api_validator.py`, `verify_code_fixes.py`
- **Learning**: `learning_integration.py`, `analyze_trades.py`
- **Testing**: `test_api_simple.py`, `test_credentials.py`, `test_new_keys.py`
- **Utilities**: Multiple status check and diagnostic scripts

## MCP Server Configuration & Troubleshooting

### Active MCP Servers

The monorepo uses the following MCP servers (configured in `.mcp.json`):

**Core Servers:**
- **Nx MCP** - Workspace management, project graph, task execution
- **Filesystem MCP** - File operations across C:\dev and D:\
- **SQLite MCP** - Database queries for trading.db

**Browser Automation:**
- **Playwright MCP** - Modern browser automation (Microsoft official)
- **Puppeteer MCP** - Legacy browser automation

**Configuration:**
```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\Users\\fresh_zxae3v6\\AppData\\Roaming\\npm\\node_modules\\@playwright\\mcp\\index.js"]
    }
  }
}
```

**Installation:**
```bash
npm install -g @playwright/mcp        # Playwright (recommended)
npm install -g @modelcontextprotocol/server-puppeteer  # Puppeteer (legacy)
```

**Browser Automation Use Cases:**
- Visual verification of dev servers
- Deployment smoke tests
- Interactive debugging of failed E2E tests
- Screenshot capture for documentation

### Desktop Commander Enhanced Setup

The monorepo previously used Desktop Commander Enhanced for advanced file operations:

**Configuration Location:** `%APPDATA%\Claude\claude_desktop_config.json`

**Recommended Configuration (Windows):**
```json
{
  "mcpServers": {
    "desktop-commander-enhanced": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\dev\\DesktopCommanderMCP\\dist\\desktop-commander-with-path.js"]
    }
  }
}
```

**For npm package (alternative):**
```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": ["-y", "@wonderwhy-er/desktop-commander@latest"]
    }
  }
}
```

### Common MCP Issues

1. **Version Mismatch** - Server shows different version than package.json
   - Run `npm run sync-version` in MCP server directory
   - Rebuild with `npm run build`
   - Restart Claude Desktop completely

2. **Connection Failures** - MCP tools not appearing
   - Use full path to `npx.cmd` on Windows
   - Validate JSON syntax in config file
   - Check Node.js version compatibility

3. **Timeout Errors** - Operations fail after 60 seconds
   - Claude Desktop has hard 60s timeout (not configurable)
   - Use streaming/progressive results for large operations
   - Consider background processes for long-running tasks

4. **Restart Protocol**
   - Windows: Right-click system tray → Quit (NOT window close)
   - Wait 10 seconds for complete shutdown
   - Verify: `Get-Process | Where {$_.Name -like "*Claude*"}`
   - Relaunch Claude Desktop

**Full Troubleshooting Guide:** [docs/troubleshooting/MCP_SERVER_ISSUES.md](docs/troubleshooting/MCP_SERVER_ISSUES.md)

## Important Notes

- Live trading requires explicit YES confirmation for safety
- WebSocket connections may show initial disconnect warnings (normal)
- Use conservative position sizing in production
- Database backups occur automatically with 97% compression
- Python cache (`__pycache__`) should be cleaned periodically
- WebSocket V2 should handle all order operations
- System architecturally sound - ready for strategy activation
- No Emojis ever
- dont overcomplicate

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->
- Add to memory: this is a cursor, windsurf, lovable, vs code wrapped into one app