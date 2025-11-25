"""
FIXED Instance Lock Manager - Bulletproof single instance enforcement
ROOT CAUSE FIX: Use fixed application identifier instead of variable script path
UPGRADED: Modern filelock library + enhanced safeguards
"""

import os
import sys
import time
import json
import psutil
import tempfile
import socket
from pathlib import Path
from typing import Optional, Dict, Any

# Modern filelock library (Aug 2025) - install with: pip install filelock
try:
    from filelock import FileLock, Timeout
    FILELOCK_AVAILABLE = True
except ImportError:
    FILELOCK_AVAILABLE = False
    print("[WARNING] filelock library not installed. Install with: pip install filelock")
    print("[WARNING] Falling back to legacy file locking")

# Windows mutex support (backup layer)
_mutex_handle = None
if sys.platform == "win32":
    try:
        import ctypes
        from ctypes import wintypes
        ERROR_ALREADY_EXISTS = 183
        MUTEX_ALL_ACCESS = 0x1F0001
        kernel32 = ctypes.windll.kernel32
        kernel32.CreateMutexW.argtypes = [ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR]
        kernel32.CreateMutexW.restype = wintypes.HANDLE
        kernel32.GetLastError.restype = wintypes.DWORD
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        kernel32.CloseHandle.restype = wintypes.BOOL
        kernel32.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel32.WaitForSingleObject.restype = wintypes.DWORD
        WAIT_OBJECT_0 = 0
        WAIT_TIMEOUT = 258
        WAIT_ABANDONED = 128
        _WINDOWS_MUTEX_AVAILABLE = True
    except ImportError:
        _WINDOWS_MUTEX_AVAILABLE = False
else:
    _WINDOWS_MUTEX_AVAILABLE = False


