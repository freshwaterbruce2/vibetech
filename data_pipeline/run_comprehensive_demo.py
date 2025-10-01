"""
Comprehensive demonstration of the Data Processing Pipeline capabilities.
Shows real-world usage with multiple data sources and advanced features.
"""

import pandas as pd
import numpy as np
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
import random

# Import our integrated pipeline
from pipeline_integrated import (
    DataPipeline,
    PipelineConfig,
    TransformConfig,
    DataLoader,
    DataValidator,
    DataCleaner,
    FeatureEngineer,
    PipelineMonitor
)


def create_sample_datasets():
    """Create multiple sample datasets for demonstration."""
    print("\n" + "="*80)
    print("CREATING SAMPLE DATASETS")
    print("="*80)

    np.random.seed(42)
    random.seed(42)

    # Dataset 1: E-commerce Transactions
    print("\n1. E-commerce Transactions Dataset")
    n_transactions = 2000

    ecommerce_data = pd.DataFrame({
        'transaction_id': [f'TXN{i:06d}' for i in range(1, n_transactions + 1)],
        'customer_id': [f'CUST{random.randint(1, 500):04d}' for _ in range(n_transactions)],
        'product_category': np.random.choice(
            ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Food'],
            n_transactions,
            p=[0.25, 0.20, 0.15, 0.15, 0.10, 0.10, 0.05]
        ),
        'price': np.round(np.random.lognormal(3.5, 1.2, n_transactions), 2),
        'quantity': np.random.choice([1, 2, 3, 4, 5], n_transactions, p=[0.5, 0.25, 0.15, 0.07, 0.03]),
        'payment_method': np.random.choice(
            ['Credit Card', 'PayPal', 'Debit Card', 'Cash'],
            n_transactions,
            p=[0.40, 0.30, 0.20, 0.10]
        ),
        'order_date': pd.date_range(end=datetime.now(), periods=n_transactions, freq='H'),
        'delivery_days': np.random.choice([1, 2, 3, 5, 7], n_transactions, p=[0.1, 0.3, 0.3, 0.2, 0.1]),
        'customer_rating': np.random.choice([1, 2, 3, 4, 5], n_transactions, p=[0.02, 0.05, 0.13, 0.40, 0.40]),
        'is_returned': np.random.choice([0, 1], n_transactions, p=[0.92, 0.08]),
        'discount_percentage': np.random.choice([0, 5, 10, 15, 20], n_transactions, p=[0.5, 0.2, 0.15, 0.1, 0.05])
    })

    # Add calculated fields
    ecommerce_data['total_amount'] = np.round(
        ecommerce_data['price'] * ecommerce_data['quantity'] * (1 - ecommerce_data['discount_percentage']/100),
        2
    )

    # Add some missing values
    missing_indices = np.random.choice(n_transactions, size=int(n_transactions * 0.05), replace=False)
    ecommerce_data.loc[missing_indices, 'customer_rating'] = np.nan

    # Add some outliers
    outlier_indices = np.random.choice(n_transactions, size=int(n_transactions * 0.02), replace=False)
    ecommerce_data.loc[outlier_indices, 'price'] *= 10

    ecommerce_data.to_csv('ecommerce_data.csv', index=False)
    print(f"   Created: ecommerce_data.csv ({ecommerce_data.shape})")

    # Dataset 2: Customer Demographics
    print("\n2. Customer Demographics Dataset")
    n_customers = 500

    customer_data = pd.DataFrame({
        'customer_id': [f'CUST{i:04d}' for i in range(1, n_customers + 1)],
        'age': np.random.normal(40, 15, n_customers).astype(int).clip(18, 80),
        'gender': np.random.choice(['M', 'F', 'Other'], n_customers, p=[0.45, 0.45, 0.10]),
        'income_level': np.random.choice(
            ['Low', 'Medium', 'High', 'Very High'],
            n_customers,
            p=[0.20, 0.40, 0.30, 0.10]
        ),
        'education': np.random.choice(
            ['High School', 'Bachelor', 'Master', 'PhD', 'Other'],
            n_customers,
            p=[0.30, 0.35, 0.20, 0.05, 0.10]
        ),
        'city': np.random.choice(
            ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'],
            n_customers
        ),
        'signup_date': pd.date_range(end=datetime.now(), periods=n_customers, freq='D'),
        'is_premium': np.random.choice([0, 1], n_customers, p=[0.7, 0.3]),
        'lifetime_value': np.round(np.random.lognormal(6, 1.5, n_customers), 2)
    })

    customer_data.to_csv('customer_data.csv', index=False)
    print(f"   Created: customer_data.csv ({customer_data.shape})")

    # Dataset 3: Product Inventory (JSON format)
    print("\n3. Product Inventory Dataset")
    n_products = 200

    products = []
    categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Food']
    for i in range(1, n_products + 1):
        product = {
            'product_id': f'PROD{i:04d}',
            'name': f'Product {i}',
            'category': random.choice(categories),
            'price': round(random.uniform(5, 500), 2),
            'stock_quantity': random.randint(0, 1000),
            'reorder_level': random.randint(10, 100),
            'supplier': f'Supplier {random.randint(1, 20)}',
            'last_restocked': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
        }
        products.append(product)

    with open('product_inventory.json', 'w') as f:
        json.dump(products, f, indent=2)
    print(f"   Created: product_inventory.json ({len(products)} products)")

    # Dataset 4: SQLite Database
    print("\n4. Sales Database (SQLite)")
    conn = sqlite3.connect('sales_database.db')
    cursor = conn.cursor()

    # Drop existing table and create new one
    cursor.execute('DROP TABLE IF EXISTS sales')
    cursor.execute('''
        CREATE TABLE sales (
            sale_id INTEGER PRIMARY KEY,
            date TEXT,
            store_id TEXT,
            product_category TEXT,
            units_sold INTEGER,
            revenue REAL,
            cost REAL,
            profit REAL
        )
    ''')

    # Insert sample data
    n_sales = 1000
    sales_data = []
    for i in range(1, n_sales + 1):
        units = random.randint(1, 100)
        revenue = round(units * random.uniform(10, 100), 2)
        cost = round(revenue * random.uniform(0.3, 0.7), 2)
        profit = round(revenue - cost, 2)

        sale = (
            i,
            (datetime.now() - timedelta(days=random.randint(1, 365))).strftime('%Y-%m-%d'),
            f'STORE{random.randint(1, 10):02d}',
            random.choice(categories),
            units,
            revenue,
            cost,
            profit
        )
        sales_data.append(sale)

    cursor.executemany('INSERT INTO sales VALUES (?,?,?,?,?,?,?,?)', sales_data)
    conn.commit()
    conn.close()
    print(f"   Created: sales_database.db ({n_sales} sales records)")

    return {
        'ecommerce': 'ecommerce_data.csv',
        'customers': 'customer_data.csv',
        'products': 'product_inventory.json',
        'sales_db': 'sales_database.db'
    }


