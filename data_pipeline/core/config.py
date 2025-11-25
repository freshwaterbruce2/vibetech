"""
Configuration management for the data pipeline.
"""

import json
import os
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional, List
from pathlib import Path
import yaml


@dataclass
class DataSourceConfig:
    """Configuration for data sources."""

    source_type: str  # 'csv', 'sql', 'api'
    connection_params: Dict[str, Any] = field(default_factory=dict)
    retry_attempts: int = 3
    timeout: int = 30
    batch_size: int = 10000


@dataclass
class ValidationConfig:
    """Configuration for data validation."""

    check_schema: bool = True
    check_nulls: bool = True
    check_duplicates: bool = True
    check_outliers: bool = True
    outlier_threshold: float = 3.0  # Standard deviations
    missing_threshold: float = 0.5  # Max proportion of missing values
    custom_rules: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class TransformationConfig:
    """Configuration for data transformations."""

    handle_missing: str = "mean"  # 'mean', 'median', 'mode', 'drop', 'forward_fill'
    scale_numeric: bool = True
    encode_categorical: bool = True
    remove_outliers: bool = False
    feature_engineering: List[str] = field(default_factory=list)


@dataclass
class MonitoringConfig:
    """Configuration for monitoring and logging."""

    log_level: str = "INFO"
    log_file: str = "pipeline.log"
    enable_profiling: bool = True
    enable_visualization: bool = True
    checkpoint_frequency: int = 1000
    metrics_to_track: List[str] = field(default_factory=lambda: [
        "rows_processed", "errors_count", "processing_time", "memory_usage"
    ])


@dataclass
class PipelineConfig:
    """Main configuration class for the data pipeline."""

    name: str = "DataPipeline"
    version: str = "1.0.0"

    # Sub-configurations
    data_source: DataSourceConfig = field(default_factory=DataSourceConfig)
    validation: ValidationConfig = field(default_factory=ValidationConfig)
    transformation: TransformationConfig = field(default_factory=TransformationConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)

    # Pipeline settings
    parallel_processing: bool = True
    n_workers: int = 4
    chunk_size: int = 10000
    memory_limit_mb: int = 1024
    output_format: str = "parquet"  # 'csv', 'parquet', 'json', 'sql'
    output_path: str = "./output"

    @classmethod
    def from_file(cls, config_path: str) -> "PipelineConfig":
        """Load configuration from a file (JSON or YAML)."""
        path = Path(config_path)

        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(path, 'r') as f:
            if path.suffix == '.json':
                config_dict = json.load(f)
            elif path.suffix in ['.yaml', '.yml']:
                config_dict = yaml.safe_load(f)
            else:
                raise ValueError(f"Unsupported config file format: {path.suffix}")

        return cls.from_dict(config_dict)

    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> "PipelineConfig":
        """Create configuration from a dictionary."""
        # Handle nested configurations
        if 'data_source' in config_dict:
            config_dict['data_source'] = DataSourceConfig(**config_dict['data_source'])
        if 'validation' in config_dict:
            config_dict['validation'] = ValidationConfig(**config_dict['validation'])
        if 'transformation' in config_dict:
            config_dict['transformation'] = TransformationConfig(**config_dict['transformation'])
        if 'monitoring' in config_dict:
            config_dict['monitoring'] = MonitoringConfig(**config_dict['monitoring'])

        return cls(**config_dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return asdict(self)

    def save(self, file_path: str):
        """Save configuration to file."""
        path = Path(file_path)
        config_dict = self.to_dict()

        with open(path, 'w') as f:
            if path.suffix == '.json':
                json.dump(config_dict, f, indent=2)
            elif path.suffix in ['.yaml', '.yml']:
                yaml.dump(config_dict, f, default_flow_style=False)
            else:
                raise ValueError(f"Unsupported config file format: {path.suffix}")

    def validate(self) -> List[str]:
        """Validate configuration and return list of issues."""
        issues = []

        # Check memory limit
        if self.memory_limit_mb < 256:
            issues.append("Memory limit should be at least 256 MB")

        # Check workers
        if self.parallel_processing and self.n_workers < 1:
            issues.append("Number of workers must be at least 1 for parallel processing")

        # Check chunk size
        if self.chunk_size < 100:
            issues.append("Chunk size should be at least 100 rows")

        # Check output path
        output_dir = Path(self.output_path)
        if not output_dir.parent.exists():
            issues.append(f"Output directory parent does not exist: {output_dir.parent}")

        # Check outlier threshold
        if self.validation.outlier_threshold < 1:
            issues.append("Outlier threshold should be at least 1 standard deviation")

        return issues


def create_default_config() -> PipelineConfig:
    """Create a default configuration instance."""
    return PipelineConfig(
        name="DefaultPipeline",
        data_source=DataSourceConfig(
            source_type="csv",
            connection_params={"path": "./data/input.csv"}
        ),
        validation=ValidationConfig(
            check_schema=True,
            check_nulls=True,
            check_duplicates=True
        ),
        transformation=TransformationConfig(
            handle_missing="mean",
            scale_numeric=True
        ),
        monitoring=MonitoringConfig(
            log_level="INFO",
            enable_profiling=True
        )
    )