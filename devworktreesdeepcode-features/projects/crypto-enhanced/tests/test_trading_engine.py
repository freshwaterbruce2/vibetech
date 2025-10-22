"""
Unit tests for TradingEngine and trading strategies
Tests strategy execution, risk management, and order placement
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from decimal import Decimal
from datetime import datetime

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from trading_engine import (
    TradingEngine, OrderType, OrderSide, RiskManager
)
from strategies import (
    Strategy, RSIMeanReversionStrategy, RangeTradingStrategy,
    MicroScalpingStrategy, StrategyManager
)
from config import Config
from kraken_client import KrakenClient
from websocket_manager import WebSocketManager
from database import Database


class TestTradingEngine:
    """Test suite for TradingEngine"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.trading_pairs = ['XBT/USD', 'ETH/USD', 'XLM/USD']
        config.max_position_size = 30
        config.max_total_exposure = 90
        config.max_positions = 3
        config.max_risk_score = 0.8
        config.engine_loop_interval = 5
        config.enable_momentum_strategy = True
        config.enable_mean_reversion_strategy = True
        config.enable_arbitrage_strategy = True
        config.maker_fee = 0.0016
        config.taker_fee = 0.0026
        return config

    @pytest.fixture
    def mock_kraken_client(self):
        """Create mock Kraken client"""
        client = Mock(spec=KrakenClient)
        client.get_account_balance = AsyncMock(return_value={'ZUSD': '10000', 'XXBT': '0.5'})
        client.get_ticker = AsyncMock(return_value={
            'XXBTZUSD': {
                'a': ['50000', '1'],  # ask
                'b': ['49999', '1'],  # bid
                'c': ['50000', '0.01']  # last trade
            }
        })
        client.place_order = AsyncMock(return_value={'txid': ['TEST-ORDER-123']})
        client.cancel_order = AsyncMock(return_value={'count': 1})
        client.get_open_orders = AsyncMock(return_value={'open': {}})
        return client

    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket manager"""
        ws = Mock(spec=WebSocketManager)
        ws.register_callback = Mock()
        ws.is_connected = Mock(return_value=True)
        ws.private_ws = Mock()  # Add private_ws attribute for place_order check
        ws.public_ws = Mock()   # Add public_ws attribute
        return ws

    @pytest.fixture
    def mock_database(self):
        """Create mock database"""
        db = Mock(spec=Database)
        db.initialize = AsyncMock()
        db.is_connected = AsyncMock(return_value=True)
        db.log_order = AsyncMock()
        db.record_order = AsyncMock()
        db.record_trade = AsyncMock()
        db.get_metrics = AsyncMock(return_value={
            'total_trades': 10,
            'win_rate': 0.6,
            'total_pnl': 500
        })
        return db

    @pytest.fixture
    def trading_engine(self, mock_kraken_client, mock_websocket, mock_database, mock_config):
        """Create TradingEngine instance"""
        return TradingEngine(mock_kraken_client, mock_websocket, mock_database, mock_config)

    @pytest.mark.asyncio
    async def test_engine_initialization(self, trading_engine):
        """Test trading engine initialization"""
        assert trading_engine.kraken is not None
        assert trading_engine.websocket is not None
        assert trading_engine.db is not None
        assert trading_engine.config is not None
        assert not trading_engine.running
        assert len(trading_engine.positions) == 0
        assert len(trading_engine.pending_orders) == 0

    @pytest.mark.asyncio
    async def test_callback_registration(self, trading_engine):
        """Test WebSocket callback registration"""
        assert trading_engine.websocket.register_callback.called
        calls = trading_engine.websocket.register_callback.call_args_list

        # Should register callbacks for ticker, trade, book, execution, balance
        callback_types = [call[0][0] for call in calls]
        assert 'ticker' in callback_types
        assert 'trade' in callback_types
        assert 'book' in callback_types
        assert 'execution' in callback_types
        assert 'balance' in callback_types

    @pytest.mark.asyncio
    async def test_place_order(self, trading_engine):
        """Test order placement"""
        # Mock WebSocket add_order to return success
        trading_engine.websocket.add_order = AsyncMock(return_value={'order_id': 'WS-ORDER-123'})

        # Use small values that pass risk checks (max position: $30, max exposure: $90)
        result = await trading_engine.place_order(
            pair='XBT/USD',
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            volume='0.01',
            price='1500'  # 0.01 * 1500 = $15 (under $30 limit)
        )

        # WebSocket V2 returns {'order_id': '...'}, not {'txid': [...]}
        assert 'order_id' in result
        assert result['order_id'] == 'WS-ORDER-123'
        trading_engine.websocket.add_order.assert_called_once()
        trading_engine.db.log_order.assert_called_once()

    # REMOVED: cancel_order() method doesn't exist - only cancel_all_orders()

    @pytest.mark.asyncio
    async def test_cancel_all_orders(self, trading_engine):
        """Test cancelling all orders"""
        # Mock WebSocket cancel_all_orders to return success
        trading_engine.websocket.cancel_all_orders = AsyncMock(return_value={'count': 2})

        result = await trading_engine.cancel_all_orders()

        # Verify WebSocket method was called
        trading_engine.websocket.cancel_all_orders.assert_called_once()
        # Verify result contains count
        assert result['count'] == 2

    @pytest.mark.asyncio
    async def test_close_position(self, trading_engine):
        """Test closing a position"""
        position_id = 'POS-123'
        # Use small values that pass risk checks
        trading_engine.positions[position_id] = {
            'id': position_id,
            'pair': 'XBT/USD',
            'side': 'buy',
            'volume': '0.01',  # Use string format like actual implementation
            'entry_price': 1500,  # 0.01 * 1500 = $15 (under $30 limit)
            'current_price': 1600
        }

        # Mock place_order to return success
        trading_engine.websocket.add_order = AsyncMock(return_value={'order_id': 'CLOSE-ORDER-123'})

        await trading_engine.close_position(position_id, reason='Take profit')

        # close_position calls place_order with opposite side (SELL for buy position)
        trading_engine.websocket.add_order.assert_called_once()
        call_args = trading_engine.websocket.add_order.call_args[1]
        assert call_args['side'] == OrderSide.SELL.value

    @pytest.mark.asyncio
    async def test_risk_management(self, trading_engine):
        """Test risk management checks"""
        # Add some positions (total $60)
        trading_engine.positions = {
            'POS1': {'volume': '0.01', 'entry_price': 3000},  # $30
            'POS2': {'volume': '0.01', 'entry_price': 3000}   # $30
        }

        # Risk check should pass (total exposure $60 + $10 = $70 < $90 max)
        can_trade = await trading_engine.risk_manager.approve_order(
            pair='XBT/USD',
            volume='0.01',
            positions=trading_engine.positions,
            price=1000  # $10
        )
        assert can_trade

        # Risk check should fail (would exceed max exposure: $60 + $40 = $100 > $90)
        can_trade = await trading_engine.risk_manager.approve_order(
            pair='XBT/USD',
            volume='0.01',
            positions=trading_engine.positions,
            price=4000  # $40
        )
        assert not can_trade

    @pytest.mark.asyncio
    async def test_get_metrics(self, trading_engine):
        """Test getting trading metrics"""
        # Add some test data
        trading_engine.positions = {'pos1': {}, 'pos2': {}}
        trading_engine.pending_orders = {'order1': {}}
        trading_engine.strategies = [Mock(), Mock()]

        metrics = await trading_engine.get_metrics()

        # get_metrics returns engine state, not database metrics
        assert metrics['positions'] == 2
        assert metrics['pending_orders'] == 1
        assert metrics['strategies'] == 2
        assert 'timestamp' in metrics
        assert 'risk_metrics' in metrics

    @pytest.mark.asyncio
    async def test_ticker_callback(self, trading_engine):
        """Test ticker update callback"""
        ticker_data = {
            'symbol': 'BTC/USD',
            'bid': 50000,
            'ask': 50001,
            'last': 50000.5
        }

        await trading_engine._on_ticker_update(ticker_data)

        assert 'BTC/USD_ticker' in trading_engine.market_data
        assert trading_engine.market_data['BTC/USD_ticker']['bid'] == 50000

    @pytest.mark.asyncio
    async def test_execution_callback(self, trading_engine):
        """Test order execution callback"""
        # V2 execution format with order update
        execution_data = {
            'channel': 'executions',
            'type': 'update',
            'data': [{
                'order_id': 'ORDER-123',
                'exec_id': 'EXEC-456',
                'symbol': 'BTC/USD',
                'side': 'buy',
                'last_qty': 0.01,
                'last_price': 50000,
                'exec_type': 'trade'
            }],
            'order': {
                'order_id': 'ORDER-123',
                'status': 'filled',
                'pair': 'BTC/USD'
            }
        }

        # Add pending order
        trading_engine.pending_orders['ORDER-123'] = {
            'order_id': 'ORDER-123',
            'pair': 'BTC/USD',
            'side': 'buy',
            'volume': 0.01
        }

        await trading_engine._on_execution_update(execution_data)

        # Order should be removed from pending (status: filled)
        assert 'ORDER-123' not in trading_engine.pending_orders
        # Should have market data with trade
        assert 'BTC/USD_trades' in trading_engine.market_data

    @pytest.mark.asyncio
    async def test_balance_update_callback(self, trading_engine):
        """Test balance update callback"""
        # V2 balance format
        balance_data = {
            'channel': 'balances',
            'type': 'snapshot',
            'data': [
                {'asset': 'USD', 'balance': 10000, 'available': 9500},
                {'asset': 'BTC', 'balance': 0.5, 'available': 0.5}
            ]
        }

        await trading_engine._on_balance_update(balance_data)

        assert 'balance' in trading_engine.market_data
        assert trading_engine.market_data['balance']['USD'] == 10000
        assert trading_engine.market_data['balance']['BTC'] == 0.5
        assert trading_engine.market_data['usd_balance'] == 10000


class TestRiskManager:
    """Test suite for RiskManager"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock()
        config.max_position_size = 30
        config.max_total_exposure = 90
        config.max_positions = 3
        config.max_risk_score = 0.8
        config.maker_fee = 0.0016
        config.taker_fee = 0.0026
        return config

    @pytest.fixture
    def risk_manager(self, mock_config):
        """Create RiskManager instance"""
        return RiskManager(mock_config)

    @pytest.mark.asyncio
    async def test_position_size_limit(self, risk_manager):
        """Test position size limit check"""
        positions = {}

        # Should allow position within limit (0.1 BTC at $500 = $50, but we check USD value $25)
        assert await risk_manager.approve_order('BTC/USD', '0.1', positions, 250.0)

        # Should reject position exceeding limit ($40 > $30 max)
        assert not await risk_manager.approve_order('BTC/USD', '0.1', positions, 400.0)

    @pytest.mark.asyncio
    async def test_total_exposure_limit(self, risk_manager):
        """Test total exposure limit check"""
        # Create existing positions worth $70
        positions = {
            'pos1': {'volume': '0.1', 'entry_price': 350.0},  # $35
            'pos2': {'volume': '0.1', 'entry_price': 350.0}   # $35
        }

        # Should allow position that doesn't exceed total exposure ($70 + $15 = $85 < $90)
        assert await risk_manager.approve_order('BTC/USD', '0.1', positions, 150.0)

        # Should reject position that would exceed total exposure ($70 + $25 = $95 > $90)
        assert not await risk_manager.approve_order('BTC/USD', '0.1', positions, 250.0)

    @pytest.mark.asyncio
    async def test_position_count_limit(self, risk_manager):
        """Test maximum position count limit"""
        # Create 3 existing positions (at max)
        positions = {
            'pos1': {'volume': '0.01', 'entry_price': 100.0},
            'pos2': {'volume': '0.01', 'entry_price': 100.0},
            'pos3': {'volume': '0.01', 'entry_price': 100.0}
        }

        # Should reject new position when at max count
        assert not await risk_manager.approve_order('BTC/USD', '0.01', positions, 100.0)

        # Remove one position
        del positions['pos3']

        # Should allow new position when below max count
        assert await risk_manager.approve_order('BTC/USD', '0.01', positions, 100.0)

    @pytest.mark.asyncio
    async def test_risk_score_calculation(self, risk_manager):
        """Test risk score calculation"""
        positions = {
            'pos1': {'volume': '0.1', 'entry_price': 200.0},  # $20
            'pos2': {'volume': '0.1', 'entry_price': 250.0}   # $25
        }

        mock_kraken = Mock()
        metrics = await risk_manager.calculate_metrics(positions, mock_kraken)

        # Check that metrics are calculated correctly
        assert metrics['position_count'] == 2
        assert metrics['total_exposure'] == 45.0  # $20 + $25
        assert metrics['largest_position'] == 25.0
        assert 0 <= metrics['risk_score'] <= 1

    @pytest.mark.asyncio
    async def test_update_exposure(self, risk_manager):
        """Test approve_order properly checks exposure"""
        positions = {}

        # First order should be approved
        assert await risk_manager.approve_order('BTC/USD', '0.1', positions, 250.0)  # $25

        # Add to positions to simulate the order being filled
        positions['pos1'] = {'volume': '0.1', 'entry_price': 250.0}

        # Second order should be approved if total stays under $90
        assert await risk_manager.approve_order('ETH/USD', '0.2', positions, 150.0)  # $30

        # Add second position
        positions['pos2'] = {'volume': '0.2', 'entry_price': 150.0}

        # Third order that would exceed total should be rejected ($25 + $30 + $40 = $95 > $90)
        assert not await risk_manager.approve_order('XLM/USD', '100', positions, 0.40)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])