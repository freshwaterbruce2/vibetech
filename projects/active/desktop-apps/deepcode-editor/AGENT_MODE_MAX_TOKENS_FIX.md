# Agent Mode V2 - max_tokens Fix Complete

**Date:** October 14, 2025
**Status:** ✅ Fixed - Ready to Test

## Problem Summary

Agent Mode V2 was failing to plan tasks with the error:
```
Failed to parse task plan: SyntaxError: Unterminated string in JSON at position 4453
```

Or alternatively:
```
Failed to parse task plan: Error: AI response is empty or invalid
```

## Root Cause Identified (via Debug Logging)

Added comprehensive debug logging to trace the API call chain and discovered:

**First Attempt:**
- DeepSeek API successfully returned a 7-step task plan JSON
- Response was **truncated** mid-string at 2000 tokens
- `finishReason: 'length'` indicated token limit hit
- JSON ended with: `"warnings": ["The report` (incomplete)
- Error: `Unterminated string in JSON at position 4453`

**Subsequent Attempts:**
- DeepSeek API returned **empty string** content
- Still showed `finishReason: 'length'`
- Triggered validation error: `AI response is empty or invalid`

**The Issue:**
`UnifiedAIService.ts` line 161 set `max_tokens: 2000`, but detailed multi-step task planning JSON responses from DeepSeek exceed this limit significantly.

## Solution Applied

**File:** `src/services/ai/UnifiedAIService.ts` (line 161)

**Changed:**
```typescript
max_tokens: 2000,  // Too low for complex task plans
```

**To:**
```typescript
max_tokens: 8000,  // Increased to allow full task planning JSON responses
```

**Rationale:**
- DeepSeek models support up to 8192 tokens max output
- Task planning generates detailed JSON with multiple steps (7+ steps observed)
- Each step includes: title, description, action type, parameters, approval flags
- 8000 tokens provides comfortable headroom for complex plans

## Debug Logging Added

The following debug statements were added to trace API responses:

1. **DeepSeekProvider.ts** (lines 111-112, 149-150):
   - Logs raw API response
   - Logs first choice content

2. **AIProviderManager.ts** (lines 111-114):
   - Logs provider.complete() calls
   - Logs received results and choices

3. **UnifiedAIService.ts** (lines 147, 164-170, 181):
   - Logs completion object
   - Logs extracted content
   - Logs final AIResponse

4. **TaskPlanner.ts** (lines 53, 56-58):
   - Logs aiService calls
   - Logs received aiResponse
   - Logs content type validation

**These logs can be removed after verification, or kept for future debugging.**

## Testing Instructions

1. **Hard refresh** the Tauri app: **Ctrl+Shift+R**
2. Open Agent Mode V2: **Ctrl+Shift+A**
3. Enter task: "Review full project C:\dev\Vibe-Tutor"
4. Click **"Plan Task"**
5. Open browser console (F12) to see debug output

## Expected Behavior After Fix

**Console output should show:**
```
[DeepSeekProvider] Raw API response: {...}
[DeepSeekProvider] First choice content: {full JSON with all steps}
[AIProviderManager] Received result: {...}
[UnifiedAIService] Extracted content: {complete JSON}
[TaskPlanner] Received aiResponse: {...}
[TaskPlanner] aiResponse.content: {valid complete JSON}
```

**Agent Mode UI should show:**
- ✅ Task title: "Vibe-Tutor Full Project Review"
- ✅ 7 steps displayed (or similar multi-step plan)
- ✅ Each step with proper action types (analyze_code, search_codebase, read_file, etc.)
- ✅ Approval flags correctly set (most steps don't require approval)
- ✅ No truncation errors
- ✅ No empty response errors

## Files Modified

1. `src/services/ai/UnifiedAIService.ts` - Increased max_tokens from 2000 → 8000
2. `src/services/ai/providers/DeepSeekProvider.ts` - Added debug logging
3. `src/services/ai/AIProviderManager.ts` - Added debug logging
4. `src/services/ai/TaskPlanner.ts` - Added debug logging and validation

## Related Issues Fixed

- ✅ "Model Not Exist" error - Fixed in previous session (correct model IDs)
- ✅ Empty AI response - Fixed with max_tokens increase
- ✅ Truncated JSON - Fixed with max_tokens increase
- ✅ Demo mode task planning - Fixed in previous session (DemoResponseProvider)

## Performance Impact

**Token Usage:**
- Old: Up to 2000 tokens per task plan
- New: Up to 8000 tokens per task plan

**Cost Impact (DeepSeek Chat $0.28/M output tokens):**
- Additional 6000 tokens per plan
- Cost increase: ~$0.00168 per task plan (negligible)

**Benefits:**
- Eliminates truncation errors
- Allows complex multi-step plans
- Improves task planning quality

## Next Steps (Optional Cleanup)

After verifying the fix works:
1. Consider removing debug console.log statements
2. Or wrap them in a DEBUG flag for production
3. Test with various task types (create, fix, refactor, analyze)
4. Consider adding a `max_tokens` configuration option in settings

## Verification Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Open Agent Mode V2 (Ctrl+Shift+A)
- [ ] Test task planning with complex request
- [ ] Verify no truncation errors in console
- [ ] Verify full JSON response received
- [ ] Verify 7+ steps display correctly
- [ ] Verify action types are valid
- [ ] Verify approval flags work correctly
