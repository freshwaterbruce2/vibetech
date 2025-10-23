"""
Test WebSocket connections to diagnose connectivity issues
Run this to verify your WebSocket setup works before starting live trading
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import Config
from kraken_client import KrakenClient
from websocket_manager import WebSocketManager

# Set up detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_network_connectivity():
    """Test basic network connectivity to Kraken"""
    import aiohttp
    import socket
    
    logger.info("=== Testing Network Connectivity ===")
    
    try:
        # Test HTTP connection to Kraken
        async with aiohttp.ClientSession() as session:
            async with session.get('https://api.kraken.com/0/public/Time', timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"✅ Kraken API reachable (server time: {data.get('result', {}).get('unixtime')})")
                else:
                    logger.error(f"❌ Kraken API returned status {resp.status}")
                    return False
    except Exception as e:
        logger.error(f"❌ Cannot reach Kraken API: {e}")
        return False
    
    # Test DNS resolution for WebSocket endpoints
    endpoints = [
        ("ws.kraken.com", "Public WebSocket"),
        ("ws-auth.kraken.com", "Private WebSocket")
    ]
    
    for host, description in endpoints:
        try:
            ip = socket.gethostbyname(host)
            logger.info(f"✅ DNS resolved {description} ({host}) -> {ip}")
        except socket.gaierror as e:
            logger.error(f"❌ DNS resolution failed for {host}: {e}")
            return False
    
    return True


async def test_websocket_public():
    """Test public WebSocket connection only"""
    logger.info("\n=== Testing Public WebSocket ===")
    
    config = Config()
    ws_manager = WebSocketManager(config)
    
    # Track if we received any messages
    messages_received = []
    
    def ticker_callback(data):
        messages_received.append(('ticker', data))
        logger.info(f"✅ Received ticker data: {data.get('data', [{}])[0].get('symbol') if data.get('data') else 'unknown'}")
    
    ws_manager.register_callback('ticker', ticker_callback)
    
    try:
        # Start WebSocket in background
        ws_task = asyncio.create_task(ws_manager.start())
        
        # Wait up to 60 seconds for connection and data
        logger.info("Waiting for WebSocket connection and data (max 60s)...")
        await asyncio.sleep(60)
        
        # Check results
        if ws_manager.is_connected():
            logger.info(f"✅ Public WebSocket connected successfully")
            if messages_received:
                logger.info(f"✅ Received {len(messages_received)} messages")
                return True
            else:
                logger.warning("⚠️  Connected but no messages received yet (may need more time)")
                return True
        else:
            logger.error("❌ Public WebSocket failed to connect")
            return False
            
    except Exception as e:
        logger.error(f"❌ Public WebSocket test failed: {e}", exc_info=True)
        return False
    finally:
        await ws_manager.stop()


async def test_websocket_private():
    """Test private (authenticated) WebSocket connection"""
    logger.info("\n=== Testing Private WebSocket ===")
    
    config = Config()
    
    # Check if credentials are configured
    if not config.kraken_api_key or not config.kraken_api_secret:
        logger.warning("⚠️  API credentials not configured, skipping private WebSocket test")
        return None
    
    kraken_client = KrakenClient(config)
    ws_manager = WebSocketManager(config, kraken_client)
    
    # Track messages
    messages_received = []
    
    def execution_callback(data):
        messages_received.append(('execution', data))
        logger.info(f"✅ Received execution update")
    
    def balance_callback(data):
        messages_received.append(('balance', data))
        logger.info(f"✅ Received balance update")
    
    ws_manager.register_callback('execution', execution_callback)
    ws_manager.register_callback('balance', balance_callback)
    
    try:
        # Start WebSocket in background
        ws_task = asyncio.create_task(ws_manager.start())
        
        # Wait up to 60 seconds for connection
        logger.info("Waiting for private WebSocket connection (max 60s)...")
        await asyncio.sleep(60)
        
        # Check results
        if ws_manager.private_ws:
            logger.info(f"✅ Private WebSocket connected successfully")
            if messages_received:
                logger.info(f"✅ Received {len(messages_received)} private messages")
            return True
        else:
            logger.error("❌ Private WebSocket failed to connect")
            return False
            
    except Exception as e:
        logger.error(f"❌ Private WebSocket test failed: {e}", exc_info=True)
        return False
    finally:
        await ws_manager.stop()
        await kraken_client.close()


async def main():
    """Run all connectivity tests"""
    logger.info("=" * 60)
    logger.info("KRAKEN WEBSOCKET CONNECTION TEST")
    logger.info("=" * 60)
    
    # Test 1: Network connectivity
    network_ok = await test_network_connectivity()
    if not network_ok:
        logger.error("\n❌ FAILED: Network connectivity issues detected")
        logger.error("   Check your internet connection, firewall, or proxy settings")
        return
    
    # Test 2: Public WebSocket
    public_ok = await test_websocket_public()
    if not public_ok:
        logger.error("\n❌ FAILED: Public WebSocket connection failed")
        logger.error("   This prevents receiving market data")
        return
    
    # Test 3: Private WebSocket (if credentials available)
    private_ok = await test_websocket_private()
    if private_ok is False:
        logger.error("\n❌ FAILED: Private WebSocket connection failed")
        logger.error("   This prevents receiving order/balance updates")
    elif private_ok is None:
        logger.info("\n⚠️  SKIPPED: Private WebSocket test (no credentials)")
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Network Connectivity: {'✅ PASS' if network_ok else '❌ FAIL'}")
    logger.info(f"Public WebSocket: {'✅ PASS' if public_ok else '❌ FAIL'}")
    if private_ok is not None:
        logger.info(f"Private WebSocket: {'✅ PASS' if private_ok else '❌ FAIL'}")
    else:
        logger.info(f"Private WebSocket: ⚠️  SKIPPED")
    
    if network_ok and public_ok and (private_ok or private_ok is None):
        logger.info("\n✅ ALL TESTS PASSED - WebSocket connections are working!")
    else:
        logger.error("\n❌ SOME TESTS FAILED - Review errors above")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nTest interrupted by user")
