"""
Simple Error Handling for Trading System
Just the essentials - no over-engineering
"""

import logging
from enum import Enum

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels for classification"""
    CRITICAL = "critical"  # Authentication, invalid keys, insufficient funds
    ERROR = "error"        # General API errors that stop operations
    WARNING = "warning"    # Rate limits, temporary issues - retryable
    INFO = "info"          # Informational messages


class TradingError(Exception):
    """Base exception for trading errors"""
    pass


class APIError(TradingError):
    """API call failures"""
    pass


class KrakenAPIError(APIError):
    """Kraken-specific API error with severity classification"""
    
    def __init__(self, error_message, endpoint=None, status_code=None, request_data=None):
        super().__init__(error_message)
        self.error_message = error_message
        self.endpoint = endpoint
        self.status_code = status_code
        # Don't log sensitive data
        self.request_data = request_data if not endpoint or 'private' not in endpoint else None
        
        # Classify severity and retryability
        self.severity = self._classify_severity(error_message)
        self.retry_able = is_retryable(Exception(error_message))
    
    def _classify_severity(self, msg: str) -> ErrorSeverity:
        """Classify error severity based on message"""
        msg_lower = str(msg).lower()

        # Critical errors - stop trading immediately
        if any(x in msg_lower for x in ['authentication', 'unauthorized', 'api key', 'invalid key']):
            return ErrorSeverity.CRITICAL
        if any(x in msg_lower for x in ['insufficient funds', 'balance']):
            return ErrorSeverity.CRITICAL

        # Warnings - retryable issues
        if any(x in msg_lower for x in ['rate limit', 'too many', 'timeout']):
            return ErrorSeverity.WARNING

        # Default to ERROR
        return ErrorSeverity.ERROR

    def is_rate_limit_error(self) -> bool:
        """Check if error is rate limit related"""
        msg_lower = str(self.error_message).lower()
        return any(x in msg_lower for x in ['rate limit', 'too many'])

    def is_nonce_error(self) -> bool:
        """Check if error is nonce related"""
        msg_lower = str(self.error_message).lower()
        return 'nonce' in msg_lower

    def is_permission_error(self) -> bool:
        """Check if error is permission related"""
        msg_lower = str(self.error_message).lower()
        return any(x in msg_lower for x in ['permission', 'unauthorized', 'forbidden'])


class WebSocketError(TradingError):
    """WebSocket connection issues"""
    pass


class OrderError(TradingError):
    """Order placement/execution issues"""
    pass


def is_retryable(error: Exception) -> bool:
    """
    Check if error is worth retrying
    
    Retryable:
    - Network timeouts
    - Rate limits
    - Temporary API issues
    
    Not retryable:
    - Auth failures
    - Invalid parameters
    - Insufficient funds
    """
    msg = str(error).lower()
    
    # Don't retry these
    if any(x in msg for x in [
        'authentication', 'unauthorized', 'invalid api key',
        'insufficient funds', 'invalid pair', 'validation'
    ]):
        return False
    
    # Do retry these
    if any(x in msg for x in [
        'timeout', 'rate limit', 'connection', 'temporary',
        'try again', 'network', '429', '502', '503', '504'
    ]):
        return True
    
    # Default: don't retry unless we know it's safe
    return False


def log_error(error: Exception, context: str = ""):
    """Simple error logging with context"""
    error_msg = f"{context}: {type(error).__name__} - {error}" if context else f"{type(error).__name__} - {error}"
    
    # Critical errors
    if any(x in str(error).lower() for x in ['authentication', 'insufficient funds']):
        logger.critical(error_msg)
    # Warnings
    elif any(x in str(error).lower() for x in ['rate limit', 'timeout']):
        logger.warning(error_msg)
    # Regular errors
    else:
        logger.error(error_msg)
