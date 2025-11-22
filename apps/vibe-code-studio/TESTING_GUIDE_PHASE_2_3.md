# Phase 2.3 Runtime Testing Guide
**Date**: October 20, 2025
**File**: test-autofix.ts

## Test Setup

1. **Open the Electron app** (already running on port 5174)
2. **Open test-autofix.ts** in the editor
3. **Open DevTools Console** (Ctrl+Shift+I or F12)
4. **Monitor console logs** for Auto-Fix system messages

---

## What to Test

### 1. TypeScript Error Detection (Automatic)

**Expected Behavior**: TypeScript errors should be detected automatically

**Errors in test file**:
- Line 4: TS2304 - Cannot find name 'mesage'
- Line 8: TS2554 - Expected 2 arguments, but got 1
- Line 12: TS2339 - Property 'nam' does not exist
- Line 16: TS2322 - Type 'string' not assignable to type 'number'
- Line 20: TS2345 - Argument type 'number' not assignable to parameter type 'string'

**Console Logs to Watch For**:


---

### 2. Debouncing (300ms Delay)

**Test Steps**:
1. Make a small edit (e.g., type a character then delete it)
2. **Watch console** - Auto-Fix should NOT trigger immediately
3. **Wait 300ms** - Auto-Fix should trigger ONCE after you stop typing

**Expected Console Logs**:


**Success Criteria**: No Auto-Fix during rapid typing, only after 300ms pause

---

### 3. Severity Filtering & Prioritization

**Test**: Check ErrorFixPanel shows errors in priority order

**Expected Order**:
1. **Errors first** (red/high severity)
2. **Warnings second** (yellow/medium severity)
3. **Info last** (blue/low severity) - may be filtered out

**Console Logs**:


---

### 4. Smart Model Selection

**CRITICAL TEST**: This verifies cost-aware routing works!

**Simple Errors (Should use Haiku 4.5)**:
- Line 4: TS2304 - Cannot find name (typo)
- Line 8: TS2554 - Missing argument
- Line 12: TS2339 - Property typo

**Expected Console Log**:


**Complex Errors (Should use Sonnet 4.5)**:
- Line 16: TS2322 - Type mismatch with interface
- Line 20: TS2345 - Generic type constraint

**Expected Console Log**:


**Success Criteria**:
- ? Haiku 4.5 for simple errors (TS2304, TS2554, TS2339)
- ? Sonnet 4.5 for complex errors (TS2322, TS2345, generics)

---

### 5. Cost Tracking

**Test**: Check console logs show estimated costs

**Expected Console Logs**:


**Success Criteria**: Cost displayed for each fix and suggestion

---

### 6. Monaco Code Actions Provider

**Test Steps**:
1. Click on a line with an error (e.g., line 4 with 'mesage')
2. **Right-click** to open context menu
3. Look for **"? Fix with AI: Cannot find name mesage"**
4. **Click the fix** - should trigger Auto-Fix

**Alternative Test**:
1. Click on error line
2. Look for **lightbulb icon (??)** in margin
3. Click lightbulb
4. Select "Fix with AI" from menu

**Expected Console Logs**:


---

### 7. ErrorFixPanel UI

**Test Steps**:
1. **Trigger Auto-Fix** (via panel, context menu, or lightbulb)
2. **Wait for AI response** (should be fast with Haiku 4.5)
3. **Panel should appear** with fix suggestions
4. **Click "Apply Fix"** - code should update
5. **Error should disappear** (auto-dismiss)

**Expected UI Elements**:
- [ ] ErrorFixPanel visible
- [ ] Error message displayed
- [ ] Fix suggestion(s) shown with confidence level
- [ ] "Apply Fix" button
- [ ] "Retry" button (for regenerating fixes)
- [ ] "Dismiss" button
- [ ] Model used badge (Haiku 4.5 or Sonnet 4.5)
- [ ] Estimated cost displayed

**Console Logs**:


---

## Success Criteria Summary

? **All features must work**:
1. TypeScript errors detected automatically
2. Debouncing delays Auto-Fix by 300ms
3. Errors prioritized over warnings
4. Haiku 4.5 for simple errors, Sonnet 4.5 for complex
5. Cost tracking displayed in console
6. Code Actions Provider works (context menu + lightbulb)
7. ErrorFixPanel UI functional (apply, retry, dismiss)
8. Auto-dismiss when error resolved

---

## Troubleshooting

**Issue**: No errors detected
- **Solution**: Ensure TypeScript is enabled in Monaco editor

**Issue**: Auto-Fix triggers immediately (no debounce)
- **Solution**: Check ErrorDetector config (debounceMs should be 300)

**Issue**: All errors use same model
- **Solution**: Check AutoFixService.selectModelForError() logic

**Issue**: No console logs
- **Solution**: Open DevTools Console (Ctrl+Shift+I)

**Issue**: Code Actions not showing
- **Solution**: Check AutoFixCodeActionProvider is registered in App.tsx

---

## Next Steps After Testing

If all tests pass:
- ? Mark Phase 2.3 complete
- ? Update IMPLEMENTATION_STATUS
- ? Move to Phase 3 (Advanced Features)

If tests fail:
- ? Debug and fix issues
- ? Re-test until all criteria met
- ? Document any edge cases found

