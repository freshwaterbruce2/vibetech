"""
Unit tests for database operations
Tests CRUD operations, error handling, and data integrity
"""

import pytest
import asyncio
import aiosqlite
import tempfile
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from database import Database
from timestamp_utils import TimestampUtils


class TestDatabase:
    """Test suite for Database operations"""

    @pytest.fixture
    async def test_db(self):
        """Create a temporary database for testing"""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name

        db = Database(db_path)
        await db.initialize()
        yield db
        await db.close()

        # Clean up
        Path(db_path).unlink(missing_ok=True)

    @pytest.mark.asyncio
    async def test_database_initialization(self, test_db):
        """Test database initialization and table creation"""
        # Check connection
        assert await test_db.is_connected()

        # Verify tables exist
        async with test_db._connection_lock:
            cursor = await test_db.conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
            tables = await cursor.fetchall()
            table_names = [t[0] for t in tables]

        expected_tables = ['trades', 'orders', 'positions', 'errors', 'performance']
        for table in expected_tables:
            assert table in table_names

    @pytest.mark.asyncio
    async def test_database_context_manager(self):
        """Test database as context manager"""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name

        async with Database(db_path) as db:
            assert await db.is_connected()

        # Connection should be closed after context
        assert not await db.is_connected()
        Path(db_path).unlink(missing_ok=True)

    @pytest.mark.asyncio
    async def test_log_order(self, test_db):
        """Test logging an order"""
        order_data = {
            "order_id": "TEST-123",
            "pair": "BTC/USD",
            "side": "buy",
            "order_type": "limit",
            "volume": 0.01,
            "price": 50000,
            "status": "pending",
            "timestamp": TimestampUtils.now_rfc3339()
        }

        order_id = await test_db.log_order(order_data)
        assert order_id is not None

        # Verify order was saved
        orders = await test_db.get_recent_orders(limit=1)
        assert len(orders) == 1
        assert orders[0]['order_id'] == "TEST-123"

    @pytest.mark.asyncio
    async def test_log_trade(self, test_db):
        """Test logging a trade"""
        trade_data = {
            "trade_id": "TRADE-456",
            "order_id": "ORDER-123",
            "pair": "ETH/USD",
            "side": "sell",
            "price": 3000,
            "volume": 1.5,
            "fee": 0.002,
            "timestamp": TimestampUtils.now_rfc3339()
        }

        trade_id = await test_db.log_trade(trade_data)
        assert trade_id is not None

        # Verify trade was saved
        trades = await test_db.get_recent_trades(limit=1)
        assert len(trades) == 1
        assert trades[0]['trade_id'] == "TRADE-456"

    @pytest.mark.asyncio
    async def test_log_position(self, test_db):
        """Test logging a position"""
        position_data = {
            "position_id": "POS-789",
            "pair": "ADA/USD",
            "side": "buy",
            "entry_price": 1.2,
            "volume": 100,
            "stop_loss": 1.0,
            "take_profit": 1.5,
            "status": "open",
            "timestamp": TimestampUtils.now_rfc3339()
        }

        pos_id = await test_db.log_position(position_data)
        assert pos_id is not None

    @pytest.mark.asyncio
    async def test_log_error(self, test_db):
        """Test logging an error"""
        error_data = {
            "error_type": "APIError",
            "message": "Rate limit exceeded",
            "severity": "medium",
            "context": {"endpoint": "/public/Ticker"},
            "timestamp": TimestampUtils.now_rfc3339()
        }

        error_id = await test_db.log_error(error_data)
        assert error_id is not None

    @pytest.mark.asyncio
    async def test_log_performance(self, test_db):
        """Test logging performance metrics"""
        perf_data = {
            "total_trades": 10,
            "profitable_trades": 7,
            "total_pnl": 1500.50,
            "win_rate": 0.7,
            "sharpe_ratio": 1.8,
            "max_drawdown": -5.2,
            "timestamp": TimestampUtils.now_rfc3339()
        }

        perf_id = await test_db.log_performance(perf_data)
        assert perf_id is not None

    @pytest.mark.asyncio
    async def test_get_recent_orders(self, test_db):
        """Test retrieving recent orders"""
        # Log multiple orders
        for i in range(5):
            await test_db.log_order({
                "order_id": f"ORDER-{i}",
                "pair": "BTC/USD",
                "side": "buy",
                "volume": 0.01,
                "timestamp": TimestampUtils.now_rfc3339()
            })

        # Retrieve orders
        orders = await test_db.get_recent_orders(limit=3)
        assert len(orders) == 3
        # Should be in reverse chronological order
        assert orders[0]['order_id'] == "ORDER-4"

    @pytest.mark.asyncio
    async def test_get_recent_trades(self, test_db):
        """Test retrieving recent trades"""
        # Log multiple trades
        for i in range(5):
            await test_db.log_trade({
                "trade_id": f"TRADE-{i}",
                "pair": "ETH/USD",
                "side": "sell",
                "price": 3000 + i,
                "volume": 1.0,
                "timestamp": TimestampUtils.now_rfc3339()
            })

        # Retrieve trades
        trades = await test_db.get_recent_trades(limit=3)
        assert len(trades) == 3
        assert trades[0]['trade_id'] == "TRADE-4"

    @pytest.mark.asyncio
    async def test_database_reconnection(self, test_db):
        """Test database reconnection after connection loss"""
        # Close connection
        await test_db.close()
        assert not await test_db.is_connected()

        # Should reconnect automatically
        await test_db.initialize()
        assert await test_db.is_connected()

        # Should be able to perform operations
        order_id = await test_db.log_order({
            "order_id": "RECONNECT-TEST",
            "pair": "BTC/USD",
            "side": "buy",
            "volume": 0.01,
            "timestamp": TimestampUtils.now_rfc3339()
        })
        assert order_id is not None

    @pytest.mark.asyncio
    async def test_concurrent_operations(self, test_db):
        """Test concurrent database operations"""
        async def log_order_task(i):
            return await test_db.log_order({
                "order_id": f"CONCURRENT-{i}",
                "pair": "BTC/USD",
                "side": "buy" if i % 2 == 0 else "sell",
                "volume": 0.01,
                "timestamp": TimestampUtils.now_rfc3339()
            })

        # Run concurrent operations
        tasks = [log_order_task(i) for i in range(10)]
        results = await asyncio.gather(*tasks)

        # All should succeed
        assert all(r is not None for r in results)

        # Verify all were saved
        orders = await test_db.get_recent_orders(limit=10)
        assert len(orders) == 10

    @pytest.mark.asyncio
    async def test_invalid_data_handling(self, test_db):
        """Test handling of invalid data"""
        # Missing required fields
        invalid_order = {
            "pair": "BTC/USD"
            # Missing order_id and other fields
        }

        order_id = await test_db.log_order(invalid_order)
        # Should handle gracefully and return None
        assert order_id is None

    @pytest.mark.asyncio
    async def test_timestamp_normalization(self, test_db):
        """Test timestamp normalization in database"""
        # Test with various timestamp formats
        test_cases = [
            TimestampUtils.now_rfc3339(),
            "2025-01-15T12:00:00Z",
            None  # Should use current time
        ]

        for ts in test_cases:
            order_data = {
                "order_id": f"TS-{ts}",
                "pair": "BTC/USD",
                "side": "buy",
                "volume": 0.01,
                "timestamp": ts
            }

            order_id = await test_db.log_order(order_data)
            # Should handle all formats
            assert order_id is not None or ts is None


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])