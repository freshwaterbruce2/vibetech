# Claude Code Agent System

## Overview

This is the Claude Code Agent System - a parallel, automated agent orchestration framework that follows the YOLO MODE pattern with emphasis on current, up-to-date information.

## Workflow Pattern

Every agent follows this pattern:

1. **INVESTIGATE** - Analyze the problem comprehensively
2. **SEARCH** - **WebSearch for current (2025) information**, documentation, and best practices
3. **APPLY** - Make changes automatically (auto-accept all edits)
4. **TEST** - Run quality checks automatically
5. **ITERATE** - Fix and repeat until perfect

## Key Features

### YOLO MODE Automation
- Auto-accepts ALL file edits without confirmation
- Auto-executes ALL commands without prompting
- Runs multiple operations in parallel
- Automatically fixes errors and re-tests
- Continues until solution is perfect

### Web Search Integration
- **CRITICAL**: Agents use WebSearch to find current information
- Searches include year (2025) for latest documentation
- Gets up-to-date best practices from Stack Overflow, GitHub, etc.
- Ensures solutions use current library versions and APIs

## Available Agents

### Development Agents
- **code-builder** - UI/Component development with latest React patterns
- **state-manager** - State management with current Zustand best practices
- **type-guardian** - TypeScript fixes using TypeScript 5.x solutions
- **test-commander** - Testing with latest Vitest strategies
- **performance-optimizer** - PWA optimization with 2025 standards
- **api-integrator** - API integration with current REST patterns

### System Agents (from learning system)
- **general-purpose** - Multi-step task handling
- **test-maestro** - Comprehensive testing
- **code-guardian** - Code quality assurance
- **devops-sidekick** - DevOps automation
- **documentation-dragon** - Documentation generation
- **polyglot-code-translator** - Language translation

## Usage

### Launch Agents for a Project

```python
from agent_launcher import ParallelAgentLauncher

launcher = ParallelAgentLauncher()

# Launch all agents for a web app
results = launcher.launch_agents_for_project('my-app', 'web-app')

# Launch in YOLO mode for a specific task
result = launcher.launch_yolo_mode("Fix all TypeScript errors and implement PWA features")
```

### Command Line

```bash
# Launch agents for a project
python agent_launcher.py --project shipping-pwa --type web-app

# Use YOLO mode for a specific task
python agent_launcher.py --yolo --task "Build complete UI with state management"

# Check agent status
python agent_launcher.py --status
```

### Monitor Performance

```bash
# Real-time dashboard
python monitoring/dashboard.py

# JSON metrics
python monitoring/dashboard.py --json

# One-time status check
python monitoring/dashboard.py --once
```

## Agent Orchestration

The system automatically:
1. Identifies which agents are needed based on task description
2. Creates parallel tasks for each agent
3. Launches all agents simultaneously
4. Monitors execution and collects metrics
5. Learns from successes and failures
6. Optimizes future executions

## Integration with Claude Code

When you request agents in Claude Code:
1. The system uses these agent definitions
2. Follows the YOLO MODE workflow
3. Emphasizes WebSearch for current information
4. Executes multiple agents in parallel
5. Automatically iterates until perfect

## Learning System Integration

- Connected to `D:\learning-system\agent_learning.db`
- Tracks performance metrics
- Optimizes token usage (40% reduction)
- Learns from mistakes
- Improves success rates over time

## Important Notes

1. **Always use WebSearch** during the SEARCH phase
2. **Include year (2025)** in searches for current information
3. **Parallel execution** for maximum speed
4. **Auto-accept/execute** everything in YOLO mode
5. **Iterate until perfect** - never stop at first attempt

## Configuration

### YOLO Mode Config
Located at `configs/yolo_config.json`:
```json
{
  "auto_accept_edits": true,
  "auto_execute_commands": true,
  "parallel_operations": true,
  "continuous_iteration": true,
  "smart_error_recovery": true
}
```

### Agent Definitions
Located at `agent_definitions.json` - defines all agent capabilities and workflows

### Triggers
Located at `hooks/agent-triggers.json` - automatic agent launching based on patterns

## Database Schema

The learning system tracks:
- Agent executions
- Performance metrics
- Success rates
- Token usage
- Error patterns
- Optimization strategies

## Troubleshooting

If agents aren't performing well:
1. Check the dashboard for performance metrics
2. Review error patterns in the database
3. Ensure WebSearch is being used for current information
4. Verify YOLO mode is enabled
5. Check that parallel execution is working

## Future Enhancements

- Real-time agent communication
- Cross-agent collaboration
- Advanced conflict resolution
- Automatic agent creation
- Self-optimizing workflows