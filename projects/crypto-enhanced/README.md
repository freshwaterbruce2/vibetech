# 🚀 Aggressive XLM Trading Bot

**LIVE TRADING BOT** - Kraken Exchange - Market Orders Only

## 🎯 Current Configuration

- **Strategy**: Momentum-based aggressive trading
- **Buy Signal**: +0.2% momentum (fast entries)
- **Profit Target**: 2% gross (1.2% net after fees)
- **Stop Loss**: -0.3% momentum (tight risk control)
- **Trade Size**: $7 per trade (~22 XLM)
- **Fees**: 0.4% per trade (0.8% round-trip)

## 💰 Balance

- **USD**: Check with `python bot_status.py`
- **Trading Pair**: XLM/USD
- **Minimum**: 20 XLM per trade

## 🚀 Quick Start

### Start Trading
```cmd
cd C:\dev\projects\crypto-enhanced
start_aggressive_bot.bat
```

Or:
```cmd
.venv\Scripts\python.exe ultra_simple_bot.py
```

### Monitor Activity
```cmd
# Check status
python bot_status.py

# View logs
type ultra_simple.log

# Live log monitoring
Get-Content ultra_simple.log -Tail 15 -Wait
```

### Stop Trading
Press **Ctrl+C** in bot window

## 📁 Key Files

### Core Bot Files
- `ultra_simple_bot.py` - Main trading bot (AGGRESSIVE MODE)
- `kraken_client.py` - Kraken API client
- `nonce_manager.py` - API nonce handling
- `errors_simple.py` - Error definitions

### Configuration
- `.env` - API credentials (NEVER commit!)
- `nonce_state.json` - Nonce state persistence
- `trading.db` - Trade history database

### Utilities
- `bot_status.py` - Quick status checker
- `start_aggressive_bot.bat` - Easy launcher
- `AGGRESSIVE_BOT_READY.md` - Full documentation

### Legacy (Not Used by Current Bot)
- `trading_engine.py` - Old complex engine
- `strategies.py` - Old strategy implementations
- `websocket_manager.py` - WebSocket handling (not used in simple bot)
- `circuit_breaker.py` - Safety mechanism (not used in simple bot)
- `start_live_trading.py` - Old launcher

## ⚙️ How It Works

1. **Every 60 seconds**:
   - Fetches current XLM price
   - Calculates 10-minute momentum
   - Checks buy/sell conditions

2. **BUY Logic**:
   ```
   IF momentum > +0.2% AND no position:
     → BUY ~22 XLM ($7)
   ```

3. **SELL Logic**:
   ```
   IF holding position:
     IF profit >= 2% OR momentum < -0.3%:
       → SELL all XLM
   ```

## 📊 Expected Performance

- **Trades per hour**: 2-5
- **Win rate**: ~60%
- **Average profit**: 1.2% net per winning trade
- **Average loss**: -1.1% per losing trade (stop-loss)

## ⚠️ Safety Features

- ✅ Market orders (guaranteed fills)
- ✅ Minimum trade size validation
- ✅ Fee-aware profit calculations
- ✅ Stop-loss at -0.3% momentum
- ✅ Nonce management (prevents API errors)
- ✅ Balance validation before trades

## 🔧 Configuration Options

Edit `ultra_simple_bot.py` to adjust:

```python
# Line ~192: Trade size
trade_amount = 7.0  # Increase for larger trades

# Line ~191: Buy threshold
if momentum > 0.2:  # Lower = more aggressive

# Line ~217: Profit target
if gross_profit_pct > 2.0:  # Higher = wait for bigger gains

# Line ~217: Stop loss
if momentum < -0.3:  # Higher (less negative) = tighter stops
```

## 📝 Logs

All activity logged to `ultra_simple.log`:

```
2025-10-18 21:02:28 - [BUY] AGGRESSIVE BUY 22.4 XLM at $0.3123 ($7.00)
2025-10-18 21:15:43 - [SELL] AGGRESSIVE SELL (PROFIT TARGET) 22.4 XLM at $0.3186 | Gross: +2.02% | Net: +1.22%
```

## 🛑 Troubleshooting

### Bot Won't Start
- Check Python: `.venv\Scripts\python.exe --version`
- Check dependencies: `pip install -r requirements.txt --break-system-packages`
- Check API keys in `.env`

### Trades Not Executing
- Verify balance > $7 USD
- Check Kraken API status
- Review logs for errors

### "Insufficient volume" Error
- Increase `trade_amount` in code
- Ensure you have enough USD

## 📚 Documentation

- **Full Guide**: `AGGRESSIVE_BOT_READY.md`
- **This File**: Quick reference
- **Logs**: `ultra_simple.log`

## ⚡ Performance Monitoring

Track your results:
```cmd
# View trade history
python -c "import sqlite3; con=sqlite3.connect('trading.db'); print(con.execute('SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10').fetchall())"
```

## 🔐 Security

- ⚠️ **NEVER** commit `.env` file
- ⚠️ Keep API keys secret
- ⚠️ Use read-only keys when possible
- ✅ `.gitignore` configured properly

---

**Current Status**: AGGRESSIVE MODE - Ready to Trade! 🚀

Last Updated: 2025-10-18
