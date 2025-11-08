# NOVA Agent ↔ Vibe Code Studio Integration Testing Guide

## 🎯 Overview

This guide walks through testing the complete integration between NOVA Agent and Vibe Code Studio, demonstrating how they share intelligence, databases, and real-time communication.

---

## ✅ Prerequisites

### 1. IPC Bridge Running

**Status**: ✅ **RUNNING** on port 5004

```bash
# The IPC Bridge is already running in the background
# You can verify with:
netstat -an | findstr "5004"
```

### 2. Shared Databases

Ensure these databases exist:
```
D:\databases\agent_learning.db     # Shared learning data
D:\databases\nova_activity.db      # Activity tracking
D:\databases\strategy_memory.db    # AI strategies
```

If they don't exist:
```bash
mkdir D:\databases
```

The apps will create the databases automatically on first run.

---

## 🚀 Test Scenario 1: Start Both Apps

### Step 1: Start NOVA Agent

```bash
cd C:\dev\projects\active\desktop-apps\nova-agent-current
npm run dev
```

**Expected Behavior**:
- ✅ NOVA Agent window opens
- ✅ Console shows: "Connecting to IPC Bridge at ws://localhost:5004"
- ✅ Console shows: "✅ Connected to IPC Bridge"

**What's Happening**:
NOVA Agent connects to the IPC Bridge and identifies itself as `source: 'nova'`.

### Step 2: Start Vibe Code Studio

```bash
cd C:\dev\projects\active\desktop-apps\deepcode-editor
npm run dev
```

**Expected Behavior**:
- ✅ Vibe Code Studio window opens
- ✅ Console shows: "NovaAgentBridge: Connecting to IPC Bridge"
- ✅ Console shows: "✅ Connected to IPC Bridge as 'vibe'"

**What's Happening**:
Vibe Code Studio connects to the same IPC Bridge and identifies itself as `source: 'vibe'`.

### Step 3: Verify IPC Bridge Connections

Check the IPC Bridge terminal window:

**Expected Output**:
```
📥 Client connected: nova
Active connections: 1
Messages: { total: 0, byType: {} }

📥 Client connected: vibe
Active connections: 2
Messages: { total: 0, byType: {} }

📊 Bridge Statistics:
- Active connections: 2 (nova, vibe)
- Messages routed: 0
```

---

## 🗄️ Test Scenario 2: Shared Database Access

### Test 2.1: Log a Mistake from Vibe Code Studio

**In Vibe Code Studio**:

1. Open the Learning Panel:
   - Click the **"Learning"** button in the status bar
   - Or press `Ctrl+Shift+L` (if keyboard shortcut is configured)

2. Log a mistake:
   - Click **"Add Mistake"** tab
   - Error: `Cannot read property 'map' of undefined`
   - Context: `Array mapping without null check`
   - Solution: `Added null check before map()`
   - Click **"Log Mistake"**

**Expected Behavior**:
- ✅ Console shows: `[DatabaseService] Logged mistake to agent_learning.db`
- ✅ Mistake appears in the Learning Panel list
- ✅ Database file `D:\databases\agent_learning.db` is updated

### Test 2.2: Verify Mistake Appears in NOVA Agent

**In NOVA Agent**:

1. Open the Insights Dashboard
2. Navigate to **Learning** section
3. Check **Recent Mistakes**

**Expected Behavior**:
- ✅ The mistake logged in Vibe appears in NOVA's list
- ✅ Source shows: `vibe` (indicating it came from Vibe Code Studio)
- ✅ Both apps are reading from the same database

### Test 2.3: Add Knowledge from NOVA Agent

**In NOVA Agent**:

1. Go to **Learning** → **Add Knowledge**
2. Add knowledge:
   - Category: `React Patterns`
   - Title: `Always use useCallback for event handlers`
   - Content: `Prevents unnecessary re-renders in child components`
   - Tags: `react, performance, hooks`
   - Click **"Add Knowledge"**

**Expected Behavior**:
- ✅ Knowledge is saved to `agent_learning.db`
- ✅ Console shows: `[Learning] Added knowledge entry`

### Test 2.4: Verify Knowledge Appears in Vibe Code Studio

**In Vibe Code Studio**:

1. Open Learning Panel
2. Click **"Knowledge"** tab
3. Search for "useCallback"

