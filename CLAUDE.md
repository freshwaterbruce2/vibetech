# CLAUDE.md

This file provides workspace-level guidance to Claude Code (claude.ai/code) when working in this development workspace.

## YOLO MODE - FULL AUTOMATION ENABLED (09/26/2025)

### TRUE AUTO-ACCEPT & AUTO-EXECUTE CONFIGURATION
**Settings Configured for Maximum Automation:**
- ✅ **Auto-Accept ALL Edits**: No confirmation prompts for file changes
- ✅ **Auto-Execute ALL Commands**: Instant command execution without approval
- ✅ **Parallel Operations**: Multiple tasks run simultaneously
- ✅ **Continuous Iteration**: Automatically fixes errors and re-tests until perfect
- ✅ **Smart Error Recovery**: Self-healing workflow that adapts to failures

**The Workflow (Fully Automated):**
1. **INVESTIGATE** → Analyze problem with all search tools
2. **SEARCH** → Deep codebase exploration in parallel
3. **APPLY** → Make changes without confirmations
4. **TEST** → Run quality checks automatically
5. **ITERATE** → Fix issues and repeat until perfect

**Enabled Permissions (No Prompts):**
- Edit, Write, MultiEdit - File operations
- Bash - All commands execute immediately
- Grep, Glob, Read - Search operations
- Task - Agent orchestration
- WebSearch, WebFetch - External resources
- TodoWrite - Automatic task tracking

## AUTOMATED MEMORY AND CONTEXT SYSTEM

### 🚨 CRITICAL: TRUE AUTOMATION MEANS NO USER COMMANDS! 🚨

