# Monorepo Parallel Execution System

## Overview

The Monorepo Parallel Execution System enables you to run multiple projects simultaneously with intelligent resource management, monitoring, and automatic restart capabilities. Built on your existing sophisticated infrastructure, it provides production-grade orchestration for all projects in the monorepo.

## Quick Start

### Option 1: Using the Launcher (Easiest)
```batch
# Double-click Start-Parallel-Dev.bat in Windows Explorer
# Or run from command line:
Start-Parallel-Dev.bat
```

### Option 2: Using NPM Commands
```bash
# Start default development environment (root + crypto + vibe)
npm run parallel:dev

# Start with file watching and auto-restart
npm run parallel:watch

# Start with monitoring dashboard
npm run parallel:dashboard

# Check status of running projects
npm run parallel:status

# Stop all parallel projects
npm run parallel:stop
```

### Option 3: Using PowerShell Directly
```powershell
# Start with specific group
.\scripts\Start-ParallelMonorepo.ps1 -Group dev

# Start specific projects
.\scripts\Start-ParallelMonorepo.ps1 -Projects @("root", "crypto", "memory-bank")

# Start with options
.\scripts\Start-ParallelMonorepo.ps1 -Group full-stack -Watch -Dashboard
```

## Available Project Groups

### 1. **dev** (Default)
- Root web application (port 5173)
- Crypto trading system (port 8000)
- Vibe-Tech Lovable (ports 8080, 9001)

### 2. **full-stack**
- Root web application (port 5173)
- Backend services (port 3001)
- Memory bank system (port 8765)

### 3. **trading**
- Crypto enhanced trading system
- Memory bank monitoring
- Real-time performance tracking

### 4. **desktop**
- Nova Agent (port 3000)
- Other Tauri applications

### 5. **web-apps**
- Hotel booking platform (port 5174)
- Shipping PWA (port 5175)
- Vibe-Tech Lovable

### 6. **testing**
- All projects in test mode
- Automated test execution
- Quality checks

## Features

### Intelligent Port Management
- Automatic port availability checking
- Predefined port allocation per project
- Conflict resolution and warnings

### Process Orchestration
- Dependency-aware startup sequences
- Graceful shutdown handling
- Automatic restart on failure
- Health monitoring (30-second intervals)

### Memory Integration
- Context capture for each session
- Learning from past execution patterns
- Performance optimization over time
- Session state persistence

### Monitoring & Logging
- Real-time log aggregation
- WebSocket-based monitoring dashboard
- Performance metrics collection
- Alert thresholds and escalation

### File Watching
- Automatic restart on file changes
- Debounced change detection
- Project-specific watch patterns
- Integrated quality checks

## Configuration

### workspace.json
The main configuration file defines:
- Project definitions and ports
- Group configurations
- Parallel execution settings
- Monitoring parameters

### Project Groups
Edit `workspace.json` to customize groups:
```json
"groups": {
  "custom-group": {
    "description": "My custom project group",
    "projects": ["root", "crypto", "memory-bank"],
    "dependencies": {}
  }
}
```

### Port Allocation
Default ports are predefined in `workspace.json`:
```json
"workspaces": {
  "root": { "port": 5173 },
  "crypto-enhanced": { "port": 8000 },
  "memory-bank": { "port": 8765 }
}
```

## Commands Reference

### Workspace Manager Commands
```powershell
# Show workspace status
.\scripts\workspace-manager.ps1 -Action status

# Start parallel environment
.\scripts\workspace-manager.ps1 -Action parallel -ProjectGroup @("dev")

# Show parallel status
.\scripts\workspace-manager.ps1 -Action status -Parallel
```

### NPM Scripts
```bash
npm run parallel           # Start default group
npm run parallel:dev       # Development group
npm run parallel:full-stack # Full-stack group
npm run parallel:trading   # Trading group
npm run parallel:desktop   # Desktop apps
npm run parallel:web-apps  # Web applications
npm run parallel:test      # Testing mode
npm run parallel:watch     # With file watching
npm run parallel:dashboard # With monitoring
npm run parallel:status    # Show status
npm run parallel:stop      # Stop all
```

