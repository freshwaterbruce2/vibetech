"""
Test suite for Interactive Context Collector and Automated Backup System

This test suite provides comprehensive coverage for:
- Code scanning functionality
- Git analysis features  
- Database operations
- Backup system functionality
- Integration scenarios
"""

import os
import sys
from pathlib import Path

# Add the src directory to Python path for imports
test_dir = Path(__file__).parent
src_dir = test_dir.parent / "src"
sys.path.insert(0, str(src_dir))

# Test configuration
TEST_CONFIG = {
    "database": {
        "test_db_path": str(test_dir / "test_database.db"),
        "temp_db_path": str(test_dir / "temp_test.db")
    },
    "fixtures": {
        "code_samples_dir": str(test_dir / "fixtures" / "code_samples"),
        "git_repo_dir": str(test_dir / "fixtures" / "test_repo"),
        "backup_test_dir": str(test_dir / "fixtures" / "backup_test")
    },
    "timeouts": {
        "database_timeout": 5.0,
        "git_timeout": 10.0,
        "backup_timeout": 30.0
    }
}