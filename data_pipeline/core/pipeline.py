"""
Main pipeline orchestrator that coordinates all data processing steps.
"""

import time
import logging
import traceback
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
import pandas as pd
import numpy as np

from ..loaders import DataLoader, CSVLoader, SQLLoader, APILoader
from ..validators import SchemaValidator, DataQualityChecker
from ..transformers import DataCleaner, FeatureEngineer
from ..monitoring import PipelineMonitor, QualityVisualizer
from .config import PipelineConfig
from .exceptions import PipelineException, ConfigurationException


class DataPipeline:
    """
    Main data processing pipeline orchestrator.

    This class coordinates all aspects of data processing including:
    - Loading data from multiple sources
    - Validation and quality checks
    - Cleaning and transformation
    - Feature engineering
    - Monitoring and visualization
    """

    def __init__(self, config: Union[PipelineConfig, str, Dict[str, Any]]):
        """
        Initialize the data pipeline.

        Args:
            config: Pipeline configuration (PipelineConfig object, file path, or dict)
        """
        # Load configuration
        if isinstance(config, str):
            self.config = PipelineConfig.from_file(config)
        elif isinstance(config, dict):
            self.config = PipelineConfig.from_dict(config)
        else:
            self.config = config

        # Validate configuration
        issues = self.config.validate()
        if issues:
            raise ConfigurationException(f"Configuration issues: {', '.join(issues)}")

        # Initialize components
        self._setup_logging()
        self._initialize_components()

        # State tracking
        self.data: Optional[pd.DataFrame] = None
        self.metadata: Dict[str, Any] = {}
        self.processing_history: List[Dict[str, Any]] = []
        self.start_time: Optional[float] = None

    def _setup_logging(self):
        """Set up logging configuration."""
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        logging.basicConfig(
            level=getattr(logging, self.config.monitoring.log_level),
            format=log_format,
            handlers=[
                logging.FileHandler(self.config.monitoring.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(self.__class__.__name__)

    def _initialize_components(self):
        """Initialize all pipeline components."""
        # Data loader
        source_type = self.config.data_source.source_type.lower()
        if source_type == 'csv':
            self.loader = CSVLoader(self.config.data_source)
        elif source_type == 'sql':
            self.loader = SQLLoader(self.config.data_source)
        elif source_type == 'api':
            self.loader = APILoader(self.config.data_source)
        else:
            raise ConfigurationException(f"Unsupported data source: {source_type}")

        # Validators
        self.schema_validator = SchemaValidator()
        self.quality_checker = DataQualityChecker(self.config.validation)

        # Transformers
        self.cleaner = DataCleaner(self.config.transformation)
        self.feature_engineer = FeatureEngineer(self.config.transformation)

        # Monitoring
        self.monitor = PipelineMonitor(self.config.monitoring)
        self.visualizer = QualityVisualizer()

        self.logger.info("Pipeline components initialized successfully")

    def load_data(self, **kwargs) -> pd.DataFrame:
        """
        Load data from configured source.

        Args:
            **kwargs: Additional parameters for the data loader

        Returns:
            Loaded DataFrame
        """
        self.logger.info(f"Loading data from {self.config.data_source.source_type} source")
        self.monitor.start_stage("data_loading")

        try:
            self.data = self.loader.load(**kwargs)
            self.metadata['original_shape'] = self.data.shape
            self.metadata['columns'] = list(self.data.columns)
            self.metadata['dtypes'] = self.data.dtypes.to_dict()

            self.monitor.end_stage("data_loading", rows=len(self.data))
            self.logger.info(f"Data loaded successfully: {self.data.shape} rows and columns")

            self._record_step("load", {"shape": self.data.shape})
            return self.data

        except Exception as e:
            self.monitor.record_error("data_loading", str(e))
            self.logger.error(f"Data loading failed: {e}")
            raise

    def validate_data(self, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Validate loaded data against schema and quality rules.

        Args:
            schema: Optional schema definition

        Returns:
            Validation results dictionary
        """
        if self.data is None:
            raise PipelineException("No data loaded. Call load_data() first.")

        self.logger.info("Starting data validation")
        self.monitor.start_stage("validation")

        validation_results = {}

        try:
            # Schema validation
            if schema or self.config.validation.check_schema:
                schema_results = self.schema_validator.validate(self.data, schema)
                validation_results['schema'] = schema_results
                if not schema_results['valid']:
                    self.logger.warning(f"Schema validation issues: {schema_results['errors']}")

            # Quality checks
            quality_results = self.quality_checker.check(self.data)
            validation_results['quality'] = quality_results

            # Log quality issues
            for check, result in quality_results.items():
                if result.get('issues'):
                    self.logger.warning(f"{check}: {result['issues']}")

            self.monitor.end_stage("validation", issues=len(validation_results.get('quality', {}).get('issues', [])))
            self._record_step("validate", validation_results)

            return validation_results

        except Exception as e:
            self.monitor.record_error("validation", str(e))
            self.logger.error(f"Validation failed: {e}")
            raise

    def clean_data(self) -> pd.DataFrame:
        """
        Clean the data according to configuration.

        Returns:
            Cleaned DataFrame
        """
        if self.data is None:
            raise PipelineException("No data loaded. Call load_data() first.")

        self.logger.info("Starting data cleaning")
        self.monitor.start_stage("cleaning")

        try:
            initial_shape = self.data.shape
            self.data = self.cleaner.clean(self.data)
            final_shape = self.data.shape

            cleaning_stats = {
                'rows_removed': initial_shape[0] - final_shape[0],
                'initial_shape': initial_shape,
                'final_shape': final_shape
            }

            self.monitor.end_stage("cleaning", rows_processed=len(self.data))
            self.logger.info(f"Data cleaning complete. Shape: {initial_shape} -> {final_shape}")

            self._record_step("clean", cleaning_stats)
            return self.data

        except Exception as e:
            self.monitor.record_error("cleaning", str(e))
            self.logger.error(f"Data cleaning failed: {e}")
            raise

    def engineer_features(self, feature_specs: Optional[List[Dict[str, Any]]] = None) -> pd.DataFrame:
        """
        Perform feature engineering on the data.

        Args:
            feature_specs: Optional list of feature engineering specifications

        Returns:
            DataFrame with engineered features
        """
        if self.data is None:
            raise PipelineException("No data loaded. Call load_data() first.")

        self.logger.info("Starting feature engineering")
        self.monitor.start_stage("feature_engineering")

        try:
            initial_cols = len(self.data.columns)
            self.data = self.feature_engineer.engineer(self.data, feature_specs)
            final_cols = len(self.data.columns)

            engineering_stats = {
                'features_added': final_cols - initial_cols,
                'total_features': final_cols
            }

            self.monitor.end_stage("feature_engineering", features_created=final_cols - initial_cols)
            self.logger.info(f"Feature engineering complete. Added {final_cols - initial_cols} features")

            self._record_step("engineer", engineering_stats)
            return self.data

        except Exception as e:
            self.monitor.record_error("feature_engineering", str(e))
            self.logger.error(f"Feature engineering failed: {e}")
            raise

    def save_output(self, path: Optional[str] = None, format: Optional[str] = None) -> str:
        """
        Save processed data to file.

        Args:
            path: Output file path (uses config if not provided)
            format: Output format (uses config if not provided)

        Returns:
            Path to saved file
        """
        if self.data is None:
            raise PipelineException("No data to save. Process data first.")

        output_format = format or self.config.output_format
        output_path = Path(path or self.config.output_path)

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Add appropriate extension if not present
        if not output_path.suffix:
            output_path = output_path.with_suffix(f'.{output_format}')

        self.logger.info(f"Saving output to {output_path} as {output_format}")
        self.monitor.start_stage("save_output")

        try:
            if output_format == 'csv':
                self.data.to_csv(output_path, index=False)
            elif output_format == 'parquet':
                self.data.to_parquet(output_path, index=False)
            elif output_format == 'json':
                self.data.to_json(output_path, orient='records', indent=2)
            else:
                raise ValueError(f"Unsupported output format: {output_format}")

            self.monitor.end_stage("save_output", file_size=output_path.stat().st_size)
            self.logger.info(f"Output saved successfully to {output_path}")

            self._record_step("save", {"path": str(output_path), "format": output_format})
            return str(output_path)

        except Exception as e:
            self.monitor.record_error("save_output", str(e))
            self.logger.error(f"Failed to save output: {e}")
            raise

    def run(self, **kwargs) -> pd.DataFrame:
        """
        Run the complete pipeline end-to-end.

        Args:
            **kwargs: Additional parameters for pipeline stages

        Returns:
            Processed DataFrame
        """
        self.logger.info("=" * 60)
        self.logger.info(f"Starting pipeline: {self.config.name}")
        self.logger.info("=" * 60)

        self.start_time = time.time()

        try:
            # Load data
            self.load_data(**kwargs.get('load_params', {}))

            # Validate
            validation_results = self.validate_data(kwargs.get('schema'))
            if self.config.monitoring.enable_visualization:
                self.visualizer.plot_validation_results(validation_results)

            # Clean
            self.clean_data()

            # Engineer features
            self.engineer_features(kwargs.get('feature_specs'))

            # Save output
            output_path = self.save_output()

            # Generate final report
            self._generate_report()

            elapsed_time = time.time() - self.start_time
            self.logger.info(f"Pipeline completed successfully in {elapsed_time:.2f} seconds")

            return self.data

        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}")
            self.logger.error(traceback.format_exc())
            raise

    def _record_step(self, step_name: str, details: Dict[str, Any]):
        """Record pipeline step in history."""
        self.processing_history.append({
            'step': step_name,
            'timestamp': datetime.now().isoformat(),
            'details': details
        })

    def _generate_report(self):
        """Generate final pipeline report."""
        if not self.start_time:
            return

        elapsed_time = time.time() - self.start_time
        report = {
            'pipeline_name': self.config.name,
            'start_time': datetime.fromtimestamp(self.start_time).isoformat(),
            'elapsed_time_seconds': elapsed_time,
            'final_shape': self.data.shape if self.data is not None else None,
            'processing_history': self.processing_history,
            'monitoring_metrics': self.monitor.get_metrics()
        }

        # Save report
        report_path = Path(self.config.output_path) / f"pipeline_report_{datetime.now():%Y%m%d_%H%M%S}.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)

        import json
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        self.logger.info(f"Pipeline report saved to {report_path}")

        # Visualize if enabled
        if self.config.monitoring.enable_visualization:
            self.visualizer.plot_pipeline_summary(report)

    def get_metadata(self) -> Dict[str, Any]:
        """Get pipeline metadata."""
        return self.metadata

    def get_history(self) -> List[Dict[str, Any]]:
        """Get processing history."""
        return self.processing_history

    def get_metrics(self) -> Dict[str, Any]:
        """Get monitoring metrics."""
        return self.monitor.get_metrics()