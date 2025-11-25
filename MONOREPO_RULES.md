# 🚨 MONOREPO MANDATORY RULES 🚨

## ⚠️ ATTENTION ALL AGENTS AND DEVELOPERS ⚠️

**These rules are MANDATORY and IMMUTABLE. They must be followed for ALL code changes in this monorepo.**

---

## 🔴 RULE 1: FILE SIZE LIMIT
### **NO FILES OVER 360 LINES**
- **HARD LIMIT**: 360 lines maximum per file
- **NO EXCEPTIONS**: If a file exceeds 360 lines, it MUST be split into modules
- **Enforcement**: Automated checks will reject any PR with oversized files
- **Rationale**: Improves maintainability, readability, and AI agent processing

---

## 🔴 RULE 2: MODULAR ARCHITECTURE
### **EVERY PROJECT MUST USE MODULAR ARCHITECTURE**
- **Single Responsibility**: Each module handles ONE specific concern
- **Clear Interfaces**: Modules communicate through well-defined interfaces
- **Dependency Injection**: Use dependency injection for flexibility
- **No God Objects**: No single file/class should control everything
- **Directory Structure**:
  ```
  src/
  ├── modules/      # Feature modules
  ├── shared/       # Shared utilities
  ├── interfaces/   # Type definitions
  └── config/       # Configuration
  ```

---

## 🔴 RULE 3: IMMUTABLE FILE NAMES
### **FILE NAMES ARE PERMANENT**
- **Once Created, Never Renamed**: File names must remain constant
- **No Refactoring File Names**: Even during major refactors
- **Version in Content, Not Names**: Use internal versioning, not file renaming
- **Rationale**: Maintains git history, prevents broken imports, ensures stability

---

## 🔴 RULE 4: MANDATORY PLANNING
### **PLANNING REQUIRED BEFORE CODE CHANGES**

#### **Planning Triggers**:
- **3+ Files Modified**: Any change touching 3 or more files
- **New Features**: All new feature implementations
- **Refactoring**: Any structural changes
- **Breaking Changes**: Any API or interface modifications

#### **Planning Process**:
1. **OPUS 4.1 or CLAUDE CODE** creates the plan
2. Plan must include:
   - Affected files list
   - Implementation steps
   - Risk assessment
   - Testing strategy
3. **SONNET 4.5** executes the approved plan
4. All plans stored in `.deepcode/plans/` directory

#### **Agent Delegation**:
```yaml
Planning Agent: Claude Opus 4.1 or Claude Code
Coding Agent: Claude Sonnet 4.5
Review Agent: Claude Opus 4.1
```

---

## 🔴 RULE 5: DATA STORAGE LOCATION
### **ALL DATA MUST BE STORED ON D:\ DRIVE**

#### **Mandatory D:\ Drive Storage**:
- **Logs**: ALL application logs → `D:\logs\`
- **Databases**: ALL databases → `D:\databases\`
- **Large Datasets**: ALL data files → `D:\data\`
- **Learning Systems**: AI/ML models → `D:\learning\`
- **Backups**: ALL backups → `D:\backups\`
- **Cache**: Large cache files → `D:\cache\`

#### **NEVER Store on C:\ Drive**:
- ❌ NO logs in project directories
- ❌ NO databases in application folders
- ❌ NO large data files in repository
- ❌ NO learning/model files in source code

#### **Standard Paths**:
```yaml
logs:        D:\logs\[project-name]\
databases:   D:\databases\[project-name]\
data:        D:\data\[project-name]\
learning:    D:\learning\[project-name]\
backups:     D:\backups\[project-name]\
temp:        D:\temp\[project-name]\
```

#### **Configuration**:
- All projects MUST use `D:\` paths in configs
- Environment variables MUST point to `D:\`
- Docker volumes MUST mount to `D:\` directories
- See `.claude/data-storage-config.json` for standard paths

#### **Rationale**:
- **Performance**: D:\ drive optimized for data operations
- **Space**: C:\ reserved for OS and applications only
- **Backup**: D:\ drive has separate backup strategy
- **Isolation**: Data separated from code for security

---

## 📋 ENFORCEMENT MECHANISMS

### **Automated Checks**:
1. **Pre-commit Hooks**: Validate file sizes and structure
2. **CI/CD Pipeline**: Block merges violating rules
3. **Agent Instructions**: `.claude/rules.md` for AI agents
4. **Editor Config**: `.editorconfig` for IDE enforcement

### **Violation Response**:
- **Immediate Rejection**: Code violating rules cannot be merged
- **Mandatory Refactor**: Violations must be fixed before proceeding
- **No Overrides**: No bypass mechanisms allowed

---

## 🎯 QUICK REFERENCE

| Rule | Limit/Requirement | Enforcement |
|------|------------------|-------------|
| File Size | Max 360 lines | Automated rejection |
| Architecture | Modular only | Code review + CI |
| File Names | Immutable | Git hooks |
| Planning | 3+ files = mandatory | Process validation |
| Data Storage | D:\ drive ONLY | Path validation |
| Agent Roles | Opus plans, Sonnet codes | Configuration files |

---

## 🚀 GETTING STARTED

1. **Read These Rules**: Every contributor must understand these rules
2. **Install Hooks**: Run `pnpm install` to set up enforcement
3. **Check Compliance**: Run `pnpm run validate` before committing
4. **Plan First**: Use `pnpm run plan` for multi-file changes

---

## ⚡ AI AGENT INSTRUCTIONS

**FOR ALL AI AGENTS WORKING IN THIS REPOSITORY:**

- **ALWAYS** check file line count before editing
- **ALWAYS** plan before touching 3+ files
- **NEVER** rename existing files
- **ALWAYS** follow modular architecture patterns
- **ALWAYS** use D:\ drive for logs, data, and databases
- **NEVER** store data files in C:\ project directories
- **CHECK** `.claude/rules.md` for additional instructions

---

**Last Updated**: November 24, 2025
**Version**: 1.1.0
**Status**: ACTIVE AND ENFORCED