"""
Schema validation for DataFrames.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
import logging
from ..core.exceptions import SchemaException


class SchemaValidator:
    """Validator for DataFrame schema and data types."""

    def __init__(self):
        """Initialize schema validator."""
        self.logger = logging.getLogger(self.__class__.__name__)

    def validate(
        self,
        df: pd.DataFrame,
        schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Validate DataFrame against schema.

        Args:
            df: DataFrame to validate
            schema: Schema definition

        Returns:
            Validation results dictionary
        """
        results = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'column_analysis': {}
        }

        if schema is None:
            # Infer schema from DataFrame
            schema = self.infer_schema(df)
            results['inferred_schema'] = schema

        # Validate columns
        self._validate_columns(df, schema, results)

        # Validate data types
        self._validate_types(df, schema, results)

        # Validate constraints
        self._validate_constraints(df, schema, results)

        # Set overall validity
        results['valid'] = len(results['errors']) == 0

        return results

    def infer_schema(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Infer schema from DataFrame.

        Args:
            df: DataFrame to analyze

        Returns:
            Inferred schema dictionary
        """
        schema = {
            'columns': {},
            'constraints': {}
        }

        for col in df.columns:
            col_data = df[col]
            dtype = str(col_data.dtype)

            col_schema = {
                'type': self._map_dtype(dtype),
                'nullable': col_data.isna().any(),
                'unique': col_data.nunique() == len(col_data)
            }

            # Add statistics for numeric columns
            if pd.api.types.is_numeric_dtype(col_data):
                col_schema.update({
                    'min': float(col_data.min()) if not col_data.isna().all() else None,
                    'max': float(col_data.max()) if not col_data.isna().all() else None,
                    'mean': float(col_data.mean()) if not col_data.isna().all() else None,
                    'std': float(col_data.std()) if not col_data.isna().all() else None
                })

            # Add cardinality for categorical columns
            if pd.api.types.is_object_dtype(col_data) or pd.api.types.is_categorical_dtype(col_data):
                col_schema['cardinality'] = col_data.nunique()
                if col_data.nunique() <= 20:
                    col_schema['values'] = col_data.dropna().unique().tolist()

            schema['columns'][col] = col_schema

        # Add general constraints
        schema['constraints'] = {
            'row_count': len(df),
            'column_count': len(df.columns)
        }

        return schema

    def _map_dtype(self, dtype: str) -> str:
        """Map pandas dtype to schema type."""
        dtype_str = str(dtype).lower()

        if 'int' in dtype_str:
            return 'integer'
        elif 'float' in dtype_str:
            return 'float'
        elif 'bool' in dtype_str:
            return 'boolean'
        elif 'datetime' in dtype_str or 'timestamp' in dtype_str:
            return 'datetime'
        elif 'timedelta' in dtype_str:
            return 'timedelta'
        elif 'category' in dtype_str:
            return 'category'
        elif 'object' in dtype_str:
            return 'string'
        else:
            return 'unknown'

    def _validate_columns(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        results: Dict[str, Any]
    ):
        """Validate DataFrame columns against schema."""
        schema_columns = set(schema.get('columns', {}).keys())
        df_columns = set(df.columns)

        # Check for missing columns
        missing_columns = schema_columns - df_columns
        if missing_columns:
            results['errors'].append({
                'type': 'missing_columns',
                'columns': list(missing_columns),
                'message': f"Missing required columns: {', '.join(missing_columns)}"
            })

        # Check for extra columns
        extra_columns = df_columns - schema_columns
        if extra_columns and schema.get('strict', False):
            results['warnings'].append({
                'type': 'extra_columns',
                'columns': list(extra_columns),
                'message': f"Extra columns found: {', '.join(extra_columns)}"
            })

    def _validate_types(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        results: Dict[str, Any]
    ):
        """Validate data types against schema."""
        columns_schema = schema.get('columns', {})

        for col, col_schema in columns_schema.items():
            if col not in df.columns:
                continue

            expected_type = col_schema.get('type')
            if not expected_type:
                continue

            actual_type = self._map_dtype(str(df[col].dtype))

            # Check type compatibility
            if not self._types_compatible(actual_type, expected_type):
                results['errors'].append({
                    'type': 'type_mismatch',
                    'column': col,
                    'expected': expected_type,
                    'actual': actual_type,
                    'message': f"Column '{col}' type mismatch: expected {expected_type}, got {actual_type}"
                })

            # Store column analysis
            results['column_analysis'][col] = {
                'expected_type': expected_type,
                'actual_type': actual_type,
                'type_valid': self._types_compatible(actual_type, expected_type)
            }

    def _types_compatible(self, actual: str, expected: str) -> bool:
        """Check if types are compatible."""
        # Exact match
        if actual == expected:
            return True

        # Compatible types
        compatibility = {
            'integer': ['float', 'number'],
            'float': ['number'],
            'string': ['object', 'category'],
            'object': ['string', 'category'],
            'category': ['string', 'object']
        }

        return expected in compatibility.get(actual, [])

    def _validate_constraints(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        results: Dict[str, Any]
    ):
        """Validate data constraints against schema."""
        columns_schema = schema.get('columns', {})

        for col, col_schema in columns_schema.items():
            if col not in df.columns:
                continue

            col_data = df[col]

            # Check nullable constraint
            if not col_schema.get('nullable', True) and col_data.isna().any():
                null_count = col_data.isna().sum()
                results['errors'].append({
                    'type': 'null_constraint',
                    'column': col,
                    'null_count': int(null_count),
                    'message': f"Column '{col}' has {null_count} null values but nullable=False"
                })

            # Check unique constraint
            if col_schema.get('unique', False):
                duplicates = col_data.duplicated().sum()
                if duplicates > 0:
                    results['warnings'].append({
                        'type': 'unique_constraint',
                        'column': col,
                        'duplicate_count': int(duplicates),
                        'message': f"Column '{col}' has {duplicates} duplicate values but unique=True"
                    })

            # Check value constraints for numeric columns
            if pd.api.types.is_numeric_dtype(col_data):
                if 'min' in col_schema:
                    min_val = col_schema['min']
                    violations = (col_data < min_val).sum()
                    if violations > 0:
                        results['errors'].append({
                            'type': 'min_constraint',
                            'column': col,
                            'min_value': min_val,
                            'violations': int(violations),
                            'message': f"Column '{col}' has {violations} values below minimum {min_val}"
                        })

                if 'max' in col_schema:
                    max_val = col_schema['max']
                    violations = (col_data > max_val).sum()
                    if violations > 0:
                        results['errors'].append({
                            'type': 'max_constraint',
                            'column': col,
                            'max_value': max_val,
                            'violations': int(violations),
                            'message': f"Column '{col}' has {violations} values above maximum {max_val}"
                        })

            # Check allowed values for categorical columns
            if 'values' in col_schema:
                allowed_values = set(col_schema['values'])
                actual_values = set(col_data.dropna().unique())
                invalid_values = actual_values - allowed_values

                if invalid_values:
                    results['errors'].append({
                        'type': 'value_constraint',
                        'column': col,
                        'invalid_values': list(invalid_values)[:10],  # Limit to 10 examples
                        'message': f"Column '{col}' has invalid values: {list(invalid_values)[:10]}"
                    })

            # Check regex pattern if specified
            if 'pattern' in col_schema and pd.api.types.is_object_dtype(col_data):
                import re
                pattern = col_schema['pattern']
                try:
                    mask = col_data.dropna().apply(lambda x: bool(re.match(pattern, str(x))))
                    violations = (~mask).sum()
                    if violations > 0:
                        results['warnings'].append({
                            'type': 'pattern_constraint',
                            'column': col,
                            'pattern': pattern,
                            'violations': int(violations),
                            'message': f"Column '{col}' has {violations} values not matching pattern {pattern}"
                        })
                except Exception as e:
                    results['warnings'].append({
                        'type': 'pattern_error',
                        'column': col,
                        'message': f"Could not validate pattern for column '{col}': {e}"
                    })

    def create_schema_report(self, validation_results: Dict[str, Any]) -> str:
        """
        Create a human-readable schema validation report.

        Args:
            validation_results: Results from validate method

        Returns:
            Formatted report string
        """
        report = []
        report.append("=" * 60)
        report.append("SCHEMA VALIDATION REPORT")
        report.append("=" * 60)

        # Overall status
        status = "PASSED" if validation_results['valid'] else "FAILED"
        report.append(f"\nOverall Status: {status}")

        # Errors
        errors = validation_results.get('errors', [])
        if errors:
            report.append(f"\nErrors ({len(errors)}):")
            for i, error in enumerate(errors, 1):
                report.append(f"  {i}. {error['message']}")

        # Warnings
        warnings = validation_results.get('warnings', [])
        if warnings:
            report.append(f"\nWarnings ({len(warnings)}):")
            for i, warning in enumerate(warnings, 1):
                report.append(f"  {i}. {warning['message']}")

        # Column analysis
        column_analysis = validation_results.get('column_analysis', {})
        if column_analysis:
            report.append("\nColumn Analysis:")
            for col, analysis in column_analysis.items():
                status = "✓" if analysis.get('type_valid', False) else "✗"
                report.append(f"  {status} {col}: {analysis.get('actual_type')} "
                            f"(expected: {analysis.get('expected_type')})")

        report.append("\n" + "=" * 60)
        return "\n".join(report)