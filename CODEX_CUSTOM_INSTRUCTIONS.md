# Codex Custom Instructions - Optimized for Performance

**Updated:** 2025-11-25 @ 1:54 PM
**Location:** `~/.codex/instructions.md`

---

## 📝 Concise Instructions (For Web Interface)

Copy and paste this into **Settings > General > Custom Instructions** at https://chatgpt.com/codex:

```
# Vibetech Monorepo

**Repo:** freshwaterbruce2/vibetech (pnpm + Turborepo)
**Dev:** C:\dev | **Data:** D:\ drive
**Platform:** Windows 11 | **PM:** pnpm ONLY

## Critical Rules
1. Files ≤360 lines (after 2025-11-22)
2. Data on D:\ (databases, logs, learning, vision)
3. Read AGENTS.md before changes
4. Run: pnpm typecheck && pnpm lint && pnpm test

## Quick Commands
pnpm install | pnpm typecheck | pnpm test | pnpm lint
pnpm --filter <pkg> <cmd>  # Package-specific

## Standards
- TypeScript strict, no any
- React: functional + hooks
- 2-space, single quotes
- Commits: feat:, fix:, chore:

**Details:** Read AGENTS.md files in repo
```

---

## 🎯 Why This Optimized Version?

### **Problem with Long Instructions**
- Eats into agent's context window
- Can result in worse performance
- Slower processing
- May ignore later instructions

### **Solution: AGENTS.md Files**
Detailed instructions are now in **AGENTS.md files** where they belong:

**Root Level:**
```
C:\dev\AGENTS.md
```
- Monorepo structure
- Build/test commands
- Code standards
- Commit guidelines

**Project Level:**
```
C:\dev\apps\nova-agent\AGENTS.md
C:\dev\apps\vibe-code-studio\AGENTS.md (create if needed)
```
- Project-specific rules
- Tech stack details
- Architecture patterns
- Known issues

### **Benefits**
✅ **Better performance** - Less context used
✅ **Faster responses** - More room for actual code analysis
✅ **Scoped guidance** - Codex reads relevant AGENTS.md per project
✅ **Easier maintenance** - Update AGENTS.md files directly in repo
✅ **Version controlled** - AGENTS.md tracked in git

---

## 📊 Size Comparison

| Version | Lines | Size | Performance |
|---------|-------|------|-------------|
| **Old** | 600+ | ~25KB | ⚠️ Slow |
| **New** | 46 | ~1.2KB | ✅ Fast |
| **Reduction** | **92%** | **95%** | **Much better** |

---

## 🔧 How Codex Uses This

### **Custom Instructions (Short)**
Used for:
- High-level context
- Critical rules (360-line limit, D:\ storage)
- Package manager preference
- Quick reference commands

### **AGENTS.md Files (Detailed)**
Used for:
- Project-specific architecture
- Detailed build instructions
- Code patterns and examples
- Integration guidelines
- Testing requirements

### **Combined Approach**
1. Codex reads short custom instructions first
2. When working on a project, Codex reads relevant AGENTS.md
3. More context available for actual code analysis
4. Better, faster, more accurate suggestions

---

## 📝 Web Interface Setup

### Copy This to Settings:

```
# Vibetech Monorepo

**Repo:** freshwaterbruce2/vibetech (pnpm + Turborepo)
**Dev:** C:\dev | **Data:** D:\ drive
**Platform:** Windows 11 | **PM:** pnpm ONLY

## Critical Rules
1. Files ≤360 lines (after 2025-11-22)
2. Data on D:\ (databases, logs, learning, vision)
3. Read AGENTS.md before changes
4. Run: pnpm typecheck && pnpm lint && pnpm test

## Quick Commands
pnpm install | pnpm typecheck | pnpm test | pnpm lint
pnpm --filter <pkg> <cmd>

## Standards
- TypeScript strict, no any
- React: functional + hooks
- 2-space, single quotes
- Commits: feat:, fix:, chore:

**Details:** Read AGENTS.md files in repo
```

---

## ✅ Updated Files

**Optimized:**
- `~/.codex/instructions.md` - 46 lines (was 600+)
- Web instructions - Shortened to essentials

**Already Comprehensive:**
- `C:\dev\AGENTS.md` - Monorepo guidelines
- `C:\dev\apps\nova-agent\AGENTS.md` - Nova Agent rules
- Project-specific AGENTS.md as needed

**Documentation:**
- `CODEX_CUSTOM_INSTRUCTIONS.md` - This file
- `CODEX_SETUP_GUIDE.md` - Overall setup
- `CODEX_WEB_SETTINGS.md` - Web config
- `CODEX_CONFIGURATION_SUMMARY.md` - Quick reference

---

## 🚀 Performance Benefits

With the optimized instructions, you'll get:

✅ **Faster responses** - Less preprocessing time
✅ **Better code analysis** - More context for actual code
✅ **Accurate suggestions** - Codex focuses on what matters
✅ **Scoped guidance** - Reads relevant AGENTS.md per project
✅ **Maintained in git** - AGENTS.md files version controlled

---

## 📚 Next Steps

1. ✅ Short custom instructions in `~/.codex/instructions.md`
2. ✅ Detailed rules in AGENTS.md files
3. ⏭️ Copy short version to web interface
4. ⏭️ Test improved performance
5. ⏭️ Create additional AGENTS.md for other projects as needed

---

**Optimized for speed and accuracy! 🚀**
