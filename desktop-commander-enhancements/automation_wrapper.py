"""
Desktop Commander Pro - Async Python Wrapper
Provides non-blocking async access to all Windows automation features
"""

import asyncio
import json
from typing import Dict, Any, Optional, List
from pathlib import Path


class DesktopCommanderPro:
    """
    Async wrapper for Desktop Commander Pro PowerShell automation.
    
    All methods are non-blocking and safe to use in async event loops.
    Perfect for integration with the crypto trading bot.
    """
    
    def __init__(self, module_path: Optional[str] = None):
        if module_path is None:
            module_path = Path(__file__).parent / "DesktopCommanderPro.psm1"
        self.module_path = Path(module_path)
        
        if not self.module_path.exists():
            raise FileNotFoundError(f"Module not found: {self.module_path}")
    
    async def _execute_ps(
        self, 
        command: str,
        timeout: float = 30.0
    ) -> Dict[str, Any]:
        """Execute PowerShell command asynchronously."""
        ps_cmd = f"""
            Import-Module '{self.module_path}'
            {command} | ConvertTo-Json -Depth 10
        """
        
        proc = await asyncio.create_subprocess_exec(
            "powershell",
            "-NoProfile",
            "-Command",
            ps_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout
            )
            
            if proc.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='ignore')
                return {
                    "success": False,
                    "error": f"PowerShell error: {error_msg}"
                }
            
            output = stdout.decode('utf-8', errors='ignore').strip()
            
            if output:
                try:
                    return json.loads(output)
                except json.JSONDecodeError:
                    # If not JSON, return as string
                    return {"success": True, "output": output}
            
            return {"success": True}
            
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            return {
                "success": False,
                "error": f"Command timed out after {timeout}s"
            }
    
    # ========================================================================
    # KEYBOARD AUTOMATION
    # ========================================================================
    
    async def send_keys(
        self,
        keys: str,
        wait: bool = True,
        delay_ms: int = 100
    ) -> Dict[str, Any]:
        """
        Send keyboard input.
        
        Examples:
            await dc.send_keys("Hello World")
            await dc.send_keys("^c")  # Ctrl+C
            await dc.send_keys("%{F4}")  # Alt+F4
        """
        wait_param = "-Wait" if wait else ""
        cmd = f"Send-KeyPress -Keys '{keys}' {wait_param} -DelayMs {delay_ms}"
        return await self._execute_ps(cmd)
    
    async def type_text(
        self,
        text: str,
        delay_ms: int = 50
    ) -> Dict[str, Any]:
        """Type text character by character."""
        cmd = f"Send-TextInput -Text '{text}' -DelayMs {delay_ms}"
        return await self._execute_ps(cmd)
    
    async def send_key_combo(
        self,
        key: str,
        ctrl: bool = False,
        alt: bool = False,
        shift: bool = False,
        win: bool = False
    ) -> Dict[str, Any]:
        """
        Send key combination.
        
        Examples:
            await dc.send_key_combo("C", ctrl=True)  # Ctrl+C
            await dc.send_key_combo("ESC", ctrl=True, shift=True)  # Ctrl+Shift+Esc
        """
        modifiers = []
        if ctrl:
            modifiers.append("-Ctrl")
        if alt:
            modifiers.append("-Alt")
        if shift:
            modifiers.append("-Shift")
        if win:
            modifiers.append("-Win")
        
        cmd = f"Send-KeyCombo {' '.join(modifiers)} -Key '{key}'"
        return await self._execute_ps(cmd)
    
    # ========================================================================
    # MOUSE AUTOMATION
    # ========================================================================
    
    async def move_mouse(
        self,
        x: int,
        y: int,
        smooth: bool = False,
        steps: int = 20
    ) -> Dict[str, Any]:
        """Move mouse cursor to coordinates."""
        smooth_param = "-Smooth" if smooth else ""
        cmd = f"Move-MouseCursor -X {x} -Y {y} {smooth_param} -Steps {steps}"
        return await self._execute_ps(cmd)
    
    async def get_mouse_position(self) -> Dict[str, Any]:
        """Get current mouse position."""
        return await self._execute_ps("Get-MousePosition")
    
    async def click_mouse(
        self,
        button: str = "Left",
        x: Optional[int] = None,
        y: Optional[int] = None,
        double_click: bool = False,
        delay_ms: int = 50
    ) -> Dict[str, Any]:
        """
        Click mouse button.
        
        Args:
            button: "Left", "Right", or "Middle"
            x, y: Optional coordinates to click at
            double_click: Whether to double-click
            delay_ms: Delay between down and up
        """
        params = [f"-Button {button}"]
        if x is not None and y is not None:
            params.append(f"-X {x} -Y {y}")
        if double_click:
            params.append("-DoubleClick")
        params.append(f"-DelayMs {delay_ms}")
        
        cmd = f"Invoke-MouseClick {' '.join(params)}"
        return await self._execute_ps(cmd)
    
    async def scroll_mouse(
        self,
        direction: str = "Up",
        clicks: int = 1
    ) -> Dict[str, Any]:
        """Scroll mouse wheel."""
        cmd = f"Invoke-MouseScroll -Direction {direction} -Clicks {clicks}"
        return await self._execute_ps(cmd)
    
    async def drag_mouse(
        self,
        to_x: int,
        to_y: int,
        from_x: Optional[int] = None,
        from_y: Optional[int] = None,
        button: str = "Left"
    ) -> Dict[str, Any]:
        """Drag mouse from one position to another."""
        from_params = ""
        if from_x is not None and from_y is not None:
            from_params = f"-FromX {from_x} -FromY {from_y}"
        
        cmd = f"Invoke-MouseDrag {from_params} -ToX {to_x} -ToY {to_y} -Button {button}"
        return await self._execute_ps(cmd)
    
    # ========================================================================
    # WINDOW MANAGEMENT
    # ========================================================================
    
    async def get_windows(
        self,
        process_name: Optional[str] = None,
        window_title: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get information about windows."""
        params = []
        if process_name:
            params.append(f"-ProcessName '{process_name}'")
        if window_title:
            params.append(f"-WindowTitle '{window_title}'")
        
        cmd = f"Get-WindowInfo {' '.join(params)}"
        result = await self._execute_ps(cmd)
        
        if isinstance(result, list):
            return result
        elif result.get("success"):
            return [result]
        return []
    
    async def set_window_always_on_top(
        self,
        process_name: Optional[str] = None,
        window_title: Optional[str] = None,
        on_top: bool = True
    ) -> Dict[str, Any]:
        """Make window stay on top."""
        params = []
        if process_name:
            params.append(f"-ProcessName '{process_name}'")
        if window_title:
            params.append(f"-WindowTitle '{window_title}'")
        if on_top:
            params.append("-OnTop")
        
        cmd = f"Set-WindowAlwaysOnTop {' '.join(params)}"
        return await self._execute_ps(cmd)
    
    async def flash_window(
        self,
        process_name: str,
        times: int = 5
    ) -> Dict[str, Any]:
        """Flash window to get attention."""
        cmd = f"Invoke-WindowFlash -ProcessName '{process_name}' -Times {times}"
        return await self._execute_ps(cmd)
    
    async def move_window_to_monitor(
        self,
        process_name: str,
        monitor_index: int = 0
    ) -> Dict[str, Any]:
        """Move window to specific monitor."""
        cmd = f"Move-WindowToMonitor -ProcessName '{process_name}' -MonitorIndex {monitor_index}"
        return await self._execute_ps(cmd)
    
    # ========================================================================
    # SYSTEM MONITORING
    # ========================================================================
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get current system performance statistics."""
        return await self._execute_ps("Get-SystemStats")
    
    async def watch_system_stats(
        self,
        interval_seconds: int = 5,
        duration_seconds: int = 60
    ) -> List[Dict[str, Any]]:
        """Monitor system stats over time."""
        cmd = f"Watch-SystemStats -IntervalSeconds {interval_seconds} -DurationSeconds {duration_seconds}"
        result = await self._execute_ps(cmd, timeout=duration_seconds + 10)
        
        if isinstance(result, list):
            return result
        return [result] if result.get("success") else []
    
    async def get_process_stats(self, process_name: str) -> List[Dict[str, Any]]:
        """Get statistics for a specific process."""
        cmd = f"Get-ProcessStats -ProcessName '{process_name}'"
        result = await self._execute_ps(cmd)
        
        if isinstance(result, list):
            return result
        return [result] if result.get("success") else []
    
    # ========================================================================
    # SCREEN CAPTURE
    # ========================================================================
    
    async def capture_screenshot(
        self,
        path: str,
        x: int = 0,
        y: int = 0,
        width: int = 0,
        height: int = 0,
        monitor_index: int = 0,
        format: str = "Png"
    ) -> Dict[str, Any]:
        """Capture screenshot."""
        params = [f"-Path '{path}'"]
        if width > 0 and height > 0:
            params.extend([f"-X {x}", f"-Y {y}", f"-Width {width}", f"-Height {height}"])
        params.append(f"-MonitorIndex {monitor_index}")
        params.append(f"-Format {format}")
        
        cmd = f"Capture-Screenshot {' '.join(params)}"
        return await self._execute_ps(cmd)
    
    async def capture_window_screenshot(
        self,
        process_name: str,
        path: str,
        format: str = "Png"
    ) -> Dict[str, Any]:
        """Capture screenshot of specific window."""
        cmd = f"Capture-WindowScreenshot -ProcessName '{process_name}' -Path '{path}' -Format {format}"
        return await self._execute_ps(cmd)
    
    # ========================================================================
    # CLIPBOARD
    # ========================================================================
    
    async def get_clipboard(self) -> str:
        """Get clipboard text."""
        result = await self._execute_ps("[System.Windows.Forms.Clipboard]::GetText()")
        if result.get("success"):
            return result.get("output", "")
        return ""
    
    async def set_clipboard(self, text: str) -> Dict[str, Any]:
        """Set clipboard text."""
        # Escape single quotes in text
        text = text.replace("'", "''")
        cmd = f"[System.Windows.Forms.Clipboard]::SetText('{text}')"
        return await self._execute_ps(cmd)
    
    # ========================================================================
    # NOTIFICATIONS
    # ========================================================================
    
    async def show_notification(
        self,
        title: str,
        message: str,
        duration_seconds: int = 5
    ) -> Dict[str, Any]:
        """Show Windows toast notification."""
        # Escape quotes
        title = title.replace("'", "''")
        message = message.replace("'", "''")
        
        ps_script = f"""
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        
        $template = @"
        <toast>
            <visual>
                <binding template="ToastText02">
                    <text id="1">{title}</text>
                    <text id="2">{message}</text>
                </binding>
            </visual>
        </toast>
"@
        
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Desktop Commander Pro")
        $notifier.Show($toast)
        """
        
        return await self._execute_ps(ps_script)
    
    # ========================================================================
    # REGISTRY
    # ========================================================================
    
    async def get_registry_value(
        self,
        path: str,
        name: str
    ) -> Dict[str, Any]:
        """Read registry value."""
        cmd = f"Get-RegistryValue -Path '{path}' -Name '{name}'"
        return await self._execute_ps(cmd)
    
    async def set_registry_value(
        self,
        path: str,
        name: str,
        value: Any,
        type: str = "String"
    ) -> Dict[str, Any]:
        """
        Write registry value (use with caution!).
        
        Types: String, ExpandString, Binary, DWord, MultiString, QWord
        """
        cmd = f"Set-RegistryValue -Path '{path}' -Name '{name}' -Value '{value}' -Type {type}"
        return await self._execute_ps(cmd)
    
    # ========================================================================
    # FILE SYSTEM MONITORING
    # ========================================================================
    
    async def watch_filesystem(
        self,
        path: str,
        filter: str = "*.*",
        duration_seconds: int = 60,
        include_subdirectories: bool = False
    ) -> List[Dict[str, Any]]:
        """Monitor directory for file changes."""
        params = [f"-Path '{path}'", f"-Filter '{filter}'", f"-DurationSeconds {duration_seconds}"]
        if include_subdirectories:
            params.append("-IncludeSubdirectories")
        
        cmd = f"Watch-FileSystem {' '.join(params)}"
        result = await self._execute_ps(cmd, timeout=duration_seconds + 10)
        
        if isinstance(result, list):
            return result
        return [result] if result.get("success") else []
    
    # ========================================================================
    # SYSTEM INFO
    # ========================================================================
    
    async def get_system_information(self) -> Dict[str, Any]:
        """Get comprehensive system information."""
        return await self._execute_ps("Get-SystemInformation")
    
    async def get_hardware_info(self) -> Dict[str, Any]:
        """Get detailed hardware information."""
        return await self._execute_ps("Get-HardwareInfo")
    
    # ========================================================================
    # EVENT LOGS
    # ========================================================================
    
    async def get_event_logs(
        self,
        log_name: str = "Application",
        level: str = "Error",
        max_events: int = 100,
        hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Read Windows Event Logs."""
        cmd = f"Get-EventLogEntries -LogName '{log_name}' -Level '{level}' -MaxEvents {max_events} -Hours {hours}"
        result = await self._execute_ps(cmd)
        
        if isinstance(result, list):
            return result
        return [result] if result.get("success") else []
    
    # ========================================================================
    # TESTING
    # ========================================================================
    
    async def run_test_suite(self) -> List[Dict[str, Any]]:
        """Run comprehensive test suite."""
        result = await self._execute_ps("Test-DesktopCommanderPro")
        
        if isinstance(result, list):
            return result
        return [result] if result.get("success") else []


# ============================================================================
# TRADING BOT INTEGRATION HELPERS
# ============================================================================

class TradingBotNotifier:
    """
    Specialized notifications for the crypto trading bot.
    Integrates seamlessly with the async trading engine.
    """
    
    def __init__(self, dc_pro: Optional[DesktopCommanderPro] = None):
        self.dc = dc_pro or DesktopCommanderPro()
    
    async def notify_trade_executed(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        order_id: str
    ) -> None:
        """Notify when trade is executed."""
        title = f"💰 Trade Executed: {symbol}"
        message = f"{side.upper()} {quantity} @ ${price:.4f} (Order: {order_id})"
        await self.dc.show_notification(title, message)
    
    async def notify_error(
        self,
        error_type: str,
        error_message: str
    ) -> None:
        """Notify about errors."""
        title = f"⚠️ Trading Bot Error: {error_type}"
        await self.dc.show_notification(title, error_message[:100])
    
    async def notify_circuit_breaker(
        self,
        reason: str,
        threshold: str
    ) -> None:
        """Notify when circuit breaker trips."""
        title = "🔴 CIRCUIT BREAKER ACTIVATED"
        message = f"{reason} (Threshold: {threshold})"
        await self.dc.show_notification(title, message, duration_seconds=10)
    
    async def notify_startup(
        self,
        balance: float,
        trading_pair: str
    ) -> None:
        """Notify when bot starts."""
        title = "🚀 Trading Bot Started"
        message = f"Balance: ${balance:.2f} | Pair: {trading_pair}"
        await self.dc.show_notification(title, message)
    
    async def notify_shutdown(
        self,
        reason: str,
        final_balance: float
    ) -> None:
        """Notify when bot shuts down."""
        title = "🛑 Trading Bot Stopped"
        message = f"{reason} | Final Balance: ${final_balance:.2f}"
        await self.dc.show_notification(title, message)
    
    async def capture_error_screenshot(
        self,
        error_type: str,
        output_dir: str = "C:/dev/trading-errors"
    ) -> Optional[str]:
        """Capture screenshot when error occurs."""
        from datetime import datetime
        import os
        
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{output_dir}/error_{error_type}_{timestamp}.png"
        
        result = await self.dc.capture_screenshot(filename)
        
        if result.get("success"):
            return filename
        return None


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_trading_bot_integration():
    """Example: How to integrate with the trading bot."""
    
    # Initialize
    dc = DesktopCommanderPro()
    notifier = TradingBotNotifier(dc)
    
    # Startup notification
    await notifier.notify_startup(balance=98.82, trading_pair="XLM/USD")
    
    # Simulate trade execution
    await notifier.notify_trade_executed(
        symbol="XLM/USD",
        side="buy",
        quantity=50.0,
        price=0.1956,
        order_id="ABC123"
    )
    
    # Monitor system during trading
    stats = await dc.get_system_stats()
    print(f"CPU: {stats.get('CPU_Percent')}% | Memory: {stats.get('Memory_Used_Percent')}%")
    
    # On error: Capture screenshot and notify
    try:
        # ... trading logic ...
        raise Exception("Connection lost")
    except Exception as e:
        screenshot_path = await notifier.capture_error_screenshot("connection_lost")
        await notifier.notify_error("Connection Error", str(e))
        print(f"Error screenshot saved: {screenshot_path}")


async def example_automation_demo():
    """Example: General automation capabilities."""
    
    dc = DesktopCommanderPro()
    
    # Keyboard automation
    await dc.send_key_combo("C", ctrl=True)  # Copy
    await asyncio.sleep(0.5)
    text = await dc.get_clipboard()
    print(f"Clipboard: {text}")
    
    # Mouse automation
    pos = await dc.get_mouse_position()
    print(f"Mouse at: {pos}")
    await dc.move_mouse(500, 500, smooth=True)
    await dc.click_mouse("Left")
    
    # Window management
    windows = await dc.get_windows(process_name="notepad")
    for window in windows:
        print(f"Window: {window['WindowTitle']}")
        await dc.flash_window("notepad", times=3)
    
    # System monitoring
    stats = await dc.get_system_stats()
    print(f"System Stats: CPU={stats['CPU_Percent']}% Memory={stats['Memory_Used_Percent']}%")
    
    # Screenshot
    await dc.capture_screenshot("C:/dev/screenshot.png")
    
    # Notification
    await dc.show_notification("Test", "Desktop Commander Pro is working!")


if __name__ == "__main__":
    # Run examples
    print("Running Desktop Commander Pro examples...\n")
    asyncio.run(example_automation_demo())
