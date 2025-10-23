#!/usr/bin/env python3
"""
Advanced Context Engineering System

Provides deep codebase understanding using graph-based dependency analysis,
cross-file reference tracking, and symbol resolution. Maintains project knowledge
for context-aware AI assistance.
"""

import ast
import os
import re
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from dataclasses import dataclass, field
from collections import defaultdict, deque
from datetime import datetime

@dataclass
class CodeSymbol:
    """Represents a code symbol (function, class, variable, etc.)."""
    name: str
    type: str  # 'function', 'class', 'variable', 'import', 'constant'
    file_path: str
    line_number: int
    column_number: int = 0
    signature: Optional[str] = None
    docstring: Optional[str] = None
    parent_scope: Optional[str] = None
    access_modifier: str = "public"  # public, private, protected
    decorators: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    usages: List[Dict[str, Any]] = field(default_factory=list)

@dataclass 
class FileContext:
    """Context information for a single file."""
    path: str
    language: str
    size: int
    lines_of_code: int
    last_modified: str
    symbols: List[CodeSymbol] = field(default_factory=list)
    imports: List[Dict[str, Any]] = field(default_factory=list)
    exports: List[Dict[str, Any]] = field(default_factory=list)
    dependencies: Set[str] = field(default_factory=set)
    dependents: Set[str] = field(default_factory=set)
    complexity_score: float = 0.0
    maintainability_index: float = 0.0

@dataclass
class DependencyGraph:
    """Graph representation of project dependencies."""
    nodes: Dict[str, FileContext] = field(default_factory=dict)
    edges: Dict[str, Set[str]] = field(default_factory=dict)  # file -> set of dependencies
    reverse_edges: Dict[str, Set[str]] = field(default_factory=dict)  # file -> set of dependents
    clusters: List[Set[str]] = field(default_factory=list)
    entry_points: Set[str] = field(default_factory=set)
    
@dataclass
class CodebaseContext:
    """Comprehensive codebase context."""
    project_path: str
    project_name: str
    dependency_graph: DependencyGraph
    symbol_table: Dict[str, List[CodeSymbol]] = field(default_factory=dict)
    architecture_patterns: List[str] = field(default_factory=list)
    tech_stack: List[str] = field(default_factory=list)
    project_metrics: Dict[str, Any] = field(default_factory=dict)
    build_timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    context_hash: str = ""

