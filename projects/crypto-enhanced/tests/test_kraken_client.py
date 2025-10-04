"""
Unit tests for KrakenClient
Tests API interactions, error handling, and retry logic
"""

import pytest
import asyncio
import aiohttp
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
import json

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from kraken_client import KrakenClient, KrakenAPIError
from config import Config


class TestKrakenClient:
    """Test suite for KrakenClient"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.kraken_api_key = 'test_api_key'
        config.kraken_api_secret = 'dGVzdF9zZWNyZXQ='  # base64 encoded 'test_secret'
        config.trading_pairs = ['XBT/USD', 'ETH/USD']
        config.max_position_size = 1000
        return config

    @pytest.fixture
    def client(self, mock_config):
        """Create KrakenClient instance"""
        return KrakenClient(mock_config)

    @pytest.mark.asyncio
    async def test_client_initialization(self, mock_config):
        """Test client initialization"""
        client = KrakenClient(mock_config)

        assert client.api_key == 'test_api_key'
        assert client.api_secret == 'dGVzdF9zZWNyZXQ='
        assert client.session is None
        assert not client._connected

    @pytest.mark.asyncio
    async def test_client_connection(self, client):
        """Test client connection management"""
        # Initially not connected
        assert not client._connected
        assert client.session is None
        assert not await client.is_connected()

        # Connect
        await client.connect()
        assert client._connected
        assert client.session is not None
        assert await client.is_connected()

        # Disconnect
        await client.disconnect()
        assert not client._connected
        assert client.session is None
        assert not await client.is_connected()

    @pytest.mark.asyncio
    async def test_nonce_generation(self, client):
        """Test nonce generation is unique and increasing"""
        nonce1 = client._get_nonce()
        await asyncio.sleep(0.01)
        nonce2 = client._get_nonce()

        assert nonce1 != nonce2
        assert int(nonce2) > int(nonce1)

    @pytest.mark.asyncio
    async def test_request_signing(self, client):
        """Test request signing for private endpoints"""
        urlpath = '/0/private/Balance'
        data = {'nonce': '1234567890'}

        signature = client._sign_request(urlpath, data)

        assert signature is not None
        assert isinstance(signature, str)
        assert len(signature) > 0

    @pytest.mark.asyncio
    async def test_public_request_success(self, client):
        """Test successful public API request"""
        await client.connect()  # Connect first
        mock_response = {
            'error': [],
            'result': {
                'status': 'online',
                'timestamp': '2025-09-27T12:00:00Z'
            }
        }

        with patch.object(client.session, 'request') as mock_request:
            mock_request.return_value.__aenter__.return_value.json = AsyncMock(
                return_value=mock_response
            )

            result = await client.get_system_status()

            assert result['status'] == 'online'
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_private_request_success(self, client):
        """Test successful private API request"""
        await client.connect()  # Connect first
        mock_response = {
            'error': [],
            'result': {
                'ZUSD': '10000.00',
                'XXBT': '0.5'
            }
        }

        with patch.object(client.session, 'request') as mock_request:
            mock_request.return_value.__aenter__.return_value.json = AsyncMock(
                return_value=mock_response
            )

            result = await client.get_account_balance()

            assert 'ZUSD' in result
            assert result['ZUSD'] == '10000.00'
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_kraken_api_error_handling(self, client):
        """Test Kraken API error handling"""
        await client.connect()  # Connect first
        mock_response = {
            'error': ['API:Invalid key'],
            'result': {}
        }

        with patch.object(client.session, 'request') as mock_request:
            response_mock = AsyncMock()
            response_mock.json = AsyncMock(return_value=mock_response)
            response_mock.status = 401
            mock_request.return_value.__aenter__.return_value = response_mock

            with pytest.raises(KrakenAPIError) as exc_info:
                await client._request('private/Balance', private=True)

            assert 'API:Invalid key' in str(exc_info.value)
            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_nonce_error_retry(self, client):
        """Test automatic retry on nonce errors"""
        await client.connect()  # Connect first
        mock_responses = [
            {'error': ['Invalid nonce'], 'result': {}},  # First call fails
            {'error': [], 'result': {'ZUSD': '5000'}}    # Retry succeeds
        ]

        call_count = 0

        async def mock_json():
            nonlocal call_count
            response = mock_responses[call_count]
            call_count += 1
            return response

        with patch.object(client.session, 'request') as mock_request:
            response_mock = AsyncMock()
            response_mock.json = mock_json
            response_mock.status = 200
            mock_request.return_value.__aenter__.return_value = response_mock

            result = await client._request('private/Balance', private=True)

            assert result['ZUSD'] == '5000'
            assert call_count == 2  # Should have retried once

    @pytest.mark.asyncio
    async def test_network_error_retry(self, client):
        """Test automatic retry on network errors"""
        await client.connect()  # Connect first
        call_count = 0

        async def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise aiohttp.ClientError("Network error")

            response_mock = AsyncMock()
            response_mock.json = AsyncMock(return_value={
                'error': [],
                'result': {'status': 'online'}
            })
            return AsyncMock(__aenter__=AsyncMock(return_value=response_mock))

        with patch.object(client.session, 'request', side_effect=side_effect):
            result = await client._request('public/SystemStatus')

            assert result['status'] == 'online'
            assert call_count == 3  # Two failures, then success

    @pytest.mark.asyncio
    async def test_max_retry_exceeded(self, client):
        """Test that max retries are respected"""
        await client.connect()  # Connect first
        with patch.object(client.session, 'request') as mock_request:
            mock_request.side_effect = aiohttp.ClientError("Persistent network error")

            with pytest.raises(aiohttp.ClientError):
                await client._request('public/SystemStatus')

            # Should have tried MAX_RETRIES + 1 times (initial + retries)
            assert mock_request.call_count == 6  # 1 initial + 5 retries

    @pytest.mark.asyncio
    async def test_ticker_cache(self, client):
        """Test ticker data caching"""
        await client.connect()  # Connect first
        mock_response = {
            'error': [],
            'result': {
                'XXBTZUSD': {
                    'a': ['50000.00', '1'],
                    'b': ['49999.00', '1'],
                    'c': ['50000.00', '0.01']
                }
            }
        }

        with patch.object(client.session, 'request') as mock_request:
            mock_request.return_value.__aenter__.return_value.json = AsyncMock(
                return_value=mock_response
            )

            # First call should hit the API
            result1 = await client.get_ticker('XBTUSD')
            assert 'XXBTZUSD' in result1

            # Second call within cache TTL should use cache
            result2 = await client.get_ticker('XBTUSD')
            assert result1 == result2

            # Should only have made one API call
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_rate_limiting(self, client):
        """Test rate limiting functionality"""
        await client.connect()  # Connect first
        loop = asyncio.get_running_loop()
        start_time = loop.time()

        # Make multiple rapid requests
        with patch.object(client.session, 'request') as mock_request:
            mock_request.return_value.__aenter__.return_value.json = AsyncMock(
                return_value={'error': [], 'result': {'status': 'ok'}}
            )

            tasks = [client._request('public/Time') for _ in range(5)]
            await asyncio.gather(*tasks)

        end_time = loop.time()
        elapsed = end_time - start_time

        # With rate limiting (3 calls per 3 seconds), 5 calls should take > 3 seconds
        assert elapsed >= 3.0

    @pytest.mark.asyncio
    async def test_place_order_validation(self, client):
        """Test order placement with validation"""
        await client.connect()  # Connect first
        mock_response = {
            'error': [],
            'result': {
                'descr': {'order': 'buy 0.01 XBTUSD @ limit 45000'},
                'txid': ['OXXXXX-XXXXX-XXXXX']
            }
        }

        with patch.object(client.session, 'request') as mock_request:
            mock_request.return_value.__aenter__.return_value.json = AsyncMock(
                return_value=mock_response
            )

            result = await client.place_order(
                pair='XBTUSD',
                type='buy',
                ordertype='limit',
                volume='0.01',
                price='45000'
            )

            assert 'txid' in result
            assert len(result['txid']) > 0

    @pytest.mark.asyncio
    async def test_cancel_order(self, client):
        """Test order cancellation"""
        await client.connect()  # Connect first
        mock_response = {
            'error': [],
            'result': {
                'count': 1,
                'pending': False
            }
        }

        with patch.object(client.session, 'request') as mock_request:
            mock_request.return_value.__aenter__.return_value.json = AsyncMock(
                return_value=mock_response
            )

            result = await client.cancel_order('OXXXXX-XXXXX-XXXXX')

            assert result['count'] == 1
            assert not result['pending']

    @pytest.mark.asyncio
    async def test_error_helper_methods(self):
        """Test KrakenAPIError helper methods"""
        # Test rate limit error detection
        error = KrakenAPIError("Rate limit exceeded", endpoint="test")
        assert error.is_rate_limit_error()
        assert not error.is_nonce_error()
        assert not error.is_permission_error()

        # Test nonce error detection
        error = KrakenAPIError("Invalid nonce", endpoint="test")
        assert error.is_nonce_error()
        assert not error.is_rate_limit_error()
        assert not error.is_permission_error()

        # Test permission error detection
        error = KrakenAPIError("Permission denied", endpoint="test")
        assert error.is_permission_error()
        assert not error.is_rate_limit_error()
        assert not error.is_nonce_error()

    @pytest.mark.asyncio
    async def test_context_manager(self, mock_config):
        """Test using client as context manager"""
        async with KrakenClient(mock_config) as client:
            assert client._connected
            assert client.session is not None

        # After exiting context, should be disconnected
        assert not client._connected
        assert client.session is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])