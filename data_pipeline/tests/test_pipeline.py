"""
Comprehensive tests for the data processing pipeline.
"""

import unittest
import pandas as pd
import numpy as np
import tempfile
import os
import json
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from core.pipeline import DataPipeline
from core.config import PipelineConfig, TransformConfig, ValidationConfig
from core.exceptions import PipelineException, ValidationException


class TestDataPipeline(unittest.TestCase):
    """Test the main data pipeline functionality."""

    def setUp(self):
        """Set up test fixtures."""
        # Create temporary directory
        self.temp_dir = tempfile.mkdtemp()

        # Create sample data
        self.sample_data = pd.DataFrame({
            'id': range(1, 101),
            'value': np.random.randn(100),
            'category': np.random.choice(['A', 'B', 'C'], 100),
            'date': pd.date_range('2024-01-01', periods=100, freq='D')
        })

        # Save sample data
        self.csv_path = os.path.join(self.temp_dir, 'test_data.csv')
        self.sample_data.to_csv(self.csv_path, index=False)

        # Create config
        self.config = PipelineConfig(
            name="Test Pipeline",
            source_type="csv",
            source_path=self.csv_path,
            output_path=os.path.join(self.temp_dir, 'output.csv'),
            enable_monitoring=True
        )

    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_pipeline_initialization(self):
        """Test pipeline initialization."""
        pipeline = DataPipeline(self.config)
        self.assertIsNotNone(pipeline)
        self.assertEqual(pipeline.config.name, "Test Pipeline")

    def test_pipeline_execution(self):
        """Test basic pipeline execution."""
        pipeline = DataPipeline(self.config)
        result = pipeline.execute()

        self.assertTrue(result['success'])
        self.assertIn('rows_processed', result)
        self.assertEqual(result['rows_processed'], 100)

        # Check output file exists
        self.assertTrue(os.path.exists(self.config.output_path))

    def test_pipeline_with_validation(self):
        """Test pipeline with validation enabled."""
        validation_config = ValidationConfig(
            check_schema=True,
            check_quality=True,
            quality_checks=['missing_values', 'duplicates']
        )

        pipeline = DataPipeline(self.config)
        result = pipeline.execute(validation_config=validation_config)

        self.assertTrue(result['success'])
        self.assertIn('validation_report', result)
        self.assertTrue(result['validation_report']['valid'])

    def test_pipeline_with_transformation(self):
        """Test pipeline with transformations."""
        transform_config = TransformConfig(
            handle_missing='mean',
            scale_numeric=True,
            encode_categorical=True
        )

        pipeline = DataPipeline(self.config)
        result = pipeline.execute(transform_config=transform_config)

        self.assertTrue(result['success'])

        # Check transformed data
        output_df = pd.read_csv(self.config.output_path)
        # Should have more columns after encoding
        self.assertGreater(len(output_df.columns), len(self.sample_data.columns))

    def test_pipeline_error_handling(self):
        """Test error handling in pipeline."""
        # Invalid source path
        bad_config = PipelineConfig(
            name="Bad Pipeline",
            source_type="csv",
            source_path="nonexistent.csv",
            output_path="output.csv"
        )

        pipeline = DataPipeline(bad_config)
        result = pipeline.execute()

        self.assertFalse(result['success'])
        self.assertIn('errors', result)
        self.assertGreater(len(result['errors']), 0)

    def test_chunked_processing(self):
        """Test chunked processing for large files."""
        config = PipelineConfig(
            name="Chunked Pipeline",
            source_type="csv",
            source_path=self.csv_path,
            output_path=os.path.join(self.temp_dir, 'chunked_output.csv'),
            chunk_size=25  # Process in chunks of 25 rows
        )

        pipeline = DataPipeline(config)
        result = pipeline.execute()

        self.assertTrue(result['success'])
        self.assertEqual(result['rows_processed'], 100)

    def test_monitoring_metrics(self):
        """Test monitoring metrics collection."""
        pipeline = DataPipeline(self.config)
        result = pipeline.execute()

        self.assertIn('monitoring_metrics', result)
        metrics = result['monitoring_metrics']

        self.assertIn('stages', metrics)
        self.assertIn('pipeline_duration', metrics)
        self.assertIn('pipeline_start', metrics)
        self.assertIn('pipeline_end', metrics)


