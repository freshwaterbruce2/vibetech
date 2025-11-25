#!/usr/bin/env python3
"""
Quick price check for XLM/USD
"""
import asyncio
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from kraken_client import KrakenClient

async def check_price():
    """Check current XLM price and strategy thresholds"""
    config = Config()
    client = KrakenClient(config)

    try:
        await client.connect()

        # Get ticker data
        ticker = await client.get_ticker("XLM/USD")

        if ticker and 'XXLMZUSD' in ticker:
            xlm_data = ticker['XXLMZUSD']
            current_price = float(xlm_data['c'][0])  # Current price
            bid = float(xlm_data['b'][0])  # Best bid
            ask = float(xlm_data['a'][0])  # Best ask

            print(f"Current XLM/USD Market Data:")
            print(f"  Current Price: ${current_price:.6f}")
            print(f"  Bid: ${bid:.6f}")
            print(f"  Ask: ${ask:.6f}")
            print(f"  Spread: ${(ask - bid):.6f} ({((ask - bid) / current_price * 100):.2f}%)")

            print(f"\nStrategy Thresholds:")
            print(f"  RSI Strategy:")
            print(f"    - Needs RSI < 35 for buy signal")
            print(f"    - Needs RSI > 65 for sell signal")
            print(f"    - Current price in range: ${config.xlm_price_range_min:.3f} - ${config.xlm_price_range_max:.3f}")

            print(f"  Range Strategy:")
            print(f"    - Buy threshold: ${0.345 * 1.002:.6f} (support + buffer)")
            print(f"    - Sell threshold: ${0.395 * 0.998:.6f} (resistance - buffer)")
            print(f"    - Support level: $0.345000")
            print(f"    - Resistance level: $0.395000")

            # Analyze current conditions
            print(f"\nMarket Analysis:")
            if current_price <= 0.345 * 1.002:
                print(f"  ✓ Price is near range support - range buy signal possible")
            else:
                print(f"  ✗ Price above range buy threshold")

            if current_price >= 0.395 * 0.998:
                print(f"  ✓ Price is near range resistance - range sell signal possible")
            else:
                print(f"  ✗ Price below range sell threshold")

            print(f"  RSI calculation needs 15+ recent prices for evaluation")

        else:
            print("Unable to get ticker data")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(check_price())