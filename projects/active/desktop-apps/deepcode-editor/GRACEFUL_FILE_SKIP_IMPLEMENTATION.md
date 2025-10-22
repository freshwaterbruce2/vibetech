# Graceful File Skip Implementation

**Date**: 2025-10-15
**Issue**: Agent Mode tasks failed with retries when trying to read non-existent optional files

## Problem

When Agent Mode tasks attempted to read files that didn't exist (e.g., `expo.config.ts` in a non-Expo project), the system would:
1. **Retry 3 times** (wasting time since file won't magically appear)
2. **Mark the step as failed** (even though it was optional)
3. **Block task execution** (subsequent steps wouldn't run)
4. **Show confusing error messages** (looks like a real failure)

Example from console:
```
FileSystemService.ts:289  Tauri readFile error: failed to open file at path:
C:\dev\projects\active\desktop-apps\nova-agent-current\expo.config.ts
with error: The system cannot find the file specified. (os error 2)

ExecutionEngine.ts:270  Retrying step 4 (attempt 2/3)
ExecutionEngine.ts:270  Retrying step 4 (attempt 3/3)

AIChat.tsx:888  Step failed: Read Expo configuration Error: Failed to read file...
```

## Solution

Implemented graceful skipping for non-existent optional files:

### 1. Type System Updates (`src/types/agent.ts`)

Added `skipped` field to `StepResult`:
```typescript
export interface StepResult {
  success: boolean;
  data?: unknown;
  message?: string;
  skipped?: boolean; // NEW: Indicates step was skipped
  filesModified?: string[];
  filesCreated?: string[];
  filesDeleted?: string[];
}
```

Note: `StepStatus` already included `'skipped'` as a valid status.

### 2. ExecutionEngine Updates (`src/services/ai/ExecutionEngine.ts`)

**Added NonRetryableError class:**
```typescript
export class NonRetryableError extends Error {
  constructor(message: string, public readonly reason: string = 'non-retryable') {
    super(message);
    this.name = 'NonRetryableError';
  }
}
```

**Modified `executeReadFile()` (Lines 355-362):**
```typescript
catch (statError) {
  // File doesn't exist - skip this step gracefully instead of failing
  const suggestions = await this.suggestAlternativeFiles(params.filePath);
  return {
    success: true, // Mark as success so task can continue
    skipped: true, // Indicate this step was skipped
    message: `File not found (skipped): ${params.filePath}. ${suggestions}`,
    data: { missingFile: params.filePath, skipped: true },
  };
}
```

**Modified `executeStepWithRetry()` (Lines 246-257):**
```typescript
const result = await this.executeAction(step.action.type, step.action.params);

// Check if step was skipped (e.g., optional file not found)
if (result.skipped) {
  step.status = 'skipped';
  step.completedAt = new Date();
  step.result = result;

  if (callbacks?.onStepComplete) {
    callbacks.onStepComplete(step, result);
  }

  return result;
}
```

### 3. UI Updates (`src/components/AIChat.tsx`)

**Added skipped status to visual components:**

**CompactStepCard (Lines 477-487):**
```typescript
case 'skipped': return 'rgba(148, 163, 184, 0.1)'; // Gray background
case 'skipped': return 'rgba(148, 163, 184, 0.5)'; // Gray border
```

**StepIconCompact (Lines 513):**
```typescript
case 'skipped': return 'rgba(148, 163, 184, 0.8)'; // Gray icon
```

**getStepIcon (Lines 949-950):**
```typescript
case 'skipped':
  return <AlertCircle size={16} />;
```

**Added skipped message display (Lines 1127-1149):**
```typescript
{step.status === 'skipped' && step.result?.message && (
  <div style={{
    marginTop: '8px',
    marginLeft: '28px',
    padding: '12px',
    background: 'rgba(148, 163, 184, 0.08)',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'rgba(148, 163, 184, 0.9)'
  }}>
    <div style={{
      fontWeight: 600,
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      <AlertCircle size={14} />
      Skipped
    </div>
    <div style={{ lineHeight: '1.5' }}>{step.result.message}</div>
  </div>
)}
```

### 4. Summary Updates (`src/App.tsx`)

**Updated task completion summary (Lines 818-844):**
```typescript
const completedSteps = task.steps.filter(s => s.status === 'completed');
const skippedSteps = task.steps.filter(s => s.status === 'skipped'); // NEW
const failedSteps = task.steps.filter(s => s.status === 'failed');

// ... completed steps ...

if (skippedSteps.length > 0) {
  summaryContent += `**Skipped ${skippedSteps.length} steps (optional files not found):**\n`;
  skippedSteps.forEach((step, idx) => {
    summaryContent += `${idx + 1}. ${step.title}`;
    if (step.result?.message) {
      summaryContent += ` - ${step.result.message}`;
    }
    summaryContent += '\n';
  });
  summaryContent += '\n';
}
```

## Benefits

1. **No wasted retries** - File-not-found doesn't retry since file won't appear
2. **Tasks continue** - Skipped steps don't block subsequent steps
3. **Clear visual distinction** - Gray styling differentiates skipped from failed
4. **Helpful suggestions** - Shows alternative files that might exist
5. **Accurate summaries** - Skipped steps reported separately from failures

## Behavior Changes

**Before:**
```
Step 4: Read Expo configuration
❌ Failed (after 3 retries)
Error: Failed to read file: The system cannot find the file specified
[Task stops]
```

**After:**
```
Step 4: Read Expo configuration
⚠️  Skipped
File not found (skipped): expo.config.ts. Try looking for: vite.config.ts
[Task continues to step 5]
```

## Testing

The changes are deployed via HMR. To test:

1. Run Agent Mode task that reads optional files
2. Observe skipped steps show gray styling with ⚠️  icon
3. Verify task continues past skipped steps
4. Check final summary shows skipped steps separately

## Future Enhancements

Consider adding:
- `isOptional` flag on steps to explicitly mark which steps can be skipped
- User choice: "Skip missing file" vs "Fail task"
- Smart file detection to avoid planning non-existent files in the first place
- Batch file existence checks before planning

## Files Modified

- `src/types/agent.ts` - Added `skipped` field to StepResult
- `src/services/ai/ExecutionEngine.ts` - Added NonRetryableError, skip logic
- `src/components/AIChat.tsx` - Added skipped styling and message display
- `src/App.tsx` - Updated task summary to show skipped steps
