# Regression Prevention Workflow - Root Cause Analysis & Fixes

**Date**: 2025-10-22
**Issue**: Settings icon onClick handler removed in commit `f2952eb4` without detection

## Root Cause Analysis

### 1. Pre-commit Hooks Not Installed ❌ CRITICAL

**Finding**: No `.husky` directory exists despite husky being in devDependencies.

**Evidence**:
```bash
$ dir .husky
No .husky directory found
```

**Impact**: Pre-commit hooks NEVER run, allowing any code to be committed without validation.

**Why This Happened**:
- `package.json` has `"prepare": "husky install || true"`
- The `|| true` allows silent failure
- Developers may have skipped `pnpm install` or manually deleted `.husky`

**Fix Applied**:
```bash
pnpm husky install
pnpm husky add .husky/pre-commit "pnpm lint-staged"
```

---

### 2. lint-staged Doesn't Run Tests ⚠️ HIGH PRIORITY

**Finding**: `.lintstagedrc.js` only runs ESLint and Prettier, NO tests.

**Current Configuration**:
```javascript
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',  // Only linting
    'prettier --write',                // Only formatting
  ],
  // NO TEST EXECUTION
};
```

**Impact**: Component changes can be committed without running tests that would catch broken onClick handlers.

**Why This Matters**:
- Tests exist for Sidebar (`src/__tests__/components/Sidebar.test.tsx`)
- Tests were not executed during commit
- Regression went undetected

**Recommended Fix** (NOT automatically applied - requires team decision):

**Option A: Run tests on all staged files (slower but safer)**
```javascript
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    'vitest related --run',  // Run tests for affected files
  ],
};
```

**Option B: Run full test suite (slowest but most comprehensive)**
```javascript
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],
  // Add separate command in .husky/pre-commit:
  // pnpm test --run
};
```

**Option C: Only run tests for component files (balanced approach)**
```javascript
module.exports = {
  'src/components/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    'vitest related --run',
  ],
  'src/**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],
};
```

**Team Decision Required**: Choose Option A, B, or C based on:
- Commit speed vs safety trade-off
- CI/CD pipeline capabilities
- Developer workflow preferences

---

### 3. Optional Prop in TypeScript Interface ⚠️ MEDIUM PRIORITY

**Finding**: `Sidebar.tsx:242` defines `onShowSettings` as optional.

**Code**:
```typescript
interface SidebarProps {
  workspaceFolder: string | null;
  onOpenFile: (path: string) => void;
  onToggleAIChat: () => void;
  aiChatOpen: boolean;
  fileSystemService?: FileSystemService;
  onDeleteFile?: (path: string) => Promise<void>;
  onOpenFolder?: () => void;
  onShowSettings?: () => void;  // ⚠️ Optional prop
}
```

**Usage in Component** (`Sidebar.tsx:492-494`):
```tsx
<IconButton
  variant="ghost"
  size="md"
  icon={<Settings size={18} />}
  aria-label="Settings"
  onClick={onShowSettings}  // ⚠️ Could be undefined
/>
```

**Impact**: TypeScript won't catch when parent component doesn't provide `onShowSettings`.

**Why TypeScript Didn't Catch This**:
- `strict: true` in `tsconfig.json:47` is enabled
- BUT optional props (`?`) are allowed to be undefined
- This is valid TypeScript even in strict mode

**Recommended Fix** (NOT automatically applied - requires review):

**Option 1: Make prop required**
```typescript
interface SidebarProps {
  // ... other props
  onShowSettings: () => void;  // ✅ Required
}
```

**Option 2: Add runtime check**
```tsx
<IconButton
  variant="ghost"
  size="md"
  icon={<Settings size={18} />}
  aria-label="Settings"
  onClick={onShowSettings || (() => console.warn('Settings handler not provided'))}
/>
```

**Option 3: Conditionally render button**
```tsx
{onShowSettings && (
  <IconButton
    variant="ghost"
    size="md"
    icon={<Settings size={18} />}
    aria-label="Settings"
    onClick={onShowSettings}
  />
)}
```

**Recommendation**: Use **Option 1** if Settings is a core feature, **Option 3** if it's optional.

---

### 4. Missing Test Coverage for Settings Button ❌ CRITICAL

**Finding**: `src/__tests__/components/Sidebar.test.tsx` has NO test for Settings button.

