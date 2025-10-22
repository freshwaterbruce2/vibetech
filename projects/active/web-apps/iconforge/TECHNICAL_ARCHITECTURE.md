# IconForge - Technical Architecture (2025 Verified)

> **Last Updated**: October 2025
> **Status**: Ready for Implementation
> **Review Source**: Web research + 2025 best practices verification

---

## Executive Summary

This document defines the production-ready technical stack for IconForge, verified against 2025 best practices through comprehensive web research comparing modern alternatives.

**Key Changes from Original PRD**:
- Canvas: Fabric.js (not Konva.js)
- Backend: Fastify (not Express)
- AI: DALL-E 3 first, Stable Diffusion later
- Auth: Clerk (enhanced recommendation)
- Collaboration: Socket.io + Yjs CRDT

---

## Technology Stack

### Frontend Architecture

```typescript
{
  // Core Framework
  framework: "React 18.3+",
  language: "TypeScript 5.9+",
  bundler: "Vite 7",

  // Canvas & Graphics
  canvas: "Fabric.js 6.0",         // PRIMARY: Object manipulation
  rendering: "HTML5 Canvas",
  future3D: "React Three Fiber 9", // Phase 5

  // UI Components
  components: "shadcn/ui",
  primitives: "Radix UI",
  styling: "Tailwind CSS 3.4.18",  // LOCKED VERSION

  // State Management
  serverState: "TanStack Query (React Query) 5",
  clientState: "Zustand 5",
  forms: "React Hook Form 7 + Zod 4",

  // Routing
  router: "React Router v7",

  // Optimization
  svgOptimization: "SVGO 3.3+",
  imageProcessing: "Sharp 0.33+"
}
```

### Backend Architecture

```typescript
{
  // API Framework
  framework: "Fastify 5",          // 2x faster than Express
  language: "TypeScript 5.9+",
  validation: "Zod 4",

  // Database & Storage
  database: "PostgreSQL 16 (Supabase)",
  orm: "Prisma 6",
  storage: "Supabase Storage (S3-compatible)",
  cache: "Redis 7 (Upstash)",

  // Real-time
  websocket: "Socket.io 4.7",
  crdt: "Yjs 13.6",                // Collaborative editing

  // Background Jobs
  queue: "Bull 4 (Redis-based)",

  // Authentication
  auth: "Clerk",                   // Primary recommendation
  authAlt: "Supabase Auth",        // Budget-friendly alternative

  // AI Services
  aiPrimary: "OpenAI API (DALL-E 3)",
  aiAdvanced: "Stable Diffusion (self-hosted)", // Phase 4+
  vectorization: "Potrace 1.16"
}
```

### Infrastructure

```typescript
{
  // Hosting
  frontend: "Vercel",
  backend: "Railway / Fly.io",
  database: "Supabase Cloud",

  // Monitoring & Analytics
  errors: "Sentry",
  analytics: "PostHog",
  uptime: "Better Uptime",

  // CI/CD
  pipeline: "GitHub Actions",
  testing: "Vitest + Playwright"
}
```

---

## Critical Technology Decisions

### 1. Canvas Library: Fabric.js ✅

**Decision**: Use Fabric.js as the primary canvas library

**Rationale**:
- **Built-in object manipulation**: Click, drag, resize, rotate out-of-the-box
- **Text editing**: Native inline text editing (Konva requires custom implementation)
- **Filters & Effects**: Built-in blur, emboss, gradients, custom filters
- **SVG Support**: Strong import/export capabilities
- **Icon Editor Focus**: Designed for graphic design tools
- **Community**: 25.7k GitHub stars, active maintenance

**Performance**:
- Sufficient for icon editing (hundreds of objects)
- Layer-based optimization available
- Caching system for static elements

**Alternative Considered**: Konva.js
- Better raw performance for animations
- Would require significant custom code for editing features
- Better suited for games/visualizations, not editors

