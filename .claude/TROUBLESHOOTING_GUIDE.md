# Troubleshooting Guide

Solutions to common issues in the C:\dev monorepo.

---

## 🔍 Quick Diagnosis

First, identify which system is having issues:

```powershell
# Web App Issues
pnpm run dev  # Does dev server start?
pnpm run quality  # Do quality checks pass?

# Trading Bot Issues
cd projects\crypto-enhanced
.venv\Scripts\activate
python simple_status.py  # Is bot running?
python run_tests.py  # Do tests pass?

# Backend Issues
cd backend
pnpm run dev  # Does server start?

# Monorepo Issues
ppnpm install  # Do dependencies install?
nx run-many -t build  # Do projects build?
```

---

## 🌐 Web App Issues

### Port Already in Use

**Problem**: `Error: Port 5173 is already in use`

**Solution 1** - Kill the process:
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Output shows PID in last column:
# TCP    0.0.0.0:5173    0.0.0.0:0    LISTENING    12345

# Kill process by PID
taskkill /PID 12345 /F
```

**Solution 2** - Use different port:
```powershell
pnpm run dev -- --port 3000
```

### Module Not Found

**Problem**: `Error: Cannot find module '@/components/ui/button'`

**Diagnosis**:
```powershell
# Check if node_modules exists
Test-Path node_modules
# Should return True

# Check TypeScript configuration
Get-Content tsconfig.json | Select-String "paths"
# Should show: "@/*": ["./src/*"]
```

**Solution 1** - Reinstall dependencies:
```powershell
# Remove node_modules and lockfile
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml

# Reinstall
ppnpm install

# Restart dev server
pnpm run dev
```

**Solution 2** - Clear Vite cache:
```powershell
Remove-Item -Recurse -Force node_modules\.vite
pnpm run dev
```

### TypeScript Errors Won't Go Away

**Problem**: VS Code shows TypeScript errors that shouldn't exist

**Solution 1** - Restart TypeScript server:
- Open Command Palette (Ctrl+Shift+P)
- Type "TypeScript: Restart TS Server"
- Press Enter

**Solution 2** - Check for multiple TypeScript versions:
```powershell
# Should only show one version
Get-ChildItem -Recurse -Filter "typescript" node_modules

# If multiple found, clear and reinstall
Remove-Item -Recurse -Force node_modules
ppnpm install
```

**Solution 3** - Verify tsconfig.json:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    // ... other options
  }
}
```

### Build Fails

**Problem**: `pnpm run build` fails with errors

**Diagnosis**:
```powershell
# Run checks individually to isolate issue
pnpm run lint
pnpm run typecheck
pnpm run test:unit
```

**Common Causes & Solutions**:

1. **Lint errors**:
```powershell
pnpm run lint:fix  # Auto-fix
```

2. **Type errors**:
- Read error messages carefully
- Fix one file at a time
- Use `// @ts-expect-error` only as last resort

3. **Test failures**:
```powershell
pnpm run test:unit:ui  # Interactive test runner
# Identify failing tests and fix
```

4. **Memory issues** (large bundles):
```powershell
# Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
```

### React Hydration Errors

**Problem**: Console shows hydration mismatch errors

**Common Causes**:
1. Using `Date.now()` or `Math.random()` directly in render
2. Browser extensions modifying DOM
3. SSR/SSG mismatch

**Solution**:
```typescript
// ❌ BAD: Different on server and client
function Component() {
  return <div>{Date.now()}</div>;
}

// ✅ GOOD: Use useEffect for client-only code
function Component() {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  
  useEffect(() => {
    setTimestamp(Date.now());
  }, []);
  
  return <div>{timestamp ?? 'Loading...'}</div>;
}
```

### Styling Not Applying

**Problem**: Tailwind classes not working

**Diagnosis**:
```powershell
# Check Tailwind config
Get-Content tailwind.config.ts

# Should include src paths:
# content: ['./src/**/*.{js,ts,jsx,tsx}']
```

