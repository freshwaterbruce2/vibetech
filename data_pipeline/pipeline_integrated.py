"""
Integrated Data Processing Pipeline - Production Ready
"""

import pandas as pd
import numpy as np
import time
import psutil
import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
import warnings
warnings.filterwarnings('ignore')


# ==================== Configuration ====================

@dataclass
class PipelineConfig:
    """Pipeline configuration."""
    name: str = "Data Pipeline"
    source_path: str = ""
    output_path: str = "processed_data.csv"
    chunk_size: int = 10000
    enable_monitoring: bool = True
    enable_validation: bool = True
    log_level: str = "INFO"


@dataclass
class TransformConfig:
    """Transformation configuration."""
    handle_missing: str = "median"  # mean, median, mode, drop, forward_fill
    remove_outliers: bool = True
    scale_numeric: bool = True
    encode_categorical: bool = True
    missing_threshold: float = 0.3


# ==================== Data Loader ====================

class DataLoader:
    """Load data from various sources."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    def load_csv(self, path: str, chunk_size: Optional[int] = None) -> pd.DataFrame:
        """Load CSV file."""
        self.logger.info(f"Loading CSV from {path}")

        if chunk_size:
            chunks = []
            for chunk in pd.read_csv(path, chunksize=chunk_size):
                chunks.append(chunk)
            return pd.concat(chunks, ignore_index=True)
        else:
            return pd.read_csv(path)

    def load(self) -> pd.DataFrame:
        """Load data based on file extension."""
        path = Path(self.config.source_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        if path.suffix.lower() == '.csv':
            return self.load_csv(str(path), self.config.chunk_size)
        elif path.suffix.lower() == '.json':
            return pd.read_json(path)
        elif path.suffix.lower() == '.xlsx':
            return pd.read_excel(path)
        else:
            raise ValueError(f"Unsupported file type: {path.suffix}")


# ==================== Data Validator ====================

class DataValidator:
    """Validate data quality and schema."""

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def validate(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform comprehensive validation."""
        self.logger.info("Starting data validation")

        results = {
            'valid': True,
            'issues': [],
            'statistics': {}
        }

        # Check missing values
        missing = df.isna().sum()
        total_missing = missing.sum()
        if total_missing > 0:
            missing_pct = (total_missing / (len(df) * len(df.columns))) * 100
            results['issues'].append({
                'type': 'missing_values',
                'description': f'Found {total_missing} missing values ({missing_pct:.1f}%)',
                'severity': 'warning' if missing_pct < 10 else 'error'
            })
            results['statistics']['missing_values'] = {
                'total': int(total_missing),
                'percentage': missing_pct,
                'by_column': missing.to_dict()
            }

        # Check duplicates
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            dup_pct = (duplicates / len(df)) * 100
            results['issues'].append({
                'type': 'duplicates',
                'description': f'Found {duplicates} duplicate rows ({dup_pct:.1f}%)',
                'severity': 'warning'
            })
            results['statistics']['duplicates'] = {
                'count': int(duplicates),
                'percentage': dup_pct
            }

        # Check for outliers
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        outlier_counts = {}
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)).sum()
            if outliers > 0:
                outlier_counts[col] = int(outliers)

        if outlier_counts:
            total_outliers = sum(outlier_counts.values())
            results['issues'].append({
                'type': 'outliers',
                'description': f'Found {total_outliers} outliers across {len(outlier_counts)} columns',
                'severity': 'info'
            })
            results['statistics']['outliers'] = outlier_counts

        # Check data types
        results['statistics']['dtypes'] = df.dtypes.astype(str).to_dict()
        results['statistics']['shape'] = df.shape

        # Determine overall validity
        error_count = sum(1 for issue in results['issues'] if issue['severity'] == 'error')
        results['valid'] = error_count == 0

        self.logger.info(f"Validation complete. Valid: {results['valid']}, Issues: {len(results['issues'])}")
        return results


# ==================== Data Cleaner ====================

