# AI Coding Agent Instructions - Vibe Tech Monorepo

## Architecture Overview

Multi-project monorepo with three primary domains:

1. **React Web Application** (root) - Vite + TypeScript + shadcn/ui marketing site
2. **Python Trading System** (`projects/crypto-enhanced/`) - Live Kraken API cryptocurrency trading with async WebSocket V2
3. **Backend API** (`backend/`) - Node.js/Express server with SQLite for blog/leads/customers

Additional projects: Desktop Commander MCP, Data Processing Pipeline, PowerShell modules, and various web apps in `projects/`.

## Critical Workflows

### Development Server Start
```powershell
# Web app (port 3000)
npm run dev

# Backend API (port 3001)
cd backend; npm start

# Crypto trading (CAUTION: real money)
cd projects/crypto-enhanced
.venv\Scripts\activate
python start_live_trading.py  # Requires YES confirmation

# Parallel execution (multiple services)
npm run parallel:dev          # Root + crypto + vibe-lovable
npm run parallel:full-stack   # Root + backend + memory-bank
```

### Quality Checks (Run Before Commits)
```powershell
npm run quality      # lint + typecheck + test + build
npm run quality:fix  # Auto-fix linting issues
```

### Database Operations
```powershell
# Main unified database: D:\databases\database.db
# Vibe Tech backend: D:\vibe-tech-data\vibetech.db
# Crypto trading: projects/crypto-enhanced/trading.db (SQLite + WAL mode)

sqlite3 trading.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"
```

## Project-Specific Conventions

### Import Aliases
All TypeScript uses `@/` alias for `src/` directory:
```typescript
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
```

### Component Structure
- **UI Components**: `src/components/ui/` - shadcn/ui primitives (Button, Dialog, Toast, etc.)
- **Feature Components**: `src/components/[feature]/` - domain-specific (tools, services, admin)
- **Layout Components**: `src/components/layout/` - PageLayout, navigation
- **Pages**: `src/pages/` - React Router v6 route components

### Styling Convention
- **Tailwind CSS** with custom Aura theme (`tailwind.config.ts`)
- **CSS Variables**: `--c-purple`, `--c-cyan`, `--aura-accent`, `--aura-textMuted`
- **Utility Function**: `cn()` from `src/lib/utils.ts` merges Tailwind classes

### React Patterns
- **State Management**: React Query (TanStack Query) for server state
- **Forms**: React Hook Form + Zod validation
- **Error Boundaries**: Wrap route components in ErrorBoundary
- **Lazy Loading**: Code-split routes with `React.lazy()` (see `App.tsx`)
- **Analytics**: `useAnalytics()` hook tracks page views and events

## Crypto Trading System Architecture

**CRITICAL**: System trades with REAL MONEY on Kraken exchange.

### Core Components (12 files, simplified from 28)
```
kraken_client.py       # REST API with nonce manager (nanoseconds)
websocket_manager.py   # WebSocket V2 with TaskGroups (Python 3.11+)
trading_engine.py      # Strategy execution (momentum, mean reversion)
database.py            # SQLite persistence with WAL mode
config.py              # Risk parameters (max $10 position, XLM/USD only)
```

### Async Best Practices (2025)
- **TaskGroups** (`async with asyncio.TaskGroup()`) for structured concurrency
- **Timeouts** (`async with asyncio.timeout()`) NOT `asyncio.wait_for()`
- **Context Managers** for WebSocket lifecycle (`async with ws`)
- **Circuit Breaker** in `kraken_client.py` prevents cascading failures

### WebSocket V2 Integration
- Token-based authentication (`wss://ws.kraken.com/v2`)
- Subscriptions: ticker (public), executions + balances (private)
- Automatic reconnection with exponential backoff
- Heartbeat monitoring for connection health

### Nonce Management
**CRITICAL**: Kraken requires monotonically increasing nonces.
```python
# Use NANOSECONDS (not microseconds)
nonce = int(time.time() * 1000000000)
```
**Pattern**: Separate API keys for trading vs status checks to avoid nonce collisions.

### Current Status (SESSION_STATUS.md)
- Balance: $98.82 USD
- Max position: $10 (1 position only)
- Trading pair: XLM/USD
- System: Connected, awaiting strategy activation
- Database: `trading.db` with WAL mode

## Backend API Patterns

### SQLite Configuration
- **Development**: `D:\vibe-tech-data\vibetech.db`
- **Production**: `/app/data/vibetech.db` (persistent volume)
- **Schema**: customers, invoices, leads, blog_posts (with SEO + affiliate features)

