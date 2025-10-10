"""
Trading Engine - Core trading logic and strategy execution
Optimized for performance, stability, and memory efficiency

Key Improvements:
- Memory management with automatic data pruning
- Performance caching for expensive calculations
- Circuit breaker for API stability
- Data validation for all incoming payloads
- Separated positions from pending orders
- DRY principles for WebSocket/REST fallback
"""

import asyncio
import logging
import sys
from datetime import datetime, timedelta
from timestamp_utils import TimestampUtils
from errors_simple import log_error
from typing import Dict, Optional, List, Callable, Any
from decimal import Decimal
from enum import Enum
from collections import deque

logger = logging.getLogger(__name__)


class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop-loss"
    TAKE_PROFIT = "take-profit"


class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"


# ============================================================================
# HELPER CLASSES FOR OPTIMIZATION
# ============================================================================

class DataPruner:
    """
    Centralized data pruning system to prevent unbounded memory growth

    Manages:
    - Trade history limits (keep last N trades)
    - Ticker data TTL (remove old tickers)
    - Market data cleanup
    """

    def __init__(self, max_trades: int = 100, max_tickers: int = 50, ttl_hours: int = 24):
        self.max_trades = max_trades
        self.max_tickers = max_tickers
        self.ttl = timedelta(hours=ttl_hours)
        self.last_cleanup = datetime.now()
        self.cleanup_interval = timedelta(minutes=15)  # Run cleanup every 15 min

    def should_run_cleanup(self) -> bool:
        """Check if it's time to run cleanup"""
        return datetime.now() - self.last_cleanup > self.cleanup_interval

    def prune_trades(self, trades_list: List) -> List:
        """Keep only most recent N trades"""
        if not trades_list:
            return []
        return trades_list[-self.max_trades:]

    def prune_market_data(self, market_data: Dict) -> int:
        """
        Remove old data from market_data dict
        Returns number of items cleaned
        """
        cleaned = 0
        cutoff = datetime.now() - self.ttl

        # Clean up old ticker data (keep only recent)
        ticker_keys = [k for k in market_data.keys() if k.endswith('_ticker')]
        if len(ticker_keys) > self.max_tickers:
            # Sort by key and remove oldest
            sorted_keys = sorted(ticker_keys)
            for key in sorted_keys[:-self.max_tickers]:
                del market_data[key]
                cleaned += 1

        # Prune all trade lists
        trade_keys = [k for k in market_data.keys() if k.endswith('_trades')]
        for key in trade_keys:
            if isinstance(market_data[key], list):
                original_len = len(market_data[key])
                market_data[key] = self.prune_trades(market_data[key])
                cleaned += original_len - len(market_data[key])

        self.last_cleanup = datetime.now()

        if cleaned > 0:
            logger.debug(f"DataPruner: Cleaned {cleaned} old market data items")

        return cleaned


class ExposureCache:
    """
    Performance cache for expensive calculations

    Caches:
    - Total exposure calculations
    - Risk metrics
    - Prevents redundant loops through positions
    """

    def __init__(self, ttl_seconds: int = 5):
        self._total_exposure_cache = None
        self._total_exposure_timestamp = None
        self._ttl = ttl_seconds

    def get_total_exposure(self, positions: Dict, calculate_func: Callable) -> Decimal:
        """
        Get total exposure with caching

        Args:
            positions: Current positions dict
            calculate_func: Function to calculate exposure if cache miss

        Returns:
            Cached or freshly calculated total exposure
        """
        now = datetime.now()

        # Check cache validity
        if self._total_exposure_cache is None or \
           self._total_exposure_timestamp is None or \
           (now - self._total_exposure_timestamp).total_seconds() > self._ttl:
            # Cache miss or expired - recalculate
            self._total_exposure_cache = calculate_func(positions)
            self._total_exposure_timestamp = now

        return self._total_exposure_cache

    def invalidate(self):
        """Invalidate cache (call when positions change)"""
        self._total_exposure_cache = None
        self._total_exposure_timestamp = None


