# Backend Services Context

This directory contains the backend microservices and proxies for the system.

## Key Services
- **`ipc-bridge`**: Handles inter-process communication routing. Critical for connecting desktop apps (Nova, Vibe) to backend logic and MCP servers (like Desktop Commander).
- **`workflow-engine`**: The core engine for executing Nova/Vibe workflows. Integrates with **Desktop Commander V3** for advanced system automation.
- **`search-service`**: dedicated indexing and retrieval service.
- **`dap-proxy` / `lsp-proxy`**: Proxies for Debug Adapter Protocol and Language Server Protocol.

## Development Guidelines
- **Architecture**: Services should be modular and loosely coupled.
- **Communication**: Primary communication is via IPC (WebSockets via `ipc-bridge`) or HTTP/REST.
- **Error Handling**: Robust error logging and propagation is essential.
- **Environment**: Ensure `.env` variables are validated on startup.
