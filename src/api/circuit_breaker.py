"""
Circuit breaker implementation for Kraken API

Provides protection against cascading failures.
"""

import asyncio
import time
from enum import Enum
from typing import Optional, Callable, Any
from dataclasses import dataclass


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, rejecting requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerStats:
    """Circuit breaker statistics."""
    state: CircuitState
    failure_count: int
    success_count: int
    last_failure_time: Optional[float]
    next_retry_time: Optional[float]


class CircuitBreaker:
    """
    Circuit breaker for API calls.

    Prevents cascading failures by failing fast when
    a threshold of failures is reached.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_max_calls: int = 3,
        on_state_change: Optional[Callable[[CircuitState], None]] = None
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery
            half_open_max_calls: Max calls allowed in half-open state
            on_state_change: Callback for state changes
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.on_state_change = on_state_change

        # State tracking
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_calls = 0

        # Lock for thread safety
        self._lock = asyncio.Lock()

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments

        Returns:
            Function result

        Raises:
            CircuitBreakerError: If circuit is open
        """
        async with self._lock:
            # Check if we should attempt the call
            if not await self._can_attempt():
                from .exceptions import CircuitBreakerError
                raise CircuitBreakerError(
                    "Circuit breaker is open",
                    reset_time=self.last_failure_time + self.recovery_timeout,
                    failure_count=self.failure_count
                )

            # Track half-open calls
            if self.state == CircuitState.HALF_OPEN:
                self.half_open_calls += 1

        # Attempt the call
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure()
            raise e

    async def _can_attempt(self) -> bool:
        """
        Check if a call can be attempted.

        Returns:
            True if call can be attempted
        """
        current_time = time.time()

        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if (self.last_failure_time and
                    current_time - self.last_failure_time >= self.recovery_timeout):
                await self._set_state(CircuitState.HALF_OPEN)
                self.half_open_calls = 0
                return True
            return False

        if self.state == CircuitState.HALF_OPEN:
            # Allow limited calls in half-open state
            return self.half_open_calls < self.half_open_max_calls

        return False

    async def _on_success(self) -> None:
        """Handle successful call."""
        async with self._lock:
            self.success_count += 1

            if self.state == CircuitState.HALF_OPEN:
                # Enough successes in half-open state, close circuit
                if self.success_count >= self.half_open_max_calls:
                    await self._set_state(CircuitState.CLOSED)
                    self.failure_count = 0
                    self.success_count = 0

    async def _on_failure(self) -> None:
        """Handle failed call."""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.state == CircuitState.HALF_OPEN:
                # Failure in half-open state, reopen circuit
                await self._set_state(CircuitState.OPEN)
                self.success_count = 0

            elif self.state == CircuitState.CLOSED:
                # Check if threshold reached
                if self.failure_count >= self.failure_threshold:
                    await self._set_state(CircuitState.OPEN)
                    self.success_count = 0

    async def _set_state(self, new_state: CircuitState) -> None:
        """
        Set circuit breaker state.

        Args:
            new_state: New state to set
        """
        if new_state != self.state:
            old_state = self.state
            self.state = new_state

            # Call state change callback
            if self.on_state_change:
                try:
                    if asyncio.iscoroutinefunction(self.on_state_change):
                        await self.on_state_change(new_state)
                    else:
                        self.on_state_change(new_state)
                except Exception:
                    # Ignore callback errors
                    pass

    def get_stats(self) -> CircuitBreakerStats:
        """
        Get circuit breaker statistics.

        Returns:
            Circuit breaker stats
        """
        next_retry_time = None
        if self.state == CircuitState.OPEN and self.last_failure_time:
            next_retry_time = self.last_failure_time + self.recovery_timeout

        return CircuitBreakerStats(
            state=self.state,
            failure_count=self.failure_count,
            success_count=self.success_count,
            last_failure_time=self.last_failure_time,
            next_retry_time=next_retry_time
        )

    def is_open(self) -> bool:
        """
        Check if circuit is open.

        Returns:
            True if circuit is open
        """
        return self.state == CircuitState.OPEN

    def is_closed(self) -> bool:
        """
        Check if circuit is closed.

        Returns:
            True if circuit is closed
        """
        return self.state == CircuitState.CLOSED

    async def reset(self) -> None:
        """Reset circuit breaker to closed state."""
        async with self._lock:
            await self._set_state(CircuitState.CLOSED)
            self.failure_count = 0
            self.success_count = 0
            self.last_failure_time = None
            self.half_open_calls = 0


class MockCircuitBreaker(CircuitBreaker):
    """Mock circuit breaker for testing."""

    def __init__(self):
        """Initialize mock circuit breaker that never opens."""
        super().__init__(
            failure_threshold=1000000,  # Never open
            recovery_timeout=0
        )

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Always allow calls in mock mode."""
        return await func(*args, **kwargs)