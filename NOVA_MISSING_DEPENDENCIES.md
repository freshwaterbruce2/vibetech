# NOVA Agent - Missing Rust Dependencies

## Current Status

✅ **Vibe Code Studio** - Running successfully
✅ **IPC Bridge** - Running (switched to pnpm)
❌ **NOVA Agent** - Missing Cargo dependencies

---

## Missing Cargo Dependencies

Add these to `src-tauri/Cargo.toml`:

```toml
md5 = "0.7"
toml = "0.8"
which = "6.0"
dirs = "5.0"
```

---

## API Changes to Fix

### 1. sysinfo API (process_monitor.rs:103)

**Error**: `refresh_processes` takes 1 argument, not 2

**Fix**:
```rust
// OLD (line 103):
system.refresh_processes(ProcessesToUpdate::All, true);

// NEW:
system.refresh_processes(ProcessesToUpdate::All);
```

---

## Quick Fix Commands

```bash
cd C:\dev\projects\active\desktop-apps\nova-agent-current\src-tauri

# Add dependencies
cargo add md5@0.7
cargo add toml@0.8
cargo add which@6.0
cargo add dirs@5.0
```

Then fix the sysinfo API call manually.

---

## Integration Architecture (Current)

```
✅ Vibe Code Studio (Port 5174)
    │
    │ Ready to connect
    │
✅ IPC Bridge (Port 5004) [USING PNPM NOW]
    │
    │ Waiting for NOVA...
    │
❌ NOVA Agent (compilation errors)
```

---

## What's Working

1. **Vibe Code Studio**:
   - Window opened
   - Database initialized
   - Windows 11 integration active
   - GPU acceleration enabled
   - File associations registered

2. **IPC Bridge**:
   - Now using pnpm (consistent)
   - WebSocket server on port 5004
   - Ready for both apps

3. **Shared Resources**:
   - D:\databases\ ready
   - packages/vibetech-shared exists

---

## Testing Once NOVA is Fixed

See `INTEGRATION_TEST_GUIDE.md` for full test scenarios.

### Quick Test (3 min):
1. Start all 3 services (IPC Bridge, NOVA, Vibe)
2. In Vibe: Log a mistake via Learning Panel
3. In NOVA: Check if mistake appears
4. ✅ Success = integration working!

---

**Next**: Fix the 4 missing dependencies + 1 API change, then start NOVA.
