# Common Workflows

Day-to-day development tasks and procedures for the C:\dev monorepo.

---

## 🌅 Daily Startup

### 1. Check System Health
```powershell
# Navigate to monorepo root
cd C:\dev

# Pull latest changes
git pull origin main

# Check for dependency updates
pnpm outdated

# Verify Node.js version (20.19+ or 22.12+)
node --version

# Check Python version (3.12+)
python --version
```

### 2. Start Development Environment
```powershell
# Option A: Start everything
pnpm run parallel:dev

# Option B: Start specific groups
pnpm run parallel:web-apps     # Just web apps
pnpm run parallel:trading      # Trading bot + dependencies
pnpm run parallel:full-stack   # Full stack (web + backend + DB)

# Option C: Start individually
pnpm run dev                   # Root web app only (port 5173)
```

### 3. Check Trading Bot Status (if applicable)
```powershell
cd projects\crypto-enhanced
.venv\Scripts\activate

# Quick status check
python simple_status.py

# View recent trades
sqlite3 trading.db "SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10;"

# Check logs for errors
Get-Content trading_new.log -Tail 50 | Select-String "ERROR|CRITICAL"
```

---

## 🔧 Making Changes

### Web App Changes (Root Level)

#### 1. Create Feature Branch
```powershell
# From main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

#### 2. Make Changes
```powershell
# Edit files in src/
# Use @/ imports: import { Button } from '@/components/ui/button'
```

#### 3. Run Quality Checks
```powershell
# Run all checks at once
pnpm run quality

# Or individually
pnpm run lint              # ESLint
pnpm run typecheck         # TypeScript
pnpm run test:unit         # Vitest
pnpm run build             # Production build
```

#### 4. Fix Issues
```powershell
# Auto-fix linting
pnpm run lint:fix

# If TypeScript errors, review and fix manually
# Common fixes:
# - Add type annotations
# - Handle null/undefined with optional chaining
# - Use type guards for narrowing
```

#### 5. Commit Changes
```powershell
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user profile page with avatar upload"

# Push to remote
git push origin feature/your-feature-name
```

### Trading Bot Changes ⚠️

#### 1. Pre-Change Checklist
```powershell
cd C:\dev\projects\crypto-enhanced
.venv\Scripts\activate

# 1. Check bot status
python simple_status.py

# 2. Review recent activity
Get-Content trading_new.log -Tail 100

# 3. Backup database
copy trading.db trading.db.backup

# 4. Read TRADING_BOT_GUIDE.md
# Make sure you understand safety protocols
```

#### 2. Make Changes
```python
# Follow async patterns
# Add type hints
# Comprehensive error handling
# Extensive logging
```

#### 3. Write/Update Tests
```python
# MUST mock all Kraken API calls
# Test error scenarios
# Verify risk parameters

# Example:
@pytest.mark.asyncio
async def test_new_feature():
    with patch('kraken_client.KrakenClient.add_order') as mock:
        mock.return_value = {"txid": ["TEST123"]}
        # Test logic here
        pass
```

#### 4. Run Tests
```powershell
# Run all tests
python run_tests.py

# Or with pytest
pytest -v --asyncio-mode=auto

# Check coverage
pytest --cov=. --cov-report=html
start htmlcov\index.html  # View coverage report
```

#### 5. Test Manually (if safe)
```powershell
# If changes are read-only or safe:
python start_live_trading.py

# Watch logs in another terminal
Get-Content trading_new.log -Tail 50 -Wait

# Stop after verification
.\stop_trading.ps1
```

### Backend Changes

#### 1. Navigate and Setup
```powershell
cd C:\dev\backend

# Install dependencies if needed
ppnpm install
```

#### 2. Make Changes
```typescript
// Follow Express patterns
// Use TypeScript types
// Add input validation
// Error handling middleware
```

#### 3. Test
```powershell
# Run backend tests
ppnpm run test

# Or start dev server and test manually
ppnpm run dev  # Port 3000

# Test endpoints with curl/Postman
```

#### 4. Quality Checks
```powershell
# If nx targets configured
nx run backend:quality