### Security Headers (Helmet.js)
```javascript
// Applied in server-production.js
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'
```

### API Endpoints
- Public: `/health`, `/api/blog`, `/api/blog/:id`
- Protected: `/api/auth`, `POST /api/blog`, `/api/leads`

## Build Configuration

### Vite Production Build
```typescript
// vite.config.ts
manualChunks: {
  vendor: ['react', 'react-dom'],
  ui: ['@radix-ui/*'],
  three: ['three', '@react-three/fiber'],
  router: ['react-router-dom'],
  forms: ['react-hook-form', 'zod'],
  charts: ['recharts']
}
```

### TypeScript Strict Mode
```json
// tsconfig.json
"strict": true,
"noImplicitAny": true,
"noUnusedLocals": true,
"noUncheckedIndexedAccess": true
```

## Workspace Management

### PowerShell Scripts
```powershell
# Comprehensive status
.\scripts\workspace-manager.ps1 status

# Install dependencies
.\scripts\workspace-manager.ps1 install -All

# Deep cleanup (removes node_modules, caches)
.\scripts\monorepo-optimize.ps1 -Deep

# Dry run cleanup
.\scripts\monorepo-optimize.ps1 -DryRun
```

### Project Groups (for parallel execution)
```powershell
$ProjectGroups = @{
    "full-stack" = @("root", "backend", "memory-bank")
    "trading"    = @("crypto", "monitoring")
    "desktop"    = @("nova-agent", "taskmaster", "opcode")
    "web-apps"   = @("hotel-booking", "digital-content", "shipping-pwa")
}
```

## Data Pipeline (`data_pipeline/`)

Production-ready pipeline with validation, transformation, monitoring:
```python
from core.pipeline import DataPipeline
from core.config import PipelineConfig

config = PipelineConfig(
    source_type="csv",  # or "sql", "api"
    source_path="data.csv",
    enable_monitoring=True
)
pipeline = DataPipeline(config)
result = pipeline.execute()
```

**Features**: Schema validation, missing value handling, outlier detection, feature engineering, performance metrics.

## Common Pitfalls

1. **Trading System Nonce Errors**: Use nanoseconds (`* 1000000000`), separate API keys for different operations
2. **CORS Issues**: Update `ALLOWED_ORIGINS` in backend `.env` to match frontend domain
3. **Port Conflicts**: Root (3000), backend (3001), crypto (8000), vibe-lovable (8080)
4. **Import Errors**: Always use `@/` alias for src imports
5. **TypeScript Errors**: Run `npm run typecheck` before committing
6. **WebSocket Disconnects**: Initial warnings are normal, auto-reconnect handles recovery
7. **Database Locks**: SQLite WAL mode prevents most lock issues; use separate connections for read/write

## Testing Strategy

### Web Application
```powershell
npm run test        # Playwright E2E tests
npm run test:ui     # Interactive debugging
npm run test:debug  # Debug mode
```

### Crypto Trading
```powershell
cd projects/crypto-enhanced
.venv\Scripts\python.exe run_tests.py  # pytest with async support
python check_orders.py                  # Manual order verification
```

## Deployment Checklist

### Backend
1. Set `NODE_ENV=production`
2. Generate strong `SESSION_SECRET` (32+ characters)
3. Configure `ALLOWED_ORIGINS` for frontend domain
4. Ensure persistent storage for SQLite database
5. Set up health monitoring for `/health` endpoint

### Frontend
1. Run `npm run build:production` with optimized Vite config
2. Verify CSP headers for production domains
3. Test lazy-loaded routes
4. Validate analytics integration

### Crypto Trading (IF DEPLOYING)
1. **NEVER** deploy with production API keys in code
2. Use environment variables for `KRAKEN_API_KEY`, `KRAKEN_API_SECRET`
3. Start with paper trading or testnet first
4. Monitor `trading.db` for position limits
5. Set up alerting for balance drops

## Key Files Reference

- `CLAUDE.md` - Existing AI assistant guide (comprehensive commands)
- `README.md` - Monorepo overview and quick commands
- `package.json` - npm scripts for all workspace operations
- `vite.config.ts` - Build configuration with security headers
- `src/App.tsx` - Route definitions and lazy loading
- `projects/crypto-enhanced/start_live_trading.py` - Trading system entry point
- `backend/server-production.js` - Production server with security middleware
- `scripts/workspace-manager.ps1` - Central control script

## Style Preferences

- No emojis in code comments or commit messages
- No overcomplicated abstractions
- Explicit error handling over silent failures
- Comments explain "why", not "what"
- Functions/methods under 50 lines when possible
