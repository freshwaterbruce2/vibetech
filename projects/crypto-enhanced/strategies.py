"""
Trading Strategies for XLM/USD Small Balance Trading
Optimized for $98.82 balance with conservative risk management
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from decimal import Decimal, ROUND_DOWN
from statistics import mean
import math

logger = logging.getLogger(__name__)


def round_price(price: float, decimals: int = 6) -> str:
    """
    Round price to Kraken's required decimal precision

    Args:
        price: The price to round
        decimals: Number of decimal places (default 6 for XLM/USD)

    Returns:
        String representation of rounded price
    """
    decimal_price = Decimal(str(price))
    quantizer = Decimal('0.' + '0' * (decimals - 1) + '1')
    return str(decimal_price.quantize(quantizer, rounding=ROUND_DOWN))


class Strategy(ABC):
    """Base class for all trading strategies"""

    def __init__(self, engine, config, name: str):
        self.engine = engine
        self.config = config
        self.name = name
        self.enabled = True
        self.last_trade_time = None
        self.trades_today = 0
        self.daily_pnl = 0.0
        self.max_daily_trades = 10  # Conservative limit for small account

    @abstractmethod
    async def evaluate(self) -> Optional[Dict]:
        """Evaluate strategy and return trade signal if any"""
        pass

    def get_market_data(self, symbol: str = "XLM/USD") -> Dict:
        """Get current market data for symbol"""
        ticker_key = f"{symbol}_ticker"
        trades_key = f"{symbol}_trades"

        return {
            'ticker': self.engine.market_data.get(ticker_key, {}),
            'trades': self.engine.market_data.get(trades_key, []),
            'book': self.engine.market_data.get(f"{symbol}_book", {})
        }

    def get_current_price(self, symbol: str = "XLM/USD") -> Optional[float]:
        """Get current price from market data"""
        market_data = self.get_market_data(symbol)
        ticker = market_data.get('ticker', {})

        if 'last' in ticker:
            return float(ticker['last'])
        elif 'c' in ticker:
            close_price = ticker['c'][0] if isinstance(ticker['c'], list) else ticker['c']
            return float(close_price)

        return None

    def calculate_rsi(self, prices: List[float], period: int = 14) -> Optional[float]:
        """Calculate RSI indicator"""
        if len(prices) < period + 1:
            return None

        gains = []
        losses = []

        for i in range(1, len(prices)):
            change = prices[i] - prices[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))

        if len(gains) < period:
            return None

        avg_gain = mean(gains[-period:])
        avg_loss = mean(losses[-period:])

        if avg_loss == 0:
            return 100

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return rsi

    def get_recent_prices(self, symbol: str = "XLM/USD", count: int = 50) -> List[float]:
        """Get recent prices from trade data"""
        market_data = self.get_market_data(symbol)
        trades = market_data.get('trades', [])

        if not trades:
            # Fallback to ticker data
            ticker = market_data.get('ticker', {})
            current_price = self.get_current_price(symbol)
            if current_price:
                return [current_price] * count  # Return current price as historical
            return []

        # Extract prices from recent trades
        prices = []
        for trade in trades[-count:]:
            if 'price' in trade:
                prices.append(float(trade['price']))

        return prices

    def can_trade(self) -> bool:
        """Check if strategy can trade based on limits"""
        if not self.enabled:
            return False

        # Check daily trade limit
        if self.trades_today >= self.max_daily_trades:
            logger.warning(f"{self.name}: Daily trade limit reached ({self.trades_today})")
            return False

        # Check cooldown period (5 minutes for XLM)
        if self.last_trade_time:
            cooldown = timedelta(minutes=self.config.xlm_cooldown_minutes)
            if datetime.now() - self.last_trade_time < cooldown:
                return False

        return True

    async def place_trade(self, side: str, volume_usd: float, order_type: str = "limit", price: Optional[float] = None) -> Dict:
        """Place a trade through the trading engine"""
        if not self.can_trade():
            return {"error": "Cannot trade due to limits"}

        try:
            from trading_engine import OrderSide, OrderType

            # Convert side string to enum
            order_side = OrderSide.BUY if side.lower() == 'buy' else OrderSide.SELL
            order_type_enum = OrderType.LIMIT if order_type.lower() == 'limit' else OrderType.MARKET

            # Calculate XLM volume from USD amount
            current_price = price or self.get_current_price()
            if not current_price:
                return {"error": "Cannot get current price"}

            xlm_volume = volume_usd / current_price

            # Ensure minimum order size for XLM (20 XLM)
            if xlm_volume < self.config.xlm_min_order_size:
                logger.warning(f"{self.name}: Order size {xlm_volume:.2f} XLM below minimum {self.config.xlm_min_order_size}")
                return {"error": f"Order below minimum size"}

            # CRITICAL FIX: Calculate stop-loss and take-profit
            stop_loss = None
            take_profit = None
            
            if side.lower() == 'buy':
                # For BUY orders: set stop-loss below and take-profit above
                stop_loss_price = current_price * 0.985  # -1.5% stop-loss
                take_profit_price = current_price * 1.015  # +1.5% take-profit
                
                stop_loss = str(stop_loss_price)
                take_profit = str(take_profit_price)
                
                logger.info(
                    f"{self.name}: Setting exits - "
                    f"Stop-loss: ${stop_loss_price:.4f} (-1.5%), "
                    f"Take-profit: ${take_profit_price:.4f} (+1.5%)"
                )

            # Place the order
            result = await self.engine.place_order(
                pair="XLM/USD",
                side=order_side,
                order_type=order_type_enum,
                volume=str(xlm_volume),
                price=round_price(price, 6) if price else None,
                stop_loss=stop_loss,
                take_profit=take_profit
            )

            if 'error' not in result:
                self.last_trade_time = datetime.now()
                self.trades_today += 1
                logger.info(f"{self.name}: Trade placed - {side} {xlm_volume:.2f} XLM @ ${price:.4f}")

            return result

        except Exception as e:
            logger.error(f"{self.name}: Error placing trade - {e}")
            return {"error": str(e)}


class RSIMeanReversionStrategy(Strategy):
    """RSI-based mean reversion strategy optimized for XLM"""

    def __init__(self, engine, config):
        super().__init__(engine, config, "RSI_MeanReversion")
        
        # Load optimization parameters from config
        strategy_config = getattr(config, 'strategies', {}).get('mean_reversion', {})
        
        self.rsi_period = 14
        self.rsi_oversold = strategy_config.get('rsi_oversold', 35)
        self.rsi_overbought = strategy_config.get('rsi_overbought', 65)
        self.min_profit_target = strategy_config.get('min_profit_target', 0.004)  # 0.4%
        self.max_accumulation = strategy_config.get('max_position_accumulation_xlm', 100)
        self.stop_loss_pct = strategy_config.get('stop_loss_pct', 0.015)  # 1.5%
        self.entry_levels = strategy_config.get('entry_levels', 3)
        
        # Position tracking
        self.accumulated_xlm = 0
        self.entry_count = 0
        self.position_size_usd = 8.0  # $8 per entry, conservative

    def sync_accumulation(self):
        """Sync accumulated_xlm with actual engine positions"""
        total_xlm = sum(pos.get('volume', 0) for pos in self.engine.positions.values() if pos.get('pair') == 'XLM/USD')
        if abs(total_xlm - self.accumulated_xlm) > 0.1:  # Threshold to avoid float precision issues
            logger.info(f"{self.name}: Syncing accumulation from {self.accumulated_xlm:.2f} to {total_xlm:.2f} XLM")
            self.accumulated_xlm = total_xlm
            self.entry_count = len([p for p in self.engine.positions.values() if p.get('pair') == 'XLM/USD'])

    async def evaluate(self) -> Optional[Dict]:
        """Evaluate RSI strategy"""
        if not self.can_trade():
            return None

        # Sync accumulation tracking with actual positions
        self.sync_accumulation()

        try:
            # Get recent prices
            prices = self.get_recent_prices()
            if len(prices) < self.rsi_period + 1:
                logger.debug(f"{self.name}: Insufficient price data ({len(prices)} prices)")
                return None

            # Calculate RSI
            rsi = self.calculate_rsi(prices, self.rsi_period)
            if rsi is None:
                return None

            current_price = self.get_current_price()
            if not current_price:
                return None

            logger.debug(f"{self.name}: RSI={rsi:.2f}, Price=${current_price:.4f}")

            # Check for oversold condition (buy signal)
            if rsi < self.rsi_oversold and current_price > self.config.xlm_price_range_min:
                # Check accumulation limits before buying
                if self.accumulated_xlm >= self.max_accumulation:
                    logger.warning(f"{self.name}: Max accumulation reached ({self.accumulated_xlm:.2f} XLM >= {self.max_accumulation} XLM)")
                    return None
                
                # Check if this trade would exceed max accumulation
                estimated_xlm = self.position_size_usd / current_price
                if self.accumulated_xlm + estimated_xlm > self.max_accumulation:
                    # Adjust position size to not exceed limit
                    remaining_capacity = self.max_accumulation - self.accumulated_xlm
                    adjusted_size_usd = remaining_capacity * current_price
                    if adjusted_size_usd < 1.0:  # Don't place trades under $1
                        logger.warning(f"{self.name}: Remaining capacity too small (${adjusted_size_usd:.2f})")
                        return None
                    logger.info(f"{self.name}: Adjusted position size from ${self.position_size_usd:.2f} to ${adjusted_size_usd:.2f} to respect accumulation limit")
                    self.position_size_usd = adjusted_size_usd
                
                logger.info(f"{self.name}: RSI oversold signal - RSI={rsi:.2f}, Price=${current_price:.4f}, Accumulated={self.accumulated_xlm:.2f} XLM")
                result = await self.place_trade("buy", self.position_size_usd, "limit", current_price * 1.001)
                
                # Update accumulation tracking if trade was placed
                if result:
                    self.accumulated_xlm += estimated_xlm
                    self.entry_count += 1
                    logger.info(f"{self.name}: Updated accumulation: {self.accumulated_xlm:.2f} XLM (entry #{self.entry_count})")
                
                return result

            # Check for overbought condition (sell signal) - only if we have positions
            elif rsi > self.rsi_overbought and len(self.engine.positions) > 0:
                logger.info(f"{self.name}: RSI overbought signal - RSI={rsi:.2f}, Price=${current_price:.4f}, Accumulated={self.accumulated_xlm:.2f} XLM")
                result = await self.place_trade("sell", self.position_size_usd, "limit", current_price * 0.999)
                
                # Update accumulation tracking if trade was placed
                if result:
                    sold_xlm = self.position_size_usd / current_price
                    self.accumulated_xlm = max(0, self.accumulated_xlm - sold_xlm)
                    logger.info(f"{self.name}: Reduced accumulation: {self.accumulated_xlm:.2f} XLM remaining")
                
                return result

        except Exception as e:
            logger.error(f"{self.name}: Error in evaluation - {e}")

        return None


class RangeTradingStrategy(Strategy):
    """Range trading strategy for XLM within $0.34-$0.41 range"""

    def __init__(self, engine, config):
        super().__init__(engine, config, "RangeTrading")
        
        # Load optimization parameters
        strategy_config = getattr(config, 'strategies', {}).get('range_trading', {})
        
        self.support_level = 0.345  # Buy near support
        self.resistance_level = 0.395  # Sell near resistance
        self.position_size_usd = 9.0  # Slightly larger for range trading
        self.buffer_percent = 0.002  # 0.2% buffer for entry/exit
        self.max_accumulation = strategy_config.get('max_position_accumulation_xlm', 80)  # Lower than mean reversion
        
        # Position tracking
        self.accumulated_xlm = 0

    def sync_accumulation(self):
        """Sync accumulated_xlm with actual engine positions"""
        total_xlm = sum(pos.get('volume', 0) for pos in self.engine.positions.values() if pos.get('pair') == 'XLM/USD')
        if abs(total_xlm - self.accumulated_xlm) > 0.1:
            logger.info(f"{self.name}: Syncing accumulation from {self.accumulated_xlm:.2f} to {total_xlm:.2f} XLM")
            self.accumulated_xlm = total_xlm

    async def evaluate(self) -> Optional[Dict]:
        """Evaluate range trading strategy"""
        if not self.can_trade():
            return None

        # Sync accumulation tracking
        self.sync_accumulation()

        try:
            current_price = self.get_current_price()
            if not current_price:
                return None

            # Get volume data to confirm signals
            market_data = self.get_market_data()
            ticker = market_data.get('ticker', {})

            # Check for buy signal near support
            buy_threshold = self.support_level * (1 + self.buffer_percent)
            if current_price <= buy_threshold and current_price >= self.config.xlm_price_range_min:
                # Check accumulation limits
                if self.accumulated_xlm >= self.max_accumulation:
                    logger.warning(f"{self.name}: Max accumulation reached ({self.accumulated_xlm:.2f} XLM)")
                    return None
                
                estimated_xlm = self.position_size_usd / current_price
                if self.accumulated_xlm + estimated_xlm > self.max_accumulation:
                    remaining_capacity = self.max_accumulation - self.accumulated_xlm
                    adjusted_size_usd = remaining_capacity * current_price
                    if adjusted_size_usd < 1.0:
                        logger.warning(f"{self.name}: Remaining capacity too small (${adjusted_size_usd:.2f})")
                        return None
                    logger.info(f"{self.name}: Adjusted position size from ${self.position_size_usd:.2f} to ${adjusted_size_usd:.2f}")
                    self.position_size_usd = adjusted_size_usd
                
                logger.info(f"{self.name}: Range buy signal - Price ${current_price:.4f} near support ${self.support_level:.4f}, Accumulated={self.accumulated_xlm:.2f} XLM")
                result = await self.place_trade("buy", self.position_size_usd, "limit", current_price * 1.0005)
                
                if result:
                    self.accumulated_xlm += estimated_xlm
                    logger.info(f"{self.name}: Updated accumulation: {self.accumulated_xlm:.2f} XLM")
                
                return result

            # Check for sell signal near resistance (only if we have positions)
            sell_threshold = self.resistance_level * (1 - self.buffer_percent)
            if current_price >= sell_threshold and len(self.engine.positions) > 0:
                logger.info(f"{self.name}: Range sell signal - Price ${current_price:.4f} near resistance ${self.resistance_level:.4f}")
                result = await self.place_trade("sell", self.position_size_usd, "limit", current_price * 0.9995)
                
                if result:
                    sold_xlm = self.position_size_usd / current_price
                    self.accumulated_xlm = max(0, self.accumulated_xlm - sold_xlm)
                    logger.info(f"{self.name}: Reduced accumulation: {self.accumulated_xlm:.2f} XLM remaining")
                
                return result

            # Breakout detection - if price breaks resistance with volume
            if current_price > self.resistance_level * 1.005:  # 0.5% above resistance
                logger.info(f"{self.name}: Potential breakout above ${self.resistance_level:.4f}")
                # Could implement momentum follow strategy here

        except Exception as e:
            logger.error(f"{self.name}: Error in evaluation - {e}")

        return None


class MicroScalpingStrategy(Strategy):
    """Micro scalping strategy for quick small profits"""

    def __init__(self, engine, config):
        super().__init__(engine, config, "MicroScalping")
        self.target_profit_percent = 0.008  # 0.8% target profit
        self.max_loss_percent = 0.004  # 0.4% max loss
        self.position_size_usd = 8.5  # Ensures minimum 20 XLM at current prices
        self.min_spread_percent = 0.001  # Minimum 0.1% spread to trade
        self.max_trades_per_hour = 3  # Conservative rate
        self.last_hour_trades = []

    async def evaluate(self) -> Optional[Dict]:
        """Evaluate micro scalping strategy"""
        if not self.can_trade():
            return None

        try:
            # Clean up old trade timestamps
            current_time = datetime.now()
            self.last_hour_trades = [t for t in self.last_hour_trades
                                   if current_time - t < timedelta(hours=1)]

            # Check hourly trade limit
            if len(self.last_hour_trades) >= self.max_trades_per_hour:
                return None

            current_price = self.get_current_price()
            if not current_price:
                return None

            # Get bid/ask spread
            market_data = self.get_market_data()
            ticker = market_data.get('ticker', {})

            bid = float(ticker.get('b', [0, 0])[0]) if 'b' in ticker else current_price * 0.999
            ask = float(ticker.get('a', [0, 0])[0]) if 'a' in ticker else current_price * 1.001

            if bid <= 0 or ask <= 0:
                return None

            spread_percent = (ask - bid) / current_price

            # Only trade if spread is reasonable
            if spread_percent < self.min_spread_percent:
                return None

            # Look for quick momentum in recent trades
            recent_prices = self.get_recent_prices(count=10)
            if len(recent_prices) < 5:
                return None

            # Simple momentum: if last 3 prices are trending up, consider buy
            last_3 = recent_prices[-3:]
            if len(last_3) == 3:
                is_trending_up = last_3[2] > last_3[1] > last_3[0]
                is_trending_down = last_3[2] < last_3[1] < last_3[0]

                if is_trending_up and current_price < ask * 1.002:  # Buy on uptrend
                    logger.info(f"{self.name}: Scalp buy signal - momentum up, price ${current_price:.4f}")
                    self.last_hour_trades.append(current_time)
                    return await self.place_trade("buy", self.position_size_usd, "limit", bid * 1.0001)

                elif is_trending_down and len(self.engine.positions) > 0:  # Sell on downtrend
                    logger.info(f"{self.name}: Scalp sell signal - momentum down, price ${current_price:.4f}")
                    self.last_hour_trades.append(current_time)
                    return await self.place_trade("sell", self.position_size_usd, "limit", ask * 0.9999)

        except Exception as e:
            logger.error(f"{self.name}: Error in evaluation - {e}")

        return None


class StrategyManager:
    """Manages multiple strategies and their execution"""

    def __init__(self, engine, config):
        self.engine = engine
        self.config = config
        self.strategies = []
        self.enabled = True

    def initialize_strategies(self):
        """Initialize all strategies"""
        try:
            # Only enable strategies suitable for small balance
            strategies = [
                RSIMeanReversionStrategy(self.engine, self.config),
                RangeTradingStrategy(self.engine, self.config),
            ]

            # CRITICAL: Use real-time WebSocket V2 balance (not estimated)
            # Priority: 1. usd_balance (extracted) 2. balance dict 3. fallback
            usd_balance = self.engine.market_data.get('usd_balance')

            if usd_balance is None:
                # Fallback: try to extract from balance dict (WebSocket V2 format)
                balance = self.engine.market_data.get('balance', {})
                usd_balance = balance.get('USD', 0)

            usd_balance = float(usd_balance) if usd_balance else 0

            # If balance not available yet, use config value or conservative default
            if usd_balance == 0:
                usd_balance = getattr(self.config, 'estimated_balance', 98.0)
                logger.warning(f"WebSocket balance not available - using estimated ${usd_balance:.2f}")
            else:
                logger.info(f"Using real-time WebSocket balance: ${usd_balance:.2f}")

            if usd_balance > 50:  # Only scalp with larger balance
                strategies.append(MicroScalpingStrategy(self.engine, self.config))
            else:
                logger.info(f"Skipping micro scalping - balance ${usd_balance:.2f} below $50 threshold")

            self.strategies = strategies
            logger.info(f"Initialized {len(self.strategies)} trading strategies: {[s.name for s in self.strategies]}")

        except Exception as e:
            logger.error(f"Error initializing strategies: {e}")
            self.strategies = []

    async def evaluate_all(self):
        """Evaluate all enabled strategies"""
        if not self.enabled or not self.strategies:
            return

        for strategy in self.strategies:
            if strategy.enabled:
                try:
                    await strategy.evaluate()
                except Exception as e:
                    logger.error(f"Error evaluating strategy {strategy.name}: {e}")
                    continue

    def get_strategy_status(self) -> Dict:
        """Get status of all strategies"""
        return {
            'total_strategies': len(self.strategies),
            'enabled_strategies': len([s for s in self.strategies if s.enabled]),
            'strategies': [
                {
                    'name': s.name,
                    'enabled': s.enabled,
                    'trades_today': s.trades_today,
                    'last_trade': s.last_trade_time.isoformat() if s.last_trade_time else None
                }
                for s in self.strategies
            ]
        }