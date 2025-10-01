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
    TradingEngine, OrderType, OrderSide, RiskManager,
    MomentumStrategy, MeanReversionStrategy, ArbitrageStrategy
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
        result = await trading_engine.place_order(
            pair='XBT/USD',
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            volume='0.01',
            price='45000'
        )

        assert result['txid'] == ['TEST-ORDER-123']
        trading_engine.kraken.place_order.assert_called_once()
        trading_engine.db.log_order.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_order(self, trading_engine):
        """Test order cancellation"""
        order_id = 'TEST-ORDER-123'
        trading_engine.pending_orders[order_id] = {
            'pair': 'XBT/USD',
            'side': 'buy',
            'volume': '0.01'
        }

        result = await trading_engine.cancel_order(order_id)

        assert result['count'] == 1
        assert order_id not in trading_engine.pending_orders
        trading_engine.kraken.cancel_order.assert_called_once_with(order_id)

    @pytest.mark.asyncio
    async def test_cancel_all_orders(self, trading_engine):
        """Test cancelling all orders"""
        trading_engine.pending_orders = {
            'ORDER1': {'pair': 'XBT/USD'},
            'ORDER2': {'pair': 'ETH/USD'}
        }

        await trading_engine.cancel_all_orders()

        assert len(trading_engine.pending_orders) == 0
        assert trading_engine.kraken.cancel_order.call_count == 2

    @pytest.mark.asyncio
    async def test_close_position(self, trading_engine):
        """Test closing a position"""
        position_id = 'POS-123'
        trading_engine.positions[position_id] = {
            'id': position_id,
            'pair': 'XBT/USD',
            'side': 'long',
            'volume': Decimal('0.01'),
            'entry_price': Decimal('45000'),
            'current_price': Decimal('50000')
        }

        await trading_engine.close_position(position_id, reason='Take profit')

        assert position_id not in trading_engine.positions
        trading_engine.kraken.place_order.assert_called_once()
        # Should place a sell order to close the long position
        call_args = trading_engine.kraken.place_order.call_args[1]
        assert call_args['type'] == 'sell'

    @pytest.mark.asyncio
    async def test_risk_management(self, trading_engine):
        """Test risk management checks"""
        # Add some positions
        trading_engine.positions = {
            'POS1': {'exposure': Decimal('2000')},
            'POS2': {'exposure': Decimal('2000')}
        }

        # Risk check should pass (total exposure 4000 < max 5000)
        can_trade = await trading_engine.risk_manager.can_open_position(Decimal('500'))
        assert can_trade

        # Risk check should fail (would exceed max exposure)
        can_trade = await trading_engine.risk_manager.can_open_position(Decimal('2000'))
        assert not can_trade

    @pytest.mark.asyncio
    async def test_get_metrics(self, trading_engine):
        """Test getting trading metrics"""
        metrics = await trading_engine.get_metrics()

        assert metrics['total_trades'] == 10
        assert metrics['win_rate'] == 0.6
        assert metrics['total_pnl'] == 500
        trading_engine.db.get_metrics.assert_called_once()

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
        execution_data = {
            'order_id': 'ORDER-123',
            'exec_id': 'EXEC-456',
            'symbol': 'BTC/USD',
            'side': 'buy',
            'last_qty': 0.01,
            'last_price': 50000,
            'exec_type': 'trade'
        }

        # Add pending order
        trading_engine.pending_orders['ORDER-123'] = {
            'pair': 'BTC/USD',
            'side': 'buy',
            'volume': 0.01
        }

        await trading_engine._on_execution_update(execution_data)

        # Order should be moved from pending to positions
        assert 'ORDER-123' not in trading_engine.pending_orders
        # Should have created a position
        assert len(trading_engine.positions) > 0

    @pytest.mark.asyncio
    async def test_balance_update_callback(self, trading_engine):
        """Test balance update callback"""
        balance_data = {
            'asset': 'USD',
            'balance': 10000,
            'available': 9500
        }

        await trading_engine._on_balance_update(balance_data)

        assert 'balance' in trading_engine.market_data
        assert trading_engine.market_data['balance']['USD'] == 10000


class TestMomentumStrategy:
    """Test suite for MomentumStrategy"""

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock()
        engine.config = Mock()
        engine.config.trading_pairs = ['XBT/USD', 'ETH/USD']
        engine.config.max_position_size = 1000
        engine.market_data = {}
        engine.positions = {}
        engine.place_order = AsyncMock()
        engine.close_position = AsyncMock()
        engine.kraken = Mock()
        engine.kraken.get_ticker = AsyncMock(return_value={
            'XXBTZUSD': {'c': ['50000', '0.01']}
        })
        return engine

    @pytest.fixture
    def momentum_strategy(self, mock_engine):
        """Create MomentumStrategy instance"""
        return MomentumStrategy(mock_engine)

    @pytest.mark.asyncio
    async def test_momentum_calculation_buy_signal(self, momentum_strategy):
        """Test momentum calculation generating buy signal"""
        trades = [
            {'price': '49000'} for _ in range(5)  # Older trades
        ] + [
            {'price': '50000'} for _ in range(5)  # Recent trades
        ]

        signal = momentum_strategy._calculate_momentum(trades)
        assert signal == 'buy'  # Price increased by ~2%

    @pytest.mark.asyncio
    async def test_momentum_calculation_sell_signal(self, momentum_strategy):
        """Test momentum calculation generating sell signal"""
        trades = [
            {'price': '50000'} for _ in range(5)  # Older trades
        ] + [
            {'price': '49000'} for _ in range(5)  # Recent trades
        ]

        signal = momentum_strategy._calculate_momentum(trades)
        assert signal == 'sell'  # Price decreased by ~2%

    @pytest.mark.asyncio
    async def test_momentum_calculation_no_signal(self, momentum_strategy):
        """Test momentum calculation with no signal"""
        trades = [
            {'price': '50000'} for _ in range(10)  # Flat price
        ]

        signal = momentum_strategy._calculate_momentum(trades)
        assert signal is None  # No significant momentum

    @pytest.mark.asyncio
    async def test_momentum_strategy_evaluation(self, momentum_strategy, mock_engine):
        """Test momentum strategy evaluation"""
        # Add trade data to market
        mock_engine.market_data['XBT/USD_trades'] = [
            {'price': '49000'} for _ in range(5)
        ] + [
            {'price': '50000'} for _ in range(5)
        ]

        await momentum_strategy.evaluate()

        # Should place a buy order due to positive momentum
        mock_engine.place_order.assert_called()
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.BUY


