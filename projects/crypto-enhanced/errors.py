"""
Comprehensive Error Handling System for Crypto Trading
Provides structured, actionable errors with context and recovery suggestions
"""

import logging
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels for classification and routing"""
    CRITICAL = "critical"  # System-stopping: auth failures, invalid keys, critical funds
    ERROR = "error"        # Operation-stopping: API errors, invalid orders, data issues
    WARNING = "warning"    # Recoverable: rate limits, temporary network issues
    INFO = "info"          # Informational: state changes, notifications


class ErrorCategory(Enum):
    """Error categorization for better debugging and metrics"""
    API = "api"                    # API communication failures
    AUTHENTICATION = "auth"        # Authentication/authorization issues
    NETWORK = "network"           # Network connectivity problems
    VALIDATION = "validation"     # Input validation failures
    ORDER = "order"               # Order placement/execution issues
    STRATEGY = "strategy"         # Strategy logic errors
    DATA = "data"                 # Data parsing/processing errors
    RISK = "risk"                 # Risk management constraint violations
    WEBSOCKET = "websocket"       # WebSocket connection issues
    STATE = "state"               # State management errors
    CONFIGURATION = "config"      # Configuration errors


class TradingError(Exception):
    """
    Base exception for all trading system errors

    Provides rich context for debugging and automated recovery
    """

    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        category: ErrorCategory = ErrorCategory.API,
        retryable: bool = False,
        context: Optional[Dict[str, Any]] = None,
        recovery_suggestion: Optional[str] = None
    ):
        super().__init__(message)
        self.message = message
        self.severity = severity
        self.category = category
        self.retryable = retryable
        self.context = context or {}
        self.recovery_suggestion = recovery_suggestion
        self.timestamp = datetime.now()

        # Log on creation
        self._log_error()

    def _log_error(self):
        """Log error with appropriate level based on severity"""
        log_msg = f"[{self.category.value.upper()}] {self.message}"

        if self.context:
            # Filter out sensitive data
            safe_context = {k: v for k, v in self.context.items()
                          if k not in ['api_key', 'api_secret', 'password', 'token']}
            if safe_context:
                log_msg += f" | Context: {safe_context}"

        if self.recovery_suggestion:
            log_msg += f" | Suggestion: {self.recovery_suggestion}"

        if self.severity == ErrorSeverity.CRITICAL:
            logger.critical(log_msg)
        elif self.severity == ErrorSeverity.ERROR:
            logger.error(log_msg)
        elif self.severity == ErrorSeverity.WARNING:
            logger.warning(log_msg)
        else:
            logger.info(log_msg)

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for serialization/metrics"""
        return {
            'message': self.message,
            'severity': self.severity.value,
            'category': self.category.value,
            'retryable': self.retryable,
            'context': self.context,
            'recovery_suggestion': self.recovery_suggestion,
            'timestamp': self.timestamp.isoformat(),
            'type': self.__class__.__name__
        }


# ============================================================================
# API & Network Errors
# ============================================================================

class APIError(TradingError):
    """General API communication error"""

    def __init__(self, message: str, endpoint: Optional[str] = None,
                 status_code: Optional[int] = None, **kwargs):
        context = kwargs.pop('context', {})
        context.update({
            'endpoint': endpoint,
            'status_code': status_code
        })

        # Auto-determine retryability from status code
        retryable = kwargs.pop('retryable', False)
        if status_code:
            retryable = status_code in [408, 429, 500, 502, 503, 504]

        # Use provided severity/category or defaults
        severity = kwargs.pop('severity', ErrorSeverity.ERROR)
        category = kwargs.pop('category', ErrorCategory.API)

        super().__init__(
            message=message,
            severity=severity,
            category=category,
            retryable=retryable,
            context=context,
            **kwargs
        )


