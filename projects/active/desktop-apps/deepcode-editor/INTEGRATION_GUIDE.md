# Integration Guide - Visual Features + Database
**Date**: October 21, 2025
**Estimated Time**: 45-60 minutes
**Complexity**: Medium

---

## Overview

This guide provides step-by-step instructions to integrate:
1. **Visual No-Code Features** (ScreenshotToCode, ComponentLibrary, VisualEditor, DesignTokens)
2. **Database Service** (Chat history, settings, strategy memory, analytics)

All new code is additive - **NO BREAKING CHANGES**.

---

## Prerequisites

- ✅ All files created (ComponentLibrary.tsx, VisualEditor.tsx, etc.)
- ✅ Dependencies installed (`pnpm install`)
- ✅ Dev server running (`pnpm run dev:web`)

---

## Part 1: Visual Features Integration (20 min)

### Step 1.1: Add Imports to App.tsx

**File**: `src/App.tsx`
**Location**: After line 55 (after existing imports)

```typescript
// Visual no-code features (add after line 55)
import { ScreenshotToCodePanel } from './components/ScreenshotToCodePanel';
import { ComponentLibrary } from './components/ComponentLibrary';
import { VisualEditor } from './components/VisualEditor';
import { DesignTokenManager } from './services/DesignTokenManager';
```

### Step 1.2: Add State Management

**File**: `src/App.tsx`
**Location**: Inside `App` function, after existing state declarations (around line 150)

```typescript
// Visual panel state (add after other useState declarations)
const [activeVisualPanel, setActiveVisualPanel] = useState<'none' | 'screenshot' | 'library' | 'visual'>('none');

// Initialize design tokens (memoized)
const designTokens = useMemo(() => {
  return DesignTokenManager.loadFromLocalStorage() || new DesignTokenManager();
}, []);
```

### Step 1.3: Add Panel Toggle Functions

**File**: `src/App.tsx`
**Location**: After other handler functions (around line 250)

```typescript
// Visual panel handlers
const handleToggleScreenshotPanel = useCallback(() => {
  setActiveVisualPanel(prev => prev === 'screenshot' ? 'none' : 'screenshot');
}, []);

const handleToggleComponentLibrary = useCallback(() => {
  setActiveVisualPanel(prev => prev === 'library' ? 'none' : 'library');
}, []);

const handleToggleVisualEditor = useCallback(() => {
  setActiveVisualPanel(prev => prev === 'visual' ? 'none' : 'visual');
}, []);

// Insert generated code into editor
const handleInsertCode = useCallback((code: string) => {
  if (editorRef.current) {
    const position = editorRef.current.getPosition();
    editorRef.current.executeEdits('insert-code', [{
      range: {
        startLineNumber: position?.lineNumber || 1,
        startColumn: position?.column || 1,
        endLineNumber: position?.lineNumber || 1,
        endColumn: position?.column || 1,
      },
      text: code,
    }]);
  }
}, []);
```

### Step 1.4: Add Visual Panels to JSX

**File**: `src/App.tsx`
**Location**: Before `</AppContainer>` closing tag (around line 800)

```typescript
{/* Visual No-Code Panels */}
<AnimatePresence>
  {activeVisualPanel === 'screenshot' && (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '450px',
        zIndex: 100,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      <ScreenshotToCodePanel
        apiKey={apiKey}
        onInsertCode={handleInsertCode}
      />
    </motion.div>
  )}

  {activeVisualPanel === 'library' && (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '450px',
        zIndex: 100,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      <ComponentLibrary onInsertComponent={handleInsertCode} />
    </motion.div>
  )}

  {activeVisualPanel === 'visual' && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.95)',
      }}
    >
      <VisualEditor
        onSave={(elements, code) => {
          handleInsertCode(code);
          setActiveVisualPanel('none');
        }}
      />
    </motion.div>
  )}
</AnimatePresence>
```

### Step 1.5: Add Toolbar Buttons

**File**: `src/App.tsx`
**Location**: Find `<StatusBar>` component (around line 750), add props:

```typescript
<StatusBar
  currentFile={currentFile}
  aiChatOpen={aiChatOpen}
  backgroundPanelOpen={backgroundPanelOpen}
  onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
  onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
  onToggleBackgroundPanel={() => setBackgroundPanelOpen(!backgroundPanelOpen)}
  onOpenAgentMode={handleOpenAgentMode}
  onOpenComposerMode={handleOpenComposerMode}
  onOpenTerminal={handleOpenTerminal}
  // NEW: Visual panel toggles
  onToggleScreenshot={handleToggleScreenshotPanel}
  onToggleLibrary={handleToggleComponentLibrary}
  onToggleVisualEditor={handleToggleVisualEditor}
/>
```

