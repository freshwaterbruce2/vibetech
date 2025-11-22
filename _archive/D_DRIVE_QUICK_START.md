# D Drive SSoT - Quick Start Guide

**Created**: 2025-11-09
**Status**: ✅ Fully Operational
**Copy to**: `D:\QUICK_START_GUIDE.md` when ready

---

## ✅ What Was Successfully Created

```
D:\
├── task-registry/
│   ├── active_tasks.db              ✅ Initialized (schema v1.0.0)
│   └── schemas/
│       └── task_schema.sql          ✅ Created
│
├── agent-context/
│   └── ml_projects/
│       └── ml-20251109-test.json    ✅ Test validated
│
└── scripts/
    └── task-manager.ps1              ✅ Working utility
```

---

## Quick Commands

```powershell
# List all active tasks
D:\scripts\task-manager.ps1 list-ml

# View task details
D:\scripts\task-manager.ps1 get ml-20251109-test

# Update task status
D:\scripts\task-manager.ps1 update-status <task_id> in_progress

# Add note
D:\scripts\task-manager.ps1 add-note <task_id> "Your note here"
```

---

## Claude Code Integration (Python)

```python
import sqlite3

# Query active tasks
conn = sqlite3.connect("D:/task-registry/active_tasks.db")
cursor = conn.execute("""
    SELECT task_id, status, problem_type, notes
    FROM ml_training_tasks
    WHERE status != 'completed'
    ORDER BY updated_at DESC
""")

for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]} - {row[2]}")
    print(f"  {row[3]}\n")
```

---

## Benefits

✅ Resume work across sessions
✅ Searchable task history
✅ Context-aware Claude Code
✅ Cross-app learning integration

---

**Full Documentation**: `C:\dev\D_DRIVE_SSoT_ARCHITECTURE.md`
