"""
Unit tests for Circuit Breaker module
Tests state transitions, failure thresholds, and recovery behavior
"""

import pytest
import asyncio
from unittest.mock import AsyncMock
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from circuit_breaker import CircuitBreaker, CircuitState


class TestCircuitBreakerBasics:
    """Test basic circuit breaker functionality"""

    @pytest.mark.asyncio
    async def test_circuit_breaker_initialization(self):
        """Test circuit breaker initializes in CLOSED state"""
        breaker = CircuitBreaker(failure_threshold=3, timeout=5)
        
        assert breaker.state == CircuitState.CLOSED
        assert breaker.failures == 0
        assert breaker.successes == 0
        assert breaker.last_failure_time is None

    @pytest.mark.asyncio
    async def test_successful_call(self):
        """Test successful function call through circuit breaker"""
        breaker = CircuitBreaker(failure_threshold=3)
        
        async def success_func():
            return "success"
        
        result = await breaker.call(success_func)
        
        assert result == "success"
        assert breaker.state == CircuitState.CLOSED
        assert breaker.failures == 0

    @pytest.mark.asyncio
    async def test_failed_call_below_threshold(self):
        """Test failed call below threshold keeps circuit CLOSED"""
        breaker = CircuitBreaker(failure_threshold=3)
        
        async def failing_func():
            raise ValueError("Test error")
        
        # First failure
        with pytest.raises(ValueError):
            await breaker.call(failing_func)
        
        assert breaker.state == CircuitState.CLOSED
        assert breaker.failures == 1
        
        # Second failure
        with pytest.raises(ValueError):
            await breaker.call(failing_func)
        
        assert breaker.state == CircuitState.CLOSED
        assert breaker.failures == 2


class TestCircuitBreakerStateTransitions:
    """Test circuit breaker state machine transitions"""

    @pytest.mark.asyncio
    async def test_open_after_threshold(self):
        """Test circuit opens after failure threshold reached"""
        breaker = CircuitBreaker(failure_threshold=3, timeout=5)
        
        async def failing_func():
            raise ValueError("Test error")
        
        # Reach threshold
        for i in range(3):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        assert breaker.state == CircuitState.OPEN
        assert breaker.failures == 3

    @pytest.mark.asyncio
    async def test_open_circuit_rejects_calls(self):
        """Test OPEN circuit rejects calls immediately"""
        breaker = CircuitBreaker(failure_threshold=2, timeout=5)
        
        async def failing_func():
            raise ValueError("Test error")
        
        # Open the circuit
        for i in range(2):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        assert breaker.state == CircuitState.OPEN
        
        # Next call should be rejected
        async def any_func():
            return "should not execute"
        
        with pytest.raises(Exception) as exc_info:
            await breaker.call(any_func)
        
        assert "Circuit breaker is OPEN" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_half_open_after_timeout(self):
        """Test circuit transitions to HALF_OPEN after timeout"""
        breaker = CircuitBreaker(
            failure_threshold=2,
            timeout=1,
            success_threshold=2
        )
        
        async def failing_func():
            raise ValueError("Test error")
        
        # Open the circuit
        for i in range(2):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        assert breaker.state == CircuitState.OPEN
        
        # Wait for timeout
        await asyncio.sleep(1.1)
        
        # Next call should attempt recovery
        async def success_func():
            return "recovered"
        
        result = await breaker.call(success_func)
        
        # First success moves to HALF_OPEN
        assert result == "recovered"
        assert breaker.state == CircuitState.HALF_OPEN
        
        # Second success should close circuit
        result = await breaker.call(success_func)
        assert breaker.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_half_open_requires_multiple_successes(self):
        """Test HALF_OPEN requires multiple successes to close"""
        breaker = CircuitBreaker(
            failure_threshold=2,
            timeout=1,
            success_threshold=3
        )
        
        async def failing_func():
            raise ValueError("Test error")
        
        # Open the circuit
        for i in range(2):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        await asyncio.sleep(1.1)
        
        # First success should move to HALF_OPEN
        async def success_func():
            return "ok"
        
        result = await breaker.call(success_func)
        assert result == "ok"
        assert breaker.state == CircuitState.HALF_OPEN
        assert breaker.successes == 1
        
        # Second success
        await breaker.call(success_func)
        assert breaker.state == CircuitState.HALF_OPEN
        assert breaker.successes == 2
        
        # Third success should close circuit
        await breaker.call(success_func)
        assert breaker.state == CircuitState.CLOSED
        assert breaker.successes == 0

    @pytest.mark.asyncio
    async def test_half_open_reopens_on_failure(self):
        """Test HALF_OPEN reopens immediately on failure"""
        breaker = CircuitBreaker(failure_threshold=2, timeout=1)
        
        async def failing_func():
            raise ValueError("Test error")
        
        # Open the circuit
        for i in range(2):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        await asyncio.sleep(1.1)
        
        # Try to recover but fail
        with pytest.raises(ValueError):
            await breaker.call(failing_func)
        
        # Should be back to OPEN
        assert breaker.state == CircuitState.OPEN


