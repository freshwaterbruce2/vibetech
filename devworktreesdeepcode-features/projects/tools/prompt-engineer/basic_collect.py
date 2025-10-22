#!/usr/bin/env python3
"""
Basic context collector - no fancy UI, just works.
"""

import sys
from pathlib import Path
import json
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from collectors import CodeScanner

def collect_basic_context(target_path=".", max_files=50):
    """Collect basic context without any fancy UI."""
    print(f"[INFO] Collecting context from: {target_path}")
    
    results = {
        'collection_time': datetime.now().isoformat(),
        'base_path': str(Path(target_path).resolve()),
        'code_analysis': {},
        'documentation': {}
    }
    
    # 1. Code analysis
    print("[1/2] Analyzing code files...")
    try:
        scanner = CodeScanner()
        scan_results = scanner.scan_directory(
            directory=target_path,
            recursive=True,
            max_files=max_files
        )
        
        # Extract just the summary for JSON serialization
        results['code_analysis'] = {
            'summary': scan_results['summary'],
            'file_count': len(scan_results['files']),
            'scan_time': scan_results['scan_time']
        }
        summary = scan_results['summary']
        print(f"[OK] Found {summary['total_files']} code files")
        print(f"     Total lines: {summary['total_lines']:,}")
        print(f"     Languages: {', '.join(summary['languages'].keys())}")
        
    except Exception as e:
        print(f"[FAIL] Code analysis error: {e}")
        results['code_analysis'] = {'error': str(e)}
    
    # 2. Documentation files
    print("[2/2] Finding documentation...")
    try:
        doc_extensions = ['.md', '.rst', '.txt']
        doc_files = []
        base_path = Path(target_path)
        
        for ext in doc_extensions:
            doc_files.extend(base_path.rglob(f'*{ext}'))
        
        doc_info = []
        for doc_file in doc_files[:20]:  # Limit to 20 docs
            try:
                size = doc_file.stat().st_size
                doc_info.append({
                    'path': str(doc_file),
                    'size': size,
                    'extension': doc_file.suffix
                })
            except Exception:
                pass
        
        results['documentation'] = {
            'files': doc_info,
            'total_found': len(doc_files)
        }
        
        print(f"[OK] Found {len(doc_files)} documentation files")
        
    except Exception as e:
        print(f"[WARN] Documentation scan error: {e}")
        results['documentation'] = {'error': str(e)}
    
    return results

def save_results(results, output_file="context_results.json"):
    """Save results to JSON file."""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"[OK] Results saved to: {output_file}")
        return output_file
    except Exception as e:
        print(f"[FAIL] Could not save results: {e}")
        return None

def main():
    print("=== Basic Context Collector ===")
    print("Simple, reliable context collection for prompt engineering")
    print()
    
    # Allow command line argument for path
    target_path = sys.argv[1] if len(sys.argv) > 1 else "."
    
    # Collect context
    results = collect_basic_context(target_path)
    
    # Save results
    output_file = save_results(results)
    
    if output_file:
        print()
        print("=== Collection Summary ===")
        code_files = results['code_analysis'].get('summary', {}).get('total_files', 0)
        doc_files = results['documentation'].get('total_found', 0)
        print(f"Code files: {code_files}")
        print(f"Documentation files: {doc_files}")
        print(f"Results saved to: {output_file}")
        print()
        print("You can now:")
        print(f"1. Review the results: cat {output_file}")
        print("2. Copy relevant parts to your AI prompts")
        print("3. Use the context for code analysis or documentation")

if __name__ == "__main__":
    main()