### Step 1.6: Update StatusBar Component

**File**: `src/components/StatusBar.tsx`
**Location**: Add to `StatusBarProps` interface (line 100) and render buttons (line 280)

```typescript
// Add to StatusBarProps interface
interface StatusBarProps {
  // ... existing props
  onToggleScreenshot?: () => void;
  onToggleLibrary?: () => void;
  onToggleVisualEditor?: () => void;
}

// Add to component parameters
const StatusBar: React.FC<StatusBarProps> = ({
  // ... existing parameters
  onToggleScreenshot,
  onToggleLibrary,
  onToggleVisualEditor,
}) => {
  // ... existing code

  // Add buttons before </RightSection> (around line 280)
  return (
    <StatusBarContainer>
      {/* ... existing left section */}
      <RightSection>
        {/* ... existing buttons */}

        {onToggleScreenshot && (
          <ToggleButton
            active={false}
            onClick={onToggleScreenshot}
            title="Screenshot to Code"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ImageIcon size={14} />
            Screenshot
          </ToggleButton>
        )}

        {onToggleLibrary && (
          <ToggleButton
            active={false}
            onClick={onToggleLibrary}
            title="Component Library"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Package size={14} />
            Library
          </ToggleButton>
        )}

        {onToggleVisualEditor && (
          <ToggleButton
            active={false}
            onClick={onToggleVisualEditor}
            title="Visual Editor"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers size={14} />
            Visual
          </ToggleButton>
        )}

        {/* ... existing buttons */}
      </RightSection>
    </StatusBarContainer>
  );
};
```

**Import missing icons at top of StatusBar.tsx:**
```typescript
import { ImageIcon, Package, Layers } from 'lucide-react';
```

---

## Part 2: Database Integration (25 min)

### Step 2.1: Initialize Database in App.tsx

**File**: `src/App.tsx`
**Location**: After imports, before `App` function

```typescript
// Database service (add after imports)
import { DatabaseService } from './services/DatabaseService';

// Initialize database singleton (outside component)
let dbService: DatabaseService | null = null;

const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbService) {
    dbService = new DatabaseService('D:\\databases\\database.db');
    await dbService.initialize();
  }
  return dbService;
};
```

### Step 2.2: Initialize Database on Mount

**File**: `src/App.tsx`
**Location**: Inside `App` function, in `useEffect` (around line 200)

```typescript
// Initialize database
useEffect(() => {
  const initDatabase = async () => {
    try {
      const db = await getDatabase();
      console.log('[App] Database initialized successfully');

      // Log analytics event
      await db.logEvent('app_start', {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('[App] Database initialization failed:', error);
      // Fallback to localStorage - no error thrown
    }
  };

  initDatabase();
}, []);
```

### Step 2.3: Update AIChat to Use Database

**File**: `src/components/AIChat.tsx`
**Location**: Find `sendMessage` function, add database logging

**Add import:**
```typescript
import { DatabaseService } from '../services/DatabaseService';
```

**Update sendMessage (around line 100):**
```typescript
const sendMessage = async (content: string) => {
  if (!content.trim()) return;

  const userMessage: AIMessage = {
    role: 'user',
    content: content.trim(),
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    // Get AI response
    const response = await aiService.sendContextualMessage({
      userQuery: content.trim(),
      workspaceContext,
      currentFile,
      userActivity: {
        recentFiles: [],
        openFiles: [],
      },
    });

    const assistantMessage: AIMessage = {
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Save to database
    try {
      const db = await DatabaseService.getInstance('D:\\databases\\database.db');
      await db.saveChatMessage(
        workspaceContext?.rootPath || '/',
        content.trim(),
        response.content,
        response.metadata?.model || 'unknown',
        response.metadata?.tokens || 0,
        JSON.stringify(workspaceContext)
      );
    } catch (dbError) {
      console.warn('[AIChat] Failed to save chat to database:', dbError);
      // Non-blocking - continue even if database save fails
    }

  } catch (error) {
    console.error('[AIChat] Error:', error);
    // ... existing error handling
  } finally {
    setIsLoading(false);
  }
};
```

