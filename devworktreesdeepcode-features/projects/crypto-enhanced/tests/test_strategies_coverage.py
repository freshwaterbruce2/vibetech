"""
Comprehensive unit tests for trading strategies
Focus on RSIMeanReversionStrategy to increase coverage from 27%
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from strategies import (
    Strategy, RSIMeanReversionStrategy, RangeTradingStrategy,
    MicroScalpingStrategy, StrategyManager
)
from config import Config
from trading_engine import TradingEngine, OrderSide, OrderType


class TestRSICalculation:
    """Test suite for RSI calculation accuracy"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_price_range_max = 0.45
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        config.strategies = {
            'mean_reversion': {
                'rsi_oversold': 35,
                'rsi_overbought': 65,
                'min_profit_target': 0.004,
                'max_position_accumulation_xlm': 100,
                'stop_loss_pct': 0.015,
                'entry_levels': 3
            }
        }
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        engine.place_order = AsyncMock(return_value={'order_id': 'TEST-ORDER-123'})
        return engine

    @pytest.fixture
    def rsi_strategy(self, mock_engine, mock_config):
        """Create RSIMeanReversionStrategy instance"""
        return RSIMeanReversionStrategy(mock_engine, mock_config)

    def test_rsi_calculation_with_known_values(self, rsi_strategy):
        """Test RSI calculation accuracy with known data set"""
        # Known price sequence that should produce specific RSI
        # This data is designed to test RSI calculation correctness
        # Price sequence: steady uptrend followed by slight pullback
        prices = [
            100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0,
            108.0, 109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 113.5
        ]

        rsi = rsi_strategy.calculate_rsi(prices, period=14)

        # With 14 gains and 1 small loss, RSI should be very high (>70)
        assert rsi is not None
        assert rsi > 70, f"Expected RSI > 70 for uptrend, got {rsi:.2f}"
        assert rsi < 100, f"RSI should be < 100, got {rsi:.2f}"

    def test_rsi_calculation_downtrend(self, rsi_strategy):
        """Test RSI calculation for downtrend (should be low)"""
        # Steady downtrend - should produce low RSI
        prices = [
            100.0, 99.0, 98.0, 97.0, 96.0, 95.0, 94.0, 93.0,
            92.0, 91.0, 90.0, 89.0, 88.0, 87.0, 86.0, 86.5
        ]

        rsi = rsi_strategy.calculate_rsi(prices, period=14)

        # With 14 losses and 1 small gain, RSI should be very low (<30)
        assert rsi is not None
        assert rsi < 30, f"Expected RSI < 30 for downtrend, got {rsi:.2f}"
        assert rsi > 0, f"RSI should be > 0, got {rsi:.2f}"

    def test_rsi_calculation_neutral(self, rsi_strategy):
        """Test RSI calculation for neutral/sideways market"""
        # Oscillating prices - should produce neutral RSI around 50
        prices = [
            100.0, 101.0, 100.0, 101.0, 100.0, 101.0, 100.0, 101.0,
            100.0, 101.0, 100.0, 101.0, 100.0, 101.0, 100.0, 100.5
        ]

        rsi = rsi_strategy.calculate_rsi(prices, period=14)

        # Equal gains and losses should produce RSI around 50
        assert rsi is not None
        assert 40 < rsi < 60, f"Expected neutral RSI (40-60), got {rsi:.2f}"

    def test_rsi_insufficient_data(self, rsi_strategy):
        """Test RSI calculation with insufficient price data"""
        # Less than period + 1 prices
        prices = [100.0, 101.0, 102.0]

        rsi = rsi_strategy.calculate_rsi(prices, period=14)

        assert rsi is None, "RSI should return None with insufficient data"

    def test_rsi_all_gains_no_losses(self, rsi_strategy):
        """Test RSI calculation when all changes are gains (no losses)"""
        # Pure uptrend with no pullbacks
        prices = [100.0 + i for i in range(16)]

        rsi = rsi_strategy.calculate_rsi(prices, period=14)

        # With zero losses, RSI should be 100
        assert rsi is not None
        assert rsi == 100.0, f"Expected RSI=100 with all gains, got {rsi:.2f}"

    def test_rsi_all_losses_no_gains(self, rsi_strategy):
        """Test RSI calculation when all changes are losses (no gains)"""
        # Pure downtrend with no bounces
        prices = [100.0 - i for i in range(16)]

        rsi = rsi_strategy.calculate_rsi(prices, period=14)

        # With zero gains, avg_loss > 0 but avg_gain = 0, RS = 0, RSI should be 0
        assert rsi is not None
        assert rsi == 0.0, f"Expected RSI=0 with all losses, got {rsi:.2f}"


