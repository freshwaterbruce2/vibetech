# 🤖 CLAUDE AGENT MANDATORY INSTRUCTIONS

## ⚠️ CRITICAL: READ BEFORE ANY CODE CHANGES ⚠️

**These instructions are MANDATORY for all Claude AI agents (Opus, Sonnet, Haiku) working in this repository.**

---

## 🔴 IMMEDIATE ACTIONS BEFORE ANY TASK

### 1. **CHECK MONOREPO RULES**
```bash
# ALWAYS read the main rules first
cat MONOREPO_RULES.md
```

### 2. **VERIFY YOUR ROLE**
- **Claude Opus 4.1 / Claude Code**: You handle PLANNING ONLY
- **Claude Sonnet 4.5**: You handle CODING ONLY
- **Other Models**: Follow task-specific instructions

---

## 📋 MANDATORY WORKFLOW

### **STEP 1: ASSESSMENT**
Before touching ANY code:
1. Count files to be modified
2. Check line count of existing files
3. Determine if planning is required (3+ files)

### **STEP 2: PLANNING (Opus/Claude Code Only)**
If you are Opus 4.1 or Claude Code and planning is needed:
```yaml
Create Plan:
  - Location: .deepcode/plans/
  - Format: PLAN_YYYY-MM-DD_HH-MM-SS.md
  - Contents:
    - Affected files list
    - Line count verification
    - Module breakdown strategy
    - Risk assessment
    - Testing approach
```

### **STEP 3: EXECUTION (Sonnet 4.5 Only)**
If you are Sonnet 4.5:
1. **WAIT for approved plan** from Opus/Claude Code
2. **FOLLOW plan exactly** - no deviations
3. **ENFORCE line limits** - split files over 360 lines
4. **MAINTAIN file names** - never rename existing files

---

## 🚨 HARD RULES - NO EXCEPTIONS

### **FILE SIZE ENFORCEMENT**
```python
# Before editing ANY file:
if file_lines > 360:
    STOP - File must be split into modules

# Before creating ANY file:
if estimated_lines > 360:
    STOP - Design as multiple modules
```

### **FILE NAME IMMUTABILITY**
```javascript
// FORBIDDEN OPERATIONS:
// ❌ rename('oldFile.ts', 'newFile.ts')
// ❌ mv oldFile.ts newFile.ts
// ❌ git mv oldFile.ts newFile.ts

// ALLOWED OPERATIONS:
// ✅ Create new files
// ✅ Delete obsolete files (with approval)
// ✅ Modify file contents
```

### **MODULAR ARCHITECTURE**
Every file must follow:
```typescript
// MAX 360 LINES PER FILE
// Single responsibility
// Clear interfaces
// Dependency injection
// No god objects
```

### **DATA STORAGE - D:\ DRIVE MANDATORY**
```yaml
# ALL DATA MUST GO TO D:\ DRIVE
REQUIRED_PATHS:
  logs:        "D:\\logs\\[project-name]\\"
  databases:   "D:\\databases\\[project-name]\\"
  data_files:  "D:\\data\\[project-name]\\"
  learning:    "D:\\learning\\[project-name]\\"
  backups:     "D:\\backups\\[project-name]\\"
  temp:        "D:\\temp\\[project-name]\\"

FORBIDDEN:
  - ❌ NEVER store logs in C:\dev\
  - ❌ NEVER put databases in project folders
  - ❌ NEVER save data files in repository
  - ❌ NEVER place ML models in source code

EXAMPLES:
  # ✅ CORRECT:
  log_path: "D:\\logs\\vibe-code-studio\\app.log"
  db_path:  "D:\\databases\\nova-agent\\main.db"

  # ❌ WRONG:
  log_path: "./logs/app.log"
  db_path:  "C:\\dev\\apps\\nova-agent\\database.db"
```

---

## 🎯 AGENT-SPECIFIC BEHAVIORS

### **For Claude Opus 4.1 / Claude Code:**
- **PRIMARY ROLE**: Planning and Architecture
- **NEVER**: Write implementation code directly
- **ALWAYS**: Create detailed plans before delegation
- **OUTPUT**: Planning documents in `.deepcode/plans/`

### **For Claude Sonnet 4.5:**
- **PRIMARY ROLE**: Code Implementation
- **NEVER**: Make architectural decisions independently
- **ALWAYS**: Request plan from Opus for 3+ file changes
- **OUTPUT**: Clean, modular code following the plan

### **For All Agents:**
- **USE TodoWrite**: Track all tasks and progress
- **CHECK line count**: Before and after edits
- **VALIDATE structure**: Ensure modular architecture
- **PRESERVE names**: Never rename existing files

---

## 🛠️ HELPER COMMANDS

### **Check File Line Count:**
```bash
# PowerShell command
powershell -Command "(Get-Content 'filepath').Count"
```

### **Validate All Files:**
```bash
# Check for oversized files
pnpm run validate:size
```

### **Check Planning Requirement:**
```bash
# Count affected files
git diff --name-only | wc -l
```

### **Verify D:\ Drive Paths:**
```bash
# PowerShell: Check if data directories exist
powershell -Command "Test-Path 'D:\logs', 'D:\databases', 'D:\data'"

# Create project data directories
powershell -Command "New-Item -Path 'D:\logs\[project-name]' -ItemType Directory -Force"
```

---

## ⚡ QUICK DECISION TREE

```
START
  │
  ├─ How many files affected?
  │   ├─ 1-2 files → Proceed with caution
  │   └─ 3+ files → STOP! Planning required
  │
  ├─ File over 360 lines?
  │   ├─ Yes → STOP! Must split
  │   └─ No → Continue
  │
  ├─ Need to rename file?
  │   ├─ Yes → STOP! Forbidden
  │   └─ No → Continue
  │
  ├─ Storing logs/data/databases?
  │   ├─ Yes → MUST use D:\ drive
  │   └─ No → Continue
  │
  └─ What's my role?
      ├─ Opus/Claude Code → Create plan only
      └─ Sonnet → Implement from plan only
```

---

## 🔥 ENFORCEMENT NOTICES

**VIOLATIONS WILL RESULT IN:**
1. Immediate rejection of code
2. Rollback of changes
3. Required re-implementation
4. Logged as non-compliance

**NO OVERRIDES AVAILABLE**

---

## 📝 METADATA

- **Rules Version**: 1.1.0
- **Last Updated**: November 24, 2025
- **Enforcement Level**: MANDATORY
- **Override Authority**: NONE

---

## 🆘 WHEN IN DOUBT

1. **READ** `MONOREPO_RULES.md`
2. **CHECK** file sizes with validation scripts
3. **ASK** for clarification before proceeding
4. **PLAN** thoroughly for complex changes
5. **FOLLOW** your designated role strictly

**Remember: These rules ensure code quality, maintainability, and consistency across the entire monorepo. They are not suggestions - they are requirements.**