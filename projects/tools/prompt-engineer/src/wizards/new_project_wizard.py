#!/usr/bin/env python3
"""
New Project Context Wizard

Comprehensive context gathering for new projects to ensure AI assistants
have all the information needed to provide excellent guidance and code generation.
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

@dataclass
class ProjectRequirements:
    """Comprehensive project requirements gathered from the wizard."""
    # Basic Info
    name: str
    description: str
    goals: List[str]
    target_users: List[str]
    success_metrics: List[str]
    
    # Technical Requirements
    project_type: str  # 'web_app', 'mobile_app', 'api', 'desktop_app', 'library', 'cli_tool'
    tech_stack: Dict[str, str]  # {'frontend': 'React', 'backend': 'FastAPI', etc.}
    architecture_pattern: str  # 'MVC', 'microservices', 'serverless', etc.
    database_needs: Dict[str, Any]
    api_integrations: List[str]
    performance_targets: Dict[str, str]
    security_requirements: List[str]
    
    # Development Constraints
    timeline: str
    team_size: int
    team_skills: List[str]
    budget_constraints: str
    deployment_environment: str
    
    # Reference & Learning
    similar_projects: List[str]
    inspiration_sources: List[str]
    avoid_patterns: List[str]
    
    # Generated Context
    timestamp: str
    recommended_architecture: Optional[str] = None
    suggested_tools: Optional[List[str]] = None

class NewProjectWizard:
    """
    Interactive wizard for gathering comprehensive project context.
    """
    
    def __init__(self):
        self.project_types = {
            'web_app': {
                'name': 'Web Application',
                'description': 'Interactive web application with frontend and backend',
                'common_stacks': {
                    'Modern React': {'frontend': 'React + TypeScript', 'backend': 'Node.js/FastAPI', 'database': 'PostgreSQL'},
                    'Full-stack JS': {'frontend': 'Next.js', 'backend': 'Node.js', 'database': 'MongoDB'},
                    'Traditional': {'frontend': 'HTML/CSS/JS', 'backend': 'Python Flask', 'database': 'SQLite'}
                }
            },
            'mobile_app': {
                'name': 'Mobile Application',
                'description': 'Mobile app for iOS/Android',
                'common_stacks': {
                    'React Native': {'framework': 'React Native', 'language': 'TypeScript', 'backend': 'Firebase'},
                    'Flutter': {'framework': 'Flutter', 'language': 'Dart', 'backend': 'Firebase/Supabase'},
                    'Native': {'ios': 'Swift', 'android': 'Kotlin', 'backend': 'REST API'}
                }
            },
            'api': {
                'name': 'API Service',
                'description': 'Backend API or microservice',
                'common_stacks': {
                    'FastAPI': {'framework': 'FastAPI', 'language': 'Python', 'database': 'PostgreSQL'},
                    'Express.js': {'framework': 'Express.js', 'language': 'TypeScript', 'database': 'MongoDB'},
                    'Spring Boot': {'framework': 'Spring Boot', 'language': 'Java', 'database': 'MySQL'}
                }
            },
            'desktop_app': {
                'name': 'Desktop Application',
                'description': 'Desktop application for Windows/Mac/Linux',
                'common_stacks': {
                    'Electron': {'framework': 'Electron', 'frontend': 'React', 'language': 'TypeScript'},
                    'Python GUI': {'framework': 'PyQt/Tkinter', 'language': 'Python'},
                    'Native': {'windows': 'C# WPF', 'mac': 'Swift', 'linux': 'C++ Qt'}
                }
            },
            'library': {
                'name': 'Library/Package',
                'description': 'Reusable library or package for other developers',
                'common_stacks': {
                    'NPM Package': {'language': 'TypeScript', 'build': 'Rollup/Webpack', 'testing': 'Jest'},
                    'Python Package': {'language': 'Python', 'build': 'setuptools', 'testing': 'pytest'},
                    'Go Module': {'language': 'Go', 'testing': 'go test'}
                }
            },
            'cli_tool': {
                'name': 'Command Line Tool',
                'description': 'Command-line interface tool or utility',
                'common_stacks': {
                    'Python CLI': {'language': 'Python', 'framework': 'Click/Typer', 'packaging': 'PyInstaller'},
                    'Node CLI': {'language': 'TypeScript', 'framework': 'Commander.js', 'packaging': 'pkg'},
                    'Go CLI': {'language': 'Go', 'framework': 'Cobra', 'build': 'native binary'}
                }
            }
        }
    
    def generate_project_specification_prompt(self, requirements: ProjectRequirements) -> str:
        """
        Generate a comprehensive project specification prompt based on gathered requirements.
        """
        
        prompt = f"""# Create {requirements.name} - Complete Project Specification

