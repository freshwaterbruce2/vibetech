# IconForge - AI-Powered Icon Creation Platform

This file provides guidance to Claude Code when working with the IconForge project.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers (frontend + backend)
pnpm run dev

# Frontend only (port 5173)
pnpm run dev:frontend

# Backend only (port 3000)
pnpm run dev:backend

# Build for production
pnpm run build

# Quality checks
pnpm run quality        # lint + typecheck + build
pnpm run quality:fix    # auto-fix + typecheck
```

## Architecture Overview

IconForge is a full-stack web application with React frontend and Node.js backend:

### Frontend Stack
- **Framework**: React 19 + TypeScript 5.9 + Vite 7
- **UI Components**: shadcn/ui + Tailwind CSS 3.4.18
- **Canvas Editor**: Fabric.js 6.7.0 (HTML5 canvas manipulation)
- **State Management**: Zustand (lightweight store)
- **Data Fetching**: TanStack Query v5 (React Query)
- **Authentication**: Clerk (OAuth + session management)
- **Routing**: React Router 7

### Backend Stack
- **Framework**: Fastify (high-performance Node.js HTTP server)
- **Database**: SQLite (D:\databases\database.db - unified database)
- **Real-time**: Socket.io + Yjs (CRDT for collaborative editing)
- **AI Integration**: DALL-E 3 API (OpenAI)
- **File Storage**: Local filesystem + cloud storage (future)

### Key Technologies
- **Fabric.js**: Canvas-based vector editor (shapes, text, images, paths)
- **Yjs**: Conflict-free Replicated Data Type for real-time collaboration
- **Socket.io**: WebSocket server for real-time updates
- **Clerk**: User authentication with OAuth providers

## Project Structure

```
iconforge/
├── src/
│   ├── components/
│   │   ├── canvas/          # Fabric.js canvas editor
│   │   ├── toolbar/         # Editor toolbar components
│   │   ├── sidebar/         # Layer panel, properties
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/
│   │   ├── useCanvas.ts     # Canvas state management
│   │   ├── useCollaboration.ts  # Yjs integration
│   │   └── useAIGeneration.ts   # DALL-E API integration
│   ├── stores/
│   │   ├── canvasStore.ts   # Zustand canvas state
│   │   └── userStore.ts     # User preferences
│   ├── lib/
│   │   ├── fabric-utils.ts  # Fabric.js helpers
│   │   └── ai-client.ts     # OpenAI API client
│   └── pages/
│       ├── Editor.tsx       # Main editor page
│       ├── Gallery.tsx      # Icon gallery
│       └── Dashboard.tsx    # User dashboard
├── backend/
│   ├── server.ts            # Fastify app entry
│   ├── routes/
│   │   ├── icons.ts         # Icon CRUD operations
│   │   ├── ai.ts            # AI generation endpoints
│   │   └── collaboration.ts # Real-time collaboration
│   ├── services/
│   │   ├── database.ts      # SQLite connection
│   │   └── storage.ts       # File storage service
│   └── websocket/
│       └── yjs-server.ts    # Yjs WebSocket provider
└── shared/
    └── types/               # Shared TypeScript types
```

## Common Commands

### Development
```bash
# Start both frontend and backend
pnpm run dev

# Start frontend only
pnpm run dev:frontend

# Start backend only
pnpm run dev:backend

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
pnpm run lint:fix
```

### Database Operations
```bash
# Connect to database
sqlite3 D:\databases\database.db

# Check tables
.tables

# Query icons
SELECT * FROM icons ORDER BY created_at DESC LIMIT 10;

# Query users
SELECT id, username, email, created_at FROM users;
```

### Testing
```bash
# Run all tests
pnpm run test

# Run frontend tests
pnpm run test:unit

# Run with coverage
pnpm run test:unit:coverage

# E2E tests
pnpm run test:e2e
```

### Build & Deploy
```bash
# Production build
pnpm run build

# Preview production build
pnpm run preview

# Build backend only
pnpm run build:backend
```

## Environment Variables

Create `.env` file in project root:

```env
# Backend Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=D:\databases\database.db

