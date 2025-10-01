"""
Data cleaning module with memory-efficient operations.
"""

import pandas as pd
import numpy as np
from typing import Optional, List, Any, Dict, Union
import logging
from ..core.exceptions import TransformationException


class DataCleaner:
    """Memory-efficient data cleaning operations."""

    def __init__(self, config: Any):
        """
        Initialize data cleaner.

        Args:
            config: Transformation configuration
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.cleaning_stats = {}

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all cleaning operations to DataFrame.

        Args:
            df: Input DataFrame

        Returns:
            Cleaned DataFrame
        """
        self.logger.info(f"Starting data cleaning on DataFrame with shape {df.shape}")
        self.cleaning_stats = {'original_shape': df.shape}

        # Apply cleaning operations in sequence
        df = self._handle_missing_values(df)
        df = self._remove_duplicates(df)
        df = self._standardize_types(df)

        if self.config.remove_outliers:
            df = self._remove_outliers(df)

        df = self._clean_text_columns(df)
        df = self._standardize_column_names(df)

        self.cleaning_stats['final_shape'] = df.shape
        self.logger.info(f"Cleaning complete. Final shape: {df.shape}")

        return df

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values based on configuration."""
        strategy = self.config.handle_missing
        self.logger.debug(f"Handling missing values with strategy: {strategy}")

        missing_before = df.isna().sum().sum()

        if strategy == 'drop':
            # Drop rows with any missing values
            df = df.dropna()
        elif strategy == 'drop_columns':
            # Drop columns with too many missing values
            threshold = self.config.missing_threshold if hasattr(self.config, 'missing_threshold') else 0.5
            missing_ratio = df.isna().sum() / len(df)
            cols_to_drop = missing_ratio[missing_ratio > threshold].index
            if len(cols_to_drop) > 0:
                self.logger.info(f"Dropping columns with >{ threshold*100}% missing: {list(cols_to_drop)}")
                df = df.drop(columns=cols_to_drop)
        else:
            # Fill missing values
            for col in df.columns:
                if df[col].isna().any():
                    df[col] = self._fill_column(df[col], strategy)

        missing_after = df.isna().sum().sum()
        self.cleaning_stats['missing_values_handled'] = int(missing_before - missing_after)

        return df

    def _fill_column(self, series: pd.Series, strategy: str) -> pd.Series:
        """Fill missing values in a single column."""
        if pd.api.types.is_numeric_dtype(series):
            if strategy == 'mean':
                return series.fillna(series.mean())
            elif strategy == 'median':
                return series.fillna(series.median())
            elif strategy == 'mode':
                mode_val = series.mode()[0] if len(series.mode()) > 0 else 0
                return series.fillna(mode_val)
            elif strategy == 'forward_fill':
                return series.fillna(method='ffill')
            elif strategy == 'backward_fill':
                return series.fillna(method='bfill')
            elif strategy == 'interpolate':
                return series.interpolate(method='linear')
            else:
                # Default: fill with 0
                return series.fillna(0)
        elif pd.api.types.is_categorical_dtype(series) or pd.api.types.is_object_dtype(series):
            if strategy == 'mode':
                mode_val = series.mode()[0] if len(series.mode()) > 0 else 'Unknown'
                return series.fillna(mode_val)
            elif strategy == 'forward_fill':
                return series.fillna(method='ffill')
            elif strategy == 'backward_fill':
                return series.fillna(method='bfill')
            else:
                # Default: fill with 'Unknown'
                return series.fillna('Unknown')
        else:
            # For other types, forward fill
            return series.fillna(method='ffill')

    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate rows."""
        duplicates_before = df.duplicated().sum()

        if duplicates_before > 0:
            self.logger.info(f"Removing {duplicates_before} duplicate rows")
            df = df.drop_duplicates()
            self.cleaning_stats['duplicates_removed'] = int(duplicates_before)
        else:
            self.cleaning_stats['duplicates_removed'] = 0

        return df

    def _standardize_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize data types for better memory efficiency."""
        self.logger.debug("Standardizing data types")

        for col in df.columns:
            col_type = df[col].dtype

            # Convert object to category if low cardinality
            if col_type == 'object':
                unique_ratio = df[col].nunique() / len(df)
                if unique_ratio < 0.5:  # Less than 50% unique values
                    df[col] = df[col].astype('category')
                    self.logger.debug(f"Converted {col} to category type")

            # Downcast numeric types
            elif np.issubdtype(col_type, np.integer):
                df[col] = pd.to_numeric(df[col], downcast='integer')
            elif np.issubdtype(col_type, np.floating):
                df[col] = pd.to_numeric(df[col], downcast='float')

        return df

    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove outliers from numeric columns."""
        self.logger.info("Removing outliers")
        outliers_removed = 0
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            # Use IQR method
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            # Count outliers
            outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()

            if outliers > 0:
                # Remove outliers
                df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
                outliers_removed += outliers
                self.logger.debug(f"Removed {outliers} outliers from {col}")

        self.cleaning_stats['outliers_removed'] = int(outliers_removed)
        return df

    def _clean_text_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean text columns."""
        self.logger.debug("Cleaning text columns")

        text_cols = df.select_dtypes(include=['object', 'string']).columns

        for col in text_cols:
            # Strip whitespace
            df[col] = df[col].str.strip()

            # Remove multiple spaces
            df[col] = df[col].str.replace(r'\s+', ' ', regex=True)

            # Standardize case for certain columns
            if any(keyword in col.lower() for keyword in ['email', 'username', 'id']):
                df[col] = df[col].str.lower()
            elif any(keyword in col.lower() for keyword in ['name', 'title', 'city', 'country']):
                df[col] = df[col].str.title()

            # Clean special characters from numeric-like strings
            if df[col].str.match(r'^[\d\.\,\-]+$', na=False).any():
                df[col] = df[col].str.replace(',', '')
                try:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass

        return df

    def _standardize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize column names."""
        self.logger.debug("Standardizing column names")

        # Create mapping of old to new names
        new_names = {}
        for col in df.columns:
            # Convert to snake_case
            new_name = col.lower()
            new_name = new_name.replace(' ', '_')
            new_name = new_name.replace('-', '_')
            new_name = new_name.replace('.', '_')
            new_name = ''.join(c if c.isalnum() or c == '_' else '' for c in new_name)
            new_name = '_'.join(filter(None, new_name.split('_')))  # Remove multiple underscores

            # Ensure name doesn't start with number
            if new_name and new_name[0].isdigit():
                new_name = f'col_{new_name}'

            new_names[col] = new_name

        # Rename columns
        df = df.rename(columns=new_names)

        return df

    def clean_specific_columns(
        self,
        df: pd.DataFrame,
        columns: List[str],
        operations: List[str]
    ) -> pd.DataFrame:
        """
        Apply specific cleaning operations to specific columns.

        Args:
            df: Input DataFrame
            columns: List of column names
            operations: List of operations to apply

        Returns:
            Cleaned DataFrame
        """
        for col in columns:
            if col not in df.columns:
                self.logger.warning(f"Column {col} not found in DataFrame")
                continue

            for operation in operations:
                df[col] = self._apply_operation(df[col], operation)

        return df

    def _apply_operation(self, series: pd.Series, operation: str) -> pd.Series:
        """Apply a specific cleaning operation to a series."""
        if operation == 'trim':
            if pd.api.types.is_object_dtype(series):
                return series.str.strip()
        elif operation == 'lowercase':
            if pd.api.types.is_object_dtype(series):
                return series.str.lower()
        elif operation == 'uppercase':
            if pd.api.types.is_object_dtype(series):
                return series.str.upper()
        elif operation == 'remove_special':
            if pd.api.types.is_object_dtype(series):
                return series.str.replace(r'[^a-zA-Z0-9\s]', '', regex=True)
        elif operation == 'remove_numbers':
            if pd.api.types.is_object_dtype(series):
                return series.str.replace(r'\d+', '', regex=True)
        elif operation == 'remove_spaces':
            if pd.api.types.is_object_dtype(series):
                return series.str.replace(r'\s+', '', regex=True)
        elif operation == 'abs':
            if pd.api.types.is_numeric_dtype(series):
                return series.abs()
        elif operation == 'round':
            if pd.api.types.is_numeric_dtype(series):
                return series.round()

        return series

    def get_cleaning_stats(self) -> Dict[str, Any]:
        """Get statistics from the cleaning process."""
        return self.cleaning_stats