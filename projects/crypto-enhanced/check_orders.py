#!/usr/bin/env python3
"""Check current orders and positions"""

import asyncio
from kraken_client import KrakenClient
from config import Config
import json

async def check_orders():
    config = Config()
    client = KrakenClient(config)

    try:
        await client.connect()

        # Get open orders
        open_orders = await client.get_open_orders()
        print("Open Orders:")
        print(json.dumps(open_orders, indent=2))

        # Get closed orders
        closed_orders = await client.get_closed_orders()
        if closed_orders:
            print("\nRecent Closed Orders (last 5):")
            # Show only first 5 if many
            count = 0
            for order_id, order_data in closed_orders.items():
                if count >= 5:
                    break
                print(f"\nOrder {order_id}:")
                print(f"  Pair: {order_data.get('descr', {}).get('pair')}")
                print(f"  Type: {order_data.get('descr', {}).get('type')}")
                print(f"  Order: {order_data.get('descr', {}).get('order')}")
                print(f"  Status: {order_data.get('status')}")
                print(f"  Volume: {order_data.get('vol')}")
                print(f"  Price: {order_data.get('price')}")
                count += 1

        # Get positions
        positions = await client.get_open_positions()
        print("\nOpen Positions:")
        print(json.dumps(positions, indent=2))

    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(check_orders())