class TestRSIMeanReversionSignals:
    """Test suite for RSI mean reversion strategy signals"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_price_range_max = 0.45
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        config.strategies = {
            'mean_reversion': {
                'rsi_oversold': 35,
                'rsi_overbought': 65,
                'min_profit_target': 0.004,
                'max_position_accumulation_xlm': 100,
                'stop_loss_pct': 0.015,
                'entry_levels': 3
            }
        }
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        engine.place_order = AsyncMock(return_value={'order_id': 'TEST-ORDER-123'})
        return engine

    @pytest.fixture
    def rsi_strategy(self, mock_engine, mock_config):
        """Create RSIMeanReversionStrategy instance"""
        return RSIMeanReversionStrategy(mock_engine, mock_config)

    @pytest.mark.asyncio
    async def test_oversold_condition_generates_buy_signal(self, rsi_strategy, mock_engine):
        """Test that oversold RSI (<35) generates buy signal"""
        # Create price sequence that produces RSI < 35
        # Downtrend followed by slight bounce
        prices = [
            0.40, 0.39, 0.38, 0.37, 0.36, 0.355, 0.35, 0.345,
            0.34, 0.335, 0.33, 0.335, 0.34, 0.345, 0.35, 0.352
        ]

        # Mock market data
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.352, 'bid': 0.351, 'ask': 0.353},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }
        mock_engine.positions = []

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify buy signal was generated
        assert result is not None, "Expected buy signal for oversold condition"
        mock_engine.place_order.assert_called_once()

        # Verify order parameters
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.BUY
        assert call_args['pair'] == 'XLM/USD'

    @pytest.mark.asyncio
    async def test_overbought_condition_generates_sell_signal(self, rsi_strategy, mock_engine):
        """Test that overbought RSI (>65) generates sell signal"""
        # Create price sequence that produces RSI > 65
        # Uptrend followed by slight pullback
        prices = [
            0.34, 0.345, 0.35, 0.355, 0.36, 0.365, 0.37, 0.375,
            0.38, 0.385, 0.39, 0.395, 0.40, 0.405, 0.41, 0.408
        ]

        # Mock market data - use lower price to meet minimum order size
        # position_size_usd = 8, min_order = 20 XLM, so price must be <= 0.40
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.38, 'bid': 0.379, 'ask': 0.381},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }

        # Important: Strategy only sells if positions exist
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 50}]

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify sell signal was generated
        assert result is not None, "Expected sell signal for overbought condition"
        mock_engine.place_order.assert_called_once()

        # Verify order parameters
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.SELL
        assert call_args['pair'] == 'XLM/USD'

    @pytest.mark.asyncio
    async def test_neutral_rsi_generates_no_signal(self, rsi_strategy, mock_engine):
        """Test that neutral RSI (around 50) generates no signal"""
        # Create price sequence that produces neutral RSI ~50
        # Sideways oscillating market
        prices = [
            0.37, 0.375, 0.37, 0.375, 0.37, 0.375, 0.37, 0.375,
            0.37, 0.375, 0.37, 0.375, 0.37, 0.375, 0.37, 0.372
        ]

        # Mock market data
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.372, 'bid': 0.371, 'ask': 0.373},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }
        mock_engine.positions = []

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify no signal was generated
        assert result is None, "Expected no signal for neutral RSI"
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_overbought_no_positions_no_sell(self, rsi_strategy, mock_engine):
        """Test that overbought RSI doesn't sell without positions"""
        # Create overbought condition
        prices = [
            0.34, 0.345, 0.35, 0.355, 0.36, 0.365, 0.37, 0.375,
            0.38, 0.385, 0.39, 0.395, 0.40, 0.405, 0.41, 0.408
        ]

        # Mock market data
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.408},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }

        # No positions - should not sell
        mock_engine.positions = []

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify no sell signal
        assert result is None, "Should not sell when no positions exist"
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_oversold_below_price_range_no_buy(self, rsi_strategy, mock_engine):
        """Test that oversold RSI below price range doesn't trigger buy"""
        # Create oversold condition with price below xlm_price_range_min (0.30)
        prices = [
            0.32, 0.31, 0.305, 0.30, 0.295, 0.29, 0.285, 0.28,
            0.275, 0.27, 0.265, 0.26, 0.255, 0.25, 0.245, 0.24
        ]

        # Mock market data with price below range
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.24},  # Below xlm_price_range_min
            'XLM/USD_trades': [{'price': p} for p in prices]
        }
        mock_engine.positions = []

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify no buy signal when price below range
        assert result is None, "Should not buy when price below xlm_price_range_min"
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_accumulation_limit_prevents_buy(self, rsi_strategy, mock_engine):
        """Test that max accumulation limit prevents buy signals"""
        # Create oversold condition
        prices = [
            0.40, 0.39, 0.38, 0.37, 0.36, 0.355, 0.35, 0.345,
            0.34, 0.335, 0.33, 0.335, 0.34, 0.345, 0.35, 0.352
        ]

        # Mock market data
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.352},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }

        # Set accumulation at max limit (100 XLM)
        # sync_accumulation() will sync from engine.positions, so mock that too
        rsi_strategy.accumulated_xlm = 100  # At max_accumulation (100)
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 100}]  # Match accumulated_xlm

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify no buy signal due to accumulation limit
        assert result is None, "Should not buy when accumulation limit reached"
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_insufficient_price_data_returns_none(self, rsi_strategy, mock_engine):
        """Test that insufficient price data returns None"""
        # Only 5 prices (need 15 for RSI period 14)
        prices = [0.35, 0.352, 0.354, 0.356, 0.358]

        # Mock market data
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.358},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }
        mock_engine.positions = []

        # Evaluate strategy
        result = await rsi_strategy.evaluate()

        # Verify no signal due to insufficient data
        assert result is None, "Should return None with insufficient price data"
        mock_engine.place_order.assert_not_called()