**Code Example**:
```typescript
import { Canvas, Circle, Rect, Triangle } from 'fabric';

const canvas = new Canvas('canvas-element', {
  width: 512,
  height: 512,
  backgroundColor: '#ffffff'
});

// Add shape with built-in manipulation
const circle = new Circle({
  radius: 50,
  fill: '#3b82f6',
  left: 100,
  top: 100
});

canvas.add(circle);
// Automatically handles: selection, dragging, resizing, rotation
```

### 2. Backend Framework: Fastify ✅

**Decision**: Use Fastify instead of Express

**Rationale**:
- **Performance**: 30,000 req/sec vs Express's 15,000 (2x improvement)
- **Type Safety**: First-class TypeScript support
- **Schema Validation**: Built-in JSON Schema validation (critical for icon metadata)
- **Modern**: Async/await native, no callback hell
- **Plugins**: Rich ecosystem, easy integration

**Benchmarks** (2025):
```
Express:  ~15,000 requests/second
Fastify:  ~30,000 requests/second
Hono:     ~25,000 requests/second (serverless-optimized)
```

**Migration Effort**: Low (similar API to Express)

**Code Example**:
```typescript
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const fastify = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>();

// Type-safe route with validation
fastify.get('/api/icons/:id', {
  schema: {
    params: Type.Object({
      id: Type.String({ format: 'uuid' })
    }),
    response: {
      200: Type.Object({
        id: Type.String(),
        name: Type.String(),
        data: Type.Object({})
      })
    }
  }
}, async (request, reply) => {
  const icon = await db.icon.findUnique({
    where: { id: request.params.id }
  });
  return icon;
});

fastify.listen({ port: 3000 });
```

### 3. AI Integration Strategy ✅

**Decision**: Phased AI approach
- **Phase 1-3 (MVP)**: DALL-E 3 only
- **Phase 4+ (Enterprise)**: Add Stable Diffusion

**DALL-E 3 Advantages**:
- **Speed**: 3-4x faster than Stable Diffusion
- **Prompt Adherence**: Better for specific icon requests
- **Commercial Rights**: Clear licensing included
- **Simplicity**: Simple API integration
- **Quality**: Excellent for clean, simple icon styles

**Pricing**:
```
Standard Quality (1024×1024): $0.040/image
HD Quality (1024×1024):       $0.080/image

Pro Tier Economics:
- User pays: $9/month
- 100 generations included = $4 cost
- Gross margin: $5/user = 55%
- ROI: Positive ✅
```

**Stable Diffusion for Phase 4+**:
- **Use Case**: Enterprise custom model training
- **Deployment**: Self-hosted (cost savings at scale)
- **Target**: Companies wanting brand-specific icon sets
- **Pricing**: Enterprise tier only ($299+/month)

**Implementation**:
```typescript
// Phase 1-3: DALL-E 3
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateIcon(prompt: string, style: string) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `${style} icon: ${prompt}. Simple, clean, suitable for UI. Transparent background.`,
    size: "1024x1024",
    quality: "standard",
    n: 1
  });

  const imageUrl = response.data[0].url;
  // Post-process: vectorize with Potrace, optimize with SVGO
  return imageUrl;
}
```

### 4. Authentication: Clerk ✅

**Decision**: Use Clerk for authentication & user management

**Rationale**:
- **Pre-built UI**: Beautiful sign-in/sign-up components
- **User Management**: Admin dashboard included
- **OAuth Providers**: Google, GitHub, etc. out-of-the-box
- **Session Management**: JWT + refresh tokens handled
- **Webhooks**: User lifecycle events
- **DX**: Better developer experience than custom OAuth

**Pricing**:
```
Free:     10,000 MAU
Pro:      $25/month (additional MAU: $0.02 each)
Business: $99/month (advanced features)

Break-even: ~1,250 paid users ($9/user × 1,250 = $11,250 MRR)
```

