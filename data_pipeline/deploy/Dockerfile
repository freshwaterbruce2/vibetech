# Production Docker container for Data Processing Pipeline
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy pipeline code
COPY pipeline_integrated.py .
COPY deploy/config/ ./config/
COPY deploy/scripts/ ./scripts/

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs /app/output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PIPELINE_ENV=production
ENV LOG_LEVEL=INFO

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Default command
CMD ["python", "scripts/run_production.py"]