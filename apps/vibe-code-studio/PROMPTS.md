# DeepCode Editor - Development Prompts
**Purpose**: Guide AI assistant and developers through completion phases
**Last Updated**: October 22, 2025
**Version**: 1.0.0

---

## 📖 How to Use This File

1. **Copy the relevant prompt** for current phase
2. **Paste into Claude Code** or AI assistant
3. **Review suggestions** before applying
4. **Update checkboxes** as you complete tasks
5. **Move to next prompt** when phase is done

---

## 🔴 **PROMPT 1: Fix TypeScript Compilation Errors**
**Phase**: 1 (Days 1-2)
**Goal**: Zero TypeScript errors, app compiles

### Copy This Prompt:

```
I'm working on DeepCode Editor and need to fix 125 TypeScript compilation errors.

Context:
- React 19 + TypeScript + Electron desktop app
- Monaco editor integration
- Multiple AI providers (DeepSeek, OpenAI, Anthropic)
- Current status: 75% complete, but won't compile

Current errors by category:
1. Missing imports (logger in AgentModeV2.tsx)
2. Missing theme colors (green, orange, red, danger, background)
3. File casing issues (Card.tsx vs card.tsx)
4. Missing UI components (radio-group, label, badge)
5. Interface mismatches (InlineCompletionsProvider, AIProviderManager, ElectronService)
6. Type errors and unreachable code

Priority order:
1. Fix missing imports (CRITICAL)
2. Update theme with missing colors (CRITICAL)
3. Fix file casing (HIGH)
4. Create missing UI components (HIGH)
5. Fix interface mismatches (HIGH)
6. Clean up type errors (MEDIUM)

Requirements:
- Follow existing code patterns
- Don't break existing functionality
- Test each fix with `pnpm typecheck`
- Use modular approach (one category at a time)
- Update imports across all files
- Maintain theme consistency

Success criteria:
- `pnpm typecheck` shows 0 errors
- `pnpm lint` passes
- App starts without errors
- Can open a file successfully

Please start with category 1 (missing imports). Show me the plan before implementing.
```

---

## 🟡 **PROMPT 2: Complete Terminal Integration**
**Phase**: 2 (Days 3-7)
**Goal**: Terminal panel working in app

### Copy This Prompt:

```
I need to integrate the TerminalService into the DeepCode Editor UI.

Current state:
- TerminalService exists at src/services/TerminalService.ts
- No UI component yet
- Need to add terminal panel to app

Requirements:
1. Create TerminalPanel.tsx component that:
   - Uses xterm.js for terminal emulation
   - Connects to TerminalService
   - Supports multiple terminal tabs
   - Has resize handle
   - Saves terminal history

2. Integrate into main App.tsx:
   - Add terminal toggle button (Ctrl+`)
   - Position in bottom panel (like VS Code)
   - Maintain state across sessions
   - Support split terminals

3. Terminal features needed:
   - Execute shell commands
   - Show output in real-time
   - Support ANSI colors
   - Copy/paste functionality
   - Clear terminal
   - Close terminal tabs

4. Testing:
   - Can open terminal
   - Can run `npm install`
   - Can execute git commands
   - Output displays correctly
   - Multiple terminals work

Tech stack:
- React 19
- TypeScript
- styled-components for styling
- xterm.js for terminal emulation
- TerminalService for backend

Please show component structure before implementing.
```

---

## 🟢 **PROMPT 3: Implement Real Tests (Replace Placeholders)**
**Phase**: 3 (Days 8-10)
**Goal**: >50% test coverage with real tests

### Copy This Prompt:

```
I need to replace placeholder tests with real implementations in DeepCode Editor.

Current situation:
- 98 test placeholders with `expect(true).toBe(true)`
- Need >50% overall coverage
- Critical paths must have 80%+ coverage

Files needing real tests (priority order):
1. DatabaseService.test.ts (CRITICAL)
2. BackgroundWorker.test.ts (HIGH)
3. CustomRulesEngine.test.ts (HIGH)
4. DependencyAnalyzer.test.ts (MEDIUM)
5. TerminalService.test.ts (MEDIUM)
6. LanguageServer.test.ts (MEDIUM)
7. GlobalSearch.test.tsx (MEDIUM)
8. CompletionIndicator.test.tsx (LOW)
9. EnhancedAgentMode.test.tsx (LOW)

