# Crypto Enhanced - Project Context (Updated 11/22/2025)

This project hosts specialized cryptocurrency tools, trading bots, or analytics engines, likely enhanced with AI or advanced algorithms.

## Core Architecture (Inferred)
- **Language**: Python (indicated by `.venv`) or TypeScript.
- **Focus**: High-frequency trading, market analysis, or blockchain interaction.

## Best Practices (Standard 11/22/2025)
1.  **Security & Secrets**:
    - **Zero Trust**: NEVER commit API keys, private keys, or seed phrases.
    - **Environment Variables**: Use `.env` for all sensitive credentials. Use a strict validator (e.g., Pydantic `BaseSettings`) to ensure they exist on startup.
2.  **Data Integrity**:
    - **Decimal Precision**: NEVER use standard floating-point math for currency. Use `Decimal` (Python) or `BigNumber` (JS) libraries to avoid rounding errors.
    - **Atomic Transactions**: Ensure DB operations or critical trade sequences are atomic.
3.  **Performance**:
    - **Async I/O**: Use `asyncio` (Python) or Promises (JS) for all network calls (Exchange APIs, Blockchain nodes).
    - **WebSockets**: Prefer WebSocket streams over polling for real-time price updates.
4.  **Reliability**:
    - **Rate Limiting**: Implement robust token bucket or similar logic to respect Exchange API limits.
    - **Error Recovery**: Automatic reconnection logic for WebSocket drops.
5.  **Testing**:
    - **Mocking**: strictly mock all financial API calls in tests. Never run automated tests against live real-money endpoints.