**Alternative**: Supabase Auth
- **Cost**: Free tier 50,000 MAU, then $0.00325/MAU
- **Pros**: Integrated with Supabase database
- **Cons**: Less polished UI, more DIY

**Implementation**:
```typescript
// Frontend (React)
import { ClerkProvider, SignIn, SignUp, UserButton } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProvider publishableKey={process.env.VITE_CLERK_KEY}>
      <UserButton />
      {/* User automatically authenticated */}
    </ClerkProvider>
  );
}

// Backend (Fastify)
import { clerkPlugin } from '@clerk/fastify';

fastify.register(clerkPlugin);

fastify.get('/api/icons', {
  preHandler: fastify.clerkAuth
}, async (request, reply) => {
  const userId = request.auth.userId; // Verified JWT
  const icons = await db.icon.findMany({ where: { userId } });
  return icons;
});
```

### 5. Real-Time Collaboration: Socket.io + Yjs ✅

**Decision**: Use Socket.io for transport + Yjs for CRDT

**Rationale**:
- **Socket.io**: Handles WebSocket connections, reconnection, fallbacks
- **Yjs**: Conflict-free Replicated Data Type (CRDT) for merging changes
- **Why Both**: Socket.io alone can't handle merge conflicts in collaborative editing

**Architecture**:
```
┌─────────────┐
│  Client 1   │───┐
│ (Yjs Doc)   │   │
└─────────────┘   │
                  ├──> Socket.io ──> Yjs Server ──> PostgreSQL
┌─────────────┐   │         ↓
│  Client 2   │───┘      Redis
│ (Yjs Doc)   │        (Awareness)
└─────────────┘
```

**Features Enabled**:
- Real-time cursor tracking
- Layer changes sync
- Undo/redo across clients
- Offline editing (syncs on reconnect)
- No merge conflicts (CRDT guarantees)

**Implementation**:
```typescript
// Server
import { Server } from 'socket.io';
import { WebsocketProvider } from 'y-websocket/bin/utils';
import * as Y from 'yjs';

const io = new Server(3001);
const docs = new Map<string, Y.Doc>();

io.on('connection', (socket) => {
  socket.on('join-project', ({ projectId }) => {
    if (!docs.has(projectId)) {
      docs.set(projectId, new Y.Doc());
    }

    const doc = docs.get(projectId);
    const provider = new WebsocketProvider(
      'ws://localhost:3001',
      projectId,
      doc
    );

    socket.join(projectId);
  });
});

// Client
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const provider = new WebsocketProvider(
  'ws://localhost:3001',
  projectId,
  doc
);

const layers = doc.getArray('layers');
layers.observe((event) => {
  // Update Fabric.js canvas when layers change
  updateCanvas(layers.toArray());
});
```

---

## Database Schema Design

### PostgreSQL (Supabase)

```sql
-- Users (managed by Clerk/Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free', -- free, pro, team, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Icons
CREATE TABLE icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  svg_data TEXT NOT NULL,
  layers JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Icon Versions (history)
CREATE TABLE icon_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_id UUID REFERENCES icons(id) ON DELETE CASCADE,
  version INT NOT NULL,
  svg_data TEXT NOT NULL,
  layers JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(icon_id, version)
);

-- Collaborators
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer', -- viewer, editor, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- AI Generations (tracking & caching)
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style TEXT NOT NULL,
  model TEXT NOT NULL, -- dalle-3, stable-diffusion
  image_url TEXT,
  cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exports (tracking)
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_id UUID REFERENCES icons(id) ON DELETE CASCADE,
  format TEXT NOT NULL, -- svg, png, ico, webp, pdf
  options JSONB DEFAULT '{}',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_icons_project ON icons(project_id);
CREATE INDEX idx_versions_icon ON icon_versions(icon_id, version DESC);
CREATE INDEX idx_collaborators_project ON collaborators(project_id);
CREATE INDEX idx_collaborators_user ON collaborators(user_id);
CREATE INDEX idx_ai_generations_user ON ai_generations(user_id);
```

