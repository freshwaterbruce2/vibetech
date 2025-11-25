"""
Windows Automation Library for Desktop Commander
Python version with async support for complex automation
"""
import asyncio
import pyautogui
import pyperclip
from typing import Tuple, Optional
import subprocess
import win32gui
import win32con
import win32api


class WindowsAutomation:
    """Async-first Windows automation utilities"""
    
    def __init__(self):
        # Safety settings for pyautogui
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1
    
    async def launch_app(self, app_name: str) -> None:
        """Launch application from Start Menu"""
        await asyncio.to_thread(
            subprocess.run,
            ["powershell", "-Command", f"Start-Process '{app_name}'"],
            capture_output=True
        )
    
    async def get_clipboard(self) -> str:
        """Get clipboard text content"""
        return await asyncio.to_thread(pyperclip.paste)
    
    async def set_clipboard(self, text: str) -> None:
        """Set clipboard text content"""
        await asyncio.to_thread(pyperclip.copy, text)
    
    async def list_windows(self) -> list[dict]:
        """List all visible windows"""
        windows = []
        
        def enum_callback(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                title = win32gui.GetWindowText(hwnd)
                if title:
                    windows.append({
                        "handle": hwnd,
                        "title": title,
                        "rect": win32gui.GetWindowRect(hwnd)
                    })
            return True
        
        await asyncio.to_thread(win32gui.EnumWindows, enum_callback, None)
        return windows
    
    async def focus_window(self, title_substring: str) -> bool:
        """Focus window by partial title match"""
        windows = await self.list_windows()
        for window in windows:
            if title_substring.lower() in window["title"].lower():
                await asyncio.to_thread(
                    win32gui.SetForegroundWindow,
                    window["handle"]
                )
                return True
        return False
    
    async def click(self, x: int, y: int, button: str = "left", clicks: int = 1) -> None:
        """Click at coordinates"""
        await asyncio.to_thread(pyautogui.click, x, y, clicks=clicks, button=button)
    
    async def type_text(self, text: str, interval: float = 0.05) -> None:
        """Type text with optional interval between keys"""
        await asyncio.to_thread(pyautogui.write, text, interval=interval)
    
    async def press_key(self, key: str) -> None:
        """Press a single key"""
        await asyncio.to_thread(pyautogui.press, key)
    
    async def hotkey(self, *keys: str) -> None:
        """Press keyboard shortcut combination"""
        await asyncio.to_thread(pyautogui.hotkey, *keys)
    
    async def screenshot(self, path: Optional[str] = None) -> str:
        """Take screenshot and save to path"""
        if path is None:
            path = "screenshot.png"
        await asyncio.to_thread(pyautogui.screenshot, path)
        return path
    
    async def move_mouse(self, x: int, y: int, duration: float = 0.2) -> None:
        """Move mouse to coordinates"""
        await asyncio.to_thread(pyautogui.moveTo, x, y, duration=duration)
    
    async def scroll(self, clicks: int) -> None:
        """Scroll mouse wheel (positive=up, negative=down)"""
        await asyncio.to_thread(pyautogui.scroll, clicks)
    
    async def drag(self, start: Tuple[int, int], end: Tuple[int, int]) -> None:
        """Drag from start to end coordinates"""
        await self.move_mouse(*start)
        await asyncio.to_thread(pyautogui.drag, end[0] - start[0], end[1] - start[1])


# Convenience functions for direct use
async def main_example():
    """Example usage"""
    automation = WindowsAutomation()
    
    # List windows
    windows = await automation.list_windows()
    print(f"Found {len(windows)} windows")
    
    # Get/set clipboard
    await automation.set_clipboard("Hello from automation!")
    text = await automation.get_clipboard()
    print(f"Clipboard: {text}")
    
    # Focus window
    await automation.focus_window("notepad")
    
    # Type text
    await automation.type_text("Automated typing!")


if __name__ == "__main__":
    asyncio.run(main_example())
