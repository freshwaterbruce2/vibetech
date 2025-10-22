# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive Context Collector - A comprehensive Python tool for gathering context information for prompt engineering tasks. Features an interactive interface using Questionary to collect code analysis, git repository insights, and documentation for use in AI/LLM prompts.

## Development Commands

### Dependencies and Setup
```powershell
# Install Python dependencies
pip install -r requirements.txt

# Using PowerShell script (recommended for Windows 11)
.\scripts\run_collector.ps1 -Install
```

### Running the Application
```powershell
# Interactive mode (recommended)
.\scripts\run_collector.ps1

# Direct Python execution
python -m src.collectors.interactive_collector

# With specific options
.\scripts\run_collector.ps1 -Path "C:\dev\my-project" -Output "results.json" -Verbose
```

### Testing
```powershell
# Run all tests using PowerShell script
.\scripts\run_collector.ps1 -Test

# Direct pytest execution
python -m pytest tests/ -v

# Run basic tests without dependencies
python test_runner.py

# Run specific test categories
python -m pytest tests/unit/ -v                    # Unit tests only
python -m pytest tests/integration/ -v             # Integration tests only
python -m pytest -m "not slow" -v                  # Skip slow tests
python -m pytest -m requires_git -v                # Git-dependent tests only
```

### Development Tools
```powershell
# Code formatting and linting
black src/ tests/                                   # Format code
flake8 src/ tests/                                  # Check linting
mypy src/                                          # Type checking

# Run example usage
.\scripts\run_collector.ps1 -Example
python examples\example_usage.py
```

## Architecture Overview

### Core Components Architecture
- **InteractiveContextCollector**: Main orchestrator with Questionary integration for user interaction
- **CodeScanner**: Multi-language source code analysis engine supporting Python, JavaScript/TypeScript, Java, C/C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- **GitAnalyzer**: Git repository insights and statistics analyzer
- **ContextCollectionConfig**: Configuration management with sensible defaults

### Module Structure
```
src/
├── collectors/
│   ├── interactive_collector.py    # Main interactive interface and orchestration
│   ├── code_scanner.py            # Multi-language code analysis
│   ├── git_analyzer.py            # Git repository analysis
│   └── __init__.py                # Package exports with graceful import fallbacks
├── api/                           # API-related functionality
├── backup/                        # Backup utilities
└── database/                      # Database operations
```

### Key Classes and Data Models
- **CodeFile**: Represents analyzed code files with language detection, functions, classes
- **CommitInfo**: Git commit information with author, date, changes
- **FileHotSpot**: Identifies frequently changed files in repository
- **ContextCollectionConfig**: Configurable settings (max_files=1000, include_code=True, include_git=True)

### PowerShell Integration
The project is specifically designed for Windows 11 PowerShell with native ANSI color support, automatic dependency management, and comprehensive error handling. All PowerShell scripts include robust status reporting and graceful fallbacks.

## Testing Framework

### Test Configuration (pytest.ini)
- Uses pytest with custom markers: `slow`, `integration`, `unit`, `requires_git`, `requires_questionary`
- Configured with verbose output, short tracebacks, and colored output
- Automatic warning suppression for cleaner test output

### Test Structure
```
tests/
├── unit/                          # Unit tests for individual components
├── integration/                   # Full workflow integration tests
├── fixtures/                      # Test data and mock objects
├── conftest.py                    # Pytest configuration and shared fixtures
└── __init__.py
```

### Graceful Dependency Handling
The codebase includes sophisticated fallback mechanisms:
- Interactive features gracefully degrade when questionary is unavailable
- Git analysis skips cleanly when repositories aren't present
- File system operations include comprehensive error handling

## Development Workflow

### TDD Approach
The project follows Test-Driven Development principles:
1. Tests are written before implementation
2. Comprehensive unit and integration test coverage
3. Mock-based testing for external dependencies
4. Continuous testing during development

### Quality Assurance
- **Code Style**: Black for formatting, flake8 for linting
- **Type Checking**: mypy for static type analysis
- **Testing**: pytest with comprehensive coverage
- **Documentation**: Integrated help system and examples

## Output and Data Models

The collector generates comprehensive JSON output with structured data including:
- **Code Analysis**: File summaries, language detection, function/class extraction
- **Git Analysis**: Contributor statistics, hot spots, change patterns
- **Documentation**: Processed markdown and documentation files
- **Metadata**: Collection timestamps, configuration, and processing statistics

## Key Dependencies

### Core Functionality
- **questionary**: Interactive command-line interface
- **rich**: Enhanced terminal output and formatting
- **colorama**: Windows terminal color support
- **GitPython**: Git repository analysis
- **pygments**: Syntax highlighting support

### Development and Testing
- **pytest**: Testing framework with coverage and mocking
- **black**: Code formatting
- **flake8**: Linting
- **mypy**: Type checking