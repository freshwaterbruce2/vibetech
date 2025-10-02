"""
Unit tests for CodeScanner class.
"""

import pytest
import tempfile
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch

from src.collectors.code_scanner import CodeScanner, CodeFile

class TestCodeScanner:
    """Test CodeScanner functionality."""
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            yield Path(tmp_dir)
    
    @pytest.fixture
    def scanner(self):
        """Create a CodeScanner instance."""
        return CodeScanner()
    
    def test_init_default(self, scanner):
        """Test default initialization."""
        assert scanner.ignore_patterns == CodeScanner.DEFAULT_IGNORE_PATTERNS
        assert 'python' in scanner.analyzers
        assert 'javascript' in scanner.analyzers
    
    def test_init_custom_ignore_patterns(self):
        """Test initialization with custom ignore patterns."""
        custom_patterns = {'*.custom', 'custom_dir'}
        scanner = CodeScanner(ignore_patterns=custom_patterns)
        
        assert custom_patterns.issubset(scanner.ignore_patterns)
        assert CodeScanner.DEFAULT_IGNORE_PATTERNS.issubset(scanner.ignore_patterns)
    
    def test_get_language(self, scanner):
        """Test language detection from file extensions."""
        assert scanner._get_language(Path('test.py')) == 'python'
        assert scanner._get_language(Path('test.js')) == 'javascript'
        assert scanner._get_language(Path('test.ts')) == 'typescript'
        assert scanner._get_language(Path('test.java')) == 'java'
        assert scanner._get_language(Path('test.unknown')) is None
    
    def test_analyze_file_nonexistent(self, scanner):
        """Test analyzing non-existent file."""
        result = scanner.analyze_file('nonexistent.py')
        assert result is None
    
    def test_analyze_python_file(self, temp_dir, scanner):
        """Test analyzing a Python file."""
        python_code = '''"""Module docstring."""
import os
import sys
from pathlib import Path

class TestClass:
    """Test class docstring."""
    
    def __init__(self):
        pass
    
    def test_method(self, arg1, arg2="default"):
        """Method docstring."""
        return arg1 + arg2

def test_function():
    """Function docstring."""
    return "test"

async def async_function():
    """Async function."""
    return await some_async_call()
'''
        
        test_file = temp_dir / 'test.py'
        test_file.write_text(python_code)
        
        result = scanner.analyze_file(str(test_file))
        
        assert result is not None
        assert result.language == 'python'
        assert result.path == str(test_file)
        assert len(result.imports) >= 3  # os, sys, pathlib.Path
        assert len(result.functions) >= 2  # test_function, async_function
        assert len(result.classes) == 1   # TestClass
        assert 'TestClass' in [cls['name'] for cls in result.classes]
        assert 'test_function' in [func['name'] for func in result.functions]
    
    def test_analyze_javascript_file(self, temp_dir, scanner):
        """Test analyzing a JavaScript file."""
        js_code = '''
import React from 'react';
import { useState } from 'react';
const lodash = require('lodash');

class Component extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return <div>Test</div>;
    }
}

function testFunction() {
    return "test";
}

const arrowFunction = () => {
    return "arrow";
};

async function asyncFunction() {
    return await fetch('/api');
}
'''
        
        test_file = temp_dir / 'test.js'
        test_file.write_text(js_code)
        
        result = scanner.analyze_file(str(test_file))
        
        assert result is not None
        assert result.language == 'javascript'
        assert 'react' in result.imports
        assert len(result.classes) >= 1
        assert len(result.functions) >= 3
    
    def test_scan_directory_empty(self, temp_dir, scanner):
        """Test scanning empty directory."""
        result = scanner.scan_directory(str(temp_dir))
        
        assert result['directory'] == str(temp_dir)
        assert result['files'] == []
        assert result['summary']['total_files'] == 0
    
    def test_scan_directory_with_files(self, temp_dir, scanner):
        """Test scanning directory with code files."""
        # Create test files
        (temp_dir / 'test.py').write_text('def hello(): pass')
        (temp_dir / 'test.js').write_text('function hello() {}')
        (temp_dir / 'README.md').write_text('# Documentation')  # Should be ignored
        
        result = scanner.scan_directory(str(temp_dir))
        
        assert len(result['files']) == 2  # Only .py and .js files
        assert result['summary']['total_files'] == 2
        assert 'python' in result['summary']['languages']
        assert 'javascript' in result['summary']['languages']
    
    def test_scan_directory_recursive(self, temp_dir, scanner):
        """Test recursive directory scanning."""
        # Create nested structure
        sub_dir = temp_dir / 'subdir'
        sub_dir.mkdir()
        
        (temp_dir / 'root.py').write_text('def root(): pass')
        (sub_dir / 'nested.py').write_text('def nested(): pass')
        
        # Test recursive (default)
        result = scanner.scan_directory(str(temp_dir), recursive=True)
        assert len(result['files']) == 2
        
        # Test non-recursive
        result = scanner.scan_directory(str(temp_dir), recursive=False)
        assert len(result['files']) == 1
    
    def test_scan_directory_max_files_limit(self, temp_dir, scanner):
        """Test max_files limitation."""
        # Create multiple files
        for i in range(5):
            (temp_dir / f'test{i}.py').write_text(f'def func{i}(): pass')
        
        result = scanner.scan_directory(str(temp_dir), max_files=3)
        
        assert len(result['files']) <= 3
    
    def test_scan_directory_ignore_patterns(self, temp_dir):
        """Test ignore patterns functionality."""
        # Create files that should be ignored
        (temp_dir / 'test.py').write_text('def test(): pass')
        (temp_dir / 'test.pyc').write_text('compiled')
        
        pycache_dir = temp_dir / '__pycache__'
        pycache_dir.mkdir()
        (pycache_dir / 'cached.pyc').write_text('cached')
        
        scanner = CodeScanner()
        result = scanner.scan_directory(str(temp_dir))
        
        # Should only find the .py file, not .pyc or __pycache__
        assert len(result['files']) == 1
        assert result['files'][0]['path'].endswith('test.py')
    
    def test_analyze_file_syntax_error(self, temp_dir, scanner):
        """Test handling of files with syntax errors."""
        invalid_python = '''
def broken_function(
    # Missing closing parenthesis and colon
'''
        
        test_file = temp_dir / 'broken.py'
        test_file.write_text(invalid_python)
        
        # Should not crash and return partial results
        result = scanner.analyze_file(str(test_file))
        
        assert result is not None
        assert result.language == 'python'
        # Functions list might be empty due to syntax error
        assert isinstance(result.functions, list)
    
    def test_update_summary(self, scanner):
        """Test summary update functionality."""
        summary = {
            'languages': {},
            'total_lines': 0,
            'total_size': 0,
            'function_count': 0,
            'class_count': 0
        }
        
        code_file = CodeFile(
            path='test.py',
            language='python',
            content='test content',
            size=100,
            lines_of_code=10,
            hash='testhash',
            last_modified=datetime.now(),
            imports=['os'],
            functions=[{'name': 'test_func'}],
            classes=[{'name': 'TestClass'}],
            dependencies=['os'],
            ast_data={}
        )
        
        scanner._update_summary(summary, code_file)
        
        assert summary['languages']['python']['files'] == 1
        assert summary['languages']['python']['lines'] == 10
        assert summary['languages']['python']['size'] == 100
        assert summary['languages']['python']['functions'] == 1
        assert summary['languages']['python']['classes'] == 1
        assert summary['total_lines'] == 10
        assert summary['total_size'] == 100
        assert summary['function_count'] == 1
        assert summary['class_count'] == 1

if __name__ == '__main__':
    pytest.main([__file__])