#!/usr/bin/env python3
"""
Prompt Template Generator for AI/LLM Interactions

Converts project context into optimized prompts for different development tasks.
This is the core of the prompt engineering functionality.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

class PromptTemplateGenerator:
    """
    Generates AI-optimized prompts from project context.
    
    Takes context data and creates ready-to-use prompts for:
    - Feature development
    - Bug fixing
    - Code refactoring
    - Testing
    - Documentation
    - Architecture discussions
    """
    
    def __init__(self, context_data: Dict[str, Any]):
        """Initialize with project context data."""
        self.context = context_data
        self.project_name = self._extract_project_name()
        self.tech_stack = self._extract_tech_stack()
        self.architecture = self._extract_architecture_info()
        self.patterns = self._extract_patterns()
    
    def _extract_project_name(self) -> str:
        """Extract project name from context."""
        base_path = self.context.get('collection_info', {}).get('base_path', '')
        if base_path:
            return Path(base_path).name
        return "Project"
    
    def _extract_tech_stack(self) -> List[str]:
        """Extract technology stack from context."""
        languages = []
        
        # From code structure
        code_struct = self.context.get('code_structure', {})
        if 'summary' in code_struct and 'languages' in code_struct['summary']:
            languages = list(code_struct['summary']['languages'].keys())
        
        # Map file extensions to frameworks/technologies
        tech_mapping = {
            'typescript': ['TypeScript', 'Node.js'],
            'javascript': ['JavaScript', 'Node.js'],
            'python': ['Python'],
            'java': ['Java'],
            'go': ['Go'],
            'rust': ['Rust'],
            'html': ['HTML'],
            'css': ['CSS'],
            'json': ['JSON Config'],
            'powershell': ['PowerShell Scripts']
        }
        
        tech_stack = []
        for lang in languages:
            if lang in tech_mapping:
                tech_stack.extend(tech_mapping[lang])
        
        return list(set(tech_stack))  # Remove duplicates
    
    def _extract_architecture_info(self) -> Dict[str, Any]:
        """Extract architectural information."""
        arch_info = {
            'total_files': 0,
            'total_functions': 0,
            'total_classes': 0,
            'key_directories': [],
            'entry_points': []
        }
        
        # From code structure
        code_struct = self.context.get('code_structure', {})
        if 'summary' in code_struct:
            summary = code_struct['summary']
            arch_info['total_files'] = summary.get('total_files', 0)
            arch_info['total_functions'] = summary.get('function_count', 0)
            arch_info['total_classes'] = summary.get('class_count', 0)
        
        # From development patterns
        dev_patterns = self.context.get('development_patterns', {})
        if 'key_directories' in dev_patterns:
            arch_info['key_directories'] = [
                d['name'] for d in dev_patterns['key_directories'][:5]  # Top 5
            ]
        
        if 'entry_points' in dev_patterns:
            arch_info['entry_points'] = dev_patterns['entry_points']
        
        return arch_info
    
    def _extract_patterns(self) -> Dict[str, int]:
        """Extract architectural patterns."""
        patterns = {}
        arch_context = self.context.get('architectural_context', {})
        
        for pattern_name, pattern_info in arch_context.items():
            if isinstance(pattern_info, dict) and 'count' in pattern_info:
                if pattern_info['count'] > 0:
                    patterns[pattern_name] = pattern_info['count']
        
        return patterns
    
    def generate_feature_prompt(self, feature_description: str = "[DESCRIBE YOUR FEATURE]") -> str:
        """Generate prompt for adding a new feature."""
        
        template = f"""# Add New Feature: [YOUR FEATURE NAME]

## Project Context
I'm working on **{self.project_name}**, a project with the following architecture:

### Technology Stack
{', '.join(self.tech_stack) if self.tech_stack else 'Mixed technologies'}

### Project Structure
- **Total Files**: {self.architecture['total_files']} files
- **Functions**: {self.architecture['total_functions']} functions  
- **Classes**: {self.architecture['total_classes']} classes"""

        if self.architecture['key_directories']:
            template += f"""
- **Key Directories**: {', '.join(self.architecture['key_directories'])}"""

        if self.architecture['entry_points']:
            template += f"""
- **Entry Points**: {', '.join(self.architecture['entry_points'])}"""

        if self.patterns:
            template += f"""

### Existing Patterns Found
"""
            for pattern, count in self.patterns.items():
                pattern_name = pattern.replace('_', ' ').title()
                template += f"- **{pattern_name}**: {count} instances\\n"

        template += f"""

## Feature Request
**Describe the feature you want to implement:**

