"""
Database module for trade logging and persistence with RFC3339 timestamp compliance
"""

import asyncio
import aiosqlite
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
from timestamp_utils import TimestampUtils, normalize as normalize_timestamp

logger = logging.getLogger(__name__)


class Database:
    """SQLite database for trading data with proper connection management"""

    def __init__(self, db_path: str = "trading.db"):
        self.db_path = db_path
        self.conn: Optional[aiosqlite.Connection] = None
        self._connection_lock = asyncio.Lock()

    async def __aenter__(self):
        """Context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - ensure connection is closed"""
        await self.close()

    async def initialize(self):
        """Initialize database and create tables with robust connection check"""
        async with self._connection_lock:
            needs_reconnect = False
            
            # Check connection status
            if self.conn is None:
                needs_reconnect = True
            else:
                try:
                    # Test with timeout to avoid hanging
                    await asyncio.wait_for(
                        self.conn.execute("SELECT 1"),
                        timeout=2.0
                    )
                except (aiosqlite.Error, AttributeError, asyncio.TimeoutError) as e:
                    logger.warning(f"Connection test failed: {e}")
                    needs_reconnect = True
                    # Close stale connection
                    if self.conn:
                        try:
                            await self.conn.close()
                        except Exception:
                            pass
                        finally:
                            self.conn = None
            
            if needs_reconnect:
                self.conn = await aiosqlite.connect(
                    self.db_path,
                    timeout=10.0  # Add connection timeout
                )
                await self._create_tables()
                logger.info(f"Database initialized at {self.db_path}")

    async def _create_tables(self):
        """Create database tables"""
        # Orders table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE,
                pair TEXT NOT NULL,
                side TEXT NOT NULL,
                order_type TEXT NOT NULL,
                volume REAL NOT NULL,
                price REAL,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        """)

        # Trades table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trade_id TEXT UNIQUE,
                order_id TEXT,
                pair TEXT NOT NULL,
                side TEXT NOT NULL,
                price REAL NOT NULL,
                volume REAL NOT NULL,
                fee REAL,
                executed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Positions table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                position_id TEXT UNIQUE,
                pair TEXT NOT NULL,
                side TEXT NOT NULL,
                entry_price REAL NOT NULL,
                volume REAL NOT NULL,
                stop_loss REAL,
                take_profit REAL,
                status TEXT,
                opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP,
                pnl REAL,
                metadata TEXT
            )
        """)

        # Market data table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS market_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pair TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume REAL,
                bid REAL,
                ask REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Performance metrics table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_pnl REAL,
                win_rate REAL,
                sharpe_ratio REAL,
                max_drawdown REAL,
                total_trades INTEGER,
                winning_trades INTEGER,
                losing_trades INTEGER,
                metadata TEXT
            )
        """)

        # System events table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT NOT NULL,
                severity TEXT,
                message TEXT,
                metadata TEXT
            )
        """)

        # Executions table for WebSocket execution data
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT,
                exec_id TEXT UNIQUE,
                exec_type TEXT,
                trade_id TEXT,
                symbol TEXT,
                side TEXT,
                last_qty REAL,
                last_price REAL,
                liquidity_ind TEXT,
                cost REAL,
                order_userref INTEGER,
                order_status TEXT,
                order_type TEXT,
                fee_usd_equiv REAL,
                timestamp TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        """)

        # Balance history table for tracking balance changes
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS balance_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usd_balance REAL,
                xlm_balance REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT DEFAULT 'websocket'
            )
        """)

        await self.conn.commit()

    async def close(self):
        """Close database connection"""
        async with self._connection_lock:
            if self.conn:
                try:
                    await self.conn.close()
                    logger.info("Database connection closed")
                except Exception as e:
                    logger.warning(f"Error closing database connection: {e}")
                finally:
                    self.conn = None

    async def is_connected(self) -> bool:
        """Check if database is connected"""
        try:
            if self.conn:
                await self.conn.execute("SELECT 1")
                return True
        except Exception as e:
            logger.debug(f"Connection check failed: {e}")
        return False

    # Order methods
    async def log_order(self, order_data: Dict):
        """Log order to database - supports both WebSocket V2 and REST API formats"""
        if not await self.is_connected():
            await self.initialize()
        try:
            # Handle both WebSocket V2 format and REST API format
            # WebSocket V2: {symbol, side, order_type, volume, price, order_id, ...}
            # REST API: {txid, descr: {pair, type, ordertype}, vol, price, ...}

            # Extract order_id
            order_id = order_data.get('order_id')  # WebSocket
            if not order_id:
                txid = order_data.get('txid')
                order_id = txid[0] if isinstance(txid, list) else txid  # REST

            # Extract pair/symbol
            pair = order_data.get('symbol') or order_data.get('pair')  # WebSocket
            if not pair:
                pair = order_data.get('descr', {}).get('pair')  # REST

            # Extract side
            side = order_data.get('side')  # WebSocket
            if not side:
                side = order_data.get('descr', {}).get('type')  # REST

            # Extract order_type
            order_type = order_data.get('order_type')  # WebSocket
            if not order_type:
                order_type = order_data.get('descr', {}).get('ordertype')  # REST

            # Extract volume
            volume = order_data.get('volume') or order_data.get('vol')

            # Extract price
            price = order_data.get('price')

            # Extract status
            status = order_data.get('status') or 'new'

            await self.conn.execute("""
                INSERT INTO orders (order_id, pair, side, order_type, volume, price, status, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                order_id,
                pair,
                side,
                order_type,
                volume,
                price,
                status,
                json.dumps(order_data)
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log order: {e}")

    async def get_orders(self, limit: int = 100) -> List[Dict]:
        """Get recent orders"""
        cursor = await self.conn.execute("""
            SELECT * FROM orders
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))

        rows = await cursor.fetchall()
        columns = [col[0] for col in cursor.description]

        return [dict(zip(columns, row)) for row in rows]

    # Trade methods
    async def log_trade(self, trade_data: Dict):
        """Log trade to database"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO trades (trade_id, order_id, pair, side, price, volume, fee, executed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trade_data.get('trade_id'),
                trade_data.get('order_id'),
                trade_data.get('pair'),
                trade_data.get('side'),
                trade_data.get('price'),
                trade_data.get('volume'),
                trade_data.get('fee'),
                normalize_timestamp(trade_data.get('time'))
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log trade: {e}")

    async def get_trades(self, pair: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get recent trades"""
        if pair:
            cursor = await self.conn.execute("""
                SELECT * FROM trades
                WHERE pair = ?
                ORDER BY executed_at DESC
                LIMIT ?
            """, (pair, limit))
        else:
            cursor = await self.conn.execute("""
                SELECT * FROM trades
                ORDER BY executed_at DESC
                LIMIT ?
            """, (limit,))

        rows = await cursor.fetchall()
        columns = [col[0] for col in cursor.description]

        return [dict(zip(columns, row)) for row in rows]

    # Position methods
    async def log_position(self, position_data: Dict):
        """Log position to database"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO positions (position_id, pair, side, entry_price, volume, stop_loss, take_profit, status, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                position_data.get('position_id'),
                position_data.get('pair'),
                position_data.get('side'),
                position_data.get('entry_price'),
                position_data.get('volume'),
                position_data.get('stop_loss'),
                position_data.get('take_profit'),
                position_data.get('status', 'open'),
                json.dumps(position_data)
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log position: {e}")

    async def update_position(self, position_id: str, updates: Dict):
        """Update position"""
        try:
            set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
            values = list(updates.values()) + [position_id]

            await self.conn.execute(f"""
                UPDATE positions
                SET {set_clause}, updated_at = CURRENT_TIMESTAMP
                WHERE position_id = ?
            """, values)
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to update position: {e}")

    # Market data methods
    async def log_market_data(self, pair: str, data: Dict):
        """Log market data"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO market_data (pair, timestamp, open, high, low, close, volume, bid, ask)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pair,
                normalize_timestamp(data.get('timestamp')) if data.get('timestamp') else TimestampUtils.now_rfc3339(),
                data.get('open'),
                data.get('high'),
                data.get('low'),
                data.get('close'),
                data.get('volume'),
                data.get('bid'),
                data.get('ask')
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log market data: {e}")

    # Performance methods
    async def log_performance(self, metrics: Dict):
        """Log performance metrics"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO performance (total_pnl, win_rate, sharpe_ratio, max_drawdown, total_trades, winning_trades, losing_trades, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metrics.get('total_pnl'),
                metrics.get('win_rate'),
                metrics.get('sharpe_ratio'),
                metrics.get('max_drawdown'),
                metrics.get('total_trades'),
                metrics.get('winning_trades'),
                metrics.get('losing_trades'),
                json.dumps(metrics)
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log performance: {e}")

    async def get_performance_metrics(self) -> Dict:
        """Get latest performance metrics"""
        cursor = await self.conn.execute("""
            SELECT * FROM performance
            ORDER BY timestamp DESC
            LIMIT 1
        """)

        row = await cursor.fetchone()
        if row:
            columns = [col[0] for col in cursor.description]
            return dict(zip(columns, row))
        return {}

    # Event methods
    async def log_event(self, event_type: str, message: str, severity: str = "INFO", metadata: Optional[Dict] = None):
        """Log system event"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO events (event_type, severity, message, metadata)
                VALUES (?, ?, ?, ?)
            """, (
                event_type,
                severity,
                message,
                json.dumps(metadata) if metadata else None
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log event: {e}")

    async def get_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get recent events"""
        if event_type:
            cursor = await self.conn.execute("""
                SELECT * FROM events
                WHERE event_type = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (event_type, limit))
        else:
            cursor = await self.conn.execute("""
                SELECT * FROM events
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))

        rows = await cursor.fetchall()
        columns = [col[0] for col in cursor.description]

        return [dict(zip(columns, row)) for row in rows]

    # Execution methods
    async def log_execution(self, execution_data: Dict):
        """Log execution data from WebSocket"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO executions (
                    order_id, exec_id, exec_type, trade_id, symbol, side,
                    last_qty, last_price, liquidity_ind, cost, order_userref,
                    order_status, order_type, fee_usd_equiv, timestamp, metadata
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                execution_data.get('order_id'),
                execution_data.get('exec_id'),
                execution_data.get('exec_type'),
                execution_data.get('trade_id'),
                execution_data.get('symbol'),
                execution_data.get('side'),
                execution_data.get('last_qty'),
                execution_data.get('last_price'),
                execution_data.get('liquidity_ind'),
                execution_data.get('cost'),
                execution_data.get('order_userref'),
                execution_data.get('order_status'),
                execution_data.get('order_type'),
                execution_data.get('fee_usd_equiv'),
                normalize_timestamp(execution_data.get('timestamp')),
                json.dumps(execution_data)
            ))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log execution: {e}")

    async def log_balance(self, usd_balance: float, xlm_balance: float, source: str = "websocket"):
        """Log balance update"""
        if not await self.is_connected():
            await self.initialize()
        try:
            await self.conn.execute("""
                INSERT INTO balance_history (usd_balance, xlm_balance, source)
                VALUES (?, ?, ?)
            """, (usd_balance, xlm_balance, source))
            await self.conn.commit()
        except Exception as e:
            logger.error(f"Failed to log balance: {e}")

    async def get_recent_executions(self, limit: int = 100) -> List[Dict]:
        """Get recent execution data"""
        cursor = await self.conn.execute("""
            SELECT * FROM executions
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))

        rows = await cursor.fetchall()
        columns = [col[0] for col in cursor.description]

        return [dict(zip(columns, row)) for row in rows]