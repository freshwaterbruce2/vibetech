"""
Data quality checking module with comprehensive validation rules.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from scipy import stats
from ..core.exceptions import DataQualityException


class DataQualityChecker:
    """Comprehensive data quality checker with configurable rules."""

    def __init__(self, config: Any):
        """
        Initialize quality checker.

        Args:
            config: Validation configuration
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    def check(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Perform comprehensive quality checks on DataFrame.

        Args:
            df: DataFrame to check

        Returns:
            Dictionary with quality check results
        """
        results = {
            'overall_quality_score': 100.0,
            'issues': [],
            'warnings': [],
            'statistics': {},
            'checks_performed': []
        }

        # Perform various quality checks
        if self.config.check_nulls:
            self._check_missing_values(df, results)

        if self.config.check_duplicates:
            self._check_duplicates(df, results)

        if self.config.check_outliers:
            self._check_outliers(df, results)

        # Check custom rules
        for rule in self.config.custom_rules:
            self._check_custom_rule(df, rule, results)

        # Additional quality checks
        self._check_data_consistency(df, results)
        self._check_data_completeness(df, results)
        self._check_data_validity(df, results)

        # Calculate overall quality score
        results['overall_quality_score'] = self._calculate_quality_score(results)

        return results

    def _check_missing_values(self, df: pd.DataFrame, results: Dict[str, Any]):
        """Check for missing values in DataFrame."""
        results['checks_performed'].append('missing_values')

        missing_stats = {
            'total_missing': df.isna().sum().sum(),
            'columns_with_missing': {},
            'rows_with_missing': df.isna().any(axis=1).sum()
        }

        for col in df.columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                missing_pct = missing_count / len(df)
                missing_stats['columns_with_missing'][col] = {
                    'count': int(missing_count),
                    'percentage': round(missing_pct * 100, 2)
                }

                # Check against threshold
                if missing_pct > self.config.missing_threshold:
                    results['issues'].append({
                        'type': 'high_missing_values',
                        'column': col,
                        'missing_percentage': round(missing_pct * 100, 2),
                        'threshold': self.config.missing_threshold * 100,
                        'message': f"Column '{col}' has {missing_pct*100:.1f}% missing values"
                    })

        results['statistics']['missing_values'] = missing_stats

    def _check_duplicates(self, df: pd.DataFrame, results: Dict[str, Any]):
        """Check for duplicate rows in DataFrame."""
        results['checks_performed'].append('duplicates')

        # Check for complete duplicate rows
        duplicate_rows = df.duplicated().sum()

        duplicate_stats = {
            'duplicate_rows': int(duplicate_rows),
            'duplicate_percentage': round(duplicate_rows / len(df) * 100, 2)
        }

        if duplicate_rows > 0:
            results['warnings'].append({
                'type': 'duplicate_rows',
                'count': int(duplicate_rows),
                'message': f"Found {duplicate_rows} duplicate rows ({duplicate_rows/len(df)*100:.1f}%)"
            })

        # Check for duplicates in each column
        columns_with_low_cardinality = []
        for col in df.columns:
            unique_ratio = df[col].nunique() / len(df)
            if unique_ratio < 0.01:  # Less than 1% unique values
                columns_with_low_cardinality.append({
                    'column': col,
                    'unique_values': df[col].nunique(),
                    'unique_ratio': round(unique_ratio * 100, 2)
                })

        if columns_with_low_cardinality:
            duplicate_stats['low_cardinality_columns'] = columns_with_low_cardinality

        results['statistics']['duplicates'] = duplicate_stats

    def _check_outliers(self, df: pd.DataFrame, results: Dict[str, Any]):
        """Check for outliers in numeric columns."""
        results['checks_performed'].append('outliers')

        outlier_stats = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            col_data = df[col].dropna()

            if len(col_data) < 10:
                continue

            # Calculate outliers using IQR method
            Q1 = col_data.quantile(0.25)
            Q3 = col_data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outliers_iqr = ((col_data < lower_bound) | (col_data > upper_bound)).sum()

            # Calculate outliers using Z-score method
            if self.config.outlier_threshold:
                z_scores = np.abs(stats.zscore(col_data))
                outliers_zscore = (z_scores > self.config.outlier_threshold).sum()
            else:
                outliers_zscore = 0

            outlier_count = max(outliers_iqr, outliers_zscore)

            if outlier_count > 0:
                outlier_pct = outlier_count / len(col_data) * 100
                outlier_stats[col] = {
                    'count': int(outlier_count),
                    'percentage': round(outlier_pct, 2),
                    'method': 'IQR and Z-score',
                    'bounds': {
                        'lower': float(lower_bound),
                        'upper': float(upper_bound)
                    }
                }

                if outlier_pct > 5:  # More than 5% outliers
                    results['warnings'].append({
                        'type': 'high_outliers',
                        'column': col,
                        'outlier_percentage': round(outlier_pct, 2),
                        'message': f"Column '{col}' has {outlier_pct:.1f}% outliers"
                    })

        results['statistics']['outliers'] = outlier_stats

    def _check_data_consistency(self, df: pd.DataFrame, results: Dict[str, Any]):
        """Check data consistency across columns."""
        results['checks_performed'].append('consistency')

        consistency_issues = []

        # Check for inconsistent data types in string columns
        for col in df.select_dtypes(include=['object']).columns:
            # Check if column contains mixed types
            types_in_col = df[col].dropna().apply(type).unique()
            if len(types_in_col) > 1:
                consistency_issues.append({
                    'column': col,
                    'issue': 'mixed_types',
                    'types': [t.__name__ for t in types_in_col]
                })

        # Check for negative values in columns that shouldn't have them
        for col in df.select_dtypes(include=[np.number]).columns:
            if any(keyword in col.lower() for keyword in ['age', 'count', 'quantity', 'price']):
                negative_count = (df[col] < 0).sum()
                if negative_count > 0:
                    consistency_issues.append({
                        'column': col,
                        'issue': 'negative_values',
                        'count': int(negative_count)
                    })

        if consistency_issues:
            results['warnings'].extend([
                {
                    'type': 'consistency',
                    'details': issue,
                    'message': f"Consistency issue in column '{issue['column']}': {issue['issue']}"
                }
                for issue in consistency_issues
            ])

        results['statistics']['consistency'] = {
            'issues_found': len(consistency_issues),
            'details': consistency_issues
        }

    def _check_data_completeness(self, df: pd.DataFrame, results: Dict[str, Any]):
        """Check data completeness."""
        results['checks_performed'].append('completeness')

        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isna().sum().sum()
        completeness_score = (total_cells - missing_cells) / total_cells * 100

        completeness_stats = {
            'completeness_score': round(completeness_score, 2),
            'total_cells': total_cells,
            'missing_cells': int(missing_cells),
            'complete_rows': int((~df.isna().any(axis=1)).sum()),
            'complete_columns': int((~df.isna().any(axis=0)).sum())
        }

        if completeness_score < 80:
            results['issues'].append({
                'type': 'low_completeness',
                'completeness_score': round(completeness_score, 2),
                'message': f"Data completeness is only {completeness_score:.1f}%"
            })

        results['statistics']['completeness'] = completeness_stats

    def _check_data_validity(self, df: pd.DataFrame, results: Dict[str, Any]):
        """Check data validity for common patterns."""
        results['checks_performed'].append('validity')

        validity_issues = []

        # Check for common invalid patterns
        for col in df.columns:
            col_data = df[col]

            # Check email columns
            if 'email' in col.lower():
                if pd.api.types.is_object_dtype(col_data):
                    import re
                    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                    invalid_emails = col_data.dropna().apply(
                        lambda x: not bool(re.match(email_pattern, str(x)))
                    ).sum()
                    if invalid_emails > 0:
                        validity_issues.append({
                            'column': col,
                            'type': 'invalid_email',
                            'count': int(invalid_emails)
                        })

            # Check date columns
            if 'date' in col.lower() or 'time' in col.lower():
                if pd.api.types.is_object_dtype(col_data):
                    # Try to parse dates
                    try:
                        pd.to_datetime(col_data.dropna(), errors='coerce')
                        invalid_dates = col_data.dropna().apply(
                            lambda x: pd.to_datetime(x, errors='coerce') is pd.NaT
                        ).sum()
                        if invalid_dates > 0:
                            validity_issues.append({
                                'column': col,
                                'type': 'invalid_date',
                                'count': int(invalid_dates)
                            })
                    except:
                        pass

            # Check phone numbers
            if 'phone' in col.lower() or 'mobile' in col.lower():
                if pd.api.types.is_object_dtype(col_data):
                    import re
                    phone_pattern = r'^[\d\s\-\+\(\)]+$'
                    invalid_phones = col_data.dropna().apply(
                        lambda x: not bool(re.match(phone_pattern, str(x)))
                    ).sum()
                    if invalid_phones > 0:
                        validity_issues.append({
                            'column': col,
                            'type': 'invalid_phone',
                            'count': int(invalid_phones)
                        })

        if validity_issues:
            for issue in validity_issues:
                results['warnings'].append({
                    'type': 'validity',
                    'column': issue['column'],
                    'issue_type': issue['type'],
                    'count': issue['count'],
                    'message': f"Column '{issue['column']}' has {issue['count']} {issue['type']} values"
                })

        results['statistics']['validity'] = {
            'issues_found': len(validity_issues),
            'details': validity_issues
        }

    def _check_custom_rule(self, df: pd.DataFrame, rule: Dict[str, Any], results: Dict[str, Any]):
        """Check custom validation rule."""
        try:
            rule_type = rule.get('type')
            column = rule.get('column')

            if rule_type == 'range' and column in df.columns:
                min_val = rule.get('min')
                max_val = rule.get('max')
                violations = 0

                if min_val is not None:
                    violations += (df[column] < min_val).sum()
                if max_val is not None:
                    violations += (df[column] > max_val).sum()

                if violations > 0:
                    results['issues'].append({
                        'type': 'custom_rule',
                        'rule': rule.get('name', 'unnamed'),
                        'column': column,
                        'violations': int(violations),
                        'message': f"Custom rule '{rule.get('name', 'range')}' violated for column '{column}'"
                    })

            elif rule_type == 'regex' and column in df.columns:
                import re
                pattern = rule.get('pattern')
                if pattern:
                    violations = df[column].dropna().apply(
                        lambda x: not bool(re.match(pattern, str(x)))
                    ).sum()
                    if violations > 0:
                        results['warnings'].append({
                            'type': 'custom_rule',
                            'rule': rule.get('name', 'regex'),
                            'column': column,
                            'violations': int(violations),
                            'message': f"Custom regex rule violated for column '{column}'"
                        })

            elif rule_type == 'custom' and 'function' in rule:
                # Execute custom validation function
                func = rule['function']
                if callable(func):
                    result = func(df)
                    if not result:
                        results['issues'].append({
                            'type': 'custom_rule',
                            'rule': rule.get('name', 'custom'),
                            'message': rule.get('message', 'Custom rule failed')
                        })

        except Exception as e:
            self.logger.warning(f"Failed to check custom rule: {e}")

    def _calculate_quality_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate overall data quality score.

        Args:
            results: Quality check results

        Returns:
            Quality score (0-100)
        """
        score = 100.0

        # Deduct points for issues
        score -= len(results['issues']) * 10
        score -= len(results['warnings']) * 2

        # Consider completeness
        completeness = results['statistics'].get('completeness', {})
        if completeness:
            completeness_score = completeness.get('completeness_score', 100)
            score = score * 0.7 + completeness_score * 0.3

        # Ensure score is between 0 and 100
        return max(0, min(100, score))

    def generate_quality_report(self, results: Dict[str, Any]) -> str:
        """
        Generate human-readable quality report.

        Args:
            results: Quality check results

        Returns:
            Formatted report string
        """
        report = []
        report.append("=" * 60)
        report.append("DATA QUALITY REPORT")
        report.append("=" * 60)

        # Overall score
        score = results['overall_quality_score']
        grade = 'A' if score >= 90 else 'B' if score >= 80 else 'C' if score >= 70 else 'D' if score >= 60 else 'F'
        report.append(f"\nOverall Quality Score: {score:.1f}% (Grade: {grade})")

        # Checks performed
        report.append(f"\nChecks Performed: {', '.join(results['checks_performed'])}")

        # Issues
        issues = results.get('issues', [])
        if issues:
            report.append(f"\nCritical Issues ({len(issues)}):")
            for i, issue in enumerate(issues[:10], 1):  # Limit to 10
                report.append(f"  {i}. {issue['message']}")

        # Warnings
        warnings = results.get('warnings', [])
        if warnings:
            report.append(f"\nWarnings ({len(warnings)}):")
            for i, warning in enumerate(warnings[:10], 1):  # Limit to 10
                report.append(f"  {i}. {warning['message']}")

        # Statistics summary
        report.append("\nStatistics Summary:")
        stats = results.get('statistics', {})

        if 'completeness' in stats:
            comp = stats['completeness']
            report.append(f"  Completeness: {comp['completeness_score']}%")

        if 'missing_values' in stats:
            miss = stats['missing_values']
            report.append(f"  Missing Values: {miss['total_missing']} cells")

        if 'duplicates' in stats:
            dup = stats['duplicates']
            report.append(f"  Duplicate Rows: {dup['duplicate_rows']}")

        if 'outliers' in stats:
            out = stats['outliers']
            report.append(f"  Columns with Outliers: {len(out)}")

        report.append("\n" + "=" * 60)
        return "\n".join(report)