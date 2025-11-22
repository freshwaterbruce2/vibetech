# Agent Mode V2 - Demo Mode Task Planning Fix

**Date:** 2025-10-14
**Status:** ✅ Fixed and Ready to Test

## Problem

Agent Mode V2 in Demo Mode was generating useless single-step tasks that didn't actually do anything meaningful:
- Only 1 step: "Execute Request"
- Action type: "custom" (not a real action)
- No actual task decomposition

**Root Cause:** DemoResponseProvider was returning natural language text instead of the JSON format that TaskPlanner expects, causing JSON.parse() to fail and fall back to a generic single-step task.

## Solution

Updated `DemoResponseProvider.ts` to intelligently detect task planning requests and return properly formatted JSON responses.

### Changes Made

**File:** `src/services/ai/DemoResponseProvider.ts`

1. **Added task planning detection** (lines 16-18):
```typescript
// Check if this is a task planning request (expects JSON output)
if (query.includes('output format (json)') || query.includes('available actions:')) {
  return this.getTaskPlanResponse(request);
}
```

2. **Added getTaskPlanResponse() method** (lines 543-689):
   - Extracts user request from planning prompt
   - Extracts workspace context
   - Generates appropriate steps based on request keywords:
     - **Review/Analyze** → 3 steps (read structure, analyze files, generate report)
     - **Create/New** → 1 step (create new file)
     - **Fix/Bug** → 2 steps (identify issue, apply fix)
     - **Generic** → 1 custom step
   - Returns properly formatted JSON that TaskPlanner can parse

## Expected Behavior

### Before Fix
```
Task: "Review full app.C:\dev\Vibe-Tutor"
Steps: 1
  1. Execute Request (custom action - does nothing)
```

### After Fix
```
Task: "Review full app.C:\dev\Vibe-Tutor"
Steps: 3
  1. Read project structure (search_codebase - no approval needed)
  2. Analyze key files (analyze_code - no approval needed)
  3. Generate analysis report (write_file - requires approval)
```

## Testing Instructions

1. **Open Agent Mode V2**: Press **Ctrl+Shift+A**
2. **Try a review task**: "Review full project C:\dev\Vibe-Tutor"
3. **Verify**:
   - Should show 3 steps (not 1)
   - Steps should have real action types (search_codebase, analyze_code, write_file)
   - First 2 steps don't require approval
   - Last step requires approval

4. **Try other task types**:
   - "Create a new React component" → Should show 1 write_file step
   - "Fix the login bug" → Should show 2 steps (search, edit)

## Important Notes

- ✅ This fix only applies to **Demo Mode** (when no AI API key is configured)
- ✅ With a real AI API key, the system uses actual AI model responses
- ✅ Demo mode now includes helpful warnings about needing an API key
- ✅ TypeScript compilation passes with no new errors
- ✅ Changes applied via Vite HMR

## Related Files

- `src/services/ai/DemoResponseProvider.ts` - Added intelligent task planning
- `src/services/ai/TaskPlanner.ts` - Parses JSON responses (unchanged, already working)
- `src/services/ai/UnifiedAIService.ts` - Routes to DemoResponseProvider in demo mode

## Next Steps

To get **full Agent Mode capabilities**, configure an AI API key:
1. Click the Settings icon (bottom left)
2. Go to "API Keys" tab
3. Add a DeepSeek, OpenAI, Anthropic, or Google API key
4. Select a model
5. Agent Mode will then use real AI for intelligent task planning