# Or manually
ppnpm run lint
ppnpm run typecheck
ppnpm run build
```

---

## 🧪 Testing Workflows

### Unit Testing (Web App)
```powershell
# Run tests in watch mode (during development)
pnpm run test:unit:watch

# Run all tests once
pnpm run test:unit

# Run with UI
pnpm run test:unit:ui

# Generate coverage report
pnpm run test:unit:coverage
```

### E2E Testing (Web App)
```powershell
# Run all Playwright tests
pnpm run test

# Run in UI mode (interactive)
pnpm run test:ui

# Run specific test file
npx playwright test tests/login.spec.ts

# Run in headed mode (see browser)
pnpm run test:debug

# View last test report
pnpm run test:report
```

### Testing Trading Bot
```powershell
cd projects\crypto-enhanced
.venv\Scripts\activate

# Run all tests
python run_tests.py

# Run specific test file
pytest tests/test_trading_engine.py -v

# Run with verbose output
pytest -v --asyncio-mode=auto

# Run with coverage
pytest --cov=. --cov-report=term-missing

# Run only tests matching pattern
pytest -k "test_order" -v
```

---

## 📦 Dependency Management

### Web App (pnpm + Nx)

#### Adding Dependencies
```powershell
# Add to root workspace
pnpm add package-name

# Add dev dependency
pnpm add -D package-name

# Add to specific workspace
pnpm --filter backend add express
```

#### Updating Dependencies
```powershell
# Check for updates
pnpm outdated

# Update specific package
pnpm update package-name

# Update all to latest (careful!)
pnpm update --latest

# After updates, test everything
pnpm run quality
pnpm run test
```

#### Removing Dependencies
```powershell
# Remove from root
pnpm remove package-name

# Remove from workspace
pnpm --filter backend remove package-name
```

### Trading Bot (Python + pip)

#### Adding Dependencies
```powershell
cd projects\crypto-enhanced
.venv\Scripts\activate

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt

# Or manually add to requirements.txt:
# package-name==1.2.3
```

#### Updating Dependencies
```powershell
# Check for updates
pip list --outdated

# Update specific package
pip install --upgrade package-name
pip freeze > requirements.txt

# Update all (careful with trading bot!)
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt

# TEST THOROUGHLY after updates
python run_tests.py
```

---

## 🔍 Debugging

### Web App Debugging

#### Browser DevTools
```typescript
// Add breakpoints in browser DevTools
// Or use debugger statement
function handleClick() {
  debugger;  // Execution pauses here
  // Your code
}
```

#### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

#### Console Logging
```typescript
// Temporary debug logs (remove before commit)
console.log('Debug:', { variable, value });

// Better: Use logger
import { logger } from '@/lib/logger';
logger.debug('Processing user data', { userId });
```

### Trading Bot Debugging

#### Logging Levels
```python
# In code
import logging
logger = logging.getLogger(__name__)

logger.debug("Detailed info for debugging")  # Most verbose
logger.info("General information")
logger.warning("Warning messages")
logger.error("Error occurred")
logger.critical("Critical failure!")  # Least verbose

# Set level in config
logging.basicConfig(level=logging.DEBUG)
```

#### Interactive Debugging
```powershell
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use ipdb (better interface)
pip install ipdb
import ipdb; ipdb.set_trace()

# Run script
python start_live_trading.py
# Execution pauses at breakpoint
```

#### Log Analysis
```powershell
# View all errors
Get-Content trading_new.log | Select-String "ERROR"

# View last 100 lines with errors
Get-Content trading_new.log -Tail 100 | Select-String "ERROR|WARNING"

# Follow logs in real-time
Get-Content trading_new.log -Tail 0 -Wait

# Search for specific pattern
Get-Content trading_new.log | Select-String "order_id.*ABC123"
```

---

## 🗄️ Database Operations

### Trading Bot Database (SQLite)

#### Interactive Queries
```powershell
cd projects\crypto-enhanced

# Open database
sqlite3 trading.db

