"""
Coverage gap tests for kraken_client.py
Specifically targeting uncovered lines: 69, 129-130
"""

import pytest
import base64
from unittest.mock import Mock, patch, MagicMock
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from kraken_client import KrakenClient
from config import Config
from errors_simple import APIError


class TestCredentialValidation:
    """Test lines 64-69: API credential validation warning"""

    @pytest.fixture
    def mock_config(self):
        """Create mock configuration with valid credentials"""
        config = Mock(spec=Config)
        config.kraken_api_key = 'test_api_key_12345'
        config.kraken_api_secret = 'dGVzdF9zZWNyZXQ='  # Valid base64
        config.kraken_api_key_2 = ''
        config.kraken_api_secret_2 = ''
        config.nonce_window = 10000
        return config

    @patch('kraken_client.PREVENTION_AVAILABLE', True)
    @patch('kraken_client.CryptoConnectionValidator')
    def test_logs_warning_when_credentials_invalid(self, mock_validator, mock_config, caplog):
        """
        Test line 69: Logs warning when API credentials fail validation
        This covers the uncovered line 69 in kraken_client.py
        """
        # Mock validator to return invalid credentials
        mock_validator.validate_api_credentials.return_value = (False, "Invalid API key format")

        # Create client (should log warning on line 69)
        with caplog.at_level('WARNING'):
            client = KrakenClient(mock_config)

        # Verify warning was logged (line 69 executed)
        assert "API credential validation warning" in caplog.text
        assert "Invalid API key format" in caplog.text
        mock_validator.validate_api_credentials.assert_called_once_with(
            'test_api_key_12345',
            'dGVzdF9zZWNyZXQ='
        )

    @patch('kraken_client.PREVENTION_AVAILABLE', True)
    @patch('kraken_client.CryptoConnectionValidator')
    def test_no_warning_when_credentials_valid(self, mock_validator, mock_config, caplog):
        """Test that valid credentials don't trigger warning"""
        # Mock validator to return valid credentials
        mock_validator.validate_api_credentials.return_value = (True, "Valid credentials")

        with caplog.at_level('WARNING'):
            client = KrakenClient(mock_config)

        # Should not log warning
        assert "API credential validation warning" not in caplog.text

    @patch('kraken_client.PREVENTION_AVAILABLE', False)
    def test_skips_validation_when_prevention_unavailable(self, mock_config, caplog):
        """Test that validation is skipped when PREVENTION_AVAILABLE=False"""
        with caplog.at_level('WARNING'):
            client = KrakenClient(mock_config)

        # Should not attempt validation or log warnings
        assert "API credential validation warning" not in caplog.text


class TestBase64DecodingError:
    """Test lines 127-133: Base64 decoding error handling in _sign_request"""

    @pytest.fixture
    def mock_config_invalid_secret(self):
        """Create config with invalid base64 secret"""
        config = Mock(spec=Config)
        config.kraken_api_key = 'test_key'
        # Invalid base64 string - will trigger exception on line 129
        config.kraken_api_secret = 'not-valid-base64!!!'
        config.kraken_api_key_2 = ''
        config.kraken_api_secret_2 = ''
        config.nonce_window = 10000
        return config

    @patch('kraken_client.PREVENTION_AVAILABLE', False)
    def test_raises_api_error_on_invalid_base64_secret(self, mock_config_invalid_secret):
        """
        Test lines 129-133: Raises APIError when API secret is not valid base64
        This covers the uncovered exception handler in _sign_request
        """
        client = KrakenClient(mock_config_invalid_secret)

        # Attempt to sign a request with invalid base64 secret
        with pytest.raises(APIError) as excinfo:
            client._sign_request(
                urlpath="/0/private/AddOrder",
                data={'nonce': '1234567890', 'pair': 'XLM/USD'}
            )

        # Verify error message (lines 130-132)
        error_msg = str(excinfo.value)
        assert "Invalid API secret format" in error_msg
        assert "must be base64-encoded" in error_msg
        assert "Check KRAKEN_API_SECRET" in error_msg
        assert ".env file" in error_msg

    @patch('kraken_client.PREVENTION_AVAILABLE', False)
    def test_base64_error_includes_underlying_exception(self, mock_config_invalid_secret):
        """Test that base64 decode error includes the underlying exception details"""
        client = KrakenClient(mock_config_invalid_secret)

        with pytest.raises(APIError) as excinfo:
            client._sign_request(
                urlpath="/0/private/Balance",
                data={'nonce': '9876543210'}
            )

        # Error message should include underlying exception (line 132)
        error_msg = str(excinfo.value)
        assert "Error:" in error_msg  # Includes the underlying exception


    @patch('kraken_client.PREVENTION_AVAILABLE', False)
    def test_valid_base64_secret_works(self):
        """Test that valid base64 secret doesn't raise error"""
        config = Mock(spec=Config)
        config.kraken_api_key = 'test_key'
        config.kraken_api_secret = 'VmFsaWRCYXNlNjRTdHJpbmc='  # Valid base64
        config.kraken_api_key_2 = ''
        config.kraken_api_secret_2 = ''
        config.nonce_window = 10000

        client = KrakenClient(config)

        # Should not raise exception
        signature = client._sign_request(
            urlpath="/0/private/Balance",
            data={'nonce': '3333333333'}
        )

        # Should return a base64-encoded signature
        assert isinstance(signature, str)
        assert len(signature) > 0
        # Verify it's valid base64
        base64.b64decode(signature)  # Should not raise


class TestSecondaryKeyValidation:
    """Test line 55-57: Secondary API key initialization"""

    @patch('kraken_client.PREVENTION_AVAILABLE', True)
    @patch('kraken_client.CryptoConnectionValidator')
    def test_secondary_key_initialization(self, mock_validator, caplog):
        """Test that secondary API key uses separate nonce file"""
        config = Mock(spec=Config)
        config.kraken_api_key = 'primary_key'
        config.kraken_api_secret = 'cHJpbWFyeV9zZWNyZXQ='
        config.kraken_api_key_2 = 'secondary_key'
        config.kraken_api_secret_2 = 'c2Vjb25kYXJ5X3NlY3JldA=='
        config.nonce_window = 10000

        mock_validator.validate_api_credentials.return_value = (True, "Valid")

        # Test with secondary key
        client = KrakenClient(config, use_secondary_key=True)

        assert client.api_key == 'secondary_key'
        assert client.api_secret == 'c2Vjb25kYXJ5X3NlY3JldA=='
        assert client.key_label == 'secondary'
        assert 'secondary' in str(client.nonce_manager.storage_path)
