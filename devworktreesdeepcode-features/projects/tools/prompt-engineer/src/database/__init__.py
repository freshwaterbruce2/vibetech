"""
SQLite Database Package for Interactive Prompt Engineering Tool

This package provides a comprehensive SQLite-based context management system
optimized for Windows environments with D drive storage.
"""

from .sqlite_manager import SQLiteContextManager
from .connection_pool import SQLiteConnectionPool
from .optimizations import optimize_for_windows

__version__ = "1.0.0"
__all__ = [
    "SQLiteContextManager",
    "SQLiteConnectionPool", 
    "optimize_for_windows"
]