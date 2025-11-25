# Tools Directory

This directory contains utility scripts and tools for monorepo management.

## Available Scripts

### Monorepo Management
- `../scripts/monorepo-optimize.ps1` - Main optimization script
- `../scripts/workspace-manager.ps1` - Workspace control and status

### Legacy Fix Scripts
- Various `fix-*.ps1` and `fix-*.bat` files for troubleshooting

## Usage

### Quick Commands
```powershell
# Workspace status
.\scripts\workspace-manager.ps1 status

# Install all dependencies
.\scripts\workspace-manager.ps1 install -All

# Start development environment
.\scripts\workspace-manager.ps1 dev

# Health check
.\scripts\workspace-manager.ps1 health

# Clean workspace
.\scripts\monorepo-optimize.ps1

# Deep clean (removes node_modules, cache, etc.)
.\scripts\monorepo-optimize.ps1 -Deep

# Dry run to see what would be cleaned
.\scripts\monorepo-optimize.ps1 -DryRun
```

### NPM Commands (from root)
```bash
# Workspace management
npm run workspace:install    # Install all project dependencies
npm run workspace:clean      # Clean all artifacts

# Project-specific
npm run crypto:install       # Setup crypto trading system
npm run crypto:test         # Test crypto system
npm run monorepo:health     # Full health check
```