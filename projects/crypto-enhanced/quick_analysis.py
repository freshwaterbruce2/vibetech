import re
from datetime import datetime

# Read log
with open('ultra_simple.log', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Extract today's data
today = [l for l in lines if '2025-10-19' in l and 'Momentum:' in l]

prices = []
momentums = []
timestamps = []

for line in today:
    price_match = re.search(r'Price: \$([\d.]+)', line)
    momentum_match = re.search(r'Momentum: ([+-][\d.]+)%', line)
    time_match = re.search(r'2025-10-19 (\d+:\d+:\d+)', line)
    
    if price_match and momentum_match:
        prices.append(float(price_match.group(1)))
        momentums.append(float(momentum_match.group(1)))
        if time_match:
            timestamps.append(time_match.group(1))

if not momentums:
    print("No data found")
    exit()

print("=" * 70)
print("📊 MARKET ANALYSIS - October 19, 2025")
print("=" * 70)

# Market conditions
min_price = min(prices)
max_price = max(prices)
daily_range_pct = (max_price - min_price) / min_price * 100
current_price = prices[-1]

print(f"\n💰 PRICE ACTION:")
print(f"  Current: ${current_price:.4f}")
print(f"  Range: ${min_price:.4f} - ${max_price:.4f}")
print(f"  Daily volatility: {daily_range_pct:.2f}%")

# Momentum analysis
min_mom = min(momentums)
max_mom = max(momentums)

print(f"\n📈 MOMENTUM RANGE:")
print(f"  Min: {min_mom:+.2f}%")
print(f"  Max: {max_mom:+.2f}%")
print(f"  Current: {momentums[-1]:+.2f}%")

# Threshold analysis
print(f"\n🎯 THRESHOLD EFFECTIVENESS:")
thresholds = [
    (0.1, "Aggressive"),
    (0.15, "Moderate"),
    (0.2, "CURRENT"),
    (0.25, "Conservative"),
    (0.3, "Very Conservative")
]

for thresh, label in thresholds:
    count = len([m for m in momentums if m >= thresh])
    pct = count / len(momentums) * 100
    marker = " <-- YOUR SETTING" if label == "CURRENT" else ""
    print(f"  {label:18s} (+{thresh:.2f}%): {count:4d} signals ({pct:5.1f}%){marker}")

# Stop loss analysis
print(f"\n🛑 STOP LOSS TRIGGERS (-0.3%):")
stop_count = len([m for m in momentums if m <= -0.3])
stop_pct = stop_count / len(momentums) * 100
print(f"  Would trigger: {stop_count} times ({stop_pct:.1f}%)")

# Profitability estimate
print(f"\n💵 PROFITABILITY ANALYSIS:")
print(f"  Current Settings:")
print(f"    • Buy threshold: +0.2% momentum")
print(f"    • Profit target: +2.0% (net 1.2% after 0.8% fees)")
print(f"    • Stop loss: -0.3% momentum")
print(f"    • Position size: $7-10")

buy_signals = len([m for m in momentums if m >= 0.2])
hours_of_data = len(momentums) / 60  # Assuming ~1 minute samples

print(f"\n  Opportunity Count:")
print(f"    • Buy signals today: {buy_signals}")
print(f"    • Hours monitored: {hours_of_data:.1f}h")
print(f"    • Signals per hour: {buy_signals/hours_of_data if hours_of_data > 0 else 0:.1f}")

# Calculate expected value
if buy_signals > 0:
    avg_time_between = len(momentums) / buy_signals
    print(f"    • Time between signals: {avg_time_between:.0f} minutes")

print(f"\n⚠️  RECOMMENDATION:")
if daily_range_pct < 2.0:
    print(f"  🔴 LOW VOLATILITY MARKET ({daily_range_pct:.2f}% daily range)")
    print(f"  • Only {buy_signals} opportunities in {len(momentums)} minutes")
    print(f"  • That's 1 signal every {len(momentums)//buy_signals if buy_signals > 0 else 999} minutes!")
    print(f"\n  💡 SUGGESTED ADJUSTMENTS:")
    print(f"    1. Lower buy threshold to +0.1% (would give {len([m for m in momentums if m >= 0.1])} signals)")
    print(f"    2. Accept smaller profit targets (1.5% instead of 2%)")
    print(f"    3. Reduce position size to $5 for more trades")
    print(f"    4. OR wait for higher volatility market (>2% daily range)")
else:
    print(f"  ✅ NORMAL VOLATILITY ({daily_range_pct:.2f}%)")
    print(f"  • Current settings look reasonable")
    print(f"  • {buy_signals} opportunities is acceptable")

print("\n" + "=" * 70)
