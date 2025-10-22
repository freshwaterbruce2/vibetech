# AGENTS.md - Crypto Enhanced Trading System

This file extends the root AGENTS.md with specific instructions for the cryptocurrency trading system. This is a **production trading system** handling real money - all code must be production-ready, never MVP quality.

## Project Overview

Advanced cryptocurrency trading system with Kraken API integration, real-time WebSocket data feeds, and automated trading strategies. Currently managing $98.82 USD with live trading capabilities.

## Critical Production Requirements

### 🚨 LIVE TRADING SAFETY PROTOCOLS
- **NEVER bypass the YES confirmation** in live trading operations
- **ALWAYS implement circuit breakers** for strategy activation
- **MANDATORY position size validation** before any trade execution
- **Real-time balance verification** before opening positions
- **Immediate halt on anomalous behavior** (unusual latency, unexpected responses)

### 📊 Current System Status
- **Account Balance**: $98.82 USD (as of last check)
- **Max Position Size**: $10 per trade (ENFORCED limit)
- **Max Total Exposure**: $10 (single position limit)
- **Active Pairs**: XLM/USD only
- **Strategies**: Configured but require explicit activation
- **Database**: SQLite with automatic backups

## Development Workflow

### Pre-Development Checklist
1. **Environment Check**: Verify .venv activation and dependencies
2. **API Status**: Run `python test_credentials.py` to validate API connectivity
3. **Database State**: Check `sqlite3 trading.db "SELECT COUNT(*) FROM positions WHERE status='open';"` for open positions
4. **System Health**: Verify WebSocket connections and nonce synchronization

### Implementation Patterns

#### 1. API Integration Standards
```python
# ALWAYS use proper error handling
try:
    response = await kraken_client.make_request(endpoint, params)
    if response.get('error'):
        raise KrakenAPIError(response['error'])
    return response['result']
except Exception as e:
    logger.error(f"API request failed: {e}")
    raise
```

#### 2. WebSocket V2 Integration
```python
# Proper WebSocket handling pattern
class WebSocketManager:
    async def start(self):  # Use start(), not run()
        # Connection logic with retry backoff

    async def stop(self):  # Use stop(), not disconnect()
        # Clean disconnection logic

    async def handle_message(self, message):
        # Comprehensive message validation
        # Strategy notification
        # Error recovery
```

#### 3. Database Transaction Patterns
```python
# Always use transactions for trading operations
async with get_db_transaction() as transaction:
    # Validate current state
    # Execute trade logic
    # Log all operations
    # Commit only on success
```

#### 4. Strategy Implementation Framework
```python
class Strategy:
    def __init__(self, config: StrategyConfig):
        self.risk_manager = RiskManager(config.risk_params)
        self.circuit_breaker = CircuitBreaker(config.circuit_params)

    async def analyze_market(self, data: MarketData) -> Signal:
        # Market analysis with comprehensive validation

    async def execute_signal(self, signal: Signal) -> TradeResult:
        # Pre-execution validation
        # Risk management checks
        # Position sizing
        # Execution with monitoring
```

## Testing Requirements

### Unit Testing
```bash
# Full test suite
python run_tests.py

# Specific test categories
python -m pytest tests/test_kraken_client.py -v
python -m pytest tests/test_websocket.py -v
python -m pytest tests/test_strategies.py -v
```

### Integration Testing
```bash
# API connectivity (uses real API, no trades)
python test_credentials.py

# WebSocket connectivity
python test_websocket_connection.py

# Database operations
python test_database_integrity.py
```

### Pre-Production Validation
- [ ] All unit tests pass with >95% coverage
- [ ] Integration tests confirm API connectivity
- [ ] WebSocket connections stable for >10 minutes
- [ ] Database transactions handle race conditions
- [ ] Circuit breakers trigger correctly under load
- [ ] Position sizing validates against account balance
- [ ] Order execution latency < 500ms consistently

## Risk Management Requirements

### Position Management
```python
class RiskManager:
    MAX_POSITION_SIZE = 10.0  # USD
    MAX_TOTAL_EXPOSURE = 10.0  # USD

    def validate_position(self, size: float, current_exposure: float) -> bool:
        if size > self.MAX_POSITION_SIZE:
            raise PositionSizeError(f"Position size {size} exceeds limit {self.MAX_POSITION_SIZE}")
        if current_exposure + size > self.MAX_TOTAL_EXPOSURE:
            raise ExposureError(f"Total exposure would exceed limit")
        return True
```

### Circuit Breaker Implementation
```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, timeout: int = 300):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None

    async def call(self, func, *args, **kwargs):
        if self.is_open():
            raise CircuitBreakerOpenError("Circuit breaker is open")
        # Execute with monitoring
```

## Performance Standards

### Latency Requirements
- **Order Execution**: < 500ms from signal to order placement
- **WebSocket Reconnection**: < 5 seconds maximum
- **Database Operations**: < 100ms for single queries
- **Strategy Analysis**: < 200ms per market data update

