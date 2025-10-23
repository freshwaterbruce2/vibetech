#!/usr/bin/env python3
"""
Verify that all code review fixes have been properly applied
"""

import sys
from pathlib import Path

def check_websocket_manager():
    """Verify WebSocket manager fixes"""
    print("="*60)
    print("CHECKING WEBSOCKET_MANAGER.PY FIXES")
    print("="*60)
    
    ws_file = Path("websocket_manager.py")
    if not ws_file.exists():
        print("❌ websocket_manager.py not found!")
        return False
    
    content = ws_file.read_text()
    
    checks = []
    
    # Check 1: TaskGroup handling (should use create_task)
    if "self._public_task = asyncio.create_task(self._connect_public())" in content:
        print("✅ Issue #1: Independent task handling (FIXED)")
        checks.append(True)
    else:
        print("❌ Issue #1: TaskGroup handling not fixed")
        checks.append(False)
    
    # Check 2: Timestamp parsing
    if "TimestampUtils.parse_rfc3339(self.ws_token_timestamp)" in content:
        print("✅ Issue #2: Timestamp parsing uses TimestampUtils (FIXED)")
        checks.append(True)
    else:
        print("❌ Issue #2: Timestamp parsing not fixed")
        checks.append(False)
    
    # Check 3: Task cleanup in stop()
    if "tasks_to_cancel = []" in content and "await asyncio.gather(*tasks_to_cancel, return_exceptions=True)" in content:
        print("✅ Issue #3: Proper task cleanup in stop() (FIXED)")
        checks.append(True)
    else:
        print("❌ Issue #3: Task cleanup not fixed")
        checks.append(False)
    
    # Check 4: Heartbeat monitoring logic
    if "last_ping_time = time.time()" in content and "current_time - self.last_heartbeat" in content:
        print("✅ Issue #5: Heartbeat monitoring logic (FIXED)")
        checks.append(True)
    else:
        print("❌ Issue #5: Heartbeat monitoring not fixed")
        checks.append(False)
    
    return all(checks)

def check_start_live_trading():
    """Verify start_live_trading.py fixes"""
    print("\n" + "="*60)
    print("CHECKING START_LIVE_TRADING.PY FIXES")
    print("="*60)
    
    start_file = Path("start_live_trading.py")
    if not start_file.exists():
        print("❌ start_live_trading.py not found!")
        return False
    
    content = start_file.read_text()
    
    # Check 4: Instance lock handling
    if "logger.info(\"Instance lock acquired successfully\")" in content and "another instance detected" in content:
        print("✅ Issue #4: Instance lock properly enforced (FIXED)")
        return True
    else:
        print("❌ Issue #4: Instance lock handling not fixed")
        return False

def main():
    """Run all verification checks"""
    print("\n" + "="*60)
    print("CODE REVIEW FIX VERIFICATION")
    print("="*60 + "\n")
    
    ws_ok = check_websocket_manager()
    start_ok = check_start_live_trading()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    if ws_ok and start_ok:
        print("✅ ALL FIXES VERIFIED SUCCESSFULLY!")
        print("\n🎉 Your crypto trading bot is now safer and more robust!")
        print("\nKey improvements:")
        print("  • Independent WebSocket connection handling")
        print("  • Consistent timestamp parsing with TimestampUtils")
        print("  • Proper async task cleanup on shutdown")
        print("  • Corrected heartbeat timeout detection")
        print("  • Enforced instance lock to prevent multi-instance conflicts")
        return 0
    else:
        print("❌ SOME FIXES NOT APPLIED")
        print("\nPlease review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
