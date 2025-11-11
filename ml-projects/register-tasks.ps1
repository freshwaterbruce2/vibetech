# Register all three ML projects in task registry

$ErrorActionPreference = "Stop"

$taskDb = "D:\task-registry\active_tasks.db"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Task 1: Crypto Trading Signal Prediction
$task1Id = "ml-$timestamp-crypto-signals"
$task1Query = @"
INSERT INTO ml_training_tasks (
    task_id,
    dataset_path,
    target_variable,
    problem_type,
    framework,
    project_path,
    status,
    notes
) VALUES (
    '$task1Id',
    'C:\dev\ml-projects\crypto-signal-prediction\data\processed\orders_processed.csv',
    'is_profitable',
    'classification',
    'xgboost',
    'C:\dev\ml-projects\crypto-signal-prediction',
    'in_progress',
    'Predict trade success probability from 918 historical orders. Binary classification with 3% positive class (highly imbalanced). Dataset: 67 samples after preprocessing.'
);
"@

# Task 2: Error Auto-Resolution
$task2Id = "ml-$timestamp-error-resolution"
$task2Query = @"
INSERT INTO ml_training_tasks (
    task_id,
    dataset_path,
    target_variable,
    problem_type,
    framework,
    project_path,
    status,
    notes
) VALUES (
    '$task2Id',
    'C:\dev\ml-projects\error-auto-resolution\data\processed\mistakes_processed.csv',
    'category_target',
    'classification',
    'xgboost',
    'C:\dev\ml-projects\error-auto-resolution',
    'in_progress',
    'Auto-categorize runtime errors and suggest fixes. NLP-based classification with 101 agent mistakes. Will use clustering for category discovery.'
);
"@

# Task 3: Trading Confidence Calibration
$task3Id = "ml-$timestamp-confidence-calib"
$task3Query = @"
INSERT INTO ml_training_tasks (
    task_id,
    dataset_path,
    target_variable,
    problem_type,
    framework,
    project_path,
    status,
    notes
) VALUES (
    '$task3Id',
    'C:\dev\ml-projects\confidence-calibration\data\processed\signals_processed.csv',
    'target_confidence',
    'regression',
    'xgboost',
    'C:\dev\ml-projects\confidence-calibration',
    'in_progress',
    'Calibrate confidence scores for Mean Reversion trading signals. Regression task with 29 signal samples. Mean confidence: 77.1%, range: 43.8% - 100%.'
);
"@

Write-Host "`n[DATA] Creating task registry entries..." -ForegroundColor Cyan

# Insert tasks
sqlite3 $taskDb $task1Query
Write-Host "  OK Task 1: $task1Id" -ForegroundColor Green

sqlite3 $taskDb $task2Query
Write-Host "  OK Task 2: $task2Id" -ForegroundColor Green

sqlite3 $taskDb $task3Query
Write-Host "  OK Task 3: $task3Id" -ForegroundColor Green

# Create context files
$contextDir = "D:\agent-context\ml_projects"
if (-not (Test-Path $contextDir)) {
    New-Item -ItemType Directory -Path $contextDir -Force | Out-Null
}

Write-Host "`n[DATA] Creating context files..." -ForegroundColor Cyan

# Context 1: Crypto Signals
$context1 = @{
    task_id = $task1Id
    created_at = (Get-Date).ToString("o")
    project = @{
        name = "Crypto Trading Signal Prediction"
        path = "C:\dev\ml-projects\crypto-signal-prediction"
        goal = "Predict whether a trading order will be profitable based on order characteristics"
    }
    dataset = @{
        primary = "C:\dev\ml-projects\crypto-signal-prediction\data\processed\orders_processed.csv"
        source = "C:\dev\projects\crypto-enhanced\trading.db"
        target = "is_profitable"
        size = "67 samples (53 train / 14 test)"
        features = @(
            "volume", "price", "stop_loss", "take_profit",
            "estimated_fee", "estimated_total_cost",
            "hour_of_day", "day_of_week", "is_weekend",
            "risk_reward_ratio", "stop_loss_distance", "take_profit_distance",
            "total_value", "side_encoded", "order_type_encoded"
        )
    }
    problem = @{
        type = "binary_classification"
        framework = "xgboost"
        challenge = "Highly imbalanced dataset (3% positive class)"
        metrics = @("accuracy", "precision", "recall", "f1_score", "roc_auc")
    }
    experiments = @()
    current_status = "in_progress"
    next_steps = @(
        "Handle class imbalance (SMOTE or class weights)",
        "Train baseline model (majority class classifier)",
        "Train XGBoost with balanced class weights",
        "Evaluate with stratified cross-validation",
        "Feature importance analysis"
    )
    blockers = @()
} | ConvertTo-Json -Depth 10

