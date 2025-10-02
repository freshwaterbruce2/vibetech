"""
Mock data generators for comprehensive testing scenarios.

Provides realistic test data for:
- Code files in multiple languages
- Git repository structures
- Database records
- User interaction scenarios
- Edge cases and error conditions
"""

import random
import string
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Generator
from dataclasses import dataclass, asdict
from collections import defaultdict

from collectors.code_scanner import CodeFile
from collectors.git_analyzer import CommitInfo


@dataclass
class MockProject:
    """Mock project data structure."""
    name: str
    description: str
    language: str
    framework: Optional[str]
    files: List[Dict[str, Any]]
    dependencies: List[str]
    size_mb: float
    created_date: datetime
    last_modified: datetime


class MockDataGenerator:
    """
    Generates realistic mock data for testing purposes.
    
    Provides consistent, reproducible test data that covers:
    - Multiple programming languages
    - Various project types and sizes
    - Realistic file structures
    - Git history patterns
    - Database records
    """
    
    def __init__(self, seed: int = 42):
        """Initialize generator with optional seed for reproducibility."""
        random.seed(seed)
        self.seed = seed
    
    # Programming language templates
    LANGUAGE_TEMPLATES = {
        'python': {
            'extensions': ['.py', '.pyx', '.pyi'],
            'keywords': ['def', 'class', 'import', 'from', 'if', 'else', 'for', 'while', 'try', 'except'],
            'common_imports': ['os', 'sys', 'json', 'datetime', 'pathlib', 'typing', 'requests', 'pandas'],
            'frameworks': ['django', 'flask', 'fastapi', 'pytest', 'tensorflow', 'pytorch']
        },
        'javascript': {
            'extensions': ['.js', '.mjs', '.jsx'],
            'keywords': ['function', 'const', 'let', 'var', 'class', 'if', 'else', 'for', 'while', 'try', 'catch'],
            'common_imports': ['react', 'express', 'lodash', 'axios', 'moment', 'uuid'],
            'frameworks': ['react', 'vue', 'angular', 'express', 'node', 'jest']
        },
        'typescript': {
            'extensions': ['.ts', '.tsx', '.d.ts'],
            'keywords': ['interface', 'type', 'class', 'function', 'const', 'let', 'export', 'import'],
            'common_imports': ['react', '@types/node', 'express', 'typescript'],
            'frameworks': ['angular', 'nest', 'next', 'react', 'vue']
        },
        'java': {
            'extensions': ['.java'],
            'keywords': ['public', 'private', 'class', 'interface', 'extends', 'implements', 'static', 'final'],
            'common_imports': ['java.util', 'java.io', 'java.lang', 'org.springframework'],
            'frameworks': ['spring', 'hibernate', 'junit', 'maven', 'gradle']
        },
        'csharp': {
            'extensions': ['.cs'],
            'keywords': ['public', 'private', 'class', 'interface', 'namespace', 'using', 'static'],
            'common_imports': ['System', 'System.Collections.Generic', 'System.Linq', 'Microsoft.Extensions'],
            'frameworks': ['dotnet', 'asp.net', 'entity-framework', 'xunit', 'nunit']
        }
    }
    
    # Common project types
    PROJECT_TYPES = {
        'web-app': {
            'languages': ['javascript', 'typescript', 'python'],
            'typical_files': ['index', 'app', 'main', 'server', 'config'],
            'directories': ['src', 'public', 'assets', 'components', 'pages', 'api']
        },
        'desktop-app': {
            'languages': ['python', 'java', 'csharp'],
            'typical_files': ['main', 'app', 'window', 'controller', 'model'],
            'directories': ['src', 'resources', 'assets', 'views', 'models']
        },
        'library': {
            'languages': ['python', 'javascript', 'typescript', 'java'],
            'typical_files': ['index', 'main', 'core', 'utils', 'helpers'],
            'directories': ['src', 'lib', 'utils', 'types', 'docs']
        },
        'cli-tool': {
            'languages': ['python', 'javascript', 'java'],
            'typical_files': ['cli', 'main', 'command', 'parser', 'config'],
            'directories': ['src', 'commands', 'utils', 'config']
        }
    }
    
    def generate_random_string(self, length: int = 10, charset: str = None) -> str:
        """Generate random string of specified length."""
        if charset is None:
            charset = string.ascii_letters + string.digits
        return ''.join(random.choices(charset, k=length))
    
    def generate_project_name(self) -> str:
        """Generate realistic project name."""
        adjectives = [
            'awesome', 'smart', 'quick', 'modern', 'simple', 'advanced', 'efficient',
            'robust', 'elegant', 'powerful', 'flexible', 'scalable', 'secure'
        ]
        nouns = [
            'app', 'tool', 'service', 'platform', 'system', 'framework', 'library',
            'manager', 'builder', 'parser', 'analyzer', 'processor', 'generator',
            'dashboard', 'portal', 'client', 'server', 'api', 'bot', 'scanner'
        ]
        
        if random.random() < 0.7:  # 70% compound names
            return f"{random.choice(adjectives)}-{random.choice(nouns)}"
        else:  # 30% single names with suffix
            suffix = random.choice(['js', 'py', 'app', 'lib', 'cli', 'web'])
            return f"{random.choice(nouns)}-{suffix}"
    
    def generate_author_name(self) -> str:
        """Generate realistic developer name."""
        first_names = [
            'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Avery', 'Riley', 'Cameron',
            'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Emily', 'James',
            'Jessica', 'Christopher', 'Ashley', 'Daniel', 'Amanda', 'Matthew', 'Melissa',
            'Wei', 'Rajesh', 'Fatima', 'Hans', 'Olga', 'Hiroshi', 'Priya', 'Carlos'
        ]
        last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
            'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Wang', 'Singh', 'Kumar', 'Chen', 'Liu', 'Zhang', 'Patel',
            'Mueller', 'Schmidt', 'Rossi', 'Russo', 'Nakamura', 'Yamamoto'
        ]
        
        return f"{random.choice(first_names)} {random.choice(last_names)}"
    
    def generate_commit_message(self) -> str:
        """Generate realistic commit message."""
        prefixes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']
        actions = [
            'add', 'update', 'remove', 'fix', 'improve', 'optimize', 'refactor',
            'implement', 'create', 'delete', 'modify', 'enhance', 'cleanup'
        ]
        subjects = [
            'user authentication', 'API endpoints', 'database queries', 'error handling',
            'performance issues', 'security vulnerabilities', 'unit tests', 'documentation',
            'configuration files', 'logging system', 'cache mechanism', 'validation logic',
            'UI components', 'routing system', 'data models', 'helper functions'
        ]
        
        if random.random() < 0.3:  # 30% conventional commits
            prefix = random.choice(prefixes)
            action = random.choice(actions)
            subject = random.choice(subjects)
            return f"{prefix}: {action} {subject}"
        else:  # 70% simple commits
            action = random.choice(actions).capitalize()
            subject = random.choice(subjects)
            return f"{action} {subject}"
    
    def generate_file_content(self, language: str, file_type: str = 'module') -> str:
        """Generate realistic file content for specified language."""
        template = self.LANGUAGE_TEMPLATES.get(language, self.LANGUAGE_TEMPLATES['python'])
        
        if language == 'python':
            return self._generate_python_content(file_type)
        elif language in ['javascript', 'typescript']:
            return self._generate_js_ts_content(language, file_type)
        elif language == 'java':
            return self._generate_java_content(file_type)
        elif language == 'csharp':
            return self._generate_csharp_content(file_type)
        else:
            return f"// Generated {language} file\n// File type: {file_type}\n"
    
    def _generate_python_content(self, file_type: str) -> str:
        """Generate Python file content."""
        if file_type == 'module':
            imports = random.sample(
                self.LANGUAGE_TEMPLATES['python']['common_imports'], 
                random.randint(2, 5)
            )
            
            content = '"""\nGenerated Python module for testing.\n"""\n\n'
            
            # Add imports
            for imp in imports:
                content += f"import {imp}\n"
            content += "\n"
            
            # Add classes
            for _ in range(random.randint(1, 3)):
                class_name = f"Test{self.generate_random_string(8).capitalize()}"
                content += f"class {class_name}:\n"
                content += f'    """Test class for {class_name}."""\n\n'
                content += f"    def __init__(self):\n"
                content += f"        self.data = []\n\n"
                
                # Add methods
                for _ in range(random.randint(2, 5)):
                    method_name = f"process_{self.generate_random_string(6)}"
                    content += f"    def {method_name}(self, param):\n"
                    content += f'        """Process {method_name}."""\n'
                    content += f"        return param * 2\n\n"
            
            # Add functions
            for _ in range(random.randint(2, 4)):
                func_name = f"helper_{self.generate_random_string(6)}"
                content += f"def {func_name}(data):\n"
                content += f'    """Helper function {func_name}."""\n'
                content += f"    return len(data)\n\n"
            
            return content
        
        elif file_type == 'test':
            content = '"""\nUnit tests for testing.\n"""\n\n'
            content += "import unittest\nimport pytest\n\n"
            
            test_class = f"Test{self.generate_random_string(8).capitalize()}"
            content += f"class {test_class}(unittest.TestCase):\n"
            content += f'    """Test cases for {test_class}."""\n\n'
            
            for _ in range(random.randint(3, 6)):
                test_name = f"test_{self.generate_random_string(8)}"
                content += f"    def {test_name}(self):\n"
                content += f'        """Test {test_name}."""\n'
                content += f"        self.assertEqual(1, 1)\n\n"
            
            return content
        
        return "# Generated Python file\nprint('Hello World')\n"
    
    def _generate_js_ts_content(self, language: str, file_type: str) -> str:
        """Generate JavaScript/TypeScript content."""
        is_ts = language == 'typescript'
        
        if file_type == 'module':
            imports = random.sample(
                self.LANGUAGE_TEMPLATES[language]['common_imports'],
                random.randint(2, 4)
            )
            
            content = "/**\n * Generated module for testing.\n */\n\n"
            
            # Add imports
            for imp in imports:
                if random.random() < 0.5:
                    content += f"import {imp} from '{imp}';\n"
                else:
                    content += f"import {{ {imp.capitalize()}Component }} from '{imp}';\n"
            content += "\n"
            
            # Add interfaces (TypeScript)
            if is_ts:
                interface_name = f"Test{self.generate_random_string(8).capitalize()}"
                content += f"interface {interface_name} {{\n"
                content += f"  id: string;\n"
                content += f"  name: string;\n"
                content += f"  data?: any[];\n"
                content += f"}}\n\n"
            
            # Add class
            class_name = f"Test{self.generate_random_string(8).capitalize()}"
            content += f"class {class_name} {{\n"
            
            if is_ts:
                content += f"  private data: {interface_name}[];\n\n"
            
            content += f"  constructor() {{\n"
            content += f"    this.data = [];\n"
            content += f"  }}\n\n"
            
            # Add methods
            for _ in range(random.randint(2, 4)):
                method_name = f"process{self.generate_random_string(6).capitalize()}"
                param_type = ": any" if is_ts else ""
                return_type = ": any" if is_ts else ""
                
                content += f"  {method_name}(param{param_type}){return_type} {{\n"
                content += f"    return param;\n"
                content += f"  }}\n\n"
            
            content += "}\n\n"
            content += f"export default {class_name};\n"
            
            return content
        
        elif file_type == 'test':
            content = "/**\n * Test file for testing.\n */\n\n"
            content += "import { describe, it, expect } from '@jest/globals';\n\n"
            
            describe_name = f"Test{self.generate_random_string(8).capitalize()}"
            content += f"describe('{describe_name}', () => {{\n"
            
            for _ in range(random.randint(3, 5)):
                test_name = f"should {self.generate_random_string(8)}"
                content += f"  it('{test_name}', () => {{\n"
                content += f"    expect(1).toBe(1);\n"
                content += f"  }});\n\n"
            
            content += "});\n"
            return content
        
        return "// Generated JavaScript file\nconsole.log('Hello World');\n"
    
    def _generate_java_content(self, file_type: str) -> str:
        """Generate Java content."""
        package_name = f"com.example.{self.generate_random_string(6).lower()}"
        class_name = f"Test{self.generate_random_string(8).capitalize()}"
        
        content = f"package {package_name};\n\n"
        content += "import java.util.*;\nimport java.io.*;\n\n"
        content += "/**\n * Generated Java class for testing.\n */\n"
        content += f"public class {class_name} {{\n"
        content += f"    private List<String> data;\n\n"
        content += f"    public {class_name}() {{\n"
        content += f"        this.data = new ArrayList<>();\n"
        content += f"    }}\n\n"
        
        # Add methods
        for _ in range(random.randint(2, 4)):
            method_name = f"process{self.generate_random_string(6).capitalize()}"
            content += f"    public String {method_name}(String input) {{\n"
            content += f"        return input.toUpperCase();\n"
            content += f"    }}\n\n"
        
        content += "}\n"
        return content
    
    def _generate_csharp_content(self, file_type: str) -> str:
        """Generate C# content."""
        namespace_name = f"TestNamespace.{self.generate_random_string(8).capitalize()}"
        class_name = f"Test{self.generate_random_string(8).capitalize()}"
        
        content = "using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\n"
        content += f"namespace {namespace_name}\n{{\n"
        content += f"    /// <summary>\n"
        content += f"    /// Generated C# class for testing.\n"
        content += f"    /// </summary>\n"
        content += f"    public class {class_name}\n    {{\n"
        content += f"        private List<string> data;\n\n"
        content += f"        public {class_name}()\n        {{\n"
        content += f"            data = new List<string>();\n"
        content += f"        }}\n\n"
        
        # Add methods
        for _ in range(random.randint(2, 4)):
            method_name = f"Process{self.generate_random_string(6).capitalize()}"
            content += f"        public string {method_name}(string input)\n        {{\n"
            content += f"            return input.ToUpper();\n"
            content += f"        }}\n\n"
        
        content += "    }\n}\n"
        return content
    
    def generate_code_file(self, language: str, file_path: str = None) -> CodeFile:
        """Generate a complete CodeFile object with realistic data."""
        if not file_path:
            ext = random.choice(self.LANGUAGE_TEMPLATES[language]['extensions'])
            file_path = f"/mock/path/file{self.generate_random_string(6)}{ext}"
        
        file_type = random.choice(['module', 'test', 'config', 'util'])
        content = self.generate_file_content(language, file_type)
        
        # Generate metadata
        imports = random.sample(
            self.LANGUAGE_TEMPLATES[language]['common_imports'],
            random.randint(1, 4)
        )
        
        functions = []
        for _ in range(random.randint(2, 8)):
            functions.append({
                'name': f"func_{self.generate_random_string(6)}",
                'line_number': random.randint(10, 100),
                'args': [f"param_{i}" for i in range(random.randint(0, 4))]
            })
        
        classes = []
        for _ in range(random.randint(0, 3)):
            classes.append({
                'name': f"Class{self.generate_random_string(8).capitalize()}",
                'line_number': random.randint(5, 50),
                'methods': [f"method_{i}" for i in range(random.randint(2, 6))]
            })
        
        return CodeFile(
            path=file_path,
            language=language,
            content=content,
            size=len(content),
            lines_of_code=content.count('\n') + 1,
            hash=f"hash_{self.generate_random_string(32)}",
            last_modified=datetime.now() - timedelta(days=random.randint(0, 365)),
            imports=imports,
            functions=functions,
            classes=classes,
            dependencies=random.sample(imports, random.randint(0, len(imports))),
            ast_data={'nodes': random.randint(50, 200)}
        )
    
    def generate_commit_history(self, count: int = 50) -> List[CommitInfo]:
        """Generate realistic commit history."""
        commits = []
        authors = [self.generate_author_name() for _ in range(random.randint(3, 8))]
        
        files = [
            'src/main.py', 'src/utils.py', 'src/models.py', 'src/views.py',
            'tests/test_main.py', 'tests/test_utils.py', 'README.md',
            'requirements.txt', 'config.py', 'setup.py'
        ]
        
        base_date = datetime.now()
        
        for i in range(count):
            commit_date = base_date - timedelta(
                days=random.randint(0, 365),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            files_changed = random.sample(files, random.randint(1, 5))
            
            commit = CommitInfo(
                hash=f"commit_{self.generate_random_string(40)}",
                author=random.choice(authors),
                date=commit_date,
                message=self.generate_commit_message(),
                files_changed=files_changed,
                insertions=random.randint(1, 100),
                deletions=random.randint(0, 50)
            )
            
            commits.append(commit)
        
        return sorted(commits, key=lambda c: c.date, reverse=True)
    
    def generate_mock_project(self, project_type: str = None) -> MockProject:
        """Generate a complete mock project."""
        if not project_type:
            project_type = random.choice(list(self.PROJECT_TYPES.keys()))
        
        project_config = self.PROJECT_TYPES[project_type]
        language = random.choice(project_config['languages'])
        
        # Generate files
        files = []
        file_count = random.randint(5, 20)
        
        for _ in range(file_count):
            file_name = random.choice(project_config['typical_files'])
            directory = random.choice(project_config.get('directories', ['src']))
            ext = random.choice(self.LANGUAGE_TEMPLATES[language]['extensions'])
            
            file_path = f"{directory}/{file_name}{ext}"
            file_content = self.generate_file_content(language)
            
            files.append({
                'path': file_path,
                'content': file_content,
                'size': len(file_content),
                'language': language
            })
        
        # Calculate total size
        total_size = sum(f['size'] for f in files) / (1024 * 1024)  # MB
        
        return MockProject(
            name=self.generate_project_name(),
            description=f"Mock {project_type} project for testing",
            language=language,
            framework=random.choice(self.LANGUAGE_TEMPLATES[language]['frameworks']),
            files=files,
            dependencies=random.sample(
                self.LANGUAGE_TEMPLATES[language]['common_imports'],
                random.randint(3, 8)
            ),
            size_mb=total_size,
            created_date=datetime.now() - timedelta(days=random.randint(30, 365)),
            last_modified=datetime.now() - timedelta(days=random.randint(0, 30))
        )
    
    def generate_database_records(self, count: int = 100) -> List[Dict[str, Any]]:
        """Generate mock database records for testing."""
        records = []
        
        for _ in range(count):
            record = {
                'id': random.randint(1, 10000),
                'name': self.generate_project_name(),
                'author': self.generate_author_name(),
                'created_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat(),
                'updated_at': (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                'status': random.choice(['active', 'inactive', 'archived']),
                'metadata': {
                    'tags': random.sample(['web', 'mobile', 'api', 'tool', 'library'], random.randint(1, 3)),
                    'priority': random.choice(['low', 'medium', 'high']),
                    'complexity': random.randint(1, 10)
                }
            }
            records.append(record)
        
        return records
    
    def save_mock_data(self, output_dir: str) -> None:
        """Save generated mock data to files for use in tests."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Generate and save projects
        projects = [self.generate_mock_project() for _ in range(10)]
        with open(output_path / "mock_projects.json", 'w') as f:
            json.dump([asdict(p) for p in projects], f, indent=2, default=str)
        
        # Generate and save commit history
        commits = self.generate_commit_history(100)
        with open(output_path / "mock_commits.json", 'w') as f:
            json.dump([asdict(c) for c in commits], f, indent=2, default=str)
        
        # Generate and save code files for each language
        for language in self.LANGUAGE_TEMPLATES.keys():
            code_files = [self.generate_code_file(language) for _ in range(5)]
            with open(output_path / f"mock_code_files_{language}.json", 'w') as f:
                json.dump([asdict(cf) for cf in code_files], f, indent=2, default=str)
        
        # Generate and save database records
        db_records = self.generate_database_records(50)
        with open(output_path / "mock_database_records.json", 'w') as f:
            json.dump(db_records, f, indent=2, default=str)
        
        print(f"Mock data saved to {output_path}")


class PerformanceDataGenerator(MockDataGenerator):
    """Extended generator for performance and stress testing."""
    
    def generate_large_code_file(self, language: str, size_kb: int = 100) -> CodeFile:
        """Generate large code file for performance testing."""
        target_size = size_kb * 1024
        content_parts = []
        current_size = 0
        
        while current_size < target_size:
            chunk = self.generate_file_content(language)
            content_parts.append(chunk)
            current_size += len(chunk)
        
        content = '\n'.join(content_parts)
        
        return CodeFile(
            path=f"/large/file_{self.generate_random_string(8)}.py",
            language=language,
            content=content,
            size=len(content),
            lines_of_code=content.count('\n') + 1,
            hash=f"hash_{self.generate_random_string(32)}",
            last_modified=datetime.now(),
            imports=[],
            functions=[],
            classes=[],
            dependencies=[],
            ast_data={}
        )
    
    def generate_massive_commit_history(self, count: int = 10000) -> Generator[CommitInfo, None, None]:
        """Generate large commit history as generator to save memory."""
        authors = [self.generate_author_name() for _ in range(50)]
        base_files = [f"file_{i}.py" for i in range(100)]
        base_date = datetime.now()
        
        for i in range(count):
            yield CommitInfo(
                hash=f"commit_{i:08d}_{self.generate_random_string(32)}",
                author=random.choice(authors),
                date=base_date - timedelta(minutes=i),
                message=self.generate_commit_message(),
                files_changed=random.sample(base_files, random.randint(1, 10)),
                insertions=random.randint(1, 200),
                deletions=random.randint(0, 100)
            )


# Utility functions for test fixtures
def create_test_git_repo(repo_path: str, commit_count: int = 20) -> None:
    """Create a mock git repository structure for testing."""
    repo_path = Path(repo_path)
    repo_path.mkdir(parents=True, exist_ok=True)
    
    # Create .git directory
    git_dir = repo_path / ".git"
    git_dir.mkdir()
    
    # Create sample files
    files = ['main.py', 'utils.py', 'config.py', 'README.md']
    for file in files:
        (repo_path / file).write_text(f"# {file}\nprint('Hello from {file}')")
    
    # Create commit history simulation
    generator = MockDataGenerator()
    commits = generator.generate_commit_history(commit_count)
    
    with open(repo_path / ".git" / "mock_commits.json", 'w') as f:
        json.dump([asdict(c) for c in commits], f, indent=2, default=str)


def create_sample_projects_structure(base_path: str) -> None:
    """Create sample project structure for backup testing."""
    base_path = Path(base_path)
    generator = MockDataGenerator()
    
    project_types = ['web-app', 'desktop-app', 'library', 'cli-tool']
    
    for project_type in project_types:
        for i in range(2):  # 2 projects per type
            project = generator.generate_mock_project(project_type)
            project_path = base_path / project_type / project.name
            project_path.mkdir(parents=True, exist_ok=True)
            
            # Create project files
            for file_info in project.files:
                file_path = project_path / file_info['path']
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(file_info['content'])
            
            # Create project metadata
            metadata = {
                'name': project.name,
                'description': project.description,
                'language': project.language,
                'framework': project.framework,
                'dependencies': project.dependencies,
                'created_date': project.created_date.isoformat(),
                'last_modified': project.last_modified.isoformat()
            }
            
            with open(project_path / "project_metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)


if __name__ == "__main__":
    # Example usage
    generator = MockDataGenerator(seed=42)
    
    # Generate and save mock data
    generator.save_mock_data("C:\\dev\\projects\\tools\\prompt-engineer\\tests\\fixtures\\generated")
    
    print("Mock data generation completed!")