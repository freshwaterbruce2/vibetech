# Setup & Security Notes

## Port Assignments

- **Search Service**: 4001
- **LSP Proxy**: 5002
- **DAP Proxy**: 5003
- **IPC Bridge**: 5004
- **HTTP Server**: 3000

## Security Considerations

### Workspace Path Validation
All file operations validate that requested paths are within the workspace root to prevent directory traversal attacks.

### Read-Only by Default
The Monaco editor is configured as read-only to prevent accidental modifications during code browsing.

### Local Network Only
All services bind to localhost (127.0.0.1) by default and should not be exposed to external networks.

### Language Server Security
Language servers are spawned as child processes with limited permissions. They only have access to workspace files.

## Environment Variables

Configure services via environment variables:

```bash
# Search Service
PORT=4001 npm start

# LSP Proxy
PORT=5002 npm start

# DAP Proxy
PORT=5003 npm start

# IPC Bridge
PORT=5004 npm start
```

## CORS Configuration

The HTTP server must be started with CORS enabled:

```bash
npx http-server public -p 3000 --cors
```

## Required Dependencies

### Core
- Node.js 16+
- npm or yarn

### Optional (for full functionality)
- `ripgrep` (rg) - for search functionality
- `typescript-language-server` - for TypeScript/JavaScript LSP
- `pyright-langserver` - for Python LSP
- `rust-analyzer` - for Rust LSP

## Installation

```bash
# Install all services
cd backend/search-service && npm install
cd backend/lsp-proxy && npm install
cd backend/dap-proxy && npm install
cd backend/ipc-bridge && npm install
```

## Starting Services

```bash
# Terminal 1: Search Service
cd backend/search-service && npm start

# Terminal 2: LSP Proxy
cd backend/lsp-proxy && npm start

# Terminal 3: DAP Proxy (optional)
cd backend/dap-proxy && npm start

# Terminal 4: IPC Bridge
cd backend/ipc-bridge && npm start

# Terminal 5: HTTP Server
npx http-server public -p 3000 --cors
```

## Firewall Configuration

If using Windows Firewall, allow Node.js to accept connections on:
- Port 3000 (HTTP)
- Port 4001 (Search)
- Port 5002 (LSP)
- Port 5003 (DAP)
- Port 5004 (IPC)

## Production Deployment

For production use:

1. Use a process manager (PM2, systemd)
2. Configure proper logging
3. Set up monitoring
4. Use environment-specific configurations
5. Consider using a reverse proxy (nginx)
6. Implement authentication if exposing beyond localhost

## Troubleshooting

### Port Conflicts

If you see "EADDRINUSE" errors:

1. Check which process is using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5002

   # Linux/Mac
   lsof -i :5002
   ```

2. Kill the conflicting process or change the port:
   ```bash
   PORT=5010 npm start
   ```

### Common Issues

**Search not working**: Install ripgrep and ensure it's in PATH

**LSP not working**: Install the appropriate language server for your language

**WebSocket connection failed**: Check that the proxy services are running

**CORS errors**: Ensure HTTP server is started with `--cors` flag