## Requirements
Please provide code that:
1. **Follows existing patterns** found in the codebase
2. **Integrates cleanly** with the current architecture
3. **Matches the coding style** of the existing {', '.join(self.tech_stack[:2]) if self.tech_stack else 'codebase'}
4. **Includes appropriate error handling** and logging
5. **Follows the project's testing patterns** if tests exist

## Additional Context
- The feature should fit naturally into the existing directory structure
- Please suggest where new files should be placed
- Include any necessary configuration changes
- Consider backwards compatibility

---
*Generated by Prompt Engineer Tool on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return template
    
    def generate_debug_prompt(self, issue_description: str = "[DESCRIBE THE ISSUE]") -> str:
        """Generate prompt for debugging issues."""
        
        template = f"""# Debug Issue: [YOUR ISSUE DESCRIPTION]

## Project Context
Working on **{self.project_name}** with the following setup:

### Technology Stack
{', '.join(self.tech_stack) if self.tech_stack else 'Mixed technologies'}

### Codebase Overview
- **{self.architecture['total_files']} files** with **{self.architecture['total_functions']} functions**
- **Key modules**: {', '.join(self.architecture['key_directories'][:3]) if self.architecture['key_directories'] else 'See file structure'}"""

        if self.architecture['entry_points']:
            template += f"""
- **Entry points**: {', '.join(self.architecture['entry_points'])}"""

        template += f"""

## Issue Description
**Describe the specific problem you're experiencing:**

## What I Need
1. **Root cause analysis** - What's likely causing this issue?
2. **Step-by-step debugging approach** for this {', '.join(self.tech_stack[:2]) if self.tech_stack else 'tech stack'}
3. **Code examples** showing the fix
4. **Testing strategy** to verify the fix
5. **Prevention measures** to avoid similar issues

## Additional Context
- This is a production codebase with {self.architecture['total_files']} files
- Consider impact on existing functionality
- Prefer minimal, surgical fixes over large refactoring"""

        if self.patterns:
            template += f"""
- The codebase follows these patterns: {', '.join(list(self.patterns.keys())[:3])}"""

        template += f"""

---
*Generated by Prompt Engineer Tool on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return template
    
    def generate_refactor_prompt(self, component_name: str = "[COMPONENT NAME]") -> str:
        """Generate prompt for refactoring code."""
        
        template = f"""# Refactor Component: [YOUR COMPONENT NAME]

## Project Architecture
Refactoring code in **{self.project_name}**:

### Current Codebase
- **Technology**: {', '.join(self.tech_stack) if self.tech_stack else 'Mixed stack'}
- **Scale**: {self.architecture['total_files']} files, {self.architecture['total_functions']} functions
- **Structure**: Organized in {len(self.architecture['key_directories'])} main directories"""

        if self.patterns:
            template += f"""

### Existing Patterns to Maintain
"""
            for pattern, count in list(self.patterns.items())[:4]:
                pattern_name = pattern.replace('_', ' ').title() 
                template += f"- **{pattern_name}**: {count} instances\\n"

        template += f"""

## Refactoring Goals
**Specify what component/code you want to refactor and your goals:**

1. **Improve maintainability** while preserving existing patterns
2. **Enhance performance** without breaking current functionality  
3. **Better separation of concerns** following project architecture
4. **Reduce complexity** where possible
5. **Maintain backward compatibility**

## Requirements
- **Keep the same external API** if it's a public interface
- **Follow existing code style** and naming conventions
- **Preserve all current functionality**
- **Add appropriate tests** if they don't exist
- **Update documentation** if interfaces change

## Constraints
- This is part of a {self.architecture['total_files']}-file codebase
- Must integrate with existing {', '.join(self.tech_stack[:2]) if self.tech_stack else 'components'}
- Consider impact on dependent components

