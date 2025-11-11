# 🧪 PHASE 3 - DEV MODE TESTING GUIDE

## 🚀 STEP-BY-STEP TESTING PROCEDURE

### Prerequisites
- ✅ All source code integrated
- ✅ 4 backend services ready
- ✅ Both apps ready to launch

---

## 📋 TESTING CHECKLIST

### Phase 1: Start Backend Services (5 min)

#### Terminal 1 - Task Intelligence API
```powershell
cd D:\task-registry
python task_intelligence_api.py
```
**Expected Output:**
```
 * Running on http://127.0.0.1:5001
 * Task Intelligence API Started
```

#### Terminal 2 - ML Intelligence API
```powershell
cd D:\ml-service
python app.py
```
**Expected Output:**
```
 * Running on http://127.0.0.1:5002
 * ML Intelligence API Started
```

#### Terminal 3 - Workflow Engine
```powershell
cd C:\dev\backend\workflow-engine
npm start
```
**Expected Output:**
```
Workflow Engine listening on port 5003
```

#### Terminal 4 - IPC Bridge
```powershell
cd C:\dev\backend\ipc-bridge
npm start
```
**Expected Output:**
```
IPC Bridge WebSocket server running on port 5004
```

#### Verify All Services (Optional)
```powershell
# Test all health endpoints
Invoke-RestMethod http://127.0.0.1:5001/api/health
Invoke-RestMethod http://127.0.0.1:5002/api/health
Invoke-RestMethod http://127.0.0.1:5003/api/health
```

---

### Phase 2: Launch NOVA Agent (2 min)

#### Terminal 5 - NOVA Agent Dev Mode
```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current

# Install dependencies if needed
npm install

# Start in dev mode
npm run tauri dev
```

**Expected:**
- Window opens with NOVA Agent UI
- Console shows Tauri logs
- Hot reload enabled

**Test NOVA Features:**

1. ✅ **Task Intelligence Panel**
   - Click "🧠 Intelligence" tab
   - Should see "Task Intelligence" header
   - Click "New Task" button
   - Fill in task details
   - Click "Start Task"
   - Verify task appears in active tasks list

2. ✅ **Cross-App Command Palette**
   - Press `Ctrl+Shift+P`
   - Command palette should open
   - Type `@vibe help`
   - Press `Enter`
   - Should see command execution result

3. ✅ **IPC Connection**
   - Check for toast notification on startup
   - Should say "IPC Bridge Connected" or similar
   - Green indicator somewhere in UI

---

### Phase 3: Launch Vibe Code Studio (2 min)

#### Terminal 6 - Vibe Code Studio Dev Mode
```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor

# Install dependencies if needed
npm install

# Start dev mode
npm run dev:electron
```

**Expected:**
- Electron window opens
- Vibe Code Studio UI loads
- Console shows Electron logs

**Test Vibe Features:**

1. ✅ **Task Intelligence Panel**
   - Press `Ctrl+Shift+T`
   - Task panel should slide in
   - Should connect to Task Intelligence API
   - Shows active tasks (same as NOVA)

2. ✅ **Cross-App Command Palette**
   - Press `Ctrl+Shift+P`
   - Command palette opens
   - Type `@nova ask What is the weather?`
   - Press `Enter`
   - Should send command to NOVA

3. ✅ **Existing Features Still Work**
   - Open a file
   - Edit code
   - AI chat still works
   - Global search works (`Ctrl+Shift+F`)

---

### Phase 4: Test Cross-App Communication (5 min)

#### Test 1: NOVA → Vibe Command
**In NOVA Agent:**
1. Press `Ctrl+Shift+P`
2. Type: `@vibe open test.ts`
3. Press `Enter`

**Expected in Vibe:**
- Vibe receives command
- Opens `test.ts` file (if exists)
- Returns success result to NOVA

#### Test 2: Vibe → NOVA Command
**In Vibe Code Studio:**
1. Press `Ctrl+Shift+P`
2. Type: `@nova analyze this code`
3. Press `Enter`

**Expected in NOVA:**
- NOVA receives command
- Processes analysis request
- Returns result to Vibe

#### Test 3: Task Synchronization
**In NOVA:**
1. Click "🧠 Intelligence" tab
2. Create new task: "Test Cross-App Sync"
3. Click "Start Task"

**In Vibe:**
1. Press `Ctrl+Shift+T`
2. Should see "Test Cross-App Sync" in active tasks
3. Real-time sync verified! ✅

---

### Phase 5: API Testing (Optional, 3 min)

