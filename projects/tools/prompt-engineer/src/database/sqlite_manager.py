"""
Core SQLite Context Manager for Interactive Prompt Engineering Tool

Manages SQLite database on D drive for prompt engineering context storage
with Windows-specific optimizations and comprehensive error handling.
"""

import sqlite3
import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from contextlib import contextmanager

from .optimizations import optimize_for_windows, get_performance_stats, run_maintenance

logger = logging.getLogger(__name__)

class SQLiteContextManager:
    """
    Manages SQLite database on D drive for prompt engineering context storage.
    
    Features:
    - Windows-optimized performance settings
    - Full-text search capabilities
    - Automatic schema management
    - Connection pooling support
    - Comprehensive error handling
    """
    
    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize database connection with configurable database path.
        
        Args:
            db_path: Full path to SQLite database. If None, uses local directory.
            
        Raises:
            sqlite3.Error: If database connection fails
            OSError: If directory creation fails
        """
        if db_path is None:
            # Default to local directory
            db_path = Path.cwd() / "databases" / "main.db"
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Connection settings
        self.connection_timeout = 30.0
        self.conn = None
        self._is_initialized = False
        
        # Connect and initialize
        self._connect()
        self._initialize_database()
        
        logger.info(f"SQLite Context Manager initialized at: {self.db_path}")
    
    def _connect(self) -> None:
        """Establish database connection with optimizations."""
        try:
            self.conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,  # Allow multi-threading
                isolation_level=None,      # Autocommit mode
                timeout=self.connection_timeout
            )
            
            # Enable row factory for dict-like access
            self.conn.row_factory = sqlite3.Row
            
            # Apply Windows-specific optimizations
            self.optimization_settings = optimize_for_windows(self.conn)
            
            logger.debug(f"Database connection established: {self.db_path}")
            
        except sqlite3.Error as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def _initialize_database(self) -> None:
        """Initialize database schema if not exists."""
        if self._is_initialized:
            return
            
        try:
            self._create_tables()
            self._create_indexes()
            self._create_fts_tables()
            self._insert_initial_data()
            self._is_initialized = True
            logger.info("Database schema initialized successfully")
            
        except sqlite3.Error as e:
            logger.error(f"Failed to initialize database schema: {e}")
            raise
    
    def _create_tables(self) -> None:
        """Create database tables."""
        cursor = self.conn.cursor()
        
        # Projects table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                settings JSON,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Context profiles table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS context_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                version INTEGER DEFAULT 1,
                profile_data JSON NOT NULL,
                embeddings BLOB,
                token_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                UNIQUE(project_id, name, version)
            )
        ''')
        
        # Code context table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS code_contexts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                language TEXT,
                content TEXT NOT NULL,
                ast_data JSON,
                imports JSON,
                functions JSON,
                classes JSON,
                dependencies JSON,
                last_modified TIMESTAMP,
                file_hash TEXT,
                file_size INTEGER,
                lines_of_code INTEGER,
                FOREIGN KEY (profile_id) REFERENCES context_profiles(id) ON DELETE CASCADE
            )
        ''')
        
        # Documentation context table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS doc_contexts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NOT NULL,
                source_path TEXT,
                content TEXT NOT NULL,
                doc_type TEXT,
                metadata JSON,
                processed_content TEXT,
                FOREIGN KEY (profile_id) REFERENCES context_profiles(id) ON DELETE CASCADE
            )
        ''')
        
        # Git repository analysis table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS git_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NOT NULL,
                repo_path TEXT,
                commit_hash TEXT,
                branch TEXT,
                hot_spots JSON,
                contributors JSON,
                change_frequency JSON,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_id) REFERENCES context_profiles(id) ON DELETE CASCADE
            )
        ''')
        
        # Conversation history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER,
                user_query TEXT NOT NULL,
                ai_response TEXT,
                context_used JSON,
                token_usage JSON,
                model_used TEXT,
                feedback_score INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_id) REFERENCES context_profiles(id) ON DELETE SET NULL
            )
        ''')
        
        # Database metadata table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS db_metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.close()
    
    def _create_indexes(self) -> None:
        """Create indexes for better query performance."""
        cursor = self.conn.cursor()
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_profiles_project ON context_profiles(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_profiles_name ON context_profiles(name)",
            "CREATE INDEX IF NOT EXISTS idx_code_profile ON code_contexts(profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_code_path ON code_contexts(file_path)",
            "CREATE INDEX IF NOT EXISTS idx_code_language ON code_contexts(language)",
            "CREATE INDEX IF NOT EXISTS idx_code_hash ON code_contexts(file_hash)",
            "CREATE INDEX IF NOT EXISTS idx_doc_profile ON doc_contexts(profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_doc_type ON doc_contexts(doc_type)",
            "CREATE INDEX IF NOT EXISTS idx_git_profile ON git_analysis(profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_profile ON conversations(profile_id)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        cursor.close()
    
    def _create_fts_tables(self) -> None:
        """Create full-text search virtual tables."""
        cursor = self.conn.cursor()
        
        # Full-text search for all content
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS context_search 
            USING fts5(
                content, 
                profile_id UNINDEXED,
                content_type UNINDEXED,
                file_path UNINDEXED,
                language UNINDEXED,
                tokenize = 'porter unicode61'
            )
        ''')
        
        # Specialized search for code
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS code_search
            USING fts5(
                content,
                functions,
                classes,
                profile_id UNINDEXED,
                file_path UNINDEXED,
                language UNINDEXED,
                tokenize = 'porter unicode61'
            )
        ''')
        
        cursor.close()
    
    def _insert_initial_data(self) -> None:
        """Insert initial metadata and configuration."""
        cursor = self.conn.cursor()
        
        # Insert database version and creation info
        initial_data = [
            ('db_version', '1.0.0'),
            ('created_at', datetime.now().isoformat()),
            ('schema_version', '1'),
            ('optimization_applied', 'true')
        ]
        
        for key, value in initial_data:
            cursor.execute('''
                INSERT OR IGNORE INTO db_metadata (key, value) 
                VALUES (?, ?)
            ''', (key, value))
        
        cursor.close()
    
    # Project Management Methods
    
    def create_project(self, name: str, description: str = None, settings: Dict = None) -> int:
        """
        Create a new project.
        
        Args:
            name: Project name (must be unique)
            description: Optional project description
            settings: Optional project settings dict
            
        Returns:
            Project ID
            
        Raises:
            sqlite3.IntegrityError: If project name already exists
        """
        cursor = self.conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO projects (name, description, settings) 
                VALUES (?, ?, ?)
            ''', (name, description, json.dumps(settings) if settings else None))
            
            project_id = cursor.lastrowid
            logger.info(f"Created project '{name}' with ID: {project_id}")
            return project_id
            
        except sqlite3.IntegrityError as e:
            logger.error(f"Project name '{name}' already exists")
            raise
        finally:
            cursor.close()
    
    def get_project(self, project_id: int) -> Optional[Dict]:
        """Get project by ID."""
        cursor = self.conn.cursor()
        try:
            cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
            row = cursor.fetchone()
            if row:
                project = dict(row)
                if project['settings']:
                    project['settings'] = json.loads(project['settings'])
                return project
            return None
        finally:
            cursor.close()
    
    def list_projects(self, active_only: bool = True) -> List[Dict]:
        """List all projects."""
        cursor = self.conn.cursor()
        try:
            if active_only:
                cursor.execute('SELECT * FROM projects WHERE is_active = 1 ORDER BY updated_at DESC')
            else:
                cursor.execute('SELECT * FROM projects ORDER BY updated_at DESC')
            
            projects = []
            for row in cursor.fetchall():
                project = dict(row)
                if project['settings']:
                    project['settings'] = json.loads(project['settings'])
                projects.append(project)
            
            return projects
        finally:
            cursor.close()
    
    # Context Profile Methods
    
    def save_context_profile(self, project_id: int, name: str, profile_data: Dict) -> int:
        """
        Save a context profile to database.
        
        Args:
            project_id: Parent project ID
            name: Profile name
            profile_data: Profile data dict
            
        Returns:
            Profile ID
        """
        cursor = self.conn.cursor()
        try:
            # Check if profile exists and get next version
            cursor.execute('''
                SELECT MAX(version) FROM context_profiles 
                WHERE project_id = ? AND name = ?
            ''', (project_id, name))
            
            result = cursor.fetchone()
            version = 1 if not result[0] else result[0] + 1
            
            # Insert new version
            cursor.execute('''
                INSERT INTO context_profiles 
                (project_id, name, version, profile_data, token_count)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                project_id, 
                name, 
                version,
                json.dumps(profile_data),
                profile_data.get('token_count', 0)
            ))
            
            profile_id = cursor.lastrowid
            logger.info(f"Saved context profile '{name}' v{version} with ID: {profile_id}")
            return profile_id
            
        finally:
            cursor.close()
    
    def get_context_profile(self, profile_id: int) -> Optional[Dict]:
        """Get context profile by ID."""
        cursor = self.conn.cursor()
        try:
            cursor.execute('SELECT * FROM context_profiles WHERE id = ?', (profile_id,))
            row = cursor.fetchone()
            if row:
                profile = dict(row)
                profile['profile_data'] = json.loads(profile['profile_data'])
                return profile
            return None
        finally:
            cursor.close()
    
    # Code Context Methods
    
    def add_code_context(self, profile_id: int, file_path: str, content: str, metadata: Dict) -> int:
        """
        Add code context to profile.
        
        Args:
            profile_id: Parent profile ID
            file_path: Path to the code file
            content: File content
            metadata: Code analysis metadata
            
        Returns:
            Code context ID
        """
        cursor = self.conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO code_contexts 
                (profile_id, file_path, language, content, ast_data, 
                 imports, functions, classes, file_hash, file_size, lines_of_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                profile_id,
                file_path,
                metadata.get('language'),
                content,
                json.dumps(metadata.get('ast_data', {})),
                json.dumps(metadata.get('imports', [])),
                json.dumps(metadata.get('functions', [])),
                json.dumps(metadata.get('classes', [])),
                metadata.get('file_hash'),
                metadata.get('file_size', len(content)),
                metadata.get('lines_of_code', content.count('\n') + 1)
            ))
            
            context_id = cursor.lastrowid
            
            # Add to full-text search
            cursor.execute('''
                INSERT INTO context_search (content, profile_id, content_type, file_path, language)
                VALUES (?, ?, 'code', ?, ?)
            ''', (content, profile_id, file_path, metadata.get('language')))
            
            cursor.execute('''
                INSERT INTO code_search (content, functions, classes, profile_id, file_path, language)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                content,
                json.dumps(metadata.get('functions', [])),
                json.dumps(metadata.get('classes', [])),
                profile_id,
                file_path,
                metadata.get('language')
            ))
            
            logger.debug(f"Added code context for {file_path}")
            return context_id
            
        finally:
            cursor.close()
    
    # Search Methods
    
    def search_context(self, query: str, profile_id: int = None, content_type: str = None, limit: int = 20) -> List[Dict]:
        """
        Search context using full-text search.
        
        Args:
            query: Search query
            profile_id: Optional profile filter
            content_type: Optional content type filter ('code', 'doc')
            limit: Maximum results to return
            
        Returns:
            List of search results
        """
        cursor = self.conn.cursor()
        try:
            where_clauses = ['context_search MATCH ?']
            params = [query]
            
            if profile_id:
                where_clauses.append('profile_id = ?')
                params.append(profile_id)
            
            if content_type:
                where_clauses.append('content_type = ?')
                params.append(content_type)
            
            where_sql = ' AND '.join(where_clauses)
            params.append(limit)
            
            cursor.execute(f'''
                SELECT snippet(context_search, 0, '<mark>', '</mark>', '...', 32) as snippet,
                       content, profile_id, content_type, file_path, language,
                       rank
                FROM context_search
                WHERE {where_sql}
                ORDER BY rank
                LIMIT ?
            ''', params)
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'snippet': row[0],
                    'content': row[1],
                    'profile_id': row[2],
                    'content_type': row[3],
                    'file_path': row[4],
                    'language': row[5],
                    'rank': row[6]
                })
            
            logger.debug(f"Search query '{query}' returned {len(results)} results")
            return results
            
        finally:
            cursor.close()
    
    # Utility Methods
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics."""
        cursor = self.conn.cursor()
        try:
            stats = {}
            
            # Table counts
            tables = ['projects', 'context_profiles', 'code_contexts', 
                     'doc_contexts', 'git_analysis', 'conversations']
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                stats[f"{table}_count"] = cursor.fetchone()[0]
            
            # Database file size
            stats['database_size_mb'] = self.db_path.stat().st_size / (1024 * 1024)
            
            # Performance stats
            perf_stats = get_performance_stats(self.conn)
            stats.update(perf_stats)
            
            # Recent activity
            cursor.execute('''
                SELECT COUNT(*) FROM conversations 
                WHERE created_at > datetime('now', '-24 hours')
            ''')
            stats['conversations_last_24h'] = cursor.fetchone()[0]
            
            return stats
            
        finally:
            cursor.close()
    
    def backup_database(self, backup_path: str = None) -> str:
        """
        Create database backup.
        
        Args:
            backup_path: Optional custom backup path
            
        Returns:
            Path to backup file
        """
        if not backup_path:
            backup_dir = self.db_path.parent / "backups"
            backup_dir.mkdir(exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = backup_dir / f"backup_{timestamp}.db"
        
        backup_path = Path(backup_path)
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Use SQLite backup API
        backup_conn = sqlite3.connect(str(backup_path))
        try:
            with backup_conn:
                self.conn.backup(backup_conn)
            logger.info(f"Database backed up to: {backup_path}")
            return str(backup_path)
        finally:
            backup_conn.close()
    
    def run_maintenance(self) -> Dict[str, Any]:
        """Run database maintenance operations."""
        return run_maintenance(self.conn)
    
    @contextmanager
    def transaction(self):
        """Context manager for database transactions."""
        cursor = self.conn.cursor()
        try:
            cursor.execute("BEGIN")
            yield cursor
            cursor.execute("COMMIT")
        except Exception:
            cursor.execute("ROLLBACK")
            raise
        finally:
            cursor.close()
    
    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Database connection closed")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()