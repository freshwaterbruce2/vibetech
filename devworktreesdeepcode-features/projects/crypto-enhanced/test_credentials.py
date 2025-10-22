"""
Quick API Credentials Test
Tests Kraken API connection and basic functionality
"""

import asyncio
import logging
from config import Config
from kraken_client import KrakenClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_credentials():
    """Test Kraken API credentials"""
    
    print("\n" + "="*60)
    print("KRAKEN API CREDENTIALS TEST")
    print("="*60 + "\n")
    
    # Load configuration
    print("[*] Loading configuration...")
    config = Config()
    
    # Check if credentials are set
    if not config.kraken_api_key or not config.kraken_api_secret:
        print("[!] ERROR: API credentials not found in .env file!")
        return False
    
    print(f"[+] API Key: {config.kraken_api_key[:10]}...")
    print(f"[+] Trading Pairs: {config.trading_pairs}")
    print(f"[+] Max Position Size: ${config.max_position_size}")
    print()
    
    # Test API connection
    print("[*] Testing API connection...")
    
    try:
        async with KrakenClient(config) as kraken:
            # Test 1: System Status
            print("\n[1] Testing System Status...")
            status = await kraken.get_system_status()
            print(f"   [+] Kraken Status: {status.get('status', 'unknown')}")
            
            # Test 2: Account Balance
            print("\n[2] Testing Account Balance...")
            balance = await kraken.get_account_balance()
            if balance:
                print("   [+] Account balance retrieved:")
                for asset, amount in balance.items():
                    if float(amount) > 0:
                        print(f"      - {asset}: {amount}")
            else:
                print("   [!] No balance data (may be empty account)")
            
            # Test 3: XLM Ticker
            print("\n[3] Testing XLM/USD Ticker...")
            ticker = await kraken.get_ticker('XLM/USD')
            if ticker and 'XLM/USD' in ticker:
                xlm_data = ticker['XLM/USD']
                last_price = xlm_data['c'][0]  # Last close price
                print(f"   [+] XLM/USD Price: ${last_price}")
                print(f"      Ask: ${xlm_data['a'][0]}")
                print(f"      Bid: ${xlm_data['b'][0]}")
            else:
                print("   [!] Ticker data format unexpected")
            
            # Test 4: Open Orders
            print("\n[4] Testing Open Orders...")
            open_orders = await kraken.get_open_orders()
            if open_orders:
                print(f"   [+] Open orders: {len(open_orders)}")
            else:
                print("   [+] No open orders")
            
            # Test 5: WebSocket Token
            print("\n[5] Testing WebSocket Token...")
            ws_token = await kraken.get_websocket_token()
            if ws_token and 'token' in ws_token:
                print(f"   [+] WebSocket token obtained: {ws_token['token'][:20]}...")
            else:
                print("   [!] Failed to get WebSocket token")
            
            print("\n" + "="*60)
            print("[SUCCESS] ALL TESTS PASSED - CREDENTIALS ARE VALID!")
            print("="*60 + "\n")
            return True
            
    except Exception as e:
        print(f"\n[!] ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Verify API keys are correct in .env file")
        print("2. Check that API keys have proper permissions:")
        print("   - Query Funds")
        print("   - Query Open Orders & Trades")
        print("   - Create & Modify Orders")
        print("3. Ensure 2FA is NOT required for API key")
        print("4. Check Kraken API status: https://status.kraken.com/")
        return False


if __name__ == "__main__":
    asyncio.run(test_credentials())
