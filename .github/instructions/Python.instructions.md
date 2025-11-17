---
applyTo: 'projects/crypto-enhanced/**/*.py'
---

## Python Crypto Trading System Guidelines

⚠️ **CRITICAL**: This system trades with REAL MONEY on the Kraken exchange.

### Async Best Practices (Python 3.11+)

#### Use TaskGroups for Structured Concurrency
```python
# ✅ Correct
async with asyncio.TaskGroup() as tg:
    tg.create_task(task1())
    tg.create_task(task2())
# All tasks complete or one fails

# ❌ Incorrect
asyncio.create_task(task1())  # Fire and forget
```

#### Use Timeouts with Context Manager
```python
# ✅ Correct
async with asyncio.timeout(10.0):
    await operation()

# ❌ Incorrect
await asyncio.wait_for(operation(), 10.0)
```

#### WebSocket Lifecycle
```python
# ✅ Correct
async with websocket_manager as ws:
    await ws.subscribe()
    async for message in ws:
        process(message)
```

### Nonce Management

**CRITICAL**: Kraken requires monotonically increasing nonces.

```python
# ✅ Correct - Use NANOSECONDS
nonce = int(time.time() * 1000000000)

# ❌ Incorrect - Don't use microseconds
nonce = int(time.time() * 1000000)
```

**Pattern**: Use separate API keys for trading vs status checks to avoid nonce collisions.

### Error Handling

#### Circuit Breaker Pattern
The `kraken_client.py` implements a circuit breaker to prevent cascading failures:
- Tracks consecutive failures
- Opens circuit after threshold
- Automatically recovers after cooldown

#### Graceful Degradation
```python
try:
    result = await critical_operation()
except KrakenAPIError as e:
    logger.error(f"API error: {e}")
    # Fallback or safe state
except Exception as e:
    logger.exception("Unexpected error")
    # Emergency shutdown if needed
```

### Database Operations

#### SQLite with WAL Mode
```python
# Database is configured with WAL mode for better concurrency
# Use separate connections for read/write operations

# ✅ Correct
with sqlite3.connect('trading.db') as conn:
    conn.execute("PRAGMA journal_mode=WAL")
    # ... operations
```

### Risk Management

#### Configuration Limits
- Max position size: $10
- Single trading pair: XLM/USD
- One position at a time
- Never override these limits without explicit approval

#### Pre-Trade Validation
```python
# Always validate before placing orders
if position_size > MAX_POSITION_SIZE:
    raise RiskLimitExceeded("Position size exceeds limit")

if active_positions >= MAX_POSITIONS:
    raise RiskLimitExceeded("Maximum positions reached")
```

### Testing

#### Use pytest with async support
```bash
# Run all tests
.venv\Scripts\python.exe run_tests.py

# Run with coverage
.venv\Scripts\python.exe -m pytest --cov=. --cov-report=html
```

#### Mock external APIs
```python
@pytest.mark.asyncio
async def test_trading_logic(mock_kraken_client):
    # Use mocks to avoid real API calls in tests
    mock_kraken_client.get_balance.return_value = {"USD": 100.0}
    # ... test logic
```

### Logging

Use structured logging with appropriate levels:
```python
import logging

logger = logging.getLogger(__name__)

logger.info("Normal operation", extra={"balance": balance})
logger.warning("Threshold exceeded", extra={"value": value})
logger.error("Operation failed", exc_info=True)
```

### Security

- **NEVER** commit API keys to version control
- Use environment variables: `KRAKEN_API_KEY`, `KRAKEN_API_SECRET`
- Store in `.env` file (added to `.gitignore`)
- Use separate API keys for testing and production
