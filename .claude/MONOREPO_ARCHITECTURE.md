# Monorepo Architecture Overview

## 🏗️ High-Level Structure

This is a **multi-domain monorepo** managed with pnpm workspaces and Nx, containing:

```
C:\dev\
├── Root Web App          # React 19.2 + TypeScript + Vite (main application)
├── projects/             # Sub-projects and specialized applications
├── backend/              # Node.js Express backend services  
├── data_pipeline/        # Python-based ETL workflows
├── packages/             # Shared libraries and utilities
└── scripts/              # PowerShell automation scripts
```

## 📦 Package Management

**Primary**: pnpm v9.15.0
- Efficient disk space usage (content-addressable storage)
- Strict dependency resolution
- Fast installation

**Orchestration**: Nx
- Monorepo build system
- Task caching and distribution
- Dependency graph management
- Affected project detection

**Workspaces** (defined in package.json):
```json
"workspaces": [
  "backend",
  "packages/*",
  "projects/active/web-apps/*",
  "projects/active/desktop-apps/*",
  "projects/Vibe-Subscription-Guard"
]
```

## 🌐 1. Root Web Application

**Location**: Root directory (C:\dev)
**Purpose**: Main customer-facing web application

### Technology Stack
```typescript
├── React 19.2.0           # UI framework
├── TypeScript 5.7+        # Type safety
├── Vite 7.0              # Build tool & dev server
├── shadcn/ui             # Component library (Radix UI primitives)
├── Tailwind CSS          # Styling
├── React Query           # Server state management
├── React Router v7       # Client-side routing
├── React Hook Form       # Form handling
├── Zod                   # Schema validation
├── Three.js              # 3D graphics
└── React Three Fiber     # React renderer for Three.js
```

### Key Configuration Files
```
tsconfig.json           # TypeScript configuration (strict mode)
tsconfig.app.json       # Application-specific TS config
tsconfig.node.json      # Node/Vite tooling TS config
vite.config.ts          # Vite development config
vite.config.production.ts  # Production optimizations
tailwind.config.ts      # Tailwind customization
eslint.config.js        # ESLint rules
vitest.config.ts        # Unit test configuration
playwright.config.ts    # E2E test configuration
```

### Directory Structure
```
src/
├── components/         # React components
│   └── ui/            # shadcn/ui components
├── pages/             # Route components
├── hooks/             # Custom React hooks
├── context/           # React Context providers
├── lib/               # Utilities and helpers
├── services/          # API clients
├── types/             # TypeScript definitions
└── styles/            # Global styles
```

### Important Features
- **Path Aliases**: `@/*` maps to `./src/*`
- **Strict TypeScript**: All strict options enabled
- **Code Splitting**: Route-level lazy loading
- **Performance**: Bundle analysis with vite-bundle-analyzer

### Commands
```powershell
pnpm run dev              # Dev server (localhost:5173)
pnpm run build            # Production build
pnpm run quality          # Lint + typecheck + test + build
pnpm run test:unit        # Vitest unit tests
pnpm run test                 # Playwright E2E tests
```

## 🤖 2. Crypto Trading Bot (⚠️ LIVE SYSTEM)

**Location**: `projects/crypto-enhanced/`
**Purpose**: Automated cryptocurrency trading on Kraken Exchange
**Status**: **ACTIVELY TRADING WITH REAL MONEY**

### Technology Stack
```python
├── Python 3.12+          # Language (3.13+ recommended)
├── asyncio               # Async event loop
├── aiohttp               # Async HTTP client
├── websockets            # WebSocket client
├── aiosqlite             # Async SQLite
├── Pydantic v2           # Data validation & settings
├── pytest + pytest-asyncio  # Testing framework
```

### Architecture Patterns
```python
# Fully async - no blocking calls
├── AsyncIO Event Loop    # Single-threaded concurrency
├── TaskGroups           # Structured concurrency (3.11+)
├── ExceptionGroups      # Multi-error handling (3.11+)
├── Context Managers     # Resource management
└── Type Hints           # Static type checking
```

### Core Components
```
kraken_client.py        # REST API with rate limiting
websocket_manager.py    # WebSocket v2 real-time streams
trading_engine.py       # Strategy execution
database.py             # SQLite persistence (WAL mode)
nonce_manager.py        # API nonce synchronization
circuit_breaker.py      # Safety mechanism
instance_lock.py        # Prevents multiple instances
config.py               # Pydantic settings (from .env)
strategies.py           # Trading algorithms
errors.py               # Custom exception classes
```

### Risk Parameters (⚠️ ENFORCED)
```python
MAX_TRADE_SIZE = 10.0        # USD
MAX_TOTAL_EXPOSURE = 10.0    # USD  
ALLOWED_PAIRS = ["XLM/USD"]  # Only XLM/USD
```

