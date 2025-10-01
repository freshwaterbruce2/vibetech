"""
Circuit Breaker Pattern for Trading System
Prevents cascading failures in API and WebSocket connections
"""

import asyncio
import time
import logging
from enum import Enum
from typing import Callable, Any

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failures exceeded threshold, rejecting calls
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker for async operations
    
    Prevents cascading failures by:
    1. Counting consecutive failures
    2. Opening circuit after threshold
    3. Automatically testing recovery after timeout
    
    Usage:
        breaker = CircuitBreaker(failure_threshold=5, timeout=60)
        result = await breaker.call(async_function, arg1, arg2)
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        success_threshold: int = 2
    ):
        """
        Initialize circuit breaker
        
        Args:
            failure_threshold: Number of failures before opening circuit
            timeout: Seconds to wait before attempting recovery
            success_threshold: Successes needed in HALF_OPEN to close circuit
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold
        
        self.failures = 0
        self.successes = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        
        self._lock = asyncio.Lock()  # Thread-safe state changes
        
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function through circuit breaker
        
        Args:
            func: Async function to call
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Function result
            
        Raises:
            Exception: If circuit is OPEN or function fails
        """
        async with self._lock:
            # Check if we should attempt recovery
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._transition_to_half_open()
                else:
                    elapsed = time.time() - self.last_failure_time
                    remaining = self.timeout - elapsed
                    raise Exception(
                        f"Circuit breaker is OPEN "
                        f"({remaining:.0f}s until retry)"
                    )
        
        # Execute the function
        try:
            result = await func(*args, **kwargs)
            await self._record_success()
            return result
            
        except Exception as e:
            await self._record_failure(e)
            raise
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time passed to try recovery"""
        if not self.last_failure_time:
            return True
        return time.time() - self.last_failure_time >= self.timeout
    
    def _transition_to_half_open(self):
        """Move to HALF_OPEN state to test recovery"""
        logger.info("Circuit breaker: OPEN → HALF_OPEN (testing recovery)")
        self.state = CircuitState.HALF_OPEN
        self.successes = 0
    
    async def _record_success(self):
        """Record successful call"""
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.successes += 1
                logger.info(
                    f"Circuit breaker: Success {self.successes}"
                    f"/{self.success_threshold} in HALF_OPEN"
                )
                
                if self.successes >= self.success_threshold:
                    self._close()
            elif self.state == CircuitState.CLOSED:
                # Reset failure counter on success
                if self.failures > 0:
                    logger.info("Circuit breaker: Failures reset after success")
                    self.failures = 0
    
    async def _record_failure(self, exception: Exception):
        """Record failed call"""
        async with self._lock:
            self.failures += 1
            self.last_failure_time = time.time()
            
            logger.warning(
                f"Circuit breaker: Failure {self.failures}"
                f"/{self.failure_threshold} - {str(exception)[:100]}"
            )
            
            if self.state == CircuitState.HALF_OPEN:
                # Immediately re-open on failure during recovery test
                self._open()
            elif self.failures >= self.failure_threshold:
                self._open()
    
    def _open(self):
        """Open the circuit (stop allowing calls)"""
        logger.error(
            f"Circuit breaker: {self.state.value} → OPEN "
            f"(threshold reached: {self.failures} failures)"
        )
        self.state = CircuitState.OPEN
    
    def _close(self):
        """Close the circuit (resume normal operation)"""
        logger.info(
            "Circuit breaker: HALF_OPEN → CLOSED "
            "(service recovered)"
        )
        self.state = CircuitState.CLOSED
        self.failures = 0
        self.successes = 0
    
    def get_state(self) -> dict:
        """Get current circuit breaker state"""
        return {
            'state': self.state.value,
            'failures': self.failures,
            'successes': self.successes,
            'last_failure_time': self.last_failure_time,
            'time_since_failure': (
                time.time() - self.last_failure_time
                if self.last_failure_time else None
            )
        }
    
    async def reset(self):
        """Manually reset circuit breaker"""
        async with self._lock:
            logger.info("Circuit breaker: Manual reset")
            self.state = CircuitState.CLOSED
            self.failures = 0
            self.successes = 0
            self.last_failure_time = None
