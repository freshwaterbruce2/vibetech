"""
Test Kraken API connection with fixed nonce values
"""
import asyncio
import sys
from config import Config
from kraken_client import KrakenClient

async def test_connection():
    """Test basic API connectivity"""
    print("=" * 60)
    print("TESTING KRAKEN API CONNECTION")
    print("=" * 60)
    
    config = Config()
    
    print(f"\n1. Loaded config")
    print(f"   API Key: {config.kraken_api_key[:8]}...")
    
    async with KrakenClient(config) as client:
        print(f"\n2. KrakenClient initialized")
        print(f"   Using nonce manager: {client.nonce_manager.storage_path}")
        print(f"   Current nonce: {client.nonce_manager.last_nonce}")
        
        # Test 1: System Status (public endpoint)
        print(f"\n3. Testing public endpoint (SystemStatus)...")
        try:
            status = await client.get_system_status()
            print(f"   ✅ SUCCESS: {status}")
        except Exception as e:
            print(f"   ❌ FAILED: {e}")
            return False
        
        # Test 2: Account Balance (private endpoint - requires nonce)
        print(f"\n4. Testing private endpoint (Balance)...")
        try:
            balance = await client.get_account_balance()
            print(f"   ✅ SUCCESS!")
            print(f"   Account Balance:")
            for currency, amount in balance.items():
                if float(amount) > 0:
                    print(f"      {currency}: {amount}")
            return True
        except Exception as e:
            print(f"   ❌ FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    try:
        success = asyncio.run(test_connection())
        print("\n" + "=" * 60)
        if success:
            print("✅ CONNECTION TEST PASSED - NONCE FIX WORKING!")
        else:
            print("❌ CONNECTION TEST FAILED - NONCE ISSUE PERSISTS")
        print("=" * 60)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
