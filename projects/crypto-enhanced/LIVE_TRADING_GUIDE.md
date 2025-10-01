# Live Trading Guide - Crypto Enhanced Trading System

## ⚠️ IMPORTANT: LIVE TRADING RISKS

**WARNING**: Live trading involves REAL MONEY and carries substantial risk. You can lose your entire investment. Only trade with money you can afford to lose.

## Prerequisites

### 1. Kraken Account Setup
- [ ] Verified Kraken account
- [ ] API key with trading permissions
- [ ] Sufficient balance in your account
- [ ] 2FA enabled for security

### 2. API Key Configuration
1. Log into Kraken
2. Go to Settings → API
3. Create new API key with permissions:
   - Query Funds
   - Query Open/Closed Orders
   - Create/Modify Orders
   - Cancel Orders
4. Save the API key and secret securely

### 3. Configure Environment
Edit `.env` file with your credentials:
```env
KRAKEN_API_KEY=your_actual_api_key
KRAKEN_API_SECRET=your_actual_api_secret
```

## Risk Management Settings

### Conservative Settings (Recommended for Start)
```env
MAX_POSITION_SIZE=30        # $30 per trade
MAX_TOTAL_EXPOSURE=90       # $90 total at risk
MAX_POSITIONS=3             # 3 concurrent positions max
```

### Moderate Settings
```env
MAX_POSITION_SIZE=100       # $100 per trade
MAX_TOTAL_EXPOSURE=500      # $500 total at risk
MAX_POSITIONS=5             # 5 concurrent positions max
```

### Aggressive Settings (Experienced Only)
```env
MAX_POSITION_SIZE=500       # $500 per trade
MAX_TOTAL_EXPOSURE=2000     # $2000 total at risk
MAX_POSITIONS=10            # 10 concurrent positions max
```

## Strategy Configuration

### Single Strategy (Safest)
```env
ENABLE_MOMENTUM=true
ENABLE_MEAN_REVERSION=false
ENABLE_ARBITRAGE=false
```

### Dual Strategy (Balanced)
```env
ENABLE_MOMENTUM=true
ENABLE_MEAN_REVERSION=true
ENABLE_ARBITRAGE=false
```

### All Strategies (Most Active)
```env
ENABLE_MOMENTUM=true
ENABLE_MEAN_REVERSION=true
ENABLE_ARBITRAGE=true
```

## Trading Pairs

### Low Risk - Stablecoins & Major Cryptos
```env
TRADING_PAIRS=XBT/USD,ETH/USD
```

### Medium Risk - Established Altcoins
```env
TRADING_PAIRS=XLM/USD,ADA/USD,DOT/USD
```

### High Risk - Volatile Altcoins
```env
TRADING_PAIRS=DOGE/USD,SHIB/USD,AVAX/USD
```

## Starting Live Trading

### Step 1: Test Connection First
```bash
cd /c/dev/projects/crypto-enhanced
.venv/Scripts/python.exe launch.py test
```

### Step 2: Check Account Balance
```bash
.venv/Scripts/python.exe check_orders.py
```

### Step 3: Start Live Trading
```bash
# Method 1: Using the dedicated live trading script
.venv/Scripts/python.exe start_live_trading.py

# Method 2: Using the launch script
.venv/Scripts/python.exe launch.py live

# Method 3: Direct execution
.venv/Scripts/python.exe main.py
```

## Monitoring Your Trading

### Real-time Logs
```bash
# Watch latest log file
tail -f logs/live_trading_*.log

# Check for errors
grep ERROR logs/live_trading_*.log

# Monitor trades
grep "order" logs/live_trading_*.log
```

### Database Queries
```bash
# Open trading database
sqlite3 trading.db

# View recent trades
SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10;

# Check performance
SELECT COUNT(*) as total_trades,
       SUM(profit) as total_profit
FROM trades;

# Exit sqlite
.quit
```

## Stop Trading

### Graceful Shutdown
Press `Ctrl+C` once and wait for:
```
⚠️  Shutting down trading system...
✅ System shutdown complete
```

### Emergency Stop
Press `Ctrl+C` twice to force immediate shutdown

## Safety Checklist

### Before Starting
- [ ] API credentials configured correctly
- [ ] Risk limits set appropriately
- [ ] Sufficient balance in account
- [ ] Test mode verified working
- [ ] Backup of configuration files

### While Running
- [ ] Monitor logs regularly
- [ ] Check positions don't exceed limits
- [ ] Verify orders are executing
- [ ] Watch for error messages
- [ ] Monitor account balance

### Daily Checks
- [ ] Review profit/loss
- [ ] Check for failed orders
- [ ] Verify strategy performance
- [ ] Adjust risk parameters if needed
- [ ] Backup database file

## Troubleshooting

### Connection Issues
```bash
# Test API connection
.venv/Scripts/python.exe test_api_status.py

# Check network
ping api.kraken.com
```

### Order Failures
- Check account balance
- Verify API permissions
- Review order size limits
- Check rate limiting

### High Losses
1. Stop trading immediately (Ctrl+C)
2. Review logs for issues
3. Analyze failed trades
4. Adjust strategy parameters
5. Consider reducing position sizes

## Performance Tuning

### Optimize for Speed
```env
ENGINE_LOOP_INTERVAL=5      # Faster checking (5 seconds)
WS_RECONNECT_INTERVAL=2     # Faster reconnection
```

### Optimize for Stability
```env
ENGINE_LOOP_INTERVAL=60     # Slower checking (60 seconds)
WS_RECONNECT_INTERVAL=10    # More stable reconnection
```

### Optimize for Low Fees
```env
DEFAULT_ORDER_TYPE=limit    # Use limit orders
SLIPPAGE_TOLERANCE=0.001    # Tight slippage control
```

## Important Commands

```bash
# Start live trading
.venv/Scripts/python.exe start_live_trading.py

# Check system status
.venv/Scripts/python.exe launch.py status

# View recent trades
.venv/Scripts/python.exe check_orders.py

# Run tests
.venv/Scripts/python.exe run_tests.py

# Clean old logs
rm logs/*.log
```

## Emergency Contacts

- **Kraken Support**: https://support.kraken.com
- **API Status**: https://status.kraken.com
- **System Issues**: Check logs/trading.log

## Disclaimer

This trading system is provided as-is without warranty. Trading cryptocurrency involves substantial risk. Past performance does not guarantee future results. Always do your own research and never invest more than you can afford to lose.

---
*Last Updated: September 27, 2025*