## Project Overview
**Name**: {requirements.name}
**Type**: {requirements.project_type.replace('_', ' ').title()}
**Description**: {requirements.description}

### Project Goals
{self._format_list(requirements.goals)}

### Target Users
{self._format_list(requirements.target_users)}

### Success Metrics
{self._format_list(requirements.success_metrics)}

## Technical Architecture

### Technology Stack
{self._format_tech_stack(requirements.tech_stack)}

### Architecture Pattern
**Recommended**: {requirements.architecture_pattern}
{self._get_architecture_rationale(requirements.architecture_pattern, requirements.project_type)}

### Database Design
{self._format_database_requirements(requirements.database_needs)}

### API Integrations
{self._format_list(requirements.api_integrations) if requirements.api_integrations else "No external API integrations required"}

## Performance & Quality Requirements

### Performance Targets
{self._format_dict(requirements.performance_targets)}

### Security Requirements
{self._format_list(requirements.security_requirements)}

## Development Constraints & Context

### Timeline & Resources
- **Timeline**: {requirements.timeline}
- **Team Size**: {requirements.team_size} developer(s)
- **Team Skills**: {', '.join(requirements.team_skills)}
- **Budget**: {requirements.budget_constraints}
- **Deployment**: {requirements.deployment_environment}

### Reference Projects
{self._format_reference_projects(requirements.similar_projects, requirements.inspiration_sources)}

### Anti-patterns to Avoid
{self._format_list(requirements.avoid_patterns) if requirements.avoid_patterns else "No specific patterns to avoid specified"}

## Implementation Plan

### Phase 1: Foundation Setup (Week 1-2)
{self._generate_foundation_tasks(requirements)}

### Phase 2: Core Features (Week 3-6)
{self._generate_core_feature_tasks(requirements)}

### Phase 3: Integration & Polish (Week 7-8)
{self._generate_integration_tasks(requirements)}

### Phase 4: Testing & Deployment (Week 9-10)
{self._generate_deployment_tasks(requirements)}

## Detailed Technical Specifications

### Project Structure
{self._recommend_project_structure(requirements)}

### Key Components
{self._identify_key_components(requirements)}

### Data Flow & Architecture
{self._describe_data_flow(requirements)}

## Development Guidelines

### Coding Standards
{self._recommend_coding_standards(requirements.tech_stack)}

### Testing Strategy
{self._recommend_testing_strategy(requirements)}

### Documentation Requirements
{self._recommend_documentation(requirements)}

## Risk Management

### Technical Risks
{self._identify_technical_risks(requirements)}

### Mitigation Strategies
{self._recommend_risk_mitigation(requirements)}

## Next Steps

### Immediate Actions
1. **Set up development environment** with recommended tools
2. **Create project repository** with initial structure
3. **Set up CI/CD pipeline** for automated testing and deployment
4. **Create development roadmap** with detailed milestones
5. **Set up project management** tools and communication channels

### Long-term Considerations
- **Scalability planning** for future growth
- **Performance monitoring** and optimization
- **Security auditing** and compliance
- **User feedback** collection and iteration

