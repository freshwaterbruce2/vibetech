FROM python:3.11-slim

LABEL maintainer="Vibe Tech"
LABEL description="Crypto Trading System - Live Kraken XLM/USD Trading"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs

# Health check - verify API connectivity
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import sys; sys.path.append('/app'); from kraken_client import KrakenClient; client = KrakenClient(); client.get_server_time(); print('OK')" || exit 1

# Environment variables (set via docker-compose or runtime)
ENV PYTHONUNBUFFERED=1
ENV TRADING_ENV=production

# Default command
CMD ["python", "start_live_trading.py"]