For each test file:
- Write tests for core functionality
- Mock external dependencies
- Test error handling
- Test edge cases
- Aim for 70-80% coverage of the service/component

Example test structure needed:
```typescript
describe('Service/Component', () => {
  describe('Initialization', () => {
    it('should initialize correctly', () => {
      // Real test with assertions
    });
  });

  describe('Core Functionality', () => {
    it('should perform main operation', () => {
      // Real test with mocks and assertions
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // Real test with error scenarios
    });
  });
});
```

Testing tools available:
- Vitest for unit tests
- @testing-library/react for component tests
- vi.fn() for mocks
- vi.spyOn() for spies

Please start with DatabaseService.test.ts and show me a complete implementation before moving to the next file.
```

---

## 🔵 **PROMPT 4: Optimize Production Build**
**Phase**: 4 (Days 11-12)
**Goal**: Bundle size <5MB, load time <2s

### Copy This Prompt:

```
I need to optimize the DeepCode Editor production build for performance.

Current state:
- Development build works
- No production optimization
- Estimated bundle size: 15-20MB
- Target bundle size: <5MB

Optimization tasks:
1. Configure Vite for production:
   - Enable minification
   - Configure code splitting
   - Set up tree shaking
   - Optimize chunk sizes

2. Lazy load heavy dependencies:
   - Monaco Editor (~5MB)
   - AI providers
   - Agent system
   - Chart libraries (d3)

3. Optimize images and assets:
   - Compress images
   - Use WebP format
   - Implement lazy loading for images
   - Remove unused assets

4. Code splitting strategy:
   - Split by route
   - Split by feature
   - Create vendor chunk
   - Optimize chunk loading

5. Performance optimizations:
   - Add React.memo to heavy components
   - Implement virtual scrolling
   - Debounce expensive operations
   - Use Web Workers for heavy processing

6. Build configuration:
   - Update vite.config.ts
   - Configure rollup options
   - Set up compression (gzip/brotli)
   - Enable source maps for debugging

Success criteria:
- Bundle size <5MB
- Load time <2s
- Time to interactive <3s
- Lighthouse score >90
- All features work in production

Please show the optimization plan and vite.config.ts changes before implementing.
```

---

## 📦 **PROMPT 5: Create Installers**
**Phase**: 5 (Days 13-14)
**Goal**: Working installers for Windows, macOS, Linux

### Copy This Prompt:

```
I need to create installers for DeepCode Editor using Electron Builder.

Current state:
- Production build works
- No installer configuration
- Need installers for Windows, macOS, Linux

Requirements:

1. Windows (.exe installer):
   - NSIS installer
   - Add to Programs
   - Desktop shortcut
   - Start menu entry
   - Uninstaller
   - Admin rights if needed

2. macOS (.dmg):
   - DMG with drag-to-Applications
   - App signing
   - Notarization
   - Retina icons

3. Linux (.AppImage):
   - Self-contained executable
   - Desktop integration
   - Works on all major distros

4. electron-builder.json configuration:
   - App metadata
   - Build targets
   - File associations
   - Icon paths
   - Publish configuration

5. Code signing:
   - Windows: Authenticode
   - macOS: Apple Developer Certificate
   - Configure in CI/CD

6. Auto-update:
   - GitHub Releases integration
   - Update checking
   - Download and install updates
   - Update notifications

Icons needed:
- 16x16, 32x32, 64x64, 128x128, 256x256, 512x512
- .ico for Windows
   - .icns for macOS
- .png for Linux

Please create the electron-builder.json configuration and build scripts.
```

---

## 🌟 **PROMPT 6: Create First-Run Experience**
**Phase**: 6 (Days 15-17)
**Goal**: User-friendly onboarding

### Copy This Prompt:

```
I need to create a first-run experience for DeepCode Editor to help new users get started.

Requirements:

