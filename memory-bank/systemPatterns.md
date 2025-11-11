# System Patterns: Agent Nova & Vibe Code Studio Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Shared Learning Databases                      │
│              D:\databases\                                  │
├─────────────────────────────────────────────────────────────┤
│  • database.db        (unified: mistakes, knowledge, etc)  │
│  • nova_activity.db   (activity tracking)                 │
└─────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
         │ Direct Write                 │ Direct Write
         │                              │
┌────────┴─────────┐         ┌──────────┴──────────┐
│   NOVA Agent     │         │  Vibe Code Studio  │
│   (Tauri/Rust)   │◄───────►│  (Electron/React)  │
│                  │   IPC   │                    │
│ • Writes directly│  Bridge │ • Writes directly  │
│ • Sends updates  │  :5004  │ • Reads directly   │
│ • Reads directly │         │ • Sends updates     │
└──────────────────┘         └────────────────────┘
```

## Key Design Patterns

### 1. Shared Package Pattern

**Location:** `packages/vibetech-shared/`

**Purpose:** Eliminate code duplication between applications

**Components:**

- Specialized AI Agents (Backend, Frontend, Technical Lead)
- Database schemas and interfaces
- AI service types and prompt builder
- Learning system components
- IPC Bridge client
- Common TypeScript types

**Usage:**

```typescript
import { WebSocketBridge, createIPCMessage } from '@vibetech/shared';
```

### 2. Database-First Learning Pattern

**Location:** `D:\databases\database.db`

**Pattern:** Both applications write directly to unified shared database

**Benefits:**

- No data synchronization delays
- Single source of truth
- Real-time access from both apps
- No data loss risk

**Implementation:**

- NOVA Agent: Direct Rust/SQLite access
- Vibe Code Studio: Electron IPC → SQLite access

### 3. IPC Bridge Communication Pattern

**Location:** `backend/ipc-bridge/`

**Pattern:** WebSocket-based message broadcasting

**Message Flow:**

1. App sends message to IPC Bridge
2. Bridge validates and logs message
3. Bridge broadcasts to all connected clients
4. Receiving app processes message

**Message Types:**

- `file_open` - File context sharing
- `context_update` - Context synchronization
- `activity_sync` - Activity data sync
- `learning_update` - Learning data synchronization

### 4. Platform Categorization Pattern

**Pattern:** Mistakes and knowledge tagged by platform

**Platforms:**

- `desktop` - Electron/Tauri specific
- `web` - Browser/DOM specific
- `mobile` - Touch/mobile specific
- `python` - Python-specific patterns
- `general` - Universal patterns

**Usage:**

```typescript
await databaseService.logMistake({
  platform: 'web',
  // ... other fields
});
```

### 5. App Source Tracking Pattern

**Pattern:** All learning data tagged with source app

**Sources:**

- `nova` - From NOVA Agent
- `vibe` - From Vibe Code Studio

**Database Schema:**

```sql
app_source TEXT CHECK(app_source IN ('nova', 'vibe'))
```

### 6. Real-time UI Update Pattern

**Pattern:** LearningPanel auto-refreshes every 30 seconds

**Implementation:**

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refreshData();
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

## Component Relationships

### NOVA Agent Components

- `src-tauri/src/commands/vibe_integration.rs` - Vibe integration commands
- `src-tauri/src/learning_db.rs` - Learning database module
- `src-tauri/src/main.rs` - IPC Bridge client integration

### Vibe Code Studio Components

- `src/services/NovaAgentBridge.ts` - IPC Bridge client
- `src/services/DatabaseService.ts` - Database access with learning methods
- `src/components/LearningPanel.tsx` - UI component for learning data

### Shared Components

- `packages/vibetech-shared/` - Shared code package
- `backend/ipc-bridge/` - IPC Bridge server

## Data Flow Patterns

### Learning Data Flow

1. Mistake occurs in either app
2. App writes directly to `D:\databases\database.db`
3. App sends `learning_update` message via IPC Bridge
4. Other app receives message and refreshes UI
5. LearningPanel displays updated data

### File Context Flow

1. User requests file open from NOVA
2. NOVA calls `launch_vibe_code_studio()` Tauri command
3. NOVA sends `file_open` message via IPC Bridge
4. Vibe receives message and opens file
5. Context is synchronized

### Activity Sync Flow

1. Activity occurs in either app
2. App sends `activity_sync` message via IPC Bridge
3. Other app receives and processes activity data
4. Activity is logged to respective databases

## Error Handling Patterns

### Database Access

- Try direct database access first
- Fallback to localStorage if database unavailable
- Log errors for debugging
- Graceful degradation

### IPC Bridge

- Automatic reconnection with exponential backoff
- Connection state tracking
- Message validation before processing
- Error logging and statistics

### UI Updates

- Loading states during data fetch
- Empty states when no data
- Error states with retry options
- Auto-refresh with manual refresh option

## Security Patterns

### IPC Bridge

- Localhost-only connections
- Message validation
- Path sanitization
- No authentication (relies on local machine security)

### Database Access

- Direct file access (local machine only)
- SQL injection prevention via parameterized queries
- Error handling without exposing sensitive data
