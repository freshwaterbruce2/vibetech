# Vibe Code Studio - Project Context (Updated 11/22/2025)

This is the specialized IDE/Editor component of the VibeTech ecosystem (formerly DeepCode Editor).

## Core Architecture
- **Location**: `apps/vibe-code-studio` (formerly `projects/active/desktop-apps/deepcode-editor`)
- **Framework**: Electron + React (Vite).
- **Editor Engine**: Monaco Editor (assumed/preferred) or CodeMirror.
- **LSP Client**: Connects to `backend/lsp-proxy` for language features.

## Deep Integration: Nova Agent
Vibe Code Studio is not just an editor; it is the "Hands" to Nova Agent's "Brain":
1.  **Shared Brain (D:\)**: Accesses the shared `D:\` database for project knowledge graphs and user preferences.
2.  **Bidirectional Learning**:
    - **Learns**: Consumes high-level directives from Nova.
    - **Teaches**: Reports successful code patterns and debugging resolutions back to the shared learning system.
3.  **IPC Bridge**: Receives direct commands from Nova (e.g., `file:open`, `command:execute`) via `backend/ipc-bridge`.

## Best Practices (Standard 11/22/2025)
1.  **Performance First**:
    - Use **virtualization** for file trees and large lists.
    - Minimize Main-Renderer bridge traffic.
2.  **Component Structure**:
    - **Atomic Design**: Atoms, Molecules, Organisms.
    - **Strict Props**: Use TypeScript interfaces.
3.  **State Management**:
    - Use **Zustand** or **Jotai** for atomic state updates.
4.  **Security**:
    - **Context Isolation**: MUST be `true`.