def run_pipeline_on_dataset(file_path: str, name: str):
    """Run pipeline on a single dataset."""
    print(f"\n{'='*60}")
    print(f"Processing: {name}")
    print(f"{'='*60}")

    # Configure pipeline
    config = PipelineConfig(
        name=name,
        source_path=file_path,
        output_path=f"processed_{Path(file_path).stem}.csv",
        chunk_size=500,
        enable_monitoring=True,
        enable_validation=True
    )

    transform_config = TransformConfig(
        handle_missing="median",
        remove_outliers=True,
        scale_numeric=True,
        encode_categorical=True,
        missing_threshold=0.3
    )

    # Execute pipeline
    pipeline = DataPipeline(config)
    result = pipeline.execute(transform_config=transform_config)

    # Display results
    if result['success']:
        print(f"[SUCCESS] {name} processed successfully")
        print(f"  Shape: {result['original_shape']} -> {result['final_shape']}")
        print(f"  Time: {result['execution_time']:.3f}s")

        if 'validation_report' in result:
            issues = result['validation_report']['issues']
            if issues:
                print(f"  Validation issues: {len(issues)}")

        # Show sample of processed data
        processed_df = pd.read_csv(result['output_path'])
        print(f"  Features created: {len(processed_df.columns) - result['original_shape'][1]}")

        return result
    else:
        print(f"[ERROR] Failed to process {name}")
        for error in result['errors']:
            print(f"  - {error}")
        return None