**Solution 1** - Rebuild:
```powershell
# Clear build cache
Remove-Item -Recurse -Force dist, node_modules\.vite

# Restart dev server
pnpm run dev
```

**Solution 2** - Check PostCSS config:
```javascript
// postcss.config.js should include:
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## 🐍 Trading Bot Issues

### Bot Won't Start

**Problem**: `python start_live_trading.py` fails immediately

**Diagnosis**:
```powershell
cd C:\dev\projects\crypto-enhanced
.venv\Scripts\activate

# Check Python version
python --version  # Should be 3.12+

# Check virtual environment
pip list  # Should show all requirements

# Check for lock file
Test-Path .trading_lock
```

**Solution 1** - Remove stale lock:
```powershell
if (Test-Path .trading_lock) {
    Remove-Item .trading_lock
    Write-Host "Removed stale lock file"
}
```

**Solution 2** - Verify environment:
```powershell
# Check .env file exists
if (!(Test-Path .env)) {
    Write-Host ".env file missing!"
    copy .env.example .env
    Write-Host "Please edit .env with your API keys"
    exit
}

# Test API keys
python test_credentials.py
```

**Solution 3** - Reinstall dependencies:
```powershell
# Recreate virtual environment
Remove-Item -Recurse -Force .venv
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### "EAPI:Invalid nonce" Error

**Problem**: Kraken API returns "EAPI:Invalid nonce" error

**Explanation**: Nonce must be strictly increasing. This error means:
1. Previous request failed mid-flight
2. Nonce state file corrupted
3. System clock incorrect
4. Multiple instances running simultaneously

**Solution 1** - Reset nonce state:
```powershell
cd C:\dev\projects\crypto-enhanced

# Remove nonce state files
Remove-Item nonce_state.json, nonce_state_primary.json -ErrorAction SilentlyContinue

# Nonce will reinitialize on next start
python start_live_trading.py
```

**Solution 2** - Check system time:
```powershell
# Verify system clock is correct
Get-Date

# If incorrect, sync with time server
w32tm /resync
```

**Solution 3** - Ensure single instance:
```powershell
# Check for multiple instances
Get-Process python | Where-Object {$_.MainWindowTitle -like "*trading*"}

# Kill duplicates if found
# Keep only one, kill others by PID
```

### WebSocket Won't Connect

**Problem**: WebSocket connection fails or keeps disconnecting

**Diagnosis**:
```powershell
# Check logs for WebSocket errors
Get-Content trading_new.log | Select-String "websocket|connection" -Context 2,2

# Test API credentials
python
>>> from kraken_client import KrakenClient
>>> client = KrakenClient()
>>> import asyncio
>>> asyncio.run(client.get_balance())
# Should return balance or show specific error
```

**Solution 1** - Verify API keys:
```powershell
# Check .env file
Get-Content .env | Select-String "KRAKEN"

# Ensure keys are valid (no spaces, correct format)
# KRAKEN_API_KEY=abc...xyz
# KRAKEN_API_SECRET=def...uvw
```

**Solution 2** - Check network:
```powershell
# Test Kraken connectivity
Test-NetConnection -ComputerName www.kraken.com -Port 443

# If fails, check:
# - Firewall settings
# - VPN connection
# - Internet connectivity
```

**Solution 3** - Increase timeout:
```python
# In websocket_manager.py, increase timeouts:
WEBSOCKET_TIMEOUT = 60  # Increase from 30
HEARTBEAT_INTERVAL = 30  # Increase from 15
```

### Database Locked

**Problem**: `database is locked` error in logs

**Explanation**: SQLite exclusive lock held by another process

**Diagnosis**:
```powershell
# Check for multiple Python processes
Get-Process python

# Check if database is in WAL mode
sqlite3 trading.db "PRAGMA journal_mode;"
# Should return: wal
```

**Solution 1** - Enable WAL mode:
```powershell
sqlite3 trading.db "PRAGMA journal_mode=WAL;"
# WAL allows concurrent reads while writing
```

