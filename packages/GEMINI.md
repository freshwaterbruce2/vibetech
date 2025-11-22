# Shared Packages Context

This directory contains shared libraries used across the Desktop, Web, and Backend targets.

## Principles
1.  **Stability**: Changes here affect multiple consumers. Maintain backward compatibility where possible.
2.  **Typing**: strict TypeScript types are mandatory. Export types explicitly.
3.  **Dependencies**: Minimize external dependencies. Pure functions are preferred.
4.  **Testing**: High test coverage is required for shared logic.

## Common Packages
- `nova-core`: Core logic for the Nova agent.
- `ui`: Shared React UI components (Design System).
- `vibetech-*`: Specific VibeTech business logic and hooks.
- `shared-utils`: General purpose helper functions.
- `shared-ipc`: **CRITICAL**. Defines Zod schemas and types for all IPC messages between Apps, Bridge, and MCPs.
