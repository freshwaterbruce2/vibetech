"""
RFC3339 Timestamp Utilities for Kraken V2 API Compliance
Handles all timestamp parsing, generation, and formatting for production-grade reliability
"""

import time
from datetime import datetime, timezone, UTC
from typing import Union, Optional
import re
import logging

logger = logging.getLogger(__name__)

# RFC3339 regex pattern for validation
RFC3339_PATTERN = re.compile(
    r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)$'
)

class TimestampUtils:
    """
    Production-grade RFC3339 timestamp handling for Kraken V2 API

    Key Features:
    - RFC3339 compliant timestamp generation and parsing
    - Timezone-aware operations (always UTC for trading)
    - Kraken API format compatibility
    - Microsecond precision support
    - Robust error handling and validation
    """

    @staticmethod
    def now_rfc3339() -> str:
        """
        Generate current timestamp in RFC3339 format (UTC)
        Returns: "2025-09-28T12:34:56.123456Z"
        """
        return datetime.now(UTC).isoformat(timespec='microseconds')

    @staticmethod
    def now_unix() -> float:
        """Generate current Unix timestamp (for internal use)"""
        return time.time()

    @staticmethod
    def from_unix(unix_timestamp: Union[int, float, str]) -> str:
        """
        Convert Unix timestamp to RFC3339 format

        Args:
            unix_timestamp: Unix timestamp (seconds since epoch)

        Returns:
            RFC3339 formatted string in UTC

        Examples:
            from_unix(1727529296.123) -> "2025-09-28T12:34:56.123000Z"
        """
        try:
            if isinstance(unix_timestamp, str):
                unix_timestamp = float(unix_timestamp)

            dt = datetime.fromtimestamp(unix_timestamp, tz=UTC)
            return dt.isoformat(timespec='microseconds')

        except (ValueError, TypeError, OSError) as e:
            logger.error(f"Failed to convert Unix timestamp {unix_timestamp}: {e}")
            return TimestampUtils.now_rfc3339()  # Fallback to current time

    @staticmethod
    def to_unix(rfc3339_timestamp: str) -> float:
        """
        Convert RFC3339 timestamp to Unix timestamp

        Args:
            rfc3339_timestamp: RFC3339 formatted string

        Returns:
            Unix timestamp (float)

        Examples:
            to_unix("2025-09-28T12:34:56.123Z") -> 1727529296.123
        """
        try:
            # Validate format first
            if not TimestampUtils.is_valid_rfc3339(rfc3339_timestamp):
                raise ValueError(f"Invalid RFC3339 format: {rfc3339_timestamp}")

            # Parse using Python 3.11+ improved fromisoformat
            dt = datetime.fromisoformat(rfc3339_timestamp.replace('Z', '+00:00'))
            return dt.timestamp()

        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse RFC3339 timestamp {rfc3339_timestamp}: {e}")
            return TimestampUtils.now_unix()  # Fallback to current time

    @staticmethod
    def parse_kraken_timestamp(kraken_timestamp: Union[str, int, float]) -> str:
        """
        Parse timestamp from Kraken API response to RFC3339

        Kraken V2 API may return:
        - RFC3339 strings: "2025-09-28T12:34:56.123456Z"
        - Unix timestamps: 1727529296.123
        - Nanosecond timestamps: 1727529296123456789

        Args:
            kraken_timestamp: Timestamp in various Kraken formats

        Returns:
            Standardized RFC3339 string
        """
        try:
            if isinstance(kraken_timestamp, str):
                # Check if already RFC3339
                if TimestampUtils.is_valid_rfc3339(kraken_timestamp):
                    return kraken_timestamp

                # Try parsing as string Unix timestamp
                try:
                    unix_ts = float(kraken_timestamp)
                    return TimestampUtils.from_unix(unix_ts)
                except ValueError:
                    pass

            elif isinstance(kraken_timestamp, (int, float)):
                # Handle different precision levels
                ts = float(kraken_timestamp)

                # If timestamp is in nanoseconds (> year 2100 in seconds)
                if ts > 4000000000:  # Year 2100 threshold
                    # Convert nanoseconds to seconds
                    if ts > 1e18:  # Nanoseconds
                        ts = ts / 1e9
                    elif ts > 1e15:  # Microseconds
                        ts = ts / 1e6
                    elif ts > 1e12:  # Milliseconds
                        ts = ts / 1e3

                return TimestampUtils.from_unix(ts)

            logger.warning(f"Unknown timestamp format from Kraken: {kraken_timestamp}")
            return TimestampUtils.now_rfc3339()

        except Exception as e:
            logger.error(f"Failed to parse Kraken timestamp {kraken_timestamp}: {e}")
            return TimestampUtils.now_rfc3339()

    @staticmethod
    def is_valid_rfc3339(timestamp: str) -> bool:
        """
        Validate if string is valid RFC3339 format

        Args:
            timestamp: String to validate

        Returns:
            True if valid RFC3339 format
        """
        if not isinstance(timestamp, str):
            return False

        return bool(RFC3339_PATTERN.match(timestamp))

    @staticmethod
    def for_database() -> str:
        """
        Generate timestamp for database insertion (RFC3339 UTC)
        Optimized for SQLite storage
        """
        return TimestampUtils.now_rfc3339()

    @staticmethod
    def for_kraken_api() -> str:
        """
        Generate timestamp for Kraken API requests (RFC3339 UTC)
        Ensures compatibility with Kraken V2 API
        """
        return TimestampUtils.now_rfc3339()

    @staticmethod
    def format_for_display(timestamp: Union[str, float]) -> str:
        """
        Format timestamp for human-readable display

        Args:
            timestamp: RFC3339 string or Unix timestamp

        Returns:
            Human-readable format: "2025-09-28 12:34:56 UTC"
        """
        try:
            if isinstance(timestamp, str):
                if TimestampUtils.is_valid_rfc3339(timestamp):
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                else:
                    # Try parsing as Unix timestamp string
                    dt = datetime.fromtimestamp(float(timestamp), tz=UTC)
            else:
                dt = datetime.fromtimestamp(float(timestamp), tz=UTC)

            return dt.strftime('%Y-%m-%d %H:%M:%S UTC')

        except Exception as e:
            logger.error(f"Failed to format timestamp for display {timestamp}: {e}")
            return "Invalid Timestamp"

    @staticmethod
    def validate_and_normalize(timestamp: Union[str, int, float, None]) -> str:
        """
        Validate and normalize any timestamp to RFC3339 format

        This is the main function for ensuring all timestamps in the system
        are properly formatted for Kraken V2 API compliance

        Args:
            timestamp: Any timestamp format or None

        Returns:
            Valid RFC3339 timestamp string
        """
        if timestamp is None:
            return TimestampUtils.now_rfc3339()

        if isinstance(timestamp, str):
            if TimestampUtils.is_valid_rfc3339(timestamp):
                return timestamp
            else:
                # Try parsing as Kraken timestamp
                return TimestampUtils.parse_kraken_timestamp(timestamp)

        elif isinstance(timestamp, (int, float)):
            return TimestampUtils.from_unix(timestamp)

        else:
            logger.warning(f"Unknown timestamp type: {type(timestamp)}, value: {timestamp}")
            return TimestampUtils.now_rfc3339()

    @staticmethod
    def time_ago_seconds(rfc3339_timestamp: str) -> float:
        """
        Calculate how many seconds ago a timestamp was

        Args:
            rfc3339_timestamp: RFC3339 formatted timestamp

        Returns:
            Seconds elapsed since timestamp (positive number)
        """
        try:
            unix_ts = TimestampUtils.to_unix(rfc3339_timestamp)
            return time.time() - unix_ts
        except Exception:
            return 0.0

    @staticmethod
    def add_seconds(rfc3339_timestamp: str, seconds: float) -> str:
        """
        Add seconds to an RFC3339 timestamp

        Args:
            rfc3339_timestamp: Base timestamp
            seconds: Seconds to add (can be negative)

        Returns:
            New RFC3339 timestamp
        """
        try:
            unix_ts = TimestampUtils.to_unix(rfc3339_timestamp)
            new_unix_ts = unix_ts + seconds
            return TimestampUtils.from_unix(new_unix_ts)
        except Exception as e:
            logger.error(f"Failed to add seconds to timestamp: {e}")
            return rfc3339_timestamp


