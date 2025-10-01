"""
CSV file data loader with chunking support for large files.
"""

import pandas as pd
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from .base import DataLoader
from ..core.exceptions import DataLoadException


class CSVLoader(DataLoader):
    """Loader for CSV files with memory-efficient chunking."""

    def load(
        self,
        path: Optional[str] = None,
        encoding: str = 'utf-8',
        sep: str = ',',
        chunksize: Optional[int] = None,
        **kwargs
    ) -> pd.DataFrame:
        """
        Load data from CSV file.

        Args:
            path: Path to CSV file (uses config if not provided)
            encoding: File encoding
            sep: Column separator
            chunksize: Number of rows per chunk for memory efficiency
            **kwargs: Additional pandas read_csv parameters

        Returns:
            Loaded DataFrame

        Raises:
            DataLoadException: If file cannot be loaded
        """
        file_path = path or self.config.connection_params.get('path')
        if not file_path:
            raise DataLoadException("No CSV file path provided")

        file_path = Path(file_path)
        if not file_path.exists():
            raise DataLoadException(f"CSV file not found: {file_path}")

        self.logger.info(f"Loading CSV file: {file_path}")

        # Use configured chunk size if not provided
        if chunksize is None:
            chunksize = self.config.batch_size if self.config.batch_size > 0 else None

        try:
            if chunksize:
                # Read in chunks for memory efficiency
                chunks = []
                total_rows = 0

                for chunk in pd.read_csv(
                    file_path,
                    encoding=encoding,
                    sep=sep,
                    chunksize=chunksize,
                    **kwargs
                ):
                    chunks.append(chunk)
                    total_rows += len(chunk)
                    self.logger.debug(f"Loaded chunk: {len(chunk)} rows (total: {total_rows})")

                df = pd.concat(chunks, ignore_index=True)
                self.logger.info(f"Loaded {total_rows} rows from CSV")
            else:
                # Read entire file at once
                df = pd.read_csv(
                    file_path,
                    encoding=encoding,
                    sep=sep,
                    **kwargs
                )
                self.logger.info(f"Loaded {len(df)} rows from CSV")

            return df

        except Exception as e:
            raise DataLoadException(f"Failed to load CSV file: {e}")

    def load_multiple(
        self,
        paths: List[str],
        concat: bool = True,
        **kwargs
    ) -> Union[pd.DataFrame, List[pd.DataFrame]]:
        """
        Load multiple CSV files.

        Args:
            paths: List of file paths
            concat: Whether to concatenate into single DataFrame
            **kwargs: Parameters for load method

        Returns:
            Single DataFrame if concat=True, else list of DataFrames
        """
        dataframes = []

        for path in paths:
            try:
                df = self.load(path=path, **kwargs)
                dataframes.append(df)
            except Exception as e:
                self.logger.error(f"Failed to load {path}: {e}")
                if self.config.connection_params.get('skip_errors', False):
                    continue
                raise

        if concat and dataframes:
            return pd.concat(dataframes, ignore_index=True)
        return dataframes

    def validate_connection(self) -> bool:
        """Validate CSV file exists and is readable."""
        path = self.config.connection_params.get('path')
        if not path:
            return False

        file_path = Path(path)
        return file_path.exists() and file_path.is_file()

    def get_info(self, path: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about CSV file without loading all data.

        Args:
            path: File path

        Returns:
            Dictionary with file information
        """
        file_path = Path(path or self.config.connection_params.get('path'))

        if not file_path.exists():
            raise DataLoadException(f"File not found: {file_path}")

        # Read first few rows to get metadata
        sample_df = pd.read_csv(file_path, nrows=5)

        # Get file size
        file_size = file_path.stat().st_size

        # Estimate row count
        with open(file_path, 'r', encoding='utf-8') as f:
            row_count = sum(1 for _ in f) - 1  # Subtract header

        return {
            'path': str(file_path),
            'size_bytes': file_size,
            'size_mb': round(file_size / (1024 * 1024), 2),
            'estimated_rows': row_count,
            'columns': list(sample_df.columns),
            'dtypes': sample_df.dtypes.to_dict(),
            'sample': sample_df.to_dict('records')
        }