---
*This comprehensive specification provides all the context needed for AI-assisted development. Use this as your foundation prompt when working with AI assistants on this project.*

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**Context Wizard Version**: 1.0
"""
        
        return prompt
    
    def create_requirements_from_streamlit_input(self, form_data: Dict[str, Any]) -> ProjectRequirements:
        """Create ProjectRequirements from Streamlit form data."""
        return ProjectRequirements(
            name=form_data.get('name', 'Untitled Project'),
            description=form_data.get('description', ''),
            goals=form_data.get('goals', []),
            target_users=form_data.get('target_users', []),
            success_metrics=form_data.get('success_metrics', []),
            
            project_type=form_data.get('project_type', 'web_app'),
            tech_stack=form_data.get('tech_stack', {}),
            architecture_pattern=form_data.get('architecture_pattern', 'MVC'),
            database_needs=form_data.get('database_needs', {}),
            api_integrations=form_data.get('api_integrations', []),
            performance_targets=form_data.get('performance_targets', {}),
            security_requirements=form_data.get('security_requirements', []),
            
            timeline=form_data.get('timeline', ''),
            team_size=form_data.get('team_size', 1),
            team_skills=form_data.get('team_skills', []),
            budget_constraints=form_data.get('budget_constraints', ''),
            deployment_environment=form_data.get('deployment_environment', ''),
            
            similar_projects=form_data.get('similar_projects', []),
            inspiration_sources=form_data.get('inspiration_sources', []),
            avoid_patterns=form_data.get('avoid_patterns', []),
            
            timestamp=datetime.now().isoformat()
        )
    
    def get_project_types(self) -> Dict[str, Dict[str, Any]]:
        """Get available project types for UI selection."""
        return self.project_types
    
    def get_tech_stack_recommendations(self, project_type: str) -> Dict[str, Dict[str, str]]:
        """Get recommended tech stacks for a project type."""
        return self.project_types.get(project_type, {}).get('common_stacks', {})
    
    def _format_list(self, items: List[str]) -> str:
        """Format a list for markdown output."""
        if not items:
            return "- Not specified"
        return "\n".join(f"- {item}" for item in items)
    
    def _format_dict(self, items: Dict[str, str]) -> str:
        """Format a dictionary for markdown output."""
        if not items:
            return "- Not specified"
        return "\n".join(f"- **{key}**: {value}" for key, value in items.items())
    
    def _format_tech_stack(self, tech_stack: Dict[str, str]) -> str:
        """Format technology stack information."""
        if not tech_stack:
            return "- Technology stack to be determined"
        
        formatted = []
        for component, technology in tech_stack.items():
            formatted.append(f"- **{component.title()}**: {technology}")
        
        return "\n".join(formatted)
    
    def _format_database_requirements(self, db_needs: Dict[str, Any]) -> str:
        """Format database requirements."""
        if not db_needs:
            return "Database requirements to be determined based on data complexity and scale."
        
        formatted = []
        for aspect, requirement in db_needs.items():
            formatted.append(f"- **{aspect.title()}**: {requirement}")
        
        return "\n".join(formatted)
    
    def _format_reference_projects(self, similar: List[str], inspiration: List[str]) -> str:
        """Format reference projects."""
        sections = []
        
        if similar:
            sections.append("**Similar Projects:**")
            sections.extend(f"- {project}" for project in similar)
        
        if inspiration:
            sections.append("**Inspiration Sources:**")
            sections.extend(f"- {source}" for source in inspiration)
        
        return "\n".join(sections) if sections else "No reference projects specified"
    
    def _get_architecture_rationale(self, pattern: str, project_type: str) -> str:
        """Get rationale for architecture choice."""
        rationales = {
            'MVC': f"MVC pattern provides clear separation of concerns, making the {project_type} maintainable and testable.",
            'microservices': "Microservices architecture enables independent scaling and deployment of different system components.",
            'serverless': "Serverless architecture reduces operational overhead and provides automatic scaling.",
            'component-based': "Component-based architecture promotes reusability and maintainability of UI elements.",
            'layered': "Layered architecture provides clear abstraction levels and separation of technical concerns."
        }
        
        return rationales.get(pattern, f"{pattern} architecture chosen based on project requirements.")
    
    def _generate_foundation_tasks(self, requirements: ProjectRequirements) -> str:
        """Generate foundation setup tasks."""
        tasks = [
            "Set up version control (Git) with proper .gitignore",
            "Initialize project with recommended directory structure",
            "Configure development environment and dependencies",
            "Set up linting, formatting, and code quality tools",
            "Create basic CI/CD pipeline configuration"
        ]
        
        # Add project-type specific tasks
        if 'React' in str(requirements.tech_stack.values()):
            tasks.append("Configure React development environment with TypeScript")
            tasks.append("Set up component library and styling system")
        
        if 'database' in str(requirements.database_needs).lower():
            tasks.append("Design and set up database schema")
            tasks.append("Configure database connection and ORM/query layer")
        
        return "\n".join(f"- {task}" for task in tasks)
    
    def _generate_core_feature_tasks(self, requirements: ProjectRequirements) -> str:
        """Generate core feature implementation tasks."""
        tasks = [
            "Implement core business logic and data models",
            "Create main user interfaces and user flows",
            "Set up authentication and authorization (if required)",
            "Implement API endpoints and data access layer",
            "Add input validation and error handling"
        ]
        
        # Add project-specific features based on goals
        for goal in requirements.goals:
            if any(keyword in goal.lower() for keyword in ['user', 'login', 'auth']):
                tasks.append(f"Implement user management features: {goal}")
            elif any(keyword in goal.lower() for keyword in ['data', 'analytics', 'report']):
                tasks.append(f"Build data processing capabilities: {goal}")
        
        return "\n".join(f"- {task}" for task in tasks)
    
    def _generate_integration_tasks(self, requirements: ProjectRequirements) -> str:
        """Generate integration and polish tasks."""
        tasks = [
            "Integrate all components and test system workflows",
            "Implement error boundaries and recovery mechanisms",
            "Add logging, monitoring, and debugging capabilities",
            "Optimize performance based on target metrics",
            "Conduct security review and implement hardening"
        ]
        
        # Add API integration tasks
        for integration in requirements.api_integrations:
            tasks.append(f"Integrate with {integration} API")
        
        return "\n".join(f"- {task}" for task in tasks)
    
    def _generate_deployment_tasks(self, requirements: ProjectRequirements) -> str:
        """Generate testing and deployment tasks."""
        tasks = [
            "Complete comprehensive testing (unit, integration, e2e)",
            "Set up production environment and deployment pipeline",
            "Configure monitoring and alerting in production",
            "Create user documentation and deployment guides",
            "Conduct final security and performance audits"
        ]
        
        # Add environment-specific tasks
        if 'cloud' in requirements.deployment_environment.lower():
            tasks.append("Configure cloud infrastructure and auto-scaling")
        
        if 'mobile' in requirements.project_type:
            tasks.append("Submit to app stores and configure distribution")
        
        return "\n".join(f"- {task}" for task in tasks)
    
    def _recommend_project_structure(self, requirements: ProjectRequirements) -> str:
        """Recommend project directory structure."""
        structures = {
            'web_app': """
