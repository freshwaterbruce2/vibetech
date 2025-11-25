"""
Run the data processing pipeline with real-world example.
"""

import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from core.pipeline import DataPipeline
from core.config import PipelineConfig, TransformConfig, ValidationConfig
from monitoring.visualizer import QualityVisualizer


def generate_ecommerce_data(n_records=5000):
    """Generate realistic e-commerce transaction data."""
    print("Generating e-commerce transaction data...")

    np.random.seed(42)
    random.seed(42)

    # Generate dates for last 90 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)

    data = {
        'transaction_id': [f'TXN{i:06d}' for i in range(1, n_records + 1)],
        'customer_id': [f'CUST{random.randint(1, 1000):04d}' for _ in range(n_records)],
        'transaction_date': pd.date_range(start_date, end_date, periods=n_records),
        'product_category': np.random.choice(
            ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Food', 'Beauty'],
            n_records,
            p=[0.25, 0.20, 0.15, 0.10, 0.10, 0.08, 0.07, 0.05]
        ),
        'product_price': np.round(np.random.lognormal(3.5, 1.2, n_records), 2),
        'quantity': np.random.choice([1, 2, 3, 4, 5], n_records, p=[0.5, 0.25, 0.15, 0.07, 0.03]),
        'payment_method': np.random.choice(
            ['Credit Card', 'Debit Card', 'PayPal', 'Cash', 'Bank Transfer'],
            n_records,
            p=[0.40, 0.25, 0.20, 0.10, 0.05]
        ),
        'shipping_country': np.random.choice(
            ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan', 'Australia'],
            n_records,
            p=[0.35, 0.15, 0.15, 0.10, 0.10, 0.10, 0.05]
        ),
        'customer_age': np.random.normal(40, 15, n_records).astype(int).clip(18, 80),
        'customer_lifetime_value': np.round(np.random.lognormal(6, 1.5, n_records), 2),
        'discount_applied': np.random.choice([0, 5, 10, 15, 20, 25], n_records, p=[0.4, 0.2, 0.15, 0.1, 0.1, 0.05]),
        'shipping_days': np.random.choice([1, 2, 3, 5, 7, 10], n_records, p=[0.1, 0.25, 0.3, 0.2, 0.1, 0.05]),
        'is_returned': np.random.choice([0, 1], n_records, p=[0.92, 0.08]),
        'customer_satisfaction': np.random.choice([1, 2, 3, 4, 5], n_records, p=[0.02, 0.05, 0.13, 0.35, 0.45]),
        'website_visits_before_purchase': np.random.poisson(3, n_records),
        'previous_purchases': np.random.poisson(5, n_records),
        'newsletter_subscriber': np.random.choice([0, 1], n_records, p=[0.6, 0.4]),
        'mobile_purchase': np.random.choice([0, 1], n_records, p=[0.45, 0.55])
    }

    df = pd.DataFrame(data)

    # Calculate total amount
    df['total_amount'] = np.round(df['product_price'] * df['quantity'] * (1 - df['discount_applied']/100), 2)

    # Add some missing values randomly (5% of data)
    missing_cols = ['customer_satisfaction', 'website_visits_before_purchase', 'previous_purchases']
    for col in missing_cols:
        missing_mask = np.random.random(n_records) < 0.05
        df.loc[missing_mask, col] = np.nan

    # Add some outliers
    outlier_mask = np.random.random(n_records) < 0.01
    df.loc[outlier_mask, 'product_price'] = df.loc[outlier_mask, 'product_price'] * 10

    # Add duplicate transactions (simulating double-clicks)
    duplicates = df.sample(n=int(n_records * 0.02))
    duplicates['transaction_id'] = [f'TXN{i:06d}' for i in range(n_records + 1, n_records + len(duplicates) + 1)]
    df = pd.concat([df, duplicates], ignore_index=True)

    print(f"Generated {len(df)} transaction records with {len(df.columns)} features")
    return df