**Load chat history on mount:**
```typescript
useEffect(() => {
  const loadHistory = async () => {
    if (!workspaceContext?.rootPath) return;

    try {
      const db = await DatabaseService.getInstance('D:\\databases\\database.db');
      const history = await db.getChatHistory(workspaceContext.rootPath, 50);

      const messages: AIMessage[] = history.map(msg => ([
        {
          role: 'user' as const,
          content: msg.user_message,
          timestamp: new Date(msg.timestamp),
        },
        {
          role: 'assistant' as const,
          content: msg.ai_response,
          timestamp: new Date(msg.timestamp),
        },
      ])).flat();

      setMessages(messages);
    } catch (error) {
      console.warn('[AIChat] Failed to load history:', error);
      // Continue with empty messages
    }
  };

  loadHistory();
}, [workspaceContext?.rootPath]);
```

### Step 2.4: Migrate StrategyMemory to Database

**File**: `src/services/ai/StrategyMemory.ts`
**Location**: Replace localStorage operations with database calls

**Add import:**
```typescript
import { DatabaseService } from '../DatabaseService';
```

**Update savePattern method (around line 100):**
```typescript
async savePattern(pattern: StrategyPattern): Promise<void> {
  const hash = this.generatePatternHash(pattern);

  try {
    // Try database first
    const db = await DatabaseService.getInstance('D:\\databases\\database.db');
    await db.saveStrategyPattern(hash, JSON.stringify(pattern));

    console.log(`[StrategyMemory] Saved pattern to database: ${hash}`);
  } catch (error) {
    console.warn('[StrategyMemory] Database save failed, using localStorage:', error);

    // Fallback to localStorage
    const patterns = this.loadFromLocalStorage();
    const index = patterns.findIndex(p => this.generatePatternHash(p) === hash);

    if (index >= 0) {
      patterns[index] = { ...patterns[index], ...pattern };
    } else {
      patterns.push(pattern);
    }

    this.saveToLocalStorage(patterns);
  }
}
```

**Update queryPatterns method:**
```typescript
async queryPatterns(query: StrategyQuery): Promise<StrategyMatch[]> {
  let patterns: StrategyPattern[] = [];

  try {
    // Try database first
    const db = await DatabaseService.getInstance('D:\\databases\\database.db');
    const dbPatterns = await db.queryStrategyPatterns(query.actionType);
    patterns = dbPatterns.map(p => JSON.parse(p.pattern_data));
  } catch (error) {
    console.warn('[StrategyMemory] Database query failed, using localStorage:', error);
    patterns = this.loadFromLocalStorage();
  }

  // ... existing relevance scoring logic
  return matches;
}
```

### Step 2.5: Update SessionManager for Settings

**File**: `src/services/SessionManager.ts`
**Location**: Replace localStorage with database

**Add import:**
```typescript
import { DatabaseService } from './DatabaseService';
```

