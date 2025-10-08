# Vibe Tech - Multi-Project Monorepo

[![CI Pipeline](https://github.com/freshwaterbruce2/vibetech/actions/workflows/ci.yml/badge.svg)](https://github.com/freshwaterbruce2/vibetech/actions/workflows/ci.yml)
[![Deploy](https://github.com/freshwaterbruce2/vibetech/actions/workflows/deploy.yml/badge.svg)](https://github.com/freshwaterbruce2/vibetech/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Code Quality](https://img.shields.io/badge/quality-90%2F100-brightgreen)](./docs/reports/MONOREPO_REVIEW.md)

## 🎯 Quick Start

```bash
npm install              # Install dependencies
npm run dev              # Start development server
npm run quality          # Run quality checks
```

**📖 For detailed commands:** See [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

---

## Project Status

**Overall Health:** 92.0/100 ✅ (Production Ready - All Quality Checks Passing)
**Last Updated:** October 8, 2025
**Current Phase:** Maintenance & Optimization

| Category | Status | Score |
|----------|--------|-------|
| Architecture | ✅ Excellent | 95/100 |
| Security | ✅ Protected | 95/100 |
| Type Safety | ✅ Enforced | 100/100 |
| Code Quality | ✅ Strong | 90/100 |
| **Testing** | ✅ **Infrastructure Complete** | **80/100** |
| **Dependencies** | ✅ **All Updated** | **100/100** |
| Documentation | ✅ Exceptional | 95/100 |

**Recent Achievements:**
- ✅ Upgraded to React 19, React Router 7, Tailwind CSS 4, Zod 4
- ✅ Updated all dependencies (389 packages)
- ✅ Migrated from Turborepo to Nx 21.6 monorepo with intelligent caching
- ✅ All quality checks passing (3 projects, 9 dependent tasks)
- ✅ Fixed shipping-pwa, vibepilot, digital-content-builder lint/build issues
- ✅ Updated CI/CD workflows for Nx caching (~100MB freed from .turbo cleanup)

---

## Lovable Project Info

**URL**: https://lovable.dev/projects/f4b2b360-7bb2-4ba9-9821-ad247856d019

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f4b2b360-7bb2-4ba9-9821-ad247856d019) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Monorepo Structure

This is an optimized monorepo containing multiple projects:

### 🌐 Root Project (Vite + React)
- Main web application (port 5173)
- TypeScript + React + shadcn/ui
- Build tools: Vite, ESLint, Playwright

### 🐍 Crypto Trading System
- Location: `projects/crypto-enhanced/`
- Live cryptocurrency trading with Kraken API
- Python virtual environment managed

### 🔧 Workspace Management

**Quick Commands:**
```bash
# Workspace status and health
npm run monorepo:health

# Install all project dependencies
npm run workspace:install

# Clean workspace
npm run workspace:clean

# Crypto trading system
npm run crypto:install     # Setup Python venv
npm run crypto:test        # Run trading tests
```

**Advanced Management:**
```powershell
# Use workspace manager for detailed control
.\scripts\workspace-manager.ps1 status
.\scripts\workspace-manager.ps1 install -All
.\scripts\workspace-manager.ps1 dev -Project root

# Use optimization script for cleanup
.\scripts\monorepo-optimize.ps1 -DryRun
.\scripts\monorepo-optimize.ps1 -Deep -AnalyzeSize
```

See `tools/README.md` for complete management documentation.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f4b2b360-7bb2-4ba9-9821-ad247856d019) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