def main():
    """Run the complete pipeline demonstration."""

    print("="*80)
    print("DATA PROCESSING PIPELINE DEMONSTRATION")
    print("="*80)

    # Generate sample data
    df = generate_ecommerce_data(5000)

    # Save to CSV
    data_file = 'ecommerce_transactions.csv'
    df.to_csv(data_file, index=False)
    print(f"\nSaved data to {data_file}")

    # Display sample
    print("\nSample of raw data:")
    print(df.head())
    print(f"\nData shape: {df.shape}")
    print(f"Missing values: {df.isna().sum().sum()}")
    print(f"Duplicate rows: {df.duplicated().sum()}")

    # Configure pipeline
    print("\n" + "="*80)
    print("CONFIGURING PIPELINE")
    print("="*80)

    config = PipelineConfig(
        name="E-commerce Transaction Pipeline",
        source_type="csv",
        source_path=data_file,
        output_path="processed_transactions.csv",
        enable_monitoring=True,
        enable_profiling=True,
        chunk_size=1000  # Process in chunks
    )

    transform_config = TransformConfig(
        handle_missing="median",  # Use median for numeric columns
        remove_outliers=True,      # Remove statistical outliers
        scale_numeric=True,         # Scale numeric features
        encode_categorical=True,    # Encode categorical variables
        missing_threshold=0.3       # Drop columns with >30% missing
    )

    validation_config = ValidationConfig(
        check_schema=True,
        check_quality=True,
        quality_checks=[
            "missing_values",
            "duplicates",
            "outliers",
            "data_types",
            "value_ranges"
        ],
        quality_thresholds={
            'missing_ratio': 0.1,      # Flag if >10% missing
            'duplicate_ratio': 0.05,    # Flag if >5% duplicates
            'outlier_ratio': 0.1        # Flag if >10% outliers
        },
        expected_schema={
            'transaction_id': 'object',
            'customer_id': 'object',
            'product_category': 'object',
            'product_price': 'float64',
            'quantity': 'int64',
            'total_amount': 'float64'
        }
    )

    # Initialize pipeline
    print("\nPipeline configuration:")
    print(f"  - Chunk size: {config.chunk_size}")
    print(f"  - Missing value strategy: {transform_config.handle_missing}")
    print(f"  - Remove outliers: {transform_config.remove_outliers}")
    print(f"  - Quality checks: {', '.join(validation_config.quality_checks)}")

    # Run pipeline
    print("\n" + "="*80)
    print("EXECUTING PIPELINE")
    print("="*80)

    pipeline = DataPipeline(config)

    try:
        result = pipeline.execute(
            transform_config=transform_config,
            validation_config=validation_config
        )

        if result['success']:
            print("\n[SUCCESS] Pipeline completed successfully!")

            # Display execution summary
            print("\n" + "-"*40)
            print("EXECUTION SUMMARY")
            print("-"*40)
            print(f"Original shape: {result['original_shape']}")
            print(f"Final shape: {result['final_shape']}")
            print(f"Rows processed: {result['rows_processed']}")
            print(f"Execution time: {result['execution_time']:.2f} seconds")
            print(f"Processing rate: {result['rows_processed']/result['execution_time']:.0f} rows/second")

            # Validation results
            if 'validation_report' in result:
                report = result['validation_report']
                print("\n" + "-"*40)
                print("VALIDATION REPORT")
                print("-"*40)
                print(f"Validation status: {'PASSED' if report['valid'] else 'FAILED'}")

                if 'schema' in report:
                    schema_report = report['schema']
                    if 'column_analysis' in schema_report:
                        print(f"Schema validation: {len(schema_report['column_analysis'])} columns checked")

                if 'quality' in report:
                    quality_report = report['quality']
                    print(f"Quality checks performed: {len(quality_report.get('checks_performed', []))}")

                    if 'issues' in quality_report:
                        print(f"Quality issues found: {len(quality_report['issues'])}")
                        for issue in quality_report['issues'][:5]:  # Show first 5 issues
                            print(f"  - {issue['type']}: {issue['description']}")

                    if 'statistics' in quality_report:
                        stats = quality_report['statistics']
                        if 'completeness' in stats:
                            print(f"Data completeness: {stats['completeness'].get('completeness_score', 0):.1f}%")
                        if 'duplicates' in stats:
                            print(f"Duplicate rows: {stats['duplicates'].get('duplicate_rows', 0)}")

            # Monitoring metrics
            if 'monitoring_metrics' in result:
                metrics = result['monitoring_metrics']
                print("\n" + "-"*40)
                print("PERFORMANCE METRICS")
                print("-"*40)

                if 'stages' in metrics:
                    print("\nStage execution times:")
                    for stage, info in metrics['stages'].items():
                        duration = info.get('duration', 0)
                        memory_delta = info.get('memory_delta_mb', 0)
                        print(f"  {stage}: {duration:.2f}s (Memory Δ: {memory_delta:+.1f}MB)")

                if 'summary' in metrics:
                    summary = metrics['summary']
                    print(f"\nResource usage:")
                    print(f"  Peak memory: {summary.get('peak_memory_mb', 0):.1f} MB")
                    print(f"  Average CPU: {summary.get('average_cpu_percent', 0):.1f}%")
                    print(f"  Total errors: {summary.get('total_errors', 0)}")
                    print(f"  Total warnings: {summary.get('total_warnings', 0)}")

            # Load and analyze processed data
            print("\n" + "-"*40)
            print("PROCESSED DATA ANALYSIS")
            print("-"*40)

            processed_df = pd.read_csv(config.output_path)
            print(f"Processed data shape: {processed_df.shape}")
            print(f"New features created: {len(processed_df.columns) - len(df.columns)}")

            # Show new feature names
            new_features = set(processed_df.columns) - set(df.columns)
            if new_features:
                print("\nSample of new features:")
                for feat in list(new_features)[:10]:
                    print(f"  - {feat}")

            # Data quality improvements
            print("\nData quality improvements:")
            print(f"  Missing values: {df.isna().sum().sum()} → {processed_df.isna().sum().sum()}")
            print(f"  Duplicate rows: {df.duplicated().sum()} → {processed_df.duplicated().sum()}")

            # Generate visualizations
            print("\n" + "-"*40)
            print("GENERATING VISUALIZATIONS")
            print("-"*40)

            visualizer = QualityVisualizer()

            # Try to create visualizations (may not display in terminal)
            try:
                # Validation results visualization
                if 'validation_report' in result:
                    print("Creating validation report visualization...")
                    visualizer.plot_validation_results(result['validation_report'])

                # Pipeline performance visualization
                print("Creating pipeline performance visualization...")
                visualizer.plot_pipeline_summary(result)

                # Data profiling
                print("Creating data profiling visualization...")
                visualizer.plot_data_profiling(processed_df, max_cols=12)

                # Correlation matrix
                print("Creating correlation matrix...")
                visualizer.plot_correlation_matrix(processed_df, max_features=10)

                print("\n[NOTE] Visualizations may not display in terminal. Check output files or run in Jupyter.")
            except Exception as viz_error:
                print(f"Visualization error (non-critical): {viz_error}")

            # Save reports
            print("\n" + "-"*40)
            print("SAVING REPORTS")
            print("-"*40)

            # Save monitoring report
            if 'monitoring_metrics' in result:
                import json
                with open('pipeline_report.json', 'w') as f:
                    json.dump(result['monitoring_metrics'], f, indent=2, default=str)
                print("Saved monitoring report to pipeline_report.json")

            # Generate text report
            if hasattr(pipeline, 'monitor') and pipeline.monitor:
                text_report = pipeline.monitor.generate_performance_report()
                with open('performance_report.txt', 'w') as f:
                    f.write(text_report)
                print("Saved performance report to performance_report.txt")

            print("\n" + "="*80)
            print("PIPELINE EXECUTION COMPLETE")
            print("="*80)
            print("\nOutput files:")
            print(f"  - Processed data: {config.output_path}")
            print(f"  - Monitoring report: pipeline_report.json")
            print(f"  - Performance report: performance_report.txt")

        else:
            print("\n[ERROR] Pipeline execution failed!")
            print("\nErrors encountered:")
            for error in result.get('errors', []):
                print(f"  - {error}")

            if 'warnings' in result:
                print("\nWarnings:")
                for warning in result['warnings']:
                    print(f"  - {warning}")

    except Exception as e:
        print(f"\n[CRITICAL ERROR] Pipeline crashed: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # Cleanup
        print("\nCleaning up temporary files...")
        import os
        for file in ['ecommerce_transactions.csv']:
            if os.path.exists(file):
                os.remove(file)
                print(f"  Removed {file}")


if __name__ == "__main__":
    main()