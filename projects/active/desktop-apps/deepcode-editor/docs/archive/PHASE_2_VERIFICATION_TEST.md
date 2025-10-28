# Phase 2 Verification Test - Permission Fix + Self-Correction

**Date:** October 19, 2025 10:45 PM
**Purpose:** Verify Tauri permission fix AND test self-correction with actual failures
**Estimated Time:** 10 minutes

## Pre-Test Checklist

- [x] Tauri permission fix applied (filesystem scope added)
- [x] App rebuilt successfully (16.64s)
- [x] Dev server running on localhost:3007
- [ ] Browser console open and monitoring
- [ ] Agent Mode ready to test

## Test 1: Task Persistence (Verify Permission Fix)

**Goal:** Confirm `.deepcode/agent-tasks/*.json` files can be written

**Steps:**
1. Open DeepCode Editor at http://localhost:3007
2. Open browser DevTools (F12) and go to Console tab
3. Open Agent Mode
4. Enter simple task: "Create a file called test.txt with content 'hello world'"
5. Click "Plan Task"
6. Click "Execute Task"
7. Watch console for task persistence logs

**Expected Success Indicators:**
```javascript
[TaskPersistence] Task saved successfully to .deepcode/agent-tasks/task_*.json
```

**Expected Failure (if fix didn't work):**
```javascript
[TaskPersistence] Failed to save task state: forbidden path
Tauri writeFile error: forbidden path: .deepcode/agent-tasks/task_*.json
```

**Result:** ___________

---

## Test 2: Self-Correction - File Not Found (Real Failure)

**Goal:** Trigger actual file read failure to test alternative strategy generation

**Steps:**
1. Open Agent Mode (new task)
2. Enter task: "Read the file at C:/totally/fake/nonexistent/missing.txt"
3. Click "Plan Task"
4. Click "Execute Task"
5. Watch console closely for self-correction process

**Expected Console Output:**
```javascript
[ExecutionEngine] ❌ Step 1 failed (attempt 1/3): File not found
[ExecutionEngine] 🔄 Attempting self-correction...
[ExecutionEngine] 🤔 Self-Correction: Analyzing failure for "Read missing.txt"
[ExecutionEngine] Error: File not found: C:/totally/fake/nonexistent/missing.txt
[ExecutionEngine] Original action: read_file
[ExecutionEngine] ✨ Alternative Strategy: <AI suggestion here>
[ExecutionEngine] Confidence: <percentage>
[ExecutionEngine] ✅ Using alternative: <different action type>
```

**UI Indicators:**
- [ ] Step shows orange "Self-correcting (attempt 2)" badge
- [ ] Step status changes from "in_progress" to retry with different action
- [ ] Eventually completes or skips gracefully with reason

**Result:** ___________

---

## Test 3: Self-Correction - API Timeout Simulation

**Goal:** Test self-correction with network/timeout errors

**Steps:**
1. Open Agent Mode (new task)
2. Enter task: "Search for code pattern 'INTENTIONALLY_NONEXISTENT_PATTERN_12345' in workspace"
3. Click "Plan Task"
4. Click "Execute Task"
5. Watch for timeout or no-results handling

**Expected Behavior:**
```javascript
[ExecutionEngine] ❌ Step failed: No results found
[ExecutionEngine] 🔄 Attempting self-correction...
[ExecutionEngine] ✨ Alternative Strategy: Try different search approach or skip
```

**UI Indicators:**
- [ ] Self-correction badge appears
- [ ] AI suggests alternative (broader search, different pattern, or skip)
- [ ] Step completes with clear outcome

**Result:** ___________

---

## Test 4: Self-Correction - Permission Denied

**Goal:** Test handling of permission errors

**Steps:**
1. Open Agent Mode (new task)
2. Enter task: "Write a file to C:/Windows/System32/test.txt"
3. Click "Plan Task"
4. Click "Execute Task"
5. Watch for permission error handling

**Expected Behavior:**
```javascript
[ExecutionEngine] ❌ Step failed: Permission denied
[ExecutionEngine] 🔄 Attempting self-correction...
[ExecutionEngine] ✨ Alternative Strategy: Try user-accessible directory
```

**UI Indicators:**
- [ ] Self-correction triggered
- [ ] AI suggests alternative path (user temp, project directory)
- [ ] File created in alternative location OR skipped gracefully

**Result:** ___________

---

## Test 5: Metacognitive Layer - Repeated Failures

**Goal:** Verify stuck detection activates after multiple failures

**Steps:**
1. Open Agent Mode (new task)
2. Enter task with multiple impossible operations:
   - "Read C:/fake1.txt"
   - "Read C:/fake2.txt"
   - "Read C:/fake3.txt"
3. Click "Plan Task" (should create 3 steps)
4. Click "Execute Task"
5. Watch for metacognitive analysis

**Expected Console Output:**
```javascript
[Metacognitive] 🤔 Analyzing execution state...
[Metacognitive] 🔴 Detected repeated error pattern
[Metacognitive] 📉 Detected no progress pattern
[Metacognitive] Recommendation: Agent is hitting same error repeatedly. Should seek help.
```

**UI Indicators:**
- [ ] Multiple steps show self-correction attempts
- [ ] Progress counter shows "X completed, Y skipped / Z total"
- [ ] Task eventually completes (not infinite loop)

**Result:** ___________

---

## Console Monitoring Checklist

Watch for these specific log patterns:

### ✅ Good Signs:
- `[TaskPersistence] Task saved successfully`
- `[ExecutionEngine] 🔄 Attempting self-correction...`
- `[ExecutionEngine] ✨ Alternative Strategy:`
- `[Metacognitive] 🤔 Analyzing execution state...`
- `[AgentModeV2] Step completed:` or `Step was skipped:`

### ❌ Bad Signs (Report These):
- `forbidden path` errors (permission fix didn't work)
- Same action retried 3 times without change
- No self-correction messages when failures occur
- App crashes or freezes
- Infinite loops (task never completes)

---

## Critical Validation Points

### 1. Permission Fix Validation
**Pass Criteria:**
- Task state saves to `.deepcode/agent-tasks/*.json` without errors
- No "forbidden path" messages in console
- Task persists after app restart (bonus verification)

**Fail Criteria:**
- Any "forbidden path" errors
- Task persistence fails
- Files not created in .deepcode directory

### 2. Self-Correction Validation
**Pass Criteria:**
- Failed steps trigger self-correction (not blind retry)
- AI generates alternative strategies (different actions)
- Console shows clear reasoning and confidence scores
- UI displays "Self-correcting (attempt X)" badge

**Fail Criteria:**
- Same action retried without modification
- No self-correction messages in console
- No UI feedback during retry process
- AI doesn't suggest alternatives

### 3. Metacognitive Layer Validation
**Pass Criteria:**
- Repeated failures detected
- Stuck patterns identified
- Clear recommendations logged
- System doesn't loop infinitely

**Fail Criteria:**
- No stuck detection
- Infinite retry loops
- System crashes on repeated failures

---

## Quick Test Results Summary

Copy and fill this out:

```
VERIFICATION TEST RESULTS - [Date/Time]

Test 1 - Task Persistence:
Status: ✅ Pass / ❌ Fail
Notes: _______________________

Test 2 - File Not Found Self-Correction:
Status: ✅ Pass / ❌ Fail
Alternative Suggested: _______________________
Notes: _______________________

Test 3 - API Timeout:
Status: ✅ Pass / ❌ Fail
Notes: _______________________

Test 4 - Permission Denied:
Status: ✅ Pass / ❌ Fail
Alternative Path: _______________________
Notes: _______________________

Test 5 - Metacognitive Detection:
Status: ✅ Pass / ❌ Fail
Stuck Patterns Found: _______________________
Notes: _______________________

OVERALL ASSESSMENT:
- Permission Fix: ✅ Working / ❌ Broken
- Self-Correction: ✅ Working / ❌ Broken / ⚠️ Partial
- Metacognition: ✅ Working / ❌ Broken / ⚠️ Partial

READY FOR PHASE 3 COMPLETION: ✅ Yes / ❌ No / ⚠️ Needs Fixes

ISSUES FOUND:
1. _______________________
2. _______________________
3. _______________________
```

---

## Next Steps After Testing

### If All Tests Pass ✅:
1. Mark "Test task persistence" as completed in roadmap
2. Mark "Test Phase 2 self-correction" as completed
3. Document successful test results
4. Proceed to Phase 3 completion (metacognitive integration)
5. Update AGENT_MODE_2025_ROADMAP.md

### If Tests Fail ❌:
1. Document specific failures with console logs
2. Identify root cause (permission issue, AI response parsing, logic bug)
3. Fix identified issues
4. Re-run failed tests
5. Do NOT proceed to Phase 3 until Phase 2 validates

---

**Ready to test?** Start with Test 1 (simplest) and work through all 5 tests sequentially!
