"""
Unit tests for unified error handling system
Tests error classification, categorization, and retry logic
"""

import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from errors_simple import (
    TradingError, APIError, WebSocketError, OrderError,
    log_error, is_retryable
)


class TestTradingError:
    """Test base TradingError functionality"""

    def test_trading_error_creation(self):
        """Test creating a TradingError with all parameters"""
        error = TradingError(
            message="Test error",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.NETWORK,
            retry_able=True,
            context={"key": "value"}
        )

        assert error.message == "Test error"
        assert error.severity == ErrorSeverity.HIGH
        assert error.category == ErrorCategory.NETWORK
        assert error.retry_able is True
        assert error.context == {"key": "value"}
        assert error.timestamp is not None

    def test_trading_error_to_dict(self):
        """Test converting TradingError to dictionary"""
        error = TradingError(
            message="Test error",
            severity=ErrorSeverity.LOW,
            category=ErrorCategory.VALIDATION
        )

        error_dict = error.to_dict()
        assert error_dict["message"] == "Test error"
        assert error_dict["severity"] == "low"
        assert error_dict["category"] == "validation"
        assert error_dict["retry_able"] is False
        assert "timestamp" in error_dict


class TestAPIError:
    """Test API error classification"""

    def test_api_error_authentication(self):
        """Test authentication error classification"""
        error = APIError(
            message="Invalid API key",
            endpoint="/private/Balance",
            status_code=401
        )

        assert error.severity == ErrorSeverity.CRITICAL
        assert error.category == ErrorCategory.AUTHENTICATION
        assert error.retry_able is False

    def test_api_error_rate_limit(self):
        """Test rate limit error classification"""
        error = APIError(
            message="Rate limit exceeded",
            endpoint="/public/Ticker",
            status_code=429
        )

        assert error.severity == ErrorSeverity.MEDIUM
        assert error.category == ErrorCategory.RATE_LIMIT
        assert error.retry_able is True

    def test_api_error_network(self):
        """Test network error classification"""
        error = APIError(
            message="Connection timeout",
            endpoint="/public/SystemStatus",
            status_code=504
        )

        assert error.severity == ErrorSeverity.LOW
        assert error.category == ErrorCategory.NETWORK
        assert error.retry_able is True

    def test_api_error_validation(self):
        """Test validation error classification"""
        error = APIError(
            message="Invalid parameter",
            endpoint="/private/AddOrder",
            status_code=400
        )

        assert error.severity == ErrorSeverity.HIGH
        assert error.category == ErrorCategory.VALIDATION
        assert error.retry_able is False

    def test_api_error_nonce(self):
        """Test nonce error classification"""
        error = APIError(
            message="Invalid nonce",
            endpoint="/private/Balance"
        )

        assert error.severity == ErrorSeverity.LOW
        assert error.category == ErrorCategory.UNKNOWN
        assert error.retry_able is True


class TestWebSocketError:
    """Test WebSocket error handling"""

    def test_websocket_error_reconnectable(self):
        """Test reconnectable WebSocket error"""
        error = WebSocketError(
            message="Connection lost",
            channel="ticker",
            reconnect_able=True
        )

        assert error.severity == ErrorSeverity.MEDIUM
        assert error.category == ErrorCategory.WEBSOCKET
        assert error.retry_able is True

    def test_websocket_error_not_reconnectable(self):
        """Test non-reconnectable WebSocket error"""
        error = WebSocketError(
            message="Invalid subscription",
            channel="private",
            reconnect_able=False
        )

        assert error.severity == ErrorSeverity.HIGH
        assert error.category == ErrorCategory.WEBSOCKET
        assert error.retry_able is False


class TestOrderError:
    """Test order error handling"""

    def test_order_error_insufficient_funds(self):
        """Test insufficient funds error"""
        error = OrderError(
            message="Insufficient funds",
            order_id="123",
            pair="BTC/USD"
        )

        assert error.severity == ErrorSeverity.HIGH
        assert error.category == ErrorCategory.BUSINESS_LOGIC
        assert error.retry_able is False

    def test_order_error_market_closed(self):
        """Test market closed error"""
        error = OrderError(
            message="Market closed",
            pair="BTC/USD"
        )

        assert error.severity == ErrorSeverity.HIGH
        assert error.retry_able is False

    def test_order_error_temporary(self):
        """Test temporary order error"""
        error = OrderError(
            message="Temporary issue, please try again",
            order_id="456"
        )

        assert error.severity == ErrorSeverity.LOW
        assert error.retry_able is True


class TestDatabaseError:
    """Test database error handling"""

    def test_database_error(self):
        """Test database error creation"""
        error = DatabaseError(
            message="Connection lost",
            operation="INSERT",
            table="trades"
        )

        assert error.severity == ErrorSeverity.MEDIUM
        assert error.category == ErrorCategory.DATABASE
        assert error.retry_able is True
        assert error.context["operation"] == "INSERT"
        assert error.context["table"] == "trades"


class TestValidationError:
    """Test validation error handling"""

    def test_validation_error(self):
        """Test validation error creation"""
        error = ValidationError(
            message="Invalid volume",
            field="volume",
            value=-1
        )

        assert error.severity == ErrorSeverity.HIGH
        assert error.category == ErrorCategory.VALIDATION
        assert error.retry_able is False
        assert error.context["field"] == "volume"
        assert error.context["value"] == -1


class TestErrorHandling:
    """Test error handling utility functions"""

    def test_handle_error_trading_error(self):
        """Test handling an existing TradingError"""
        original = TradingError("Test", severity=ErrorSeverity.LOW)
        handled = handle_error(original, "test_operation")

        assert handled is original  # Should return the same object

    def test_handle_error_connection_error(self):
        """Test handling a ConnectionError"""
        original = ConnectionError("Network unreachable")
        handled = handle_error(original, "api_call")

        assert isinstance(handled, TradingError)
        assert handled.category == ErrorCategory.NETWORK
        assert handled.retry_able is True

    def test_handle_error_generic(self):
        """Test handling a generic exception"""
        original = Exception("Something went wrong")
        handled = handle_error(original, "unknown_operation")

        assert isinstance(handled, TradingError)
        assert handled.category == ErrorCategory.UNKNOWN

    def test_classify_by_message_auth(self):
        """Test message classification for auth errors"""
        error = classify_by_message("Authentication failed", "login")

        assert error.severity == ErrorSeverity.CRITICAL
        assert error.category == ErrorCategory.AUTHENTICATION
        assert error.retry_able is False

    def test_classify_by_message_rate_limit(self):
        """Test message classification for rate limit"""
        error = classify_by_message("Too many requests", "ticker")

        assert error.severity == ErrorSeverity.MEDIUM
        assert error.category == ErrorCategory.RATE_LIMIT
        assert error.retry_able is True

    def test_classify_by_message_network(self):
        """Test message classification for network errors"""
        error = classify_by_message("Connection timeout", "websocket")

        assert error.severity == ErrorSeverity.LOW
        assert error.category == ErrorCategory.NETWORK
        assert error.retry_able is True

    def test_classify_by_message_validation(self):
        """Test message classification for validation errors"""
        error = classify_by_message("Invalid parameter value", "order")

        assert isinstance(error, ValidationError)
        assert error.retry_able is False

    def test_classify_by_message_unknown(self):
        """Test message classification for unknown errors"""
        error = classify_by_message("Random error message", "test")

        assert error.severity == ErrorSeverity.MEDIUM
        assert error.category == ErrorCategory.UNKNOWN


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])