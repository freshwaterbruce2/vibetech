"""
Rate limiting implementation for Kraken API

Implements Kraken 2025 rate limiting with penalty points.
"""

import asyncio
import time
from collections import deque
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional


class EndpointType(str, Enum):
    """API endpoint types for rate limiting."""
    PUBLIC = "public"
    PRIVATE = "private"
    TRADING = "trading"


@dataclass
class RateLimitStatus:
    """Rate limit status information."""
    endpoint_type: EndpointType
    remaining: int
    limit: int
    reset_at: float
    penalty_points: int
    is_limited: bool


class RateLimiter:
    """
    Rate limiter for Kraken API.

    Implements token bucket algorithm with penalty points.
    """

    def __init__(
        self,
        public_limit: int = 60,
        private_limit: int = 30,
        trading_limit: int = 15,
        penalty_decay_rate: float = 0.5,
        window_size: int = 60  # 1 minute window
    ):
        """
        Initialize rate limiter.

        Args:
            public_limit: Requests per minute for public endpoints
            private_limit: Requests per minute for private endpoints
            trading_limit: Requests per minute for trading endpoints
            penalty_decay_rate: Penalty points decay per second
            window_size: Time window in seconds
        """
        self.limits = {
            EndpointType.PUBLIC: public_limit,
            EndpointType.PRIVATE: private_limit,
            EndpointType.TRADING: trading_limit
        }

        self.window_size = window_size
        self.penalty_decay_rate = penalty_decay_rate

        # Request history for each endpoint type
        self.requests: Dict[EndpointType, deque] = {
            endpoint_type: deque()
            for endpoint_type in EndpointType
        }

        # Penalty points tracking
        self.penalty_points = 0
        self.last_penalty_update = time.time()

        # Lock for thread safety
        self._lock = asyncio.Lock()

    async def acquire(self, endpoint_type: EndpointType) -> bool:
        """
        Acquire permission to make a request.

        Args:
            endpoint_type: Type of endpoint being accessed

        Returns:
            True if request is allowed, False if rate limited
        """
        async with self._lock:
            self._update_penalty_points()
            self._clean_old_requests(endpoint_type)

            # Check if we're within limits
            current_requests = len(self.requests[endpoint_type])
            limit = self.limits[endpoint_type]

            # Apply penalty reduction if penalty points are high
            if self.penalty_points > 0:
                limit = int(limit * (1 - min(self.penalty_points / 100, 0.5)))

            if current_requests >= limit:
                # Add penalty points for hitting limit
                self.penalty_points += 1
                return False

            # Record this request
            self.requests[endpoint_type].append(time.time())
            return True

    async def wait_if_needed(self, endpoint_type: EndpointType) -> None:
        """
        Wait if rate limited.

        Args:
            endpoint_type: Type of endpoint being accessed
        """
        while not await self.acquire(endpoint_type):
            # Calculate wait time
            wait_time = self.get_wait_time(endpoint_type)
            await asyncio.sleep(wait_time)

    def get_wait_time(self, endpoint_type: EndpointType) -> float:
        """
        Calculate wait time until next request is allowed.

        Args:
            endpoint_type: Type of endpoint

        Returns:
            Wait time in seconds
        """
        if not self.requests[endpoint_type]:
            return 0

        # Get oldest request time
        oldest_request = self.requests[endpoint_type][0]
        time_since_oldest = time.time() - oldest_request

        # If oldest is outside window, no wait needed
        if time_since_oldest >= self.window_size:
            return 0

        # Calculate wait time
        return self.window_size - time_since_oldest + 0.1  # Add small buffer

    def get_status(self, endpoint_type: EndpointType) -> RateLimitStatus:
        """
        Get current rate limit status.

        Args:
            endpoint_type: Type of endpoint

        Returns:
            Rate limit status
        """
        self._update_penalty_points()
        self._clean_old_requests(endpoint_type)

        current_requests = len(self.requests[endpoint_type])
        limit = self.limits[endpoint_type]

        # Apply penalty reduction
        if self.penalty_points > 0:
            limit = int(limit * (1 - min(self.penalty_points / 100, 0.5)))

        remaining = max(0, limit - current_requests)
        reset_at = time.time() + self.window_size

        if self.requests[endpoint_type]:
            oldest = self.requests[endpoint_type][0]
            reset_at = oldest + self.window_size

        return RateLimitStatus(
            endpoint_type=endpoint_type,
            remaining=remaining,
            limit=limit,
            reset_at=reset_at,
            penalty_points=self.penalty_points,
            is_limited=remaining == 0
        )

    def _clean_old_requests(self, endpoint_type: EndpointType) -> None:
        """
        Remove requests older than the time window.

        Args:
            endpoint_type: Type of endpoint
        """
        current_time = time.time()
        cutoff_time = current_time - self.window_size

        # Remove old requests
        while (self.requests[endpoint_type] and
               self.requests[endpoint_type][0] < cutoff_time):
            self.requests[endpoint_type].popleft()

    def _update_penalty_points(self) -> None:
        """Update penalty points based on decay rate."""
        current_time = time.time()
        time_elapsed = current_time - self.last_penalty_update

        if time_elapsed > 0 and self.penalty_points > 0:
            # Decay penalty points
            decay = self.penalty_decay_rate * time_elapsed
            self.penalty_points = max(0, self.penalty_points - decay)
            self.last_penalty_update = current_time

    def reset(self) -> None:
        """Reset all rate limiting state."""
        for endpoint_type in EndpointType:
            self.requests[endpoint_type].clear()
        self.penalty_points = 0
        self.last_penalty_update = time.time()

    def add_penalty(self, points: int) -> None:
        """
        Add penalty points.

        Args:
            points: Number of penalty points to add
        """
        self.penalty_points += points


class MockRateLimiter(RateLimiter):
    """Mock rate limiter for testing."""

    def __init__(self):
        """Initialize mock rate limiter with unlimited rates."""
        super().__init__(
            public_limit=10000,
            private_limit=10000,
            trading_limit=10000
        )

    async def acquire(self, endpoint_type: EndpointType) -> bool:
        """Always allow requests in mock mode."""
        return True

    async def wait_if_needed(self, endpoint_type: EndpointType) -> None:
        """No waiting in mock mode."""
        pass