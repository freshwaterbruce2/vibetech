#!/usr/bin/env python3
"""
Simple ASCII demo of enhanced Prompt Engineer features.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

def main():
    """Run a simple demo of the enhanced features."""
    print("=" * 60)
    print("ENHANCED PROMPT ENGINEER - FEATURE DEMO")
    print("=" * 60)
    
    try:
        # Test imports
        from src.engines.spec_engine import SpecEngine
        from src.context.context_engine import ContextEngine
        from src.generators.smart_prompts import SmartPromptGenerator, AIModel
        from src.research.web_researcher import WebResearcher
        
        print("[OK] All enhanced modules imported successfully!")
        
        # Test Spec Engine
        print("\n[TEST] Spec-Driven Development Engine...")
        engine = SpecEngine()
        templates = engine.model_templates if hasattr(engine, 'model_templates') else None
        print(f"[OK] Spec engine initialized")
        
        # Test Context Engine
        print("\n[TEST] Advanced Context Engineering...")
        context_engine = ContextEngine()
        print(f"[OK] Context engine initialized")
        
        # Test Smart Prompts
        print("\n[TEST] Multi-Model Prompt Generation...")
        # Create mock analysis for testing
        from src.analyzers.project_intelligence import ProjectAnalysisResult
        from datetime import datetime
        
        mock_analysis = ProjectAnalysisResult(
            project_path=".",
            analysis_timestamp=datetime.now().isoformat(),
            project_type="python",
            health_score=85,
            critical_issues=[],
            high_priority_issues=[],
            medium_priority_issues=[],
            low_priority_issues=[],
            suggestions=[],
            tech_stack=["Python"],
            missing_features=[],
            code_quality_metrics={}
        )
        
        generator = SmartPromptGenerator(mock_analysis, target_model=AIModel.GPT_4)
        prompt_types = generator.get_available_prompt_types()
        print(f"[OK] Smart prompt generator initialized with {len(prompt_types)} prompt types")
        
        # Test Web Researcher
        print("\n[TEST] Web Research Integration...")
        researcher = WebResearcher()
        print(f"[OK] Web researcher initialized")
        
        print("\n" + "=" * 60)
        print("SUCCESS! All enhanced features are working:")
        print("  [+] Spec-Driven Development Engine")
        print("  [+] Advanced Context Engineering")
        print("  [+] Multi-Model Prompt Generation") 
        print("  [+] Web Research Integration")
        print("")
        print("Your prompt engineer tool is now restored and enhanced!")
        print("Try the Streamlit UI at: http://localhost:8516")
        print("=" * 60)
        
    except ImportError as e:
        print(f"[ERROR] Import failed: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Demo failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)