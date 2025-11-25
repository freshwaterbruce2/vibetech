# 🚀 Quick Start Guide

## TL;DR - Get Started in 30 Seconds

```powershell
# 1. Navigate to the project
cd C:\dev\desktop-commander-enhancements

# 2. Start monitoring your live trading bot NOW
.\trading-automation\Monitor-TradingBot.ps1
```

That's it! Your bot is now monitored 24/7. 🎉

---

## What Just Happened?

The monitor script is now:
- ✅ Checking if your Python trading bot is running
- ✅ Watching your log files for errors in real-time
- ✅ Monitoring trade activity (alerts if no trades for 30+ min)
- ✅ Tracking memory/CPU usage
- ✅ Ready to send you toast notifications if something goes wrong

**You'll see output like:**
```
🤖 CRYPTO TRADING BOT HEALTH MONITOR
======================================================================
📊 Configuration:
   • Check Interval: 60 seconds
   • No-Trade Alert: 30 minutes

[12:34:56] Check #1
  ✅ Bot running (PID: 12345 | Memory: 145.32MB | CPU: 2.5s)
  📊 Last trade: 5.2 minutes ago
```

---

## Next: Improve Your Daily Workflow (2 minutes)

Tomorrow morning, instead of manually:
1. Opening VS Code
2. Opening PowerShell
3. Activating venv
4. Tailing logs
5. Opening Kraken Pro
6. Positioning all the windows

Just run:
```powershell
.\trading-automation\Setup-TradingWorkspace.ps1
```

**Boom!** Everything opens and positions automatically. ⚡

---

## Later: Validate Everything Works (10 minutes)

When you have time, test all 52 Desktop Commander features:

```powershell
.\test-suite\Test-DesktopCommander.ps1
```

This will:
- Test keyboard/mouse automation
- Test window management
- Test clipboard operations
- Test system monitoring
- Test screenshots
- Test notifications

You'll get a detailed report showing what works and what doesn't.

---

## Important Paths

All scripts are in: `C:\dev\desktop-commander-enhancements\`

| Script | Purpose | Priority |
|--------|---------|----------|
| `trading-automation\Monitor-TradingBot.ps1` | Protect your live bot | 🔴 HIGH |
| `trading-automation\Setup-TradingWorkspace.ps1` | Daily workflow | 🟡 MEDIUM |
| `test-suite\Test-DesktopCommander.ps1` | Validate features | 🟢 LOW |

---

## Customization

### Want different alert thresholds?

Edit `Monitor-TradingBot.ps1`:
```powershell
$Config = @{
    MemoryThresholdMB    = 500     # Change to 1000 for higher threshold
    NoTradeAlertMinutes  = 30      # Change to 15 for more aggressive alerts
}
```

### Want different window positions?

Edit `Setup-TradingWorkspace.ps1`:
```powershell
Positions = @{
    Dual = @{
        VSCode    = @{ X = 0; Y = 0; Width = 1920; Height = 1080 }
        Terminal  = @{ X = 1920; Y = 0; Width = 960; Height = 540 }
        # Adjust X, Y, Width, Height for your monitors
    }
}
```

---

## Stopping the Monitor

Press `Ctrl+C` in the PowerShell window running the monitor.

It will clean up properly:
```
🛑 Monitoring stopped
📋 Log monitoring stopped
```

---

## Need Help?

1. **Monitor not working?** Check `README.md` → Troubleshooting section
2. **Workspace setup failing?** Make sure VS Code is in your PATH: `code --version`
3. **Tests failing?** Run with verbose: `.\Test-DesktopCommander.ps1 -Verbose`

---

## Pro Tips

### Run Monitor 24/7
Start it in a dedicated PowerShell window and minimize it. It will:
- Keep running in background
- Alert you instantly if bot crashes
- Detect WebSocket disconnects
- Warn about high memory usage

### Create Desktop Shortcuts
Right-click scripts → "Create shortcut" → Move to desktop

### Schedule Workspace Setup
Add to Windows startup or create a scheduled task to run at 8 AM daily.

---

**You're all set! 🎉**

Your trading bot is now protected, and your workflow is automated.

For full details, see `README.md`.