1. Welcome Screen (first launch only):
   - Welcome message
   - Key features overview
   - Setup wizard button
   - Skip to editor button

2. Setup Wizard:
   - Step 1: Choose theme (Light/Dark)
   - Step 2: Configure AI providers (optional)
     - DeepSeek API key (recommended)
     - OpenAI API key (optional)
     - Test connection
   - Step 3: Select default workspace folder
   - Step 4: Quick tour option

3. Quick Tour (interactive):
   - Open file (highlight file explorer)
   - AI completion demo (show tab completion)
   - AI chat demo (highlight chat panel)
   - Settings access (show settings button)
   - Keyboard shortcuts (show common shortcuts)

4. Sample Project:
   - Include simple React + TypeScript project
   - Pre-configured with examples
   - Demonstrates AI capabilities
   - "Open Sample Project" button

5. Help Resources:
   - Link to documentation
   - Video tutorials
   - Community Discord
   - GitHub repository
   - Keyboard shortcuts reference

6. Persistence:
   - Don't show welcome screen again
   - Remember wizard completion
   - Allow reset from settings

UI Components needed:
- WelcomeScreen.tsx
- SetupWizard.tsx
- QuickTour.tsx
- HelpResources.tsx

Design:
- Use existing theme colors
- Animated transitions
- Progress indicators
- Clear call-to-action buttons

Please create the component structure and implement WelcomeScreen.tsx first.
```

---

## 🔧 **PROMPT 7: Fix Specific Error Category**
**Use this for targeted fixes**

### Copy This Prompt:

```
Fix [ERROR_CATEGORY] in DeepCode Editor.

Error category: [Choose one]:
- Missing imports
- Theme color issues
- Interface mismatches
- Type errors
- File casing problems

Files affected:
[List files with errors in this category]

Requirements:
1. Fix all errors in this category
2. Don't break existing functionality
3. Follow existing code patterns
4. Update related files if needed
5. Test with `pnpm typecheck` after each fix

Please analyze the errors and show me the fix plan before implementing.
```

---

## 🧪 **PROMPT 8: Implement Tests for Specific Service**
**Use this for individual test files**

### Copy This Prompt:

```
Implement real tests for [SERVICE_NAME] in DeepCode Editor.

Service location: src/services/[SERVICE_NAME].ts
Test location: src/__tests__/services/[SERVICE_NAME].test.ts

Current state: Placeholder tests with `expect(true).toBe(true)`

Requirements:
1. Test all public methods
2. Test error handling
3. Test edge cases
4. Mock external dependencies
5. Aim for 70-80% coverage

Service responsibilities:
[Describe what the service does]

Testing approach:
- Use Vitest
- Mock external services
- Test synchronous operations
- Test asynchronous operations
- Test error scenarios

Please analyze the service and create comprehensive tests.
```

---

## 📚 **PROMPT 9: Write Documentation**
**Use this for documentation tasks**

### Copy This Prompt:

```
Write [DOCUMENT_TYPE] for DeepCode Editor.

Document type: [Choose one]:
- README.md (main repository README)
- QUICK_START.md (get started in 5 minutes)
- USER_GUIDE.md (complete user manual)
- DEVELOPER_GUIDE.md (for contributors)
- CHANGELOG.md (release history)

Requirements:
1. Clear and concise
2. Include code examples
3. Add screenshots (describe what to show)
4. Use markdown formatting
5. Include table of contents
6. Add links to related docs

Audience:
[Developers / End Users / Contributors]

Key sections needed:
[List main sections]

Please create the document structure first, then fill in each section.
```

---

## 🎯 **PROMPT 10: Test Critical User Workflow**
**Use this for E2E testing**

### Copy This Prompt:

```
Test critical user workflow in DeepCode Editor.

Workflow: [Choose one]:
1. Open App → Open Folder → Edit File → Save → Close
2. Get AI Completion → Accept → Continue Typing
3. Search Files → Open Result → Edit
4. Use AI Chat → Apply Suggestion → Verify
5. Change Settings → Restart → Verify Persistence