class InstanceLockFixed:
    """
    BULLETPROOF single instance enforcement - FIXED VERSION
    
    KEY FIX: Uses fixed application identifier instead of variable script path
    This prevents multiple instances from different working directories
    """

    def __init__(self, timeout: float = 0.1):
        self.pid = os.getpid()
        self.timeout = timeout

        # CRITICAL FIX: Use FIXED application identifier 
        # This is the same regardless of working directory or script path
        self.app_id = "kraken-crypto-trading-system-v1"
        user_id = os.getenv('USERNAME', os.getenv('USER', 'unknown'))
        self.full_lock_id = f"{self.app_id}-{user_id}"

        # Lock file locations (all use fixed identifier)
        temp_dir = Path(tempfile.gettempdir())
        self.lock_file_path = temp_dir / f"{self.full_lock_id}.lock"
        self.pid_file_path = temp_dir / f"{self.full_lock_id}.pid"

        # Lock components
        self.file_lock = None
        self.legacy_lock_handle = None
        self.mutex_handle = None
        self.port_lock = None
        self.lock_port = 47777  # Fixed port for all instances

        # Enhanced process tracking
        self.process_info = {
            'pid': self.pid,
            'start_time': time.time(),
            'command': ' '.join(sys.argv),
            'cwd': os.getcwd(),
            'user': user_id,
            'app_id': self.app_id
        }

    def acquire(self, retry_count: int = 0, max_retries: int = 3) -> bool:
        """
        BULLETPROOF lock acquisition with multiple layers and automatic retry after cleanup
        """
        if retry_count == 0:
            print(f"[LOCK] Acquiring instance lock for {self.app_id}")
            print(f"[LOCK] PID: {self.pid}, User: {self.process_info['user']}")
            print(f"[LOCK] Lock ID: {self.full_lock_id}")
        else:
            print(f"[LOCK] Retry attempt {retry_count}/{max_retries} after duplicate cleanup")

        # Layer 1: Modern filelock library (primary)
        if FILELOCK_AVAILABLE:
            try:
                # Make sure parent directory exists
                self.lock_file_path.parent.mkdir(parents=True, exist_ok=True)

                # Set appropriate timeout and retry
                self.file_lock = FileLock(str(self.lock_file_path), timeout=self.timeout)
                self.file_lock.acquire()

                # Write process info to lock file for debugging
                with open(f"{self.lock_file_path}.info", 'w') as f:
                    json.dump(self.process_info, f, indent=2)

                print(f"[LOCK] [OK] Layer 1 SUCCESS - Modern filelock acquired")
            except Timeout:
                print(f"[LOCK] [ERROR] Layer 1 FAILED - Another instance holds the lock")
                return False
            except Exception as e:
                print(f"[LOCK] [ERROR] Layer 1 ERROR - {e}")
                return False
        else:
            # Layer 1b: Legacy exclusive file lock
            if not self._acquire_legacy_file_lock():
                print(f"[LOCK] [ERROR] Layer 1b FAILED - Legacy file lock failed")
                return False
            print(f"[LOCK] [OK] Layer 1b SUCCESS - Legacy file lock acquired")

        # Layer 2: Process validation and PID tracking
        process_lock_result = self._acquire_process_lock()
        if process_lock_result == "retry_needed":
            # Duplicates were killed, need to retry entire acquisition
            print(f"[LOCK] [INFO] Duplicates cleaned up, retrying lock acquisition...")
            self._cleanup_partial_locks()

            if retry_count < max_retries:
                time.sleep(2)  # Wait for cleanup to complete
                return self.acquire(retry_count=retry_count + 1, max_retries=max_retries)
            else:
                print(f"[LOCK] [ERROR] Max retries ({max_retries}) exceeded after cleanup")
                return False
        elif not process_lock_result:
            print(f"[LOCK] [ERROR] Layer 2 FAILED - Process validation failed")
            self._cleanup_partial_locks()
            return False
        print(f"[LOCK] [OK] Layer 2 SUCCESS - Process lock acquired")

        # Layer 3: Network port lock (crash-resistant)
        if not self._acquire_port_lock():
            print(f"[LOCK] [ERROR] Layer 3 FAILED - Port lock failed")
            self._cleanup_partial_locks()
            return False
        print(f"[LOCK] [OK] Layer 3 SUCCESS - Port lock acquired")

        # Layer 4: Windows mutex (if available)
        if _WINDOWS_MUTEX_AVAILABLE:
            if not self._acquire_mutex():
                print(f"[LOCK] [ERROR] Layer 4 FAILED - Windows mutex failed")
                self._cleanup_partial_locks()
                return False
            print(f"[LOCK] [OK] Layer 4 SUCCESS - Windows mutex acquired")

        print(f"[LOCK] [SUCCESS] ALL LAYERS SUCCESS - Instance lock fully secured")
        return True

    def _acquire_legacy_file_lock(self) -> bool:
        """Legacy exclusive file lock for when filelock library unavailable"""
        try:
            # Clean up any stale locks first
            self._cleanup_stale_locks()

            # Atomic exclusive creation
            self.legacy_lock_handle = open(self.lock_file_path, 'x')
            json.dump(self.process_info, self.legacy_lock_handle, indent=2)
            self.legacy_lock_handle.flush()
            return True

        except FileExistsError:
            return False
        except Exception as e:
            print(f"[LOCK] Legacy file lock error: {e}")
            return False

    def _acquire_process_lock(self):
        """Enhanced process validation and PID file management with auto-kill for duplicates
        Returns: True if acquired, False if failed, "retry_needed" if duplicates were cleaned"""
        try:
            # Quick check for existing trading processes
            existing_processes = self._find_trading_processes()

            if existing_processes:
                # Found duplicates - kill them and signal retry needed
                print(f"[LOCK] Found {len(existing_processes)} duplicate process(es), cleaning up...")

                for proc in existing_processes:
                    try:
                        cmdline = proc.cmdline()
                        print(f"[LOCK] Killing PID {proc.pid}: {' '.join(cmdline[:3])}")
                        proc.terminate()
                        try:
                            proc.wait(timeout=2)
                            print(f"[LOCK] Killed PID {proc.pid}")
                        except psutil.TimeoutExpired:
                            proc.kill()  # Force kill if terminate times out
                            proc.wait(timeout=1)
                            print(f"[LOCK] Force killed PID {proc.pid}")
                    except psutil.NoSuchProcess:
                        print(f"[LOCK] PID {proc.pid} already gone")
                    except psutil.ZombieProcess:
                        print(f"[LOCK] PID {proc.pid} is zombie (already terminating)")
                    except psutil.AccessDenied:
                        print(f"[LOCK] Access denied killing PID {proc.pid} - may need manual cleanup")
                    except Exception as e:
                        print(f"[LOCK] Error killing PID {proc.pid}: {e}")

                # Signal that duplicates were cleaned and retry is needed
                print(f"[LOCK] Duplicate cleanup complete, will retry lock acquisition")
                return "retry_needed"

            # No duplicates found - proceed with PID file creation
            with open(self.pid_file_path, 'w') as f:
                json.dump(self.process_info, f, indent=2)

            return True

        except Exception as e:
            print(f"[LOCK] Process lock error: {e}")
            return False

    def _acquire_port_lock(self) -> bool:
        """Network port lock for crash resistance"""
        try:
            self.port_lock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.port_lock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.port_lock.bind(('127.0.0.1', self.lock_port))
            self.port_lock.listen(1)
            return True
        except OSError:
            if self.port_lock:
                try:
                    self.port_lock.close()
                except (OSError, socket.error):
                    pass  # Socket already closed or invalid
                self.port_lock = None
            return False

    def _acquire_mutex(self) -> bool:
        """Windows mutex lock"""
        try:
            mutex_name = f"Global\\{self.full_lock_id}"
            self.mutex_handle = kernel32.CreateMutexW(None, True, mutex_name)
            
            if not self.mutex_handle:
                return False

            error = kernel32.GetLastError()
            if error == ERROR_ALREADY_EXISTS:
                result = kernel32.WaitForSingleObject(self.mutex_handle, 100)
                if result == WAIT_TIMEOUT:
                    kernel32.CloseHandle(self.mutex_handle)
                    self.mutex_handle = None
                    return False
                elif result == WAIT_ABANDONED:
                    return True
                else:
                    kernel32.CloseHandle(self.mutex_handle)
                    self.mutex_handle = None
                    return False
            
            return True

        except Exception as e:
            print(f"[LOCK] Mutex error: {e}")
            if self.mutex_handle:
                kernel32.CloseHandle(self.mutex_handle)
                self.mutex_handle = None
            return False

    def _find_trading_processes(self) -> list:
        """Find any existing trading processes"""
        trading_processes = []
        current_pid = os.getpid()

        print(f"[LOCK] [DEBUG] Scanning for trading processes (current PID: {current_pid})...")

        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                proc_pid = proc.info['pid']

                if proc_pid == current_pid:
                    print(f"[LOCK] [DEBUG] Skipping current process PID {proc_pid}")
                    continue

                if 'python' not in proc.info['name'].lower():
                    continue

                cmdline = proc.info['cmdline']
                if not cmdline:
                    continue

                cmdline_str = ' '.join(cmdline).lower()
                trading_keywords = [
                    'start_live_trading',
                    'run_live',
                    'trading_engine',
                    'crypto-enhanced',
                    'kraken'
                ]

                if any(keyword in cmdline_str for keyword in trading_keywords):
                    print(f"[LOCK] [DEBUG] Found trading process PID {proc_pid}: {cmdline_str[:80]}")
                    trading_processes.append(proc)

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        print(f"[LOCK] [DEBUG] Scan complete. Found {len(trading_processes)} other trading process(es)")
        return trading_processes

    def _cleanup_stale_locks(self):
        """Clean up stale locks from dead processes"""
        try:
            # Check info file first for better diagnostic info
            info_path = Path(f"{self.lock_file_path}.info")
            if info_path.exists():
                try:
                    with open(info_path, 'r') as f:
                        data = json.load(f)
                    
                    old_pid = data.get('pid')
                    start_time = data.get('start_time', 0)
                    age_hours = (time.time() - start_time) / 3600
                    
                    if old_pid:
                        if not self._is_process_alive(old_pid):
                            info_path.unlink(missing_ok=True)
                            print(f"[LOCK] Cleaned up stale info file from dead PID {old_pid} (age: {age_hours:.1f}h)")
                        elif age_hours > 24:  # If lock is over 24 hours old, log warning
                            print(f"[LOCK] WARNING: Lock info file is {age_hours:.1f} hours old (PID: {old_pid})")
                except Exception as e:
                    print(f"[LOCK] Error reading lock info file: {e}")
                    # If file is corrupted, remove it
                    info_path.unlink(missing_ok=True)
            
            # Check lock file
            if self.lock_file_path.exists():
                # FileLock may not store json data, so we check the pid file for that
                if self.pid_file_path.exists():
                    with open(self.pid_file_path, 'r') as f:
                        data = json.load(f)
                    
                    old_pid = data.get('pid')
                    if old_pid and not self._is_process_alive(old_pid):
                        # Process is dead, attempt to remove both files
                        self.lock_file_path.unlink(missing_ok=True)
                        print(f"[LOCK] Cleaned up stale lock file from dead PID {old_pid}")

            # Check PID file separately
            if self.pid_file_path.exists():
                with open(self.pid_file_path, 'r') as f:
                    data = json.load(f)
                
                old_pid = data.get('pid')
                start_time = data.get('start_time', 0)
                age_hours = (time.time() - start_time) / 3600
                
                if old_pid:
                    if not self._is_process_alive(old_pid):
                        self.pid_file_path.unlink(missing_ok=True)
                        print(f"[LOCK] Cleaned up stale PID file from dead PID {old_pid} (age: {age_hours:.1f}h)")
                    elif age_hours > 24:  # If pid file is over 24 hours old, log warning
                        print(f"[LOCK] WARNING: PID file is {age_hours:.1f} hours old (PID: {old_pid})")

        except Exception as e:
            print(f"[LOCK] Error cleaning stale locks: {e}")

    def _is_process_alive(self, pid: int) -> bool:
        """Check if a process is still alive and is a trading process"""
        try:
            proc = psutil.Process(pid)
            
            # First check if process exists and is running
            if not proc.is_running():
                return False
                
            # Check if it's a Python process
            if 'python' not in proc.name().lower():
                return False
                
            # Try to check command line for trading keywords
            try:
                cmdline = proc.cmdline()
                cmdline_str = ' '.join(cmdline).lower()
                
                # Check if it's a trading script
                trading_keywords = [
                    'trading', 'crypto', 'kraken', 
                    'start_live_trading', 'run_live'
                ]
                
                # Only consider it alive if it's a trading process
                return any(keyword in cmdline_str for keyword in trading_keywords)
                
            except (psutil.AccessDenied, psutil.ZombieProcess):
                # If we can't access cmdline, assume it's running to be safe
                return True
                
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            return False

    def _cleanup_partial_locks(self):
        """Clean up any partially acquired locks"""
        # Modern filelock
        if self.file_lock:
            try:
                self.file_lock.release()
                print(f"[LOCK] Released partial filelock")
            except Exception as e:
                print(f"[LOCK] Error releasing partial filelock: {e}")
            self.file_lock = None

        # Remove lock info file if it exists
        try:
            info_path = Path(f"{self.lock_file_path}.info")
            if info_path.exists():
                info_path.unlink()
                print(f"[LOCK] Removed partial lock info file")
        except Exception as e:
            print(f"[LOCK] Error removing lock info file: {e}")

        # Legacy file lock
        if self.legacy_lock_handle:
            try:
                self.legacy_lock_handle.close()
                print(f"[LOCK] Closed partial legacy file handle")
            except Exception as e:
                print(f"[LOCK] Error closing partial legacy file handle: {e}")
            
            try:
                if self.lock_file_path.exists():
                    self.lock_file_path.unlink()
                    print(f"[LOCK] Removed partial lock file")
            except Exception as e:
                print(f"[LOCK] Error removing partial lock file: {e}")
                
            self.legacy_lock_handle = None

        # PID file
        try:
            if self.pid_file_path.exists():
                self.pid_file_path.unlink()
                print(f"[LOCK] Removed partial PID file")
        except Exception as e:
            print(f"[LOCK] Error removing partial PID file: {e}")

        # Port lock
        if self.port_lock:
            try:
                self.port_lock.close()
                print(f"[LOCK] Released partial port lock")
            except Exception as e:
                print(f"[LOCK] Error releasing partial port lock: {e}")
            self.port_lock = None

        # Windows mutex
        if self.mutex_handle:
            try:
                kernel32.CloseHandle(self.mutex_handle)
                print(f"[LOCK] Released partial Windows mutex")
            except Exception as e:
                print(f"[LOCK] Error releasing partial Windows mutex: {e}")
            self.mutex_handle = None

    def release(self):
        """Release all locks"""
        print(f"[LOCK] Releasing all locks for {self.app_id}")
        release_success = True

        # Modern filelock
        if self.file_lock:
            try:
                self.file_lock.release()
                print(f"[LOCK] [OK] Modern filelock released")
            except Exception as e:
                print(f"[LOCK] [ERROR] Error releasing filelock: {e}")
                release_success = False
            self.file_lock = None

        # Lock info file
        try:
            info_path = Path(f"{self.lock_file_path}.info")
            if info_path.exists():
                info_path.unlink()
                print(f"[LOCK] [OK] Lock info file removed")
        except Exception as e:
            print(f"[LOCK] [ERROR] Error removing lock info file: {e}")
            release_success = False

        # Legacy file lock
        if self.legacy_lock_handle:
            try:
                self.legacy_lock_handle.close()
                print(f"[LOCK] [OK] Legacy file handle closed")
            except Exception as e:
                print(f"[LOCK] [ERROR] Error closing legacy file handle: {e}")
                release_success = False
            self.legacy_lock_handle = None

            try:
                if self.lock_file_path.exists():
                    self.lock_file_path.unlink()
                    print(f"[LOCK] [OK] Legacy file lock removed")
            except Exception as e:
                print(f"[LOCK] [ERROR] Error removing legacy lock file: {e}")
                release_success = False

        # PID file
        try:
            if self.pid_file_path.exists():
                self.pid_file_path.unlink()
                print(f"[LOCK] [OK] PID file removed")
        except Exception as e:
            print(f"[LOCK] [ERROR] Error removing PID file: {e}")
            release_success = False

        # Port lock
        if self.port_lock:
            try:
                self.port_lock.close()
                print(f"[LOCK] [OK] Port lock released")
            except Exception as e:
                print(f"[LOCK] [ERROR] Error releasing port lock: {e}")
                release_success = False
            self.port_lock = None

        # Windows mutex
        if self.mutex_handle:
            try:
                kernel32.CloseHandle(self.mutex_handle)
                print(f"[LOCK] [OK] Windows mutex released")
            except Exception as e:
                print(f"[LOCK] [ERROR] Error releasing mutex: {e}")
                release_success = False
            self.mutex_handle = None

        if release_success:
            print(f"[LOCK] [SUCCESS] All locks released successfully")
        else:
            print(f"[LOCK] [WARNING] Some locks may not have been properly released")

    def __enter__(self):
        """Context manager entry"""
        if not self.acquire():
            print(f"\n{'='*80}")
            print(f"[CRITICAL] ANOTHER TRADING INSTANCE IS RUNNING")
            print(f"{'='*80}")
            print(f"Application: {self.app_id}")
            print(f"Cannot start multiple instances due to:")
            print(f"  - Kraken API rate limits (15-20 calls/sec max)")
            print(f"  - WebSocket connection limits (150/10min)")
            print(f"  - Nonce conflicts and trading interference")
            print(f"  - Risk management system corruption")
            print(f"\n[SOLUTIONS]:")
            print(f"  1. Kill existing instances: tasklist | findstr python")
            print(f"  2. Check for stale processes: Get-Process python")
            print(f"  3. Wait for current session to complete")
            print(f"  4. Check lock files in: {tempfile.gettempdir()}")
            print(f"{'='*80}")
            sys.exit(1)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with enhanced error handling"""
        try:
            self.release()
        except Exception as e:
            print(f"[LOCK] [CRITICAL] Error in lock release during context exit: {e}")
            # We still need to clean up even if release fails
            self._cleanup_partial_locks()


# Factory function for easy migration
def InstanceLock(**kwargs) -> InstanceLockFixed:
    """
    Factory function for backward compatibility
    Returns the fixed version of InstanceLock
    """
    return InstanceLockFixed(**kwargs)
