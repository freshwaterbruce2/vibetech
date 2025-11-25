"""
Example usage of Kraken REST API Client

Demonstrates various API operations and error handling.
"""

import asyncio
import os
from decimal import Decimal
from dotenv import load_dotenv

from src.api import (
    KrakenRestClient,
    ClientConfig,
    RateLimitError,
    InsufficientFundsError,
    CircuitBreakerError
)


async def public_endpoints_example():
    """Example of using public endpoints."""
    print("\n=== Public Endpoints Example ===")

    async with KrakenRestClient() as client:
        # Get server time
        server_time = await client.get_server_time()
        print(f"Server time: {server_time.datetime}")

        # Get system status
        status = await client.get_system_status()
        print(f"System status: {status.status}")

        # Get ticker for Bitcoin
        ticker = await client.get_ticker("XXBTZUSD")
        print(f"Bitcoin price: ${ticker.last_price}")
        print(f"24h volume: {ticker.volume_24h} BTC")
        print(f"Bid: ${ticker.bid_price}, Ask: ${ticker.ask_price}")


async def authenticated_example():
    """Example of using authenticated endpoints."""
    print("\n=== Authenticated Endpoints Example ===")

    # Load credentials from environment
    load_dotenv()

    config = ClientConfig(
        api_key=os.getenv("KRAKEN_API_KEY"),
        private_key=os.getenv("KRAKEN_PRIVATE_KEY"),
        rate_limit_tier="intermediate",
        enable_metrics=True
    )

    async with KrakenRestClient(config=config) as client:
        try:
            # Get account balance
            balances = await client.get_balance()
            for currency, balance in balances.items():
                if balance.balance > 0:
                    print(f"{currency}: {balance.balance}")

            # Place a limit order (small amount for safety)
            order_response = await client.place_order(
                pair="XXBTZUSD",
                type="buy",
                ordertype="limit",
                price=30000,  # Low price, unlikely to fill
                volume=0.001
            )

            if order_response.txid:
                print(f"Order placed: {order_response.txid[0]}")

                # Cancel the order
                canceled = await client.cancel_order(order_response.txid[0])
                if canceled:
                    print("Order canceled successfully")

        except InsufficientFundsError as e:
            print(f"Not enough funds: {e.message}")
        except Exception as e:
            print(f"Error: {e}")


async def rate_limiting_example():
    """Example demonstrating rate limiting."""
    print("\n=== Rate Limiting Example ===")

    config = ClientConfig(
        rate_limit_tier="starter",  # Low limits for demonstration
        enable_rate_limiting=True
    )

    async with KrakenRestClient(config=config) as client:
        # Make multiple requests quickly
        for i in range(5):
            try:
                ticker = await client.get_ticker("XXBTZUSD")
                print(f"Request {i+1}: ${ticker.last_price}")

                # Check rate limit status
                from src.api.rate_limiter import EndpointType
                status = client.get_rate_limit_status(EndpointType.PUBLIC)
                if status:
                    print(f"  Remaining: {status.remaining}/{status.limit}")

            except RateLimitError as e:
                print(f"Rate limited: {e.message}")
                if e.retry_after:
                    print(f"Retry after: {e.retry_after}s")
                await asyncio.sleep(1)


async def circuit_breaker_example():
    """Example demonstrating circuit breaker."""
    print("\n=== Circuit Breaker Example ===")

    config = ClientConfig(
        base_url="https://invalid-url-for-testing.com",  # Invalid URL
        enable_circuit_breaker=True,
        circuit_breaker_threshold=3,
        circuit_breaker_timeout=5
    )

    async with KrakenRestClient(config=config) as client:
        for i in range(5):
            try:
                await client.get_ticker("XXBTZUSD")
            except CircuitBreakerError as e:
                print(f"Circuit breaker open: {e.message}")
                print(f"Reset time: {e.reset_time}")
                break
            except Exception as e:
                print(f"Request {i+1} failed: {type(e).__name__}")

            if client.is_circuit_open():
                print("Circuit is now open, failing fast")
                break


async def batch_operations_example():
    """Example of efficient batch operations."""
    print("\n=== Batch Operations Example ===")

    async with KrakenRestClient() as client:
        # Get multiple tickers concurrently
        pairs = ["XXBTZUSD", "XETHZUSD", "XLTCZUSD"]

        async def get_ticker_safe(pair):
            try:
                return await client.get_ticker(pair)
            except Exception as e:
                print(f"Error getting {pair}: {e}")
                return None

        # Execute concurrently
        tickers = await asyncio.gather(
            *[get_ticker_safe(pair) for pair in pairs]
        )

        for pair, ticker in zip(pairs, tickers):
            if ticker:
                print(f"{pair}: ${ticker.last_price}")


async def main():
    """Run all examples."""
    print("Kraken REST API Client Examples")
    print("=" * 40)

    # Run public endpoints example
    await public_endpoints_example()

    # Run authenticated example (requires API keys)
    if os.getenv("KRAKEN_API_KEY"):
        await authenticated_example()
    else:
        print("\n=== Skipping authenticated example (no API keys) ===")

    # Run rate limiting example
    await rate_limiting_example()

    # Run circuit breaker example
    await circuit_breaker_example()

    # Run batch operations example
    await batch_operations_example()

    print("\n" + "=" * 40)
    print("Examples completed!")


if __name__ == "__main__":
    asyncio.run(main())