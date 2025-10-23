"""Quick balance check"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from ultra_simple_bot import UltraSimpleBot

async def check():
    print("="*60)
    print("BALANCE CHECK")
    print("="*60)
    
    bot = UltraSimpleBot()
    
    print(f"\nAPI Key: {bot.api_key[:20]}...")
    print(f"API Secret: {bot.api_secret[:20]}...")
    
    print("\nFetching balance...")
    usd, xlm = await bot.get_balance()
    
    print(f"\nUSD: ${usd:.2f}")
    print(f"XLM: {xlm:.2f}")
    
    if usd == 0 and xlm == 0:
        print("\n⚠️ ZERO BALANCE DETECTED!")
        print("\nPossible causes:")
        print("1. Wrong API keys")
        print("2. Different Kraken account")
        print("3. API permissions issue")
        print("\nTrying to get price to test API connection...")
        
        price = await bot.get_price()
        if price:
            print(f"\n✅ API connection works! XLM Price: ${price:.4f}")
            print("⚠️ But your account has $0 balance")
        else:
            print("\n❌ API connection failed!")

asyncio.run(check())
