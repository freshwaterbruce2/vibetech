# Project Brief: Agent Nova & Vibe Code Studio Integration

## Project Overview

This project integrates two desktop applications - **Agent Nova (NOVA Agent)** and **Vibe Code Studio** - into a unified development environment with shared code, databases, and learning systems.

## Core Objectives

1. **Unified Codebase**: Share common code between NOVA Agent (Tauri/Rust) and Vibe Code Studio (Electron/React) via `@vibetech/shared` package
2. **Shared Learning System**: Connect both applications to a unified database learning system at `D:\databases\agent_learning.db`
3. **Real-time Communication**: Enable bidirectional IPC communication via WebSocket bridge on port 5004
4. **Cross-App Integration**: Allow NOVA Agent to launch files in Vibe Code Studio with full context
5. **Unified Knowledge Base**: Share mistakes, knowledge, and patterns between both applications

## Key Components

### Applications
- **NOVA Agent**: Tauri-based desktop application with AI capabilities, activity tracking, and learning system
- **Vibe Code Studio**: Electron-based code editor with AI completions, LSP support, and specialized agents

### Shared Infrastructure
- **@vibetech/shared**: TypeScript package containing shared agents, database schemas, AI services, and IPC client
- **IPC Bridge**: WebSocket server facilitating real-time communication between applications
- **Learning Databases**: SQLite databases at `D:\databases\` for mistakes, knowledge, and activity tracking

## Success Criteria

✅ Both applications can read/write to shared learning database
✅ IPC Bridge enables real-time communication
✅ NOVA Agent can launch files in Vibe Code Studio
✅ Learning insights are shared bidirectionally
✅ UI components display shared learning data
✅ All original features preserved in both applications

## Status

**Current Status:** ✅ **COMPLETE** - All integration objectives achieved
