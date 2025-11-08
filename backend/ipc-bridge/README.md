# IPC Bridge Server

WebSocket server for real-time communication between NOVA Agent and Vibe Code Studio.

## Overview

The IPC Bridge facilitates bidirectional communication between the two desktop applications, enabling:

- Real-time activity synchronization
- Learning insights sharing
- Context-aware suggestions
- Cross-app pattern recognition
- File and project context exchange

## Port

**5004** - WebSocket server

## Installation

```bash
npm install
```

## Running

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## Message Format

All messages must follow the IPC message format:

```typescript
{
  type: 'file_open' | 'context_update' | 'activity_sync' | 'learning_update' | ...,
  payload: any,
  timestamp: number,
  source: 'nova' | 'vibe',
  messageId: string
}
```

## Message Types

- `file_open` - File opened in one app
- `context_update` - Workspace context changed
- `activity_sync` - Activity events synchronization
- `learning_update` - New mistakes or knowledge added
- `mistake_logged` - New mistake recorded
- `knowledge_added` - New knowledge entry
- `project_switch` - Project changed
- `deep_work_start` - Deep work session started
- `deep_work_end` - Deep work session ended
- `ping` / `pong` - Connection health check

## Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│   NOVA Agent    │                    │ Vibe Code Studio│
│   (Tauri/Rust)  │                    │   (Electron)    │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  WebSocket (port 5004)               │
         │                                      │
         └──────────►┌─────────────┐◄──────────┘
                     │ IPC Bridge  │
                     │   Server    │
                     └─────────────┘
```

## Features

- ✅ Message broadcasting (messages sent to all connected clients except sender)
- ✅ Client identification (nova/vibe)
- ✅ Message validation
- ✅ Connection statistics
- ✅ Message logging (last 100 messages)
- ✅ Automatic reconnection support
- ✅ Graceful shutdown

## Statistics

The server broadcasts statistics every 30 seconds:

```json
{
  "type": "bridge_stats",
  "payload": {
    "server": { "uptime": 1234, "port": 5004 },
    "connections": { "active": 2, "total": 5, "disconnections": 3 },
    "messages": { "total": 150, "byType": {...}, "recentCount": 100 },
    "clients": [...]
  }
}
```

## Integration

Both applications use the `@vibetech/shared` package's `WebSocketBridge` class:

```typescript
import { WebSocketBridge, createIPCMessage } from '@vibetech/shared';

const bridge = new WebSocketBridge('nova'); // or 'vibe'
await bridge.connect();

// Send message
bridge.send(createIPCMessage('file_open', { filePath: 'test.ts' }, 'nova'));

// Receive messages
bridge.on('file_open', (message) => {
  console.log('File opened:', message.payload.filePath);
});
```

## Deployment

The IPC Bridge should run as a background service and start automatically with the system.

### Windows

Create a scheduled task or use NSSM (Non-Sucking Service Manager) to run as a Windows service.

### Linux/Mac

Use systemd or launchd to run as a system service.

## Security

- Localhost only (0.0.0.0 binding disabled)
- No authentication (relies on local machine security)
- Message validation on all incoming data
- Rate limiting can be added if needed

## Monitoring

View real-time logs:

```bash
npm start
```

Output shows:
- Connection events
- Message routing
- Error messages
- Statistics updates
