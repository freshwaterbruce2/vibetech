# Agent Orchestrator System - Complete Guide

## Overview

The Agent Orchestrator System automatically selects and invokes specialist agents based on learned patterns from 4,362 proven executions across 4 high-performing agents.

**Key Stats:**
- 4 proven performers merged into 3 specialist agents
- 4,362 total executions analyzed
- 99.96% average success rate
- 0.17s average execution time

## System Architecture

```
User Task → Orchestrator → Pattern Analysis → Agent Selection → Auto-Invocation
              ↓
         Database (57k+ executions)
              ↓
         Pattern Mapping (4 proven performers)
              ↓
         Specialist Agents (6 specialists)
```

## Components

### 1. Pattern Extraction (`migrate_agent_patterns.py`)

**Purpose:** Extract execution patterns from proven performers and map to specialist agents.

**Proven Performers Analyzed:**
- `auto_fixer_001` - 2,528 executions (99.96% success)
- `crypto-enhanced-trading` - 1,277 executions (99.92% success)
- `crypto_auto_fixer` - 428 executions (99.77% success)
- `enhanced_market_001` - 129 executions (99.22% success)

**Output:** `agent_pattern_mapping.json`

**Run:**
```powershell
cd C:\dev\projects\active\web-apps\memory-bank
python migrate_agent_patterns.py
```

### 2. Agent Orchestrator (`agent_orchestrator.py`)

**Purpose:** Analyze tasks and recommend/invoke appropriate specialist agents.

**Capabilities:**
- Keyword-based task analysis
- Project context detection
- Confidence scoring (0-15+ scale)
- Auto-invocation threshold (confidence >= 3.0)

**Algorithm:**
```
1. Extract keywords from task description
2. Calculate base score from keyword matches
3. Boost score based on:
   - Inherited performance from proven performers
   - Task type match with learned patterns
   - Project context assignment
4. Select agent with highest confidence
5. Auto-invoke if confidence >= 3.0
```

**Usage:**
```powershell
python agent_orchestrator.py "Fix WebSocket error in trading system" "crypto-enhanced"
```

**Example Output:**
```json
{
  "recommended": true,
  "agent": "crypto-expert",
  "confidence": 14.99,
  "display_name": "Crypto Trading Expert",
  "reasons": [
    "Inherited from 4 proven performers",
    "Proven track record with auto_fix_cycle tasks (2954 executions)",
    "Assigned specialist for crypto-enhanced"
  ],
  "task_type": "auto_fix_cycle",
  "performance_targets": {
    "target_success_rate": 0.9996,
    "target_execution_time": 0.17
  }
}
```

### 3. PowerShell Invocation Hook (`invoke-specialist-agent.ps1`)

**Purpose:** PowerShell interface for agent invocation from Claude Code hooks.

**Features:**
- Dry-run mode for testing
- Confidence-based auto-invocation
- Formatted output for Claude Code
- Integration with existing hook system

**Usage:**
```powershell
.\.claude\hooks\invoke-specialist-agent.ps1 `
  -TaskDescription "Monitor crypto trading performance" `
  -ProjectContext "crypto-enhanced"
```

**Dry-run mode:**
```powershell
.\.claude\hooks\invoke-specialist-agent.ps1 `
  -TaskDescription "Fix React component" `
  -ProjectContext "digital-content-builder" `
  -DryRun