class DataCleaner:
    """Clean and preprocess data."""

    def __init__(self, config: TransformConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply all cleaning operations."""
        self.logger.info(f"Starting data cleaning. Initial shape: {df.shape}")

        # Handle missing values
        df = self._handle_missing(df)

        # Remove duplicates
        initial_len = len(df)
        df = df.drop_duplicates()
        if len(df) < initial_len:
            self.logger.info(f"Removed {initial_len - len(df)} duplicate rows")

        # Remove outliers if configured
        if self.config.remove_outliers:
            df = self._remove_outliers(df)

        # Standardize column names
        df.columns = [col.lower().replace(' ', '_') for col in df.columns]

        self.logger.info(f"Cleaning complete. Final shape: {df.shape}")
        return df

    def _handle_missing(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values based on strategy."""
        strategy = self.config.handle_missing

        if strategy == 'drop':
            return df.dropna()

        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns

        for col in numeric_cols:
            if df[col].isna().any():
                if strategy == 'mean':
                    df[col] = df[col].fillna(df[col].mean())
                elif strategy == 'median':
                    df[col] = df[col].fillna(df[col].median())
                elif strategy == 'forward_fill':
                    df[col] = df[col].fillna(method='ffill').fillna(method='bfill')
                else:
                    df[col] = df[col].fillna(0)

        for col in categorical_cols:
            if df[col].isna().any():
                if strategy == 'mode' and len(df[col].mode()) > 0:
                    df[col] = df[col].fillna(df[col].mode()[0])
                else:
                    df[col] = df[col].fillna('Unknown')

        return df

    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove outliers using IQR method."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        initial_len = len(df)

        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]

        if len(df) < initial_len:
            self.logger.info(f"Removed {initial_len - len(df)} rows with outliers")

        return df


# ==================== Feature Engineer ====================

