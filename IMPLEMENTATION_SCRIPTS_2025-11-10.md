# Implementation Scripts & Commands
**Date:** November 10, 2025  
**Purpose:** Ready-to-run commands for improvement plan execution

---

## Phase 1: Critical Foundations

### Script 1: Install and Configure Nx

```powershell
# C:\dev\scripts\setup-nx.ps1

Write-Host "🚀 Setting up Nx build system..." -ForegroundColor Cyan

# Navigate to root
cd C:\dev

# Install Nx
pnpm add -D -w nx @nx/workspace @nx/js @nx/node @nx/react

# Initialize Nx
npx nx init

# Create nx.json configuration
@'
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"]
      }
    }
  }
}
'@ | Out-File -FilePath "nx.json" -Encoding UTF8

Write-Host "✅ Nx installed and configured" -ForegroundColor Green

# Test it
Write-Host "`n📊 Testing Nx graph..." -ForegroundColor Cyan
npx nx graph

Write-Host "`n✅ Setup complete! Try: pnpm nx run-many -t build --all" -ForegroundColor Green
```

---

### Script 2: Create CI/CD Pipeline

```powershell
# C:\dev\scripts\setup-cicd.ps1

Write-Host "🔧 Creating CI/CD pipeline..." -ForegroundColor Cyan

# Create GitHub workflows directory
mkdir -p .github\workflows

# Create CI workflow
@'
name: Continuous Integration

on:
  pull_request:
  push:
    branches: [main, master, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality-checks:
    name: Code Quality & Tests
    runs-on: windows-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Derive appropriate SHAs for base and head
        uses: nrwl/nx-set-shas@v4

      - name: Run affected linting
        run: pnpm nx affected -t lint --parallel=3

      - name: Run affected tests
        run: pnpm nx affected -t test --parallel=3 --coverage

      - name: Run affected builds
        run: pnpm nx affected -t build --parallel=3

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          directory: ./coverage

  security-scan:
    name: Security Scanning
    runs-on: windows-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run GitLeaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        if: github.event_name == 'pull_request'
'@ | Out-File -FilePath ".github\workflows\ci.yml" -Encoding UTF8

Write-Host "✅ CI/CD pipeline created at .github/workflows/ci.yml" -ForegroundColor Green
Write-Host "📝 Commit and push to enable automatic checks" -ForegroundColor Yellow
```

---

### Script 3: Setup Task Registry

```powershell
# C:\dev\scripts\setup-task-registry.ps1

Write-Host "📋 Setting up Task Registry..." -ForegroundColor Cyan

# Create directories
$dirs = @(
    "D:\task-registry",
    "D:\task-registry\schemas",
    "D:\task-registry\backups",
    "D:\agent-context",
    "D:\agent-context\ml_projects",
    "D:\agent-context\web_projects",
    "D:\agent-context\trading_bot"
)

foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        mkdir $dir
        Write-Host "  ✅ Created $dir" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  $dir already exists" -ForegroundColor Yellow
    }
}

# Create schema file
@'
-- Task Registry Database Schema
-- Created: 2025-11-10

-- ML Training Tasks
CREATE TABLE IF NOT EXISTS ml_training_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked')) DEFAULT 'pending',

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
CREATE TABLE IF NOT EXISTS web_development_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')) DEFAULT 'pending',

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
CREATE TABLE IF NOT EXISTS trading_bot_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')) DEFAULT 'pending',

    task_type TEXT CHECK(task_type IN ('monitoring', 'optimization', 'debugging', 'feature', 'alert')),
    priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',

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
CREATE TABLE IF NOT EXISTS generic_tasks (
    task_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')) DEFAULT 'pending',

    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_path TEXT,

    priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
    estimated_hours REAL,
    actual_hours REAL,

    blockers TEXT,
    next_actions TEXT,
    notes TEXT
);

