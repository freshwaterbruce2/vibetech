# Trading Bot Startup Guide

## Quick Reference

### Method 1: Auto-Confirmed Startup (EASIEST)
```powershell
cd C:\dev\desktop-commander-enhancements\trading-automation
.\Start-Bot-Auto-Confirm.ps1
```
- Automatically sends "YES" confirmation
- Opens bot in new window
- No manual input needed

### Method 2: Manual Startup with Monitoring
```powershell
cd C:\dev\desktop-commander-enhancements\trading-automation
.\Quick-Start-Bot.ps1
```
- Opens bot in new window
- YOU MUST TYPE "YES" in that window
- Check the window for any errors

### Method 3: Direct Manual Start
```powershell
cd C:\dev\projects\crypto-enhanced
.\.venv\Scripts\python.exe start_live_trading.py
```
- Type "YES" when prompted
- Runs in current window
- See all output directly

## Why Monitor-TradingBot-v2.ps1 Fails to Start

The monitoring script has a limitation:
- It opens bot in a NEW PowerShell window
- The "YES" confirmation prompt appears in THAT window
- Monitor can't automatically type into another window
- Result: "WARNING: Bot process not detected after restart"

**Solution:** Use one of the methods above instead of letting the monitor start the bot.

## Recommended Workflow

### Daily Startup
1. Clean environment:
   ```powershell
   .\Force-Stop-Trading.ps1
   ```

2. Start bot with auto-confirm:
   ```powershell
   .\Start-Bot-Auto-Confirm.ps1
   ```

3. (Optional) Start monitoring:
   ```powershell
   .\Monitor-TradingBot-v2.ps1
   ```

### If Bot Won't Start

Check these in order:

1. **Lock files remaining?**
   ```powershell
   .\Force-Stop-Trading.ps1
   ```

2. **Duplicate instance?**
   - Check for existing Python processes
   - Only ONE bot can run at a time

3. **Configuration issue?**
   ```powershell
   cd C:\dev\projects\crypto-enhanced
   .\.venv\Scripts\python.exe -c "import config; print('Config OK')"
   ```

4. **API credentials?**
   ```powershell
   cd C:\dev\projects\crypto-enhanced
   .\.venv\Scripts\python.exe test_api_simple.py
   ```

## Scripts Summary

### Startup Scripts
- **Start-Bot-Auto-Confirm.ps1** - Auto-confirm startup (recommended)
- **Quick-Start-Bot.ps1** - Manual confirmation required
- **Safe-Start-Trading.ps1** - Full cleanup + diagnostics + startup

### Management Scripts
- **Force-Stop-Trading.ps1** - Nuclear cleanup
- **Monitor-TradingBot-v2.ps1** - Health monitoring (doesn't auto-start well)

### Diagnostic Scripts
- **Find-AutoRestart-Source.ps1** - Find auto-restart sources
- **Find-Auto-Restart-Parent.ps1** - Identify parent processes
- **Test-Auto-Restart-Fixed.ps1** - Verify fix

## Current Status

- **Auto-restart issue:** FIXED (2 scheduled tasks disabled)
- **Balance API:** Shows $0.00 (bug) - Actual: $71.43 USD + 184.93 XLM
- **Risk Manager:** Working correctly (blocks orders when balance shows $0.00)
- **Bot startup:** Use Start-Bot-Auto-Confirm.ps1 for best results

## Troubleshooting

### "Bot process not detected after restart"
- This is normal when using Monitor-TradingBot-v2.ps1 to start
- The bot opens in a separate window waiting for YES
- Find that window and type YES
- OR use Start-Bot-Auto-Confirm.ps1 instead

### "Duplicate instance detected"
- Run Force-Stop-Trading.ps1
- Wait 10 seconds
- Try again

### Balance showing $0.00
- This is a known API bug
- Actual balance is safe: $71.43 USD + 184.93 XLM
- Risk manager will block all orders until fixed
- Verify with: `python test_api_simple.py`

## Next Steps

1. Start the bot: `.\Start-Bot-Auto-Confirm.ps1`
2. Monitor the logs: `Get-Content C:\dev\projects\crypto-enhanced\trading_new.log -Tail 20 -Wait`
3. (Optional) Run monitoring: `.\Monitor-TradingBot-v2.ps1`
