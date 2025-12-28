# Vibe Tech - Multi-Project Monorepo

A high-performance monorepo containing the Vibe Tech web application, a Python-based crypto trading system, and shared tooling.

## ⚠️ Important: Package Manager

**This project uses [pnpm](https://pnpm.io/), not npm or yarn.**

```bash
# Install pnpm globally
npm install -g pnpm@9.15.0

# Verify installation
pnpm --version  # Should show 9.15.0
```

**All commands in this README use `pnpm`.** See [Local Development Guide](docs/guides/LOCAL-DEVELOPMENT-GUIDE.md) for complete setup instructions.

---

## 📊 Project Status

**Overall Health:** 92.0/100 ✅ (Production Ready - All Quality Checks Passing)  
**Last Updated:** December 28, 2025  
**Current Phase:** Maintenance & Optimization  
**Package Manager:** pnpm 9.15.0

| Category | Status | Score | Notes |
|----------|--------|-------|-------|
| Architecture | ✅ Excellent | 95/100 | Migrated to Nx 21.6 for intelligent caching |
| Security | ✅ Protected | 95/100 | All dependencies updated |
| Type Safety | ✅ Enforced | 100/100 | Full TypeScript coverage |
| Code Quality | ✅ Strong | 90/100 | All linter checks passing |
| Testing | ✅ Good | 80/100 | Core infrastructure complete; coverage can be improved |
| Documentation | ✅ Exceptional | 95/100 | All core features are documented |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** 18.x or higher (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 9.15.0 (install via `npm install -g pnpm@9.15.0`)
- **Python** 3.11+ (for crypto trading system, optional)

### Quick Start

1. **Clone the repository:**

```bash
git clone https://github.com/freshwaterbruce2/vibetech.git
cd vibetech
```

2. **Install dependencies:**

This single command installs dependencies for all projects in the workspace using pnpm.

```bash
pnpm install
```

3. **Start the development server:**

This will launch the main Vite web application with hot-reloading.

```bash
pnpm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Available Commands

Here are the most common scripts available from the root of the project:

| Command | Description |
|---------|-------------|
| Command | Description |
|---------|-------------|
| `pnpm run dev` | Starts the main web application development server (port 5173) |
| `pnpm run build` | Builds all projects for production |
| `pnpm run test` | Runs all unit and integration tests across the monorepo |
| `pnpm run quality` | Runs all code quality checks (linting, formatting, type-checking) |
| `pnpm run monorepo:health` | Displays a health and status report for the workspace |
| `pnpm run workspace:clean` | Removes all node_modules and build artifacts |
| `pnpm run crypto:install` | Sets up the Python virtual environment for the trading system |
| `pnpm run crypto:test` | Runs tests specifically for the trading system |

📖 **For complete local development setup, see the [Local Development Guide](docs/guides/LOCAL-DEVELOPMENT-GUIDE.md)**

---

## 📂 Monorepo Structure

This repository is managed as a monorepo and contains the following key projects:

vibetech/
├── 📂 apps/
│   └── 🌐 shipping-pwa/         # (Example App)
├── 📂 docs/                    # Documentation and reports
├── 📂 packages/
│   ├── ⚙️ eslint-config-custom  # Shared ESLint configuration
│   └── 🎨 ui-library           # Shared React component library
├── 📂 projects/
│   └── 🐍 crypto-enhanced/      # Python Crypto Trading System
├── 📂 tools/
│   └── 🛠️ scripts/              # Workspace management scripts
├── 📄 nx.json                  # Nx workspace configuration
└── 📄 package.json               # Root dependencies and scripts
✨ Lovable Integration
This project is mirrored and can be edited or deployed using the Lovable platform.

Project URL: lovable.dev/projects/f4b2b360-7bb2-4ba9-9821-ad247856d019

Deployment: To deploy the latest version, open the project in Lovable and click Share -> Publish.

Custom Domains: You can connect a custom domain via Project > Settings > Domains. Learn More.

💻 Technology Stack
Monorepo Tool: Nx

Frontend: Vite, TypeScript, React, Tailwind CSS

UI Components: shadcn-ui

Trading System: Python

Testing: Playwright

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.