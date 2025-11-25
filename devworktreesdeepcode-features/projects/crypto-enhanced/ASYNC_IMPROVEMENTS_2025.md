# Async Python Best Practices for Trading System (2025)

## Executive Summary
Based on PEP 3156 (asyncio), PEP 492 (async/await), and Python 3.13 best practices, this document outlines modern async patterns to improve reliability, performance, and maintainability of the crypto trading system.

## Critical Improvements Needed

### 1. ✅ STRUCTURED CONCURRENCY with TaskGroups (Python 3.11+)

**Current Problem:**
```python
# trading_engine.py - manual task management, no automatic cleanup
asyncio.create_task(self._monitor_heartbeat())  # Fire and forget - dangerous!
```

**2025 Best Practice:**
```python
async def run(self):
    """Main trading loop with structured concurrency"""
    self.running = True
    logger.info("Trading engine started")
    
    try:
        # Use TaskGroup for automatic cleanup and exception handling
        async with asyncio.TaskGroup() as tg:
            # Initialize strategies
            await self._initialize_strategies()
            await self._initialize_state()
            
            # Launch concurrent tasks with automatic cleanup
            main_loop_task = tg.create_task(self._main_trading_loop())
            balance_monitor = tg.create_task(self._monitor_balance_loop())
            
    except* Exception as eg:
        # Exception groups let us handle multiple failures
        for exc in eg.exceptions:
            log_error(exc, "trading_engine_group")
    finally:
        # TaskGroup ensures all tasks are cancelled and cleaned up
        logger.info("Trading engine stopped, all tasks cleaned up")

async def _main_trading_loop(self):
    """Separated main loop for clean task management"""
    while self.running:
        try:
            await self._run_strategies()
            await self._check_exits()
            await self._monitor_risk()
            await asyncio.sleep(self.config.engine_loop_interval)
        except asyncio.CancelledError:
            logger.info("Main trading loop cancelled")
            raise  # Re-raise for proper cleanup
        except Exception as e:
            log_error(e, "trading_loop")
            await asyncio.sleep(5)
```

### 2. ✅ TIMEOUT CONTEXT MANAGER (Python 3.11+)

**Current Problem:**
```python
# No timeouts on potentially infinite operations
await self._handle_public_messages()  # Could hang forever!
```

**2025 Best Practice:**
```python
async def _connect_public(self):
    """Connect with proper timeouts"""
    reconnect_delay = self.reconnect_delay
    
    while self.running:
        try:
            # Use timeout context manager (cleaner than wait_for)
            async with asyncio.timeout(30):  # 30 second connection timeout
                async with websockets.connect(self.WS_URL) as websocket:
                    self.public_ws = websocket
                    
                    # Each operation has its own timeout
                    async with asyncio.timeout(10):
                        await self._subscribe_public_channels()
                    
                    # Message handling with watchdog timeout
                    await self._handle_public_messages()
                    
        except asyncio.TimeoutError:
            logger.error("WebSocket connection/operation timed out")
            await asyncio.sleep(reconnect_delay)
        except websockets.exceptions.WebSocketException as e:
            logger.error(f"WebSocket error: {e}")
            await asyncio.sleep(reconnect_delay)
```

### 3. ✅ PROPER EXCEPTION HANDLING in Async Context

**Current Problem:**
```python
# Broad exception catching loses important context
except Exception as e:
    logger.error(f"Error: {e}")
    # What happened? Can we retry? Should we stop?
```

**2025 Best Practice:**
```python
async def _process_message(self, data: Dict, is_private: bool = False):
    """Process with layered exception handling"""
    msg_type = data.get('channel') or data.get('type')
    
    try:
        # Specific handlers for each message type
        if msg_type == 'heartbeat':
            await self._handle_heartbeat(data, is_private)
        elif msg_type == 'ticker':
            await self._handle_ticker(data)
        # ... other message types
            
    except asyncio.CancelledError:
        # CRITICAL: Always re-raise CancelledError for proper shutdown
        logger.info(f"Message processing cancelled for {msg_type}")
        raise
        
    except KeyError as e:
        # Data structure errors - log but don't crash
        logger.error(f"Malformed {msg_type} message: missing {e}")
        
    except ValueError as e:
        # Data validation errors
        logger.error(f"Invalid data in {msg_type}: {e}")
        
    except Exception as e:
        # Unknown errors - log with full context
        logger.error(
            f"Unexpected error processing {msg_type}",
            exc_info=True,
            extra={
                'message_type': msg_type,
                'is_private': is_private,
                'data_keys': list(data.keys())
            }
        )
        # Don't crash the connection for processing errors
```

### 4. ✅ CIRCUIT BREAKER PATTERN for Resilience

**Implementation:**
```python
class CircuitBreaker:
    """Circuit breaker for API and WebSocket connections"""
    
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        
    async def call(self, func, *args, **kwargs):
        """Execute function through circuit breaker"""
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.timeout:
                self.state = 'HALF_OPEN'
                logger.info("Circuit breaker entering HALF_OPEN state")
            else:
                raise Exception("Circuit breaker is OPEN - too many failures")
        
        try:
            result = await func(*args, **kwargs)
            # Success - reset on HALF_OPEN, stay CLOSED
            if self.state == 'HALF_OPEN':
                self.state = 'CLOSED'
                self.failures = 0
                logger.info("Circuit breaker reset to CLOSED")
            return result
            
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            
            if self.failures >= self.failure_threshold:
                self.state = 'OPEN'
                logger.error(f"Circuit breaker opened after {self.failures} failures")
            
            raise

# Usage in kraken_client.py
class KrakenClient:
    def __init__(self, config):
        self.config = config
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, timeout=60)
        
    async def _execute_request(self, endpoint, private=False, data=None):
        """Execute with circuit breaker protection"""
        return await self.circuit_breaker.call(
            self._raw_request, endpoint, private, data
        )
```

