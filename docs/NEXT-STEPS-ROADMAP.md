# Monorepo Next Steps - Prioritized Action Plan

**Generated:** October 2, 2025
**Status:** Post-Critical Fixes - Ready for Enhancement Phase

---

## 🎯 Executive Summary

With all critical issues resolved, the monorepo is **production-ready** at 86.7/100. This document outlines the recommended enhancement path to reach 95+/100.

**Current State:**
- ✅ Security: Protected
- ✅ Type Safety: Enforced
- ✅ Documentation: Organized
- ⚠️ Testing: Limited
- ⚠️ CI/CD: None
- ⚠️ Monitoring: Basic

---

## 📅 Phase 1: Testing Infrastructure (Week 1-2)

### Priority: 🔴 HIGH
**Goal:** Achieve 80% code coverage with automated testing

### Tasks

#### 1.1 Install Vitest and Testing Libraries
```bash
# Install testing dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install coverage reporter
npm install -D @vitest/coverage-v8
```

#### 1.2 Create Vitest Configuration
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'src/components/ui/**', // shadcn/ui components
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 1.3 Add Test Scripts to package.json
```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:e2e",
    "quality": "npm run lint && npm run typecheck && npm run test:unit:coverage && npm run build"
  }
}
```

#### 1.4 Create Example Tests

**Component Test Example:**
```typescript
// src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './ui/button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Hook Test Example:**
```typescript
// src/hooks/useAnalytics.test.ts
import { renderHook } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';

describe('useAnalytics', () => {
  it('tracks page views', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.trackPageView('/test');
    // Add assertions
  });
});
```

#### 1.5 Testing Checklist
- [ ] Vitest installed and configured
- [ ] Test setup file created (`src/test/setup.ts`)
- [ ] Coverage thresholds set (80% lines)
- [ ] Example tests written for 3+ components
- [ ] Example tests for 2+ hooks
- [ ] Example tests for utility functions
- [ ] All tests passing
- [ ] Coverage report generated

**Estimated Time:** 2-3 days
**Blockers:** None

---

## 🔄 Phase 2: CI/CD Pipeline (Week 2-3)

### Priority: 🔴 HIGH
**Goal:** Automated testing and deployment on every push

### Tasks

#### 2.1 Create GitHub Actions Workflow

Create `.github/workflows/ci.yml`:
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Unit tests
        run: npm run test:unit:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

      - name: E2E tests
        run: npm run test:e2e

      - name: Build
        run: npm run build

  crypto-tests:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Python dependencies
        run: |
          cd projects/crypto-enhanced
          pip install -r requirements.txt

      - name: Run Python tests
        run: |
          cd projects/crypto-enhanced
          python run_tests.py
```

#### 2.2 Add Deployment Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '**.md'

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and Build
        run: |
          npm ci
          npm run build:production

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### 2.3 CI/CD Checklist
- [ ] GitHub Actions workflows created
- [ ] Secrets configured in GitHub repo
- [ ] CI runs on every push/PR
- [ ] Automated tests pass
- [ ] Deployment to staging automated
- [ ] Deployment to production automated
- [ ] Branch protection rules enabled
- [ ] Required status checks configured

**Estimated Time:** 2-3 days
**Blockers:** GitHub repository access

---

## 🔐 Phase 3: Enhanced Security (Week 3-4)

### Priority: 🟡 MEDIUM
**Goal:** Production-grade security monitoring

### Tasks

#### 3.1 Dependency Scanning
```bash
# Install security audit tools
npm install -D npm-audit-resolver

# Add scripts
"scripts": {
  "security:audit": "npm audit --production",
  "security:fix": "npm audit fix",
  "security:check": "npx npm-check-updates -u"
}
```

#### 3.2 Add Renovate Bot

Create `.github/renovate.json`:
```json
{
  "extends": ["config:base"],
  "schedule": ["before 5am on monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    }
  ]
}
```

#### 3.3 Security Headers Validation
```bash
# Install security testing
npm install -D helmet-csp

# Test security headers
npm run build
npx http-server dist -p 8080
# Test with securityheaders.com
```

#### 3.4 Security Checklist
- [ ] npm audit runs weekly
- [ ] Renovate bot configured
- [ ] Dependabot alerts enabled
- [ ] Security headers tested
- [ ] HTTPS enforced
- [ ] CSP policies validated
- [ ] API keys rotated
- [ ] .env.example up to date

**Estimated Time:** 2 days
**Blockers:** None

---

## 📊 Phase 4: Monitoring & Observability (Week 4-5)

### Priority: 🟡 MEDIUM
**Goal:** Real-time performance and error tracking

### Tasks

#### 4.1 Add Error Tracking (Sentry)
```bash
npm install @sentry/react @sentry/vite-plugin
```

Create `src/lib/sentry.ts`:
```typescript
import * as Sentry from "@sentry/react";

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}
```

#### 4.2 Add Performance Monitoring
```bash
npm install web-vitals
```

