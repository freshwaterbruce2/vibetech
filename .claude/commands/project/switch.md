---
allowed-tools: Bash(cd:*), Bash(git:*), Bash(npm:*), Read
description: Quick context switch between projects with smart setup
argument-hint: <project-name>
model: sonnet
---

# Project Context Switch

Quickly switch context between projects with automatic setup and status checks.

## Step 1: Validate Project Argument

Project: $ARGUMENTS[0]

Available projects:
- web (root web application)
- crypto (cryptocurrency trading)
- vibe-tutor (mobile app)
- digital-content (digital-content-builder)
- business-booking (business-booking-platform)
- taskmaster (desktop task manager)
- deepcode (deepcode-editor)

If no project specified, show usage:
```
════════════════════════════════════════
  PROJECT SWITCH - USAGE
════════════════════════════════════════

Usage: /project:switch <project-name>

Available Projects:
  web              - Root web application (React 19 + Nx)
  crypto           - Crypto trading system (Python)
  vibe-tutor       - Mobile app (Capacitor)
  digital-content  - Digital content builder
  business-booking - Business booking platform
  taskmaster       - Desktop task manager
  deepcode         - DeepCode editor

Examples:
  /project:switch crypto
  /project:switch vibe-tutor
  /project:switch web

════════════════════════════════════════
```

STOP if no project specified.

## Step 2: Navigate to Project

Based on project selection, execute appropriate cd command:

**web:**
```bash
cd C:\dev && pwd
```

**crypto:**
```bash
cd C:\dev\projects\crypto-enhanced && pwd
```

**vibe-tutor:**
```bash
cd C:\dev\Vibe-Tutor && pwd
```

**digital-content:**
```bash
cd C:\dev\projects\active\web-apps\digital-content-builder && pwd
```

**business-booking:**
```bash
cd C:\dev\projects\active\web-apps\business-booking-platform && pwd
```

**taskmaster:**
```bash
cd C:\dev\projects\active\desktop-apps\taskmaster && pwd
```

**deepcode:**
```bash
cd C:\dev\projects\active\desktop-apps\deepcode-editor && pwd
```

Present with header:
```
════════════════════════════════════════
  SWITCHING TO: $ARGUMENTS[0]
════════════════════════════════════════
```

Show current directory.

## Step 3: Check Git Status

Execute this bash command:
```bash
git status --short
```

Present with header:
```
════════════════════════════════════════
  GIT STATUS
════════════════════════════════════════
```

Show any modified files or clean status.

## Step 4: Check Dependencies

For Node.js projects (web, vibe-tutor, digital-content, business-booking, taskmaster, deepcode):
```bash
if [ -f package.json ]; then npm list --depth=0 2>&1 | head -10; fi
```

For Python projects (crypto):
```bash
if [ -f requirements.txt ]; then .venv/Scripts/pip list | head -10; fi
```

Present with header:
```
════════════════════════════════════════
  DEPENDENCIES STATUS
════════════════════════════════════════
```

Show installed packages.

## Step 5: Project-Specific Context

Provide project-specific information:

### For Web Projects:
```
════════════════════════════════════════
  WEB PROJECT QUICK START
════════════════════════════════════════

Tech Stack:
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3.4.18
- shadcn/ui components
- Nx monorepo

Quick Commands:
- Start dev: npm run dev
- Run tests: npm run test
- Quality check: /web:quality-check
- Create component: /web:component-create <name>
- Build: npm run build

Common Tasks:
✓ Make code changes
✓ Run quality checks
✓ Commit: /git:smart-commit
✓ Deploy

════════════════════════════════════════
```

### For Crypto Project:
```
════════════════════════════════════════
  CRYPTO TRADING QUICK START
════════════════════════════════════════

Tech Stack:
- Python 3.x
- SQLite database
- Kraken API
- WebSocket V2
- AsyncIO

Quick Commands:
- Check status: /crypto:status
- Check positions: /crypto:position-check
- Restart system: /crypto:restart
- View logs: tail -f trading_new.log

Safety Reminders:
⚠ Max position: $10
⚠ Trading pair: XLM/USD only
⚠ Always check positions before restart

════════════════════════════════════════
```

### For Vibe-Tutor:
```
════════════════════════════════════════
  VIBE-TUTOR MOBILE QUICK START
════════════════════════════════════════

Tech Stack:
- Capacitor 7
- React + TypeScript
- Tailwind CSS v3 (NOT CDN)
- Android native

Quick Commands:
- Build web: npm run build
- Sync: /mobile:sync-capacitor
- Build APK: /mobile:build-android
- Run on device: npx cap run android

Important:
⚠ Always use Tailwind v3 (not CDN)
⚠ Use CapacitorHttp.request()
⚠ Increment versionCode per build

════════════════════════════════════════
```

## Step 6: Quick Actions Menu

Present available actions:
```
════════════════════════════════════════
  WHAT WOULD YOU LIKE TO DO?
════════════════════════════════════════

Common Actions for $ARGUMENTS[0]:

${if web-project}
1. Start development server
2. Run quality checks
3. Create new component
4. Run tests
5. View Nx graph
${endif}

${if crypto}
1. Check trading status
2. View recent logs
3. Check open positions
4. Restart trading system
${endif}

${if mobile}
1. Sync Capacitor
2. Build Android APK
3. Run on device
4. Test in browser
${endif}

Type your choice or use slash commands directly.

Related Commands:
- Project status: /project:status
- Back to root: /project:switch web

════════════════════════════════════════
```

## Step 7: Load Recent Work Context

Show recent activity:
```
════════════════════════════════════════
  RECENT ACTIVITY
════════════════════════════════════════

Last 3 commits:
[Execute: git log -3 --oneline]

Modified files:
[Execute: git status --short]

Last worked on: [show file modification times]

To continue where you left off:
- Review changes: git diff
- See full log: git log
- Check branches: git branch -a

════════════════════════════════════════
```

$ARGUMENTS

**IMPORTANT EXECUTION NOTES:**
- Execute bash commands using the Bash tool
- Automatically navigates to project directory
- Provides context-specific quick start info
- Shows git status and recent activity
- All paths are absolute from C:\dev
- Helps quickly resume work on any project