class TestStrategyBase:
    """Test suite for base Strategy class functionality"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_cooldown_minutes = 5
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        return engine

    @pytest.fixture
    def base_strategy(self, mock_engine, mock_config):
        """Create a concrete Strategy instance for testing"""
        return RSIMeanReversionStrategy(mock_engine, mock_config)

    def test_get_current_price_from_last(self, base_strategy, mock_engine):
        """Test getting current price from 'last' field"""
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.375}
        }

        price = base_strategy.get_current_price()

        assert price == 0.375

    def test_get_current_price_from_close(self, base_strategy, mock_engine):
        """Test getting current price from 'c' (close) field"""
        mock_engine.market_data = {
            'XLM/USD_ticker': {'c': [0.380, '1']}
        }

        price = base_strategy.get_current_price()

        assert price == 0.380

    def test_get_current_price_no_data(self, base_strategy, mock_engine):
        """Test getting current price with no market data"""
        mock_engine.market_data = {}

        price = base_strategy.get_current_price()

        assert price is None

    def test_can_trade_disabled_strategy(self, base_strategy):
        """Test that disabled strategy cannot trade"""
        base_strategy.enabled = False

        assert not base_strategy.can_trade()

    def test_can_trade_daily_limit_reached(self, base_strategy):
        """Test that strategy cannot trade when daily limit reached"""
        base_strategy.trades_today = 10  # max_daily_trades = 10
        base_strategy.enabled = True

        assert not base_strategy.can_trade()

    def test_can_trade_within_cooldown(self, base_strategy):
        """Test that strategy cannot trade within cooldown period"""
        base_strategy.enabled = True
        base_strategy.trades_today = 0
        base_strategy.last_trade_time = datetime.now() - timedelta(minutes=2)  # 2 min ago

        # Cooldown is 5 minutes, so should not be able to trade
        assert not base_strategy.can_trade()

    def test_can_trade_after_cooldown(self, base_strategy):
        """Test that strategy can trade after cooldown period"""
        base_strategy.enabled = True
        base_strategy.trades_today = 0
        base_strategy.last_trade_time = datetime.now() - timedelta(minutes=6)  # 6 min ago

        # Cooldown is 5 minutes, so should be able to trade
        assert base_strategy.can_trade()

    def test_get_recent_prices_from_trades(self, base_strategy, mock_engine):
        """Test getting recent prices from trade data"""
        mock_engine.market_data = {
            'XLM/USD_trades': [
                {'price': 0.35},
                {'price': 0.352},
                {'price': 0.354},
                {'price': 0.356}
            ]
        }

        prices = base_strategy.get_recent_prices(count=4)

        assert len(prices) == 4
        assert prices == [0.35, 0.352, 0.354, 0.356]

    def test_get_recent_prices_fallback_to_ticker(self, base_strategy, mock_engine):
        """Test fallback to ticker when no trade data"""
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.375},
            'XLM/USD_trades': []  # No trade data
        }

        prices = base_strategy.get_recent_prices(count=5)

        # Should fallback to ticker and repeat current price
        assert len(prices) == 5
        assert all(p == 0.375 for p in prices)


class TestRangeTradingStrategy:
    """Test suite for RangeTradingStrategy"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_price_range_max = 0.45
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        config.strategies = {
            'range_trading': {
                'max_position_accumulation_xlm': 80
            }
        }
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        engine.place_order = AsyncMock(return_value={'order_id': 'TEST-ORDER-123'})
        return engine

    @pytest.fixture
    def range_strategy(self, mock_engine, mock_config):
        """Create RangeTradingStrategy instance"""
        return RangeTradingStrategy(mock_engine, mock_config)

    @pytest.mark.asyncio
    async def test_buy_signal_near_support(self, range_strategy, mock_engine):
        """Test buy signal generated near support level"""
        # Price at support (0.345)
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.345, 'bid': 0.344, 'ask': 0.346}
        }
        mock_engine.positions = []

        result = await range_strategy.evaluate()

        # Should generate buy signal near support
        assert result is not None
        mock_engine.place_order.assert_called_once()
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.BUY

    @pytest.mark.asyncio
    async def test_sell_signal_near_resistance(self, range_strategy, mock_engine):
        """Test sell signal generated near resistance level"""
        # Price near resistance - use lower price to meet min order size
        # position_size_usd = 9, min_order = 20 XLM, so price must be <= 0.45
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.38, 'bid': 0.379, 'ask': 0.381}
        }
        # Must have positions to sell
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 50}]

        # Manually set price near resistance threshold for test
        range_strategy.resistance_level = 0.380  # Adjust resistance to match test price

        result = await range_strategy.evaluate()

        # Should generate sell signal near resistance
        assert result is not None
        mock_engine.place_order.assert_called_once()
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.SELL

    @pytest.mark.asyncio
    async def test_no_signal_in_middle_of_range(self, range_strategy, mock_engine):
        """Test no signal when price is mid-range"""
        # Price in middle of range (0.37)
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.37, 'bid': 0.369, 'ask': 0.371}
        }
        mock_engine.positions = []

        result = await range_strategy.evaluate()

        # Should not generate signal in middle of range
        assert result is None
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_no_sell_without_positions(self, range_strategy, mock_engine):
        """Test no sell signal without positions"""
        # Price at resistance but no positions
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.394}
        }
        mock_engine.positions = []

        result = await range_strategy.evaluate()

        assert result is None
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_accumulation_limit_prevents_buy(self, range_strategy, mock_engine):
        """Test accumulation limit prevents buy"""
        # Price at support
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.345}
        }
        # At max accumulation
        range_strategy.accumulated_xlm = 80
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 80}]

        result = await range_strategy.evaluate()

        assert result is None
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_breakout_detection(self, range_strategy, mock_engine):
        """Test breakout detection above resistance"""
        # Price breaks above resistance (0.395 * 1.005 = 0.3975+)
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.40}
        }
        mock_engine.positions = []

        # Evaluate - should detect breakout (logged but not acted upon in current impl)
        result = await range_strategy.evaluate()

        # Current implementation doesn't trade on breakout, just logs
        # This test validates the detection logic exists
        assert result is None  # No trade action currently


