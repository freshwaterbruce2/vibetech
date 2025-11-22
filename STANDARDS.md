# VibeTech / Nova - Architectural Standards

This document defines the strict rules for maintaining a **Modular, Plug-and-Play** architecture across the monorepo.

## 1. Service Architecture (Backend & MCPs)

**Principle**: Services must be independently deployable and coupled *only* by the Shared IPC definitions.

### Rules
- **Communication**: All inter-service communication MUST go through the `ipc-bridge` or standard HTTP/REST endpoints.
- **Discovery**: Services must register themselves with the bridge using a unique `source` identifier (defined in `packages/shared-ipc`).
- **No Shared State**: Services must NOT share in-memory state. Shared data must live in the Database (`D:\` drive) or be passed via messages.
- **Plug-and-Play**: Adding a new capability (e.g., `crypto-trader`) should involve creating a new MCP/Service and registering it, WITHOUT modifying the core `workflow-engine`.

## 2. Application Architecture (Frontend)

**Principle**: Features should be implemented as self-contained **Modules**.

### Rules (Vibe Code Studio & Nova Agent)
- **Directory Structure**: Features go in `src/modules/<feature-name>/`.
    - `components/`: UI components specific to this feature.
    - `services/`: Business logic.
    - `store/`: Local state management.
    - `index.ts`: The public API of the module.
- **Strict Boundaries**: Module A cannot import *internal* files from Module B. It must use Module B's `index.ts` export.
- **Module Registry**: The application should load features via a `ModuleRegistry` where possible, allowing for dynamic enabling/disabling of features.

## 3. Shared Kernel (`packages/`)

**Principle**: Code reuse is encouraged but strictly controlled.

### Rules
- **`shared-ipc`**: The Single Source of Truth for all message schemas. If a message isn't defined here, it doesn't exist.
- **`ui`**: Dumb UI components only. No business logic.
- **Dependencies**: Shared packages should have minimal external dependencies.

## 4. Data & State

- **The D:\ Drive**: This is the persistent memory layer.
    - `D:\nova_activity.db`: Log of all agent actions.
    - `D:\trading_data`: Specialized data for crypto.
- **Learning**: All apps must emit `learning_event` messages via IPC when a significant success or failure occurs, allowing the system to self-optimize.

## 5. Code Quality & Metrics

**Principle**: Keep code units small, readable, and AI-friendly.

### Rules
- **File Size**: **Max ~360 lines**. If a file exceeds this, it MUST be refactored.
    - *Why?* Small files are easier to read, test, and fit better into AI context windows.
- **Function Size**: Functions should ideally be visible on a single screen (< 50 lines).
- **Complexity**: Cyclomatic complexity should be kept low. Prefer early returns and flat structures over deep nesting.
- **Comments**: Document *Why*, not *What*. Self-documenting code is preferred.
