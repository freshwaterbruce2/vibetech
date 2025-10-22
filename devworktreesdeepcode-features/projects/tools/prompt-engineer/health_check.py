#!/usr/bin/env python3
"""
Health check script for Prompt Engineer deployment
"""

import json
import sys

from src.collectors import CodeScanner

try:
    scanner = CodeScanner()
    result = scanner.scan_directory(".", recursive=False, max_files=1)
    print(json.dumps({"status": "healthy", "files": result["summary"]["total_files"]}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({"status": "unhealthy", "error": str(e)}))
    sys.exit(1)
