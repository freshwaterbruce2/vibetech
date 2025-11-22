# Feature Spec: Tab Completion / Inline Suggestions

**Status**: ❌ Not Working (3 broken implementations exist)
**Priority**: CRITICAL (Core AI feature)
**Effort**: 4 hours (use Monacopilot)
**Dependencies**: Monacopilot library, DeepSeek API

---

## User Story

As a developer typing code,
I want to see AI-powered ghost text completions as I type,
So that I can press Tab to quickly insert suggested code without interrupting my flow.

---

## Acceptance Criteria

1. ✅ As user types, ghost text appears after cursor showing AI suggestion
2. ✅ Pressing `Tab` inserts the ghost text
3. ✅ Ghost text appears within 500ms of stopping typing
4. ✅ Ghost text uses dimmed color (gray) to distinguish from real code
5. ✅ Pressing any other key dismisses ghost text
6. ✅ Works for all supported languages (TypeScript, JavaScript, Python, etc.)
7. ✅ Uses workspace context for better suggestions
8. ✅ Handles multi-line completions

---

## Solution: Use Monacopilot

### Why Monacopilot?
- ✅ Production-ready open-source library
- ✅ Designed specifically for Monaco Editor
- ✅ Handles caching to reduce API calls
- ✅ Easy integration (< 50 lines of code)
- ✅ Used by other projects successfully

### Delete Broken Implementations
```bash
rm src/services/ai/InlineCompletionProvider.ts
rm src/services/ai/InlineCompletionProvider_SIMPLIFIED.ts
rm src/services/ai/completion/InlineCompletionProviderV2.ts
```

---

## Implementation

### Step 1: Install Monacopilot
```bash
pnpm add monacopilot
```

### Step 2: Create Backend Proxy (Security)
**Never expose API keys in browser!**

```typescript
// electron/completions-proxy.ts
import { ipcMain } from 'electron';
import { callDeepSeekAPI } from './ai-service';

ipcMain.handle('ai:completion', async (_, context: CompletionContext) => {
  const { code, language, position } = context;

  const response = await callDeepSeekAPI({
    model: 'deepseek-coder',
    prompt: `Complete this ${language} code:\n${code}`,
    max_tokens: 100,
    temperature: 0.2
  });

  return response.completion;
});
```

### Step 3: Integrate Monacopilot
```typescript
// src/components/Editor.tsx
import { registerCopilot } from 'monacopilot';

useEffect(() => {
  if (editorRef.current) {
    registerCopilot(monaco, editorRef.current, {
      endpoint: async (context) => {
        // Call backend via IPC
        return await window.electronAPI.getCompletion(context);
      },
      language: currentLanguage,
      debounceTime: 500,  // Wait 500ms after typing stops
      enableMultiLine: true
    });
  }
}, [editorRef.current]);
```

---

## Test Scenarios (Playwright)

```typescript
test('tab completion shows ghost text', async ({ page }) => {
  await page.click('.monaco-editor');

  // Type incomplete code
  await page.keyboard.type('function hello');

  // Wait for ghost text
  await page.waitForSelector('.ghost-text', { timeout: 1000 });

  // Verify ghost text exists
  const ghostText = await page.textContent('.ghost-text');
  expect(ghostText.length).toBeGreaterThan(0);

  // Press Tab
  await page.keyboard.press('Tab');

  // Verify completion inserted
  const editorText = await page.textContent('.monaco-editor');
  expect(editorText).toContain(ghostText);
});

test('typing dismisses ghost text', async ({ page }) => {
  // ... show ghost text ...

  // Type any key
  await page.keyboard.press('x');

  // Verify ghost text dismissed
  await expect(page.locator('.ghost-text')).not.toBeVisible();
});
```

---

## Success Metrics

- ✅ Ghost text appears <500ms after typing stops
- ✅ Tab insertion works 100% of the time
- ✅ No API calls for cached completions
- ✅ Suggestions are contextually relevant (>70% accepted by user)

---

**Status**: Ready for implementation
**Next Step**: Install Monacopilot, delete broken code
**Blocked By**: FileSystemService tests
