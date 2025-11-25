"""
Configuration management for Kraken API Client
"""

import os
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from enum import Enum


class RateLimitTier(str, Enum):
    """Kraken API rate limit tiers."""
    STARTER = "starter"
    INTERMEDIATE = "intermediate"
    PRO = "pro"


@dataclass
class ClientConfig:
    """
    Configuration for Kraken REST API Client.

    Attributes:
        api_key: Kraken API key
        private_key: Kraken private key (base64 encoded)
        base_url: Base URL for Kraken API
        timeout: Request timeout in seconds
        max_retries: Maximum number of retries for failed requests
        retry_delay: Base delay between retries (exponential backoff)
        rate_limit_tier: Rate limiting tier
        enable_rate_limiting: Enable rate limiting
        enable_circuit_breaker: Enable circuit breaker
        circuit_breaker_threshold: Number of failures before opening circuit
        circuit_breaker_timeout: Time in seconds before attempting reset
        enable_metrics: Enable performance metrics collection
        session_pool_size: Size of connection pool
        verify_ssl: Verify SSL certificates
        proxy: Proxy URL if needed
    """

    # Authentication
    api_key: Optional[str] = field(default_factory=lambda: os.getenv("KRAKEN_API_KEY"))
    private_key: Optional[str] = field(default_factory=lambda: os.getenv("KRAKEN_PRIVATE_KEY"))

    # API Settings
    base_url: str = field(default_factory=lambda: os.getenv("KRAKEN_API_URL", "https://api.kraken.com"))
    api_version: str = "0"

    # Request Settings
    timeout: float = 30.0
    max_retries: int = 3
    retry_delay: float = 1.0

    # Rate Limiting
    rate_limit_tier: RateLimitTier = RateLimitTier.STARTER
    enable_rate_limiting: bool = True
    rate_limit_buffer: float = 0.1  # 10% buffer on rate limits

    # Circuit Breaker
    enable_circuit_breaker: bool = True
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: float = 60.0
    circuit_breaker_half_open_requests: int = 3

    # Performance
    enable_metrics: bool = True
    metrics_export_interval: float = 60.0
    session_pool_size: int = 10

    # Security
    verify_ssl: bool = True
    proxy: Optional[str] = None

    # Logging
    log_requests: bool = False
    log_responses: bool = False
    log_sensitive_data: bool = False

    # Custom headers
    custom_headers: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        """Validate configuration after initialization."""
        self._validate_config()
        self._set_rate_limits()

    def _validate_config(self):
        """Validate configuration values."""
        if self.timeout <= 0:
            raise ValueError("Timeout must be positive")

        if self.max_retries < 0:
            raise ValueError("Max retries cannot be negative")

        if self.circuit_breaker_threshold <= 0:
            raise ValueError("Circuit breaker threshold must be positive")

        if self.session_pool_size <= 0:
            raise ValueError("Session pool size must be positive")

    def _set_rate_limits(self):
        """Set rate limit values based on tier."""
        # Kraken 2025 rate limits (requests per minute)
        tier_limits = {
            RateLimitTier.STARTER: {
                "public": 60,
                "private": 30,
                "trading": 15,
                "penalty_decay": 0.5  # Penalty points decay rate per second
            },
            RateLimitTier.INTERMEDIATE: {
                "public": 120,
                "private": 60,
                "trading": 30,
                "penalty_decay": 1.0
            },
            RateLimitTier.PRO: {
                "public": 300,
                "private": 180,
                "trading": 60,
                "penalty_decay": 2.0
            }
        }

        self.rate_limits = tier_limits[self.rate_limit_tier]

    def get_public_rate_limit(self) -> int:
        """Get rate limit for public endpoints."""
        limit = self.rate_limits["public"]
        if self.rate_limit_buffer:
            limit = int(limit * (1 - self.rate_limit_buffer))
        return limit

    def get_private_rate_limit(self) -> int:
        """Get rate limit for private endpoints."""
        limit = self.rate_limits["private"]
        if self.rate_limit_buffer:
            limit = int(limit * (1 - self.rate_limit_buffer))
        return limit

    def get_trading_rate_limit(self) -> int:
        """Get rate limit for trading endpoints."""
        limit = self.rate_limits["trading"]
        if self.rate_limit_buffer:
            limit = int(limit * (1 - self.rate_limit_buffer))
        return limit

    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return {
            "base_url": self.base_url,
            "api_version": self.api_version,
            "timeout": self.timeout,
            "max_retries": self.max_retries,
            "rate_limit_tier": self.rate_limit_tier.value,
            "enable_rate_limiting": self.enable_rate_limiting,
            "enable_circuit_breaker": self.enable_circuit_breaker,
            "enable_metrics": self.enable_metrics,
            "verify_ssl": self.verify_ssl,
        }

    @classmethod
    def from_env(cls) -> "ClientConfig":
        """Create config from environment variables."""
        return cls(
            api_key=os.getenv("KRAKEN_API_KEY"),
            private_key=os.getenv("KRAKEN_PRIVATE_KEY"),
            base_url=os.getenv("KRAKEN_API_URL", "https://api.kraken.com"),
            timeout=float(os.getenv("KRAKEN_TIMEOUT", "30")),
            max_retries=int(os.getenv("KRAKEN_MAX_RETRIES", "3")),
            rate_limit_tier=RateLimitTier(
                os.getenv("KRAKEN_RATE_LIMIT_TIER", "starter")
            ),
            enable_rate_limiting=os.getenv("KRAKEN_ENABLE_RATE_LIMIT", "true").lower() == "true",
            enable_circuit_breaker=os.getenv("KRAKEN_ENABLE_CIRCUIT_BREAKER", "true").lower() == "true",
            enable_metrics=os.getenv("KRAKEN_ENABLE_METRICS", "true").lower() == "true",
            verify_ssl=os.getenv("KRAKEN_VERIFY_SSL", "true").lower() == "true",
            proxy=os.getenv("KRAKEN_PROXY"),
        )


# Default configuration instance
default_config = ClientConfig()