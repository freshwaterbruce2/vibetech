"""
Error Auto-Resolution - Data Preparation
Extracts agent mistakes from learning database and prepares for NLP classification
"""

import sqlite3
import pandas as pd
import json
from pathlib import Path
from datetime import datetime
import sys
import re

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
LEARNING_DB = Path("D:/databases/agent_learning.db")

def extract_mistakes():
    """Extract all agent mistakes from learning database"""
    print("📊 Extracting mistakes from agent learning database...")

    conn = sqlite3.connect(LEARNING_DB)

    query = """
    SELECT
        id,
        mistake_type,
        mistake_category,
        description,
        root_cause_analysis,
        context_when_occurred,
        impact_severity,
        prevention_strategy,
        identified_at,
        resolved
    FROM agent_mistakes
    ORDER BY identified_at DESC
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"OK Extracted {len(df)} mistakes")
    return df

def clean_text(text):
    """Clean and normalize text data"""
    if pd.isna(text) or text is None:
        return ""

    # Convert to string
    text = str(text)

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove special characters but keep punctuation for NLP
    text = text.strip()

    return text

def extract_text_features(df):
    """Extract features from text fields"""
    print("🔧 Extracting text features...")

    # Clean text fields
    df['description_clean'] = df['description'].apply(clean_text)
    df['context_clean'] = df['context_when_occurred'].apply(clean_text)
    df['root_cause_clean'] = df['root_cause_analysis'].apply(clean_text)
    df['prevention_clean'] = df['prevention_strategy'].apply(clean_text)

    # Combine all text into one field for NLP
    df['full_text'] = (
        df['description_clean'] + ' ' +
        df['context_clean'] + ' ' +
        df['root_cause_clean']
    )

    # Text length features
    df['description_length'] = df['description_clean'].str.len()
    df['context_length'] = df['context_clean'].str.len()
    df['has_root_cause'] = (~df['root_cause_analysis'].isna()).astype(int)
    df['has_prevention'] = (~df['prevention_strategy'].isna()).astype(int)

    # Extract error keywords
    error_patterns = {
        'has_traceback': r'Traceback|File ".*", line',
        'has_exception': r'Exception|Error',
        'has_timeout': r'timeout|timed out',
        'has_connection': r'connection|network|socket',
        'has_file': r'file|directory|path',
        'has_permission': r'permission|access denied|forbidden',
        'has_null': r'null|none|undefined|NaN',
        'has_syntax': r'syntax|parse|invalid',
    }

    for feature_name, pattern in error_patterns.items():
        df[feature_name] = df['full_text'].str.contains(pattern, case=False, regex=True, na=False).astype(int)

    print(f"OK Extracted text features")
    return df

def engineer_features(df):
    """Create additional predictive features"""
    print("[FEAT]  Engineering features...")

    # Time-based features
    df['identified_at'] = pd.to_datetime(df['identified_at'])
    df['hour'] = df['identified_at'].dt.hour
    df['day_of_week'] = df['identified_at'].dt.dayofweek
    df['is_business_hours'] = df['hour'].between(9, 17).astype(int)

    # Severity encoding
    severity_map = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'critical': 4
    }
    df['severity_encoded'] = df['impact_severity'].str.lower().map(severity_map).fillna(2)

    # Resolution status
    df['is_resolved'] = df['resolved'].astype(int)

    # Category encoding (this is our target for classification)
    # Clean up categories
    df['mistake_category_clean'] = df['mistake_category'].fillna('unknown').str.lower().str.strip()

    print(f"OK Engineered features")
    return df

def create_target_variable(df):
    """
    Create target variables for multi-task learning:
    1. Error category (multi-class classification)
    2. Recommended fix (text generation - we'll extract from prevention_strategy)
    """
    print("🎯 Creating target variables...")

    # Target 1: Error category
    category_counts = df['mistake_category_clean'].value_counts()
    print(f"\n  Category distribution:")
    for cat, count in category_counts.items():
        print(f"    {cat}: {count}")

    # For categories with very few samples, merge into 'other'
    min_samples = 3
    rare_categories = category_counts[category_counts < min_samples].index
    df['category_target'] = df['mistake_category_clean'].apply(
        lambda x: 'other' if x in rare_categories else x
    )

    # Target 2: Has fix suggestion (binary - do we have a prevention strategy?)
    df['has_fix'] = (~df['prevention_strategy'].isna()).astype(int)

    print(f"\nOK Targets created:")
    print(f"    Categories: {df['category_target'].nunique()} unique")
    print(f"    Has fix: {df['has_fix'].sum()} / {len(df)} ({df['has_fix'].mean()*100:.1f}%)")

    return df

def save_datasets(df):
    """Save raw and processed datasets"""
    print("\n💾 Saving datasets...")

    # Save raw data
    raw_path = DATA_RAW / "mistakes_raw.csv"
    df.to_csv(raw_path, index=False)
    print(f"  OK Raw data saved: {raw_path}")

    # Select features for ML
    feature_cols = [
        # Text features (for NLP model)
        'full_text', 'description_clean', 'prevention_clean',
        # Numeric features
        'description_length', 'context_length',
        'has_root_cause', 'has_prevention',
        'severity_encoded', 'is_resolved',
        'hour', 'day_of_week', 'is_business_hours',
        # Keyword features
        'has_traceback', 'has_exception', 'has_timeout',
        'has_connection', 'has_file', 'has_permission',
        'has_null', 'has_syntax',
        # Targets
        'category_target', 'has_fix'
    ]

    df_ml = df[feature_cols].copy()

    # Remove rows with empty text
    df_ml = df_ml[df_ml['full_text'].str.len() > 10]

    # Save processed data
    processed_path = DATA_PROCESSED / "mistakes_processed.csv"
    df_ml.to_csv(processed_path, index=False)
    print(f"  OK Processed data saved: {processed_path}")

    # Train/test split (80/20)
    from sklearn.model_selection import train_test_split

    X = df_ml.drop(['category_target', 'has_fix'], axis=1)
    y_category = df_ml['category_target']
    y_has_fix = df_ml['has_fix']

    X_train, X_test, y_cat_train, y_cat_test, y_fix_train, y_fix_test = train_test_split(
        X, y_category, y_has_fix,
        test_size=0.2,
        random_state=42,
        stratify=y_category
    )

    # Save splits
    train_df = pd.concat([X_train, y_cat_train, y_fix_train], axis=1)
    test_df = pd.concat([X_test, y_cat_test, y_fix_test], axis=1)

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
        'categories': y_category.value_counts().to_dict(),
        'has_fix_distribution': {
            'with_fix': int(y_has_fix.sum()),
            'without_fix': int(len(y_has_fix) - y_has_fix.sum()),
            'with_fix_pct': float(y_has_fix.mean() * 100)
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
    print("ERROR AUTO-RESOLUTION - DATA PREPARATION")
    print("="*60 + "\n")

    try:
        # Extract
        df = extract_mistakes()

        # Extract text features
        df = extract_text_features(df)

        # Engineer features
        df = engineer_features(df)

        # Create targets
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
        print(f"  Categories: {len(stats['categories'])}")
        print(f"  Errors with fixes: {stats['has_fix_distribution']['with_fix']} ({stats['has_fix_distribution']['with_fix_pct']:.1f}%)")
        print(f"\n📁 Data saved to: {DATA_PROCESSED}")

        return 0

    except Exception as e:
        print(f"\n[ERROR] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
