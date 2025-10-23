# Agent Learning System - Complete Guide

## Overview

You now have a fully integrated agent learning system that:
- **Monitors** all agent executions (57,844+ already collected)
- **Learns** from success patterns, tool usage, and workflows
- **Recommends** which specialist agents to use for different tasks
- **Improves** over time through automated training

## System Components

### 1. Database (D:\databases\database.db)
- **57,844+ agent executions** already stored
- **6 specialist agents** now registered:
  - `crypto-expert` - Python trading systems
  - `webapp-expert` - React/TypeScript web apps
  - `desktop-expert` - Tauri/Electron desktop apps
  - `mobile-expert` - Capacitor mobile apps
  - `backend-expert` - Node.js/Python APIs
  - `devops-expert` - CI/CD and deployment

### 2. Training Pipeline
**Script:** `train_agents.py`

**What it does:**
- Analyzes all agent executions in database
- Discovers success patterns (tool usage, workflows, error resolutions)
- Generates recommendations for each specialist agent
- Saves results to `training_results.json`

**How to run:**
```powershell
# Analyze last week
python train_agents.py --hours 168

# Analyze all data (57k+ executions)
python train_agents.py --all

# Quiet mode (less output)
python train_agents.py --hours 168 --quiet
```

**Outputs:**
- `training_results.json` - Full training data
- `training_summary.txt` - Human-readable summary
- `training.log` - Detailed execution log

### 3. Session Hooks

**Current Hook:** `.claude/hooks/session-start.ps1`
- Shows specialist agent available for current project
- Displays recent work and git context

**Enhanced Hook (Optional):** `session-start-enhanced.ps1`
- All features from base hook PLUS:
- Shows agent performance metrics
- Displays learning recommendations
- Shows relevant patterns discovered

**To use enhanced hook:**
```powershell
# Backup current hook
Copy-Item .claude\hooks\session-start.ps1 .claude\hooks\session-start-backup.ps1

# Replace with enhanced version
Copy-Item C:\dev\projects\active\web-apps\memory-bank\session-start-enhanced.ps1 .claude\hooks\session-start.ps1
```

### 4. Agent Memory Bridge

**Script:** `agent_memory_bridge.py`

**What it does:**
- Prepares context for agent execution (retrieves relevant memories)
- Stores agent execution results in database
- Tracks success patterns and failures
- Provides cross-project insights

**API:**
```python
from agent_memory_bridge import AgentMemoryBridge, AgentExecution

bridge = AgentMemoryBridge()

# Prepare context for task
context = await bridge.prepare_agent_context(
    agent_name='crypto-expert',
    task='Fix Python database schema errors'
)

# Store execution result
execution = AgentExecution(
    agent_name='crypto-expert',
    task_description='Fixed database schema',
    input_data={...},
    output_data={...},
    success_score=0.95,
    execution_time_ms=1500
)
result = await bridge.store_agent_execution(execution)

# Get recommendations
recs = await bridge.get_agent_recommendations('Fix trading system bugs')
```

## How the System Works

### Data Collection Flow

```
1. Agent executes task
   ↓
2. Execution stored in database
   - Task description, success score, execution time
   - Tools used, approach taken
   - Input/output data
   ↓
3. Triggers update to agent stats
   - Success rate, avg execution time
   - Total tasks completed
   ↓
4. Data available for training
```

### Learning Pipeline Flow

```
1. Training script runs (daily or manual)
   ↓
2. Analyzes agent executions
   - Identifies success patterns
   - Discovers tool usage patterns
   - Extracts workflow patterns
   - Finds error resolution patterns
   ↓
3. Generates insights per agent
   - Top recommendations
   - Relevant patterns
   - Performance metrics
   ↓
4. Saves to training_results.json
   ↓
5. Session hooks display insights
   ↓
6. Claude Code uses recommendations
```

## Current Status

### ✅ COMPLETED

1. **Schema Fixes** - `agent_memory_bridge.py` now matches D: database schema
2. **Agent Registration** - All 6 specialist agents registered in database
3. **Training Script** - Fully functional, tested on real data
4. **Enhanced Hooks** - Available (optional upgrade)
5. **Database Integration** - Bridge connects memory system to agent database

### ⚠️ NEEDS MANUAL SETUP

**Windows Task Scheduler** (for automated daily training):

