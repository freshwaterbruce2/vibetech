"""
Code Scanner for analyzing source code files and extracting context.
"""

import os
import ast
import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class CodeFile:
    """Represents a scanned code file with metadata."""
    path: str
    language: str
    content: str
    size: int
    lines_of_code: int
    hash: str
    last_modified: datetime
    imports: List[str]
    functions: List[Dict[str, Any]]
    classes: List[Dict[str, Any]]
    dependencies: List[str]
    ast_data: Dict[str, Any]

class CodeScanner:
    """
    Scans and analyzes source code files for context extraction.
    
    Supports multiple programming languages with language-specific analysis.
    """
    
    # Supported file extensions and their languages
    LANGUAGE_EXTENSIONS = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript',
        '.java': 'java',
        '.cpp': 'cpp',
        '.cc': 'cpp',
        '.cxx': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.cs': 'csharp',
        '.go': 'go',
        '.rs': 'rust',
        '.rb': 'ruby',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.r': 'r',
        '.m': 'objective-c',
        '.mm': 'objective-c',
        '.pl': 'perl',
        '.sh': 'shell',
        '.bash': 'shell',
        '.zsh': 'shell',
        '.ps1': 'powershell',
        '.sql': 'sql',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.xml': 'xml',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.toml': 'toml',
        '.ini': 'ini',
        '.cfg': 'config',
        '.conf': 'config'
    }
    
    # Default patterns to ignore
    DEFAULT_IGNORE_PATTERNS = {
        '*.pyc', '__pycache__', '.git', '.svn', '.hg', 
        'node_modules', '.vscode', '.idea', '*.min.js',
        '*.bundle.js', 'dist', 'build', 'target', 'bin',
        'obj', '.DS_Store', 'Thumbs.db', '*.log'
    }
    
    def __init__(self, ignore_patterns: Optional[Set[str]] = None):
        """
        Initialize code scanner.
        
        Args:
            ignore_patterns: Additional patterns to ignore during scanning
        """
        self.ignore_patterns = self.DEFAULT_IGNORE_PATTERNS.copy()
        if ignore_patterns:
            self.ignore_patterns.update(ignore_patterns)
        
        # Initialize language-specific analyzers
        self.analyzers = {
            'python': self._analyze_python,
            'javascript': self._analyze_javascript,
            'typescript': self._analyze_typescript,
            'java': self._analyze_java,
            'cpp': self._analyze_cpp,
            'c': self._analyze_c,
            'csharp': self._analyze_csharp,
            'go': self._analyze_go
        }
    
    def scan_directory(self, directory: str, recursive: bool = True, max_files: int = 1000) -> Dict[str, Any]:
        """
        Scan directory for code files and analyze them.
        
        Args:
            directory: Directory path to scan
            recursive: Whether to scan subdirectories
            max_files: Maximum number of files to process
            
        Returns:
            Dictionary containing scan results
        """
        directory = Path(directory)
        if not directory.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")
        
        scan_results = {
            'directory': str(directory),
            'scan_time': datetime.now().isoformat(),
            'files': [],
            'summary': {
                'total_files': 0,
                'languages': {},
                'total_lines': 0,
                'total_size': 0,
                'function_count': 0,
                'class_count': 0
            },
            'errors': []
        }
        
        try:
            # Get all code files
            code_files = self._find_code_files(directory, recursive, max_files)
            
            logger.info(f"Found {len(code_files)} code files to analyze")
            
            for file_path in code_files:
                try:
                    code_file = self.analyze_file(file_path)
                    if code_file:
                        scan_results['files'].append(code_file)
                        self._update_summary(scan_results['summary'], code_file)
                        
                except Exception as e:
                    error_msg = f"Error analyzing {file_path}: {e}"
                    logger.warning(error_msg)
                    scan_results['errors'].append(error_msg)
            
            scan_results['summary']['total_files'] = len(scan_results['files'])
            logger.info(f"Analyzed {len(scan_results['files'])} files successfully")
            
        except Exception as e:
            logger.error(f"Error scanning directory {directory}: {e}")
            scan_results['errors'].append(str(e))
        
        return scan_results
    
    def analyze_file(self, file_path: str) -> Optional[CodeFile]:
        """
        Analyze a single code file.
        
        Args:
            file_path: Path to the code file
            
        Returns:
            CodeFile object or None if analysis fails
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            logger.warning(f"File not found: {file_path}")
            return None
        
        # Determine language
        language = self._get_language(file_path)
        if not language:
            logger.debug(f"Unsupported file type: {file_path}")
            return None
        
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Basic file info
            file_stats = file_path.stat()
            file_hash = hashlib.md5(content.encode()).hexdigest()
            lines_of_code = len([line for line in content.split('\n') if line.strip()])
            
            # Initialize code file
            code_file = CodeFile(
                path=str(file_path),
                language=language,
                content=content,
                size=file_stats.st_size,
                lines_of_code=lines_of_code,
                hash=file_hash,
                last_modified=datetime.fromtimestamp(file_stats.st_mtime),
                imports=[],
                functions=[],
                classes=[],
                dependencies=[],
                ast_data={}
            )
            
            # Language-specific analysis
            if language in self.analyzers:
                self.analyzers[language](code_file)
            else:
                # Generic analysis for unsupported languages
                self._analyze_generic(code_file)
            
            return code_file
            
        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {e}")
            return None
    
    def _find_code_files(self, directory: Path, recursive: bool, max_files: int) -> List[Path]:
        """Find all code files in directory."""
        code_files = []
        
        def should_ignore(path: Path) -> bool:
            """Check if path should be ignored."""
            path_str = str(path)
            for pattern in self.ignore_patterns:
                if pattern in path_str or path.name == pattern:
                    return True
            return False
        
        if recursive:
            for file_path in directory.rglob('*'):
                if len(code_files) >= max_files:
                    break
                    
                if (file_path.is_file() and 
                    self._get_language(file_path) and 
                    not should_ignore(file_path)):
                    code_files.append(file_path)
        else:
            for file_path in directory.iterdir():
                if len(code_files) >= max_files:
                    break
                    
                if (file_path.is_file() and 
                    self._get_language(file_path) and 
                    not should_ignore(file_path)):
                    code_files.append(file_path)
        
        return sorted(code_files)
    
    def _get_language(self, file_path: Path) -> Optional[str]:
        """Determine programming language from file extension."""
        return self.LANGUAGE_EXTENSIONS.get(file_path.suffix.lower())
    
    def _update_summary(self, summary: Dict[str, Any], code_file: CodeFile) -> None:
        """Update scan summary with file information."""
        lang = code_file.language
        if lang not in summary['languages']:
            summary['languages'][lang] = {
                'files': 0,
                'lines': 0,
                'size': 0,
                'functions': 0,
                'classes': 0
            }
        
        summary['languages'][lang]['files'] += 1
        summary['languages'][lang]['lines'] += code_file.lines_of_code
        summary['languages'][lang]['size'] += code_file.size
        summary['languages'][lang]['functions'] += len(code_file.functions)
        summary['languages'][lang]['classes'] += len(code_file.classes)
        
        summary['total_lines'] += code_file.lines_of_code
        summary['total_size'] += code_file.size
        summary['function_count'] += len(code_file.functions)
        summary['class_count'] += len(code_file.classes)
    
    # Language-specific analyzers
    
    def _analyze_python(self, code_file: CodeFile) -> None:
        """Analyze Python code file."""
        try:
            tree = ast.parse(code_file.content)
            code_file.ast_data = {'node_count': len(list(ast.walk(tree)))}
            
            for node in ast.walk(tree):
                # Extract imports
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            code_file.imports.append(alias.name)
                    else:  # ImportFrom
                        module = node.module or ''
                        for alias in node.names:
                            import_name = f"{module}.{alias.name}" if module else alias.name
                            code_file.imports.append(import_name)
                
                # Extract functions
                elif isinstance(node, ast.FunctionDef):
                    func_info = {
                        'name': node.name,
                        'line_number': node.lineno,
                        'args': [arg.arg for arg in node.args.args],
                        'decorators': [ast.unparse(d) for d in node.decorator_list],
                        'is_async': isinstance(node, ast.AsyncFunctionDef),
                        'docstring': ast.get_docstring(node)
                    }
                    code_file.functions.append(func_info)
                
                # Extract classes
                elif isinstance(node, ast.ClassDef):
                    class_info = {
                        'name': node.name,
                        'line_number': node.lineno,
                        'bases': [ast.unparse(base) for base in node.bases],
                        'decorators': [ast.unparse(d) for d in node.decorator_list],
                        'methods': [],
                        'docstring': ast.get_docstring(node)
                    }
                    
                    # Get class methods
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            class_info['methods'].append(item.name)
                    
                    code_file.classes.append(class_info)
            
            # Extract dependencies from imports
            code_file.dependencies = list(set([
                imp.split('.')[0] for imp in code_file.imports 
                if not imp.startswith('.')
            ]))
            
        except SyntaxError as e:
            logger.warning(f"Python syntax error in {code_file.path}: {e}")
        except Exception as e:
            logger.warning(f"Error analyzing Python file {code_file.path}: {e}")
    
    def _analyze_javascript(self, code_file: CodeFile) -> None:
        """Analyze JavaScript code file."""
        self._analyze_js_ts_common(code_file)
    
    def _analyze_typescript(self, code_file: CodeFile) -> None:
        """Analyze TypeScript code file."""
        self._analyze_js_ts_common(code_file)
    
    def _analyze_js_ts_common(self, code_file: CodeFile) -> None:
        """Common analysis for JavaScript and TypeScript."""
        import re
        
        content = code_file.content
        
        # Extract imports/requires
        import_patterns = [
            r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+[\'"]([^\'"]+)[\'"]',
            r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)',
            r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            code_file.imports.extend(matches)
        
        # Extract functions
        function_patterns = [
            r'function\s+(\w+)\s*\(',
            r'(\w+)\s*:\s*function\s*\(',
            r'(\w+)\s*=\s*function\s*\(',
            r'(\w+)\s*=>\s*',
            r'async\s+function\s+(\w+)\s*\(',
            r'(\w+)\s*=\s*async\s*\('
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if isinstance(match, tuple):
                    match = next(m for m in match if m)
                code_file.functions.append({'name': match, 'type': 'function'})
        
        # Extract classes
        class_pattern = r'class\s+(\w+)(?:\s+extends\s+(\w+))?'
        matches = re.findall(class_pattern, content)
        for match in matches:
            class_info = {
                'name': match[0],
                'extends': match[1] if match[1] else None
            }
            code_file.classes.append(class_info)
        
        # Extract dependencies
        code_file.dependencies = list(set([
            imp.split('/')[0] for imp in code_file.imports 
            if not imp.startswith('.') and not imp.startswith('@')
        ]))
    
    def _analyze_java(self, code_file: CodeFile) -> None:
        """Analyze Java code file."""
        import re
        
        content = code_file.content
        
        # Extract imports
        import_pattern = r'import\s+(?:static\s+)?([^;]+);'
        matches = re.findall(import_pattern, content)
        code_file.imports.extend(matches)
        
        # Extract classes
        class_pattern = r'(?:public\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?'
        matches = re.findall(class_pattern, content)
        for match in matches:
            class_info = {
                'name': match[0],
                'extends': match[1] if match[1] else None,
                'implements': match[2].split(',') if match[2] else []
            }
            code_file.classes.append(class_info)
        
        # Extract methods
        method_pattern = r'(?:public|private|protected)?\s*(?:static)?\s*(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\s*{'
        matches = re.findall(method_pattern, content)
        for match in matches:
            code_file.functions.append({'name': match, 'type': 'method'})
    
    def _analyze_cpp(self, code_file: CodeFile) -> None:
        """Analyze C++ code file."""
        self._analyze_c_cpp_common(code_file)
    
    def _analyze_c(self, code_file: CodeFile) -> None:
        """Analyze C code file."""
        self._analyze_c_cpp_common(code_file)
    
    def _analyze_c_cpp_common(self, code_file: CodeFile) -> None:
        """Common analysis for C and C++."""
        import re
        
        content = code_file.content
        
        # Extract includes
        include_pattern = r'#include\s*[<"]([^>"]+)[>"]'
        matches = re.findall(include_pattern, content)
        code_file.imports.extend(matches)
        
        # Extract functions
        function_pattern = r'(?:inline\s+)?(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*{'
        matches = re.findall(function_pattern, content)
        for match in matches:
            code_file.functions.append({'name': match, 'type': 'function'})
        
        # Extract classes (C++ only)
        if code_file.language == 'cpp':
            class_pattern = r'class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+(\w+))?'
            matches = re.findall(class_pattern, content)
            for match in matches:
                class_info = {
                    'name': match[0],
                    'inherits': match[1] if match[1] else None
                }
                code_file.classes.append(class_info)
    
    def _analyze_csharp(self, code_file: CodeFile) -> None:
        """Analyze C# code file."""
        import re
        
        content = code_file.content
        
        # Extract using statements
        using_pattern = r'using\s+([^;]+);'
        matches = re.findall(using_pattern, content)
        code_file.imports.extend(matches)
        
        # Extract classes
        class_pattern = r'(?:public\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s*:\s*([^{]+))?'
        matches = re.findall(class_pattern, content)
        for match in matches:
            class_info = {
                'name': match[0],
                'inherits': match[1].split(',') if match[1] else []
            }
            code_file.classes.append(class_info)
        
        # Extract methods
        method_pattern = r'(?:public|private|protected|internal)\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)'
        matches = re.findall(method_pattern, content)
        for match in matches:
            code_file.functions.append({'name': match, 'type': 'method'})
    
    def _analyze_go(self, code_file: CodeFile) -> None:
        """Analyze Go code file."""
        import re
        
        content = code_file.content
        
        # Extract imports
        import_pattern = r'import\s*(?:\(\s*([^)]+)\s*\)|"([^"]+)")'
        matches = re.findall(import_pattern, content)
        for match in matches:
            if match[0]:  # Multi-line import
                imports = re.findall(r'"([^"]+)"', match[0])
                code_file.imports.extend(imports)
            elif match[1]:  # Single import
                code_file.imports.append(match[1])
        
        # Extract functions
        function_pattern = r'func\s+(?:\([^)]*\)\s+)?(\w+)\s*\([^)]*\)'
        matches = re.findall(function_pattern, content)
        for match in matches:
            code_file.functions.append({'name': match, 'type': 'function'})
        
        # Extract structs (Go's equivalent to classes)
        struct_pattern = r'type\s+(\w+)\s+struct'
        matches = re.findall(struct_pattern, content)
        for match in matches:
            code_file.classes.append({'name': match, 'type': 'struct'})
    
    def _analyze_generic(self, code_file: CodeFile) -> None:
        """Generic analysis for unsupported languages."""
        import re
        
        content = code_file.content
        
        # Try to extract function-like patterns
        function_patterns = [
            r'def\s+(\w+)\s*\(',  # Python-like
            r'function\s+(\w+)\s*\(',  # JavaScript-like
            r'(\w+)\s*\([^)]*\)\s*{',  # C-like
            r'sub\s+(\w+)\s*\(',  # Perl-like
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                code_file.functions.append({'name': match, 'type': 'unknown'})
        
        # Try to extract class-like patterns
        class_patterns = [
            r'class\s+(\w+)',
            r'struct\s+(\w+)',
            r'interface\s+(\w+)',
            r'module\s+(\w+)'
        ]
        
        for pattern in class_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                code_file.classes.append({'name': match, 'type': 'unknown'})