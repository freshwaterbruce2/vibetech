"""
Crypto Trading Signal Prediction - Data Preparation
Extracts order data from trading.db and prepares features for ML model
"""

import sqlite3
import pandas as pd
import json
from pathlib import Path
from datetime import datetime
import sys

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
DATA_TRAIN_TEST = PROJECT_ROOT / "data" / "train_test"

# Create directories
DATA_RAW.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
DATA_TRAIN_TEST.mkdir(parents=True, exist_ok=True)

# Database path
TRADING_DB = Path("C:/dev/projects/crypto-enhanced/trading.db")

def extract_orders():
    """Extract all orders from trading database"""
    print("📊 Extracting orders from trading database...")

    conn = sqlite3.connect(TRADING_DB)

    # Get orders with detailed metadata
    query = """
    SELECT
        o.id,
        o.pair as symbol,
        o.side,
        o.order_type,
        o.volume,
        o.price,
        o.status,
        o.created_at,
        o.updated_at,
        o.metadata
    FROM orders o
    ORDER BY o.created_at
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"OK Extracted {len(df)} orders")
    return df

def parse_metadata(df):
    """Parse JSON metadata into separate columns"""
    print("🔧 Parsing order metadata...")

    metadata_features = []

    for idx, row in df.iterrows():
        try:
            meta = json.loads(row['metadata']) if row['metadata'] else {}
            metadata_features.append({
                'stop_loss': float(meta.get('stop_loss', 0)),
                'take_profit': float(meta.get('take_profit', 0)),
                'estimated_fee': float(meta.get('estimated_fee', 0)),
                'estimated_total_cost': float(meta.get('estimated_total_cost', 0)),
                'method': meta.get('method', 'unknown')
            })
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            # Default values for failed parsing
            metadata_features.append({
                'stop_loss': 0,
                'take_profit': 0,
                'estimated_fee': 0,
                'estimated_total_cost': 0,
                'method': 'unknown'
            })

    meta_df = pd.DataFrame(metadata_features)
    df = pd.concat([df.drop('metadata', axis=1), meta_df], axis=1)

    print(f"OK Parsed metadata for {len(df)} orders")
    return df

def engineer_features(df):
    """Create predictive features from raw data"""
    print("[FEAT]  Engineering features...")

    # Time-based features
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['updated_at'] = pd.to_datetime(df['updated_at'])
    df['hour_of_day'] = df['created_at'].dt.hour
    df['day_of_week'] = df['created_at'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # Price-based features
    df['risk_reward_ratio'] = (df['take_profit'] - df['price']) / (df['price'] - df['stop_loss'])
    df['stop_loss_distance'] = ((df['price'] - df['stop_loss']) / df['price']) * 100  # %
    df['take_profit_distance'] = ((df['take_profit'] - df['price']) / df['price']) * 100  # %

    # Volume features
    df['total_value'] = df['volume'] * df['price']

    # Categorical encoding
    df['side_encoded'] = df['side'].map({'buy': 1, 'sell': 0})
    df['order_type_encoded'] = df['order_type'].map({'limit': 1, 'market': 0})

    # Target variable (we'll need to join with trades table to see if order was profitable)
    # For now, use status as proxy - 'filled' orders that completed are considered successful
    df['successful'] = (df['status'] == 'filled').astype(int)

    print(f"OK Engineered {len(df.columns)} features")
    return df

def create_target_variable(df):
    """
    Create target variable by analyzing order outcomes
    Since we don't have complete trade outcome data, we'll use a proxy:
    - Orders that were filled are candidates for success
    - We'll need to fetch actual trade data if available
    """
    print("🎯 Creating target variable...")

    # Connect to get trade outcomes
    conn = sqlite3.connect(TRADING_DB)

    # Get trades table
    trades_query = "SELECT * FROM trades"
    try:
        trades_df = pd.read_sql_query(trades_query, conn)
        print(f"  Found {len(trades_df)} executed trades")

        # For now, mark orders as successful if they appear in trades table
        # In production, calculate actual P&L
        if len(trades_df) > 0:
            trade_order_ids = trades_df['id'].unique() if 'id' in trades_df.columns else []
            df['is_profitable'] = df['id'].isin(trade_order_ids).astype(int)
        else:
            # Fallback: use 'filled' status as proxy
            df['is_profitable'] = (df['status'] == 'filled').astype(int)
    except Exception as e:
        print(f"  Warning: Could not fetch trades data: {e}")
        df['is_profitable'] = (df['status'] == 'filled').astype(int)

    conn.close()

    print(f"OK Target variable created: {df['is_profitable'].sum()} profitable / {len(df)} total")
    return df

def save_datasets(df):
    """Save raw and processed datasets"""
    print("💾 Saving datasets...")

    # Save raw data
    raw_path = DATA_RAW / "orders_raw.csv"
    df.to_csv(raw_path, index=False)
    print(f"  OK Raw data saved: {raw_path}")

    # Select features for ML
    feature_cols = [
        'volume', 'price', 'stop_loss', 'take_profit',
        'estimated_fee', 'estimated_total_cost',
        'hour_of_day', 'day_of_week', 'is_weekend',
        'risk_reward_ratio', 'stop_loss_distance', 'take_profit_distance',
        'total_value', 'side_encoded', 'order_type_encoded',
        'is_profitable'  # target
    ]

    df_ml = df[feature_cols].copy()

    # Remove any rows with NaN or inf values
    df_ml = df_ml.replace([float('inf'), float('-inf')], float('nan'))
    df_ml = df_ml.dropna()

    # Save processed data
    processed_path = DATA_PROCESSED / "orders_processed.csv"
    df_ml.to_csv(processed_path, index=False)
    print(f"  OK Processed data saved: {processed_path}")

    # Train/test split (80/20)
    from sklearn.model_selection import train_test_split

    X = df_ml.drop('is_profitable', axis=1)
    y = df_ml['is_profitable']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if y.sum() > 0 else None
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
        'target_distribution': {
            'profitable': int(y.sum()),
            'unprofitable': int(len(y) - y.sum()),
            'profitable_pct': float(y.mean() * 100)
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
    print("CRYPTO TRADING SIGNAL PREDICTION - DATA PREPARATION")
    print("="*60 + "\n")

    try:
        # Extract
        df = extract_orders()

        # Parse metadata
        df = parse_metadata(df)

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
        print(f"  Profitable orders: {stats['target_distribution']['profitable']} ({stats['target_distribution']['profitable_pct']:.1f}%)")
        print(f"\n📁 Data saved to: {DATA_PROCESSED}")

        return 0

    except Exception as e:
        print(f"\n[ERROR] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
