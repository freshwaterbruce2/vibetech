"""
Database schema definitions and migration utilities for Interactive Prompt Engineering Tool.
"""

import sqlite3
import json
import logging
from typing import Dict, List, Any, Callable
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseSchema:
    """Manages database schema creation and migrations."""
    
    # Current schema version
    CURRENT_VERSION = 1
    
    def __init__(self, connection: sqlite3.Connection):
        """
        Initialize schema manager.
        
        Args:
            connection: SQLite database connection
        """
        self.conn = connection
        self.migrations = self._get_migrations()
    
    def initialize_schema(self) -> None:
        """Initialize database schema to current version."""
        try:
            # Create metadata table first
            self._create_metadata_table()
            
            # Get current schema version
            current_version = self._get_schema_version()
            
            if current_version == 0:
                logger.info("Initializing new database schema")
                self._create_initial_schema()
                self._set_schema_version(self.CURRENT_VERSION)
            elif current_version < self.CURRENT_VERSION:
                logger.info(f"Migrating schema from version {current_version} to {self.CURRENT_VERSION}")
                self._run_migrations(current_version)
            else:
                logger.info(f"Schema is up to date (version {current_version})")
                
        except sqlite3.Error as e:
            logger.error(f"Failed to initialize schema: {e}")
            raise
    
    def _create_metadata_table(self) -> None:
        """Create the database metadata table."""
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS db_metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.close()
    
    def _get_schema_version(self) -> int:
        """Get current schema version."""
        cursor = self.conn.cursor()
        try:
            cursor.execute("SELECT value FROM db_metadata WHERE key = 'schema_version'")
            result = cursor.fetchone()
            return int(result[0]) if result else 0
        except (sqlite3.Error, ValueError, TypeError):
            return 0
        finally:
            cursor.close()
    
    def _set_schema_version(self, version: int) -> None:
        """Set schema version in metadata."""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO db_metadata (key, value, updated_at) 
            VALUES ('schema_version', ?, CURRENT_TIMESTAMP)
        ''', (str(version),))
        cursor.close()
    
    def _create_initial_schema(self) -> None:
        """Create the initial database schema."""
        cursor = self.conn.cursor()
        
        # Projects table
        cursor.execute('''
            CREATE TABLE projects (
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
            CREATE TABLE context_profiles (
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
        
        # Code contexts table
        cursor.execute('''
            CREATE TABLE code_contexts (
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
        
        # Documentation contexts table
        cursor.execute('''
            CREATE TABLE doc_contexts (
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
        
        # Git analysis table
        cursor.execute('''
            CREATE TABLE git_analysis (
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
        
        # Conversations table
        cursor.execute('''
            CREATE TABLE conversations (
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
        
        # Create indexes
        self._create_indexes(cursor)
        
        # Create FTS tables
        self._create_fts_tables(cursor)
        
        # Insert initial metadata
        self._insert_initial_metadata(cursor)
        
        cursor.close()
        logger.info("Initial schema created successfully")
    
    def _create_indexes(self, cursor: sqlite3.Cursor) -> None:
        """Create database indexes."""
        indexes = [
            "CREATE INDEX idx_profiles_project ON context_profiles(project_id)",
            "CREATE INDEX idx_profiles_name ON context_profiles(name)",
            "CREATE INDEX idx_code_profile ON code_contexts(profile_id)",
            "CREATE INDEX idx_code_path ON code_contexts(file_path)",
            "CREATE INDEX idx_code_language ON code_contexts(language)",
            "CREATE INDEX idx_code_hash ON code_contexts(file_hash)",
            "CREATE INDEX idx_doc_profile ON doc_contexts(profile_id)",
            "CREATE INDEX idx_doc_type ON doc_contexts(doc_type)",
            "CREATE INDEX idx_git_profile ON git_analysis(profile_id)",
            "CREATE INDEX idx_conversations_profile ON conversations(profile_id)",
            "CREATE INDEX idx_conversations_created ON conversations(created_at)",
            "CREATE INDEX idx_projects_active ON projects(is_active)",
            "CREATE INDEX idx_projects_name ON projects(name)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
    
    def _create_fts_tables(self, cursor: sqlite3.Cursor) -> None:
        """Create full-text search tables."""
        # General content search
        cursor.execute('''
            CREATE VIRTUAL TABLE context_search 
            USING fts5(
                content, 
                profile_id UNINDEXED,
                content_type UNINDEXED,
                file_path UNINDEXED,
                language UNINDEXED,
                tokenize = 'porter unicode61'
            )
        ''')
        
        # Specialized code search
        cursor.execute('''
            CREATE VIRTUAL TABLE code_search
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
    
    def _insert_initial_metadata(self, cursor: sqlite3.Cursor) -> None:
        """Insert initial metadata."""
        metadata = [
            ('db_version', '1.0.0'),
            ('created_at', datetime.now().isoformat()),
            ('last_optimized', datetime.now().isoformat()),
            ('features', json.dumps([
                'full_text_search',
                'code_analysis',
                'git_integration',
                'conversation_history'
            ]))
        ]
        
        for key, value in metadata:
            cursor.execute('''
                INSERT INTO db_metadata (key, value) VALUES (?, ?)
            ''', (key, value))
    
    def _get_migrations(self) -> Dict[int, List[Callable]]:
        """Get migration functions for each version."""
        return {
            # Future migrations will be added here
            # 2: [self._migrate_to_v2],
            # 3: [self._migrate_to_v3],
        }
    
    def _run_migrations(self, from_version: int) -> None:
        """
        Run migrations from current version to latest.
        
        Args:
            from_version: Current schema version
        """
        for version in range(from_version + 1, self.CURRENT_VERSION + 1):
            if version in self.migrations:
                logger.info(f"Running migrations for version {version}")
                
                for migration in self.migrations[version]:
                    try:
                        migration()
                        logger.debug(f"Completed migration: {migration.__name__}")
                    except Exception as e:
                        logger.error(f"Migration {migration.__name__} failed: {e}")
                        raise
                
                self._set_schema_version(version)
                logger.info(f"Migrated to schema version {version}")
    
    def validate_schema(self) -> Dict[str, Any]:
        """
        Validate current database schema.
        
        Returns:
            Validation results
        """
        cursor = self.conn.cursor()
        results = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'table_counts': {},
            'index_counts': {},
            'fts_status': {}
        }
        
        try:
            # Check table existence
            expected_tables = [
                'projects', 'context_profiles', 'code_contexts',
                'doc_contexts', 'git_analysis', 'conversations',
                'db_metadata', 'context_search', 'code_search'
            ]
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            existing_tables = {row[0] for row in cursor.fetchall()}
            
            for table in expected_tables:
                if table not in existing_tables:
                    results['errors'].append(f"Missing table: {table}")
                    results['valid'] = False
                else:
                    # Get table count
                    if not table.endswith('_search'):  # Skip FTS tables
                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                        results['table_counts'][table] = cursor.fetchone()[0]
            
            # Check indexes
            cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
            existing_indexes = {row[0] for row in cursor.fetchall()}
            results['index_counts']['total'] = len(existing_indexes)
            
            # Check FTS tables
            for fts_table in ['context_search', 'code_search']:
                if fts_table in existing_tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {fts_table}")
                        results['fts_status'][fts_table] = {
                            'exists': True,
                            'count': cursor.fetchone()[0]
                        }
                    except sqlite3.Error as e:
                        results['fts_status'][fts_table] = {
                            'exists': True,
                            'error': str(e)
                        }
                        results['warnings'].append(f"FTS table {fts_table} has issues: {e}")
                else:
                    results['fts_status'][fts_table] = {'exists': False}
                    results['errors'].append(f"Missing FTS table: {fts_table}")
                    results['valid'] = False
            
            # Check schema version
            schema_version = self._get_schema_version()
            if schema_version != self.CURRENT_VERSION:
                results['warnings'].append(
                    f"Schema version mismatch: expected {self.CURRENT_VERSION}, got {schema_version}"
                )
        
        except sqlite3.Error as e:
            results['errors'].append(f"Schema validation error: {e}")
            results['valid'] = False
        finally:
            cursor.close()
        
        return results
    
    def get_schema_info(self) -> Dict[str, Any]:
        """
        Get comprehensive schema information.
        
        Returns:
            Schema information dictionary
        """
        cursor = self.conn.cursor()
        info = {
            'version': self._get_schema_version(),
            'tables': {},
            'indexes': [],
            'fts_tables': [],
            'metadata': {}
        }
        
        try:
            # Get table information
            cursor.execute('''
                SELECT name, sql FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            ''')
            
            for name, sql in cursor.fetchall():
                info['tables'][name] = {
                    'sql': sql,
                    'type': 'fts' if 'fts5' in sql.lower() else 'table'
                }
                
                if 'fts5' in sql.lower():
                    info['fts_tables'].append(name)
                
                # Get row count for regular tables
                if 'fts5' not in sql.lower():
                    cursor.execute(f"SELECT COUNT(*) FROM {name}")
                    info['tables'][name]['row_count'] = cursor.fetchone()[0]
            
            # Get index information
            cursor.execute('''
                SELECT name, sql FROM sqlite_master 
                WHERE type='index' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            ''')
            
            info['indexes'] = [{'name': name, 'sql': sql} for name, sql in cursor.fetchall()]
            
            # Get metadata
            cursor.execute("SELECT key, value FROM db_metadata")
            for key, value in cursor.fetchall():
                try:
                    # Try to parse as JSON
                    info['metadata'][key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    info['metadata'][key] = value
        
        except sqlite3.Error as e:
            logger.error(f"Error getting schema info: {e}")
            info['error'] = str(e)
        finally:
            cursor.close()
        
        return info