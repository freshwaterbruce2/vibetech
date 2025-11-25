"""
Authentication module for Kraken API

Handles API signature generation and nonce management.
"""

import base64
import hashlib
import hmac
import time
import urllib.parse
from typing import Dict, Any, Optional


class KrakenAuth:
    """
    Handle Kraken API authentication.

    Generates API signatures for private endpoint requests.
    """

    def __init__(self, api_key: str, private_key: str):
        """
        Initialize authentication handler.

        Args:
            api_key: Kraken API key
            private_key: Kraken private key (base64 encoded)
        """
        self.api_key = api_key
        self.private_key = base64.b64decode(private_key)
        self._last_nonce = 0

    def generate_nonce(self) -> str:
        """
        Generate unique nonce for request.

        Returns:
            Nonce string (timestamp in milliseconds)
        """
        # Use current time in milliseconds
        nonce = int(time.time() * 1000)

        # Ensure nonce is always increasing
        if nonce <= self._last_nonce:
            nonce = self._last_nonce + 1

        self._last_nonce = nonce
        return str(nonce)

    def generate_signature(
        self,
        url_path: str,
        nonce: str,
        post_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate API signature for request.

        Args:
            url_path: API endpoint path (e.g., "/0/private/Balance")
            nonce: Unique nonce for request
            post_data: POST data dictionary

        Returns:
            Base64 encoded signature
        """
        # Prepare POST data
        if post_data is None:
            post_data = {}

        post_data["nonce"] = nonce

        # URL encode the POST data
        encoded_post_data = urllib.parse.urlencode(post_data)

        # Create message for signing
        message = url_path.encode() + hashlib.sha256(
            (nonce + encoded_post_data).encode()
        ).digest()

        # Generate HMAC signature
        signature = hmac.new(
            self.private_key,
            message,
            hashlib.sha512
        )

        # Return base64 encoded signature
        return base64.b64encode(signature.digest()).decode()

    def get_auth_headers(
        self,
        url_path: str,
        post_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Generate authentication headers for request.

        Args:
            url_path: API endpoint path
            post_data: POST data dictionary

        Returns:
            Dictionary with API-Key and API-Sign headers
        """
        nonce = self.generate_nonce()
        signature = self.generate_signature(url_path, nonce, post_data)

        return {
            "API-Key": self.api_key,
            "API-Sign": signature
        }

    def prepare_request_data(
        self,
        post_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Prepare request data with nonce.

        Args:
            post_data: Original POST data

        Returns:
            POST data with nonce added
        """
        if post_data is None:
            post_data = {}

        post_data["nonce"] = self.generate_nonce()
        return post_data


class MockAuth(KrakenAuth):
    """Mock authentication for testing."""

    def __init__(self):
        """Initialize mock auth without real keys."""
        self.api_key = "mock_api_key"
        self.private_key = base64.b64encode(b"mock_private_key")
        self._last_nonce = 0

    def generate_signature(
        self,
        url_path: str,
        nonce: str,
        post_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate mock signature."""
        return "mock_signature_" + base64.b64encode(
            f"{url_path}:{nonce}".encode()
        ).decode()


def validate_credentials(api_key: str, private_key: str) -> bool:
    """
    Validate API credentials format.

    Args:
        api_key: API key to validate
        private_key: Private key to validate (base64 encoded)

    Returns:
        True if credentials appear valid
    """
    # Check API key format (should be alphanumeric)
    if not api_key or not api_key.replace("-", "").replace("_", "").isalnum():
        return False

    # Check private key is valid base64
    try:
        decoded = base64.b64decode(private_key)
        # Kraken private keys are typically 64 bytes
        if len(decoded) < 32:
            return False
    except Exception:
        return False

    return True