1. Open Task Scheduler (taskschd.msc)
2. Click "Create Basic Task"
3. Name: "Claude-AgentTraining"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
   - Program: `C:\Python313\python.exe` (or your Python path)
   - Arguments: `train_agents.py --hours 168 --quiet`
   - Start in: `C:\dev\projects\active\web-apps\memory-bank`
6. Finish

OR use the PowerShell script (needs admin rights):
```powershell
# Run as Administrator
.\setup_training_schedule.ps1
```

## Usage Examples

### Example 1: Manual Training Run

```powershell
cd C:\dev\projects\active\web-apps\memory-bank

# Train on last week's data
python train_agents.py --hours 168

# Check results
cat training_summary.txt

# View full data
cat training_results.json | jq .
```

### Example 2: Check Agent Performance

```powershell
sqlite3 D:\databases\database.db

# Top performing agents
SELECT name, total_tasks, success_rate, avg_execution_time
FROM agent_registry
WHERE total_tasks > 0
ORDER BY success_rate DESC
LIMIT 10;

# Recent executions for crypto-expert
SELECT task_description, success_score, executed_at
FROM agent_executions ae
JOIN agent_registry ar ON ae.agent_id = ar.id
WHERE ar.name = 'crypto-expert'
ORDER BY executed_at DESC
LIMIT 5;
```

### Example 3: Get Agent Recommendation

```powershell
# Quick recommendation via Python script
python get_agent_recommendation.py "Fix React component rendering bug"

# Returns JSON like:
# {"agent": "webapp-expert", "confidence": 0.85, "reason": "Successful with similar tasks"}
```

## Maintenance

### Daily (Automated)
- Training script runs at 2 AM
- Analyzes last 7 days of data
- Updates training_results.json

### Weekly (Manual)
```powershell
# Review training summary
cat C:\dev\projects\active\web-apps\memory-bank\training_summary.txt

# Check for new patterns
python train_agents.py --hours 168
```

### Monthly (Manual)
```powershell
# Full analysis of all data
python train_agents.py --all

# Check database size
Get-Item D:\databases\database.db | Select Length
```

## Troubleshooting

### Issue: Training script fails
```powershell
# Check Python dependencies
cd C:\dev\projects\active\web-apps\memory-bank
pip install -r requirements.txt

# Check database connectivity
sqlite3 D:\databases\database.db "SELECT COUNT(*) FROM agent_executions;"
```

### Issue: No recommendations showing
```powershell
# Run training to generate recommendations
python train_agents.py --hours 168

# Verify training_results.json exists
Test-Path C:\dev\projects\active\web-apps\memory-bank\training_results.json

# Check file contents
cat training_results.json | jq .agent_insights
```

### Issue: Hook not showing insights
```powershell
# Verify hook is using enhanced version
cat .claude\hooks\session-start.ps1 | Select-String "LEARNING INSIGHTS"

# Check training results file
cat C:\dev\projects\active\web-apps\memory-bank\training_results.json
```

## Next Steps

To fully activate the learning system:

1. **Run initial training** on all 57k+ executions:
   ```powershell
   python train_agents.py --all
   ```

2. **Setup automated training** (Task Scheduler - see above)

3. **(Optional) Upgrade hooks** to enhanced version:
   ```powershell
   Copy-Item session-start-enhanced.ps1 .claude\hooks\session-start.ps1
   ```

4. **Start using specialist agents** - They'll now have learned from 57k+ executions!

## Files Created

```
C:\dev\projects\active\web-apps\memory-bank\
├── agent_memory_bridge.py (UPDATED - schema fixes)
├── register_specialist_agents.py (NEW)
├── test_agent_bridge.py (NEW)
├── train_agents.py (NEW - main training script)
├── get_agent_recommendation.py (NEW)
├── setup_training_schedule.ps1 (NEW)
├── session-start-enhanced.ps1 (NEW)
├── training_results.json (created after training)
├── training_summary.txt (created after training)
├── training.log (created after training)
└── AGENT_SYSTEM_GUIDE.md (THIS FILE)

C:\dev\.claude\hooks\
└── session-start.ps1 (ORIGINAL - still works)
```

## Summary

You now have:
- ✅ Unified agent system (old + new agents in one database)
- ✅ Working training pipeline (analyzes 57k+ executions)
- ✅ Schema-fixed bridge (memory ↔ database)
- ✅ Enhanced hooks (optional - shows learning insights)
- ⚠️ Manual task scheduler setup needed (5 minutes)

**The system is ready to use!** Run `python train_agents.py --all` to train on all existing data and start seeing recommendations.
