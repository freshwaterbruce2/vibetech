# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a multi-project monorepo with two primary focus areas:
1. **React/TypeScript Web Application** (root level) - A Vite-based web app using shadcn/ui components
2. **Python Trading System** (projects/crypto-enhanced) - Live cryptocurrency trading with Kraken API

## Key Commands

### Web Application (Root Directory)
```bash
# Development
npm run dev                # Start dev server (port 5173)
npm run build              # Production build
npm run preview            # Preview production build

# Quality Checks (run before commits)
npm run quality            # Full pipeline: lint + typecheck + test + build
npm run quality:fix        # Auto-fix lint issues + typecheck
npm run lint               # ESLint check only
npm run typecheck          # TypeScript compilation check

# Testing
npm run test               # Run Playwright tests
npm run test:ui            # Playwright UI mode
```

### Crypto Trading System (projects/crypto-enhanced)
```bash
# Setup
cd projects/crypto-enhanced
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Live Trading
python start_live_trading.py  # Starts live trading (requires manual YES confirmation)
echo YES | python start_live_trading.py  # Auto-confirm for automation

# Testing & Development
python run_tests.py        # Run test suite
python test_api_status.py  # Check Kraken API connectivity
python check_orders.py      # Check current orders
```

## High-Level Architecture

### Web Application Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **3D Graphics**: Three.js + React Three Fiber

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

### Trading System Risk Parameters (Current Status: ACTIVE)
- **Max Position Size**: $10 per trade (reduced for safety)
- **Max Total Exposure**: $10 (1 position only)
- **Trading Pair**: XLM/USD only
- **Account Balance**: $98.82 USD
- **Strategies**: Configured but needs activation (0 currently initialized)
- **Database**: SQLite (trading.db) for state persistence
- **System Status**: Connected and running, awaiting strategy configuration

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
- Run `npm run test:ui` for interactive debugging
- Tests located in `tests/` directory

### Trading System
- pytest with async support
- Mock WebSocket responses for unit tests
- Run with `.venv\Scripts\python.exe run_tests.py`
- Test files in `tests/` subdirectory

## Current State Tracking

Check these locations for system state:
- **Git Status**: Modified files indicate active work areas
- **Trading Logs**: `logs/trading.log` and `trading_new.log`
- **Session Status**: `projects/crypto-enhanced/SESSION_STATUS.md`
- **Database State**: `trading.db` for orders/positions

## Recent System Updates (2025-09-30)

### Crypto Trading System - Major Fixes Completed
The trading system has been successfully restored to full functionality:

**Key Fixes Applied:**
1. **API Authentication**: Fixed with new Kraken API keys ($98.82 USD balance)
2. **Nonce Synchronization**: Changed from microseconds to nanoseconds (`int(time.time() * 1000000000)`)
3. **Codebase Simplification**: Reduced from 28 files to 12 core files
4. **Error Handling**: Replaced complex enums with simple error classes in `errors_simple.py`
5. **WebSocket Methods**: Fixed `run()/disconnect()` to `start()/stop()`
6. **Trading Engine**: Fixed initialization parameter order

**Current Status:**
- System is running and connected
- All WebSocket channels active (public and private)
- Ready for strategy configuration
- No trades executing until strategies are enabled

**Core File Structure (12 files):**
- Core: `kraken_client.py`, `websocket_manager.py`, `trading_engine.py`, `database.py`
- Support: `config.py`, `errors_simple.py`, `timestamp_utils.py`, `nonce_manager.py`, `instance_lock.py`
- Entry: `start_live_trading.py`, `check_orders.py`, `run_tests.py`

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