---

## Performance Requirements

### Canvas Performance Budget

```typescript
export const PERFORMANCE_BUDGET = {
  canvas: {
    renderTarget: 16.67,      // 60 FPS
    inputLatency: 50,          // Input to visual update
    maxObjects: 500,           // Before layer splitting
    zoomLevels: [25, 50, 100, 200, 400],
  },

  export: {
    svg: {
      small: 500,              // <64x64
      medium: 1000,            // 64-256
      large: 2000,             // 256-512
    },
    png: {
      single: 1500,            // All sizes
      batch: 5000,             // 10 icons
    },
    sprite: 3000,              // 50 icons
  },

  ai: {
    dalle3: {
      target: 8000,            // Typical response time
      timeout: 30000,          // Fallback timeout
      retry: 3,                // Max retries
    }
  },

  api: {
    p50: 100,                  // 50th percentile
    p95: 200,                  // 95th percentile
    p99: 500,                  // 99th percentile
  }
} as const;
```

### Bundle Size Targets

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'fabric': ['fabric'],
          'ui-primitives': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'state': ['zustand', '@tanstack/react-query'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});

// Target sizes:
{
  initial: '<500KB',          // First contentful paint
  fabricChunk: '<300KB',      // Lazy loaded
  uiChunk: '<200KB',
  total: '<2MB'
}
```

---

## Security Requirements

### Authentication & Authorization

```typescript
// JWT Verification (Clerk)
import { clerkClient } from '@clerk/fastify';

fastify.register(clerkPlugin, {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
});

// Role-based access control
async function checkProjectAccess(userId: string, projectId: string, requiredRole: Role) {
  const collaborator = await db.collaborator.findUnique({
    where: {
      project_id_user_id: {
        project_id: projectId,
        user_id: userId
      }
    }
  });

  if (!collaborator) throw new Error('Access denied');

  const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
  if (roleHierarchy[collaborator.role] < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions');
  }
}
```

### Input Validation

```typescript
// SVG Sanitization
import { sanitize } from 'isomorphic-dompurify';

function sanitizeSVG(svgString: string): string {
  return sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: ['svg', 'path', 'circle', 'rect', 'polygon', 'line', 'polyline', 'g', 'defs', 'linearGradient', 'radialGradient', 'stop'],
    ALLOWED_ATTR: ['d', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'transform', 'id', 'class']
  });
}
```

### Rate Limiting

```typescript
import rateLimit from '@fastify/rate-limit';

// API rate limiting
fastify.register(rateLimit, {
  max: 100,                    // 100 requests
  timeWindow: '1 minute',
  cache: 10000,                // Cache size
  allowList: ['127.0.0.1'],
  redis: redisClient,
});

// AI generation rate limiting (per user)
fastify.post('/api/ai/generate', {
  preHandler: [
    fastify.clerkAuth,
    async (request, reply) => {
      const count = await redis.incr(`ai:${request.auth.userId}:${Date.now()}`);
      if (count > 10) {
        reply.code(429).send({ error: 'Rate limit exceeded' });
      }
    }
  ]
}, generateHandler);
```

---

## Testing Strategy

### Testing Stack

```typescript
{
  unit: "Vitest",
  e2e: "Playwright",
  visual: "Chromatic (Storybook)",
  api: "Supertest + Vitest",
  coverage: {
    target: 80,
    critical: 90  // Trading/financial logic
  }
}
```

### Critical Test Areas

1. **Canvas Operations** (90% coverage)
   - Shape manipulation
   - Layer management
   - Export generation
   - Undo/redo

2. **Real-time Sync** (85% coverage)
   - CRDT merge resolution
   - Offline handling
   - Reconnection

3. **AI Integration** (80% coverage)
   - Generation flow
   - Error handling
   - Retry logic
   - Cost tracking

4. **Authentication** (95% coverage)
   - JWT verification
   - Permission checks
   - Session management

---

## Deployment Architecture

### Production Environment

```yaml
# Frontend (Vercel)
vercel:
  framework: vite
  regions: [iad1, sfo1, fra1]  # US East, West, EU
  edge: enabled
  analytics: enabled

