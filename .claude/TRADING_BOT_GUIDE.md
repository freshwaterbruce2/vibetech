# Trading Bot Safety Guide

## ⚠️ CRITICAL WARNING

This is a **LIVE CRYPTOCURRENCY TRADING SYSTEM** that trades with **REAL MONEY** on the Kraken Exchange.

**Current Status**: 
- **ACTIVELY TRADING**: XLM/USD pair
- **Balance**: ~$98.82 USD
- **Location**: `C:\dev\projects\crypto-enhanced\`

**Any mistakes in this code can result in financial loss. Treat with extreme caution.**

---

## 🚨 Safety Protocols

### Before ANY Changes

1. **Understand Current State**
   ```powershell
   cd C:\dev\projects\crypto-enhanced
   .venv\Scripts\activate
   python simple_status.py  # Check if bot is running
   ```

2. **Read Recent Logs**
   ```powershell
   Get-Content trading_new.log -Tail 100
   ```

3. **Check Database State**
   ```powershell
   sqlite3 trading.db "SELECT * FROM trades WHERE status='OPEN';"
   ```

4. **Verify Risk Parameters**
   ```python
   # In config.py or trading_engine.py
   MAX_TRADE_SIZE = 10.0  # USD
   MAX_TOTAL_EXPOSURE = 10.0  # USD
   ALLOWED_PAIRS = ["XLM/USD"]
   ```

### Change Categories

#### ✅ Low Risk (Can Proceed with Testing)
- Adding logging statements
- Improving error messages
- Documentation updates
- Adding new tests (without changing code)
- Performance optimizations (after thorough testing)

#### ⚠️ Medium Risk (Proceed with Caution)
- Changing trading logic
- Modifying order parameters
- Updating configuration values
- Changing database schemas
- Altering WebSocket handling

#### 🛑 High Risk (ASK FIRST)
- Changing risk parameters
- Modifying order execution code
- Changing Kraken API authentication
- Database migration without backup
- Removing circuit breaker logic
- Changing nonce management

---

## 🏗️ Architecture Deep Dive

### Core Philosophy
**Async Everything** - No blocking operations in the event loop

```python
# GOOD ✅
async def fetch_price():
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# BAD ❌
def fetch_price():
    response = requests.get(url)  # Blocks event loop!
    return response.json()
```

### Component Interaction Flow

```
┌─────────────────────┐
│  start_live_trading │ (Entry point)
└──────────┬──────────┘
           │
           ├─> instance_lock.py (Ensure single instance)
           │
           ├─> config.py (Load .env with Pydantic)
           │
           ├─> database.py (Initialize SQLite connection)
           │
           ├─> nonce_manager.py (Initialize API nonce state)
           │
           ├─> kraken_client.py (REST API client)
           │   └─> Rate limiting
           │   └─> HMAC signature generation
           │
           ├─> websocket_manager.py (Real-time data)
           │   ├─> Subscribe to ticker
           │   ├─> Subscribe to executions
           │   └─> Heartbeat handling
           │
           ├─> circuit_breaker.py (Safety monitoring)
           │   └─> Tracks consecutive failures
           │
           └─> trading_engine.py (Strategy execution)
               ├─> Analyze market data
               ├─> Generate signals
               ├─> Execute orders (via kraken_client)
               └─> Record to database
```

### Key Design Patterns

#### 1. Async Context Managers
```python
# Proper resource cleanup
async with aiohttp.ClientSession() as session:
    async with session.get(url) as response:
        data = await response.json()
# Session automatically closed even if exception
```

#### 2. TaskGroups (Python 3.11+)
```python
# Structured concurrency - all tasks cancelled if one fails
async with asyncio.TaskGroup() as tg:
    tg.create_task(websocket_manager.run())
    tg.create_task(trading_engine.run())
    tg.create_task(circuit_breaker.monitor())
```

#### 3. ExceptionGroups (Python 3.11+)
```python
# Handle multiple concurrent errors
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(task1())
        tg.create_task(task2())
except* aiohttp.ClientError as e:
    logger.error(f"Network errors: {e.exceptions}")
except* ValueError as e:
    logger.error(f"Validation errors: {e.exceptions}")
```

---

## 🔌 Kraken API Integration

### REST API (kraken_client.py)

#### Authentication
```python
# HMAC-SHA512 signature
def _sign_request(self, url_path: str, data: dict) -> str:
    postdata = urllib.parse.urlencode(data)
    encoded = (str(data['nonce']) + postdata).encode()
    message = url_path.encode() + hashlib.sha256(encoded).digest()
    signature = hmac.new(
        base64.b64decode(self.api_secret),
        message,
        hashlib.sha512
    )
    return base64.b64encode(signature.digest()).decode()