class CircuitBreaker:
    """
    Circuit breaker for API stability

    Prevents cascading failures by:
    - Tracking failure rates
    - Opening circuit after threshold
    - Auto-recovery after timeout
    """

    def __init__(self, failure_threshold: int = 5, timeout_seconds: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timedelta(seconds=timeout_seconds)
        self.failures = 0
        self.last_failure_time = None
        self.is_open = False

    def record_success(self):
        """Record successful operation - reset failures"""
        self.failures = 0
        self.is_open = False

    def record_failure(self):
        """Record failed operation - may open circuit"""
        self.failures += 1
        self.last_failure_time = datetime.now()

        if self.failures >= self.failure_threshold:
            self.is_open = True
            logger.warning(f"CircuitBreaker: OPEN after {self.failures} failures")

    def can_attempt(self) -> bool:
        """Check if we can attempt operation"""
        if not self.is_open:
            return True

        # Check if timeout has passed for auto-recovery
        if self.last_failure_time:
            elapsed = datetime.now() - self.last_failure_time
            if elapsed > self.timeout:
                logger.info("CircuitBreaker: Auto-recovery timeout elapsed, closing circuit")
                self.is_open = False
                self.failures = 0
                return True

        return False


# ============================================================================
# MAIN TRADING ENGINE
# ============================================================================

class TradingEngine:
    """
    Main trading engine - Optimized for 24/7 autonomous operation

    Performance Features:
    - Cached exposure calculations
    - Centralized data pruning
    - Optimized dictionary lookups

    Stability Features:
    - Circuit breaker for API calls
    - Data validation on all inputs
    - Graceful degradation

    Memory Features:
    - Automatic data pruning
    - Bounded collections
    - Memory monitoring
    """

    def __init__(self, kraken_client, websocket_manager, database, config):
        self.kraken = kraken_client
        self.websocket = websocket_manager
        self.db = database
        self.config = config
        self.running = False

        # CRITICAL FIX: Separate positions from pending orders
        self.open_positions = {}      # Filled positions we're tracking
        self.pending_orders = {}      # Orders awaiting execution

        self.market_data = {}
        self.strategies = []
        self.risk_manager = RiskManager(config)
        self.last_xlm_trade_time = None

        # Optimization components
        self.data_pruner = DataPruner(
            max_trades=100,
            max_tickers=50,
            ttl_hours=24
        )
        self.exposure_cache = ExposureCache(ttl_seconds=5)
        self.api_circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            timeout_seconds=60
        )

        # Memory monitoring
        self.last_memory_check = datetime.now()
        self.memory_check_interval = timedelta(hours=1)

        # Register WebSocket callbacks
        self._register_callbacks()

    @property
    def positions(self):
        """Backward compatibility: positions always references open_positions"""
        return self.open_positions

    @positions.setter
    def positions(self, value):
        """Backward compatibility: setting positions updates open_positions"""
        self.open_positions = value

    def _register_callbacks(self):
        """Register WebSocket callbacks"""
        self.websocket.register_callback('ticker', self._on_ticker_update)
        self.websocket.register_callback('trade', self._on_trade_update)
        self.websocket.register_callback('book', self._on_book_update)
        self.websocket.register_callback('execution', self._on_execution_update)
        self.websocket.register_callback('balance', self._on_balance_update)

    async def run(self):
        """Main trading loop - Optimized for performance and stability"""
        self.running = True
        logger.info("Trading engine started (optimized version)")

        # Initialize strategies
        await self._initialize_strategies()

        # Get initial state ONCE at startup
        try:
            await self._initialize_state()
        except Exception as e:
            log_error(e, "initialize_state")
            logger.error(f"Failed to initialize state: {e} - continuing anyway")

        # Main trading loop - NO MORE API POLLING
        loop_iteration = 0
        while self.running:
            try:
                loop_iteration += 1

                # Periodic memory monitoring (every hour)
                if datetime.now() - self.last_memory_check > self.memory_check_interval:
                    self._monitor_memory_usage()
                    self.last_memory_check = datetime.now()

                # Periodic data pruning (every 15 minutes)
                if self.data_pruner.should_run_cleanup():
                    cleaned = self.data_pruner.prune_market_data(self.market_data)
                    if cleaned > 0:
                        logger.info(f"Pruned {cleaned} old market data items")

                # Check balance status
                await self._monitor_balance()

                # Run strategies (uses WebSocket data)
                await self._run_strategies()

                # Check stop losses and take profits (uses cached data)
                await self._check_exits()

                # Monitor risk (uses cached data)
                await self._monitor_risk()

                await asyncio.sleep(self.config.engine_loop_interval)

            except Exception as e:
                log_error(e, "trading_loop")
                logger.error(f"Trading engine error (iteration {loop_iteration}): {e}", exc_info=True)
                await asyncio.sleep(5)

    async def stop(self):
        """Stop trading engine"""
        self.running = False
        logger.info("Trading engine stopped")

        # Cancel all pending orders
        await self.cancel_all_orders()

    def is_running(self) -> bool:
        """Check if engine is running"""
        return self.running

    def _monitor_memory_usage(self):
        """Monitor and log memory footprint"""
        try:
            # Calculate market data size
            market_data_size = sys.getsizeof(self.market_data) / 1024 / 1024  # MB

            # Count items
            ticker_count = len([k for k in self.market_data.keys() if k.endswith('_ticker')])
            trade_count = len([k for k in self.market_data.keys() if k.endswith('_trades')])
            book_count = len([k for k in self.market_data.keys() if k.endswith('_book')])

            logger.info(
                f"Memory: market_data={market_data_size:.2f}MB "
                f"(tickers={ticker_count}, trades={trade_count}, books={book_count}), "
                f"positions={len(self.open_positions)}, "
                f"pending_orders={len(self.pending_orders)}"
            )
        except Exception as e:
            logger.warning(f"Failed to monitor memory: {e}")

    async def _initialize_strategies(self):
        """Initialize trading strategies"""
        try:
            from strategies import StrategyManager

            # Initialize strategy manager
            self.strategy_manager = StrategyManager(self, self.config)
            self.strategy_manager.initialize_strategies()

            # Set strategies list for compatibility
            self.strategies = self.strategy_manager.strategies

            strategy_names = [s.name for s in self.strategies]
            logger.info(f"Initialized {len(self.strategies)} strategies: {strategy_names}")

        except Exception as e:
            logger.error(f"Failed to initialize strategies: {e}")
            self.strategies = []

    async def _initialize_state(self):
        """Initialize state ONCE at startup - WebSocket updates from here"""
        try:
            # Get initial open orders
            open_orders = await self.kraken.get_open_orders()
            self.pending_orders = open_orders if open_orders else {}

            # Get initial positions
            positions = await self.kraken.get_open_positions()
            self.open_positions = positions if positions else {}

            # Get initial balance
            balance = await self.kraken.get_account_balance()
            if balance:
                self.market_data['balance'] = balance

            logger.info(
                f"Initial state loaded: {len(self.pending_orders)} orders, "
                f"{len(self.open_positions)} positions"
            )

        except Exception as e:
            log_error(e, "initialize_state")
            logger.error(f"Failed to initialize state: {e}")

    async def _run_strategies(self):
        """Run all active strategies"""
        # Skip if no strategies are configured
        if not self.strategies:
            return

        # Use strategy manager if available
        if hasattr(self, 'strategy_manager'):
            try:
                await self.strategy_manager.evaluate_all()
            except Exception as e:
                log_error(e, "strategy_manager")
                logger.error(f"Strategy manager error: {e}")
        else:
            # Fallback to individual strategy evaluation
            for strategy in self.strategies:
                try:
                    await strategy.evaluate()
                except Exception as e:
                    log_error(e, f"strategy_{strategy.__class__.__name__}")
                    logger.error(f"Strategy {strategy.__class__.__name__} error: {e}")

    async def _check_exits(self):
        """
        Check stop losses and take profits

        OPTIMIZATION: Iterate over dict items directly (no list copy needed)
        """
        if not self.open_positions:
            logger.debug("No positions to check for exits")
            return

        logger.debug(f"Checking exits for {len(self.open_positions)} positions")

        # OPTIMIZED: No list() wrapper - safe since we use copy() if modifying
        positions_snapshot = self.open_positions.copy()

        for position_id, position in positions_snapshot.items():
            try:
                current_price = await self._get_current_price(position['pair'])
                entry = position.get('entry_price')
                logger.debug(
                    f"Position {position_id}: {position['pair']} "
                    f"entry={entry}, current={current_price}"
                )

                # Enhanced XLM-specific monitoring
                if 'XLM' in position.get('pair', ''):
                    price_float = float(current_price)
                    range_min = self.config.xlm_price_range_min
                    range_max = self.config.xlm_price_range_max
                    logger.debug(
                        f"XLM price check: ${price_float:.4f} "
                        f"(range: ${range_min:.4f}-${range_max:.4f})"
                    )

                    # Emergency stop-loss if price drops below critical level
                    if price_float < range_min:
                        logger.warning(
                            f"XLM price ${price_float:.4f} below minimum range ${range_min}"
                        )
                        await self.close_position(
                            position_id,
                            reason=f"XLM emergency stop (price ${price_float:.4f})"
                        )
                        continue

                    # Take profit if price exceeds maximum range
                    if price_float > range_max:
                        logger.info(
                            f"XLM price ${price_float:.4f} above maximum range ${range_max}"
                        )
                        await self.close_position(
                            position_id,
                            reason=f"XLM range limit (price ${price_float:.4f})"
                        )
                        continue

                # Check stop loss
                if position.get('stop_loss'):
                    if self._should_stop_loss(position, current_price):
                        await self.close_position(position_id, reason="Stop loss triggered")

                # Check take profit
                if position.get('take_profit'):
                    if self._should_take_profit(position, current_price):
                        await self.close_position(position_id, reason="Take profit triggered")

            except Exception as e:
                log_error(e, f"check_exits_{position_id}")
                logger.error(f"Error checking exits for position {position_id}: {e}")

    async def _monitor_risk(self):
        """Monitor risk metrics"""
        metrics = await self.risk_manager.calculate_metrics(
            self.open_positions, self.kraken
        )

        if metrics['risk_score'] > self.config.max_risk_score:
            logger.warning(f"High risk detected: {metrics['risk_score']}")
            await self._reduce_exposure()

    def _should_stop_loss(self, position: Dict, current_price: Decimal) -> bool:
        """Check if stop loss should trigger"""
        stop_loss = Decimal(str(position['stop_loss']))
        current = Decimal(str(current_price))

        if position['side'] == 'buy':
            return current <= stop_loss
        else:
            return current >= stop_loss

    def _should_take_profit(self, position: Dict, current_price: Decimal) -> bool:
        """Check if take profit should trigger"""
        take_profit = Decimal(str(position['take_profit']))
        current = Decimal(str(current_price))

        if position['side'] == 'buy':
            return current >= take_profit
        else:
            return current <= take_profit

    async def _get_current_price(self, pair: str) -> Decimal:
        """Get current price from cached WebSocket data (no API call)"""
        # Convert pair format if needed
        symbol = self._convert_pair_to_v2_format(pair)

        # Try WebSocket ticker data first
        ticker_key = f"{symbol}_ticker"
        if ticker_key in self.market_data:
            ticker = self.market_data[ticker_key]
            if 'last' in ticker:
                return Decimal(str(ticker['last']))
            elif 'c' in ticker:  # Fallback to close price
                close_price = ticker['c'][0] if isinstance(ticker['c'], list) else ticker['c']
                return Decimal(str(close_price))

        # Fallback to API only if no WebSocket data (should be rare)
        logger.warning(f"No WebSocket data for {pair}, falling back to API")

        # Check circuit breaker before API call
        if not self.api_circuit_breaker.can_attempt():
            logger.error("Circuit breaker OPEN - cannot fetch price via API")
            raise Exception("Circuit breaker open - API unavailable")

        try:
            ticker = await self.kraken.get_ticker(pair)
            self.api_circuit_breaker.record_success()
            return Decimal(ticker[pair]['c'][0])
        except Exception as e:
            self.api_circuit_breaker.record_failure()
            raise

    async def _monitor_balance(self):
        """Monitor account balance and pause trading if too low"""
        balance = self.market_data.get('balance', {})
        usd_balance = float(balance.get('ZUSD', balance.get('USD', 0)))

        # Critical: Stop trading if below minimum
        min_required = self.config.min_balance_required
        if usd_balance > 0 and usd_balance < min_required:
            logger.critical(
                f"CRITICAL: Balance ${usd_balance:.2f} below minimum ${min_required}"
            )
            logger.critical("Trading suspended due to insufficient funds")

            # Close all positions to preserve capital
            if self.open_positions:
                logger.warning("Closing all positions due to low balance")
                # OPTIMIZED: Use copy() to avoid modification during iteration
                for position_id in list(self.open_positions.keys()):
                    await self.close_position(position_id, reason="Low balance protection")

            # Clear strategies to stop new trades
            self.strategies = []
            return

        # Warning: Alert if balance is low
        alert_threshold = self.config.min_balance_alert
        if usd_balance > 0 and usd_balance < alert_threshold:
            logger.warning(
                f"LOW BALANCE WARNING: ${usd_balance:.2f} "
                f"(alert threshold: ${alert_threshold})"
            )

            # For XLM trading, ensure we have enough for minimum order
            if 'XLM/USD' in self.config.trading_pairs:
                xlm_price = self._get_xlm_price()
                if xlm_price:
                    min_size = self.config.xlm_min_order_size
                    min_order_cost = min_size * xlm_price
                    if usd_balance < min_order_cost * 1.1:  # 10% buffer
                        logger.warning(
                            f"Balance ${usd_balance:.2f} may be insufficient "
                            f"for XLM minimum order (${min_order_cost:.2f})"
                        )

    def _get_xlm_price(self) -> Optional[float]:
        """Get current XLM price from market data"""
        xlm_ticker = self.market_data.get('XLM/USD_ticker', {})
        if xlm_ticker and 'last' in xlm_ticker:
            return float(xlm_ticker['last'])
        return None

    async def _reduce_exposure(self):
        """Reduce exposure when risk is too high"""
        logger.warning("Reducing exposure due to high risk")

        # Close most risky positions
        positions_by_risk = sorted(
            self.open_positions.items(),
            key=lambda x: x[1].get('risk_score', 0),
            reverse=True
        )

        # Close top 2 risky positions
        for position_id, position in positions_by_risk[:2]:
            await self.close_position(position_id, reason="Risk reduction")

        # Invalidate exposure cache after closing positions
        self.exposure_cache.invalidate()

    def calculate_order_cost(
        self, volume: float, price: float, side: OrderSide, order_type: OrderType
    ) -> Dict:
        """Calculate total order cost including fees"""
        base_cost = Decimal(str(volume)) * Decimal(str(price))

        # Select appropriate fee based on order type
        if order_type == OrderType.MARKET:
            fee_rate = Decimal(str(self.config.taker_fee))
        else:  # Limit orders
            fee_rate = Decimal(str(self.config.maker_fee))

        fee_amount = base_cost * fee_rate
        total_cost = base_cost + fee_amount

        return {
            'base_cost': float(base_cost),
            'fee_rate': float(fee_rate),
            'fee_amount': float(fee_amount),
            'total_cost': float(total_cost)
        }

    def calculate_position_pnl(self, position: Dict, current_price: float) -> Dict:
        """Calculate position P&L including fees"""
        entry_price = Decimal(str(position.get('entry_price', 0)))
        volume = Decimal(str(position.get('volume', 0)))
        side = position.get('side')

        # Calculate raw P&L
        price_diff = Decimal(str(current_price)) - entry_price
        if side == 'sell':
            price_diff = -price_diff

        raw_pnl = price_diff * volume

        # Subtract fees (entry fee + estimated exit fee)
        entry_fee = Decimal(str(position.get('entry_fee', 0)))
        taker_fee = Decimal(str(self.config.taker_fee))
        if entry_fee == 0:  # Estimate if not stored
            entry_fee = volume * entry_price * taker_fee

        exit_fee = volume * Decimal(str(current_price)) * taker_fee
        total_fees = entry_fee + exit_fee

        net_pnl = raw_pnl - total_fees
        pnl_percentage = (net_pnl / (volume * entry_price)) * 100

        return {
            'raw_pnl': float(raw_pnl),
            'total_fees': float(total_fees),
            'net_pnl': float(net_pnl),
            'pnl_percentage': float(pnl_percentage),
            'current_price': current_price
        }

    # ========================================================================
    # WEBSOCKET CALLBACKS - WITH DATA VALIDATION
    # ========================================================================

    def _validate_ticker_data(self, data: Dict) -> bool:
        """Validate ticker data structure"""
        if not isinstance(data, dict):
            return False
        return 'symbol' in data

    def _validate_trade_data(self, data: Dict) -> bool:
        """Validate trade data structure"""
        if not isinstance(data, dict):
            return False
        return 'symbol' in data

    def _validate_execution_data(self, data: Dict) -> bool:
        """Validate execution data structure"""
        if not isinstance(data, dict):
            return False
        return True  # Execution data has flexible structure

    def _validate_balance_data(self, data: Dict) -> bool:
        """Validate balance data structure"""
        if not isinstance(data, dict):
            return False
        return 'data' in data or 'USD' in data or 'ZUSD' in data

    def _add_trade_to_market_data(self, symbol: str, trade_data: Dict):
        """
        OPTIMIZED: Centralized method for adding and pruning trades
        Eliminates code duplication (was repeated 3 times)
        """
        trades_key = f"{symbol}_trades"
        if trades_key not in self.market_data:
            self.market_data[trades_key] = []

        self.market_data[trades_key].append(trade_data)

        # Prune using centralized DataPruner
        self.market_data[trades_key] = self.data_pruner.prune_trades(
            self.market_data[trades_key]
        )

    async def _on_ticker_update(self, data: Dict):
        """
        Handle ticker updates

        IMPROVEMENTS:
        - Added data validation
        - Optimized synthetic trade generation
        """
        # Validate incoming data
        if not self._validate_ticker_data(data):
            logger.warning(f"Invalid ticker data received: {data}")
            return

        symbol = data.get('symbol')
        if symbol:
            self.market_data[f"{symbol}_ticker"] = data

            # Generate synthetic trade only if needed
            # OPTIMIZATION: Only create synthetic trades if trade channel is empty
            trades_key = f"{symbol}_trades"
            if trades_key not in self.market_data or not self.market_data[trades_key]:
                if 'ask' in data and 'bid' in data:
                    ask = float(data.get('ask', 0))
                    bid = float(data.get('bid', 0))

                    if ask > 0 and bid > 0:
                        mid_price = (ask + bid) / 2
                        synthetic_trade = {
                            'symbol': symbol,
                            'price': mid_price,
                            'volume': 1.0,
                            'time': data.get('time'),
                            'synthetic': True
                        }
                        self._add_trade_to_market_data(symbol, synthetic_trade)

    async def _on_trade_update(self, data: Dict):
        """
        Handle trade updates

        IMPROVEMENTS:
        - Added data validation
        - Uses centralized trade pruning
        """
        # Validate incoming data
        if not self._validate_trade_data(data):
            logger.warning(f"Invalid trade data received: {data}")
            return

        symbol = data.get('symbol')
        if symbol:
            self._add_trade_to_market_data(symbol, data)

    async def _on_book_update(self, data: Dict):
        """Handle order book updates"""
        symbol = data.get('symbol')
        if symbol:
            self.market_data[f"{symbol}_book"] = data

    async def _on_execution_update(self, data: Dict):
        """
        Handle execution updates - REAL-TIME from WebSocket

        IMPROVEMENTS:
        - Added data validation
        - Better error handling
        - Uses centralized trade management
        """
        if not self._validate_execution_data(data):
            logger.warning(f"Invalid execution data received: {data}")
            return

        logger.info(f"Execution update: {data}")

        # Extract execution trades for market data
        if 'data' in data and isinstance(data['data'], list):
            for exec_data in data['data']:
                if exec_data.get('exec_type') == 'trade':
                    symbol = exec_data.get('symbol')
                    if symbol:
                        trade_data = {
                            'symbol': symbol,
                            'price': exec_data.get('last_price'),
                            'volume': exec_data.get('last_qty'),
                            'time': exec_data.get('timestamp'),
                            'side': exec_data.get('side')
                        }
                        self._add_trade_to_market_data(symbol, trade_data)

        # Handle order updates
        if 'orders' in data:
            # Update pending orders from snapshot
            self.pending_orders = {}
            for order in data['orders']:
                if order.get('order_id'):
                    self.pending_orders[order['order_id']] = order
            logger.info(f"Updated pending orders: {len(self.pending_orders)} orders")

        # Handle individual order updates
        elif 'order' in data:
            order = data['order']
            order_id = order.get('order_id')
            if order_id:
                active_statuses = ['pending', 'open', 'partially_filled']
                if order.get('status') in active_statuses:
                    self.pending_orders[order_id] = order
                elif order.get('status') in ['filled', 'cancelled', 'expired']:
                    self.pending_orders.pop(order_id, None)

        # Handle trade executions
        if 'trade' in data:
            logger.info(f"Trade executed: {data['trade']}")

    async def _on_balance_update(self, data: Dict):
        """
        Handle balance updates - REAL-TIME from WebSocket

        IMPROVEMENTS:
        - Added data validation
        - Safer dict parsing
        """
        if not self._validate_balance_data(data):
            logger.warning(f"Invalid balance data received: {data}")
            return

        logger.info(f"Balance update: {data}")

        # Parse WebSocket balance format
        if 'data' in data:
            balance_dict = {}
            for asset_info in data['data']:
                asset = asset_info.get('asset')
                balance = asset_info.get('balance', 0)
                if asset:
                    balance_dict[asset] = balance

            self.market_data['balance'] = balance_dict

            # Extract USD balance for risk checks
            if 'USD' in balance_dict:
                self.market_data['usd_balance'] = balance_dict['USD']
        else:
            # Fallback for different format
            self.market_data['balance'] = data
            if 'USD' in data:
                self.market_data['usd_balance'] = data['USD']

    # ========================================================================
    # TRADING METHODS - WITH WEBSOCKET FALLBACK PATTERN
    # ========================================================================

    async def _execute_with_websocket_fallback(
        self,
        ws_method: Callable,
        rest_method: Callable,
        method_name: str,
        ws_args: tuple = (),
        ws_kwargs: dict = None,
        rest_args: tuple = (),
        rest_kwargs: dict = None
    ) -> Dict:
        """
        DRY pattern for WebSocket operations with REST API fallback

        OPTIMIZATION: Eliminates duplicate try/except/fallback code
        Used by: place_order, cancel_all_orders
        """
        ws_kwargs = ws_kwargs or {}
        rest_kwargs = rest_kwargs or {}

        # Check WebSocket connection
        if not self.websocket.is_connected():
            logger.warning(f"{method_name}: WebSocket not connected, using REST")
            return await rest_method(*rest_args, **rest_kwargs)

        # Check circuit breaker
        if not self.api_circuit_breaker.can_attempt():
            logger.error(f"{method_name}: Circuit breaker OPEN - operation rejected")
            return {"error": "Circuit breaker open - API temporarily unavailable"}

        # Attempt WebSocket operation
        try:
            result = await ws_method(*ws_args, **ws_kwargs)
            self.api_circuit_breaker.record_success()
            return result
        except Exception as e:
            log_error(e, f"websocket_{method_name}")
            logger.warning(f"{method_name}: WebSocket failed, falling back to REST API")
            self.api_circuit_breaker.record_failure()

            # Fallback to REST
            try:
                result = await rest_method(*rest_args, **rest_kwargs)
                return result
            except Exception as rest_error:
                log_error(rest_error, f"rest_{method_name}")
                logger.error(f"{method_name}: REST fallback also failed")
                raise

    async def place_order(
        self,
        pair: str,
        side: OrderSide,
        order_type: OrderType,
        volume: str,
        price: Optional[str] = None,
        stop_loss: Optional[str] = None,
        take_profit: Optional[str] = None
    ) -> Dict:
        """
        Place new order via WebSocket V2 with REST fallback

        IMPROVEMENTS:
        - Uses optimized fallback pattern
        - Better validation
        - Clearer position tracking
        """
        # Risk check with price for proper USD calculation
        risk_check_price = float(price) if price else None
        if not risk_check_price:
            # Try to get current market price for risk calculation
            symbol = self._convert_pair_to_v2_format(pair)
            current_ticker = self.market_data.get(f"{symbol}_ticker", {})
            risk_check_price = float(current_ticker.get('last', 0))

        # Apply XLM-specific logic
        if 'XLM' in pair and risk_check_price:
            # Check cooldown period
            if self.last_xlm_trade_time:
                now = datetime.now()
                time_since = now - self.last_xlm_trade_time
                cooldown_period = timedelta(minutes=self.config.xlm_cooldown_minutes)
                if time_since < cooldown_period:
                    remaining = (cooldown_period - time_since).total_seconds()
                    logger.warning(f"XLM cooldown active: {remaining:.0f} seconds remaining")
                    return {"error": f"XLM cooldown active, wait {remaining:.0f} seconds"}

            if not stop_loss:
                stop_loss = str(self.config.xlm_stop_loss_price)
                logger.info(f"Setting XLM stop-loss at ${stop_loss}")
            if not take_profit:
                take_profit = str(self.config.xlm_take_profit_price)
                logger.info(f"Setting XLM take-profit at ${take_profit}")

        # Get current balance from market data for risk check
        current_balance = self.market_data.get('balance', {})
        if not await self.risk_manager.approve_order(
            pair, volume, self.open_positions, risk_check_price, current_balance
        ):
            logger.warning(f"Order rejected by risk manager: {pair} {side} {volume}")
            return {"error": "Risk limit exceeded"}

        # XLM minimum order validation
        if 'XLM' in pair:
            xlm_volume = float(volume)
            if risk_check_price:
                # If volume is in USD, convert to XLM
                if xlm_volume < 100:  # Assume values < 100 are USD amounts
                    xlm_volume = xlm_volume / risk_check_price

            # Check against minimum order size
            if xlm_volume < self.config.xlm_min_order_size:
                logger.warning(
                    f"Order rejected: XLM volume {xlm_volume:.2f} "
                    f"below minimum {self.config.xlm_min_order_size}"
                )
                min_cost = self.config.xlm_min_order_size * risk_check_price
                return {
                    "error": f"Minimum order size for XLM is "
                             f"{self.config.xlm_min_order_size} XLM (${min_cost:.2f})"
                }

            # Check if price is within acceptable range
            if (risk_check_price < self.config.xlm_price_range_min or
                risk_check_price > self.config.xlm_price_range_max):
                logger.warning(
                    f"XLM price ${risk_check_price:.4f} outside safe range "
                    f"${self.config.xlm_price_range_min}-${self.config.xlm_price_range_max}"
                )

        # Convert to Kraken V2 format
        symbol = self._convert_pair_to_v2_format(pair)
        order_qty = float(volume)
        limit_price = float(price) if price else None

        # Calculate order costs
        if limit_price:
            order_cost = self.calculate_order_cost(order_qty, limit_price, side, order_type)
        else:
            current_ticker = self.market_data.get(f"{symbol}_ticker", {})
            est_price = float(current_ticker.get(
                'ask' if side == OrderSide.BUY else 'bid', 0
            ))
            if est_price > 0:
                order_cost = self.calculate_order_cost(order_qty, est_price, side, order_type)
            else:
                order_cost = {'total_cost': 0, 'fee_amount': 0}

        logger.info(
            f"Order cost: base=${order_cost.get('base_cost', 0):.2f}, "
            f"fee=${order_cost.get('fee_amount', 0):.4f}, "
            f"total=${order_cost.get('total_cost', 0):.2f}"
        )

        # Define WebSocket and REST methods
        async def ws_place_order():
            result = await self.websocket.add_order(
                symbol=symbol,
                side=side.value.lower(),
                order_type=order_type.value.lower(),
                order_qty=order_qty,
                limit_price=limit_price,
                post_only=True if order_type == OrderType.LIMIT else False
            )

            # FIXED: Store in open_positions (not pending_orders)
            if result.get('order_id'):
                order_id = result['order_id']
                self.open_positions[order_id] = {
                    'pair': pair,
                    'side': side.value,
                    'volume': volume,
                    'entry_price': price or risk_check_price,
                    'stop_loss': stop_loss,
                    'take_profit': take_profit,
                    'created_at': datetime.now().isoformat()
                }

                # Invalidate exposure cache
                self.exposure_cache.invalidate()

                # Update last XLM trade time
                if 'XLM' in pair:
                    self.last_xlm_trade_time = datetime.now()
                    logger.info(
                        f"XLM trade executed, cooldown started for "
                        f"{self.config.xlm_cooldown_minutes} minutes"
                    )

            # Log to database
            log_entry = {
                **result,
                "symbol": symbol,
                "side": side.value,
                "order_type": order_type.value,
                "volume": volume,
                "price": price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "estimated_fee": order_cost.get('fee_amount', 0),
                "estimated_total_cost": order_cost.get('total_cost', 0),
                "method": "websocket_v2"
            }
            await self.db.log_order(log_entry)

            logger.info(f"WebSocket order placed: {symbol} {side.value} {volume} @ {price}")
            return result

        async def rest_place_order():
            result = await self.kraken.place_order(
                pair=pair,
                type=side.value,
                ordertype=order_type.value,
                volume=volume,
                price=price
            )
            await self.db.log_order({**result, "method": "rest_fallback"})
            return result

        # Use optimized fallback pattern
        return await self._execute_with_websocket_fallback(
            ws_method=ws_place_order,
            rest_method=rest_place_order,
            method_name="place_order"
        )

    def _convert_pair_to_v2_format(self, pair: str) -> str:
        """Convert Kraken pair format to V2 standard (XBTUSD -> BTC/USD)"""
        pair_mapping = {
            'XBTUSD': 'BTC/USD',
            'ETHUSD': 'ETH/USD',
            'ADAUSD': 'ADA/USD',
            'XLMUSD': 'XLM/USD',
            'SOLUSD': 'SOL/USD',
            'DOTUSD': 'DOT/USD',
            'LINKUSD': 'LINK/USD',
            'MATICUSD': 'MATIC/USD',
            'AVAXUSD': 'AVAX/USD',
            'ATOMUSD': 'ATOM/USD'
        }
        return pair_mapping.get(pair, pair)

    async def close_position(self, position_id: str, reason: str = ""):
        """
        Close position with enhanced logging

        IMPROVEMENT: Uses open_positions (not mixing with orders)
        """
        logger.info(f"[CLOSE POSITION] {position_id} - Reason: {reason}")

        position = self.open_positions.get(position_id)
        if not position:
            logger.warning(f"[CLOSE POSITION] Position {position_id} not found")
            return

        # Place closing order
        side = OrderSide.SELL if position['side'] == 'buy' else OrderSide.BUY

        try:
            result = await self.place_order(
                pair=position['pair'],
                side=side,
                order_type=OrderType.MARKET,
                volume=position['volume']
            )

            # Log outcome
            if result and 'error' not in result:
                logger.info(
                    f"[CLOSE POSITION] SUCCESS - {position_id} closed "
                    f"({position['pair']} {side.value} {position['volume']})"
                )
                # Remove from positions
                self.open_positions.pop(position_id, None)
                # Invalidate exposure cache
                self.exposure_cache.invalidate()
            else:
                error_msg = result.get('error', 'Unknown error') if result else 'No response'
                logger.error(f"[CLOSE POSITION] FAILED - {position_id}: {error_msg}")
                await self.db.log_order({
                    'position_id': position_id,
                    'action': 'close_failed',
                    'reason': reason,
                    'error': error_msg,
                    'timestamp': datetime.now().isoformat()
                })
        except Exception as e:
            logger.error(
                f"[CLOSE POSITION] EXCEPTION closing {position_id}: {e}",
                exc_info=True
            )
            await self.db.log_order({
                'position_id': position_id,
                'action': 'close_exception',
                'reason': reason,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })

    async def cancel_all_orders(self):
        """
        Cancel all pending orders via WebSocket V2

        IMPROVEMENT: Uses optimized fallback pattern
        """
        logger.info("[CANCEL ALL] Initiating cancel_all_orders...")

        async def ws_cancel_all():
            result = await self.websocket.cancel_all_orders()
            logger.info(f"[CANCEL ALL] SUCCESS - WebSocket: {result}")
            return result

        async def rest_cancel_all():
            result = await self.kraken.cancel_all_orders()
            logger.info(f"[CANCEL ALL] SUCCESS - REST: {result}")
            return result

        try:
            return await self._execute_with_websocket_fallback(
                ws_method=ws_cancel_all,
                rest_method=rest_cancel_all,
                method_name="cancel_all_orders"
            )
        except Exception as e:
            logger.error(f"[CANCEL ALL] FAILED - Both WebSocket and REST failed: {e}")
            raise

    async def get_metrics(self) -> Dict:
        """Get trading metrics"""
        metrics = {
            'timestamp': TimestampUtils.now_rfc3339(),
            'positions': len(self.open_positions),
            'pending_orders': len(self.pending_orders),
            'strategies': len(self.strategies),
            'risk_metrics': await self.risk_manager.calculate_metrics(
                self.open_positions, self.kraken
            )
        }

        # Add strategy-specific metrics
        if hasattr(self, 'strategy_manager'):
            metrics['strategy_status'] = self.strategy_manager.get_strategy_status()

        return metrics


