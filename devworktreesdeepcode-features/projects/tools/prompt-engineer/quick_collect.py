#!/usr/bin/env python3
"""
Quick collection example that doesn't require user interaction.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from collectors import InteractiveContextCollector, ContextCollectionConfig

def main():
    print("=== Quick Context Collection (No User Input) ===")
    
    try:
        # Create collector with current directory
        collector = InteractiveContextCollector(".")
        
        # Configure without user prompts
        collector.config = ContextCollectionConfig(
            include_code=True,
            include_git=False,  # Skip git since we're not in a git repo
            include_docs=True,
            max_files=20,
            recursive_scan=False  # Just current directory
        )
        
        print(f"[INFO] Collecting context from: {collector.base_path}")
        print(f"[INFO] Configuration: code={collector.config.include_code}, docs={collector.config.include_docs}")
        
        # Collect code context
        print("\n[1] Collecting code context...")
        code_results = collector._collect_code_context()
        if code_results and 'summary' in code_results:
            print(f"[OK] Found {code_results['summary']['total_files']} code files")
            print(f"     Languages: {list(code_results['summary']['languages'].keys())}")
        
        # Collect documentation context
        print("\n[2] Collecting documentation context...")
        docs_results = collector._collect_docs_context()
        if docs_results and 'summary' in docs_results:
            print(f"[OK] Found {docs_results['summary']['total_files']} documentation files")
        
        # Save simple results
        context_data = {
            'collection_time': collector.config.__dict__,  # Just show config for now
            'base_path': str(collector.base_path),
            'results': {
                'code_files_found': code_results.get('summary', {}).get('total_files', 0) if code_results else 0,
                'doc_files_found': docs_results.get('summary', {}).get('total_files', 0) if docs_results else 0
            }
        }
        
        output_file = collector.save_results(context_data, "quick_results.json")
        print(f"\n[SUCCESS] Results saved to: {output_file}")
        
    except Exception as e:
        print(f"[FAIL] Error during collection: {e}")
        return False
    
    print("\n=== Quick collection completed! ===")
    return True

if __name__ == "__main__":
    main()