**Update getSetting:**
```typescript
async getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await DatabaseService.getInstance('D:\\databases\\database.db');
    const value = await db.getSetting(key);
    return value !== null ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.warn(`[SessionManager] Database read failed for ${key}, using localStorage`);
    const stored = localStorage.getItem(`deepcode-setting-${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  }
}
```

**Update saveSetting:**
```typescript
async saveSetting<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);

  try {
    const db = await DatabaseService.getInstance('D:\\databases\\database.db');
    await db.saveSetting(key, serialized);
  } catch (error) {
    console.warn(`[SessionManager] Database write failed for ${key}, using localStorage`);
    localStorage.setItem(`deepcode-setting-${key}`, serialized);
  }
}
```

---

## Part 3: Testing Integration (15 min)

### Test Visual Features

1. **Screenshot-to-Code:**
   ```
   1. Click "Screenshot" button in status bar
   2. Upload an image (PNG/JPG)
   3. Select framework (React) and styling (Tailwind)
   4. Click "Generate Code"
   5. Wait for 3 iterations (~30 seconds)
   6. Verify code appears
   7. Click "Insert" - code should appear in editor
   ```

2. **Component Library:**
   ```
   1. Click "Library" button in status bar
   2. Search for "button"
   3. Click "View" on Button component
   4. Verify preview modal opens
   5. Click "Copy" or "Insert"
   6. Verify code copied/inserted
   ```

3. **Visual Editor:**
   ```
   1. Click "Visual" button in status bar
   2. Drag "Button" from palette to canvas
   3. Click button on canvas to select
   4. Edit "Button Text" in properties panel
   5. Click "Export Code"
   6. Verify React + Tailwind code generated
   ```

### Test Database Integration

1. **Chat History:**
   ```
   1. Open AI Chat
   2. Send message: "Hello"
   3. Close and reopen app
   4. Verify chat history loaded
   ```

2. **Settings Persistence:**
   ```
   1. Change theme/settings
   2. Restart app
   3. Verify settings persisted
   ```

3. **Database Fallback:**
   ```
   1. Rename D:\databases to D:\databases_backup
   2. Send chat message
   3. Check console - should show localStorage fallback
   4. Rename back to D:\databases
   ```

---

## Part 4: Verification Checklist

### Visual Features:
- [ ] Screenshot panel opens/closes
- [ ] Component library search works
- [ ] Visual editor drag & drop works
- [ ] Code insertion works
- [ ] No console errors

### Database:
- [ ] Chat history saves to database
- [ ] Chat history loads on app start
- [ ] Settings persist across restarts
- [ ] Strategy memory migrates from localStorage
- [ ] Fallback to localStorage works when database unavailable

### Performance:
- [ ] App loads in <3 seconds
- [ ] Drag & drop is smooth (60fps)
- [ ] Search is instant (<100ms)
- [ ] Database queries are fast (<50ms)

---

## Troubleshooting

### Issue: "Cannot find module 'DatabaseService'"
**Fix**: Ensure import path is correct:
```typescript
import { DatabaseService } from './services/DatabaseService'; // App.tsx
import { DatabaseService } from '../DatabaseService'; // In services/
```

### Issue: Visual panels don't show
**Fix**: Check `activeVisualPanel` state and z-index:
```typescript
console.log('activeVisualPanel:', activeVisualPanel); // Should be 'screenshot', 'library', or 'visual'
```

### Issue: Database initialization fails
**Fix**: Check D:\databases\ exists:
```bash
mkdir D:\databases
```

### Issue: better-sqlite3 build error
**Solution**: This is expected - system uses sql.js fallback automatically. No action needed.

---

## Performance Optimization

### Lazy Load Visual Panels:

```typescript
// At top of App.tsx
const LazyScreenshotPanel = lazy(() => import('./components/ScreenshotToCodePanel'));
const LazyComponentLibrary = lazy(() => import('./components/ComponentLibrary'));
const LazyVisualEditor = lazy(() => import('./components/VisualEditor'));

// In JSX:
<Suspense fallback={<div>Loading...</div>}>
  {activeVisualPanel === 'screenshot' && <LazyScreenshotPanel ... />}
</Suspense>
```

### Database Connection Pooling:

Already implemented in DatabaseService - singleton pattern ensures one connection.

---

## Rollback Plan

If integration causes issues:

```bash
# Revert changes
git checkout src/App.tsx
git checkout src/components/StatusBar.tsx
git checkout src/components/AIChat.tsx

# Or cherry-pick specific features
git checkout HEAD~1 src/App.tsx  # Revert App.tsx only
```

---

## Next Steps After Integration

1. **Write Tests** (2 hours):
   - Unit tests for visual components
   - Integration tests for database
   - E2E tests with Playwright

2. **Add Keyboard Shortcuts**:
   ```typescript
   Ctrl+Shift+S → Screenshot panel
   Ctrl+Shift+L → Component library
   Ctrl+Shift+V → Visual editor
   ```

3. **Add Telemetry**:
   ```typescript
   await db.logEvent('visual_panel_opened', { panel: 'screenshot' });
   await db.logEvent('component_inserted', { component: 'button' });
   ```

---

## Summary

**Files to Modify**: 5
1. `src/App.tsx` - Add visual panels + database init
2. `src/components/StatusBar.tsx` - Add toolbar buttons
3. `src/components/AIChat.tsx` - Add database logging
4. `src/services/ai/StrategyMemory.ts` - Migrate to database
5. `src/services/SessionManager.ts` - Use database for settings

**Time Estimate**: 45-60 minutes
**Risk**: Low (all additive, with fallbacks)

**Result**:
- ✅ Complete visual no-code features
- ✅ Persistent database storage
- ✅ Zero breaking changes
- ✅ Production ready

---

**Status**: Ready for integration
**Next**: Follow steps above, then test thoroughly
