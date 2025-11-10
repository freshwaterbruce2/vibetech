# IPC Bridge Command Routing Runbook

## Overview
Cross-app commands flow via the IPC Bridge (WebSocket :5004) using:
- `command_request` → bridge routes to target (`nova`/`vibe`)
- `command_execute` → target app executes
- `command_result` → result returns to origin, correlated by the origin messageId

## Prereqs
- Node.js and pnpm installed
- Bridge port 5004 free

## Start the Bridge (dev)
```bash
cd C:\dev\backend\ipc-bridge
pnpm install
node src/server.js
```
Health:
- `http://localhost:5004/healthz`
- `http://localhost:5004/readyz`
- `http://localhost:5004/metrics`

Vibe auto-starts the bridge in app runs; this manual start is for standalone testing.

## Message Contract (excerpt)
- `command_request` (origin → bridge): `{ messageId, type, source, payload: { text, target?, context?, metadata? } }`
- `command_execute` (bridge → target): `{ messageId=cmd-*, payload: { commandId, command, args, text, originalSender } }`
- `command_result` (target/bridge → origin): `{ payload: { commandId, success, result?, error?, metrics? } }`

## Smoke Test
1) Start Vibe; confirm log: “Bridge is listening on ws://localhost:5004” (or healthz returns 200)
2) In Vibe palette, run `@nova help` → response renders
3) In NOVA palette, run `@vibe help` → response renders

## E2E Tests (Playwright)
```bash
cd C:\dev
pnpm run test --filter tests/e2e/ipc-bridge.spec.ts
```
Validates connection, routing, and timeout behavior.

## Troubleshooting
- If success response not received: ensure success path uses origin `messageId` (fixed in server.js).
- Check logs for `command timeout` → verify the target app is connected and identified as the correct `source`.
