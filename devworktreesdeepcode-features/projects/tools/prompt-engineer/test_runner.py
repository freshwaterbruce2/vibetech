"""
Simple test runner for the Interactive Context Collector.

This script can be used to run tests without pytest if needed.
"""

import sys
import unittest
import os
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

def run_basic_tests():
    """Run basic functionality tests without pytest."""
    print("[TEST] Running basic functionality tests...")
    print("=" * 60)
    
    # Test 1: Import all modules
    print("\\n[1/4] Test 1: Module imports")
    try:
        from collectors import CodeScanner, GitAnalyzer, INTERACTIVE_AVAILABLE
        print("[OK] Core modules imported successfully")
        
        if INTERACTIVE_AVAILABLE:
            from collectors import InteractiveContextCollector, ContextCollectionConfig
            print("[OK] Interactive modules imported successfully")
        else:
            print("[WARN] Interactive modules not available (missing dependencies)")
    except Exception as e:
        print(f"[FAIL] Import failed: {e}")
        return False
    
    # Test 2: CodeScanner basic functionality
    print("\\n[2/4] Test 2: CodeScanner functionality")
    try:
        scanner = CodeScanner()
        
        # Test language detection
        test_cases = [
            ('test.py', 'python'),
            ('test.js', 'javascript'),
            ('test.ts', 'typescript'),
            ('test.unknown', None)
        ]
        
        for filename, expected in test_cases:
            result = scanner._get_language(Path(filename))
            if result == expected:
                print(f"[OK] {filename} -> {expected}")
            else:
                print(f"[FAIL] {filename} -> {result} (expected {expected})")
                return False
        
        print("[OK] CodeScanner basic functionality works")
    except Exception as e:
        print(f"[FAIL] CodeScanner test failed: {e}")
        return False
    
    # Test 3: Configuration handling
    if INTERACTIVE_AVAILABLE:
        print("\\n[3/4] Test 3: Configuration handling")
        try:
            config = ContextCollectionConfig()
            
            # Test default values
            assert config.include_code is True
            assert config.include_git is True
            assert config.max_files == 1000
            print("[OK] Default configuration correct")
            
            # Test custom values
            custom_config = ContextCollectionConfig(
                include_code=False,
                max_files=500
            )
            assert custom_config.include_code is False
            assert custom_config.max_files == 500
            assert custom_config.include_git is True  # Should remain default
            print("[OK] Custom configuration correct")
            
        except Exception as e:
            print(f"[FAIL] Configuration test failed: {e}")
            return False
    
    # Test 4: File system operations
    print("\\n[4/4] Test 4: File system operations")
    try:
        import tempfile
        
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            
            # Create test file
            test_file = tmp_path / 'test.py'
            test_file.write_text('def hello(): pass')
            
            # Test scanner
            result = scanner.analyze_file(str(test_file))
            if result and result.language == 'python':
                print("[OK] File analysis works")
            else:
                print("[FAIL] File analysis failed")
                return False
                
        print("[OK] File system operations work")
    except Exception as e:
        print(f"[FAIL] File system test failed: {e}")
        return False
    
    print("\\n[SUCCESS] All basic tests passed!")
    return True

def main():
    """Main test runner function."""
    print("Interactive Context Collector - Test Runner")
    print("=" * 60)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("[FAIL] Python 3.8+ is required")
        return False
    
    print(f"[OK] Python {sys.version}")
    
    # Run basic tests
    success = run_basic_tests()
    
    if success:
        print("\\n[SUCCESS] All tests completed successfully!")
        print("\\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Run full test suite: python -m pytest tests/")
        print("3. Try the interactive collector: python -m src.collectors.interactive_collector")
        return True
    else:
        print("\\n[FAIL] Some tests failed. Please check the error messages above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)