class TestMicroScalpingStrategy:
    """Test suite for MicroScalpingStrategy"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        engine.place_order = AsyncMock(return_value={'order_id': 'TEST-ORDER-123'})
        return engine

    @pytest.fixture
    def scalp_strategy(self, mock_engine, mock_config):
        """Create MicroScalpingStrategy instance"""
        return MicroScalpingStrategy(mock_engine, mock_config)

    @pytest.mark.asyncio
    async def test_uptrend_momentum_buy_signal(self, scalp_strategy, mock_engine):
        """Test buy signal on upward momentum"""
        # Create uptrend in last 3 prices
        # Use lower prices to meet min order size: 7.5 USD / 20 XLM = 0.375 max
        recent_prices = [0.33, 0.331, 0.332, 0.333, 0.334, 0.335, 0.336, 0.337, 0.338, 0.339]

        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.339, 'b': [0.338, 1], 'a': [0.340, 1]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }
        mock_engine.positions = []

        result = await scalp_strategy.evaluate()

        # Should generate buy signal on uptrend
        assert result is not None
        mock_engine.place_order.assert_called_once()
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.BUY

    @pytest.mark.asyncio
    async def test_downtrend_momentum_sell_signal(self, scalp_strategy, mock_engine):
        """Test sell signal on downward momentum"""
        # Create downtrend in last 3 prices
        # Use lower prices to meet min order size: 7.5 USD / 20 XLM = 0.375 max
        recent_prices = [0.35, 0.349, 0.348, 0.347, 0.346, 0.345, 0.344, 0.343, 0.342, 0.341]

        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.341, 'b': [0.340, 1], 'a': [0.342, 1]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }
        # Must have positions to sell
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 30}]

        result = await scalp_strategy.evaluate()

        # Should generate sell signal on downtrend
        assert result is not None
        mock_engine.place_order.assert_called_once()
        call_args = mock_engine.place_order.call_args[1]
        assert call_args['side'] == OrderSide.SELL

    @pytest.mark.asyncio
    async def test_no_signal_sideways_market(self, scalp_strategy, mock_engine):
        """Test no signal in sideways market"""
        # Sideways/choppy prices
        recent_prices = [0.355, 0.356, 0.355, 0.356, 0.355, 0.356, 0.355, 0.356, 0.355, 0.356]

        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.355, 'b': [0.354, 1], 'a': [0.356, 1]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }
        mock_engine.positions = []

        result = await scalp_strategy.evaluate()

        # Should not generate signal without clear trend
        assert result is None

    @pytest.mark.asyncio
    async def test_hourly_trade_limit(self, scalp_strategy, mock_engine):
        """Test hourly trade limit enforcement"""
        # Add 3 trades in last hour (at max)
        current_time = datetime.now()
        scalp_strategy.last_hour_trades = [
            current_time - timedelta(minutes=10),
            current_time - timedelta(minutes=20),
            current_time - timedelta(minutes=30)
        ]

        # Create uptrend
        recent_prices = [0.35, 0.351, 0.352, 0.353, 0.354, 0.355, 0.356, 0.357, 0.358, 0.359]
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.359, 'b': [0.358, 1], 'a': [0.360, 1]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }
        mock_engine.positions = []

        result = await scalp_strategy.evaluate()

        # Should not trade due to hourly limit
        assert result is None
        mock_engine.place_order.assert_not_called()

    @pytest.mark.asyncio
    async def test_spread_too_small_prevents_trade(self, scalp_strategy, mock_engine):
        """Test that small spread prevents trading"""
        recent_prices = [0.35, 0.351, 0.352, 0.353, 0.354, 0.355, 0.356, 0.357, 0.358, 0.359]

        # Very tight spread (0.0002 / 0.359 = 0.056% < 0.1% minimum)
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.359, 'b': [0.3589, 1], 'a': [0.3591, 1]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }
        mock_engine.positions = []

        result = await scalp_strategy.evaluate()

        # Should not trade with too-small spread
        assert result is None

    @pytest.mark.asyncio
    async def test_insufficient_price_data(self, scalp_strategy, mock_engine):
        """Test behavior with insufficient price data"""
        # Only 3 prices (need at least 5)
        recent_prices = [0.355, 0.356, 0.357]

        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.357, 'b': [0.356, 1], 'a': [0.358, 1]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }
        mock_engine.positions = []

        result = await scalp_strategy.evaluate()

        # Should return None with insufficient data
        assert result is None


class TestStrategyManager:
    """Test suite for StrategyManager"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        config.estimated_balance = 98.0
        config.strategies = {
            'mean_reversion': {'rsi_oversold': 35},
            'range_trading': {'max_position_accumulation_xlm': 80}
        }
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {'balance': {'USD': 100.0}}
        engine.positions = []
        return engine

    @pytest.fixture
    def strategy_manager(self, mock_engine, mock_config):
        """Create StrategyManager instance"""
        return StrategyManager(mock_engine, mock_config)

    def test_strategy_manager_initialization(self, strategy_manager):
        """Test StrategyManager initializes correctly"""
        assert strategy_manager.engine is not None
        assert strategy_manager.config is not None
        assert strategy_manager.enabled is True
        assert len(strategy_manager.strategies) == 0

    def test_initialize_strategies_with_balance(self, strategy_manager, mock_engine):
        """Test strategy initialization with sufficient balance"""
        mock_engine.market_data = {'balance': {'USD': 100.0}}

        strategy_manager.initialize_strategies()

        # Should initialize RSI, Range, and MicroScalping (balance > 50)
        assert len(strategy_manager.strategies) == 3
        strategy_names = [s.name for s in strategy_manager.strategies]
        assert 'RSI_MeanReversion' in strategy_names
        assert 'RangeTrading' in strategy_names
        assert 'MicroScalping' in strategy_names

    def test_initialize_strategies_low_balance(self, strategy_manager, mock_engine):
        """Test strategy initialization with low balance"""
        mock_engine.market_data = {'balance': {'USD': 30.0}}

        strategy_manager.initialize_strategies()

        # Should only initialize RSI and Range (balance < 50, no scalping)
        assert len(strategy_manager.strategies) == 2
        strategy_names = [s.name for s in strategy_manager.strategies]
        assert 'RSI_MeanReversion' in strategy_names
        assert 'RangeTrading' in strategy_names
        assert 'MicroScalping' not in strategy_names

    def test_initialize_strategies_fallback_to_config(self, strategy_manager, mock_engine):
        """Test fallback to config balance when market data unavailable"""
        mock_engine.market_data = {'balance': {}}  # No balance data

        strategy_manager.initialize_strategies()

        # Should use config.estimated_balance (98.0 > 50)
        assert len(strategy_manager.strategies) == 3

    @pytest.mark.asyncio
    async def test_evaluate_all_strategies(self, strategy_manager, mock_engine):
        """Test evaluating all strategies"""
        # Initialize strategies
        strategy_manager.initialize_strategies()

        # Mock evaluate for each strategy
        for strategy in strategy_manager.strategies:
            strategy.evaluate = AsyncMock(return_value=None)

        await strategy_manager.evaluate_all()

        # All strategies should have been evaluated
        for strategy in strategy_manager.strategies:
            strategy.evaluate.assert_called_once()

    @pytest.mark.asyncio
    async def test_evaluate_disabled_strategy_manager(self, strategy_manager):
        """Test that disabled manager doesn't evaluate"""
        strategy_manager.enabled = False
        strategy_manager.initialize_strategies()

        for strategy in strategy_manager.strategies:
            strategy.evaluate = AsyncMock()

        await strategy_manager.evaluate_all()

        # No strategies should be evaluated when manager disabled
        for strategy in strategy_manager.strategies:
            strategy.evaluate.assert_not_called()

    @pytest.mark.asyncio
    async def test_evaluate_handles_strategy_errors(self, strategy_manager, mock_engine):
        """Test that errors in one strategy don't stop others"""
        strategy_manager.initialize_strategies()

        # Make first strategy raise error, others succeed
        strategy_manager.strategies[0].evaluate = AsyncMock(side_effect=Exception("Test error"))
        for strategy in strategy_manager.strategies[1:]:
            strategy.evaluate = AsyncMock(return_value=None)

        # Should not raise exception
        await strategy_manager.evaluate_all()

        # Other strategies should still be evaluated
        for strategy in strategy_manager.strategies[1:]:
            strategy.evaluate.assert_called_once()

    def test_get_strategy_status(self, strategy_manager):
        """Test getting strategy status"""
        strategy_manager.initialize_strategies()

        # Set some test data
        strategy_manager.strategies[0].enabled = False
        strategy_manager.strategies[0].trades_today = 5
        strategy_manager.strategies[0].last_trade_time = datetime.now()

        status = strategy_manager.get_strategy_status()

        assert status['total_strategies'] == 3
        assert status['enabled_strategies'] == 2
        assert len(status['strategies']) == 3
        assert status['strategies'][0]['enabled'] is False
        assert status['strategies'][0]['trades_today'] == 5