class TestMeanReversionStrategy:
    """Test suite for MeanReversionStrategy"""

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock()
        engine.config = Mock()
        engine.config.trading_pairs = ['XBT/USD']
        engine.config.max_position_size = 1000
        engine.market_data = {}
        engine.positions = {}
        engine.place_order = AsyncMock()
        engine.close_position = AsyncMock()
        engine.kraken = Mock()
        engine.kraken.get_ticker = AsyncMock(return_value={
            'XXBTZUSD': {'c': ['50000', '0.01']}
        })
        return engine

    @pytest.fixture
    def mean_reversion_strategy(self, mock_engine):
        """Create MeanReversionStrategy instance"""
        return MeanReversionStrategy(mock_engine)

    @pytest.mark.asyncio
    async def test_mean_reversion_buy_signal(self, mean_reversion_strategy):
        """Test mean reversion generating buy signal (oversold)"""
        # Create trades with current price significantly below mean
        trades = [{'price': '50000'} for _ in range(19)]  # Mean around 50000
        trades.append({'price': '47000'})  # Current price well below mean

        signal = mean_reversion_strategy._calculate_reversion(trades)
        assert signal == 'buy'  # Price is oversold

    @pytest.mark.asyncio
    async def test_mean_reversion_sell_signal(self, mean_reversion_strategy):
        """Test mean reversion generating sell signal (overbought)"""
        # Create trades with current price significantly above mean
        trades = [{'price': '50000'} for _ in range(19)]  # Mean around 50000
        trades.append({'price': '53000'})  # Current price well above mean

        signal = mean_reversion_strategy._calculate_reversion(trades)
        assert signal == 'sell'  # Price is overbought

    @pytest.mark.asyncio
    async def test_mean_reversion_no_signal(self, mean_reversion_strategy):
        """Test mean reversion with no signal"""
        # All prices around the same level
        trades = [{'price': '50000'} for _ in range(20)]

        signal = mean_reversion_strategy._calculate_reversion(trades)
        assert signal is None  # Price is at mean


class TestArbitrageStrategy:
    """Test suite for ArbitrageStrategy"""

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock()
        engine.config = Mock()
        engine.config.trading_pairs = ['XBT/USD', 'ETH/USD', 'ETH/XBT']
        engine.config.max_position_size = 1000
        engine.market_data = {
            'XBT/USD_ticker': {'bid': 50000, 'ask': 50100},
            'ETH/USD_ticker': {'bid': 3000, 'ask': 3010},
            'ETH/XBT_ticker': {'bid': 0.059, 'ask': 0.061}
        }
        engine.place_order = AsyncMock()
        return engine

    @pytest.fixture
    def arbitrage_strategy(self, mock_engine):
        """Create ArbitrageStrategy instance"""
        return ArbitrageStrategy(mock_engine)

    @pytest.mark.asyncio
    async def test_triangular_profit_calculation(self, arbitrage_strategy):
        """Test triangular arbitrage profit calculation"""
        pairs = ['XBT/USD', 'ETH/USD', 'ETH/XBT']
        prices = {
            'XBT/USD': Decimal('50000'),
            'ETH/USD': Decimal('3000'),
            'ETH/XBT': Decimal('0.06')  # ETH = 0.06 BTC
        }

        profit = arbitrage_strategy._calculate_triangular_profit(pairs, prices)
        # Starting with 1 BTC -> USD -> ETH -> BTC should result in profit/loss
        assert isinstance(profit, Decimal)

    @pytest.mark.asyncio
    async def test_arbitrage_opportunity_detection(self, arbitrage_strategy, mock_engine):
        """Test detection of arbitrage opportunities"""
        # Set up market data with arbitrage opportunity
        mock_engine.market_data = {
            'XBT/USD_ticker': {'bid': 50000, 'ask': 50100},
            'ETH/USD_ticker': {'bid': 3000, 'ask': 3010},
            'ETH/XBT_ticker': {'bid': 0.055, 'ask': 0.056}  # Mispriced
        }

        await arbitrage_strategy.evaluate()

        # Check if strategy attempted to evaluate opportunities
        # (actual execution depends on profit threshold)
        assert arbitrage_strategy.arbitrage_pairs is not None

    @pytest.mark.asyncio
    async def test_direct_arbitrage_check(self, arbitrage_strategy, mock_engine):
        """Test direct arbitrage detection (negative spread)"""
        # Set up impossible scenario where bid > ask (arbitrage opportunity)
        mock_engine.market_data = {
            'XBT/USD_ticker': {'bid': 50100, 'ask': 50000}  # Bid > Ask!
        }
        mock_engine.config.trading_pairs = ['XBT/USD']

        await arbitrage_strategy._check_direct_arbitrage()

        # Should detect and attempt to execute arbitrage
        mock_engine.place_order.assert_called()


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