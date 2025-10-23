"""
Interactive Context Collector using Questionary for user-friendly context gathering.

This module provides an interactive interface for collecting various types of context
including code analysis, git repository insights, and documentation scanning.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from dataclasses import dataclass

try:
    import questionary
    from questionary import Style
    QUESTIONARY_AVAILABLE = True
except ImportError:
    QUESTIONARY_AVAILABLE = False
    logging.warning("Questionary not available. Install with: pip install questionary")

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich.table import Table
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    logging.warning("Rich not available. Install with: pip install rich")

try:
    import colorama
    colorama.init()  # Initialize colorama for Windows
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False

from .code_scanner import CodeScanner
from .git_analyzer import GitAnalyzer

logger = logging.getLogger(__name__)

@dataclass
class ContextCollectionConfig:
    """Configuration for context collection."""
    include_code: bool = True
    include_git: bool = True
    include_docs: bool = True
    max_files: int = 1000
    max_commits: int = 500
    days_back: int = 365
    recursive_scan: bool = True
    output_format: str = "detailed"  # detailed, summary, json

class InteractiveContextCollector:
    """
    Interactive context collector using Questionary for user input.
    
    Provides a user-friendly interface for gathering different types of context:
    - Code analysis and scanning
    - Git repository insights
    - Documentation analysis
    """
    
    # Custom style for questionary prompts
    CUSTOM_STYLE = Style([
        ('question', 'bold'),
        ('answer', 'fg:#ff9d00 bold'),
        ('pointer', 'fg:#ff9d00 bold'),
        ('highlighted', 'fg:#ff9d00 bold'),
        ('selected', 'fg:#cc5454'),
        ('separator', 'fg:#cc5454'),
        ('instruction', ''),
        ('text', ''),
        ('disabled', 'fg:#858585 italic')
    ])
    
    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize the interactive context collector.
        
        Args:
            base_path: Base directory path for context collection
        """
        if not QUESTIONARY_AVAILABLE:
            raise ImportError("Questionary is required. Install with: pip install questionary")
        
        self.base_path = Path(base_path) if base_path else Path.cwd()
        self.console = Console() if RICH_AVAILABLE else None
        self.config = ContextCollectionConfig()
        
        # Initialize collectors
        self.code_scanner = None
        self.git_analyzer = None
        
        logger.info(f"Initialized InteractiveContextCollector for: {self.base_path}")
    
    def collect_context(self) -> Dict[str, Any]:
        """
        Main method to interactively collect context.
        
        Returns:
            Dictionary containing collected context data
        """
        try:
            self._display_welcome()
            
            # Configure collection settings
            self._configure_collection()
            
            # Collect selected context types
            context_data = {
                'collection_time': datetime.now().isoformat(),
                'base_path': str(self.base_path),
                'config': self._serialize_config(),
                'results': {}
            }
            
            if self.config.include_code:
                context_data['results']['code_analysis'] = self._collect_code_context()
            
            if self.config.include_git:
                context_data['results']['git_analysis'] = self._collect_git_context()
            
            if self.config.include_docs:
                context_data['results']['documentation'] = self._collect_docs_context()
            
            self._display_summary(context_data)
            
            return context_data
            
        except KeyboardInterrupt:
            self._display_message("\\n[CANCEL] Collection cancelled by user.", style="error")
            return {}
        except Exception as e:
            self._display_message(f"\\n[FAIL] Error during collection: {e}", style="error")
            logger.error(f"Error in collect_context: {e}")
            return {}
    
    def _display_welcome(self) -> None:
        """Display welcome message and introduction."""
        if self.console:
            welcome_text = Text("Interactive Context Collector", style="bold blue")
            panel = Panel(
                welcome_text,
                title="🔍 Prompt Engineering Tool",
                border_style="blue"
            )
            self.console.print(panel)
        else:
            print("\\n" + "="*60)
            print("🔍 Interactive Context Collector")
            print("   Prompt Engineering Tool")
            print("="*60)
        
        self._display_message(f"Working directory: {self.base_path}")
        self._display_message("This tool will help you gather context for prompt engineering.\\n")
    
    def _configure_collection(self) -> None:
        """Configure what types of context to collect."""
        # Main context type selection
        context_types = questionary.checkbox(
            "What types of context would you like to collect?",
            choices=[
                questionary.Choice("📄 Code Analysis", value="code", checked=True),
                questionary.Choice("🔄 Git Repository Analysis", value="git", checked=True),
                questionary.Choice("📚 Documentation Analysis", value="docs", checked=False)
            ],
            style=self.CUSTOM_STYLE
        ).ask()
        
        if not context_types:
            self._display_message("No context types selected. Exiting.", style="warning")
            sys.exit(0)
        
        self.config.include_code = "code" in context_types
        self.config.include_git = "git" in context_types
        self.config.include_docs = "docs" in context_types
        
        # Advanced configuration
        advanced_config = questionary.confirm(
            "Would you like to configure advanced settings?",
            default=False,
            style=self.CUSTOM_STYLE
        ).ask()
        
        if advanced_config:
            self._configure_advanced_settings()
    
    def _configure_advanced_settings(self) -> None:
        """Configure advanced collection settings."""
        # Maximum files to scan
        max_files_input = questionary.text(
            "Maximum number of files to scan:",
            default=str(self.config.max_files),
            validate=lambda x: x.isdigit() and int(x) > 0,
            style=self.CUSTOM_STYLE
        ).ask()
        self.config.max_files = int(max_files_input)
        
        # Git analysis settings
        if self.config.include_git:
            max_commits_input = questionary.text(
                "Maximum number of git commits to analyze:",
                default=str(self.config.max_commits),
                validate=lambda x: x.isdigit() and int(x) > 0,
                style=self.CUSTOM_STYLE
            ).ask()
            self.config.max_commits = int(max_commits_input)
            
            days_back_input = questionary.text(
                "Number of days back to analyze:",
                default=str(self.config.days_back),
                validate=lambda x: x.isdigit() and int(x) > 0,
                style=self.CUSTOM_STYLE
            ).ask()
            self.config.days_back = int(days_back_input)
        
        # Output format
        output_format = questionary.select(
            "Select output format:",
            choices=[
                questionary.Choice("📄 Detailed (includes all analysis)", value="detailed"),
                questionary.Choice("📋 Summary (key insights only)", value="summary"),
                questionary.Choice("📁 JSON (machine readable)", value="json")
            ],
            default="detailed",
            style=self.CUSTOM_STYLE
        ).ask()
        self.config.output_format = output_format
        
        # Recursive scanning
        self.config.recursive_scan = questionary.confirm(
            "Scan subdirectories recursively?",
            default=self.config.recursive_scan,
            style=self.CUSTOM_STYLE
        ).ask()
    
    def _collect_code_context(self) -> Dict[str, Any]:
        """Collect code analysis context."""
        self._display_message("\\n[INFO] Starting code analysis...")
        
        try:
            # Initialize code scanner if not already done
            if not self.code_scanner:
                self.code_scanner = CodeScanner()
            
            # Let user select specific directories or use base path
            scan_path = self._select_scan_directory("code analysis")
            
            # Scan directory
            scan_results = self.code_scanner.scan_directory(
                directory=str(scan_path),
                recursive=self.config.recursive_scan,
                max_files=self.config.max_files
            )
            
            # Display results summary
            if scan_results['files']:
                self._display_code_summary(scan_results)
            else:
                self._display_message("No code files found in the specified directory.", style="warning")
            
            return scan_results
            
        except Exception as e:
            error_msg = f"Error during code analysis: {e}"
            self._display_message(error_msg, style="error")
            logger.error(error_msg)
            return {'error': str(e)}
    
    def _collect_git_context(self) -> Dict[str, Any]:
        """Collect git repository analysis context."""
        self._display_message("\\n[INFO] Starting git analysis...")
        
        try:
            # Find git repository
            git_path = self._find_git_repository()
            if not git_path:
                self._display_message("No git repository found.", style="warning")
                return {'error': 'No git repository found'}
            
            # Initialize git analyzer
            self.git_analyzer = GitAnalyzer(str(git_path))
            
            # Analyze repository
            analysis_results = self.git_analyzer.analyze_repository(
                max_commits=self.config.max_commits,
                days_back=self.config.days_back,
                include_merge_commits=False
            )
            
            # Display results summary
            self._display_git_summary(analysis_results)
            
            return analysis_results
            
        except Exception as e:
            error_msg = f"Error during git analysis: {e}"
            self._display_message(error_msg, style="error")
            logger.error(error_msg)
            return {'error': str(e)}
    
    def _collect_docs_context(self) -> Dict[str, Any]:
        """Collect documentation analysis context."""
        self._display_message("\\n[INFO] Starting documentation analysis...")
        
        try:
            # Find documentation files
            doc_extensions = ['.md', '.rst', '.txt', '.adoc', '.wiki']
            doc_files = []
            
            scan_path = self._select_scan_directory("documentation analysis")
            
            for ext in doc_extensions:
                if self.config.recursive_scan:
                    doc_files.extend(scan_path.rglob(f'*{ext}'))
                else:
                    doc_files.extend(scan_path.glob(f'*{ext}'))
            
            if not doc_files:
                self._display_message("No documentation files found.", style="warning")
                return {'files': [], 'summary': {'total_files': 0}}
            
            # Analyze documentation files
            docs_analysis = {
                'scan_path': str(scan_path),
                'files': [],
                'summary': {
                    'total_files': len(doc_files),
                    'file_types': {},
                    'total_size': 0
                }
            }
            
            for doc_file in doc_files[:self.config.max_files]:
                try:
                    with open(doc_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    file_info = {
                        'path': str(doc_file),
                        'size': len(content),
                        'lines': len(content.split('\\n')),
                        'extension': doc_file.suffix.lower(),
                        'last_modified': datetime.fromtimestamp(doc_file.stat().st_mtime).isoformat()
                    }
                    
                    docs_analysis['files'].append(file_info)
                    docs_analysis['summary']['total_size'] += file_info['size']
                    
                    ext = file_info['extension']
                    docs_analysis['summary']['file_types'][ext] = docs_analysis['summary']['file_types'].get(ext, 0) + 1
                    
                except Exception as e:
                    logger.warning(f"Error reading {doc_file}: {e}")
            
            self._display_docs_summary(docs_analysis)
            
            return docs_analysis
            
        except Exception as e:
            error_msg = f"Error during documentation analysis: {e}"
            self._display_message(error_msg, style="error")
            logger.error(error_msg)
            return {'error': str(e)}
    
    def _select_scan_directory(self, purpose: str) -> Path:
        """Allow user to select a directory for scanning."""
        use_current = questionary.confirm(
            f"Use current directory ({self.base_path}) for {purpose}?",
            default=True,
            style=self.CUSTOM_STYLE
        ).ask()
        
        if use_current:
            return self.base_path
        
        # Get custom path
        custom_path = questionary.path(
            f"Enter path for {purpose}:",
            default=str(self.base_path),
            validate=lambda x: Path(x).exists(),
            style=self.CUSTOM_STYLE
        ).ask()
        
        return Path(custom_path)
    
    def _find_git_repository(self) -> Optional[Path]:
        """Find git repository in the current path or parent directories."""
        current_path = self.base_path
        
        while current_path != current_path.parent:
            git_dir = current_path / '.git'
            if git_dir.exists():
                return current_path
            current_path = current_path.parent
        
        return None
    
    def _display_code_summary(self, scan_results: Dict[str, Any]) -> None:
        """Display code analysis summary."""
        summary = scan_results['summary']
        
        if self.console:
            table = Table(title="Code Analysis Summary")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")
            
            table.add_row("Total Files", str(summary['total_files']))
            table.add_row("Total Lines", f"{summary['total_lines']:,}")
            table.add_row("Total Functions", str(summary['function_count']))
            table.add_row("Total Classes", str(summary['class_count']))
            table.add_row("Size (MB)", f"{summary['total_size'] / (1024*1024):.2f}")
            
            self.console.print(table)
            
            # Language breakdown
            if summary['languages']:
                lang_table = Table(title="Languages Found")
                lang_table.add_column("Language", style="cyan")
                lang_table.add_column("Files", style="green")
                lang_table.add_column("Lines", style="green")
                
                for lang, stats in summary['languages'].items():
                    lang_table.add_row(lang, str(stats['files']), f"{stats['lines']:,}")
                
                self.console.print(lang_table)
        else:
            print(f"\\n📊 Code Analysis Summary:")
            print(f"   Total Files: {summary['total_files']}")
            print(f"   Total Lines: {summary['total_lines']:,}")
            print(f"   Total Functions: {summary['function_count']}")
            print(f"   Total Classes: {summary['class_count']}")
            print(f"   Size: {summary['total_size'] / (1024*1024):.2f} MB")
    
    def _display_git_summary(self, analysis_results: Dict[str, Any]) -> None:
        """Display git analysis summary."""
        summary = analysis_results['contributors']['summary']
        
        if self.console:
            table = Table(title="Git Analysis Summary")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")
            
            table.add_row("Total Commits", str(summary['total_commits']))
            table.add_row("Contributors", str(summary['total_contributors']))
            table.add_row("Active Contributors", str(summary['active_contributors']))
            table.add_row("Lines Changed", f"{summary['total_lines_changed']:,}")
            
            self.console.print(table)
        else:
            print(f"\\n📊 Git Analysis Summary:")
            print(f"   Total Commits: {summary['total_commits']}")
            print(f"   Contributors: {summary['total_contributors']}")
            print(f"   Active Contributors: {summary['active_contributors']}")
            print(f"   Lines Changed: {summary['total_lines_changed']:,}")
    
    def _display_docs_summary(self, docs_analysis: Dict[str, Any]) -> None:
        """Display documentation analysis summary."""
        summary = docs_analysis['summary']
        
        if self.console:
            table = Table(title="Documentation Analysis Summary")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")
            
            table.add_row("Total Files", str(summary['total_files']))
            table.add_row("Total Size (KB)", f"{summary['total_size'] / 1024:.1f}")
            
            # File types
            for file_type, count in summary['file_types'].items():
                table.add_row(f"Files ({file_type})", str(count))
            
            self.console.print(table)
        else:
            print(f"\\n📊 Documentation Analysis Summary:")
            print(f"   Total Files: {summary['total_files']}")
            print(f"   Total Size: {summary['total_size'] / 1024:.1f} KB")
    
    def _display_summary(self, context_data: Dict[str, Any]) -> None:
        """Display final collection summary."""
        self._display_message("\\n[SUCCESS] Context collection completed!")
        
        if self.console:
            summary_panel = Panel(
                f"Collection completed for: {context_data['base_path']}\\n"
                f"Results include: {', '.join(context_data['results'].keys())}",
                title="🎉 Collection Complete",
                border_style="green"
            )
            self.console.print(summary_panel)
        else:
            print("\\n" + "="*60)
            print("🎉 Collection Complete")
            print(f"Collection completed for: {context_data['base_path']}")
            print(f"Results include: {', '.join(context_data['results'].keys())}")
            print("="*60)
    
    def _display_message(self, message: str, style: str = "info") -> None:
        """Display a styled message."""
        if self.console:
            if style == "error":
                self.console.print(message, style="red")
            elif style == "warning":
                self.console.print(message, style="yellow")
            elif style == "success":
                self.console.print(message, style="green")
            else:
                self.console.print(message)
        else:
            print(message)
    
    def _serialize_config(self) -> Dict[str, Any]:
        """Serialize configuration for output."""
        return {
            'include_code': self.config.include_code,
            'include_git': self.config.include_git,
            'include_docs': self.config.include_docs,
            'max_files': self.config.max_files,
            'max_commits': self.config.max_commits,
            'days_back': self.config.days_back,
            'recursive_scan': self.config.recursive_scan,
            'output_format': self.config.output_format
        }
    
    def _make_json_serializable(self, data: Any) -> Any:
        """Convert data to JSON-serializable format."""
        if hasattr(data, '__dict__'):
            # Convert dataclass or object to dict
            result = {}
            for key, value in data.__dict__.items():
                if key.startswith('_'):
                    continue  # Skip private attributes
                try:
                    result[key] = self._make_json_serializable(value)
                except (TypeError, ValueError):
                    result[key] = str(value)  # Fallback to string representation
            return result
        elif isinstance(data, dict):
            return {key: self._make_json_serializable(value) for key, value in data.items()}
        elif isinstance(data, (list, tuple)):
            return [self._make_json_serializable(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        elif isinstance(data, Path):
            return str(data)
        else:
            return data

    def save_results(self, context_data: Dict[str, Any], output_path: Optional[str] = None) -> str:
        """
        Save collection results to file.
        
        Args:
            context_data: Context data to save
            output_path: Optional output file path
            
        Returns:
            Path to saved file
        """
        import json
        
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"context_collection_{timestamp}.json"
        
        output_file = Path(output_path)
        
        try:
            # Convert to JSON-serializable format
            serializable_data = self._make_json_serializable(context_data)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(serializable_data, f, indent=2, ensure_ascii=False)
            
            self._display_message(f"[OK] Results saved to: {output_file}", style="success")
            return str(output_file)
            
        except Exception as e:
            error_msg = f"Error saving results: {e}"
            self._display_message(error_msg, style="error")
            logger.error(error_msg)
            raise

# Main function for CLI usage
def main():
    """Main function for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Interactive Context Collector")
    parser.add_argument("--path", "-p", default=".", help="Base path for context collection")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=level, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    try:
        collector = InteractiveContextCollector(args.path)
        context_data = collector.collect_context()
        
        if context_data:
            output_file = collector.save_results(context_data, args.output)
            print(f"\\nContext collection completed successfully!")
            print(f"Results saved to: {output_file}")
        else:
            print("Context collection was cancelled or failed.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()