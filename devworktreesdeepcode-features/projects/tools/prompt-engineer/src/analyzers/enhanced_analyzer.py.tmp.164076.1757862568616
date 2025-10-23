#!/usr/bin/env python3
"""
Enhanced Project Analyzer - Better detection of issues and patterns
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class EnhancedIssue:
    """Enhanced issue with more context."""
    type: str
    severity: str  # critical, high, medium, low
    title: str
    description: str
    file_path: str
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    suggested_action: str = ""
    category: str = ""  # security, performance, quality, structure

class EnhancedAnalyzer:
    """Enhanced analyzer with deeper pattern detection."""

    def __init__(self):
        self.security_patterns = {
            # API Keys and secrets
            r'(api[_-]?key|apikey|secret|password|token|auth)\s*=\s*["\'][\w\-]+["\']': 'Hardcoded credentials',
            r'(AWS|aws)[_]?(ACCESS|access|SECRET|secret)': 'AWS credentials exposed',
            r'mongodb://[^/\s]+:[^/\s]+@': 'Database connection string with credentials',

            # SQL Injection
            r'(query|execute)\s*\(\s*["\'].*\+.*["\']': 'Possible SQL injection',
            r'f["\'].*SELECT.*WHERE.*{': 'SQL injection via f-string',

            # XSS vulnerabilities
            r'innerHTML\s*=\s*[^"\']': 'Potential XSS via innerHTML',
            r'dangerouslySetInnerHTML': 'React XSS risk',

            # Path traversal
            r'\.\.\/|\.\.\\': 'Potential path traversal',
        }

        self.performance_patterns = {
            # React/Frontend
            r'useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*},\s*\[\s*\]\s*\)': 'Empty dependency array in useEffect',
            r'map\([^)]*\)\s*\.map\(': 'Chained map operations (inefficient)',
            r'filter\([^)]*\)\s*\.map\(': 'Consider using reduce instead',

            # Database
            r'SELECT\s+\*\s+FROM': 'SELECT * is inefficient',
            r'for\s+.*\s+in\s+.*:\s*\n\s*.*\.(find|query|select)\(': 'N+1 query problem',

            # General
            r'await.*await': 'Nested awaits (potential performance issue)',
            r'JSON\.parse.*JSON\.stringify': 'Inefficient deep cloning',
        }

        self.code_smell_patterns = {
            # Functions too long
            r'def\s+\w+[^:]*:\s*\n(\s{4}.*\n){50,}': 'Function too long (>50 lines)',
            r'function\s+\w+[^{]*{\s*\n([^\n]*\n){50,}': 'Function too long (>50 lines)',

            # Too many parameters
            r'def\s+\w+\([^)]{100,}\)': 'Too many function parameters',
            r'function\s+\w+\([^)]{100,}\)': 'Too many function parameters',

            # Dead code
            r'if\s+(False|false|0)\s*:': 'Dead code detected',
            r'return[\s\n]+[^}]*': 'Unreachable code after return',

            # Magic numbers
            r'(if|while|for).*[^=<>!]=\s*\d{2,}': 'Magic number - use constants',
        }

        self.missing_patterns = {
            # Error handling
            'try_except': r'try:',
            'catch_block': r'catch\s*\(',
            'error_boundary': r'componentDidCatch|ErrorBoundary',

            # Testing
            'test_files': r'test_|_test\.|\.test\.|\.spec\.',
            'assertions': r'assert|expect|should',

            # Documentation
            'docstrings': r'"""[\s\S]*?"""',
            'jsdoc': r'/\*\*[\s\S]*?\*/',

            # Security
            'input_validation': r'validate|sanitize|escape',
            'rate_limiting': r'rate[_-]?limit|throttle',

            # Logging
            'logging': r'logger\.|console\.(log|error|warn)|logging\.',
        }

    def analyze_project(self, project_path: str, max_files: int = 200) -> Dict[str, Any]:
        """Enhanced project analysis."""

        project_path = Path(project_path)
        issues = []
        stats = {
            'total_files': 0,
            'total_lines': 0,
            'languages': {},
            'framework_detected': None,
            'has_tests': False,
            'has_ci_cd': False,
            'has_docker': False,
            'dependency_files': [],
            'security_score': 100,
            'performance_score': 100,
            'quality_score': 100
        }

        # Scan files
        for file_path in self._get_code_files(project_path, max_files):
            stats['total_files'] += 1

            # Detect file type
            ext = file_path.suffix.lower()
            lang = self._get_language(ext)
            stats['languages'][lang] = stats['languages'].get(lang, 0) + 1

            # Read and analyze file
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')
                    stats['total_lines'] += len(lines)

                    # Run all analyzers
                    issues.extend(self._check_security_issues(file_path, content))
                    issues.extend(self._check_performance_issues(file_path, content))
                    issues.extend(self._check_code_quality(file_path, content))
                    issues.extend(self._check_missing_essentials(file_path, content))

                    # Check for specific files
                    if file_path.name in ['package.json', 'requirements.txt', 'Gemfile', 'go.mod']:
                        stats['dependency_files'].append(str(file_path))
                        issues.extend(self._check_dependencies(file_path, content))

                    if 'test' in file_path.name.lower() or 'spec' in file_path.name.lower():
                        stats['has_tests'] = True

                    if file_path.name in ['.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile']:
                        stats['has_ci_cd'] = True

                    if file_path.name == 'Dockerfile' or file_path.name == 'docker-compose.yml':
                        stats['has_docker'] = True

            except Exception as e:
                continue

        # Calculate scores
        critical_count = len([i for i in issues if i.severity == 'critical'])
        high_count = len([i for i in issues if i.severity == 'high'])

        stats['security_score'] = max(0, 100 - (critical_count * 20) - (high_count * 10))
        stats['performance_score'] = max(0, 100 - len([i for i in issues if i.category == 'performance']) * 5)
        stats['quality_score'] = max(0, 100 - len([i for i in issues if i.category == 'quality']) * 3)

        # Detect framework
        stats['framework_detected'] = self._detect_framework(project_path)

        # Add missing feature detection
        missing_features = self._detect_missing_features(stats, project_path)

        return {
            'issues': issues,
            'stats': stats,
            'missing_features': missing_features,
            'health_score': (stats['security_score'] + stats['performance_score'] + stats['quality_score']) // 3
        }

    def _check_security_issues(self, file_path: Path, content: str) -> List[EnhancedIssue]:
        """Check for security vulnerabilities."""
        issues = []

        for pattern, issue_type in self.security_patterns.items():
            matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(EnhancedIssue(
                    type='security',
                    severity='critical' if 'password' in issue_type.lower() or 'key' in issue_type.lower() else 'high',
                    title=issue_type,
                    description=f"Security vulnerability detected: {issue_type}",
                    file_path=str(file_path),
                    line_number=line_num,
                    code_snippet=match.group(0)[:100],
                    suggested_action=f"Remove {issue_type.lower()} and use environment variables",
                    category='security'
                ))

        return issues

    def _check_performance_issues(self, file_path: Path, content: str) -> List[EnhancedIssue]:
        """Check for performance problems."""
        issues = []

        for pattern, issue_type in self.performance_patterns.items():
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(EnhancedIssue(
                    type='performance',
                    severity='medium',
                    title=issue_type,
                    description=f"Performance issue: {issue_type}",
                    file_path=str(file_path),
                    line_number=line_num,
                    code_snippet=match.group(0)[:100],
                    suggested_action=f"Optimize: {issue_type}",
                    category='performance'
                ))

        return issues

    def _check_code_quality(self, file_path: Path, content: str) -> List[EnhancedIssue]:
        """Check code quality issues."""
        issues = []

        # Check file length
        lines = content.split('\n')
        if len(lines) > 500:
            issues.append(EnhancedIssue(
                type='code_smell',
                severity='medium',
                title='File too long',
                description=f'File has {len(lines)} lines (recommended max: 500)',
                file_path=str(file_path),
                suggested_action='Consider splitting this file into smaller modules',
                category='quality'
            ))

        # Check for code smells
        for pattern, issue_type in self.code_smell_patterns.items():
            if re.search(pattern, content, re.MULTILINE):
                issues.append(EnhancedIssue(
                    type='code_smell',
                    severity='low',
                    title=issue_type,
                    description=f"Code quality issue: {issue_type}",
                    file_path=str(file_path),
                    suggested_action=f"Refactor: {issue_type}",
                    category='quality'
                ))

        # Check for TODO/FIXME comments
        todo_pattern = r'(TODO|FIXME|XXX|HACK):\s*(.+)'
        todos = re.finditer(todo_pattern, content, re.IGNORECASE)
        for todo in todos:
            line_num = content[:todo.start()].count('\n') + 1
            issues.append(EnhancedIssue(
                type='todo',
                severity='low',
                title=f'{todo.group(1)} comment',
                description=todo.group(2).strip(),
                file_path=str(file_path),
                line_number=line_num,
                suggested_action='Address this TODO item',
                category='quality'
            ))

        return issues

    def _check_missing_essentials(self, file_path: Path, content: str) -> List[EnhancedIssue]:
        """Check for missing essential patterns."""
        issues = []

        # Check if main code files lack error handling
        if file_path.suffix in ['.py', '.js', '.ts', '.jsx', '.tsx']:
            if not re.search(self.missing_patterns['try_except'], content) and \
               not re.search(self.missing_patterns['catch_block'], content):
                issues.append(EnhancedIssue(
                    type='missing_feature',
                    severity='high',
                    title='No error handling',
                    description='File lacks try/catch error handling',
                    file_path=str(file_path),
                    suggested_action='Add proper error handling throughout the file',
                    category='quality'
                ))

            # Check for missing input validation
            if 'request' in content.lower() or 'input' in content.lower():
                if not re.search(self.missing_patterns['input_validation'], content):
                    issues.append(EnhancedIssue(
                        type='missing_feature',
                        severity='high',
                        title='No input validation',
                        description='User input not being validated',
                        file_path=str(file_path),
                        suggested_action='Add input validation and sanitization',
                        category='security'
                    ))

        return issues

    def _check_dependencies(self, file_path: Path, content: str) -> List[EnhancedIssue]:
        """Check dependency files for issues."""
        issues = []

        if file_path.name == 'package.json':
            # Check for missing scripts
            try:
                data = json.loads(content)
                scripts = data.get('scripts', {})

                if 'test' not in scripts:
                    issues.append(EnhancedIssue(
                        type='missing_feature',
                        severity='medium',
                        title='No test script',
                        description='package.json missing test script',
                        file_path=str(file_path),
                        suggested_action='Add "test" script to package.json',
                        category='quality'
                    ))

                if 'build' not in scripts and 'start' not in scripts:
                    issues.append(EnhancedIssue(
                        type='missing_feature',
                        severity='medium',
                        title='No build/start script',
                        description='package.json missing build or start script',
                        file_path=str(file_path),
                        suggested_action='Add "build" and "start" scripts',
                        category='quality'
                    ))

                # Check for outdated dependencies (simplified)
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                for dep, version in deps.items():
                    if version.startswith('^') or version.startswith('~'):
                        continue  # Flexible versioning is OK
                    if version == '*' or version == 'latest':
                        issues.append(EnhancedIssue(
                            type='dependency',
                            severity='medium',
                            title=f'Unsafe version for {dep}',
                            description=f'{dep} using unsafe version specifier: {version}',
                            file_path=str(file_path),
                            suggested_action=f'Pin {dep} to a specific version',
                            category='security'
                        ))

            except json.JSONDecodeError:
                pass

        elif file_path.name == 'requirements.txt':
            lines = content.split('\n')
            for line in lines:
                if line.strip() and not line.startswith('#'):
                    if '==' not in line and '>=' not in line:
                        issues.append(EnhancedIssue(
                            type='dependency',
                            severity='medium',
                            title=f'Unpinned dependency',
                            description=f'Dependency not pinned: {line}',
                            file_path=str(file_path),
                            suggested_action=f'Pin {line} to specific version',
                            category='security'
                        ))

        return issues

    def _detect_missing_features(self, stats: Dict, project_path: Path) -> List[str]:
        """Detect missing features based on project analysis."""
        missing = []

        # Check for testing
        if not stats['has_tests']:
            missing.append("Unit tests - No test files found")

        # Check for CI/CD
        if not stats['has_ci_cd']:
            missing.append("CI/CD pipeline - No automation detected")

        # Check for Docker
        if not stats['has_docker'] and stats['total_files'] > 20:
            missing.append("Docker configuration for deployment")

        # Check for documentation
        readme_path = project_path / 'README.md'
        if not readme_path.exists():
            missing.append("README.md documentation")

        # Check for environment config
        env_example = project_path / '.env.example'
        if not env_example.exists() and any('.env' in str(f) for f in project_path.glob('**/*')):
            missing.append(".env.example file for environment setup")

        # Check for linting config
        eslint = project_path / '.eslintrc.json'
        prettier = project_path / '.prettierrc'
        pylint = project_path / '.pylintrc'

        if 'javascript' in stats['languages'] and not eslint.exists() and not prettier.exists():
            missing.append("ESLint/Prettier configuration")

        if 'python' in stats['languages'] and not pylint.exists():
            missing.append("Python linting configuration")

        # Check for security headers (web projects)
        if stats.get('framework_detected') in ['react', 'vue', 'angular', 'express', 'fastapi']:
            missing.append("Security headers configuration")
            missing.append("Rate limiting implementation")

        # Check for monitoring
        if stats['total_files'] > 50:
            missing.append("Error monitoring/logging setup")
            missing.append("Performance monitoring")

        # Check for API documentation
        if 'api' in str(project_path).lower() or 'backend' in str(project_path).lower():
            missing.append("API documentation (Swagger/OpenAPI)")

        return missing

    def _detect_framework(self, project_path: Path) -> Optional[str]:
        """Detect the framework being used."""

        # Check package.json for JS frameworks
        package_json = project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json) as f:
                    data = json.load(f)
                    deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}

                    if 'react' in deps:
                        return 'react'
                    elif 'vue' in deps:
                        return 'vue'
                    elif '@angular/core' in deps:
                        return 'angular'
                    elif 'express' in deps:
                        return 'express'
                    elif 'next' in deps:
                        return 'nextjs'
            except:
                pass

        # Check for Python frameworks
        requirements = project_path / 'requirements.txt'
        if requirements.exists():
            try:
                with open(requirements) as f:
                    content = f.read().lower()
                    if 'django' in content:
                        return 'django'
                    elif 'flask' in content:
                        return 'flask'
                    elif 'fastapi' in content:
                        return 'fastapi'
            except:
                pass

        return None

    def _get_code_files(self, project_path: Path, max_files: int) -> List[Path]:
        """Get relevant code files from project."""
        code_extensions = {
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h',
            '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.vue', '.dart'
        }

        skip_dirs = {
            'node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist',
            'build', 'coverage', '.next', '.nuxt', 'vendor'
        }

        files = []
        for file_path in project_path.rglob('*'):
            if len(files) >= max_files:
                break

            if file_path.is_file() and file_path.suffix in code_extensions:
                if not any(skip_dir in file_path.parts for skip_dir in skip_dirs):
                    files.append(file_path)

        return files

    def _get_language(self, ext: str) -> str:
        """Get language from file extension."""
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.rs': 'rust',
            '.vue': 'vue',
            '.dart': 'dart'
        }
        return language_map.get(ext, 'other')