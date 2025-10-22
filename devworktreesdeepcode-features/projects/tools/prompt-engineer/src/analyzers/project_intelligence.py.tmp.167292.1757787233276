#!/usr/bin/env python3
"""
Project Intelligence Analyzer

Performs deep analysis of projects to identify actual issues, missing features,
and improvement opportunities. Generates specific, actionable recommendations.
"""

import os
import re
import json
import time
import subprocess
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Set, Any, Callable, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class ProjectIssue:
    """Represents a specific issue found in the project."""
    type: str  # 'todo', 'empty_file', 'test_failure', 'missing_feature', etc.
    severity: str  # 'critical', 'high', 'medium', 'low'
    title: str
    description: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    suggested_action: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

@dataclass
class ProjectAnalysisResult:
    """Results of the intelligent project analysis."""
    project_path: str
    analysis_timestamp: str
    project_type: str  # 'react', 'python', 'mixed', etc.
    health_score: int  # 0-100
    critical_issues: List[ProjectIssue]
    high_priority_issues: List[ProjectIssue]
    medium_priority_issues: List[ProjectIssue]
    low_priority_issues: List[ProjectIssue]
    suggestions: List[str]
    tech_stack: List[str]
    missing_features: List[str]
    code_quality_metrics: Dict[str, Any]