### Critical Safety Features
1. **Nonce Manager**: Prevents API replay attacks
2. **Circuit Breaker**: Stops trading on anomalies
3. **Instance Lock**: Prevents concurrent instances
4. **Database Transactions**: Ensures data consistency
5. **Rate Limiting**: Respects Kraken API limits
6. **Comprehensive Logging**: DEBUG level by default

### Kraken API Integration
```python
# WebSocket v2 (Real-time data)
├── Ticker streams (price updates)
├── Execution reports (order fills)
├── Balance updates (account changes)
├── RFC3339 timestamps
└── Automatic reconnection

# REST API v1 (Order execution)
├── Private endpoints (authentication required)
├── HMAC-SHA512 signatures
├── Nonce-based replay protection
├── Rate limits: 15-20/sec public, 1/sec private initial
└── Tiered rate limits based on trading volume
```

### Database Schema (SQLite)
```sql
-- trades table
CREATE TABLE trades (
    id INTEGER PRIMARY KEY,
    pair TEXT NOT NULL,
    side TEXT NOT NULL,  -- 'buy' or 'sell'
    price REAL NOT NULL,
    volume REAL NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'open', 'filled', 'cancelled'
    order_id TEXT,
    txid TEXT
);

-- Additional tables: orders, metrics, learning_data
```

### Commands
```powershell
cd projects\crypto-enhanced
.venv\Scripts\activate       # Must activate venv first

# Safe operations
python simple_status.py      # Check bot status
python run_tests.py          # Run test suite
sqlite3 trading.db "SELECT * FROM trades LIMIT 5;"  # Query DB

# Live trading (CAUTION)
python start_live_trading.py  # Interactive confirmation
.\stop_trading.ps1           # Emergency stop

# Logs
Get-Content trading_new.log -Tail 50 -Wait  # Stream logs
```

### Testing Strategy
```python
# NEVER hit real Kraken API in tests
├── Mock all aiohttp requests
├── Mock WebSocket connections
├── Test order logic extensively
├── Verify nonce synchronization
├── Test circuit breaker triggers
└── Test database transaction rollback
```

## 🔌 3. Backend Services

**Location**: `backend/`
**Purpose**: API services, database proxy, and microservices

### Technology Stack
```javascript
├── Node.js 20.19+ / 22.12+  # Runtime (required for Vite 7)
├── Express.js              # Web framework
├── TypeScript              # Type safety
├── SQLite                  # Local database
├── PostgreSQL              # Some services use Postgres
├── Supabase                # BaaS integration
```

### Architecture
```
backend/
├── src/
│   ├── routes/        # Express route handlers
│   ├── middleware/    # Express middleware (auth, rate limit, etc.)
│   ├── services/      # Business logic
│   ├── models/        # Data models
│   └── utils/         # Helper functions
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

### Key Features
- **Rate Limiting**: Prevents API abuse
- **Helmet**: Security headers
- **Express Validator**: Input validation
- **CORS**: Configured for specific origins
- **Error Handling**: Centralized error middleware

### Commands
```powershell
cd backend
pnpm install              # Install dependencies
pnpm run dev             # Start with nodemon (hot reload)
pnpm run build           # Compile TypeScript
npm start               # Run compiled code
```

## 📊 4. Data Pipeline

**Location**: `data_pipeline/`
**Purpose**: ETL workflows, data transformation, and analytics

### Technology Stack
```python
├── Python 3.12+          # Language
├── asyncio               # Async operations
├── pandas                # Data manipulation
├── aiosqlite             # Async database
├── aiohttp               # API calls
```

### Architecture
```python
# Async ETL workflows
├── Extract               # Pull data from sources
├── Transform             # Clean and process
├── Load                  # Store in databases
├── Validate              # Data quality checks
└── Monitor               # Track pipeline health
```

## 📦 5. Packages (Shared Code)

**Location**: `packages/`
**Purpose**: Reusable libraries across projects

### Structure
```
packages/
├── shared-ui/         # Common UI components
├── shared-types/      # TypeScript definitions
├── shared-utils/      # Utility functions
└── shared-config/     # Shared configurations
```

### Usage
```typescript
// Import from packages using workspace protocol
import { Button } from '@vibetech/shared-ui';
import type { User } from '@vibetech/shared-types';
```

## 🔧 6. Scripts (Automation)

**Location**: `scripts/`
**Purpose**: PowerShell automation for monorepo management

### Key Scripts
```powershell
workspace-manager.ps1           # Monorepo orchestration
Start-ParallelMonorepo.ps1     # Parallel dev servers
Start-Parallel-Dev.bat          # Quick parallel start
```

### Usage
```powershell
pnpm run parallel:dev            # Start all dev servers
pnpm run parallel:trading        # Trading bot + dependencies
pnpm run parallel:status         # Check all services
```

## 🔄 Task Orchestration (Nx)

### Common Nx Commands
```powershell
# Run tasks across all projects
nx run-many -t quality          # Run quality checks everywhere
nx run-many -t build            # Build all projects
nx run-many -t test             # Test all projects

# Run tasks on affected projects only
nx affected -t quality          # Quality check affected
nx affected -t build            # Build affected
nx affected:graph               # See affected graph