### 5. ✅ EXPONENTIAL BACKOFF with Jitter (Already Good!)

**Current Implementation is Correct:**
```python
def exponential_backoff_with_jitter(retry_count, base_delay=1.0, max_delay=60.0):
    """Calculate delay with exponential backoff and jitter"""
    delay = min(base_delay * (2 ** retry_count), max_delay)
    jitter = random.uniform(0, delay * 0.1)
    return delay + jitter
```

**✅ This is already a 2025 best practice!** Keep this.

### 6. ✅ PROPER TASK CANCELLATION

**Current Problem:**
```python
# No graceful shutdown handling
self.running = False  # Just flip a flag
```

**2025 Best Practice:**
```python
class TradingEngine:
    def __init__(self, ...):
        self.shutdown_event = asyncio.Event()
        self.tasks = set()  # Track all tasks
        
    async def run(self):
        """Main loop with proper shutdown"""
        try:
            async with asyncio.TaskGroup() as tg:
                # Track tasks for monitoring
                main_task = tg.create_task(self._main_loop())
                self.tasks.add(main_task)
                
                balance_task = tg.create_task(self._monitor_balance_loop())
                self.tasks.add(balance_task)
                
                # Wait for shutdown signal
                await self.shutdown_event.wait()
                
        except* Exception as eg:
            for exc in eg.exceptions:
                log_error(exc, "engine_shutdown")
                
    async def stop(self):
        """Graceful shutdown"""
        logger.info("Initiating graceful shutdown...")
        
        # Cancel all pending orders FIRST
        await self.cancel_all_orders()
        
        # Signal shutdown to all tasks
        self.shutdown_event.set()
        
        # Wait for tasks with timeout
        try:
            async with asyncio.timeout(10):
                # TaskGroup will handle cancellation automatically
                await asyncio.gather(*self.tasks, return_exceptions=True)
        except asyncio.TimeoutError:
            logger.warning("Some tasks did not shutdown gracefully")
            
        logger.info("Trading engine stopped")
```

### 7. ✅ WEBSOCKET RECONNECTION STRATEGY

**Enhanced Reconnection:**
```python
class WebSocketManager:
    def __init__(self, config):
        self.config = config
        self.reconnect_attempts = 0
        self.max_instant_retries = 3
        self.circuit_breaker = CircuitBreaker(failure_threshold=10, timeout=300)
        
    async def _connect_with_retry(self, ws_type='public'):
        """Connect with intelligent retry strategy"""
        url = self.WS_URL if ws_type == 'public' else self.WS_AUTH_URL
        
        # Instant retries (3 attempts)
        for instant_retry in range(self.max_instant_retries):
            try:
                async with asyncio.timeout(10):
                    ws = await websockets.connect(url)
                    self.reconnect_attempts = 0  # Reset on success
                    return ws
                    
            except (asyncio.TimeoutError, websockets.exceptions.WebSocketException) as e:
                if instant_retry < self.max_instant_retries - 1:
                    logger.warning(f"Instant retry {instant_retry + 1}/{self.max_instant_retries}")
                    await asyncio.sleep(0.5)  # Brief pause
                else:
                    logger.error("Instant retries exhausted")
                    raise
        
        # Exponential backoff retries
        while self.running:
            try:
                # Check rate limits
                if not await self._check_connection_rate_limit():
                    wait_time = await self._get_rate_limit_wait_time()
                    logger.warning(f"Rate limit reached, waiting {wait_time}s")
                    await asyncio.sleep(wait_time)
                    continue
                
                # Use circuit breaker
                async def connect_attempt():
                    async with asyncio.timeout(30):
                        return await websockets.connect(url)
                
                ws = await self.circuit_breaker.call(connect_attempt)
                self.reconnect_attempts = 0
                return ws
                
            except Exception as e:
                self.reconnect_attempts += 1
                delay = exponential_backoff_with_jitter(
                    self.reconnect_attempts,
                    base_delay=5.0,
                    max_delay=60.0
                )
                logger.error(f"Reconnection attempt {self.reconnect_attempts} failed, waiting {delay:.1f}s")
                await asyncio.sleep(delay)
```

## Implementation Priority

### Week 4 Tasks:

1. **HIGH PRIORITY - Add TaskGroups to trading_engine.py**
   - Replace fire-and-forget tasks with structured concurrency
   - Ensures automatic cleanup on shutdown

2. **HIGH PRIORITY - Add timeout contexts to all network operations**
   - Prevents infinite hangs on WebSocket/API calls
   - Use `asyncio.timeout()` instead of `wait_for()`

3. **MEDIUM PRIORITY - Implement Circuit Breaker**
   - Protects against cascading failures
   - Add to both REST API and WebSocket connections

4. **MEDIUM PRIORITY - Improve exception handling**
   - Always re-raise `CancelledError`
   - Use specific exception types
   - Add context to error logs

5. **LOW PRIORITY - Enhance shutdown logic**
   - Use `asyncio.Event` for shutdown signaling
   - Add graceful shutdown timeouts

## Testing Requirements

After implementation, verify:

1. ✅ All tasks are properly cancelled on shutdown
2. ✅ No resource leaks (WebSocket connections, file handles)
3. ✅ Circuit breaker opens after threshold failures
4. ✅ Timeouts prevent infinite hangs
5. ✅ Exception groups properly handle multiple concurrent failures
6. ✅ Graceful degradation when WebSocket disconnects

## References

- PEP 3156: Asynchronous IO Support Rebooted
- PEP 492: Coroutines with async and await syntax
- Python 3.13 asyncio documentation
- "Robust asyncio" patterns from Python Best Practices 2025
