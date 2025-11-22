# Shared IPC - Package Context

This package (`@vibetech/shared-ipc`) is the **Source of Truth** for all communication within the ecosystem.

## Core Responsibilities
1.  **Zod Schemas**: Defines strict validation schemas for every message type (Requests, Responses, Events).
2.  **Type Definitions**: Exports TypeScript types inferred from Zod schemas for full type safety across apps.
3.  **Constants**: Defines channel names, message topics, and error codes.

## Key Message Flows
- **`command_request`**: Sent by Apps/Agents to the Bridge.
- **`command_execute`**: Routed by the Bridge to the target App/MCP.
- **`learning_event`**: bidirectional updates between Nova Agent and Vibe Code Studio sharing knowledge.

## Integration
- Used by: `backend/ipc-bridge`, `apps/nova-agent`, `apps/vibe-code-studio`, `backend/workflow-engine`.
