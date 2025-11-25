# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Desktop Commander is a Tauri v2-based desktop application for managing monorepo services with real-time monitoring, log tailing, and trading bot metrics. Built with React 18, TypeScript, shadcn/ui, and a Rust backend.

## Key Commands

### Development
```bash
npm run tauri:dev      # Start Tauri dev mode (Vite on port 1420 + Rust backend)
npm run dev            # Start Vite dev server only (no Tauri)
npm run build          # Build frontend (TypeScript + Vite)
```

### Quality Checks
```bash
npm run quality        # Run lint + typecheck + build
npm run lint           # ESLint check
npm run typecheck      # TypeScript compilation check
```

### Production Build
```bash
npm run tauri:build    # Build standalone executable + installer
                       # Output: src-tauri/target/release/desktop-commander.exe
                       # Installer: src-tauri/target/release/bundle/msi/
```

### Rust Backend
```bash
cd src-tauri
cargo build            # Build Rust backend only
cargo clean            # Clean Rust build artifacts (use when compilation fails)
```

## Architecture

### Frontend (React + TypeScript)
- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Main Component**: `src/components/Dashboard.tsx` (Tabs container)
- **Service Management**: `src/components/ServiceCard.tsx` (Start/Stop/Restart services)
- **Log Viewer**: `src/components/LogViewer.tsx` (Real-time log tailing)
- **Trading Metrics**: `src/components/TradingMetrics.tsx` (SQLite-based metrics from trading.db)
- **UI Components**: `src/components/ui/` (shadcn/ui Radix primitives)
- **Tauri Bindings**: `src/lib/tauri.ts` (TypeScript wrappers for Rust commands)

### Backend (Rust + Tauri)
- **Core File**: `src-tauri/src/main.rs` (~650 lines, all Tauri commands)
- **Configuration**: `src-tauri/tauri.conf.json` (Tauri v2 settings)
- **Build Script**: `src-tauri/build.rs` (Windows resource compilation)

**Key Rust Components**:
- `AppState`: Monorepo path, service configs, process tracker
- `ProcessTracker`: Tracks PIDs, uptimes, health checks, restart counts
- `ServiceConfig`: Name, command, working_dir, port, health_check_url, dependencies, auto_restart
- `ServiceStatus`: Runtime status (running/stopped/error), PID, port, uptime, CPU/memory usage

### Tauri Commands (Rust → TypeScript IPC)
Available commands exposed to frontend via `window.__TAURI__.invoke()`:

**Service Management**:
- `get_service_status(service_name)` - Get status of single service
- `get_all_services_status()` - Get all service statuses
- `start_service(service_name)` - Start service in new PowerShell window
- `stop_service(service_name)` - Kill service process
- `restart_service(service_name)` - Stop then start
- `start_all_services()` - Start all services respecting dependencies
- `stop_all_services()` - Stop all services
- `check_service_health(service_name)` - HTTP health check or TCP port check
- `toggle_auto_restart(service_name, enabled)` - Enable/disable auto-restart

**Logging**:
- `get_tail_logs(service_name, lines)` - Tail last N lines from log file
- `clear_logs(service_name)` - Clear log file

**Trading Bot**:
- `get_trading_metrics()` - Query trading.db for balance, P/L, win rate, etc.
- `get_trading_bot_status()` - Get trading bot specific status

## Service Configuration

### Adding/Modifying Services

Edit `src-tauri/src/main.rs` in `AppState::new()` function (lines 85-139):

```rust
services.insert(
    "my-service".to_string(),
    ServiceConfig {
        name: "my-service".to_string(),
        command: "npm run dev".to_string(),  // Command to execute
        working_dir: monorepo_path.join("my-service"),  // Working directory
        port: Some(8080),  // Optional port for health checks
        health_check_url: Some("http://localhost:8080/health".to_string()),  // Optional HTTP health check
        dependencies: vec!["backend".to_string()],  // Services to start first
        auto_restart: false,  // Auto-restart on crash
    },
);
```

