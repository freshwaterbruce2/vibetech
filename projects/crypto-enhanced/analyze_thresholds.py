import re
from collections import Counter

# Read log file with error handling
with open('ultra_simple.log', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Extract today's data
today_lines = [line for line in lines if '2025-10-19' in line and 'Momentum:' in line]

prices = []
momentums = []

for line in today_lines:
    price_match = re.search(r'Price: \$(\d+\.\d+)', line)
    momentum_match = re.search(r'Momentum: ([+-]\d+\.\d+)%', line)
    
    if price_match and momentum_match:
        prices.append(float(price_match.group(1)))
        momentums.append(float(momentum_match.group(1)))

if not momentums:
    print("No data found for today")
    exit()

print("=" * 70)
print("MARKET VOLATILITY ANALYSIS - October 19, 2025")
print("=" * 70)

print(f"\nDATA SUMMARY:")
print(f"  Total samples: {len(momentums)}")
print(f"  Price range: ${min(prices):.4f} - ${max(prices):.4f}")
print(f"  Daily range: {((max(prices)-min(prices))/min(prices)*100):.2f}%")
print(f"  Momentum range: {min(momentums):+.2f}% to {max(momentums):+.2f}%")

print(f"\nMOMENTUM THRESHOLD ANALYSIS:")
print("-" * 70)

# Analyze different thresholds
thresholds = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]
for thresh in thresholds:
    count = len([m for m in momentums if m >= thresh])
    pct = count / len(momentums) * 100
    print(f"  >= +{thresh:.2f}% momentum: {count:4d} times ({pct:5.1f}%) {'<-- CURRENT BUY' if thresh == 0.2 else ''}")

print(f"\nNEGATIVE MOMENTUM (Stop Loss Analysis):")
print("-" * 70)
neg_thresholds = [-0.1, -0.2, -0.3, -0.4, -0.5]
for thresh in neg_thresholds:
    count = len([m for m in momentums if m <= thresh])
    pct = count / len(momentums) * 100
    print(f"  <= {thresh:+.2f}% momentum: {count:4d} times ({pct:5.1f}%) {'<-- CURRENT STOP' if thresh == -0.3 else ''}")

# Calculate average momentum when above threshold
above_02 = [m for m in momentums if m >= 0.2]
above_01 = [m for m in momentums if m >= 0.1]

print(f"\nAVERAGE MOMENTUM WHEN TRIGGERED:")
if above_01:
    print(f"  At +0.1% threshold: Avg = {sum(above_01)/len(above_01):+.3f}%")
if above_02:
    print(f"  At +0.2% threshold: Avg = {sum(above_02)/len(above_02):+.3f}%")

# Check how long momentum stays above threshold
print(f"\nMOMENTUM PERSISTENCE:")
consecutive_above_02 = 0
max_consecutive = 0
current_streak = 0

for m in momentums:
    if m >= 0.2:
        current_streak += 1
        max_consecutive = max(max_consecutive, current_streak)
    else:
        current_streak = 0

print(f"  Max consecutive periods >= +0.2%: {max_consecutive} minutes")

# Trade opportunity analysis
print("\n" + "=" * 70)
print("TRADING OPPORTUNITY ANALYSIS")
print("=" * 70)

buy_signals = len([m for m in momentums if m >= 0.2])
print(f"\nWith CURRENT settings (+0.2% buy, -0.3% stop):")
print(f"  Potential buy signals today: {buy_signals}")
print(f"  Trading frequency: Every {len(momentums)//buy_signals if buy_signals > 0 else 0} minutes")

# More aggressive
buy_signals_aggressive = len([m for m in momentums if m >= 0.1])
print(f"\nWith AGGRESSIVE settings (+0.1% buy):")
print(f"  Potential buy signals today: {buy_signals_aggressive}")
print(f"  Trading frequency: Every {len(momentums)//buy_signals_aggressive if buy_signals_aggressive > 0 else 0} minutes")

# More conservative
buy_signals_conservative = len([m for m in momentums if m >= 0.3])
print(f"\nWith CONSERVATIVE settings (+0.3% buy):")
print(f"  Potential buy signals today: {buy_signals_conservative}")
print(f"  Trading frequency: Every {len(momentums)//buy_signals_conservative if buy_signals_conservative > 0 else 0} minutes")

print("\n" + "=" * 70)
print("RECOMMENDATION")
print("=" * 70)

volatility_pct = ((max(prices)-min(prices))/min(prices)*100)

if volatility_pct < 2.0:
    print("\n⚠️  LOW VOLATILITY MARKET (<2% daily range)")
    print("\nCurrent +0.2% threshold may be TOO CONSERVATIVE for this flat market.")
    print(f"Only {buy_signals} buy opportunities in {len(momentums)} minutes ({buy_signals/len(momentums)*100:.1f}%)")
    print("\nSuggested adjustments:")
    print("  1. Lower buy threshold to +0.1% or +0.15% for more trades")
    print("  2. Accept lower profit targets (1.5% instead of 2%)")
    print("  3. OR wait for more volatile market conditions")
else:
    print("\n✅ NORMAL/HIGH VOLATILITY")
    print("\nCurrent settings appear appropriate for this market.")
