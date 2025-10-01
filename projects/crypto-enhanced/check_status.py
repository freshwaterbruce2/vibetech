"""
Check current open orders and positions
"""
import asyncio
import logging
from config import Config
from kraken_client import KrakenClient
import json

logging.basicConfig(level=logging.INFO)

async def check_status():
    config = Config()
    
    # Use secondary API key for status checks to avoid nonce conflicts
    async with KrakenClient(config, use_secondary_key=True) as kraken:
        print("\n" + "="*60)
        print("CURRENT TRADING STATUS")
        print("="*60 + "\n")
        
        # Get open orders
        print("[*] Checking open orders...")
        orders = await kraken.get_open_orders()
        
        if orders and 'open' in orders:
            print(f"\n[+] Found {len(orders['open'])} open order(s):")
            for order_id, order in orders['open'].items():
                descr = order.get('descr', {})
                print(f"\n  Order ID: {order_id}")
                print(f"  Pair: {descr.get('pair')}")
                print(f"  Type: {descr.get('type')}")
                print(f"  Order Type: {descr.get('ordertype')}")
                print(f"  Price: {descr.get('price')}")
                print(f"  Volume: {order.get('vol')}")
                print(f"  Status: {order.get('status')}")
        else:
            print("[+] No open orders")
        
        # Get balance
        print("\n[*] Account Balance:")
        balance = await kraken.get_account_balance()
        for asset, amount in balance.items():
            if float(amount) > 0:
                print(f"  {asset}: {amount}")

if __name__ == "__main__":
    asyncio.run(check_status())