```
project/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── services/      # API and business logic
│   ├── utils/         # Helper functions
│   └── types/         # TypeScript definitions
├── public/            # Static assets
├── tests/             # Test files
└── docs/              # Documentation
```""",
            'api': """
```
project/
├── src/
│   ├── routes/        # API endpoints
│   ├── models/        # Data models
│   ├── services/      # Business logic
│   ├── middleware/    # Request/response middleware
│   └── utils/         # Helper functions
├── tests/             # Test files
├── docs/              # API documentation
└── config/            # Configuration files
```""",
            'mobile_app': """
```
project/
├── src/
│   ├── components/    # Reusable components
│   ├── screens/       # Screen components
│   ├── navigation/    # Navigation setup
│   ├── services/      # API and business logic
│   └── utils/         # Helper functions
├── assets/            # Images, fonts, etc.
├── tests/             # Test files
└── docs/              # Documentation
```"""
        }
        
        return structures.get(requirements.project_type, "Standard project structure with src/, tests/, and docs/ directories")
    
    def _identify_key_components(self, requirements: ProjectRequirements) -> str:
        """Identify key components based on requirements."""
        components = []
        
        # Base components for all projects
        components.extend([
            "**Core Business Logic**: Main functionality and data processing",
            "**Data Layer**: Database models and data access patterns",
            "**API Layer**: Request/response handling and validation",
            "**Error Handling**: Comprehensive error management and logging"
        ])
        
        # Add UI components for frontend projects
        if requirements.project_type in ['web_app', 'mobile_app', 'desktop_app']:
            components.extend([
                "**User Interface**: Main UI components and layouts",
                "**State Management**: Application state and data flow",
                "**Routing**: Navigation and URL handling"
            ])
        
        # Add authentication if mentioned in goals
        if any('auth' in goal.lower() or 'user' in goal.lower() for goal in requirements.goals):
            components.append("**Authentication**: User management and authorization")
        
        return "\n".join(f"- {comp}" for comp in components)
    
    def _describe_data_flow(self, requirements: ProjectRequirements) -> str:
        """Describe the data flow architecture."""
        flows = {
            'web_app': "Client → API Layer → Business Logic → Database → Response Chain",
            'mobile_app': "Mobile App → API Gateway → Services → Database → Push Notifications",
            'api': "Client Request → Middleware → Controller → Service → Database → Response",
            'desktop_app': "UI Components → Application Logic → Local/Remote Data → User Interface Update"
        }
        
        base_flow = flows.get(requirements.project_type, "Input → Processing → Storage → Output")
        
        return f"""
