"""
Kraken REST API Client

Main client implementation for interacting with Kraken API.
"""

import asyncio
import json
from typing import Dict, Any, Optional, List
import aiohttp
from urllib.parse import urlencode

from .auth import KrakenAuth
from .config import ClientConfig
from .rate_limiter import RateLimiter, EndpointType
from .circuit_breaker import CircuitBreaker
from .exceptions import (
    KrakenAPIError,
    NetworkError,
    TimeoutError,
    parse_kraken_error
)
from .models import (
    ServerTime,
    SystemStatus,
    Ticker,
    Balance,
    Order,
    OrderResponse,
    APIResponse
)


class KrakenRestClient:
    """
    Asynchronous REST client for Kraken API.

    Provides methods for all public and private endpoints.
    """

    def __init__(
        self,
        config: Optional[ClientConfig] = None,
        api_key: Optional[str] = None,
        private_key: Optional[str] = None
    ):
        """
        Initialize Kraken client.

        Args:
            config: Client configuration
            api_key: API key (overrides config)
            private_key: Private key (overrides config)
        """
        self.config = config or ClientConfig()

        # Override keys if provided
        if api_key:
            self.config.api_key = api_key
        if private_key:
            self.config.private_key = private_key

        # Initialize components
        self.auth = None
        if self.config.api_key and self.config.private_key:
            self.auth = KrakenAuth(self.config.api_key, self.config.private_key)

        self.rate_limiter = RateLimiter(
            public_limit=self.config.get_public_rate_limit(),
            private_limit=self.config.get_private_rate_limit(),
            trading_limit=self.config.get_trading_rate_limit()
        ) if self.config.enable_rate_limiting else None

        self.circuit_breaker = CircuitBreaker(
            failure_threshold=self.config.circuit_breaker_threshold,
            recovery_timeout=self.config.circuit_breaker_timeout
        ) if self.config.enable_circuit_breaker else None

        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry."""
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def _ensure_session(self):
        """Ensure HTTP session exists."""
        if not self.session:
            connector = aiohttp.TCPConnector(
                limit=self.config.session_pool_size,
                ssl=self.config.verify_ssl
            )
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout
            )

    async def close(self):
        """Close HTTP session."""
        if self.session:
            await self.session.close()
            self.session = None

    async def _request(
        self,
        method: str,
        endpoint: str,
        endpoint_type: EndpointType,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        auth_required: bool = False
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Kraken API.

        Args:
            method: HTTP method
            endpoint: API endpoint
            endpoint_type: Type of endpoint for rate limiting
            params: Query parameters
            data: POST data
            auth_required: Whether authentication is required

        Returns:
            API response data
        """
        await self._ensure_session()

        # Apply rate limiting
        if self.rate_limiter:
            await self.rate_limiter.wait_if_needed(endpoint_type)

        # Build URL
        url = f"{self.config.base_url}/{self.config.api_version}/{endpoint}"

        # Prepare headers
        headers = dict(self.config.custom_headers)

        # Add authentication if required
        if auth_required:
            if not self.auth:
                from .exceptions import AuthenticationError
                raise AuthenticationError("API credentials not configured")

            url_path = f"/{self.config.api_version}/{endpoint}"
            auth_headers = self.auth.get_auth_headers(url_path, data)
            headers.update(auth_headers)

            # Add nonce to data
            if data is None:
                data = {}
            data = self.auth.prepare_request_data(data)

        # Execute with circuit breaker
        if self.circuit_breaker:
            return await self.circuit_breaker.call(
                self._execute_request,
                method, url, headers, params, data
            )
        else:
            return await self._execute_request(
                method, url, headers, params, data
            )

    async def _execute_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        params: Optional[Dict[str, Any]],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute HTTP request."""
        try:
            if method == "GET":
                async with self.session.get(
                    url, params=params, headers=headers
                ) as response:
                    return await self._handle_response(response)
            else:  # POST
                async with self.session.post(
                    url, data=urlencode(data) if data else None,
                    headers=headers
                ) as response:
                    return await self._handle_response(response)

        except asyncio.TimeoutError as e:
            raise TimeoutError(
                f"Request timed out after {self.config.timeout}s",
                timeout_seconds=self.config.timeout
            )
        except aiohttp.ClientError as e:
            raise NetworkError(f"Network error: {str(e)}")

    async def _handle_response(self, response: aiohttp.ClientResponse) -> Dict[str, Any]:
        """Handle API response."""
        text = await response.text()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            raise KrakenAPIError(f"Invalid JSON response: {text}")

        # Check for API errors
        if "error" in data and data["error"]:
            error_msg = ", ".join(data["error"])
            raise parse_kraken_error(error_msg, data)

        return data

    # Public endpoints
    async def get_server_time(self) -> ServerTime:
        """Get server time."""
        data = await self._request(
            "GET", "public/Time", EndpointType.PUBLIC
        )
        return ServerTime(**data["result"])

    async def get_system_status(self) -> SystemStatus:
        """Get system status."""
        data = await self._request(
            "GET", "public/SystemStatus", EndpointType.PUBLIC
        )
        return SystemStatus(**data["result"])

    async def get_ticker(self, pair: str) -> Ticker:
        """Get ticker information."""
        data = await self._request(
            "GET", "public/Ticker", EndpointType.PUBLIC,
            params={"pair": pair}
        )
        # Extract ticker for the pair
        ticker_data = data["result"][pair]
        return Ticker(**ticker_data)

    # Private endpoints
    async def get_balance(self) -> Dict[str, Balance]:
        """Get account balance."""
        data = await self._request(
            "POST", "private/Balance", EndpointType.PRIVATE,
            auth_required=True
        )

        balances = {}
        for currency, balance_str in data["result"].items():
            balances[currency] = Balance.from_api_response(currency, balance_str)
        return balances

    async def place_order(
        self,
        pair: str,
        type: str,
        ordertype: str,
        volume: float,
        price: Optional[float] = None,
        **kwargs
    ) -> OrderResponse:
        """Place a new order."""
        data = {
            "pair": pair,
            "type": type,
            "ordertype": ordertype,
            "volume": str(volume)
        }

        if price is not None:
            data["price"] = str(price)

        # Add any additional parameters
        data.update(kwargs)

        response = await self._request(
            "POST", "private/AddOrder", EndpointType.TRADING,
            data=data, auth_required=True
        )

        return OrderResponse(**response)

    async def cancel_order(self, txid: str) -> bool:
        """Cancel an order."""
        data = {"txid": txid}

        response = await self._request(
            "POST", "private/CancelOrder", EndpointType.TRADING,
            data=data, auth_required=True
        )

        return response.get("result", {}).get("count", 0) > 0

    def get_rate_limit_status(self, endpoint_type: EndpointType):
        """Get rate limit status."""
        if self.rate_limiter:
            return self.rate_limiter.get_status(endpoint_type)
        return None

    def is_circuit_open(self) -> bool:
        """Check if circuit breaker is open."""
        if self.circuit_breaker:
            return self.circuit_breaker.is_open()
        return False