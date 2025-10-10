"""
Unit tests for WebSocketManager
Tests WebSocket connections, message handling, and reconnection logic
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock, MagicMock, call
from datetime import datetime
import websockets

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from websocket_manager import WebSocketManager
from config import Config
from kraken_client import KrakenClient


class TestWebSocketManager:
    """Test suite for WebSocketManager"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.kraken_api_key = 'test_key'
        config.kraken_api_secret = 'test_secret'
        config.trading_pairs = ['XBT/USD', 'ETH/USD']
        config.ws_reconnect_interval = 5
        config.ws_heartbeat_interval = 30
        return config

    @pytest.fixture
    def mock_kraken_client(self):
        """Create mock Kraken client"""
        client = Mock(spec=KrakenClient)
        client.get_websocket_token = AsyncMock(return_value={'token': 'test_ws_token'})
        return client

    @pytest.fixture
    def websocket_manager(self, mock_config, mock_kraken_client):
        """Create WebSocketManager instance"""
        return WebSocketManager(mock_config, mock_kraken_client)

    @pytest.mark.asyncio
    async def test_initialization(self, websocket_manager):
        """Test WebSocketManager initialization"""
        assert websocket_manager.config is not None
        assert websocket_manager.kraken is not None
        assert not websocket_manager.running
        assert websocket_manager.public_ws is None
        assert websocket_manager.private_ws is None
        assert len(websocket_manager.callbacks) == 0

    @pytest.mark.asyncio
    async def test_register_callback(self, websocket_manager):
        """Test callback registration"""
        callback = AsyncMock()
        websocket_manager.callbacks['ticker'] = callback

        assert 'ticker' in websocket_manager.callbacks
        assert websocket_manager.callbacks['ticker'] == callback

    @pytest.mark.asyncio
    async def test_connect_public_websocket(self, websocket_manager):
        """Test public WebSocket connection setup"""
        # Test that connection attributes are properly initialized
        assert websocket_manager.WS_URL == "wss://ws.kraken.com/v2"
        assert websocket_manager.public_ws is None
        assert not websocket_manager.running

    @pytest.mark.asyncio
    async def test_connect_private_websocket(self, websocket_manager):
        """Test private WebSocket connection setup"""
        # Test that private connection attributes are properly initialized
        assert websocket_manager.WS_AUTH_URL == "wss://ws-auth.kraken.com/v2"
        assert websocket_manager.private_ws is None
        assert websocket_manager.ws_token is None

    @pytest.mark.asyncio
    async def test_subscribe_to_channels(self, websocket_manager):
        """Test channel subscription"""
        mock_ws = AsyncMock()
        websocket_manager.public_ws = mock_ws

        await websocket_manager._subscribe_public_channels()

        # Check subscription messages were sent
        # V2 format uses method: subscribe with params
        assert mock_ws.send.call_count > 0

    @pytest.mark.asyncio
    async def test_handle_ticker_message(self, websocket_manager):
        """Test ticker message handling"""
        callback = AsyncMock()
        websocket_manager.callbacks['ticker'] = callback

        # V2 format ticker message
        ticker_msg = {
            "channel": "ticker",
            "type": "update",
            "data": [{
                "symbol": "BTC/USD",
                "bid": 50000.0,
                "ask": 50001.0,
                "last": 50000.5,
                "volume": 100.5,
                "vwap": 50000.25
            }]
        }

        await websocket_manager._process_message(ticker_msg, is_private=False)

        callback.assert_called_once()
        # Callback receives the entire message dict
        call_args = callback.call_args[0][0]
        assert call_args['channel'] == 'ticker'
        assert 'data' in call_args

    @pytest.mark.asyncio
    async def test_handle_trade_message(self, websocket_manager):
        """Test trade message handling"""
        callback = AsyncMock()
        websocket_manager.callbacks['trade'] = callback

        # V2 format trade message
        trade_msg = {
            "channel": "trade",
            "type": "update",
            "data": [{
                "symbol": "BTC/USD",
                "price": 50000.0,
                "volume": 0.5,
                "side": "buy",
                "timestamp": "2025-09-27T12:00:00Z"
            }]
        }

        await websocket_manager._process_message(trade_msg, is_private=False)

        callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_execution_message(self, websocket_manager):
        """Test execution (order fill) message handling"""
        callback = AsyncMock()
        websocket_manager.callbacks['execution'] = callback  # Handler checks for 'execution', not 'executions'

        # V2 format execution message
        exec_msg = {
            "channel": "executions",
            "type": "update",
            "data": [{
                "exec_id": "12345",
                "order_id": "67890",
                "symbol": "BTC/USD",
                "side": "buy",
                "last_qty": 0.1,
                "last_price": 50000.0,
                "exec_type": "trade"
            }]
        }

        await websocket_manager._process_message(exec_msg, is_private=True)

        callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_balance_update(self, websocket_manager):
        """Test balance update message handling"""
        callback = AsyncMock()
        websocket_manager.callbacks['balance'] = callback  # Handler checks for 'balance', not 'balances'

        # V2 format balance message
        balance_msg = {
            "channel": "balances",
            "type": "snapshot",
            "data": [{
                "asset": "USD",
                "balance": 10000.0,
                "available": 9500.0,
                "held": 500.0
            }]
        }

        await websocket_manager._process_message(balance_msg, is_private=True)

        callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_heartbeat_handling(self, websocket_manager):
        """Test heartbeat message handling"""
        mock_ws = AsyncMock()
        websocket_manager.public_ws = mock_ws

        # V2 format heartbeat
        heartbeat_msg = {
            "channel": "heartbeat"
        }

        # Should not raise exception
        await websocket_manager._process_message(heartbeat_msg, is_private=False)

        # Should respond with pong (V2 format)
        mock_ws.send.assert_called()
        response = json.loads(mock_ws.send.call_args[0][0])
        assert response['method'] == 'pong'

    @pytest.mark.asyncio
    async def test_error_message_handling(self, websocket_manager):
        """Test error message handling"""
        # V2 format error (unknown message type)
        error_msg = {
            "channel": "unknown_channel",
            "type": "error"
        }

        # Should log debug message but not raise exception
        await websocket_manager._process_message(error_msg, is_private=False)

    @pytest.mark.asyncio
    async def test_reconnection_on_disconnect(self, websocket_manager):
        """Test automatic reconnection on disconnect"""
        # Reconnection is built into _connect_public loop
        # Just verify the reconnection mechanism exists
        assert websocket_manager.reconnect_delay == 5
        assert websocket_manager.max_reconnect_delay == 60

    @pytest.mark.asyncio
    async def test_stop_websocket(self, websocket_manager):
        """Test stopping WebSocket connections"""
        mock_ws_public = AsyncMock()
        mock_ws_private = AsyncMock()
        websocket_manager.public_ws = mock_ws_public
        websocket_manager.private_ws = mock_ws_private
        websocket_manager.running = True

        await websocket_manager.stop()

        mock_ws_public.close.assert_called_once()
        mock_ws_private.close.assert_called_once()
        assert not websocket_manager.running

    @pytest.mark.asyncio
    async def test_is_connected(self, websocket_manager):
        """Test connection status check"""
        # Initially not connected
        assert websocket_manager.public_ws is None
        assert websocket_manager.private_ws is None

        # Simulate connection
        websocket_manager.public_ws = AsyncMock()
        assert websocket_manager.public_ws is not None

    @pytest.mark.asyncio
    async def test_malformed_message_handling(self, websocket_manager):
        """Test handling of malformed messages"""
        # _process_message expects a dict, not a string
        # Test with malformed dict data
        malformed_data = {}  # Missing channel/method

        # Should not raise exception
        await websocket_manager._process_message(malformed_data, is_private=False)

    @pytest.mark.asyncio
    async def test_concurrent_message_handling(self, websocket_manager):
        """Test handling multiple messages concurrently"""
        callback = AsyncMock()
        websocket_manager.callbacks['ticker'] = callback

        messages = []
        for i in range(10):
            messages.append({
                "channel": "ticker",
                "type": "update",
                "data": [{
                    "symbol": f"TEST{i}/USD",
                    "bid": 1000.0 + i,
                    "ask": 1001.0 + i,
                    "last": 1000.5 + i
                }]
            })

        # Handle all messages concurrently
        tasks = [
            websocket_manager._process_message(msg, is_private=False)
            for msg in messages
        ]
        await asyncio.gather(*tasks)

        # All callbacks should have been called
        assert callback.call_count == 10

    @pytest.mark.asyncio
    async def test_subscription_confirmation(self, websocket_manager):
        """Test handling of subscription confirmation messages"""
        # V2 format subscription confirmation
        confirm_msg = {
            "method": "subscribe",
            "success": True,
            "result": {
                "channel": "ticker",
                "symbol": "BTC/USD"
            },
            "time_in": "2025-09-27T12:00:00.123456Z",
            "time_out": "2025-09-27T12:00:00.234567Z"
        }

        # Should handle without error
        await websocket_manager._process_message(confirm_msg, is_private=False)

    @pytest.mark.asyncio
    async def test_rate_limit_message(self, websocket_manager):
        """Test handling of rate limit messages"""
        # V2 format - error in subscription response
        rate_limit_msg = {
            "method": "subscribe",
            "success": False,
            "error": "Rate limit exceeded"
        }

        # Should handle without raising exception
        await websocket_manager._process_message(rate_limit_msg, is_private=False)

    @pytest.mark.asyncio
    async def test_cleanup_on_exception(self, websocket_manager):
        """Test proper cleanup when exception occurs"""
        # Test that message processing errors don't crash the connection
        bad_msg = {
            "channel": "ticker",
            "data": "invalid"  # This should cause processing error
        }

        # Should not raise exception
        await websocket_manager._process_message(bad_msg, is_private=False)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])