# @vibetech/shared-utils

Shared utilities for Vibetech monorepo projects.

## Installation

```bash
pnpm add @vibetech/shared-utils@workspace:*
```

## Usage

### Security Utilities

```typescript
import { SecureApiKeyManager } from '@vibetech/shared-utils/security';

const keyManager = SecureApiKeyManager.getInstance();
await keyManager.storeApiKey('openai', 'sk-...');
const key = await keyManager.getApiKey('openai');
```

## Development

```bash
# Build package
pnpm build

# Watch mode for development
pnpm dev

# Type check
pnpm typecheck
```

## Exported Modules

- `@vibetech/shared-utils` - Main entry point
- `@vibetech/shared-utils/security` - Security utilities (API key management)
