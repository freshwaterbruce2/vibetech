# @vibetech/shared

Shared components, services, and types for NOVA Agent and Vibe Code Studio.

## Overview

This package provides common functionality used across both desktop applications:

- **Specialized Agents**: AI agents for backend, frontend, and technical leadership
- **Database Services**: Unified access to D:\databases\ learning system
- **AI Services**: DeepSeek and streaming AI integrations
- **Learning System**: Shared mistake tracking and knowledge base
- **Common Types**: TypeScript interfaces and types

## Installation

```bash
npm install @vibetech/shared
```

## Usage

### Specialized Agents

```typescript
import { BackendEngineerAgent, FrontendEngineerAgent } from '@vibetech/shared/agents';

const backendAgent = new BackendEngineerAgent();
const response = await backendAgent.process(request, context);
```

### Database Services

```typescript
import { LearningDatabase } from '@vibetech/shared/database';

const learningDb = new LearningDatabase('D:\\databases\\database.db');
const mistakes = await learningDb.getMistakes({ severity: 'high' });
```

### AI Services

```typescript
import { DeepSeekService } from '@vibetech/shared/ai';

const deepseek = new DeepSeekService();
const response = await deepseek.chat(messages);
```

## Package Structure

```
@vibetech/shared/
├── agents/          # Specialized AI agents
├── database/        # Database services and schemas
├── ai/              # AI service integrations
├── learning/        # Learning system components
└── types/           # Shared TypeScript types
```

## Development

```bash
# Build the package
npm run build

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean
```

## Integration

This package is used by:
- **NOVA Agent**: Tauri-based AI assistant
- **Vibe Code Studio**: Electron-based code editor

Both applications share the same learning system and AI capabilities through this package.

