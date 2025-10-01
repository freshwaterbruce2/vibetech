"""
Custom exceptions for the data pipeline.
"""


class PipelineException(Exception):
    """Base exception for all pipeline errors."""
    pass


class DataLoadException(PipelineException):
    """Exception raised when data loading fails."""
    pass


class ValidationException(PipelineException):
    """Exception raised when data validation fails."""
    pass


class TransformationException(PipelineException):
    """Exception raised when data transformation fails."""
    pass


class SchemaException(ValidationException):
    """Exception raised when schema validation fails."""
    pass


class DataQualityException(ValidationException):
    """Exception raised when data quality checks fail."""
    pass


class ConfigurationException(PipelineException):
    """Exception raised when configuration is invalid."""
    pass


class ResourceException(PipelineException):
    """Exception raised when resource limits are exceeded."""
    pass