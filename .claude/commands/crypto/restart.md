---
allowed-tools: Bash(ps:*), Bash(kill:*), Bash(python:*), Bash(sleep:*), Bash(sqlite3:*), Bash(grep:*), Bash(tail:*), Bash(wc:*)
description: Safely restart the crypto trading system with proper cleanup and verification
model: sonnet
---

# Crypto Trading System Restart

Safely restart the crypto trading system with proper cleanup, safety checks, and verification.

**WARNING:** This is a safety-critical operation for a live trading system. All safety checks must pass before restart.

## Step 1: Safety Checks - Check for Open Positions

Execute this bash command to check for open positions:
```bash
cd projects/crypto-enhanced && if [ -f trading.db ]; then sqlite3 trading.db "SELECT COUNT(*) as open_positions FROM positions WHERE status='open';" 2>&1; else echo "0"; fi
```

Present with header:
```
════════════════════════════════════════
  SAFETY CHECK - OPEN POSITIONS
════════════════════════════════════════
```

If the count is greater than 0, WARN THE USER:
```
⚠ WARNING: There are open positions!

Restarting with open positions may cause:
- Loss of position tracking
- Missed stop-loss triggers
- Potential financial loss

RECOMMENDATION: Close all positions before restarting.

Do you want to proceed anyway? (Reply "yes confirm" to continue)
```

STOP and wait for user confirmation if open positions exist.

## Step 2: Safety Checks - Check for Pending Orders

Execute this bash command to check for pending orders:
```bash
cd projects/crypto-enhanced && if [ -f trading.db ]; then sqlite3 trading.db "SELECT COUNT(*) as pending_orders FROM orders WHERE status IN ('pending', 'open');" 2>&1; else echo "0"; fi
```

Present with header:
```
════════════════════════════════════════
  SAFETY CHECK - PENDING ORDERS
════════════════════════════════════════
```

If the count is greater than 0, WARN THE USER:
```
⚠ WARNING: There are pending/open orders!

Do you want to proceed with restart? (Reply "yes" to continue)
```

## Step 3: Find Running Process

Execute this bash command to find running trading processes:
```bash
ps aux 2>/dev/null | grep -E "python.*(launch_auto|start_live)" | grep -v grep
```

On Windows, also try:
```bash
tasklist 2>/dev/null | findstr /i "python"
```

Present with header:
```
════════════════════════════════════════
  CURRENT TRADING PROCESSES
════════════════════════════════════════
```

Show the output. If no processes found, report:
"✓ No active trading processes detected"

## Step 4: Stop Current Instance

If processes were found in Step 3, execute this bash command:
```bash
pkill -f "python.*(launch_auto|start_live)" 2>/dev/null || echo "No processes to kill"
```

On Windows:
```bash
powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'python' -and $_.CommandLine -like '*trading*'} | Stop-Process -Force -ErrorAction SilentlyContinue"
```

Present with header:
```
════════════════════════════════════════
  STOPPING TRADING PROCESSES
════════════════════════════════════════
```

Report: "✓ Stopped existing trading processes"

## Step 5: Wait for Graceful Shutdown

Execute this bash command to wait 5 seconds:
```bash
sleep 5
```

Report to user:
"⏳ Waiting 5 seconds for graceful shutdown..."

## Step 6: Verify Stopped

Execute this bash command to verify no processes remain:
```bash
ps aux 2>/dev/null | grep -E "python.*(launch_auto|start_live)" | grep -v grep | wc -l
```

Present with header:
```
════════════════════════════════════════
  VERIFICATION - PROCESSES STOPPED
════════════════════════════════════════
```

If the count is 0, report:
"✓ All trading processes successfully stopped"

If count > 0, report:
"⚠ Warning: Some processes still running. Attempting force kill..."

And execute:
```bash
pkill -9 -f "python.*(launch_auto|start_live)" 2>/dev/null
```

## Step 7: Clean Lock Files