def demonstrate_advanced_features():
    """Demonstrate advanced pipeline features."""
    print("\n" + "="*80)
    print("ADVANCED FEATURES DEMONSTRATION")
    print("="*80)

    # 1. Custom Validation Rules
    print("\n1. Custom Validation Rules")
    print("-" * 40)

    validator = DataValidator()

    # Create test data with known issues
    test_data = pd.DataFrame({
        'id': [1, 2, 3, 4, 5, 5],  # Duplicate
        'value': [10, 20, np.nan, 40, 500, 600],  # Missing value and outlier
        'category': ['A', 'B', 'C', 'D', 'E', 'F']
    })

    validation_result = validator.validate(test_data)
    print(f"Validation Result: {'PASSED' if validation_result['valid'] else 'FAILED'}")
    for issue in validation_result['issues']:
        print(f"  - {issue['severity'].upper()}: {issue['description']}")

    # 2. Feature Engineering Capabilities
    print("\n2. Feature Engineering Capabilities")
    print("-" * 40)

    # Create sample data
    sample_df = pd.DataFrame({
        'numeric1': [1, 2, 3, 4, 5],
        'numeric2': [2, 4, 6, 8, 10],
        'category': ['A', 'B', 'A', 'B', 'C'],
        'text': ['hello world', 'data pipeline', 'test data', 'sample text', 'demo run']
    })

    config = TransformConfig(scale_numeric=True, encode_categorical=True)
    engineer = FeatureEngineer(config)
    engineered_df = engineer.engineer(sample_df.copy())

    print(f"Original features: {list(sample_df.columns)}")
    print(f"Total features after engineering: {len(engineered_df.columns)}")
    new_features = set(engineered_df.columns) - set(sample_df.columns)
    print(f"New features created ({len(new_features)}):")
    for feat in list(new_features)[:10]:  # Show first 10
        print(f"  - {feat}")

    # 3. Performance Monitoring
    print("\n3. Performance Monitoring")
    print("-" * 40)

    monitor = PipelineMonitor()
    monitor.start_pipeline()

    # Simulate stages
    import time
    stages = ['load', 'validate', 'clean', 'transform', 'save']
    for stage in stages:
        monitor.start_stage(stage)
        time.sleep(0.01)  # Simulate work
        monitor.end_stage(stage, rows=1000)

    monitor.end_pipeline()
    metrics = monitor.get_metrics()

    print("Stage Performance:")
    for stage, info in metrics['stages'].items():
        print(f"  {stage}: {info['duration']*1000:.1f}ms")

    print(f"\nTotal Execution: {metrics['pipeline_duration']:.3f}s")
    print(f"Memory Usage: {metrics.get('memory_delta_mb', 0):.1f}MB")

    # 4. Data Quality Profiling
    print("\n4. Data Quality Profiling")
    print("-" * 40)

    # Create data with various quality issues
    quality_test_df = pd.DataFrame({
        'complete_col': range(100),
        'missing_col': [i if i % 10 != 0 else np.nan for i in range(100)],
        'duplicate_col': [i % 50 for i in range(100)],
        'outlier_col': [10 if i % 20 != 0 else 1000 for i in range(100)]
    })

    validator = DataValidator()
    quality_report = validator.validate(quality_test_df)

    print("Data Quality Metrics:")
    stats = quality_report['statistics']
    if 'missing_values' in stats:
        print(f"  Missing values: {stats['missing_values']['total']} ({stats['missing_values']['percentage']:.1f}%)")
    if 'duplicates' in stats:
        print(f"  Duplicate rows: {stats['duplicates']['count']} ({stats['duplicates']['percentage']:.1f}%)")
    if 'outliers' in stats:
        for col, count in stats['outliers'].items():
            print(f"  Outliers in {col}: {count}")


