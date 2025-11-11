# DAP Proxy

Debug Adapter Protocol WebSocket proxy for browser-based debugging.

## Port Configuration

**Port: 5003** (Fixed from incorrect 5002)

### Bug Fix History
- **Bug**: DAP proxy was originally configured to use port 5002, causing a conflict with the LSP proxy
- **Fix**: Changed default port to 5003 as per documentation
- **Files Changed**:
  - `src/index.js` line 10: Changed `const PORT = process.env.PORT || 5002;` to `5003`
  - `src/index.js` line 14: Updated console.log to reflect correct port

## Port Assignments

- **Search Service**: 4001
- **LSP Proxy**: 5002
- **DAP Proxy**: 5003 ✅ (Fixed)
- **IPC Bridge**: 5004

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

The DAP proxy will listen on port 5003 and relay Debug Adapter Protocol messages between the browser and debug adapters.

## Supported Debug Adapters

- Node.js (`node`)
- Python (`debugpy`)

## Environment Variables

- `PORT`: Override default port (5003)

Example:
```bash
PORT=6000 npm start
```
