# Manual Test Guide - Tauri Desktop App

**Date**: October 19, 2025 10:55 PM
**Target**: DeepCode Editor Desktop App (NOT browser)
**Time Required**: 5-10 minutes

## Prerequisites

✅ Tauri desktop app is already running (from `pnpm dev`)
✅ Permission fix applied to tauri.conf.json
✅ App rebuilt successfully

## Where to Test

**IMPORTANT**: Use the **desktop application window** that opened when you ran `pnpm dev`, NOT a web browser!

The desktop app should have:
- Window title: "DeepCode Editor"
- Native window frame (minimize/maximize/close buttons)
- Menu bar at top
- Status bar at bottom with "Agent" button

---

## Test 1: Tauri Permission Fix (Critical)

**Goal**: Verify task persistence works without "forbidden path" errors

### Steps:

1. **In the Tauri desktop app**, open DevTools:
   - Windows: Ctrl+Shift+I or F12
   - Or right-click → "Inspect Element"

2. Go to **Console** tab in DevTools

3. **Open Agent Mode**:
   - Press Ctrl+Shift+A
   - OR click "Agent" button in status bar (bottom right)

4. **Switch to Agent tab** (if not already selected)

5. **Enter simple task**:
   ```
   Create a file called test-persistence.txt with content "Testing Tauri permissions"
   ```

6. **Click "Plan Task"** button

7. **Wait 2-3 seconds**, then **click "Execute Task"**

8. **Watch the Console** for these logs:

### Expected SUCCESS ✅:
```
[TaskPersistence] Task saved successfully to .deepcode/agent-tasks/task_*.json
```
OR
```
[TaskPersistence] Saving task state...
(no error messages)
```

### Expected FAILURE ❌ (means fix didn't work):
```
Tauri writeFile error: forbidden path: .deepcode/agent-tasks/task_*.json
[TaskPersistence] Failed to save task state: forbidden path
```

### Result:
- [ ] ✅ PASS - No forbidden path errors
- [ ] ❌ FAIL - Forbidden path errors still appearing

---

## Test 2: Self-Correction (Phase 2 Verification)

**Goal**: Verify AI generates alternative strategies when tasks fail

### Steps:

1. **Clear console** (right-click → Clear console)

2. **Click "New Task"** button (if available)

3. **Enter failing task**:
   ```
   Read the file at C:/this/path/definitely/does/not/exist/missing.txt
   ```

4. **Click "Plan Task"**

5. **Wait 2 seconds**, then **click "Execute Task"**

6. **Wait 15 seconds** and watch closely

7. **Look for these patterns in Console**:

### Expected SUCCESS ✅:
```
[ExecutionEngine] ❌ Step 1 failed (attempt 1/3): File not found
[ExecutionEngine] 🔄 Attempting self-correction...
[ExecutionEngine] 🤔 Self-Correction: Analyzing failure...
[ExecutionEngine] ✨ Alternative Strategy: <AI suggestion>
[ExecutionEngine] Confidence: XX%
```

### Expected in UI:
- Orange badge: "Self-correcting (attempt 2)"
- Step status changes during retry
- Eventually either succeeds with alternative OR skips gracefully

### Expected FAILURE ❌ (needs fixing):
```
(Same read_file action retried 3 times)
(No self-correction messages)
(No alternative strategies)
```

### Result:
- [ ] ✅ PASS - Self-correction triggered with alternatives
- [ ] ⚠️ PARTIAL - Self-correction started but no alternatives
- [ ] ❌ FAIL - No self-correction detected

---

## Test 3: Metacognitive Monitoring (Bonus)

**Goal**: Verify stuck detection is active

### Steps:

1. **Clear console**

2. **Enter task with multiple failures**:
   ```
   Read these files: C:/fake1.txt, C:/fake2.txt, C:/fake3.txt
   ```

3. **Plan and Execute**

4. **Watch for metacognitive logs**:

### Expected ✅:
```
[ExecutionEngine] 🧠 Metacognitive monitoring active
[Metacognitive] 🤔 Analyzing execution state...
[Metacognitive] 🔴 Detected repeated error pattern
```

### Result:
- [ ] ✅ Metacognitive logs present
- [ ] ❌ No metacognitive activity

---

## Quick Results Form

Copy and fill out:

```
TAURI DESKTOP APP TEST RESULTS
Date: [Current date/time]

Test 1 - Task Persistence:
Status: ✅ PASS / ❌ FAIL
Notes: ___________________________________________

Test 2 - Self-Correction:
Status: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Alternative suggested: ___________________________________________
Notes: ___________________________________________

Test 3 - Metacognitive:
Status: ✅ DETECTED / ❌ NOT DETECTED
Notes: ___________________________________________

Console Errors (if any):
___________________________________________

Overall Assessment:
- Tauri permission fix working: YES / NO
- Self-correction working: YES / PARTIAL / NO
- Ready for Phase 3 completion: YES / NO
```

---

## What to Do Next

### If All Tests Pass ✅:
1. Share the console logs (copy-paste critical sections)
2. Mark tasks as complete
3. Proceed to Phase 3 integration

### If Test 1 Fails ❌:
1. Copy the exact error message
2. Check if tauri.conf.json changes were saved
3. Verify app was rebuilt after config change
4. Try restarting the dev server

### If Test 2 Fails ❌:
1. Check if DeepSeek API key is configured
2. Look for any JavaScript errors in console
3. Verify the step actually failed (it should)
4. Copy full console output for debugging

---

**Remember**: Test in the **desktop app window**, not a browser!
