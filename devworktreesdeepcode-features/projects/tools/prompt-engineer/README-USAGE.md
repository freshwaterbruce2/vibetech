# Quick Usage Guide

This Interactive Context Collector is now ready to use! Here are the simple ways to get context for your prompt engineering tasks.

## Quick Start (Recommended)

For most users, this is all you need:

```powershell
# 1. Basic context collection (works everywhere)
python basic_collect.py

# 2. For different directory
python basic_collect.py C:\path\to\your\project
```

This will:
- Analyze all code files in the directory
- Find documentation files
- Create `context_results.json` with the results
- Give you a summary to copy into AI prompts

## What Works Now

### ✅ Working Features
- **Code Analysis**: Supports 20+ languages (Python, JS/TS, Java, C++, Go, Rust, etc.)
- **Multi-language detection**: Automatically detects file types
- **Documentation scanning**: Finds .md, .rst, .txt files  
- **JSON output**: Clean, structured data for prompts
- **Windows PowerShell compatible**: No Unicode issues
- **Configurable paths**: Works from any directory

### ✅ Available Tools
- `python basic_collect.py` - Simple, reliable collection
- `python simple_example.py` - Test basic functionality  
- `python test_runner.py` - Run basic validation tests
- `.\scripts\test_collector.ps1 -Test` - PowerShell test script

### ✅ Output Format
The collector creates `context_results.json` with:
- File counts and language breakdown
- Lines of code statistics  
- Documentation file listing
- Timestamp and configuration used

## Advanced Usage

If you want the interactive questionary-based collector:

```powershell
python -m src.collectors.interactive_collector
```

This provides a menu-driven interface for more detailed configuration.

## Troubleshooting

### Common Issues
- **Unicode errors**: Use `basic_collect.py` instead of interactive mode
- **Missing dependencies**: Run `pip install -r requirements.txt`  
- **PowerShell execution**: Use `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process`

### File Issues  
- **No files found**: Check that you're in the right directory
- **Permission errors**: Run from a directory you have write access to
- **Large repos**: The collector limits to 50 files by default for performance

## Examples

```powershell
# Analyze current directory
python basic_collect.py

# Analyze specific project  
python basic_collect.py C:\dev\my-project

# Check what's working
python test_runner.py

# Test basic functionality
python simple_example.py
```

## Next Steps

1. Run `python basic_collect.py` to get context from your project
2. Open `context_results.json` to see what was collected
3. Copy relevant parts into your AI/LLM prompts
4. Use the context for code reviews, documentation, or analysis

The tool is now functional and reliable for prompt engineering workflows!