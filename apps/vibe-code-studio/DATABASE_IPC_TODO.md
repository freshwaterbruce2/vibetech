# TODO: Complete DatabaseService IPC Integration

## Context
- **Issue**: [#4](https://github.com/freshbreezedesigns/dev/issues/4) - better-sqlite3 import error in Electron renderer process
- **Status**: IPC infrastructure complete (committed in 753f5187), 15+ methods need conversion
- **Commit**: feat(database): Add IPC infrastructure for better-sqlite3 (partial fix for #4)

## What's Complete ✅
- `electron/main.ts` - Database initialization, cleanup, and IPC handlers (db:query, db:initialize)
- `electron/preload.ts` - Exposed `window.electron.db` API via contextBridge
- `electron/database-handler.ts` - Main process better-sqlite3 operations
- `DatabaseService.connect()` - Uses IPC with localStorage fallback (lines 160-183)

## Remaining Work (15+ Methods)

All methods below need to replace `this.db.prepare().run/all/get()` with `await window.electron.db.query(sql, params)`.

### Chat Methods
1. **saveChatMessage()** - Line 208-227
   - Current: `this.db.prepare(sql).run(sessionId, role, content, timestamp)`
   - Change to: `await window.electron.db.query(sql, [sessionId, role, content, timestamp])`

2. **getChatHistory()** - Line 250-271
   - Current: `this.db.prepare(sql).all(sessionId, limit)`
   - Change to: `await window.electron.db.query(sql, [sessionId, limit])`

3. **clearChatHistory()** - Line 285-295
   - Current: `this.db.prepare(sql).run(sessionId)`
   - Change to: `await window.electron.db.query(sql, [sessionId])`

### Snippet Methods
4. **saveSnippet()** - Line 323-335
   - Current: `this.db.prepare(sql).run(id, title, language, content, tags, timestamp)`
   - Change to: `await window.electron.db.query(sql, [id, title, language, content, tags, timestamp])`

5. **searchSnippets()** - Line 367-388
   - Current: `this.db.prepare(sql).all(searchPattern, tags, limit)`
   - Change to: `await window.electron.db.query(sql, [searchPattern, tags, limit])`

6. **incrementSnippetUsage()** - Line 404-413
   - Current: `this.db.prepare(sql).run(snippetId, Date.now())`
   - Change to: `await window.electron.db.query(sql, [snippetId, Date.now()])`

### Settings Methods
7. **getSetting()** - Line 431-442
   - Current: `this.db.prepare(sql).get(key)`
   - Change to: `await window.electron.db.query(sql, [key])`
   - Note: Returns first row of result array

8. **setSetting()** - Line 461-470
   - Current: `this.db.prepare(sql).run(key, value, Date.now())`
   - Change to: `await window.electron.db.query(sql, [key, value, Date.now()])`

9. **getAllSettings()** - Line 484-502
   - Current: `this.db.prepare(sql).all()`
   - Change to: `await window.electron.db.query(sql, [])`

### Analytics Methods
10. **logEvent()** - Line 523-532
    - Current: `this.db.prepare(sql).run(eventType, category, data, Date.now())`
    - Change to: `await window.electron.db.query(sql, [eventType, category, data, Date.now()])`

11. **getAnalytics()** - Line 568-590
    - Current: `this.db.prepare(sql).all(startDate, endDate)`
    - Change to: `await window.electron.db.query(sql, [startDate, endDate])`

### Pattern Learning Methods
12. **savePattern()** - Line 654-678
    - Current: `this.db.prepare(sql).run(pattern, context, suggestion, confidence, timestamp)`
    - Change to: `await window.electron.db.query(sql, [pattern, context, suggestion, confidence, timestamp])`

13. **queryPatterns()** - Line 696-726
    - Current: `this.db.prepare(sql).all(pattern, minConfidence, limit)`
    - Change to: `await window.electron.db.query(sql, [pattern, minConfidence, limit])`

14. **updatePatternSuccess()** - Line 741-763
    - Current: `this.db.prepare(sql).get(patternId)` then `.run(newConfidence, newUsageCount, patternId)`
    - Change to: Two IPC calls with proper result handling

### Schema Initialization
15. **initializeSchema()** - Line 191-202
    - Current: Multiple `this.db.prepare(sql).run()` calls
    - Change to: Multiple `await window.electron.db.query(sql, [])` calls

## Pattern to Follow

### Before (better-sqlite3 Direct):
```typescript
private async saveExample(): Promise<void> {
  const sql = `INSERT INTO table (col1, col2) VALUES (?, ?)`;
  const result = this.db.prepare(sql).run(value1, value2);
  return result;
}
```

### After (IPC):
```typescript
private async saveExample(): Promise<void> {
  const sql = `INSERT INTO table (col1, col2) VALUES (?, ?)`;
  const result = await window.electron.db.query(sql, [value1, value2]);

  if (!result.success) {
    throw new Error(result.error || 'Database operation failed');
  }

  return result;
}
```

## Testing Checklist
After each method conversion:
- [ ] Verify IPC call syntax is correct
- [ ] Check parameter array matches SQL placeholders
- [ ] Add error handling for failed queries
- [ ] Test method works in running app
- [ ] Check fallback to localStorage still works
- [ ] Verify no direct `this.db` references remain

## Notes
- **Safety**: App won't crash even if IPC fails (localStorage fallback in connect())
- **2025 Best Practice**: Main process handles better-sqlite3, renderer uses IPC
- **Security**: Context isolation prevents direct access to Node.js modules
- **Centralized DB**: Once complete, all data will use `D:\databases\database.db`

## Related Files
- `electron/main.ts:454-473` - IPC handlers
- `electron/preload.ts:102-110` - IPC API exposure
- `electron/database-handler.ts` - Main process database operations
- `src/services/DatabaseService.ts` - Renderer-side service (needs updates)
