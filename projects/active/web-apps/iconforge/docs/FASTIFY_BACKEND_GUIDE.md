# Fastify Backend Architecture Guide for IconForge

> **Last Updated**: October 2025
> **Purpose**: Complete guide for building the IconForge backend API with Fastify
> **Target Audience**: Backend developers

---

## Table of Contents

1. [Why Fastify](#why-fastify)
2. [Project Structure](#project-structure)
3. [Server Setup](#server-setup)
4. [Type-Safe Routing](#type-safe-routing)
5. [Authentication with Clerk](#authentication-with-clerk)
6. [Database with Prisma](#database-with-prisma)
7. [File Upload & Storage](#file-upload--storage)
8. [WebSocket Integration](#websocket-integration)
9. [Background Jobs with Bull](#background-jobs-with-bull)
10. [Error Handling](#error-handling)
11. [Testing](#testing)
12. [Deployment](#deployment)

---

## Why Fastify

Fastify was chosen over Express for IconForge because:

✅ **Performance**: 2x faster than Express (30k vs 15k req/sec)
✅ **Type Safety**: First-class TypeScript support
✅ **Schema Validation**: Built-in JSON Schema validation
✅ **Modern**: Async/await native, no callback hell
✅ **Plugins**: Rich ecosystem with easy integration
✅ **Low Overhead**: Efficient JSON handling (critical for icon metadata)

**Benchmarks (2025)**:
```
Express:  ~15,000 requests/second
Fastify:  ~30,000 requests/second
Hono:     ~25,000 requests/second (serverless-focused)
```

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Fastify app setup
│   ├── config/
│   │   ├── env.ts              # Environment variables
│   │   └── plugins.ts          # Plugin registration
│   ├── routes/
│   │   ├── icons.ts            # Icon CRUD
│   │   ├── projects.ts         # Project management
│   │   ├── ai.ts               # AI generation
│   │   ├── export.ts           # Export endpoints
│   │   └── auth.ts             # Auth routes
│   ├── services/
│   │   ├── icon.service.ts     # Icon business logic
│   │   ├── ai.service.ts       # AI integration
│   │   ├── export.service.ts   # Export generation
│   │   └── storage.service.ts  # File storage
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── redis.ts            # Redis client
│   │   └── queue.ts            # Bull queue setup
│   ├── middleware/
│   │   ├── auth.ts             # Auth middleware
│   │   └── error.ts            # Error handler
│   ├── types/
│   │   └── index.ts            # Type definitions
│   └── utils/
│       ├── logger.ts           # Pino logger
│       └── validation.ts       # Custom validators
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data
├── tests/
│   ├── routes/
│   └── services/
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Server Setup

### 1. Entry Point

```typescript
// src/index.ts
import { build } from './app';
import { env } from './config/env';

const start = async () => {
  const app = await build({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    }
  });

  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0'
    });

    console.log(`🚀 Server listening on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

### 2. App Configuration

```typescript
// src/app.ts
import Fastify, { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { clerkPlugin } from '@clerk/fastify';

import { env } from './config/env';
import iconRoutes from './routes/icons';
import projectRoutes from './routes/projects';
import aiRoutes from './routes/ai';
import exportRoutes from './routes/export';

export async function build(opts = {}) {
  const app = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>();

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    }
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: env.REDIS_URL
  });

  // Authentication
  await app.register(clerkPlugin, {
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY
  });

  // File upload
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1
    }
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  // Routes
  await app.register(iconRoutes, { prefix: '/api/icons' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(exportRoutes, { prefix: '/api/export' });

  return app;
}
```

### 3. Environment Configuration

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Clerk
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),

  // OpenAI
  OPENAI_API_KEY: z.string(),

  // Supabase Storage
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173')
});

export const env = envSchema.parse(process.env);
```

---

## Type-Safe Routing

### 1. Icon Routes

```typescript
// src/routes/icons.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { IconService } from '../services/icon.service';

// Type definitions
const IconSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  projectId: Type.String({ format: 'uuid' }),
  svgData: Type.String(),
  layers: Type.Any(),
  metadata: Type.Optional(Type.Any()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
});

const CreateIconSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  projectId: Type.String({ format: 'uuid' }),
  svgData: Type.String({ minLength: 1 }),
  layers: Type.Any(),
  metadata: Type.Optional(Type.Any())
});

export default async function iconRoutes(app: FastifyInstance) {
  const iconService = new IconService();

  // Get all icons in a project
  app.get('/', {
    schema: {
      querystring: Type.Object({
        projectId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Array(IconSchema)
      }
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const { projectId } = request.query;
    const userId = request.auth.userId;

    const icons = await iconService.getIconsByProject(projectId, userId);
    return icons;
  });

  // Get single icon
  app.get('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      response: {
        200: IconSchema,
        404: Type.Object({
          error: Type.String()
        })
      }
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.auth.userId;

    const icon = await iconService.getIcon(id, userId);

    if (!icon) {
      reply.code(404).send({ error: 'Icon not found' });
      return;
    }

    return icon;
  });

  // Create icon
  app.post('/', {
    schema: {
      body: CreateIconSchema,
      response: {
        201: IconSchema,
        400: Type.Object({
          error: Type.String()
        })
      }
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const userId = request.auth.userId;
    const icon = await iconService.createIcon(request.body, userId);

    reply.code(201);
    return icon;
  });

  // Update icon
  app.put('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      body: Type.Partial(CreateIconSchema),
      response: {
        200: IconSchema,
        404: Type.Object({
          error: Type.String()
        })
      }
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.auth.userId;

    const icon = await iconService.updateIcon(id, request.body, userId);

    if (!icon) {
      reply.code(404).send({ error: 'Icon not found' });
      return;
    }

    return icon;
  });

  // Delete icon
  app.delete('/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      response: {
        204: Type.Null(),
        404: Type.Object({
          error: Type.String()
        })
      }
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.auth.userId;

    const deleted = await iconService.deleteIcon(id, userId);

    if (!deleted) {
      reply.code(404).send({ error: 'Icon not found' });
      return;
    }

    reply.code(204).send();
  });
}
```

### 2. Icon Service

```typescript
// src/services/icon.service.ts
import { db } from '../lib/db';
import { sanitizeSVG } from '../utils/validation';

interface CreateIconDto {
  name: string;
  projectId: string;
  svgData: string;
  layers: any;
  metadata?: any;
}

export class IconService {
  async getIconsByProject(projectId: string, userId: string) {
    // Verify user has access to project
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId },
          { collaborators: { some: { userId } } }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return db.icon.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getIcon(id: string, userId: string) {
    const icon = await db.icon.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId },
            { collaborators: { some: { userId } } }
          ]
        }
      },
      include: {
        project: true
      }
    });

    return icon;
  }

  async createIcon(data: CreateIconDto, userId: string) {
    // Verify user owns project
    const project = await db.project.findFirst({
      where: {
        id: data.projectId,
        userId
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Sanitize SVG
    const sanitizedSVG = sanitizeSVG(data.svgData);

    // Create icon
    const icon = await db.icon.create({
      data: {
        ...data,
        svgData: sanitizedSVG,
        version: 1
      }
    });

    // Create initial version
    await db.iconVersion.create({
      data: {
        iconId: icon.id,
        version: 1,
        svgData: sanitizedSVG,
        layers: data.layers,
        createdBy: userId
      }
    });

    return icon;
  }

  async updateIcon(id: string, data: Partial<CreateIconDto>, userId: string) {
    // Get current icon
    const icon = await this.getIcon(id, userId);
    if (!icon) return null;

    // Sanitize SVG if provided
    const updateData = {
      ...data,
      svgData: data.svgData ? sanitizeSVG(data.svgData) : undefined
    };

    // Update icon
    const updated = await db.icon.update({
      where: { id },
      data: {
        ...updateData,
        version: { increment: 1 }
      }
    });

    // Create new version
    await db.iconVersion.create({
      data: {
        iconId: id,
        version: updated.version,
        svgData: updated.svgData,
        layers: updated.layers,
        createdBy: userId
      }
    });

    return updated;
  }

  async deleteIcon(id: string, userId: string) {
    const icon = await this.getIcon(id, userId);
    if (!icon) return false;

    await db.icon.delete({ where: { id } });
    return true;
  }
}
```

---

## Authentication with Clerk

### 1. Setup

```typescript
// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      userId: string;
      sessionId: string;
    };
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.clerkAuth(request, reply);

    if (!request.auth?.userId) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
  } catch (error) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}
