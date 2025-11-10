"""
Trading Confidence Calibration - Data Preparation
Extracts trading signals from logs and prepares for confidence score regression
"""

import pandas as pd
import json
import re
from pathlib import Path
from datetime import datetime
import sys
from glob import glob

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
DATA_TRAIN_TEST = PROJECT_ROOT / "data" / "train_test"

# Create directories
DATA_RAW.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
DATA_TRAIN_TEST.mkdir(parents=True, exist_ok=True)

# Logs directory
LOGS_DIR = Path("C:/dev/projects/crypto-enhanced/logs/")

def parse_signal_line(line):
    """
    Parse a trading signal log line
    Example: 2025-11-07 01:23:19 - MeanReversion - INFO - logger.py:85 - SIGNAL | MeanReversion   | XLM/USD  | buy  @ $0.2753 | Confidence: 100.00%
    """
    # Pattern to extract signal information
    pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*SIGNAL.*\|\s*(\w+)\s*\|\s*([\w/]+)\s*\|\s*(\w+)\s*@\s*\$?([\d.]+)\s*\|\s*Confidence:\s*([\d.]+)%'

    match = re.search(pattern, line)
    if match:
        return {
            'timestamp': match.group(1),
            'strategy': match.group(2),
            'symbol': match.group(3),
            'side': match.group(4),
            'price': float(match.group(5)),
            'confidence': float(match.group(6))
        }
    return None

def extract_signals_from_logs():
    """Extract all trading signals from log files"""
    print("📊 Extracting trading signals from logs...")

    signals = []
    log_files = list(LOGS_DIR.glob("*.log"))

    print(f"  Found {len(log_files)} log files")

    for log_file in log_files:
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    if 'SIGNAL' in line and 'Confidence' in line:
                        signal = parse_signal_line(line)
                        if signal:
                            signal['log_file'] = log_file.name
                            signals.append(signal)
        except Exception as e:
            print(f"  Warning: Could not read {log_file.name}: {e}")

    df = pd.DataFrame(signals)
    print(f"OK Extracted {len(df)} signals from {len(log_files)} log files")

    return df

def engineer_features(df):
    """Create features for confidence calibration"""
    print("[FEAT]  Engineering features...")

    # Time-based features
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_market_hours'] = df['hour'].between(9, 16).astype(int)  # Trading hours
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # Price features
    df['price_level'] = pd.cut(df['price'], bins=10, labels=False)  # Discretize price

    # Strategy encoding
    strategy_dummies = pd.get_dummies(df['strategy'], prefix='strategy')
    df = pd.concat([df, strategy_dummies], axis=1)

    # Side encoding
    df['side_encoded'] = df['side'].map({'buy': 1, 'sell': 0})

    # Symbol encoding
    symbol_dummies = pd.get_dummies(df['symbol'], prefix='symbol')
    df = pd.concat([df, symbol_dummies], axis=1)

    # Confidence bins (for analysis)
    df['confidence_bin'] = pd.cut(df['confidence'], bins=[0, 25, 50, 75, 90, 100], labels=['very_low', 'low', 'medium', 'high', 'very_high'])

    # Aggregate statistics (rolling features)
    df = df.sort_values('timestamp')

    # Rolling mean confidence for same strategy
    df['confidence_rolling_mean_5'] = df.groupby('strategy')['confidence'].transform(
        lambda x: x.rolling(window=5, min_periods=1).mean()
    )

    # Rolling std confidence
    df['confidence_rolling_std_5'] = df.groupby('strategy')['confidence'].transform(
        lambda x: x.rolling(window=5, min_periods=1).std().fillna(0)
    )

    print(f"OK Engineered features")
    return df