class KrakenAPIError(APIError):
    """Kraken-specific API error with enhanced classification"""

    def __init__(self, error_message: str, endpoint: Optional[str] = None,
                 status_code: Optional[int] = None, request_data: Optional[Dict] = None):
        # Classify error
        severity, category, retryable, suggestion = self._classify_error(error_message)

        # Don't include sensitive request data
        safe_data = None
        if request_data and endpoint and 'private' not in endpoint:
            safe_data = request_data

        super().__init__(
            message=error_message,
            endpoint=endpoint,
            status_code=status_code,
            severity=severity,
            category=category,
            retryable=retryable,
            context={'request_data': safe_data} if safe_data else {},
            recovery_suggestion=suggestion
        )

    def _classify_error(self, msg: str):
        """Classify Kraken error and provide recovery suggestion"""
        msg_lower = str(msg).lower()

        # Critical authentication errors
        if any(x in msg_lower for x in ['api key', 'invalid key', 'authentication failed']):
            return (
                ErrorSeverity.CRITICAL,
                ErrorCategory.AUTHENTICATION,
                False,
                "Check API key configuration in .env file"
            )

        # Critical permission errors
        if 'permission denied' in msg_lower or 'unauthorized' in msg_lower:
            return (
                ErrorSeverity.CRITICAL,
                ErrorCategory.AUTHENTICATION,
                False,
                "Verify API key has required permissions (trading, data, etc.)"
            )

        # Critical funds errors
        if 'insufficient funds' in msg_lower:
            return (
                ErrorSeverity.CRITICAL,
                ErrorCategory.RISK,
                False,
                "Increase account balance or reduce position size"
            )

        # Nonce errors (retryable)
        if 'nonce' in msg_lower:
            return (
                ErrorSeverity.WARNING,
                ErrorCategory.API,
                True,
                "Nonce will auto-increment on retry"
            )

        # Rate limit errors (retryable with backoff)
        if any(x in msg_lower for x in ['rate limit', 'too many requests']):
            return (
                ErrorSeverity.WARNING,
                ErrorCategory.API,
                True,
                "Wait for rate limit reset (uses exponential backoff)"
            )

        # Network timeouts (retryable)
        if 'timeout' in msg_lower or 'timed out' in msg_lower:
            return (
                ErrorSeverity.WARNING,
                ErrorCategory.NETWORK,
                True,
                "Network issue - will retry automatically"
            )

        # Invalid order parameters (not retryable)
        if any(x in msg_lower for x in ['invalid pair', 'invalid volume', 'invalid price']):
            return (
                ErrorSeverity.ERROR,
                ErrorCategory.VALIDATION,
                False,
                "Check order parameters against Kraken API requirements"
            )

        # Default classification
        return (
            ErrorSeverity.ERROR,
            ErrorCategory.API,
            False,
            "Check Kraken API status and logs"
        )

    def is_rate_limit_error(self) -> bool:
        """Check if error is rate limit related"""
        return 'rate limit' in str(self.message).lower()

    def is_nonce_error(self) -> bool:
        """Check if error is nonce related"""
        return 'nonce' in str(self.message).lower()

    def is_permission_error(self) -> bool:
        """Check if error is permission related"""
        return self.category == ErrorCategory.AUTHENTICATION


class NetworkError(TradingError):
    """Network connectivity issues"""

    def __init__(self, message: str, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.NETWORK,
            retryable=True,
            recovery_suggestion="Check network connection and retry",
            **kwargs
        )


class RateLimitError(TradingError):
    """Rate limit exceeded"""

    def __init__(self, message: str, retry_after: Optional[int] = None, **kwargs):
        context = kwargs.pop('context', {})
        if retry_after:
            context['retry_after_seconds'] = retry_after

        super().__init__(
            message=message,
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.API,
            retryable=True,
            context=context,
            recovery_suggestion=f"Wait {retry_after}s before retry" if retry_after else "Use exponential backoff",
            **kwargs
        )


# ============================================================================
# Authentication & Authorization Errors
# ============================================================================

class AuthenticationError(TradingError):
    """Authentication failure"""

    def __init__(self, message: str, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            category=ErrorCategory.AUTHENTICATION,
            retryable=False,
            recovery_suggestion="Verify API credentials in .env file",
            **kwargs
        )


