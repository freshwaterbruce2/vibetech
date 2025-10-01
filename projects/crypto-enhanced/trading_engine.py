"""
Trading Engine - Core trading logic and strategy execution
Manages orders, positions, and risk management
"""

import asyncio
import logging
from datetime import datetime, timedelta
from timestamp_utils import TimestampUtils
from errors_simple import log_error
from typing import Dict, Optional
from decimal import Decimal
from enum import Enum

logger = logging.getLogger(__name__)


class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop-loss"
    TAKE_PROFIT = "take-profit"


class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"


class TradingEngine:
    """Main trading engine"""

    def __init__(self, kraken_client, websocket_manager, database, config):
        self.kraken = kraken_client
        self.websocket = websocket_manager
        self.db = database
        self.config = config
        self.running = False
        self.positions = {}
        self.pending_orders = {}
        self.market_data = {}
        self.strategies = []
        self.risk_manager = RiskManager(config)
        self.last_xlm_trade_time = None  # Track last XLM trade for cooldown

        # Register WebSocket callbacks
        self._register_callbacks()

    def _register_callbacks(self):
        """Register WebSocket callbacks"""
        self.websocket.register_callback('ticker', self._on_ticker_update)
        self.websocket.register_callback('trade', self._on_trade_update)
        self.websocket.register_callback('book', self._on_book_update)
        self.websocket.register_callback(
            'execution', self._on_execution_update
        )
        self.websocket.register_callback('balance', self._on_balance_update)

    async def run(self):
        """Main trading loop"""
        self.running = True
        logger.info("Trading engine started")

        # Initialize strategies
        await self._initialize_strategies()

        # Get initial state ONCE at startup
        try:
            await self._initialize_state()
        except Exception as e:
            log_error(e, "initialize_state")
            msg = f"Failed to initialize state: {e} - continuing anyway"
            logger.error(msg)

        # Main trading loop - NO MORE API POLLING
        while self.running:
            try:
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
                logger.error(f"Trading engine error: {e}", exc_info=True)
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
            msg = f"Initialized {len(self.strategies)} strategies"
            logger.info(f"{msg}: {strategy_names}")

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
            self.positions = positions if positions else {}

            # Get initial balance
            balance = await self.kraken.get_account_balance()
            if balance:
                self.market_data['balance'] = balance

            msg = (
                f"Initial state loaded: {len(self.pending_orders)} orders, "
                f"{len(self.positions)} positions"
            )
            logger.info(msg)

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
                    msg = f"Strategy {strategy.__class__.__name__} error: {e}"
                    logger.error(msg)

    async def _check_exits(self):
        """Check stop losses and take profits"""
        if not self.positions:
            logger.debug("No positions to check for exits")
            return
        
        logger.debug(f"Checking exits for {len(self.positions)} positions")
        
        for position_id, position in list(self.positions.items()):
            try:
                current_price = await self._get_current_price(position['pair'])
                entry = position.get('entry_price')
                msg = (
                    f"Position {position_id}: {position['pair']} "
                    f"entry={entry}, current={current_price}"
                )
                logger.debug(msg)

                # Enhanced XLM-specific monitoring
                if 'XLM' in position.get('pair', ''):
                    price_float = float(current_price)
                    range_min = self.config.xlm_price_range_min
                    range_max = self.config.xlm_price_range_max
                    msg = (
                        f"XLM price check: ${price_float:.4f} "
                        f"(range: ${range_min:.4f}-${range_max:.4f})"
                    )
                    logger.debug(msg)

                    # Emergency stop-loss if price drops below critical level
                    if price_float < range_min:
                        msg = (
                            f"XLM price ${price_float:.4f} below minimum "
                            f"range ${range_min}"
                        )
                        logger.warning(msg)
                        reason = f"XLM emergency stop (price ${price_float:.4f})"
                        await self.close_position(position_id, reason=reason)
                        continue

                    # Take profit if price exceeds maximum range
                    if price_float > range_max:
                        msg = (
                            f"XLM price ${price_float:.4f} above maximum "
                            f"range ${range_max}"
                        )
                        logger.info(msg)
                        reason = f"XLM range limit (price ${price_float:.4f})"
                        await self.close_position(position_id, reason=reason)
                        continue

                # Check stop loss
                if position.get('stop_loss'):
                    if self._should_stop_loss(position, current_price):
                        reason = "Stop loss triggered"
                        await self.close_position(position_id, reason=reason)

                # Check take profit
                if position.get('take_profit'):
                    if self._should_take_profit(position, current_price):
                        reason = "Take profit triggered"
                        await self.close_position(position_id, reason=reason)

            except Exception as e:
                log_error(e, f"check_exits_{position_id}")
                msg = f"Error checking exits for position {position_id}: {e}"
                logger.error(msg)

    async def _monitor_risk(self):
        """Monitor risk metrics"""
        metrics = await self.risk_manager.calculate_metrics(
            self.positions, self.kraken
        )

        if metrics['risk_score'] > self.config.max_risk_score:
            logger.warning(f"High risk detected: {metrics['risk_score']}")
            await self._reduce_exposure()

    def _should_stop_loss(
        self, position: Dict, current_price: Decimal
    ) -> bool:
        """Check if stop loss should trigger"""
        stop_loss = Decimal(str(position['stop_loss']))
        current = Decimal(str(current_price))

        if position['side'] == 'buy':
            return current <= stop_loss
        else:
            return current >= stop_loss

    def _should_take_profit(
        self, position: Dict, current_price: Decimal
    ) -> bool:
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
                is_list = isinstance(ticker['c'], list)
                close_price = ticker['c'][0] if is_list else ticker['c']
                return Decimal(str(close_price))
        
        # Fallback to API only if no WebSocket data (should be rare)
        logger.warning(f"No WebSocket data for {pair}, falling back to API")
        ticker = await self.kraken.get_ticker(pair)
        return Decimal(ticker[pair]['c'][0])  # Last trade closed price

    async def _monitor_balance(self):
        """Monitor account balance and pause trading if too low"""
        balance = self.market_data.get('balance', {})
        usd_balance = float(balance.get('ZUSD', balance.get('USD', 0)))

        # Critical: Stop trading if below minimum
        min_required = self.config.min_balance_required
        if usd_balance > 0 and usd_balance < min_required:
            msg = (
                f"CRITICAL: Balance ${usd_balance:.2f} below minimum "
                f"${min_required}"
            )
            logger.critical(msg)
            logger.critical("Trading suspended due to insufficient funds")
            # Close all positions to preserve capital
            if self.positions:
                logger.warning("Closing all positions due to low balance")
                for position_id in list(self.positions.keys()):
                    reason = "Low balance protection"
                    await self.close_position(position_id, reason=reason)
            # Clear strategies to stop new trades
            self.strategies = []
            return

        # Warning: Alert if balance is low
        alert_threshold = self.config.min_balance_alert
        if usd_balance > 0 and usd_balance < alert_threshold:
            msg = (
                f"LOW BALANCE WARNING: ${usd_balance:.2f} "
                f"(alert threshold: ${alert_threshold})"
            )
            logger.warning(msg)

            # For XLM trading, ensure we have enough for minimum order
            if 'XLM/USD' in self.config.trading_pairs:
                xlm_price = self._get_xlm_price()
                if xlm_price:
                    min_size = self.config.xlm_min_order_size
                    min_order_cost = min_size * xlm_price
                    if usd_balance < min_order_cost * 1.1:  # 10% buffer
                        msg = (
                            f"Balance ${usd_balance:.2f} may be insufficient "
                            f"for XLM minimum order (${min_order_cost:.2f})"
                        )
                        logger.warning(msg)

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
            self.positions.items(),
            key=lambda x: x[1].get('risk_score', 0),
            reverse=True
        )

        # Close top 2 risky positions
        for position_id, position in positions_by_risk[:2]:
            await self.close_position(position_id, reason="Risk reduction")

    def calculate_order_cost(
        self, volume: float, price: float, side: OrderSide,
        order_type: OrderType
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

    def calculate_position_pnl(
        self, position: Dict, current_price: float
    ) -> Dict:
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
        if entry_fee == 0:  # Estimate if not stored
            taker_fee = Decimal(str(self.config.taker_fee))
            entry_fee = volume * entry_price * taker_fee

        exit_fee = (
            volume * Decimal(str(current_price)) * taker_fee
        )
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

    # WebSocket callbacks
    async def _on_ticker_update(self, data: Dict):
        """Handle ticker updates"""
        symbol = data.get('symbol')
        if symbol:
            self.market_data[f"{symbol}_ticker"] = data

            # Use ticker data to generate synthetic trades if trade channel is empty
            trades_key = f"{symbol}_trades"
            if trades_key not in self.market_data:
                self.market_data[trades_key] = []

            # Add ticker as a synthetic trade for strategy evaluation
            if 'ask' in data and 'bid' in data:
                mid_price = (float(data.get('ask', 0)) + float(data.get('bid', 0))) / 2
                if mid_price > 0:
                    synthetic_trade = {
                        'symbol': symbol,
                        'price': mid_price,
                        'volume': 1.0,  # Synthetic volume
                        'time': data.get('time'),
                        'synthetic': True
                    }
                    self.market_data[trades_key].append(synthetic_trade)
                    # Keep only last 100 trades
                    trades = self.market_data[trades_key]
                    self.market_data[trades_key] = trades[-100:]

    async def _on_trade_update(self, data: Dict):
        """Handle trade updates"""
        symbol = data.get('symbol')
        if symbol:
            trades_key = f"{symbol}_trades"
            if trades_key not in self.market_data:
                self.market_data[trades_key] = []
            self.market_data[trades_key].append(data)
            # Keep only last 100 trades
            trades = self.market_data[trades_key]
            self.market_data[trades_key] = trades[-100:]

    async def _on_book_update(self, data: Dict):
        """Handle order book updates"""
        symbol = data.get('symbol')
        if symbol:
            self.market_data[f"{symbol}_book"] = data

    async def _on_execution_update(self, data: Dict):
        """
        Handle execution updates - REAL-TIME from WebSocket
        (includes orders AND trades)
        """
        logger.info(f"Execution update: {data}")

        # Use execution trades to seed market data if trade channel is empty
        if 'data' in data and isinstance(data['data'], list):
            for exec_data in data['data']:
                if exec_data.get('exec_type') == 'trade':
                    symbol = exec_data.get('symbol')
                    if symbol:
                        trades_key = f"{symbol}_trades"
                        if trades_key not in self.market_data:
                            self.market_data[trades_key] = []
                        # Convert execution format to trade format
                        trade_data = {
                            'symbol': symbol,
                            'price': exec_data.get('last_price'),
                            'volume': exec_data.get('last_qty'),
                            'time': exec_data.get('timestamp'),
                            'side': exec_data.get('side')
                        }
                        self.market_data[trades_key].append(trade_data)
                        # Keep only last 100 trades
                        trades = self.market_data[trades_key]
                        self.market_data[trades_key] = trades[-100:]

        # V2 executions channel handles both orders and trades
        # Check if it's an order update
        if 'orders' in data:
            # Update pending orders from snapshot
            self.pending_orders = {}
            for order in data['orders']:
                if order.get('order_id'):
                    self.pending_orders[order['order_id']] = order
            num_orders = len(self.pending_orders)
            logger.info(f"Updated pending orders: {num_orders} orders")

        # Handle individual order updates
        elif 'order' in data:
            order = data['order']
            order_id = order.get('order_id')
            if order_id:
                active_statuses = [
                    'pending', 'open', 'partially_filled'
                ]
                if order.get('status') in active_statuses:
                    self.pending_orders[order_id] = order
                elif order.get('status') in [
                    'filled', 'cancelled', 'expired'
                ]:
                    self.pending_orders.pop(order_id, None)

        # Handle trade executions
        if 'trade' in data:
            logger.info(f"Trade executed: {data['trade']}")

        # No API call needed - data comes from WebSocket!

    async def _on_balance_update(self, data: Dict):
        """Handle balance updates - REAL-TIME from WebSocket"""
        logger.info(f"Balance update: {data}")
        # Parse WebSocket balance format correctly
        # WebSocket sends:
        # {'data': [{'asset': 'USD', 'balance': 98.8167}, ...]}
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

    # Trading methods
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
        Place new order via WebSocket V2
        (replaces REST API for better performance)
        """
        # Risk check with price for proper USD calculation
        risk_check_price = float(price) if price else None
        if not risk_check_price:
            # Try to get current market price for risk calculation
            symbol = self._convert_pair_to_v2_format(pair)
            current_ticker = self.market_data.get(f"{symbol}_ticker", {})
            risk_check_price = float(current_ticker.get('last', 0))

        # Apply XLM-specific stop-loss and take-profit if not provided
        if 'XLM' in pair and risk_check_price:
            # Check cooldown period
            if self.last_xlm_trade_time:
                now = datetime.now()
                time_since = now - self.last_xlm_trade_time
                cooldown_mins = self.config.xlm_cooldown_minutes
                cooldown_period = timedelta(minutes=cooldown_mins)
                if time_since < cooldown_period:
                    remaining = (
                        cooldown_period - time_since
                    ).total_seconds()
                    msg = (
                        f"XLM cooldown active: "
                        f"{remaining:.0f} seconds remaining"
                    )
                    logger.warning(msg)
                    error_msg = (
                        f"XLM cooldown active, "
                        f"wait {remaining:.0f} seconds"
                    )
                    return {"error": error_msg}

            if not stop_loss:
                stop_loss = str(self.config.xlm_stop_loss_price)
                logger.info(f"Setting XLM stop-loss at ${stop_loss}")
            if not take_profit:
                take_profit = str(self.config.xlm_take_profit_price)
                logger.info(f"Setting XLM take-profit at ${take_profit}")

        # Get current balance from market data for risk check
        current_balance = self.market_data.get('balance', {})
        if not await self.risk_manager.approve_order(pair, volume, self.positions, risk_check_price, current_balance):
            logger.warning(f"Order rejected by risk manager: {pair} {side} {volume}")
            return {"error": "Risk limit exceeded"}

        # XLM minimum order validation
        if 'XLM' in pair:
            # Calculate XLM volume based on USD value and price
            xlm_volume = float(volume)
            if risk_check_price:
                # If volume is in USD, convert to XLM
                if xlm_volume < 100:  # Assume values < 100 are USD amounts
                    xlm_volume = xlm_volume / risk_check_price

            # Check against Kraken's minimum order size for XLM
            if xlm_volume < self.config.xlm_min_order_size:
                logger.warning(f"Order rejected: XLM volume {xlm_volume:.2f} below minimum {self.config.xlm_min_order_size}")
                return {"error": f"Minimum order size for XLM is {self.config.xlm_min_order_size} XLM (${self.config.xlm_min_order_size * risk_check_price:.2f})"}

            # Check if price is within acceptable range
            if risk_check_price < self.config.xlm_price_range_min or risk_check_price > self.config.xlm_price_range_max:
                logger.warning(f"XLM price ${risk_check_price:.4f} outside safe range ${self.config.xlm_price_range_min}-${self.config.xlm_price_range_max}")
                # Don't reject, but log warning

        # Convert to Kraken V2 format
        symbol = self._convert_pair_to_v2_format(pair)  # Convert XBTUSD to BTC/USD
        order_qty = float(volume)
        limit_price = float(price) if price else None

        # Calculate order costs including fees
        if limit_price:
            order_cost = self.calculate_order_cost(order_qty, limit_price, side, order_type)
        else:
            # For market orders, estimate with current price
            current_ticker = self.market_data.get(f"{symbol}_ticker", {})
            est_price = float(current_ticker.get('ask' if side == OrderSide.BUY else 'bid', 0))
            if est_price > 0:
                order_cost = self.calculate_order_cost(order_qty, est_price, side, order_type)
            else:
                order_cost = {'total_cost': 0, 'fee_amount': 0}

        logger.info(f"Order cost calculation: base=${order_cost.get('base_cost', 0):.2f}, "
                  f"fee=${order_cost.get('fee_amount', 0):.4f}, "
                  f"total=${order_cost.get('total_cost', 0):.2f}")

        # Validate WebSocket connection state before attempting order placement
        if not self.websocket.is_connected() or not self.websocket.private_ws:
            logger.warning("WebSocket not connected, using REST API fallback")
            try:
                result = await self.kraken.place_order(
                    pair=pair,
                    type=side.value,
                    ordertype=order_type.value,
                    volume=volume,
                    price=price
                )
                await self.db.log_order({**result, "method": "rest_no_websocket"})
                logger.info(f"REST API order placed: {symbol} {side.value} {volume}")
                return result
            except Exception as rest_error:
                log_error(rest_error, "rest_order_placement")
                logger.error(f"REST order placement failed: {rest_error}")
                return {"error": str(rest_error)}

        # Attempt WebSocket V2 order placement
        try:
            result = await self.websocket.add_order(
                symbol=symbol,
                side=side.value.lower(),  # "buy" or "sell"
                order_type=order_type.value.lower(),  # "limit", "market", etc.
                order_qty=order_qty,
                limit_price=limit_price,
                post_only=True if order_type == OrderType.LIMIT else False  # Maker preference for limit orders
            )

            # Store stop_loss and take_profit in positions tracking
            if result.get('order_id'):
                order_id = result['order_id']
                self.positions[order_id] = {
                    'pair': pair,
                    'side': side.value,
                    'volume': volume,
                    'entry_price': price or risk_check_price,
                    'stop_loss': stop_loss,
                    'take_profit': take_profit,
                    'created_at': datetime.now().isoformat()
                }

                # Update last XLM trade time
                if 'XLM' in pair:
                    self.last_xlm_trade_time = datetime.now()
                    logger.info(f"XLM trade executed, cooldown started for {self.config.xlm_cooldown_minutes} minutes")

            # Log to database with WebSocket request info and fee calculations
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

        except Exception as e:
            log_error(e, "websocket_order_placement")
            logger.error(f"WebSocket order placement failed: {e}")
            # Fallback to REST API only if WebSocket fails
            logger.warning("Falling back to REST API for order placement")

            result = await self.kraken.place_order(
                pair=pair,
                type=side.value,
                ordertype=order_type.value,
                volume=volume,
                price=price
            )

            # Log to database
            await self.db.log_order({**result, "method": "rest_fallback"})
            return result

    def _convert_pair_to_v2_format(self, pair: str) -> str:
        """Convert Kraken pair format to V2 standard (XBTUSD -> BTC/USD)"""
        # Map common Kraken internal pairs to V2 format
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

        # Return mapped format or assume already in V2 format
        return pair_mapping.get(pair, pair)

    async def close_position(self, position_id: str, reason: str = ""):
        """Close position"""
        logger.info(f"Closing position {position_id}: {reason}")

        position = self.positions.get(position_id)
        if not position:
            logger.warning(f"Position {position_id} not found")
            return

        # Place closing order
        side = OrderSide.SELL if position['side'] == 'buy' else OrderSide.BUY
        await self.place_order(
            pair=position['pair'],
            side=side,
            order_type=OrderType.MARKET,
            volume=position['volume']
        )

    async def cancel_all_orders(self):
        """Cancel all pending orders via WebSocket V2"""
        try:
            # Use WebSocket V2 cancel_all method
            result = await self.websocket_manager.cancel_all_orders()
            logger.info(f"WebSocket cancel_all request sent: {result}")
            return result
        except Exception as e:
            log_error(e, "websocket_cancel_all")
            logger.error(f"WebSocket cancel_all failed: {e}")
            # Fallback to REST API if WebSocket fails
            logger.warning("Falling back to REST API for cancel_all")
            result = await self.kraken.cancel_all_orders()
            logger.info(f"REST cancel_all completed: {result}")
            return result

    async def get_metrics(self) -> Dict:
        """Get trading metrics"""
        metrics = {
            'timestamp': TimestampUtils.now_rfc3339(),
            'positions': len(self.positions),
            'pending_orders': len(self.pending_orders),
            'strategies': len(self.strategies),
            'risk_metrics': await self.risk_manager.calculate_metrics(self.positions, self.kraken)
        }

        # Add strategy-specific metrics if strategy manager exists
        if hasattr(self, 'strategy_manager'):
            metrics['strategy_status'] = self.strategy_manager.get_strategy_status()

        return metrics


class RiskManager:
    """Risk management system"""

    def __init__(self, config):
        self.config = config
        self.max_position_size = Decimal(str(config.max_position_size))
        self.max_total_exposure = Decimal(str(config.max_total_exposure))
        self.max_positions = config.max_positions
        self.current_balance = None  # Cache current balance

    async def approve_order(self, pair: str, volume: str, positions: Dict, price: Optional[float] = None, balance: Optional[Dict] = None) -> bool:
        """Check if order meets risk criteria including balance check"""
        volume_decimal = Decimal(volume)

        # Update cached balance if provided
        if balance:
            self.current_balance = balance

        # For risk calculation, we need the USD value not the asset volume
        # If price not provided, this should be retrieved from market data
        if price:
            position_value = volume_decimal * Decimal(str(price))
        else:
            # Without price, we can't properly assess risk - be conservative
            logger.warning(f"No price provided for risk check on {pair}, using volume directly")
            position_value = volume_decimal

        # Check position size in USD
        if position_value > self.max_position_size:
            logger.warning(f"Position size ${position_value} exceeds max ${self.max_position_size}")
            return False

        # Check if we have sufficient balance
        if self.current_balance:
            usd_balance = float(self.current_balance.get('ZUSD', self.current_balance.get('USD', 0)))

            # Check minimum balance requirement
            if usd_balance < self.config.min_balance_required:
                logger.error(f"Insufficient balance: ${usd_balance:.2f} < ${self.config.min_balance_required} minimum")
                return False

            # Check if we have enough for this order plus buffer
            required_balance = float(position_value) * 1.1  # 10% buffer for fees and slippage
            if usd_balance < required_balance:
                logger.warning(f"Insufficient balance for order: ${usd_balance:.2f} < ${required_balance:.2f} required")
                return False

            # Warning if balance is low
            if usd_balance < self.config.min_balance_alert:
                logger.warning(f"Low balance warning: ${usd_balance:.2f} (alert threshold: ${self.config.min_balance_alert})")

        # Check number of positions
        if len(positions) >= self.max_positions:
            logger.warning(f"Already have {len(positions)} positions, max is {self.max_positions}")
            return False

        # Check total exposure in USD
        total_exposure = Decimal('0')
        for p in positions.values():
            # Calculate USD value of each position
            pos_vol = Decimal(str(p.get('volume', 0)))
            pos_price = Decimal(str(p.get('entry_price', 1)))  # Use entry price if available
            total_exposure += pos_vol * pos_price

        if total_exposure + position_value > self.max_total_exposure:
            logger.warning(f"Total exposure ${total_exposure + position_value} would exceed max ${self.max_total_exposure}")
            return False

        return True

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

        # Simple risk score calculation using Decimals throughout
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