# Common queries:
SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10;
SELECT COUNT(*) FROM trades WHERE status='FILLED';
SELECT SUM(profit_loss) FROM trades WHERE timestamp > datetime('now', '-1 day');
SELECT * FROM orders WHERE status='PENDING';

# Exit
.quit
```

#### Backup Database
```powershell
# Manual backup
copy trading.db "trading.db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Automated in script
sqlite3 trading.db ".backup backup/trading_$(date +%Y%m%d).db"
```

#### Database Health Check
```python
# Check for corruption
import aiosqlite

async def check_db():
    async with aiosqlite.connect('trading.db') as db:
        result = await db.execute("PRAGMA integrity_check;")
        print(await result.fetchone())
        # Should return ('ok',)
```

### Backend Database

#### PostgreSQL (if applicable)
```powershell
# Connect with psql
psql -h localhost -U username -d database_name

# Common commands:
\dt            # List tables
\d+ table_name # Describe table
\q             # Quit
```

#### SQLite (if backend uses SQLite)
```powershell
cd backend
sqlite3 database.db

# Similar to trading bot queries
```

---

## 🚀 Deployment

### Web App Deployment

#### Netlify
```powershell
# Build locally first
pnpm run build:production

# Preview build
pnpm run preview

# Deploy (if Netlify CLI installed)
netlify deploy --prod

# Or push to main branch (auto-deploy if configured)
git push origin main
```

#### Vercel
```powershell
# Build locally
pnpm run build:production

# Deploy with Vercel CLI
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

### Trading Bot "Deployment"

**Note**: Bot runs locally, not on cloud servers (currently).

#### Pre-Deployment Checklist
- [ ] All tests pass
- [ ] Database backed up
- [ ] Risk parameters verified
- [ ] .env file correct
- [ ] No debug code left in
- [ ] Logs reviewed
- [ ] Circuit breaker working
- [ ] Emergency stop tested

#### Starting for Production
```powershell
cd C:\dev\projects\crypto-enhanced
.venv\Scripts\activate

# Verify everything
python run_tests.py
python simple_status.py

# Start bot (will ask for confirmation)
python start_live_trading.py

# Monitor in separate terminal
Get-Content trading_new.log -Tail 50 -Wait
```

#### Setting Up as Windows Service (Optional)
```powershell
# Using NSSM (Non-Sucking Service Manager)
# Download from: https://nssm.cc/

# Install as service
nssm install TradingBot "C:\dev\projects\crypto-enhanced\.venv\Scripts\python.exe" "C:\dev\projects\crypto-enhanced\start_live_trading.py"

# Configure
nssm set TradingBot AppDirectory "C:\dev\projects\crypto-enhanced"
nssm set TradingBot AppStdout "C:\dev\projects\crypto-enhanced\logs\service.log"
nssm set TradingBot AppStderr "C:\dev\projects\crypto-enhanced\logs\service_error.log"

# Start service
nssm start TradingBot
```

### Backend Deployment

#### Railway / Heroku
```powershell
cd backend

# Build
ppnpm run build

# Deploy (if CLI configured)
railway up  # or
git push heroku main
```

---

## 🔧 Troubleshooting Common Issues

### "Module not found" Errors (Web App)
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
ppnpm install

# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite

# Restart dev server
pnpm run dev
```

### TypeScript Errors
```powershell
# Restart TypeScript server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# Check tsconfig.json is correct
# Verify @/* paths are working
```

### Port Already in Use
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process by PID
taskkill /PID <PID> /F

# Or use different port
pnpm run dev -- --port 3000
```

### Trading Bot Won't Start
```powershell
cd projects\crypto-enhanced
.venv\Scripts\activate

# Check for lock file
if (Test-Path .trading_lock) {
    Remove-Item .trading_lock
}

# Verify .env file exists
if (!(Test-Path .env)) {
    Write-Host ".env file missing!"
    copy .env.example .env
    # Edit .env with actual API keys
}

# Check Python environment
python --version  # Should be 3.12+
pip list  # Verify all dependencies installed

# Reinstall dependencies if needed
pip install -r requirements.txt
```