**Solution 2** - Close other connections:
```powershell
# Stop bot if running
.\stop_trading.ps1

# Remove lock files
Remove-Item trading.db-shm, trading.db-wal -ErrorAction SilentlyContinue

# Restart
python start_live_trading.py
```

**Solution 3** - Check for corruption:
```powershell
sqlite3 trading.db "PRAGMA integrity_check;"
# Should return: ok

# If corrupted, restore from backup
copy trading.db.backup trading.db
```

### Orders Not Executing

**Problem**: Bot running but not placing orders

**Diagnosis**:
```powershell
# Check circuit breaker status
sqlite3 trading.db "SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1;"

# Check for errors in logs
Get-Content trading_new.log -Tail 100 | Select-String "ERROR|CRITICAL"

# Check strategy signals
python
>>> from trading_engine import TradingEngine
>>> # Manually test signal generation
```

**Possible Causes**:
1. **Circuit breaker open**: Too many failures triggered safety mechanism
2. **Insufficient balance**: Not enough funds for minimum order
3. **Strategy conditions not met**: Market not favorable
4. **API rate limited**: Too many requests sent

**Solution 1** - Reset circuit breaker:
```python
# In Python shell
from circuit_breaker import CircuitBreaker
breaker = CircuitBreaker()
breaker.reset()
```

**Solution 2** - Check balance:
```powershell
python simple_status.py
# Verify balance > MIN_ORDER_SIZE (usually $1)
```

**Solution 3** - Adjust strategy parameters:
```python
# In config.py or trading_config.json
# Lower thresholds if too strict
```

### High CPU Usage

**Problem**: Python process using excessive CPU

**Diagnosis**:
```powershell
# Monitor Python process
while ($true) {
    Get-Process python | Select-Object CPU, WS
    Start-Sleep 1
}
```

**Common Causes**:
1. Tight loop without sleep
2. Excessive logging
3. Websocket reconnection loop
4. Memory leak causing GC thrashing

**Solution 1** - Check for tight loops:
```python
# Look for loops without await
while True:
    # ❌ BAD: No await
    process_data()

# ✅ GOOD: Yield control
while True:
    await process_data()
    await asyncio.sleep(0.1)  # Yield
```

**Solution 2** - Reduce logging:
```python
# In config
logging.basicConfig(level=logging.INFO)  # Change from DEBUG
```

**Solution 3** - Profile the code:
```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Run code
asyncio.run(main())

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 time consumers
```

---

## 🔧 Monorepo Issues

### pnpm Install Fails

**Problem**: `ppnpm install` fails with errors

**Solution 1** - Clear pnpm cache:
```powershell
pnpm store prune
Remove-Item pnpm-lock.yaml
ppnpm install
```

**Solution 2** - Check Node.js version:
```powershell
node --version
# Should be 20.19+ or 22.12+

# If not, update Node.js
winget install -e --id OpenJS.NodeJS.LTS
```

**Solution 3** - Use legacy peer deps:
```powershell
ppnpm install --legacy-peer-deps
```

### Nx Commands Not Working

**Problem**: `nx run-many` or other Nx commands fail

**Diagnosis**:
```powershell
# Check Nx installation
npx nx --version

# Check nx.json exists
Test-Path nx.json
```

**Solution 1** - Reinstall Nx:
```powershell
pnpm add -D nx @nx/workspace
```

**Solution 2** - Clear Nx cache:
```powershell
nx reset
# Clears cache and daemon
```

**Solution 3** - Check project configuration:
```powershell
# Verify projects have proper configs
Get-Content package.json | Select-String "workspaces"
```

### Git Issues

**Problem**: Git operations fail or show unexpected behavior

**Diagnosis**:
```powershell
# Check git status
git status

# Check for large files
git ls-files | ForEach-Object { Get-Item $_ } | Sort-Object Length -Descending | Select-Object -First 10

# Check .gitignore
Get-Content .gitignore
```

