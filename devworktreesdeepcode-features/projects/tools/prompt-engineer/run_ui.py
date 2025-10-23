#!/usr/bin/env python3
"""
Simple launcher for the Context Collector UI.
"""

import sys
import subprocess
from pathlib import Path

def main():
    """Launch the UI server."""
    
    print("Context Collector - Starting...")
    
    try:
        # Just run the UI server without specifying a port
        # It will find a free port automatically
        subprocess.run([sys.executable, 'ui_server.py'], check=True)
    except KeyboardInterrupt:
        print("\\nStopped by user")
    except Exception as e:
        print(f"Error starting UI: {e}")
        print("Try manually: python ui_server.py")

if __name__ == "__main__":
    main()