class ContextEngine:
    """
    Advanced context engineering system for deep codebase understanding.
    """
    
    def __init__(self):
        self.language_parsers = self._initialize_parsers()
        self.pattern_detectors = self._initialize_pattern_detectors()
        self.context_cache: Dict[str, CodebaseContext] = {}
        
    def build_context(self, project_path: str, use_cache: bool = True) -> CodebaseContext:
        """Build comprehensive codebase context."""
        project_path = str(Path(project_path).resolve())
        context_hash = self._calculate_context_hash(project_path)
        
        # Check cache if enabled
        if use_cache and context_hash in self.context_cache:
            cached_context = self.context_cache[context_hash]
            if self._is_context_fresh(cached_context, project_path):
                return cached_context
        
        # Build new context
        context = CodebaseContext(
            project_path=project_path,
            project_name=Path(project_path).name,
            dependency_graph=DependencyGraph(),
            context_hash=context_hash
        )
        
        # Build dependency graph
        self._build_dependency_graph(project_path, context.dependency_graph)
        
        # Build symbol table
        self._build_symbol_table(context)
        
        # Detect architecture patterns
        context.architecture_patterns = self._detect_architecture_patterns(context)
        
        # Identify technology stack
        context.tech_stack = self._identify_tech_stack(project_path, context.dependency_graph)
        
        # Calculate project metrics
        context.project_metrics = self._calculate_project_metrics(context)
        
        # Cache the context
        if use_cache:
            self.context_cache[context_hash] = context
        
        return context
    
    def get_file_context(self, file_path: str, codebase_context: CodebaseContext) -> Optional[FileContext]:
        """Get detailed context for a specific file."""
        normalized_path = str(Path(file_path).resolve())
        return codebase_context.dependency_graph.nodes.get(normalized_path)
    
    def find_symbol_usages(self, symbol_name: str, codebase_context: CodebaseContext) -> List[CodeSymbol]:
        """Find all usages of a symbol across the codebase."""
        usages = []
        
        for symbols in codebase_context.symbol_table.values():
            for symbol in symbols:
                if symbol.name == symbol_name:
                    usages.append(symbol)
                # Check in dependencies and usages
                if symbol_name in symbol.dependencies:
                    usages.append(symbol)
        
        return usages
    
    def get_symbol_definition(self, symbol_name: str, file_path: str, codebase_context: CodebaseContext) -> Optional[CodeSymbol]:
        """Find the definition of a symbol in context."""
        # First check in the same file
        file_symbols = codebase_context.symbol_table.get(file_path, [])
        for symbol in file_symbols:
            if symbol.name == symbol_name and symbol.type in ['function', 'class', 'variable']:
                return symbol
        
        # Then check in imported files
        file_context = self.get_file_context(file_path, codebase_context)
        if file_context:
            for import_info in file_context.imports:
                imported_file = import_info.get('file_path')
                if imported_file:
                    imported_symbols = codebase_context.symbol_table.get(imported_file, [])
                    for symbol in imported_symbols:
                        if symbol.name == symbol_name:
                            return symbol
        
        return None
    
    def analyze_impact(self, file_path: str, codebase_context: CodebaseContext) -> Dict[str, Any]:
        """Analyze the impact of changes to a specific file."""
        normalized_path = str(Path(file_path).resolve())
        
        # Get direct dependents
        direct_dependents = codebase_context.dependency_graph.reverse_edges.get(normalized_path, set())
        
        # Get transitive dependents
        all_dependents = self._get_transitive_dependents(normalized_path, codebase_context.dependency_graph)
        
        # Calculate impact metrics
        impact_analysis = {
            "file_path": normalized_path,
            "direct_dependents": len(direct_dependents),
            "total_dependents": len(all_dependents),
            "affected_files": list(all_dependents),
            "impact_score": self._calculate_impact_score(normalized_path, all_dependents, codebase_context),
            "risk_level": self._assess_risk_level(len(all_dependents)),
            "recommended_testing": self._recommend_testing_strategy(all_dependents, codebase_context)
        }
        
        return impact_analysis
    
    def get_context_for_prompt(self, target_files: List[str], codebase_context: CodebaseContext, 
                               max_context_size: int = 10000) -> Dict[str, Any]:
        """Get optimized context for AI prompts."""
        prompt_context = {
            "project_overview": {
                "name": codebase_context.project_name,
                "architecture": codebase_context.architecture_patterns,
                "tech_stack": codebase_context.tech_stack,
                "metrics": codebase_context.project_metrics
            },
            "relevant_files": [],
            "related_symbols": [],
            "dependencies": [],
            "context_summary": ""
        }
        
        # Collect context for target files
        for file_path in target_files:
            file_context = self.get_file_context(file_path, codebase_context)
            if file_context:
                prompt_context["relevant_files"].append({
                    "path": file_context.path,
                    "language": file_context.language,
                    "symbols": [s.name for s in file_context.symbols[:5]],  # Top 5 symbols
                    "complexity": file_context.complexity_score
                })
                
                # Add dependencies
                for dep in file_context.dependencies:
                    if dep not in [f["path"] for f in prompt_context["relevant_files"]]:
                        dep_context = self.get_file_context(dep, codebase_context)
                        if dep_context:
                            prompt_context["dependencies"].append({
                                "path": dep_context.path,
                                "purpose": self._infer_file_purpose(dep_context)
                            })
        
        # Generate context summary
        prompt_context["context_summary"] = self._generate_context_summary(prompt_context)
        
        return prompt_context
    
    def _build_dependency_graph(self, project_path: str, graph: DependencyGraph):
        """Build dependency graph from project files."""
        project_path_obj = Path(project_path)
        
        # Find all code files
        code_files = self._find_code_files(project_path_obj)
        
        # Process each file
        for file_path in code_files:
            try:
                file_context = self._analyze_file(file_path)
                if file_context:
                    normalized_path = str(file_path.resolve())
                    graph.nodes[normalized_path] = file_context
                    
                    # Build edges from imports/dependencies
                    dependencies = self._extract_dependencies(file_path, file_context)
                    graph.edges[normalized_path] = dependencies
                    
                    # Build reverse edges
                    for dep in dependencies:
                        if dep not in graph.reverse_edges:
                            graph.reverse_edges[dep] = set()
                        graph.reverse_edges[dep].add(normalized_path)
                    
            except Exception as e:
                print(f"Warning: Failed to analyze {file_path}: {e}")
                continue
        
        # Identify entry points
        graph.entry_points = self._identify_entry_points(graph)
        
        # Detect clusters
        graph.clusters = self._detect_clusters(graph)
    
    def _analyze_file(self, file_path: Path) -> Optional[FileContext]:
        """Analyze a single file to extract context."""
        if not file_path.is_file():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            return None
        
        language = self._detect_language(file_path)
        
        file_context = FileContext(
            path=str(file_path.resolve()),
            language=language,
            size=len(content),
            lines_of_code=len([line for line in content.split('\n') if line.strip()]),
            last_modified=datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
        )
        
        # Parse symbols based on language
        if language in self.language_parsers:
            parser = self.language_parsers[language]
            symbols = parser(content, str(file_path))
            file_context.symbols = symbols
        
        # Extract imports and exports
        file_context.imports = self._extract_imports(content, language)
        file_context.exports = self._extract_exports(content, language)
        
        # Calculate complexity metrics
        file_context.complexity_score = self._calculate_complexity(content, language)
        file_context.maintainability_index = self._calculate_maintainability(file_context)
        
        return file_context
    
    def _extract_dependencies(self, file_path: Path, file_context: FileContext) -> Set[str]:
        """Extract file dependencies from imports and references."""
        dependencies = set()
        project_root = self._find_project_root(file_path)
        
        for import_info in file_context.imports:
            # Resolve import to actual file path
            resolved_path = self._resolve_import_path(import_info, file_path, project_root)
            if resolved_path:
                dependencies.add(str(resolved_path))
        
        return dependencies
    
    def _find_code_files(self, project_path: Path) -> List[Path]:
        """Find all code files in the project."""
        code_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h', '.hpp',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.m',
            '.vue', '.svelte'
        }
        
        ignore_patterns = {
            'node_modules', '.git', '__pycache__', '.pytest_cache', 'dist', 'build',
            '.next', 'coverage', 'venv', '.venv', '.tox', 'target'
        }
        
        code_files = []
        
        for file_path in project_path.rglob('*'):
            # Skip ignored directories
            if any(part in ignore_patterns for part in file_path.parts):
                continue
            
            # Check if it's a code file
            if file_path.is_file() and file_path.suffix in code_extensions:
                code_files.append(file_path)
        
        return code_files
    
    def _detect_language(self, file_path: Path) -> str:
        """Detect programming language from file extension."""
        extension_map = {
            '.py': 'python',
            '.js': 'javascript', 
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.r': 'r',
            '.m': 'objective-c',
            '.vue': 'vue',
            '.svelte': 'svelte'
        }
        
        return extension_map.get(file_path.suffix.lower(), 'unknown')
    
    def _initialize_parsers(self) -> Dict[str, Any]:
        """Initialize language-specific parsers."""
        return {
            'python': self._parse_python,
            'javascript': self._parse_javascript,
            'typescript': self._parse_typescript,
            'java': self._parse_java,
            # Add more parsers as needed
        }
    
    def _parse_python(self, content: str, file_path: str) -> List[CodeSymbol]:
        """Parse Python code to extract symbols."""
        symbols = []
        
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    symbol = CodeSymbol(
                        name=node.name,
                        type='function',
                        file_path=file_path,
                        line_number=node.lineno,
                        column_number=node.col_offset,
                        signature=self._get_function_signature(node),
                        docstring=ast.get_docstring(node),
                        decorators=[d.id if isinstance(d, ast.Name) else str(d) for d in node.decorator_list]
                    )
                    symbols.append(symbol)
                
                elif isinstance(node, ast.ClassDef):
                    symbol = CodeSymbol(
                        name=node.name,
                        type='class',
                        file_path=file_path,
                        line_number=node.lineno,
                        column_number=node.col_offset,
                        docstring=ast.get_docstring(node),
                        decorators=[d.id if isinstance(d, ast.Name) else str(d) for d in node.decorator_list]
                    )
                    symbols.append(symbol)
                
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            symbol = CodeSymbol(
                                name=target.id,
                                type='variable',
                                file_path=file_path,
                                line_number=node.lineno,
                                column_number=node.col_offset
                            )
                            symbols.append(symbol)
        
        except SyntaxError:
            # If AST parsing fails, fall back to regex parsing
            symbols.extend(self._parse_with_regex(content, file_path, 'python'))
        
        return symbols
    
    def _parse_javascript(self, content: str, file_path: str) -> List[CodeSymbol]:
        """Parse JavaScript code to extract symbols."""
        return self._parse_with_regex(content, file_path, 'javascript')
    
    def _parse_typescript(self, content: str, file_path: str) -> List[CodeSymbol]:
        """Parse TypeScript code to extract symbols."""
        return self._parse_with_regex(content, file_path, 'typescript')
    
    def _parse_java(self, content: str, file_path: str) -> List[CodeSymbol]:
        """Parse Java code to extract symbols."""
        return self._parse_with_regex(content, file_path, 'java')
    
    def _parse_with_regex(self, content: str, file_path: str, language: str) -> List[CodeSymbol]:
        """Fallback regex-based parsing for languages without AST support."""
        symbols = []
        lines = content.split('\n')
        
        patterns = {
            'python': {
                'function': r'^def\s+(\w+)\s*\(',
                'class': r'^class\s+(\w+)\s*[:\(]',
                'variable': r'^(\w+)\s*='
            },
            'javascript': {
                'function': r'(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*{)|(\w+)\s*:\s*(?:async\s+)?function)',
                'class': r'class\s+(\w+)',
                'variable': r'(?:const|let|var)\s+(\w+)'
            },
            'typescript': {
                'function': r'(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*{)|(\w+)\s*:\s*(?:async\s+)?function)',
                'class': r'class\s+(\w+)',
                'variable': r'(?:const|let|var)\s+(\w+)',
                'interface': r'interface\s+(\w+)',
                'type': r'type\s+(\w+)'
            },
            'java': {
                'function': r'(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(',
                'class': r'(?:public|private)?\s*class\s+(\w+)',
                'variable': r'(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*[=;]'
            }
        }
        
        if language not in patterns:
            return symbols
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            for symbol_type, pattern in patterns[language].items():
                matches = re.findall(pattern, line)
                for match in matches:
                    # Handle tuple results from groups
                    if isinstance(match, tuple):
                        name = next((m for m in match if m), None)
                    else:
                        name = match
                    
                    if name:
                        symbol = CodeSymbol(
                            name=name,
                            type=symbol_type,
                            file_path=file_path,
                            line_number=line_num
                        )
                        symbols.append(symbol)
        
        return symbols
    
    def _extract_imports(self, content: str, language: str) -> List[Dict[str, Any]]:
        """Extract import statements from code."""
        imports = []
        lines = content.split('\n')
        
        import_patterns = {
            'python': [
                r'import\s+([\w.]+)(?:\s+as\s+(\w+))?',
                r'from\s+([\w.]+)\s+import\s+((?:\w+(?:\s*,\s*\w+)*|\*))',
            ],
            'javascript': [
                r'import\s+(?:(\w+)|{([^}]+)})\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'const\s+(?:(\w+)|{([^}]+)})\s*=\s*require\([\'"]([^\'"]+)[\'"]\)',
            ],
            'typescript': [
                r'import\s+(?:(\w+)|{([^}]+)})\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'import\s+type\s+(?:(\w+)|{([^}]+)})\s+from\s+[\'"]([^\'"]+)[\'"]',
            ]
        }
        
        if language not in import_patterns:
            return imports
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            for pattern in import_patterns[language]:
                matches = re.findall(pattern, line)
                for match in matches:
                    import_info = {
                        'line_number': line_num,
                        'raw_line': line,
                        'match': match
                    }
                    imports.append(import_info)
        
        return imports
    
    def _extract_exports(self, content: str, language: str) -> List[Dict[str, Any]]:
        """Extract export statements from code."""
        exports = []
        lines = content.split('\n')
        
        export_patterns = {
            'javascript': [
                r'export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)',
                r'export\s+{\s*([^}]+)\s*}',
                r'export\s+default\s+(\w+)',
                r'module\.exports\s*=\s*(\w+)',
            ],
            'typescript': [
                r'export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)',
                r'export\s+{\s*([^}]+)\s*}',
                r'export\s+default\s+(\w+)',
            ]
        }
        
        if language not in export_patterns:
            return exports
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            for pattern in export_patterns[language]:
                matches = re.findall(pattern, line)
                for match in matches:
                    export_info = {
                        'line_number': line_num,
                        'raw_line': line,
                        'exported_name': match
                    }
                    exports.append(export_info)
        
        return exports
    
    def _get_function_signature(self, node: ast.FunctionDef) -> str:
        """Get function signature from AST node."""
        args = []
        for arg in node.args.args:
            args.append(arg.arg)
        return f"{node.name}({', '.join(args)})"
    
    def _calculate_complexity(self, content: str, language: str) -> float:
        """Calculate cyclomatic complexity approximation."""
        complexity_keywords = {
            'python': ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'with'],
            'javascript': ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch'],
            'typescript': ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch'],
            'java': ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch']
        }
        
        if language not in complexity_keywords:
            return 0.0
        
        keywords = complexity_keywords[language]
        complexity = 1  # Base complexity
        
        for keyword in keywords:
            # Count keyword occurrences
            pattern = r'\b' + keyword + r'\b'
            complexity += len(re.findall(pattern, content, re.IGNORECASE))
        
        # Normalize by lines of code
        lines = len([line for line in content.split('\n') if line.strip()])
        return complexity / max(lines, 1)
    
    def _calculate_maintainability(self, file_context: FileContext) -> float:
        """Calculate maintainability index approximation."""
        # Simplified maintainability calculation
        loc = file_context.lines_of_code
        complexity = file_context.complexity_score
        
        if loc == 0:
            return 100.0
        
        # Higher complexity and length reduce maintainability
        maintainability = 100 - (complexity * 10) - (loc / 100)
        return max(0.0, min(100.0, maintainability))
    
    def _resolve_import_path(self, import_info: Dict[str, Any], current_file: Path, project_root: Path) -> Optional[Path]:
        """Resolve import statement to actual file path."""
        # This is a simplified version - real implementation would handle:
        # - Node.js module resolution
        # - Python package resolution
        # - Relative vs absolute imports
        # - Package.json/setup.py configurations
        
        # For now, just handle relative imports
        raw_line = import_info.get('raw_line', '')
        
        # Extract import path from various patterns
        import_path = None
        if 'from' in raw_line:
            match = re.search(r'[\'"]([^\'"]+)[\'"]', raw_line)
            if match:
                import_path = match.group(1)
        
        if not import_path:
            return None
        
        # Handle relative imports
        if import_path.startswith('.'):
            base_dir = current_file.parent
            # Convert relative path to absolute
            try:
                resolved = (base_dir / import_path).resolve()
                if resolved.is_file():
                    return resolved
                # Try with common extensions
                for ext in ['.py', '.js', '.ts', '.jsx', '.tsx']:
                    candidate = resolved.with_suffix(ext)
                    if candidate.is_file():
                        return candidate
            except:
                pass
        
        return None
    
    def _find_project_root(self, file_path: Path) -> Path:
        """Find the project root directory."""
        # Look for common project indicators
        indicators = [
            'package.json', 'setup.py', 'pyproject.toml', 'Cargo.toml',
            'pom.xml', 'build.gradle', '.git', '.gitignore'
        ]
        
        current = file_path.parent
        while current != current.parent:
            for indicator in indicators:
                if (current / indicator).exists():
                    return current
            current = current.parent
        
        return file_path.parent  # Fallback
    
    def _identify_entry_points(self, graph: DependencyGraph) -> Set[str]:
        """Identify entry point files in the project."""
        entry_points = set()
        
        # Files with no dependents (or few dependents) might be entry points
        for file_path, node in graph.nodes.items():
            dependents = graph.reverse_edges.get(file_path, set())
            if len(dependents) <= 1:  # Entry points have few dependents
                # Check if it looks like an entry point
                if self._looks_like_entry_point(node):
                    entry_points.add(file_path)
        
        return entry_points
    
    def _looks_like_entry_point(self, file_context: FileContext) -> bool:
        """Check if a file looks like an entry point."""
        filename = Path(file_context.path).name.lower()
        
        # Common entry point patterns
        entry_patterns = [
            'main.py', 'app.py', 'index.js', 'index.ts', 'main.js', 'main.ts',
            'server.py', 'server.js', 'run.py', 'cli.py', 'manage.py'
        ]
        
        if filename in entry_patterns:
            return True
        
        # Check for main function or if __name__ == "__main__"
        for symbol in file_context.symbols:
            if symbol.name == 'main' and symbol.type == 'function':
                return True
        
        return False
    
    def _detect_clusters(self, graph: DependencyGraph) -> List[Set[str]]:
        """Detect clusters of related files."""
        clusters = []
        visited = set()
        
        # Simple clustering based on directory structure
        directory_clusters = defaultdict(set)
        
        for file_path in graph.nodes:
            directory = str(Path(file_path).parent)
            directory_clusters[directory].add(file_path)
        
        # Convert to list of sets
        for cluster in directory_clusters.values():
            if len(cluster) > 1:  # Only include clusters with multiple files
                clusters.append(cluster)
        
        return clusters
    
    def _build_symbol_table(self, context: CodebaseContext):
        """Build global symbol table from all files."""
        for file_path, file_context in context.dependency_graph.nodes.items():
            context.symbol_table[file_path] = file_context.symbols
    
    def _detect_architecture_patterns(self, context: CodebaseContext) -> List[str]:
        """Detect architecture patterns from code structure."""
        patterns = []
        
        # Analyze directory structure
        directories = set()
        for file_path in context.dependency_graph.nodes:
            path_parts = Path(file_path).parts
            directories.update(path_parts)
        
        # MVC pattern
        if any('model' in d.lower() for d in directories) and \
           any('view' in d.lower() for d in directories) and \
           any('controller' in d.lower() for d in directories):
            patterns.append('MVC')
        
        # Microservices pattern
        if any('service' in d.lower() for d in directories) and \
           len([d for d in directories if 'service' in d.lower()]) > 2:
            patterns.append('Microservices')
        
        # Layered architecture
        if any('layer' in d.lower() or 'tier' in d.lower() for d in directories):
            patterns.append('Layered')
        
        # Component-based (React, Vue, etc.)
        if any('component' in d.lower() for d in directories):
            patterns.append('Component-Based')
        
        return patterns
    
    def _identify_tech_stack(self, project_path: str, graph: DependencyGraph) -> List[str]:
        """Identify technology stack from files and dependencies."""
        tech_stack = []
        project_root = Path(project_path)
        
        # Check configuration files
        config_files = {
            'package.json': ['Node.js', 'npm'],
            'requirements.txt': ['Python', 'pip'],
            'Pipfile': ['Python', 'pipenv'],
            'pyproject.toml': ['Python'],
            'Cargo.toml': ['Rust'],
            'pom.xml': ['Java', 'Maven'],
            'build.gradle': ['Java', 'Gradle'],
            'composer.json': ['PHP'],
            'go.mod': ['Go'],
        }
        
        for config_file, techs in config_files.items():
            if (project_root / config_file).exists():
                tech_stack.extend(techs)
        
        # Check file extensions
        extensions = set()
        for file_path in graph.nodes:
            ext = Path(file_path).suffix.lower()
            if ext:
                extensions.add(ext)
        
        extension_tech = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.jsx': 'React',
            '.ts': 'TypeScript', 
            '.tsx': 'React + TypeScript',
            '.vue': 'Vue.js',
            '.svelte': 'Svelte',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin'
        }
        
        for ext in extensions:
            if ext in extension_tech:
                tech_stack.append(extension_tech[ext])
        
        return list(set(tech_stack))  # Remove duplicates
    
    def _calculate_project_metrics(self, context: CodebaseContext) -> Dict[str, Any]:
        """Calculate various project metrics."""
        nodes = context.dependency_graph.nodes
        
        if not nodes:
            return {}
        
        total_files = len(nodes)
        total_loc = sum(node.lines_of_code for node in nodes.values())
        avg_complexity = sum(node.complexity_score for node in nodes.values()) / total_files
        avg_maintainability = sum(node.maintainability_index for node in nodes.values()) / total_files
        
        # Dependency metrics
        edges = context.dependency_graph.edges
        total_dependencies = sum(len(deps) for deps in edges.values())
        avg_dependencies = total_dependencies / max(total_files, 1)
        
        # Symbol metrics
        total_symbols = sum(len(symbols) for symbols in context.symbol_table.values())
        symbol_types = defaultdict(int)
        for symbols in context.symbol_table.values():
            for symbol in symbols:
                symbol_types[symbol.type] += 1
        
        return {
            'total_files': total_files,
            'total_lines_of_code': total_loc,
            'average_file_size': total_loc / max(total_files, 1),
            'average_complexity': avg_complexity,
            'average_maintainability': avg_maintainability,
            'total_dependencies': total_dependencies,
            'average_dependencies_per_file': avg_dependencies,
            'total_symbols': total_symbols,
            'symbols_by_type': dict(symbol_types),
            'architecture_patterns': context.architecture_patterns,
            'technology_stack': context.tech_stack
        }
    
    def _get_transitive_dependents(self, file_path: str, graph: DependencyGraph) -> Set[str]:
        """Get all transitive dependents of a file."""
        visited = set()
        queue = deque([file_path])
        
        while queue:
            current = queue.popleft()
            if current in visited:
                continue
            visited.add(current)
            
            # Add direct dependents
            dependents = graph.reverse_edges.get(current, set())
            for dependent in dependents:
                if dependent not in visited:
                    queue.append(dependent)
        
        visited.discard(file_path)  # Remove the original file
        return visited
    
    def _calculate_impact_score(self, file_path: str, dependents: Set[str], context: CodebaseContext) -> float:
        """Calculate impact score for a file based on its dependents."""
        if not dependents:
            return 0.0
        
        # Base score from number of dependents
        base_score = len(dependents)
        
        # Weight by importance of dependents
        importance_weight = 0
        for dependent in dependents:
            file_context = context.dependency_graph.nodes.get(dependent)
            if file_context:
                # More complex files are more important
                importance_weight += file_context.complexity_score
                # Files with more symbols are more important
                importance_weight += len(file_context.symbols) * 0.1
        
        return base_score + importance_weight
    
    def _assess_risk_level(self, dependent_count: int) -> str:
        """Assess risk level based on number of dependents."""
        if dependent_count == 0:
            return "Low"
        elif dependent_count < 5:
            return "Medium"
        elif dependent_count < 15:
            return "High"
        else:
            return "Critical"
    
    def _recommend_testing_strategy(self, dependents: Set[str], context: CodebaseContext) -> List[str]:
        """Recommend testing strategy based on dependents."""
        recommendations = []
        
        if len(dependents) == 0:
            recommendations.append("Unit tests for the modified file")
        elif len(dependents) < 5:
            recommendations.append("Unit tests for the modified file")
            recommendations.append("Integration tests for direct dependents")
        else:
            recommendations.append("Comprehensive unit test suite")
            recommendations.append("Integration tests for all affected modules")
            recommendations.append("End-to-end tests for critical user flows")
            recommendations.append("Consider feature flags for gradual rollout")
        
        return recommendations
    
    def _infer_file_purpose(self, file_context: FileContext) -> str:
        """Infer the purpose of a file from its context."""
        filename = Path(file_context.path).name.lower()
        
        # Common patterns
        if 'test' in filename:
            return "Testing"
        elif 'config' in filename:
            return "Configuration"
        elif 'util' in filename or 'helper' in filename:
            return "Utilities"
        elif 'model' in filename:
            return "Data Model"
        elif 'view' in filename or 'component' in filename:
            return "UI Component"
        elif 'controller' in filename or 'handler' in filename:
            return "Business Logic"
        elif 'service' in filename:
            return "Service Layer"
        else:
            return "Core Logic"
    
    def _generate_context_summary(self, prompt_context: Dict[str, Any]) -> str:
        """Generate a summary of the context for AI prompts."""
        overview = prompt_context['project_overview']
        files = prompt_context['relevant_files']
        deps = prompt_context['dependencies']
        
        summary_parts = [
            f"Project: {overview['name']}",
            f"Architecture: {', '.join(overview['architecture']) or 'Standard'}",
            f"Tech Stack: {', '.join(overview['tech_stack'])}",
            f"Files in scope: {len(files)}",
            f"Dependencies: {len(deps)}"
        ]
        
        return " | ".join(summary_parts)
    
    def _calculate_context_hash(self, project_path: str) -> str:
        """Calculate hash for caching context."""
        # Simple hash based on project path and modification times
        hasher = hashlib.md5()
        hasher.update(project_path.encode())
        
        try:
            # Add modification times of key files
            for pattern in ['*.py', '*.js', '*.ts', '*.jsx', '*.tsx']:
                for file_path in Path(project_path).rglob(pattern):
                    if file_path.is_file():
                        mtime = str(file_path.stat().st_mtime)
                        hasher.update(mtime.encode())
        except Exception:
            # If we can't get modification times, just use current timestamp
            hasher.update(str(datetime.now().timestamp()).encode())
        
        return hasher.hexdigest()
    
    def _is_context_fresh(self, context: CodebaseContext, project_path: str) -> bool:
        """Check if cached context is still fresh."""
        # Simple freshness check - in production, this could be more sophisticated
        try:
            build_time = datetime.fromisoformat(context.build_timestamp)
            now = datetime.now()
            age = now - build_time
            
            # Consider context fresh for 1 hour
            return age.total_seconds() < 3600
        except:
            return False
    
    def _initialize_pattern_detectors(self) -> Dict[str, Any]:
        """Initialize architecture pattern detectors."""
        return {
            'mvc': self._detect_mvc_pattern,
            'microservices': self._detect_microservices_pattern,
            'layered': self._detect_layered_pattern,
            'component': self._detect_component_pattern
        }
    
    def _detect_mvc_pattern(self, context: CodebaseContext) -> bool:
        """Detect MVC architecture pattern."""
        # Implementation for MVC detection
        return False
    
    def _detect_microservices_pattern(self, context: CodebaseContext) -> bool:
        """Detect microservices architecture pattern."""
        # Implementation for microservices detection
        return False
    
    def _detect_layered_pattern(self, context: CodebaseContext) -> bool:
        """Detect layered architecture pattern."""
        # Implementation for layered architecture detection
        return False
    
    def _detect_component_pattern(self, context: CodebaseContext) -> bool:
        """Detect component-based architecture pattern."""
        # Implementation for component-based detection
        return False