```

### 2. Role-Based Access Control

```typescript
// src/middleware/rbac.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../lib/db';

type Role = 'viewer' | 'editor' | 'admin';

export function requireRole(requiredRole: Role) {
  return async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
    const { projectId } = request.params;
    const userId = request.auth.userId;

    const collaborator = await db.collaborator.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (!collaborator) {
      reply.code(403).send({ error: 'Access denied' });
      return;
    }

    const roleHierarchy: Record<Role, number> = {
      viewer: 1,
      editor: 2,
      admin: 3
    };

    if (roleHierarchy[collaborator.role as Role] < roleHierarchy[requiredRole]) {
      reply.code(403).send({ error: 'Insufficient permissions' });
      return;
    }
  };
}

// Usage
app.delete('/api/projects/:projectId', {
  preHandler: [app.clerkAuth, requireRole('admin')]
}, async (request, reply) => {
  // Only admins can delete projects
});
```

---

## Database with Prisma

### 1. Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  plan      String   @default("free")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects      Project[]
  collaborators Collaborator[]
  aiGenerations AiGeneration[]

  @@map("users")
}

model Project {
  id        String   @id @default(uuid())
  userId    String
  name      String
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  icons         Icon[]
  collaborators Collaborator[]

  @@map("projects")
}

model Icon {
  id           String   @id @default(uuid())
  projectId    String
  name         String
  svgData      String   @db.Text
  layers       Json
  metadata     Json     @default("{}")
  thumbnailUrl String?
  version      Int      @default(1)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  project  Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versions IconVersion[]
  exports  Export[]

  @@index([projectId])
  @@map("icons")
}

model IconVersion {
  id        String   @id @default(uuid())
  iconId    String
  version   Int
  svgData   String   @db.Text
  layers    Json
  createdBy String
  createdAt DateTime @default(now())

  icon Icon @relation(fields: [iconId], references: [id], onDelete: Cascade)

  @@unique([iconId, version])
  @@index([iconId, version])
  @@map("icon_versions")
}

model Collaborator {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String   @default("viewer")
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
  @@map("collaborators")
}

model AiGeneration {
  id        String   @id @default(uuid())
  userId    String
  prompt    String
  style     String
  model     String
  imageUrl  String?
  cost      Decimal  @db.Decimal(10, 4)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("ai_generations")
}

model Export {
  id        String   @id @default(uuid())
  iconId    String
  format    String
  options   Json     @default("{}")
  fileUrl   String?
  createdAt DateTime @default(now())

  icon Icon @relation(fields: [iconId], references: [id], onDelete: Cascade)

  @@index([iconId])
  @@map("exports")
}
```

