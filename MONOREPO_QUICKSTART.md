# Monorepo Quick Start Guide

## Overview

This is the **dev monorepo** - a unified workspace containing NOVA Agent, Deepcode Editor, shared packages, and backend services.

## Prerequisites

- **Node.js** 20+
- **pnpm** 8+
- **Windows 11** (optimized for AMD Ryzen 7 + RTX 3060)

## Installation

```powershell
# Install dependencies
pnpm install

# Build all shared packages
pnpm turbo run build --filter='@vibetech/*'
```

## Environment Setup

Copy `.env.example` to `.env` and configure paths:

```env
# Database Paths (D:\ drive - single source of truth)
APP_DB_PATH=D:\databases\database.db
LEARNING_DB_PATH=D:\databases\agent_learning.db

# IPC Bridge
IPC_WS_URL=ws://localhost:5004

# Application Environment
NODE_ENV=development
LOG_LEVEL=info
```

## Key Applications

### NOVA Agent
Context-aware AI assistant with learning system

```powershell
pnpm dev:nova
```

### Deepcode Editor
AI-powered code editor (Cursor/Windsurf/VS Code alternative)

```powershell
pnpm dev:vibe
```

### IPC Bridge
WebSocket bridge for NOVA ↔ Deepcode communication

```powershell
cd backend/ipc-bridge
node src/server.js
```

## Shared Packages

- **@vibetech/shared-config** - Environment & path configuration
- **@vibetech/shared-ipc** - IPC message schemas & contracts
- **@vibetech/db-app** - App database adapter (WAL mode)
- **@vibetech/db-learning** - Learning database adapter
- **@vibetech/logger** - Structured JSON logging

## Database Architecture

### Dual-Database Strategy

**App Database** (`D:\databases\database.db`)
- Business data, user preferences, settings
- Read/write operations
- Uses WAL mode for concurrency

**Learning Database** (`D:\databases\agent_learning.db`)
- Mistakes, knowledge entries, patterns
- Append-only writes
- Shared between NOVA and Deepcode

### Usage

```typescript
import { AppDatabase } from '@vibetech/db-app';
import { LearningDatabase } from '@vibetech/db-learning';

// App database
const appDb = AppDatabase.getInstance();
const db = appDb.getDatabase();

// Learning database
const learningDb = LearningDatabase.getInstance();
learningDb.logMistake({
  timestamp: new Date().toISOString(),
  platform: 'windows',
  category: 'typescript',
  description: 'Missing type annotation',
  fix: 'Added explicit type',
  severity: 'low',
  source: 'deepcode',
});
```

## IPC Communication

### Message Schema

```typescript
import { createOpenFileMessage, validateIPCMessage } from '@vibetech/shared-ipc';

// Create message
const message = createOpenFileMessage('nova', {
  filePath: 'C:\\dev\\test.ts',
  line: 10,
  column: 5,
});

// Validate incoming message
const validated = validateIPCMessage(rawMessage);
```

### Contract Tests

```powershell
pnpm --filter '@vibetech/shared-ipc' test
```

## Development Commands

```powershell
# Build all packages
pnpm build

# Build only changed packages (incremental)
pnpm turbo run build

# Run tests
pnpm test

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Clean all build artifacts
pnpm clean
```

## CI/CD

GitHub Actions workflows:
- **ci.yml** - Full verification (typecheck, lint, test, build)
- **affected.yml** - Only changed packages

## Health Checks

### IPC Bridge
```bash
curl http://localhost:5004/healthz
curl http://localhost:5004/readyz
curl http://localhost:5004/metrics
```

## Logging

All services use structured JSON logging:

```typescript
import { createLogger } from '@vibetech/logger';

const logger = createLogger('my-service');
logger.info('Service started', { port: 5004 });
logger.error('Connection failed', { host: 'localhost' }, error);
```

## Troubleshooting

### Port 5004 already in use
```powershell
# Kill process on port 5004
Get-Process -Id (Get-NetTCPConnection -LocalPort 5004).OwningProcess | Stop-Process -Force
```

### Database locked errors
```typescript
// Checkpoint WAL to release locks
appDb.checkpoint();
learningDb.checkpoint();
```

### Module resolution errors
```powershell
# Rebuild all packages
pnpm clean
pnpm install
pnpm turbo run build
```

## Resources

- [Memory Bank](./memory-bank/) - Project context & progress
- [IPC Contracts](./packages/shared-ipc/) - Message schemas
- [Database Adapters](./packages/db-app/) - DB utilities
- [E2E Tests](./tests/e2e/) - Integration tests
