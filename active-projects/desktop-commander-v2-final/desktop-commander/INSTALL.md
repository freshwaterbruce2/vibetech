# 🚀 Desktop Commander - Installation Package

## What You're Getting

A complete **Tauri desktop application** for managing your C:\dev monorepo with:

✅ **Real-time service monitoring** (web-app, backend, trading-bot)
✅ **One-click start/stop controls** for all services  
✅ **Live log tailing** with filtering and export
✅ **Trading bot metrics dashboard** reading from your SQLite database
✅ **Built with your exact tech stack** (React 18, TypeScript, shadcn/ui, Tailwind)

## Quick Stats

- 📦 **30 files** total
- 🎨 **16 TypeScript/Rust source files**
- 🧩 **5 shadcn/ui components**
- 🔧 **Rust backend** with 9 Tauri commands
- 📊 **3 major UI sections** (Services, Logs, Trading)

## Installation (5 Minutes)

### Step 1: Extract Files

Download and extract `desktop-commander.tar.gz` to your C:\dev folder:

```powershell
# Navigate to your dev folder
cd C:\dev

# Extract (if using tar on Windows)
tar -xzf desktop-commander.tar.gz

# Or use Windows Explorer to extract
```

You should now have:
```
C:\dev\desktop-commander\
```

### Step 2: Run Setup

```powershell
cd C:\dev\desktop-commander
.\setup.ps1
```

This installs:
- Rust (if needed)
- npm dependencies
- Verifies your monorepo structure

### Step 3: Launch

```powershell
npm run tauri:dev
```

**First launch takes 2-3 minutes** (Rust compilation).

## What Each Tab Does

### 📊 Services Tab
Your services at a glance:
- **Visual status indicators** (running/stopped/error)
- **One-click controls** (start/stop/restart)
- **Process info** (PID, uptime, port)

Configured services:
- `web-app` (port 5173)
- `backend` (port 3000)  
- `trading-bot` (no port)

### 📝 Logs Tab
Real-time log monitoring:
- **Select any service** to view logs
- **Auto-scrolling** live feed
- **Color-coded levels** (ERROR=red, INFO=blue, etc.)
- **Export to file** for debugging
- **Clear logs** with one click

### 📈 Trading Tab
Live crypto bot metrics:
- **Bot status** (LIVE/OFFLINE)
- **Circuit breaker** status
- **Current balance** ($98.82)
- **Profit/Loss** (color-coded)
- **Total trades** and **win rate**
- **Active position** warning
- **Last trade** timestamp

Reads directly from:
```
C:\dev\projects\crypto-enhanced\trading.db
```

## File Structure

```
desktop-commander/
├── 📱 Frontend (React + TypeScript)
│   ├── src/components/
│   │   ├── Dashboard.tsx          # Main layout with tabs
│   │   ├── ServiceCard.tsx        # Service status card
│   │   ├── LogViewer.tsx          # Real-time log viewer
│   │   ├── TradingMetrics.tsx     # Trading bot metrics
│   │   └── ui/                    # shadcn/ui components
│   ├── src/lib/
│   │   ├── tauri.ts               # API wrappers
│   │   └── utils.ts               # Utility functions
│   └── App.tsx
│
├── 🦀 Backend (Rust + Tauri)
│   └── src-tauri/src/main.rs      # All Tauri commands
│
├── 📖 Documentation
│   ├── README.md                  # Full documentation
│   ├── QUICKSTART.md              # Quick reference
│   └── DEPLOYMENT.md              # Detailed setup guide
│
└── ⚙️ Configuration
    ├── package.json               # Dependencies
    ├── tsconfig.json              # TypeScript config
    ├── tailwind.config.js         # Tailwind config
    └── tauri.conf.json            # Tauri config
```

## Key Features

### Service Management
```rust
// Configured in: src-tauri/src/main.rs
- Detects running services via process/port monitoring
- Starts services in new PowerShell windows
- Stops services by killing processes
- Shows uptime, PID, port information
```

### Log Monitoring
```rust
// Configured in: src-tauri/src/main.rs (get_tail_logs)
Default log paths:
- Trading bot: projects/crypto-enhanced/trading_new.log
- Web app: web-app.log
- Backend: backend/backend.log
```

