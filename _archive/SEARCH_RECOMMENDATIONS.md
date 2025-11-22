# 🔍 SEARCH RECOMMENDATIONS FOR NEXT SESSION

## 🚨 **CRITICAL SEARCHES (Do These First)**

### 1. NOVA Package Manager Investigation
**Problem:** npm commands failing, likely using pnpm
**Searches:**
```
1. "How to check if Tauri project uses pnpm or npm"
2. "Tauri package.json pnpm-lock.yaml vs package-lock.json"
3. "Convert npm tauri project to pnpm workspace"
4. "pnpm install @tauri-apps/api troubleshooting"
```
**Expected Answer:** How to determine and use correct package manager

---

### 2. Tauri v2 Import Path Resolution
**Problem:** Import errors with @tauri-apps/api
**Searches:**
```
1. "Tauri v2.8 @tauri-apps/api/core vs @tauri-apps/api/tauri"
2. "Tauri v2 breaking changes API imports"
3. "Vite failed to resolve import @tauri-apps/api fix"
4. "Tauri API v2 invoke import path 2024"
```
**Expected Answer:** Correct import paths for all Tauri v2 APIs

---

### 3. Vite + Tauri Dev Mode
**Problem:** Dev server not starting properly
**Searches:**
```
1. "Tauri dev mode stuck compiling Vite 2024"
2. "Vite HMR not working with Tauri v2"
3. "Tauri npm run dev vs npm run tauri dev difference"
4. "Tauri dev mode Error: Cannot resolve import"
```
**Expected Answer:** Proper dev mode startup procedure

---

## ⚠️ **IMPORTANT SEARCHES (After Apps Start)**

### 4. Electron IPC Setup
**Problem:** Vibe needs electronAPI in preload
**Searches:**
```
1. "Electron contextBridge expose IPC methods 2024"
2. "window.electronAPI undefined preload script"
3. "Electron + Vite preload script not loading"
4. "Electron IPC invoke send best practices"
```
**Expected Answer:** Proper contextBridge setup in preload.ts

---

### 5. Cross-App WebSocket Communication
**Problem:** IPC Bridge needs optimization
**Searches:**
```
1. "WebSocket IPC between desktop applications"
2. "Tauri and Electron communicate via WebSocket"
3. "Cross-process communication patterns desktop apps"
4. "localhost WebSocket connection refused troubleshooting"
```
**Expected Answer:** Best practices for cross-app messaging

---

## 💡 **NICE-TO-HAVE SEARCHES (If Time)**

### 6. Styled-Components + Tauri/Electron
**Problem:** Theme compatibility
**Searches:**
```
1. "styled-components theme in Tauri React app"
2. "CSS-in-JS performance Electron vs Tauri"
3. "Dark mode styled-components desktop apps"
```

### 7. TypeScript Path Mapping
**Problem:** Import aliases not resolving
**Searches:**
```
1. "Vite tsconfig path mapping not working"
2. "TypeScript @ alias imports Tauri Vite"
3. "Resolve TypeScript path aliases in Vite config"
```

### 8. React 19 + Tauri Compatibility
**Problem:** Potential React compatibility issues
**Searches:**
```
1. "React 19 with Tauri v2 compatibility"
2. "React 19 hooks Tauri desktop app"
3. "Tauri React 19 dev mode hot reload"
```

---

## 🎯 **SEARCH STRATEGY**

### Order of Operations:
1. **Start with critical searches** (1-3) - These block progress
2. **Move to important searches** (4-5) - Once apps start
3. **Do nice-to-have** (6-8) - Only if time permits

### When to Search:
- ✅ **Before trying fixes** - Understand the problem
- ✅ **After errors appear** - Get specific solutions
- ❌ **Not randomly** - Stay focused on blockers

### How to Use Results:
1. **Read top 3 results** - Look for patterns
2. **Check dates** - Prefer 2024 content
3. **Look for official docs** - Tauri/Electron/Vite sites
4. **Try solutions incrementally** - One at a time
5. **Document what works** - Update troubleshooting docs

---

## 📚 **AUTHORITATIVE SOURCES**

### Always Check These First:
1. **Tauri Docs:** https://v2.tauri.app/develop/
2. **Electron Docs:** https://www.electronjs.org/docs/latest/
3. **Vite Docs:** https://vitejs.dev/config/
4. **React Docs:** https://react.dev/

### Community Resources:
- GitHub Issues for specific packages
- Stack Overflow (recent answers only)
- Discord servers (Tauri, Electron)

---

## 🔧 **SPECIFIC ERROR SEARCHES**

### If You See These Errors:

**Error:** `Cannot read properties of null (reading 'matches')`
```
Search: "npm error Cannot read properties null matches fix"
```

**Error:** `Failed to resolve import @tauri-apps/api`
```
Search: "Vite failed resolve import tauri-apps api node_modules"
```

**Error:** `window.electronAPI is not defined`
```
Search: "Electron preload contextBridge not exposing API"
```

**Error:** `WebSocket connection failed`
```
Search: "localhost WebSocket ECONNREFUSED Node.js"
```

**Error:** `Rust compile error in Tauri`
```
Search: "Tauri cargo build failed [specific error]"
```

---

## 💭 **SEARCH TIPS**

### Make Searches Specific:
- ❌ "Tauri not working"
- ✅ "Tauri v2.8 dev mode Vite import resolution error"

### Include Version Numbers:
- ✅ "Tauri v2" not just "Tauri"
- ✅ "Electron 28" not just "Electron"
- ✅ "React 19" not just "React"

### Add Year for Recent Solutions:
- ✅ "...troubleshooting 2024"
- ✅ "...best practices 2024"

### Use Exact Error Messages:
- Copy error text in quotes
- Remove file paths/specifics
- Keep error codes

---

## ⏱️ **TIME BUDGET FOR SEARCHES**

- **Critical searches (1-3):** 15-20 min total
- **Important searches (4-5):** 10-15 min total
- **Nice-to-have (6-8):** 5-10 min if time

**MAX TIME ON SEARCHES:** 45 minutes
**If still stuck:** Move to Plan B (see NEXT_SESSION_PROMPT.md)

---

## 📊 **SUCCESS INDICATORS**

You've found the right answer when:
- ✅ Solution is from official docs or recent (2024)
- ✅ Multiple sources confirm same approach
- ✅ Solution addresses your exact error/version
- ✅ Includes code examples you can adapt
- ✅ Has positive community feedback

Stop searching when:
- ❌ Going in circles (3+ similar results)
- ❌ Information is too old (pre-2023)
- ❌ Solutions aren't working after 2-3 tries
- ❌ Spending more than allocated time

---

**Remember:** Search is a tool, not the goal. Get unstuck and get back to coding! 🚀