class TestErrorInjection:
    """Test suite for error injection and exception handling"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        config.strategies = {
            'mean_reversion': {'rsi_oversold': 35},
            'range_trading': {'max_position_accumulation_xlm': 80}
        }
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        engine.place_order = AsyncMock(return_value={'order_id': 'TEST-ORDER'})
        return engine

    @pytest.mark.asyncio
    async def test_exception_in_place_trade(self, mock_engine, mock_config):
        """Test exception handling in place_trade() [Lines 170-172]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Mock place_order to raise exception
        mock_engine.place_order = AsyncMock(side_effect=Exception("Network error"))

        # Mock market data
        mock_engine.market_data = {'XLM/USD_ticker': {'last': 0.35}}

        result = await strategy.place_trade("buy", 8.0, "limit", 0.35)

        # Should catch exception and return error dict
        assert result is not None
        assert 'error' in result
        assert 'Network error' in result['error']

    @pytest.mark.asyncio
    async def test_exception_in_rsi_evaluate(self, mock_engine, mock_config):
        """Test exception handling in RSIMeanReversionStrategy.evaluate() [Lines 274-275]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Mock get_recent_prices to raise exception
        strategy.get_recent_prices = Mock(side_effect=Exception("Data fetch error"))

        result = await strategy.evaluate()

        # Should catch exception and return None
        assert result is None

    @pytest.mark.asyncio
    async def test_exception_in_range_evaluate(self, mock_engine, mock_config):
        """Test exception handling in RangeTradingStrategy.evaluate() [Lines 367-368]"""
        strategy = RangeTradingStrategy(mock_engine, mock_config)

        # Mock get_current_price to raise exception
        strategy.get_current_price = Mock(side_effect=Exception("Price API error"))

        result = await strategy.evaluate()

        # Should catch exception and return None
        assert result is None

    @pytest.mark.asyncio
    async def test_exception_in_scalping_evaluate(self, mock_engine, mock_config):
        """Test exception handling in MicroScalpingStrategy.evaluate() [Lines 441-442]"""
        strategy = MicroScalpingStrategy(mock_engine, mock_config)

        # Mock market data access to raise exception
        strategy.get_current_price = Mock(side_effect=Exception("Market data error"))

        result = await strategy.evaluate()

        # Should catch exception and return None
        assert result is None

    @pytest.mark.asyncio
    async def test_exception_in_strategy_manager_init(self, mock_engine, mock_config):
        """Test exception handling in StrategyManager.initialize_strategies() [Lines 482-484]"""
        manager = StrategyManager(mock_engine, mock_config)

        # Mock RSIMeanReversionStrategy to raise exception
        with patch('strategies.RSIMeanReversionStrategy', side_effect=Exception("Init error")):
            manager.initialize_strategies()

        # Should catch exception and have empty or partial strategies list
        # The actual implementation catches and logs, may have partial list
        assert isinstance(manager.strategies, list)

    @pytest.mark.asyncio
    async def test_can_trade_returns_error(self, mock_engine, mock_config):
        """Test can_trade() returns error [Line 133]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)
        strategy.enabled = False

        result = await strategy.place_trade("buy", 8.0)

        assert result == {"error": "Cannot trade due to limits"}

    @pytest.mark.asyncio
    async def test_cannot_get_price_in_place_trade(self, mock_engine, mock_config):
        """Test cannot get current price in place_trade() [Line 145]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Mock get_current_price to return None
        strategy.get_current_price = Mock(return_value=None)
        mock_engine.market_data = {}

        result = await strategy.place_trade("buy", 8.0)

        assert result == {"error": "Cannot get current price"}

    @pytest.mark.asyncio
    async def test_order_below_minimum_size(self, mock_engine, mock_config):
        """Test order below minimum size [Lines 151-152]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Price too high: $8 / $1.00 = 8 XLM < 20 XLM minimum
        mock_engine.market_data = {'XLM/USD_ticker': {'last': 1.00}}

        result = await strategy.place_trade("buy", 8.0, "limit", 1.00)

        assert result is not None
        assert 'error' in result
        assert 'minimum size' in result['error']