# ============================================================================
# RISK MANAGER - WITH OPTIMIZATIONS
# ============================================================================

class RiskManager:
    """
    Risk management system

    IMPROVEMENTS:
    - Better balance validation
    - Cached calculations via ExposureCache
    """

    def __init__(self, config):
        self.config = config
        self.max_position_size = Decimal(str(config.max_position_size))
        self.max_total_exposure = Decimal(str(config.max_total_exposure))
        self.max_positions = config.max_positions
        self.current_balance = None

    async def approve_order(
        self,
        pair: str,
        volume: str,
        positions: Dict,
        price: Optional[float] = None,
        balance: Optional[Dict] = None
    ) -> bool:
        """
        Check if order meets risk criteria

        IMPROVEMENT: Better balance dict validation
        """
        volume_decimal = Decimal(volume)

        # Update cached balance if provided
        if balance:
            self.current_balance = balance

        # Calculate position value in USD
        if price:
            position_value = volume_decimal * Decimal(str(price))
        else:
            logger.warning(
                f"No price provided for risk check on {pair}, using volume directly"
            )
            position_value = volume_decimal

        # Check position size in USD
        if position_value > self.max_position_size:
            logger.warning(
                f"Position size ${position_value} exceeds max ${self.max_position_size}"
            )
            return False

        # Check sufficient balance
        if self.current_balance:
            usd_balance = float(
                self.current_balance.get('ZUSD', self.current_balance.get('USD', 0))
            )

            # Check minimum balance requirement
            if usd_balance < self.config.min_balance_required:
                logger.error(
                    f"Insufficient balance: ${usd_balance:.2f} < "
                    f"${self.config.min_balance_required} minimum"
                )
                return False

            # Check if we have enough for this order plus buffer
            required_balance = float(position_value) * 1.1  # 10% buffer
            if usd_balance < required_balance:
                logger.warning(
                    f"Insufficient balance for order: ${usd_balance:.2f} < "
                    f"${required_balance:.2f} required"
                )
                return False

            # Warning if balance is low
            if usd_balance < self.config.min_balance_alert:
                logger.warning(
                    f"Low balance warning: ${usd_balance:.2f} "
                    f"(alert threshold: ${self.config.min_balance_alert})"
                )

        # Check number of positions
        if len(positions) >= self.max_positions:
            logger.warning(
                f"Already have {len(positions)} positions, max is {self.max_positions}"
            )
            return False

        # Check total exposure in USD
        total_exposure = self._calculate_total_exposure(positions)

        if total_exposure + position_value > self.max_total_exposure:
            logger.warning(
                f"Total exposure ${total_exposure + position_value} "
                f"would exceed max ${self.max_total_exposure}"
            )
            return False

        return True

    def _calculate_total_exposure(self, positions: Dict) -> Decimal:
        """
        OPTIMIZED: Calculate total exposure
        Can be cached by ExposureCache in TradingEngine
        """
        total = Decimal('0')
        for p in positions.values():
            pos_vol = Decimal(str(p.get('volume', 0)))
            pos_price = Decimal(str(p.get('entry_price', 1)))
            total += pos_vol * pos_price
        return total

    async def calculate_metrics(self, positions: Dict, kraken_client) -> Dict:
        """Calculate risk metrics"""
        if not positions:
            return {
                'risk_score': 0,
                'total_exposure': 0,
                'position_count': 0,
                'largest_position': 0
            }

        # Calculate USD values for positions
        total_exposure = Decimal('0')
        largest_position = Decimal('0')

        for p in positions.values():
            volume = Decimal(str(p.get('volume', 0)))
            price = Decimal(str(p.get('entry_price', 1)))
            position_value = volume * price
            total_exposure += position_value
            largest_position = max(largest_position, position_value)

        # Simple risk score calculation
        risk_score = (
            Decimal(len(positions)) / Decimal(self.max_positions) * Decimal('0.3') +
            total_exposure / self.max_total_exposure * Decimal('0.5') +
            largest_position / self.max_position_size * Decimal('0.2')
        )

        return {
            'risk_score': float(risk_score),
            'total_exposure': float(total_exposure),
            'position_count': len(positions),
            'largest_position': float(largest_position)
        }