# Utility
nx graph                        # View full dependency graph
nx reset                        # Clear Nx cache
```

### Task Targets (defined in project.json or package.json)
```json
{
  "targets": {
    "quality": {
      "dependsOn": ["lint", "typecheck", "test:unit", "build"]
    },
    "lint": { "executor": "@nx/eslint:lint" },
    "typecheck": { "command": "tsc --noEmit" },
    "test:unit": { "command": "vitest run" },
    "build": { "command": "vite build" }
  }
}
```

## 🌳 Dependency Graph

```
Root Web App
├── packages/shared-ui
├── packages/shared-types
└── packages/shared-utils

Backend Services
├── packages/shared-types
└── packages/shared-utils

Trading Bot (Independent)
└── (No dependencies on other monorepo projects)

Data Pipeline
└── packages/shared-utils
```

## 🔐 Environment Management

### Environment Files
```
.env                    # Supabase keys (root)
.env.development        # Dev-specific config
.env.production         # Production config
projects/crypto-enhanced/.env  # ⚠️ Kraken API keys
backend/.env            # Backend secrets
```

### Key Variables
```bash
# Root .env (Supabase)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Trading bot .env (Kraken)
KRAKEN_API_KEY=xxx        # ⚠️ NEVER commit
KRAKEN_API_SECRET=xxx     # ⚠️ NEVER commit
DATABASE_PATH=trading.db
```

## 📈 Performance Considerations

### Web App
- **Bundle Size**: Monitored with vite-bundle-analyzer
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Vite automatically removes dead code
- **Asset Optimization**: Images, fonts optimized in build

### Trading Bot
- **Async I/O**: Non-blocking operations throughout
- **Connection Pooling**: Reuse HTTP connections
- **TaskGroups**: Efficient concurrent operations
- **Database**: WAL mode for better concurrency

### Backend
- **Rate Limiting**: Prevents abuse and overload
- **Caching**: Strategic caching of expensive operations
- **Database Indexing**: Optimized queries

## 🧪 Testing Strategy

### Levels
```
Unit Tests         # Individual functions/components
├── Web: Vitest + React Testing Library
├── Trading: pytest + pytest-asyncio
└── Backend: Jest or Vitest

Integration Tests  # Multiple components together
├── API endpoint tests
├── Database integration
└── Service communication

E2E Tests          # Full user flows
└── Playwright (web app)
```

### Coverage Goals
```
Web App: 80%+ overall, 90%+ critical paths
Trading Bot: 95%+ (⚠️ money at stake)
Backend: 85%+
```

## 🚀 Deployment

### Web App
- **Platforms**: Netlify, Vercel
- **Build Command**: `pnpm run build:production`
- **Output**: `dist/` directory
- **Config**: `netlify.toml`, `vercel.json`

### Trading Bot
- **Deployment**: Manual (runs on local machine currently)
- **Process Manager**: Could use PM2 or systemd
- **Monitoring**: Custom logging + alerts

### Backend
- **Platforms**: Railway, Heroku, VPS
- **Process Manager**: PM2 recommended
- **Database**: SQLite file or PostgreSQL

## 📊 Monitoring & Observability

### Trading Bot
```powershell
# Logs
Get-Content projects\crypto-enhanced\trading_new.log -Tail 50 -Wait

# Database queries
sqlite3 projects\crypto-enhanced\trading.db

# Health checks
cd projects\crypto-enhanced
.venv\Scripts\activate
python simple_status.py
```

### Web App
```powershell
# Build analysis
pnpm run analyze

# Test coverage
pnpm run test:unit:coverage

# Lighthouse (if configured)
pnpm run lighthouse
```

## 🔒 Security

### API Keys (NEVER commit)
- `.env` files in `.gitignore`
- Use environment variables
- Rotate keys regularly

### Rate Limiting
- Frontend: Debounce user actions
- Backend: Express rate limiter
- Trading bot: Respect Kraken limits

### Input Validation
- Frontend: Zod schemas
- Backend: express-validator
- Trading bot: Pydantic models

## 📚 Documentation

### In-Code Documentation
- JSDoc for TypeScript/JavaScript
- Docstrings for Python
- Inline comments for complex logic

### Project Documentation
```
README.md               # Overview & quick start
CLAUDE.md              # AI-specific guidance  
.claude/               # Claude Desktop instructions
QUICK-REFERENCE.md     # Common commands
```

---

## 🎯 Key Takeaways

1. **Multi-Domain**: Web, trading, backend, data - each with own tech stack
2. **Monorepo Tools**: pnpm + Nx for efficient management
3. **Safety Critical**: Trading bot requires extreme caution
4. **Quality Gates**: Automated checks before all commits
5. **TypeScript Strict**: No compromises on type safety
6. **Async Python**: Proper async/await patterns throughout
7. **Clear Boundaries**: Projects are loosely coupled
8. **Monitoring**: Comprehensive logging and health checks