$context1 | Out-File "$contextDir\$task1Id.json" -Encoding UTF8
Write-Host "  OK Context 1: $contextDir\$task1Id.json" -ForegroundColor Green

# Context 2: Error Resolution
$context2 = @{
    task_id = $task2Id
    created_at = (Get-Date).ToString("o")
    project = @{
        name = "Error Auto-Resolution"
        path = "C:\dev\ml-projects\error-auto-resolution"
        goal = "Automatically categorize runtime errors and suggest fixes based on historical mistakes"
    }
    dataset = @{
        primary = "C:\dev\ml-projects\error-auto-resolution\data\processed\mistakes_processed.csv"
        source = "D:\databases\agent_learning.db"
        target = "category_target"
        size = "101 samples (80 train / 21 test)"
        features = @(
            "full_text", "description_clean", "prevention_clean",
            "description_length", "context_length",
            "has_root_cause", "has_prevention",
            "severity_encoded", "is_resolved",
            "hour", "day_of_week", "is_business_hours",
            "has_traceback", "has_exception", "has_timeout",
            "has_connection", "has_file", "has_permission",
            "has_null", "has_syntax"
        )
    }
    problem = @{
        type = "clustering_and_classification"
        framework = "sklearn (KMeans + XGBoost)"
        challenge = "All errors currently in 'unknown' category - need unsupervised learning"
        metrics = @("silhouette_score", "davies_bouldin_score", "cluster_coherence")
    }
    experiments = @()
    current_status = "in_progress"
    next_steps = @(
        "Apply TF-IDF or Sentence-BERT embeddings on text",
        "Use K-Means or DBSCAN for category discovery",
        "Analyze clusters and assign meaningful labels",
        "Train classifier on discovered categories",
        "Extract common error patterns for fix suggestions"
    )
    blockers = @()
} | ConvertTo-Json -Depth 10

$context2 | Out-File "$contextDir\$task2Id.json" -Encoding UTF8
Write-Host "  OK Context 2: $contextDir\$task2Id.json" -ForegroundColor Green

# Context 3: Confidence Calibration
$context3 = @{
    task_id = $task3Id
    created_at = (Get-Date).ToString("o")
    project = @{
        name = "Trading Confidence Calibration"
        path = "C:\dev\ml-projects\confidence-calibration"
        goal = "Improve accuracy of confidence scores for Mean Reversion trading signals"
    }
    dataset = @{
        primary = "C:\dev\ml-projects\confidence-calibration\data\processed\signals_processed.csv"
        source = "C:\dev\projects\crypto-enhanced\logs/*.log"
        target = "target_confidence"
        size = "29 samples (23 train / 6 test)"
        features = @(
            "price", "hour", "day_of_week",
            "is_market_hours", "is_weekend", "price_level",
            "side_encoded", "confidence_rolling_mean_5",
            "confidence_rolling_std_5", "strategy_MeanReversion"
        )
    }
    problem = @{
        type = "regression"
        framework = "xgboost"
        challenge = "Small dataset (29 samples), need to validate against actual trade outcomes"
        metrics = @("mae", "rmse", "r2_score", "calibration_error")
    }
    experiments = @()
    current_status = "in_progress"
    next_steps = @(
        "Train baseline (identity function - current confidence)",
        "Train XGBoost regressor",
        "Calculate calibration curves",
        "Identify overconfident signals (confidence = 100%)",
        "Integrate with trading bot for real-time calibration"
    )
    blockers = @(
        "Need to collect actual trade outcomes to validate calibration"
    )
} | ConvertTo-Json -Depth 10

$context3 | Out-File "$contextDir\$task3Id.json" -Encoding UTF8
Write-Host "  OK Context 3: $contextDir\$task3Id.json" -ForegroundColor Green

Write-Host "`n[SUCCESS] All tasks registered successfully!" -ForegroundColor Green
Write-Host "`nTask IDs:" -ForegroundColor White
Write-Host "  1. $task1Id" -ForegroundColor Gray
Write-Host "  2. $task2Id" -ForegroundColor Gray
Write-Host "  3. $task3Id" -ForegroundColor Gray

Write-Host "`nQuery tasks:" -ForegroundColor White
Write-Host "  D:\scripts\task-manager.ps1 list-ml" -ForegroundColor DarkGray
