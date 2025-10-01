"""
Feature engineering module with NumPy-based transformations.
"""

import pandas as pd
import numpy as np
from typing import Optional, List, Any, Dict, Union
import logging
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from ..core.exceptions import TransformationException


class FeatureEngineer:
    """Feature engineering with numerical transformations and aggregations."""

    def __init__(self, config: Any):
        """
        Initialize feature engineer.

        Args:
            config: Transformation configuration
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.scalers = {}
        self.encoders = {}
        self.feature_stats = {}

    def engineer(
        self,
        df: pd.DataFrame,
        feature_specs: Optional[List[Dict[str, Any]]] = None
    ) -> pd.DataFrame:
        """
        Apply feature engineering to DataFrame.

        Args:
            df: Input DataFrame
            feature_specs: Optional list of feature specifications

        Returns:
            DataFrame with engineered features
        """
        self.logger.info(f"Starting feature engineering on {len(df.columns)} columns")
        original_columns = len(df.columns)

        # Apply default transformations from config
        if self.config.scale_numeric:
            df = self._scale_numeric_features(df)

        if self.config.encode_categorical:
            df = self._encode_categorical_features(df)

        # Apply custom feature engineering
        df = self._create_interaction_features(df)
        df = self._create_polynomial_features(df)
        df = self._create_aggregation_features(df)
        df = self._create_datetime_features(df)
        df = self._create_text_features(df)

        # Apply custom feature specifications
        if feature_specs:
            for spec in feature_specs:
                df = self._apply_feature_spec(df, spec)

        new_features = len(df.columns) - original_columns
        self.feature_stats['features_created'] = new_features
        self.logger.info(f"Feature engineering complete. Created {new_features} new features")

        return df

    def _scale_numeric_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numeric features."""
        self.logger.debug("Scaling numeric features")
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            # Skip ID-like columns
            if 'id' in col.lower() or col.endswith('_id'):
                continue

            # Use StandardScaler by default
            scaler = StandardScaler()
            df[f'{col}_scaled'] = scaler.fit_transform(df[[col]])
            self.scalers[col] = scaler

        return df

    def _encode_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features."""
        self.logger.debug("Encoding categorical features")
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns

        for col in categorical_cols:
            unique_values = df[col].nunique()

            if unique_values <= 2:
                # Binary encoding
                df[f'{col}_encoded'] = df[col].map({
                    df[col].unique()[0]: 0,
                    df[col].unique()[1]: 1 if unique_values > 1 else 0
                })
            elif unique_values <= 10:
                # One-hot encoding for low cardinality
                dummies = pd.get_dummies(df[col], prefix=col, dummy_na=True)
                df = pd.concat([df, dummies], axis=1)
            else:
                # Label encoding for high cardinality
                encoder = LabelEncoder()
                df[f'{col}_encoded'] = encoder.fit_transform(df[col].fillna('Unknown'))
                self.encoders[col] = encoder

        return df

    def _create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features between numeric columns."""
        self.logger.debug("Creating interaction features")
        numeric_cols = df.select_dtypes(include=[np.number]).columns[:10]  # Limit to prevent explosion

        interactions_created = 0
        for i, col1 in enumerate(numeric_cols):
            for col2 in numeric_cols[i+1:]:
                if interactions_created >= 20:  # Limit number of interactions
                    break

                # Skip if columns are highly correlated
                if df[col1].corr(df[col2]) > 0.95:
                    continue

                # Create multiplication interaction
                df[f'{col1}_x_{col2}'] = df[col1] * df[col2]
                interactions_created += 1

                # Create ratio if denominator is non-zero
                if (df[col2] != 0).all():
                    df[f'{col1}_div_{col2}'] = df[col1] / df[col2]
                    interactions_created += 1

        self.feature_stats['interaction_features'] = interactions_created
        return df

    def _create_polynomial_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create polynomial features for numeric columns."""
        self.logger.debug("Creating polynomial features")
        numeric_cols = df.select_dtypes(include=[np.number]).columns[:5]  # Limit for memory

        poly_features_created = 0
        for col in numeric_cols:
            # Skip if column has negative values for sqrt
            if (df[col] >= 0).all():
                df[f'{col}_sqrt'] = np.sqrt(df[col])
                poly_features_created += 1

            # Square feature
            df[f'{col}_squared'] = df[col] ** 2
            poly_features_created += 1

            # Log transform for positive values
            if (df[col] > 0).all():
                df[f'{col}_log'] = np.log1p(df[col])
                poly_features_created += 1

        self.feature_stats['polynomial_features'] = poly_features_created
        return df

    def _create_aggregation_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create aggregation features across numeric columns."""
        self.logger.debug("Creating aggregation features")
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) > 1:
            # Row-wise statistics
            df['row_mean'] = df[numeric_cols].mean(axis=1)
            df['row_std'] = df[numeric_cols].std(axis=1)
            df['row_min'] = df[numeric_cols].min(axis=1)
            df['row_max'] = df[numeric_cols].max(axis=1)
            df['row_range'] = df['row_max'] - df['row_min']
            df['row_sum'] = df[numeric_cols].sum(axis=1)

            # Count of non-null values
            df['row_count_nonzero'] = (df[numeric_cols] != 0).sum(axis=1)
            df['row_count_positive'] = (df[numeric_cols] > 0).sum(axis=1)

            self.feature_stats['aggregation_features'] = 8

        return df

    def _create_datetime_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create datetime-based features."""
        self.logger.debug("Creating datetime features")
        datetime_features_created = 0

        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                # Extract datetime components
                df[f'{col}_year'] = df[col].dt.year
                df[f'{col}_month'] = df[col].dt.month
                df[f'{col}_day'] = df[col].dt.day
                df[f'{col}_dayofweek'] = df[col].dt.dayofweek
                df[f'{col}_dayofyear'] = df[col].dt.dayofyear
                df[f'{col}_quarter'] = df[col].dt.quarter
                df[f'{col}_is_weekend'] = df[col].dt.dayofweek.isin([5, 6]).astype(int)

                # Time-based features if time component exists
                if df[col].dt.hour.notna().any():
                    df[f'{col}_hour'] = df[col].dt.hour
                    df[f'{col}_minute'] = df[col].dt.minute
                    df[f'{col}_is_business_hour'] = df[col].dt.hour.between(9, 17).astype(int)

                datetime_features_created += 10

            # Try to parse object columns as datetime
            elif df[col].dtype == 'object':
                try:
                    temp_datetime = pd.to_datetime(df[col], errors='coerce')
                    if temp_datetime.notna().sum() > len(df) * 0.5:  # At least 50% valid
                        df[col] = temp_datetime
                        # Recursively create features for new datetime column
                        df = self._create_datetime_features(df)
                        break
                except:
                    pass

        self.feature_stats['datetime_features'] = datetime_features_created
        return df

    def _create_text_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features from text columns."""
        self.logger.debug("Creating text features")
        text_features_created = 0

        text_cols = df.select_dtypes(include=['object', 'string']).columns

        for col in text_cols[:5]:  # Limit to prevent feature explosion
            if df[col].notna().any():
                # Text length
                df[f'{col}_length'] = df[col].fillna('').str.len()

                # Word count
                df[f'{col}_word_count'] = df[col].fillna('').str.split().str.len()

                # Character counts
                df[f'{col}_digit_count'] = df[col].fillna('').str.count(r'\d')
                df[f'{col}_space_count'] = df[col].fillna('').str.count(r'\s')
                df[f'{col}_special_char_count'] = df[col].fillna('').str.count(r'[^a-zA-Z0-9\s]')

                # Case features
                df[f'{col}_upper_count'] = df[col].fillna('').str.count(r'[A-Z]')
                df[f'{col}_lower_count'] = df[col].fillna('').str.count(r'[a-z]')

                text_features_created += 7

        self.feature_stats['text_features'] = text_features_created
        return df

    def _apply_feature_spec(self, df: pd.DataFrame, spec: Dict[str, Any]) -> pd.DataFrame:
        """Apply custom feature specification."""
        try:
            feature_type = spec.get('type')

            if feature_type == 'interaction':
                col1 = spec.get('column1')
                col2 = spec.get('column2')
                operation = spec.get('operation', 'multiply')

                if col1 in df.columns and col2 in df.columns:
                    if operation == 'multiply':
                        df[f'{col1}_x_{col2}_custom'] = df[col1] * df[col2]
                    elif operation == 'divide':
                        df[f'{col1}_div_{col2}_custom'] = df[col1] / (df[col2] + 1e-10)
                    elif operation == 'add':
                        df[f'{col1}_plus_{col2}_custom'] = df[col1] + df[col2]
                    elif operation == 'subtract':
                        df[f'{col1}_minus_{col2}_custom'] = df[col1] - df[col2]

            elif feature_type == 'transform':
                column = spec.get('column')
                transform = spec.get('transform')

                if column in df.columns:
                    if transform == 'log':
                        df[f'{column}_log_custom'] = np.log1p(df[column].clip(lower=0))
                    elif transform == 'exp':
                        df[f'{column}_exp_custom'] = np.exp(df[column].clip(upper=10))
                    elif transform == 'sigmoid':
                        df[f'{column}_sigmoid_custom'] = 1 / (1 + np.exp(-df[column]))
                    elif transform == 'tanh':
                        df[f'{column}_tanh_custom'] = np.tanh(df[column])

            elif feature_type == 'custom' and 'function' in spec:
                # Apply custom function
                func = spec['function']
                if callable(func):
                    result = func(df)
                    if isinstance(result, pd.Series):
                        df[spec.get('name', 'custom_feature')] = result
                    elif isinstance(result, pd.DataFrame):
                        df = pd.concat([df, result], axis=1)

        except Exception as e:
            self.logger.warning(f"Failed to apply feature spec: {e}")

        return df

    def get_feature_importance(self, df: pd.DataFrame, target: Optional[str] = None) -> Dict[str, float]:
        """
        Calculate feature importance scores.

        Args:
            df: DataFrame with features
            target: Target column name for correlation-based importance

        Returns:
            Dictionary of feature importance scores
        """
        importance = {}

        if target and target in df.columns:
            # Correlation-based importance
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if col != target:
                    importance[col] = abs(df[col].corr(df[target]))
        else:
            # Variance-based importance
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                importance[col] = df[col].var()

        # Normalize scores
        if importance:
            max_importance = max(importance.values())
            if max_importance > 0:
                importance = {k: v/max_importance for k, v in importance.items()}

        return importance

    def get_feature_stats(self) -> Dict[str, Any]:
        """Get statistics from feature engineering process."""
        return self.feature_stats