# ML Projects - Unified Machine Learning Repository

**Created**: 2025-11-09
**Integrated with**: D Drive SSoT System
**Framework**: XGBoost, scikit-learn, Sentence-BERT

---

## 🎯 Active Projects

### 1. Crypto Trading Signal Prediction
**Path**: `./crypto-signal-prediction/`
**Goal**: Predict trade success probability from historical order data
**Status**: In Development
**Dataset**: 918 crypto trading orders from `C:\dev\projects\crypto-enhanced\trading.db`

**Metrics**:
- Target: Binary classification (profitable vs unprofitable)
- Baseline: Random (50%)
- Goal: >70% accuracy

**Task ID**: `ml-20251109-crypto-signals` (tracked in D:\task-registry\active_tasks.db)

---

### 2. Error Auto-Resolution
**Path**: `./error-auto-resolution/`
**Goal**: Automatically categorize runtime errors and suggest fixes
**Status**: In Development
**Dataset**: 101 agent mistakes from `D:\databases\agent_learning.db`

**Metrics**:
- Target: Multi-class classification (error categories)
- Baseline: Most frequent class
- Goal: >80% category accuracy + meaningful fix suggestions

**Task ID**: `ml-20251109-error-resolution` (tracked in D:\task-registry\active_tasks.db)

---

### 3. Trading Confidence Calibration
**Path**: `./confidence-calibration/`
**Goal**: Improve confidence score accuracy for Mean Reversion trading signals
**Status**: In Development
**Dataset**: Trading logs with signal confidence and actual outcomes

**Metrics**:
- Target: Regression (calibrated confidence 0-100%)
- Baseline: Current confidence scores
- Goal: <10% mean absolute error on confidence

**Task ID**: `ml-20251109-confidence-calib` (tracked in D:\task-registry\active_tasks.db)

---

## 📁 Project Structure

Each project follows this structure:

```
project-name/
├── data/
│   ├── raw/              # Original extracted data
│   ├── processed/        # Cleaned and feature-engineered data
│   └── train_test/       # Split datasets
├── notebooks/
│   ├── 01_eda.ipynb     # Exploratory data analysis
│   ├── 02_features.ipynb # Feature engineering
│   └── 03_training.ipynb # Model training experiments
├── src/
│   ├── data_prep.py     # Data extraction and preprocessing
│   ├── features.py      # Feature engineering functions
│   ├── train.py         # Model training script
│   ├── evaluate.py      # Model evaluation
│   └── predict.py       # Inference API
├── models/
│   ├── baseline.pkl     # Simple baseline model
│   └── best_model.pkl   # Best performing model
└── results/
    ├── metrics.json     # Training metrics
    ├── confusion_matrix.png
    └── feature_importance.png
```

---

## 🚀 Quick Start

### Training a Model

```bash
cd C:/dev/ml-projects/{project-name}

# 1. Extract and prepare data
python src/data_prep.py

# 2. Train model
python src/train.py

# 3. Evaluate
python src/evaluate.py

# 4. Run predictions
python src/predict.py
```

### Querying Tasks

```powershell
# List all ML tasks
D:\scripts\task-manager.ps1 list-ml

# Get specific task details
D:\scripts\task-manager.ps1 get ml-20251109-crypto-signals
```

---

## 🔗 Integration

### With Claude Desktop
Claude Desktop can query task status and model metrics via SQLite MCP servers:
- `sqlite-tasks` → Task registry
- `sqlite-learning` → Agent learning database
- `sqlite-nova` → Activity tracking

**Example Query**: "What's the accuracy of my crypto signal prediction model?"

### With NOVA Agent
NOVA tracks:
- Model training time (deep work sessions)
- Experiment iterations
- Performance improvements over time

### With Vibe Code Studio
Code editor integration:
- Real-time error categorization
- Auto-suggested fixes from ML model
- Confidence scores on trading signals

---

## 📊 Success Criteria

- [x] Projects created with proper structure
- [ ] All datasets extracted and preprocessed
- [ ] Baseline models trained and evaluated
- [ ] ML models trained with >10% improvement over baseline
- [ ] Task registry entries created
- [ ] Context files created
- [ ] Models integrated with production systems
- [ ] Documentation complete

---

## 🔄 Workflow

1. **Data Extraction**: Pull from SQLite databases
2. **EDA**: Understand data distributions and patterns
3. **Feature Engineering**: Create predictive features
4. **Baseline Model**: Simple heuristic for comparison
5. **ML Model**: Train XGBoost/other algorithms
6. **Hyperparameter Tuning**: Grid search or Optuna
7. **Evaluation**: Test set performance
8. **Production Deploy**: Integrate with existing systems
9. **Monitoring**: Track performance over time

---

## 📝 Notes

- All models use XGBoost by default (fast, accurate, interpretable)
- Feature importance is logged for every model
- Experiments tracked in context files under `D:\agent-context\ml_projects\`
- Models versioned with timestamps
- Results automatically backed up to `D:\databases\backups\`

---

**Last Updated**: 2025-11-09
**Maintained By**: Bruce (with Claude Code assistance)
**Framework Versions**:
- Python: 3.13
- XGBoost: Latest
- scikit-learn: Latest
- pandas: Latest
