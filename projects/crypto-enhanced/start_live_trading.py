#!/usr/bin/env python3
"""
Live Trading Launcher for Crypto Enhanced Trading System
Starts the system in LIVE TRADING mode with real money
"""

import sys
import os
import asyncio
import logging
import psutil
from pathlib import Path
from datetime import datetime

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from instance_lock import InstanceLock
from kraken_client import KrakenClient
from websocket_manager import WebSocketManager
from trading_engine import TradingEngine
from database import Database

# Configure logging for live trading
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'trading_new.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def check_and_kill_duplicates():
    """Check for duplicate trading instances and auto-kill them"""
    current_pid = os.getpid()
    trading_processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['pid'] == current_pid:
                continue

            if 'python' not in proc.info['name'].lower():
                continue

            cmdline = proc.info['cmdline']
            if not cmdline:
                continue

            cmdline_str = ' '.join(cmdline).lower()
            if any(keyword in cmdline_str for keyword in ['start_live_trading', 'trading_engine', 'crypto-enhanced']):
                trading_processes.append(proc)

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    if trading_processes:
        print("="*60)
        print("[CRITICAL] DUPLICATE INSTANCES DETECTED!")
        print("="*60)
        print(f"Found {len(trading_processes)} other trading process(es):")
        for proc in trading_processes:
            try:
                print(f"  [PID {proc.pid}] {' '.join(proc.cmdline())}")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                print(f"  [PID {proc.pid}] [access denied]")

        print("\n[AUTO-KILL] Terminating duplicate instances...")
        for proc in trading_processes:
            try:
                proc.terminate()
                proc.wait(timeout=5)
                print(f"  [KILLED] PID {proc.pid}")
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                try:
                    proc.kill()
                    print(f"  [FORCE KILLED] PID {proc.pid}")
                except:
                    print(f"  [ERROR] Could not kill PID {proc.pid}")

        print("[OK] Duplicate instances terminated")
        print("="*60)


async def start_live_trading():
    """Start live trading with real money"""
    # CRITICAL: Check and kill duplicates before anything else
    check_and_kill_duplicates()

    print("="*60)
    print("CRYPTO ENHANCED TRADING SYSTEM - LIVE TRADING MODE")
    print("="*60)
    print("[WARNING] This will execute REAL trades with REAL money!")
    print("="*60)

    # Load and validate configuration
    config = Config()

    print("\nConfiguration Summary:")
    print(f"  Trading Pairs: {config.trading_pairs}")
    print(f"  Max Position Size: ${config.max_position_size}")
    print(f"  Max Total Exposure: ${config.max_total_exposure}")
    print(f"  Max Positions: {config.max_positions}")
    print("="*60)

    # Confirmation prompt
    confirm = input("\nType 'YES' to start LIVE TRADING: ")
    if confirm.strip().upper() != 'YES':
        print("Live trading cancelled.")
        return

    # Check instance lock with proper error handling
    lock = InstanceLock()
    if not lock.acquire():
        logger.error("Another instance is already running!")
        logger.error("If you're sure no other instance is running:")
        logger.error("  1. Check for zombie processes: Get-Process python | Where-Object {$_.CommandLine -like '*start_live_trading*'}")
        logger.error("  2. Remove stale lock: Remove-Item trading_instance.lock")
        print("\n[ERROR] Cannot start - another instance detected")
        return

    logger.info("Instance lock acquired successfully")

    # Initialize component references for cleanup
    engine = None
    ws_manager = None
    kraken_client = None
    db = None

    try:
        # Initialize components
        logger.info("Initializing trading system components...")

        # Database
        db = Database(config.db_path)
        await db.initialize()

        # Kraken REST client - single client for all operations
        kraken_client = KrakenClient(config, use_secondary_key=False)
        await kraken_client.connect()

        # Test connection
        try:
            balance = await kraken_client.get_account_balance()
            logger.info(f"Connected to Kraken. Account has {len(balance)} assets")

            # Show USD balance if available
            if 'ZUSD' in balance:
                logger.info(f"USD Balance: ${balance['ZUSD']}")
        except Exception as e:
            logger.warning(f"Status check failed: {e}")
            logger.info("Continuing with WebSocket-only mode...")

        # WebSocket manager
        ws_manager = WebSocketManager(config, kraken_client)

        # Trading engine
        engine = TradingEngine(
            kraken_client=kraken_client,
            websocket_manager=ws_manager,
            database=db,
            config=config
        )

        # Start components
        logger.info("Starting WebSocket manager...")
        ws_task = asyncio.create_task(ws_manager.start())

        logger.info("Starting trading engine...")
        engine_task = asyncio.create_task(engine.run())

        logger.info("="*60)
        logger.info("LIVE TRADING SYSTEM IS RUNNING")
        logger.info("Press Ctrl+C to stop")
        logger.info("="*60)

        # Run until interrupted
        await asyncio.gather(ws_task, engine_task)

    except KeyboardInterrupt:
        logger.info("Shutting down trading system...")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
    finally:
        # CRITICAL: Cleanup in correct order to prevent orphaned orders
        logger.info("="*60)
        logger.info("SHUTDOWN SEQUENCE INITIATED")
        logger.info("="*60)
        
        # 1. FIRST: Stop trading engine (cancels all orders)
        if engine and engine.is_running():
            logger.info("[1/4] Stopping trading engine and cancelling orders...")
            try:
                await asyncio.wait_for(engine.stop(), timeout=10.0)
                logger.info("[OK] Trading engine stopped successfully")
            except asyncio.TimeoutError:
                logger.error("[ERROR] Trading engine stop timeout - may have orphaned orders")
            except Exception as e:
                logger.error(f"[ERROR] Error stopping trading engine: {e}")
        
        # 2. SECOND: Stop WebSocket manager
        if ws_manager:
            logger.info("[2/4] Stopping WebSocket manager...")
            try:
                await asyncio.wait_for(ws_manager.stop(), timeout=5.0)
                logger.info("[OK] WebSocket manager stopped")
            except asyncio.TimeoutError:
                logger.error("[ERROR] WebSocket stop timeout")
            except Exception as e:
                logger.error(f"[ERROR] Error stopping WebSocket: {e}")
        
        # 3. THIRD: Disconnect Kraken client
        if kraken_client:
            logger.info("[3/4] Disconnecting Kraken client...")
            try:
                await asyncio.wait_for(kraken_client.disconnect(), timeout=3.0)
                logger.info("[OK] Kraken client disconnected")
            except asyncio.TimeoutError:
                logger.error("[ERROR] Kraken disconnect timeout")
            except Exception as e:
                logger.error(f"[ERROR] Error disconnecting Kraken: {e}")
        
        # 4. FOURTH: Close database
        if db:
            logger.info("[4/4] Closing database...")
            try:
                await db.close()
                logger.info("[OK] Database closed")
            except Exception as e:
                logger.error(f"[ERROR] Error closing database: {e}")
        
        # Release instance lock
        lock.release()
        logger.info("="*60)
        logger.info("SHUTDOWN COMPLETE")
        logger.info("="*60)


if __name__ == "__main__":
    try:
        asyncio.run(start_live_trading())
    except KeyboardInterrupt:
        print("\nShutdown complete")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)
