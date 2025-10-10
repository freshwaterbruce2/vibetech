# Crypto Enhanced Trading System - Usage Guide

## 🚀 QUICK START

### 1. Launch Trading Bot (Recommended Method)
```powershell
.\launch_trading.ps1
```

This script will:
- Kill ALL existing trading processes
- Remove ALL lock files
- Wait for clean system state
- Launch single instance with lock enforcement
- Verify successful startup

### 2. Stop Trading Bot
```powershell
.\stop_trading.ps1
```

This script will:
- Send graceful shutdown signal
- Wait up to 30 seconds for cleanup
- Force kill if needed
- Remove lock files
- Show final status

### 3. Monitor Trading Bot Health
```powershell
# Single health check
.\check_trading_health.ps1

# Continuous monitoring (every 60 seconds)
.\check_trading_health.ps1 -Continuous

# Auto-kill duplicates if detected
.\check_trading_health.ps1 -Continuous -AutoKill

# Custom interval (30 seconds)
.\check_trading_health.ps1 -Continuous -Interval 30
```

## ⚠️ CRITICAL: Multiple Instance Prevention

**NEVER use these commands directly:**
```powershell
# ❌ WRONG - Can create duplicates
python start_live_trading.py
echo YES | python start_live_trading.py
```

**ALWAYS use the launcher:**
```powershell
# ✅ CORRECT - Prevents duplicates
.\launch_trading.ps1
```

## 🔑 API Key Configuration

### Multiple Keys for Safety

The system supports **3 API key pairs** for maximum safety against nonce conflicts:

1. **Edit `.env` file:**
```env
# Primary key (main operations)
KRAKEN_API_KEY=your_primary_key
KRAKEN_API_SECRET=your_primary_secret

# Secondary key (fallback)
KRAKEN_API_KEY_2=your_secondary_key
KRAKEN_API_SECRET_2=your_secondary_secret

# Tertiary key (backup - optional)
KRAKEN_API_KEY_3=your_tertiary_key
KRAKEN_API_SECRET_3=your_tertiary_secret
```

2. **Generate keys at:** https://www.kraken.com/u/security/api

3. **Key permissions needed:**
   - Query Funds
   - Query Open Orders & Trades
   - Query Closed Orders & Trades
   - Create & Modify Orders
   - Cancel/Close Orders

### Why Multiple Keys?

- **Safety Net:** If one key gets nonce errors, system auto-switches to next
- **Isolation:** Each accidental duplicate instance uses different key
- **Recovery:** Can continue trading even if one key is locked out

## 📊 Monitoring Commands

### Check Trading Logs
```powershell
# Last 50 lines
Get-Content trading_new.log -Tail 50

# Follow live logs
Get-Content trading_new.log -Wait -Tail 20

# Search for errors
Get-Content trading_new.log | Select-String "ERROR"

# Search for trades
Get-Content trading_new.log | Select-String "Order.*filled"
```

### Check Running Processes
```powershell
# List all Python trading processes
Get-Process python | Where-Object {
    (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -match "trading"
}

# Check for duplicates
.\check_trading_health.ps1
```

### Check Lock Files
```powershell
# List lock files
Get-ChildItem $env:TEMP\*trading*.lock*
Get-ChildItem *.lock*

# Remove stale locks
Remove-Item $env:TEMP\*trading*.lock* -Force
Remove-Item *.lock* -Force
```

## 🔧 Troubleshooting

### Problem: Multiple Instances Running

**Symptoms:**
- API nonce errors in logs
- Multiple Python processes visible
- Kraken API lockouts

**Solution:**
```powershell
# Stop everything
.\stop_trading.ps1

# Verify clean state
Get-Process python

# Restart with launcher
.\launch_trading.ps1
```

### Problem: Lock File Errors

**Symptoms:**
- "Another instance is running" error
- No Python processes found
- Stale lock files exist

**Solution:**
```powershell
# Manual cleanup
Remove-Item *.lock*,$env:TEMP\*trading*.lock* -Force

# Restart
.\launch_trading.ps1
```

### Problem: API Key Lockout

**Symptoms:**
- "Invalid nonce" errors
- API calls failing
- Need fresh API keys

**Solution:**
```powershell
# 1. Stop trading
.\stop_trading.ps1

# 2. Generate new API keys at Kraken
# 3. Update .env file with new keys
# 4. Restart trading
.\launch_trading.ps1
```

### Problem: Nonce Conflicts

**Symptoms:**
- Repeated "Invalid nonce" errors
- Multiple keys configured
- System not auto-switching

**Solution:**
```powershell
# Check which key is active
Get-Content trading_new.log | Select-String "API key"

# Verify all keys configured
Get-Content .env | Select-String "KRAKEN_API"

# Ensure nonce window is high enough
Get-Content .env | Select-String "NONCE_WINDOW"
# Should be 10000 or higher
```

## 📈 Performance Monitoring

### Trading Performance
```powershell
# View recent trades
Get-Content trading_new.log | Select-String "filled|executed" | Select-Object -Last 10

# Check current balance
Get-Content trading_new.log | Select-String "Balance" | Select-Object -Last 1

# View strategy signals
Get-Content trading_new.log | Select-String "signal|opportunity"
```

### System Health
```powershell
# Memory usage
Get-Process python | Select-Object ProcessName,Id,WorkingSet64

# Runtime
Get-Process python | Select-Object ProcessName,Id,StartTime

# CPU usage
Get-Process python | Select-Object ProcessName,Id,CPU
```

## 🎯 Best Practices

1. **Always use `launch_trading.ps1`** - Never start manually
2. **Configure 3 API keys** - Maximum safety
3. **Monitor health regularly** - Use `check_trading_health.ps1 -Continuous -AutoKill`
4. **Check logs daily** - Look for errors or warnings
5. **Backup database** - `trading.db` contains all state
6. **Use graceful shutdown** - `stop_trading.ps1` before system maintenance

## 🚨 Emergency Commands

### Force Kill Everything
```powershell
taskkill /F /IM python.exe /T
Remove-Item *.lock*,$env:TEMP\*trading*.lock* -Force
```

### Clean Start
```powershell
.\stop_trading.ps1
Remove-Item nonce_state*.json -Force
Remove-Item *.lock* -Force
.\launch_trading.ps1 -NoConfirm
```

### Check System State
```powershell
# Processes
Get-Process python

# Lock files
Get-ChildItem $env:TEMP\*trading*.lock*

# Logs
Get-Content trading_new.log -Tail 20
```

## 📞 Support

If issues persist:
1. Check `trading_new.log` for detailed errors
2. Run health check: `.\check_trading_health.ps1`
3. Verify API keys are valid
4. Ensure only ONE instance is running
5. Check nonce window is >= 10000
