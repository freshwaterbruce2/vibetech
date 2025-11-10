# IPC Bridge

WebSocket bridge for real-time communication between NOVA Agent and Deepcode Editor.

## Features

- **WebSocket Server** - Real-time bidirectional communication
- **Message Broadcasting** - Route messages between clients
- **Command Routing** - @nova and @vibe command support
- **Health Monitoring** - HTTP endpoints for liveness/readiness
- **Connection Stats** - Track connections and message flow

## Quick Start

```powershell
# Start the bridge
node src/server.js

# Or with custom port
PORT=5005 node src/server.js
```

## Endpoints

### WebSocket
- `ws://localhost:5004` - WebSocket connection

### Health Checks
- `GET /healthz` - Liveness probe (always returns 200 if server is running)
- `GET /readyz` - Readiness probe (returns 503 if server not ready)
- `GET /metrics` - Prometheus-style metrics

## Message Format

All messages must follow this schema:

```json
{
  "type": "string",
  "source": "nova" | "vibe",
  "timestamp": 1234567890,
  "messageId": "uuid",
  "payload": {}
}
```

## Example Usage

### Connect from Client

```javascript
const ws = new WebSocket('ws://localhost:5004');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'greeting',
    source: 'nova',
    timestamp: Date.now(),
    messageId: crypto.randomUUID(),
    payload: { message: 'Hello from NOVA' }
  }));
});
```

### Health Check

```powershell
curl http://localhost:5004/healthz
curl http://localhost:5004/readyz
curl http://localhost:5004/metrics
```

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│ NOVA Agent  │ ◄─────► │  IPC Bridge  │ ◄─────► │ Deepcode Editor │
└─────────────┘   WS    └──────────────┘   WS    └─────────────────┘
                         Port 5004

                         HTTP Endpoints:
                         /healthz  (liveness)
                         /readyz   (readiness)
                         /metrics  (stats)
```

## Message Types

- `connected` - Connection established
- `greeting` - Client greeting
- `command_request` - @nova or @vibe command
- `command_result` - Command execution result
- `bridge_stats` - Connection statistics
- Custom types supported

## Configuration

Environment variables:

- `PORT` - Server port (default: 5004)

## Monitoring

### Liveness Probe
Checks if the server process is running.

```bash
curl http://localhost:5004/healthz
```

### Readiness Probe
Checks if the server is ready to accept connections.

```bash
curl http://localhost:5004/readyz
```

Returns:
- **200 OK** - Server is ready
- **503 Service Unavailable** - Server not ready

### Metrics

```bash
curl http://localhost:5004/metrics
```

Returns connection counts, message stats, and uptime.

## Development

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Run with watch mode
npm run dev
```

## Testing

E2E tests are located in `../../tests/e2e/ipc-bridge.spec.ts`.

```powershell
cd ../../tests/e2e
pnpm test
```

## Troubleshooting

### Port already in use

```powershell
# Find process using port 5004
Get-NetTCPConnection -LocalPort 5004 | Select-Object OwningProcess
Get-Process -Id <PID> | Stop-Process -Force
```

### Connection refused

Check if server is running:
```powershell
curl http://localhost:5004/healthz
```

### Server not ready

Check readiness:
```powershell
curl http://localhost:5004/readyz
```

If returns 503, the server exists but isn't listening yet.

## Related

- [IPC Contracts](../../packages/shared-ipc/) - Message schemas
- [Health Documentation](../../docs/READINESS_CHECK_FIX.md) - Health check details
- [E2E Tests](../../tests/e2e/) - Integration tests