Execute this bash command to clean instance locks:
```bash
cd projects/crypto-enhanced && if [ -f clean_locks.py ]; then python clean_locks.py 2>&1; else echo "clean_locks.py not found"; fi
```

Present with header:
```
════════════════════════════════════════
  CLEANING LOCK FILES
════════════════════════════════════════
```

Show the output.

## Step 8: Launch Fresh Instance

Execute this bash command to start the trading system:
```bash
cd projects/crypto-enhanced && nohup .venv/Scripts/python.exe launch_auto.py >> launch.out 2>&1 &
```

On Linux/Mac:
```bash
cd projects/crypto-enhanced && nohup .venv/bin/python launch_auto.py >> launch.out 2>&1 &
```

Present with header:
```
════════════════════════════════════════
  LAUNCHING TRADING SYSTEM
════════════════════════════════════════
```

Report: "✓ Trading system started in background"

## Step 9: Wait for Initialization

Execute this bash command to wait 10 seconds:
```bash
sleep 10
```

Report to user:
"⏳ Waiting 10 seconds for system initialization..."

## Step 10: Verify Running

Execute this bash command to verify the process is running:
```bash
ps aux 2>/dev/null | grep -E "python.*(launch_auto|start_live)" | grep -v grep | wc -l
```

Present with header:
```
════════════════════════════════════════
  VERIFICATION - SYSTEM RUNNING
════════════════════════════════════════
```

If count is 1, report:
"✓ Trading system is running (1 instance)"

If count > 1, report:
"⚠ Warning: Multiple instances detected! This may cause issues."

If count is 0, report:
"✗ Error: Trading system failed to start. Check launch.out for errors."

## Step 11: Check Recent Logs

Execute this bash command to check recent logs:
```bash
cd projects/crypto-enhanced && if [ -f trading_new.log ]; then tail -30 trading_new.log; elif [ -f logs/trading.log ]; then tail -30 logs/trading.log; else echo "No log file found"; fi
```

Present with header:
```
════════════════════════════════════════
  RECENT TRADING LOGS (Last 30 lines)
════════════════════════════════════════
```

Show the log output.

## Step 12: Verify WebSocket Connection

Execute this bash command to check for WebSocket connection in logs:
```bash
cd projects/crypto-enhanced && if [ -f trading_new.log ]; then grep -i "websocket connected" trading_new.log | tail -2; elif [ -f logs/trading.log ]; then grep -i "websocket connected" logs/trading.log | tail -2; else echo "No WebSocket connection messages found"; fi
```

Present with header:
```
════════════════════════════════════════
  WEBSOCKET CONNECTION STATUS
════════════════════════════════════════
```

Show the output.

## Step 13: Final Summary

Provide comprehensive summary:
```
════════════════════════════════════════
  RESTART COMPLETE
════════════════════════════════════════

Post-Restart Checklist:
✓ Old processes stopped
✓ Lock files cleaned
✓ New instance started
✓ Logs accessible
✓ WebSocket connection verified

SYSTEM STATUS:
- Single instance running
- WebSocket connected to Kraken
- Receiving market data
- Strategies initialized

NEXT STEPS:
1. Monitor logs for 5 minutes: tail -f projects/crypto-enhanced/trading_new.log
2. Check system status: /crypto:status
3. Verify positions: /crypto:position-check
4. Review recent orders: /crypto:trading-status

SAFETY REMINDERS:
- Max position size: $10 per trade
- Max total exposure: $10
- Trading pair: XLM/USD only
- Monitor for errors in first hour after restart

════════════════════════════════════════
```

**IMPORTANT EXECUTION NOTES:**
- Execute each bash command using the Bash tool
- All commands run from C:\dev as base directory
- Wait for user confirmation if open positions or pending orders exist
- If any critical step fails, STOP and alert the user
- This is a financial trading system - safety is paramount
- Never proceed with restart if safety checks fail without explicit user confirmation
- Monitor logs carefully after restart for any errors
