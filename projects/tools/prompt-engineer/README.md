# Interactive Context Collector

A comprehensive tool for gathering context information for prompt engineering tasks. This tool provides an interactive interface using Questionary to collect code analysis, git repository insights, and documentation for use in AI/LLM prompts.

## Features

- **Interactive Code Analysis**: Scan and analyze source code files across multiple languages
- **Git Repository Insights**: Extract development patterns, hot spots, and contributor statistics
- **Documentation Processing**: Parse and analyze documentation files
- **User-Friendly Interface**: Interactive prompts using Questionary for easy configuration
- **PowerShell Integration**: Native Windows 11 PowerShell support
- **Comprehensive Testing**: Full test suite following TDD principles

## Supported Languages

- Python
- JavaScript/TypeScript
- Java
- C/C++
- C#
- Go
- Rust
- Ruby
- PHP
- Swift
- Kotlin
- And many more...

## Installation

1. **Install Python Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

2. **Using the PowerShell Script** (Recommended for Windows 11):
   ```powershell
   .\scripts\run_collector.ps1 -Install
   ```

## Usage

### Interactive Mode (Recommended)

```powershell
# Using PowerShell script (Windows 11)
.\scripts\run_collector.ps1

# Or directly with Python
python -m src.collectors.interactive_collector
```

### Command Line Options

```powershell
# Specify a different path
.\scripts\run_collector.ps1 -Path "C:\dev\my-project"

# Save output to specific file
.\scripts\run_collector.ps1 -Output "context_data.json"

# Enable verbose logging
.\scripts\run_collector.ps1 -Verbose

# Run tests
.\scripts\run_collector.ps1 -Test

# See example usage
.\scripts\run_collector.ps1 -Example
```

### Programmatic Usage

```python
from src.collectors.interactive_collector import InteractiveContextCollector

# Create collector
collector = InteractiveContextCollector("C:\\path\\to\\project")

# Configure (optional - can also use interactive mode)
collector.config.include_code = True
collector.config.include_git = True
collector.config.max_files = 500

# Collect context
context_data = collector.collect_context()

# Save results
output_file = collector.save_results(context_data, "results.json")
```

## Configuration Options

### Context Types
- **Code Analysis**: Scan source code files, extract functions, classes, and dependencies
- **Git Analysis**: Analyze commit history, contributors, and code hot spots
- **Documentation**: Process markdown, text, and other documentation files

### Advanced Settings
- **Max Files**: Limit the number of files to process
- **Max Commits**: Limit git history analysis depth
- **Days Back**: How far back to analyze git history
- **Recursive Scan**: Whether to scan subdirectories
- **Output Format**: detailed, summary, or json

## Output Structure

The collector generates comprehensive JSON output with the following structure:

```json
{
  "collection_time": "2023-01-01T12:00:00",
  "base_path": "C:\\dev\\project",
  "config": {
    "include_code": true,
    "include_git": true,
    "max_files": 1000
  },
  "results": {
    "code_analysis": {
      "summary": {
        "total_files": 150,
        "total_lines": 25000,
        "languages": {...}
      },
      "files": [...]
    },
    "git_analysis": {
      "contributors": {...},
      "hot_spots": [...],
      "change_patterns": {...}
    },
    "documentation": {
      "files": [...],
      "summary": {...}
    }
  }
}
```

## Testing

### Run All Tests
```powershell
# Using PowerShell script
.\scripts\run_collector.ps1 -Test

# Or directly with pytest
python -m pytest tests/ -v
```

### Run Basic Tests (No Dependencies)
```powershell
python test_runner.py
```

### Test Coverage
- Unit tests for all major components
- Integration tests for full workflows
- Mock-based testing for external dependencies
- TDD approach with comprehensive coverage

## Development

### Project Structure
```
prompt-engineer/
├── src/
│   └── collectors/
│       ├── __init__.py
│       ├── interactive_collector.py    # Main interactive interface
│       ├── code_scanner.py            # Code analysis
│       └── git_analyzer.py            # Git repository analysis
├── tests/
│   ├── unit/                          # Unit tests
│   └── integration/                   # Integration tests
├── examples/
│   └── example_usage.py              # Usage examples
├── scripts/
│   └── run_collector.ps1             # PowerShell runner
├── requirements.txt                   # Python dependencies
└── README.md
```

### Key Classes

1. **InteractiveContextCollector**: Main orchestrator with Questionary integration
2. **CodeScanner**: Multi-language source code analysis
3. **GitAnalyzer**: Git repository insights and statistics
4. **ContextCollectionConfig**: Configuration management

### Dependencies

- **questionary**: Interactive command-line interface
- **rich**: Enhanced terminal output and formatting
- **colorama**: Windows terminal color support
- **GitPython**: Git repository analysis
- **pygments**: Syntax highlighting support

## PowerShell Integration

The tool is specifically designed for Windows 11 PowerShell with:

- Native PowerShell execution script
- Colorized output using ANSI escape sequences
- Proper error handling and status reporting
- Automatic dependency checking and installation
- Integration with existing PowerShell workflows

### PowerShell Commands

```powershell
# Install and run
.\scripts\run_collector.ps1 -Install
.\scripts\run_collector.ps1

# Advanced usage
.\scripts\run_collector.ps1 -Path "C:\dev\project" -Output "results.json" -Verbose

# Development workflow
.\scripts\run_collector.ps1 -Test      # Run tests
.\scripts\run_collector.ps1 -Example   # See examples
```

## Use Cases

1. **Prompt Engineering**: Gather comprehensive context for LLM interactions
2. **Code Review**: Analyze codebases for review preparation
3. **Documentation**: Generate project overviews and summaries
4. **Onboarding**: Help new developers understand project structure
5. **Technical Debt Analysis**: Identify hot spots and complexity areas

## Error Handling

The tool includes robust error handling for:
- Missing dependencies
- Invalid file paths
- Git repository issues
- File permission problems
- Network connectivity (if applicable)

## Contributing

1. Follow TDD principles for new features
2. Add comprehensive tests for all functionality
3. Ensure PowerShell compatibility for Windows 11
4. Update documentation for any new features
5. Test with various project types and sizes

## License

[Specify your license here]

## Support

For issues or questions:
1. Check the example usage script
2. Run with verbose logging for detailed output
3. Review test results for compatibility issues
4. Ensure all dependencies are properly installed