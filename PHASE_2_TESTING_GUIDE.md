# 🧪 Phase 2 Testing Guide (Phases 2.1-2.3)

**Date**: November 8, 2025
**Covers**: Tasks 1-12 (Foundation, IPC Client, Status Indicators)
**Status**: Ready for Testing

---

## 📋 Prerequisites

### Required Services

1. **IPC Bridge Server** (MUST be running first)
2. **NOVA Agent** (Tauri desktop app)
3. **Vibe Code Studio** (Electron desktop app)

### System Requirements

- Node.js 18+
- Rust/Cargo (for NOVA build)
- Ports available: 5004 (IPC Bridge), 3001 (Vibe dev)

---

## 🚀 Testing Workflow

### Step 1: Start IPC Bridge

```powershell
# Terminal 1: IPC Bridge Server
cd C:\dev\backend\ipc-bridge
npm start
```

**Expected Output**:
```
✅ IPC Bridge Server listening on ws://localhost:5004
```

**Verify**:
- No error messages
- Port 5004 not in use by other apps
- Server stays running (doesn't crash)

**Troubleshooting**:
```powershell
# If port in use, find and kill process
netstat -ano | findstr :5004
taskkill /PID <PID> /F

# Restart IPC Bridge
npm start
```

---

### Step 2: Launch NOVA Agent

```powershell
# Terminal 2: NOVA Agent
cd C:\dev\projects\active\desktop-apps\nova-agent-current
pnpm run dev
```

**Expected Behavior**:
1. App launches
2. After ~1 second, see toast notification: "Connected to IPC Bridge"
3. Console logs show:
   ```
   [NOVA] Initializing IPC Bridge connection...
   [IPC] Connecting to ws://localhost:5004...
   [IPC] ✓ Connected to IPC Bridge
   ```

**What to Check**:
- [ ] App launches without errors
- [ ] Toast notification appears (green, top-right)
- [ ] Toast says "Connected to IPC Bridge"
- [ ] Console shows connection logs
- [ ] No error messages in console

**If Connection Fails**:
- Check IPC Bridge is running
- Look for error toast: "IPC Bridge connection failed"
- Check console for error details
- Verify port 5004 is accessible

---

### Step 3: Launch Vibe Code Studio

```powershell
# Terminal 3: Vibe Code Studio
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run dev
```

**Expected Behavior**:
1. App launches
2. After ~1.5 seconds, see notification: "Connected to IPC Bridge"
3. Console logs show:
   ```
   [Vibe] Initializing IPC Bridge connection...
   [IPC] Connecting to ws://localhost:5004...
   [IPC] ✓ Connected to IPC Bridge
   ```

**What to Check**:
- [ ] App launches without errors
- [ ] Notification appears (success type)
- [ ] Notification says "Connected to IPC Bridge"
- [ ] Console shows connection logs
- [ ] No error messages

---

## ✅ Phase 2.1: Foundation Testing

### Test 1: API Key Storage (NOVA)

**Steps**:
1. In NOVA Agent, click "LLM" tab (or wherever LLMConfigPanel is)
2. Look for "🔐 API Key Management" section
3. Click to expand if collapsed
4. Select "DeepSeek" from provider dropdown
5. Enter test API key: `sk-test1234567890`
6. Click "Save Key"
7. Wait for success message
8. Close NOVA Agent completely
9. Relaunch NOVA Agent
10. Open LLMConfigPanel again
11. Check if DeepSeek appears in "Configured Providers"

**Expected Results**:
- [ ] API Key section is visible
- [ ] Provider dropdown has 5 options
- [ ] Password input has show/hide button
- [ ] Save button is enabled after typing
- [ ] Success toast appears after save
- [ ] Provider appears in list after save
- [ ] Key persists after app restart
- [ ] Stored at: `%APPDATA%\nova-agent\secure-api-keys.json` (encrypted)

**Visual Check**:
- Green success message: "✓ DeepSeek API key saved and encrypted"
- Provider listed with "Added: [date]"

### Test 2: API Key Test Connection

**Steps**:
1. With DeepSeek key configured
2. Click "Test Connection" button
3. Wait for response

**Expected Results**:
- [ ] Button shows loading state
- [ ] Success message if key valid
- [ ] Error message if key invalid
- [ ] Button returns to normal after test

**Note**: Test requires valid API key to pass. Skip if using test key.

### Test 3: API Key Removal

**Steps**:
1. Find configured provider in list
2. Click "Remove" button (trash icon)
3. Confirm removal

**Expected Results**:
- [ ] Confirmation prompt appears
- [ ] Provider removed from list
- [ ] Success toast shown
- [ ] Key deleted from storage

---

## ✅ Phase 2.2: IPC Client Testing

### Test 4: Auto-Connect (NOVA)

**Already tested in Step 2**, but verify:

**Console Checks**:
```javascript
// Open DevTools Console
// Check IPC Store state
console.log('Store available?', typeof useIPCStore !== 'undefined');

// Should see initialization logs
```

**Expected**:
- Connection happens automatically
- No manual intervention needed
- Retry on failure (up to 10 attempts)

### Test 5: Auto-Connect (Vibe)

**Already tested in Step 3**, but verify:

**Console Checks**:
```javascript
// DevTools Console
console.log('[IPC] status:', ipcClient.getStatus());
```

**Expected**:
- Auto-connect ~1.5s after launch
- Event listeners registered
- WebSocket connected

### Test 6: Auto-Reconnect

**Steps**:
1. With both apps running and connected
2. Stop IPC Bridge (Ctrl+C in Terminal 1)
3. Wait 5 seconds
4. Restart IPC Bridge (`npm start`)
5. Watch both apps reconnect automatically

**Expected Results** (NOVA):
- [ ] Status changes to "Disconnected" or "Error"
- [ ] Console shows: "Reconnecting in Xms"
- [ ] After bridge restarts, status becomes "Connected"
- [ ] Success toast appears

**Expected Results** (Vibe):
- [ ] Status indicator changes to red or gray
- [ ] Console shows reconnection attempts
- [ ] After bridge restarts, reconnects automatically
- [ ] Success notification appears

**Timing**:
- First retry: 2 seconds
- Second retry: 4 seconds
- Third retry: 8 seconds
- Max delay: 30 seconds

### Test 7: Message Queue

**Steps**:
1. Stop IPC Bridge
2. In NOVA or Vibe, trigger an IPC message (we'll implement this in Phase 2.4+)
3. Restart IPC Bridge
4. Verify message is sent

**Expected**:
- Messages queued when offline
- Queue flushed on reconnect
- Max 100 messages in queue

**Note**: Full test requires Phase 2.4+ implementation

---

## ✅ Phase 2.3: Status Indicators Testing

### Test 8: Status Indicator (NOVA)

**Location**: Status tab → Integration section (bottom)

**Steps**:
1. Open NOVA Agent
2. Click "Status" or equivalent tab
3. Scroll to bottom
4. Find "Integration" section

**Visual Checks**:
- [ ] Section visible with "Integration" heading
- [ ] IntegrationStatus widget displayed
- [ ] Status dot visible (green/amber/red/gray)
- [ ] Connection icon (🔗 or emoji) visible
- [ ] Status text shows current state
- [ ] Reconnect button (↻) visible

**States to Test**:

**Connected** (green):
```
🔗 🟢 IPC Connected ↻
```
- Green dot with glow
- Text: "IPC Connected"

**Connecting** (amber):
```
⏳ 🟡 Connecting... ↻
```
- Amber dot pulsing
- Text: "Connecting..."

**Disconnected** (gray):
```
○ ⚪ IPC Disconnected ↻
```
- Gray dot, no glow
- Text: "IPC Disconnected"

**Error** (red):
```
⚠️ 🔴 Connection Error ↻
```
- Red dot with glow
- Text: "Connection Error"

### Test 9: Status Indicator Details Panel (NOVA)

**Steps**:
1. Click on the IntegrationStatus widget
2. Details panel should expand below

**Expected Content**:
- [ ] Status row (colored status text)
- [ ] Last Ping row (time since last ping)
- [ ] Last Error row (if error occurred)
- [ ] Bridge URL row (ws://localhost:5004)
- [ ] Connect/Disconnect button

**Interactions**:
- [ ] Click outside to close panel
- [ ] Click Reconnect button
- [ ] Click Disconnect button (if connected)
- [ ] Click Connect button (if disconnected)

### Test 10: Status Indicator (Vibe)

**Location**: Bottom status bar (right side)

**Steps**:
1. Open Vibe Code Studio
2. Look at bottom status bar
3. Find IPC indicator on right side

**Visual Checks**:
- [ ] Compact indicator visible: "IPC 🟢"
- [ ] Status dot visible
- [ ] Reconnect button (↻) visible
- [ ] Takes minimal space (~50px)

**Compact Mode States**:

**Connected**:
```
IPC 🟢 ↻
```

**Connecting**:
```
IPC... 🟡 ↻
```

**Disconnected**:
```
IPC ○ ⚪ ↻
```

**Error**:
```
IPC ✗ 🔴 ↻
```

### Test 11: Status Indicator Details Panel (Vibe)

**Steps**:
1. Click on compact IPC indicator in status bar
2. Details panel should appear above it

**Expected Content**:
- [ ] Status row (colored)
- [ ] Last Ping row
- [ ] Queued Messages row (if any queued)
- [ ] Last Error row (if error)
- [ ] Bridge URL row
- [ ] Connect/Disconnect button

**Queued Messages**:
- Shows count in parentheses: "IPC 🟢 (3)"
- Displayed in orange color
- Visible in details: "Queued Messages: 3"

### Test 12: Reconnect Button

**Steps** (both apps):
1. Click reconnect button (↻)
2. Watch for disconnect → connect cycle

**Expected**:
- [ ] Button click triggers disconnect
- [ ] Status changes to "Connecting"
- [ ] After ~500ms, reconnection attempt
- [ ] Status changes to "Connected"
- [ ] Last ping timestamp updates

### Test 13: Animations

**Visual Checks**:
- [ ] Pulse animation on connecting state
- [ ] Glow effects on connected/error states
- [ ] Smooth slide-down for details panel
- [ ] Hover effects on buttons
- [ ] Scale animations on button clicks

**Performance**:
- [ ] Animations smooth (60fps)
- [ ] No jank or stuttering
- [ ] Transitions feel natural

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to IPC Bridge"

**Symptoms**:
- Error toast/notification
- Red status indicator
- Console: Connection refused

**Solutions**:
1. Check IPC Bridge is running: `http://localhost:5004`
2. Restart IPC Bridge: `npm start`
3. Check firewall not blocking port 5004
4. Try different port (update configs)

### Issue 2: "API key not persisting"

**Symptoms**:
- Key disappears after restart
- Error saving key
- Empty configured providers list

**Solutions**:
1. Check ASAR setting: `asar: false` in electron-builder.json
2. Verify app has write permissions
3. Check storage path exists
4. Look for save errors in console

### Issue 3: "Auto-connect not working"

**Symptoms**:
- No connection toast
- Status stays disconnected
- No console logs

**Solutions**:
1. Check initialization delay (1-1.5s)
2. Verify `initializeIPCStore()` is called in App.tsx
3. Check for initialization errors in console
4. Verify IPC Bridge running before app launch

### Issue 4: "Status indicator not showing"

**Symptoms**:
- Integration section missing
- Status bar indicator missing
- Component not rendering

**Solutions**:
1. Check component imports
2. Verify StatusPanel/StatusBar includes IntegrationStatus
3. Check for render errors in console
4. Verify Zustand store initialized

### Issue 5: "Animations not smooth"

**Symptoms**:
- Jerky animations
- Lag on interactions
- Poor performance

**Solutions**:
1. Check GPU acceleration enabled
2. Reduce animation complexity
3. Check for memory leaks
4. Monitor DevTools Performance tab

---

## 📊 Testing Checklist

### Phase 2.1: Foundation ✅

- [ ] API key section visible in LLMConfigPanel
- [ ] Can select provider from dropdown
- [ ] Can enter and save API key
- [ ] Success message appears
- [ ] API key persists after restart
- [ ] Can test connection (with valid key)
- [ ] Can remove API key
- [ ] Multiple providers supported

### Phase 2.2: IPC Client ✅

- [ ] NOVA auto-connects on startup
- [ ] Vibe auto-connects on startup
- [ ] Connection toast/notification appears
- [ ] Console logs show connection
- [ ] Auto-reconnect works after disconnect
- [ ] Exponential backoff applied
- [ ] Max retry attempts respected
- [ ] Message queue works (partial)

### Phase 2.3: Status Indicators ✅

- [ ] NOVA status indicator in Status tab
- [ ] Vibe status indicator in status bar
- [ ] Status dots show correct colors
- [ ] Status text updates in real-time
- [ ] Reconnect button works
- [ ] Details panel expands on click
- [ ] Details panel closes on outside click
- [ ] Connect/Disconnect buttons work
- [ ] Animations smooth and responsive
- [ ] Compact mode works (Vibe)
- [ ] Queued message count visible (Vibe)

---

## 🎯 Success Criteria

### All Tests Pass When:

1. ✅ IPC Bridge starts without errors
2. ✅ Both apps launch successfully
3. ✅ Auto-connect works in both apps
4. ✅ Status indicators show connection state
5. ✅ API keys can be stored and retrieved
6. ✅ API keys persist after restart
7. ✅ Reconnect works after bridge restart
8. ✅ Details panels show health metrics
9. ✅ Manual reconnect button works
10. ✅ Animations and UI smooth

---

## 📹 Visual Testing Guide

### What Good Looks Like

**NOVA Agent - Status Tab**:
```
┌─────────────────────────────────────┐
│ Agent Status                         │
│ 🟢 Active                            │
│                                      │
│ Conversations: 3                     │
│ Memories: 150                        │
│ Capabilities: 5                      │
│ Current Project: None                │
│                                      │
│ Active Capabilities                  │
│ [filesystem] [memory] [code]        │
│                                      │
│ Integration                          │
│ ┌─────────────────────────────────┐ │
│ │ 🔗 🟢 IPC Connected          ↻  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Vibe Code Studio - Status Bar**:
```
────────────────────────────────────────────────────────────────
Branch: main | Lines: 150 | ... | 🔗 IPC 🟢 ↻ | Demo/Live | ⚙️
────────────────────────────────────────────────────────────────
```

---

## 🔍 Debugging Commands

### Check IPC Store State (NOVA)

```javascript
// Open DevTools Console in NOVA
// Access Zustand store
const store = require('./stores/useIPCStore').useIPCStore;
const state = store.getState();

console.log('Status:', state.status);
console.log('Last Ping:', state.lastPing);
console.log('Error:', state.lastError);
console.log('Connected:', state.isConnected());
```

### Check IPC Store State (Vibe)

```javascript
// Open DevTools Console in Vibe
import { useIPCStore } from './stores/useIPCStore';

const state = useIPCStore.getState();
console.log('Status:', state.status);
console.log('Learning Data:', state.remoteLearningData.length);
console.log('Project Updates:', state.remoteProjectUpdates.length);
```

### Check IPC Client (Vibe)

```javascript
// Open DevTools Console in Vibe
import { ipcClient } from './services/IPCClient';

console.log('IPC Status:', ipcClient.getStatus());
console.log('Is Connected:', ipcClient.isConnected());
console.log('Time Since Ping:', ipcClient.getTimeSinceLastPing());
console.log('Queue Size:', ipcClient.getQueuedMessageCount());
```

### Monitor Connection Events

```javascript
// NOVA
const store = useIPCStore.getState();
store.connect(); // Manually connect
store.disconnect(); // Manually disconnect

// Vibe
import { ipcClient } from './services/IPCClient';
ipcClient.on('status', (status) => console.log('Status changed:', status));
ipcClient.on('message', (msg) => console.log('Message received:', msg));
```

---

## 📝 Test Results Template

```markdown
# Phase 2 Testing Results

**Date**: [Date]
**Tester**: [Name]
**Environment**: Windows 10/11

## Phase 2.1: Foundation
- [ ] API Key Storage: PASS/FAIL
- [ ] API Key Persistence: PASS/FAIL
- [ ] API Key Removal: PASS/FAIL
- Notes: [Any issues]

## Phase 2.2: IPC Client
- [ ] NOVA Auto-Connect: PASS/FAIL
- [ ] Vibe Auto-Connect: PASS/FAIL
- [ ] Auto-Reconnect: PASS/FAIL
- Notes: [Any issues]

## Phase 2.3: Status Indicators
- [ ] NOVA Indicator: PASS/FAIL
- [ ] Vibe Indicator: PASS/FAIL
- [ ] Details Panels: PASS/FAIL
- [ ] Animations: PASS/FAIL
- Notes: [Any issues]

## Overall Result
- [ ] ALL TESTS PASSED
- [ ] SOME TESTS FAILED (see notes)

## Screenshots
[Attach screenshots of key features]

## Issues Found
1. [Issue description]
2. [Issue description]
```

---

## 🎓 Next Steps After Testing

### If All Tests Pass ✅
- Document any observations
- Note performance metrics
- Continue to Phase 2.4 (Learning Sync)

### If Tests Fail ❌
- Document specific failures
- Check console for errors
- Review error messages
- Compare with expected behavior
- Report issues with screenshots

---

**Testing Duration**: ~30-45 minutes
**Required**: IPC Bridge + Both apps running
**Goal**: Verify Foundation, IPC, and Status UI working correctly
