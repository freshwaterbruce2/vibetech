"""
Kraken REST API Client

A comprehensive async REST API client for Kraken with full integration support.
"""

from .client import KrakenRestClient
from .config import ClientConfig
from .exceptions import (
    KrakenAPIError,
    RateLimitError,
    AuthenticationError,
    InsufficientFundsError,
    InvalidOrderError,
    CircuitBreakerError
)
from .models import (
    Ticker,
    Balance,
    Order,
    Trade,
    AssetInfo,
    ServerTime,
    SystemStatus
)

__version__ = "1.0.0"
__author__ = "Kraken API Development"
__all__ = [
    "KrakenRestClient",
    "ClientConfig",
    "KrakenAPIError",
    "RateLimitError",
    "AuthenticationError",
    "InsufficientFundsError",
    "InvalidOrderError",
    "CircuitBreakerError",
    "Ticker",
    "Balance",
    "Order",
    "Trade",
    "AssetInfo",
    "ServerTime",
    "SystemStatus",
]