```

#### Rate Limiting Strategy
```python
# Tiered limits based on verification level
├── Public endpoints: 15-20 calls/second
├── Private endpoints: 1 call/second initially
├── Increases with trading volume
└── Exponential backoff on rate limit errors
```

#### Critical Endpoints
```python
# Get account balance
POST /0/private/Balance

# Add order
POST /0/private/AddOrder
{
    "pair": "XXLMZUSD",  # XLM/USD
    "type": "buy",       # or "sell"
    "ordertype": "limit",  # or "market"
    "price": "0.12345",
    "volume": "10",
    "postonly": true  # Important: Avoid taker fees
}

# Cancel order
POST /0/private/CancelOrder
{
    "txid": "ORDER-ID-HERE"
}
```

### WebSocket v2 (websocket_manager.py)

#### Connection
```python
# WebSocket v2 endpoint
wss://ws.kraken.com/v2

# Authentication token from REST API
POST /0/private/GetWebSocketsToken
```

#### Message Format
```json
{
  "method": "subscribe",
  "params": {
    "channel": "ticker",
    "symbol": ["XLM/USD"],
    "snapshot": true
  }
}
```

#### Ticker Updates
```json
{
  "channel": "ticker",
  "type": "update",
  "data": [{
    "symbol": "XLM/USD",
    "bid": 0.12340,
    "ask": 0.12350,
    "last": 0.12345,
    "volume": 1234567.89,
    "vwap": 0.12340,
    "low": 0.12200,
    "high": 0.12400,
    "change": 0.00123,
    "change_pct": 1.01
  }]
}
```

#### Execution Reports
```json
{
  "channel": "executions",
  "type": "update",
  "data": [{
    "order_id": "XXXX-YYYY",
    "exec_type": "filled",
    "symbol": "XLM/USD",
    "side": "buy",
    "qty": 10.0,
    "price": 0.12345,
    "timestamp": "2025-10-12T10:30:00.123456Z"
  }]
}
```

#### Critical: RFC3339 Timestamps
```python
# Kraken uses: "2021-05-11T19:47:09.896860Z"
# Must parse correctly with timezone awareness

from datetime import datetime, timezone

def parse_kraken_timestamp(ts: str) -> datetime:
    """Parse Kraken RFC3339 timestamp"""
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))
```

---

## 🛡️ Safety Mechanisms

### 1. Circuit Breaker (circuit_breaker.py)

```python
class CircuitBreaker:
    """
    Stops trading if too many consecutive failures occur
    """
    def __init__(self, threshold: int = 5):
        self.threshold = threshold
        self.failure_count = 0
        self.is_open = False
    
    async def record_failure(self):
        self.failure_count += 1
        if self.failure_count >= self.threshold:
            self.is_open = True
            logger.critical("Circuit breaker OPEN - trading stopped!")
            # Trigger alerts, notifications, etc.
    
    async def record_success(self):
        self.failure_count = 0
        if self.is_open:
            logger.info("Circuit breaker CLOSED - trading resumed")
        self.is_open = False
```

**When it Triggers:**
- Consecutive API errors
- WebSocket disconnections
- Order execution failures
- Unexpected price movements
- Balance inconsistencies

### 2. Nonce Manager (nonce_manager.py)

```python
class NonceManager:
    """
    Prevents API replay attacks and race conditions
    """
    def __init__(self):
        self.lock = asyncio.Lock()
        self.current_nonce = self._load_nonce()
    
    async def get_nonce(self) -> int:
        async with self.lock:
            self.current_nonce += 1
            self._save_nonce(self.current_nonce)
            return self.current_nonce
```

**Critical**: 
- Nonce MUST be strictly increasing
- File-based persistence survives restarts
- Lock prevents concurrent access
- "EAPI:Invalid nonce" errors must trigger nonce reset

### 3. Instance Lock (instance_lock.py)

```python
class InstanceLock:
    """
    Prevents multiple bot instances from running simultaneously
    """
    def __init__(self, lockfile: str = ".trading_lock"):
        self.lockfile = lockfile
    
    def acquire(self) -> bool:
        if os.path.exists(self.lockfile):
            # Check if process is still running
            with open(self.lockfile) as f:
                pid = int(f.read())
            if psutil.pid_exists(pid):
                return False  # Another instance running
        
        # Create lock file with current PID
        with open(self.lockfile, 'w') as f:
            f.write(str(os.getpid()))
        return True