### Default Services

**desktop-commander-vite**: Example service - the Vite dev server for this app on port 1420

To add your own services, edit `src-tauri/src/main.rs` in the `AppState::new()` function following the example pattern.

### Monorepo Path Configuration

Default: `C:\dev`

To change, edit `src-tauri/src/main.rs` line 87:
```rust
let monorepo_path = PathBuf::from("C:\\dev");  // Change this path
```

### Log File Paths

Configure in `get_tail_logs()` function (lines 560-580):
```rust
let log_path = match service_name.as_str() {
    "trading-bot" => state.monorepo_path
        .join("projects")
        .join("crypto-enhanced")
        .join("trading_new.log"),
    "web-app" => state.monorepo_path.join("web-app.log"),
    "backend" => state.monorepo_path.join("backend").join("backend.log"),
    _ => return Err(format!("Unknown service: {}", service_name)),
};
```

## Process Management Details

### Service Lifecycle
1. **Start**: Spawns PowerShell process via `Command::new("powershell")` with `/K` flag (keeps window open)
2. **Track**: Stores PID in `ProcessTracker` with start time
3. **Monitor**: Uses `sysinfo` crate to check process existence, CPU, memory
4. **Health Check**: TCP port connection or HTTP GET to health_check_url
5. **Stop**: Calls `taskkill /PID <pid> /F` via PowerShell

### Process Detection
- If PID tracked → use tracked PID
- If no PID → search by port number in process command lines
- Uses `sysinfo::System` to enumerate all processes

### Auto-Restart
- Monitored in background thread (not yet implemented in current codebase)
- Configured per-service via `auto_restart` boolean
- Tracked via `restart_count` in `ProcessInfo`

## Trading Bot Integration

### Database Schema
Reads from `projects/crypto-enhanced/trading.db`:

**Queries in `get_trading_metrics()`**:
- Balance: `SELECT balance FROM account_balance ORDER BY timestamp DESC LIMIT 1`
- Total trades: `SELECT COUNT(*) FROM trades`
- Win rate: `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM trades) FROM trades WHERE profit_loss > 0`
- P/L: `SELECT SUM(profit_loss) FROM trades`
- Last trade: `SELECT MAX(exit_time) FROM trades`
- Active position: `SELECT COUNT(*) FROM positions WHERE status = 'open'`

### Trading Bot Status
- Reads service status from process tracker
- Shows circuit breaker status, last heartbeat
- Warns if active positions exist

## Tech Stack Details

### Frontend Dependencies
- **React 18.2** + **TypeScript 5.3**
- **Vite 5.1** (dev server + bundler)
- **Tauri API 2.0** (`@tauri-apps/api`)
- **shadcn/ui**: Radix UI primitives (Dialog, Dropdown, ScrollArea, Select, Slot, Switch, Tabs)
- **Tailwind CSS 3.4** + tailwindcss-animate
- **Framer Motion 11** (animations)
- **Lucide React** (icons)

### Backend Dependencies (Rust)
- **Tauri 2.0** (desktop app framework)
- **sysinfo** (process monitoring, CPU/memory usage)
- **rusqlite** (SQLite queries for trading.db)
- **reqwest** (HTTP health checks)
- **serde/serde_json** (serialization)
- **tokio** (async runtime)

### Build Tools
- **ESLint 8** + TypeScript ESLint plugin
- **PostCSS 8** + Autoprefixer
- **TypeScript 5.3**
- **Cargo/Rustup** (Rust toolchain)

## Development Workflow

### First-Time Setup
```bash
# Ensure Rust is installed
winget install Rustlang.Rust.MSVC

# Install dependencies
npm install

# First run (may take 2-3 min for Rust compilation)
npm run tauri:dev
```

### Hot Reload Behavior
- **Frontend changes**: Auto hot-reload via Vite
- **Rust changes**: Requires full restart (`npm run tauri:dev`)
- **Service config changes**: Requires full restart

