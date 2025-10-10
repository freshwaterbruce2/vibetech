"""
RFC3339 Timestamp Utilities for Kraken WebSocket V2 API
Handles timestamp parsing, normalization, and conversion
"""

import time
from datetime import datetime, timezone
from typing import Optional, Union


class TimestampUtils:
    """Utilities for handling RFC3339 timestamps"""

    @staticmethod
    def now_rfc3339() -> str:
        """Get current timestamp in RFC3339 format"""
        return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

    @staticmethod
    def parse_rfc3339(timestamp_str: str) -> datetime:
        """
        Parse RFC3339 timestamp to datetime object
        
        Args:
            timestamp_str: RFC3339 formatted timestamp (e.g., "2025-10-08T12:34:56.789Z")
            
        Returns:
            datetime object with UTC timezone
        """
        if not timestamp_str:
            raise ValueError("Empty timestamp string")
        
        # Handle Z suffix
        if timestamp_str.endswith('Z'):
            timestamp_str = timestamp_str[:-1] + '+00:00'
        
        return datetime.fromisoformat(timestamp_str)

    @staticmethod
    def to_unix(timestamp_str: str) -> float:
        """Convert RFC3339 timestamp to Unix timestamp"""
        dt = TimestampUtils.parse_rfc3339(timestamp_str)
        return dt.timestamp()

    @staticmethod
    def from_unix(unix_timestamp: float) -> str:
        """Convert Unix timestamp to RFC3339 format"""
        dt = datetime.fromtimestamp(unix_timestamp, tz=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')


def normalize(timestamp: Optional[Union[str, float, int]]) -> Optional[str]:
    """
    Normalize timestamp to RFC3339 format
    
    Args:
        timestamp: Timestamp in various formats (RFC3339, Unix, or None)
        
    Returns:
        RFC3339 formatted timestamp string or None
    """
    if timestamp is None:
        return None
    
    if isinstance(timestamp, str):
        # Already RFC3339, validate and return
        try:
            TimestampUtils.parse_rfc3339(timestamp)
            return timestamp
        except:
            return None
    
    if isinstance(timestamp, (int, float)):
        # Unix timestamp
        return TimestampUtils.from_unix(float(timestamp))
    
    return None