**Solution 1** - Remove cached files:
```powershell
# If accidentally committed node_modules or .env
git rm --cached -r node_modules
git rm --cached .env
git commit -m "Remove accidentally committed files"
```

**Solution 2** - Reset to clean state:
```powershell
# Discard all local changes (CAREFUL!)
git reset --hard HEAD
git clean -fd
```

**Solution 3** - Fix line endings:
```powershell
# If CRLF/LF issues
git config core.autocrlf true
git add --renormalize .
git commit -m "Normalize line endings"
```

---

## 🌍 Environment Issues

### Environment Variables Not Loading

**Problem**: Application can't read environment variables

**Diagnosis**:
```powershell
# Check .env file exists
Test-Path .env

# Check contents (don't show secrets!)
Get-Content .env | ForEach-Object { $_.Split('=')[0] }
```

**Solution 1** - Verify file format:
```bash
# .env should be:
KEY=value
# NOT:
KEY = value  # ❌ Spaces around =
KEY: value   # ❌ Colon instead of =
```

**Solution 2** - Check loading code:
```typescript
// Web app - Vite
console.log(import.meta.env.VITE_API_KEY);  // Should not be undefined

// Backend - Node.js
import 'dotenv/config';
console.log(process.env.API_KEY);  // Should not be undefined
```

**Solution 3** - Restart dev server:
```powershell
# Environment variables loaded at startup
# Must restart to see changes
pnpm run dev
```

### API Keys Not Working

**Problem**: API returns 401/403 errors

**Diagnosis**:
```powershell
# Trading bot
cd projects\crypto-enhanced
python test_credentials.py

# Check for common issues:
# - Extra spaces: " abc123" instead of "abc123"
# - Wrong encoding: base64 vs hex
# - Expired keys
# - Wrong permissions
```

**Solution**:
```powershell
# Regenerate API keys
# 1. Log into Kraken/Supabase/etc
# 2. Generate new keys with correct permissions
# 3. Update .env file
# 4. Restart application
```

---

## 🐛 Runtime Issues

### Memory Leaks

**Problem**: Application memory usage keeps growing

**Diagnosis - Web App**:
```typescript
// Use Chrome DevTools Memory Profiler
// 1. Open DevTools -> Memory tab
// 2. Take heap snapshot
// 3. Perform actions
// 4. Take another snapshot
// 5. Compare to see what's retained
```

**Diagnosis - Trading Bot**:
```python
# Use memory_profiler
pip install memory-profiler

# Add decorator to suspect functions
from memory_profiler import profile

@profile
async def suspect_function():
    # Function code
```

**Common Causes**:
1. Event listeners not cleaned up
2. Circular references
3. Large objects in closure
4. Unclosed connections/files

**Solution - React**:
```typescript
// ✅ GOOD: Clean up in useEffect
useEffect(() => {
  const listener = (event) => handleEvent(event);
  window.addEventListener('resize', listener);
  
  return () => {
    window.removeEventListener('resize', listener);  // Cleanup!
  };
}, []);
```

**Solution - Python**:
```python
# ✅ GOOD: Use context managers
async with aiohttp.ClientSession() as session:
    # Session automatically closed

# ✅ GOOD: Explicit cleanup
try:
    connection = await create_connection()
    # Use connection
finally:
    await connection.close()  # Always runs
```

### Performance Degradation

**Problem**: Application slows down over time

**Web App**:
```powershell
# Check bundle size
pnpm run analyze

# Profile React renders
# 1. Open React DevTools
# 2. Profiler tab
# 3. Start recording
# 4. Perform actions
# 5. Stop and analyze
```

**Trading Bot**:
```python
# Check event loop responsiveness
import time

async def monitor_loop():
    while True:
        start = time.time()
        await asyncio.sleep(0)  # Yield control
        latency = time.time() - start
        if latency > 0.1:
            logger.warning(f"Event loop slow: {latency:.3f}s")
```

---

## 🆘 Emergency Procedures

### Application Completely Broken

