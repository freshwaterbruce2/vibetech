# Nx Quick Reference Card
**For C:\dev Monorepo** | October 2025

## 🚀 Most Used Commands

### Daily Development
```powershell
pnpm rundev              # Start Vite dev server (port 5173)
pnpm runquality          # Lint + typecheck + test + build
pnpm rungraph            # Visual project explorer 🎨
```

### Building
```powershell
pnpm runbuild            # Build current project
pnpm runbuild:all        # Build all projects
pnpm runbuild:production:all  # Production builds
```

### Testing
```powershell
pnpm runtest:unit        # Unit tests (Vitest)
pnpm runtest:all         # All project tests
pnpm runquality:affected # Test only changed code ⚡
```

### Linting & Types
```powershell
pnpm runlint             # ESLint check
pnpm runlint:fix         # Auto-fix issues
pnpm runtypecheck        # TypeScript check
```

## 🎯 Nx-Specific Commands

### Affected Detection (Smart CI)
```powershell
nx affected -t quality   # Only run quality on affected
nx affected -t build     # Only build affected
nx affected:graph        # Visualize what changed
```

### Project Graph
```powershell
nx graph                 # Interactive graph in browser
nx graph --file=graph.html  # Save graph as HTML
nx show project <name>   # Show project details
```

### Cache Management
```powershell
nx reset                 # Clear Nx cache
nx run-many -t build --skip-nx-cache  # Skip cache
nx show project <name> --web  # Show cache keys
```

## 📊 Run Multiple Tasks

### Sequential
```powershell
nx run-many -t lint typecheck test  # One after another
```

### Parallel (Default)
```powershell
nx run-many -t lint test --parallel=3  # Max 3 concurrent
nx run-many -t build --parallel  # Use all cores
```

### Target Specific Projects
```powershell
nx run-many -t build --projects=proj1,proj2
nx run-many -t test --exclude=crypto-enhanced
```

## 🔍 Debugging

### Verbose Output
```powershell
nx run-many -t build --verbose
nx affected -t test --verbose
```

### See What Would Run
```powershell
nx show projects --affected  # Show affected projects
nx print-affected            # Print affected graph
```

### System Info
```powershell
nx report     # System info for bug reports
nx list       # List installed plugins
```

## ⚠️ Trading Bot Commands (Unchanged)

```powershell
pnpm runcrypto:test      # Run Python tests
pnpm runcrypto:install   # Setup Python env

# Live trading (use with EXTREME caution)
cd projects\crypto-enhanced
.venv\Scripts\activate
python start_live_trading.py
```

## 🔧 PowerShell Scripts (Unchanged)

```powershell
pnpm runparallel:dev     # Start all dev servers
pnpm runparallel:trading # Start trading systems
pnpm runparallel:status  # Check service status
pnpm runparallel:stop    # Stop all services
```

## 💡 Pro Tips

### Faster Builds
```powershell
# Use affected for faster CI
nx affected -t build test lint

# Skip cache for debugging
nx run-many -t build --skip-nx-cache

# Parallel execution (automatic by default)
nx run-many -t test --parallel=5
```

### Output Styles
```powershell
nx run-many -t build --output-style=stream    # Real-time
nx run-many -t build --output-style=compact   # Minimal
nx run-many -t build --output-style=static    # Summary
```

### Watch Mode
```powershell
nx watch --all -- nx run-many -t build
# Rebuilds on file changes
```

## 🌐 Nx Cloud (Optional - Free Tier)

### Connect to Nx Cloud
```powershell
pnpm dlx nx connect-to-nx-cloud
# Enables:
# - Remote caching (free for <2 users)
# - CI insights
# - Run history
```

### Check Cloud Status
```powershell
nx show projects --with-target=build --affected
nx report  # Shows cloud connection status
```

## 📈 Performance Monitoring

### Benchmark Commands
```powershell
Measure-Command { pnpm runquality }
# Compare before/after Nx

Measure-Command { pnpm runbuild:all }
# First run: Cold cache
# Second run: Should be <1 second
```

### Cache Hit Ratio
```powershell
# After running commands:
nx reset  # Clear cache
nx run-many -t build  # Measure cold
nx run-many -t build  # Measure warm (should be fast)
```

## 🔗 Resources

- **Nx Docs**: https://nx.dev/getting-started/intro
- **Nx Graph**: https://nx.dev/features/explore-graph
- **Recipes**: https://nx.dev/recipes
- **VS Code Extension**: Search "Nx Console" in marketplace

## 📋 Command Aliases

Add to your PowerShell profile for shortcuts:

```powershell
# Edit: notepad $PROFILE

function nxg { nx graph }
function nxa { nx affected -t quality }
function nxr { nx reset }
function nxb { nx run-many -t build }
```

---

**Monorepo**: C:\dev  
**Nx Version**: 21.6.3  
**Package Manager**: pnpm@9.15.0 (59.5% disk space savings)  
**Projects**: 10 packages

**Quick Help**: `nx --help` or `nx <command> --help`
