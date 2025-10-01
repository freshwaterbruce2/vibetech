# Crypto Enhanced Trading System

Advanced cryptocurrency trading system with Kraken API integration, real-time WebSocket data, and automated trading strategies.

## Features

- **Kraken API Integration**: Full REST API and WebSocket V2 support
- **Real-time Market Data**: Live price feeds, order book updates, and trade execution
- **Multiple Trading Strategies**:
  - Momentum trading
  - Mean reversion
  - Arbitrage detection
- **Risk Management**: Position sizing, exposure limits, stop-loss/take-profit
- **Database Logging**: SQLite persistence for orders, trades, and performance metrics
- **Monitoring & Alerts**: System health checks and balance alerts

## Installation

1. **Clone the repository**:
```bash
cd /c/dev/projects/crypto-enhanced
```

2. **Create virtual environment**:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your Kraken API credentials
```

## Configuration

Edit the `.env` file with your settings:

- `KRAKEN_API_KEY`: Your Kraken API key
- `KRAKEN_API_SECRET`: Your Kraken API secret
- `TRADING_PAIRS`: Comma-separated list of trading pairs
- `MAX_POSITION_SIZE`: Maximum size for a single position
- `MAX_TOTAL_EXPOSURE`: Maximum total exposure across all positions

## Usage

### Test Connection
```bash
python launch.py test
```

### Paper Trading (Simulation)
```bash
python launch.py paper
```

### Live Trading
```bash
python launch.py live
```

### Check Status
```bash
python launch.py status
```

### Direct Execution
```bash
python main.py
```

## Project Structure

```
crypto-enhanced/
├── main.py                 # Main entry point
├── launch.py              # Launch script with different modes
├── kraken_client.py       # Kraken REST API client
├── websocket_manager.py   # WebSocket connection manager
├── trading_engine.py      # Core trading logic
├── config.py              # Configuration management
├── database.py            # SQLite database interface
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── logs/                 # Log files directory
└── tests/                # Test suite
```

## API Modules

### KrakenClient
- REST API wrapper for Kraken
- Automatic rate limiting
- Nonce management
- Error handling and retry logic

### WebSocketManager
- WebSocket V2 implementation
- Auto-reconnection
- Channel subscription management
- Real-time data callbacks

### TradingEngine
- Strategy execution
- Order management
- Position tracking
- Risk monitoring

### Database
- Trade logging
- Performance metrics
- Market data storage
- Event tracking

## Trading Strategies

### Momentum Strategy
- Tracks price momentum over configurable periods
- Generates buy/sell signals based on trend strength
- Configurable thresholds

### Mean Reversion Strategy
- Identifies oversold/overbought conditions
- Trade on price reversions to mean
- Statistical analysis

### Arbitrage Strategy
- Cross-exchange price monitoring
- Opportunity detection
- Execution timing

## Risk Management

The system includes comprehensive risk management:
- Position size limits
- Total exposure limits
- Maximum number of concurrent positions
- Stop-loss and take-profit orders
- Risk score calculation

## Monitoring

Real-time monitoring includes:
- System health checks
- Connection status
- Balance monitoring
- Performance metrics
- Alert notifications

## Security

- API credentials stored in environment variables
- No credentials in code or logs
- Secure WebSocket connections
- Request signing for private endpoints

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black .
```

### Type Checking
```bash
mypy .
```

## Troubleshooting

### Connection Issues
- Verify API credentials in `.env`
- Check network connectivity
- Ensure Kraken API is enabled for your account

### Order Failures
- Check account balance
- Verify trading permissions
- Review risk limits in configuration

### WebSocket Disconnections
- System automatically reconnects
- Check logs for error details
- Verify WebSocket token if using private channels

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review configuration in `.env`
3. Ensure all dependencies are installed

## Disclaimer

This software is for educational purposes. Cryptocurrency trading involves substantial risk. Use at your own risk.