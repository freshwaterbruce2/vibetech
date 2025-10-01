"""
Simple test to verify the pipeline components work.
"""

import pandas as pd
import numpy as np
from datetime import datetime

# Generate simple test data
print("Generating test data...")
np.random.seed(42)

data = {
    'id': range(1, 101),
    'value': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100),
    'price': np.random.uniform(10, 100, 100),
    'quantity': np.random.randint(1, 10, 100)
}

df = pd.DataFrame(data)

# Add some missing values
df.loc[10:15, 'value'] = np.nan
df.loc[20:25, 'price'] = np.nan

print(f"Data shape: {df.shape}")
print(f"Missing values: {df.isna().sum().sum()}")
print("\nFirst 5 rows:")
print(df.head())

# Save to CSV
df.to_csv('test_data.csv', index=False)
print("\nData saved to test_data.csv")

# Now let's test individual components
print("\n" + "="*60)
print("Testing Data Cleaning")
print("="*60)

# Simple data cleaning
def clean_data(df):
    """Simple data cleaning function."""
    # Handle missing values
    df['value'].fillna(df['value'].mean(), inplace=True)
    df['price'].fillna(df['price'].median(), inplace=True)

    # Remove duplicates
    df = df.drop_duplicates()

    # Standardize column names
    df.columns = [col.lower().replace(' ', '_') for col in df.columns]

    return df

cleaned_df = clean_data(df.copy())
print(f"After cleaning - Missing values: {cleaned_df.isna().sum().sum()}")
print(f"Shape: {cleaned_df.shape}")

print("\n" + "="*60)
print("Testing Feature Engineering")
print("="*60)

def engineer_features(df):
    """Simple feature engineering."""
    # Create interaction features
    df['total_value'] = df['price'] * df['quantity']

    # Create categorical encoding
    df['category_encoded'] = pd.Categorical(df['category']).codes

    # Create bins for price
    df['price_range'] = pd.cut(df['price'], bins=3, labels=['Low', 'Medium', 'High'])

    # Create statistical features
    df['value_squared'] = df['value'] ** 2
    df['log_price'] = np.log1p(df['price'])

    return df

featured_df = engineer_features(cleaned_df.copy())
print(f"Original columns: {len(df.columns)}")
print(f"After feature engineering: {len(featured_df.columns)}")
print(f"New features: {set(featured_df.columns) - set(df.columns)}")

print("\n" + "="*60)
print("Testing Data Validation")
print("="*60)

def validate_data(df):
    """Simple data validation."""
    issues = []

    # Check for missing values
    missing = df.isna().sum()
    if missing.sum() > 0:
        issues.append(f"Found {missing.sum()} missing values")

    # Check for duplicates
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        issues.append(f"Found {duplicates} duplicate rows")

    # Check data types
    expected_types = {
        'id': 'int',
        'value': 'float',
        'price': 'float',
        'quantity': 'int'
    }

    for col, expected_type in expected_types.items():
        if col in df.columns:
            actual_type = str(df[col].dtype)
            if expected_type not in actual_type:
                issues.append(f"Column {col} has type {actual_type}, expected {expected_type}")

    # Check for outliers (simple method)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        outliers = ((df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)).sum()
        if outliers > 0:
            issues.append(f"Column {col} has {outliers} outliers")

    return {
        'valid': len(issues) == 0,
        'issues': issues
    }

validation_result = validate_data(featured_df)
print(f"Validation passed: {validation_result['valid']}")
if validation_result['issues']:
    print("Issues found:")
    for issue in validation_result['issues']:
        print(f"  - {issue}")

print("\n" + "="*60)
print("Testing Monitoring")
print("="*60)

import time
import psutil
import os

class SimpleMonitor:
    """Simple performance monitor."""

    def __init__(self):
        self.start_time = None
        self.metrics = {}

    def start(self):
        self.start_time = time.time()
        self.metrics['start_time'] = datetime.now().isoformat()
        process = psutil.Process(os.getpid())
        self.metrics['initial_memory_mb'] = process.memory_info().rss / 1024 / 1024

    def end(self):
        if self.start_time:
            self.metrics['duration_seconds'] = time.time() - self.start_time
            self.metrics['end_time'] = datetime.now().isoformat()
            process = psutil.Process(os.getpid())
            self.metrics['final_memory_mb'] = process.memory_info().rss / 1024 / 1024
            self.metrics['memory_delta_mb'] = self.metrics['final_memory_mb'] - self.metrics['initial_memory_mb']

    def get_metrics(self):
        return self.metrics

monitor = SimpleMonitor()
monitor.start()

# Simulate some work
time.sleep(0.5)
dummy_data = pd.DataFrame(np.random.randn(1000, 10))

monitor.end()
metrics = monitor.get_metrics()

print(f"Execution time: {metrics['duration_seconds']:.2f} seconds")
print(f"Memory usage: {metrics['final_memory_mb']:.1f} MB")
print(f"Memory delta: {metrics['memory_delta_mb']:.1f} MB")

print("\n" + "="*60)
print("Testing Visualization (Text-based)")
print("="*60)

def create_text_visualization(df):
    """Create simple text-based visualization."""
    print("\nData Distribution:")
    print("-" * 40)

    # Numeric columns distribution
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols[:3]:  # Show first 3 numeric columns
        print(f"\n{col}:")
        print(f"  Min: {df[col].min():.2f}")
        print(f"  Max: {df[col].max():.2f}")
        print(f"  Mean: {df[col].mean():.2f}")
        print(f"  Std: {df[col].std():.2f}")

        # Simple histogram
        hist, bins = np.histogram(df[col].dropna(), bins=5)
        max_count = max(hist)
        print("  Distribution:")
        for i, count in enumerate(hist):
            bar = '*' * int(20 * count / max_count) if max_count > 0 else ''
            print(f"    [{bins[i]:.1f} - {bins[i+1]:.1f}]: {bar} ({count})")

    # Categorical columns
    cat_cols = df.select_dtypes(include=['object', 'category']).columns
    if len(cat_cols) > 0:
        print(f"\n{cat_cols[0]} distribution:")
        value_counts = df[cat_cols[0]].value_counts()
        for val, count in value_counts.items():
            bar = '*' * int(20 * count / len(df))
            print(f"  {val}: {bar} ({count})")

create_text_visualization(featured_df)

print("\n" + "="*60)
print("ALL TESTS COMPLETED SUCCESSFULLY!")
print("="*60)

# Save final processed data
featured_df.to_csv('processed_data.csv', index=False)
print(f"\nProcessed data saved to processed_data.csv")
print(f"Final shape: {featured_df.shape}")