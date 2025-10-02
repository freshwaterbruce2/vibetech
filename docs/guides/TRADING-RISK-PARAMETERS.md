# ⚠️ CRYPTO TRADING SYSTEM - ENHANCED RISK DOCUMENTATION

## 🚨 CRITICAL WARNING - READ FIRST

**THIS SYSTEM TRADES REAL MONEY ON KRAKEN EXCHANGE**
- Every order executed can result in financial loss
- Network issues, bugs, or misconfiguration can cause unexpected trades
- ALWAYS start with minimal position sizes
- NEVER trade more than you can afford to lose
- Test thoroughly in paper trading mode first (if available)

---

## 💰 Current Risk Parameters (Ultra-Conservative Mode)

### Position Sizing (Configured in config.py)
```python
max_position_size = $10      # Max USD per single position
max_total_exposure = $10     # Max USD across ALL positions
max_positions = 1            # Only 1 open position at a time
```

**Rationale for $10 Limits:**
- Testing phase - validating system reliability
- Account balance: $98.82 USD
- Preserves capital while proving system stability
- Can trade 9 times before significant capital depletion

### Balance Requirements
```python
min_balance_required = $15   # System stops if balance drops below this
min_balance_alert = $50      # Warning threshold
```

**Buffer Math:**
```
$10 position * 1.1 (fees/slippage buffer) = $11 required per trade
Current balance ($98.82) / $11 = ~8-9 safe trades before hitting min_balance
```

---

## 📊 Risk Calculation System

The `RiskManager` class uses a weighted risk score:

```python
risk_score = (
    current_positions / max_positions * 0.3 +      # 30% weight
    total_exposure / max_total_exposure * 0.5 +    # 50% weight  
    largest_position / max_position_size * 0.2     # 20% weight
)
```

**Risk Levels:**
- 0.0 - 0.3: **Low Risk** (green light for trading)
- 0.3 - 0.6: **Medium Risk** (caution, monitor closely)
- 0.6 - 0.8: **High Risk** (reduce positions)
- 0.8 - 1.0: **Maximum Risk** (system blocks new orders)

---

## 🎯 XLM/USD Specific Parameters

```python
xlm_min_order_size = 20 XLM         # Minimum viable order
xlm_price_range_min = $0.33         # Don't buy above this
xlm_price_range_max = $0.43         # Don't sell below this
xlm_stop_loss_price = $0.35         # Auto-exit if price drops here
xlm_take_profit_price = $0.41       # Auto-exit if price rises here
xlm_cooldown_minutes = 5            # Wait time between trades
```

**Why XLM?**
- Low price ($0.33-0.43) = more units per dollar
- High volatility = more trading opportunities
- Low fees on Kraken
- Fast transaction settlement

---

## 🔧 Adjusting Risk Parameters

### For Production Trading (When System Proven Stable):

1. **Increase Position Size Gradually:**
   ```python
   # In config.py or trading_config.json
   max_position_size = 50       # From $10 → $50
   max_total_exposure = 150     # From $10 → $150
   max_positions = 3            # From 1 → 3
   ```

2. **Maintain Safety Buffers:**
   ```python
   # NEVER exceed these ratios:
   max_position_size < 10% of account balance
   max_total_exposure < 30% of account balance
   min_balance_required > 2x max_position_size
   ```

3. **Progressive Scaling Example:**
   ```
   Testing Phase:    $10 positions, 1 position, $98 balance
   Phase 1:          $25 positions, 2 positions, $200 balance
   Phase 2:          $50 positions, 3 positions, $500 balance
   Phase 3:          $100 positions, 3 positions, $1000 balance
   ```

### Configuration Files:

**Option A: Edit `config.py`** (hardcoded defaults)
```python
self.max_position_size = 10  # Change this value
```

**Option B: Create `trading_config.json`** (recommended)
```json
{
  "risk_management": {
    "max_position_size": 10,
    "max_total_exposure": 10,
    "max_positions": 1,
    "max_risk_score": 0.6,
    "min_balance_required": 15
  }
}
```

---

## 🛡️ Safety Features Currently Active

### 1. **Balance Checking Before Every Order**
```python
# From RiskManager.approve_order()
required_balance = position_value * 1.1  # 10% buffer for fees
if usd_balance < required_balance:
    return False  # Reject order
```

