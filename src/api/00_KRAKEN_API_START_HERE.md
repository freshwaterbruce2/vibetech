# Kraken REST API Client

Comprehensive async REST API client for Kraken with full integration support. Includes authentication, rate limiting, circuit breaker protection, and comprehensive error handling.

## Features

- **Full Async Support**: Built with `aiohttp` for high-performance async operations
- **Session Management**: Connection pooling and session management for optimal performance
- **Authentication**: Automatic signature generation and nonce management
- **Rate Limiting**: Kraken 2025 compliant rate limiting with penalty point tracking
- **Circuit Breaker**: Protection against cascading failures with automatic recovery
- **Error Handling**: Comprehensive error mapping and retry logic
- **Response Validation**: Pydantic models for type-safe response parsing
- **Performance Monitoring**: Built-in metrics and performance tracking
- **Thread Safety**: Safe for concurrent use across multiple coroutines

## Quick Start

```python
import asyncio
from src.api import KrakenRestClient

async def main():
    async with KrakenRestClient(
        api_key="your_api_key",
        private_key="your_private_key"
    ) as client:
        # Get ticker information
        ticker = await client.get_ticker("XXBTZUSD")
        print(f"Bitcoin price: ${ticker.last_price}")

        # Get account balance
        balance = await client.get_balance()
        print(f"USD Balance: ${balance.USD}")

        # Place a limit order
        order = await client.place_order(
            pair="XXBTZUSD",
            type="buy",
            ordertype="limit",
            price=40000,
            volume=0.001
        )
        print(f"Order ID: {order.txid}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Installation

```bash
pip install kraken-rest-api
```

## Configuration

### Environment Variables

```bash
KRAKEN_API_KEY=your_api_key
KRAKEN_PRIVATE_KEY=your_private_key
KRAKEN_API_URL=https://api.kraken.com
KRAKEN_RATE_LIMIT_TIER=starter  # Options: starter, intermediate, pro
```

### Programmatic Configuration

```python
from src.api import KrakenRestClient, ClientConfig

config = ClientConfig(
    api_key="your_api_key",
    private_key="your_private_key",
    base_url="https://api.kraken.com",
    timeout=30,
    max_retries=3,
    rate_limit_tier="starter",
    enable_circuit_breaker=True,
    circuit_breaker_threshold=5,
    circuit_breaker_timeout=60
)

client = KrakenRestClient(config=config)
```

## API Reference

### Public Endpoints

```python
# Get server time
time = await client.get_server_time()

# Get system status
status = await client.get_system_status()

# Get asset info
assets = await client.get_asset_info(assets=["XBT", "ETH"])

# Get ticker information
ticker = await client.get_ticker("XXBTZUSD")

# Get OHLC data
ohlc = await client.get_ohlc("XXBTZUSD", interval=60)

# Get order book
orderbook = await client.get_orderbook("XXBTZUSD", count=100)

# Get recent trades
trades = await client.get_recent_trades("XXBTZUSD")

# Get spread data
spread = await client.get_spread("XXBTZUSD")
```

### Private Endpoints

```python
# Account Information
balance = await client.get_balance()
trade_balance = await client.get_trade_balance()
open_orders = await client.get_open_orders()
closed_orders = await client.get_closed_orders()
trades_history = await client.get_trades_history()

# Trading
order = await client.place_order(
    pair="XXBTZUSD",
    type="buy",
    ordertype="limit",
    price=40000,
    volume=0.001
)

cancel_result = await client.cancel_order(txid="ORDER-ID")
cancel_all = await client.cancel_all_orders()

# Deposits & Withdrawals
deposit_methods = await client.get_deposit_methods(asset="XBT")
deposit_address = await client.get_deposit_address(asset="XBT", method="Bitcoin")
withdrawal_info = await client.get_withdrawal_info(asset="XBT", amount=0.1)
withdraw = await client.withdraw(asset="XBT", key="withdrawal-key", amount=0.1)
```

## Advanced Features

### Rate Limiting

The client implements Kraken's 2025 rate limiting system with penalty points:

```python
# Configure rate limiting
client = KrakenRestClient(
    rate_limit_tier="pro",  # Higher tier = more requests
    enable_rate_limiting=True
)

# Check current rate limit status
status = client.get_rate_limit_status()
print(f"Remaining calls: {status.remaining}")
print(f"Penalty points: {status.penalty_points}")
```

### Circuit Breaker

Protect against cascading failures:

```python
# Circuit breaker automatically opens after 5 consecutive failures
client = KrakenRestClient(
    enable_circuit_breaker=True,
    circuit_breaker_threshold=5,
    circuit_breaker_timeout=60  # Reset after 60 seconds
)

# Check circuit breaker status
if client.is_circuit_open():
    print("Circuit breaker is open, requests will fail fast")
```

### Batch Operations

Execute multiple operations efficiently:

```python
# Batch multiple ticker requests
tickers = await client.batch_get_tickers([
    "XXBTZUSD", "XETHZUSD", "XLTCZUSD"
])

# Batch order placement
orders = await client.batch_place_orders([
    {"pair": "XXBTZUSD", "type": "buy", "price": 40000, "volume": 0.001},
    {"pair": "XETHZUSD", "type": "buy", "price": 2500, "volume": 0.1}
])
```

### WebSocket Integration

Seamlessly integrate with WebSocket streams:

```python
from src.api import KrakenWebSocket

async def handle_ticker(data):
    print(f"Price update: {data}")

ws = KrakenWebSocket()
await ws.subscribe_ticker("XXBTZUSD", callback=handle_ticker)
await ws.run()
```

## Error Handling

The client provides comprehensive error handling:

```python
from src.api.exceptions import (
    KrakenAPIError,
    RateLimitError,
    AuthenticationError,
    InsufficientFundsError
)

try:
    order = await client.place_order(...)
except InsufficientFundsError as e:
    print(f"Not enough funds: {e}")
except RateLimitError as e:
    print(f"Rate limited, retry after {e.retry_after} seconds")
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
except KrakenAPIError as e:
    print(f"API error: {e.code} - {e.message}")
```

## Performance Monitoring

Monitor client performance:

```python
# Enable metrics collection
client = KrakenRestClient(enable_metrics=True)

# Get performance metrics
metrics = client.get_metrics()
print(f"Total requests: {metrics.total_requests}")
print(f"Success rate: {metrics.success_rate}%")
print(f"Avg response time: {metrics.avg_response_time}ms")

# Export metrics to Prometheus
client.export_metrics_prometheus()
```

## Testing

```python
import pytest
from src.api.testing import MockKrakenClient

@pytest.fixture
def mock_client():
    return MockKrakenClient()

async def test_place_order(mock_client):
    mock_client.set_response("place_order", {
        "txid": ["ORDER-123"],
        "descr": {"order": "buy 0.001 XBTUSD @ limit 40000"}
    })

    result = await mock_client.place_order(
        pair="XXBTZUSD",
        type="buy",
        price=40000,
        volume=0.001
    )

    assert result.txid == "ORDER-123"
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Documentation](https://docs.kraken-api.com)
- [GitHub Issues](https://github.com/yourrepo/kraken-rest-api/issues)
- [Discord Community](https://discord.gg/kraken-api)