```powershell
# Nuclear option: Reset everything

# 1. Backup important files
copy projects\crypto-enhanced\trading.db trading.db.emergency.backup
copy .env .env.backup

# 2. Clean everything
Remove-Item -Recurse -Force node_modules, dist, .nx, coverage
Remove-Item -Recurse -Force projects\crypto-enhanced\.venv, projects\crypto-enhanced\__pycache__

# 3. Reinstall
ppnpm install
cd projects\crypto-enhanced
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 4. Test
pnpm run quality
cd projects\crypto-enhanced && python run_tests.py

# 5. If still broken, git reset
git status  # Review changes
git reset --hard HEAD  # DESTRUCTIVE!
git clean -fd  # Remove untracked files
```

### Trading Bot Financial Emergency

**If bot is making bad trades or losing money:**

```powershell
# 1. STOP IMMEDIATELY
cd projects\crypto-enhanced
.\stop_trading.ps1

# 2. Kill all Python if unresponsive
taskkill /F /IM python.exe

# 3. Check open positions
sqlite3 trading.db "SELECT * FROM trades WHERE status='OPEN';"

# 4. Manually close positions on Kraken if needed
# Log into Kraken website
# Trade -> Orders -> Cancel all orders

# 5. Review what went wrong
Get-Content trading_new.log -Tail 500
sqlite3 trading.db "SELECT * FROM trades ORDER BY timestamp DESC LIMIT 20;"

# 6. DO NOT restart until you understand the issue
```

---

## 📞 Getting Help

### Before Asking for Help

Gather this information:
1. What were you trying to do?
2. What actually happened?
3. Error messages (full text)
4. Steps to reproduce
5. What you've tried already

### Useful Debug Information

**Web App**:
```powershell
node --version
npm --version
Get-Content package.json | Select-Object version,name
pnpm run typecheck 2>&1
pnpm run lint 2>&1
```

**Trading Bot**:
```powershell
python --version
pip list | Select-String "aiohttp|pydantic|asyncio"
Get-Content projects\crypto-enhanced\trading_new.log -Tail 100
sqlite3 projects\crypto-enhanced\trading.db ".schema"
```

### Log Analysis

```powershell
# Find all errors
Get-Content trading_new.log | Select-String "ERROR|CRITICAL"

# Find errors with context
Get-Content trading_new.log | Select-String "ERROR" -Context 5,5

# Count error types
Get-Content trading_new.log | Select-String "ERROR" | Group-Object { $_ -replace ".*ERROR: (.*?):.*", '$1' }

# Find recent errors (last hour)
$oneHourAgo = (Get-Date).AddHours(-1)
Get-Content trading_new.log | Where-Object { 
    $timestamp = [datetime]::ParseExact($_.Substring(0,19), "yyyy-MM-dd HH:mm:ss", $null)
    $timestamp -gt $oneHourAgo
} | Select-String "ERROR"
```

---

## 🎯 Prevention Tips

1. **Run quality checks before every commit**
   ```powershell
   pnpm run quality
   cd projects\crypto-enhanced && python run_tests.py
   ```

2. **Keep dependencies updated** (but test thoroughly)
   ```powershell
   pnpm outdated
   pip list --outdated
   ```

3. **Monitor logs regularly**
   ```powershell
   Get-Content projects\crypto-enhanced\trading_new.log -Tail 20 -Wait
   ```

4. **Backup database frequently**
   ```powershell
   # Add to daily routine
   copy projects\crypto-enhanced\trading.db "backups\trading_$(Get-Date -Format 'yyyyMMdd').db"
   ```

5. **Use version control properly**
   ```powershell
   git status  # Before making changes
   git commit -m "descriptive message"  # Commit working code
   ```

6. **Test in isolation**
   - Test changes locally before deploying
   - Use mocks for external services
   - Don't skip tests because "it's a small change"

---

Remember: **Most problems have simple solutions.** Start with the basics (restart, reinstall, check logs) before assuming complex issues.
