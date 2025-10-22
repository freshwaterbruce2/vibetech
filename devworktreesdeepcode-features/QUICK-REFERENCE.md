# Monorepo Quick Reference

**Last Updated:** October 2, 2025
**Version:** 2.0 (Post-Critical Fixes)

---

## 🚀 Daily Commands

### Development
```bash
npm run dev                    # Start root web app (port 3000)
npm run parallel:dev           # Start root + crypto + vibe-lovable
npm run parallel:full-stack    # Start root + backend + memory-bank
```

### Quality Checks
```bash
npm run lint                   # Check for linting issues
npm run lint:fix               # Auto-fix linting issues
npm run typecheck              # TypeScript type checking
npm run quality                # Full pipeline: lint + typecheck + build
```

### Testing
```bash
npm run test                   # Run Playwright E2E tests
npm run test:ui                # Interactive test debugging
npm run crypto:test            # Run Python trading tests
```

### Building
```bash
npm run build                  # Development build
npm run build:production       # Production optimized build
npm run analyze                # Build + bundle analysis
```

### Workspace Management
```bash
npm run workspace:install      # Install all dependencies
npm run workspace:clean        # Clean all artifacts
npm run monorepo:health        # Full health check
```

---

## 📁 Directory Structure

```
c:\dev\
├── src/                    # Root React app source
├── backend/                # Node.js/Express API (port 3001)
├── projects/
│   ├── crypto-enhanced/    # Python trading (port 8000)
│   └── active/
│       ├── web-apps/       # 8 web applications
│       └── desktop-apps/   # 5 Tauri applications
├── docs/
│   ├── reports/            # Status reports
│   ├── guides/             # How-to guides
│   └── deployment/         # Deployment docs
├── scripts/                # PowerShell automation
└── workspace.json          # Monorepo configuration
```

---

## 🔧 PowerShell Scripts

### Workspace Manager
```powershell
# Status check
.\scripts\workspace-manager.ps1 status

# Install all projects
.\scripts\workspace-manager.ps1 install -All

# Start specific project
.\scripts\workspace-manager.ps1 dev -Project root

# Health check
.\scripts\workspace-manager.ps1 health
```

### Parallel Execution
```powershell
# Start project group
.\scripts\Start-ParallelMonorepo.ps1 -Group dev
.\scripts\Start-ParallelMonorepo.ps1 -Group full-stack
.\scripts\Start-ParallelMonorepo.ps1 -Group trading

# With monitoring
.\scripts\Start-ParallelMonorepo.ps1 -Group dev -Dashboard
```

---

## 🐍 Python (Crypto Trading)

```bash
cd projects/crypto-enhanced

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Run tests
python run_tests.py

# Check trading status
python check_orders.py

# Start live trading (CAUTION: REAL MONEY)
python start_live_trading.py  # Requires YES confirmation
```

---

## 📊 Database Operations

### SQLite Databases
- **Main:** `D:\databases\database.db`
- **Vibe Tech:** `D:\vibe-tech-data\vibetech.db`
- **Trading:** `projects\crypto-enhanced\trading.db`
- **Memory:** `projects\active\web-apps\memory-bank\long_term\memory.db`

### Quick Queries
```bash
# Trading database
sqlite3 projects\crypto-enhanced\trading.db "SELECT * FROM orders LIMIT 5;"

# Check database size
sqlite3 trading.db "SELECT page_count * page_size / 1024.0 / 1024.0 as 'Size (MB)' FROM pragma_page_count(), pragma_page_size();"
```

---

## 🔍 Common Tasks

### Fix Linting Issues
```bash
npm run lint:fix
```

### Update Dependencies
```bash
npm install <package>@latest
```

### Clear Everything and Reinstall
```bash
npm run workspace:clean
npm run workspace:install
```

### Check Port Usage
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

### Git Workflow
```bash
git status
git add .
git commit -m "type: description"
git push origin main
```

---

## 🎯 Import Aliases

All TypeScript/React code uses `@/` alias:

```typescript
// Instead of relative paths
import { Button } from '../../../../components/ui/button';

// Use alias
import { Button } from '@/components/ui/button';
```

---

## 🔐 Environment Variables

### Root App
```bash
# Copy example
cp .env.example .env

# Edit with your keys
# See: docs/guides/GET-API-KEYS-WALKTHROUGH.md
```

### Backend
```bash
cd backend
cp .env.example .env

# Required:
# - DATABASE_PATH
# - SESSION_SECRET
# - ALLOWED_ORIGINS
```

### Crypto Trading
```bash
cd projects/crypto-enhanced
cp .env.example .env

# Required:
# - KRAKEN_API_KEY
# - KRAKEN_API_SECRET
# See: docs/guides/TRADING-RISK-PARAMETERS.md
```

---

## 🚨 Troubleshooting

### Node.js Issues
```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Python Issues
```bash
cd projects/crypto-enhanced
rm -rf .venv
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :<PORT>

# Kill process
taskkill /PID <PID> /F
```

### TypeScript Errors
```bash
# Rebuild TypeScript
npm run typecheck

# Clear TypeScript cache
rm -rf node_modules/.cache
```

---

## 📚 Documentation Quick Links

### For Development
- `README.md` - Project overview
- `AGENTS.md` - AI agent instructions
- `docs/README.md` - Documentation guide

### For Deployment
- `docs/deployment/DEPLOY-READY-CONFIG.md`
- `docs/deployment/SECURITY-DEPLOYMENT-CHECKLIST.md`
- `backend/DEPLOYMENT.md`

### For Guides
- `docs/guides/API-KEYS-CHECKLIST.md`
- `docs/guides/BACKEND-API-GUIDE.md`
- `docs/guides/PRE-COMMIT-HOOKS-SETUP.md`

### For Reports
- `docs/reports/MONOREPO_REVIEW.md` - Health assessment
- `docs/reports/CRITICAL-FIXES-COMPLETE.md` - Recent fixes
- `docs/NEXT-STEPS-ROADMAP.md` - Future enhancements

---

## 🎨 Code Style

### TypeScript
- Use strict mode ✅
- No `any` types ✅
- Prefer `const` over `let`
- Use async/await over promises
- Proper error handling required

### React
- Functional components only
- Use hooks for state
- Use shadcn/ui for UI components
- Proper TypeScript types

### Python
- Follow PEP 8
- Use type hints
- async/await for I/O
- Comprehensive error handling

---

## ⚡ Performance Tips

### Development
```bash
# Use parallel execution for multiple projects
npm run parallel:dev

# Use watch mode for faster rebuilds
npm run dev
```

### Building
```bash
# Production build with optimizations
npm run build:production

# Analyze bundle size
npm run analyze
```

---

## 🎯 Current Project Status

**Overall Health:** 86.7/100 ✅
**Security:** Protected ✅
**Type Safety:** 0 `any` types ✅
**Documentation:** Organized ✅
**Testing:** Basic E2E (needs unit tests) ⚠️
**CI/CD:** None (planned) ⚠️

**Next Priority:** Install Vitest for unit testing

---

## 🤝 Getting Help

1. Check docs in `docs/` directory
2. Review `AGENTS.md` for patterns
3. Check recent changes in `docs/reports/`
4. Run workspace health check
5. Consult project-specific AGENTS.md

---

## 📞 Emergency Commands

```bash
# Stop all development servers
npm run parallel:stop

# Full cleanup and reinstall
npm run workspace:clean
npm run workspace:install
npm run monorepo:health

# Check current errors
npm run quality
```

---

*Keep this file handy for quick reference during development!*
