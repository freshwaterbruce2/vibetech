# D Drive - Single Source of Truth Architecture

**Last Updated**: 2025-11-09
**Purpose**: Centralized persistent storage for all agent operations, learning, and task management
**Document Location**: Copy this to `D:\` when ready

---

## Executive Summary

**Problem**: Agent context and task state scattered across multiple locations
**Solution**: D drive as Single Source of Truth (SSoT) with structured task registry
**Benefit**: Claude Code can query past context, resume tasks, and maintain continuity

---

## Current D Drive Structure (Existing)

```
D:\
├── databases/              ✅ EXISTS - Central database hub
│   ├── database.db        # 54 MB - Unified database (learning + app data)
│   ├── nova_activity.db   # 102 MB - NOVA agent activity
│   └── README.md          # Documentation
│   # Note: agent_learning.db migrated to database.db on 2025-10-06
│
├── learning-system/       ✅ EXISTS - Agent learning automation
│   ├── learning_service.py
│   ├── database_config.py  # Points to unified database.db
│   ├── claude_code_hook.py
│   └── capture_*.ps1      # Pre/post tool hooks
│
├── dev-memory/            ✅ EXISTS - Session memory
│   └── claude-code/
│       ├── archives/      # Historical sessions
│       └── procedural/    # Agent execution logs
│
├── backups/               ✅ EXISTS - Database backups
├── vibe-tech-data/        ✅ EXISTS - Vibe app data
└── desktop-commander/     ✅ EXISTS - CLI tools
```

## Missing Components (To Create)

```
D:\
├── task-registry/         ❌ CREATE THIS
│   ├── active_tasks.db    # SQLite: Current tasks
│   ├── task_history.db    # SQLite: Completed tasks
│   └── schemas/
│       └── task_schema.sql
│
├── agent-context/         ❌ CREATE THIS
│   ├── ml_projects/       # ML task specifications
│   ├── web_projects/      # Web dev project specs
│   └── trading_bot/       # Trading bot tasks
│
└── scripts/               ❌ CREATE THIS
    ├── task-registry.ps1  # PowerShell task manager
    └── context_manager.py # Python context manager
```

---

## Task Registry Schema

### File: `D:\task-registry\schemas\task_schema.sql`

```sql
-- ML Training Tasks
CREATE TABLE ml_training_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked')),

    -- Dataset
    dataset_path TEXT NOT NULL,
    dataset_format TEXT CHECK(dataset_format IN ('csv', 'json', 'parquet', 'sql', 'api')),
    dataset_rows INTEGER,
    target_variable TEXT NOT NULL,
    feature_columns TEXT, -- JSON array

    -- Problem Definition
    problem_type TEXT CHECK(problem_type IN ('classification', 'regression', 'time_series', 'clustering', 'nlp')),
    framework TEXT CHECK(framework IN ('scikit-learn', 'pytorch', 'tensorflow', 'xgboost', 'lightgbm')),

    -- Configuration
    train_test_split REAL DEFAULT 0.8,
    validation_strategy TEXT CHECK(validation_strategy IN ('holdout', 'cv', 'time_series', 'stratified')),
    cv_folds INTEGER DEFAULT 5,
    metrics TEXT, -- JSON array
    hyperparameters TEXT, -- JSON object

    -- Outputs
    model_save_path TEXT,
    results_path TEXT,
    best_score REAL,
    training_time_seconds REAL,

    -- Metadata
    project_path TEXT NOT NULL,
    python_env TEXT,
    requirements TEXT, -- JSON array
    notes TEXT,
    blockers TEXT,
    next_actions TEXT
);

-- Web Development Tasks
CREATE TABLE web_development_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')),

    project_name TEXT NOT NULL,
    project_path TEXT NOT NULL,
    framework TEXT CHECK(framework IN ('react', 'vue', 'angular', 'next', 'remix', 'astro')),
    language TEXT CHECK(language IN ('typescript', 'javascript')),

    requirements TEXT, -- JSON
    current_blockers TEXT,
    dependencies TEXT, -- JSON

    completed_features TEXT, -- JSON array
    in_progress_features TEXT, -- JSON array
    next_actions TEXT,

    test_coverage REAL,
    tests_passing INTEGER,
    tests_total INTEGER,

    notes TEXT
);

