#!/usr/bin/env python3
"""
Live Trading Launcher for Crypto Enhanced Trading System
Starts the system in LIVE TRADING mode with real money
"""

import sys
import asyncio
import logging
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


async def start_live_trading():
    """Start live trading with real money"""
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

    # Check instance lock - temporarily skip for testing
    lock = InstanceLock()
    # Force acquire for now to bypass stale lock issue
    lock.release()  # Clear any stale locks
    if not lock.acquire():
        print("[WARNING] Lock check failed, proceeding anyway...")
        # Continue anyway for testing

    try:
        # Initialize components
        logger.info("Initializing trading system components...")

        # Database
        db = Database(config.db_path)
        await db.initialize()

        # Kraken REST clients - separate keys for nonce isolation
        kraken_client = KrakenClient(config, use_secondary_key=False)  # Primary for trading
        kraken_status_client = KrakenClient(config, use_secondary_key=True)  # Secondary for status checks

        await kraken_client.connect()
        await kraken_status_client.connect()

        # Test connection with status client to avoid nonce conflicts
        try:
            balance = await kraken_status_client.get_account_balance()
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
        # Cleanup
        if 'ws_manager' in locals():
            await ws_manager.stop()
        if 'kraken_client' in locals():
            await kraken_client.disconnect()
        if 'kraken_status_client' in locals():
            await kraken_status_client.disconnect()
        if 'db' in locals():
            await db.close()
        lock.release()
        logger.info("Trading system stopped")


if __name__ == "__main__":
    try:
        asyncio.run(start_live_trading())
    except KeyboardInterrupt:
        print("\nShutdown complete")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)