# Feature Spec: Multi-File Edit Approval UI

**Status**: 🟡 Backend Exists (MultiFileEditor.ts), No UI
**Priority**: MEDIUM (Cursor parity feature)
**Effort**: 1 day
**Dependencies**: MultiFileEditor service, Diff view component

---

## User Story

As a developer using AI to refactor across multiple files,
I want to see all proposed changes in a diff view before applying them,
So that I can review and selectively approve/reject changes.

---

## Acceptance Criteria

1. ✅ AI proposes changes to multiple files
2. ✅ Approval UI appears showing list of affected files
3. ✅ Clicking file shows side-by-side diff
4. ✅ User can approve individual files or all at once
5. ✅ User can reject individual files or all at once
6. ✅ "Apply Selected" button applies only approved changes
7. ✅ Preview shows how many lines added/removed per file

---

## Existing Code

### MultiFileEditor.ts (EXISTS)
```typescript
interface MultiFileEdit {
  files: FileEdit[];
  description: string;
}

interface FileEdit {
  path: string;
  originalContent: string;
  modifiedContent: string;
  diff: Diff[];
}

class MultiFileEditor {
  async proposeEdit(files: string[], instruction: string): Promise<MultiFileEdit>;
  async applyEdit(edit: MultiFileEdit, selectedFiles?: string[]): Promise<void>;
}
```

---

## Implementation

### New Component: MultiFileEditApprovalPanel.tsx

```typescript
interface MultiFileEditApprovalPanelProps {
  edit: MultiFileEdit;
  onApply: (selectedFiles: string[]) => void;
  onReject: () => void;
}

function MultiFileEditApprovalPanel({ edit, onApply, onReject }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(edit.files.map(f => f.path))  // All selected by default
  );
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  return (
    <Panel>
      <Header>
        <h3>Multi-File Changes ({edit.files.length} files)</h3>
        <p>{edit.description}</p>
      </Header>

      <FileList>
        {edit.files.map(file => (
          <FileItem key={file.path}>
            <Checkbox
              checked={selectedFiles.has(file.path)}
              onChange={() => toggleFile(file.path)}
            />
            <FileName onClick={() => setPreviewFile(file.path)}>
              {file.path}
            </FileName>
            <DiffStats>
              +{countAdded(file.diff)} -{countRemoved(file.diff)}
            </DiffStats>
          </FileItem>
        ))}
      </FileList>

      {previewFile && (
        <DiffPreview file={findFile(previewFile)} />
      )}

      <Actions>
        <Button onClick={() => onApply(Array.from(selectedFiles))}>
          Apply Selected ({selectedFiles.size})
        </Button>
        <Button onClick={onReject} variant="secondary">
          Reject All
        </Button>
      </Actions>
    </Panel>
  );
}
```

---

## Test Scenarios

```typescript
test('multi-file edit shows approval UI', async ({ page }) => {
  // Trigger multi-file refactor
  // (via AI chat or Cmd+K with multiple files)

  // Verify approval panel appears
  await expect(page.locator('[data-testid="multi-file-approval"]')).toBeVisible();

  // Verify files listed
  const fileCount = await page.locator('.file-item').count();
  expect(fileCount).toBeGreaterThan(1);
});

test('can approve/reject individual files', async ({ page }) => {
  // ... show approval UI ...

  // Uncheck first file
  await page.click('.file-item:first-child input[type="checkbox"]');

  // Apply
  await page.click('[data-testid="apply-button"]');

  // Verify only selected files changed
  // (first file should be unchanged)
});
```

---

**Status**: Ready for implementation
**Next Step**: Create MultiFileEditApprovalPanel component
