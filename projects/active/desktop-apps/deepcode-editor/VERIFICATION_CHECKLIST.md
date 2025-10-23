# AI Tab Completion - Verification Checklist
**Created**: 2025-10-16
**Purpose**: Manual testing checklist to verify AI completion works after streaming mode fix

---

## Prerequisites

- [ ] DeepSeek API key configured in Settings
- [ ] Dependencies installed (`pnpm install`)
- [ ] Dev server NOT currently running

---

## Step 1: Start Development Server

```bash
cd C:\dev\projects\active\desktop-apps\deepcode-editor
pnpm run dev:web
```

**Expected Output:**
```
VITE v7.x.x ready in XXX ms

Local:   http://localhost:3001/
Network: use --host to expose
```

**Verification:**
- [ ] Server starts without errors
- [ ] Can access http://localhost:3001 in browser
- [ ] No compilation errors in console

---

## Step 2: Open Browser DevTools

1. Open http://localhost:3001 in Chrome/Edge
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Clear any existing logs

---

## Step 3: Verify Provider Initialization

Look for these logs in console (should appear immediately on page load):

**Required Logs:**
```
✅ Monaco Editor configured to use local files (Tauri-compatible mode)
✅ Monaco Editor workers configured
[UnifiedAI] Initializing, found 1 stored providers
[UnifiedAI] API keys found, demo mode disabled immediately
[UnifiedAI] Initialized provider: deepseek
[UnifiedAI] Demo mode disabled, isDemoMode: false
[COMPLETION] InlineCompletionProvider initialized, streamingEnabled: false
✨ AI Tab Completion activated (Tab to accept, Alt+] for next suggestion)
```

**Critical Checks:**
- [ ] `streamingEnabled: false` (NOT true)
- [ ] `isDemoMode: false` (NOT true)
- [ ] Activation message appears
- [ ] No errors in red

**If streamingEnabled: true:**
```bash
# Hard refresh to clear cache
Ctrl + Shift + R

# OR clear cache completely:
F12 → Application → Clear storage → Clear site data
```

---

## Step 4: Test Basic Completion Triggering

1. Open or create a JavaScript file in the editor
2. Clear the editor (delete all content)
3. Type this code slowly:

```javascript
function calculate
```

4. **STOP TYPING** and wait 500ms

**Expected Console Logs:**
```
[COMPLETION] Provider triggered! {position: '1:18', triggerKind: 0, isEnabled: true}
[COMPLETION] Got code context: {
  currentLine: "function calculate",
  currentLineTrimmed: "function calculate",
  currentLineLength: 18,
  ...
}
[COMPLETION] Cache MISS - will fetch from AI
[COMPLETION] Setting 200ms debounce timer
[COMPLETION] Debounce timer fired - starting fetch
[COMPLETION] fetchCompletions called with context: {...}
[COMPLETION] Passed empty line check, continuing...
[COMPLETION] Decision point - streamingEnabled: false
[COMPLETION] Taking NON-STREAMING path - calling fetchNonStreamingCompletions
[COMPLETION] Fetching AI completion {language: 'javascript', ...}
[UnifiedAI] sendContextualMessage called, isDemoMode: false
[UnifiedAIService] Calling providerManager.complete() with model: deepseek-chat
```

**Verification:**
- [ ] Provider triggers on each keystroke
- [ ] Debounce timer fires after 200ms pause
- [ ] Shows "NON-STREAMING path" (NOT streaming)
- [ ] AI service gets called
- [ ] No errors in console

---

## Step 5: Verify Ghost Text Appears

After typing `function calculate` and pausing:

**Expected Behavior:**
1. Within 1-2 seconds, gray "ghost text" appears after your cursor
2. Ghost text shows code completion (e.g., `(a, b) { return a + b; }`)
3. Text is dimmed/grayed out (not solid black)

**Verification:**
- [ ] Ghost text appears within 3 seconds
- [ ] Ghost text is contextually relevant (function body)
- [ ] Ghost text is visually distinct (gray color)

**If NO ghost text appears:**

Check console for these issues:

**Issue A: API Key Error**
```
[UnifiedAI] RETURNING DEMO RESPONSE - API keys not initialized yet!
```
**Fix:** Go to Settings (⚙️), add DeepSeek API key, restart

**Issue B: HTTP/CORS Error**
```
Failed to fetch
CORS policy blocked
```
**Fix:** Check internet connection, verify DeepSeek API is accessible

**Issue C: Empty Line Exit**
```
[COMPLETION] EXITING EARLY - currentLine is empty or whitespace
```
**Fix:** Bug in context extraction - context.currentLine is empty when it shouldn't be

---

## Step 6: Test Completion Acceptance

With ghost text visible:

1. Press **Tab** key

**Expected:**
- [ ] Ghost text becomes solid (inserted into editor)
- [ ] Cursor moves to end of inserted text
- [ ] Can continue editing normally

**Alternative: Dismiss Completion**
1. Press **Escape** key
2. Ghost text should disappear

---

## Step 7: Test Multiple Scenarios

### Scenario A: Function Declaration
```javascript
function sum(a, b) {
```
- [ ] Ghost text appears
- [ ] Completion shows function body

### Scenario B: Arrow Function
```javascript
const multiply = (x, y) =>
```
- [ ] Ghost text appears
- [ ] Completion shows arrow function body