# Convenience functions for common operations
def now() -> str:
    """Quick access to current RFC3339 timestamp"""
    return TimestampUtils.now_rfc3339()

def parse_kraken(timestamp: Union[str, int, float]) -> str:
    """Quick access to Kraken timestamp parsing"""
    return TimestampUtils.parse_kraken_timestamp(timestamp)

def normalize(timestamp: Union[str, int, float, None]) -> str:
    """Quick access to timestamp normalization"""
    return TimestampUtils.validate_and_normalize(timestamp)

def display(timestamp: Union[str, float]) -> str:
    """Quick access to display formatting"""
    return TimestampUtils.format_for_display(timestamp)


# Test function for validation
def test_timestamp_utils():
    """Test all timestamp utility functions"""
    print("Testing RFC3339 Timestamp Utils...")

    # Test current time generation
    current = TimestampUtils.now_rfc3339()
    print(f"Current RFC3339: {current}")

    # Test Unix conversion
    unix_ts = TimestampUtils.to_unix(current)
    back_to_rfc = TimestampUtils.from_unix(unix_ts)
    print(f"Unix roundtrip: {current} -> {unix_ts} -> {back_to_rfc}")

    # Test Kraken timestamp parsing
    test_cases = [
        "2025-09-28T12:34:56.123456Z",  # RFC3339
        "1727529296.123",                # Unix string
        1727529296.123,                  # Unix float
        1727529296123456789,             # Nanoseconds
    ]

    for test_case in test_cases:
        parsed = TimestampUtils.parse_kraken_timestamp(test_case)
        print(f"Kraken parse: {test_case} -> {parsed}")

    # Test validation
    valid_tests = [
        "2025-09-28T12:34:56Z",
        "2025-09-28T12:34:56.123Z",
        "2025-09-28T12:34:56.123456Z",
        "2025-09-28T12:34:56+00:00",
        "invalid-timestamp"
    ]

    for test in valid_tests:
        is_valid = TimestampUtils.is_valid_rfc3339(test)
        print(f"Validation: {test} -> {is_valid}")

    print("RFC3339 Timestamp Utils tests complete!")


if __name__ == "__main__":
    test_timestamp_utils()