# Backend (Railway)
railway:
  services:
    - name: api
      framework: fastify
      instances: 2
      memory: 1GB
      env:
        - DATABASE_URL
        - REDIS_URL
        - CLERK_SECRET_KEY
        - OPENAI_API_KEY

    - name: websocket
      framework: socket-io
      instances: 2
      memory: 512MB
      env:
        - REDIS_URL

    - name: worker
      framework: bull
      instances: 1
      memory: 2GB
      env:
        - OPENAI_API_KEY
        - DATABASE_URL

# Database (Supabase)
supabase:
  plan: pro
  region: us-east-1
  backups: daily
  replicas: 1

# Cache (Upstash Redis)
upstash:
  plan: pro
  region: global
  persistence: enabled
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: railway/deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
```

---

## Migration Path from MVP to Scale

### Phase 1 (MVP): Months 1-3
- Single Vercel deployment
- Single Railway API instance
- Supabase free tier → Pro at 1,000 users
- Clerk free tier → Pro at 10,000 MAU
- AI: DALL-E 3 only

### Phase 2 (Growth): Months 4-6
- Add CDN for static assets
- Scale Railway to 2-3 instances
- Add Redis caching layer
- Implement Bull queue for AI jobs
- Add Sentry for error tracking

### Phase 3 (Scale): Months 7-12
- Multi-region deployment
- Read replicas for database
- Separate WebSocket servers
- Add Stable Diffusion (self-hosted)
- Implement plugin system

### Phase 4 (Enterprise): Year 2+
- Self-hosted option
- Custom model training
- SLA guarantees
- Dedicated support
- Advanced analytics

---

## Cost Projections

### Startup Costs (Months 1-3)

```
Development Tools:
- GitHub: $0 (open source)
- Vercel: $20/month
- Railway: $5/month
- Supabase: $0 (free tier)
- Clerk: $0 (free tier)
- Domain: $12/year
Total: ~$35/month

AI Costs (Testing):
- DALL-E 3: ~$100/month
Total: ~$135/month
```

### Operating Costs at Scale

```
10,000 MAU Target:
- Vercel Pro: $20/month
- Railway (3 instances): $45/month
- Supabase Pro: $25/month
- Clerk Pro: $25/month
- Upstash Redis: $10/month
- CDN: $20/month
- Monitoring: $20/month
Total Infrastructure: ~$165/month

AI Costs (100 gen/user, 20% adoption):
- 10,000 × 0.2 × 100 × $0.04 = $8,000/month

Total: ~$8,165/month

Revenue (10,000 MAU, 10% conversion):
- 1,000 paid users × $9 = $9,000/month

Gross Margin: $835/month (9.3%)
Break-even: ~1,100 paid users
```

---

## Conclusion

This technical architecture provides a **production-ready, scalable foundation** for IconForge based on verified 2025 best practices.

**Key Strengths**:
- High-performance canvas editing (Fabric.js)
- Fast, type-safe backend (Fastify)
- Real-time collaboration (Socket.io + Yjs)
- Clear AI cost model (DALL-E 3)
- Strong developer experience
- Scalable infrastructure

**Next Steps**:
1. Review and approve architecture
2. Set up development environment
3. Create POC with Fabric.js (2-3 days)
4. Begin Phase 1 MVP development

**Estimated Development Timeline**: 12 months to enterprise-ready platform

---

## References

- [Fabric.js Documentation](https://fabricjs.com/)
- [Fastify Documentation](https://fastify.dev/)
- [Yjs Documentation](https://docs.yjs.dev/)
- [OpenAI DALL-E 3 API](https://platform.openai.com/docs/guides/images)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