-- Task History (Archive)
CREATE TABLE IF NOT EXISTS task_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    final_status TEXT,
    task_data TEXT, -- Full JSON snapshot
    duration_days REAL,
    notes TEXT
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ml_status ON ml_training_tasks(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_project ON ml_training_tasks(project_path);
CREATE INDEX IF NOT EXISTS idx_web_status ON web_development_tasks(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_priority ON trading_bot_tasks(priority, status);
CREATE INDEX IF NOT EXISTS idx_generic_category ON generic_tasks(category, status);
CREATE INDEX IF NOT EXISTS idx_history_task ON task_history(task_id, archived_at DESC);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_ml_timestamp
AFTER UPDATE ON ml_training_tasks
BEGIN
    UPDATE ml_training_tasks SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;

CREATE TRIGGER IF NOT EXISTS update_web_timestamp
AFTER UPDATE ON web_development_tasks
BEGIN
    UPDATE web_development_tasks SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;

CREATE TRIGGER IF NOT EXISTS update_trading_timestamp
AFTER UPDATE ON trading_bot_tasks
BEGIN
    UPDATE trading_bot_tasks SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;

CREATE TRIGGER IF NOT EXISTS update_generic_timestamp
AFTER UPDATE ON generic_tasks
BEGIN
    UPDATE generic_tasks SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;
'@ | Out-File -FilePath "D:\task-registry\schemas\task_schema.sql" -Encoding UTF8

Write-Host "✅ Schema file created" -ForegroundColor Green

# Initialize database
Write-Host "`n📊 Initializing database..." -ForegroundColor Cyan
sqlite3 "D:\task-registry\active_tasks.db" ".read D:\task-registry\schemas\task_schema.sql"

Write-Host "✅ Database initialized at D:\task-registry\active_tasks.db" -ForegroundColor Green

# Create helper script
@'
# Task Registry Helper Functions
# Source this file in your PowerShell profile

function Add-MLTask {
    param(
        [Parameter(Mandatory=$true)]
        [string]$DatasetPath,
        
        [Parameter(Mandatory=$true)]
        [string]$TargetVariable,
        
        [Parameter(Mandatory=$true)]
        [string]$ProblemType,
        
        [Parameter(Mandatory=$true)]
        [string]$ProjectPath,
        
        [string]$Framework = "xgboost",
        [string]$Notes = ""
    )
    
    $taskId = "ml-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    $query = @"
INSERT INTO ml_training_tasks (
    task_id, dataset_path, target_variable, problem_type, framework, project_path, notes
) VALUES (
    '$taskId', '$DatasetPath', '$TargetVariable', '$ProblemType', '$Framework', '$ProjectPath', '$Notes'
);
"@
    
    sqlite3 "D:\task-registry\active_tasks.db" $query
    Write-Host "✅ Created ML task: $taskId" -ForegroundColor Green
    return $taskId
}

function Get-ActiveTasks {
    param(
        [string]$Type = "all"
    )
    
    $query = switch ($Type) {
        "ml" { "SELECT * FROM ml_training_tasks WHERE status != 'completed' ORDER BY updated_at DESC;" }
        "web" { "SELECT * FROM web_development_tasks WHERE status != 'completed' ORDER BY updated_at DESC;" }
        "trading" { "SELECT * FROM trading_bot_tasks WHERE status != 'completed' ORDER BY priority, updated_at DESC;" }
        "generic" { "SELECT * FROM generic_tasks WHERE status != 'completed' ORDER BY priority, updated_at DESC;" }
        default {
            "SELECT 'ml' as type, task_id, status, updated_at FROM ml_training_tasks WHERE status != 'completed'
             UNION
             SELECT 'web' as type, task_id, status, updated_at FROM web_development_tasks WHERE status != 'completed'
             UNION
             SELECT 'trading' as type, task_id, status, updated_at FROM trading_bot_tasks WHERE status != 'completed'
             UNION
             SELECT 'generic' as type, task_id, status, updated_at FROM generic_tasks WHERE status != 'completed'
             ORDER BY updated_at DESC;"
        }
    }
    
    sqlite3 -header -column "D:\task-registry\active_tasks.db" $query
}

function Update-TaskStatus {
    param(
        [Parameter(Mandatory=$true)]
        [string]$TaskId,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('pending', 'in_progress', 'completed', 'blocked')]
        [string]$Status,
        
        [string]$Notes = ""
    )
    
    # Try each table
    $tables = @('ml_training_tasks', 'web_development_tasks', 'trading_bot_tasks', 'generic_tasks')
    
    foreach ($table in $tables) {
        $query = "UPDATE $table SET status = '$Status' WHERE task_id = '$TaskId';"
        sqlite3 "D:\task-registry\active_tasks.db" $query
        
        $check = sqlite3 "D:\task-registry\active_tasks.db" "SELECT changes();"
        if ($check -gt 0) {
            Write-Host "✅ Updated $TaskId to $Status in $table" -ForegroundColor Green
            return
        }
    }
    
    Write-Host "❌ Task $TaskId not found" -ForegroundColor Red
}

Export-ModuleMember -Function Add-MLTask, Get-ActiveTasks, Update-TaskStatus
'@ | Out-File -FilePath "D:\task-registry\task-helpers.ps1" -Encoding UTF8

Write-Host "✅ Helper functions created at D:\task-registry\task-helpers.ps1" -ForegroundColor Green
Write-Host "`n📝 Add to your PowerShell profile:" -ForegroundColor Yellow
Write-Host "   . D:\task-registry\task-helpers.ps1" -ForegroundColor Cyan

Write-Host "`n🎉 Task Registry setup complete!" -ForegroundColor Green
```

---

## Phase 2: Operational Excellence

### Script 4: Database Consolidation

```python
# D:\databases\consolidate_databases.py

import sqlite3
import shutil
from pathlib import Path
from datetime import datetime

def consolidate_databases():
    """Consolidate multiple small databases into unified database.db"""
    
    print("🗄️  Database Consolidation Script")
    print("=" * 60)
    
    databases_dir = Path("D:/databases")
    unified_db = databases_dir / "database.db"
    backup_dir = databases_dir / "backups" / f"pre_consolidation_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Databases to consolidate
    small_dbs = {
        "job_queue.db": "job_queue_items",
        "scheduler_jobs.db": "scheduled_jobs",
        "monitor.db": "monitoring_events",
        "cleanup_automation.db": "cleanup_history",
    }
    
    # Backup everything first
    print("\n📦 Creating backups...")
    for db_file in small_dbs.keys():
        source = databases_dir / db_file
        if source.exists():
            dest = backup_dir / db_file
            shutil.copy2(source, dest)
            print(f"  ✅ Backed up {db_file}")
    
    # Also backup unified database
    if unified_db.exists():
        shutil.copy2(unified_db, backup_dir / "database.db")
        print(f"  ✅ Backed up database.db")
    
    # Connect to unified database
    print("\n🔧 Consolidating databases...")
    conn = sqlite3.connect(unified_db)
    cursor = conn.cursor()
    
    # For each small database
    for db_file, new_table_name in small_dbs.items():
        source_db = databases_dir / db_file
        if not source_db.exists():
            print(f"  ⏭️  {db_file} not found, skipping")
            continue
        
        # Attach the database
        cursor.execute(f"ATTACH DATABASE '{source_db}' AS source")
        
        # Get table list
        cursor.execute("SELECT name FROM source.sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        for (table_name,) in tables:
            # Skip sqlite internal tables
            if table_name.startswith('sqlite_'):
                continue
            
            # Get CREATE statement
            cursor.execute(f"SELECT sql FROM source.sqlite_master WHERE type='table' AND name='{table_name}'")
            create_sql = cursor.fetchone()[0]
            
            # Modify table name for consolidated DB
            modified_sql = create_sql.replace(f"CREATE TABLE {table_name}", 
                                             f"CREATE TABLE IF NOT EXISTS {new_table_name}_{table_name}")
            
            # Create table in unified DB
            cursor.execute(modified_sql)
            
            # Copy data
            cursor.execute(f"INSERT INTO {new_table_name}_{table_name} SELECT * FROM source.{table_name}")
            rows_copied = cursor.rowcount
            
            print(f"  ✅ Copied {rows_copied} rows from {db_file}.{table_name}")
        
        # Detach
        cursor.execute("DETACH DATABASE source")
    
    # Optimize database
    print("\n⚡ Optimizing unified database...")
    cursor.execute("VACUUM")
    cursor.execute("ANALYZE")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Consolidation complete!")
    print(f"📦 Backups stored in: {backup_dir}")
    print("\n⚠️  MANUAL STEP REQUIRED:")
    print("   1. Verify unified database works correctly")
    print("   2. Update application connection strings")
    print("   3. After testing, manually delete old .db files:")
    for db_file in small_dbs.keys():
        print(f"      - {databases_dir / db_file}")
    print("\n   DO NOT DELETE until you've verified everything works!")

if __name__ == "__main__":
    consolidate_databases()
```

---

### Script 5: Dependency Cleanup

```powershell
# C:\dev\scripts\cleanup-dependencies.ps1

Write-Host "🧹 Cleaning up dependencies..." -ForegroundColor Cyan

# Create .npmrc if it doesn't exist
@'
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=*types*
'@ | Out-File -FilePath "C:\dev\.npmrc" -Encoding UTF8

Write-Host "✅ Created .npmrc with proper hoisting config" -ForegroundColor Green

# Remove all node_modules
Write-Host "`n🗑️  Removing all node_modules directories..." -ForegroundColor Yellow
Get-ChildItem -Path "C:\dev" -Recurse -Directory -Filter "node_modules" | 
    Where-Object { $_.FullName -notlike "*\.pnpm\*" } |
    ForEach-Object {
        Write-Host "  Removing $($_.FullName)" -ForegroundColor Gray
        Remove-Item -Recurse -Force $_.FullName
    }

# Remove all pnpm-lock.yaml files except root
Write-Host "`n🗑️  Removing non-root pnpm-lock.yaml files..." -ForegroundColor Yellow
Get-ChildItem -Path "C:\dev" -Recurse -File -Filter "pnpm-lock.yaml" |
    Where-Object { $_.FullName -ne "C:\dev\pnpm-lock.yaml" } |
    ForEach-Object {
        Write-Host "  Removing $($_.FullName)" -ForegroundColor Gray
        Remove-Item -Force $_.FullName
    }

# Reinstall with proper config
Write-Host "`n📦 Reinstalling dependencies..." -ForegroundColor Cyan
cd C:\dev
pnpm install --no-frozen-lockfile

Write-Host "`n✅ Dependency cleanup complete!" -ForegroundColor Green

# Install dependency management tool
Write-Host "`n📊 Installing dependency management tools..." -ForegroundColor Cyan
pnpm add -D -w @manypkg/cli

Write-Host "`n🔍 Checking for dependency issues..." -ForegroundColor Cyan
pnpm manypkg check

Write-Host "`n✅ All done! Dependencies are now properly managed." -ForegroundColor Green
```

---

### Script 6: Centralized Configuration

```powershell
# C:\dev\scripts\setup-centralized-config.ps1

Write-Host "⚙️  Setting up centralized configuration..." -ForegroundColor Cyan

# Create tooling directory structure
$dirs = @(
    "C:\dev\tooling",
    "C:\dev\tooling\typescript",
    "C:\dev\tooling\eslint",
    "C:\dev\tooling\prettier",
    "C:\dev\tooling\scripts"
)

foreach ($dir in $dirs) {
    mkdir -Force $dir | Out-Null
    Write-Host "  ✅ Created $dir" -ForegroundColor Green
}

# Create base TypeScript config
@'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
'@ | Out-File -FilePath "C:\dev\tooling\typescript\tsconfig.base.json" -Encoding UTF8

# Create Node-specific config
@'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node"]
  }
}
'@ | Out-File -FilePath "C:\dev\tooling\typescript\tsconfig.node.json" -Encoding UTF8

