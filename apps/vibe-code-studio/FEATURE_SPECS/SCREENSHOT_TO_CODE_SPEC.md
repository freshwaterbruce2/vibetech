# Feature Spec: Screenshot-to-Code

**Status**: 🟡 Backend Exists (ImageToCodeService.ts), No Upload UI
**Priority**: LOW (Unique feature, not critical)
**Effort**: 1 hour
**Dependencies**: ImageToCodeService, ScreenshotToCodePanel component

---

## User Story

As a designer or developer with a UI mockup,
I want to upload a screenshot and get React/HTML code generated,
So that I can quickly implement designs without hand-coding from scratch.

---

## Acceptance Criteria

1. ✅ Button in toolbar: "Upload Screenshot" or Cmd+Shift+I
2. ✅ Clicking opens modal with file upload
3. ✅ User can drag & drop image or click to browse
4. ✅ Supports PNG, JPG, WebP formats
5. ✅ Shows preview of uploaded image
6. ✅ Framework selector: React, HTML, Vue
7. ✅ "Generate Code" button calls ImageToCodeService
8. ✅ Loading indicator while AI processes
9. ✅ Generated code appears in panel below
10. ✅ "Insert into Editor" button adds code to current file
11. ✅ "Copy to Clipboard" button

---

## Existing Code

### ImageToCodeService.ts (EXISTS, ENHANCED)
- Converts screenshot to code
- Supports iterative refinement (3 passes for 92% accuracy)
- Puppeteer screenshot comparison
- Multiple framework support

### ScreenshotToCodePanel.tsx (EXISTS, NOT ACCESSIBLE)
- UI component with upload + preview
- Just needs modal trigger

---

## Implementation

### Add Button to Toolbar
```typescript
// src/components/TitleBar.tsx or Toolbar.tsx
<IconButton
  icon={<ImageIcon />}
  tooltip="Upload Screenshot (Cmd+Shift+I)"
  onClick={() => setScreenshotModalOpen(true)}
/>
```

### Wire Modal to App.tsx
```typescript
// src/App.tsx
const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);

<Modal open={screenshotModalOpen} onClose={() => setScreenshotModalOpen(false)}>
  <ScreenshotToCodePanel
    onGenerate={(code) => insertCodeIntoEditor(code)}
    onClose={() => setScreenshotModalOpen(false)}
  />
</Modal>
```

---

## Test Scenarios

```typescript
test('can upload screenshot and generate code', async ({ page }) => {
  // Click upload button
  await page.click('[data-testid="screenshot-upload-button"]');

  // Verify modal opens
  await expect(page.locator('[data-testid="screenshot-modal"]')).toBeVisible();

  // Upload image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./test-fixtures/ui-mockup.png');

  // Verify preview shows
  await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

  // Select framework
  await page.selectOption('[data-testid="framework-selector"]', 'react');

  // Generate code
  await page.click('[data-testid="generate-button"]');

  // Wait for code
  await page.waitForSelector('[data-testid="generated-code"]', { timeout: 15000 });

  // Verify code generated
  const code = await page.textContent('[data-testid="generated-code"]');
  expect(code).toContain('function'); // React component
});
```

---

**Status**: Ready for integration (EASY - 1 hour)
**Next Step**: Add button + modal trigger
