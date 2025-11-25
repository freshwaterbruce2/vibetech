# Data Processing Pipeline

A comprehensive, production-ready data processing pipeline with validation, transformation, monitoring, and visualization capabilities.

## Features

- **Multiple Data Sources**: CSV, SQL databases, REST APIs
- **Data Validation**: Schema checking and quality validation
- **Data Cleaning**: Handling missing values, duplicates, outliers
- **Feature Engineering**: Automatic feature generation with NumPy
- **Monitoring**: Real-time performance tracking and metrics
- **Visualization**: Data quality reports and pipeline performance charts
- **Memory Efficient**: Chunked processing for large datasets
- **Extensible**: Modular architecture for custom transformations

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

```python
from core.pipeline import DataPipeline
from core.config import PipelineConfig, TransformConfig, ValidationConfig

# Configure pipeline
config = PipelineConfig(
    name="My Pipeline",
    source_type="csv",
    source_path="data.csv",
    output_path="processed_data.csv",
    enable_monitoring=True
)

# Set up transformations
transform_config = TransformConfig(
    handle_missing="median",
    scale_numeric=True,
    encode_categorical=True
)

# Execute pipeline
pipeline = DataPipeline(config)
result = pipeline.execute(transform_config=transform_config)

if result['success']:
    print(f"Processed {result['rows_processed']} rows")
```

## Architecture

```
data_pipeline/
├── core/
│   ├── pipeline.py         # Main orchestrator
│   ├── config.py           # Configuration management
│   └── exceptions.py       # Custom exceptions
├── loaders/
│   ├── csv_loader.py       # CSV data loading
│   ├── sql_loader.py       # Database connectivity
│   └── api_loader.py       # REST API integration
├── validators/
│   ├── schema.py           # Schema validation
│   └── quality.py          # Data quality checks
├── transformers/
│   ├── cleaner.py          # Data cleaning operations
│   └── feature_engineer.py # Feature generation
├── monitoring/
│   ├── monitor.py          # Performance tracking
│   └── visualizer.py       # Data visualization
├── examples/
│   └── pipeline_demo.ipynb # Jupyter notebook demo
└── tests/
    └── test_pipeline.py    # Comprehensive tests
```

## Data Sources

### CSV Files
```python
config = PipelineConfig(
    source_type="csv",
    source_path="data.csv",
    chunk_size=10000  # For large files
)
```

### SQL Databases
```python
config = PipelineConfig(
    source_type="sql",
    db_config={
        "type": "postgresql",
        "host": "localhost",
        "database": "mydb",
        "query": "SELECT * FROM users"
    }
)
```

### REST APIs
```python
config = PipelineConfig(
    source_type="api",
    api_config={
        "url": "https://api.example.com/data",
        "method": "GET",
        "headers": {"Authorization": "Bearer token"},
        "pagination": {
            "type": "offset",
            "page_size": 100
        }
    }
)
```

## Validation

### Schema Validation
```python
validation_config = ValidationConfig(
    check_schema=True,
    expected_schema={
        'id': 'int64',
        'name': 'object',
        'amount': 'float64'
    }
)
```

### Quality Checks
```python
validation_config = ValidationConfig(
    check_quality=True,
    quality_checks=[
        'missing_values',
        'duplicates',
        'outliers',
        'data_types'
    ],
    quality_thresholds={
        'missing_ratio': 0.1,
        'duplicate_ratio': 0.05
    }
)
```

## Transformations

### Data Cleaning
- Handle missing values (drop, fill with mean/median/mode)
- Remove duplicates
- Remove outliers using IQR method
- Standardize column names
- Clean text data

### Feature Engineering
- Automatic scaling (StandardScaler, MinMaxScaler)
- Categorical encoding (one-hot, label encoding)
- Interaction features
- Polynomial features
- Datetime feature extraction
- Text feature extraction

## Monitoring

The pipeline provides comprehensive monitoring:

```python
# Access monitoring metrics
result = pipeline.execute()
metrics = result['monitoring_metrics']

# Stage performance
for stage, stats in metrics['stages'].items():
    print(f"{stage}: {stats['duration']:.2f}s")

# Resource usage
print(f"Peak memory: {metrics['summary']['peak_memory_mb']:.1f}MB")
print(f"Average CPU: {metrics['summary']['average_cpu_percent']:.1f}%")
```

## Visualization

Generate visual reports for data quality and pipeline performance:

```python
from monitoring.visualizer import QualityVisualizer

visualizer = QualityVisualizer()

# Validation report
visualizer.plot_validation_results(validation_report)

# Pipeline performance
visualizer.plot_pipeline_summary(pipeline_report)

# Data profiling
visualizer.plot_data_profiling(df)

# Correlation matrix
visualizer.plot_correlation_matrix(df)
```

## Custom Transformations

Add custom transformation functions:

```python
def custom_transform(df):
    df['new_feature'] = df['col1'] * df['col2']
    return df

config = PipelineConfig(
    custom_transforms=[custom_transform]
)
```

## Testing

Run the comprehensive test suite:

```bash
python tests/test_pipeline.py
```

Or use pytest:

```bash
pytest tests/ -v
```

## Performance Considerations

- **Chunking**: Process large files in chunks to manage memory
- **Parallel Processing**: Use multiple workers for API calls
- **Caching**: Results are cached for repeated operations
- **Type Optimization**: Automatic downcasting of numeric types

## Error Handling

The pipeline includes comprehensive error handling:

```python
result = pipeline.execute()

if not result['success']:
    for error in result['errors']:
        print(f"Error: {error}")

    # Check warnings
    for warning in result.get('warnings', []):
        print(f"Warning: {warning}")
```

## Configuration Options

See `core/config.py` for all available configuration options:

- `chunk_size`: Size of data chunks for processing
- `max_workers`: Number of parallel workers
- `cache_enabled`: Enable result caching
- `enable_monitoring`: Track performance metrics
- `enable_profiling`: Detailed profiling information
- `memory_limit_mb`: Memory usage limit
- `timeout_seconds`: Operation timeout

## Production Deployment

For production use:

1. Set appropriate memory limits
2. Configure logging levels
3. Enable monitoring and alerting
4. Use connection pooling for databases
5. Implement retry logic for API calls
6. Set up proper error tracking

## License

MIT