class TestDataLoaders(unittest.TestCase):
    """Test data loading modules."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_csv_loader(self):
        """Test CSV loader functionality."""
        from loaders.csv_loader import CSVLoader

        # Create test CSV
        df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
        csv_path = os.path.join(self.temp_dir, 'test.csv')
        df.to_csv(csv_path, index=False)

        # Load data
        loader = CSVLoader(None)
        loaded_df = loader.load(csv_path)

        self.assertEqual(len(loaded_df), 3)
        self.assertEqual(list(loaded_df.columns), ['a', 'b'])

    def test_csv_loader_chunked(self):
        """Test chunked CSV loading."""
        from loaders.csv_loader import CSVLoader

        # Create larger test CSV
        df = pd.DataFrame({'a': range(100), 'b': range(100, 200)})
        csv_path = os.path.join(self.temp_dir, 'test_large.csv')
        df.to_csv(csv_path, index=False)

        # Load in chunks
        loader = CSVLoader(None)
        chunks = list(loader.load_chunked(csv_path, chunk_size=25))

        self.assertEqual(len(chunks), 4)  # 100 rows / 25 = 4 chunks
        self.assertEqual(len(chunks[0]), 25)


class TestValidators(unittest.TestCase):
    """Test validation modules."""

    def test_schema_validator(self):
        """Test schema validation."""
        from validators.schema import SchemaValidator

        # Create test data
        df = pd.DataFrame({
            'int_col': [1, 2, 3],
            'float_col': [1.1, 2.2, 3.3],
            'str_col': ['a', 'b', 'c']
        })

        # Define expected schema
        expected_schema = {
            'int_col': 'int64',
            'float_col': 'float64',
            'str_col': 'object'
        }

        validator = SchemaValidator(None)
        result = validator.validate(df, expected_schema)

        self.assertTrue(result['valid'])
        self.assertEqual(len(result['errors']), 0)

    def test_quality_validator(self):
        """Test data quality validation."""
        from validators.quality import DataQualityValidator

        # Create test data with issues
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4, 4],  # Has missing value and duplicate
            'col2': [1, 2, 3, 4, 100]  # Has outlier
        })

        validator = DataQualityValidator(None)
        result = validator.validate(
            df,
            checks=['missing_values', 'duplicates', 'outliers']
        )

        self.assertFalse(result['valid'])  # Should fail due to issues
        self.assertGreater(len(result['issues']), 0)

        # Check specific issues detected
        issue_types = [issue['type'] for issue in result['issues']]
        self.assertIn('missing_values', issue_types)
        self.assertIn('duplicates', issue_types)


class TestTransformers(unittest.TestCase):
    """Test transformation modules."""

    def test_data_cleaner(self):
        """Test data cleaning functionality."""
        from transformers.cleaner import DataCleaner
        from core.config import TransformConfig

        # Create test data with issues
        df = pd.DataFrame({
            'col1': [1, 2, np.nan, 4, 4],
            'col2': ['  a  ', 'b', 'c', 'd', 'd'],
            'Col 3': [1, 2, 3, 4, 5]  # Bad column name
        })

        config = TransformConfig(handle_missing='mean')
        cleaner = DataCleaner(config)
        cleaned_df = cleaner.clean(df)

        # Check missing values handled
        self.assertEqual(cleaned_df['col1'].isna().sum(), 0)

        # Check duplicates removed
        self.assertEqual(len(cleaned_df), 4)  # One duplicate removed

        # Check column names standardized
        self.assertIn('col_3', cleaned_df.columns)
        self.assertNotIn('Col 3', cleaned_df.columns)

    def test_feature_engineer(self):
        """Test feature engineering functionality."""
        from transformers.feature_engineer import FeatureEngineer
        from core.config import TransformConfig

        # Create test data
        df = pd.DataFrame({
            'num1': [1, 2, 3, 4, 5],
            'num2': [2, 4, 6, 8, 10],
            'cat1': ['A', 'B', 'A', 'B', 'C']
        })

        config = TransformConfig(scale_numeric=True, encode_categorical=True)
        engineer = FeatureEngineer(config)
        engineered_df = engineer.engineer(df)

        # Check new features created
        self.assertGreater(len(engineered_df.columns), len(df.columns))

        # Check scaled features exist
        self.assertIn('num1_scaled', engineered_df.columns)

        # Check encoded features exist
        encoded_cols = [col for col in engineered_df.columns if 'cat1' in col and col != 'cat1']
        self.assertGreater(len(encoded_cols), 0)


class TestMonitoring(unittest.TestCase):
    """Test monitoring functionality."""

    def test_pipeline_monitor(self):
        """Test pipeline monitoring."""
        from monitoring.monitor import PipelineMonitor
        from core.config import PipelineConfig

        config = PipelineConfig(
            name="Test",
            enable_profiling=True
        )

        monitor = PipelineMonitor(config)

        # Start monitoring
        monitor.start_pipeline()
        monitor.start_stage('test_stage')

        # Simulate some work
        import time
        time.sleep(0.1)

        monitor.end_stage('test_stage', rows_processed=100)
        monitor.end_pipeline()

        # Get metrics
        metrics = monitor.get_metrics()

        self.assertIn('stages', metrics)
        self.assertIn('test_stage', metrics['stages'])
        self.assertIn('pipeline_duration', metrics)
        self.assertGreater(metrics['pipeline_duration'], 0)

    def test_metrics_persistence(self):
        """Test saving metrics to file."""
        from monitoring.monitor import PipelineMonitor
        from core.config import PipelineConfig

        config = PipelineConfig(name="Test")
        monitor = PipelineMonitor(config)

        monitor.start_pipeline()
        monitor.checkpoint('test_checkpoint', {'rows': 100})
        monitor.end_pipeline()

        # Save metrics
        metrics_file = os.path.join(tempfile.gettempdir(), 'test_metrics.json')
        monitor.save_metrics(metrics_file)

        # Check file exists and contains data
        self.assertTrue(os.path.exists(metrics_file))

        with open(metrics_file, 'r') as f:
            saved_metrics = json.load(f)

        self.assertIn('checkpoints', saved_metrics)
        self.assertEqual(len(saved_metrics['checkpoints']), 1)

        # Clean up
        os.remove(metrics_file)


class TestEndToEnd(unittest.TestCase):
    """End-to-end integration tests."""

    def test_complete_pipeline_flow(self):
        """Test complete pipeline flow with all components."""
        temp_dir = tempfile.mkdtemp()

        try:
            # Create sample data with various issues
            np.random.seed(42)
            df = pd.DataFrame({
                'customer_id': range(1, 101),
                'age': np.random.randint(18, 80, 100),
                'income': np.random.lognormal(10, 0.5, 100),
                'category': np.random.choice(['A', 'B', 'C'], 100),
                'signup_date': pd.date_range('2024-01-01', periods=100, freq='D')
            })

            # Add some missing values
            df.loc[10:15, 'income'] = np.nan

            # Save to CSV
            csv_path = os.path.join(temp_dir, 'test_data.csv')
            df.to_csv(csv_path, index=False)

            # Configure pipeline
            config = PipelineConfig(
                name="E2E Test Pipeline",
                source_type="csv",
                source_path=csv_path,
                output_path=os.path.join(temp_dir, 'processed.csv'),
                enable_monitoring=True,
                enable_profiling=True
            )

            transform_config = TransformConfig(
                handle_missing='median',
                remove_outliers=False,
                scale_numeric=True,
                encode_categorical=True
            )

            validation_config = ValidationConfig(
                check_schema=True,
                check_quality=True,
                quality_checks=['missing_values', 'duplicates', 'data_types']
            )

            # Run pipeline
            pipeline = DataPipeline(config)
            result = pipeline.execute(
                transform_config=transform_config,
                validation_config=validation_config
            )

            # Verify results
            self.assertTrue(result['success'])
            self.assertEqual(result['rows_processed'], 100)
            self.assertIn('validation_report', result)
            self.assertIn('monitoring_metrics', result)

            # Check output file
            output_df = pd.read_csv(config.output_path)

            # Should have no missing values after processing
            self.assertEqual(output_df.isna().sum().sum(), 0)

            # Should have more columns after feature engineering
            self.assertGreater(len(output_df.columns), len(df.columns))

        finally:
            # Clean up
            import shutil
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)


def run_tests():
    """Run all tests with verbose output."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestDataPipeline))
    suite.addTests(loader.loadTestsFromTestCase(TestDataLoaders))
    suite.addTests(loader.loadTestsFromTestCase(TestValidators))
    suite.addTests(loader.loadTestsFromTestCase(TestTransformers))
    suite.addTests(loader.loadTestsFromTestCase(TestMonitoring))
    suite.addTests(loader.loadTestsFromTestCase(TestEndToEnd))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)