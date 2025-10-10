#!/usr/bin/env python3
"""
Clean stale instance locks
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from instance_lock import InstanceLock

# Create lock instance and clean stale locks
lock = InstanceLock()
lock._cleanup_stale_locks()
print("\nStale lock cleanup complete!")
