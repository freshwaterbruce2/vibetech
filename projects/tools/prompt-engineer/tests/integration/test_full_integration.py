"""
Integration tests for the complete Interactive Context Collector system.
"""

import pytest
import tempfile
import json
from pathlib import Path
from unittest.mock import patch, Mock

from src.collectors import (
    InteractiveContextCollector, 
    CodeScanner, 
    GitAnalyzer, 
    INTERACTIVE_AVAILABLE
)

class TestFullIntegration:
    """Test complete system integration."""
    
    @pytest.fixture
    def temp_project(self):
        """Create a temporary project with code files for testing."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            project_dir = Path(tmp_dir)
            
            # Create a Python file
            (project_dir / 'main.py').write_text('''
"""Main module for the project."""
import os
import sys

class ProjectManager:
    """Manages project operations."""
    
    def __init__(self, name):
        self.name = name
    
    def run(self):
        """Run the project."""
        print(f"Running {self.name}")

def main():
    """Main function."""
    manager = ProjectManager("Test Project")
    manager.run()

if __name__ == "__main__":
    main()
''')
            
            # Create a JavaScript file
            (project_dir / 'utils.js').write_text('''
// Utility functions
const helper = require('./helper');

class Utils {
    constructor() {
        this.version = '1.0.0';
    }
    
    formatDate(date) {
        return date.toISOString();
    }
}

function processData(data) {
    return data.map(item => item.value);
}

module.exports = { Utils, processData };
''')
            
            # Create documentation
            (project_dir / 'README.md').write_text('''
# Test Project

This is a test project for integration testing.

## Features

- Code analysis
- Git integration
- Documentation parsing

## Usage

Run the main script to start the application.
''')
            
            yield project_dir
    
    @pytest.mark.skipif(not INTERACTIVE_AVAILABLE, reason="Interactive collector not available")
    def test_code_scanner_integration(self, temp_project):
        """Test CodeScanner integration with real files."""
        scanner = CodeScanner()
        
        result = scanner.scan_directory(str(temp_project))
        
        # Verify basic structure
        assert 'files' in result
        assert 'summary' in result
        assert len(result['files']) >= 2  # Should find .py and .js files
        
        # Check for expected languages
        languages = result['summary']['languages']
        assert 'python' in languages
        assert 'javascript' in languages
        
        # Verify Python file analysis
        python_files = [f for f in result['files'] if f['language'] == 'python']
        assert len(python_files) >= 1
        
        python_file = python_files[0]
        assert len(python_file['classes']) >= 1
        assert len(python_file['functions']) >= 1
        assert 'ProjectManager' in [cls['name'] for cls in python_file['classes']]
    
    @pytest.mark.skipif(not INTERACTIVE_AVAILABLE, reason="Interactive collector not available")
    def test_interactive_collector_programmatic(self, temp_project):
        """Test InteractiveContextCollector in programmatic mode."""
        collector = InteractiveContextCollector(str(temp_project))
        
        # Configure for non-interactive use
        collector.config.include_code = True
        collector.config.include_git = False  # No git repo in temp dir
        collector.config.include_docs = True
        collector.config.max_files = 100
        
        # Mock the interactive methods
        collector._display_welcome = Mock()
        collector._display_summary = Mock()
        collector._display_message = Mock()
        collector._display_code_summary = Mock()
        collector._display_docs_summary = Mock()
        
        # Mock directory selection to use current dir
        with patch.object(collector, '_select_scan_directory', return_value=temp_project):
            # Collect only code and docs (skip git)
            code_result = collector._collect_code_context()
            docs_result = collector._collect_docs_context()
        
        # Verify code collection
        assert code_result is not None
        assert 'files' in code_result
        assert len(code_result['files']) >= 2
        
        # Verify docs collection
        assert docs_result is not None
        assert 'files' in docs_result
        assert len(docs_result['files']) >= 1  # Should find README.md
        
        readme_files = [f for f in docs_result['files'] if 'README' in f['path']]
        assert len(readme_files) >= 1
    
    def test_save_and_load_results(self, temp_project):
        """Test saving and loading context results."""
        if not INTERACTIVE_AVAILABLE:
            pytest.skip("Interactive collector not available")
        
        collector = InteractiveContextCollector(str(temp_project))
        
        # Create mock context data
        context_data = {
            'collection_time': '2023-01-01T12:00:00',
            'base_path': str(temp_project),
            'config': collector._serialize_config(),
            'results': {
                'code_analysis': {
                    'summary': {
                        'total_files': 2,
                        'total_lines': 100,
                        'languages': {'python': {'files': 1}, 'javascript': {'files': 1}}
                    }
                }
            }
        }
        
        # Save results
        output_file = temp_project / 'test_results.json'
        collector._display_message = Mock()  # Mock display method
        
        saved_path = collector.save_results(context_data, str(output_file))
        
        # Verify file was created
        assert Path(saved_path).exists()
        assert saved_path == str(output_file)
        
        # Load and verify content
        with open(output_file, 'r', encoding='utf-8') as f:
            loaded_data = json.load(f)
        
        assert loaded_data['base_path'] == str(temp_project)
        assert loaded_data['results']['code_analysis']['summary']['total_files'] == 2
    
    def test_error_handling(self, temp_project):
        """Test error handling in various scenarios."""
        if not INTERACTIVE_AVAILABLE:
            pytest.skip("Interactive collector not available")
        
        collector = InteractiveContextCollector(str(temp_project))
        collector._display_message = Mock()
        
        # Test with non-existent directory
        with patch.object(collector, '_select_scan_directory', return_value=Path('/nonexistent')):
            result = collector._collect_code_context()
            # Should handle gracefully and return error
            assert 'error' in result
        
        # Test git analysis with no repository
        result = collector._collect_git_context()
        assert 'error' in result
        assert result['error'] == 'No git repository found'
    
    def test_configuration_serialization(self, temp_project):
        """Test configuration serialization and deserialization."""
        if not INTERACTIVE_AVAILABLE:
            pytest.skip("Interactive collector not available")
        
        collector = InteractiveContextCollector(str(temp_project))
        
        # Modify configuration
        collector.config.include_code = False
        collector.config.max_files = 123
        collector.config.days_back = 30
        collector.config.output_format = "json"
        
        # Serialize
        serialized = collector._serialize_config()
        
        # Verify all fields are present and correct
        assert serialized['include_code'] is False
        assert serialized['max_files'] == 123
        assert serialized['days_back'] == 30
        assert serialized['output_format'] == "json"
        assert 'include_git' in serialized
        assert 'include_docs' in serialized
        assert 'recursive_scan' in serialized
    
    @pytest.mark.skipif(not INTERACTIVE_AVAILABLE, reason="Interactive collector not available")
    def test_display_methods_integration(self, temp_project):
        """Test display methods work correctly."""
        collector = InteractiveContextCollector(str(temp_project))
        
        # Test different message types
        collector._display_message("Test info message")
        collector._display_message("Test warning", "warning")
        collector._display_message("Test error", "error")
        collector._display_message("Test success", "success")
        
        # Test summary displays with mock data
        code_summary = {
            'summary': {
                'total_files': 5,
                'total_lines': 500,
                'function_count': 20,
                'class_count': 8,
                'total_size': 10000,
                'languages': {
                    'python': {'files': 3, 'lines': 300},
                    'javascript': {'files': 2, 'lines': 200}
                }
            }
        }
        
        git_summary = {
            'contributors': {
                'summary': {
                    'total_commits': 100,
                    'total_contributors': 3,
                    'active_contributors': 2,
                    'total_lines_changed': 5000
                }
            }
        }
        
        docs_summary = {
            'summary': {
                'total_files': 3,
                'total_size': 2000,
                'file_types': {'.md': 2, '.txt': 1}
            }
        }
        
        # These should not raise exceptions
        collector._display_code_summary(code_summary)
        collector._display_git_summary(git_summary)
        collector._display_docs_summary(docs_summary)

if __name__ == '__main__':
    pytest.main([__file__])