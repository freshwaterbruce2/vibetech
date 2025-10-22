#!/usr/bin/env python3
"""
Test script for progress tracking functionality
"""

import sys
import time
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer

def test_progress_callback():
    """Test the progress callback functionality."""
    
    print("Testing Progress Tracking Functionality")
    print("=" * 50)
    
    # Track progress updates
    progress_updates = []
    
    def progress_callback(stage: str, progress: int, status: str):
        """Capture progress updates for testing."""
        update = f"[{progress:3d}%] {stage.upper()}: {status}"
        progress_updates.append((stage, progress, status))
        print(update)
    
    try:
        # Create analyzer with progress callback
        analyzer = ProjectIntelligenceAnalyzer(progress_callback=progress_callback)
        
        # Test with current project directory
        project_path = Path(__file__).parent
        print(f"Analyzing project: {project_path}")
        print("-" * 50)
        
        # Run analysis
        result = analyzer.analyze_project(str(project_path), max_files=50)
        
        print("-" * 50)
        print("Analysis Complete!")
        print(f"Progress Updates: {len(progress_updates)}")
        print(f"Final Health Score: {result.health_score}/100")
        print(f"Total Issues: {len(result.critical_issues + result.high_priority_issues + result.medium_priority_issues + result.low_priority_issues)}")
        
        # Verify progress tracking worked
        if progress_updates:
            print("\nProgress Tracking: SUCCESS [PASS]")
            print(f"Stages tracked: {set(stage for stage, _, _ in progress_updates)}")
            final_progress = max(progress for _, progress, _ in progress_updates)
            print(f"Final progress: {final_progress}%")
        else:
            print("\nProgress Tracking: FAILED [FAIL]")
            
    except Exception as e:
        print(f"Error during testing: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_progress_callback()