**Expected Behavior**:
- ✅ The knowledge entry appears in Vibe's list
- ✅ Source shows: `nova` (indicating it came from NOVA Agent)
- ✅ Both apps share the same knowledge base

---

## 📡 Test Scenario 3: Real-Time IPC Communication

### Test 3.1: File Open Sync (NOVA → Vibe)

**In NOVA Agent**:

1. Navigate to a code file in the file browser
2. Right-click → **"Open in Vibe Code Studio"**

**Expected Behavior**:
- ✅ Vibe Code Studio window focuses (if already open)
- ✅ The file opens in Monaco editor
- ✅ Console shows IPC message:
  ```
  📨 IPC Message Received: {
    type: 'file_open',
    payload: { filePath: 'C:\\dev\\...' },
    source: 'nova'
  }
  ```

**IPC Bridge Output**:
```
📨 Message: nova → vibe
Type: file_open
Payload: { filePath: '...' }
✅ Message routed successfully
```

### Test 3.2: Context Update Sync (Vibe → NOVA)

**In Vibe Code Studio**:

1. Open a workspace folder
2. The app automatically sends context update

**Expected Behavior**:
- ✅ NOVA Agent receives workspace context
- ✅ NOVA's context panel updates with current project
- ✅ Console shows:
  ```
  📨 IPC Message: context_update from vibe
  Updated workspace context: C:\dev\project
  ```

**IPC Bridge Output**:
```
📨 Message: vibe → nova
Type: context_update
Payload: { rootPath: 'C:\\dev\\...', openFiles: [...] }
✅ Broadcasted to 1 client(s)
```

### Test 3.3: Learning Update Sync (Real-Time)

**In Vibe Code Studio**:

1. Log a new mistake (as in Test 2.1)

**Expected Behavior**:
- ✅ IPC message sent: `type: 'mistake_logged'`
- ✅ NOVA Agent receives real-time update
- ✅ NOVA's Learning dashboard auto-refreshes
- ✅ New mistake appears immediately without manual refresh

**IPC Bridge Output**:
```
📨 Message: vibe → nova
Type: learning_update
SubType: mistake_logged
Payload: { mistake_id: 123, ... }
✅ Message delivered to nova
```

---

## 🧠 Test Scenario 4: Shared Learning System

### Test 4.1: Pattern Recognition Across Apps

**Setup**:
1. In Vibe: Log 3 similar mistakes related to "async/await"
2. Wait 5 seconds

**In NOVA Agent**:
1. Go to Insights → **Patterns**
2. Check for "Recurring Patterns"

**Expected Behavior**:
- ✅ NOVA identifies pattern: "Frequent async/await errors"
- ✅ Pattern shows data from Vibe Code Studio
- ✅ NOVA suggests: "Review async/await best practices"

### Test 4.2: Cross-App Recommendations

**In Vibe Code Studio**:
1. Write code with an async function
2. Trigger AI completion

**Expected Behavior**:
- ✅ AI suggestions include knowledge from NOVA's learning database
- ✅ Completion includes pattern-based best practices
- ✅ Console shows: `[AI] Using shared knowledge from learning database`

---

## 🎨 Test Scenario 5: Activity Tracking Sync

### Test 5.1: Deep Work Session Tracking

**In Vibe Code Studio**:
1. Start coding for 25 minutes (Pomodoro session)
2. Make several file edits

**In NOVA Agent**:
1. Go to Insights → **Activity**
2. Check **Recent Sessions**

**Expected Behavior**:
- ✅ Coding session appears in NOVA's activity log
- ✅ Shows files edited in Vibe
- ✅ Deep work time tracked correctly
- ✅ Source: `vibe`

### Test 5.2: Project Switch Notification

**In NOVA Agent**:
1. Switch active project

**In Vibe Code Studio**:
1. Check console for IPC message

**Expected Behavior**:
- ✅ Vibe receives: `type: 'project_switch'`
- ✅ Vibe's AI context updates to new project
- ✅ Relevant files/patterns for new project loaded

---

## 📊 Monitoring & Debugging

### View IPC Bridge Statistics

The IPC Bridge broadcasts statistics every 30 seconds:

