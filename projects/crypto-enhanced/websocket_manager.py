"""
WebSocket Manager for Kraken V2 WebSocket API
Handles real-time market data and order updates with RFC3339 timestamp compliance
"""

import asyncio
import json
import logging
import time
from typing import Dict, Any, Optional, List, Callable
import websockets
from datetime import datetime
from timestamp_utils import TimestampUtils, normalize as normalize_timestamp
from errors_simple import WebSocketError, log_error

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Kraken WebSocket V2 manager"""

    WS_URL = "wss://ws.kraken.com/v2"
    WS_AUTH_URL = "wss://ws-auth.kraken.com/v2"

    def __init__(self, config, kraken_client=None):
        self.config = config
        self.kraken = kraken_client  # Need this to get WebSocket token
        self.public_ws: Optional[websockets.WebSocketClientProtocol] = None
        self.private_ws: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False
        self.subscriptions = {}
        self.callbacks = {}
        self.heartbeat_task = None
        self.reconnect_delay = 5
        self.max_reconnect_delay = 60
        self.ws_token = None
        self.ws_token_timestamp = None  # Track when token was created
        self.token_refresh_task = None  # Background token refresh task
        self._private_channel_failed = False  # Track if private channels are unavailable

        # WebSocket V2 2025 compliance
        self.connection_attempts = []  # Track connection attempts for rate limiting
        self.max_attempts_per_10min = 150  # Kraken limit
        self.heartbeat_interval = 1  # 1Hz frequency
        self.last_heartbeat = None

    async def start(self):
        """Start WebSocket connections using TaskGroup (2025 pattern)"""
        self.running = True
        logger.info("Starting WebSocket connections...")

        # TaskGroup provides structured concurrency with automatic cleanup
        try:
            async with asyncio.TaskGroup() as tg:
                tg.create_task(self._connect_public())
                tg.create_task(self._connect_private())
        except* Exception as eg:
            # Handle exception group from TaskGroup
            for exc in eg.exceptions:
                log_error(exc, "websocket_start")
                logger.error(f"WebSocket connection error: {exc}")

    async def stop(self):
        """Stop WebSocket connections"""
        self.running = False
        logger.info("Stopping WebSocket connections...")

        # Cancel background tasks
        if self.heartbeat_task:
            self.heartbeat_task.cancel()

        if self.token_refresh_task:
            self.token_refresh_task.cancel()
            logger.info("Token refresh monitor stopped")

        # Close WebSocket connections
        if self.public_ws:
            await self.public_ws.close()
        if self.private_ws:
            await self.private_ws.close()

    def is_connected(self) -> bool:
        """Check if WebSocket is connected"""
        public_connected = self.public_ws is not None
        private_connected = self.private_ws is not None
        return public_connected or private_connected

    async def _connect_public(self):
        """Connect to public WebSocket with V2 rate limiting"""
        reconnect_delay = self.reconnect_delay

        while self.running:
            # Check connection rate limit (150 per 10 minutes)
            if not await self._check_connection_rate_limit():
                wait_time = await self._get_rate_limit_wait_time()
                logger.warning(f"Connection rate limit reached, waiting {wait_time}s")
                await asyncio.sleep(wait_time)
                continue

            try:
                logger.info("Connecting to public WebSocket V2...")
                self._record_connection_attempt()

                # 2025 best practice: use asyncio.timeout() instead of wait_for
                async with asyncio.timeout(30):
                    async with websockets.connect(self.WS_URL) as websocket:
                        self.public_ws = websocket
                        # Reset delay on successful connection
                        reconnect_delay = self.reconnect_delay

                        # Subscribe to channels
                        await self._subscribe_public_channels()

                        # Start heartbeat monitoring as background task
                        if not self.heartbeat_task or self.heartbeat_task.done():
                            self.heartbeat_task = asyncio.create_task(
                                self._monitor_heartbeat()
                            )

                        # Handle messages
                        await self._handle_public_messages()

            except websockets.exceptions.WebSocketException as e:
                ws_error = WebSocketError(
                    f"Public WebSocket error: {e}",
                    channel="public"
                )
                logger.exception(
                    f"Public WebSocket exception: {ws_error.message}"
                )
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(
                    reconnect_delay * 2,
                    self.max_reconnect_delay
                )
            except asyncio.TimeoutError:
                logger.error(
                    "Public WebSocket connection timeout after 30s"
                )
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(
                    reconnect_delay * 2,
                    self.max_reconnect_delay
                )
            except Exception as e:
                logger.error(
                    f"Unexpected error in public WebSocket: {type(e).__name__}: {e}",
                    exc_info=True
                )
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(
                    reconnect_delay * 2,
                    self.max_reconnect_delay
                )

    async def _connect_private(self):
        """Connect to private WebSocket (authenticated)"""
        if not self.config.kraken_api_key or not self.config.kraken_api_secret:
            logger.info("API credentials not configured, skipping private WebSocket")
            return

        reconnect_delay = self.reconnect_delay

        while self.running:
            try:
                logger.info("Connecting to private WebSocket...")
                # 2025 best practice: use asyncio.timeout() for operations
                async with asyncio.timeout(30):
                    async with websockets.connect(
                        self.WS_AUTH_URL
                    ) as websocket:
                        self.private_ws = websocket
                        reconnect_delay = self.reconnect_delay

                        # Authenticate
                        await self._authenticate()

                        # Subscribe to private channels
                        await self._subscribe_private_channels()

                        # Handle messages
                        await self._handle_private_messages()

            except websockets.exceptions.WebSocketException as e:
                ws_error = WebSocketError(
                    f"Private WebSocket error: {e}", 
                    channel="private"
                )
                logger.exception(f"Private WebSocket exception: {ws_error.message}")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(
                    reconnect_delay * 2, 
                    self.max_reconnect_delay
                )
            except asyncio.TimeoutError:
                logger.error("Private WebSocket connection timeout after 30s")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(
                    reconnect_delay * 2, 
                    self.max_reconnect_delay
                )
            except Exception as e:
                logger.error(
                    f"Unexpected error in private WebSocket: {type(e).__name__}: {e}",
                    exc_info=True
                )
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(
                    reconnect_delay * 2,
                    self.max_reconnect_delay
                )

    async def _authenticate(self):
        """Authenticate private WebSocket connection with proactive token management"""
        if self.kraken:
            try:
                # Get WebSocket token from REST API
                token_response = await self.kraken.get_websocket_token()
                self.ws_token = token_response.get('token')
                self.ws_token_timestamp = TimestampUtils.now_rfc3339()  # Track creation time
                logger.info(f"WebSocket token obtained successfully (valid for 15 minutes)")

                # Start proactive token refresh task
                if self.token_refresh_task:
                    self.token_refresh_task.cancel()
                self.token_refresh_task = asyncio.create_task(
                    self._token_refresh_monitor()
                )

            except Exception as e:
                logger.error(f"Failed to get WebSocket token: {e}")
                logger.warning("Will continue with public data only - trading may be limited")
                self.ws_token = None
                self.ws_token_timestamp = None
                self._private_channel_failed = True
        else:
            logger.error("KrakenClient not provided, cannot get WebSocket token")
            logger.warning("Operating in public-only mode")
            self.ws_token = None
            self.ws_token_timestamp = None
            self._private_channel_failed = True

    async def _token_refresh_monitor(self):
        """
        Monitor token age and proactively refresh before expiration
        Kraken tokens should be used within 15 minutes, but don't expire once connection is established
        """
        from datetime import timezone
        
        while self.running and self.ws_token:
            try:
                # Check token age every 5 minutes
                await asyncio.sleep(300)  # 5 minutes

                if not self.ws_token_timestamp:
                    continue

                # Parse RFC3339 timestamp to datetime
                try:
                    token_created = datetime.fromisoformat(
                        self.ws_token_timestamp.replace('Z', '+00:00')
                    )
                    now = datetime.now(timezone.utc)
                    token_age_minutes = (now - token_created).total_seconds() / 60
                except (ValueError, AttributeError) as e:
                    logger.error(f"Failed to parse token timestamp: {e}")
                    continue

                # If token is older than 12 minutes and we're not connected, refresh it
                if token_age_minutes > 12 and not self.private_ws:
                    logger.info(f"Token is {token_age_minutes:.1f} minutes old, refreshing proactively")
                    await self._refresh_token()

                # If connected, token doesn't expire, so just log status
                elif self.private_ws:
                    logger.debug(f"Token age: {token_age_minutes:.1f} minutes (connection active, no refresh needed)")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in token refresh monitor: {e}", exc_info=True)
                await asyncio.sleep(60)  # Wait before retrying

    async def _refresh_token(self):
        """Refresh WebSocket token"""
        if not self.kraken:
            return

        try:
            logger.info("Refreshing WebSocket token...")
            token_response = await self.kraken.get_websocket_token()
            old_token = self.ws_token
            self.ws_token = token_response.get('token')
            self.ws_token_timestamp = TimestampUtils.now_rfc3339()

            logger.info("WebSocket token refreshed successfully")

            # If we have an active connection but the token changed, we may need to re-authenticate
            # However, Kraken's implementation keeps connections alive once established
            if old_token != self.ws_token and self.private_ws:
                logger.info("Token changed but connection is active - Kraken maintains connection")

        except Exception as e:
            logger.error(f"Failed to refresh WebSocket token: {e}")
            # Don't clear the current token if refresh fails - keep the connection alive

    async def _subscribe_public_channels(self):
        """Subscribe to public channels"""
        # Subscribe to ticker
        for pair in self.config.trading_pairs:
            await self.subscribe_ticker(pair)
            await self.subscribe_ohlc(pair)
            await self.subscribe_book(pair)
            await self.subscribe_trade(pair)

    async def _subscribe_private_channels(self):
        """Subscribe to private channels for real-time updates"""
        if not self.ws_token:
            logger.error("No WebSocket token available, cannot subscribe to private channels")
            return

        # Subscribe to executions (includes both orders AND trades in V2)
        executions_msg = {
            "method": "subscribe",
            "params": {
                "channel": "executions",
                "token": self.ws_token,
                "snap_orders": True,  # Include open orders snapshot
                "snap_trades": True   # Include recent trades
            }
        }
        await self.private_ws.send(json.dumps(executions_msg))
        logger.info("Subscribed to executions channel")

        # Subscribe to balances
        balance_msg = {
            "method": "subscribe",
            "params": {
                "channel": "balances",
                "token": self.ws_token
            }
        }
        await self.private_ws.send(json.dumps(balance_msg))
        logger.info("Subscribed to balances channel")

    async def _handle_public_messages(self):
        """Handle public WebSocket messages"""
        async for message in self.public_ws:
            try:
                data = json.loads(message)
                await self._process_message(data, is_private=False)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse public message: {e}")
            except Exception as e:
                logger.error(f"Error handling public message: {e}")

    async def _handle_private_messages(self):
        """Handle private WebSocket messages"""
        async for message in self.private_ws:
            try:
                data = json.loads(message)
                await self._process_message(data, is_private=True)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse private message: {e}")
            except Exception as e:
                logger.error(f"Error handling private message: {e}")

    async def _process_message(self, data: Dict, is_private: bool = False):
        """Process incoming message with exception isolation"""
        msg_type = data.get('channel') or data.get('type')

        try:
            if msg_type == 'heartbeat':
                await self._handle_heartbeat(data, is_private)
            elif msg_type == 'status':
                await self._handle_status(data)
            elif msg_type == 'ticker':
                await self._handle_ticker(data)
            elif msg_type == 'ohlc':
                await self._handle_ohlc(data)
            elif msg_type == 'book':
                await self._handle_book(data)
            elif msg_type == 'trade':
                await self._handle_trade(data)
            elif msg_type == 'executions':
                await self._handle_execution(data)
            elif msg_type == 'balances':
                await self._handle_balance(data)
            else:
                logger.debug(f"Unknown message type: {msg_type}")
        except Exception as e:
            # Log but don't propagate - keep WebSocket alive
            logger.error(f"Error processing {msg_type} message: {e}", exc_info=True)
            # Message processing failure shouldn't crash the connection

    async def _handle_heartbeat(self, data: Dict, is_private: bool):
        """Handle heartbeat message"""
        ws = self.private_ws if is_private else self.public_ws
        pong = {"method": "pong"}
        await ws.send(json.dumps(pong))

    async def _handle_status(self, data: Dict):
        """Handle status message"""
        logger.info(f"WebSocket status: {data}")

    async def _handle_ticker(self, data: Dict):
        """Handle ticker update"""
        if 'ticker' in self.callbacks:
            await self.callbacks['ticker'](data)

    async def _handle_ohlc(self, data: Dict):
        """Handle OHLC update"""
        if 'ohlc' in self.callbacks:
            await self.callbacks['ohlc'](data)

    async def _handle_book(self, data: Dict):
        """Handle order book update"""
        if 'book' in self.callbacks:
            await self.callbacks['book'](data)

    async def _handle_trade(self, data: Dict):
        """Handle trade update"""
        if 'trade' in self.callbacks:
            await self.callbacks['trade'](data)

    async def _handle_execution(self, data: Dict):
        """Handle execution (order) update"""
        logger.info(f"Order execution: {data}")
        if 'execution' in self.callbacks:
            await self.callbacks['execution'](data)

    async def _handle_balance(self, data: Dict):
        """Handle balance update"""
        logger.info(f"Balance update: {data}")
        if 'balance' in self.callbacks:
            await self.callbacks['balance'](data)

    # Subscription methods
    async def subscribe_ticker(self, pair: str):
        """Subscribe to ticker channel"""
        msg = {
            "method": "subscribe",
            "params": {
                "channel": "ticker",
                "symbol": [pair]
            }
        }
        if self.public_ws:
            try:
                await self.public_ws.send(json.dumps(msg))
            except Exception as e:
                logger.error(f"Failed to send message: {e}")

    async def subscribe_ohlc(self, pair: str, interval: int = 60):
        """Subscribe to OHLC channel"""
        msg = {
            "method": "subscribe",
            "params": {
                "channel": "ohlc",
                "symbol": [pair],
                "interval": interval
            }
        }
        if self.public_ws:
            try:
                await self.public_ws.send(json.dumps(msg))
            except Exception as e:
                logger.error(f"Failed to send message: {e}")

    async def subscribe_book(self, pair: str, depth: int = 10):
        """Subscribe to order book channel"""
        msg = {
            "method": "subscribe",
            "params": {
                "channel": "book",
                "symbol": [pair],
                "depth": depth
            }
        }
        if self.public_ws:
            try:
                await self.public_ws.send(json.dumps(msg))
            except Exception as e:
                logger.error(f"Failed to send message: {e}")

    async def subscribe_trade(self, pair: str):
        """Subscribe to trade channel"""
        msg = {
            "method": "subscribe",
            "params": {
                "channel": "trade",
                "symbol": [pair]
            }
        }
        if self.public_ws:
            try:
                await self.public_ws.send(json.dumps(msg))
            except Exception as e:
                logger.error(f"Failed to send message: {e}")

    def register_callback(self, channel: str, callback: Callable):
        """Register callback for channel"""
        self.callbacks[channel] = callback

    # ============================================
    # KRAKEN WEBSOCKET V2 ORDER PLACEMENT METHODS
    # ============================================

    async def add_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        order_qty: float,
        limit_price: Optional[float] = None,
        time_in_force: str = "gtc",
        post_only: bool = False,
        reduce_only: bool = False,
        client_order_id: Optional[str] = None
    ) -> Dict:
        """
        Place single order via WebSocket V2 (replaces REST API)

        Args:
            symbol: Trading pair in BTC/USD format
            side: "buy" or "sell"
            order_type: "limit", "market", "stop-loss", "stop-loss-limit", "take-profit", "take-profit-limit", "trailing-stop", "trailing-stop-limit"
            order_qty: Order quantity (number type as per V2 spec)
            limit_price: Limit price for limit orders
            time_in_force: "gtc" (Good Till Canceled), "gtd" (Good Till Date), "ioc" (Immediate Or Cancel)
            post_only: True to cancel if order takes liquidity
            reduce_only: True to reduce margin position only
            client_order_id: Optional client-assigned order ID
        """
        if not self.private_ws or not self.ws_token:
            raise Exception("Private WebSocket not connected or no token available")

        # Generate unique request ID
        req_id = int(time.time() * 1000000)

        # Build order request according to Kraken V2 spec
        order_params = {
            "symbol": symbol,
            "side": side,
            "order_type": order_type,
            "order_qty": order_qty,
            "token": self.ws_token
        }

        # Add optional parameters
        if limit_price is not None:
            order_params["limit_price"] = limit_price

        if time_in_force != "gtc":
            order_params["time_in_force"] = time_in_force

        if post_only:
            order_params["post_only"] = True

        if reduce_only:
            order_params["reduce_only"] = True

        if client_order_id:
            order_params["client_order_id"] = client_order_id

        message = {
            "method": "add_order",
            "params": order_params,
            "req_id": req_id
        }

        try:
            await self.private_ws.send(json.dumps(message))
            logger.info(f"Sent add_order request: {symbol} {side} {order_qty} @ {limit_price}")
            return {"req_id": req_id, "status": "sent"}
        except Exception as e:
            logger.error(f"Failed to send add_order: {e}")
            raise

    async def batch_add_orders(self, orders: List[Dict]) -> Dict:
        """
        Place multiple orders via WebSocket V2 batch_add method

        Args:
            orders: List of order dictionaries (min 2, max 15)
        """
        if not self.private_ws or not self.ws_token:
            raise Exception("Private WebSocket not connected or no token available")

        if len(orders) < 2 or len(orders) > 15:
            raise ValueError("Batch orders must contain between 2 and 15 orders")

        req_id = int(time.time() * 1000000)

        # Add token to each order
        for order in orders:
            order["token"] = self.ws_token

        message = {
            "method": "batch_add",
            "params": {
                "orders": orders
            },
            "req_id": req_id
        }

        try:
            await self.private_ws.send(json.dumps(message))
            logger.info(f"Sent batch_add request for {len(orders)} orders")
            return {"req_id": req_id, "status": "sent"}
        except Exception as e:
            logger.error(f"Failed to send batch_add: {e}")
            raise

    async def cancel_order(self, order_id: str) -> Dict:
        """Cancel single order via WebSocket V2"""
        if not self.private_ws or not self.ws_token:
            raise Exception("Private WebSocket not connected or no token available")

        req_id = int(time.time() * 1000000)

        message = {
            "method": "cancel_order",
            "params": {
                "order_id": order_id,
                "token": self.ws_token
            },
            "req_id": req_id
        }

        try:
            await self.private_ws.send(json.dumps(message))
            logger.info(f"Sent cancel_order request for {order_id}")
            return {"req_id": req_id, "status": "sent"}
        except Exception as e:
            logger.error(f"Failed to send cancel_order: {e}")
            raise

    async def cancel_all_orders(self) -> Dict:
        """Cancel all orders via WebSocket V2"""
        if not self.private_ws or not self.ws_token:
            raise Exception("Private WebSocket not connected or no token available")

        req_id = int(time.time() * 1000000)

        message = {
            "method": "cancel_all",
            "params": {
                "token": self.ws_token
            },
            "req_id": req_id
        }

        try:
            await self.private_ws.send(json.dumps(message))
            logger.info("Sent cancel_all orders request")
            return {"req_id": req_id, "status": "sent"}
        except Exception as e:
            logger.error(f"Failed to send cancel_all: {e}")
            raise

    async def amend_order(
        self,
        order_id: str,
        order_qty: Optional[float] = None,
        limit_price: Optional[float] = None,
        post_only: Optional[bool] = None
    ) -> Dict:
        """
        Amend order via WebSocket V2 (maintains queue priority where possible)

        Args:
            order_id: Kraken order ID to modify
            order_qty: New order quantity
            limit_price: New limit price
            post_only: New post_only flag
        """
        if not self.private_ws or not self.ws_token:
            raise Exception("Private WebSocket not connected or no token available")

        req_id = int(time.time() * 1000000)

        params = {
            "order_id": order_id,
            "token": self.ws_token
        }

        # Add only specified parameters
        if order_qty is not None:
            params["order_qty"] = order_qty
        if limit_price is not None:
            params["limit_price"] = limit_price
        if post_only is not None:
            params["post_only"] = post_only

        message = {
            "method": "amend_order",
            "params": params,
            "req_id": req_id
        }

        try:
            await self.private_ws.send(json.dumps(message))
            logger.info(f"Sent amend_order request for {order_id}")
            return {"req_id": req_id, "status": "sent"}
        except Exception as e:
            logger.error(f"Failed to send amend_order: {e}")
            raise

    # WebSocket V2 2025 Standards Compliance Methods

    async def _check_connection_rate_limit(self) -> bool:
        """Check if we're within connection rate limits (150 per 10 minutes)"""
        now = time.time()
        # Remove attempts older than 10 minutes
        self.connection_attempts = [t for t in self.connection_attempts if now - t < 600]
        # Check if under limit
        return len(self.connection_attempts) < self.max_attempts_per_10min

    def _record_connection_attempt(self):
        """Record a connection attempt for rate limiting"""
        self.connection_attempts.append(time.time())

    async def _get_rate_limit_wait_time(self) -> float:
        """Calculate how long to wait before next connection attempt"""
        if not self.connection_attempts:
            return 0

        now = time.time()
        oldest_attempt = min(self.connection_attempts)
        time_until_reset = 600 - (now - oldest_attempt)  # 10 minutes = 600 seconds

        return max(0, time_until_reset)

    async def _monitor_heartbeat(self):
        """Monitor heartbeat at 1Hz frequency as per V2 spec"""
        while self.running and (self.public_ws or self.private_ws):
            try:
                self.last_heartbeat = time.time()
                # V2 expects heartbeat every second
                await asyncio.sleep(self.heartbeat_interval)

                # Check if we've missed heartbeats (> 5 seconds)
                if self.last_heartbeat and time.time() - self.last_heartbeat > 5:
                    logger.warning("Heartbeat timeout detected, connection may be stale")
                    # Trigger reconnection
                    if self.public_ws:
                        await self.public_ws.close()
                    if self.private_ws:
                        await self.private_ws.close()

            except asyncio.CancelledError:
                break
            except Exception as e:
                log_error(e, "heartbeat_monitor")
                await asyncio.sleep(5)

    def _convert_symbol_to_v2(self, symbol: str) -> str:
        """Convert symbol to V2 format (XBT -> BTC)"""
        conversions = {
            'XBT/USD': 'BTC/USD',
            'XBTUSD': 'BTC/USD',
            'XBT': 'BTC',
            # XLM remains XLM
            'XLMUSD': 'XLM/USD'
        }
        return conversions.get(symbol, symbol)

    def _convert_symbol_from_v2(self, symbol: str) -> str:
        """Convert V2 symbol back to internal format if needed"""
        conversions = {
            'BTC/USD': 'XBT/USD',
            'BTC': 'XBT',
            # XLM remains XLM
            'XLM/USD': 'XLM/USD'
        }
        return conversions.get(symbol, symbol)