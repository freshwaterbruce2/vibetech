#!/usr/bin/env python3
"""
Auto-launch trading system without confirmation (for automation)
"""
import sys
import os
import asyncio
import logging
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from instance_lock import InstanceLock
from kraken_client import KrakenClient
from websocket_manager import WebSocketManager
from trading_engine import TradingEngine
from database import Database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'trading_new.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


async def start_trading():
    """Start trading without confirmation"""

    print("="*60)
    print("CRYPTO ENHANCED TRADING SYSTEM - AUTO LAUNCH")
    print("="*60)

    # Load configuration
    config = Config()

    print("\nConfiguration:")
    print(f"  Trading Pairs: {config.trading_pairs}")
    print(f"  Max Position: ${config.max_position_size}")
    print(f"  Max Exposure: ${config.max_total_exposure}")
    print("="*60)
    print("\n[AUTO] Starting live trading system...")

    # Acquire instance lock to ensure single instance
    lock = InstanceLock(timeout=30.0)
    if not lock.acquire():
        logger.error("Another instance is already running!")
        print("Error: Another instance is running. Exiting.")
        return

    try:
        # Initialize components
        logger.info("Initializing trading system components...")

        kraken_client = KrakenClient(config)
        db = Database('trading.db')
        await db.initialize()

        ws_manager = WebSocketManager(config, kraken_client)

        engine = TradingEngine(
            kraken_client=kraken_client,
            websocket_manager=ws_manager,
            database=db,
            config=config
        )

        logger.info("="*60)
        logger.info("LIVE TRADING STARTED - REFACTORED ENGINE")
        logger.info("="*60)

        # Start WebSocket manager as background task
        ws_task = asyncio.create_task(ws_manager.start())

        # Start trading engine (blocking)
        await engine.run()

    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
    finally:
        # Cleanup
        logger.info("Shutting down...")
        if 'engine' in locals():
            await engine.stop()
        if 'ws_task' in locals() and not ws_task.done():
            ws_task.cancel()
            try:
                await ws_task
            except asyncio.CancelledError:
                pass
        if 'ws_manager' in locals():
            await ws_manager.stop()
        if 'kraken_client' in locals():
            await kraken_client.disconnect()
        if 'db' in locals():
            await db.close()
        lock.release()
        logger.info("Shutdown complete")


if __name__ == "__main__":
    try:
        asyncio.run(start_trading())
    except KeyboardInterrupt:
        print("\nShutdown complete")
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)
