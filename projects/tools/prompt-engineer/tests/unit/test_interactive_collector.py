"""
Unit tests for InteractiveContextCollector following TDD principles.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from src.collectors.interactive_collector import (
    InteractiveContextCollector, 
    ContextCollectionConfig
)

class TestContextCollectionConfig:
    """Test ContextCollectionConfig dataclass."""
    
    def test_default_config(self):
        """Test default configuration values."""
        config = ContextCollectionConfig()
        
        assert config.include_code is True
        assert config.include_git is True
        assert config.include_docs is True
        assert config.max_files == 1000
        assert config.max_commits == 500
        assert config.days_back == 365
        assert config.recursive_scan is True
        assert config.output_format == "detailed"
    
    def test_custom_config(self):
        """Test custom configuration values."""
        config = ContextCollectionConfig(
            include_code=False,
            max_files=500,
            output_format="json"
        )
        
        assert config.include_code is False
        assert config.max_files == 500
        assert config.output_format == "json"
        # Defaults should still apply
        assert config.include_git is True
        assert config.recursive_scan is True

class TestInteractiveContextCollector:
    """Test InteractiveContextCollector class."""
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            yield Path(tmp_dir)
    
    @pytest.fixture
    def mock_questionary(self):
        """Mock questionary for testing without user input."""
        with patch('src.collectors.interactive_collector.questionary') as mock_q:
            yield mock_q
    
    @pytest.fixture
    def collector(self, temp_dir):
        """Create a collector instance for testing."""
        with patch('src.collectors.interactive_collector.QUESTIONARY_AVAILABLE', True):
            return InteractiveContextCollector(str(temp_dir))
    
    def test_init_without_questionary(self, temp_dir):
        """Test initialization fails without questionary."""
        with patch('src.collectors.interactive_collector.QUESTIONARY_AVAILABLE', False):
            with pytest.raises(ImportError, match="Questionary is required"):
                InteractiveContextCollector(str(temp_dir))
    
    def test_init_with_default_path(self):
        """Test initialization with default path."""
        with patch('src.collectors.interactive_collector.QUESTIONARY_AVAILABLE', True):
            with patch('pathlib.Path.cwd', return_value=Path('/test')):
                collector = InteractiveContextCollector()
                assert collector.base_path == Path('/test')
    
    def test_init_with_custom_path(self, temp_dir):
        """Test initialization with custom path."""
        with patch('src.collectors.interactive_collector.QUESTIONARY_AVAILABLE', True):
            collector = InteractiveContextCollector(str(temp_dir))
            assert collector.base_path == temp_dir
            assert isinstance(collector.config, ContextCollectionConfig)
    
    def test_serialize_config(self, collector):
        """Test configuration serialization."""
        collector.config.include_code = False
        collector.config.max_files = 123
        
        serialized = collector._serialize_config()
        
        assert serialized['include_code'] is False
        assert serialized['max_files'] == 123
        assert 'include_git' in serialized
        assert 'output_format' in serialized
    
    @patch('src.collectors.interactive_collector.datetime')
    def test_collect_context_structure(self, mock_datetime, collector, mock_questionary):
        """Test the basic structure of collected context."""
        # Mock datetime
        mock_now = datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.now.return_value = mock_now
        
        # Mock questionary responses
        mock_questionary.checkbox.return_value.ask.return_value = []
        mock_questionary.confirm.return_value.ask.return_value = False
        
        # Mock display methods to avoid output during tests
        collector._display_welcome = Mock()
        collector._display_summary = Mock()
        
        context_data = collector.collect_context()
        
        # Check basic structure
        assert 'collection_time' in context_data
        assert 'base_path' in context_data
        assert 'config' in context_data
        assert 'results' in context_data
        assert context_data['base_path'] == str(collector.base_path)
    
    def test_collect_context_keyboard_interrupt(self, collector, mock_questionary):
        """Test handling of keyboard interrupt during collection."""
        mock_questionary.checkbox.side_effect = KeyboardInterrupt()
        collector._display_welcome = Mock()
        collector._display_message = Mock()
        
        result = collector.collect_context()
        
        assert result == {}
        collector._display_message.assert_called_with("\\n❌ Collection cancelled by user.", style="error")
    
    def test_find_git_repository_found(self, temp_dir, collector):
        """Test finding git repository when .git exists."""
        git_dir = temp_dir / '.git'
        git_dir.mkdir()
        
        result = collector._find_git_repository()
        
        assert result == temp_dir
    
    def test_find_git_repository_not_found(self, collector):
        """Test behavior when no git repository is found."""
        result = collector._find_git_repository()
        
        assert result is None
    
    def test_find_git_repository_in_parent(self, temp_dir, collector):
        """Test finding git repository in parent directory."""
        # Create nested directory structure
        nested_dir = temp_dir / 'subdir' / 'nested'
        nested_dir.mkdir(parents=True)
        
        # Create .git in parent
        git_dir = temp_dir / '.git'
        git_dir.mkdir()
        
        # Update collector base path to nested directory
        collector.base_path = nested_dir
        
        result = collector._find_git_repository()
        
        assert result == temp_dir
    
    def test_select_scan_directory_current(self, collector, mock_questionary):
        """Test selecting current directory for scanning."""
        mock_questionary.confirm.return_value.ask.return_value = True
        
        result = collector._select_scan_directory("test purpose")
        
        assert result == collector.base_path
        mock_questionary.confirm.assert_called_once()
    
    def test_select_scan_directory_custom(self, temp_dir, collector, mock_questionary):
        """Test selecting custom directory for scanning."""
        custom_dir = temp_dir / 'custom'
        custom_dir.mkdir()
        
        mock_questionary.confirm.return_value.ask.return_value = False
        mock_questionary.path.return_value.ask.return_value = str(custom_dir)
        
        result = collector._select_scan_directory("test purpose")
        
        assert result == custom_dir
    
    @patch('src.collectors.interactive_collector.CodeScanner')
    def test_collect_code_context_success(self, mock_scanner_class, collector, mock_questionary):
        """Test successful code context collection."""
        # Mock scanner instance
        mock_scanner = Mock()
        mock_scanner_class.return_value = mock_scanner
        
        # Mock scan results
        scan_results = {
            'files': [{'path': 'test.py', 'language': 'python'}],
            'summary': {'total_files': 1, 'total_lines': 100}
        }
        mock_scanner.scan_directory.return_value = scan_results
        
        # Mock questionary for directory selection
        mock_questionary.confirm.return_value.ask.return_value = True
        
        # Mock display methods
        collector._display_message = Mock()
        collector._display_code_summary = Mock()
        
        result = collector._collect_code_context()
        
        assert result == scan_results
        mock_scanner.scan_directory.assert_called_once()
        collector._display_code_summary.assert_called_once_with(scan_results)
    
    @patch('src.collectors.interactive_collector.CodeScanner')
    def test_collect_code_context_no_files(self, mock_scanner_class, collector, mock_questionary):
        """Test code context collection when no files found."""
        mock_scanner = Mock()
        mock_scanner_class.return_value = mock_scanner
        
        scan_results = {'files': [], 'summary': {'total_files': 0}}
        mock_scanner.scan_directory.return_value = scan_results
        
        mock_questionary.confirm.return_value.ask.return_value = True
        collector._display_message = Mock()
        
        result = collector._collect_code_context()
        
        assert result == scan_results
        collector._display_message.assert_called_with(
            "No code files found in the specified directory.", 
            style="warning"
        )
    
    @patch('src.collectors.interactive_collector.GitAnalyzer')
    def test_collect_git_context_success(self, mock_analyzer_class, collector):
        """Test successful git context collection."""
        # Mock git repository exists
        collector._find_git_repository = Mock(return_value=collector.base_path)
        
        # Mock analyzer instance
        mock_analyzer = Mock()
        mock_analyzer_class.return_value = mock_analyzer
        
        analysis_results = {
            'contributors': {'summary': {'total_commits': 10}},
            'hot_spots': []
        }
        mock_analyzer.analyze_repository.return_value = analysis_results
        
        collector._display_message = Mock()
        collector._display_git_summary = Mock()
        
        result = collector._collect_git_context()
        
        assert result == analysis_results
        mock_analyzer.analyze_repository.assert_called_once()
    
    def test_collect_git_context_no_repo(self, collector):
        """Test git context collection when no repository found."""
        collector._find_git_repository = Mock(return_value=None)
        collector._display_message = Mock()
        
        result = collector._collect_git_context()
        
        assert result == {'error': 'No git repository found'}
        collector._display_message.assert_called_with(
            "No git repository found.", 
            style="warning"
        )
    
    def test_collect_docs_context_success(self, temp_dir, collector, mock_questionary):
        """Test successful documentation context collection."""
        # Create test documentation files
        (temp_dir / 'README.md').write_text('# Test README\\nThis is a test.')
        (temp_dir / 'docs.txt').write_text('Documentation content.')
        
        mock_questionary.confirm.return_value.ask.return_value = True
        collector._display_message = Mock()
        collector._display_docs_summary = Mock()
        
        result = collector._collect_docs_context()
        
        assert 'files' in result
        assert 'summary' in result
        assert result['summary']['total_files'] == 2
        assert len(result['files']) == 2
    
    def test_collect_docs_context_no_files(self, collector, mock_questionary):
        """Test documentation context collection when no files found."""
        mock_questionary.confirm.return_value.ask.return_value = True
        collector._display_message = Mock()
        
        result = collector._collect_docs_context()
        
        assert result == {'files': [], 'summary': {'total_files': 0}}
        collector._display_message.assert_called_with(
            "No documentation files found.", 
            style="warning"
        )
    
    def test_save_results_success(self, temp_dir, collector):
        """Test successful saving of results."""
        context_data = {
            'test_key': 'test_value',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        output_path = temp_dir / 'test_output.json'
        collector._display_message = Mock()
        
        result_path = collector.save_results(context_data, str(output_path))
        
        assert result_path == str(output_path)
        assert output_path.exists()
        
        # Verify content
        with open(output_path, 'r') as f:
            saved_data = json.load(f)
        assert saved_data == context_data
    
    def test_save_results_auto_filename(self, temp_dir, collector):
        """Test saving results with auto-generated filename."""
        context_data = {'test': 'data'}
        collector._display_message = Mock()
        
        # Change to temp directory for auto-generated file
        import os
        old_cwd = os.getcwd()
        os.chdir(temp_dir)
        
        try:
            with patch('src.collectors.interactive_collector.datetime') as mock_dt:
                mock_dt.now.return_value.strftime.return_value = "20230101_120000"
                result_path = collector.save_results(context_data)
            
            expected_path = temp_dir / "context_collection_20230101_120000.json"
            assert result_path == str(expected_path)
            assert expected_path.exists()
        finally:
            os.chdir(old_cwd)
    
    def test_display_methods_with_rich(self, collector):
        """Test display methods when Rich is available."""
        with patch('src.collectors.interactive_collector.RICH_AVAILABLE', True):
            mock_console = Mock()
            collector.console = mock_console
            
            # Test display_message
            collector._display_message("test message", "error")
            mock_console.print.assert_called_with("test message", style="red")
            
            collector._display_message("test message", "warning")
            mock_console.print.assert_called_with("test message", style="yellow")
            
            collector._display_message("test message", "success")
            mock_console.print.assert_called_with("test message", style="green")
    
    def test_display_methods_without_rich(self, collector):
        """Test display methods when Rich is not available."""
        collector.console = None
        
        with patch('builtins.print') as mock_print:
            collector._display_message("test message")
            mock_print.assert_called_with("test message")

class TestMainFunction:
    """Test main CLI function."""
    
    @patch('src.collectors.interactive_collector.InteractiveContextCollector')
    @patch('argparse.ArgumentParser')
    def test_main_success(self, mock_parser_class, mock_collector_class):
        """Test successful main function execution."""
        # Mock argument parser
        mock_parser = Mock()
        mock_args = Mock()
        mock_args.path = "/test/path"
        mock_args.output = "output.json"
        mock_args.verbose = True
        mock_parser.parse_args.return_value = mock_args
        mock_parser_class.return_value = mock_parser
        
        # Mock collector
        mock_collector = Mock()
        mock_context_data = {'test': 'data'}
        mock_collector.collect_context.return_value = mock_context_data
        mock_collector.save_results.return_value = "output.json"
        mock_collector_class.return_value = mock_collector
        
        # Import and run main function
        from src.collectors.interactive_collector import main
        
        with patch('builtins.print') as mock_print:
            main()
        
        # Verify calls
        mock_collector_class.assert_called_once_with("/test/path")
        mock_collector.collect_context.assert_called_once()
        mock_collector.save_results.assert_called_once_with(mock_context_data, "output.json")
    
    @patch('src.collectors.interactive_collector.InteractiveContextCollector')
    @patch('argparse.ArgumentParser')
    @patch('sys.exit')
    def test_main_no_context(self, mock_exit, mock_parser_class, mock_collector_class):
        """Test main function when no context is collected."""
        # Mock argument parser
        mock_parser = Mock()
        mock_args = Mock()
        mock_args.path = "."
        mock_args.output = None
        mock_args.verbose = False
        mock_parser.parse_args.return_value = mock_args
        mock_parser_class.return_value = mock_parser
        
        # Mock collector returns empty context
        mock_collector = Mock()
        mock_collector.collect_context.return_value = {}
        mock_collector_class.return_value = mock_collector
        
        from src.collectors.interactive_collector import main
        
        with patch('builtins.print'):
            main()
        
        mock_exit.assert_called_with(1)

if __name__ == '__main__':
    pytest.main([__file__])