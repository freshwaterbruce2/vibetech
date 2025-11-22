# Desktop Commander V3 - MCP Context

Desktop Commander V3 is a Model Context Protocol (MCP) server designed to provide advanced desktop automation capabilities to the Nova ecosystem.

## Capabilities
- **System Monitoring**: CPU, Memory, OS Info (`systeminformation`).
- **Process Management**: List processes (safely).
- **Automation**: Open URLs, Execute safe commands.
- **Command Execution**: Securely execute shell commands and scripts via strict allow-list.

## Architecture
- **Type**: Standalone Node.js Service (TypeScript).
- **Communication**: WebSockets via `@vibetech/shared-ipc` (Connects to `ipc-bridge`).
- **Security**: 
  - Strict command registry in `CommandExecutor.ts`.
  - No arbitrary shell execution by default.
- **Logging**: Production-ready `Logger` (INFO/ERROR only).

## Integration
- **IPC**: Connects to `backend/ipc-bridge` as a client with `source: "desktop-commander-v3"`.
- **Workflow Engine**: Receives task instructions from the Workflow Engine via IPC.

## Setup
1. `pnpm install`
2. `pnpm build`
3. `pnpm start` (Ensure `ipc-bridge` is running first).
