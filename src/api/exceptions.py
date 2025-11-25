"""
Kraken API Exception Classes

Comprehensive error handling for all API operations.
"""

from typing import Optional, Dict, Any


class KrakenAPIError(Exception):
    """Base exception for all Kraken API errors."""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        response_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.response_data = response_data or {}


class RateLimitError(KrakenAPIError):
    """Raised when rate limit is exceeded."""

    def __init__(
        self,
        message: str,
        retry_after: Optional[int] = None,
        penalty_points: Optional[int] = None
    ):
        super().__init__(message)
        self.retry_after = retry_after
        self.penalty_points = penalty_points


class AuthenticationError(KrakenAPIError):
    """Raised when authentication fails."""
    pass


class InsufficientFundsError(KrakenAPIError):
    """Raised when account has insufficient funds for operation."""

    def __init__(
        self,
        message: str,
        required_amount: Optional[float] = None,
        available_amount: Optional[float] = None,
        asset: Optional[str] = None
    ):
        super().__init__(message)
        self.required_amount = required_amount
        self.available_amount = available_amount
        self.asset = asset


class InvalidOrderError(KrakenAPIError):
    """Raised when order parameters are invalid."""

    def __init__(
        self,
        message: str,
        order_params: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.order_params = order_params or {}


class CircuitBreakerError(KrakenAPIError):
    """Raised when circuit breaker is open."""

    def __init__(
        self,
        message: str,
        reset_time: Optional[float] = None,
        failure_count: Optional[int] = None
    ):
        super().__init__(message)
        self.reset_time = reset_time
        self.failure_count = failure_count


class ValidationError(KrakenAPIError):
    """Raised when response validation fails."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Any = None
    ):
        super().__init__(message)
        self.field = field
        self.value = value


class NetworkError(KrakenAPIError):
    """Raised when network-related errors occur."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(message)
        self.status_code = status_code
        self.headers = headers or {}


class TimeoutError(KrakenAPIError):
    """Raised when request times out."""

    def __init__(
        self,
        message: str,
        timeout_seconds: Optional[float] = None
    ):
        super().__init__(message)
        self.timeout_seconds = timeout_seconds


# Error code mapping for Kraken API errors
ERROR_CODE_MAP = {
    "EAPI:Invalid key": AuthenticationError,
    "EAPI:Invalid signature": AuthenticationError,
    "EAPI:Invalid nonce": AuthenticationError,
    "EAPI:Rate limit exceeded": RateLimitError,
    "EFunding:Insufficient funds": InsufficientFundsError,
    "EOrder:Invalid order": InvalidOrderError,
    "EOrder:Rate limit exceeded": RateLimitError,
    "EGeneral:Permission denied": AuthenticationError,
}


def parse_kraken_error(error_message: str, response_data: Dict[str, Any]) -> KrakenAPIError:
    """
    Parse Kraken API error and return appropriate exception.

    Args:
        error_message: Error message from API
        response_data: Full response data from API

    Returns:
        Appropriate KrakenAPIError subclass
    """
    # Check if error matches known error codes
    for error_code, exception_class in ERROR_CODE_MAP.items():
        if error_code in error_message:
            if exception_class == RateLimitError:
                # Extract retry information if available
                retry_after = response_data.get("retry_after")
                penalty_points = response_data.get("penalty_points")
                return RateLimitError(
                    error_message,
                    retry_after=retry_after,
                    penalty_points=penalty_points
                )
            elif exception_class == InsufficientFundsError:
                # Extract fund information if available
                return InsufficientFundsError(error_message)
            else:
                return exception_class(error_message, response_data=response_data)

    # Default to base exception
    return KrakenAPIError(error_message, response_data=response_data)