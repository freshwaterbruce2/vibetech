# GitHub Copilot Instructions Setup

This document describes the GitHub Copilot coding agent configuration for the Vibe Tech monorepo.

## Overview

GitHub Copilot instructions have been configured following [GitHub's best practices](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results) to provide context-aware assistance across the monorepo.

## Configuration Files

### Main Instructions
**Location**: `.github/copilot-instructions.md`

Primary architecture overview covering:
- Multi-project monorepo structure
- Critical workflows for web app, backend, and crypto trading
- Project-specific conventions (imports, components, styling)
- Security patterns and deployment checklists

### Specialized Instructions
**Location**: `.github/instructions/`

| File | Scope | Purpose |
|------|-------|---------|
| `PNPM.instructions.md` | All files | Package manager enforcement (pnpm only) |
| `crypto-trading.instructions.md` | `projects/crypto-enhanced/**` | Security-critical trading system guidelines |
| `react-typescript.instructions.md` | `src/**/*.{ts,tsx}` | React 19 + TypeScript standards |
| `testing.instructions.md` | `**/*.{test,spec}.*` | Testing best practices (React/Python) |
| `git-commits.instructions.md` | All files | Conventional commits + Git workflow |

## Key Features

### 1. Context-Aware Guidance
Instructions are scoped to specific file patterns using YAML frontmatter:
```yaml
---
applyTo: 'projects/crypto-enhanced/**'
name: "Crypto Trading System"
description: "Security-critical instructions..."
---
```

### 2. Security First
Special emphasis on the live trading system:
- ⚠️ Critical warnings about real money trading
- 90%+ test coverage requirements
- Financial safety checks
- Emergency procedures

### 3. Technology Standards
- **Package Manager**: pnpm (enforced across all files)
- **React**: Version 19 with TypeScript strict mode
- **Python**: Async patterns with Python 3.11+ (TaskGroups, timeouts)
- **Testing**: Playwright E2E, Vitest unit tests, pytest for Python
- **Styling**: Tailwind CSS with custom Aura theme

### 4. Quality Automation
- Pre-commit hooks for linting and security checks
- Conventional commits specification
- Incremental merge strategy (every 10 commits)
- Coverage targets: 60-90% depending on criticality

## How It Works

When GitHub Copilot is invoked:

1. Reads `.github/copilot-instructions.md` for overall context
2. Matches current file against `applyTo` patterns in `.github/instructions/`
3. Applies relevant specialized instructions
4. Generates code following the established patterns

## Examples

### Package Manager
**Instruction**: `PNPM.instructions.md` (applies to all files)
```markdown
**IMPORTANT**: Always use `pnpm` commands, never `npm` or `yarn`.
```

**Result**: Copilot suggests `pnpm install` instead of `npm install`

### Trading System
**Instruction**: `crypto-trading.instructions.md` (applies to `projects/crypto-enhanced/**`)
```markdown
### Nonce Management
```python
# CRITICAL: Use NANOSECONDS (not microseconds)
nonce = int(time.time() * 1000000000)
```

**Result**: Copilot generates correct nonce format when modifying trading code

### React Components
**Instruction**: `react-typescript.instructions.md` (applies to `src/**/*.{ts,tsx}`)
```markdown
**ALWAYS** use `@/` alias for `src/` imports:
```typescript
import { Button } from '@/components/ui/button';
```

**Result**: Copilot uses import aliases instead of relative paths

## Benefits

✅ **Consistency** - All code follows established patterns
✅ **Security** - Special handling for financial systems
✅ **Quality** - Automated enforcement of best practices
✅ **Speed** - Copilot understands project context immediately
✅ **Safety** - Critical warnings for dangerous operations
✅ **Onboarding** - New contributors get guided automatically

## Maintenance

### Adding New Instructions

1. Create file in `.github/instructions/` with `.instructions.md` extension
2. Add YAML frontmatter with `applyTo`, `name`, and `description`
3. Write clear, actionable guidelines
4. Update `.github/instructions/README.md`
5. Commit with message: `docs(copilot): add instructions for [area]`

### Updating Instructions

1. Edit relevant `.instructions.md` file
2. Keep scope focused and specific
3. Test with Copilot to verify behavior
4. Commit with conventional commit message

## Testing

Verify instructions are working:

```bash
# Ask Copilot in different contexts
# In root directory:
"What package manager should I use?" → Should respond: pnpm

# In projects/crypto-enhanced/:
"How do I generate a nonce for Kraken API?" → Should specify nanoseconds

# In src/components/:
"How should I import the Button component?" → Should use @/ alias
```

## Related Documentation

- [.github/instructions/README.md](.github/instructions/README.md) - Detailed instruction file reference
- [CLAUDE.md](CLAUDE.md) - Comprehensive guide for Claude Code assistant
- [README.md](README.md) - Project overview
- [GIT-COMMIT-GUIDE.md](GIT-COMMIT-GUIDE.md) - Git workflow details

## Implementation Checklist

- [x] Create main `copilot-instructions.md` with architecture overview
- [x] Add YAML frontmatter to main instructions
- [x] Create `PNPM.instructions.md` for package manager enforcement
- [x] Create `crypto-trading.instructions.md` for security-critical system
- [x] Create `react-typescript.instructions.md` for frontend standards
- [x] Create `testing.instructions.md` for test best practices
- [x] Create `git-commits.instructions.md` for version control
- [x] Add README in instructions directory
- [x] Update all npm references to pnpm
- [x] Document setup in root COPILOT_SETUP.md

## Resources

- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
- [Custom Instructions Guide](https://docs.github.com/en/copilot/tutorials/coding-agent/pilot-coding-agent)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [awesome-copilot](https://github.com/copilot/awesome-copilot) - Community examples

---

**Last Updated**: 2025-11-17
**Setup By**: GitHub Copilot Coding Agent
**Status**: ✅ Complete and Production Ready
