# Vibe Tech Workspace Plugin Marketplace

Internal plugin marketplace for Vibe Tech monorepo optimization and automation.

## Overview

This marketplace provides three specialized plugin collections:
1. **nx-accelerator** - Nx monorepo optimization tools
2. **crypto-guardian** - Trading system safety validation
3. **performance-profiler** - Build and performance analysis

## Installation

The marketplace is automatically available when working in this repository. Plugins are loaded from the local `.claude-plugin` directory.

### Manual Installation (if needed)
```bash
/plugin marketplace add ./.claude-plugin
/plugin install nx-accelerator@vibetech-workspace
/plugin install crypto-guardian@vibetech-workspace
/plugin install performance-profiler@vibetech-workspace
```

## Plugin Catalog

### 1. nx-accelerator (Nx Optimization)

**Purpose:** Intelligent Nx workspace management and optimization

**Commands:**
- `/nx:affected-smart [target]` - Enhanced affected project detection with dependency analysis
- `/nx:cache-stats` - Real-time Nx cache performance metrics
- `/nx:parallel-optimize [target]` - Calculate optimal parallel execution settings
- `/nx:dep-analyze [--circular] [--depth]` - Deep dependency graph analysis

**Use Cases:**
- Understanding which projects are affected by changes
- Optimizing build parallelization
- Detecting circular dependencies
- Monitoring cache performance

**Example Workflow:**
```bash
# 1. Check what's affected
/nx:affected-smart build

# 2. Analyze cache performance
/nx:cache-stats

# 3. Optimize parallel settings
/nx:parallel-optimize

# 4. Review dependencies
/nx:dep-analyze
```

---

### 2. crypto-guardian (Trading Safety)

**Purpose:** Safety validation and risk analysis for cryptocurrency trading system

**Commands:**
- `/crypto:pre-deploy-check` - Comprehensive safety validation before deployment

**Agents:**
- `@risk-analyzer` - Analyzes code changes for financial risk

**Use Cases:**
- Pre-deployment safety checks
- Code review for trading logic changes
- Position and exposure validation
- Database integrity verification

**Example Workflow:**
```bash
# Before deploying trading system changes
/crypto:pre-deploy-check

# For code review
@risk-analyzer please review changes in strategies.py
```

**Safety Features:**
- Database health validation
- Configuration safety checks
- Critical file verification
- Position/exposure monitoring
- Error rate analysis

---

### 3. performance-profiler (Performance Analysis)

**Purpose:** Build performance analysis and optimization

**Commands:**
- `/perf:build-compare [baseline]` - Compare build performance against baseline
- `/perf:bundle-analyze [project]` - Analyze bundle sizes and find optimizations
- `/perf:hook-profile [days]` - Profile Claude Code hook execution times
- `/perf:report [output-file]` - Comprehensive performance report

**Use Cases:**
- Tracking build performance over time
- Detecting bundle size regressions
- Identifying slow hooks
- Performance optimization planning

**Example Workflow:**
```bash
# Weekly performance review
/perf:report docs/performance-reports/weekly.md

# Investigate slow builds
/perf:build-compare

# Check bundle sizes
/perf:bundle-analyze

# Profile hooks
/perf:hook-profile 7
```

---

## Plugin Structure

```
.claude-plugin/
├── marketplace.json          # Plugin catalog
├── README.md                # This file
└── plugins/
    ├── nx-tools/            # nx-accelerator plugin
    │   └── commands/
    │       ├── nx-affected-smart.md
    │       ├── nx-cache-stats.md
    │       ├── nx-parallel-optimize.md
    │       └── nx-dep-analyze.md
    ├── crypto-safety/       # crypto-guardian plugin
    │   ├── commands/
    │   │   └── crypto-pre-deploy-check.md
    │   └── agents/
    │       └── risk-analyzer.md
    └── perf-tools/          # performance-profiler plugin
        └── commands/
            ├── perf-build-compare.md
            ├── perf-bundle-analyze.md
            ├── perf-hook-profile.md
            └── perf-report.md
```

## Development

### Adding New Commands

1. Create command file in appropriate plugin directory:
   ```bash
   .claude-plugin/plugins/{plugin-name}/commands/{command-name}.md
   ```

2. Use this template:
   ```markdown
   # Command Title
   
   Brief description
   
   ## Usage
   ```bash
   /command:name [args]
   ```
   
   ## Task
   Detailed instructions for Claude...
   
   ## Benefits
   - Benefit 1
   - Benefit 2
   ```

3. Test the command:
   ```bash
   /command:name
   ```

### Adding New Agents

1. Create agent file:
   ```bash
   .claude-plugin/plugins/{plugin-name}/agents/{agent-name}.md
   ```

2. Include:
   - Expertise areas
   - Primary directive
   - Workflow/analysis process
   - Anti-patterns to detect
   - Usage examples

### Plugin Best Practices

1. **Clear Instructions**: Commands should have step-by-step tasks
2. **Actionable Output**: Always provide specific recommendations
3. **Error Handling**: Include fallbacks for missing tools/data
4. **Documentation**: Explain why, not just what
5. **Examples**: Show real output samples in command docs

## Testing

### Test Individual Commands
```bash
# Test nx commands
/nx:cache-stats
/nx:affected-smart

# Test crypto commands
/crypto:pre-deploy-check

# Test performance commands
/perf:hook-profile 1
```

### Validate Plugin Structure
```bash
# Check marketplace is valid
cat .claude-plugin/marketplace.json | jq .

# Verify all command files exist
find .claude-plugin/plugins -name "*.md" -type f
```

## Troubleshooting

### Plugin not appearing
1. Check marketplace.json syntax: `cat .claude-plugin/marketplace.json | jq .`
2. Verify command files exist in correct location
3. Try reloading: `/plugin marketplace update vibetech-workspace`

### Command not working
1. Check command file markdown syntax
2. Verify Task section has clear instructions
3. Test required tools are available (pnpm, python, etc.)

### Agent not responding
1. Verify agent file is in `agents/` subdirectory
2. Check agent is registered in marketplace.json
3. Try explicit invocation: `@agent-name please help`

## Performance Impact

**Plugin Loading:** Negligible (<50ms)
**Command Execution:** Varies by command
- nx commands: 1-5s (depends on workspace size)
- crypto commands: 2-10s (database queries)
- perf commands: 5-30s (comprehensive analysis)

## Version History

### v1.0.0 (2025-10-13)
- Initial release
- nx-accelerator: 4 commands
- crypto-guardian: 1 command, 1 agent
- performance-profiler: 4 commands

## Future Enhancements

Planned additions:
- [ ] `/nx:cloud-setup` - Automated Nx Cloud configuration
- [ ] `/crypto:backtest` - Quick strategy backtesting
- [ ] `/perf:ci-optimize` - GitHub Actions optimization
- [ ] `@architecture-reviewer` - System design analysis agent
- [ ] `/mobile:deploy` - Capacitor app deployment workflow

## Contributing

To add new plugins or commands:
1. Create command/agent file following templates above
2. Update marketplace.json if needed
3. Test thoroughly
4. Document in this README
5. Commit changes to git

## License

Internal use only - Vibe Tech Development Team
