# GitHub Copilot Instructions

This directory contains custom instructions for GitHub Copilot coding agent, following [GitHub's best practices](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results).

## File Structure

### Main Instructions
- **copilot-instructions.md** - Primary architecture overview and critical workflows for the entire monorepo

### Specific Instructions (`.instructions.md` files)
- **PNPM.instructions.md** - Package manager guidelines (applies to all files)
- **crypto-trading.instructions.md** - Security-critical instructions for live trading system (applies to `projects/crypto-enhanced/**`)
- **react-typescript.instructions.md** - React 19 + TypeScript standards (applies to `src/**/*.{ts,tsx}`)
- **testing.instructions.md** - Test best practices for React and Python (applies to test files)
- **git-commits.instructions.md** - Version control and conventional commits (applies to all files)

## How Instructions Work

GitHub Copilot reads these files to understand:
1. **Project architecture** and technology stack
2. **Coding standards** and conventions
3. **Security requirements** and critical workflows
4. **Testing strategies** and quality standards
5. **Git workflow** and commit conventions

### YAML Frontmatter

Each instruction file includes frontmatter with:
```yaml
---
applyTo: 'glob-pattern'  # Which files these instructions apply to
name: "Display Name"      # Human-readable name
description: "Purpose"    # What these instructions cover
---
```

### Scope Examples

- `applyTo: '**'` - Applies to all files in the repository
- `applyTo: 'src/**/*.{ts,tsx}'` - Only TypeScript/React files in src/
- `applyTo: 'projects/crypto-enhanced/**'` - Only crypto trading system files
- `applyTo: '**/*.{test,spec}.{ts,tsx,js,jsx}'` - Only test files

## Best Practices Implemented

✅ **Clear scope definitions** - Each instruction file targets specific areas
✅ **YAML frontmatter** - Proper metadata for Copilot to parse
✅ **Comprehensive coverage** - Architecture, security, testing, styling, Git
✅ **Security emphasis** - Special instructions for financial trading system
✅ **Consistent formatting** - All files follow markdown best practices
✅ **Action-oriented** - Instructions tell Copilot what to do, not just describe

## Key Highlights

### Security-Critical Trading System
The `crypto-trading.instructions.md` file emphasizes:
- Financial safety checks before any code changes
- 90%+ test coverage requirements
- Explicit async patterns with Python 3.11+
- Nonce management in nanoseconds
- Emergency procedures for stopping trading

### Package Manager Enforcement
The `PNPM.instructions.md` ensures:
- All commands use `pnpm` (never `npm` or `yarn`)
- Workspace commands for monorepo structure
- Proper dependency management

### Testing Standards
The `testing.instructions.md` defines:
- React Testing Library best practices
- Playwright E2E patterns
- pytest async testing patterns
- Coverage requirements by area (60-90%)
- Mock best practices

### React & TypeScript
The `react-typescript.instructions.md` enforces:
- Strict TypeScript configuration
- Import aliases (`@/` for `src/`)
- Component structure and file organization
- React Query for server state
- Error boundaries and performance optimization

### Git Workflow
The `git-commits.instructions.md` establishes:
- Conventional commits specification
- Incremental merge strategy (every 10 commits)
- Pre-commit quality checks
- Branch naming conventions

## Updating Instructions

When updating these files:

1. **Maintain YAML frontmatter** - Required for Copilot to understand scope
2. **Keep scopes focused** - Don't overlap too much between files
3. **Be specific** - Give clear, actionable guidance
4. **Update this README** - Document any new instruction files added

## Testing Instructions

To verify Copilot reads these instructions:
1. Ask Copilot about project conventions (e.g., "What package manager should I use?")
2. Request code changes in specific areas (e.g., crypto trading, React components)
3. Observe if Copilot follows the guidelines (e.g., uses `pnpm` instead of `npm`)

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Comprehensive guide for Claude Code assistant
- [README.md](../../README.md) - Project overview and quick start
- [GIT-COMMIT-GUIDE.md](../../GIT-COMMIT-GUIDE.md) - Detailed Git workflow
- [MONOREPO_WORKFLOW.md](../../MONOREPO_WORKFLOW.md) - Monorepo management guide

## References

- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
- [Custom Instructions Documentation](https://docs.github.com/en/copilot/tutorials/coding-agent/pilot-coding-agent)
- [Conventional Commits](https://www.conventionalcommits.org/)