-- Trading Bot Tasks
CREATE TABLE trading_bot_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')),

    task_type TEXT CHECK(task_type IN ('monitoring', 'optimization', 'debugging', 'feature', 'alert')),
    priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')),

    description TEXT NOT NULL,
    bot_name TEXT,
    exchange TEXT,

    live_impact BOOLEAN DEFAULT 0,
    testnet_validated BOOLEAN DEFAULT 0,

    affected_trades INTEGER,
    performance_delta REAL,

    resolution TEXT,
    notes TEXT
);

-- Generic Tasks
CREATE TABLE generic_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')),

    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_path TEXT,

    priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')),
    estimated_hours REAL,
    actual_hours REAL,

    blockers TEXT,
    next_actions TEXT,
    notes TEXT
);

-- Task History (Archive)
CREATE TABLE task_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    final_status TEXT,
    task_data TEXT, -- Full JSON snapshot
    duration_days REAL,
    notes TEXT
);

-- Indexes
CREATE INDEX idx_ml_status ON ml_training_tasks(status, updated_at DESC);
CREATE INDEX idx_ml_project ON ml_training_tasks(project_path);
CREATE INDEX idx_web_status ON web_development_tasks(status, updated_at DESC);
CREATE INDEX idx_trading_priority ON trading_bot_tasks(priority, status);
CREATE INDEX idx_generic_category ON generic_tasks(category, status);
CREATE INDEX idx_history_task ON task_history(task_id, archived_at DESC);
```

---

## Quick Start Commands

### 1. Initialize Structure

```powershell
# Create directories
mkdir D:\task-registry
mkdir D:\task-registry\schemas
mkdir D:\agent-context\ml_projects
mkdir D:\agent-context\web_projects
mkdir D:\agent-context\trading_bot
mkdir D:\scripts

# Initialize database
sqlite3 D:\task-registry\active_tasks.db ".read D:\task-registry\schemas\task_schema.sql"

Write-Host "✅ SSoT structure initialized" -ForegroundColor Green
```

### 2. Add ML Task Example

```powershell
# Manual SQL insert
$taskId = "ml-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

sqlite3 D:\task-registry\active_tasks.db @"
INSERT INTO ml_training_tasks (
    task_id, dataset_path, target_variable, problem_type,
    framework, project_path, status, notes
) VALUES (
    '$taskId',
    'C:\dev\data\housing.csv',
    'price',
    'regression',
    'xgboost',
    'C:\dev\ml-housing',
    'pending',
    'Initial housing price prediction task'
);
"@

Write-Host "✅ Created task: $taskId"
```

### 3. Query Active Tasks

```powershell
# List all active ML tasks
sqlite3 -header -column D:\task-registry\active_tasks.db @"
SELECT task_id, status, problem_type, updated_at
FROM ml_training_tasks
WHERE status != 'completed'
ORDER BY updated_at DESC;
"@
```

### 4. Claude Code Integration

When Claude Code starts or user asks about ML tasks:

```python
import sqlite3
import json
from pathlib import Path

# Query active tasks
conn = sqlite3.connect("D:/task-registry/active_tasks.db")
conn.row_factory = sqlite3.Row

cursor = conn.execute("""
    SELECT task_id, status, problem_type, project_path, notes
    FROM ml_training_tasks
    WHERE status = 'in_progress'
    ORDER BY updated_at DESC
""")

active_tasks = [dict(row) for row in cursor.fetchall()]
conn.close()