class PermissionError(TradingError):
    """Insufficient permissions"""

    def __init__(self, message: str, required_permission: Optional[str] = None, **kwargs):
        context = kwargs.pop('context', {})
        if required_permission:
            context['required_permission'] = required_permission

        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            category=ErrorCategory.AUTHENTICATION,
            retryable=False,
            context=context,
            recovery_suggestion=f"Enable '{required_permission}' permission for API key" if required_permission else "Check API key permissions",
            **kwargs
        )


# ============================================================================
# Order & Trading Errors
# ============================================================================

class OrderError(TradingError):
    """Order placement/execution error"""

    def __init__(self, message: str, order_data: Optional[Dict] = None, **kwargs):
        context = kwargs.pop('context', {})
        if order_data:
            # Include non-sensitive order data
            safe_order = {k: v for k, v in order_data.items()
                         if k in ['pair', 'type', 'ordertype', 'volume', 'price']}
            context['order'] = safe_order

        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.ORDER,
            context=context,
            **kwargs
        )


class OrderValidationError(OrderError):
    """Order failed validation checks"""

    def __init__(self, message: str, validation_failures: Optional[Dict] = None, **kwargs):
        context = kwargs.pop('context', {})
        if validation_failures:
            context['validation_failures'] = validation_failures

        super().__init__(
            message=message,
            retryable=False,
            context=context,
            recovery_suggestion="Fix order parameters and retry",
            **kwargs
        )


class InsufficientFundsError(OrderError):
    """Insufficient balance for order"""

    def __init__(self, message: str, required: Optional[float] = None,
                 available: Optional[float] = None, **kwargs):
        context = kwargs.pop('context', {})
        context.update({
            'required_usd': required,
            'available_usd': available
        })

        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            retryable=False,
            context=context,
            recovery_suggestion="Reduce position size or add funds",
            **kwargs
        )


# ============================================================================
# Risk Management Errors
# ============================================================================

class RiskLimitError(TradingError):
    """Risk limit exceeded"""

    def __init__(self, message: str, limit_type: str, current_value: float,
                 limit_value: float, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.RISK,
            retryable=False,
            context={
                'limit_type': limit_type,
                'current': current_value,
                'limit': limit_value
            },
            recovery_suggestion=f"Reduce exposure or increase {limit_type} limit",
            **kwargs
        )


class ExposureLimitError(RiskLimitError):
    """Total exposure limit exceeded"""

    def __init__(self, current_exposure: float, max_exposure: float, **kwargs):
        super().__init__(
            message=f"Exposure limit exceeded: ${current_exposure:.2f} > ${max_exposure:.2f}",
            limit_type="exposure",
            current_value=current_exposure,
            limit_value=max_exposure,
            **kwargs
        )


class PositionSizeLimitError(RiskLimitError):
    """Position size limit exceeded"""

    def __init__(self, position_size: float, max_size: float, **kwargs):
        super().__init__(
            message=f"Position size limit exceeded: ${position_size:.2f} > ${max_size:.2f}",
            limit_type="position_size",
            current_value=position_size,
            limit_value=max_size,
            **kwargs
        )


# ============================================================================
# WebSocket Errors
# ============================================================================

class WebSocketError(TradingError):
    """WebSocket connection/communication error"""

    def __init__(self, message: str, connection_type: Optional[str] = None, **kwargs):
        context = kwargs.pop('context', {})
        if connection_type:
            context['connection_type'] = connection_type

        # Add any remaining kwargs to context (like 'channel')
        context.update(kwargs)

        super().__init__(
            message=message,
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.WEBSOCKET,
            retryable=True,
            context=context,
            recovery_suggestion="WebSocket will auto-reconnect"
        )


class WebSocketAuthenticationError(WebSocketError):
    """WebSocket authentication failed"""

    def __init__(self, message: str, **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            retryable=False,
            recovery_suggestion="Refresh WebSocket token or check API credentials",
            **kwargs
        )


# ============================================================================
# Strategy & Data Errors
# ============================================================================