---
*Generated by Prompt Engineer Tool on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return template
    
    def generate_test_prompt(self, component_name: str = "[COMPONENT TO TEST]") -> str:
        """Generate prompt for writing tests."""
        
        template = f"""# Write Tests: {component_name}

## Project Testing Context
Adding tests for **{component_name}** in **{self.project_name}**:

### Technology Stack
{', '.join(self.tech_stack) if self.tech_stack else 'Mixed technologies'}

### Project Scale
- **{self.architecture['total_files']} files** to potentially test
- **{self.architecture['total_functions']} functions** across the codebase"""

        # Check if we found test patterns
        test_patterns = [k for k in self.patterns.keys() if 'test' in k.lower()]
        if test_patterns:
            template += f"""

### Existing Test Patterns
Found **{sum(self.patterns[p] for p in test_patterns)} test files** - please follow existing patterns"""

        template += f"""

## Testing Requirements
Please create comprehensive tests for **{component_name}** that include:

### Test Types Needed
1. **Unit Tests** - Test individual functions/methods
2. **Integration Tests** - Test component interactions  
3. **Edge Cases** - Handle boundary conditions
4. **Error Handling** - Test failure scenarios
5. **Mock Dependencies** - Isolate the component under test

### Test Structure
- Follow the existing project's testing conventions
- Use appropriate testing framework for {', '.join(self.tech_stack[:2]) if self.tech_stack else 'the tech stack'}
- Include setup and teardown if needed
- Add descriptive test names and comments

### Coverage Goals
- **Happy path** scenarios
- **Error conditions** and exceptions
- **Boundary cases** and edge conditions
- **Integration points** with other components

## Additional Requirements
- Tests should be **fast and reliable**
- **Easy to understand** and maintain
- **Follow existing naming patterns**
- **Include test data/fixtures** as needed

---
*Generated by Prompt Engineer Tool on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return template
    
    def generate_architecture_prompt(self, question: str = "[YOUR ARCHITECTURE QUESTION]") -> str:
        """Generate prompt for architecture discussions."""
        
        template = f"""# Architecture Discussion: {question}

## Current Architecture Overview
Discussing **{self.project_name}** architecture:

### System Scale
- **Codebase Size**: {self.architecture['total_files']} files
- **Code Organization**: {self.architecture['total_functions']} functions, {self.architecture['total_classes']} classes
- **Technology Stack**: {', '.join(self.tech_stack) if self.tech_stack else 'Multi-language project'}"""

        if self.architecture['key_directories']:
            template += f"""

### Directory Structure
Key modules: {', '.join(self.architecture['key_directories'])}"""

        if self.patterns:
            template += f"""

### Current Patterns & Practices
"""
            for pattern, count in self.patterns.items():
                pattern_name = pattern.replace('_', ' ').title().replace('Mvc', 'MVC')
                template += f"- **{pattern_name}**: {count} implementations\\n"

        template += f"""

## Architecture Question
**{question}**

## What I Need
1. **Analysis** of the current architecture approach
2. **Best practices** for this type of {', '.join(self.tech_stack[:2]) if len(self.tech_stack) >= 2 else self.tech_stack[0] if self.tech_stack else 'system'}
3. **Specific recommendations** for improvement
4. **Implementation strategy** with concrete steps
5. **Trade-offs** and considerations

## Context
- This is a **production system** with {self.architecture['total_files']} files
- Need to **maintain existing functionality** 
- Consider **team maintainability** and **scalability**
- **Migration path** should be incremental if changes are needed

---
*Generated by Prompt Engineer Tool on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return template
    
    def generate_all_templates(self) -> Dict[str, str]:
        """Generate all common prompt templates."""
        return {
            'add_feature': self.generate_feature_prompt(),
            'debug_issue': self.generate_debug_prompt(), 
            'refactor_code': self.generate_refactor_prompt(),
            'write_tests': self.generate_test_prompt(),
            'architecture': self.generate_architecture_prompt()
        }

def load_context_from_file(file_path: str) -> Dict[str, Any]:
    """Load context data from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading context file: {e}")
        return {}

def main():
    """CLI interface for prompt generation."""
    if len(sys.argv) < 2:
        print("Usage: python prompt_templates.py <context_file.json> [template_type]")
        print("Template types: feature, debug, refactor, test, architecture, all")
        sys.exit(1)
    
    context_file = sys.argv[1]
    template_type = sys.argv[2] if len(sys.argv) > 2 else 'all'
    
    # Load context data
    context_data = load_context_from_file(context_file)
    if not context_data:
        print(f"Could not load context from {context_file}")
        sys.exit(1)
    
    # Generate prompts
    generator = PromptTemplateGenerator(context_data)
    
    if template_type == 'all':
        templates = generator.generate_all_templates()
        for name, template in templates.items():
            print(f"\\n{'='*60}")
            print(f"TEMPLATE: {name.upper()}")
            print('='*60)
            print(template)
    elif template_type == 'feature':
        print(generator.generate_feature_prompt())
    elif template_type == 'debug':
        print(generator.generate_debug_prompt())
    elif template_type == 'refactor':
        print(generator.generate_refactor_prompt())
    elif template_type == 'test':
        print(generator.generate_test_prompt())
    elif template_type == 'architecture':
        print(generator.generate_architecture_prompt())
    else:
        print(f"Unknown template type: {template_type}")
        print("Available types: feature, debug, refactor, test, architecture, all")

if __name__ == "__main__":
    main()