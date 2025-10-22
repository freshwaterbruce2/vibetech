"""
Integration tests for Kraken client with circuit breaker
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from kraken_client import KrakenClient
from circuit_breaker import CircuitState
from errors_simple import KrakenAPIError


@pytest.fixture
def mock_config():
    """Create mock config for testing"""
    config = MagicMock()
    config.kraken_api_key = "test_key"
    config.kraken_api_secret = "dGVzdF9zZWNyZXQ="  # base64 encoded
    return config


@pytest.fixture
def kraken_client(mock_config):
    """Create KrakenClient instance for testing"""
    return KrakenClient(mock_config)


class TestCircuitBreakerIntegration:
    """Test circuit breaker integration in Kraken client"""

    @pytest.mark.asyncio
    async def test_circuit_breaker_initialized(self, kraken_client):
        """Verify circuit breaker is initialized"""
        assert kraken_client.circuit_breaker is not None
        assert kraken_client.circuit_breaker.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_successful_api_call_keeps_circuit_closed(
        self,
        kraken_client
    ):
        """Test successful API calls keep circuit closed"""
        await kraken_client.connect()
        
        # Mock successful response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(
            return_value={'result': {'status': 'online'}}
        )
        
        with patch.object(
            kraken_client.session,
            'request',
            return_value=AsyncMock(__aenter__=AsyncMock(
                return_value=mock_response
            ))
        ):
            result = await kraken_client.get_system_status()
            
            assert result == {'status': 'online'}
            assert kraken_client.circuit_breaker.state == (
                CircuitState.CLOSED
            )
        
        await kraken_client.disconnect()

    @pytest.mark.asyncio
    async def test_repeated_failures_open_circuit(self, kraken_client):
        """Test repeated failures open the circuit breaker"""
        await kraken_client.connect()
        
        # Mock failing response
        mock_response = AsyncMock()
        mock_response.status = 503
        mock_response.json = AsyncMock(
            return_value={'error': ['Service unavailable']}
        )
        
        with patch.object(
            kraken_client.session,
            'request',
            return_value=AsyncMock(__aenter__=AsyncMock(
                return_value=mock_response
            ))
        ):
            # Cause 5 failures to open circuit (failure_threshold=5)
            for i in range(5):
                try:
                    await kraken_client.get_system_status()
                except (KrakenAPIError, Exception):
                    pass  # Expected failures
            
            # Circuit should now be OPEN
            assert kraken_client.circuit_breaker.state == (
                CircuitState.OPEN
            )
            
            # Next call should be rejected immediately without API call
            with pytest.raises(Exception, match="Circuit breaker is OPEN"):
                await kraken_client.get_system_status()
        
        await kraken_client.disconnect()

    @pytest.mark.asyncio
    async def test_circuit_recovery_after_timeout(self, kraken_client):
        """Test circuit transitions to HALF_OPEN after timeout"""
        # Create client with short timeout for testing
        kraken_client.circuit_breaker.timeout = 1
        
        await kraken_client.connect()
        
        # Mock failing response
        mock_fail_response = AsyncMock()
        mock_fail_response.status = 503
        mock_fail_response.json = AsyncMock(
            return_value={'error': ['Service unavailable']}
        )
        
        # Open the circuit
        with patch.object(
            kraken_client.session,
            'request',
            return_value=AsyncMock(__aenter__=AsyncMock(
                return_value=mock_fail_response
            ))
        ):
            for i in range(5):
                try:
                    await kraken_client.get_system_status()
                except Exception:
                    pass
        
        assert kraken_client.circuit_breaker.state == CircuitState.OPEN
        
        # Wait for timeout
        await asyncio.sleep(1.2)
        
        # Mock successful response for recovery
        mock_success_response = AsyncMock()
        mock_success_response.status = 200
        mock_success_response.json = AsyncMock(
            return_value={'result': {'status': 'online'}}
        )
        
        with patch.object(
            kraken_client.session,
            'request',
            return_value=AsyncMock(__aenter__=AsyncMock(
                return_value=mock_success_response
            ))
        ):
            # First success moves to HALF_OPEN
            result = await kraken_client.get_system_status()
            assert result == {'status': 'online'}
            assert kraken_client.circuit_breaker.state == (
                CircuitState.HALF_OPEN
            )
            
            # Second success closes circuit
            result = await kraken_client.get_system_status()
            assert kraken_client.circuit_breaker.state == (
                CircuitState.CLOSED
            )
        
        await kraken_client.disconnect()

    @pytest.mark.asyncio
    async def test_circuit_reopens_on_failure_in_half_open(
        self,
        kraken_client
    ):
        """Test circuit reopens if failure occurs in HALF_OPEN"""
        kraken_client.circuit_breaker.timeout = 1
        
        await kraken_client.connect()
        
        # Open the circuit
        mock_fail_response = AsyncMock()
        mock_fail_response.status = 503
        mock_fail_response.json = AsyncMock(
            return_value={'error': ['Service unavailable']}
        )
        
        with patch.object(
            kraken_client.session,
            'request',
            return_value=AsyncMock(__aenter__=AsyncMock(
                return_value=mock_fail_response
            ))
        ):
            for i in range(5):
                try:
                    await kraken_client.get_system_status()
                except Exception:
                    pass
        
        assert kraken_client.circuit_breaker.state == CircuitState.OPEN
        
        # Wait for timeout to enter HALF_OPEN
        await asyncio.sleep(1.2)
        
        # Another failure should reopen circuit
        with patch.object(
            kraken_client.session,
            'request',
            return_value=AsyncMock(__aenter__=AsyncMock(
                return_value=mock_fail_response
            ))
        ):
            try:
                await kraken_client.get_system_status()
            except Exception:
                pass
            
            # Should be back to OPEN
            assert kraken_client.circuit_breaker.state == (
                CircuitState.OPEN
            )
        
        await kraken_client.disconnect()
