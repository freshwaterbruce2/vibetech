# Claude Code Auto-Memory Hooks

## CRITICAL: Automatic Memory System

These hooks ensure the memory system works AUTOMATICALLY in every Claude Code session.

## Installed Hooks:

### 1. session-start.ps1
- **Purpose**: Automatically retrieves previous session context when Claude Code starts
- **Runs**: At the beginning of EVERY conversation
- **Function**: Loads last session data, git status, and modified files

### 2. user-prompt-submit.ps1
- **Purpose**: Automatically saves session context periodically
- **Runs**: After user prompts containing keywords or every 5 interactions
- **Function**: Saves current task context to memory-bank

### 3. hook-config.json
- **Purpose**: Configuration file for hook system
- **Contains**: Hook settings and memory system paths

## How It Works:

1. **Session Start**: When you start Claude Code, session-start.ps1 automatically runs
2. **Memory Retrieval**: Previous session context is loaded from memory-bank
3. **Continuous Save**: Session context is saved periodically during conversation
4. **No User Action**: Everything happens automatically - no commands needed!

## Testing:

To verify hooks are working:
```powershell
powershell -Command "& 'C:\dev\.claude\hooks\session-start.ps1'"
```

## Troubleshooting:

If memory isn't working automatically:
1. Check hooks exist in `.claude/hooks/`
2. Verify memory_cli.js is accessible
3. Ensure settings.local.json has hooks configuration
4. Run `/auto-memory` command to test

## IMPORTANT:

These hooks make the memory system TRULY AUTOMATIC. Users should NEVER need to:
- Run memory commands manually
- Ask about previous sessions
- Request context to be saved

Everything happens automatically in the background!