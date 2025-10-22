"""
Test API authentication and signature generation
Validates that base64 encoding/decoding works correctly
"""

import base64
import hashlib
import hmac
import urllib.parse
import pytest
from config import Config
from kraken_client import KrakenClient


def test_api_secret_is_valid_base64():
    """Verify API secret is valid base64-encoded string"""
    config = Config()

    # Test primary API secret
    assert config.kraken_api_secret, "KRAKEN_API_SECRET not configured"

    try:
        decoded = base64.b64decode(config.kraken_api_secret)
        assert len(decoded) > 0, "Decoded secret is empty"
    except Exception as e:
        pytest.fail(f"KRAKEN_API_SECRET is not valid base64: {e}")


def test_api_secret_no_whitespace():
    """Verify API secret has no leading/trailing whitespace"""
    config = Config()

    assert config.kraken_api_secret == config.kraken_api_secret.strip(), \
        "KRAKEN_API_SECRET has whitespace (should be stripped during load)"


def test_signature_generation():
    """Test that signature generation works without base64 padding errors"""
    config = Config()

    # Create test data similar to actual API request
    test_data = {
        'nonce': '1234567890000000000',
        'pair': 'XLM/USD',
        'type': 'buy',
        'ordertype': 'market',
        'volume': '10'
    }

    urlpath = "/0/private/AddOrder"

    # Test signature generation (same logic as kraken_client.py)
    try:
        postdata = urllib.parse.urlencode(test_data)
        encoded = (str(test_data['nonce']) + postdata).encode()
        message = urlpath.encode() + hashlib.sha256(encoded).digest()

        # This is where base64 padding errors would occur
        secret_bytes = base64.b64decode(config.kraken_api_secret.strip())

        signature = hmac.new(
            secret_bytes,
            message,
            hashlib.sha512
        )

        signature_b64 = base64.b64encode(signature.digest()).decode()

        # Verify signature is valid base64
        assert len(signature_b64) > 0, "Generated signature is empty"

        # Verify signature can be decoded
        base64.b64decode(signature_b64)

    except Exception as e:
        pytest.fail(f"Signature generation failed: {e}")


@pytest.mark.asyncio
async def test_kraken_client_initialization():
    """Test that KrakenClient initializes without errors"""
    config = Config()

    try:
        client = KrakenClient(config)
        assert client.api_key == config.kraken_api_key
        assert client.api_secret == config.kraken_api_secret

        # Test that _sign_request method exists and is callable
        assert hasattr(client, '_sign_request')

    except Exception as e:
        pytest.fail(f"KrakenClient initialization failed: {e}")


@pytest.mark.asyncio
async def test_kraken_client_sign_request():
    """Test KrakenClient._sign_request method directly"""
    config = Config()
    client = KrakenClient(config)

    test_data = {
        'nonce': '1234567890000000000',
        'pair': 'XLM/USD'
    }

    try:
        signature = client._sign_request("/0/private/Balance", test_data)

        # Verify signature is valid base64
        assert len(signature) > 0, "Signature is empty"
        base64.b64decode(signature)

    except Exception as e:
        pytest.fail(f"_sign_request method failed: {e}")


def test_config_validation_catches_invalid_base64():
    """Test that config validation catches invalid base64 secrets"""
    import os

    # Save original value
    original_secret = os.environ.get('KRAKEN_API_SECRET')

    try:
        # Set invalid base64 secret
        os.environ['KRAKEN_API_SECRET'] = 'invalid-base64-!@#$%'

        config = Config()

        # Validation should fail
        assert not config.validate(), "Config validation should fail with invalid base64"

    finally:
        # Restore original value
        if original_secret:
            os.environ['KRAKEN_API_SECRET'] = original_secret


if __name__ == '__main__':
    # Run tests directly
    print("Testing API authentication...")

    print("\n1. Testing API secret is valid base64...")
    test_api_secret_is_valid_base64()
    print("   [PASSED]")

    print("\n2. Testing API secret has no whitespace...")
    test_api_secret_no_whitespace()
    print("   [PASSED]")

    print("\n3. Testing signature generation...")
    test_signature_generation()
    print("   [PASSED]")

    print("\n4. Testing config validation catches invalid base64...")
    test_config_validation_catches_invalid_base64()
    print("   [PASSED]")

    print("\n[SUCCESS] All authentication tests passed!")
