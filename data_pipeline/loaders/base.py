"""
Base class for data loaders.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
import pandas as pd
import logging
from ..core.exceptions import DataLoadException


class DataLoader(ABC):
    """Abstract base class for all data loaders."""

    def __init__(self, config: Any):
        """
        Initialize the data loader.

        Args:
            config: Data source configuration
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def load(self, **kwargs) -> pd.DataFrame:
        """
        Load data from source.

        Args:
            **kwargs: Source-specific parameters

        Returns:
            Loaded DataFrame

        Raises:
            DataLoadException: If loading fails
        """
        pass

    def validate_connection(self) -> bool:
        """
        Validate connection to data source.

        Returns:
            True if connection is valid
        """
        return True

    def _handle_retry(self, func, *args, max_attempts: Optional[int] = None, **kwargs):
        """
        Handle retries for data loading operations.

        Args:
            func: Function to retry
            *args: Function arguments
            max_attempts: Maximum retry attempts
            **kwargs: Function keyword arguments

        Returns:
            Function result

        Raises:
            DataLoadException: If all retries fail
        """
        max_attempts = max_attempts or self.config.retry_attempts
        last_error = None

        for attempt in range(max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_error = e
                self.logger.warning(f"Attempt {attempt + 1}/{max_attempts} failed: {e}")
                if attempt < max_attempts - 1:
                    import time
                    time.sleep(2 ** attempt)  # Exponential backoff

        raise DataLoadException(f"Failed after {max_attempts} attempts: {last_error}")