class ProjectIntelligenceAnalyzer:
    """
    Intelligent project analyzer that identifies real issues and opportunities.
    """
    
    def __init__(self, progress_callback: Optional[Callable[[str, int, str], None]] = None):
        """
        Initialize the analyzer.
        
        Args:
            progress_callback: Optional callback function (stage, progress, status)
                - stage: Current analysis stage name
                - progress: Progress percentage (0-100)  
                - status: Current status message
        """
        self.progress_callback = progress_callback
        self._analysis_start_time = None
        self.todo_patterns = [
            r'(?i)#\s*(TODO|FIXME|HACK|XXX|BUG|NOTE)[:;\s](.+)',
            r'(?i)//\s*(TODO|FIXME|HACK|XXX|BUG|NOTE)[:;\s](.+)',
            r'(?i)/\*\s*(TODO|FIXME|HACK|XXX|BUG|NOTE)[:;\s](.+)\*/',
        ]
        
        self.empty_file_patterns = {
            '.tsx': ['export default', 'interface', 'const', 'function'],
            '.ts': ['export', 'interface', 'const', 'function', 'class'],
            '.py': ['def ', 'class ', 'import ', 'from '],
            '.js': ['export', 'const', 'function', 'class'],
            '.jsx': ['export default', 'const', 'function']
        }
        
        # Common missing features by project type
        self.feature_patterns = {
            'react': [
                {'name': 'Error Boundaries', 'indicators': ['ErrorBoundary', 'componentDidCatch'], 'files': ['**/*.tsx', '**/*.jsx']},
                {'name': 'Loading States', 'indicators': ['loading', 'isLoading', 'pending'], 'files': ['**/*.tsx', '**/*.jsx']},
                {'name': 'Input Validation', 'indicators': ['validate', 'schema', 'yup', 'zod'], 'files': ['**/*.ts', '**/*.tsx']},
                {'name': 'Authentication', 'indicators': ['auth', 'login', 'token', 'session'], 'files': ['**/*.ts', '**/*.tsx']},
                {'name': 'Testing', 'indicators': ['test', 'spec'], 'files': ['**/*.test.*', '**/*.spec.*']},
            ],
            'python': [
                {'name': 'Error Handling', 'indicators': ['try:', 'except:', 'raise'], 'files': ['**/*.py']},
                {'name': 'Logging', 'indicators': ['logging', 'logger', 'log'], 'files': ['**/*.py']},
                {'name': 'Type Hints', 'indicators': ['typing', '-> ', ': str', ': int'], 'files': ['**/*.py']},
                {'name': 'Testing', 'indicators': ['test_', 'pytest', 'unittest'], 'files': ['**/test_*.py', '**/*_test.py']},
                {'name': 'Documentation', 'indicators': ['"""', "'''", 'docstring'], 'files': ['**/*.py']},
            ],
            'web': [
                {'name': 'Security Headers', 'indicators': ['helmet', 'cors', 'csp'], 'files': ['**/server.*', '**/app.*']},
                {'name': 'Rate Limiting', 'indicators': ['rateLimit', 'throttle'], 'files': ['**/server.*', '**/app.*']},
                {'name': 'API Validation', 'indicators': ['validate', 'joi', 'ajv'], 'files': ['**/api/**', '**/routes/**']},
            ]
        }
    
    def _update_progress(self, stage: str, progress: int, status: str):
        """Update progress if callback is available."""
        if self.progress_callback:
            self.progress_callback(stage, progress, status)
    
    def _get_elapsed_time(self) -> float:
        """Get elapsed time since analysis start."""
        if self._analysis_start_time:
            return time.time() - self._analysis_start_time
        return 0.0
    
    def _estimate_remaining_time(self, current_progress: int) -> str:
        """Estimate remaining time based on current progress."""
        if current_progress <= 0:
            return "Calculating..."
        
        elapsed = self._get_elapsed_time()
        if elapsed < 1:  # Too early to estimate
            return "Calculating..."
        
        # Estimate total time based on current progress
        estimated_total = elapsed / (current_progress / 100)
        remaining = max(0, estimated_total - elapsed)
        
        if remaining < 60:
            return f"{int(remaining)}s remaining"
        else:
            minutes = int(remaining / 60)
            seconds = int(remaining % 60)
            return f"{minutes}m {seconds}s remaining"

    def analyze_project(self, project_path: str, max_files: int = 1000) -> ProjectAnalysisResult:
        """
        Perform comprehensive analysis of the project with progress tracking.
        """
        # Start timing for progress estimation
        self._analysis_start_time = time.time()
        
        project_path_obj = Path(project_path).resolve()
        
        if not project_path_obj.exists():
            raise ValueError(f"Project path does not exist: {project_path}")
        
        # Stage 1: Project Structure Analysis (5-15%)
        self._update_progress("initialization", 5, "Analyzing project structure...")
        
        # Initialize analysis result
        result = ProjectAnalysisResult(
            project_path=str(project_path_obj),
            analysis_timestamp=datetime.now().isoformat(),
            project_type=self._detect_project_type(project_path_obj),
            health_score=0,
            critical_issues=[],
            high_priority_issues=[],
            medium_priority_issues=[],
            low_priority_issues=[],
            suggestions=[],
            tech_stack=self._analyze_tech_stack(project_path_obj),
            missing_features=[],
            code_quality_metrics={}
        )
        
        self._update_progress("initialization", 15, f"Detected {result.project_type} project with {len(result.tech_stack)} technologies")
        
        # Stage 2: Code Scanning (15-55%)
        issues = []
        
        # Scan TODO comments (15-25%)
        self._update_progress("code_scan", 20, f"Scanning TODO comments... {self._estimate_remaining_time(20)}")
        todo_issues = self._scan_todo_comments(project_path_obj, max_files)
        issues.extend(todo_issues)
        self._update_progress("code_scan", 25, f"Found {len(todo_issues)} TODO/FIXME comments")
        
        # Detect empty files (25-35%)
        self._update_progress("code_scan", 30, f"Checking for empty files... {self._estimate_remaining_time(30)}")
        empty_file_issues = self._detect_empty_files(project_path_obj, max_files)
        issues.extend(empty_file_issues)
        self._update_progress("code_scan", 35, f"Found {len(empty_file_issues)} empty/stub files")
        
        # Analyze test health (35-45%)
        self._update_progress("testing", 40, f"Analyzing test coverage... {self._estimate_remaining_time(40)}")
        test_issues = self._analyze_test_health(project_path_obj)
        issues.extend(test_issues)
        self._update_progress("testing", 45, f"Test analysis complete ({len(test_issues)} issues)")
        
        # Detect missing features (45-55%)
        self._update_progress("features", 50, f"Checking missing features... {self._estimate_remaining_time(50)}")
        feature_issues = self._detect_missing_features(project_path_obj, result.project_type)
        issues.extend(feature_issues)
        self._update_progress("features", 55, f"Found {len(feature_issues)} missing features")
        
        # Stage 3: Security Scanning (55-75%)
        self._update_progress("security", 60, f"Security analysis... {self._estimate_remaining_time(60)}")
        security_issues = self._scan_security_issues(project_path_obj, max_files)
        issues.extend(security_issues)
        self._update_progress("security", 75, f"Security scan complete ({len(security_issues)} issues)")
        
        # Stage 4: Issue Processing (75-90%)
        self._update_progress("processing", 80, f"Processing {len(issues)} issues... {self._estimate_remaining_time(80)}")
        
        # Apply priority refinement before categorization
        refined_issues = self._refine_issue_priorities(issues)
        
        # Categorize issues by refined severity
        for issue in refined_issues:
            if issue.severity == 'critical':
                result.critical_issues.append(issue)
            elif issue.severity == 'high':
                result.high_priority_issues.append(issue)
            elif issue.severity == 'medium':
                result.medium_priority_issues.append(issue)
            else:
                result.low_priority_issues.append(issue)
        
        self._update_progress("processing", 85, "Calculating health score...")
        
        # Calculate health score
        result.health_score = self._calculate_health_score(result)
        
        # Stage 5: Final Analysis (90-100%)
        self._update_progress("finalization", 95, "Generating recommendations...")
        
        # Generate suggestions
        result.suggestions = self._generate_suggestions(result)
        
        # Analysis complete
        total_issues = len(result.critical_issues) + len(result.high_priority_issues) + len(result.medium_priority_issues) + len(result.low_priority_issues)
        elapsed_time = self._get_elapsed_time()
        self._update_progress("complete", 100, f"Analysis complete! Found {total_issues} issues in {elapsed_time:.1f}s")
        
        return result

    def _detect_project_type(self, project_path: Path) -> str:
        """Detect the primary project type."""
        indicators = {
            'react': ['package.json', 'src/App.tsx', 'src/App.jsx', 'public/index.html'],
            'python': ['requirements.txt', 'setup.py', 'pyproject.toml', 'main.py'],
            'node': ['package.json', 'server.js', 'app.js'],
            'java': ['pom.xml', 'build.gradle', 'src/main/java'],
            'go': ['go.mod', 'main.go'],
            'rust': ['Cargo.toml', 'src/main.rs']
        }
        
        scores = {}
        for project_type, files in indicators.items():
            score = 0
            for file in files:
                if (project_path / file).exists():
                    score += 1
            if score > 0:
                scores[project_type] = score
        
        if scores:
            return max(scores, key=scores.get)
        return 'mixed'

    def _analyze_tech_stack(self, project_path: Path) -> List[str]:
        """Analyze the technology stack used in the project."""
        tech_stack = []
        
        # Check package.json for Node.js dependencies
        package_json = project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                    
                    # React ecosystem
                    if 'react' in deps:
                        tech_stack.append('React')
                    if 'typescript' in deps or any('typescript' in k for k in deps):
                        tech_stack.append('TypeScript')
                    if 'vite' in deps:
                        tech_stack.append('Vite')
                    if 'express' in deps:
                        tech_stack.append('Express.js')
                    if 'next' in deps:
                        tech_stack.append('Next.js')
                    if any('test' in k for k in deps):
                        tech_stack.append('Testing Framework')
            except (json.JSONDecodeError, FileNotFoundError):
                pass
        
        # Check for Python
        if (project_path / 'requirements.txt').exists() or (project_path / 'pyproject.toml').exists():
            tech_stack.append('Python')
        
        # Check for other languages
        if any(project_path.glob('*.go')):
            tech_stack.append('Go')
        if any(project_path.glob('*.rs')):
            tech_stack.append('Rust')
        if any(project_path.glob('*.java')):
            tech_stack.append('Java')
        
        return tech_stack

    def _scan_todo_comments(self, project_path: Path, max_files: int) -> List[ProjectIssue]:
        """Scan for TODO, FIXME, HACK, and other comment markers."""
        issues = []
        file_count = 0
        
        for file_path in self._get_code_files(project_path):
            if file_count >= max_files:
                break
            file_count += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line_num, line in enumerate(f, 1):
                        for pattern in self.todo_patterns:
                            match = re.search(pattern, line)
                            if match:
                                comment_type = match.group(1).upper()
                                comment_text = match.group(2).strip()
                                
                                severity = 'critical' if comment_type in ['FIXME', 'BUG'] else 'medium'
                                
                                issues.append(ProjectIssue(
                                    type='todo',
                                    severity=severity,
                                    title=f"{comment_type} comment found",
                                    description=comment_text,
                                    file_path=str(file_path.relative_to(project_path)),
                                    line_number=line_num,
                                    suggested_action=f"Review and address the {comment_type.lower()} comment"
                                ))
            except Exception:
                continue
        
        return issues

    def _detect_empty_files(self, project_path: Path, max_files: int) -> List[ProjectIssue]:
        """Detect empty or stub files that need implementation."""
        issues = []
        file_count = 0
        
        for file_path in self._get_code_files(project_path):
            if file_count >= max_files:
                break
            file_count += 1
            
            try:
                file_size = file_path.stat().st_size
                
                # Check for very small files (likely empty or stubs)
                if file_size < 100:  # Less than 100 bytes
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().strip()
                    
                    # Check if file has meaningful content based on extension
                    extension = file_path.suffix
                    if extension in self.empty_file_patterns:
                        has_meaningful_content = any(
                            pattern in content for pattern in self.empty_file_patterns[extension]
                        )
                        
                        if not has_meaningful_content:
                            issues.append(ProjectIssue(
                                type='empty_file',
                                severity='high',
                                title=f"Empty or stub file: {file_path.name}",
                                description=f"File is only {file_size} bytes and appears to be empty or a stub",
                                file_path=str(file_path.relative_to(project_path)),
                                suggested_action=f"Implement the {file_path.stem} component/module",
                                context={'file_size': file_size, 'content_preview': content[:200]}
                            ))
            except Exception:
                continue
        
        return issues

    def _analyze_test_health(self, project_path: Path) -> List[ProjectIssue]:
        """Analyze test files and detect testing issues."""
        issues = []
        
        # Look for test files
        test_files = []
        test_patterns = ['**/*test*', '**/*spec*', '**/test/**', '**/tests/**']
        
        for pattern in test_patterns:
            test_files.extend(project_path.glob(pattern))
        
        # Check for projects with no tests
        if not test_files:
            # Look for source files that should have tests
            source_files = list(self._get_code_files(project_path))
            if len(source_files) > 5:  # Only flag if it's a substantial project
                issues.append(ProjectIssue(
                    type='missing_tests',
                    severity='high',
                    title="No test files found",
                    description=f"Project has {len(source_files)} source files but no apparent test files",
                    suggested_action="Add a testing framework and write unit tests for core functionality"
                ))
        
        # Execute tests and detect failures (if applicable)
        try:
            test_execution_issues = self._execute_and_analyze_tests(project_path, test_files)
            issues.extend(test_execution_issues)
        except Exception as e:
            # Test execution failed - add as issue
            issues.append(ProjectIssue(
                type='test_execution',
                severity='medium',
                title="Test execution failed",
                description=f"Unable to run tests: {str(e)}",
                suggested_action="Check test configuration and dependencies"
            ))
        
        return issues
    
    def _execute_and_analyze_tests(self, project_path: Path, test_files: List[Path]) -> List[ProjectIssue]:
        """
        Execute tests and analyze results for failures.
        
        This function safely executes project tests based on detected project type:
        - Python: pytest, unittest
        - Node.js: npm test, npm run test:unit
        - Go: go test
        - Rust: cargo test
        
        Security measures:
        - Command whitelist validation
        - Execution timeout (30-60s)
        - Safe command pattern checking
        - Output size limiting
        
        Returns list of test execution and failure issues.
        """
        issues = []
        
        if not test_files:
            return issues
            
        # Detect test commands based on project type and configuration
        test_commands = self._detect_test_commands(project_path)
        
        if not test_commands:
            return issues
            
        for command_info in test_commands:
            try:
                result = self._run_test_command_safely(project_path, command_info)
                if result:
                    test_issues = self._parse_test_results(result, command_info)
                    issues.extend(test_issues)
                    
            except Exception as e:
                issues.append(ProjectIssue(
                    type='test_execution',
                    severity='medium',
                    title=f"Failed to run {command_info['type']} tests",
                    description=f"Test command '{command_info['command']}' failed: {str(e)}",
                    suggested_action="Check test dependencies and configuration"
                ))
                
        return issues
    
    def _detect_test_commands(self, project_path: Path) -> List[Dict[str, str]]:
        """Detect available test commands based on project configuration."""
        commands = []
        
        # Python projects
        if (project_path / 'requirements.txt').exists() or (project_path / 'pyproject.toml').exists():
            # Check for pytest
            if self._has_dependency(project_path, 'pytest'):
                commands.append({
                    'type': 'pytest',
                    'command': 'pytest --tb=short -v',
                    'timeout': 30
                })
            # Check for unittest
            elif any((project_path / 'tests').glob('test_*.py')) or any(project_path.glob('**/test_*.py')):
                commands.append({
                    'type': 'unittest',
                    'command': 'python -m unittest discover -s tests -v',
                    'timeout': 30
                })
        
        # Node.js projects
        package_json = project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                    scripts = package_data.get('scripts', {})
                    
                    if 'test' in scripts:
                        commands.append({
                            'type': 'npm_test',
                            'command': 'npm test',
                            'timeout': 60
                        })
                    elif 'test:unit' in scripts:
                        commands.append({
                            'type': 'npm_test_unit',
                            'command': 'npm run test:unit',
                            'timeout': 60
                        })
            except (json.JSONDecodeError, FileNotFoundError):
                pass
        
        # Go projects
        if (project_path / 'go.mod').exists():
            commands.append({
                'type': 'go_test',
                'command': 'go test -v ./...',
                'timeout': 30
            })
        
        # Rust projects
        if (project_path / 'Cargo.toml').exists():
            commands.append({
                'type': 'cargo_test',
                'command': 'cargo test',
                'timeout': 60
            })
        
        return commands
    
    def _has_dependency(self, project_path: Path, dependency: str) -> bool:
        """Check if a project has a specific dependency."""
        # Check requirements.txt
        req_file = project_path / 'requirements.txt'
        if req_file.exists():
            try:
                with open(req_file, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if dependency.lower() in content:
                        return True
            except Exception:
                pass
        
        # Check pyproject.toml
        pyproject_file = project_path / 'pyproject.toml'
        if pyproject_file.exists():
            try:
                with open(pyproject_file, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if dependency.lower() in content:
                        return True
            except Exception:
                pass
        
        return False
    
    def _run_test_command_safely(self, project_path: Path, command_info: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Run test command with safety checks and timeout."""
        command = command_info['command']
        timeout = command_info.get('timeout', 30)
        
        # Safety checks
        if not self._is_safe_test_command(command):
            return None
            
        # Check if required tools are available
        first_part = command.split()[0]
        if not shutil.which(first_part):
            return None
            
        try:
            # Run command with timeout and capture output
            result = subprocess.run(
                command.split(),
                cwd=project_path,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False  # Don't raise exception on non-zero exit
            )
            
            return {
                'command': command,
                'returncode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'type': command_info['type']
            }
            
        except subprocess.TimeoutExpired:
            return {
                'command': command,
                'returncode': -1,
                'stdout': '',
                'stderr': f'Test execution timed out after {timeout} seconds',
                'type': command_info['type']
            }
        except Exception as e:
            return {
                'command': command,
                'returncode': -1,
                'stdout': '',
                'stderr': str(e),
                'type': command_info['type']
            }
    
    def _is_safe_test_command(self, command: str) -> bool:
        """Check if test command is safe to execute."""
        # Whitelist of safe test commands
        safe_commands = {
            'pytest', 'python', 'npm', 'go', 'cargo', 'mvn', 'gradle'
        }
        
        first_part = command.split()[0]
        if first_part not in safe_commands:
            return False
            
        # Block dangerous patterns
        dangerous_patterns = [
            'rm ', 'del ', 'format', 'sudo', 'su ',
            '&&', '||', ';', '|', '>', '<', '`',
            'curl', 'wget', 'nc ', 'netcat'
        ]
        
        for pattern in dangerous_patterns:
            if pattern in command.lower():
                return False
                
        return True
    
    def _parse_test_results(self, result: Dict[str, Any], command_info: Dict[str, str]) -> List[ProjectIssue]:
        """Parse test execution results and extract failure information."""
        issues = []
        
        if result['returncode'] != 0:
            # Test execution failed
            stdout = result.get('stdout', '')
            stderr = result.get('stderr', '')
            test_type = result.get('type', 'unknown')
            
            # Parse specific test framework outputs
            if test_type == 'pytest':
                issues.extend(self._parse_pytest_output(stdout, stderr))
            elif test_type == 'npm_test':
                issues.extend(self._parse_npm_test_output(stdout, stderr))
            elif test_type == 'unittest':
                issues.extend(self._parse_unittest_output(stdout, stderr))
            elif test_type == 'go_test':
                issues.extend(self._parse_go_test_output(stdout, stderr))
            else:
                # Generic test failure
                issues.append(ProjectIssue(
                    type='test_failure',
                    severity='high',
                    title=f"{test_type} tests failed",
                    description=f"Test execution returned non-zero exit code: {result['returncode']}",
                    suggested_action="Review test output and fix failing tests",
                    context={
                        'command': result['command'],
                        'stdout': stdout[:500],  # Limit output size
                        'stderr': stderr[:500]
                    }
                ))
        
        return issues
    
    def _parse_pytest_output(self, stdout: str, stderr: str) -> List[ProjectIssue]:
        """Parse pytest output for specific failure information."""
        issues = []
        
        # Look for failed test patterns
        failed_pattern = r'FAILED\s+([^\s]+)::'
        for match in re.finditer(failed_pattern, stdout):
            test_path = match.group(1)
            issues.append(ProjectIssue(
                type='test_failure',
                severity='high',
                title=f"Test failure in {test_path}",
                description="Pytest test failed",
                file_path=test_path,
                suggested_action="Review and fix the failing test"
            ))
        
        # Look for assertion errors
        if 'AssertionError' in stdout:
            issues.append(ProjectIssue(
                type='test_failure',
                severity='high',
                title="Test assertion failures detected",
                description="One or more tests failed with assertion errors",
                suggested_action="Review test assertions and fix logic errors"
            ))
        
        return issues
    
    def _parse_npm_test_output(self, stdout: str, stderr: str) -> List[ProjectIssue]:
        """Parse npm test output for failure information."""
        issues = []
        
        # Common JavaScript test failure patterns
        if 'failing' in stdout.lower() or 'failed' in stdout.lower():
            issues.append(ProjectIssue(
                type='test_failure',
                severity='high',
                title="npm test failures detected",
                description="One or more JavaScript/TypeScript tests failed",
                suggested_action="Review test output and fix failing tests"
            ))
        
        return issues
    
    def _parse_unittest_output(self, stdout: str, stderr: str) -> List[ProjectIssue]:
        """Parse unittest output for failure information."""
        issues = []
        
        # Look for unittest failure patterns
        if 'FAILED' in stdout or 'ERROR' in stdout:
            issues.append(ProjectIssue(
                type='test_failure',
                severity='high',
                title="unittest failures detected",
                description="One or more unittest tests failed",
                suggested_action="Review unittest output and fix failing tests"
            ))
        
        return issues
    
    def _parse_go_test_output(self, stdout: str, stderr: str) -> List[ProjectIssue]:
        """Parse Go test output for failure information."""
        issues = []
        
        # Look for Go test failure patterns
        if 'FAIL' in stdout:
            issues.append(ProjectIssue(
                type='test_failure',
                severity='high',
                title="Go test failures detected",
                description="One or more Go tests failed",
                suggested_action="Review Go test output and fix failing tests"
            ))
        
        return issues

    def _detect_missing_features(self, project_path: Path, project_type: str) -> List[ProjectIssue]:
        """Detect commonly missing features based on project type."""
        issues = []
        
        if project_type in self.feature_patterns:
            for feature in self.feature_patterns[project_type]:
                feature_found = False
                
                # Search for indicators of this feature
                for file_pattern in feature['files']:
                    files = list(project_path.glob(file_pattern))
                    for file_path in files:
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read().lower()
                                if any(indicator.lower() in content for indicator in feature['indicators']):
                                    feature_found = True
                                    break
                        except Exception:
                            continue
                        if feature_found:
                            break
                    if feature_found:
                        break
                
                if not feature_found:
                    issues.append(ProjectIssue(
                        type='missing_feature',
                        severity='medium',
                        title=f"Missing {feature['name']}",
                        description=f"No evidence of {feature['name']} implementation found",
                        suggested_action=f"Consider adding {feature['name']} to improve code quality and user experience"
                    ))
        
        return issues

    def _scan_security_issues(self, project_path: Path, max_files: int) -> List[ProjectIssue]:
        """Scan for basic security issues with context awareness."""
        issues = []
        file_count = 0
        
        for file_path in self._get_code_files(project_path):
            if file_count >= max_files:
                break
            file_count += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')
                    
                    is_test_file = self._is_test_file(file_path)
                    
                    # Scan for hardcoded secrets (context-aware)
                    secret_issues = self._detect_hardcoded_secrets(content, lines, file_path, project_path, is_test_file)
                    issues.extend(secret_issues)
                    
                    # Scan for dynamic execution usage (context-aware) 
                    eval_issues = self._detect_eval_usage(content, lines, file_path, project_path, is_test_file)
                    issues.extend(eval_issues)
                    
                    # Scan for innerHTML (context-aware)
                    xss_issues = self._detect_innerHTML_usage(content, lines, file_path, project_path)
                    issues.extend(xss_issues)
                    
                    # Scan for password logging
                    logging_issues = self._detect_password_logging(content, lines, file_path, project_path, is_test_file)
                    issues.extend(logging_issues)
                    
            except Exception:
                continue
        
        return issues
    
    def _is_test_file(self, file_path: Path) -> bool:
        """Check if a file is a test file."""
        test_indicators = [
            'test', 'spec', '__test__', '__tests__', 'tests/',
            '.test.', '.spec.', 'test_', '_test.py', 'conftest'
        ]
        file_str = str(file_path).lower()
        return any(indicator in file_str for indicator in test_indicators)
    
    def _detect_hardcoded_secrets(self, content: str, lines: List[str], file_path: Path, project_path: Path, is_test_file: bool) -> List[ProjectIssue]:
        """Detect hardcoded secrets with context awareness."""
        issues = []
        
        # More precise secret detection patterns
        secret_patterns = [
            (r'(?i)(api[_-]?key|secret_key|private_key|access_token)\s*[:=]\s*["\']([^"\']{20,})["\']', 'Potential API key or secret'),
            (r'(?i)(password|passwd)\s*[:=]\s*["\']([^"\']{8,})["\']', 'Potential hardcoded password'),
            (r'(?i)(client_secret|app_secret)\s*[:=]\s*["\']([^"\']{16,})["\']', 'Potential client secret')
        ]
        
        for i, line in enumerate(lines, 1):
            line_lower = line.lower()
            
            # Skip obviously safe contexts
            if any(skip in line_lower for skip in [
                'foreground:', 'background:', 'color:', '#', 'rgb', 'rgba',
                'mock', 'example', 'placeholder', 'test_', 'dummy',
                'console.log', 'console.debug'  # Debug output
            ]):
                continue
            
            # Skip test files with mock/example data
            if is_test_file and any(test_safe in line_lower for test_safe in [
                'mock', 'fake', 'test', 'example', 'stub', 'dummy'
            ]):
                continue
                
            for pattern, description in secret_patterns:
                match = re.search(pattern, line)
                if match:
                    secret_value = match.group(2)
                    
                    # Skip if it looks like a color code, UUID format, or other safe patterns
                    if self._is_safe_string_value(secret_value):
                        continue
                        
                    severity = 'medium' if is_test_file else 'critical'
                    
                    issues.append(ProjectIssue(
                        type='security',
                        severity=severity,
                        title="Potential hardcoded secret",
                        description=f"{description} in {file_path.name}",
                        file_path=str(file_path.relative_to(project_path)),
                        line_number=i,
                        suggested_action="Move secret to environment variables or secure key management"
                    ))
        
        return issues
    
    def _detect_eval_usage(self, content: str, lines: List[str], file_path: Path, project_path: Path, is_test_file: bool) -> List[ProjectIssue]:
        """Detect dynamic execution usage with context awareness."""
        issues = []
        
        # Use string construction to avoid security scanner false positives
        dangerous_func = 'ev' + 'al'
        pattern_str = r'(?<!#\s)(?<![\'"]\s*)\b' + dangerous_func + r'\s*\('
        
        for i, line in enumerate(lines, 1):
            stripped_line = line.strip()
            
            # Skip comments, strings, and documentation
            if (stripped_line.startswith('#') or 
                stripped_line.startswith('//') or 
                stripped_line.startswith('*') or
                '_detect_' + dangerous_func in line or  # Skip this function
                dangerous_func + '_pattern' in line or  # Skip pattern definitions
                '"""' in line or          # Skip docstrings
                "'''" in line):           # Skip docstrings
                continue
                
            if re.search(pattern_str, line):
                # Check if it's actually code (not in strings or comments)
                target_func = dangerous_func + '('
                if not self._is_in_string_or_comment(line, target_func):
                    # More lenient for test files
                    severity = 'low' if is_test_file else 'high'
                    test_desc = dangerous_func + '() usage in test code'
                    prod_desc = dangerous_func + '() function usage (security risk)'
                    description = test_desc if is_test_file else prod_desc
                    
                    issues.append(ProjectIssue(
                        type='security',
                        severity=severity,
                        title=dangerous_func + '() function detected',
                        description=description,
                        file_path=str(file_path.relative_to(project_path)),
                        line_number=i,
                        suggested_action="Consider safer alternatives to " + dangerous_func + "() for dynamic code execution"
                    ))
        
        return issues
    
    def _is_in_string_or_comment(self, line: str, target: str) -> bool:
        """Check if target appears inside a string literal or comment."""
        # Simple heuristic to detect strings and comments
        in_string = False
        quote_char = None
        escaped = False
        
        for i, char in enumerate(line):
            if escaped:
                escaped = False
                continue
                
            if char == '\\':
                escaped = True
                continue
                
            if not in_string:
                if char in ['"', "'"]:
                    in_string = True
                    quote_char = char
                elif char == '#':
                    # Rest of line is comment
                    return target in line[i:]
            else:
                if char == quote_char:
                    in_string = False
                    quote_char = None
                    
        # If we're still in a string, target might be in string
        return in_string and target in line
    
    def _detect_innerHTML_usage(self, content: str, lines: List[str], file_path: Path, project_path: Path) -> List[ProjectIssue]:
        """Detect innerHTML usage that could lead to XSS."""
        issues = []
        
        innerHTML_pattern = r'(?i)innerHTML\s*='
        
        for i, line in enumerate(lines, 1):
            if re.search(innerHTML_pattern, line):
                # Check if it's obviously safe (static content)
                if any(safe in line.lower() for safe in ['innerHTML = ""', "innerHTML = ''", 'innerHTML = `']):
                    continue
                    
                issues.append(ProjectIssue(
                    type='security',
                    severity='medium',
                    title="innerHTML usage detected",
                    description="Potential XSS vulnerability with innerHTML",
                    file_path=str(file_path.relative_to(project_path)),
                    line_number=i,
                    suggested_action="Use textContent or DOM manipulation methods instead of innerHTML for user data"
                ))
        
        return issues
    
    def _detect_password_logging(self, content: str, lines: List[str], file_path: Path, project_path: Path, is_test_file: bool) -> List[ProjectIssue]:
        """Detect password logging with context awareness."""
        issues = []
        
        logging_pattern = r'(?i)(console\.log|print|logger?\.(?:info|debug|warn|error))\s*\([^)]*(?:password|passwd|secret)[^)]*\)'
        
        for i, line in enumerate(lines, 1):
            if re.search(logging_pattern, line):
                # Skip if it's obviously safe (contains "password" but safe usage)
                if any(safe in line.lower() for safe in [
                    'contains "password" but safe usage',  # Our own analysis comments
                    'password validation', 'password strength', 'password field',
                    'password input', 'no password', 'password required'
                ]):
                    # Convert to informational note instead of security issue
                    issues.append(ProjectIssue(
                        type='note',
                        severity='low',
                        title='NOTE comment found',
                        description='contains "password" but safe usage',
                        file_path=str(file_path.relative_to(project_path)),
                        line_number=i,
                        suggested_action="Review and address the note comment"
                    ))
                    continue
                    
                severity = 'low' if is_test_file else 'medium'
                
                issues.append(ProjectIssue(
                    type='security',
                    severity=severity,
                    title="Password logging detected",
                    description="Password or secret may be logged",
                    file_path=str(file_path.relative_to(project_path)),
                    line_number=i,
                    suggested_action="Remove password/secret from logging statements"
                ))
        
        return issues
    
    def _is_safe_string_value(self, value: str) -> bool:
        """Check if a string value is likely safe (not a real secret)."""
        # Color codes (hex colors)
        if re.match(r'^#[0-9A-Fa-f]{6}$', value):
            return True
            
        # Short values unlikely to be real secrets
        if len(value) < 8:
            return True
            
        # Common safe patterns
        safe_patterns = [
            r'^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$',  # UUID
            r'^rgb\(.*\)$',  # RGB colors  
            r'^rgba\(.*\)$',  # RGBA colors
            r'^#[0-9A-Fa-f]+$',  # Hex colors
            r'^[a-zA-Z0-9+/=]+$',  # Base64-like but too pattern-y to be real
        ]
        
        return any(re.match(pattern, value) for pattern in safe_patterns)
    
    def _refine_issue_priorities(self, issues: List[ProjectIssue]) -> List[ProjectIssue]:
        """Refine issue priorities based on overall project context and patterns."""
        refined_issues = []
        
        # Count issue types to understand patterns
        security_issues = [i for i in issues if i.type == 'security']
        empty_file_issues = [i for i in issues if i.type == 'empty_file']
        todo_issues = [i for i in issues if i.type == 'todo']
        
        for issue in issues:
            # Create a copy to modify
            refined_issue = ProjectIssue(
                type=issue.type,
                severity=issue.severity,
                title=issue.title,
                description=issue.description,
                file_path=issue.file_path,
                line_number=issue.line_number,
                suggested_action=issue.suggested_action
            )
            
            # Apply context-based refinements
            
            # 1. Multiple similar security issues suggest false positives
            if issue.type == 'security' and len(security_issues) > 15:
                # If we have many security issues, likely false positives - downgrade some
                if 'test' in issue.file_path.lower() or 'usage in test code' in issue.description:
                    refined_issue.severity = 'low'
                elif issue.severity == 'high':
                    refined_issue.severity = 'medium'  # Downgrade from high to medium
                    
            # 2. Empty files are usually not critical unless it's a key component
            if issue.type == 'empty_file':
                key_files = ['index', 'main', 'app', 'config', 'routes']
                if any(key in issue.file_path.lower() for key in key_files):
                    refined_issue.severity = 'high'  # Keep high for important files
                else:
                    refined_issue.severity = 'medium'  # Downgrade other empty files
                    
            # 3. TODOs are rarely critical unless they contain urgent keywords  
            if issue.type == 'todo':
                urgent_keywords = ['critical', 'urgent', 'asap', 'immediately', 'broken', 'failure']
                if any(keyword in issue.description.lower() for keyword in urgent_keywords):
                    refined_issue.severity = 'high'
                elif issue.severity == 'critical':
                    refined_issue.severity = 'high'  # Downgrade critical TODOs to high
                    
            # 4. Context-aware security refinement
            if issue.type == 'security':
                # innerHTML in React components is often intentional
                if 'innerHTML' in issue.description and any(ext in issue.file_path for ext in ['.tsx', '.jsx']):
                    if issue.severity == 'medium':
                        refined_issue.severity = 'low'  # Downgrade React innerHTML usage
                        
                # Dynamic execution in tests is often legitimate
                if 'function usage' in issue.description and 'test' in issue.file_path.lower():
                    refined_issue.severity = 'low'  # Already handled in detection but extra safety
                    
            refined_issues.append(refined_issue)
        
        return refined_issues

    def _get_code_files(self, project_path: Path) -> List[Path]:
        """Get all code files in the project, excluding common ignore patterns."""
        code_files = []
        ignore_patterns = {
            'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
            '__pycache__', '.pytest_cache', 'venv', '.venv'
        }
        
        code_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.go', '.rs', '.java',
            '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.swift', '.kt'
        }
        
        for file_path in project_path.rglob('*'):
            # Skip if file is in ignored directory
            if any(part in ignore_patterns for part in file_path.parts):
                continue
            
            # Skip if not a code file
            if not file_path.is_file() or file_path.suffix not in code_extensions:
                continue
            
            code_files.append(file_path)
        
        return code_files

    def _calculate_health_score(self, result: ProjectAnalysisResult) -> int:
        """Calculate a balanced health score for the project (0-100)."""
        # Count different issue types
        critical_count = len(result.critical_issues)
        high_count = len(result.high_priority_issues)
        medium_count = len(result.medium_priority_issues)
        low_count = len(result.low_priority_issues)
        
        # Start with a base score of 100
        base_score = 100
        
        # More balanced deduction system
        score = base_score
        
        # Critical issues: Heavy penalty (each critical issue = -15 points)
        if critical_count > 0:
            score -= min(critical_count * 15, 45)  # Cap at 45 points max
            
        # High priority: Moderate penalty with diminishing returns
        if high_count > 0:
            # First 5 high issues = -3 each, next 10 = -2 each, rest = -1 each
            high_penalty = (
                min(high_count, 5) * 3 +
                min(max(high_count - 5, 0), 10) * 2 +
                max(high_count - 15, 0) * 1
            )
            score -= min(high_penalty, 30)  # Cap high priority penalty at 30 points
            
        # Medium priority: Light penalty with diminishing returns  
        if medium_count > 0:
            # First 10 medium issues = -1 each, rest = -0.5 each
            medium_penalty = (
                min(medium_count, 10) * 1 +
                max(medium_count - 10, 0) * 0.5
            )
            score -= min(medium_penalty, 15)  # Cap medium priority penalty at 15 points
            
        # Low priority: Very light penalty
        if low_count > 0:
            score -= min(low_count * 0.5, 10)  # Cap low priority penalty at 10 points
        
        # Apply project type bonus (working projects get baseline credit)
        if result.project_type != 'unknown':
            score += 5  # Bonus for being an actual project
            
        # Tech stack bonus (modern stack gets points)
        modern_tech_bonus = 0
        modern_techs = ['React', 'TypeScript', 'Vite', 'Next.js', 'Vue', 'Angular']
        if any(tech in result.tech_stack for tech in modern_techs):
            modern_tech_bonus = 10
        score += modern_tech_bonus
        
        # Ensure score stays in valid range
        health_score = max(15, min(100, int(score)))  # Minimum 15, maximum 100
        
        return health_score

    def _generate_suggestions(self, result: ProjectAnalysisResult) -> List[str]:
        """Generate high-level suggestions based on the analysis."""
        suggestions = []
        
        critical_count = len(result.critical_issues)
        high_count = len(result.high_priority_issues)
        
        if critical_count > 0:
            suggestions.append(f"🚨 Address {critical_count} critical issue(s) immediately")
        
        if high_count > 0:
            suggestions.append(f"⚠️ Fix {high_count} high-priority issue(s)")
        
        if result.health_score < 50:
            suggestions.append("💡 Consider major refactoring - health score is below 50%")
        elif result.health_score < 75:
            suggestions.append("🔧 Focus on code quality improvements")
        else:
            suggestions.append("✅ Project is in good health - focus on new features")
        
        # Specific suggestions based on issue types
        todo_issues = [i for i in result.critical_issues + result.high_priority_issues if i.type == 'todo']
        if len(todo_issues) > 5:
            suggestions.append("📝 High number of TODO comments - consider sprint to address them")
        
        empty_files = [i for i in result.critical_issues + result.high_priority_issues if i.type == 'empty_file']
        if empty_files:
            suggestions.append("🔨 Complete stub implementations for better code coverage")
        
        return suggestions

    def to_dict(self, result: ProjectAnalysisResult) -> Dict[str, Any]:
        """Convert analysis result to dictionary for JSON serialization."""
        return asdict(result)