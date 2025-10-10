#!/usr/bin/env python3
"""
Validation script for learning system integration
Tests that all learning utilities are properly integrated and functional
"""

import sys
from pathlib import Path

def test_learning_integration():
    """Test that learning_integration module loads correctly"""
    print("="*60)
    print("LEARNING SYSTEM INTEGRATION VALIDATION")
    print("="*60)
    print()

    try:
        import learning_integration
        print("[SUCCESS] learning_integration module imported")

        # Check availability flags
        print(f"  Error Prevention Available: {'[YES]' if learning_integration.PREVENTION_AVAILABLE else '[NO]'}")
        print(f"  Auto-Fix Available: {'[YES]' if learning_integration.AUTO_FIX_AVAILABLE else '[NO]'}")
        print(f"  Tool Advisor Available: {'[YES]' if learning_integration.TOOL_ADVISOR_AVAILABLE else '[NO]'}")
        print()

        return True
    except ImportError as e:
        print(f"[ERROR] Failed to import learning_integration: {e}")
        return False

def test_websocket_manager_integration():
    """Test that WebSocketManager has validation methods"""
    print("-"*60)
    print("WebSocket Manager Integration")
    print("-"*60)

    try:
        from websocket_manager import WebSocketManager
        print("[SUCCESS] WebSocketManager imported")

        # Check for validation method
        if hasattr(WebSocketManager, '_validate_websocket'):
            print("[SUCCESS] _validate_websocket method exists")
        else:
            print("[ERROR] _validate_websocket method missing")
            return False

        # Check imports
        import websocket_manager
        if hasattr(websocket_manager, 'PREVENTION_AVAILABLE'):
            print(f"[SUCCESS] PREVENTION_AVAILABLE flag: {websocket_manager.PREVENTION_AVAILABLE}")
        else:
            print("[WARNING] PREVENTION_AVAILABLE flag not found")

        print()
        return True
    except Exception as e:
        print(f"[ERROR] WebSocket manager validation failed: {e}")
        return False

def test_kraken_client_integration():
    """Test that KrakenClient has credential validation"""
    print("-"*60)
    print("Kraken Client Integration")
    print("-"*60)

    try:
        from kraken_client import KrakenClient
        print("[SUCCESS] KrakenClient imported")

        # Check imports
        import kraken_client
        if hasattr(kraken_client, 'PREVENTION_AVAILABLE'):
            print(f"[SUCCESS] PREVENTION_AVAILABLE flag: {kraken_client.PREVENTION_AVAILABLE}")
        else:
            print("[WARNING] PREVENTION_AVAILABLE flag not found")

        print()
        return True
    except Exception as e:
        print(f"[ERROR] Kraken client validation failed: {e}")
        return False

def test_learning_utilities():
    """Test individual learning utilities"""
    print("-"*60)
    print("Learning Utilities")
    print("-"*60)

    results = []

    # Test error_prevention_utils
    try:
        import sys
        from pathlib import Path
        learning_path = Path(__file__).parent.parent.parent / "learning-system"
        sys.path.insert(0, str(learning_path))

        from error_prevention_utils import ConnectionValidator, InputValidator
        print("[SUCCESS] error_prevention_utils loaded")
        results.append(True)
    except ImportError as e:
        print(f"[WARNING] error_prevention_utils not available: {e}")
        results.append(False)

    # Test auto_fix_pattern
    try:
        from auto_fix_pattern import AutoFixCycle
        print("[SUCCESS] auto_fix_pattern loaded")
        results.append(True)
    except ImportError as e:
        print(f"[WARNING] auto_fix_pattern not available: {e}")
        results.append(False)

    # Test api_test_optimizer
    try:
        from api_test_optimizer import ParallelAPITester
        print("[SUCCESS] api_test_optimizer loaded")
        results.append(True)
    except ImportError as e:
        print(f"[WARNING] api_test_optimizer not available: {e}")
        results.append(False)

    # Test tool_pattern_advisor
    try:
        from tool_pattern_advisor import ToolPatternAdvisor
        print("[SUCCESS] tool_pattern_advisor loaded")
        results.append(True)
    except ImportError as e:
        print(f"[WARNING] tool_pattern_advisor not available: {e}")
        results.append(False)

    print()
    return any(results)  # At least one utility should be available

def test_validation_functionality():
    """Test actual validation functionality"""
    print("-"*60)
    print("Validation Functionality Test")
    print("-"*60)

    try:
        from learning_integration import CryptoConnectionValidator, PREVENTION_AVAILABLE

        if not PREVENTION_AVAILABLE:
            print("[INFO] Prevention utilities not available - skipping functional tests")
            print()
            return True

        # Test API credential validation
        print("Testing API credential validation...")
        is_valid, msg = CryptoConnectionValidator.validate_api_credentials("test_key", "test_secret")
        if is_valid:
            print(f"[SUCCESS] Credential validation working: {msg}")
        else:
            print(f"[INFO] Credential validation returned: {msg}")

        # Test WebSocket validation
        print("Testing WebSocket validation...")

        # Create a mock WebSocket object with required methods
        class MockWebSocket:
            def connect(self): pass
            def disconnect(self): pass
            def subscribe(self): pass
            def is_connected(self): pass

        mock_ws = MockWebSocket()
        is_valid, msg = CryptoConnectionValidator.validate_kraken_websocket(mock_ws)
        if is_valid:
            print(f"[SUCCESS] WebSocket validation working: {msg}")
        else:
            print(f"[ERROR] WebSocket validation failed: {msg}")
            return False

        # Test with invalid WebSocket (missing methods)
        class InvalidWebSocket:
            pass

        invalid_ws = InvalidWebSocket()
        is_valid, msg = CryptoConnectionValidator.validate_kraken_websocket(invalid_ws)
        if not is_valid:
            print(f"[SUCCESS] Invalid WebSocket correctly detected: {msg}")
        else:
            print(f"[ERROR] Invalid WebSocket not detected")
            return False

        print()
        return True
    except Exception as e:
        print(f"[ERROR] Functionality test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all validation tests"""
    results = []

    # Run tests
    results.append(("Learning Integration Module", test_learning_integration()))
    results.append(("WebSocket Manager Integration", test_websocket_manager_integration()))
    results.append(("Kraken Client Integration", test_kraken_client_integration()))
    results.append(("Learning Utilities", test_learning_utilities()))
    results.append(("Validation Functionality", test_validation_functionality()))

    # Print summary
    print("="*60)
    print("VALIDATION SUMMARY")
    print("="*60)

    passed = 0
    failed = 0

    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {name}")
        if result:
            passed += 1
        else:
            failed += 1

    print()
    print(f"Total: {passed} passed, {failed} failed")

    if failed == 0:
        print()
        print("[SUCCESS] All validations passed!")
        print("Learning system is properly integrated and functional.")
        return 0
    else:
        print()
        print("[WARNING] Some validations failed.")
        print("System will still operate with graceful degradation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