if active_tasks:
    print("📋 You have active ML tasks:\n")
    for task in active_tasks:
        print(f"**{task['task_id']}**")
        print(f"  - Type: {task['problem_type']}")
        print(f"  - Path: {task['project_path']}")
        print(f"  - Notes: {task['notes']}\n")

        # Check if context file exists
        context_file = Path(f"D:/agent-context/ml_projects/{task['task_id']}.json")
        if context_file.exists():
            with open(context_file) as f:
                context = json.load(f)
            print(f"  - Next steps: {context.get('next_steps', [])}\n")
else:
    print("No active ML tasks found")
```

---

## Agent Context Files

### Structure

```
D:\agent-context\
├── ml_projects/
│   ├── datasets_registry.json      # All known datasets
│   └── {task_id}.json              # Per-task context
│
├── web_projects/
│   └── {project_name}/
│       ├── requirements.json       # Feature requirements
│       ├── architecture.json       # System design
│       └── decisions.json          # Architecture decisions
│
└── trading_bot/
    ├── monitoring_config.json      # Alert thresholds
    ├── optimization_targets.json   # Performance goals
    └── exchange_config.json        # Exchange settings
```

### Example: ML Task Context

**File**: `D:\agent-context\ml_projects\ml-20251109-143000.json`

```json
{
  "task_id": "ml-20251109-143000",
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T16:45:00Z",

  "project": {
    "name": "Housing Price Prediction",
    "path": "C:\\dev\\ml-housing-price",
    "python_env": "C:\\dev\\ml-housing-price\\.venv"
  },

  "dataset": {
    "primary": "C:\\dev\\data\\housing_train.csv",
    "validation": "C:\\dev\\data\\housing_val.csv",
    "test": "C:\\dev\\data\\housing_test.csv",
    "rows": 15000,
    "columns": 42,
    "target": "price",
    "features": ["bedrooms", "bathrooms", "sqft_living", "sqft_lot", "floors"]
  },

  "problem": {
    "type": "regression",
    "metric": "rmse",
    "baseline_score": 125000,
    "target_score": 80000
  },

  "experiments": [
    {
      "experiment_id": "exp001",
      "timestamp": "2025-11-09T15:00:00Z",
      "model": "XGBoost",
      "params": {
        "max_depth": 6,
        "learning_rate": 0.1,
        "n_estimators": 100
      },
      "score": 95000,
      "training_time": 45.2,
      "notes": "Good baseline, try deeper trees"
    },
    {
      "experiment_id": "exp002",
      "timestamp": "2025-11-09T16:30:00Z",
      "model": "XGBoost",
      "params": {
        "max_depth": 10,
        "learning_rate": 0.05,
        "n_estimators": 200
      },
      "score": 87000,
      "training_time": 92.5,
      "notes": "Improvement! Consider ensemble"
    }
  ],

  "current_status": "in_progress",
  "blockers": [],
  "next_steps": [
    "Try LightGBM with auto hyperparameter tuning",
    "Feature engineering: add neighborhood statistics",
    "Ensemble top 3 models"
  ]
}
```

---

## Typical User Workflows

### Workflow 1: Starting New ML Task

```powershell
# User tells Claude Code: "I want to train a model to predict housing prices"

# Claude Code should:
# 1. Check if dataset exists
$datasets = sqlite3 -json D:\agent-context\ml_projects\datasets_registry.json

# 2. Create task in registry
$taskId = "ml-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

sqlite3 D:\task-registry\active_tasks.db @"
INSERT INTO ml_training_tasks (
    task_id, dataset_path, target_variable, problem_type,
    framework, project_path, status
) VALUES (
    '$taskId',
    'C:\dev\data\housing.csv',
    'price',
    'regression',
    'xgboost',
    'C:\dev\ml-housing',
    'pending'
);
"@

# 3. Create context file
$context = @{
    task_id = $taskId
    created_at = (Get-Date).ToString("o")
    project = @{
        path = "C:\dev\ml-housing"
    }
    dataset = @{
        primary = "C:\dev\data\housing.csv"
        target = "price"
    }
    problem = @{
        type = "regression"
        framework = "xgboost"
    }
    experiments = @()
    current_status = "pending"
    next_steps = @(
        "Explore dataset with EDA",
        "Check for missing values and outliers",
        "Train baseline XGBoost model"
    )
} | ConvertTo-Json -Depth 10

