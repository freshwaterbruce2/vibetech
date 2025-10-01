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
        assert websocket_manager.kraken_client is not None
        assert not websocket_manager._connected
        assert websocket_manager.ws_public is None
        assert websocket_manager.ws_private is None
        assert len(websocket_manager.callbacks) == 0

    @pytest.mark.asyncio
    async def test_register_callback(self, websocket_manager):
        """Test callback registration"""
        callback = Mock()
        websocket_manager.register_callback('ticker', callback)

        assert 'ticker' in websocket_manager.callbacks
        assert callback in websocket_manager.callbacks['ticker']

        # Register another callback for same channel
        callback2 = Mock()
        websocket_manager.register_callback('ticker', callback2)

        assert len(websocket_manager.callbacks['ticker']) == 2

    @pytest.mark.asyncio
    async def test_connect_public_websocket(self, websocket_manager):
        """Test public WebSocket connection"""
        mock_ws = AsyncMock()
        mock_ws.recv = AsyncMock(return_value=json.dumps({
            'event': 'systemStatus',
            'status': 'online',
            'version': '1.0.0'
        }))

        with patch('websockets.connect', return_value=mock_ws):
            await websocket_manager._connect_public()

            assert websocket_manager.ws_public == mock_ws
            assert websocket_manager._connected

    @pytest.mark.asyncio
    async def test_connect_private_websocket(self, websocket_manager):
        """Test private WebSocket connection with authentication"""
        mock_ws = AsyncMock()
        mock_ws.recv = AsyncMock(return_value=json.dumps({
            'event': 'systemStatus',
            'status': 'online',
            'version': '1.0.0'
        }))
        mock_ws.send = AsyncMock()

        with patch('websockets.connect', return_value=mock_ws):
            await websocket_manager._connect_private()

            # Verify authentication message was sent
            mock_ws.send.assert_called()
            auth_msg = json.loads(mock_ws.send.call_args[0][0])
            assert auth_msg['event'] == 'subscribe'
            assert 'token' in auth_msg
            assert auth_msg['token'] == 'test_ws_token'

    @pytest.mark.asyncio
    async def test_subscribe_to_channels(self, websocket_manager):
        """Test channel subscription"""
        mock_ws = AsyncMock()
        websocket_manager.ws_public = mock_ws

        await websocket_manager._subscribe_public_channels()

        # Check subscription messages were sent
        calls = mock_ws.send.call_args_list

        # Should subscribe to ticker for each pair
        ticker_subs = [c for c in calls if 'ticker' in str(c)]
        assert len(ticker_subs) >= 2  # One for each trading pair

        # Should subscribe to trade channel
        trade_subs = [c for c in calls if 'trade' in str(c)]
        assert len(trade_subs) >= 2

    @pytest.mark.asyncio
    async def test_handle_ticker_message(self, websocket_manager):
        """Test ticker message handling"""
        callback = AsyncMock()
        websocket_manager.register_callback('ticker', callback)

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

        await websocket_manager._handle_public_message(json.dumps(ticker_msg))

        callback.assert_called_once()
        call_args = callback.call_args[0][0]
        assert call_args['symbol'] == 'BTC/USD'
        assert call_args['bid'] == 50000.0
        assert call_args['ask'] == 50001.0

    @pytest.mark.asyncio
    async def test_handle_trade_message(self, websocket_manager):
        """Test trade message handling"""
        callback = AsyncMock()
        websocket_manager.register_callback('trade', callback)

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

        await websocket_manager._handle_public_message(json.dumps(trade_msg))

        callback.assert_called_once()
        call_args = callback.call_args[0][0]
        assert call_args['symbol'] == 'BTC/USD'
        assert call_args['price'] == 50000.0
        assert call_args['volume'] == 0.5
        assert call_args['side'] == 'buy'

    @pytest.mark.asyncio
    async def test_handle_execution_message(self, websocket_manager):
        """Test execution (order fill) message handling"""
        callback = AsyncMock()
        websocket_manager.register_callback('execution', callback)

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

        await websocket_manager._handle_private_message(json.dumps(exec_msg))

        callback.assert_called_once()
        call_args = callback.call_args[0][0]
        assert call_args['exec_id'] == '12345'
        assert call_args['order_id'] == '67890'
        assert call_args['last_qty'] == 0.1

    @pytest.mark.asyncio
    async def test_handle_balance_update(self, websocket_manager):
        """Test balance update message handling"""
        callback = AsyncMock()
        websocket_manager.register_callback('balance', callback)

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

        await websocket_manager._handle_private_message(json.dumps(balance_msg))

        callback.assert_called_once()
        call_args = callback.call_args[0][0]
        assert call_args['asset'] == 'USD'
        assert call_args['balance'] == 10000.0
        assert call_args['available'] == 9500.0

    @pytest.mark.asyncio
    async def test_heartbeat_handling(self, websocket_manager):
        """Test heartbeat message handling"""
        mock_ws = AsyncMock()
        websocket_manager.ws_public = mock_ws

        heartbeat_msg = {
            "channel": "heartbeat"
        }

        # Should not raise exception
        await websocket_manager._handle_public_message(json.dumps(heartbeat_msg))

        # Should respond with pong
        mock_ws.send.assert_called()
        response = json.loads(mock_ws.send.call_args[0][0])
        assert response['event'] == 'pong'

    @pytest.mark.asyncio
    async def test_error_message_handling(self, websocket_manager):
        """Test error message handling"""
        error_msg = {
            "event": "error",
            "errorMessage": "Invalid subscription",
            "reqid": 12345
        }

        # Should log error but not raise exception
        with patch('logging.Logger.error') as mock_log:
            await websocket_manager._handle_public_message(json.dumps(error_msg))
            mock_log.assert_called()

    @pytest.mark.asyncio
    async def test_reconnection_on_disconnect(self, websocket_manager):
        """Test automatic reconnection on disconnect"""
        mock_ws = AsyncMock()
        mock_ws.recv = AsyncMock(side_effect=[
            json.dumps({'event': 'systemStatus', 'status': 'online'}),
            websockets.exceptions.ConnectionClosed(None, None),  # Simulate disconnect
        ])

        reconnect_called = False

        async def mock_reconnect():
            nonlocal reconnect_called
            reconnect_called = True

        websocket_manager._reconnect_public = mock_reconnect

        with patch('websockets.connect', return_value=mock_ws):
            await websocket_manager._connect_public()

            # Start listening (will disconnect)
            listen_task = asyncio.create_task(websocket_manager._listen_public())
            await asyncio.sleep(0.1)
            listen_task.cancel()

            # Should attempt reconnection
            assert reconnect_called or websocket_manager._reconnecting

    @pytest.mark.asyncio
    async def test_stop_websocket(self, websocket_manager):
        """Test stopping WebSocket connections"""
        mock_ws_public = AsyncMock()
        mock_ws_private = AsyncMock()
        websocket_manager.ws_public = mock_ws_public
        websocket_manager.ws_private = mock_ws_private
        websocket_manager._connected = True

        await websocket_manager.stop()

        mock_ws_public.close.assert_called_once()
        mock_ws_private.close.assert_called_once()
        assert not websocket_manager._connected

    @pytest.mark.asyncio
    async def test_is_connected(self, websocket_manager):
        """Test connection status check"""
        assert not websocket_manager.is_connected()

        websocket_manager._connected = True
        assert websocket_manager.is_connected()

    @pytest.mark.asyncio
    async def test_malformed_message_handling(self, websocket_manager):
        """Test handling of malformed messages"""
        malformed_messages = [
            "not json",
            "{invalid json}",
            "",
            None
        ]

        for msg in malformed_messages:
            # Should not raise exception
            with patch('logging.Logger.error') as mock_log:
                await websocket_manager._handle_public_message(msg)
                if msg:  # None won't trigger error log
                    mock_log.assert_called()

    @pytest.mark.asyncio
    async def test_concurrent_message_handling(self, websocket_manager):
        """Test handling multiple messages concurrently"""
        callback = AsyncMock()
        websocket_manager.register_callback('ticker', callback)

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
            websocket_manager._handle_public_message(json.dumps(msg))
            for msg in messages
        ]
        await asyncio.gather(*tasks)

        # All callbacks should have been called
        assert callback.call_count == 10

    @pytest.mark.asyncio
    async def test_subscription_confirmation(self, websocket_manager):
        """Test handling of subscription confirmation messages"""
        confirm_msg = {
            "event": "subscriptionStatus",
            "status": "subscribed",
            "channelName": "ticker",
            "pair": "XBT/USD",
            "reqid": 42
        }

        # Should handle without error
        await websocket_manager._handle_public_message(json.dumps(confirm_msg))

    @pytest.mark.asyncio
    async def test_rate_limit_message(self, websocket_manager):
        """Test handling of rate limit messages"""
        rate_limit_msg = {
            "event": "error",
            "errorMessage": "Rate limit exceeded",
            "reqid": 100
        }

        with patch('logging.Logger.warning') as mock_log:
            await websocket_manager._handle_public_message(json.dumps(rate_limit_msg))
            mock_log.assert_called()

    @pytest.mark.asyncio
    async def test_cleanup_on_exception(self, websocket_manager):
        """Test proper cleanup when exception occurs"""
        mock_ws = AsyncMock()
        mock_ws.recv = AsyncMock(side_effect=Exception("Test exception"))
        websocket_manager.ws_public = mock_ws
        websocket_manager._connected = True

        with patch('logging.Logger.error') as mock_log:
            listen_task = asyncio.create_task(websocket_manager._listen_public())
            await asyncio.sleep(0.1)
            listen_task.cancel()

            mock_log.assert_called()
            # Connection should be marked as disconnected
            assert not websocket_manager._connected or websocket_manager._reconnecting


if __name__ == "__main__":
    pytest.main([__file__, "-v"])