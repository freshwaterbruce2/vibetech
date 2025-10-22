#!/usr/bin/env python3
"""
Simple example to test the Interactive Context Collector functionality.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from collectors import CodeScanner, GitAnalyzer, INTERACTIVE_AVAILABLE

def main():
    print("=== Interactive Context Collector - Simple Example ===")
    
    # Test 1: Basic code scanning
    print("\n[1] Testing CodeScanner...")
    scanner = CodeScanner()
    
    # Create a simple test file to scan
    test_code = '''
def hello_world():
    """A simple hello world function."""
    return "Hello, World!"

class SimpleClass:
    """A simple test class."""
    def __init__(self, name):
        self.name = name
    
    def greet(self):
        return f"Hello, {self.name}!"
'''
    
    # Write test file
    test_file = Path("temp_test.py")
    test_file.write_text(test_code)
    
    try:
        # Analyze the test file
        result = scanner.analyze_file(str(test_file))
        if result:
            print(f"[OK] Analyzed file: {result.path}")
            print(f"     Language: {result.language}")
            print(f"     Lines of code: {result.lines_of_code}")
            print(f"     Functions found: {len(result.functions)}")
            print(f"     Classes found: {len(result.classes)}")
        else:
            print("[FAIL] Could not analyze test file")
    finally:
        # Clean up
        if test_file.exists():
            test_file.unlink()
    
    # Test 2: Directory scanning
    print("\n[2] Testing directory scan...")
    scan_results = scanner.scan_directory(".", recursive=False, max_files=10)
    print(f"[OK] Found {scan_results['summary']['total_files']} code files")
    print(f"     Languages: {list(scan_results['summary']['languages'].keys())}")
    
    # Test 3: Interactive collector availability
    print(f"\n[3] Interactive features available: {INTERACTIVE_AVAILABLE}")
    if INTERACTIVE_AVAILABLE:
        from collectors import InteractiveContextCollector, ContextCollectionConfig
        print("[OK] Interactive collector can be imported")
        
        # Test configuration
        config = ContextCollectionConfig(max_files=100)
        print(f"     Default config: include_code={config.include_code}, max_files={config.max_files}")
    
    # Test 4: Git analysis (if in a git repo)
    print("\n[4] Testing Git analysis...")
    try:
        git_analyzer = GitAnalyzer(".")
        print("[OK] Git repository detected")
        
        # Get basic repo stats
        analysis = git_analyzer.analyze_repository(max_commits=10, days_back=30)
        print(f"     Total commits analyzed: {analysis['parameters']['commits_analyzed']}")
        print(f"     Contributors: {analysis['contributors']['summary']['total_contributors']}")
        
    except Exception as e:
        print(f"[INFO] Git analysis not available: {e}")
    
    print("\n=== Example completed successfully! ===")
    print("\nNext steps:")
    print("1. Run full tests: python test_runner.py")
    print("2. Try interactive mode: python -m src.collectors.interactive_collector")

if __name__ == "__main__":
    main()