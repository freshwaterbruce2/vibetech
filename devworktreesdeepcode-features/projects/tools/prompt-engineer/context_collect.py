#!/usr/bin/env python3
"""
Context Collector for Spec-Driven Development

Gathers comprehensive context about your codebase to help with:
- Understanding existing architecture 
- Planning new features
- Code reviews and analysis
- Documentation and onboarding

This is spec-driven development context, not just simple file listing.
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from collectors import CodeScanner, ContextCollectionConfig

def collect_spec_context(target_path=".", include_git=False, max_files=100):
    """
    Collect comprehensive context for spec-driven development.
    
    This goes beyond basic file analysis to understand:
    - Code structure and patterns
    - Function signatures and interfaces
    - Dependencies and relationships  
    - Architecture and design patterns
    """
    
    print(f"[INFO] Collecting spec-driven context from: {target_path}")
    print("[INFO] This includes code structure, patterns, and architectural context")
    
    base_path = Path(target_path).resolve()
    
    results = {
        'collection_info': {
            'timestamp': datetime.now().isoformat(),
            'base_path': str(base_path),
            'purpose': 'spec-driven development context',
            'max_files': max_files
        },
        'code_structure': {},
        'architectural_context': {},
        'development_patterns': {}
    }
    
    # 1. Deep code analysis for architectural understanding
    print("\n[1/3] Analyzing code structure and architecture...")
    
    try:
        scanner = CodeScanner()
        scan_results = scanner.scan_directory(
            directory=str(base_path),
            recursive=True,
            max_files=max_files
        )
        
        # Extract architectural information
        languages = scan_results['summary']['languages']
        total_files = scan_results['summary']['total_files']
        total_functions = scan_results['summary']['function_count']
        total_classes = scan_results['summary']['class_count']
        
        print(f"[OK] Analyzed {total_files} files across {len(languages)} languages")
        print(f"     Found {total_functions} functions, {total_classes} classes")
        
        # Analyze patterns and structure
        file_details = []
        for code_file in scan_results['files']:
            file_info = {
                'path': code_file.path,
                'language': code_file.language,
                'lines_of_code': code_file.lines_of_code,
                'functions': [{'name': f['name'], 'line': f.get('line_number', 0)} for f in code_file.functions],
                'classes': [{'name': c['name'], 'line': c.get('line_number', 0)} for c in code_file.classes],
                'imports': code_file.imports,
                'dependencies': code_file.dependencies
            }
            file_details.append(file_info)
        
        results['code_structure'] = {
            'summary': scan_results['summary'],
            'file_details': file_details
        }
        
    except Exception as e:
        print(f"[WARN] Code analysis error: {e}")
        results['code_structure'] = {'error': str(e)}
    
    # 2. Architectural patterns analysis
    print("\n[2/3] Identifying architectural patterns...")
    
    try:
        patterns = analyze_patterns(results['code_structure'])
        results['architectural_context'] = patterns
        
        print(f"[OK] Identified key patterns:")
        for pattern_type, details in patterns.items():
            if isinstance(details, dict) and 'count' in details:
                print(f"     {pattern_type}: {details['count']} instances")
        
    except Exception as e:
        print(f"[WARN] Pattern analysis error: {e}")
        results['architectural_context'] = {'error': str(e)}
    
    # 3. Development context 
    print("\n[3/3] Gathering development context...")
    
    try:
        dev_context = analyze_development_context(base_path, results['code_structure'])
        results['development_patterns'] = dev_context
        
        print(f"[OK] Development context gathered")
        
    except Exception as e:
        print(f"[WARN] Development context error: {e}")
        results['development_patterns'] = {'error': str(e)}
    
    return results

def analyze_patterns(code_structure):
    """Analyze architectural and design patterns in the codebase."""
    
    patterns = {
        'mvc_patterns': {'count': 0, 'files': []},
        'factory_patterns': {'count': 0, 'files': []},
        'singleton_patterns': {'count': 0, 'files': []},
        'api_endpoints': {'count': 0, 'files': []},
        'database_models': {'count': 0, 'files': []},
        'test_files': {'count': 0, 'files': []},
        'configuration_files': {'count': 0, 'files': []},
        'utility_modules': {'count': 0, 'files': []}
    }
    
    if 'file_details' not in code_structure:
        return patterns
    
    for file_info in code_structure['file_details']:
        path = file_info['path'].lower()
        functions = [f['name'].lower() for f in file_info.get('functions', [])]
        classes = [c['name'].lower() for c in file_info.get('classes', [])]
        
        # Identify patterns based on naming conventions and structure
        if any(keyword in path for keyword in ['controller', 'view', 'model']):
            patterns['mvc_patterns']['count'] += 1
            patterns['mvc_patterns']['files'].append(file_info['path'])
        
        if any(keyword in path for keyword in ['factory', 'builder']):
            patterns['factory_patterns']['count'] += 1
            patterns['factory_patterns']['files'].append(file_info['path'])
        
        if any('singleton' in name for name in classes):
            patterns['singleton_patterns']['count'] += 1
            patterns['singleton_patterns']['files'].append(file_info['path'])
        
        if any(keyword in path for keyword in ['api', 'endpoint', 'route']):
            patterns['api_endpoints']['count'] += 1
            patterns['api_endpoints']['files'].append(file_info['path'])
        
        if any(keyword in path for keyword in ['model', 'schema', 'entity']):
            patterns['database_models']['count'] += 1
            patterns['database_models']['files'].append(file_info['path'])
        
        if any(keyword in path for keyword in ['test', 'spec']):
            patterns['test_files']['count'] += 1
            patterns['test_files']['files'].append(file_info['path'])
        
        if any(keyword in path for keyword in ['config', 'settings', 'env']):
            patterns['configuration_files']['count'] += 1
            patterns['configuration_files']['files'].append(file_info['path'])
        
        if any(keyword in path for keyword in ['util', 'helper', 'common']):
            patterns['utility_modules']['count'] += 1
            patterns['utility_modules']['files'].append(file_info['path'])
    
    return patterns

def analyze_development_context(base_path, code_structure):
    """Analyze development context and project structure."""
    
    context = {
        'project_structure': {},
        'key_directories': [],
        'entry_points': [],
        'configuration_files': [],
        'documentation_files': []
    }
    
    # Analyze directory structure
    try:
        key_dirs = []
        for item in base_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                key_dirs.append({
                    'name': item.name,
                    'path': str(item),
                    'type': classify_directory(item.name)
                })
        
        context['key_directories'] = key_dirs
        
        # Find entry points (main files, app files, etc.)
        entry_patterns = ['main.py', 'app.py', 'index.js', 'server.py', '__main__.py']
        for pattern in entry_patterns:
            entry_file = base_path / pattern
            if entry_file.exists():
                context['entry_points'].append(str(entry_file))
        
        # Find configuration files
        config_patterns = ['*.json', '*.yaml', '*.yml', '*.toml', '*.ini', '*.cfg']
        config_files = []
        for pattern in config_patterns:
            config_files.extend(base_path.glob(pattern))
        
        context['configuration_files'] = [str(f) for f in config_files[:10]]  # Limit to 10
        
        # Find documentation
        doc_patterns = ['README*', '*.md', '*.rst', '*.txt']
        doc_files = []
        for pattern in doc_patterns:
            doc_files.extend(base_path.glob(pattern))
        
        context['documentation_files'] = [str(f) for f in doc_files[:10]]  # Limit to 10
        
    except Exception as e:
        context['error'] = str(e)
    
    return context

def classify_directory(dir_name):
    """Classify directory type based on common patterns."""
    dir_name = dir_name.lower()
    
    if dir_name in ['src', 'lib', 'app']:
        return 'source_code'
    elif dir_name in ['test', 'tests', 'spec', 'specs']:
        return 'tests'
    elif dir_name in ['doc', 'docs', 'documentation']:
        return 'documentation'
    elif dir_name in ['config', 'conf', 'settings']:
        return 'configuration'
    elif dir_name in ['script', 'scripts', 'tools', 'util', 'utils']:
        return 'utilities'
    elif dir_name in ['dist', 'build', 'out', 'target']:
        return 'build_output'
    elif dir_name in ['node_modules', 'vendor', 'deps', 'dependencies']:
        return 'dependencies'
    else:
        return 'other'

def save_context_results(results, output_file="spec_context.json"):
    """Save the context results to a JSON file."""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"[OK] Context saved to: {output_file}")
        return output_file
    except Exception as e:
        print(f"[FAIL] Could not save results: {e}")
        return None

def main():
    """Main function for spec-driven context collection."""
    
    print("=== Spec-Driven Development Context Collector ===")
    print("Gathering comprehensive architectural and development context")
    print()
    
    # Get target path from command line or use current directory
    target_path = sys.argv[1] if len(sys.argv) > 1 else "."
    
    # Collect comprehensive context
    context_results = collect_spec_context(target_path, max_files=150)
    
    # Save results
    output_file = save_context_results(context_results)
    
    if output_file:
        print("\n" + "="*60)
        print("SPEC-DRIVEN DEVELOPMENT CONTEXT SUMMARY")
        print("="*60)
        
        # Show summary
        code_summary = context_results.get('code_structure', {}).get('summary', {})
        patterns = context_results.get('architectural_context', {})
        
        print(f"Total Files: {code_summary.get('total_files', 0)}")
        print(f"Languages: {', '.join(code_summary.get('languages', {}).keys())}")
        print(f"Functions: {code_summary.get('function_count', 0)}")
        print(f"Classes: {code_summary.get('class_count', 0)}")
        
        print(f"\nArchitectural Patterns Found:")
        for pattern_name, pattern_info in patterns.items():
            if isinstance(pattern_info, dict) and pattern_info.get('count', 0) > 0:
                print(f"  {pattern_name}: {pattern_info['count']}")
        
        print(f"\nContext saved to: {output_file}")
        print("\nThis context provides the architectural understanding needed for:")
        print("• Spec-driven feature development")  
        print("• Understanding existing patterns and structures")
        print("• Planning new features that fit the architecture")
        print("• Code reviews and technical discussions")
        print("• Onboarding new developers")

if __name__ == "__main__":
    main()