# Quick Start - Local Development

**Get up and running with Vibe Tech monorepo in 5 minutes!**

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **Git** ([Download](https://git-scm.com/))
- ⚠️ **Python 3.11+** (Optional - only for crypto trading)

## Step 1: Install pnpm

**This project uses pnpm, not npm or yarn.**

```bash
# Install pnpm globally
npm install -g pnpm@9.15.0

# Verify installation
pnpm --version
# Should show: 9.15.0
```

## Step 2: Clone Repository

```bash
git clone https://github.com/freshwaterbruce2/vibetech.git
cd vibetech
```

## Step 3: Verify Environment

```bash
# Run environment verification script
pnpm run verify:env
```

This checks:
- Node.js version
- pnpm installation
- Git configuration
- Python (optional)
- Workspace setup

## Step 4: Install Dependencies

```bash
# Install all dependencies (root + workspaces)
pnpm install

# Optional: Install Python dependencies for crypto trading
pnpm run crypto:install
```

## Step 5: Start Development Server

```bash
# Start the main web application
pnpm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

## Alternative: Start Multiple Services

```bash
# Start root + backend + other services
pnpm run parallel:full-stack

# Or start root + crypto trading
pnpm run parallel:dev
```

## Common Commands

### Development
```bash
pnpm run dev              # Start web app
pnpm run build            # Build for production
pnpm run preview          # Preview production build
```

### Quality Checks
```bash
pnpm run lint             # Check code style
pnpm run lint:fix         # Auto-fix issues
pnpm run typecheck        # Check TypeScript types
pnpm run quality          # Run all checks
```

### Testing
```bash
pnpm run test             # E2E tests (Playwright)
pnpm run test:ui          # Interactive test mode
pnpm run test:unit        # Unit tests (Vitest)
pnpm run test:unit:watch  # Unit tests in watch mode
```

## Troubleshooting

### "pnpm: command not found"
```bash
# Install pnpm
npm install -g pnpm@9.15.0
```

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>
```

### TypeScript errors
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache tsconfig.tsbuildinfo
pnpm run typecheck
```

### Need to start fresh
```bash
# Clean everything and reinstall
pnpm run workspace:clean
pnpm install
```

## Project Structure

```
vibetech/
├── src/              # Main React application
├── backend/          # Node.js/Express API
├── projects/
│   ├── crypto-enhanced/     # Python trading system
│   └── active/
│       ├── web-apps/        # Web applications
│       └── desktop-apps/    # Desktop applications
├── docs/
│   └── guides/
│       └── LOCAL-DEVELOPMENT-GUIDE.md  # Detailed guide
├── scripts/          # Automation scripts
└── package.json      # Root dependencies & scripts
```

## Next Steps

1. **Read the docs**
   - [Local Development Guide](docs/guides/LOCAL-DEVELOPMENT-GUIDE.md) - Complete setup
   - [Quick Reference](QUICK-REFERENCE.md) - Command cheatsheet
   - [README](README.md) - Project overview

2. **Explore the codebase**
   - Check `src/` for the main application
   - Look at `projects/` for specialized services
   - Review `backend/` for API structure

3. **Make changes**
   - Edit files and see live reload
   - Run `pnpm run quality` before committing
   - Use `git commit -m "type: description"` format

## Development Workflow

```bash
# 1. Create a new branch
git checkout -b feature/my-feature

# 2. Make your changes
# ... edit files ...

# 3. Check quality
pnpm run quality

# 4. Commit changes
git add .
git commit -m "feat: add my feature"

# 5. Push to GitHub
git push origin feature/my-feature

# 6. Create pull request on GitHub
```

## Important Notes

### Package Manager
- ✅ **Use pnpm** - `pnpm install`, `pnpm add <package>`
- ❌ **Don't use npm** - The project will block npm usage
- ❌ **Don't use yarn** - Not configured for this project

### Ports
- **5173** - Main web application (Vite dev server)
- **3001** - Backend API
- **8000** - Crypto trading system (if running)
- **8080** - Vibe Lovable (if running)

### Environment Variables
- Copy `.env.example` to `.env.development` if needed
- Most features work without API keys during development
- See `docs/guides/LOCAL-DEVELOPMENT-GUIDE.md` for details

## Getting Help

- 📖 [Local Development Guide](docs/guides/LOCAL-DEVELOPMENT-GUIDE.md) - Comprehensive setup
- 📝 [Quick Reference](QUICK-REFERENCE.md) - Command reference
- 🤖 [Copilot Instructions](.github/copilot-instructions.md) - AI development guide
- 🐛 Check existing issues on GitHub
- 💬 Ask in team chat/discussions

## Success Checklist

Before you start coding, verify:

- [ ] Node.js 18+ installed
- [ ] pnpm 9.15.0 installed
- [ ] Repository cloned
- [ ] `pnpm install` completed successfully
- [ ] `pnpm run dev` starts without errors
- [ ] Can access http://localhost:5173
- [ ] `pnpm run quality` passes

**If all checks pass, you're ready to code! 🎉**

---

**Need more details?** See [docs/guides/LOCAL-DEVELOPMENT-GUIDE.md](docs/guides/LOCAL-DEVELOPMENT-GUIDE.md)