$context | Out-File "D:\agent-context\ml_projects\$taskId.json" -Encoding UTF8

Write-Host "✅ Created ML task: $taskId"
Write-Host "📂 Project path: C:\dev\ml-housing"
Write-Host "📊 Dataset: C:\dev\data\housing.csv"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Explore dataset"
Write-Host "  2. Check data quality"
Write-Host "  3. Train baseline model"
```

### Workflow 2: Resuming Previous Session

```powershell
# User opens Claude Code next day

# Claude Code startup script:
python -c @"
import sqlite3
conn = sqlite3.connect('D:/task-registry/active_tasks.db')
cursor = conn.execute('''
    SELECT task_id, problem_type, status, notes
    FROM ml_training_tasks
    WHERE status = 'in_progress'
''')

tasks = cursor.fetchall()
if tasks:
    print('You have active ML tasks:')
    for task_id, problem, status, notes in tasks:
        print(f'  - {task_id}: {problem} ({status})')
        print(f'    {notes}\n')
"@

# Output:
# You have active ML tasks:
#   - ml-20251109-143000: regression (in_progress)
#     Training XGBoost model for housing price prediction
```

### Workflow 3: Adding Experiment Results

```python
# After training model
import json
from datetime import datetime

task_id = "ml-20251109-143000"
context_file = f"D:/agent-context/ml_projects/{task_id}.json"

with open(context_file, 'r') as f:
    context = json.load(f)

# Add experiment
experiment = {
    "experiment_id": f"exp{len(context['experiments']) + 1:03d}",
    "timestamp": datetime.now().isoformat(),
    "model": "XGBoost",
    "params": {
        "max_depth": 6,
        "learning_rate": 0.1
    },
    "score": 95000,  # RMSE
    "training_time": 45.2,
    "notes": "Baseline model"
}

context["experiments"].append(experiment)
context["updated_at"] = datetime.now().isoformat()

# Update best score in database
import sqlite3
conn = sqlite3.connect("D:/task-registry/active_tasks.db")
conn.execute("""
    UPDATE ml_training_tasks
    SET best_score = ?, updated_at = datetime('now')
    WHERE task_id = ?
""", (95000, task_id))
conn.commit()
conn.close()

# Save context
with open(context_file, 'w') as f:
    json.dump(context, f, indent=2)

print(f"✅ Added experiment to {task_id}")
print(f"📊 Best score: {95000}")
```

---

## Benefits

### For You (Bruce)

1. **Continuity**: Resume tasks across sessions without losing context
2. **Searchable History**: Query past experiments and decisions
3. **No Manual Tracking**: Automatic task state management
4. **Cross-App Learning**: NOVA and Vibe share learnings

### For Claude Code

1. **Context Awareness**: Knows what you were working on
2. **Proactive Suggestions**: "You have 3 pending ML tasks, want to continue?"
3. **Better Recommendations**: Based on past successful experiments
4. **Mistake Avoidance**: Queries unified `database.db` for known pitfalls

---

## Implementation Checklist

- [ ] Create D drive directories
- [ ] Save task schema SQL file
- [ ] Initialize `active_tasks.db` database
- [ ] Test creating a sample ML task
- [ ] Test querying active tasks
- [ ] Integrate with Claude Code startup
- [ ] Create PowerShell helper script (optional)
- [ ] Create Python context manager (optional)
- [ ] Document in C:\dev\README.md

---

## Next Session Start Here

When you're ready to implement:

1. **Run initialization script** (provided above)
2. **Create first test task** to validate schema
3. **Test Claude Code query** to see if it can read tasks
4. **Iterate on context structure** based on actual usage

This gives you the SSoT architecture you need!

---

**Status**: 📐 Architecture Designed - Ready for Implementation
**Location**: Copy to `D:\` after review