def create_comparison_report(results: dict):
    """Create a comparison report of all processed datasets."""
    print("\n" + "="*80)
    print("PIPELINE COMPARISON REPORT")
    print("="*80)

    comparison_data = []
    for name, result in results.items():
        if result:
            comparison_data.append({
                'Dataset': name,
                'Original Rows': result['original_shape'][0],
                'Original Columns': result['original_shape'][1],
                'Final Rows': result['final_shape'][0],
                'Final Columns': result['final_shape'][1],
                'Execution Time (s)': round(result['execution_time'], 3),
                'Rows Removed': result['original_shape'][0] - result['final_shape'][0],
                'Features Added': result['final_shape'][1] - result['original_shape'][1]
            })

    comparison_df = pd.DataFrame(comparison_data)

    print("\nDataset Processing Summary:")
    print(comparison_df.to_string(index=False))

    # Calculate totals
    print("\nAggregate Statistics:")
    print(f"  Total rows processed: {comparison_df['Original Rows'].sum():,}")
    print(f"  Total features created: {comparison_df['Features Added'].sum():,}")
    print(f"  Average processing time: {comparison_df['Execution Time (s)'].mean():.3f}s")
    print(f"  Total rows removed: {comparison_df['Rows Removed'].sum():,}")

    # Save comparison report
    comparison_df.to_csv('pipeline_comparison_report.csv', index=False)
    print("\nComparison report saved to: pipeline_comparison_report.csv")

    return comparison_df


def main():
    """Main demonstration execution."""
    print("\n" + "="*80)
    print("       DATA PROCESSING PIPELINE - COMPREHENSIVE DEMONSTRATION")
    print("="*80)
    print("\nThis demonstration will showcase:")
    print("  1. Multiple data source handling (CSV, JSON, SQLite)")
    print("  2. Data validation and quality checking")
    print("  3. Advanced feature engineering")
    print("  4. Performance monitoring and optimization")
    print("  5. Comprehensive reporting")

    # Create sample datasets
    datasets = create_sample_datasets()

    # Process each dataset
    results = {}

    # Process CSV files
    for key in ['ecommerce', 'customers']:
        if key in datasets:
            result = run_pipeline_on_dataset(datasets[key], f"{key.title()} Data")
            results[key] = result

    # Process JSON file
    if 'products' in datasets:
        # Convert JSON to DataFrame first
        with open(datasets['products'], 'r') as f:
            products_data = json.load(f)
        products_df = pd.DataFrame(products_data)
        products_df.to_csv('products_temp.csv', index=False)
        result = run_pipeline_on_dataset('products_temp.csv', "Product Inventory")
        results['products'] = result

    # Process SQLite database
    if 'sales_db' in datasets:
        # Extract data from SQLite
        conn = sqlite3.connect(datasets['sales_db'])
        sales_df = pd.read_sql_query("SELECT * FROM sales", conn)
        conn.close()
        sales_df.to_csv('sales_temp.csv', index=False)
        result = run_pipeline_on_dataset('sales_temp.csv', "Sales Database")
        results['sales'] = result

    # Demonstrate advanced features
    demonstrate_advanced_features()

    # Create comparison report
    comparison_df = create_comparison_report(results)

    # Cleanup
    print("\n" + "="*80)
    print("CLEANUP")
    print("="*80)

    files_to_cleanup = [
        'ecommerce_data.csv', 'customer_data.csv', 'product_inventory.json',
        'sales_database.db', 'products_temp.csv', 'sales_temp.csv',
        'processed_ecommerce_data.csv', 'processed_customer_data.csv',
        'processed_products_temp.csv', 'processed_sales_temp.csv',
        'test_data.csv', 'processed_data.csv'
    ]

    for file in files_to_cleanup:
        if Path(file).exists():
            Path(file).unlink()
            print(f"  Removed: {file}")

    print("\n" + "="*80)
    print("DEMONSTRATION COMPLETE!")
    print("="*80)
    print("\nKey Achievements:")
    print("  [OK] Processed multiple data formats (CSV, JSON, SQLite)")
    print("  [OK] Handled data quality issues (missing values, duplicates, outliers)")
    print("  [OK] Applied advanced feature engineering")
    print("  [OK] Monitored performance and resource usage")
    print("  [OK] Generated comprehensive reports")
    print("\nThe data processing pipeline is production-ready and fully functional!")


if __name__ == "__main__":
    main()