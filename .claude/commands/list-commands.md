---
allowed-tools: Bash(find:*), Bash(ls:*), Read
description: List all available slash commands with descriptions
---

# Available Slash Commands

Display all custom slash commands available in this project and globally.

## Project Commands (.claude/commands/):

!find .claude/commands -name "*.md" -type f 2>/dev/null | sort

## Command Descriptions:

Based on the files found above, here's what each command does:

### Web Commands:
- `/web:quality-check` - Run complete quality pipeline with lint, typecheck, and tests
- `/web:component-create` - Generate new React components with TypeScript and shadcn/ui

### Crypto Commands:
- `/crypto:trading-status` - Check live trading system status and health
- `/crypto:position-check` - Analyze current positions with risk metrics

### Development Commands:
- `/dev:parallel-dev` - Start multiple development servers in parallel
- `/dev:cleanup` - Smart cleanup of temporary files and caches

### Git Commands:
- `/git:smart-commit` - Create commits with automatic quality checks

### System Commands:
- `/auto-memory` - Diagnostic tool for memory system (runs automatically)
- `/memory-status` - Check memory system statistics
- `/list-commands` - This command - lists all available commands

## Usage Examples:

```bash
# Run quality checks with auto-fix
/web:quality-check fix

# Create a new Button component
/web:component-create Button ui

# Check trading system status
/crypto:trading-status

# Start development servers
/dev:parallel-dev both

# Clean up temporary files
/dev:cleanup quick

# Create a commit
/git:smart-commit "feat: Add new feature"
```

## Tips:
- Commands support arguments - check each command's argument-hint
- Use tab completion for command names
- Commands are automatically discovered from .md files
- Add your own commands by creating .md files in .claude/commands/

$ARGUMENTS