### Trading Metrics
```rust
// Queries: src-tauri/src/main.rs (get_trading_metrics)
SQLite database: projects/crypto-enhanced/trading.db

Calculates:
- Total trades from `trades` table
- P/L from `realized_pnl` column
- Win rate (profitable trades / closed trades)
- Active positions (status = 'open')
```

## Customization

### Add a New Service

Edit `src-tauri/src/main.rs` in `AppState::new()`:

```rust
services.insert(
    "my-new-service".to_string(),
    ServiceConfig {
        name: "my-new-service".to_string(),
        command: "npm start".to_string(),
        working_dir: monorepo_path.join("my-service"),
        port: Some(8080),
    },
);
```

### Change Monorepo Path

If your monorepo is not at `C:\dev`:

Edit `src-tauri/src/main.rs` line 39:
```rust
let monorepo_path = PathBuf::from("D:\\your\\path");
```

### Update Log Paths

Edit `src-tauri/src/main.rs` in `get_tail_logs()`:
```rust
let log_path = match service_name.as_str() {
    "my-service" => state.monorepo_path.join("my-service\\logs\\app.log"),
    // ...
};
```

## Commands Reference

### Development
```powershell
npm run tauri:dev          # Start dev mode with hot-reload
npm run dev                # Frontend only (port 1420)
npm run typecheck          # Type checking
npm run lint               # ESLint
npm run quality            # All checks
```

### Production
```powershell
npm run tauri:build        # Build standalone .exe
```

Output: `src-tauri\target\release\desktop-commander.exe`

### Troubleshooting
```powershell
# Clean rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:dev

# Reset dependencies
rm -rf node_modules
npm install
```

## Tech Stack Match

Built with **your exact preferences**:

✅ **React 18** with TypeScript
✅ **Strict TypeScript** (noImplicitAny, strictNullChecks, noUncheckedIndexedAccess)
✅ **shadcn/ui** components (Radix UI primitives)
✅ **Tailwind CSS** with custom theme
✅ **Path aliases** (@/components)
✅ **ESLint + TypeScript** strict checking
✅ **Quality pipeline** (lint + typecheck + build)

## Integration with Your Monorepo

Desktop Commander integrates with:

1. **Web App** (C:\dev)
   - Starts via `npm run dev`
   - Monitors port 5173

2. **Backend** (C:\dev\backend)
   - Starts via `npm run dev`
   - Monitors port 3000

3. **Trading Bot** (C:\dev\projects\crypto-enhanced)
   - Starts via Python virtual environment
   - Reads trading.db for metrics
   - Monitors trading_new.log

## Security Notes

- ✅ Runs with your user permissions
- ✅ No external network requests
- ✅ Database access is read-only
- ✅ PowerShell commands are configurable
- ✅ All source code included for review

## Next Steps

1. **Extract and install** using steps above
2. **Run `npm run tauri:dev`** to launch
3. **Test service controls** in Services tab
4. **Monitor logs** in Logs tab
5. **Check trading metrics** in Trading tab
6. **Customize services** as needed
7. **Build production** with `npm run tauri:build`

## Documentation Files

- 📘 **README.md** - Complete reference guide
- 🚀 **QUICKSTART.md** - Quick reference for daily use  
- 🔧 **DEPLOYMENT.md** - Detailed installation/configuration
- 💻 **This file** - Installation overview

## Support

- All source code included
- Heavily commented Rust backend
- TypeScript types for all APIs
- Example configurations provided

## What Makes This Special

✨ **Tailored to your workflow**
- Matches your tech stack exactly
- Integrates with your existing services
- Reads your actual trading database
- Uses your monorepo structure

✨ **Production-ready**
- Type-safe throughout
- Error handling in place
- Follows your coding standards
- Quality checks configured

✨ **Extensible**
- Add services easily
- Customize log paths
- Modify metrics queries
- Brand it your way

---

## Ready to Install?

```powershell
cd C:\dev\desktop-commander
.\setup.ps1
npm run tauri:dev
```

**That's it!** Your desktop commander is ready to manage your monorepo! 🎉