# Create React-specific config
@'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
'@ | Out-File -FilePath "C:\dev\tooling\typescript\tsconfig.react.json" -Encoding UTF8

Write-Host "✅ TypeScript configs created" -ForegroundColor Green

# Create ESLint config
@'
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
];
'@ | Out-File -FilePath "C:\dev\tooling\eslint\eslint.config.js" -Encoding UTF8

Write-Host "✅ ESLint config created" -ForegroundColor Green

# Create Prettier config
@'
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
'@ | Out-File -FilePath "C:\dev\tooling\prettier\.prettierrc.json" -Encoding UTF8

Write-Host "✅ Prettier config created" -ForegroundColor Green

Write-Host "`n📝 Update individual projects to extend these configs:" -ForegroundColor Yellow
Write-Host "   TypeScript: { ""extends"": ""../../tooling/typescript/tsconfig.base.json"" }" -ForegroundColor Cyan
Write-Host "   ESLint: import baseConfig from '../../tooling/eslint/eslint.config.js'" -ForegroundColor Cyan
Write-Host "   Prettier: { ""extends"": ""../../tooling/prettier/.prettierrc.json"" }" -ForegroundColor Cyan

Write-Host "`n✅ Centralized configuration setup complete!" -ForegroundColor Green
```

---

## Phase 3: Quality & Security

### Script 7: Setup Testing Infrastructure

```powershell
# C:\dev\scripts\setup-testing.ps1

