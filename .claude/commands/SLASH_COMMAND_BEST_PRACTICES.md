# Slash Command Best Practices

This guide documents best practices for writing custom slash commands in Claude Code, based on real-world issues encountered during command development.

## Issue Summary: Inline Execution Permission Errors

**Date**: 2025-10-11
**Impact**: Multiple commands failed with permission errors
**Root Cause**: Using `!command` inline execution syntax with shell operators

## The Problem

### What Happened

When running `/dev:cleanup`, the command failed with:
```
Error: Bash command permission check failed for pattern "!` command execution syntax
(cleaner) This command uses shell operators that require approval for safety
```

### Why It Failed

Commands were using the `!` inline execution syntax:
```markdown
!find . -type d -name "__pycache__" 2>/dev/null | head -10
!du -sh ./.next 2>/dev/null || echo "No Next.js cache found"
```

This syntax triggers **inline execution** which bypasses the normal Bash tool permission system when shell operators are present:
- Pipe operator: `|`
- Stderr redirection: `2>/dev/null`
- Command chaining: `&&`, `||`

### Command Caching Issue

Even after fixing the file, running `/dev:cleanup` still showed the old version because:
1. Claude Code caches slash commands when first loaded
2. File changes don't automatically refresh the cache
3. Requires **restart** or creating a new command file

## The Solution

### Pattern: Explicit Bash Tool Execution

Instead of inline execution, use **step-by-step instructions** with code blocks:

**BAD (Inline Execution):**
```markdown
## Analysis:
!find . -name "*.log" 2>/dev/null | head -10
```

**GOOD (Explicit Bash Tool):**
```markdown
## Step 1: Find Log Files

Execute this bash command:
\`\`\`bash
find . -name "*.log" 2>/dev/null | head -10
\`\`\`

Present with header:
\`\`\`
Log Files Found:
\`\`\`
```

### Example: crypto/status.md (Working Reference)

The `crypto/status.md` command demonstrates the correct pattern:

```markdown
## Step 3: Query Recent Orders from Database

Execute this bash command to query the database:
\`\`\`bash
cd projects/crypto-enhanced && if [ -f trading.db ]; then sqlite3 trading.db "SELECT order_id, pair, side, type, price, volume, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5;" 2>&1; else echo "Database file 'trading.db' not found"; fi
\`\`\`

Present the output with this header:
\`\`\`
════════════════════════════════════════
  RECENT DATABASE ORDERS (Last 5)
════════════════════════════════════════
\`\`\`

Show the query results to the user. If no orders exist, report:
"📭 No orders found in database"
```

## Commands Fixed (2025-10-11)

### 1. list-commands.md
- **Instances**: 1
- **Fix**: Converted `!find` to explicit Bash tool execution

### 2. crypto/position-check.md
- **Instances**: 4
- **Fix**: Converted all sqlite3 queries to step-by-step execution with headers

### 3. crypto/trading-status.md
- **Instances**: 6
- **Fix**: Converted Python scripts and database queries to explicit steps

### 4. dev/parallel-dev.md
- **Instances**: 2
- **Fix**: Converted npm/python commands to explicit background execution

### 5. dev/cleanup.md
- **Instances**: 5
- **Fix**: Converted find/du/PowerShell commands to explicit steps
- **Additional Issue**: `find __pycache__` timed out (2min) - needs scope limiting

## Best Practices Checklist

When writing slash commands:

### ✅ DO:
- Use explicit step-by-step instructions
- Wrap commands in code blocks with `\`\`\`bash`
- Add clear headers for command output
- Specify execution notes at the end
- Use the Bash tool's permission system naturally
- Test commands before committing
- Limit search scope for large repositories

### ❌ DON'T:
- Use `!command` inline execution syntax
- Bypass permission systems
- Assume commands work without testing
- Use unbounded searches (`find .` without limits)
- Forget to handle errors gracefully

## Command Template

```markdown
---
allowed-tools: Bash(command:*), Bash(another:*)
argument-hint: [arg1|arg2]
description: Brief description of what this command does
---

# Command Title

Brief overview of the command's purpose.

## Step 1: Descriptive Step Name

Execute this bash command:
\`\`\`bash
command-to-execute --with-flags
\`\`\`

Present with header:
\`\`\`
══════════════════════════════════
  HEADER FOR OUTPUT
══════════════════════════════════
\`\`\`

## Step 2: Next Step

Execute this bash command:
\`\`\`bash
another-command
\`\`\`

## Analysis:

Based on the data above, provide:
1. Summary
2. Insights
3. Recommendations

**IMPORTANT EXECUTION NOTES:**
- Execute each bash command using the Bash tool
- All commands run from C:\dev as base directory
- If a command fails, note error but continue
- Handle errors gracefully
```

## Verification Process

### After Fixing Commands

1. **Update the command file** with proper syntax
2. **Restart Claude Code** to clear cache
3. **Test the command** with `/command-name`
4. **Verify permissions** are handled correctly
5. **Document any issues** found during testing

### Testing New Commands

Before committing:
```bash
# Check for inline execution syntax
powershell -Command "Get-Content .claude/commands/your-command.md | Select-String -Pattern '^!'"

# If found, convert to explicit Bash tool pattern
```

## Performance Considerations

### Large Repository Issues

**Problem**: Commands like `find . -name "__pycache__"` timeout in large repositories

**Solution**: Limit search scope
```bash
# BAD: Searches entire repository (can timeout)
find . -type d -name "__pycache__"

# GOOD: Limit to specific directories
find ./src ./projects -type d -name "__pycache__" -maxdepth 5

# BETTER: Use multiple targeted searches
find ./src -type d -name "__pycache__"
find ./projects/active -type d -name "__pycache__"
```

### Timeout Limits

- Default Bash timeout: **2 minutes**
- Maximum timeout: **10 minutes**
- For long operations: Use `run_in_background: true`

## Additional Resources

- **Working Examples**: See `.claude/commands/crypto/status.md`
- **Command Discovery**: Run `/list-commands`
- **Debugging**: Check command file directly before running

## Change Log

- **2025-10-11**: Initial documentation after fixing 4 commands
- **Issue Identified**: Inline execution with shell operators requires approval
- **Solution Applied**: Convert to explicit Bash tool execution pattern
- **Commands Fixed**: list-commands, position-check, trading-status, parallel-dev, cleanup
