---
description: Execute tasks autonomously without permission prompts (YOLO = You Only Live Once)
argument-hint: <task_description>
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, TodoWrite
---

# YOLO Mode - Autonomous Task Execution

Execute multi-step tasks autonomously without stopping for permission prompts. This mode is optimized for speed and efficiency but requires proper safety checks.

**WARNING:** This mode will make changes without asking. Only use on feature branches with committed work.

## Safety Protocol - EXECUTE FIRST

### Step 1: Git Safety Check

Execute these commands in parallel:
```bash
git rev-parse --is-inside-work-tree 2>&1
```
```bash
git branch --show-current
```
```bash
git status --porcelain
```

If NOT in a git repository, STOP and report:
```
════════════════════════════════════════
  YOLO MODE - SAFETY CHECK FAILED
════════════════════════════════════════

Not in a git repository.

YOLO mode requires git for safety rollback:
  git init
  git add .
  git commit -m "initial commit"

════════════════════════════════════════
```

If on `main` or `master` branch, STOP and report:
```
════════════════════════════════════════
  YOLO MODE - SAFETY CHECK FAILED
════════════════════════════════════════

Current branch: main

YOLO mode is disabled on main/master branches.

Create a feature branch first:
  git checkout -b feature/task-name

Or if you're certain, override with:
  git checkout -b yolo-$(date +%s)

════════════════════════════════════════
```

If there are uncommitted changes, WARN but continue:
```
════════════════════════════════════════
  YOLO MODE - WARNING
════════════════════════════════════════

You have uncommitted changes.

These changes will be mixed with YOLO mode changes.

Recommendation:
  git add .
  git commit -m "WIP: before YOLO mode"

Proceeding in 3 seconds...
════════════════════════════════════════
```

### Step 2: Trading System Safety Check (if applicable)

If task involves crypto-enhanced project, execute:
```bash
cd projects/crypto-enhanced && python -c "
import sqlite3
from datetime import datetime, timedelta

try:
    conn = sqlite3.connect('trading.db')
    cursor = conn.cursor()

    # Check for recent failed orders
    cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
    cursor.execute('''
        SELECT COUNT(*) FROM orders
        WHERE status='failed' AND created_at > ?
    ''', (cutoff,))
    failed_count = cursor.fetchone()[0]

    # Check open positions
    cursor.execute('''
        SELECT COUNT(*), SUM(unrealized_pnl)
        FROM positions WHERE status='open'
    ''')
    open_positions, total_pnl = cursor.fetchone()

    print(f'FAILED_ORDERS:{failed_count}')
    print(f'OPEN_POSITIONS:{open_positions}')
    print(f'TOTAL_PNL:{total_pnl or 0}')

    conn.close()
except Exception as e:
    print(f'ERROR:{str(e)}')
" 2>&1
```

If more than 5 failed orders in 24 hours, STOP and report:
```
════════════════════════════════════════
  YOLO MODE - TRADING SYSTEM UNSAFE
════════════════════════════════════════

Detected excessive failed orders (>5 in 24h).

Trading system is unstable. Fix issues first:
  /crypto:status
  /crypto:position-check

════════════════════════════════════════
```

### Step 3: Validate Task Description

Task description MUST be provided as an argument.

If no task provided, report:
```
════════════════════════════════════════
  YOLO MODE - USAGE
════════════════════════════════════════

Usage: /yolo-mode <task_description>

Examples:
  /yolo-mode fix all TypeScript errors
  /yolo-mode add dark mode toggle to settings
  /yolo-mode refactor authentication logic
  /yolo-mode update dependencies and fix breaking changes

Task must be specific and actionable.

════════════════════════════════════════
```

## Autonomous Execution Workflow

Once safety checks pass, execute the task following this workflow:

### Phase 1: Investigation (Parallel)
Use TodoWrite to create task plan with status tracking:
```
1. Analyze codebase structure
2. Identify affected files
3. Search for existing implementations
4. Review relevant documentation
```

Execute investigation tools in parallel:
- Grep for relevant code patterns
- Glob for file matches
- Read key configuration files

**Rules:**
- Use parallel tool calls when possible (single message, multiple tools)
- Search broadly first, then narrow focus
- Document findings concisely

### Phase 2: Planning
Based on investigation, create detailed execution plan:
```
1. [Specific change 1] - file.ts:123
2. [Specific change 2] - component.tsx:45
3. [Specific change 3] - config.json:12
4. Run quality checks
5. Fix any errors
```

Update TodoWrite with full task breakdown.

**Rules:**
- Break down into atomic, testable steps
- Include file paths and line numbers
- Estimate complexity (simple/moderate/complex)

### Phase 3: Execution (Autonomous)

Execute each step WITHOUT asking for confirmation:

1. **Make Changes**
   - Use Edit for modifications (preserves formatting)
   - Use Write for new files
   - Update todos to track progress

2. **Verify Changes**
   - Read modified files to confirm
   - Check syntax if applicable

3. **Run Quality Checks**
   ```bash
   pnpm run lint --fix
   pnpm run typecheck
   pnpm run build
   ```

4. **Handle Errors Autonomously**
   - If lint errors: fix automatically with Edit tool
   - If type errors: analyze and fix (no prompts)
   - If build errors: investigate and resolve
   - Maximum 3 iterations per error type
   - If still failing after 3 iterations, report for help

### Phase 4: Validation

Execute final validation:
```bash
# Run full quality pipeline
pnpm run quality
```

If quality checks pass:
```bash
# Show diff
git diff --stat
git diff
```

Report completion:
```
════════════════════════════════════════
  YOLO MODE - TASK COMPLETE
════════════════════════════════════════

Task: [task description]
Status: SUCCESS

Changes made:
[git diff --stat output]

Quality checks: PASSED

Next steps:
  git add .
  git commit -m "feat: [task description]"
  git push

Or to rollback:
  git reset --hard HEAD
  git clean -fd

════════════════════════════════════════
```

If quality checks fail after max iterations:
```
════════════════════════════════════════
  YOLO MODE - TASK INCOMPLETE
════════════════════════════════════════

Task: [task description]
Status: BLOCKED

Issues encountered:
[describe errors]

Changes made (partial):
[git diff --stat output]

Manual intervention required.

To rollback:
  git reset --hard HEAD
  git clean -fd

════════════════════════════════════════
```

## Execution Rules

1. **No Confirmation Prompts**
   - Never ask "Should I proceed?"
   - Never wait for approval mid-task
   - Make decisions autonomously based on context

2. **Error Recovery**
   - Try automatic fixes first (lint --fix, prettier, etc.)
   - Analyze error messages and apply fixes
   - Maximum 3 fix attempts per error
   - Report if unable to resolve automatically

3. **Tool Usage Optimization**
   - Use parallel tool calls whenever possible
   - Prefer specialized tools (Edit) over bash (sed)
   - Use TodoWrite to track progress visibly

4. **Scope Management**
   - Stay focused on the specified task
   - Don't add unrelated improvements
   - Don't refactor beyond task scope
   - Keep changes minimal and targeted

5. **Quality Standards**
   - All code must pass linting
   - All code must pass type checking
   - All code must build successfully
   - Follow existing code style and patterns

## Task Categories & Strategies

### Bug Fixes
- Grep for error messages first
- Read relevant files completely
- Test fix before moving on
- Verify no regressions

### New Features
- Check for existing similar code
- Reuse patterns and components
- Add to existing architecture
- Keep consistent with codebase style

### Refactoring
- Search for all usages first (Grep)
- Plan changes to avoid breaking imports
- Update in dependency order
- Verify no test failures

### Dependency Updates
- Read package.json first
- Update and run install
- Fix breaking changes immediately
- Run full test suite

## Project-Specific Behaviors

### Web Apps (React/TypeScript/Vite)
- Always run `pnpm run quality` at the end
- Use shadcn/ui components when available
- Follow Tailwind CSS conventions
- Maintain TypeScript strict mode compliance

### Crypto Trading System
- NEVER modify live trading without approval
- Always update tests alongside logic changes
- Verify database schema changes
- Check for nonce management implications

### Desktop Apps (Tauri)
- Update Rust and TypeScript sides together
- Test IPC communication if changed
- Verify build succeeds for target platform
- Check for security implications

### Mobile Apps (Capacitor)
- Test changes in browser first
- Consider Android WebView limitations
- Increment versionCode if building
- Check for network/offline compatibility

## Advanced Features

### Parallel Execution
When multiple independent tasks exist:
```
Task 1: Fix TypeScript errors in src/components/
Task 2: Update dependencies in package.json
Task 3: Fix lint errors in src/pages/
```

Execute changes in parallel (single message, multiple Edit calls).

### Intelligent Caching
Reuse information across steps:
- File contents (Read once, reference multiple times)
- Search results (Grep once, use for multiple decisions)
- Project structure (Glob once at start)

### Minimal Context Usage
- Use head/tail for large files
- Filter Grep results with head_limit
- Avoid reading generated files (dist/, node_modules/)

## Emergency Stop

If user says "stop", "halt", or "cancel" during execution:
1. Complete current atomic operation
2. Report current progress
3. Leave changes uncommitted
4. Provide rollback instructions

## Important Notes

- YOLO mode is for development tasks only
- Never deploy to production autonomously
- Never make irreversible changes (database migrations, deletions)
- Never bypass trading system safety checks
- Always verify changes with git diff before committing
- Git is your safety net - commit frequently

$ARGUMENTS
