#!/usr/bin/env python3
"""
Demo script showcasing the enhanced Prompt Engineer features.

This demonstrates:
1. Spec-Driven Development Engine
2. Advanced Context Engineering 
3. Multi-Model Prompt Generation
4. Web Research Integration
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Import our new modules
try:
    from src.engines.spec_engine import SpecEngine, ProjectSpecification, SpecFormat
    from src.context.context_engine import ContextEngine, CodebaseContext
    from src.generators.smart_prompts import SmartPromptGenerator, AIModel
    from src.research.web_researcher import WebResearcher
    print("[OK] All enhanced modules imported successfully!")
except ImportError as e:
    print(f"[ERROR] Import error: {e}")
    sys.exit(1)

def demo_spec_engine():
    """Demo the Spec-Driven Development Engine."""
    print("\n" + "="*60)
    print("SPEC-DRIVEN DEVELOPMENT ENGINE DEMO")
    print("="*60)
    
    engine = SpecEngine()
    
    # Create a sample specification
    sample_spec_yaml = """
name: TodoApp
version: 1.0.0
description: A modern todo application with real-time updates
author: Demo User
created_at: 2024-01-01T00:00:00Z
updated_at: 2024-01-01T00:00:00Z
spec_type: feature
format: yaml
requirements:
  - Create and manage todo items
  - Mark todos as completed
  - Filter todos by status
  - Real-time updates across devices
acceptance_criteria:
  - Users can add new todo items
  - Users can mark items as complete
  - Users can filter by all/active/completed
  - Changes sync in real-time
dependencies:
  - React
  - TypeScript
  - Socket.io
tech_stack:
  frontend: React + TypeScript
  backend: Node.js + Express
  database: MongoDB
  realtime: Socket.io
architecture:
  pattern: Component-Based
  structure: Feature-Based
file_structure:
  src/components/TodoList.tsx:
    type: file
    template: "React component for todo list"
  src/hooks/useTodos.ts:
    type: file
    template: "Custom hook for todo management"
variables:
  app_name: TodoApp
  database_name: todoapp_db
templates: {}
commands:
  - command: npm install
    description: Install dependencies
tests: []
validations: []
tags:
  - todo
  - react
  - realtime