**Primary Flow**: {base_flow}

**Key Considerations**:
- Implement proper validation at each layer
- Use consistent error handling throughout the flow
- Add logging and monitoring at critical points
- Consider caching strategies for performance optimization
"""
    
    def _recommend_coding_standards(self, tech_stack: Dict[str, str]) -> str:
        """Recommend coding standards based on tech stack."""
        standards = []
        
        # Check for common technologies
        stack_str = str(tech_stack.values()).lower()
        
        if 'typescript' in stack_str or 'javascript' in stack_str:
            standards.extend([
                "Use ESLint and Prettier for consistent code formatting",
                "Follow TypeScript strict mode for type safety",
                "Use meaningful variable and function names",
                "Implement comprehensive error handling with try-catch blocks"
            ])
        
        if 'python' in stack_str:
            standards.extend([
                "Follow PEP 8 style guidelines",
                "Use type hints for function parameters and return values",
                "Implement comprehensive docstrings for all public functions",
                "Use virtual environments for dependency management"
            ])
        
        if 'react' in stack_str:
            standards.extend([
                "Use functional components with hooks",
                "Implement proper prop types and interfaces",
                "Follow component composition patterns",
                "Use meaningful component and hook names"
            ])
        
        if not standards:
            standards = [
                "Follow language-specific best practices and style guides",
                "Implement consistent naming conventions",
                "Use proper error handling and logging",
                "Write self-documenting code with clear comments"
            ]
        
        return "\n".join(f"- {standard}" for standard in standards)
    
    def _recommend_testing_strategy(self, requirements: ProjectRequirements) -> str:
        """Recommend testing strategy based on project type."""
        strategies = {
            'web_app': [
                "**Unit Tests**: Test individual components and functions",
                "**Integration Tests**: Test API endpoints and database interactions",
                "**Component Tests**: Test React components with user interactions",
                "**E2E Tests**: Test complete user workflows with Cypress/Playwright"
            ],
            'mobile_app': [
                "**Unit Tests**: Test business logic and utility functions",
                "**Component Tests**: Test individual screen components",
                "**Integration Tests**: Test API interactions and data flow",
                "**Device Tests**: Test on multiple devices and screen sizes"
            ],
            'api': [
                "**Unit Tests**: Test individual functions and business logic",
                "**Integration Tests**: Test API endpoints and database operations",
                "**Contract Tests**: Test API contracts with consumers",
                "**Load Tests**: Test performance under expected traffic"
            ]
        }
        
        project_strategies = strategies.get(requirements.project_type, [
            "**Unit Tests**: Test individual functions and components",
            "**Integration Tests**: Test component interactions",
            "**System Tests**: Test complete functionality end-to-end"
        ])
        
        return "\n".join(project_strategies)
    
    def _recommend_documentation(self, requirements: ProjectRequirements) -> str:
        """Recommend documentation based on project requirements."""
        docs = [
            "**README**: Project overview, setup, and usage instructions",
            "**API Documentation**: Comprehensive API reference (if applicable)",
            "**Development Guide**: Local setup and contribution guidelines",
            "**Deployment Guide**: Production deployment instructions"
        ]
        
        # Add project-specific documentation
        if requirements.project_type == 'library':
            docs.extend([
                "**Code Examples**: Usage examples and common patterns",
                "**Migration Guide**: Version upgrade instructions"
            ])
        
        if len(requirements.team_skills) > 1:
            docs.append("**Architecture Decision Records**: Document major technical decisions")
        
        return "\n".join(f"- {doc}" for doc in docs)
    
    def _identify_technical_risks(self, requirements: ProjectRequirements) -> str:
        """Identify potential technical risks."""
        risks = []
        
        # Timeline-based risks
        if 'week' in requirements.timeline.lower() and int(''.join(filter(str.isdigit, requirements.timeline)) or '12') < 8:
            risks.append("**Aggressive Timeline**: Risk of technical debt due to time pressure")
        
        # Team size risks
        if requirements.team_size == 1:
            risks.append("**Single Developer**: Risk of knowledge silos and bottlenecks")
        elif requirements.team_size > 5:
            risks.append("**Large Team**: Risk of coordination and integration issues")
        
        # Technology risks
        if 'new' in str(requirements.tech_stack.values()).lower():
            risks.append("**New Technology**: Learning curve and potential stability issues")
        
        # Integration risks
        if len(requirements.api_integrations) > 3:
            risks.append("**Multiple Integrations**: Risk of external dependency failures")
        
        if not risks:
            risks = ["**Standard Risks**: Scope creep, changing requirements, technical complexity"]
        
        return "\n".join(f"- {risk}" for risk in risks)
    
    def _recommend_risk_mitigation(self, requirements: ProjectRequirements) -> str:
        """Recommend risk mitigation strategies."""
        strategies = [
            "**Iterative Development**: Use agile methodology with regular reviews",
            "**Comprehensive Testing**: Implement automated testing at all levels",
            "**Documentation**: Maintain up-to-date technical documentation",
            "**Monitoring**: Implement proper logging and error tracking",
            "**Backup Plans**: Have fallback options for critical dependencies"
        ]
        
        # Add project-specific strategies
        if requirements.team_size == 1:
            strategies.append("**Knowledge Sharing**: Document all major decisions and patterns")
        
        if len(requirements.api_integrations) > 2:
            strategies.append("**API Fallbacks**: Implement graceful degradation for external services")
        
        return "\n".join(f"- {strategy}" for strategy in strategies)
    
    def save_requirements(self, requirements: ProjectRequirements, filename: str = None) -> str:
        """Save project requirements to JSON file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"project_requirements_{requirements.name.lower().replace(' ', '_')}_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(asdict(requirements), f, indent=2, ensure_ascii=False)
        
        return filename