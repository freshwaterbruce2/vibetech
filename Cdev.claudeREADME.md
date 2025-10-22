# .claude Configuration Directory

This directory contains Claude Code configuration for performance optimization and workflow automation.

## Files

### settings.json (Team-shared)
Main configuration file checked into git. Contains:
- **Permissions**: Pre-approved commands (pnpm, nx, git read operations)
- **Security**: Denied patterns for sensitive files (.env, credentials, nonce files)
- **Environment**: Performance tuning (thinking tokens, timeouts, output limits)
- **Status Line**: Custom real-time context display
- **MCP Servers**: Selective enabling (nx-mcp, filesystem, sqlite)

### settings.local.json (Personal)
Personal overrides, NOT checked into git (covered by *.local gitignore rule).
Use for:
- Personal permission adjustments
- Local environment variables
- Output style preferences

### Hooks
Custom scripts that run at specific points:

**status-line.ps1**
- Real-time context display (<100ms execution)
- Shows: project, branch, modified files, Nx cache status, time
- No token consumption - pure system info

**session-start.ps1** (existing)
- Memory system initialization
- Last session context loading
- Agent recommendations

**user-prompt-submit.ps1** (existing)
- Task tracking and history
- Agent orchestrator invocation
- Context saving on intervals

## Configuration Hierarchy

Settings are applied in order (highest to lowest precedence):
1. Command line arguments (session-specific)
2. `.claude/settings.local.json` (personal, not in git)
3. `.claude/settings.json` (team-shared, in git)
4. `~/.claude/settings.json` (global user settings)

## Permissions Strategy

**Allow (no prompt):**
- Read operations (files, git status/diff/log)
- Package manager commands (pnpm, npm)
- Nx commands
- Python execution
- PowerShell scripts

**Ask (prompt for confirmation):**
- Git write operations (commit, push, pull, rebase)
- File deletion (rm, del)
- File writes

**Deny (blocked):**
- Sensitive files (.env, secrets, nonce_state files)
- Dangerous commands (curl, wget, rm -rf, format)
- Crypto config files with API keys

## Environment Variables

Key performance tuning variables:
- `CLAUDE_CODE_MAX_OUTPUT_TOKENS`: 8192 (balanced output size)
- `MAX_THINKING_TOKENS`: 10000 (enable extended thinking)
- `BASH_DEFAULT_TIMEOUT_MS`: 120000 (2 min default timeout)
- `BASH_MAX_TIMEOUT_MS`: 600000 (10 min max timeout)
- `MCP_TIMEOUT`: 30000 (30s MCP startup)
- `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`: 1 (stay in project dir)

## Status Line

The custom status line provides instant context without token consumption:

Format: `[project:branch] Modified: N | Nx Cache: ✓/✗ | HH:MM`

Example: `[vibetech-workspace:main] Modified: 5 | Nx Cache: ✓ | 14:30`

## Testing Configuration

To verify your configuration:
1. Start new Claude Code session
2. Check status line appears correctly
3. Run a pre-approved command (should execute without prompt)
4. Try a denied operation (should be blocked)
5. Test status line refresh (git commit, check status updates)

## Troubleshooting

**Status line not appearing:**
- Check `.claude/hooks/status-line.ps1` exists
- Verify PowerShell execution policy allows scripts
- Test manually: `powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/status-line.ps1`

**Permissions not working:**
- Check JSON syntax in settings files
- Verify precedence (local > project > global)
- Use `/config` command to inspect active settings

**Performance issues:**
- Check hook execution times in logs
- Review `MAX_THINKING_TOKENS` setting (reduce if needed)
- Monitor Nx cache hit rates

## Next Steps

- **Phase 2**: Plugin marketplace development
- **Phase 3**: Hook optimization (async patterns)
- **Phase 4**: Nx Cloud setup
- **Phase 5**: Project-specific CLAUDE.md files

