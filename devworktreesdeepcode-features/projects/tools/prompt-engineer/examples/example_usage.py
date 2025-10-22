"""
Example usage script for the Interactive Context Collector.

This script demonstrates how to use the InteractiveContextCollector
to gather context for prompt engineering tasks.
"""

import sys
import json
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from collectors.interactive_collector import InteractiveContextCollector

def main():
    """Main example function."""
    print("🔍 Interactive Context Collector - Example Usage")
    print("=" * 60)
    
    # Example 1: Basic usage with current directory
    print("\\n📁 Example 1: Basic usage with current directory")
    try:
        collector = InteractiveContextCollector()
        print(f"Initialized collector for: {collector.base_path}")
        
        # You can manually configure the collector instead of using interactive mode
        collector.config.include_code = True
        collector.config.include_git = True
        collector.config.include_docs = False
        collector.config.max_files = 100
        
        print("Configuration:")
        print(f"  - Include code analysis: {collector.config.include_code}")
        print(f"  - Include git analysis: {collector.config.include_git}")
        print(f"  - Include docs analysis: {collector.config.include_docs}")
        print(f"  - Max files: {collector.config.max_files}")
        
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("Make sure to install required dependencies:")
        print("pip install -r requirements.txt")
        return
    
    # Example 2: Programmatic context collection (non-interactive)
    print("\\n🤖 Example 2: Programmatic context collection")
    
    # Create a simple mock for demonstration
    class MockCollector:
        def __init__(self, base_path="."):
            self.base_path = Path(base_path)
            print(f"Mock collector initialized for: {self.base_path}")
        
        def collect_programmatically(self):
            """Demonstrate programmatic collection without user interaction."""
            context_data = {
                'collection_time': '2023-01-01T12:00:00',
                'base_path': str(self.base_path),
                'config': {
                    'include_code': True,
                    'include_git': True,
                    'include_docs': True,
                    'max_files': 1000,
                    'max_commits': 500
                },
                'results': {
                    'code_analysis': {
                        'summary': {
                            'total_files': 25,
                            'total_lines': 1500,
                            'function_count': 45,
                            'class_count': 12,
                            'languages': {
                                'python': {'files': 20, 'lines': 1200},
                                'javascript': {'files': 5, 'lines': 300}
                            }
                        }
                    },
                    'git_analysis': {
                        'contributors': {
                            'summary': {
                                'total_commits': 150,
                                'total_contributors': 3,
                                'active_contributors': 2
                            }
                        },
                        'hot_spots': [
                            {
                                'path': 'src/main.py',
                                'change_count': 15,
                                'complexity_score': 8.5
                            }
                        ]
                    }
                }
            }
            return context_data
    
    mock_collector = MockCollector()
    mock_data = mock_collector.collect_programmatically()
    
    print("Sample collected context structure:")
    print(json.dumps(mock_data, indent=2)[:500] + "...")
    
    # Example 3: PowerShell integration commands
    print("\\n💻 Example 3: PowerShell integration commands")
    print("Here are the PowerShell commands to use this tool:")
    print()
    print("# Install dependencies")
    print("pip install -r requirements.txt")
    print()
    print("# Run interactive collector")
    print("python -m src.collectors.interactive_collector")
    print()
    print("# Run with specific path")
    print("python -m src.collectors.interactive_collector --path C:\\\\dev\\\\my-project")
    print()
    print("# Run with output file specification")
    print("python -m src.collectors.interactive_collector --output context_data.json")
    print()
    print("# Run with verbose logging")
    print("python -m src.collectors.interactive_collector --verbose")
    
    # Example 4: Integration with existing codebase
    print("\\n🔗 Example 4: Integration with existing codebase")
    print("To integrate this collector into your existing workflow:")
    print()
    print("1. Import the collector in your Python script:")
    print("   from collectors.interactive_collector import InteractiveContextCollector")
    print()
    print("2. Create and configure the collector:")
    print("   collector = InteractiveContextCollector('/path/to/project')")
    print("   collector.config.max_files = 500")
    print()
    print("3. Collect context:")
    print("   context_data = collector.collect_context()")
    print()
    print("4. Save results:")
    print("   output_file = collector.save_results(context_data)")
    print()
    print("5. Use the context data for prompt engineering:")
    print("   # Process context_data for LLM prompts")
    print("   # Extract relevant code snippets, git insights, etc.")
    
    # Example 5: Advanced configuration
    print("\\n⚙️ Example 5: Advanced configuration options")
    advanced_config = {
        'code_analysis': {
            'max_files': 1000,
            'recursive_scan': True,
            'ignore_patterns': {'*.pyc', '__pycache__', 'node_modules'},
            'languages': ['python', 'javascript', 'typescript', 'java']
        },
        'git_analysis': {
            'max_commits': 500,
            'days_back': 365,
            'include_merge_commits': False,
            'analyze_hot_spots': True,
            'analyze_contributors': True
        },
        'documentation': {
            'file_extensions': ['.md', '.rst', '.txt', '.adoc'],
            'max_file_size': '1MB',
            'extract_headings': True
        },
        'output': {
            'format': 'detailed',  # 'detailed', 'summary', 'json'
            'include_file_contents': False,
            'max_content_length': 10000
        }
    }
    
    print("Advanced configuration example:")
    print(json.dumps(advanced_config, indent=2))
    
    print("\\n✅ Example usage demonstration completed!")
    print("\\nNext steps:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Run the interactive collector: python -m src.collectors.interactive_collector")
    print("3. Explore the generated context data for your prompt engineering needs")

if __name__ == "__main__":
    main()