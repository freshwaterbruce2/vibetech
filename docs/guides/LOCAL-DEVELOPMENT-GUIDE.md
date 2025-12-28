# Local Development Guide - Vibe Tech Monorepo

**Last Updated:** December 28, 2025  
**Package Manager:** pnpm 9.15.0

---

## 🎯 Overview

This guide covers setting up and running the Vibe Tech monorepo entirely locally without any cloud dependencies. All services run on your local machine.

---

## 📦 Package Manager: pnpm

**IMPORTANT:** This project uses **pnpm**, not npm or yarn.

### Why pnpm?

- **Faster:** 2x faster than npm, more efficient disk usage
- **Strict:** Prevents phantom dependencies
- **Monorepo-friendly:** Better workspace support
- **Space-efficient:** Shared content-addressable store

### Installing pnpm

```bash
# Via npm (one-time setup)
npm install -g pnpm@9.15.0

# Via standalone script (recommended)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify installation
pnpm --version  # Should show 9.15.0
```

### Package Manager Enforcement

The repository enforces pnpm usage through:
- `package.json` - `"packageManager": "pnpm@9.15.0"`
- `.npmrc` - Configured for pnpm hoisting and workspace patterns
- `pnpm-workspace.yaml` - Defines all workspace packages

**DO NOT use `npm install` or `yarn install`** - Always use `pnpm install`

---

## 🚀 Quick Start (Local)

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/freshwaterbruce2/vibetech.git
cd vibetech

# Install all dependencies (uses pnpm)
pnpm install

# Install Python dependencies for crypto trading
pnpm run crypto:install
```

### 2. Environment Setup (Local Configuration)

```bash
# Root application
cp .env.example .env.development
# Edit .env.development - no cloud API keys needed for basic dev

# Backend API (local SQLite)
cd backend
cp .env.example .env
# Set DATABASE_PATH to local path: ./vibetech.db
# Set SESSION_SECRET to any random string for local dev
# Set ALLOWED_ORIGINS=http://localhost:5173

# Return to root
cd ..
```

### 3. Start Development Servers (All Local)

```bash
# Option 1: Start root web app only (port 5173)
pnpm run dev

# Option 2: Start multiple services in parallel
pnpm run parallel:dev           # Root + crypto + vibe-lovable
pnpm run parallel:full-stack   # Root + backend + memory-bank

# Option 3: Start individual services
# Terminal 1 - Root web app
pnpm run dev

# Terminal 2 - Backend API
cd backend && pnpm start

# Terminal 3 - Crypto trading (optional)
cd projects/crypto-enhanced && .venv/Scripts/activate && python start_live_trading.py
```

---

## 📁 Local Directory Structure

```
vibetech/
├── src/                     # Root React app (port 5173)
├── backend/                 # Express API (port 3001)
│   └── vibetech.db         # Local SQLite database
├── projects/
│   ├── crypto-enhanced/    # Python trading system
│   │   ├── .venv/          # Local Python virtual environment
│   │   └── trading.db      # Local trading database
│   └── active/
│       ├── web-apps/       # 8 web applications
│       └── desktop-apps/   # 5 Tauri desktop apps
├── docs/                   # All documentation
├── scripts/                # PowerShell automation
└── pnpm-workspace.yaml     # Workspace configuration
```

---

## 🔧 Common Development Tasks (Local)

### Daily Development Workflow

```bash
# Start your workday
pnpm run dev                    # Start development server

# Make changes, then check quality
pnpm run lint                   # Check code style
pnpm run typecheck              # Check TypeScript types
pnpm run test:unit              # Run unit tests (local)

# Before committing
pnpm run quality                # Full check: lint + typecheck + build
```

### Working with Workspaces

```bash
# Install dependency in specific workspace
pnpm --filter @vibetech/backend add express

# Run script in specific workspace
pnpm --filter @vibetech/backend start

# Install dependency in all workspaces
pnpm add -r lodash

# Update all dependencies
pnpm update -r
```

### Database Operations (Local SQLite)

```bash
# Backend database
sqlite3 backend/vibetech.db "SELECT * FROM customers LIMIT 5;"

# Trading database
sqlite3 projects/crypto-enhanced/trading.db "SELECT * FROM orders LIMIT 5;"

# Check database size
sqlite3 backend/vibetech.db ".dbinfo"
```

---

## 🐍 Python Development (Local)

### Setting Up Virtual Environment

```bash
cd projects/crypto-enhanced

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run tests
python run_tests.py
```

### Local Trading Development

```bash
# Check current status (no real trading)
python check_status.py

# Run in paper trading mode (no real money)
python start_paper_trading.py

# For live trading (requires Kraken API keys)
# WARNING: Uses real money!
python start_live_trading.py
```

---

## 🛠️ Build and Testing (Local)

### Building for Production (Local Testing)

```bash
# Development build
pnpm run build

# Production-optimized build
pnpm run build:production

# Preview production build locally
pnpm run preview  # Serves on http://localhost:4173
```

### Running Tests Locally

```bash
# Unit tests (Vitest)
pnpm run test:unit              # Run once
pnpm run test:unit:watch        # Watch mode
pnpm run test:unit:ui           # Interactive UI
pnpm run test:unit:coverage     # With coverage report

