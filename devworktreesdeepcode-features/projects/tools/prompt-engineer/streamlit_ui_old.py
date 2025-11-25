#!/usr/bin/env python3
"""
Streamlit UI for the Prompt Engineer Tool

A simple, interactive interface for generating AI-optimized prompts from project analysis.
"""

import sys
import os
import json
import streamlit as st
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, List

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

try:
    from collectors import CodeScanner
    from prompt_templates import PromptTemplateGenerator
    from analyzers import ProjectIntelligenceAnalyzer
    from generators import SmartPromptGenerator
    from wizards import NewProjectWizard
except ImportError as e:
    st.error(f"Import error: {e}")
    st.stop()

# Page configuration
st.set_page_config(
    page_title="Prompt Engineer",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
.template-card {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ddd;
    margin: 0.5rem 0;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.template-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.template-card.selected {
    border-color: #ff6b6b;
    background-color: #fff5f5;
}

.copy-button {
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.copy-button:hover {
    background-color: #45a049;
}
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'analyzed_projects' not in st.session_state:
    st.session_state.analyzed_projects = []
if 'current_context' not in st.session_state:
    st.session_state.current_context = None
if 'generated_prompts' not in st.session_state:
    st.session_state.generated_prompts = {}
if 'recent_projects' not in st.session_state:
    st.session_state.recent_projects = []
if 'analysis_result' not in st.session_state:
    st.session_state.analysis_result = None
if 'project_mode' not in st.session_state:
    st.session_state.project_mode = 'existing'  # 'existing' or 'new'
if 'new_project_requirements' not in st.session_state:
    st.session_state.new_project_requirements = None

def load_recent_projects() -> List[str]:
    """Load recent projects from file."""
    try:
        recent_file = Path('recent_projects.json')
        if recent_file.exists():
            with open(recent_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return []

def save_recent_projects(projects: List[str]):
    """Save recent projects to file."""
    try:
        with open('recent_projects.json', 'w', encoding='utf-8') as f:
            json.dump(projects[-10:], f)  # Keep only last 10
    except Exception:
        pass

def add_to_recent(project_path: str):
    """Add project to recent list."""
    if project_path in st.session_state.recent_projects:
        st.session_state.recent_projects.remove(project_path)
    st.session_state.recent_projects.insert(0, project_path)
    st.session_state.recent_projects = st.session_state.recent_projects[:10]
    save_recent_projects(st.session_state.recent_projects)

def analyze_project(project_path: str, max_files: int) -> Optional[Dict]:
    """Analyze project and return context data."""
    try:
        project_path_obj = Path(project_path).resolve()
        
        if not project_path_obj.exists():
            st.error(f"Path does not exist: {project_path}")
            return None
        
        # Show progress
        with st.spinner(f'Analyzing project structure...'):
            context_data = {
                'collection_info': {
                    'timestamp': datetime.now().isoformat(),
                    'base_path': str(project_path_obj),
                    'purpose': 'prompt_engineering',
                    'max_files': max_files
                },
                'code_structure': {},
                'architectural_context': {},
                'development_patterns': {}
            }
            
            # Code analysis
            scanner = CodeScanner()
            scan_results = scanner.scan_directory(
                directory=str(project_path_obj),
                recursive=True,
                max_files=max_files
            )
            
            # Extract key information
            context_data['code_structure'] = {
                'summary': scan_results['summary'],
                'file_count': len(scan_results['files'])
            }
            
            # Simple pattern analysis
            patterns = analyze_simple_patterns(scan_results)
            context_data['architectural_context'] = patterns
            
            # Development context
            dev_context = analyze_development_structure(project_path_obj)
            context_data['development_patterns'] = dev_context
            
            return context_data
            
    except Exception as e:
        st.error(f"Analysis failed: {e}")
        return None

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
        
        if any(keyword in path for keyword in ['test', 'spec']):
            patterns['test_files']['count'] += 1
        
        if any(keyword in path for keyword in ['config', 'settings', '.env']):
            patterns['configuration_files']['count'] += 1
        
        if any(keyword in path for keyword in ['component', 'view', 'controller', 'model', 'service']):
            patterns['mvc_patterns']['count'] += 1
        
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
                dir_type = classify_directory(item.name)
                key_dirs.append({'name': item.name, 'type': dir_type})
        
        context['key_directories'] = key_dirs[:10]
        
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
        pass
    
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

# Main UI
def main():
    """Main Streamlit UI with Intelligent Analysis."""
    
    # Title and description
    st.title("🤖 Prompt Engineer")
    st.markdown("**Intelligent AI-optimized prompts from deep project analysis**")
    
    # Load recent projects on startup
    if not st.session_state.recent_projects:
        st.session_state.recent_projects = load_recent_projects()
    
    # Project mode selection
    st.markdown("---")
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("📁 Analyze Existing Project", type="primary", use_container_width=True):
            st.session_state.project_mode = 'existing'
            st.rerun()
    
    with col2:
        if st.button("🆕 Start New Project", type="secondary", use_container_width=True):
            st.session_state.project_mode = 'new'
            st.rerun()
    
    # Display appropriate UI based on mode
    if st.session_state.project_mode == 'new':
        show_new_project_wizard()
    else:
        show_existing_project_analyzer()

def show_existing_project_analyzer():
    """Show the existing project analysis interface."""
    st.header("📁 Existing Project Analysis")
    st.markdown("Get intelligent insights and specific prompts for your current project.")
    
    # Sidebar for project selection
    with st.sidebar:
        st.header("📁 Project Selection")
        
        # Recent projects dropdown
        if st.session_state.recent_projects:
            st.subheader("Recent Projects")
            selected_recent = st.selectbox(
                "Choose from recent:",
                [""] + st.session_state.recent_projects,
                key="recent_dropdown"
            )
            if selected_recent:
                st.session_state.project_path = selected_recent
        
        # Manual path input
        project_path = st.text_input(
            "Project Path:",
            value=getattr(st.session_state, 'project_path', ''),
            placeholder="C:\\dev\\projects\\my-project",
            help="Enter the full path to your project directory"
        )
        
        # Analysis options
        st.subheader("⚙️ Options")
        max_files = st.slider(
            "Max Files to Analyze:",
            min_value=10,
            max_value=500,
            value=100,
            step=10,
            help="Limit the number of files to analyze (for large projects)"
        )
        
        save_context = st.checkbox(
            "Save Context File",
            value=True,
            help="Save the analysis context as a JSON file"
        )
        
        # Analyze button
        analyze_button = st.button(
            "🔍 Analyze Project",
            type="primary",
            use_container_width=True
        )
    
    # Main content area
    if analyze_button and project_path:
        # Analyze the project
        context_data = analyze_project(project_path, max_files)
        
        if context_data:
            st.session_state.current_context = context_data
            add_to_recent(project_path)
            
            # Save context file if requested
            if save_context:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                project_name = Path(project_path).name
                context_file = f"context_{project_name}_{timestamp}.json"
                
                with open(context_file, 'w', encoding='utf-8') as f:
                    json.dump(context_data, f, indent=2, ensure_ascii=False)
                
                st.success(f"✅ Context saved to: `{context_file}`")
    
    # Template selection and generation
    if st.session_state.current_context:
        context = st.session_state.current_context
        project_name = Path(context['collection_info']['base_path']).name
        file_count = context['code_structure'].get('file_count', 0)
        
        st.success(f"✅ Analyzed **{project_name}** ({file_count} files)")
        
        # Template selection
        st.header("📝 Template Selection")
        st.markdown("Choose the type of prompt you want to generate:")
        
        # Template cards in columns
        col1, col2, col3 = st.columns(3)
        col4, col5 = st.columns(2)
        
        templates = {
            'feature': {
                'title': '🚀 Add Feature',
                'description': 'Generate prompts for adding new features',
                'col': col1
            },
            'debug': {
                'title': '🔧 Debug Issue', 
                'description': 'Generate prompts for debugging problems',
                'col': col2
            },
            'refactor': {
                'title': '♻️ Refactor Code',
                'description': 'Generate prompts for code refactoring',
                'col': col3
            },
            'test': {
                'title': '🧪 Write Tests',
                'description': 'Generate prompts for writing tests',
                'col': col4
            },
            'architecture': {
                'title': '🏗️ Architecture',
                'description': 'Generate prompts for architecture discussions',
                'col': col5
            }
        }
        
        selected_templates = []
        
        # Template cards
        for template_key, template_info in templates.items():
            with template_info['col']:
                if st.button(
                    f"{template_info['title']}\n{template_info['description']}",
                    key=f"btn_{template_key}",
                    use_container_width=True
                ):
                    selected_templates.append(template_key)
        
        # Generate all templates button
        if st.button("📋 Generate All Templates", type="secondary"):
            selected_templates = list(templates.keys())
        
        # Generate prompts
        if selected_templates:
            with st.spinner('Generating prompts...'):
                generator = PromptTemplateGenerator(context)
                
                prompts = {}
                for template_type in selected_templates:
                    if template_type == 'feature':
                        prompts['Add Feature'] = generator.generate_feature_prompt()
                    elif template_type == 'debug':
                        prompts['Debug Issue'] = generator.generate_debug_prompt()
                    elif template_type == 'refactor':
                        prompts['Refactor Code'] = generator.generate_refactor_prompt()
                    elif template_type == 'test':
                        prompts['Write Tests'] = generator.generate_test_prompt()
                    elif template_type == 'architecture':
                        prompts['Architecture'] = generator.generate_architecture_prompt()
                
                st.session_state.generated_prompts = prompts
        
        # Display generated prompts
        if st.session_state.generated_prompts:
            st.header("📄 Generated Prompts")
            
            for prompt_name, prompt_content in st.session_state.generated_prompts.items():
                with st.expander(f"📝 {prompt_name} Prompt", expanded=True):
                    st.code(prompt_content, language="markdown")
                    
                    # Copy to clipboard button (uses Streamlit's built-in functionality)
                    if st.button(f"📋 Copy {prompt_name} Prompt", key=f"copy_{prompt_name}"):
                        # Store in session state for potential use
                        st.session_state[f'copied_prompt_{prompt_name}'] = prompt_content
                        st.success(f"✅ {prompt_name} prompt copied! Paste it into your AI assistant.")

    else:
        # Welcome message
        st.markdown("""
        ### Welcome to Prompt Engineer! 🚀
        
        This tool analyzes your project and generates contextually-aware prompts for AI assistants like Claude or ChatGPT.
        
        **How it works:**
        1. 📁 Select your project directory in the sidebar
        2. 🔍 Click "Analyze Project" to scan your codebase
        3. 📝 Choose which type of prompt to generate
        4. 📋 Copy the generated prompt and paste into your AI assistant
        
        **Benefits:**
        - Get AI responses that understand your specific architecture
        - Follow existing patterns and conventions in your codebase
        - Receive relevant suggestions for your tech stack
        - Save time with pre-contextualized prompts
        """)
        
        # Example projects section
        st.markdown("### 💡 Example Usage")
        st.code("""
        # Example project paths:
        C:\\dev\\projects\\my-react-app
        C:\\dev\\projects\\python-trading-bot
        C:\\Users\\username\\Documents\\my-project
        """)

if __name__ == "__main__":
    main()