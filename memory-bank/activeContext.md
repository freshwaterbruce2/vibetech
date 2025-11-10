# Active Context: Phase 3.2 Complete + Learning Adapter Integrated

## Current Status

**Date:** November 10, 2025
**Status:** ✅ Phase 3.2 complete; ✅ Learning adapter integrated; ✅ Packaging ready

### What’s Done
- ✅ Shared IPC contracts extended for `command_request`/`command_execute`/`command_result`
- ✅ IPC Bridge routing and correlation hardened (success path uses original messageId)
- ✅ Vibe IPC client updated with command promises + timeouts
- ✅ NOVA IPC client updated (Rust) with pending command tracking and handler
- ✅ E2E IPC tests: route success + timeout
- ✅ Learning config (`LEARNING_SYSTEM_DIR`) in `@vibetech/shared-config`
- ✅ Python adapter
  - NOVA: Tauri command `run_python_learning_module` + TS `LearningAdapter`
  - Vibe: Electron `learning:run` bridge + `LearningHintsService` + UI button in `LearningPanel`
- ✅ Build-ready for both apps (see runbook summary below)

### Quick Runbooks
- IPC Bridge Command Routing: `docs/IPC_Bridge_Command_Routing_RUNBOOK.md`
- Learning Adapter (Python): `docs/Learning_Adapter_RUNBOOK.md`

## Environment & Paths
- `LEARNING_SYSTEM_DIR` → `D:\learning-system` (default)
- Databases: `D:\databases\database.db`, `D:\databases\agent_learning.db` (or .env overrides)
- Optional: `VIBE_IPC_BRIDGE_DIR=C:\dev\backend\ipc-bridge`

## Packaging
- Vibe (Electron): `pnpm --filter vibe-code-studio electron:build:win`
- NOVA (Tauri): `pnpm --filter nova-agent build`

## Smoke Tests
1. Launch Vibe → Bridge autostarts on :5004
2. Launch NOVA → `@vibe help` from NOVA palette returns result
3. Vibe palette `@nova help` returns result
4. Vibe LearningPanel → “Local Hints” shows JSON result from Python

## Notes
- Windows SmartScreen on unsigned builds: “More info” → “Run anyway”
- Bridge health: `http://localhost:5004/healthz`, `/readyz`, `/metrics`
