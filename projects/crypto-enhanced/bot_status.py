"""Quick status check for the trading bot"""
import subprocess
import os

print("="*60)
print("TRADING BOT STATUS CHECK")
print("="*60)

# Check if bot is running
result = subprocess.run(
    ['powershell', 'Get-Process | Where-Object {$_.ProcessName -like "*python*" -and $_.CommandLine -like "*ultra_simple_bot*"} | Select-Object Id, StartTime'],
    capture_output=True,
    text=True
)

if "python" in result.stdout.lower():
    print("✓ Bot is RUNNING")
else:
    print("✗ Bot is NOT running")

# Show last 5 log lines
print("\n--- LAST 5 LOG ENTRIES ---")
if os.path.exists('ultra_simple.log'):
    with open('ultra_simple.log', 'r') as f:
        lines = f.readlines()
        for line in lines[-5:]:
            print(line.strip())
else:
    print("No log file found")

print("\n" + "="*60)
print("To view live logs: tail -f ultra_simple.log")
print("To stop bot: taskkill /F /IM python.exe (or Ctrl+C in its window)")
print("="*60)
