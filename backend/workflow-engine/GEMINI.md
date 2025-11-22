# Workflow Engine - Service Context

The central nervous system for the Nova/Vibe ecosystem. It orchestrates complex, multi-step tasks that span across different applications and agents.

## Core Functions
- **State Management**: Tracks the progress of long-running workflows.
- **Orchestration**: Delegates sub-tasks to `nova-agent`, `vibe-code-studio`, or `desktop-commander-v3`.
- **Decision Making**: Uses LLMs to determine the next step in a workflow based on current state and feedback.

## Integration with Desktop Commander V3
- The engine can issue direct system commands via the `desktop-commander-v3` MCP.
- **Use Case**: "Open the project folder in Explorer", "Launch Docker Desktop", "Arrange windows for coding mode".
- **Mechanism**: Sends `command_request` { target: 'desktop-commander-v3' } via the IPC Bridge.

## Learning System
- Integrates with the shared Learning Database (on D:\) to adapt workflows based on past successes/failures.