### Scenario C: Class Declaration
```javascript
class Calculator {
```
- [ ] Ghost text appears
- [ ] Completion shows class members

### Scenario D: Comment Completion
```javascript
// TODO: add
```
- [ ] Ghost text appears
- [ ] Completion suggests relevant comment text

### Scenario E: Rapid Typing (Debounce Test)
```javascript
function rapidTypingTest
```
Type without pausing between characters.

**Expected:**
- [ ] Console shows multiple "Cleared previous debounce timer"
- [ ] Only ONE "Debounce timer fired" after you stop
- [ ] Ghost text appears only after pause

---

## Step 8: Test Caching

1. Type: `function test() {`
2. Wait for ghost text to appear
3. Note the completion in console
4. **Clear the editor** (delete all text)
5. Type **exactly the same**: `function test() {`

**Expected:**
```
[COMPLETION] Cache HIT - returning cached result
```

**Verification:**
- [ ] Second request shows "Cache HIT"
- [ ] Ghost text appears faster (no API call)
- [ ] Same completion as first time

---

## Step 9: Test Error Handling

### Test A: Disable Completions

1. Go to Settings UI
2. Toggle "AI Completion" to OFF
3. Type code in editor

**Expected:**
- [ ] No ghost text appears
- [ ] Provider doesn't trigger (no logs)

4. Toggle back to ON
5. Type code

**Expected:**
- [ ] Ghost text appears again
- [ ] Feature re-enabled

### Test B: Network Error Simulation

(Optional - requires modifying mock or disconnecting internet)

---

## Step 10: Performance Check

Type this quickly without pauses:
```javascript
function performanceTest() { const x = 1; const y = 2; return x + y; }
```

**Expected:**
- [ ] All characters appear immediately (no lag)
- [ ] Editor remains responsive
- [ ] Typing not blocked by AI requests

---

## Success Criteria Summary

✅ **Provider Initialization:**
- streamingEnabled: false
- isDemoMode: false
- Activation message shown

✅ **Triggering:**
- Provider triggers on keystroke
- Debounce works (200ms delay)
- Uses non-streaming path

✅ **Ghost Text:**
- Appears within 1-3 seconds
- Contextually relevant
- Visually distinct

✅ **Interaction:**
- Tab accepts completion
- Escape dismisses completion
- Can toggle on/off in settings

✅ **Performance:**
- No typing lag
- Caching works
- No console errors

---

## Common Issues & Fixes

### Issue 1: streamingEnabled: true

**Symptom:** Console shows `streamingEnabled: true` instead of `false`

**Fix:**
1. Stop dev server (Ctrl+C)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart: `pnpm run dev:web`
4. Hard refresh browser: Ctrl+Shift+R

---

### Issue 2: No Ghost Text (but logs show API call)

**Symptom:** Console shows completion fetched but no ghost text appears

**Possible Causes:**
- Monaco inline suggest disabled
- Wrong CSS selector for ghost text
- Completion format incorrect

**Debug:**
1. Check Monaco editor options
2. Inspect element to see if ghost text exists in DOM
3. Check console for Monaco-related errors

---

### Issue 3: Monaco Worker Errors

**Symptom:** Lots of "Unexpected usage" errors

**Status:** This is a known issue, doesn't block completion

**Fix:** Monaco worker configuration in `main.tsx` should fix this

---

### Issue 4: Demo Mode Stuck

**Symptom:** `isDemoMode: true` even with API key configured

**Fix:**
1. Verify API key is saved: Settings → Check DeepSeek API Key field
2. Clear localStorage: DevTools → Application → Local Storage → Clear
3. Refresh page

---

## Test Results Template

Copy this template and fill it out:

```
## Test Results - [Date]

**Environment:**
- OS: Windows/Mac/Linux
- Browser: Chrome/Edge/Firefox
- Node: vX.X.X
- pnpm: vX.X.X

**Provider Initialization:** ✅ / ❌
- streamingEnabled: false? ✅ / ❌
- isDemoMode: false? ✅ / ❌
- Activation message? ✅ / ❌

**Triggering:** ✅ / ❌
- Provider triggers? ✅ / ❌
- Debounce works? ✅ / ❌
- Uses non-streaming path? ✅ / ❌
- AI service called? ✅ / ❌

**Ghost Text:** ✅ / ❌
- Appears? ✅ / ❌
- Within 3s? ✅ / ❌
- Contextually relevant? ✅ / ❌

**Interaction:** ✅ / ❌
- Tab acceptance? ✅ / ❌
- Escape dismissal? ✅ / ❌

**Performance:** ✅ / ❌
- No typing lag? ✅ / ❌
- Caching works? ✅ / ❌

**Issues Found:**
1. [List any issues discovered]
2. [With console errors if applicable]

**Overall Status:** ✅ PASS / ❌ FAIL
```

---

## Next Steps After Verification

### If All Tests Pass:
1. ✅ Document success
2. ✅ Create PR or commit changes
3. ✅ Update feature status to "Production Ready"
4. ✅ Consider re-enabling streaming mode (future enhancement)

### If Tests Fail:
1. ❌ Document failure with console logs
2. ❌ Identify root cause from logs
3. ❌ Apply fix
4. ❌ Re-run verification
5. ❌ Repeat until all tests pass

---

**Ready to test!** Start with Step 1 and work through systematically.
