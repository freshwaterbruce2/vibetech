"""
Quick performance checker for optimized bot
Shows: trades executed, win rate, profit/loss
"""
import re
from datetime import datetime
from collections import defaultdict

print("=" * 70)
print("OPTIMIZED BOT - PERFORMANCE CHECK")
print("=" * 70)

# Read today's log entries
with open('ultra_simple.log', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

today = datetime.now().strftime('%2025-10-19')
today_lines = [l for l in lines if today in l]

# Find optimization start time
opt_start = None
for line in today_lines:
    if 'OPTIMIZED BOT' in line or 'Adapted for Low-Volatility' in line:
        match = re.search(r'(\d{2}:\d{2}:\d{2})', line)
        if match:
            opt_start = match.group(1)
            break

if opt_start:
    print(f"\n📅 Bot optimized at: {opt_start}")
    # Filter to only post-optimization lines
    opt_lines = [l for l in today_lines if re.search(r'(\d{2}:\d{2}:\d{2})', l) and 
                 re.search(r'(\d{2}:\d{2}:\d{2})', l).group(1) >= opt_start]
else:
    print("\n⚠️  Optimization not detected yet. Showing all today's data.")
    opt_lines = today_lines

# Extract trades
buys = [l for l in opt_lines if '[BUY]' in l]
sells = [l for l in opt_lines if '[SELL]' in l]

print(f"\n📊 TRADE SUMMARY (Since Optimization):")
print(f"  Buys:  {len(buys)}")
print(f"  Sells: {len(sells)}")
print(f"  Open positions: {len(buys) - len(sells)}")

# Calculate wins/losses
wins = []
losses = []
for sell_line in sells:
    profit_match = re.search(r'Profit: ([+-]\$[\d.]+)', sell_line)
    if profit_match:
        profit_str = profit_match.group(1).replace('$', '')
        profit = float(profit_str)
        if profit > 0:
            wins.append(profit)
        else:
            losses.append(abs(profit))

print(f"\n💰 PROFIT/LOSS:")
if wins or losses:
    total_trades = len(wins) + len(losses)
    total_profit = sum(wins) - sum(losses)
    win_rate = len(wins) / total_trades * 100 if total_trades > 0 else 0
    
    print(f"  Wins: {len(wins)} trades (+${sum(wins):.2f})")
    print(f"  Losses: {len(losses)} trades (-${sum(losses):.2f})")
    print(f"  Net Profit: ${total_profit:+.2f}")
    print(f"  Win Rate: {win_rate:.1f}%")
    
    if total_trades > 0:
        avg_win = sum(wins) / len(wins) if wins else 0
        avg_loss = sum(losses) / len(losses) if losses else 0
        print(f"\n  Avg Win: ${avg_win:.2f}")
        print(f"  Avg Loss: ${avg_loss:.2f}")
        
        if avg_loss > 0:
            risk_reward = avg_win / avg_loss
            print(f"  Risk-Reward Ratio: 1:{risk_reward:.2f}")
else:
    print("  No completed trades yet.")

# Check current momentum
current_momentum = None
for line in reversed(opt_lines):
    match = re.search(r'Momentum: ([+-][\d.]+)%', line)
    if match:
        current_momentum = float(match.group(1))
        break

if current_momentum is not None:
    print(f"\n📈 CURRENT STATUS:")
    print(f"  Latest Momentum: {current_momentum:+.2f}%")
    
    if current_momentum >= 0.1:
        print(f"  ✅ BUY SIGNAL! (≥ +0.1%)")
    elif current_momentum <= -0.2:
        print(f"  🛑 STOP LOSS ZONE! (≤ -0.2%)")
    else:
        print(f"  ⏳ Waiting for signal...")
        needed = 0.1 - current_momentum
        print(f"     Need +{needed:.2f}% more for buy signal")

# Estimate time to next opportunity
if len(buys) > 0:
    total_minutes = len(opt_lines)
    minutes_per_trade = total_minutes / len(buys)
    print(f"\n⏱️  TRADE FREQUENCY:")
    print(f"  Average time between trades: {minutes_per_trade:.0f} minutes")
    print(f"  Daily trade estimate: {1440/minutes_per_trade:.0f} trades")

print("\n" + "=" * 70)
print("TIP: Run this script anytime to check bot performance!")
print("     Or watch live: Get-Content ultra_simple.log -Tail 20 -Wait")
print("=" * 70)