### 2. **Multiple Nonce Keys** (Prevents API Conflicts)
```python
KRAKEN_API_KEY      # Primary for trading
KRAKEN_API_KEY_2    # Secondary for balance checks
```

### 3. **Nonce Using Nanoseconds** (Critical for 2025)
```python
# OLD (WRONG): microseconds
nonce = int(time.time() * 1000000)

# NEW (CORRECT): nanoseconds
nonce = int(time.time() * 1000000000)
```

### 4. **Stop Loss / Take Profit Auto-Exit**
```python
if price <= xlm_stop_loss_price:    # Exit at $0.35
    execute_sell_order()
    
if price >= xlm_take_profit_price:  # Exit at $0.41
    execute_sell_order()
```

### 5. **Cooldown Period** (Prevents Over-Trading)
```python
if last_trade_time < 5 minutes ago:
    skip_new_orders()
```

---

## 📈 Strategy Status (Current: INACTIVE)

**Configured Strategies:** 0
**Active Strategies:** 0

**Why No Strategies Running?**
- System architecture validated
- Risk management tested
- WebSocket connections stable
- Awaiting strategy configuration

**To Activate Strategies:**
```python
# In start_live_trading.py or trading_engine.py
strategies = [
    MomentumStrategy(config),
    MeanReversionStrategy(config)
]
engine.strategies = strategies
```

---

## 🚦 Pre-Trade Checklist

Before increasing position sizes or activating strategies:

- [ ] System has run for 24+ hours without errors
- [ ] WebSocket reconnection tested (manually disconnect/reconnect)
- [ ] Balance checking verified (check logs for approval/rejection messages)
- [ ] Stop loss triggers tested with manual price simulation
- [ ] Database logging confirmed (check trading.db for all orders)
- [ ] Nonce conflicts resolved (no "invalid nonce" errors in 24 hours)
- [ ] Risk score calculations validated (check logs during test trades)
- [ ] Email/SMS alerts configured (optional but recommended)

---

## 🔍 Monitoring Commands

```bash
# Check current risk status
sqlite3 trading.db "SELECT * FROM positions WHERE status='open';"

# View recent orders
sqlite3 trading.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;"

# Check balance history
tail -100 trading_new.log | grep "Balance"

# Monitor risk score
tail -100 trading_new.log | grep "Risk Score"

# Watch for stop loss triggers
tail -100 trading_new.log | grep "Stop Loss"
```

---

## 🆘 Emergency Shutdown

### If System Behaving Unexpectedly:

1. **Immediate Stop:**
   ```bash
   # Kill the process
   pkill -f start_live_trading.py
   
   # Or press Ctrl+C in terminal
   ```

2. **Cancel All Open Orders (Via Kraken UI):**
   - Login to https://www.kraken.com
   - Go to Orders → Open Orders
   - Click "Cancel All"

3. **Check Positions:**
   ```bash
   sqlite3 trading.db "SELECT * FROM positions WHERE status='open';"
   ```

4. **Manual Exit Positions (If Needed):**
   - Login to Kraken
   - Go to Trade → [Your Pair]
   - Manually sell to close positions

---

## 📚 Risk Management Resources

**Recommended Reading:**
- Van Tharp's "Trade Your Way to Financial Freedom" (position sizing)
- "The Psychology of Trading" by Brett Steenbarger
- Kraken's Risk Management Guide: https://support.kraken.com/hc/en-us/articles/227876608

**Risk Calculators:**
- Position Size Calculator: https://www.myfxbook.com/forex-calculators/position-size-calculator
- Kelly Criterion: https://www.investopedia.com/terms/k/kellycriterion.asp

---

## ⚙️ Configuration Reference

**All risk parameters live in these files:**

1. **config.py** - Default values (lines 24-35)
2. **trading_config.json** - Override defaults (if exists)
3. **.env** - API keys and environment settings

**To modify:**
```bash
# Option 1: Edit config.py directly
code projects/crypto-enhanced/config.py

# Option 2: Create trading_config.json
code projects/crypto-enhanced/trading_config.json

# Option 3: Environment variables (least recommended)
set MAX_POSITION_SIZE=50
```

---

**Last Updated:** October 1, 2025
**System Status:** Running, Strategies Inactive
**Current Balance:** $98.82 USD
**Risk Level:** ULTRA-CONSERVATIVE (Testing Phase)