### PowerShell Functions
After sourcing workspace-manager.ps1:
```powershell
Start-ParallelEnvironment   # Start projects
Show-ParallelStatus        # View status
Watch-ParallelLogs -All    # Monitor logs
Stop-ParallelEnvironment   # Stop all
```

## Monitoring

### Dashboard Access
When started with `-Dashboard` flag:
- WebSocket monitoring: http://localhost:8765
- Real-time metrics and logs
- Performance visualization
- Alert notifications

### Log Locations
- Orchestrator logs: `logs/parallel/orchestrator-[date].log`
- Project logs: Standard output captured in PowerShell jobs
- Memory bank logs: `projects/active/web-apps/memory-bank/logs/`
- Trading logs: `projects/crypto-enhanced/logs/`

### Health Checks
Automatic health monitoring includes:
- Process state verification
- Port availability checks
- Error rate monitoring
- Resource usage tracking

## Troubleshooting

### Common Issues

#### Port Already in Use
```powershell
# Check what's using a port
Get-NetTCPConnection -LocalPort 5173

# Kill process using port
Stop-Process -Id [PID] -Force
```

#### Project Won't Start
1. Check dependencies are installed:
   ```bash
   npm run workspace:install
   ```
2. Verify virtual environments (Python projects):
   ```bash
   cd projects/crypto-enhanced
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```

#### Jobs Not Visible
```powershell
# List all background jobs
Get-Job

# Remove failed jobs
Remove-Job -State Failed
```

### Reset Everything
```powershell
# Stop all projects
npm run parallel:stop

# Clean workspace
npm run workspace:clean

# Reinstall dependencies
npm run workspace:install
```

## Advanced Usage

### Custom Project Combinations
```powershell
# Start specific projects
.\scripts\Start-ParallelMonorepo.ps1 -Projects @("root", "crypto", "nova-agent")

# With options
.\scripts\Start-ParallelMonorepo.ps1 `
  -Projects @("root", "memory-bank") `
  -Watch `
  -Dashboard `
  -LogLevel Verbose
```

### Integration with Hooks
The system integrates with `.claude/hooks/` for:
- Session start automation
- Context capture
- Agent triggers
- Performance monitoring

### Memory Bank Integration
When enabled, the system:
- Stores execution patterns
- Learns optimal configurations
- Triggers automated responses
- Maintains session history

## Best Practices

1. **Start Small**: Begin with the `dev` group before running larger combinations
2. **Monitor Resources**: Use Task Manager to check CPU/memory usage
3. **Use Logging**: Enable verbose logging for debugging
4. **Regular Cleanup**: Run `npm run workspace:clean` periodically
5. **Check Health**: Use `npm run monorepo:health` before parallel execution

## System Requirements

- **PowerShell**: Version 5.1 or higher
- **Node.js**: Version 18+ for web projects
- **Python**: Version 3.8+ for Python projects
- **Memory**: 8GB minimum, 16GB recommended for full parallel execution
- **Ports**: Ensure ports 3000-9999 range is available

## Architecture

The parallel execution system leverages:
- **workspace-manager.ps1**: Central orchestration logic
- **Start-ParallelMonorepo.ps1**: Advanced orchestration with monitoring
- **auto-watch.ps1**: File watching and auto-restart
- **Enhanced hooks**: Memory integration and automation
- **workspace.json**: Configuration and project definitions

## Future Enhancements

Planned improvements include:
- Docker containerization for better isolation
- Kubernetes orchestration for cloud deployment
- GraphQL API for remote management
- Web-based control panel
- Automated scaling based on load

## Support

For issues or questions:
1. Check logs in `logs/parallel/`
2. Review this documentation
3. Run health checks: `npm run monorepo:health`
4. Check existing GitHub issues

## License

Part of the vibe-tech-lovable monorepo. All rights reserved.