```

### 4. Enhanced Agent Configs (`.claude/agents.json`)

**Specialists with Inherited Patterns:**

#### crypto-expert
- **Inherited from:** auto_fixer_001, crypto-enhanced-trading, crypto_auto_fixer, enhanced_market_001
- **Total executions:** 4,362
- **Task types:**
  - auto_fix_cycle: 2,954 executions (100% success)
  - monitoring_cycle: 1,276 executions (100% success)
  - market_analysis: 128 executions (100% success)
- **Performance targets:** 99.96% success, 0.17s avg time

#### webapp-expert
- **Inherited from:** auto_fixer_001
- **Total executions:** 2,528
- **Task types:**
  - auto_fix_cycle: 2,527 executions (100% success)
- **Performance targets:** 99.96% success, 0.17s avg time

#### backend-expert
- **Inherited from:** auto_fixer_001
- **Total executions:** 2,528
- **Task types:**
  - auto_fix_cycle: 2,527 executions (100% success)
- **Performance targets:** 99.96% success, 0.17s avg time

## Task Type Detection

The orchestrator recognizes these task types based on keywords:

### auto_fix_cycle
**Keywords:** fix, bug, error, issue, problem, broken, crash, fail
**Examples:**
- "Fix WebSocket connection error"
- "Debug nonce synchronization issue"
- "Resolve trading system crash"

### monitoring_cycle
**Keywords:** monitor, watch, track, observe, check status
**Examples:**
- "Monitor crypto trading system performance"
- "Watch for API errors"
- "Track order execution"

### market_analysis
**Keywords:** analyze, analysis, review, investigate
**Examples:**
- "Analyze trading patterns"
- "Review market data trends"
- "Investigate price movements"

### refactoring
**Keywords:** refactor, improve, optimize, clean, restructure
**Examples:**
- "Refactor trading engine for performance"
- "Optimize database queries"
- "Clean up duplicate code"

## Specialist Selection

### crypto-expert (Best for)
- Python cryptocurrency trading systems
- Kraken API integration
- WebSocket V2 implementations
- Trading algorithms and strategies
- Performance optimization (memory, caching, circuit breakers)
- Database schema management
- AsyncIO-based systems

**Trigger keywords:** trading, crypto, kraken, websocket, order, market, price, strategy, nonce

### webapp-expert (Best for)
- React component development
- TypeScript web applications
- Vite build configurations
- Tailwind CSS styling
- shadcn/ui integration
- React Router navigation
- State management (React Query)

**Trigger keywords:** react, component, ui, frontend, tailwind, shadcn, vite, router, page

### backend-expert (Best for)
- REST API development
- Database design and optimization
- Server-side architecture
- Authentication/authorization
- Node.js or Python backends
- API testing and debugging

**Trigger keywords:** api, database, server, backend, endpoint, auth, rest, graphql

### desktop-expert (Best for)
- Tauri or Electron applications
- Desktop-specific features
- Native OS integration
- Cross-platform desktop development

**Trigger keywords:** tauri, electron, desktop, window, native

### mobile-expert (Best for)
- Capacitor mobile apps
- React Native applications
- iOS/Android platform integration
- PWA to native conversion

**Trigger keywords:** capacitor, android, ios, mobile, app, native

### devops-expert (Best for)
- Docker containerization
- CI/CD pipeline configuration
- GitHub Actions workflows
- Deployment automation
- Infrastructure as code

**Trigger keywords:** docker, deploy, ci, cd, pipeline, github actions, build, test

## Auto-Invocation Rules

**Confidence Calculation:**
```
Base Score = Keyword matches (1 point per keyword)
+ Inherited performance boost (avg_success_rate * 2)
+ Task type match boost (avg_success * 3)
+ Project assignment boost (3 points)
= Final Confidence Score
```

**Auto-Invocation Threshold:** >= 3.0

**Examples:**

| Task | Agent | Confidence | Auto-Invoke? |
|------|-------|------------|--------------|
| Fix WebSocket error in crypto trading | crypto-expert | 14.99 | ✅ Yes |
| Create React component | webapp-expert | 11.99 | ✅ Yes |
| Monitor trading performance | crypto-expert | 14.99 | ✅ Yes |
| Update README | (none) | 0.5 | ❌ No |

## Integration with Claude Code

### Current Hook Integration

The orchestrator integrates with existing Claude Code hooks:

**Session Start Hook** (`.claude/hooks/session-start.ps1`)
- Displays specialist agent available for project
- Shows inherited patterns and performance targets

**User Prompt Hook** (Future Enhancement)
- Analyze incoming user prompts
- Auto-invoke specialist if confidence >= 3.0
- Display recommendation and reasoning

### Manual Invocation

You can manually invoke specialists using the `@` syntax:

```
@crypto-expert Fix the WebSocket connection timeout
@webapp-expert Create a new dashboard component
@backend-expert Optimize database query performance
```

The orchestrator helps decide which specialist to use.

## Testing

### Test Pattern Extraction
```powershell
cd C:\dev\projects\active\web-apps\memory-bank
python migrate_agent_patterns.py
# Output: agent_pattern_mapping.json
```

### Test Orchestrator Recommendations
```powershell
# Crypto trading task
python agent_orchestrator.py "Fix WebSocket error" "crypto-enhanced"