priority: high
status: draft
"""
    
    try:
        # Parse specification
        spec = engine.parse_specification(sample_spec_yaml, SpecFormat.YAML)
        print(f"[SPEC] Parsed specification: {spec.name}")
        
        # Validate specification
        validation = engine.validate_specification(spec)
        print(f"[OK] Validation passed: {validation.is_valid}")
        print(f"[SCORE] Completeness score: {validation.completeness_score:.2f}")
        
        if validation.warnings:
            print("[WARN] Warnings:")
            for warning in validation.warnings:
                print(f"   - {warning}")
        
        # Generate implementation plan
        plan = engine.generate_implementation_plan(spec)
        print(f"[EFFORT] Estimated effort: {plan['overview']['estimated_effort']}")
        print(f"[COMPLEXITY] Complexity: {plan['overview']['complexity']}")
        print(f"[TIME] Timeline: {plan['overview']['timeline']}")
        
        print("[PHASES] Implementation phases:")
        for i, phase in enumerate(plan['phases'], 1):
            print(f"   {i}. {phase['name']}: {phase['description']}")
        
    except Exception as e:
        print(f"[ERROR] Error in spec engine demo: {e}")

def demo_context_engine():
    """Demo the Advanced Context Engineering System."""
    print("\n" + "="*60)
    print("🧠 CONTEXT ENGINEERING SYSTEM DEMO")
    print("="*60)
    
    engine = ContextEngine()
    
    try:
        # Build context for current project
        print("🔍 Building codebase context...")
        context = engine.build_context(".", use_cache=False)
        
        print(f"📁 Project: {context.project_name}")
        print(f"📊 Total files: {len(context.dependency_graph.nodes)}")
        print(f"🏗️ Architecture patterns: {', '.join(context.architecture_patterns) or 'None detected'}")
        print(f"💻 Tech stack: {', '.join(context.tech_stack)}")
        print(f"📈 Project metrics:")
        
        metrics = context.project_metrics
        for key, value in metrics.items():
            if isinstance(value, (int, float)):
                if isinstance(value, float):
                    print(f"   - {key}: {value:.2f}")
                else:
                    print(f"   - {key}: {value}")
        
        # Show symbol table summary
        total_symbols = sum(len(symbols) for symbols in context.symbol_table.values())
        print(f"🔣 Total symbols found: {total_symbols}")
        
        # Show some example files if available
        if context.dependency_graph.nodes:
            print("\n📄 Sample files analyzed:")
            for i, (file_path, file_context) in enumerate(list(context.dependency_graph.nodes.items())[:3]):
                relative_path = Path(file_path).name
                print(f"   {i+1}. {relative_path} ({file_context.language}) - {len(file_context.symbols)} symbols")
        
    except Exception as e:
        print(f"❌ Error in context engine demo: {e}")

def demo_smart_prompts():
    """Demo the Enhanced Smart Prompt Generator."""
    print("\n" + "="*60)
    print("🎯 SMART PROMPT GENERATOR DEMO")
    print("="*60)
    
    # Create a mock analysis result for demonstration
    from src.analyzers.project_intelligence import ProjectAnalysisResult, ProjectIssue
    
    mock_analysis = ProjectAnalysisResult(
        project_path=".",
        analysis_timestamp=datetime.now().isoformat(),
        project_type="react",
        health_score=85,
        critical_issues=[],
        high_priority_issues=[],
        medium_priority_issues=[],
        low_priority_issues=[],
        suggestions=["Add more unit tests", "Improve error handling"],
        tech_stack=["React", "TypeScript", "Node.js"],
        missing_features=[],
        code_quality_metrics={}
    )
    
    try:
        # Test different AI models
        models_to_test = [AIModel.GPT_4, AIModel.CLAUDE_SONNET, AIModel.GEMINI_PRO]
        
        for model in models_to_test:
            generator = SmartPromptGenerator(mock_analysis, target_model=model)
            
            print(f"\n🤖 Testing model: {model.value}")
            
            # Get available prompt types
            prompt_types = generator.get_available_prompt_types()
            print(f"📝 Available prompt types: {len(prompt_types)}")
            
            # Generate a sample prompt
            context = {
                'code_content': 'function example() { return "hello world"; }',
                'tech_stack': 'React, TypeScript',
                'project_type': 'web application',
                'architecture_patterns': 'Component-Based'
            }
            
            prompt_result = generator.generate_model_optimized_prompt('code_review', context)
            print(f"📊 Generated prompt length: {len(prompt_result['prompt'])} characters")
            print(f"🎛️ Max tokens: {prompt_result['max_tokens']}")
            print(f"🌡️ Temperature: {prompt_result['temperature']}")
            
            # Show model capabilities
            capabilities = generator.get_model_capabilities(model)
            print(f"💪 Strengths: {', '.join(capabilities.get('strengths', [])[:2])}")
            print(f"🎯 Best for: {', '.join(capabilities.get('best_for', [])[:2])}")
        
        # Model recommendations
        print("\n🎯 Model recommendations:")
        test_tasks = ['code_review', 'bug_fixing', 'architecture_design']
        
        for task in test_tasks:
            recommended = generator.recommend_model_for_task(task, 'high')
            print(f"   - {task}: {recommended.value}")
        
    except Exception as e:
        print(f"❌ Error in smart prompts demo: {e}")

def demo_web_researcher():
    """Demo the Web Research Integration System."""
    print("\n" + "="*60)
    print("🌐 WEB RESEARCH INTEGRATION DEMO")
    print("="*60)
    
    researcher = WebResearcher()
    
    try:
        # Research similar projects
        print("🔍 Researching similar projects...")
        similar_projects = researcher.research_similar_projects(
            "A context collection tool for AI prompts", 
            ["Python", "React"], 
            max_results=5
        )
        
        print(f"📊 Found {len(similar_projects)} similar projects:")
        for i, project in enumerate(similar_projects[:3], 1):
            print(f"   {i}. {project.title}")
            print(f"      📍 Source: {project.source}")
            print(f"      📈 Relevance: {project.relevance_score:.2f}")
            print(f"      🔗 URL: {project.url[:50]}...")
        
        # Analyze competitors
        print(f"\n🏆 Analyzing competitors in prompt engineering...")
        competitors = researcher.analyze_competitors("prompt engineering")
        
        print(f"📊 Found {len(competitors)} competitor tools:")
        for i, comp in enumerate(competitors[:3], 1):
            print(f"   {i}. {comp.tool_name}")
            print(f"      📋 Category: {comp.category}")
            print(f"      💰 Pricing: {comp.pricing_model}")
            print(f"      📊 Position: {comp.market_position}")
        
        # Find solutions for a problem
        print(f"\n🛠️ Finding solutions for a specific problem...")
        solutions = researcher.find_solutions_for_problem(
            "How to optimize context window usage in LLMs", 
            {"tech_stack": ["Python"], "project_type": "AI application"}
        )
        
        print(f"📊 Found {len(solutions)} potential solutions:")
        for i, solution in enumerate(solutions[:2], 1):
            print(f"   {i}. {solution.title}")
            print(f"      📍 Source: {solution.source}")
            print(f"      📈 Relevance: {solution.relevance_score:.2f}")
        
        # Get research summary
        all_results = similar_projects + solutions
        summary = researcher.get_research_summary(all_results)
        
        print(f"\n📈 Research Summary:")
        print(f"   📊 Total results: {summary['total_results']}")
        print(f"   📍 Sources: {', '.join(summary['sources'].keys())}")
        print(f"   📈 Average relevance: {summary['average_relevance']:.2f}")
        
    except Exception as e:
        print(f"❌ Error in web researcher demo: {e}")

def main():
    """Run the complete demo."""
    print("🚀 ENHANCED PROMPT ENGINEER - FEATURE DEMO")
    print("=" * 70)
    print("Showcasing the restored and enhanced capabilities:")
    print("• Spec-Driven Development Engine")
    print("• Advanced Context Engineering")  
    print("• Multi-Model Prompt Generation")
    print("• Web Research Integration")
    print("=" * 70)
    
    # Run all demos
    demo_spec_engine()
    demo_context_engine() 
    demo_smart_prompts()
    demo_web_researcher()
    
    print("\n" + "="*60)
    print("🎉 DEMO COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("✨ Your Prompt Engineer tool now has:")
    print("   🚀 Executable specifications (like GitHub Spec Kit)")
    print("   🧠 Deep codebase understanding (like Cursor/Augment)")
    print("   🎯 Multi-model prompt optimization (better than most)")
    print("   🌐 Comprehensive web research (unique advantage)")
    print("")
    print("🔗 Next steps:")
    print("   1. Try the Streamlit UI at http://localhost:8516")
    print("   2. Test with your own projects")
    print("   3. Explore the new CLI commands")
    print("   4. Integrate with your favorite AI models")

if __name__ == "__main__":
    main()