"""
API Validator - Prevent validation failures by checking API formats before use
Addresses validation_failure errors from learning insights (7 occurrences)
"""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import aiohttp
import asyncio
import socket
from datetime import datetime, timezone
import time

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of API validation"""
    is_valid: bool
    message: str
    details: Optional[Dict[str, Any]] = None


class KrakenAPIValidator:
    """
    Validates Kraken API endpoints and data formats before actual use
    
    Best Practices:
    1. Always verify API documentation before implementing endpoints
    2. Test endpoint format with a dry-run before production
    3. Log actual response formats for future reference
    """
    
    # Kraken WebSocket V2 Endpoints (verified as of 2024)
    WS_V2_PUBLIC = "wss://ws.kraken.com/v2"
    WS_V2_PRIVATE = "wss://ws-auth.kraken.com/v2"
    
    # REST API Base URLs
    REST_API_PUBLIC = "https://api.kraken.com/0/public"
    REST_API_PRIVATE = "https://api.kraken.com/0/private"
    
    # Valid WebSocket V2 Channels
    VALID_PUBLIC_CHANNELS = [
        "ticker", "ohlc", "book", "trade", "instrument", "status"
    ]
    
    VALID_PRIVATE_CHANNELS = [
        "executions", "balances", "level3"
    ]
    
    # Valid WebSocket V2 Methods
    VALID_WS_METHODS = [
        "subscribe", "unsubscribe", "ping", "pong",
        "add_order", "batch_add", "cancel_order", 
        "cancel_all", "amend_order", "edit_order"
    ]
    
    @staticmethod
    def validate_websocket_url(url: str, is_private: bool = False) -> ValidationResult:
        """
        Validate WebSocket URL format
        
        Common mistake: Using assumed URLs without verification
        Prevention: Always check against known good endpoints
        """
        expected_url = KrakenAPIValidator.WS_V2_PRIVATE if is_private else KrakenAPIValidator.WS_V2_PUBLIC
        
        if url != expected_url:
            return ValidationResult(
                is_valid=False,
                message=f"Invalid WebSocket URL. Expected: {expected_url}, Got: {url}",
                details={"expected": expected_url, "actual": url}
            )
        
        return ValidationResult(
            is_valid=True,
            message="WebSocket URL is valid"
        )
    
    @staticmethod
    def validate_subscription_message(message: Dict[str, Any], is_private: bool = False) -> ValidationResult:
        """
        Validate WebSocket subscription message format
        
        Correct format for Kraken WebSocket V2:
        {
            "method": "subscribe",
            "params": {
                "channel": "ticker",
                "symbol": ["BTC/USD"]
            }
        }
        
        Common mistakes:
        - Using "event" instead of "method" (that's V1)
        - Using "pair" instead of "symbol" (that's V1)
        - Calling methods like .subscribe_to_ticker() (doesn't exist)
        """
        # Check required fields
        if "method" not in message:
            return ValidationResult(
                is_valid=False,
                message="Missing 'method' field. Did you mean to use WebSocket V1 format with 'event'?",
                details={"message": message}
            )
        
        method = message.get("method")
        if method not in KrakenAPIValidator.VALID_WS_METHODS:
            return ValidationResult(
                is_valid=False,
                message=f"Invalid method '{method}'. Valid methods: {', '.join(KrakenAPIValidator.VALID_WS_METHODS)}",
                details={"method": method, "valid_methods": KrakenAPIValidator.VALID_WS_METHODS}
            )
        
        # Check params for subscribe/unsubscribe
        if method in ["subscribe", "unsubscribe"]:
            if "params" not in message:
                return ValidationResult(
                    is_valid=False,
                    message="Missing 'params' field for subscribe/unsubscribe",
                    details={"message": message}
                )
            
            params = message["params"]
            
            # Check channel
            if "channel" not in params:
                return ValidationResult(
                    is_valid=False,
                    message="Missing 'channel' in params",
                    details={"params": params}
                )
            
            channel = params["channel"]
            valid_channels = KrakenAPIValidator.VALID_PRIVATE_CHANNELS if is_private else KrakenAPIValidator.VALID_PUBLIC_CHANNELS
            
            if channel not in valid_channels:
                return ValidationResult(
                    is_valid=False,
                    message=f"Invalid channel '{channel}'. Valid channels: {', '.join(valid_channels)}",
                    details={"channel": channel, "valid_channels": valid_channels}
                )
            
            # Check symbol format (should be array for public channels)
            if not is_private and channel in ["ticker", "ohlc", "book", "trade"]:
                if "symbol" not in params:
                    return ValidationResult(
                        is_valid=False,
                        message="Missing 'symbol' in params. Use 'symbol' not 'pair' for WebSocket V2",
                        details={"params": params}
                    )
                
                if not isinstance(params["symbol"], list):
                    return ValidationResult(
                        is_valid=False,
                        message="Symbol must be an array, e.g., ['BTC/USD']",
                        details={"symbol": params["symbol"]}
                    )
        
        return ValidationResult(
            is_valid=True,
            message="Subscription message is valid"
        )
    
    @staticmethod
    def validate_trading_pair(pair: str) -> ValidationResult:
        """
        Validate trading pair format for WebSocket V2
        
        Correct format: "BTC/USD", "XLM/USD", "ETH/USD"
        Common mistakes:
        - Using "BTCUSD" without slash
        - Using "XBT/USD" instead of "BTC/USD" (API translates this)
        """
        if "/" not in pair:
            return ValidationResult(
                is_valid=False,
                message=f"Invalid pair format '{pair}'. Must include slash, e.g., 'BTC/USD'",
                details={"pair": pair}
            )
        
        # Check for common symbol issues
        if pair.startswith("XBT"):
            logger.warning(f"Pair '{pair}' uses XBT. WebSocket V2 prefers BTC/USD format")
        
        return ValidationResult(
            is_valid=True,
            message="Trading pair format is valid"
        )
    
    @staticmethod
    async def test_rest_endpoint(endpoint: str, timeout: float = 5.0) -> ValidationResult:
        """
        Test a REST API endpoint before using it in production
        
        Usage:
        result = await validator.test_rest_endpoint("Time")
        if result.is_valid:
            # Proceed with actual call
        """
        url = f"{KrakenAPIValidator.REST_API_PUBLIC}/{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with asyncio.timeout(timeout):
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            return ValidationResult(
                                is_valid=True,
                                message=f"Endpoint {endpoint} is reachable",
                                details={"status": 200, "sample_response": data}
                            )
                        else:
                            return ValidationResult(
                                is_valid=False,
                                message=f"Endpoint returned status {response.status}",
                                details={"status": response.status}
                            )
        except asyncio.TimeoutError:
            return ValidationResult(
                is_valid=False,
                message=f"Endpoint timeout after {timeout}s",
                details={"timeout": timeout}
            )
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                message=f"Endpoint test failed: {type(e).__name__}: {e}",
                details={"error": str(e)}
            )
    
    @staticmethod
    def validate_order_params(params: Dict[str, Any]) -> ValidationResult:
        """
        Validate order parameters before sending via WebSocket V2
        
        Required fields:
        - symbol: Trading pair (e.g., "BTC/USD")
        - side: "buy" or "sell"
        - order_type: "limit", "market", etc.
        - order_qty: Order quantity (float)
        """
        required_fields = ["symbol", "side", "order_type", "order_qty"]
        
        for field in required_fields:
            if field not in params:
                return ValidationResult(
                    is_valid=False,
                    message=f"Missing required field: {field}",
                    details={"params": params, "required_fields": required_fields}
                )
        
        # Validate side
        if params["side"] not in ["buy", "sell"]:
            return ValidationResult(
                is_valid=False,
                message=f"Invalid side '{params['side']}'. Must be 'buy' or 'sell'",
                details={"side": params["side"]}
            )
        
        # Validate order type
        valid_order_types = [
            "limit", "market", "stop-loss", "stop-loss-limit",
            "take-profit", "take-profit-limit", "trailing-stop", "trailing-stop-limit"
        ]
        if params["order_type"] not in valid_order_types:
            return ValidationResult(
                is_valid=False,
                message=f"Invalid order_type '{params['order_type']}'",
                details={"order_type": params["order_type"], "valid_types": valid_order_types}
            )
        
        # Validate quantity
        try:
            qty = float(params["order_qty"])
            if qty <= 0:
                return ValidationResult(
                    is_valid=False,
                    message="order_qty must be positive",
                    details={"order_qty": qty}
                )
        except (ValueError, TypeError):
            return ValidationResult(
                is_valid=False,
                message=f"order_qty must be a number, got {type(params['order_qty'])}",
                details={"order_qty": params["order_qty"]}
            )
        
        return ValidationResult(
            is_valid=True,
            message="Order parameters are valid"
        )


class PortValidator:
    """
    Validates port availability to prevent binding errors
    Addresses [WinError 10048] from learning insights
    """
    
    @staticmethod
    def is_port_available(port: int, host: str = '0.0.0.0') -> ValidationResult:
        """
        Check if a port is available for binding
        
        Args:
            port: Port number to check
            host: Host address to bind to
        
        Returns:
            ValidationResult with availability status
        """
        try:
            # Try to bind to the port
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind((host, port))
                return ValidationResult(
                    is_valid=True,
                    message=f"Port {port} is available",
                    details={"port": port, "host": host}
                )
        except OSError as e:
            # Port is in use
            return ValidationResult(
                is_valid=False,
                message=f"Port {port} is already in use: {e}",
                details={
                    "port": port,
                    "host": host,
                    "error": str(e),
                    "error_code": e.errno if hasattr(e, 'errno') else None
                }
            )
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                message=f"Failed to check port {port}: {type(e).__name__}: {e}",
                details={"port": port, "error": str(e)}
            )
    
    @staticmethod
    def find_alternative_port(start_port: int, max_attempts: int = 10) -> Optional[int]:
        """
        Find an available alternative port
        
        Args:
            start_port: Port to start searching from
            max_attempts: Maximum number of ports to try
        
        Returns:
            Available port number or None
        """
        for offset in range(max_attempts):
            port = start_port + offset
            result = PortValidator.is_port_available(port)
            if result.is_valid:
                return port
        return None


class RateLimitValidator:
    """
    Validates and tracks rate limits to prevent API errors
    """
    
    def __init__(self):
        self.request_timestamps: Dict[str, List[float]] = {}
        
        # Kraken rate limits (per tier)
        self.limits = {
            "public": {"requests": 15, "window": 1.0},  # 15 per second
            "private": {"requests": 1, "window": 1.0},  # Start conservatively
            "websocket_connection": {"requests": 150, "window": 600}  # 150 per 10 min
        }
    
    def can_make_request(self, category: str = "public") -> ValidationResult:
        """
        Check if we can make a request without hitting rate limits
        
        Args:
            category: "public", "private", or "websocket_connection"
        """
        if category not in self.limits:
            return ValidationResult(
                is_valid=False,
                message=f"Unknown rate limit category: {category}",
                details={"category": category}
            )
        
        limit_config = self.limits[category]
        now = time.time()
        
        # Initialize tracking for this category
        if category not in self.request_timestamps:
            self.request_timestamps[category] = []
        
        # Remove old timestamps outside the window
        window_start = now - limit_config["window"]
        self.request_timestamps[category] = [
            ts for ts in self.request_timestamps[category]
            if ts >= window_start
        ]
        
        # Check if we're under the limit
        current_count = len(self.request_timestamps[category])
        max_requests = limit_config["requests"]
        
        if current_count >= max_requests:
            # Calculate wait time
            oldest_request = min(self.request_timestamps[category])
            wait_time = limit_config["window"] - (now - oldest_request)
            
            return ValidationResult(
                is_valid=False,
                message=f"Rate limit reached for {category}",
                details={
                    "category": category,
                    "current_count": current_count,
                    "limit": max_requests,
                    "window_seconds": limit_config["window"],
                    "wait_time_seconds": wait_time
                }
            )
        
        return ValidationResult(
            is_valid=True,
            message=f"Can make {category} request",
            details={
                "category": category,
                "current_count": current_count,
                "limit": max_requests,
                "remaining": max_requests - current_count
            }
        )
    
    def record_request(self, category: str = "public"):
        """Record a request for rate limit tracking"""
        if category not in self.request_timestamps:
            self.request_timestamps[category] = []
        self.request_timestamps[category].append(time.time())


class EdgeCaseValidator:
    """
    Validates edge cases that often cause failures
    
    Common edge cases from learning insights:
    1. Empty responses
    2. Null/None values in unexpected places
    3. Out-of-order messages
    4. Rate limit edge cases
    """
    
    @staticmethod
    def validate_api_response(response: Optional[Dict[str, Any]]) -> ValidationResult:
        """
        Validate API response structure
        
        Edge cases:
        - None response
        - Empty dict
        - Missing expected fields
        """
        if response is None:
            return ValidationResult(
                is_valid=False,
                message="Response is None",
                details={"response": None}
            )
        
        if not isinstance(response, dict):
            return ValidationResult(
                is_valid=False,
                message=f"Response must be dict, got {type(response)}",
                details={"type": str(type(response))}
            )
        
        if not response:
            return ValidationResult(
                is_valid=False,
                message="Response is empty dict",
                details={"response": {}}
            )
        
        return ValidationResult(
            is_valid=True,
            message="Response structure is valid"
        )
    
    @staticmethod
    def validate_websocket_message_order(
        messages: List[Dict[str, Any]], 
        expected_sequence: List[str]
    ) -> ValidationResult:
        """
        Validate WebSocket message order
        
        Edge case: Out-of-order messages can cause state issues
        """
        if len(messages) != len(expected_sequence):
            return ValidationResult(
                is_valid=False,
                message=f"Expected {len(expected_sequence)} messages, got {len(messages)}",
                details={"expected": len(expected_sequence), "actual": len(messages)}
            )
        
        for i, (msg, expected_type) in enumerate(zip(messages, expected_sequence)):
            msg_type = msg.get("channel") or msg.get("method")
            if msg_type != expected_type:
                return ValidationResult(
                    is_valid=False,
                    message=f"Message {i}: Expected '{expected_type}', got '{msg_type}'",
                    details={"index": i, "expected": expected_type, "actual": msg_type}
                )
        
        return ValidationResult(
            is_valid=True,
            message="Message order is correct"
        )


# Quick validation utilities
def quick_validate_ws_subscribe(channel: str, symbol: str) -> bool:
    """Quick validation for WebSocket subscription"""
    message = {
        "method": "subscribe",
        "params": {
            "channel": channel,
            "symbol": [symbol]
        }
    }
    result = KrakenAPIValidator.validate_subscription_message(message)
    if not result.is_valid:
        logger.error(f"Validation failed: {result.message}")
        logger.error(f"Details: {result.details}")
    return result.is_valid


def quick_validate_order(symbol: str, side: str, order_type: str, quantity: float) -> bool:
    """Quick validation for order parameters"""
    params = {
        "symbol": symbol,
        "side": side,
        "order_type": order_type,
        "order_qty": quantity
    }
    result = KrakenAPIValidator.validate_order_params(params)
    if not result.is_valid:
        logger.error(f"Validation failed: {result.message}")
        logger.error(f"Details: {result.details}")
    return result.is_valid


if __name__ == "__main__":
    # Test validation functions
    logging.basicConfig(level=logging.INFO)
    
    print("=" * 60)
    print("API VALIDATOR TEST SUITE - ENHANCED")
    print("=" * 60)
    
    # Test WebSocket URL validation
    print("\n1. WebSocket URL Validation:")
    result = KrakenAPIValidator.validate_websocket_url("wss://ws.kraken.com/v2")
    print(f"   ✓ Valid URL: {result.is_valid} - {result.message}")
    
    result = KrakenAPIValidator.validate_websocket_url("wss://wrong-url.com")
    print(f"   ✗ Invalid URL: {result.is_valid} - {result.message}")
    
    # Test subscription message validation
    print("\n2. Subscription Message Validation:")
    
    # Correct format
    correct_msg = {
        "method": "subscribe",
        "params": {
            "channel": "ticker",
            "symbol": ["BTC/USD"]
        }
    }
    result = KrakenAPIValidator.validate_subscription_message(correct_msg)
    print(f"   ✓ Valid message: {result.is_valid} - {result.message}")
    
    # Wrong format (V1 style)
    wrong_msg = {
        "event": "subscribe",  # Should be "method"
        "pair": ["BTC/USD"]    # Should be "symbol" in params
    }
    result = KrakenAPIValidator.validate_subscription_message(wrong_msg)
    print(f"   ✗ Invalid message: {result.is_valid} - {result.message}")
    
    # Test trading pair validation
    print("\n3. Trading Pair Validation:")
    result = KrakenAPIValidator.validate_trading_pair("BTC/USD")
    print(f"   ✓ Valid pair: {result.is_valid} - {result.message}")
    
    result = KrakenAPIValidator.validate_trading_pair("BTCUSD")
    print(f"   ✗ Invalid pair: {result.is_valid} - {result.message}")
    
    # Test order parameters
    print("\n4. Order Parameters Validation:")
    valid_order = {
        "symbol": "XLM/USD",
        "side": "buy",
        "order_type": "limit",
        "order_qty": 10.5
    }
    result = KrakenAPIValidator.validate_order_params(valid_order)
    print(f"   ✓ Valid order: {result.is_valid} - {result.message}")
    
    invalid_order = {
        "symbol": "XLM/USD",
        "side": "wrong",  # Invalid
        "order_type": "limit",
        "order_qty": -5  # Invalid
    }
    result = KrakenAPIValidator.validate_order_params(invalid_order)
    print(f"   ✗ Invalid order: {result.is_valid} - {result.message}")
    
    # NEW: Test port availability (addresses WinError 10048)
    print("\n5. Port Availability Check:")
    result = PortValidator.is_port_available(8001)
    print(f"   Port 8001: {result.is_valid} - {result.message}")
    
    if not result.is_valid:
        alt_port = PortValidator.find_alternative_port(8001)
        if alt_port:
            print(f"   💡 Suggestion: Use alternative port {alt_port}")
    
    # NEW: Test rate limit validation
    print("\n6. Rate Limit Validation:")
    rate_limiter = RateLimitValidator()
    
    # Simulate multiple requests
    for i in range(3):
        result = rate_limiter.can_make_request("public")
        if result.is_valid:
            print(f"   ✓ Request {i+1}: {result.message}")
            rate_limiter.record_request("public")
        else:
            print(f"   ✗ Request {i+1}: {result.message}")
    
    print("\n" + "=" * 60)
    print("Enhanced tests complete!")
    print("=" * 60)
