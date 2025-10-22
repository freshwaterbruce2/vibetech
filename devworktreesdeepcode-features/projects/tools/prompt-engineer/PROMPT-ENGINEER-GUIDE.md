# Prompt Engineer - Usage Guide

This is a **PROMPT ENGINEERING TOOL** that analyzes any project and generates AI-optimized prompts for better interactions with Claude, ChatGPT, and other LLMs.

## 🎯 Purpose

Instead of writing generic prompts, this tool:
1. **Analyzes your target project** (any codebase)
2. **Extracts architectural context** (patterns, structure, tech stack)
3. **Generates ready-to-use prompts** with full context for AI assistants

## 🚀 Quick Start

### **Interactive UI (Easiest - Recommended)**
```powershell
# Windows - Double-click or run:
.\run_streamlit_ui.bat

# Or PowerShell:
.\run_streamlit_ui.ps1

# Or directly:
streamlit run streamlit_ui.py
```
Opens a user-friendly web interface with visual project selection, template cards, and one-click copying.

### **Command Line Interface**
```powershell
# Analyze any project and generate all prompt templates
python prompt_engineer.py "C:\dev\projects\active\kraken-python-bot-reviewer"

# Generate specific prompt type
python prompt_engineer.py "C:\dev\projects\active\kraken-python-bot-reviewer" --template feature

# For current directory
python prompt_engineer.py .
```

### **Available Prompt Templates**
- **`feature`** - Add new features with architectural context
- **`debug`** - Debug issues with codebase knowledge
- **`refactor`** - Refactor code following existing patterns
- **`test`** - Write tests matching project conventions
- **`architecture`** - Discuss architecture decisions
- **`all`** - Generate all templates (default)

## 📋 Complete Workflow

### **Step 1: Analyze Your Project**
```powershell
python prompt_engineer.py "C:\path\to\your\project" --template feature
```

### **Step 2: Get AI-Optimized Prompt**
The tool outputs a ready-to-use prompt like:
```
# Add New Feature: [DESCRIBE YOUR FEATURE]

## Project Context
I'm working on **kraken-python-bot-reviewer**, a project with the following architecture:

### Technology Stack
TypeScript, JavaScript, React, Node.js

### Project Structure
- **Total Files**: 55 files
- **Functions**: 207 functions  
- **Classes**: 28 classes
- **Key Directories**: components, services, tests, scripts

### Existing Patterns Found
- **MVC Patterns**: 55 instances
- **Test Files**: 12 instances
- **Configuration Files**: 5 instances

## Feature Request
I need to implement: **[YOUR FEATURE HERE]**

## Requirements
Please provide code that:
1. **Follows existing patterns** found in the codebase
2. **Integrates cleanly** with the current React/TypeScript architecture
3. **Matches the coding style** of the existing codebase
4. **Includes appropriate error handling** and logging
5. **Follows the project's testing patterns** with Vitest

[... more context ...]
```

### **Step 3: Use with AI**
1. **Copy the generated prompt**
2. **Replace `[YOUR FEATURE HERE]` with your specific request**
3. **Paste into Claude/ChatGPT**
4. **Get contextually-aware responses!**

## 💡 Why This Works Better

### **Without Prompt Engineer:**
```
"Add a login feature to my app"
```
*AI has no context about your tech stack, patterns, or architecture*

### **With Prompt Engineer:**
```
"I'm working on a React/TypeScript project with 55 components following MVC patterns, 
using Vitest for testing, with analytics service and database layers. 
I need to add a login feature that integrates with the existing architecture..."
```
*AI understands your full context and provides relevant solutions*

## 🛠 All Available Tools

### **Interactive Streamlit UI (Recommended)**
- **`streamlit_ui.py`** - Modern web interface with visual controls
- **`run_streamlit_ui.bat`** - Windows batch launcher (double-click)
- **`run_streamlit_ui.ps1`** - PowerShell launcher with dependency checking

### **Command Line Interface**
- **`prompt_engineer.py`** - Full analysis + prompt generation

### **Basic Web UI** 
- **`python run_ui.py`** - Simple browser interface
- **`start_ui.bat`** - Double-click launcher

### **Context Only** (if you just want analysis)
- **`basic_collect.py`** - Simple context collection
- **`context_collect.py`** - Architectural analysis

### **Manual Template Generation**
- **`prompt_templates.py context_file.json feature`** - Generate from saved context

## 📊 Example Outputs

### **For Feature Development:**
- Full architectural context
- Existing patterns to follow
- Integration guidelines
- Testing requirements

### **For Debugging:**
- Codebase overview
- Relevant modules and entry points
- Debugging strategy suggestions
- Testing approaches

### **For Refactoring:**
- Current patterns to maintain
- Architecture constraints
- Compatibility requirements
- Impact analysis guidance

## 🎯 Best Practices

1. **Run on your target project** (not this tool itself)
2. **Use specific templates** for focused prompts
3. **Replace placeholders** with your actual requirements
4. **Save context files** for repeated use
5. **Update prompts** as your project evolves

## 🔧 Options

```powershell
# Basic usage
python prompt_engineer.py /path/to/project

# Specific template
python prompt_engineer.py /path/to/project --template debug

# Limit files analyzed (for large projects)
python prompt_engineer.py /path/to/project --max-files 200

# Skip saving context file
python prompt_engineer.py /path/to/project --no-save

# Help
python prompt_engineer.py --help
```

---

**This tool transforms generic AI interactions into context-aware conversations that understand your specific codebase, architecture, and development patterns.**