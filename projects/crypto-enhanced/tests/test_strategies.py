"""
Unit tests for trading strategies
Tests momentum, mean reversion, and risk management
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, MagicMock
from decimal import Decimal
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from trading_engine import (
    TradingEngine, RiskManager, OrderType, OrderSide
)
from strategies import (
    Strategy, RSIMeanReversionStrategy, RangeTradingStrategy,
    MicroScalpingStrategy, StrategyManager
)
from config import Config
from timestamp_utils import TimestampUtils


class TestRiskManager:
    """Test suite for RiskManager"""

    @pytest.fixture
    def config(self):
        """Create test configuration"""
        config = Mock(spec=Config)
        config.max_position_size = 1000  # $1000 max per position
        config.max_total_exposure = 3000  # $3000 max total
        config.max_positions = 3
        return config

    @pytest.fixture
    def risk_manager(self, config):
        """Create RiskManager instance"""
        return RiskManager(config)

    @pytest.mark.asyncio
    async def test_approve_order_within_limits(self, risk_manager):
        """Test order approval within risk limits"""
        # No existing positions
        positions = {}

        # Order within limits ($500 position)
        approved = await risk_manager.approve_order(
            pair="BTC/USD",
            volume="0.01",
            positions=positions,
            price=50000  # 0.01 BTC * $50000 = $500
        )

        assert approved is True

    @pytest.mark.asyncio
    async def test_reject_order_exceeds_position_size(self, risk_manager):
        """Test order rejection when exceeding position size"""
        positions = {}

        # Order exceeds max position size ($1500 > $1000)
        approved = await risk_manager.approve_order(
            pair="BTC/USD",
            volume="0.03",
            positions=positions,
            price=50000  # 0.03 BTC * $50000 = $1500
        )

        assert approved is False

    @pytest.mark.asyncio
    async def test_reject_order_max_positions(self, risk_manager):
        """Test order rejection when at max positions"""
        # Already have 3 positions
        positions = {
            "pos1": {"volume": 0.01, "entry_price": 50000},
            "pos2": {"volume": 1.0, "entry_price": 3000},
            "pos3": {"volume": 100, "entry_price": 1.0}
        }

        approved = await risk_manager.approve_order(
            pair="BTC/USD",
            volume="0.01",
            positions=positions,
            price=50000
        )

        assert approved is False

    @pytest.mark.asyncio
    async def test_reject_order_exceeds_total_exposure(self, risk_manager):
        """Test order rejection when exceeding total exposure"""
        # Existing positions: $2500 total
        positions = {
            "pos1": {"volume": 0.025, "entry_price": 50000},  # $1250
            "pos2": {"volume": 0.025, "entry_price": 50000}   # $1250
        }

        # New order would make total $3500 > $3000 limit
        approved = await risk_manager.approve_order(
            pair="BTC/USD",
            volume="0.02",
            positions=positions,
            price=50000  # 0.02 * $50000 = $1000
        )

        assert approved is False

    @pytest.mark.asyncio
    async def test_calculate_metrics_empty(self, risk_manager):
        """Test metrics calculation with no positions"""
        metrics = await risk_manager.calculate_metrics({}, None)

        assert metrics['risk_score'] == 0
        assert metrics['total_exposure'] == 0
        assert metrics['position_count'] == 0
        assert metrics['largest_position'] == 0

    @pytest.mark.asyncio
    async def test_calculate_metrics_with_positions(self, risk_manager):
        """Test metrics calculation with positions"""
        positions = {
            "pos1": {"volume": 0.02, "entry_price": 50000},  # $1000
            "pos2": {"volume": 0.5, "entry_price": 3000}     # $1500
        }

        metrics = await risk_manager.calculate_metrics(positions, None)

        assert metrics['position_count'] == 2
        assert metrics['total_exposure'] == 2500
        assert metrics['largest_position'] == 1500
        assert 0 < metrics['risk_score'] < 1


class TestTradingEngine:
    """Test suite for TradingEngine"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        config = Mock(spec=Config)
        config.max_position_size = 1000
        config.max_total_exposure = 3000
        config.max_positions = 3
        config.enable_momentum_strategy = True
        config.enable_mean_reversion_strategy = True
        config.enable_arbitrage_strategy = False
        config.engine_loop_interval = 1
        config.max_risk_score = 0.8
        config.taker_fee = 0.002
        config.maker_fee = 0.001
        return config

    @pytest.fixture
    def mock_kraken(self):
        """Create mock Kraken client"""
        kraken = Mock()
        kraken.get_ticker = AsyncMock(return_value={
            "BTC/USD": {"c": ["50000"]}
        })
        kraken.get_open_orders = AsyncMock(return_value={})
        kraken.get_open_positions = AsyncMock(return_value={})
        kraken.get_account_balance = AsyncMock(return_value={"USD": 10000})
        kraken.place_order = AsyncMock(return_value={"txid": ["TEST123"]})
        kraken.cancel_all_orders = AsyncMock(return_value={"count": 0})
        return kraken

    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket manager"""
        ws = Mock()
        ws.register_callback = Mock()
        ws.is_connected = Mock(return_value=True)
        ws.add_order = AsyncMock(return_value={"order_id": "WS123"})
        ws.cancel_all_orders = AsyncMock(return_value={"count": 0})
        return ws

    @pytest.fixture
    def mock_database(self):
        """Create mock database"""
        db = Mock()
        db.log_order = AsyncMock(return_value=1)
        db.log_trade = AsyncMock(return_value=1)
        db.log_position = AsyncMock(return_value=1)
        return db

    @pytest.fixture
    def engine(self, mock_kraken, mock_websocket, mock_database, mock_config):
        """Create TradingEngine instance"""
        return TradingEngine(mock_kraken, mock_websocket, mock_database, mock_config)

    def test_engine_initialization(self, engine):
        """Test engine initialization"""
        assert engine.running is False
        assert len(engine.positions) == 0
        assert len(engine.pending_orders) == 0
        assert len(engine.strategies) == 0
        assert engine.risk_manager is not None

    @pytest.mark.asyncio
    async def test_initialize_strategies(self, engine):
        """Test strategy initialization"""
        await engine._initialize_strategies()

        assert len(engine.strategies) == 3  # RSI Mean Reversion + Range Trading + Micro Scalping

    @pytest.mark.asyncio
    async def test_calculate_order_cost_market_order(self, engine):
        """Test order cost calculation for market order"""
        cost = engine.calculate_order_cost(
            volume=0.01,
            price=50000,
            side=OrderSide.BUY,
            order_type=OrderType.MARKET
        )

        assert cost['base_cost'] == 500  # 0.01 * 50000
        assert cost['fee_rate'] == 0.002  # Taker fee
        assert cost['fee_amount'] == 1.0  # 500 * 0.002
        assert cost['total_cost'] == 501

    @pytest.mark.asyncio
    async def test_calculate_order_cost_limit_order(self, engine):
        """Test order cost calculation for limit order"""
        cost = engine.calculate_order_cost(
            volume=0.01,
            price=50000,
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT
        )

        assert cost['base_cost'] == 500
        assert cost['fee_rate'] == 0.001  # Maker fee
        assert cost['fee_amount'] == 0.5  # 500 * 0.001
        assert cost['total_cost'] == 500.5

    def test_calculate_position_pnl_profit(self, engine):
        """Test P&L calculation for profitable position"""
        position = {
            "entry_price": 50000,
            "volume": 0.01,
            "side": "buy",
            "entry_fee": 1.0  # Paid $1 fee on entry
        }

        pnl = engine.calculate_position_pnl(position, current_price=51000)

        # Profit: (51000 - 50000) * 0.01 = $10
        # Exit fee: 51000 * 0.01 * 0.002 = $1.02
        # Total fees: $1 + $1.02 = $2.02
        # Net P&L: $10 - $2.02 = $7.98

        assert pnl['raw_pnl'] == 10.0
        assert pnl['total_fees'] == pytest.approx(2.02, rel=0.01)
        assert pnl['net_pnl'] == pytest.approx(7.98, rel=0.01)
        assert pnl['pnl_percentage'] > 1.5  # ~1.6%

    def test_calculate_position_pnl_loss(self, engine):
        """Test P&L calculation for losing position"""
        position = {
            "entry_price": 50000,
            "volume": 0.01,
            "side": "buy",
            "entry_fee": 1.0
        }

        pnl = engine.calculate_position_pnl(position, current_price=49000)

        # Loss: (49000 - 50000) * 0.01 = -$10
        # Exit fee: 49000 * 0.01 * 0.002 = $0.98
        # Total fees: $1 + $0.98 = $1.98
        # Net P&L: -$10 - $1.98 = -$11.98

        assert pnl['raw_pnl'] == -10.0
        assert pnl['total_fees'] == pytest.approx(1.98, rel=0.01)
        assert pnl['net_pnl'] == pytest.approx(-11.98, rel=0.01)
        assert pnl['pnl_percentage'] < -2.3  # ~-2.4%

    def test_should_stop_loss_buy(self, engine):
        """Test stop loss trigger for buy position"""
        position = {
            "side": "buy",
            "stop_loss": 49000
        }

        # Price below stop loss
        assert engine._should_stop_loss(position, Decimal("48500")) is True

        # Price above stop loss
        assert engine._should_stop_loss(position, Decimal("49500")) is False

    def test_should_stop_loss_sell(self, engine):
        """Test stop loss trigger for sell position"""
        position = {
            "side": "sell",
            "stop_loss": 51000
        }

        # Price above stop loss (bad for short)
        assert engine._should_stop_loss(position, Decimal("51500")) is True

        # Price below stop loss (good for short)
        assert engine._should_stop_loss(position, Decimal("50500")) is False

    def test_should_take_profit_buy(self, engine):
        """Test take profit trigger for buy position"""
        position = {
            "side": "buy",
            "take_profit": 52000
        }

        # Price above take profit
        assert engine._should_take_profit(position, Decimal("52500")) is True

        # Price below take profit
        assert engine._should_take_profit(position, Decimal("51500")) is False

    def test_convert_pair_to_v2_format(self, engine):
        """Test pair format conversion for WebSocket V2"""
        # Known conversions
        assert engine._convert_pair_to_v2_format("XBTUSD") == "BTC/USD"
        assert engine._convert_pair_to_v2_format("ETHUSD") == "ETH/USD"
        assert engine._convert_pair_to_v2_format("ADAUSD") == "ADA/USD"

        # Unknown pair - return as-is
        assert engine._convert_pair_to_v2_format("UNKNOWN/PAIR") == "UNKNOWN/PAIR"

    @pytest.mark.asyncio
    async def test_on_ticker_update(self, engine):
        """Test ticker update handler"""
        data = {
            "symbol": "BTC/USD",
            "bid": 49900,
            "ask": 50100,
            "last": 50000,
            "time": TimestampUtils.now_rfc3339()
        }

        await engine._on_ticker_update(data)

        # Should store ticker data
        assert "BTC/USD_ticker" in engine.market_data
        assert engine.market_data["BTC/USD_ticker"] == data

        # Should create synthetic trade
        assert "BTC/USD_trades" in engine.market_data
        trades = engine.market_data["BTC/USD_trades"]
        assert len(trades) > 0
        assert trades[-1]["price"] == 50000  # Mid price

    @pytest.mark.asyncio
    async def test_on_balance_update(self, engine):
        """Test balance update handler"""
        data = {
            "data": [
                {"asset": "USD", "balance": 10000},
                {"asset": "BTC", "balance": 0.5}
            ]
        }

        await engine._on_balance_update(data)

        # Should parse and store balance
        assert engine.market_data["balance"]["USD"] == 10000
        assert engine.market_data["balance"]["BTC"] == 0.5
        assert engine.market_data["usd_balance"] == 10000

    @pytest.mark.asyncio
    async def test_get_metrics(self, engine):
        """Test metrics retrieval"""
        # Add some test data
        engine.positions = {"pos1": {}, "pos2": {}}
        engine.pending_orders = {"order1": {}}
        engine.strategies = [Mock(), Mock()]

        metrics = await engine.get_metrics()

        assert metrics["positions"] == 2
        assert metrics["pending_orders"] == 1
        assert metrics["strategies"] == 2
        assert "timestamp" in metrics
        assert "risk_metrics" in metrics


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])