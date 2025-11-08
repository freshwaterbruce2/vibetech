<!-- 5a4a6809-4a10-4bca-98ab-22c96a36293b 440ebee7-40b4-4c2e-8c29-7f60d04e1adc -->
# Unified Desktop Integration Plan

## Vision: Two Powerful Apps, One Shared Intelligence

Transform NOVA Agent (Tauri) and Vibe Code Studio (Electron) into seamlessly integrated desktop applications that share code, databases, and learning while maintaining their unique strengths and all existing features.

## Current State Analysis

**NOVA Agent (90% Complete)**

- Tauri desktop app with full D:\databases\ integration
- 47 Tauri commands, React 19 frontend
- Learning system: agent_learning.db, nova_activity.db
- Activity tracking, project management, AI chat
- Specialized agents system (BackendEngineerAgent, FrontendEngineerAgent, etc.)

**Vibe Code Studio (85% Complete)**

- Electron app with Monaco editor
- React frontend, comprehensive code editing features
- DatabaseService with D:\databases\ support (partial)
- AI-powered code completion and assistance
- Similar specialized agents architecture

## Phase 1: Shared Code Foundation

### Create Shared Package System

- Create `@vibetech/shared` workspace package
- Extract common components:
  - Specialized agents (BackendEngineerAgent, FrontendEngineerAgent, TechnicalLeadAgent)
  - Database services and schemas
  - AI service integrations (DeepSeek, streaming)
  - Learning system components
  - Common TypeScript types and interfaces

### Establish Monorepo Structure

```
C:\dev\
├── packages\
│   └── vibetech-shared\          (NEW - shared code)
│       ├── agents\               (specialized agents)
│       ├── database\             (D:\databases\ services)
│       ├── ai\                   (AI integrations)
│       ├── learning\             (learning system)
│       └── types\                (shared TypeScript types)
├── projects\active\desktop-apps\
│   ├── nova-agent-current\       (Tauri - AI Assistant)
│   └── vibe-code-studio\         (Electron - Code Editor)
```

## Phase 2: Database Integration Unification

### Standardize D:\databases\ Access

- Update Vibe Code Studio's DatabaseService to match NOVA's patterns
- Implement real-time database change notifications
- Create shared database schema definitions
- Add cross-app activity tracking

### Enhanced Learning System

- Unified mistake tracking across both apps
- Shared knowledge base with app-specific categorization
- Cross-app pattern recognition
- Synchronized strategy memory

## Phase 3: Inter-App Communication

### IPC Bridge Implementation

- Named pipe communication: `\\.\pipe\vibetech-bridge`
- JSON-RPC protocol for structured messaging
- Bidirectional context sharing
- File/project synchronization

### NOVA Agent Enhancements

```rust
// New Tauri commands
#[tauri::command]
async fn launch_vibe_code_studio(file_path: Option<String>, project_context: Option<String>) -> Result<(), String>

#[tauri::command]
async fn sync_with_vibe_code_studio() -> Result<(), String>
```

### Vibe Code Studio Enhancements

- Accept launch parameters from NOVA Agent
- Send coding activity updates to NOVA
- Share AI insights and completions

## Phase 4: Windows 11 Optimization

### Hardware Acceleration

- RTX 3060 GPU acceleration for Monaco rendering
- Multi-core file indexing using AMD Ryzen 7
- Memory-mapped database access for performance
- Background processing optimization

### Native Windows Integration

- File association for code files (Vibe Code Studio)
- Context menu integration for both apps
- Windows Search integration
- Taskbar and system tray coordination

## Implementation Details

### Shared Package Structure

```typescript
// @vibetech/shared/agents
export { BackendEngineerAgent } from './BackendEngineerAgent';
export { FrontendEngineerAgent } from './FrontendEngineerAgent';
export { TechnicalLeadAgent } from './TechnicalLeadAgent';

// @vibetech/shared/database
export { DatabaseService } from './DatabaseService';
export { LearningDatabase } from './LearningDatabase';

// @vibetech/shared/ai
export { DeepSeekService } from './DeepSeekService';
export { StreamingAIService } from './StreamingAIService';
```

### Database Schema Updates

```sql
-- Add app_source column to track which app generated data
ALTER TABLE agent_learning ADD COLUMN app_source TEXT DEFAULT 'nova';
ALTER TABLE nova_activity ADD COLUMN app_source TEXT DEFAULT 'nova';

-- Cross-app pattern recognition
CREATE TABLE cross_app_patterns (
  id INTEGER PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  source_app TEXT NOT NULL,
  target_app TEXT NOT NULL,
  pattern_data TEXT NOT NULL,
  success_rate REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### IPC Protocol

```typescript
interface IPCMessage {
  type: 'file_open' | 'context_update' | 'activity_sync' | 'learning_update';
  payload: any;
  timestamp: number;
  source: 'nova' | 'vibe';
}
```

## Success Criteria

### Seamless Integration

- NOVA can launch files in Vibe Code Studio with full context
- Vibe Code Studio shows NOVA's learning insights in real-time
- Both apps contribute to unified knowledge base
- Cross-app search and navigation works flawlessly

### Performance Optimization

- Both apps utilize RTX 3060 for UI acceleration
- Multi-core processing for file operations
- Sub-second startup times maintained
- Responsive UI under heavy workloads

### Enhanced Learning

- Unified mistake tracking prevents repeated errors
- Cross-app pattern recognition improves suggestions
- Shared successful strategies across both environments
- Real-time learning synchronization

## File Changes Required

### NOVA Agent Updates

- `src-tauri/src/commands/vibe_integration.rs` (NEW)
- `src-tauri/src/ipc/bridge.rs` (NEW)
- Update `Cargo.toml` to include shared package
- Update frontend to use shared components

### Vibe Code Studio Updates

- Update `src/services/DatabaseService.ts` for full D:\databases\ integration
- Add `src/services/NovaAgentBridge.ts` (NEW)
- Update `package.json` dependencies
- Migrate to shared specialized agents

### Shared Package Creation

- `packages/vibetech-shared/package.json` (NEW)
- Extract and refactor common components
- Establish build pipeline for shared code
- Create comprehensive TypeScript definitions

## Migration Strategy

1. **Week 1**: Create shared package and extract common code
2. **Week 2**: Implement IPC communication layer
3. **Week 3**: Unify database integration and learning system
4. **Week 4**: Windows optimization and final integration testing

This plan preserves all existing functionality while creating a powerful, integrated development environment optimized for your Windows 11 setup with RTX 3060 and AMD Ryzen 7.

### To-dos

- [ ] Inventory top-level projects, their languages, and entry points (package.json or equivalent)
- [ ] Identify existing LSPs and debug adapters used by projects under `packages/` and `projects/`
- [ ] Prototype a workspace search API (ripgrep-backed) that returns file results and symbol snippets
- [ ] Build a browser UI with file-tree, file viewer (Monaco), and quick-open search
- [ ] Add an LSP proxy service to forward LSP requests from the browser to local language servers
- [ ] Add a Debug Adapter Protocol (DAP) proxy to enable attach/launch debugging from the browser
- [ ] Add tests (UI + API) and update `docs/` with setup and security notes