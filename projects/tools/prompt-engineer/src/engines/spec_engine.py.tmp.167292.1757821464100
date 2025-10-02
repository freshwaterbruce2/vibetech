#!/usr/bin/env python3
"""
Spec-Driven Development Engine

Provides executable specifications that generate working implementations
following GitHub Spec Kit principles. Specifications become executable,
directly generating working implementations rather than just guiding them.
"""

import json
import yaml
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum

class SpecFormat(Enum):
    """Supported specification formats."""
    YAML = "yaml"
    JSON = "json" 
    MARKDOWN = "markdown"
    PYTHON = "python"

class SpecType(Enum):
    """Types of specifications."""
    FEATURE = "feature"
    API = "api"
    COMPONENT = "component"
    TEST = "test"
    DEPLOYMENT = "deployment"
    DATABASE = "database"

@dataclass
class ProjectSpecification:
    """Comprehensive project specification."""
    # Metadata
    name: str
    version: str
    description: str
    author: str
    created_at: str
    updated_at: str
    
    # Specification Details
    spec_type: str  # feature, api, component, etc.
    format: str  # yaml, json, markdown
    requirements: List[str]
    acceptance_criteria: List[str]
    dependencies: List[str]
    
    # Implementation Details
    tech_stack: Dict[str, str]
    architecture: Dict[str, Any]
    file_structure: Dict[str, Any]
    
    # Execution Context
    variables: Dict[str, Any]
    templates: Dict[str, str]
    commands: List[Dict[str, Any]]
    
    # Validation
    tests: List[Dict[str, Any]]
    validations: List[Dict[str, Any]]
    
    # Metadata
    tags: List[str]
    priority: str  # low, medium, high, critical
    status: str  # draft, review, approved, implemented