### Memory & Resource Limits
- **Process Memory**: < 200MB steady state
- **Database Size**: Monitor and archive when > 100MB
- **Log File Size**: Rotate daily, keep 30 days
- **WebSocket Buffer**: < 10MB memory usage

## Security Requirements

### API Key Management
```python
# NEVER log API keys or secrets
class KrakenClient:
    def __init__(self):
        self.api_key = os.getenv('KRAKEN_API_KEY')  # From .env only
        self.api_secret = os.getenv('KRAKEN_API_SECRET')

        if not self.api_key or not self.api_secret:
            raise ConfigurationError("API credentials missing")
```

### Nonce Management
```python
# Thread-safe nonce generation
class NonceManager:
    def __init__(self):
        self._lock = asyncio.Lock()

    async def get_nonce(self) -> int:
        async with self._lock:
            # Generate nanosecond timestamp
            return int(time.time() * 1000000000)
```

## Error Handling Patterns

### Comprehensive Error Classes
```python
# Use specific error types from errors_simple.py
from errors_simple import (
    KrakenAPIError,
    WebSocketError,
    DatabaseError,
    StrategyError,
    RiskManagementError
)

# Never use generic Exception
try:
    result = await trading_operation()
except KrakenAPIError as e:
    # API-specific recovery
except WebSocketError as e:
    # Connection recovery
except RiskManagementError as e:
    # Risk violation handling - HALT trading
```

### Recovery Strategies
```python
class ErrorRecovery:
    async def handle_api_error(self, error):
        if error.is_rate_limit():
            await self.backoff_retry()
        elif error.is_nonce_error():
            await self.reset_nonce()
        elif error.is_critical():
            await self.emergency_shutdown()
```

## Production Deployment Checklist

### Pre-Deployment Validation
- [ ] All tests pass in production-like environment
- [ ] API credentials validated and rate limits confirmed
- [ ] Database backup and recovery procedures tested
- [ ] Circuit breakers and risk limits validated
- [ ] Monitoring and alerting systems operational
- [ ] Emergency shutdown procedures documented
- [ ] Position size limits properly configured

### Deployment Process
1. **Backup Current State**: Database, configuration, logs
2. **Deploy Code**: Update with zero-downtime approach
3. **Validate Systems**: API, WebSocket, database connectivity
4. **Test Risk Systems**: Circuit breakers, position limits
5. **Monitor Initial Operation**: Watch for 30 minutes minimum
6. **Enable Strategies**: Only after full validation

### Post-Deployment Monitoring
- [ ] WebSocket connections stable
- [ ] Database operations performing within limits
- [ ] No memory leaks detected
- [ ] API rate limits respected
- [ ] Position sizes within configured limits
- [ ] All log events properly categorized

## Common Development Tasks

### Adding New Trading Strategy
1. **Design Phase**: Document strategy logic, risk parameters, exit conditions
2. **Implementation**: Follow Strategy base class pattern
3. **Testing**: Comprehensive backtesting with historical data
4. **Risk Integration**: Implement position sizing and circuit breakers
5. **Monitoring**: Add strategy-specific metrics and alerts
6. **Production**: Gradual rollout with manual oversight

### WebSocket Channel Management
1. **Subscription**: Use proper authentication for private channels
2. **Message Handling**: Validate all incoming data formats
3. **Reconnection**: Implement exponential backoff with jitter
4. **Error Recovery**: Handle disconnections gracefully
5. **Performance**: Monitor latency and buffer sizes

### Database Operations
1. **Migrations**: Version control all schema changes
2. **Transactions**: Use for all multi-step operations
3. **Indexing**: Optimize for query patterns
4. **Backup**: Automated daily backups with compression
5. **Monitoring**: Track query performance and deadlocks

## Integration Points

### With Memory Bank System
- Strategy learning data stored for pattern analysis
- Performance metrics fed to memory system for optimization
- Error patterns learned for proactive prevention

### With Main Web Application
- Real-time trading status displayed in dashboard
- Performance metrics visualization
- Risk parameter configuration interface

### With Claude Commands
- `/crypto:trading-status` - Live system health
- `/crypto:position-check` - Current position analysis
- Emergency command integration for system halt

## Emergency Procedures

### System Halt Conditions
- API connectivity lost for >30 seconds
- Circuit breaker threshold exceeded
- Unexpected balance changes
- Database connection failures
- Memory usage >500MB

### Emergency Response
```python
async def emergency_halt():
    logger.critical("EMERGENCY HALT INITIATED")
    await trading_engine.stop_all_strategies()
    await websocket_manager.stop()
    await database.close_connections()
    # Send alert notifications
```

Remember: This is a live trading system handling real money. **NEVER compromise on safety, testing, or error handling**. Every line of code must be production-ready from day one.