Write-Host "🧪 Setting up testing infrastructure..." -ForegroundColor Cyan

cd C:\dev

# Install test dependencies
Write-Host "`n📦 Installing test tools..." -ForegroundColor Cyan
pnpm add -D -w vitest @vitest/ui @vitest/coverage-v8
pnpm add -D -w playwright @playwright/test
pnpm add -D -w @testing-library/react @testing-library/jest-dom

# Create Vitest config
@'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
});
'@ | Out-File -FilePath "C:\dev\vitest.config.ts" -Encoding UTF8

# Create Playwright config
@'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
'@ | Out-File -FilePath "C:\dev\playwright.config.ts" -Encoding UTF8

# Update package.json scripts
Write-Host "`n📝 Add these scripts to your package.json:" -ForegroundColor Yellow
@'
{
  "scripts": {
    "test": "nx run-many -t test --all --parallel=4",
    "test:affected": "nx affected -t test",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
'@

Write-Host "`n✅ Testing infrastructure setup complete!" -ForegroundColor Green
Write-Host "📝 Run 'pnpm test' to start testing" -ForegroundColor Cyan
```

---

## Quick Wins (Run Today)

### Quick Win 1: Delete Empty Database

```powershell
# Run this now
if (Test-Path "D:\databases\knowledge_pool.db") {
    $size = (Get-Item "D:\databases\knowledge_pool.db").Length
    if ($size -eq 0) {
        Remove-Item "D:\databases\knowledge_pool.db"
        Write-Host "✅ Deleted empty knowledge_pool.db" -ForegroundColor Green
    }
}
```

### Quick Win 2: Create Task Registry Dirs

```powershell
# Run this now
mkdir -Force "D:\task-registry"
mkdir -Force "D:\task-registry\schemas"
mkdir -Force "D:\agent-context"
Write-Host "✅ Task registry directories created" -ForegroundColor Green
```

### Quick Win 3: Add .npmrc

```powershell
# Run this now
@'
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
'@ | Out-File -FilePath "C:\dev\.npmrc" -Encoding UTF8
Write-Host "✅ .npmrc created for better dependency management" -ForegroundColor Green
```

---

## Verification Scripts

### Verify Monorepo Health

```powershell
# C:\dev\scripts\verify-health.ps1

Write-Host "🏥 Monorepo Health Check" -ForegroundColor Cyan
Write-Host "=" * 60

# Check for multiple node_modules
$nodeModules = Get-ChildItem -Path "C:\dev" -Recurse -Directory -Filter "node_modules" |
    Where-Object { $_.FullName -notlike "*\.pnpm\*" }

Write-Host "`n📦 Node Modules Check:" -ForegroundColor Yellow
if ($nodeModules.Count -le 1) {
    Write-Host "  ✅ Good! Only root node_modules found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Found $($nodeModules.Count) node_modules directories:" -ForegroundColor Red
    $nodeModules | ForEach-Object { Write-Host "     - $($_.FullName)" }
}

# Check for Nx
Write-Host "`n🚀 Build System Check:" -ForegroundColor Yellow
if (Test-Path "C:\dev\nx.json") {
    Write-Host "  ✅ Nx configured" -ForegroundColor Green
} else {
    Write-Host "  ❌ Nx not found - install with: pnpm add -D -w nx" -ForegroundColor Red
}

# Check for CI/CD
Write-Host "`n🔧 CI/CD Check:" -ForegroundColor Yellow
if (Test-Path "C:\dev\.github\workflows\ci.yml") {
    Write-Host "  ✅ CI/CD pipeline configured" -ForegroundColor Green
} else {
    Write-Host "  ❌ No CI/CD pipeline found" -ForegroundColor Red
}

# Check for Task Registry
Write-Host "`n📋 Task Registry Check:" -ForegroundColor Yellow
if (Test-Path "D:\task-registry\active_tasks.db") {
    Write-Host "  ✅ Task registry initialized" -ForegroundColor Green
} else {
    Write-Host "  ❌ Task registry not found - run setup-task-registry.ps1" -ForegroundColor Red
}

# Check database health
Write-Host "`n🗄️  Database Check:" -ForegroundColor Yellow
$dbIntegrity = sqlite3 "D:\databases\database.db" "PRAGMA integrity_check;"
if ($dbIntegrity -eq "ok") {
    Write-Host "  ✅ Main database integrity: OK" -ForegroundColor Green
} else {
    Write-Host "  ❌ Database integrity issues detected!" -ForegroundColor Red
}

Write-Host "`n✅ Health check complete!" -ForegroundColor Green
```

---

## Next Steps

1. Run health check: `.\scripts\verify-health.ps1`
2. Execute Phase 1 scripts in order
3. Verify each phase before moving to next
4. Update memory bank after each phase

**Ready to start? Run the Quick Wins first!**



