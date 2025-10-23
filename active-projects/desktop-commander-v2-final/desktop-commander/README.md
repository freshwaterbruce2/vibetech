# Desktop Commander

A Tauri-based desktop application for managing your C:\dev monorepo services with real-time monitoring, log tailing, and trading bot metrics.

## Features

✅ **Visual Service Status Indicators** - See all your services at a glance
✅ **One-Click Start/Stop/Restart** - Control all services from one dashboard  
✅ **Real-Time Log Tailing** - Monitor logs from all services live
✅ **Trading Bot Metrics** - Live display of your crypto trading bot performance
✅ **Built with Your Stack** - React 18 + TypeScript + shadcn/ui + Tailwind

## Prerequisites

- Node.js (v18+)
- Rust (for Tauri)
- Windows 11 with PowerShell

## Installation

1. **Install Rust** (if not already installed):
```powershell
winget install Rustlang.Rust.MSVC
```

2. **Install Dependencies**:
```bash
cd C:\dev\desktop-commander
npm install
```

3. **Configure Monorepo Path** (if different from C:\dev):
Edit `src-tauri/src/main.rs` and update the `monorepo_path`:
```rust
let monorepo_path = PathBuf::from("C:\\your\\path");
```

## Development

Run in development mode:
```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server on port 1420
- Launch the Tauri application
- Enable hot-reload for frontend changes

## Building

Create a production build:
```bash
npm run tauri:build
```

The built application will be in `src-tauri/target/release/`.

## Configuration

### Adding/Modifying Services

Edit `src-tauri/src/main.rs` in the `AppState::new()` function:

```rust
services.insert(
    "my-service".to_string(),
    ServiceConfig {
        name: "my-service".to_string(),
        command: "npm start".to_string(),
        working_dir: monorepo_path.join("my-service"),
        port: Some(8080),
    },
);
```

### Monitored Services (Default)

1. **web-app** - React app on port 5173
2. **backend** - Express backend on port 3000
3. **trading-bot** - Python crypto trading bot (projects/crypto-enhanced)

## Usage

### Services Tab
- View all services with status indicators (Running/Stopped/Error)
- See PID, uptime, and port information
- Start/Stop/Restart services with one click

### Logs Tab
- Select a service to view its logs
- Real-time log streaming
- Export logs to file
- Clear log history

### Trading Tab
- Live trading bot status
- Current balance and P/L
- Total trades and win rate
- Active position indicator
- Circuit breaker status

## Architecture

```
Frontend (React + TypeScript)
├── Service Management UI
├── Log Viewer Component
└── Trading Metrics Dashboard

Backend (Tauri + Rust)
├── PowerShell Integration
├── Process Management (sysinfo)
├── SQLite Queries (trading.db)
└── Log File Monitoring
```

## Database Schema

The trading bot metrics are read from `projects/crypto-enhanced/trading.db`:

- **trades** table - All trade records with entry/exit times, P/L
- Queries calculate: total trades, win rate, profit/loss, active positions

## Troubleshooting

### Service Won't Start
- Check that the working directory exists
- Verify the command is correct for your setup
- Ensure no other process is using the port

### Logs Not Appearing
- Verify log file paths in `main.rs`
- Check that services are writing to expected log files
- Default trading bot log: `projects/crypto-enhanced/trading_new.log`

### Trading Metrics Not Loading
- Ensure `trading.db` exists in `projects/crypto-enhanced/`
- Check database file permissions
- Verify the bot has created the tables

## Development Tips

### Hot Reload
Frontend changes hot-reload automatically. For backend changes:
1. Stop the Tauri dev server
2. Run `npm run tauri:dev` again

### Testing Commands
Test Tauri commands from the browser console:
```javascript
await window.__TAURI__.invoke('get_all_services_status')
```

### Debugging
- Frontend: Chrome DevTools (F12 in the app)
- Backend: Check terminal output for Rust logs

## Quality Checks

Before committing:
```bash
npm run quality
```

This runs:
- ESLint
- TypeScript type checking
- Vite build verification

## Project Structure

```
desktop-commander/
├── src/                      # React frontend
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── ServiceCard.tsx
│   │   ├── LogViewer.tsx
│   │   ├── TradingMetrics.tsx
│   │   └── Dashboard.tsx
│   ├── lib/
│   │   ├── tauri.ts         # Tauri API wrappers
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/               # Rust backend
│   ├── src/
│   │   └── main.rs          # All Tauri commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Rust, Tauri 1.5, sysinfo, rusqlite
- **IPC**: Tauri commands and events
- **Process Management**: PowerShell integration
- **Database**: SQLite via rusqlite

## Future Enhancements

- [ ] System tray integration
- [ ] Global hotkeys
- [ ] Service health checks
- [ ] Alert notifications
- [ ] Chart visualizations for trading metrics
- [ ] Log search and filtering
- [ ] Service dependency management
- [ ] Auto-restart on crash

## License

MIT

## Support

For issues or questions about this tool, check the logs in the Logs tab or open a GitHub issue.