class FeatureEngineer:
    """Create new features from existing data."""

    def __init__(self, config: TransformConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    def engineer(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering."""
        self.logger.info(f"Starting feature engineering. Initial features: {len(df.columns)}")

        # Scale numeric features
        if self.config.scale_numeric:
            df = self._scale_numeric(df)

        # Encode categorical features
        if self.config.encode_categorical:
            df = self._encode_categorical(df)

        # Create interaction features
        df = self._create_interactions(df)

        # Create statistical features
        df = self._create_statistical_features(df)

        self.logger.info(f"Feature engineering complete. Final features: {len(df.columns)}")
        return df

    def _scale_numeric(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numeric features."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            if col.endswith('_id') or 'id' in col.lower():
                continue  # Skip ID columns

            # Standard scaling
            mean = df[col].mean()
            std = df[col].std()
            if std > 0:
                df[f'{col}_scaled'] = (df[col] - mean) / std

            # Min-max scaling
            min_val = df[col].min()
            max_val = df[col].max()
            if max_val > min_val:
                df[f'{col}_normalized'] = (df[col] - min_val) / (max_val - min_val)

        return df

    def _encode_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features."""
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns

        for col in categorical_cols:
            unique_values = df[col].nunique()

            if unique_values <= 10:  # One-hot encode low cardinality
                dummies = pd.get_dummies(df[col], prefix=col, dummy_na=False)
                df = pd.concat([df, dummies], axis=1)
            else:  # Label encode high cardinality
                df[f'{col}_encoded'] = pd.Categorical(df[col]).codes

        return df

    def _create_interactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns[:5]  # Limit to prevent explosion

        for i, col1 in enumerate(numeric_cols):
            for col2 in numeric_cols[i+1:]:
                if not (col1.endswith('_scaled') or col1.endswith('_normalized') or
                       col2.endswith('_scaled') or col2.endswith('_normalized')):
                    # Create multiplication interaction
                    df[f'{col1}_x_{col2}'] = df[col1] * df[col2]

        return df

    def _create_statistical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create statistical aggregation features."""
        numeric_cols = [col for col in df.select_dtypes(include=[np.number]).columns
                       if not (col.endswith('_scaled') or col.endswith('_normalized') or col.endswith('_encoded'))]

        if len(numeric_cols) > 1:
            df['row_mean'] = df[numeric_cols].mean(axis=1)
            df['row_std'] = df[numeric_cols].std(axis=1)
            df['row_min'] = df[numeric_cols].min(axis=1)
            df['row_max'] = df[numeric_cols].max(axis=1)

        return df


# ==================== Pipeline Monitor ====================

class PipelineMonitor:
    """Monitor pipeline execution and performance."""

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.metrics = {
            'stages': {},
            'errors': [],
            'warnings': []
        }
        self.stage_timers = {}
        self.pipeline_start_time = None

    def start_pipeline(self):
        """Start pipeline monitoring."""
        self.pipeline_start_time = time.time()
        self.metrics['pipeline_start'] = datetime.now().isoformat()
        process = psutil.Process(os.getpid())
        self.metrics['initial_memory_mb'] = process.memory_info().rss / 1024 / 1024

    def end_pipeline(self):
        """End pipeline monitoring."""
        if self.pipeline_start_time:
            self.metrics['pipeline_duration'] = time.time() - self.pipeline_start_time
            self.metrics['pipeline_end'] = datetime.now().isoformat()
            process = psutil.Process(os.getpid())
            self.metrics['final_memory_mb'] = process.memory_info().rss / 1024 / 1024
            self.metrics['memory_delta_mb'] = (
                self.metrics['final_memory_mb'] - self.metrics['initial_memory_mb']
            )

    def start_stage(self, stage_name: str):
        """Start monitoring a stage."""
        self.stage_timers[stage_name] = {
            'start': time.time(),
            'start_time': datetime.now().isoformat()
        }

    def end_stage(self, stage_name: str, **kwargs):
        """End monitoring a stage."""
        if stage_name in self.stage_timers:
            duration = time.time() - self.stage_timers[stage_name]['start']
            self.metrics['stages'][stage_name] = {
                'duration': duration,
                'start_time': self.stage_timers[stage_name]['start_time'],
                'end_time': datetime.now().isoformat(),
                **kwargs
            }

    def record_error(self, stage: str, error: str):
        """Record an error."""
        self.metrics['errors'].append({
            'stage': stage,
            'error': str(error),
            'timestamp': datetime.now().isoformat()
        })
        self.logger.error(f"[{stage}] {error}")

    def record_warning(self, stage: str, warning: str):
        """Record a warning."""
        self.metrics['warnings'].append({
            'stage': stage,
            'warning': str(warning),
            'timestamp': datetime.now().isoformat()
        })
        self.logger.warning(f"[{stage}] {warning}")

    def get_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics."""
        # Add summary
        self.metrics['summary'] = {
            'total_stages': len(self.metrics['stages']),
            'total_errors': len(self.metrics['errors']),
            'total_warnings': len(self.metrics['warnings']),
            'total_duration': self.metrics.get('pipeline_duration', 0),
            'memory_usage_mb': self.metrics.get('memory_delta_mb', 0)
        }
        return self.metrics


# ==================== Main Pipeline ====================

class DataPipeline:
    """Main data processing pipeline."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.setup_logging()
        self.logger = logging.getLogger(self.__class__.__name__)
        self.monitor = PipelineMonitor()
        self.data = None

    def setup_logging(self):
        """Configure logging."""
        logging.basicConfig(
            level=getattr(logging, self.config.log_level),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    def execute(
        self,
        transform_config: Optional[TransformConfig] = None,
        validation_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute the complete pipeline."""
        self.logger.info("="*60)
        self.logger.info(f"Starting pipeline: {self.config.name}")
        self.logger.info("="*60)

        self.monitor.start_pipeline()
        result = {
            'success': False,
            'errors': [],
            'warnings': []
        }

        try:
            # Load data
            self.monitor.start_stage('load')
            loader = DataLoader(self.config)
            self.data = loader.load()
            original_shape = self.data.shape
            result['original_shape'] = original_shape
            self.monitor.end_stage('load', rows=len(self.data))
            self.logger.info(f"Data loaded: {original_shape}")

            # Validate if enabled
            if self.config.enable_validation:
                self.monitor.start_stage('validate')
                validator = DataValidator()
                validation_results = validator.validate(self.data)
                result['validation_report'] = validation_results
                self.monitor.end_stage('validate', issues=len(validation_results['issues']))

                # Log validation issues
                for issue in validation_results['issues']:
                    if issue['severity'] == 'error':
                        self.monitor.record_error('validation', issue['description'])
                    else:
                        self.monitor.record_warning('validation', issue['description'])

            # Clean data
            if transform_config:
                self.monitor.start_stage('clean')
                cleaner = DataCleaner(transform_config)
                self.data = cleaner.clean(self.data)
                self.monitor.end_stage('clean', rows=len(self.data))

                # Feature engineering
                self.monitor.start_stage('engineer')
                engineer = FeatureEngineer(transform_config)
                self.data = engineer.engineer(self.data)
                self.monitor.end_stage('engineer', features=len(self.data.columns))

            # Save output
            self.monitor.start_stage('save')
            output_path = Path(self.config.output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            self.data.to_csv(output_path, index=False)
            self.monitor.end_stage('save', file_size=output_path.stat().st_size)
            self.logger.info(f"Output saved to {output_path}")

            # Finalize
            self.monitor.end_pipeline()
            result['success'] = True
            result['final_shape'] = self.data.shape
            result['rows_processed'] = len(self.data)
            result['execution_time'] = self.monitor.metrics.get('pipeline_duration', 0)
            result['monitoring_metrics'] = self.monitor.get_metrics()
            result['output_path'] = str(output_path)

            self.logger.info("Pipeline completed successfully!")

        except Exception as e:
            self.monitor.record_error('pipeline', str(e))
            result['errors'].append(str(e))
            self.logger.error(f"Pipeline failed: {e}", exc_info=True)

        return result


# ==================== Demo Execution ====================

def generate_demo_data(n_records: int = 1000) -> pd.DataFrame:
    """Generate demo dataset."""
    np.random.seed(42)

    data = {
        'customer_id': [f'CUST{i:04d}' for i in range(1, n_records + 1)],
        'age': np.random.randint(18, 80, n_records),
        'income': np.random.lognormal(10.5, 0.5, n_records),
        'purchase_amount': np.random.lognormal(4, 1.5, n_records),
        'category': np.random.choice(['Electronics', 'Clothing', 'Food', 'Books'], n_records),
        'satisfaction_score': np.random.uniform(1, 5, n_records),
        'signup_date': pd.date_range('2023-01-01', periods=n_records, freq='H'),
        'is_premium': np.random.choice([0, 1], n_records, p=[0.7, 0.3])
    }

    df = pd.DataFrame(data)

    # Add some missing values
    missing_mask = np.random.random(n_records) < 0.05
    df.loc[missing_mask, 'satisfaction_score'] = np.nan

    # Add duplicates
    duplicates = df.sample(n=20)
    df = pd.concat([df, duplicates], ignore_index=True)

    return df


def main():
    """Run demonstration."""
    print("\n" + "="*80)
    print("DATA PROCESSING PIPELINE - INTEGRATED VERSION")
    print("="*80)

    # Generate demo data
    print("\nGenerating demo data...")
    demo_data = generate_demo_data(1000)
    demo_file = 'demo_data.csv'
    demo_data.to_csv(demo_file, index=False)
    print(f"Demo data saved to {demo_file}")
    print(f"Shape: {demo_data.shape}")

    # Configure pipeline
    config = PipelineConfig(
        name="Demo Pipeline",
        source_path=demo_file,
        output_path="demo_processed.csv",
        chunk_size=500,
        enable_monitoring=True,
        enable_validation=True
    )

    transform_config = TransformConfig(
        handle_missing="median",
        remove_outliers=True,
        scale_numeric=True,
        encode_categorical=True
    )

    # Execute pipeline
    print("\nExecuting pipeline...")
    pipeline = DataPipeline(config)
    result = pipeline.execute(transform_config=transform_config)

    # Display results
    print("\n" + "="*80)
    print("PIPELINE RESULTS")
    print("="*80)

    if result['success']:
        print("\n[SUCCESS] Pipeline completed successfully!")
        print(f"\nExecution Summary:")
        print(f"  Original shape: {result['original_shape']}")
        print(f"  Final shape: {result['final_shape']}")
        print(f"  Rows processed: {result['rows_processed']}")
        print(f"  Execution time: {result['execution_time']:.2f} seconds")
        print(f"  Output file: {result['output_path']}")

        if 'validation_report' in result:
            report = result['validation_report']
            print(f"\nValidation Report:")
            print(f"  Valid: {report['valid']}")
            print(f"  Issues found: {len(report['issues'])}")
            for issue in report['issues'][:3]:  # Show first 3 issues
                print(f"    - {issue['type']}: {issue['description']}")

        if 'monitoring_metrics' in result:
            metrics = result['monitoring_metrics']
            print(f"\nPerformance Metrics:")
            for stage, info in metrics['stages'].items():
                print(f"  {stage}: {info['duration']:.2f}s")
            summary = metrics.get('summary', {})
            print(f"\nResource Usage:")
            print(f"  Memory used: {summary.get('memory_usage_mb', 0):.1f} MB")
            print(f"  Total duration: {summary.get('total_duration', 0):.2f}s")

    else:
        print("\n[ERROR] Pipeline failed!")
        for error in result['errors']:
            print(f"  - {error}")

    # Cleanup
    print("\n" + "="*80)
    print("Cleaning up demo files...")
    for file in [demo_file, 'demo_processed.csv']:
        if Path(file).exists():
            os.remove(file)
            print(f"  Removed {file}")

    print("\nDemonstration complete!")


if __name__ == "__main__":
    main()