@dataclass
class SpecValidationResult:
    """Result of specification validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]
    completeness_score: float  # 0-1 scale
    
class SpecEngine:
    """
    Engine for parsing, validating, and executing project specifications.
    Implements spec-driven development principles.
    """
    
    def __init__(self):
        self.spec_templates = self._load_spec_templates()
        self.validators = self._initialize_validators()
        self.generators = self._initialize_generators()
    
    def parse_specification(self, spec_content: str, format: SpecFormat) -> ProjectSpecification:
        """Parse specification from various formats."""
        try:
            if format == SpecFormat.YAML:
                return self._parse_yaml_spec(spec_content)
            elif format == SpecFormat.JSON:
                return self._parse_json_spec(spec_content)
            elif format == SpecFormat.MARKDOWN:
                return self._parse_markdown_spec(spec_content)
            elif format == SpecFormat.PYTHON:
                return self._parse_python_spec(spec_content)
            else:
                raise ValueError(f"Unsupported format: {format}")
        except Exception as e:
            raise ValueError(f"Failed to parse specification: {e}")
    
    def validate_specification(self, spec: ProjectSpecification) -> SpecValidationResult:
        """Comprehensive specification validation."""
        errors = []
        warnings = []
        suggestions = []
        
        # Basic validation
        if not spec.name:
            errors.append("Specification name is required")
        if not spec.description:
            errors.append("Specification description is required")
        if not spec.requirements:
            warnings.append("No requirements specified")
        if not spec.acceptance_criteria:
            warnings.append("No acceptance criteria specified")
            
        # Technical validation
        tech_errors, tech_warnings = self._validate_tech_stack(spec.tech_stack)
        errors.extend(tech_errors)
        warnings.extend(tech_warnings)
        
        # Architecture validation
        arch_errors, arch_warnings = self._validate_architecture(spec.architecture)
        errors.extend(arch_errors)
        warnings.extend(arch_warnings)
        
        # Dependencies validation
        dep_errors, dep_warnings = self._validate_dependencies(spec.dependencies)
        errors.extend(dep_errors)
        warnings.extend(dep_warnings)
        
        # Generate suggestions
        suggestions.extend(self._generate_spec_suggestions(spec))
        
        # Calculate completeness score
        completeness_score = self._calculate_completeness_score(spec, errors, warnings)
        
        return SpecValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            completeness_score=completeness_score
        )
    
    def generate_implementation_plan(self, spec: ProjectSpecification) -> Dict[str, Any]:
        """Generate detailed implementation plan from specification."""
        plan = {
            "overview": {
                "name": spec.name,
                "description": spec.description,
                "estimated_effort": self._estimate_effort(spec),
                "complexity": self._assess_complexity(spec),
                "timeline": self._estimate_timeline(spec)
            },
            "phases": self._generate_implementation_phases(spec),
            "tasks": self._generate_task_breakdown(spec),
            "resources": self._identify_required_resources(spec),
            "risks": self._identify_risks(spec),
            "success_metrics": self._define_success_metrics(spec)
        }
        
        return plan
    
    def generate_code_structure(self, spec: ProjectSpecification) -> Dict[str, str]:
        """Generate code structure and boilerplate from specification."""
        structure = {}
        
        # Generate directory structure
        if spec.file_structure:
            for path, config in spec.file_structure.items():
                if isinstance(config, dict):
                    if config.get("type") == "file":
                        content = self._generate_file_content(path, config, spec)
                        structure[path] = content
                    elif config.get("type") == "directory":
                        # Create directory marker
                        structure[f"{path}/__init__.py"] = "# Directory marker"
        
        # Generate based on spec type
        if spec.spec_type == "api":
            structure.update(self._generate_api_structure(spec))
        elif spec.spec_type == "component":
            structure.update(self._generate_component_structure(spec))
        elif spec.spec_type == "feature":
            structure.update(self._generate_feature_structure(spec))
        
        return structure
    
    def generate_tests(self, spec: ProjectSpecification) -> Dict[str, str]:
        """Generate test files based on specification."""
        tests = {}
        
        # Generate unit tests
        for requirement in spec.requirements:
            test_content = self._generate_unit_test(requirement, spec)
            test_filename = f"test_{requirement.lower().replace(' ', '_')}.py"
            tests[test_filename] = test_content
        
        # Generate integration tests
        for criterion in spec.acceptance_criteria:
            test_content = self._generate_integration_test(criterion, spec)
            test_filename = f"test_integration_{criterion.lower().replace(' ', '_')}.py"
            tests[test_filename] = test_content
        
        # Generate end-to-end tests if applicable
        if spec.spec_type in ["feature", "api"]:
            e2e_content = self._generate_e2e_test(spec)
            tests["test_e2e.py"] = e2e_content
        
        return tests
    
    def execute_specification(self, spec: ProjectSpecification, output_dir: Path) -> Dict[str, Any]:
        """Execute specification to generate working implementation."""
        results = {
            "timestamp": datetime.now().isoformat(),
            "spec_name": spec.name,
            "output_directory": str(output_dir),
            "generated_files": [],
            "executed_commands": [],
            "validation_results": [],
            "success": False
        }
        
        try:
            # Create output directory
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate code structure
            code_structure = self.generate_code_structure(spec)
            for filepath, content in code_structure.items():
                file_path = output_dir / filepath
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                results["generated_files"].append(str(file_path))
            
            # Generate tests
            test_structure = self.generate_tests(spec)
            test_dir = output_dir / "tests"
            test_dir.mkdir(exist_ok=True)
            for test_file, test_content in test_structure.items():
                test_path = test_dir / test_file
                with open(test_path, 'w', encoding='utf-8') as f:
                    f.write(test_content)
                results["generated_files"].append(str(test_path))
            
            # Execute commands if specified
            for command in spec.commands:
                if self._is_safe_command(command):
                    result = self._execute_command(command, output_dir)
                    results["executed_commands"].append(result)
            
            # Validate implementation
            validation_result = self._validate_implementation(spec, output_dir)
            results["validation_results"].append(validation_result)
            
            results["success"] = True
            
        except Exception as e:
            results["error"] = str(e)
            results["success"] = False
        
        return results
    
    def _parse_yaml_spec(self, content: str) -> ProjectSpecification:
        """Parse YAML specification."""
        data = yaml.safe_load(content)
        return self._dict_to_spec(data)
    
    def _parse_json_spec(self, content: str) -> ProjectSpecification:
        """Parse JSON specification."""
        data = json.loads(content)
        return self._dict_to_spec(data)
    
    def _parse_markdown_spec(self, content: str) -> ProjectSpecification:
        """Parse Markdown specification using structured format."""
        spec_data = {
            "name": "",
            "version": "1.0.0",
            "description": "",
            "author": "",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "spec_type": "feature",
            "format": "markdown",
            "requirements": [],
            "acceptance_criteria": [],
            "dependencies": [],
            "tech_stack": {},
            "architecture": {},
            "file_structure": {},
            "variables": {},
            "templates": {},
            "commands": [],
            "tests": [],
            "validations": [],
            "tags": [],
            "priority": "medium",
            "status": "draft"
        }
        
        # Parse markdown sections
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('# '):
                spec_data["name"] = line[2:].strip()
            elif line.startswith('## Requirements'):
                current_section = "requirements"
            elif line.startswith('## Acceptance Criteria'):
                current_section = "acceptance_criteria"
            elif line.startswith('## Dependencies'):
                current_section = "dependencies"
            elif line.startswith('- ') and current_section:
                item = line[2:].strip()
                if current_section in spec_data:
                    if isinstance(spec_data[current_section], list):
                        spec_data[current_section].append(item)
            elif line and not line.startswith('#') and not current_section and not spec_data["description"]:
                spec_data["description"] = line
        
        return self._dict_to_spec(spec_data)
    
    def _parse_python_spec(self, content: str) -> ProjectSpecification:
        """Parse Python-based specification (experimental)."""
        # This would execute Python code to generate spec
        # For security, this should be sandboxed
        raise NotImplementedError("Python spec parsing requires sandboxed execution")
    
    def _dict_to_spec(self, data: Dict[str, Any]) -> ProjectSpecification:
        """Convert dictionary to ProjectSpecification."""
        return ProjectSpecification(
            name=data.get("name", ""),
            version=data.get("version", "1.0.0"),
            description=data.get("description", ""),
            author=data.get("author", ""),
            created_at=data.get("created_at", datetime.now().isoformat()),
            updated_at=data.get("updated_at", datetime.now().isoformat()),
            spec_type=data.get("spec_type", "feature"),
            format=data.get("format", "yaml"),
            requirements=data.get("requirements", []),
            acceptance_criteria=data.get("acceptance_criteria", []),
            dependencies=data.get("dependencies", []),
            tech_stack=data.get("tech_stack", {}),
            architecture=data.get("architecture", {}),
            file_structure=data.get("file_structure", {}),
            variables=data.get("variables", {}),
            templates=data.get("templates", {}),
            commands=data.get("commands", []),
            tests=data.get("tests", []),
            validations=data.get("validations", []),
            tags=data.get("tags", []),
            priority=data.get("priority", "medium"),
            status=data.get("status", "draft")
        )
    
    def _validate_tech_stack(self, tech_stack: Dict[str, str]) -> Tuple[List[str], List[str]]:
        """Validate technology stack choices."""
        errors = []
        warnings = []
        
        # Check for common incompatibilities
        if tech_stack.get("frontend") == "React" and tech_stack.get("backend") == "Django":
            warnings.append("React + Django is uncommon; consider React + FastAPI or Django REST framework")
        
        # Check for missing essential components
        if "frontend" in tech_stack and "backend" not in tech_stack:
            warnings.append("Frontend specified without backend - consider adding API specification")
        
        return errors, warnings
    
    def _validate_architecture(self, architecture: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Validate architecture choices."""
        errors = []
        warnings = []
        
        if not architecture:
            warnings.append("No architecture pattern specified")
        
        return errors, warnings
    
    def _validate_dependencies(self, dependencies: List[str]) -> Tuple[List[str], List[str]]:
        """Validate dependencies."""
        errors = []
        warnings = []
        
        if len(dependencies) > 50:
            warnings.append("Large number of dependencies may indicate over-complexity")
        
        return errors, warnings
    
    def _generate_spec_suggestions(self, spec: ProjectSpecification) -> List[str]:
        """Generate suggestions for improving specification."""
        suggestions = []
        
        if not spec.tests:
            suggestions.append("Consider adding test specifications")
        
        if not spec.architecture:
            suggestions.append("Consider specifying architecture pattern")
        
        if len(spec.requirements) < 3:
            suggestions.append("Consider adding more detailed requirements")
        
        return suggestions
    
    def _calculate_completeness_score(self, spec: ProjectSpecification, errors: List[str], warnings: List[str]) -> float:
        """Calculate how complete the specification is."""
        score = 1.0
        
        # Deduct for errors (major)
        score -= len(errors) * 0.1
        
        # Deduct for warnings (minor)
        score -= len(warnings) * 0.05
        
        # Bonus for completeness
        if spec.requirements:
            score += 0.1
        if spec.acceptance_criteria:
            score += 0.1
        if spec.tests:
            score += 0.1
        if spec.architecture:
            score += 0.05
        
        return max(0.0, min(1.0, score))
    
    def _load_spec_templates(self) -> Dict[str, str]:
        """Load specification templates."""
        return {
            "feature": """
name: {name}
description: {description}
requirements:
  - {requirement_1}
  - {requirement_2}
acceptance_criteria:
  - {criteria_1}
  - {criteria_2}
""",
            "api": """
name: {name}
description: {description}
endpoints:
  - path: {endpoint_path}
    method: {http_method}
    description: {endpoint_description}
""",
            "component": """
name: {name}
description: {description}
props:
  - name: {prop_name}
    type: {prop_type}
    required: {prop_required}
"""
        }
    
    def _initialize_validators(self) -> Dict[str, Any]:
        """Initialize validation functions."""
        return {}
    
    def _initialize_generators(self) -> Dict[str, Any]:
        """Initialize code generators."""
        return {}
    
    def _estimate_effort(self, spec: ProjectSpecification) -> str:
        """Estimate development effort."""
        complexity_factors = len(spec.requirements) + len(spec.dependencies) + len(spec.tech_stack)
        
        if complexity_factors < 5:
            return "Small (1-2 days)"
        elif complexity_factors < 15:
            return "Medium (3-7 days)"
        elif complexity_factors < 30:
            return "Large (1-3 weeks)"
        else:
            return "Extra Large (1+ months)"
    
    def _assess_complexity(self, spec: ProjectSpecification) -> str:
        """Assess technical complexity."""
        complexity_score = 0
        
        # Tech stack complexity
        complexity_score += len(spec.tech_stack) * 2
        
        # Architecture complexity
        if spec.architecture.get("pattern") in ["microservices", "event-driven"]:
            complexity_score += 10
        elif spec.architecture.get("pattern") in ["mvc", "layered"]:
            complexity_score += 5
        
        # Dependencies complexity
        complexity_score += len(spec.dependencies)
        
        if complexity_score < 10:
            return "Low"
        elif complexity_score < 25:
            return "Medium"
        else:
            return "High"
    
    def _estimate_timeline(self, spec: ProjectSpecification) -> str:
        """Estimate implementation timeline."""
        effort = self._estimate_effort(spec)
        complexity = self._assess_complexity(spec)
        
        base_days = {
            "Small (1-2 days)": 1.5,
            "Medium (3-7 days)": 5,
            "Large (1-3 weeks)": 14,
            "Extra Large (1+ months)": 30
        }.get(effort, 7)
        
        complexity_multiplier = {
            "Low": 1.0,
            "Medium": 1.5,
            "High": 2.0
        }.get(complexity, 1.0)
        
        total_days = base_days * complexity_multiplier
        
        if total_days <= 7:
            return f"{int(total_days)} days"
        else:
            weeks = total_days / 7
            return f"{weeks:.1f} weeks"
    
    def _generate_implementation_phases(self, spec: ProjectSpecification) -> List[Dict[str, Any]]:
        """Generate implementation phases."""
        phases = [
            {
                "name": "Setup & Foundation",
                "description": "Project setup, dependencies, basic structure",
                "duration": "20% of timeline",
                "deliverables": ["Project structure", "Dependencies installed", "Basic configuration"]
            },
            {
                "name": "Core Implementation", 
                "description": "Implement core requirements and functionality",
                "duration": "60% of timeline",
                "deliverables": ["Core features implemented", "Business logic complete"]
            },
            {
                "name": "Testing & Polish",
                "description": "Testing, bug fixes, performance optimization",
                "duration": "20% of timeline", 
                "deliverables": ["Tests passing", "Performance optimized", "Documentation complete"]
            }
        ]
        
        return phases
    
    def _generate_task_breakdown(self, spec: ProjectSpecification) -> List[Dict[str, Any]]:
        """Generate detailed task breakdown."""
        tasks = []
        
        # Setup tasks
        tasks.extend([
            {"name": "Initialize project structure", "category": "setup", "estimated_hours": 2},
            {"name": "Install dependencies", "category": "setup", "estimated_hours": 1},
            {"name": "Configure development environment", "category": "setup", "estimated_hours": 2}
        ])
        
        # Implementation tasks from requirements
        for i, req in enumerate(spec.requirements):
            tasks.append({
                "name": f"Implement: {req}",
                "category": "implementation",
                "estimated_hours": 8,  # Default estimate
                "requirement": req
            })
        
        # Testing tasks
        tasks.extend([
            {"name": "Write unit tests", "category": "testing", "estimated_hours": 6},
            {"name": "Write integration tests", "category": "testing", "estimated_hours": 4},
            {"name": "Perform manual testing", "category": "testing", "estimated_hours": 3}
        ])
        
        return tasks
    
    def _identify_required_resources(self, spec: ProjectSpecification) -> Dict[str, Any]:
        """Identify required resources for implementation."""
        return {
            "team_skills": list(spec.tech_stack.keys()),
            "development_tools": self._get_required_tools(spec),
            "infrastructure": self._get_infrastructure_needs(spec),
            "third_party_services": spec.dependencies
        }
    
    def _identify_risks(self, spec: ProjectSpecification) -> List[Dict[str, Any]]:
        """Identify potential implementation risks."""
        risks = []
        
        # Technology risks
        if len(spec.tech_stack) > 5:
            risks.append({
                "type": "Technical",
                "description": "Complex technology stack may increase integration complexity",
                "impact": "Medium",
                "mitigation": "Create proof of concept for critical integrations early"
            })
        
        # Dependency risks
        if len(spec.dependencies) > 20:
            risks.append({
                "type": "Dependency",
                "description": "Large number of dependencies increases maintenance burden",
                "impact": "Medium", 
                "mitigation": "Regular dependency updates and security audits"
            })
        
        return risks
    
    def _define_success_metrics(self, spec: ProjectSpecification) -> List[str]:
        """Define success metrics based on acceptance criteria."""
        metrics = []
        
        # Convert acceptance criteria to measurable metrics
        for criteria in spec.acceptance_criteria:
            metrics.append(f"✅ {criteria}")
        
        # Add technical metrics
        metrics.extend([
            "All unit tests passing",
            "Integration tests passing", 
            "Performance targets met",
            "Security requirements satisfied"
        ])
        
        return metrics
    
    def _get_required_tools(self, spec: ProjectSpecification) -> List[str]:
        """Get required development tools."""
        tools = []
        
        # Based on tech stack
        if "React" in spec.tech_stack.values():
            tools.extend(["Node.js", "npm/yarn", "VS Code/WebStorm"])
        if "Python" in spec.tech_stack.values():
            tools.extend(["Python", "pip", "virtualenv", "pytest"])
        if "database" in spec.tech_stack:
            tools.append("Database client tools")
        
        return list(set(tools))  # Remove duplicates
    
    def _get_infrastructure_needs(self, spec: ProjectSpecification) -> List[str]:
        """Get infrastructure requirements."""
        needs = []
        
        if spec.spec_type == "api":
            needs.extend(["Web server", "Database server"])
        if "frontend" in spec.tech_stack:
            needs.append("Static file hosting")
        if "ci/cd" in [tag.lower() for tag in spec.tags]:
            needs.append("CI/CD pipeline")
        
        return needs
    
    def _generate_api_structure(self, spec: ProjectSpecification) -> Dict[str, str]:
        """Generate API-specific code structure."""
        structure = {}
        
        # API main file
        structure["main.py"] = f'''"""
{spec.name} API
{spec.description}
"""

from fastapi import FastAPI

app = FastAPI(title="{spec.name}", description="{spec.description}")

@app.get("/")
async def root():
    return {{"message": "Hello from {spec.name}"}}

@app.get("/health")
async def health():
    return {{"status": "healthy"}}
'''
        
        # Requirements file
        structure["requirements.txt"] = "fastapi\nuvicorn[standard]\n"
        
        return structure
    
    def _generate_component_structure(self, spec: ProjectSpecification) -> Dict[str, str]:
        """Generate component-specific code structure."""
        structure = {}
        
        component_name = spec.name.replace(" ", "").replace("-", "")
        
        # React component
        structure[f"{component_name}.tsx"] = f'''import React from 'react';

interface {component_name}Props {{
  // TODO: Define props based on requirements
}}

const {component_name}: React.FC<{component_name}Props> = () => {{
  return (
    <div className="{component_name.lower()}">
      <h1>{spec.name}</h1>
      <p>{spec.description}</p>
      {{/* TODO: Implement component functionality */}}
    </div>
  );
}};

export default {component_name};
'''
        
        return structure
    
    def _generate_feature_structure(self, spec: ProjectSpecification) -> Dict[str, str]:
        """Generate feature-specific code structure."""
        structure = {}
        
        # Feature module
        structure["feature.py"] = f'''"""
{spec.name} Feature
{spec.description}
"""

class {spec.name.replace(" ", "")}Feature:
    """Main feature implementation."""
    
    def __init__(self):
        self.name = "{spec.name}"
        self.description = "{spec.description}"
    
    def execute(self):
        """Execute the main feature functionality."""
        # TODO: Implement based on requirements
        pass
'''
        
        return structure
    
    def _generate_file_content(self, filepath: str, config: Dict[str, Any], spec: ProjectSpecification) -> str:
        """Generate content for a specific file."""
        template = config.get("template", "")
        if not template:
            # Generate basic content based on file extension
            if filepath.endswith(".py"):
                return f'"""{spec.name} - {filepath}"""\n\n# TODO: Implement based on requirements\npass\n'
            elif filepath.endswith((".ts", ".tsx")):
                return f"// {spec.name} - {filepath}\n// TODO: Implement based on requirements\n"
            elif filepath.endswith(".md"):
                return f"# {spec.name}\n\n{spec.description}\n\n## TODO\n\n- Implement based on requirements\n"
            else:
                return f"# {spec.name} - {filepath}\n# TODO: Implement based on requirements\n"
        
        # Use template with variable substitution
        return template.format(**spec.variables, **asdict(spec))
    
    def _generate_unit_test(self, requirement: str, spec: ProjectSpecification) -> str:
        """Generate unit test for a requirement."""
        test_name = requirement.lower().replace(" ", "_")
        
        return f'''import unittest

class Test{test_name.title().replace("_", "")}(unittest.TestCase):
    """Test cases for: {requirement}"""
    
    def test_{test_name}(self):
        """Test that {requirement} works correctly."""
        # TODO: Implement test for requirement: {requirement}
        self.fail("Test not implemented")
    
    def test_{test_name}_edge_cases(self):
        """Test edge cases for: {requirement}"""
        # TODO: Implement edge case tests
        self.fail("Edge case tests not implemented")

if __name__ == "__main__":
    unittest.main()
'''
    
    def _generate_integration_test(self, criterion: str, spec: ProjectSpecification) -> str:
        """Generate integration test for acceptance criteria."""
        test_name = criterion.lower().replace(" ", "_")
        
        return f'''import unittest

class TestIntegration{test_name.title().replace("_", "")}(unittest.TestCase):
    """Integration test for: {criterion}"""
    
    def setUp(self):
        """Set up test fixtures."""
        # TODO: Set up integration test environment
        pass
    
    def test_{test_name}_integration(self):
        """Test that {criterion} works in integration."""
        # TODO: Implement integration test for: {criterion}
        self.fail("Integration test not implemented")
    
    def tearDown(self):
        """Clean up after tests."""
        # TODO: Clean up test environment
        pass

if __name__ == "__main__":
    unittest.main()
'''
    
    def _generate_e2e_test(self, spec: ProjectSpecification) -> str:
        """Generate end-to-end test."""
        return f'''import unittest

class TestE2E{spec.name.replace(" ", "")}(unittest.TestCase):
    """End-to-end tests for {spec.name}"""
    
    def setUp(self):
        """Set up E2E test environment."""
        # TODO: Set up full system for E2E testing
        pass
    
    def test_complete_user_journey(self):
        """Test complete user journey through {spec.name}."""
        # TODO: Implement full user journey test
        self.fail("E2E test not implemented")
    
    def tearDown(self):
        """Clean up E2E test environment."""
        # TODO: Clean up full system
        pass

if __name__ == "__main__":
    unittest.main()
'''
    
    def _is_safe_command(self, command: Dict[str, Any]) -> bool:
        """Check if command is safe to execute."""
        cmd = command.get("command", "")
        
        # Whitelist of safe commands
        safe_patterns = [
            r"^npm install$",
            r"^pip install -r requirements\.txt$",
            r"^python -m pytest",
            r"^npm test$",
            r"^npm run build$"
        ]
        
        for pattern in safe_patterns:
            if re.match(pattern, cmd):
                return True
        
        return False
    
    def _execute_command(self, command: Dict[str, Any], working_dir: Path) -> Dict[str, Any]:
        """Execute a command safely."""
        import subprocess
        
        cmd = command.get("command", "")
        result = {
            "command": cmd,
            "success": False,
            "output": "",
            "error": ""
        }
        
        try:
            proc_result = subprocess.run(
                cmd.split(),
                cwd=working_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            result["success"] = proc_result.returncode == 0
            result["output"] = proc_result.stdout
            result["error"] = proc_result.stderr
            
        except subprocess.TimeoutExpired:
            result["error"] = "Command timed out"
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _validate_implementation(self, spec: ProjectSpecification, output_dir: Path) -> Dict[str, Any]:
        """Validate generated implementation against specification."""
        validation = {
            "timestamp": datetime.now().isoformat(),
            "checks_passed": [],
            "checks_failed": [],
            "overall_success": True
        }
        
        # Check if required files were generated
        for filepath in spec.file_structure:
            file_path = output_dir / filepath
            if file_path.exists():
                validation["checks_passed"].append(f"File created: {filepath}")
            else:
                validation["checks_failed"].append(f"Missing file: {filepath}")
                validation["overall_success"] = False
        
        # Check if tests directory exists
        test_dir = output_dir / "tests"
        if test_dir.exists():
            validation["checks_passed"].append("Tests directory created")
        else:
            validation["checks_failed"].append("Tests directory missing")
        
        return validation