**Claude Code MUST do these things AUTOMATICALLY at the start of EVERY conversation:**
1. ✅ Check memory for previous sessions (BEFORE responding to user)
2. ✅ Mention relevant context found (PROACTIVELY, don't wait to be asked)
3. ✅ Save context periodically (SILENTLY in background)
4. ✅ Archive old data to D:\ drive (AUTOMATICALLY after 30 days)

**The user should NEVER need to:**
- ❌ Run any memory commands
- ❌ Ask "what were we working on?"
- ❌ Request context to be saved
- ❌ Manage memory storage

**MANDATORY BEHAVIOR: Claude Code MUST automatically execute these actions WITHOUT being asked:**

### 1. AUTOMATIC SESSION START (Execute IMMEDIATELY when ANY conversation begins)

**Claude Code MUST silently run this in the background at conversation start:**
```powershell
# This runs AUTOMATICALLY - user should NOT need to request this
powershell -Command "cd 'C:\dev\projects\active\web-apps\memory-bank'; node memory_cli.js retrieve 'last-session' 'session_state' 2>&1"
```

**Then Claude Code MUST:**
1. Check if previous session exists
2. If found, PROACTIVELY mention: "I found our previous session where we were working on [X]. Would you like to continue?"
3. If not found, proceed normally but remember this is a new session
4. NEVER wait for user to ask about previous work - be proactive!

### 2. AUTOMATIC BEHAVIORS (These happen WITHOUT user asking)

**At session start, Claude Code AUTOMATICALLY:**
```
1. Retrieves last-session from memory (silently in background)
2. Checks git branch and recent commits
3. Reviews modified files
4. PROACTIVELY MENTIONS: "I see you're on branch [X] with recent work on [Y]"
```

**Example of CORRECT automatic behavior:**
User: "Hello"
Claude: "Hello! I checked our previous session and see we were working on the memory automation system. You're currently on branch 'tdd-fixes/integration-clean-sanitized' with uncommitted changes to CLAUDE.md. Would you like to continue with that work?"

**Example of WRONG behavior:**
User: "Hello"
Claude: "Hello! How can I help you today?" [❌ Failed to check memory automatically]

### 3. AUTOMATIC CONTEXT SAVING (Claude Code does this WITHOUT being asked)

**Claude Code AUTOMATICALLY saves context when:**
- User completes a significant task
- User provides important project information
- User switches projects or contexts
- Conversation includes key decisions or architectural changes
- Session appears to be ending (user says goodbye, thanks, etc.)

**This happens SILENTLY in the background - no user action required!**

**Behind the scenes, Claude Code runs:**
```powershell
# This is automatic - user never sees this
powershell -Command "
$sessionData = @{
    timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    branch = git branch --show-current
    last_task = 'What user was working on'
    key_files = 'Files that were modified'
    important_context = 'Key information from conversation'
}
cd 'C:\dev\projects\active\web-apps\memory-bank'
node memory_cli.js store 'last-session' ($sessionData | ConvertTo-Json) '{\"type\":\"session_state\"}'
"
```

### 4. AUTOMATIC PROJECT CONTEXT (Saved without user asking)

**Claude Code AUTOMATICALLY detects and saves:**
- When user switches between projects
- Important architectural decisions
- Key file modifications
- Dependencies added/removed
- Feature implementations

**This is AUTOMATIC - happens in background without user knowing!**

### 5. AUTOMATIC MEMORY SEARCH (When user says generic things)

**When user says things like:**
- "Continue where we left off"
- "What were we doing?"
- "Resume our work"
- "Hello" or "Hi"

**Claude Code AUTOMATICALLY:**
1. Checks memory for relevant sessions
2. Reviews git history
3. Summarizes and presents the context
4. NO COMMANDS NEEDED - this is automatic!

### 6. AUTOMATIC MAINTENANCE (Happens silently)

**Claude Code AUTOMATICALLY (without being asked):**
- Archives sessions older than 30 days to D:\ drive
- Cleans up redundant memory entries
- Optimizes storage between C:\ and D:\ drives
- Routes large data (>10MB) to D:\ drive
- Keeps recent/active data on C:\ for fast access

### 7. INTEGRATION RULES (NON-NEGOTIABLE)
- **ALWAYS** check memory at session start automatically (no exceptions)
- **ALWAYS** save context without being asked
- **ALWAYS** mention previous context proactively
- **NEVER** wait for user to request memory operations
- **NEVER** require user to run commands for basic memory functions

### 8. SLASH COMMANDS

**YOLO MODE - Full Automation (NEW)**:
- `/yolo-mode <task>` - **MAXIMUM AUTOMATION**: Investigate → Search → Apply → Test → Iterate until perfect
  - Auto-accepts ALL edits without confirmation
  - Auto-executes ALL commands without prompting
  - Runs multiple operations in parallel
  - Automatically fixes errors and re-tests
  - Continues until solution is perfect
  - Example: `/yolo-mode fix all TypeScript errors`

**Optional Commands (For power users only - NOT required!)**:
- `/memory-status` - Check memory system health (optional)
- `/memory-clear` - Clear old sessions (optional)
- `/memory-export` - Export memory to file (optional)

**Remember: The system works AUTOMATICALLY without these commands!**

### 8. MEMORY STORAGE ARCHITECTURE
**Intelligent Data Routing (Automatic)**:
- **C:\dev\projects\memory-bank** - Fast access for active sessions (<10MB)
  - Current session states
  - Active project contexts
  - Quick access data
- **D:\dev-memory\claude-code** - Bulk storage for large/old data (>10MB)
  - Large datasets and analysis results
  - Archived sessions (30+ days old)
  - Database files and backups
  - Historical context

**The system AUTOMATICALLY routes data based on size and age - no manual intervention needed!**

## Workspace Overview

This is the root workspace directory containing a comprehensive multi-project development environment. The main development work happens in the `projects/` subdirectory.

## Workspace Structure

```
C:\dev\                         # Root workspace
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # Agent definitions
│   ├── commands/               # Slash commands
│   └── hooks/                  # Git hooks integration
├── projects/                   # Main development workspace
│   ├── active/                 # Active development projects
│   │   ├── agents/            # Claude Code agent system
│   │   ├── desktop-apps/      # Desktop applications
│   │   └── web-apps/          # Web applications
│   ├── crypto-enhanced/        # Trading system
│   ├── kraken-xlm-trader/      # XLM trading bot
│   ├── cli/chatbox/           # CLI tools
│   └── docs/guides/           # Project documentation (22 MD files)
├── tools/                      # Organized utilities
│   ├── automation/            # Automation scripts
│   ├── cleanup-scripts/       # Maintenance scripts
│   └── claude/                # Claude-specific tools
├── docs/                       # Workspace documentation
│   ├── cleanup/               # Cleanup documentation
│   └── setup/                 # Setup guides
├── config/                     # Configuration files
├── src/                        # Source code
├── tests/                      # Test suite
└── node_modules/               # Dependencies (fresh install)
```

**Key Directories**:
- **projects/active/agents/** - Claude Code agent system with learning integration
- **D:\learning-system/** - Autonomous agent learning database and monitoring
- **D:\databases/** - Unified SQLite database for all projects

## Primary Technology Stack

The workspace supports multiple technology stacks:
- **React + TypeScript** (primary frontend framework)
- **Vite** for modern build tooling
- **shadcn/ui + Tailwind CSS** for UI components
- **Supabase/PostgreSQL** for backend services
- **Python** for trading/financial tools
- **Tauri** for desktop applications (IMPORTANT: Do NOT use Electron - use Tauri instead)

## Development Commands

```powershell
# Development
npm run dev                    # Start dev server on :8080
npm run build                  # Production build
npm run preview                # Preview production build

# Quality Assurance (run before commits)
npm run quality                # Full pipeline: lint + typecheck + test + build
npm run quality:fix            # Auto-fix linting issues + typecheck
npm run lint                   # ESLint check
npm run lint:fix               # Auto-fix ESLint issues
npm run typecheck              # TypeScript compilation check
npm run test                   # Run test suite
npm run test:run               # Single test run
npm run test:ui                # Test UI dashboard

# Workspace Management
cd projects\                                       # Navigate to main development workspace
.\tools\scripts\dev-utils.ps1 -Action start        # Start development with full setup
.\tools\scripts\dev-utils.ps1 -Action status       # Check project health
.\tools\scripts\git-workflow.ps1 -Action deploy    # Prepare for deployment
.\tools\scripts\workspace-organize.ps1 -Action status  # Workspace organization status
```

## Navigation Guide

**For detailed development guidance, navigate to:**
```powershell
cd C:\dev\projects
# See projects/CLAUDE.md for comprehensive development instructions
```

## Workspace-Level Responsibilities

- Global dependency management
- Workspace-wide configurations (TypeScript, ESLint)
- Cross-project tools and utilities
- Environment setup and maintenance

## Quick Reference

**Main Development Commands** (run from projects/ directory):
```powershell
npm run dev                    # Start development servers
npm run quality                # Full quality pipeline
npm run build                  # Production builds
```

**For comprehensive project-specific guidance:**
- See `C:\dev\projects\CLAUDE.md` for detailed development instructions
- See `C:\dev\WORKSPACE-STRUCTURE.md` for organization details

## Workspace Maintenance

This workspace follows a clean separation pattern:
- **Workspace level** (C:\dev\): Global configs and organization
- **Projects level** (C:\dev\projects\): Active development work

Most development activities should be performed from the projects/ directory where all the detailed tooling and project-specific configurations are located.

## Database System

**Unified SQLite Database**: `D:\databases\database.db`
- Centralized data storage for all projects
- Automated backup system with 97% compression
- Performance monitoring with health scoring
- Cross-project data sharing capabilities

**Database Commands**:
```powershell
Test-DatabaseConnections     # Test all project connections
Backup-Database             # Create manual backup
Show-DatabaseStats          # Display database statistics
```

**Projects Connected**:
- crypto-enhanced: Trade tracking, performance metrics, state persistence
- prompt-engineer: Context management, project storage
- Grokbot: Trading data and analysis
- agents-system: Claude Code agent learning and optimization

## Claude Code Keybindings

**Updated Keybindings:**
- **Ctrl+O**: Toggle transcript mode (shows model versions used for each response)
- **Ctrl+R**: Deprecated - use Ctrl+O for transcript toggle

**TDD Workflow Tips:**
- Use transcript mode (Ctrl+O) to track which model versions work best for:
  - Kraken API implementations
  - WebSocket V2 handling
  - Test generation patterns
- Database integration ensures persistent test data and performance tracking

## VS Code Automation Setup (2025)

**Automated Testing & Error Detection**:
- AI-powered test generation with Keploy and GitHub Copilot
- Real-time error detection with Error Lens
- Auto-fix on save for TypeScript (ESLint) and Python (Ruff)
- Pre-commit hooks preventing bad code commits

**Extensions Installed**:
- GitHub Copilot & Chat - AI code assistance
- ESLint - TypeScript/JavaScript linting with auto-fix
- Prettier - Code formatting on save
- Ruff - Fast Python linting and formatting (replaces Black/Flake8)
- Error Lens - Inline error display
- Quokka.js - Real-time code evaluation
- TDD with GPT - Test-driven development with AI

**Configuration Files**:
- `.vscode/extensions.json` - Recommended extensions
- `.vscode/settings.json` - Automated formatting and error fixing
- `.eslintrc.js` - TypeScript linting rules
- `.prettierrc` - Code formatting configuration
- `.pre-commit-config.yaml` - Git hooks for quality control
- `pyproject.toml` - Python Ruff configuration
- `SETUP-VSCODE-AUTOMATION.md` - Complete setup guide

**Benefits**:
- 70% reduction in manual test writing time
- Real-time error detection as you type
- Automatic code formatting on save
- Prevention of bad commits
- AI assistance for test generation and fixing
- Consistent code quality across teams

## Claude Code Agent System (September 2025)

**Intelligent Agent Learning System**: Comprehensive optimization and monitoring of Claude Code agents
- **Enhanced Performance Tracking**: CPU, memory, latency, throughput metrics automatically collected
- **Advanced Mistake Analysis**: Automatic categorization with root cause detection
- **Token Optimization**: Smart caching, sampling, and batch operations (40% token reduction)
- **Real-time Monitoring**: Live dashboard with health indicators and performance analytics
- **Proactive Interventions**: Automatic detection and resolution of performance issues

**Agent System Commands**:
```powershell
# Monitor agents in real-time
.\projects\scripts\Show-AgentDashboard.ps1 -Detailed -Continuous

# Run optimization tests
python projects\active\agents\test_optimizations.py

# View comprehensive dashboard
python projects\active\agents\monitoring\dashboard.py

# Verify learning integration
python projects\active\agents\verify_learning_integration.py
```

**Optimization Results**:
- **Agent Utilization**: Increased from 26% to 85% (227% improvement)
- **Success Rate**: Improved from 75% to 81.2%
- **Performance Metrics**: 7 types now being collected automatically
- **Enhanced Mistakes**: Automatic categorization and root cause analysis
- **Token Efficiency**: Smart caching reduces API usage by up to 40%

**Agent Types Optimized**:
- crypto-enhanced-trading: Live trading system monitoring with performance analytics
- enhanced_market_001: Real-time market analysis with intelligent caching
- advanced_trading_001: Automated error detection and system fixes
- test-maestro: Comprehensive testing with optimization tracking
- learning-orchestrator: System-wide learning coordination with batch operations

## Desktop Application Framework Preference

**IMPORTANT**: Always use **Tauri** for desktop applications, NOT Electron.
- Tauri provides much smaller bundle sizes (600KB vs 150MB)
- Better performance and native OS integration
- Rust-based backend with web frontend
- Electron has persistent compilation and compatibility issues
- This is a permanent preference - do not suggest or use Electron

When building desktop apps:
1. Use Tauri for the desktop wrapper
2. Build the frontend with React/Vue/Vanilla JS
3. Use the web-first approach with PWA capabilities as fallback
4. Never install or configure Electron dependencies

## Workspace Cleanup & Optimization (September 2025)

**Deep Monorepo Cleanup Completed**: Comprehensive workspace optimization with 1.5GB+ space recovered
- **Total Items Cleaned**:
  - 598 nested node_modules directories removed
  - 48 Python __pycache__ directories deleted
  - 27+ log/tmp/backup files cleaned
  - 22 Python bytecode files (.pyc, .pyo) removed
  - 9 orphaned directories with invalid Windows paths
  - All build artifacts (dist/, build/, .turbo/, .next/)
- **Performance Impact**: 90% reduction in file system clutter
- **Projects Reorganized**: Complete restructuring of monorepo
- **Maintenance Scripts**: Organized into dedicated tools directories

**Cleanup Scripts Available**:
```powershell
# Daily/Weekly maintenance
.\tools\cleanup-scripts\Quick-Cleanup-Execute.ps1 -DryRun 0

# Monthly deep cleaning
.\tools\cleanup-scripts\Execute-Deep-Cleanup.ps1 -RemoveNodeModules 1 -RemoveVenvs 1 -DryRun 0

# Environment verification
.\tools\automation\Verify-IntegratedWorkflow.ps1

# Quick environment start
.\tools\automation\Start-IntegratedEnvironment.ps1 -Dashboard

# Deep analysis tool
.\tools\cleanup-scripts\Deep-Scan-Cleanup.ps1
```

**Optimized Project Structure**:
- **Active Projects**: kraken-xlm-trader, crypto-enhanced, agents, cli/chatbox
- **Removed Directories**: .archived/, .archived-docs/, .cursor-mcp-setup/, memory-bank/
- **Reorganized Tools**: tools/automation/, tools/cleanup-scripts/, tools/claude/
- **Documentation**: docs/cleanup/, docs/setup/, docs/guides/ (22 MD files organized)

**Space Management Results**:
- Phase 1: Removed orphaned directories and unused files
- Phase 2: 598 node_modules directories (estimated 800MB+)
- Phase 3: Python venvs, build artifacts, caches (500MB+)
- **Total Recovery**: 1.5GB+ with all active projects preserved

**Maintenance Recommendations**:
- Weekly: Run quick cleanup script
- Monthly: Deep clean with node_modules removal
- Before major work: Verify environment integrity
- Git repos: Optimized with aggressive garbage collection
- No emojis ever, No unicode characters
- do not reduce position size.
- understand deployed capita