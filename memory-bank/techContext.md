# Technical Context: Agent Nova & Vibe Code Studio Integration

## Technology Stack

### NOVA Agent

- **Framework:** Tauri (Rust + Web Frontend)
- **Language:** Rust (backend), TypeScript/React (frontend)
- **Database:** SQLite via `rusqlite`
- **IPC:** Tauri IPC + WebSocket client

### Vibe Code Studio

- **Framework:** Electron
- **Language:** TypeScript/React
- **Database:** SQLite via `better-sqlite3` (Electron) / `sql.js` (Web)
- **IPC:** Electron IPC + WebSocket client

### Shared Package

- **Language:** TypeScript
- **Build Tool:** TypeScript Compiler
- **Dependencies:** `better-sqlite3`, `sql.js`

### IPC Bridge

- **Runtime:** Node.js
- **Protocol:** WebSocket (ws library)
- **Port:** 5004

## Database Configuration

### Shared Databases Location

**Path:** `D:\databases\`

**Databases:**

- `agent_learning.db` - Shared learning system (mistakes, knowledge)
- `nova_activity.db` - NOVA Agent activity tracking
- `strategy_memory.db` - Vibe Code Studio strategy patterns

### Database Schema

**agent_mistakes Table:**

```sql
CREATE TABLE IF NOT EXISTS agent_mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mistake_type TEXT NOT NULL,
  mistake_category TEXT,
  description TEXT NOT NULL,
  root_cause_analysis TEXT,
  context_when_occurred TEXT,
  impact_severity TEXT CHECK(impact_severity IN ('low', 'medium', 'high', 'critical')),
  prevention_strategy TEXT,
  identified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT 0,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova',
  tags TEXT,
  platform TEXT CHECK(platform IN ('desktop', 'web', 'mobile', 'python', 'general'))
);
```

**agent_knowledge Table:**

```sql
CREATE TABLE IF NOT EXISTS agent_knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  knowledge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  applicable_tasks TEXT,
  success_rate_improvement REAL,
  confidence_level REAL,
  tags TEXT,
  app_source TEXT CHECK(app_source IN ('nova', 'vibe')) DEFAULT 'nova',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Development Setup

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- Cargo (Rust package manager)
- npm/pnpm

### Build Commands

**Shared Package:**

```bash
cd packages/vibetech-shared
npm install
npm run build
```

**IPC Bridge:**

```bash
cd backend/ipc-bridge
npm install
npm start
```

**NOVA Agent:**

```bash
cd projects/active/desktop-apps/nova-agent-current
cargo build --release
cargo tauri dev
```

**Vibe Code Studio:**

```bash
cd projects/active/desktop-apps/deepcode-editor
npm install
npm run dev
```

## File Structure

```
C:\dev\
├── packages/
│   └── vibetech-shared/          # Shared package
├── backend/
│   └── ipc-bridge/               # IPC Bridge server
└── projects/
    └── active/
        └── desktop-apps/
            ├── nova-agent-current/    # NOVA Agent
            └── deepcode-editor/       # Vibe Code Studio
```

## Key Files

### NOVA Agent

- `src-tauri/src/commands/vibe_integration.rs` - Vibe integration
- `src-tauri/src/learning_db.rs` - Learning database module
- `src-tauri/src/main.rs` - Main application logic

### Vibe Code Studio

- `src/services/NovaAgentBridge.ts` - IPC Bridge client
- `src/services/DatabaseService.ts` - Database service with learning methods
- `src/components/LearningPanel.tsx` - Learning UI component
- `src/App.tsx` - Main application component
- `src/components/StatusBar.tsx` - Status bar with learning button

### Shared Package

- `src/agents/*.ts` - Specialized AI agents
- `src/database/*.ts` - Database schemas and interfaces
- `src/ai/*.ts` - AI service integrations
- `src/learning/*.ts` - Learning system components
- `src/ipc/*.ts` - IPC Bridge client
- `src/types/*.ts` - Common TypeScript types

### IPC Bridge

- `src/server.js` - WebSocket server implementation

## Configuration

### Database Paths

- **NOVA Agent:** Configured in `main.rs` via environment variables or defaults to `D:\databases\agent_learning.db`
- **Vibe Code Studio:** Configured in `DatabaseService.ts` as `D:\databases\agent_learning.db`

### IPC Bridge

- **Port:** 5004 (configurable via `PORT` environment variable)
- **Host:** localhost (not configurable for security)

## Dependencies

### Shared Package

- `better-sqlite3` - SQLite for Node.js
- `sql.js` - SQLite for browser

### IPC Bridge

- `ws` - WebSocket library

### NOVA Agent

- `tauri` - Desktop framework
- `rusqlite` - SQLite for Rust

### Vibe Code Studio

- `electron` - Desktop framework
- `better-sqlite3` - SQLite for Electron
- `react` - UI framework

## Platform Support

### Operating Systems

- **Primary:** Windows 11
- **Secondary:** Windows 10, macOS, Linux

### Database Path Handling

- Windows: `D:\databases\` (primary), fallback to AppData
- macOS: `~/Library/Application Support/`
- Linux: `~/.local/share/`

## Performance Considerations

### Database Access

- Direct file access (no network overhead)
- Parameterized queries (SQL injection prevention)
- Connection pooling where applicable

### IPC Bridge

- WebSocket for low-latency communication
- Message batching for efficiency
- Connection pooling and reuse

### UI Updates

- Auto-refresh every 30 seconds
- Manual refresh available
- Lazy loading for large datasets

## Security Considerations

### IPC Bridge

- Localhost-only (no external access)
- Message validation
- Path sanitization
- No authentication (local machine security)

### Database Access

- Direct file access (local machine only)
- Parameterized queries
- Error handling without data exposure

## Testing

### Manual Testing

- IPC Bridge connection
- Database read/write operations
- Cross-app communication
- UI updates and refresh

### Integration Testing

- End-to-end message flow
- Database synchronization
- Error handling and recovery
- Performance under load
