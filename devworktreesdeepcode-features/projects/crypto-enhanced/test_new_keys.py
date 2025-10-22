#!/usr/bin/env python3
"""
Simple test script for new Kraken API keys
Tests both public and private endpoints
"""

import asyncio
import time
import hashlib
import hmac
import base64
import urllib.parse
import aiohttp
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv('KRAKEN_API_KEY')
API_SECRET = os.getenv('KRAKEN_API_SECRET')

print(f"API Key loaded: {API_KEY[:10]}..." if API_KEY else "No API key found")
print(f"API Secret loaded: {API_SECRET[:10]}..." if API_SECRET else "No API secret found")


async def test_public_endpoint():
    """Test public endpoint - no auth required"""
    print("\n=== Testing Public Endpoint ===")

    async with aiohttp.ClientSession() as session:
        url = "https://api.kraken.com/0/public/SystemStatus"
        async with session.get(url) as response:
            result = await response.json()
            if result.get('error'):
                print(f"Error: {result['error']}")
            else:
                print(f"System Status: {result.get('result', {}).get('status', 'unknown')}")
                print("Public endpoint: OK")
            return not result.get('error')


async def test_private_endpoint():
    """Test private endpoint with different nonce strategies"""
    print("\n=== Testing Private Endpoint ===")

    if not API_KEY or not API_SECRET:
        print("ERROR: API keys not found in .env file")
        return False

    # Try different nonce strategies
    strategies = [
        ("Current timestamp ms", lambda: str(int(time.time() * 1000))),
        ("Current timestamp us", lambda: str(int(time.time() * 1000000))),
        ("Current timestamp ns", lambda: str(int(time.time() * 1000000000))),
    ]

    for strategy_name, nonce_func in strategies:
        print(f"\nTrying nonce strategy: {strategy_name}")

        nonce = nonce_func()
        print(f"Nonce: {nonce}")

        # Prepare request
        endpoint = "/0/private/Balance"
        data = {'nonce': nonce}
        postdata = urllib.parse.urlencode(data)

        # Create signature
        encoded = (str(data['nonce']) + postdata).encode()
        message = endpoint.encode() + hashlib.sha256(encoded).digest()
        signature = hmac.new(
            base64.b64decode(API_SECRET),
            message,
            hashlib.sha512
        )
        sigdigest = base64.b64encode(signature.digest()).decode()

        headers = {
            'API-Key': API_KEY,
            'API-Sign': sigdigest
        }

        # Make request
        async with aiohttp.ClientSession() as session:
            url = f"https://api.kraken.com{endpoint}"
            async with session.post(url, data=data, headers=headers) as response:
                result = await response.json()

                if result.get('error'):
                    print(f"Error: {result['error']}")
                    if 'nonce' in str(result['error']).lower():
                        continue  # Try next strategy
                else:
                    print(f"Success! Balance data received")
                    print(f"Number of assets: {len(result.get('result', {}))}")

                    # Show USD balance if available
                    balances = result.get('result', {})
                    if 'ZUSD' in balances:
                        print(f"USD Balance: ${balances['ZUSD']}")
                    else:
                        print("No USD balance found")

                    print(f"\nWorking nonce strategy: {strategy_name}")
                    return True

        # Small delay between attempts
        await asyncio.sleep(1)

    print("\nAll nonce strategies failed")
    return False


async def main():
    """Run all tests"""
    print("="*60)
    print("KRAKEN API KEY TEST")
    print("="*60)

    # Test public endpoint
    public_ok = await test_public_endpoint()

    # Test private endpoint
    private_ok = await test_private_endpoint()

    print("\n" + "="*60)
    print("TEST RESULTS:")
    print(f"Public API: {'✓ PASS' if public_ok else '✗ FAIL'}")
    print(f"Private API: {'✓ PASS' if private_ok else '✗ FAIL'}")

    if private_ok:
        print("\nAPI keys are working! The system should be able to trade.")
    else:
        print("\nAPI keys are not working. Please check:")
        print("1. Keys are correctly copied to .env file")
        print("2. Keys have trade permissions enabled on Kraken")
        print("3. Keys are activated (may take a few minutes after creation)")
        print("4. No extra spaces or characters in the keys")

    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())