### 2. Prisma Client Setup

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### 3. Migrations

```bash
# Create migration
pnpm prisma migrate dev --name init

# Deploy migration
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Open Prisma Studio
pnpm prisma studio
```

---

## File Upload & Storage

### 1. Multipart Upload Handler

```typescript
// src/routes/upload.ts
import { FastifyInstance } from 'fastify';
import { StorageService } from '../services/storage.service';

export default async function uploadRoutes(app: FastifyInstance) {
  const storage = new StorageService();

  app.post('/upload', {
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      reply.code(400).send({ error: 'No file uploaded' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(data.mimetype)) {
      reply.code(400).send({ error: 'Invalid file type' });
      return;
    }

    // Upload to storage
    const fileUrl = await storage.upload(data, request.auth.userId);

    return { url: fileUrl };
  });
}
```

### 2. Supabase Storage Service

```typescript
// src/services/storage.service.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { nanoid } from 'nanoid';

export class StorageService {
  private supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY
  );

  async upload(file: any, userId: string): Promise<string> {
    const buffer = await file.toBuffer();
    const fileName = `${userId}/${nanoid()}-${file.filename}`;

    const { data, error } = await this.supabase.storage
      .from('icons')
      .upload(fileName, buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = this.supabase.storage
      .from('icons')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async delete(fileUrl: string): Promise<void> {
    const path = fileUrl.split('/icons/')[1];

    const { error } = await this.supabase.storage
      .from('icons')
      .remove([path]);

    if (error) throw error;
  }
}
```