class StrategyError(TradingError):
    """Strategy execution error"""

    def __init__(self, message: str, strategy_name: Optional[str] = None, **kwargs):
        context = kwargs.pop('context', {})
        if strategy_name:
            context['strategy'] = strategy_name

        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.STRATEGY,
            context=context,
            **kwargs
        )


class DataError(TradingError):
    """Data parsing/processing error"""

    def __init__(self, message: str, data_source: Optional[str] = None, **kwargs):
        context = kwargs.pop('context', {})
        if data_source:
            context['source'] = data_source

        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.DATA,
            context=context,
            **kwargs
        )


class ValidationError(TradingError):
    """Input validation error"""

    def __init__(self, message: str, field: Optional[str] = None,
                 expected: Optional[str] = None, actual: Optional[str] = None, **kwargs):
        context = kwargs.pop('context', {})
        context.update({
            'field': field,
            'expected': expected,
            'actual': actual
        })

        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.VALIDATION,
            retryable=False,
            context=context,
            **kwargs
        )


# ============================================================================
# Configuration Errors
# ============================================================================

class ConfigurationError(TradingError):
    """Configuration error"""

    def __init__(self, message: str, config_key: Optional[str] = None, **kwargs):
        context = kwargs.pop('context', {})
        if config_key:
            context['config_key'] = config_key

        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            category=ErrorCategory.CONFIGURATION,
            retryable=False,
            context=context,
            recovery_suggestion=f"Fix configuration value for '{config_key}'" if config_key else "Check configuration",
            **kwargs
        )


# ============================================================================
# Utility Functions
# ============================================================================

def is_retryable(error: Exception) -> bool:
    """
    Determine if an error is worth retrying

    Returns:
        bool: True if error is retryable, False otherwise
    """
    # If it's our custom error, use its retryable flag
    if isinstance(error, TradingError):
        return error.retryable

    # Otherwise, check message patterns
    msg = str(error).lower()

    # Never retry these
    non_retryable = [
        'authentication', 'unauthorized', 'invalid api key', 'permission denied',
        'insufficient funds', 'invalid pair', 'validation', 'invalid volume',
        'invalid price', 'configuration'
    ]
    if any(pattern in msg for pattern in non_retryable):
        return False

    # Always retry these
    retryable = [
        'timeout', 'timed out', 'rate limit', 'too many requests',
        'connection', 'temporary', 'try again', 'network',
        '429', '500', '502', '503', '504', 'nonce'
    ]
    if any(pattern in msg for pattern in retryable):
        return True

    # Default: don't retry unless we're confident
    return False


def get_retry_delay(error: Exception, attempt: int, base_delay: float = 1.0,
                   max_delay: float = 60.0) -> float:
    """
    Calculate retry delay with exponential backoff

    Args:
        error: The error that occurred
        attempt: Retry attempt number (0-indexed)
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds

    Returns:
        float: Delay in seconds before retry
    """
    import random

    # Check if error specifies a retry-after
    if isinstance(error, RateLimitError) and 'retry_after_seconds' in error.context:
        return error.context['retry_after_seconds']

    # Exponential backoff with jitter
    delay = min(base_delay * (2 ** attempt), max_delay)
    jitter = random.uniform(-0.3 * delay, 0.3 * delay)
    return max(0.1, delay + jitter)


def log_error(error: Exception, context: str = ""):
    """
    Simple error logging with context (backward compatibility)

    Args:
        error: The error to log
        context: Additional context string
    """
    if isinstance(error, TradingError):
        # Already logged on creation
        return

    # Log non-TradingError exceptions
    error_msg = f"{context}: {type(error).__name__} - {error}" if context else f"{type(error).__name__} - {error}"

    msg_lower = str(error).lower()
    if any(x in msg_lower for x in ['authentication', 'insufficient funds']):
        logger.critical(error_msg)
    elif any(x in msg_lower for x in ['rate limit', 'timeout']):
        logger.warning(error_msg)
    else:
        logger.error(error_msg)


# Backward compatibility aliases
APIError.__name__ = 'APIError'
WebSocketError.__name__ = 'WebSocketError'
OrderError.__name__ = 'OrderError'
