"""
Data Processing Pipeline
========================

A comprehensive, production-ready data processing pipeline with support for
multiple data sources, validation, transformation, and monitoring.

Author: Data Pipeline System
Version: 1.0.0
"""

from .core.pipeline import DataPipeline
from .core.config import PipelineConfig
from .loaders import CSVLoader, SQLLoader, APILoader
from .validators import SchemaValidator, DataQualityChecker
from .transformers import DataCleaner, FeatureEngineer
from .monitoring import PipelineMonitor, QualityVisualizer

__version__ = "1.0.0"
__all__ = [
    "DataPipeline",
    "PipelineConfig",
    "CSVLoader",
    "SQLLoader",
    "APILoader",
    "SchemaValidator",
    "DataQualityChecker",
    "DataCleaner",
    "FeatureEngineer",
    "PipelineMonitor",
    "QualityVisualizer",
]