#### Test Task Intelligence API
```powershell
# Get active tasks
Invoke-RestMethod http://127.0.0.1:5001/api/tasks/active

# Start a task
$body = @{
    task_id = "test-001"
    task_type = "web"
    app_source = "nova"
    context_data = '{"test": true}'
} | ConvertTo-Json

Invoke-RestMethod http://127.0.0.1:5001/api/tasks/start -Method Post -Body $body -ContentType "application/json"
```

#### Test ML Intelligence API
```powershell
# Predict mistakes
$body = @{
    file_type = "ts"
    complexity = 75
    recent_errors = 2
} | ConvertTo-Json

Invoke-RestMethod http://127.0.0.1:5002/api/predict/mistake -Method Post -Body $body -ContentType "application/json"
```

#### Test Workflow Engine
```powershell
# List workflow templates
Invoke-RestMethod http://127.0.0.1:5003/api/templates

# Start a workflow
$body = @{
    template_id = "code-review"
    context = @{file_path = "test.ts"}
} | ConvertTo-Json

Invoke-RestMethod http://127.0.0.1:5003/api/workflows/start -Method Post -Body $body -ContentType "application/json"
```

---

## 🐛 TROUBLESHOOTING

### Issue: Service won't start

**Python services (5001, 5002):**
```powershell
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
pip install flask sqlite3 requests
```

**Node services (5003, 5004):**
```powershell
# Check Node version
node --version  # Should be 16+

# Install dependencies
npm install
```

### Issue: Port already in use
```powershell
# Find what's using the port
netstat -ano | findstr :5001

# Kill the process
taskkill /PID <PID> /F
```

### Issue: NOVA won't compile
```powershell
cd C:\dev\projects\active\desktop-apps\nova-agent-current

# Check for TypeScript errors
npm run build

# Check for Rust errors
cd src-tauri
cargo build
```

### Issue: Vibe won't start
```powershell
cd C:\dev\projects\active\desktop-apps\deepcode-editor

# Clear node_modules and reinstall
rm -r node_modules
npm install

# Try dev mode
npm run dev
```

### Issue: Cross-app commands don't work
1. Check IPC Bridge is running (port 5004)
2. Check browser console for errors
3. Verify both apps are connected to IPC Bridge
4. Check IPC Bridge logs for message routing

---

## ✅ SUCCESS CRITERIA

After testing, you should have:

- [x] All 4 services running without errors
- [x] NOVA Agent launches successfully
- [x] Vibe Code Studio launches successfully
- [x] Task Intelligence panel works in both apps
- [x] Cross-app command palettes open (Ctrl+Shift+P)
- [x] Commands execute between apps
- [x] Task synchronization works
- [x] No console errors
- [x] Hot reload works in dev mode

---

## 📊 TEST RESULTS TEMPLATE

```
=== PHASE 3 DEV MODE TEST RESULTS ===

Date: ___________
Tester: ___________

BACKEND SERVICES:
[ ] Task Intelligence API (5001) - Running
[ ] ML Intelligence API (5002) - Running
[ ] Workflow Engine (5003) - Running
[ ] IPC Bridge (5004) - Running

NOVA AGENT:
[ ] Launches successfully
[ ] Task Intelligence Panel works
[ ] Cross-App Command Palette works
[ ] IPC connection established
[ ] Commands execute

VIBE CODE STUDIO:
[ ] Launches successfully
[ ] Task Intelligence Panel works
[ ] Cross-App Command Palette works
[ ] IPC connection established
[ ] Commands execute

CROSS-APP COMMUNICATION:
[ ] NOVA → Vibe commands work
[ ] Vibe → NOVA commands work
[ ] Task synchronization works
[ ] Real-time updates work

ISSUES FOUND:
1. _________________________
2. _________________________
3. _________________________

OVERALL STATUS: [ ] PASS [ ] FAIL
```

---

## 🎯 NEXT STEPS AFTER TESTING

### If All Tests Pass ✅
- Update documentation with any findings
- Consider production build
- Document any user workflows
- Create demo video

### If Issues Found ❌
- Document error messages
- Check console logs
- Review integration points
- Fix and re-test

---

## 💡 TIPS

1. **Keep all terminals visible** - Use Windows Terminal with tabs
2. **Monitor console logs** - They show real-time errors
3. **Test incrementally** - One feature at a time
4. **Save test results** - Document what works/doesn't
5. **Hot reload is your friend** - Edit code and see changes instantly

---

Ready to start testing? Let me know what terminal you're on! 🚀