**What's Tested**:
- ✅ AI Chat button (lines 189-220)
- ✅ File tree navigation
- ✅ Search functionality
- ❌ **Settings button onClick handler** - MISSING

**What Should Be Tested**:
```typescript
describe('Settings Button', () => {
  it('should render Settings button', () => {
    render(<Sidebar {...defaultProps} />);
    const settingsButton = screen.getByLabelText('Settings');
    expect(settingsButton).toBeInTheDocument();
  });

  it('should call onShowSettings when Settings button is clicked', async () => {
    const user = userEvent.setup();
    const onShowSettings = vi.fn();
    render(<Sidebar {...defaultProps} onShowSettings={onShowSettings} />);

    const settingsButton = screen.getByLabelText('Settings');
    await user.click(settingsButton);

    expect(onShowSettings).toHaveBeenCalledTimes(1);
  });

  it('should not render Settings button if onShowSettings is undefined', () => {
    render(<Sidebar {...defaultProps} onShowSettings={undefined} />);
    // Depending on implementation choice from Fix #3
  });
});
```

**Fix Applied**: See next section for test additions.

---

## Fixes Applied

### ✅ 1. Installed Husky Hooks
```bash
pnpm husky install
```

### ✅ 2. Created Pre-commit Hook
File: `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

### ⏳ 3. Added Settings Button Tests
File: `src/__tests__/components/Sidebar.test.tsx`

---

## Prevention Checklist for Future Development

### Before Committing Code:

- [ ] Run `pnpm test` locally
- [ ] Verify `.husky` directory exists
- [ ] Check that pre-commit hook runs (you'll see "lint-staged" output)
- [ ] If hook is slow, consider `git commit -m "..." --no-verify` ONLY for emergency hotfixes

### When Adding New UI Components:

- [ ] Add onClick handler tests for ALL interactive elements
- [ ] Make required props **required** (no `?` unless truly optional)
- [ ] Add JSDoc comments explaining when optional props can be undefined

### When Refactoring Components:

- [ ] Run `pnpm test` before and after changes
- [ ] Check test coverage with `pnpm test -- --coverage`
- [ ] If coverage drops, add missing tests before committing

### CI/CD Pipeline Improvements:

- [ ] Consider adding GitHub Actions to run tests on PRs
- [ ] Add test coverage reporting (e.g., Codecov)
- [ ] Block PRs with failing tests or coverage below threshold

---

## Verification

### Test the Pre-commit Hook:

1. Make a small change to any `.ts` or `.tsx` file
2. Stage the file: `git add <file>`
3. Try to commit: `git commit -m "test"`
4. You should see:
   ```
   ✔ Preparing lint-staged...
   ✔ Running tasks for staged files...
   ✔ Applying modifications...
   ✔ Cleaning up temporary files...
   ```

### Test the Settings Button:

1. Run tests: `pnpm test src/__tests__/components/Sidebar.test.tsx`
2. All tests should pass
3. Check for new "Settings Button" describe block

---

## Recommended Actions (Team Decision Required)

1. **Choose lint-staged test strategy** (Options A, B, or C from Fix #2)
2. **Decide on optional prop strategy** (Make required, runtime check, or conditional render)
3. **Set up CI/CD** to run tests on every PR
4. **Add test coverage threshold** (recommend 80%+)
5. **Document testing requirements** in CONTRIBUTING.md

---

## Summary

**4 Critical Gaps Identified:**
1. ❌ Pre-commit hooks not installed → **FIXED**
2. ⚠️ lint-staged doesn't run tests → **ACTION REQUIRED**
3. ⚠️ Optional props bypass TypeScript → **ACTION REQUIRED**
4. ❌ Missing test coverage → **FIXING NOW**

**Immediate Impact:**
- Pre-commit hooks now prevent commits without linting
- Tests will be added to catch Settings button regressions

**Long-term Improvements Needed:**
- Decide on test execution strategy
- Review all optional props in component interfaces
- Set up comprehensive CI/CD pipeline

---

## Related Files

- `package.json` - Contains husky and lint-staged config
- `.lintstagedrc.js` - Lint-staged rules (needs test addition)
- `tsconfig.json` - TypeScript strict mode configuration
- `src/components/Sidebar.tsx` - Component with optional prop
- `src/__tests__/components/Sidebar.test.tsx` - Test file with gap
- `.husky/pre-commit` - Git pre-commit hook (newly created)

---

**Next Steps**: Run `pnpm test` to verify all tests pass, then make a test commit to verify hooks work.