# OpenAI API (DALL-E 3)
OPENAI_API_KEY=sk-...

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# WebSocket
WS_PORT=3001
```

## Key Features Implementation

### 1. Fabric.js Canvas Editor
- Vector shape tools (rectangle, circle, polygon, star)
- Text editing with fonts, sizes, colors
- Image import and manipulation
- Layer management (z-index, grouping)
- Undo/redo functionality
- Export to SVG, PNG, JPG

**Implementation**: `src/components/canvas/FabricCanvas.tsx`

### 2. AI-Powered Icon Generation
- DALL-E 3 integration for text-to-icon
- Prompt engineering for icon style consistency
- Background removal for transparent icons
- Style presets (flat, 3D, gradient, line art)

**Implementation**: `src/hooks/useAIGeneration.ts`, `backend/routes/ai.ts`

### 3. Real-time Collaboration
- Yjs CRDT for conflict-free editing
- Socket.io for WebSocket connections
- Cursor presence indicators
- Live canvas synchronization

**Implementation**: `src/hooks/useCollaboration.ts`, `backend/websocket/yjs-server.ts`

### 4. Icon Library Management
- SQLite database for metadata
- Tag-based search and filtering
- Collections and folders
- Public/private sharing

**Implementation**: `backend/services/database.ts`, `src/pages/Gallery.tsx`

## Known Issues & Workarounds

### Issue 1: Fabric.js Memory Leaks
**Problem**: Canvas objects not properly disposed on unmount
**Workaround**: Always call `canvas.dispose()` in cleanup
```typescript
useEffect(() => {
  const canvas = new fabric.Canvas('canvas')
  return () => {
    canvas.dispose()
  }
}, [])
```

### Issue 2: Yjs Synchronization Delays
**Problem**: Occasional 1-2 second lag in real-time updates
**Workaround**: Use awareness protocol for instant cursor updates
```typescript
awareness.setLocalStateField('cursor', { x, y })
```

### Issue 3: DALL-E 3 Rate Limits
**Problem**: 50 requests/minute limit on OpenAI API
**Workaround**: Implement request queue with exponential backoff
**Status**: Implemented in `src/lib/ai-client.ts`

### Issue 4: SQLite Locking on Concurrent Writes
**Problem**: Database locked errors with multiple users
**Workaround**: Use WAL mode and connection pooling
```sql
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
```

## Testing Strategy

### Unit Tests (Vitest)
- Canvas utilities: `src/lib/fabric-utils.test.ts`
- Zustand stores: `src/stores/*.test.ts`
- React hooks: `src/hooks/*.test.tsx`

### Integration Tests
- AI generation flow: `tests/integration/ai-generation.test.ts`
- Database operations: `tests/integration/database.test.ts`
- WebSocket connections: `tests/integration/websocket.test.ts`

### E2E Tests (Playwright)
- Editor workflow: Create, edit, export icon
- Collaboration: Multiple users editing same canvas
- Gallery: Search, filter, organize icons

**Coverage Target**: 80%+ for critical paths

## Performance Considerations

### Frontend Optimization
1. **Canvas Rendering**: Use `fabric.StaticCanvas` for non-interactive previews
2. **Image Loading**: Lazy load gallery thumbnails with Intersection Observer
3. **State Management**: Debounce canvas updates to reduce re-renders
4. **Bundle Size**: Code-split Fabric.js and AI components

### Backend Optimization
1. **Database**: Index on `user_id`, `tags`, `created_at` columns
2. **WebSocket**: Use Redis adapter for horizontal scaling (future)
3. **File Storage**: Implement CDN caching for static assets
4. **AI Requests**: Queue system with priority handling

### Current Performance Metrics
- Canvas load time: ~300ms (target: <200ms)
- AI generation: 8-12s (limited by DALL-E API)
- Real-time sync latency: <100ms (target: <50ms)
- Database query time: <10ms for reads

## Troubleshooting

### Canvas Not Rendering
1. Check if Fabric.js loaded: `console.log(fabric.version)`
2. Verify canvas element exists: `document.getElementById('canvas')`
3. Check console for CORS errors (image loading)

### WebSocket Connection Failed
1. Verify backend running on correct port: `netstat -an | findstr 3001`
2. Check firewall rules for WebSocket traffic
3. Inspect browser console for connection errors

### AI Generation Timeout
1. Check OpenAI API key validity
2. Verify API quota not exceeded: https://platform.openai.com/usage
3. Review request payload size (prompts <1000 chars recommended)

### Database Locked
1. Check for long-running queries: `.timeout` in sqlite3
2. Verify WAL mode enabled: `PRAGMA journal_mode;`
3. Restart backend to clear stale locks

## Contributing

When adding new features:
1. Follow existing code patterns (Fabric.js utilities in `lib/`)
2. Add TypeScript types to `shared/types/`
3. Write unit tests for business logic
4. Update this CLAUDE.md with new commands/patterns

## Related Documentation

- Fabric.js Docs: http://fabricjs.com/docs/
- Yjs Documentation: https://docs.yjs.dev/
- Clerk React SDK: https://clerk.com/docs/quickstarts/react
- TanStack Query: https://tanstack.com/query/latest
- Fastify Documentation: https://fastify.dev/

## Status

**Current Phase**: Phase 1 MVP (In Development)
**Version**: 1.0.0
**Last Updated**: 2025-10-13
