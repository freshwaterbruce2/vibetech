# Upgrade Guide: v1.0 → v2.0

## Quick Upgrade (5 Minutes)

You already have Desktop Commander running. Here's how to upgrade to v2.0 with all the new features:

### Step 1: Stop Current Instance

Close the Desktop Commander window (if running).

### Step 2: Backup (Optional)

```powershell
# Backup your current config if you modified it
cp C:\dev\active-projects\desktop-commander\desktop-commander\src-tauri\src\main.rs main.rs.backup
```

### Step 3: Extract v2.0

Extract `desktop-commander-v2.tar.gz` to the same location, overwriting files:

```powershell
cd C:\dev\active-projects\desktop-commander
# Extract archive, overwriting existing files
# Or manually copy all files from the extracted folder
```

### Step 4: Rebuild

```powershell
cd C:\dev\active-projects\desktop-commander\desktop-commander
npm run tauri:dev
```

**First build takes 2-3 minutes** (new Rust dependencies: reqwest for health checks).

### Step 5: Test New Features

Once launched:
1. ✅ Click "Start All" - all services start in order
2. ✅ Look for green health dots (●) next to service names
3. ✅ Check CPU/Memory usage displayed in service cards
4. ✅ Click "Enable Auto-Restart" on trading-bot
5. ✅ Click "Check Health" to manually verify

## What Changed?

### New Files/Updates
- ✅ `src-tauri/src/main.rs` - Major update with new features
- ✅ `src-tauri/Cargo.toml` - Added reqwest dependency
- ✅ `src/lib/tauri.ts` - New API functions
- ✅ `src/components/ServiceCard.tsx` - Enhanced UI
- ✅ `src/components/Dashboard.tsx` - Start/Stop All buttons
- ✅ `ENHANCEMENTS.md` - Complete feature documentation

### Configuration Changes

Your services now have additional fields:

**Before (v1.0):**
```rust
ServiceConfig {
    name: "backend".to_string(),
    command: "npm run dev".to_string(),
    working_dir: monorepo_path.join("backend"),
    port: Some(3000),
}
```

**After (v2.0):**
```rust
ServiceConfig {
    name: "backend".to_string(),
    command: "npm run dev".to_string(),
    working_dir: monorepo_path.join("backend"),
    port: Some(3000),
    health_check_url: Some("http://localhost:3000/health".to_string()),
    dependencies: vec![],
    auto_restart: true,
}
```

### If You Customized Services

If you added custom services to `main.rs`, you'll need to update them with the new fields:

```rust
// Add these three fields to each service:
health_check_url: Some("http://localhost:PORT".to_string()),  // or None
dependencies: vec![],  // or vec!["service-name".to_string()]
auto_restart: false,  // or true for critical services
```

## New Features You Can Use Immediately

### 1. Start All Services
Click the green "Start All" button in the header. Services start in dependency order:
1. backend (no dependencies)
2. web-app (depends on backend)
3. trading-bot (no dependencies)

### 2. Health Monitoring
- Green dot (●) = Service is healthy and responding
- Red dot (●) = Service is not responding properly
- Gray dot (●) = Health status unknown

### 3. Resource Monitoring
Each service card now shows:
- **CPU usage** - Real-time percentage
- **Memory usage** - RAM in MB

### 4. Auto-Restart
Critical services (backend, trading-bot) have auto-restart enabled by default:
- Monitors every 10 seconds
- Auto-restarts if service crashes
- Shows restart count

### 5. Manual Health Checks
Click "Check Health" button on any service card to manually verify it's responding.

## Rollback (If Needed)

If you need to go back to v1.0:

```powershell
cd C:\dev\active-projects\desktop-commander\desktop-commander

# Restore backup (if you made one)
cp main.rs.backup src-tauri\src\main.rs

# Rebuild
npm run tauri:dev
```

## Troubleshooting

### "Failed to compile" after upgrade

**Cause**: New Rust dependencies not downloaded
**Fix**: 
```powershell
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

### Health checks always show "unknown"

**Cause**: Services don't have health_check_url configured
**Fix**: Either:
1. Add health endpoint to your services (recommended)
2. Or set health_check_url to None in config

### Auto-restart not working

**Cause**: Feature might be disabled
**Fix**: Click "Enable Auto-Restart" button on service card

### Start All not working

**Cause**: Services may have errors or circular dependencies
**Fix**: Check console output, try starting services individually

## Performance Notes

v2.0 adds:
- **~10 MB** to compiled binary size (reqwest + tokio async)
- **~0.1%** CPU usage for background monitoring
- **Minimal** memory overhead (<5 MB)

Your app will still be lightweight and responsive.

## What's Next?

See `ENHANCEMENTS.md` for:
- Complete feature documentation
- Configuration examples
- Best practices
- Advanced usage patterns

---

**Enjoy the enhanced Desktop Commander!** 🚀

If you run into issues, the old version files are in the first `desktop-commander.tar.gz` archive.