# E2E tests (Playwright)
pnpm run test                   # Headless mode
pnpm run test:ui                # Interactive mode
pnpm run test:debug             # Debug mode

# Python tests
cd projects/crypto-enhanced
.venv/Scripts/python run_tests.py

# All tests
pnpm run test:all
```

---

## 🔍 Troubleshooting Local Development

### pnpm Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall from scratch
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Verify pnpm workspace
pnpm list -r  # List all workspace packages
```

### Port Conflicts (Local)

```bash
# Check what's using a port
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :5173
lsof -i :3001

# Kill process by PID
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

### TypeScript Issues

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache tsconfig.tsbuildinfo

# Rebuild
pnpm run typecheck
```

### Database Issues (Local)

```bash
# Backup local database
cp backend/vibetech.db backend/vibetech.db.backup

# Reset database (if needed)
rm backend/vibetech.db
pnpm --filter @vibetech/backend run db:migrate
```

### Python Virtual Environment Issues

```bash
cd projects/crypto-enhanced

# Remove and recreate
rm -rf .venv
python -m venv .venv

# Reactivate and reinstall
.venv/Scripts/activate  # Windows
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

---

## 🎨 Code Style (Local Development)

### Pre-commit Checks (Automatic)

The repository uses Husky for pre-commit hooks:
- ESLint auto-fixing
- Prettier formatting
- TypeScript checking
- Import sorting

These run automatically on `git commit`.

### Manual Formatting

```bash
# Format all files
pnpm run lint:fix

# Format specific directory
pnpm exec eslint --fix src/

# Format with Prettier
pnpm exec prettier --write "src/**/*.{ts,tsx}"
```

---

## 📊 Monitoring Local Development

### Health Checks

```bash
# Overall workspace health
pnpm run monorepo:health

# Check individual project
pnpm --filter @vibetech/backend run health

# View dependency graph
pnpm run graph  # Opens Nx graph visualization
```

### Performance Monitoring

```bash
# Analyze bundle size
pnpm run analyze

# Check build performance
pnpm run build:production --profile

# Memory usage during dev
pnpm run dev --mode development
```

---

## 🚨 Local-Only Restrictions

### What Stays Local

1. **All databases** - SQLite files in local directories
2. **Environment variables** - `.env` files not committed
3. **API keys** - For local development, use test/sandbox keys
4. **Build artifacts** - `dist/`, `build/`, `.nx/` directories
5. **Dependencies** - `node_modules/`, `.venv/` directories
6. **Cache files** - `.turbo/`, `.nx/`, `tsconfig.tsbuildinfo`

### .gitignore Coverage

The repository is configured to exclude:
- `node_modules/`
- `.env`, `.env.local`, `.env.development`
- `dist/`, `build/`
- `.venv/`, `__pycache__/`
- `*.db` (databases)
- `.nx/`, `.turbo/` (cache)

---

## 📚 Additional Resources

### Essential Documentation

- `README.md` - Project overview
- `QUICK-REFERENCE.md` - Command cheatsheet
- `.github/copilot-instructions.md` - AI development guidelines
- `docs/guides/` - Detailed guides
- `docs/deployment/` - Deployment documentation

### Project-Specific Docs

Each workspace has its own documentation:
- `backend/README.md` - Backend API guide
- `projects/crypto-enhanced/README.md` - Trading system guide
- `projects/active/desktop-apps/*/README.md` - Desktop app guides

---

## ⚡ Performance Tips (Local Development)

### Speed Up Development

```bash
# Use parallel execution
pnpm run parallel:dev  # Starts multiple services

# Enable Nx caching
# Already configured in nx.json

# Use watch mode for faster rebuilds
pnpm run dev  # Vite hot-reload
pnpm run test:unit:watch  # Test watch mode
```

### Reduce Build Time

```bash
# Skip type checking during build (faster)
pnpm run build --skip-typecheck

# Use incremental builds
# Already configured in tsconfig.json

# Clear Nx cache if needed
pnpm run nx:reset
```

---

## 🎯 Current Status

**Package Manager:** pnpm 9.15.0 ✅  
**Local Development:** Fully configured ✅  
**Database:** Local SQLite ✅  
**API Keys:** Optional for basic dev ✅  
**Cloud Dependencies:** None required ✅

---

## 🤝 Getting Help

1. Check `docs/guides/` for specific topics
2. Review `.github/copilot-instructions.md` for AI guidance
3. Run `pnpm run monorepo:health` for system check
4. Check `QUICK-REFERENCE.md` for command shortcuts

---

## 📞 Emergency Commands (Local)

```bash
# Stop all servers
pnpm run parallel:stop

# Full cleanup
pnpm run workspace:clean

# Fresh install
pnpm install

# Full rebuild
pnpm run workspace:clean
pnpm install
pnpm run build:all

# Database reset (backup first!)
cp backend/vibetech.db backend/vibetech.db.backup
rm backend/vibetech.db
# Recreate with migrations
```

---

**Remember:** Everything runs locally. No cloud deployment required for development!