### Debugging
- **Frontend**: Chrome DevTools (F12 in app window)
- **Backend**: Terminal output from `npm run tauri:dev`
- **Test commands**: Browser console `await window.__TAURI__.invoke('get_all_services_status')`

### Common Issues

**Port 1420 already in use**:
```powershell
Get-NetTCPConnection -LocalPort 1420 | Select-Object OwningProcess
Stop-Process -Id <PID>
```

**Rust compilation errors**:
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

**Service won't start**:
- Verify working directory exists
- Test command manually in PowerShell
- Check for port conflicts

**Trading metrics show zeros**:
- Ensure `projects/crypto-enhanced/trading.db` exists
- Verify database has `trades` table
- Check file permissions

## Tauri V2 Specific Notes

### Migration from Tauri V1
- Uses `@tauri-apps/api` v2.0 and `@tauri-apps/cli` v2.0
- No `tauri.allowlist` in config (V2 uses capability-based security)
- Command syntax unchanged: `#[tauri::command]` macro still works
- Window configuration now in `app.windows` array

### Window Configuration
- Default size: 1400x900
- Minimum size: 1000x600
- Resizable, not fullscreen
- CSP disabled (`"csp": null`) for development

### Build Configuration
```json
{
  "beforeDevCommand": "npm run dev",      // Runs before dev mode
  "beforeBuildCommand": "npm run build",  // Runs before production build
  "devUrl": "http://localhost:1420",      // Vite dev server
  "frontendDist": "../dist"               // Production build output
}
```

## File Structure Summary

```
desktop-commander/
├── src/                           # React frontend
│   ├── components/
│   │   ├── Dashboard.tsx          # Main tab container
│   │   ├── ServiceCard.tsx        # Service control UI
│   │   ├── LogViewer.tsx          # Log tailing UI
│   │   ├── TradingMetrics.tsx     # Trading bot metrics
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/
│   │   ├── tauri.ts               # Tauri command wrappers
│   │   └── utils.ts               # Utility functions
│   ├── App.tsx                    # Root component
│   └── main.tsx                   # Entry point
├── src-tauri/                     # Rust backend
│   ├── src/
│   │   └── main.rs                # All Tauri commands (~650 lines)
│   ├── Cargo.toml                 # Rust dependencies
│   ├── tauri.conf.json            # Tauri V2 configuration
│   └── build.rs                   # Build script
├── package.json                   # Node dependencies + scripts
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
└── tsconfig.json                  # TypeScript config
```

## Important Implementation Details

### PowerShell Integration
Services are started via:
```rust
Command::new("powershell")
    .args(&["/K", "cd", working_dir, "&&", command])
    .creation_flags(CREATE_NEW_CONSOLE)  // Windows-specific flag
    .spawn()
```

This creates a new console window that stays open (`/K` flag) so users can see output and interact with services directly.

### Process Tracking Strategy
1. Store PID when service starts
2. Use `sysinfo` to verify process still exists
3. Calculate uptime from start_time
4. Collect CPU/memory stats
5. If process not found by PID, search by command/port

### Health Check Strategy
1. If `health_check_url` configured → HTTP GET request
2. Else if `port` configured → TCP connection test
3. Else → "unknown" status
4. Updates `ProcessTracker` health status

### Log Tailing Implementation
- Reads log file from configured path
- Returns last N lines (default: 100)
- Parses timestamp, level, message from each line
- Frontend polls every 2-3 seconds for updates

## Testing Approach

### Manual Testing Checklist
1. Services tab → Start service → verify PowerShell window opens
2. Services tab → Check status changes to "running"
3. Services tab → Stop service → verify process terminates
4. Logs tab → Select service → verify logs appear
5. Trading tab → Verify metrics load from trading.db

### Testing Individual Commands
```javascript
// In browser DevTools console
await window.__TAURI__.invoke('get_all_services_status')
await window.__TAURI__.invoke('start_service', { serviceName: 'web-app' })
await window.__TAURI__.invoke('get_trading_metrics')
```
