#!/usr/bin/env python3
"""
Learning System Integration for Crypto Trading
Imports prevention and optimization utilities from learning system
"""

import sys
from pathlib import Path

# Add learning system to path
# Learning system is on D drive, not relative to project
learning_path = Path("D:/learning-system")
if not learning_path.exists():
    # Fallback: try relative path from monorepo root
    learning_path = Path(__file__).parent.parent.parent / "learning-system"

sys.path.insert(0, str(learning_path))

# Import prevention utilities
try:
    from error_prevention_utils import (
        ConnectionValidator,
        RetryWithValidation,
        InputValidator
    )
    PREVENTION_AVAILABLE = True
except ImportError:
    PREVENTION_AVAILABLE = False
    print("[WARNING] Error prevention utilities not available")

# Import auto-fix pattern
try:
    from auto_fix_pattern import AutoFixCycle, ProvenAutoFixPatterns
    AUTO_FIX_AVAILABLE = True
except ImportError:
    AUTO_FIX_AVAILABLE = False
    print("[WARNING] Auto-fix pattern not available")

# Import tool advisor
try:
    from tool_pattern_advisor import ToolPatternAdvisor, validate_tools
    TOOL_ADVISOR_AVAILABLE = True
except ImportError:
    TOOL_ADVISOR_AVAILABLE = False
    print("[WARNING] Tool pattern advisor not available")


# Crypto-specific validation wrappers
class CryptoConnectionValidator:
    """Crypto trading specific connection validation"""

    @staticmethod
    def validate_kraken_websocket(ws_obj):
        """
        Validate Kraken WebSocket object before use

        Prevents: 'KrakenWebSocketUnified' object has no attribute 'subscribe_to_ticker'
        (Actual error from learning data - 15 occurrences)
        """
        if not PREVENTION_AVAILABLE:
            return True, "Prevention utilities not available"

        # Check for required Kraken WebSocket methods
        required_methods = [
            'connect',
            'disconnect',
            'subscribe',
            'is_connected'
        ]

        return ConnectionValidator.validate_websocket_connection(
            ws_obj,
            required_methods
        )

    @staticmethod
    def safe_websocket_subscribe(ws_obj, channels):
        """
        Safely subscribe to WebSocket channels with validation

        Uses learning data to prevent common errors
        """
        if not PREVENTION_AVAILABLE:
            # Fallback to direct call if utils not available
            if hasattr(ws_obj, 'subscribe'):
                return ws_obj.subscribe(channels)
            return None

        # Validate before subscribe
        is_valid, msg = CryptoConnectionValidator.validate_kraken_websocket(ws_obj)
        if not is_valid:
            raise ValueError(f"WebSocket validation failed: {msg}")

        # Safe method call with retry
        success, result = ConnectionValidator.safe_method_call(
            ws_obj, 'subscribe', channels
        )

        if not success:
            raise RuntimeError(f"Subscribe failed: {result}")

        return result

    @staticmethod
    def validate_api_credentials(api_key, api_secret):
        """Validate API credentials format"""
        if not PREVENTION_AVAILABLE:
            return True, "Prevention utilities not available"

        # Use input validator
        creds = {
            'api_key': api_key,
            'api_secret': api_secret
        }

        required_fields = ['api_key', 'api_secret']
        is_valid, msg = InputValidator.validate_schema(creds, required_fields)

        if not is_valid:
            return False, msg

        # Check types
        type_spec = {
            'api_key': str,
            'api_secret': str
        }
        return InputValidator.validate_types(creds, type_spec)


# Export for easy imports
__all__ = [
    'PREVENTION_AVAILABLE',
    'AUTO_FIX_AVAILABLE',
    'TOOL_ADVISOR_AVAILABLE',
    'CryptoConnectionValidator',
    'ConnectionValidator',
    'RetryWithValidation',
    'InputValidator',
]

if __name__ == "__main__":
    print("Learning System Integration - Loaded")
    print(f"  Error Prevention: {'[YES]' if PREVENTION_AVAILABLE else '[NO]'}")
    print(f"  Auto-Fix Pattern: {'[YES]' if AUTO_FIX_AVAILABLE else '[NO]'}")
    print(f"  Tool Advisor: {'[YES]' if TOOL_ADVISOR_AVAILABLE else '[NO]'}")