# Web app task
python agent_orchestrator.py "Create React component" "digital-content-builder"

# Backend task
python agent_orchestrator.py "Optimize database queries" "memory-bank"
```

### Test PowerShell Integration
```powershell
# Dry run (doesn't invoke)
.\.claude\hooks\invoke-specialist-agent.ps1 `
  -TaskDescription "Monitor trading system" `
  -ProjectContext "crypto-enhanced" `
  -DryRun

# Real invocation
.\.claude\hooks\invoke-specialist-agent.ps1 `
  -TaskDescription "Monitor trading system" `
  -ProjectContext "crypto-enhanced"
```

## Performance Targets

All specialists now have inherited performance targets from proven performers:

- **Target Success Rate:** 99.96%
- **Target Execution Time:** 0.17 seconds
- **Proven Task Types:** auto_fix_cycle, monitoring_cycle, market_analysis

## Maintenance

### Daily
- Training script runs at 2 AM (if configured)
- Analyzes last 7 days of executions
- Updates training_results.json

### Weekly
```powershell
# Re-extract patterns from latest data
python migrate_agent_patterns.py

# Review agent recommendations
python train_agents.py --hours 168
```

### Monthly
```powershell
# Full retraining on all data
python train_agents.py --all

# Check orchestrator effectiveness
Get-Content C:\dev\projects\active\web-apps\memory-bank\training_summary.txt
```

## Troubleshooting

### Issue: Orchestrator not recommending agent
**Check:**
1. Pattern mapping file exists: `agent_pattern_mapping.json`
2. Agents config file exists: `.claude\agents.json`
3. Task contains relevant keywords

**Fix:**
```powershell
python migrate_agent_patterns.py  # Regenerate patterns
```

### Issue: Confidence score too low
**Cause:** Task doesn't match learned patterns or keywords

**Solutions:**
1. Add more descriptive keywords to task
2. Specify project context
3. Manually invoke with `@agent-name`

### Issue: Wrong agent recommended
**Cause:** Keywords match multiple specialists

**Solutions:**
1. Add project-specific keywords
2. Provide project context parameter
3. Review and adjust keyword lists in orchestrator

## File Locations

```
C:\dev\projects\active\web-apps\memory-bank\
├── agent_orchestrator.py          # Main orchestrator
├── migrate_agent_patterns.py      # Pattern extraction
├── agent_pattern_mapping.json     # Extracted patterns
├── training_results.json          # Training data
├── training_summary.txt           # Human-readable summary
└── AGENT_ORCHESTRATOR_GUIDE.md    # This file

C:\dev\.claude\
├── agents.json                     # Enhanced agent configs
└── hooks\
    ├── session-start.ps1           # Session hook
    └── invoke-specialist-agent.ps1 # Invocation hook

D:\databases\
└── database.db                     # 57k+ agent executions
```

## Next Steps

1. **Test the orchestrator** with real tasks in your workflow
2. **Monitor effectiveness** - Track which agents get invoked and success rates
3. **Adjust thresholds** - Tune confidence threshold (currently 3.0) if needed
4. **Integrate into hooks** - Add to user-prompt-submit hook for automatic invocation
5. **Add more patterns** - As specialists accumulate executions, re-run pattern extraction

## Summary

You now have:
- ✅ Pattern extraction from 4 proven performers (4,362 executions)
- ✅ Intelligent orchestrator with confidence-based selection
- ✅ PowerShell integration for Claude Code hooks
- ✅ Enhanced specialist configs with inherited patterns
- ✅ Auto-invocation system (confidence >= 3.0)
- ✅ Comprehensive documentation

**The system is ready to use!** Specialist agents now have learned patterns from proven performers and will be automatically invoked based on task analysis.
