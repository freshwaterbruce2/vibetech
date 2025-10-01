"""
Kraken API Client with full REST API support
Handles authentication, rate limiting, and error recovery
"""

import asyncio
import hashlib
import hmac
import base64
import time
import urllib.parse
from typing import Dict, Any, Optional
import aiohttp
import logging
from datetime import datetime
from nonce_manager import NonceManager
from errors_simple import APIError, KrakenAPIError, log_error, is_retryable
from circuit_breaker import CircuitBreaker  # 2025 resilience pattern
import random  # For exponential backoff

logger = logging.getLogger(__name__)


def exponential_backoff_with_jitter(
    attempt: int,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    jitter_range: float = 0.3
) -> float:
    """Calculate exponential backoff delay with jitter to prevent thundering herd"""
    delay = min(base_delay * (2 ** attempt), max_delay)
    jitter = random.uniform(-jitter_range, jitter_range) * delay
    return max(0.1, delay + jitter)


class KrakenClient:
    """Kraken REST API client"""

    BASE_URL = "https://api.kraken.com"
    API_VERSION = "0"

    def __init__(self, config, use_secondary_key: bool = False):
        self.config = config
        # Support multiple API keys for nonce isolation
        if use_secondary_key:
            self.api_key = config.kraken_api_key_2
            self.api_secret = config.kraken_api_secret_2
            self.key_label = "secondary"
        else:
            self.api_key = config.kraken_api_key
            self.api_secret = config.kraken_api_secret
            self.key_label = "primary"
        self.session: Optional[aiohttp.ClientSession] = None
        # Use separate nonce manager for each API key to prevent conflicts
        nonce_file = f"nonce_state_{self.key_label}.json"
        self.nonce_manager = NonceManager(storage_path=nonce_file)
        # Fixed rate limiter: 3 calls per 3 seconds = 1 call/second average
        self.rate_limiter = RateLimiter(max_calls=3, period=3)
        # Circuit breaker to prevent cascading failures (2025 best practice)
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,  # Open after 5 consecutive failures
            timeout=30,  # Try recovery after 30 seconds
            success_threshold=2  # Close after 2 consecutive successes
        )
        self._connected = False
        # Cache for ticker data to reduce API calls
        self._ticker_cache = {}
        self._cache_ttl = 15  # Cache TTL in seconds
        logger.info(f"Kraken client initialized with circuit breaker protection ({self.key_label} API key)")

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()

    async def connect(self):
        """Initialize session"""
        if not self.session:
            self.session = aiohttp.ClientSession()
            self._connected = True
            logger.info("Kraken client connected")

    async def disconnect(self):
        """Close session"""
        if self.session:
            await self.session.close()
            self.session = None
            self._connected = False
            logger.info("Kraken client disconnected")

    async def is_connected(self) -> bool:
        """Check if connected"""
        return self._connected and self.session is not None

    def _get_nonce(self) -> str:
        """Generate unique nonce for API calls"""
        return self.nonce_manager.get_nonce()

    def _sign_request(self, urlpath: str, data: Dict[str, Any]) -> str:
        """Sign request for private endpoints"""
        postdata = urllib.parse.urlencode(data)
        encoded = (str(data['nonce']) + postdata).encode()
        message = urlpath.encode() + hashlib.sha256(encoded).digest()
        signature = hmac.new(
            base64.b64decode(self.api_secret),
            message,
            hashlib.sha512
        )
        return base64.b64encode(signature.digest()).decode()

    async def _request(
        self,
        endpoint: str,
        private: bool = False,
        data: Optional[Dict] = None
    ) -> Dict:
        """Unified API request with circuit breaker protection"""
        async def api_call():
            return await self._execute_request(endpoint, private, data)
        
        # Circuit breaker protects against cascading failures
        return await self.circuit_breaker.call(api_call)

    async def _execute_request(self, endpoint: str, private: bool = False, data: Optional[Dict] = None, retry_count: int = 0) -> Dict:
        """Execute API request with retry logic"""
        MAX_RETRIES = 5

        if not self.session:
            await self.connect()

        await self.rate_limiter.acquire()

        url = f"{self.BASE_URL}/{self.API_VERSION}/{endpoint}"

        if private:
            if not data:
                data = {}
            data['nonce'] = self._get_nonce()
            # Add nonce window for better error tolerance (2025 best practice)
            if hasattr(self.config, 'nonce_window') and self.config.nonce_window > 0:
                data['window'] = str(self.config.nonce_window)

            headers = {
                'API-Key': self.api_key,
                'API-Sign': self._sign_request(f"/{self.API_VERSION}/{endpoint}", data)
            }

            method = 'POST'
        else:
            headers = {}
            method = 'GET' if not data else 'POST'

        try:
            timeout = aiohttp.ClientTimeout(total=30)
            async with self.session.request(method, url, data=data, headers=headers, timeout=timeout) as response:
                result = await response.json()

                if result.get('error'):
                    error_msg = str(result['error'])

                    # Create API error with automatic classification
                    api_error = KrakenAPIError(
                        error_message=error_msg,
                        endpoint=endpoint,
                        status_code=response.status,
                        request_data=data if not private else None
                    )

                    # Check for nonce error and retry with exponential backoff
                    if 'nonce' in str(api_error).lower() and retry_count < MAX_RETRIES:
                        delay = exponential_backoff_with_jitter(retry_count, base_delay=2.0, max_delay=30.0)
                        logger.warning(f"Nonce error on attempt {retry_count + 1}/{MAX_RETRIES}, retrying in {delay:.2f}s...")
                        await asyncio.sleep(delay)
                        return await self._execute_request(endpoint, private, data, retry_count + 1)

                    # Check if error is retryable using simple function
                    if not is_retryable(api_error):
                        raise api_error

                    # For other retryable errors, check retry count
                    if retry_count < MAX_RETRIES:
                        delay = exponential_backoff_with_jitter(retry_count, base_delay=2.0, max_delay=30.0)
                        logger.warning(f"API error on attempt {retry_count + 1}/{MAX_RETRIES}, retrying in {delay:.2f}s: {error_msg}")
                        await asyncio.sleep(delay)
                        return await self._execute_request(endpoint, private, data, retry_count + 1)

                    raise api_error

                return result.get('result', {})

        except KrakenAPIError:
            # Re-raise Kraken API errors as-is
            raise
        except aiohttp.ClientError as e:
            # Handle network errors with retry
            if retry_count < MAX_RETRIES:
                delay = exponential_backoff_with_jitter(retry_count, base_delay=2.0, max_delay=30.0)
                logger.warning(f"Network error on attempt {retry_count + 1}/{MAX_RETRIES}, retrying in {delay:.2f}s: {e}")
                await asyncio.sleep(delay)
                return await self._execute_request(endpoint, private, data, retry_count + 1)

            # Convert to APIError after max retries
            raise APIError(f"Network error after {MAX_RETRIES} retries: {e}")
        except Exception as e:
            # Log unexpected errors
            log_error(e, f"API request to {endpoint}")
            raise

    # Removed _resilient_request - now using unified _request with circuit breaker

    # Public endpoints
    async def get_system_status(self) -> Dict:
        """Get Kraken system status"""
        return await self._request('public/SystemStatus')

    async def get_ticker(self, pair: str) -> Dict:
        """Get ticker information with caching"""
        # Check cache first
        cache_key = f'ticker_{pair}'
        now = datetime.now()

        if cache_key in self._ticker_cache:
            cached_data, cached_time = self._ticker_cache[cache_key]
            if (now - cached_time).total_seconds() < self._cache_ttl:
                logger.debug(f"Using cached ticker data for {pair}")
                return cached_data

        # Fetch fresh data
        data = await self._request('public/Ticker', data={'pair': pair})

        # Update cache
        self._ticker_cache[cache_key] = (data, now)

        return data

    async def get_ohlc(self, pair: str, interval: int = 60) -> Dict:
        """Get OHLC data"""
        return await self._request('public/OHLC', data={'pair': pair, 'interval': interval})

    async def get_order_book(self, pair: str, count: int = 100) -> Dict:
        """Get order book"""
        return await self._request('public/Depth', data={'pair': pair, 'count': count})

    async def get_recent_trades(self, pair: str) -> Dict:
        """Get recent trades"""
        return await self._request('public/Trades', data={'pair': pair})

    async def get_asset_pairs(self) -> Dict:
        """Get tradeable asset pairs"""
        return await self._request('public/AssetPairs')

    # Private endpoints
    async def get_account_balance(self) -> Dict:
        """Get account balance with enhanced resilience"""
        return await self._request('private/Balance', private=True)

    async def get_trade_balance(self, asset: str = 'USD') -> Dict:
        """Get trade balance"""
        return await self._request('private/TradeBalance', private=True, data={'asset': asset})

    async def get_open_orders(self) -> Dict:
        """Get open orders with enhanced resilience"""
        return await self._request('private/OpenOrders', private=True)

    async def get_closed_orders(self) -> Dict:
        """Get closed orders"""
        return await self._request('private/ClosedOrders', private=True)

    async def get_trades_history(self) -> Dict:
        """Get trades history"""
        return await self._request('private/TradesHistory', private=True)

    async def get_open_positions(self) -> Dict:
        """Get open positions"""
        return await self._request('private/OpenPositions', private=True)

    async def place_order(
        self,
        pair: str,
        type: str,
        ordertype: str,
        price: Optional[str] = None,
        volume: str = None,
        leverage: Optional[str] = None,
        validate: bool = False
    ) -> Dict:
        """Place new order"""
        data = {
            'pair': pair,
            'type': type,
            'ordertype': ordertype,
            'volume': volume,
        }

        if price:
            data['price'] = price
        if leverage:
            data['leverage'] = leverage
        if validate:
            data['validate'] = 'true'

        # Use resilient request for critical trading operations
        # Log only non-sensitive order details
        logger.info(f"Placing {type} order: {pair} volume={volume} price={'market' if not price else '[SET]'}")
        return await self._request('private/AddOrder', private=True, data=data)

    async def cancel_order(self, txid: str) -> Dict:
        """Cancel open order"""
        return await self._request('private/CancelOrder', private=True, data={'txid': txid})

    async def cancel_all_orders(self) -> Dict:
        """Cancel all open orders"""
        return await self._request('private/CancelAll', private=True)

    async def get_websocket_token(self) -> Dict:
        """Get WebSocket authentication token for private feeds"""
        return await self._request('private/GetWebSocketsToken', private=True)


class RateLimiter:
    """Rate limiter for API calls"""

    def __init__(self, max_calls: int = 3, period: int = 3):
        self.max_calls = max_calls
        self.period = period
        self.calls = []
        self.lock = asyncio.Lock()

    async def acquire(self):
        """Wait if necessary to respect rate limits"""
        async with self.lock:
            now = time.time()
            # Remove old calls
            self.calls = [t for t in self.calls if now - t < self.period]

            if len(self.calls) >= self.max_calls:
                sleep_time = self.period - (now - self.calls[0])
                if sleep_time > 0:
                    logger.debug(f"Rate limit reached, sleeping for {sleep_time:.2f}s")
                    await asyncio.sleep(sleep_time)
                    self.calls = []

            self.calls.append(now)