**Expected Output**:
```
📊 Bridge Statistics:
Server:
  - Uptime: 1234s
  - Port: 5004

Connections:
  - Active: 2
  - Total: 5
  - Disconnections: 3

Messages:
  - Total: 150
  - By Type:
    • file_open: 25
    • context_update: 40
    • learning_update: 30
    • activity_sync: 35
    • mistake_logged: 12
    • knowledge_added: 8

Clients:
  - nova (connected 30m ago)
  - vibe (connected 28m ago)
```

### Check Database Directly

```bash
# Install sqlite3 if needed
npm install -g sqlite3

# Query shared database
sqlite3 D:\databases\agent_learning.db

# Check mistakes from both apps
SELECT app_source, error_type, COUNT(*)
FROM agent_mistakes
GROUP BY app_source, error_type;

# Expected:
# vibe | TypeError | 5
# nova | ReferenceError | 3
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to IPC Bridge"

**Symptoms**: Console shows `WebSocket connection failed`

**Solution**:
```bash
# Check if IPC Bridge is running
netstat -an | findstr "5004"

# If not running, start it:
cd C:\dev\backend\ipc-bridge
npm run dev
```

### Issue: "Database locked" error

**Symptoms**: `SQLITE_BUSY: database is locked`

**Solution**:
- This is expected - apps use WAL mode for concurrent access
- If persistent, restart both apps
- Check no other process is accessing the database

### Issue: NOVA doesn't show Vibe's learning data

**Symptoms**: Mistakes logged in Vibe don't appear in NOVA

**Solution**:
1. Verify both apps use same database path:
   - NOVA: `D:\databases\agent_learning.db`
   - Vibe: `D:\databases\agent_learning.db`
2. Check database permissions
3. Restart both apps to refresh connection
4. Check IPC Bridge is routing messages

### Issue: File doesn't open in Vibe from NOVA

**Symptoms**: Right-click → "Open in Vibe" does nothing

**Solution**:
1. Check Vibe Code Studio is running
2. Verify IPC Bridge connection:
   ```javascript
   // In NOVA console:
   console.log(novaAgentBridge.isConnected());
   ```
3. Check file path is absolute (not relative)
4. Verify Vibe's NovaAgentBridge service is initialized

---

## ✅ Success Criteria

After completing all tests, you should have:

- ✅ Both apps connected to IPC Bridge
- ✅ Shared database with entries from both apps
- ✅ Real-time message routing working
- ✅ File opening from NOVA → Vibe working
- ✅ Learning data synchronized between apps
- ✅ Activity tracking across both apps
- ✅ Pattern recognition using combined data

---

## 🎯 Next Steps

Once integration testing is complete:

1. **Performance Testing**:
   - Load test IPC Bridge with 1000+ messages
   - Test database with 10,000+ learning entries
   - Measure latency for real-time sync

2. **Error Handling**:
   - Test disconnect/reconnect scenarios
   - Test database unavailable scenarios
   - Test one app running without the other

3. **Production Deployment**:
   - Package both apps with integration enabled
   - Create installers that include IPC Bridge
   - Set up IPC Bridge as Windows service

---

## 📝 Test Results Template

Use this template to document your testing:

```markdown
## Integration Test Results

**Date**: 2025-11-08
**Tester**: [Your Name]
**Environment**: Windows 11, RTX 3060, Ryzen 7

### Scenario 1: Start Both Apps
- [ ] NOVA Agent started successfully
- [ ] Vibe Code Studio started successfully
- [ ] Both connected to IPC Bridge
- [ ] Notes: _________________

### Scenario 2: Shared Database
- [ ] Mistake logged from Vibe appears in NOVA
- [ ] Knowledge from NOVA appears in Vibe
- [ ] Database file updated correctly
- [ ] Notes: _________________

### Scenario 3: IPC Communication
- [ ] File open from NOVA → Vibe works
- [ ] Context updates sync correctly
- [ ] Learning updates in real-time
- [ ] Notes: _________________

### Scenario 4: Learning System
- [ ] Pattern recognition across apps
- [ ] Cross-app recommendations
- [ ] Notes: _________________

### Scenario 5: Activity Tracking
- [ ] Deep work sessions tracked
- [ ] Project switches synced
- [ ] Notes: _________________

### Issues Found:
1. _________________
2. _________________

### Overall Status: ✅ PASS / ❌ FAIL
```

---

**Ready to test!** The IPC Bridge is already running on port 5004. Just start both apps and follow the scenarios above.
