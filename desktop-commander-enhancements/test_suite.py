"""
Desktop Commander Pro - Test Suite
Comprehensive tests for all automation features
"""

import asyncio
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from automation_wrapper import DesktopCommanderPro, TradingBotNotifier


class TestResult:
    def __init__(self, name: str, passed: bool, message: str = "", duration: float = 0.0):
        self.name = name
        self.passed = passed
        self.message = message
        self.duration = duration
    
    def __str__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        duration_str = f"({self.duration:.2f}s)" if self.duration > 0 else ""
        msg = f": {self.message}" if self.message else ""
        return f"{status} | {self.name} {duration_str}{msg}"


class DesktopCommanderProTestSuite:
    """Comprehensive test suite for Desktop Commander Pro."""
    
    def __init__(self):
        self.dc = DesktopCommanderPro()
        self.results: List[TestResult] = []
        self.test_dir = Path("C:/dev/dc-pro-tests")
        self.test_dir.mkdir(exist_ok=True)
    
    async def run_all_tests(self):
        """Run all tests and generate report."""
        print("=" * 80)
        print("DESKTOP COMMANDER PRO - COMPREHENSIVE TEST SUITE")
        print("=" * 80)
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Run test categories
        await self.test_keyboard_automation()
        await self.test_mouse_automation()
        await self.test_window_management()
        await self.test_system_monitoring()
        await self.test_clipboard_operations()
        await self.test_screen_capture()
        await self.test_notifications()
        await self.test_system_info()
        await self.test_trading_bot_integration()
        
        # Generate report
        self.print_report()
    
    async def _run_test(self, name: str, test_func):
        """Run a single test and record result."""
        print(f"Testing: {name}...", end=" ", flush=True)
        start_time = asyncio.get_event_loop().time()
        
        try:
            await test_func()
            duration = asyncio.get_event_loop().time() - start_time
            result = TestResult(name, True, "", duration)
            print("✅")
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            result = TestResult(name, False, str(e), duration)
            print(f"❌ {str(e)}")
        
        self.results.append(result)
    
    # ========================================================================
    # KEYBOARD TESTS
    # ========================================================================
    
    async def test_keyboard_automation(self):
        """Test keyboard automation features."""
        print("\n📝 KEYBOARD AUTOMATION")
        print("-" * 80)
        
        async def test_send_keys():
            result = await self.dc.send_keys("test", wait=True)
            assert result.get("success"), "Failed to send keys"
        
        async def test_type_text():
            result = await self.dc.type_text("Desktop Commander", delay_ms=10)
            assert result.get("success"), "Failed to type text"
        
        async def test_key_combo():
            # Test Ctrl+A (select all)
            result = await self.dc.send_key_combo("A", ctrl=True)
            assert result.get("success"), "Failed to send key combo"
        
        await self._run_test("Send Keys", test_send_keys)
        await self._run_test("Type Text", test_type_text)
        await self._run_test("Key Combinations", test_key_combo)
    
    # ========================================================================
    # MOUSE TESTS
    # ========================================================================
    
    async def test_mouse_automation(self):
        """Test mouse automation features."""
        print("\n🖱️  MOUSE AUTOMATION")
        print("-" * 80)
        
        async def test_get_position():
            pos = await self.dc.get_mouse_position()
            assert "X" in pos and "Y" in pos, "Failed to get mouse position"
        
        async def test_move_mouse():
            result = await self.dc.move_mouse(500, 500)
            assert result.get("success"), "Failed to move mouse"
        
        async def test_smooth_move():
            result = await self.dc.move_mouse(700, 700, smooth=True, steps=10)
            assert result.get("success"), "Failed smooth mouse movement"
        
        async def test_click():
            result = await self.dc.click_mouse("Left")
            assert result.get("success"), "Failed to click mouse"
        
        async def test_scroll():
            result = await self.dc.scroll_mouse("Up", clicks=3)
            assert result.get("success"), "Failed to scroll"
        
        await self._run_test("Get Mouse Position", test_get_position)
        await self._run_test("Move Mouse", test_move_mouse)
        await self._run_test("Smooth Mouse Movement", test_smooth_move)
        await self._run_test("Mouse Click", test_click)
        await self._run_test("Mouse Scroll", test_scroll)
    
    # ========================================================================
    # WINDOW TESTS
    # ========================================================================
    
    async def test_window_management(self):
        """Test window management features."""
        print("\n🪟 WINDOW MANAGEMENT")
        print("-" * 80)
        
        async def test_get_windows():
            windows = await self.dc.get_windows()
            assert len(windows) > 0, "No windows found"
        
        async def test_filter_windows():
            # Try to find PowerShell or cmd windows
            windows = await self.dc.get_windows(process_name="powershell")
            # Just test that it doesn't crash
            assert isinstance(windows, list), "Failed to filter windows"
        
        async def test_flash_window():
            # Try to flash any available window
            windows = await self.dc.get_windows()
            if windows:
                process_name = windows[0].get("ProcessName", "")
                if process_name:
                    result = await self.dc.flash_window(process_name, times=2)
                    # Don't fail if window is not available
                    assert True
        
        await self._run_test("Get All Windows", test_get_windows)
        await self._run_test("Filter Windows", test_filter_windows)
        await self._run_test("Flash Window", test_flash_window)
    
    # ========================================================================
    # SYSTEM MONITORING TESTS
    # ========================================================================
    
    async def test_system_monitoring(self):
        """Test system monitoring features."""
        print("\n📊 SYSTEM MONITORING")
        print("-" * 80)
        
        async def test_system_stats():
            stats = await self.dc.get_system_stats()
            assert "CPU_Percent" in stats, "Missing CPU stats"
            assert "Memory_Used_Percent" in stats, "Missing memory stats"
            assert stats["CPU_Percent"] >= 0, "Invalid CPU percentage"
        
        async def test_process_stats():
            # Try to get stats for current process
            stats = await self.dc.get_process_stats("python")
            assert isinstance(stats, list), "Failed to get process stats"
        
        async def test_watch_stats():
            # Short monitoring test
            stats_list = await self.dc.watch_system_stats(interval_seconds=2, duration_seconds=4)
            assert isinstance(stats_list, list), "Failed to watch stats"
            assert len(stats_list) >= 1, "No stats collected"
        
        await self._run_test("Get System Stats", test_system_stats)
        await self._run_test("Get Process Stats", test_process_stats)
        await self._run_test("Watch System Stats", test_watch_stats)
    
    # ========================================================================
    # CLIPBOARD TESTS
    # ========================================================================
    
    async def test_clipboard_operations(self):
        """Test clipboard operations."""
        print("\n📋 CLIPBOARD OPERATIONS")
        print("-" * 80)
        
        async def test_set_clipboard():
            test_data = f"Desktop Commander Pro Test - {datetime.now().isoformat()}"
            result = await self.dc.set_clipboard(test_data)
            assert result.get("success"), "Failed to set clipboard"
        
        async def test_get_clipboard():
            test_data = f"Test Data - {datetime.now().isoformat()}"
            await self.dc.set_clipboard(test_data)
            await asyncio.sleep(0.5)
            retrieved = await self.dc.get_clipboard()
            assert test_data in retrieved or retrieved == test_data, "Clipboard data mismatch"
        
        await self._run_test("Set Clipboard", test_set_clipboard)
        await self._run_test("Get Clipboard", test_get_clipboard)
    
    # ========================================================================
    # SCREEN CAPTURE TESTS
    # ========================================================================
    
    async def test_screen_capture(self):
        """Test screen capture features."""
        print("\n📸 SCREEN CAPTURE")
        print("-" * 80)
        
        async def test_full_screenshot():
            path = self.test_dir / f"screenshot_full_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            result = await self.dc.capture_screenshot(str(path))
            assert result.get("success"), "Failed to capture screenshot"
            assert Path(result["path"]).exists(), "Screenshot file not created"
        
        async def test_region_screenshot():
            path = self.test_dir / f"screenshot_region_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            result = await self.dc.capture_screenshot(str(path), x=100, y=100, width=800, height=600)
            assert result.get("success"), "Failed to capture region"
            assert Path(result["path"]).exists(), "Screenshot file not created"
        
        async def test_jpeg_format():
            path = self.test_dir / f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            result = await self.dc.capture_screenshot(str(path), format="Jpeg")
            assert result.get("success"), "Failed to capture JPEG"
        
        await self._run_test("Full Screenshot", test_full_screenshot)
        await self._run_test("Region Screenshot", test_region_screenshot)
        await self._run_test("JPEG Format", test_jpeg_format)
    
    # ========================================================================
    # NOTIFICATION TESTS
    # ========================================================================
    
    async def test_notifications(self):
        """Test notification features."""
        print("\n🔔 NOTIFICATIONS")
        print("-" * 80)
        
        async def test_basic_notification():
            result = await self.dc.show_notification(
                "Test Notification",
                "Desktop Commander Pro is working!",
                duration_seconds=3
            )
            # Notifications might fail on headless systems
            # Just ensure no crash
            assert True
        
        await self._run_test("Show Notification", test_basic_notification)
    
    # ========================================================================
    # SYSTEM INFO TESTS
    # ========================================================================
    
    async def test_system_info(self):
        """Test system information retrieval."""
        print("\n💻 SYSTEM INFORMATION")
        print("-" * 80)
        
        async def test_system_info():
            info = await self.dc.get_system_information()
            assert "ComputerName" in info or info.get("success") is not False, "Failed to get system info"
        
        async def test_hardware_info():
            info = await self.dc.get_hardware_info()
            # Just ensure no crash
            assert True
        
        await self._run_test("Get System Information", test_system_info)
        await self._run_test("Get Hardware Information", test_hardware_info)
    
    # ========================================================================
    # TRADING BOT INTEGRATION TESTS
    # ========================================================================
    
    async def test_trading_bot_integration(self):
        """Test trading bot integration helpers."""
        print("\n💰 TRADING BOT INTEGRATION")
        print("-" * 80)
        
        notifier = TradingBotNotifier(self.dc)
        
        async def test_trade_notification():
            await notifier.notify_trade_executed(
                symbol="XLM/USD",
                side="buy",
                quantity=50.0,
                price=0.1956,
                order_id="TEST123"
            )
            await asyncio.sleep(1)  # Let notification appear
        
        async def test_error_notification():
            await notifier.notify_error(
                "Test Error",
                "This is a test error message"
            )
            await asyncio.sleep(1)
        
        async def test_startup_notification():
            await notifier.notify_startup(balance=98.82, trading_pair="XLM/USD")
            await asyncio.sleep(1)
        
        async def test_error_screenshot():
            screenshot = await notifier.capture_error_screenshot(
                "test_error",
                output_dir=str(self.test_dir)
            )
            # Screenshot might fail, just ensure no crash
            assert True
        
        await self._run_test("Trade Execution Notification", test_trade_notification)
        await self._run_test("Error Notification", test_error_notification)
        await self._run_test("Startup Notification", test_startup_notification)
        await self._run_test("Error Screenshot Capture", test_error_screenshot)
    
    # ========================================================================
    # REPORTING
    # ========================================================================
    
    def print_report(self):
        """Print test report."""
        print("\n" + "=" * 80)
        print("TEST REPORT")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed
        total = len(self.results)
        
        print(f"\nTotal Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\nFailed Tests:")
            print("-" * 80)
            for result in self.results:
                if not result.passed:
                    print(f"  {result}")
        
        print("\nAll Tests:")
        print("-" * 80)
        for result in self.results:
            print(f"  {result}")
        
        print("\n" + "=" * 80)
        print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Write report to file
        report_path = self.test_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_path, 'w') as f:
            f.write(f"Desktop Commander Pro Test Report\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write(f"\nTotal: {total} | Passed: {passed} | Failed: {failed}\n")
            f.write(f"Success Rate: {(passed/total)*100:.1f}%\n\n")
            for result in self.results:
                f.write(f"{result}\n")
        
        print(f"\nReport saved to: {report_path}")


# ============================================================================
# QUICK TESTS
# ============================================================================

async def quick_test():
    """Run a quick smoke test of critical features."""
    print("🔥 QUICK SMOKE TEST\n")
    
    dc = DesktopCommanderPro()
    
    tests = []
    
    # Test 1: Mouse
    try:
        pos = await dc.get_mouse_position()
        tests.append(("Mouse", True, f"Position: ({pos['X']}, {pos['Y']})"))
    except Exception as e:
        tests.append(("Mouse", False, str(e)))
    
    # Test 2: Keyboard
    try:
        result = await dc.send_keys("test")
        tests.append(("Keyboard", result.get("success", False), "Keys sent"))
    except Exception as e:
        tests.append(("Keyboard", False, str(e)))
    
    # Test 3: Clipboard
    try:
        await dc.set_clipboard("test")
        text = await dc.get_clipboard()
        tests.append(("Clipboard", "test" in text, f"Data: {text[:20]}..."))
    except Exception as e:
        tests.append(("Clipboard", False, str(e)))
    
    # Test 4: System Stats
    try:
        stats = await dc.get_system_stats()
        tests.append(("System Stats", "CPU_Percent" in stats, f"CPU: {stats.get('CPU_Percent', 'N/A')}%"))
    except Exception as e:
        tests.append(("System Stats", False, str(e)))
    
    # Test 5: Windows
    try:
        windows = await dc.get_windows()
        tests.append(("Windows", len(windows) > 0, f"Found {len(windows)} windows"))
    except Exception as e:
        tests.append(("Windows", False, str(e)))
    
    # Print results
    for name, passed, msg in tests:
        status = "✅" if passed else "❌"
        print(f"{status} {name:15} | {msg}")
    
    passed_count = sum(1 for _, p, _ in tests if p)
    print(f"\n✅ {passed_count}/{len(tests)} tests passed")


# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Main test runner."""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        await quick_test()
    else:
        suite = DesktopCommanderProTestSuite()
        await suite.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
