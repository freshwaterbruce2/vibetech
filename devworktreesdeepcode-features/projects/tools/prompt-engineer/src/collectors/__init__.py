"""
Context Collection Package for Interactive Prompt Engineering Tool

Provides interactive collection of various context types including code,
documentation, and git repository analysis.
"""

try:
    from .interactive_collector import InteractiveContextCollector, ContextCollectionConfig
    INTERACTIVE_AVAILABLE = True
except ImportError:
    INTERACTIVE_AVAILABLE = False
    InteractiveContextCollector = None
    ContextCollectionConfig = None

from .code_scanner import CodeScanner, CodeFile
from .git_analyzer import GitAnalyzer, CommitInfo, FileHotSpot

__all__ = [
    "InteractiveContextCollector",
    "ContextCollectionConfig", 
    "CodeScanner",
    "CodeFile",
    "GitAnalyzer",
    "CommitInfo",
    "FileHotSpot",
    "INTERACTIVE_AVAILABLE"
]