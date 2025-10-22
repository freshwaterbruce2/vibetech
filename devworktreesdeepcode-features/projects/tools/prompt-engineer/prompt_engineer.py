#!/usr/bin/env python3
"""
Prompt Engineer - Main CLI Tool

Analyzes any project and generates optimized prompts for AI/LLM interactions.
This is the primary interface for the prompt engineering workflow.
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from collectors import CodeScanner
from prompt_templates import PromptTemplateGenerator

def analyze_and_generate_prompts(project_path: str, template_type: str = 'all', 
                                max_files: int = 100, save_context: bool = True):
    """
    Complete workflow: Analyze project + Generate prompts.
    
    Args:
        project_path: Path to project to analyze
        template_type: Type of prompt to generate (feature, debug, refactor, test, architecture, all)
        max_files: Maximum files to analyze
        save_context: Whether to save context data to JSON
        
    Returns:
        Generated prompts as dictionary
    """
    
    print("=" * 70)
    print("PROMPT ENGINEER - AI-Optimized Prompt Generator")
    print("=" * 70)
    print(f"Analyzing: {project_path}")
    print(f"Template: {template_type}")
    print()
    
    try:
        base_path = Path(project_path).resolve()
        
        if not base_path.exists():
            print(f"[ERROR] Path does not exist: {project_path}")
            return None
        
        # Step 1: Analyze the project
        print("[1/3] Analyzing project structure...")
        context_data = analyze_project_context(base_path, max_files)
        
        if not context_data:
            print("[ERROR] Failed to analyze project")
            return None
        
        print(f"[OK] Analyzed {context_data.get('code_structure', {}).get('summary', {}).get('total_files', 0)} files")
        
        # Step 2: Save context if requested
        context_file = None
        if save_context:
            print("[2/3] Saving context data...")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            context_file = f"context_{Path(project_path).name}_{timestamp}.json"
            
            with open(context_file, 'w', encoding='utf-8') as f:
                json.dump(context_data, f, indent=2, ensure_ascii=False)
            print(f"[OK] Context saved to: {context_file}")
        else:
            print("[2/3] Skipping context save...")
        
        # Step 3: Generate prompts
        print("[3/3] Generating AI-optimized prompts...")
        generator = PromptTemplateGenerator(context_data)
        
        if template_type == 'all':
            prompts = generator.generate_all_templates()
        elif template_type == 'feature':
            prompts = {'add_feature': generator.generate_feature_prompt()}
        elif template_type == 'debug':
            prompts = {'debug_issue': generator.generate_debug_prompt()}
        elif template_type == 'refactor':
            prompts = {'refactor_code': generator.generate_refactor_prompt()}
        elif template_type == 'test':
            prompts = {'write_tests': generator.generate_test_prompt()}
        elif template_type == 'architecture':
            prompts = {'architecture': generator.generate_architecture_prompt()}
        else:
            print(f"[ERROR] Unknown template type: {template_type}")
            return None
        
        print(f"[OK] Generated {len(prompts)} prompt template(s)")
        print()
        
        # Display results
        display_prompts(prompts, context_file)
        
        return prompts
        
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        return None

def analyze_project_context(project_path: Path, max_files: int) -> dict:
    """Analyze project and return context data."""
    
    context_data = {
        'collection_info': {
            'timestamp': datetime.now().isoformat(),
            'base_path': str(project_path),
            'purpose': 'prompt_engineering',
            'max_files': max_files
        },
        'code_structure': {},
        'architectural_context': {},
        'development_patterns': {}
    }
    
    try:
        # Code analysis
        scanner = CodeScanner()
        scan_results = scanner.scan_directory(
            directory=str(project_path),
            recursive=True,
            max_files=max_files
        )
        
        # Extract key information
        context_data['code_structure'] = {
            'summary': scan_results['summary'],
            'file_count': len(scan_results['files'])
        }
        
        # Analyze patterns (simplified)
        patterns = analyze_simple_patterns(scan_results)
        context_data['architectural_context'] = patterns
        
        # Development context
        dev_context = analyze_development_structure(project_path)
        context_data['development_patterns'] = dev_context
        
        return context_data
        
    except Exception as e:
        print(f"[ERROR] Context analysis failed: {e}")
        return {}

def analyze_simple_patterns(scan_results: dict) -> dict:
    """Simple pattern analysis from scan results."""
    patterns = {
        'mvc_patterns': {'count': 0},
        'test_files': {'count': 0},
        'configuration_files': {'count': 0},
        'api_endpoints': {'count': 0}
    }
    
    for file_info in scan_results.get('files', []):
        path = file_info.path.lower()
        
        # Test files
        if any(keyword in path for keyword in ['test', 'spec']):
            patterns['test_files']['count'] += 1
        
        # Config files  
        if any(keyword in path for keyword in ['config', 'settings', '.env']):
            patterns['configuration_files']['count'] += 1
        
        # MVC patterns
        if any(keyword in path for keyword in ['component', 'view', 'controller', 'model', 'service']):
            patterns['mvc_patterns']['count'] += 1
        
        # API patterns
        if any(keyword in path for keyword in ['api', 'endpoint', 'route', 'handler']):
            patterns['api_endpoints']['count'] += 1
    
    return patterns

def analyze_development_structure(project_path: Path) -> dict:
    """Analyze development structure."""
    context = {
        'key_directories': [],
        'entry_points': [],
        'configuration_files': []
    }
    
    try:
        # Key directories
        key_dirs = []
        for item in project_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                key_dirs.append({'name': item.name, 'type': classify_directory(item.name)})
        
        context['key_directories'] = key_dirs[:10]  # Top 10
        
        # Entry points
        entry_patterns = ['main.py', 'app.py', 'index.js', 'server.py', 'index.html']
        for pattern in entry_patterns:
            entry_file = project_path / pattern
            if entry_file.exists():
                context['entry_points'].append(pattern)
        
        # Config files
        config_patterns = ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod']
        for pattern in config_patterns:
            config_file = project_path / pattern
            if config_file.exists():
                context['configuration_files'].append(pattern)
                
    except Exception:
        pass  # Return empty context on error
    
    return context

def classify_directory(dir_name: str) -> str:
    """Classify directory type."""
    dir_name = dir_name.lower()
    
    if dir_name in ['src', 'lib', 'app']:
        return 'source_code'
    elif dir_name in ['test', 'tests', 'spec']:
        return 'tests'
    elif dir_name in ['doc', 'docs']:
        return 'documentation'
    elif dir_name in ['config', 'conf']:
        return 'configuration'
    else:
        return 'other'

def display_prompts(prompts: dict, context_file: str = None):
    """Display generated prompts."""
    
    print("=" * 70)
    print("GENERATED PROMPTS - Ready for AI/LLM Use")
    print("=" * 70)
    
    for prompt_type, prompt_content in prompts.items():
        print(f"\\n[{prompt_type.upper().replace('_', ' ')} PROMPT]")
        print("=" * 40)
        print(prompt_content)
        print("\\n" + "-" * 70)
    
    print("\\n" + "=" * 70)
    print("USAGE INSTRUCTIONS")
    print("=" * 70)
    print("1. Copy the relevant prompt above")
    print("2. Replace placeholders with your specific details")
    print("3. Paste into Claude, ChatGPT, or your preferred AI assistant")
    print("4. Get contextually-aware responses!")
    
    if context_file:
        print(f"\\nContext data saved to: {context_file}")
    
    print("\\n" + "=" * 70)

def main():
    """Main CLI interface."""
    
    parser = argparse.ArgumentParser(
        description="Prompt Engineer - Generate AI-optimized prompts from project analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python prompt_engineer.py /path/to/project
  python prompt_engineer.py /path/to/project --template feature
  python prompt_engineer.py /path/to/project --template debug --max-files 200
  python prompt_engineer.py /path/to/project --template all --no-save
        """
    )
    
    parser.add_argument("project_path", help="Path to project to analyze")
    parser.add_argument("--template", "-t", 
                       choices=['feature', 'debug', 'refactor', 'test', 'architecture', 'all'],
                       default='all',
                       help="Type of prompt to generate (default: all)")
    parser.add_argument("--max-files", "-m", type=int, default=100,
                       help="Maximum files to analyze (default: 100)")
    parser.add_argument("--no-save", action="store_true",
                       help="Don't save context data to file")
    
    args = parser.parse_args()
    
    # Run the analysis and prompt generation
    prompts = analyze_and_generate_prompts(
        project_path=args.project_path,
        template_type=args.template,
        max_files=args.max_files,
        save_context=not args.no_save
    )
    
    if prompts:
        print("\\n[SUCCESS] Prompt engineering completed!")
        print(f"Generated {len(prompts)} prompt template(s) ready for AI use.")
    else:
        print("\\n[FAILED] Prompt generation failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()