```

### 4. Risk Parameters (config.py)

```python
# Loaded from .env with Pydantic
class TradingConfig(BaseSettings):
    # Risk limits
    MAX_TRADE_SIZE: float = 10.0  # USD
    MAX_TOTAL_EXPOSURE: float = 10.0  # USD
    ALLOWED_PAIRS: list[str] = ["XLM/USD"]
    
    # Order parameters
    MIN_ORDER_SIZE: float = 1.0  # USD
    POST_ONLY: bool = True  # Avoid taker fees
    
    # Safety
    CIRCUIT_BREAKER_THRESHOLD: int = 5
    MAX_DAILY_LOSSES: float = 20.0  # USD
```

---

## 📊 Database Schema

### Tables

```sql
-- Trades (executed positions)
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair TEXT NOT NULL,
    side TEXT NOT NULL,  -- 'buy' or 'sell'
    price REAL NOT NULL,
    volume REAL NOT NULL,
    timestamp TEXT NOT NULL,  -- ISO format
    status TEXT NOT NULL,  -- 'open', 'filled', 'cancelled'
    order_id TEXT UNIQUE,
    txid TEXT,  -- Kraken transaction ID
    profit_loss REAL,
    notes TEXT
);

-- Orders (pending/historical orders)
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    pair TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'buy', 'sell'
    ordertype TEXT NOT NULL,  -- 'limit', 'market'
    price REAL,
    volume REAL NOT NULL,
    status TEXT NOT NULL,  -- 'pending', 'filled', 'cancelled'
    timestamp TEXT NOT NULL,
    filled_volume REAL DEFAULT 0.0,
    avg_fill_price REAL
);

-- Metrics (performance tracking)
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    balance_usd REAL,
    total_trades INTEGER,
    winning_trades INTEGER,
    total_profit_loss REAL,
    daily_profit_loss REAL
);

-- Learning Data (for strategy improvement)
CREATE TABLE learning_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    feature_data TEXT NOT NULL,  -- JSON
    outcome TEXT NOT NULL,
    profit_loss REAL
);
```

### Database Operations

```python
# ALWAYS use transactions for multi-step operations
async with database.transaction():
    await database.insert_order(order)
    await database.update_balance(new_balance)
    # Both or neither - atomic
```

---

## 🧪 Testing Requirements

### Test Categories

#### 1. Unit Tests (test_*.py)
```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_order_execution():
    """Test order placement logic without hitting real API"""
    with patch('kraken_client.KrakenClient.add_order') as mock_add:
        mock_add.return_value = {"txid": ["ORDER123"]}
        
        engine = TradingEngine(mock_kraken_client)
        result = await engine.place_order("buy", 0.1234, 10.0)
        
        assert result["txid"][0] == "ORDER123"
        mock_add.assert_called_once()
```

#### 2. WebSocket Tests
```python
@pytest.mark.asyncio
async def test_websocket_reconnection():
    """Test WebSocket handles disconnections gracefully"""
    ws_manager = WebSocketManager()
    
    # Simulate disconnect
    with patch('websockets.connect', side_effect=ConnectionError):
        await ws_manager.connect()
    
    # Should retry with exponential backoff
    assert ws_manager.retry_count > 0
```

#### 3. Database Tests
```python
@pytest.mark.asyncio
async def test_transaction_rollback():
    """Test database rolls back on error"""
    db = Database("test.db")
    
    with pytest.raises(ValueError):
        async with db.transaction():
            await db.insert_trade({"pair": "XLM/USD"})
            raise ValueError("Simulated error")
    
    # Trade should NOT be in database
    trades = await db.get_all_trades()
    assert len(trades) == 0
```

### Testing Checklist Before Changes

- [ ] All existing tests pass
- [ ] New tests cover changed code
- [ ] Mock ALL external API calls
- [ ] Test error conditions
- [ ] Test edge cases (zero balances, max sizes, etc.)
- [ ] Test circuit breaker triggers
- [ ] Test nonce synchronization
- [ ] Test WebSocket reconnection
- [ ] Test database transaction rollback

```powershell
# Run tests
cd C:\dev\projects\crypto-enhanced
.venv\Scripts\activate
python run_tests.py

# Or with pytest directly
pytest -v --asyncio-mode=auto

# With coverage
pytest --cov=. --cov-report=html
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "EAPI:Invalid nonce"
```python
# Cause: Nonce out of sync (previous request failed mid-flight)
# Fix: Reset nonce state
rm nonce_state.json nonce_state_primary.json
# Nonce will reinitialize on next start
```

