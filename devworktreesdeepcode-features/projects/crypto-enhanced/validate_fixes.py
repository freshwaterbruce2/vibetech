"""
Quick validation test for error handling fixes
"""
import sys

print("Testing imports...")

try:
    from errors_simple import (
        ErrorSeverity, 
        TradingError, 
        APIError, 
        KrakenAPIError, 
        WebSocketError, 
        OrderError,
        is_retryable,
        log_error
    )
    print("[+] errors_simple imports OK")
    
    # Test ErrorSeverity enum
    assert ErrorSeverity.CRITICAL.value == "critical"
    assert ErrorSeverity.WARNING.value == "warning"
    print("[+] ErrorSeverity enum OK")
    
    # Test KrakenAPIError with severity
    test_error = KrakenAPIError("Test error", endpoint="/test")
    assert hasattr(test_error, 'severity')
    assert hasattr(test_error, 'retry_able')
    print("[+] KrakenAPIError attributes OK")
    
    # Test severity classification
    auth_error = KrakenAPIError("Authentication failed")
    assert auth_error.severity == ErrorSeverity.CRITICAL
    assert auth_error.retry_able == False
    print("[+] CRITICAL error classification OK")
    
    rate_limit_error = KrakenAPIError("Rate limit exceeded")
    assert rate_limit_error.severity == ErrorSeverity.WARNING
    assert rate_limit_error.retry_able == True
    print("[+] WARNING error classification OK")
    
    # Test kraken_client imports
    from kraken_client import KrakenClient, RateLimiter
    print("[+] kraken_client imports OK")
    
    print("\n" + "="*60)
    print("[SUCCESS] All error handling fixes validated!")
    print("="*60)
    
except ImportError as e:
    print(f"[!] Import Error: {e}")
    sys.exit(1)
except AssertionError as e:
    print(f"[!] Validation Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"[!] Unexpected Error: {e}")
    sys.exit(1)