---

## WebSocket Integration

### 1. WebSocket Server

```typescript
// src/lib/websocket.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from './redis';

export function setupWebSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true
    }
  });

  // Redis adapter for multi-instance support
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-project', ({ projectId, userId }) => {
      socket.join(projectId);
      socket.to(projectId).emit('user-joined', { userId });
    });

    socket.on('leave-project', ({ projectId, userId }) => {
      socket.leave(projectId);
      socket.to(projectId).emit('user-left', { userId });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
```

---

## Background Jobs with Bull

### 1. Queue Setup

```typescript
// src/lib/queue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from './redis';

export const aiQueue = new Queue('ai-generation', {
  connection: redis
});

export const exportQueue = new Queue('export-generation', {
  connection: redis
});
```

### 2. AI Generation Worker

```typescript
// src/workers/ai.worker.ts
import { Worker } from 'bullmq';
import { aiQueue } from '../lib/queue';
import { AIService } from '../services/ai.service';

const aiService = new AIService();

const worker = new Worker('ai-generation', async (job) => {
  const { prompt, style, userId } = job.data;

  try {
    const result = await aiService.generateIcon(prompt, style);

    // Save to database
    await db.aiGeneration.create({
      data: {
        userId,
        prompt,
        style,
        model: 'dall-e-3',
        imageUrl: result.url,
        cost: 0.04
      }
    });

    return result;
  } catch (error) {
    console.error('AI generation failed:', error);
    throw error;
  }
}, {
  connection: redis,
  concurrency: 5
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```

---

## Error Handling

### 1. Global Error Handler

```typescript
// src/middleware/error.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Validation errors
  if (error.validation) {
    reply.code(400).send({
      error: 'Validation failed',
      details: error.validation
    });
    return;
  }

  // Authentication errors
  if (error.statusCode === 401) {
    reply.code(401).send({
      error: 'Unauthorized'
    });
    return;
  }

  // Not found errors
  if (error.statusCode === 404) {
    reply.code(404).send({
      error: 'Resource not found'
    });
    return;
  }

  // Default error
  reply.code(error.statusCode || 500).send({
    error: error.message || 'Internal server error'
  });
}

// Register in app.ts
app.setErrorHandler(errorHandler);
```

---

## Testing

### 1. Route Tests

```typescript
// tests/routes/icons.test.ts
import { test, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app';
import { db } from '../../src/lib/db';

let app: any;

beforeAll(async () => {
  app = await build({ logger: false });
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

test('GET /api/icons - returns icons for project', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/icons?projectId=test-project-id',
    headers: {
      authorization: 'Bearer test-token'
    }
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toBeInstanceOf(Array);
});

test('POST /api/icons - creates new icon', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/icons',
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json'
    },
    payload: {
      name: 'Test Icon',
      projectId: 'test-project-id',
      svgData: '<svg></svg>',
      layers: []
    }
  });

  expect(response.statusCode).toBe(201);
  expect(response.json()).toHaveProperty('id');
});
```

---

## Deployment

### 1. Railway Configuration

```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 2. Environment Variables

```bash
# Production .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
CORS_ORIGIN=https://iconforge.com
```

---

## Conclusion

This Fastify backend provides a production-ready foundation for IconForge with:
- Type-safe routing with TypeBox
- JWT authentication with Clerk
- PostgreSQL database with Prisma
- File upload with Supabase Storage
- Background jobs with Bull
- WebSocket support
- Comprehensive error handling

**Performance**: 2x faster than Express
**Type Safety**: Full TypeScript support
**Scalability**: Ready for horizontal scaling

**Next Steps**:
1. Set up development environment
2. Configure database and migrations
3. Implement authentication flow
4. Build API routes
5. Add background workers
6. Deploy to Railway

**Resources**:
- [Fastify Documentation](https://fastify.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Fastify SDK](https://clerk.com/docs/backend-requests/handling/fastify)
