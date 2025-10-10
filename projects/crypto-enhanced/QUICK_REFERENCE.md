# 🚀 Quick Reference Guide - Crypto Trading Bot
**Location:** `C:\dev\projects\crypto-enhanced`

---

## 📋 Daily Startup Checklist

### 1. Pre-Flight Validation (MANDATORY)
```powershell
# Navigate to project
cd C:\dev\projects\crypto-enhanced

# Activate virtual environment
.\.venv\Scripts\activate

# Run validation (takes ~30 seconds)
python startup_validator.py

# Quick validation (takes ~5 seconds, skips network tests)
python startup_validator.py --quick
```

**Expected Result:** `✓ ALL CHECKS PASSED` or `⚠ PASSED WITH WARNINGS`

---

### 2. Start Trading Bot
```powershell
# After validation passes
python start_live_trading.py

# Auto-confirm (skip interactive prompt)
echo YES | python start_live_trading.py
```

---

## 🔍 Troubleshooting Common Issues

### Issue: Port 8001 Already in Use
```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort 8001 | Select-Object LocalAddress, LocalPort, State, OwningProcess

# Kill the process (replace <PID> with actual Process ID)
taskkill /PID <PID> /F
```

---

### Issue: Multiple Instances Running
```powershell
# Check for running Python processes
Get-Process python | Select-Object Id, ProcessName, StartTime

# Kill specific process
taskkill /PID <PID> /F

# Kill all Python processes (CAREFUL!)
Get-Process python | Stop-Process -Force
```

---

### Issue: WebSocket Connection Failed

1. **Check internet connection:**
```powershell
Test-Connection -ComputerName api.kraken.com -Count 4
```

2. **Check API credentials:**
```powershell
Test-Path .\.env
```

3. **Rate limits:** Wait 60 seconds and try again

---

## 🛠️ Maintenance Commands

### View Logs
```powershell
# View recent logs (last 50 lines)
Get-Content .\trading_new.log -Tail 50

# Follow logs in real-time
Get-Content .\trading_new.log -Wait
```

---

## 🚨 Emergency Procedures

### Emergency Stop (Immediate)
```powershell
# Kill all Python processes
Get-Process python | Stop-Process -Force
```

---

## 📞 Quick Commands Reference

```powershell
# Navigate to project
cd C:\dev\projects\crypto-enhanced

# Activate environment
.\.venv\Scripts\activate

# Run pre-flight checks
python startup_validator.py --quick

# Start trading
python start_live_trading.py

# View logs in real-time
Get-Content trading_new.log -Wait

# Emergency stop
Get-Process python | Stop-Process -Force
```

---

**Last Updated:** October 6, 2025  
**System Version:** Live Trading (XLM/USD)  
**Current Balance:** $98.82
