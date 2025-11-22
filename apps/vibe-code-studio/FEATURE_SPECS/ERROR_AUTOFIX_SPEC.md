# Feature Spec: Error Auto-Fix

**Status**: 🟡 Backend Exists, Not Integrated
**Priority**: HIGH (Core Cursor feature)
**Effort**: 1 day
**Dependencies**: ErrorDetector, AutoFixService, Monaco Code Actions

---

## User Story

As a developer seeing error squiggles in my code,
I want to click on the error and see AI-powered fix suggestions,
So that I can quickly resolve issues without leaving the editor.

---

## Acceptance Criteria

1. ✅ Red squiggles appear under code with errors (TypeScript, ESLint)
2. ✅ Clicking error squiggle shows code action menu
3. ✅ Menu includes "AI Fix" option with lightbulb icon
4. ✅ Clicking "AI Fix" calls ErrorDetector + AutoFixService
5. ✅ Fix suggestions appear in panel below editor
6. ✅ Each suggestion shows diff of what will change
7. ✅ "Apply" button applies fix
8. ✅ "Dismiss" button closes panel
9. ✅ Multiple fix suggestions if available

---

## Existing Code to Integrate

### ErrorDetector.ts (EXISTS)
- Detects TypeScript errors from Monaco diagnostics
- Detects ESLint errors
- Returns structured error information

### AutoFixService.ts (EXISTS)
- Takes error context, generates AI fix
- Returns fix suggestions with diffs

### ErrorFixPanel.tsx (EXISTS)
- UI component to show suggestions
- NOT WIRED TO MONACO

---

## Implementation

### Step 1: Register Monaco Code Action Provider
```typescript
// src/services/AutoFixCodeActionProvider.ts (UPDATE)
monaco.languages.registerCodeActionProvider('typescript', {
  provideCodeActions: (model, range, context) => {
    const errors = context.markers.filter(m => m.severity === monaco.MarkerSeverity.Error);

    if (errors.length === 0) return { actions: [], dispose: () => {} };

    return {
      actions: errors.map(error => ({
        title: '💡 AI Fix',
        kind: 'quickfix',
        isPreferred: true,
        run: () => {
          showErrorFixPanel(error, model, range);
        }
      })),
      dispose: () => {}
    };
  }
});
```

### Step 2: Wire ErrorFixPanel to App.tsx
```typescript
// src/App.tsx (ADD)
const [errorFixPanelVisible, setErrorFixPanelVisible] = useState(false);
const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);

function showErrorFixPanel(error, model, range) {
  setCurrentError({ error, model, range });
  setErrorFixPanelVisible(true);
}

// Add to render:
{errorFixPanelVisible && (
  <ErrorFixPanel
    error={currentError}
    onApply={(fix) => applyFix(fix)}
    onDismiss={() => setErrorFixPanelVisible(false)}
  />
)}
```

---

## Test Scenarios

```typescript
test('clicking error shows AI fix option', async ({ page }) => {
  // Create file with error
  await page.click('.monaco-editor');
  await page.keyboard.type('const x: number = "string";');  // Type error

  // Wait for error squiggle
  await page.waitForSelector('.squiggly-error');

  // Click error
  await page.click('.squiggly-error');

  // Wait for code actions menu
  await page.waitForSelector('.monaco-action');

  // Verify "AI Fix" option exists
  const aiFixAction = await page.locator('text=💡 AI Fix');
  await expect(aiFixAction).toBeVisible();
});

test('applying AI fix updates code', async ({ page }) => {
  // ... show AI fix ...

  // Click apply
  await page.click('[data-testid="apply-fix-button"]');

  // Verify code updated
  const editorText = await page.textContent('.monaco-editor');
  expect(editorText).not.toContain('"string"');  // Error fixed
});
```

---

**Status**: Ready for integration
**Files to Modify**:
1. src/services/AutoFixCodeActionProvider.ts (wire to Monaco)
2. src/App.tsx (add ErrorFixPanel to layout)
3. src/components/ErrorFixPanel.tsx (already exists, may need updates)
