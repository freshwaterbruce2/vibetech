import asyncio
import sys
from config import Config
from kraken_client import KrakenClient

async def test():
    print("Testing Kraken API Connection")
    print("=" * 50)
    
    config = Config()
    print(f"API Key loaded: {config.kraken_api_key[:8]}...")
    
    client = KrakenClient(config)
    await client.connect()
    
    try:
        print("Current nonce:", client.nonce_manager.last_nonce)
        
        print("\nTest 1: System Status (public)")
        status = await client.get_system_status()
        print(f"SUCCESS: {status}")
        
        print("\nTest 2: Account Balance (private - needs nonce)")
        balance = await client.get_account_balance()
        print("SUCCESS!")
        print("Balance:")
        for curr, amt in balance.items():
            if float(amt) > 0:
                print(f"  {curr}: {amt}")
        
        print("\n" + "=" * 50)
        print("ALL TESTS PASSED - NONCE FIX WORKING!")
        return True
        
    except Exception as e:
        print(f"\nFAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await client.disconnect()

if __name__ == "__main__":
    success = asyncio.run(test())
    sys.exit(0 if success else 1)
