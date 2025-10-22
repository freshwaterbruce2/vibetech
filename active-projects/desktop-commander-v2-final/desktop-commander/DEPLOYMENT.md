# Deployment Instructions

## Copy Files to Your Monorepo

Copy the entire `desktop-commander` folder to `C:\dev\`:

```
C:\dev\desktop-commander\
```

## File Structure Verification

Ensure you have all these files:

```
desktop-commander/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── tabs.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LogViewer.tsx
│   │   ├── ServiceCard.tsx
│   │   └── TradingMetrics.tsx
│   ├── lib/
│   │   ├── tauri.ts
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/
│   ├── src/
│   │   └── main.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .eslintrc.json
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── QUICKSTART.md
├── setup.ps1
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Installation Steps

### 1. Prerequisites Check

**Verify Node.js**:
```powershell
node --version  # Should be v18 or higher
```

**Verify/Install Rust**:
```powershell
cargo --version
# If not installed:
winget install Rustlang.Rust.MSVC
```

### 2. Automated Setup

```powershell
cd C:\dev\desktop-commander
.\setup.ps1
```

This will:
- ✅ Check Node.js installation
- ✅ Check/install Rust
- ✅ Install npm dependencies
- ✅ Verify monorepo structure

### 3. Manual Setup (if automated fails)

```powershell
cd C:\dev\desktop-commander

# Install dependencies
npm install

# Verify installation
npm run typecheck
npm run lint
```

## First Run

### Development Mode

```powershell
npm run tauri:dev
```

This will:
1. Start Vite dev server on port 1420
2. Compile Rust backend
3. Launch the Tauri window
4. Enable hot-reload

**First launch may take 2-3 minutes** while Rust dependencies compile.

### Production Build

```powershell
npm run tauri:build
```

Output location:
- Executable: `src-tauri\target\release\desktop-commander.exe`
- Installer: `src-tauri\target\release\bundle\msi\`

## Configuration

### Update Monorepo Path (if not C:\dev)

Edit `src-tauri/src/main.rs` line 39:

```rust
let monorepo_path = PathBuf::from("C:\\dev");  // Change this
```

### Configure Services

In `src-tauri/src/main.rs`, find `AppState::new()` and verify/update:

```rust
// Web App
services.insert(
    "web-app".to_string(),
    ServiceConfig {
        name: "web-app".to_string(),
        command: "npm run dev".to_string(),
        working_dir: monorepo_path.clone(),
        port: Some(5173),
    },
);

// Backend
services.insert(
    "backend".to_string(),
    ServiceConfig {
        name: "backend".to_string(),
        command: "npm run dev".to_string(),
        working_dir: monorepo_path.join("backend"),
        port: Some(3000),
    },
);

// Trading Bot
services.insert(
    "trading-bot".to_string(),
    ServiceConfig {
        name: "trading-bot".to_string(),
        command: ".venv\\Scripts\\python.exe start_live_trading.py".to_string(),
        working_dir: monorepo_path.join("projects\\crypto-enhanced"),
        port: None,
    },
);
```

### Configure Log Paths

In `src-tauri/src/main.rs`, function `get_tail_logs`:

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

## Testing

### Verify Service Detection

Launch the app and check Services tab:
- All configured services should appear
- Status should show "stopped" if not running

### Test Service Start

1. Click Start on "web-app"
2. New PowerShell window should open
3. Status should change to "running"
4. Port 5173 should show in service card

### Test Log Viewing

1. Start a service
2. Switch to Logs tab
3. Select the service
4. Logs should appear in real-time

### Test Trading Metrics

1. Ensure `projects/crypto-enhanced/trading.db` exists
2. Switch to Trading tab
3. Metrics should load (may show zeros if no trades)

## Troubleshooting

### "Failed to start service"

**Check**:
- Working directory exists
- Command is valid for your system
- No port conflicts

**Debug**:
```powershell
# Test the command manually
cd C:\dev
npm run dev
```

### "Failed to open database"

**Check**:
- `C:\dev\projects\crypto-enhanced\trading.db` exists
- File is not locked by another process

**Debug**:
```powershell
# Verify database
sqlite3 C:\dev\projects\crypto-enhanced\trading.db ".tables"
```

### Compilation Errors

**Rust Errors**:
```powershell
# Update Rust
rustup update stable

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

**TypeScript Errors**:
```powershell
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### Port Already in Use

**Find process using port**:
```powershell
Get-NetTCPConnection -LocalPort 1420 | Select-Object OwningProcess
Stop-Process -Id <PID>
```

## Adding to Windows Startup (Optional)

After building, create a shortcut:

1. Find: `src-tauri\target\release\desktop-commander.exe`
2. Copy to: `shell:startup` (paste in Windows Run)
3. App will start with Windows

## Updating

To update Desktop Commander:

```powershell
cd C:\dev\desktop-commander
git pull  # If using git
npm install
npm run tauri:build
```

## Uninstalling

1. Close the application
2. Delete the folder:
   ```powershell
   rm -rf C:\dev\desktop-commander
   ```
3. Remove from startup (if added)

## Security Notes

- PowerShell commands run with your user permissions
- Service processes inherit your environment
- Database access is read-only for trading metrics
- No network requests made by the app itself

## Performance Tips

- Keep log files under 10MB for fast loading
- Limit log viewer to 100-200 lines initially
- Close unused service windows
- Build in release mode for production use

## Support

For issues:
1. Check logs in the Logs tab
2. Review console output in PowerShell
3. Check DevTools (F12) for frontend errors
4. Open issue on GitHub with error details

---

**You're all set!** 🚀

Run `npm run tauri:dev` and start managing your monorepo!