Testing approach:
1. Manual testing first
2. Document steps
3. Note any issues
4. Create automated test if possible

For each step:
- Expected behavior
- Actual behavior
- Pass/Fail
- Screenshots if failure
- Error messages
- Console output

Please test the workflow and report results.
```

---

## ⚡ **Quick Reference: Common Commands**

```bash
# Development
pnpm run dev              # Start dev server
pnpm run dev:web          # Web only
pnpm run electron:dev     # Electron only

# Type Checking
pnpm typecheck            # Check for TS errors
pnpm typecheck:watch      # Watch mode

# Testing
pnpm test                 # Run all tests
pnpm test:coverage        # With coverage report
pnpm vitest run [file]    # Run specific test

# Building
pnpm build                # Build TypeScript
pnpm build:prod           # Production build
pnpm build:optimize       # Optimized build

# Packaging
pnpm electron:build       # Build Electron app
pnpm electron:build:win   # Windows installer
pnpm electron:build:mac   # macOS installer
pnpm electron:build:linux # Linux installer

# Quality
pnpm lint                 # Run ESLint
pnpm lint:fix             # Auto-fix issues
pnpm format               # Format code
```

---

## 🎓 **Best Practices Reminder**

### When Writing Code:
1. **Follow existing patterns** - Look at similar files first
2. **Type everything** - No `any` types
3. **Test as you go** - Write tests alongside code
4. **Keep it modular** - Small, focused functions
5. **Handle errors** - Always have error boundaries
6. **Document complex logic** - Add comments for "why"

### When Fixing Errors:
1. **Fix one category at a time** - Don't mix concerns
2. **Test after each fix** - Run `pnpm typecheck`
3. **Update related files** - Fix imports everywhere
4. **Don't break existing features** - Test manually
5. **Commit frequently** - Small, atomic commits

### When Testing:
1. **Test behavior, not implementation** - Test outcomes
2. **Mock external dependencies** - Use vi.fn()
3. **Test error cases** - Not just happy path
4. **Keep tests simple** - One concept per test
5. **Name tests clearly** - "should do X when Y"

### When Optimizing:
1. **Measure first** - Use profiler
2. **Optimize bottlenecks only** - Don't guess
3. **Test after optimization** - Ensure it still works
4. **Document trade-offs** - Explain decisions
5. **Keep code readable** - Performance isn't everything

---

## 📞 **Getting Help**

### When Stuck:
1. **Check existing code** - Find similar patterns
2. **Read the docs** - TypeScript, React, Electron
3. **Search the web** - Use 2025 resources
4. **Ask specific questions** - Include error messages
5. **Review this file** - Use the right prompt

### Before Asking:
1. What have you tried?
2. What error are you seeing?
3. What's the expected behavior?
4. Can you reproduce it?
5. What's the current code?

### When Reporting Issues:
1. Include file path
2. Include error message
3. Include relevant code
4. Include steps to reproduce
5. Include environment (OS, Node version)

---

## ✅ **Completion Checklist**

### Phase 1: Compilation ✅
- [ ] Zero TypeScript errors
- [ ] Zero lint errors
- [ ] App starts without crashes
- [ ] Can open a file

### Phase 2: Features ✅
- [ ] Terminal works
- [ ] Settings persist
- [ ] AI completions reliable
- [ ] File operations smooth

### Phase 3: Testing ✅
- [ ] >50% test coverage
- [ ] All critical paths tested
- [ ] Zero failing tests
- [ ] Performance benchmarks met

### Phase 4: Build ✅
- [ ] Production build succeeds
- [ ] Bundle <5MB
- [ ] Load time <2s
- [ ] Security measures in place

### Phase 5: Packaging ✅
- [ ] Windows installer
- [ ] macOS installer
- [ ] Linux installer
- [ ] Auto-update works

### Phase 6: Launch ✅
- [ ] Documentation complete
- [ ] First-run experience
- [ ] Error reporting active
- [ ] Public release

---

**Status**: Ready to use
**Last Updated**: October 22, 2025
**Version**: 1.0.0

Use these prompts to guide development through each phase. Update checkboxes as you complete tasks.