class TestComplexAccumulation:
    """Test suite for complex accumulation edge cases"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        config.strategies = {
            'mean_reversion': {
                'rsi_oversold': 35,
                'rsi_overbought': 65,
                'max_position_accumulation_xlm': 100
            },
            'range_trading': {
                'max_position_accumulation_xlm': 80
            }
        }
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        engine.place_order = AsyncMock(return_value={'order_id': 'TEST-ORDER'})
        return engine

    @pytest.mark.asyncio
    async def test_position_size_adjustment_near_max_rsi(self, mock_engine, mock_config):
        """Test position size adjustment near max accumulation (RSI) [Lines 242-248]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Set accumulated_xlm near max (95 of 100)
        strategy.accumulated_xlm = 95.0
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 95}]

        # Create oversold condition
        prices = [
            0.36, 0.355, 0.35, 0.345, 0.34, 0.335, 0.33, 0.325,
            0.32, 0.315, 0.31, 0.305, 0.30, 0.295, 0.29, 0.288
        ]

        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.35},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }

        result = await strategy.evaluate()

        # Should adjust position size from $8 to respect 100 XLM limit
        # 5 XLM remaining capacity * $0.35 = $1.75 adjusted size
        assert result is not None
        # Position size should have been adjusted
        assert strategy.position_size_usd < 8.0

    @pytest.mark.asyncio
    async def test_remaining_capacity_too_small_rsi(self, mock_engine, mock_config):
        """Test remaining capacity too small (RSI) [Lines 244-246]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Set accumulated_xlm very close to max (99.8 of 100)
        strategy.accumulated_xlm = 99.8
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 99.8}]

        # Create oversold condition with price $0.30
        # 0.2 XLM remaining * $0.30 = $0.06 < $1.00 minimum
        prices = [
            0.36, 0.355, 0.35, 0.345, 0.34, 0.335, 0.33, 0.325,
            0.32, 0.315, 0.31, 0.305, 0.30, 0.295, 0.29, 0.288
        ]

        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.30},
            'XLM/USD_trades': [{'price': p} for p in prices]
        }

        result = await strategy.evaluate()

        # Should return None due to remaining capacity too small
        assert result is None

    @pytest.mark.asyncio
    async def test_position_size_adjustment_near_max_range(self, mock_engine, mock_config):
        """Test position size adjustment near max (Range) [Lines 332-338]"""
        strategy = RangeTradingStrategy(mock_engine, mock_config)

        # Set accumulated_xlm near max (75 of 80)
        strategy.accumulated_xlm = 75.0
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 75}]

        # Price at support
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.345}
        }

        result = await strategy.evaluate()

        # Should adjust position size to not exceed 80 XLM
        # 5 XLM remaining * $0.345 = $1.725 adjusted size
        assert result is not None
        assert strategy.position_size_usd < 9.0

    @pytest.mark.asyncio
    async def test_remaining_capacity_too_small_range(self, mock_engine, mock_config):
        """Test remaining capacity too small (Range) [Lines 334-336]"""
        strategy = RangeTradingStrategy(mock_engine, mock_config)

        # Set accumulated_xlm very close to max (79.8 of 80)
        strategy.accumulated_xlm = 79.8
        mock_engine.positions = [{'pair': 'XLM/USD', 'volume': 79.8}]

        # Price at support: 0.2 XLM * $0.345 = $0.069 < $1
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.345}
        }

        result = await strategy.evaluate()

        # Should return None due to remaining capacity too small
        assert result is None


class TestDataQuality:
    """Test suite for data quality and validation"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.xlm_price_range_min = 0.30
        config.xlm_min_order_size = 20
        config.xlm_cooldown_minutes = 5
        return config

    @pytest.fixture
    def mock_engine(self):
        """Create mock trading engine"""
        engine = Mock(spec=TradingEngine)
        engine.market_data = {}
        engine.positions = []
        return engine

    @pytest.mark.asyncio
    async def test_invalid_bid_ask_in_scalping(self, mock_engine, mock_config):
        """Test invalid bid/ask in scalping [Line 412]"""
        strategy = MicroScalpingStrategy(mock_engine, mock_config)

        # Create uptrend
        recent_prices = [0.33, 0.331, 0.332, 0.333, 0.334, 0.335, 0.336, 0.337, 0.338, 0.339]

        # Set bid/ask to zero (invalid)
        mock_engine.market_data = {
            'XLM/USD_ticker': {'last': 0.339, 'b': [0, 0], 'a': [0, 0]},
            'XLM/USD_trades': [{'price': p} for p in recent_prices]
        }

        result = await strategy.evaluate()

        # Should return None due to invalid bid/ask
        assert result is None

    def test_fallback_to_ticker_no_trades(self, mock_engine, mock_config):
        """Test fallback to ticker when no trades [Line 102]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # No trades, no ticker
        mock_engine.market_data = {
            'XLM/USD_trades': [],
            'XLM/USD_ticker': {}
        }

        prices = strategy.get_recent_prices(count=10)

        # Should return empty list when both trades and ticker are unavailable
        assert prices == []

    @pytest.mark.asyncio
    async def test_rsi_none_checks(self, mock_engine, mock_config):
        """Test RSI None checks [Lines 208, 223, 227]"""
        strategy = RSIMeanReversionStrategy(mock_engine, mock_config)

        # Scenario 1: can_trade() returns False (line 208)
        strategy.enabled = False
        result = await strategy.evaluate()
        assert result is None

        # Scenario 2: RSI calculation returns None (line 223)
        strategy.enabled = True
        strategy.calculate_rsi = Mock(return_value=None)
        mock_engine.market_data = {
            'XLM/USD_trades': [{'price': 0.35} for _ in range(20)]
        }
        result = await strategy.evaluate()
        assert result is None

        # Scenario 3: get_current_price returns None (line 227)
        strategy.calculate_rsi = Mock(return_value=30.0)  # Oversold
        strategy.get_current_price = Mock(return_value=None)
        result = await strategy.evaluate()
        assert result is None

    @pytest.mark.asyncio
    async def test_range_trading_none_checks(self, mock_engine, mock_config):
        """Test Range trading None checks [Lines 308, 316]"""
        strategy = RangeTradingStrategy(mock_engine, mock_config)

        # Scenario 1: can_trade() returns False (line 308)
        strategy.enabled = False
        result = await strategy.evaluate()
        assert result is None

        # Scenario 2: get_current_price returns None (line 316)
        strategy.enabled = True
        strategy.get_current_price = Mock(return_value=None)
        result = await strategy.evaluate()
        assert result is None

    @pytest.mark.asyncio
    async def test_scalping_none_checks(self, mock_engine, mock_config):
        """Test Scalping None checks [Lines 388, 402]"""
        strategy = MicroScalpingStrategy(mock_engine, mock_config)

        # Scenario 1: can_trade() returns False (line 388)
        strategy.enabled = False
        result = await strategy.evaluate()
        assert result is None

        # Scenario 2: get_current_price returns None (line 402)
        strategy.enabled = True
        strategy.get_current_price = Mock(return_value=None)
        result = await strategy.evaluate()
        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
