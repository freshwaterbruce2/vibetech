---
applyTo: 'projects/crypto-enhanced/**'
name: "Crypto Trading System"
description: "Security-critical instructions for the live cryptocurrency trading system"
---

## ⚠️ CRITICAL SAFETY WARNINGS

This system trades with **REAL MONEY** on the Kraken exchange. Exercise extreme caution.

### Before Making Any Changes

1. **ALWAYS** check system status: `python check_status.py`
2. **NEVER** modify code while trades are active
3. **VERIFY** tests pass before deploying: `python run_tests.py`
4. **BACKUP** the database before schema changes: `sqlite3 trading.db ".backup backup.db"`

## Core Principles

### Financial Safety First
- Maximum position size: $10 per trade
- Maximum total exposure: $10 (1 position limit)
- Trading pair: XLM/USD only
- All order operations require explicit confirmation

### Code Requirements
- 90%+ test coverage for trading logic
- All async operations must have timeouts
- Circuit breakers for API failures
- Comprehensive error logging

## Python Best Practices

### Async Patterns (Python 3.11+)
```python
# USE TaskGroups for structured concurrency
async with asyncio.TaskGroup() as tg:
    task1 = tg.create_task(fetch_ticker())
    task2 = tg.create_task(check_balance())

# USE timeouts with context managers
async with asyncio.timeout(30):
    await websocket_manager.connect()

# AVOID asyncio.wait_for() - use timeout() instead
```

### Nonce Management
```python
# CRITICAL: Use NANOSECONDS (not microseconds)
nonce = int(time.time() * 1000000000)

# Pattern: Separate API keys for trading vs status checks
# to avoid nonce collisions
```

### WebSocket V2 Integration
- Token-based authentication required
- Auto-reconnection with exponential backoff
- Heartbeat monitoring every 30 seconds
- Clean shutdown using context managers

## Testing Requirements

### Must Test Before Commit
```bash
# Run full test suite
python run_tests.py

# Check coverage
pytest --cov=. --cov-report=html

# Verify API connectivity
python test_api_status.py
```

### Test Priority Areas
1. `kraken_client.py` - API error handling, nonce management
2. `strategies.py` - Trading decision logic
3. `trading_engine.py` - Position management, shutdown logic
4. `database.py` - Transaction integrity, WAL mode

## Database Operations

### SQLite with WAL Mode
```bash
# Check orders
sqlite3 trading.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"

# Check positions
sqlite3 trading.db "SELECT * FROM positions WHERE status='open';"

# Backup before changes
sqlite3 trading.db ".backup backup_$(date +%Y%m%d_%H%M%S).db"
```

### Schema Changes
1. Create migration script in `migrations/`
2. Test on copy of production database first
3. Backup production database
4. Apply migration with transaction rollback capability

## Common Issues

### Nonce Errors
- **Cause**: Using microseconds instead of nanoseconds
- **Fix**: `int(time.time() * 1000000000)`
- **Prevention**: Use separate API keys for different operations

### WebSocket Disconnects
- Initial disconnect warnings are normal
- Auto-reconnection handles temporary network issues
- Check `logs/trading.log` for persistent connection problems

### Database Locks
- WAL mode prevents most lock issues
- Use separate connections for reads and writes
- Never hold transactions open during long operations

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Coverage ≥ 90% for core modules
- [ ] Database backed up
- [ ] API keys in environment variables (never in code)
- [ ] Risk parameters validated in `config.py`

### Post-Deployment
- [ ] Monitor first 10 trades closely
- [ ] Check `SESSION_STATUS.md` for system health
- [ ] Verify WebSocket connections stable
- [ ] Confirm position limits enforced

## Emergency Procedures

### Stop Trading Immediately
```bash
# Kill trading process
pkill -f "python start_live_trading.py"

# Or use the graceful shutdown
python stop_trading.py
```

### Investigate Issues
```bash
# Check recent orders
python check_orders.py

# View system status
python check_status.py

# Analyze trades
python analyze_trades.py
```

## Key Files

- `config.py` - Risk parameters and system configuration
- `kraken_client.py` - REST API client with rate limiting
- `websocket_manager.py` - WebSocket V2 real-time data
- `trading_engine.py` - Strategy execution and position management
- `database.py` - SQLite persistence with WAL mode
- `start_live_trading.py` - Main entry point (requires YES confirmation)
- `SESSION_STATUS.md` - Current system status and balance