### Database Locked Errors
```powershell
# Ensure WAL mode is enabled
sqlite3 trading.db "PRAGMA journal_mode=WAL;"

# Check for stale lock files
Remove-Item trading.db-shm, trading.db-wal -ErrorAction SilentlyContinue

# Verify no other processes have database open
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

#### Web App
```powershell
# Check for security vulnerabilities
npm audit

# Fix auto-fixable issues
npm audit fix

# Check bundle size hasn't grown unexpectedly
pnpm run analyze
```

#### Trading Bot
```powershell
cd projects\crypto-enhanced
.venv\Scripts\activate

# Check status
python simple_status.py

# Review yesterday's trades
sqlite3 trading.db "SELECT * FROM trades WHERE date(timestamp) = date('now', '-1 day');"

# Check for errors
Get-Content trading_new.log | Select-String "ERROR" | Select-Object -Last 20

# Verify risk parameters still correct
python -c "from config import TradingConfig; c = TradingConfig(); print(f'Max trade: ${c.MAX_TRADE_SIZE}')"
```

### Weekly Checks

```powershell
# Update dependencies (test thoroughly)
pnpm update

# Review git history
git log --oneline --since='1 week ago'

# Check disk space
Get-PSDrive C | Select-Object Used,Free

# Backup trading database
copy projects\crypto-enhanced\trading.db "backups\trading_weekly_$(Get-Date -Format 'yyyyMMdd').db"
```

### Monthly Checks

```powershell
# Review all dependencies for updates
pnpm outdated
pip list --outdated

# Audit security
npm audit
pip-audit  # pip install pip-audit

# Review and archive old logs
Compress-Archive -Path projects\crypto-enhanced\logs\* -DestinationPath "logs_archive_$(Get-Date -Format 'yyyyMM').zip"

# Database maintenance
sqlite3 projects\crypto-enhanced\trading.db "VACUUM;"
```

---

## 🎯 Quick Reference Commands

### Most Used Commands
```powershell
# Start dev server
pnpm run dev

# Quality check
pnpm run quality

# Run tests
pnpm run test:unit

# Trading bot status
cd projects\crypto-enhanced && .venv\Scripts\activate && python simple_status.py

# View bot logs
Get-Content projects\crypto-enhanced\trading_new.log -Tail 50 -Wait

# Git status
git status

# Create branch
git checkout -b feature/name

# Commit
git add . && git commit -m "message"
```

### Emergency Commands
```powershell
# Stop trading bot
cd projects\crypto-enhanced && .\stop_trading.ps1

# Kill all Python processes (nuclear option)
taskkill /F /IM python.exe

# Restore database backup
cd projects\crypto-enhanced
copy trading.db.backup trading.db

# Rollback git changes
git reset --hard HEAD
git clean -fd
```

---

## 💡 Pro Tips

1. **Use Aliases**: Add PowerShell aliases for common commands
   ```powershell
   # In $PROFILE
   Set-Alias -Name dev -Value 'pnpm run dev'
   Set-Alias -Name qual -Value 'pnpm run quality'
   ```

2. **Watch Mode**: Use watch mode during development
   ```powershell
   pnpm run test:unit:watch  # Tests auto-run on save
   ```

3. **Multiple Terminals**: Keep separate terminals open:
   - Terminal 1: Dev server
   - Terminal 2: Tests in watch mode
   - Terminal 3: Git commands
   - Terminal 4: Trading bot logs (if applicable)

4. **Git Branches**: Keep feature branches small and focused
   - One feature per branch
   - Merge often to avoid conflicts
   - Delete merged branches

5. **Trading Bot**: Always monitor logs when bot is running
   ```powershell
   # In dedicated terminal
   Get-Content projects\crypto-enhanced\trading_new.log -Tail 50 -Wait
   ```

---

This guide covers the most common development workflows. For detailed information on specific systems, refer to:
- `MONOREPO_ARCHITECTURE.md` - Architectural details
- `TRADING_BOT_GUIDE.md` - Trading bot specifics
- `QUALITY_STANDARDS.md` - Code quality requirements
- `TROUBLESHOOTING_GUIDE.md` - Problem solutions
