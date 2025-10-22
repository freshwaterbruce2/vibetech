# Desktop Commander - Quick Start Guide

## Installation (5 minutes)

1. **Copy to your monorepo**:
   ```powershell
   # Copy the desktop-commander folder to C:\dev\
   ```

2. **Run setup**:
   ```powershell
   cd C:\dev\desktop-commander
   .\setup.ps1
   ```

3. **Start development mode**:
   ```powershell
   npm run tauri:dev
   ```

## First Use

When you launch Desktop Commander, you'll see three main tabs:

### 📊 Services Tab
Your command center for all services:

- **Green Badge** = Service is running
- **Gray Badge** = Service is stopped
- **Red Badge** = Service has an error

**One-Click Actions**:
- **Start** - Launches the service in a new PowerShell window
- **Stop** - Kills the service process
- **Restart** - Stop + Start

**Service Info**:
- PID (Process ID)
- Uptime
- Port number

### 📝 Logs Tab
Real-time log monitoring:

1. **Select a service** from the buttons at the top
2. **View logs** in real-time as they're generated
3. **Export logs** to a file for debugging
4. **Clear logs** to start fresh

**Log Levels**:
- 🔴 ERROR/CRITICAL - Red badge
- 🟡 WARNING - Yellow badge
- 🔵 INFO - Blue badge
- ⚪ DEBUG - Gray badge

### 📈 Trading Tab
Live crypto trading bot metrics:

**Bot Status Card**:
- LIVE/OFFLINE indicator
- Circuit breaker status
- Last heartbeat time
- Active position warning

**Metrics Cards**:
- 💰 **Balance** - Current account balance ($98.82)
- 📊 **P/L** - Profit/Loss (green = profit, red = loss)
- 🎯 **Total Trades** - Number of trades executed
- 📈 **Win Rate** - Percentage of winning trades
- ⏰ **Last Trade** - Timestamp of most recent trade

## Configuration

### Adding a New Service

1. Open `src-tauri/src/main.rs`
2. Find the `AppState::new()` function
3. Add your service:

```rust
services.insert(
    "my-api".to_string(),
    ServiceConfig {
        name: "my-api".to_string(),
        command: "npm start".to_string(),
        working_dir: monorepo_path.join("my-api"),
        port: Some(4000),  // Optional
    },
);
```

4. Restart the app

### Changing the Monorepo Path

If your monorepo is not at `C:\dev`:

1. Edit `src-tauri/src/main.rs`
2. Update line ~39:
   ```rust
   let monorepo_path = PathBuf::from("D:\\your\\path");
   ```
3. Rebuild the app

### Customizing Log Paths

Edit the `get_tail_logs` function in `src-tauri/src/main.rs`:

```rust
let log_path = match service_name.as_str() {
    "my-service" => state.monorepo_path.join("my-service").join("app.log"),
    // ... other services
};
```

## Tips & Tricks

### Keyboard Shortcuts
- `F5` - Refresh all service statuses
- `F12` - Open DevTools for debugging

### PowerShell Integration
Services are started in separate PowerShell windows, so you can:
- See their console output
- Interact with them directly
- Close the window to stop the service

### Trading Bot Monitoring
The metrics refresh every 5 seconds automatically. Watch for:
- Circuit breaker status changing
- Active position warnings
- Win rate trending

### Log Management
- Logs auto-scroll by default
- Export before clearing to keep history
- Use log search (coming soon) to find specific events

## Common Workflows

### Starting Your Dev Environment
1. Open Desktop Commander
2. Go to Services tab
3. Click Start on: web-app, backend, trading-bot
4. Switch to Logs tab to monitor startup

### Debugging a Service Issue
1. Services tab - Check service status
2. Logs tab - View error messages
3. Export logs for detailed analysis
4. Restart the service

### Monitoring Trading Bot
1. Trading tab - Check bot is LIVE
2. Verify circuit breaker is NORMAL
3. Monitor P/L trending
4. Check for active positions before shutting down

### Daily Shutdown
1. Services tab
2. Stop all services (web-app, backend)
3. Trading tab - Verify no active positions
4. Stop trading-bot last

## Troubleshooting

### Service Won't Start
- Check the PowerShell window for errors
- Verify the command path is correct
- Ensure no port conflicts

### Logs Not Showing
- Verify the log file path exists
- Check service is actually writing logs
- Try clearing and refreshing

### Trading Metrics Show Zero
- Ensure trading.db exists in projects/crypto-enhanced/
- Check bot has executed at least one trade
- Verify database permissions

### App Won't Launch
- Run: `npm run tauri:dev` to see errors
- Check Rust is installed: `cargo --version`
- Verify Node.js version: `node --version`

## Building for Production

Create a standalone executable:

```powershell
npm run tauri:build
```

Find the installer in:
```
src-tauri\target\release\bundle\
```

Install on your system and launch from Start Menu!

## Next Steps

- Customize service configurations
- Set up system tray integration (future)
- Configure alert notifications (future)
- Add custom metrics (future)

---

**Need Help?** Check the full README.md or open an issue on GitHub.