def create_target_variable(df):
    """
    Create target variable for confidence calibration

    Ideally, we'd have actual trade outcomes to measure if the confidence was accurate
    For now, we'll use:
    1. Observed confidence (what the model predicted)
    2. We'll need to validate against actual trade success later

    Since we don't have ground truth yet, we'll prepare the data structure
    and use confidence itself as a baseline target (identity function)
    """
    print("🎯 Creating target variable...")

    # For now, target is the original confidence
    # In production, replace with: actual_success_rate or calibrated_confidence from backtesting
    df['target_confidence'] = df['confidence']

    # Mark overconfident vs underconfident based on simple heuristic
    # If confidence is 100%, it's likely overconfident (nothing is 100% certain in trading)
    df['is_overconfident'] = (df['confidence'] == 100.0).astype(int)

    # Very high confidence (>95%) might need calibration
    df['needs_calibration'] = (df['confidence'] > 95.0).astype(int)

    print(f"OK Target variable created")
    print(f"    Signals needing calibration: {df['needs_calibration'].sum()} / {len(df)} ({df['needs_calibration'].mean()*100:.1f}%)")

    return df

def save_datasets(df):
    """Save raw and processed datasets"""
    print("\n💾 Saving datasets...")

    # Save raw data
    raw_path = DATA_RAW / "signals_raw.csv"
    df.to_csv(raw_path, index=False)
    print(f"  OK Raw data saved: {raw_path}")

    # Select features for ML (exclude non-numeric and target)
    exclude_cols = ['timestamp', 'strategy', 'symbol', 'side', 'log_file', 'confidence_bin', 'target_confidence']

    feature_cols = [col for col in df.columns if col not in exclude_cols]

    X_cols = [col for col in feature_cols if col not in ['is_overconfident', 'needs_calibration']]
    y_col = 'target_confidence'

    df_ml = df[X_cols + [y_col]].copy()

    # Remove NaN
    df_ml = df_ml.dropna()

    # Save processed data
    processed_path = DATA_PROCESSED / "signals_processed.csv"
    df_ml.to_csv(processed_path, index=False)
    print(f"  OK Processed data saved: {processed_path}")

    # Train/test split (80/20)
    from sklearn.model_selection import train_test_split

    X = df_ml.drop(y_col, axis=1)
    y = df_ml[y_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Save splits
    train_df = pd.concat([X_train, y_train], axis=1)
    test_df = pd.concat([X_test, y_test], axis=1)

    train_path = DATA_TRAIN_TEST / "train.csv"
    test_path = DATA_TRAIN_TEST / "test.csv"

    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"  OK Train set: {len(train_df)} samples → {train_path}")
    print(f"  OK Test set: {len(test_df)} samples → {test_path}")

    # Save dataset statistics
    stats = {
        'total_samples': len(df_ml),
        'train_samples': len(train_df),
        'test_samples': len(test_df),
        'num_features': len(X.columns),
        'feature_names': list(X.columns),
        'confidence_stats': {
            'mean': float(y.mean()),
            'std': float(y.std()),
            'min': float(y.min()),
            'max': float(y.max()),
            'median': float(y.median())
        },
        'created_at': datetime.now().isoformat()
    }

    stats_path = DATA_PROCESSED / "dataset_stats.json"
    with open(stats_path, 'w') as f:
        json.dump(stats, f, indent=2)

    print(f"  OK Dataset stats saved: {stats_path}")

    return stats

def main():
    """Main data preparation pipeline"""
    print("\n" + "="*60)
    print("TRADING CONFIDENCE CALIBRATION - DATA PREPARATION")
    print("="*60 + "\n")

    try:
        # Extract
        df = extract_signals_from_logs()

        if len(df) == 0:
            print("\n[ERROR] No signals found in logs!")
            return 1

        # Engineer features
        df = engineer_features(df)

        # Create target
        df = create_target_variable(df)

        # Save
        stats = save_datasets(df)

        print("\n" + "="*60)
        print("[SUCCESS] DATA PREPARATION COMPLETE")
        print("="*60)
        print(f"\nDataset Statistics:")
        print(f"  Total samples: {stats['total_samples']}")
        print(f"  Training: {stats['train_samples']} | Test: {stats['test_samples']}")
        print(f"  Features: {stats['num_features']}")
        print(f"  Confidence range: {stats['confidence_stats']['min']:.1f}% - {stats['confidence_stats']['max']:.1f}%")
        print(f"  Mean confidence: {stats['confidence_stats']['mean']:.1f}%")
        print(f"\n📁 Data saved to: {DATA_PROCESSED}")

        return 0

    except Exception as e:
        print(f"\n[ERROR] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