Create `src/lib/vitals.ts`:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

#### 4.3 Add Bundle Analysis
```json
{
  "scripts": {
    "analyze": "npm run build:production && npx vite-bundle-analyzer dist",
    "analyze:watch": "ANALYZE=true npm run build"
  }
}
```

#### 4.4 Monitoring Checklist
- [ ] Sentry integrated
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Web Vitals reporting
- [ ] Bundle size monitoring
- [ ] Lighthouse CI configured
- [ ] Custom metrics tracking
- [ ] Alert thresholds set

**Estimated Time:** 3 days
**Blockers:** Sentry account setup

---

## 💾 Phase 5: Database & State Management (Week 5-6)

### Priority: 🟢 LOW
**Goal:** Professional database management

### Tasks

#### 5.1 Add Database Migrations (Drizzle ORM)
```bash
npm install drizzle-orm drizzle-kit better-sqlite3
npm install -D @types/better-sqlite3
```

Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/app.db',
  },
} satisfies Config;
```

#### 5.2 Create Schema Definitions
```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});
```

#### 5.3 Add Migration Scripts
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

#### 5.4 Database Checklist
- [ ] Drizzle ORM installed
- [ ] Schema definitions created
- [ ] Migration system configured
- [ ] Seed data script created
- [ ] Database studio accessible
- [ ] Backup strategy defined
- [ ] Connection pooling configured
- [ ] Query performance optimized

**Estimated Time:** 3-4 days
**Blockers:** Schema design finalization

---

## 🎨 Phase 6: Developer Experience (Ongoing)

### Priority: 🟢 LOW
**Goal:** Smooth developer onboarding and workflow

### Tasks

#### 6.1 Pre-commit Hooks (Revisit)
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm install -D husky lint-staged --legacy-peer-deps

# Initialize
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

#### 6.2 VSCode Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

#### 6.3 Add Development Tools
```bash
# Install useful dev tools
npm install -D @total-typescript/ts-reset
npm install -D eslint-plugin-import
npm install -D prettier prettier-plugin-tailwindcss
```

#### 6.4 DX Checklist
- [ ] Pre-commit hooks working
- [ ] VSCode settings shared
- [ ] Recommended extensions listed
- [ ] Development guide updated
- [ ] Debugging configuration added
- [ ] Hot reload optimized
- [ ] Terminal shortcuts documented

**Estimated Time:** 2 days
**Blockers:** None

---

## 📈 Success Metrics

### Phase 1-2 (Testing + CI/CD)
- [ ] Code coverage ≥ 80%
- [ ] CI pipeline runs < 5 minutes
- [ ] Zero failing tests
- [ ] Automated deployments successful

### Phase 3-4 (Security + Monitoring)
- [ ] Zero high-severity vulnerabilities
- [ ] Error rate < 0.1%
- [ ] Performance score > 90
- [ ] Response time < 200ms

### Phase 5-6 (Database + DX)
- [ ] Migration system functional
- [ ] Database queries optimized
- [ ] Developer onboarding < 30 minutes
- [ ] Pre-commit hooks functional

---

## 🎯 Target Milestones

| Phase | Completion | Grade Target |
|-------|-----------|--------------|
| Current | ✅ | 86.7/100 |
| Phase 1-2 | Week 3 | 90/100 |
| Phase 3-4 | Week 5 | 93/100 |
| Phase 5-6 | Week 7 | 95+/100 |

---

## 🚨 Risk Mitigation

### Known Issues
1. **npm dependency conflicts** - Use `--legacy-peer-deps` flag
2. **Windows path issues** - Use PowerShell scripts provided
3. **Port conflicts** - Check workspace.json port allocations

### Contingency Plans
- Testing: If Vitest fails, use Jest as fallback
- CI/CD: If GitHub Actions blocked, use GitLab CI
- Monitoring: If Sentry unavailable, use LogRocket
- Database: If Drizzle issues, use Prisma

---

## 📞 Support Resources

- **Testing Issues:** docs/guides/TESTING-SETUP.md (create)
- **CI/CD Issues:** docs/deployment/CI-CD-GUIDE.md (create)
- **Security Questions:** docs/deployment/SECURITY-DEPLOYMENT-CHECKLIST.md
- **Database Help:** Drizzle docs at orm.drizzle.team

---

## ✅ Quick Start Commands

```bash
# Phase 1: Install testing
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom

# Phase 2: Add CI file
mkdir -p .github/workflows
# Create ci.yml from template above

# Phase 3: Security audit
npm audit --production

# Phase 4: Add monitoring
npm install @sentry/react web-vitals

# Phase 5: Database setup
npm install drizzle-orm drizzle-kit

# Run quality check after each phase
npm run quality
```

---

**Priority Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

**Total Estimated Time:** 6-7 weeks to reach 95+/100

**Next Action:** Begin Phase 1 - Install Vitest and create test setup

---

*This plan is designed to be iterative. Complete each phase fully before moving to the next. Review and adjust based on project needs and team capacity.*