class TestCircuitBreakerReset:
    """Test circuit breaker reset functionality"""

    @pytest.mark.asyncio
    async def test_manual_reset(self):
        """Test manual reset clears state"""
        breaker = CircuitBreaker(failure_threshold=2)
        
        async def failing_func():
            raise ValueError("Test error")
        
        # Open the circuit
        for i in range(2):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        assert breaker.state == CircuitState.OPEN
        assert breaker.failures == 2
        
        # Manual reset
        await breaker.reset()
        
        assert breaker.state == CircuitState.CLOSED
        assert breaker.failures == 0
        assert breaker.last_failure_time is None

    @pytest.mark.asyncio
    async def test_success_resets_failures_in_closed(self):
        """Test success resets failure counter in CLOSED state"""
        breaker = CircuitBreaker(failure_threshold=5)
        
        async def failing_func():
            raise ValueError("Test error")
        
        async def success_func():
            return "ok"
        
        # Few failures
        for i in range(3):
            with pytest.raises(ValueError):
                await breaker.call(failing_func)
        
        assert breaker.failures == 3
        
        # Success should reset
        await breaker.call(success_func)
        
        assert breaker.failures == 0
        assert breaker.state == CircuitState.CLOSED


class TestCircuitBreakerEdgeCases:
    """Test edge cases and error scenarios"""

    @pytest.mark.asyncio
    async def test_concurrent_calls(self):
        """Test circuit breaker with concurrent calls"""
        breaker = CircuitBreaker(failure_threshold=5)
        
        call_count = 0
        
        async def tracked_func():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)
            return call_count
        
        # Run multiple calls concurrently
        tasks = [breaker.call(tracked_func) for _ in range(10)]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 10
        assert breaker.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_get_state_info(self):
        """Test get_state returns correct information"""
        breaker = CircuitBreaker(failure_threshold=3, timeout=10)
        
        state = breaker.get_state()
        
        assert state['state'] == 'closed'
        assert state['failures'] == 0
        assert state['successes'] == 0
        assert state['last_failure_time'] is None
        assert state['time_since_failure'] is None
        
        # Add a failure
        async def failing_func():
            raise ValueError("Test")
        
        with pytest.raises(ValueError):
            await breaker.call(failing_func)
        
        state = breaker.get_state()
        assert state['failures'] == 1
        assert state['last_failure_time'] is not None
        assert state['time_since_failure'] is not None
        assert state['time_since_failure'] >= 0

    @pytest.mark.asyncio
    async def test_different_exception_types(self):
        """Test circuit breaker handles various exception types"""
        breaker = CircuitBreaker(failure_threshold=2)
        
        async def value_error():
            raise ValueError("Value error")
        
        async def type_error():
            raise TypeError("Type error")
        
        # Different exceptions all count as failures
        with pytest.raises(ValueError):
            await breaker.call(value_error)
        
        assert breaker.failures == 1
        
        with pytest.raises(TypeError):
            await breaker.call(type_error)
        
        assert breaker.failures == 2
        assert breaker.state == CircuitState.OPEN


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