#### 2. WebSocket Won't Connect
```python
# Check: Is authentication token valid?
# Test with:
python quick_price_check.py

# If fails, verify API keys in .env:
KRAKEN_API_KEY=...
KRAKEN_API_SECRET=...
```

#### 3. "Another instance is running"
```python
# Check: Is there actually another instance?
ps aux | grep start_live_trading

# If not, remove stale lock:
rm .trading_lock
```

#### 4. Orders Not Executing
```python
# Check circuit breaker status
sqlite3 trading.db "SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1;"

# Check recent errors in logs
Get-Content trading_new.log | Select-String "ERROR" | Select-Object -Last 20

# Verify balance
python simple_status.py
```

#### 5. Database Locked
```python
# Symptom: "database is locked" errors
# Cause: Another process has exclusive lock
# Fix: Ensure WAL mode is enabled (it should be)
sqlite3 trading.db "PRAGMA journal_mode=WAL;"
```

### Emergency Procedures

#### Stop Trading Immediately
```powershell
# Method 1: Graceful shutdown
cd C:\dev\projects\crypto-enhanced
.\stop_trading.ps1

# Method 2: Force kill (if unresponsive)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *start_live_trading*"
```

#### Check Open Positions
```powershell
sqlite3 trading.db "SELECT * FROM trades WHERE status='OPEN' ORDER BY timestamp DESC;"
```

#### Manual Order Cancellation
```python
# If bot is down but orders are open
python
>>> from kraken_client import KrakenClient
>>> client = KrakenClient()
>>> await client.cancel_order("ORDER_ID_HERE")
```

---

## 📋 Pre-Deployment Checklist

Before deploying ANY changes to live trading:

### Code Review
- [ ] All tests pass (100% for order execution logic)
- [ ] No blocking calls in async functions
- [ ] Error handling on all network operations
- [ ] Logging statements at appropriate levels
- [ ] No hardcoded values (use config)
- [ ] Type hints on all functions

### Configuration
- [ ] .env file correct (API keys valid)
- [ ] Risk parameters unchanged (unless intentional)
- [ ] Database path correct
- [ ] Log file path writable

### Safety Checks
- [ ] Circuit breaker logic intact
- [ ] Nonce manager functioning
- [ ] Instance lock working
- [ ] Database transactions proper

### Testing
- [ ] Unit tests: 95%+ coverage
- [ ] Mock all Kraken API calls
- [ ] Test with different market conditions
- [ ] Test error scenarios
- [ ] Manual test on testnet (if available)

### Monitoring
- [ ] Logging configured correctly
- [ ] Database queries work
- [ ] Status check script works
- [ ] Emergency stop tested

### Documentation
- [ ] Changes documented in code
- [ ] README updated if needed
- [ ] Known issues recorded

---

## 🎯 Best Practices

### DO ✅
- Always use async/await
- Use type hints everywhere
- Comprehensive error handling
- Log all important events
- Test with mocks extensively
- Use database transactions
- Respect rate limits
- Monitor logs regularly
- Keep backups of database

### DON'T ❌
- Use blocking calls (requests, time.sleep, etc.)
- Hit real API in tests
- Ignore exceptions
- Exceed risk parameters
- Run multiple instances
- Skip testing
- Deploy without review
- Commit API keys

---

## 📞 When to Ask for Help

**ALWAYS ask before:**
- Changing risk parameters
- Modifying order execution logic
- Altering API authentication
- Removing safety mechanisms
- Migrating database without backup
- Deploying to production

**Can proceed (with testing):**
- Adding logging
- Improving error messages
- Performance optimizations
- New tests
- Documentation updates
- Non-critical bug fixes

---

## 🔗 Resources

### Kraken Documentation
- **API Docs**: https://docs.kraken.com/api/
- **WebSocket v2**: https://docs.kraken.com/api/docs/websocket-v2
- **Rate Limits**: https://support.kraken.com/hc/en-us/articles/206548367
- **Error Codes**: https://docs.kraken.com/api/docs/guides/errors

### Python Async
- **asyncio**: https://docs.python.org/3/library/asyncio.html
- **aiohttp**: https://docs.aiohttp.org/
- **TaskGroups**: https://docs.python.org/3/library/asyncio-task.html#task-groups

### Testing
- **pytest-asyncio**: https://pytest-asyncio.readthedocs.io/
- **unittest.mock**: https://docs.python.org/3/library/unittest.mock.html

---

**Remember: This bot trades with real money. When in doubt, stop trading, ask questions, and test thoroughly. Better to be overly cautious than to lose money.**
