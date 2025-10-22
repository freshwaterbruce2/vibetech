"""
Comprehensive unit tests for SQLite database components.

Tests database functionality including:
- SQLiteContextManager operations
- Connection pooling
- CRUD operations
- Full-text search
- Performance optimizations
- Error handling and edge cases
"""

import pytest
import tempfile
import sqlite3
import json
import threading
import time
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor, as_completed

from database.sqlite_manager import SQLiteContextManager
from database.connection_pool import SQLiteConnectionPool, SingletonConnectionPool


class TestSQLiteContextManager:
    """Test suite for SQLiteContextManager class."""
    
    def test_initialization_success(self, temp_database):
        """Test successful database initialization."""
        manager = SQLiteContextManager(temp_database)
        
        assert manager.db_path == Path(temp_database)
        assert manager.conn is not None
        assert manager._is_initialized is True
        
        # Verify tables were created
        cursor = manager.conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        
        expected_tables = [
            'projects', 'context_profiles', 'code_contexts',
            'doc_contexts', 'git_analysis', 'conversations', 'db_metadata'
        ]
        for table in expected_tables:
            assert table in tables
        
        manager.close()
    
    def test_initialization_creates_directory(self):
        """Test that initialization creates necessary directories."""
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "subdir" / "test.db"
            
            manager = SQLiteContextManager(str(db_path))
            
            assert db_path.parent.exists()
            assert db_path.exists()
            
            manager.close()
    
    def test_context_manager_protocol(self, temp_database):
        """Test context manager protocol (__enter__ and __exit__)."""
        with SQLiteContextManager(temp_database) as manager:
            assert manager.conn is not None
            
        # Connection should be closed after context
        with pytest.raises(sqlite3.ProgrammingError):
            cursor = manager.conn.cursor()
            cursor.execute("SELECT 1")
    
    def test_create_project_success(self, sqlite_manager):
        """Test successful project creation."""
        project_id = sqlite_manager.create_project(
            name="Test Project",
            description="A test project",
            settings={"debug": True}
        )
        
        assert isinstance(project_id, int)
        assert project_id > 0
        
        # Verify project was created
        project = sqlite_manager.get_project(project_id)
        assert project['name'] == "Test Project"
        assert project['description'] == "A test project"
        assert project['settings'] == {"debug": True}
        assert project['is_active'] is True
    
    def test_create_project_duplicate_name(self, sqlite_manager):
        """Test error when creating project with duplicate name."""
        sqlite_manager.create_project("Duplicate Name")
        
        with pytest.raises(sqlite3.IntegrityError):
            sqlite_manager.create_project("Duplicate Name")
    
    def test_get_project_nonexistent(self, sqlite_manager):
        """Test getting non-existent project returns None."""
        result = sqlite_manager.get_project(99999)
        assert result is None
    
    def test_list_projects(self, sqlite_manager):
        """Test listing projects."""
        # Create test projects
        active_id = sqlite_manager.create_project("Active Project", settings={"active": True})
        inactive_id = sqlite_manager.create_project("Inactive Project")
        
        # Make one inactive
        cursor = sqlite_manager.conn.cursor()
        cursor.execute("UPDATE projects SET is_active = 0 WHERE id = ?", (inactive_id,))
        cursor.close()
        
        # Test listing active only
        active_projects = sqlite_manager.list_projects(active_only=True)
        assert len(active_projects) == 1
        assert active_projects[0]['name'] == "Active Project"
        
        # Test listing all
        all_projects = sqlite_manager.list_projects(active_only=False)
        assert len(all_projects) == 2
    
    def test_save_and_get_context_profile(self, sqlite_manager):
        """Test saving and retrieving context profiles."""
        # Create project first
        project_id = sqlite_manager.create_project("Profile Test Project")
        
        # Create profile data
        profile_data = {
            "code_files": ["main.py", "utils.py"],
            "git_info": {"branch": "main", "commit": "abc123"},
            "token_count": 1500
        }
        
        # Save profile
        profile_id = sqlite_manager.save_context_profile(
            project_id, "test_profile", profile_data
        )
        
        assert isinstance(profile_id, int)
        assert profile_id > 0
        
        # Retrieve profile
        retrieved = sqlite_manager.get_context_profile(profile_id)
        assert retrieved['project_id'] == project_id
        assert retrieved['name'] == "test_profile"
        assert retrieved['version'] == 1
        assert retrieved['profile_data'] == profile_data
        assert retrieved['token_count'] == 1500
    
    def test_save_context_profile_versioning(self, sqlite_manager):
        """Test context profile versioning."""
        project_id = sqlite_manager.create_project("Version Test")
        
        # Save multiple versions of same profile
        profile_data_v1 = {"version": 1}
        profile_data_v2 = {"version": 2}
        
        profile_id_v1 = sqlite_manager.save_context_profile(
            project_id, "versioned_profile", profile_data_v1
        )
        profile_id_v2 = sqlite_manager.save_context_profile(
            project_id, "versioned_profile", profile_data_v2
        )
        
        # Should be different IDs
        assert profile_id_v1 != profile_id_v2
        
        # Check versions
        profile_v1 = sqlite_manager.get_context_profile(profile_id_v1)
        profile_v2 = sqlite_manager.get_context_profile(profile_id_v2)
        
        assert profile_v1['version'] == 1
        assert profile_v2['version'] == 2
    
    def test_add_code_context(self, sqlite_manager):
        """Test adding code context."""
        # Setup
        project_id = sqlite_manager.create_project("Code Context Test")
        profile_id = sqlite_manager.save_context_profile(
            project_id, "test_profile", {}
        )
        
        # Add code context
        file_content = "def hello(): print('world')"
        metadata = {
            "language": "python",
            "imports": ["sys"],
            "functions": [{"name": "hello"}],
            "classes": [],
            "file_hash": "abc123",
            "file_size": len(file_content),
            "lines_of_code": 1
        }
        
        context_id = sqlite_manager.add_code_context(
            profile_id, "/path/to/file.py", file_content, metadata
        )
        
        assert isinstance(context_id, int)
        assert context_id > 0
        
        # Verify code context was added to FTS tables
        cursor = sqlite_manager.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM context_search WHERE profile_id = ?", (profile_id,))
        assert cursor.fetchone()[0] == 1
        
        cursor.execute("SELECT COUNT(*) FROM code_search WHERE profile_id = ?", (profile_id,))
        assert cursor.fetchone()[0] == 1
        cursor.close()
    
    def test_search_context(self, sqlite_manager):
        """Test full-text search functionality."""
        # Setup
        project_id = sqlite_manager.create_project("Search Test")
        profile_id = sqlite_manager.save_context_profile(project_id, "search_profile", {})
        
        # Add searchable content
        content1 = "def calculate_fibonacci(n): return n if n <= 1 else calculate_fibonacci(n-1) + calculate_fibonacci(n-2)"
        content2 = "class Calculator: def add(self, a, b): return a + b"
        
        sqlite_manager.add_code_context(profile_id, "fibonacci.py", content1, {"language": "python"})
        sqlite_manager.add_code_context(profile_id, "calculator.py", content2, {"language": "python"})
        
        # Test search
        results = sqlite_manager.search_context("fibonacci", profile_id=profile_id)
        
        assert len(results) >= 1
        assert any("fibonacci" in result['content'].lower() for result in results)
        
        # Test search with filters
        python_results = sqlite_manager.search_context("def", profile_id=profile_id, content_type="code")
        assert len(python_results) >= 2
    
    def test_database_stats(self, sqlite_manager):
        """Test database statistics generation."""
        # Create some test data
        project_id = sqlite_manager.create_project("Stats Test")
        profile_id = sqlite_manager.save_context_profile(project_id, "stats_profile", {})
        sqlite_manager.add_code_context(profile_id, "test.py", "print('test')", {"language": "python"})
        
        stats = sqlite_manager.get_database_stats()
        
        # Verify stats structure
        assert 'projects_count' in stats
        assert 'context_profiles_count' in stats
        assert 'code_contexts_count' in stats
        assert 'database_size_mb' in stats
        assert 'conversations_last_24h' in stats
        
        # Verify counts
        assert stats['projects_count'] >= 1
        assert stats['context_profiles_count'] >= 1
        assert stats['code_contexts_count'] >= 1
        assert stats['database_size_mb'] > 0
    
    def test_backup_database(self, sqlite_manager, temp_directory):
        """Test database backup functionality."""
        # Add some data
        project_id = sqlite_manager.create_project("Backup Test")
        
        # Create backup
        backup_path = sqlite_manager.backup_database(str(temp_directory / "backup.db"))
        
        assert Path(backup_path).exists()
        
        # Verify backup contains data
        backup_conn = sqlite3.connect(backup_path)
        cursor = backup_conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM projects")
        count = cursor.fetchone()[0]
        cursor.close()
        backup_conn.close()
        
        assert count >= 1
    
    def test_transaction_context_manager(self, sqlite_manager):
        """Test transaction context manager."""
        project_id = sqlite_manager.create_project("Transaction Test")
        
        # Test successful transaction
        with sqlite_manager.transaction() as cursor:
            cursor.execute(
                "UPDATE projects SET description = ? WHERE id = ?",
                ("Updated description", project_id)
            )
        
        # Verify update
        project = sqlite_manager.get_project(project_id)
        assert project['description'] == "Updated description"
        
        # Test failed transaction (should rollback)
        try:
            with sqlite_manager.transaction() as cursor:
                cursor.execute(
                    "UPDATE projects SET description = ? WHERE id = ?",
                    ("Another update", project_id)
                )
                raise ValueError("Simulated error")
        except ValueError:
            pass
        
        # Verify rollback - description should still be "Updated description"
        project = sqlite_manager.get_project(project_id)
        assert project['description'] == "Updated description"
    
    def test_run_maintenance(self, sqlite_manager):
        """Test database maintenance operations."""
        maintenance_results = sqlite_manager.run_maintenance()
        
        assert isinstance(maintenance_results, dict)
        # Should return information about maintenance operations performed
    
    def test_connection_error_handling(self):
        """Test handling of connection errors."""
        # Test with invalid database path
        with patch('sqlite3.connect') as mock_connect:
            mock_connect.side_effect = sqlite3.Error("Connection failed")
            
            with pytest.raises(sqlite3.Error):
                SQLiteContextManager("/invalid/path/db.db")
    
    def test_unicode_data_handling(self, sqlite_manager):
        """Test handling of Unicode data."""
        # Create project with Unicode content
        project_id = sqlite_manager.create_project(
            "Unicode Test 测试",
            description="Café résumé naïve 世界",
            settings={"unicode_key": "unicode_value_éñíöü"}
        )
        
        profile_id = sqlite_manager.save_context_profile(
            project_id, "unicode_profile", {"message": "Hello 世界!"}
        )
        
        # Add code with Unicode
        unicode_code = '''
def greet():
    """Greetings in multiple languages."""
    print("Hello World!")
    print("Hola Mundo!")
    print("Bonjour le Monde!")
    print("你好世界!")
    print("Привет мир!")
    return "Greetings sent 🌍"
'''
        
        sqlite_manager.add_code_context(
            profile_id, "greetings.py", unicode_code, {"language": "python"}
        )
        
        # Verify Unicode data is preserved
        project = sqlite_manager.get_project(project_id)
        assert "测试" in project['name']
        assert "世界" in project['description']
        
        # Search for Unicode content
        results = sqlite_manager.search_context("世界", profile_id=profile_id)
        assert len(results) > 0


class TestSQLiteConnectionPool:
    """Test suite for SQLiteConnectionPool class."""
    
    def test_initialization(self, temp_database):
        """Test connection pool initialization."""
        pool = SQLiteConnectionPool(temp_database, pool_size=3, max_overflow=2, timeout=10.0)
        
        assert pool.database_path == Path(temp_database)
        assert pool.pool_size == 3
        assert pool.max_overflow == 2
        assert pool.timeout == 10.0
        assert pool.pool.qsize() == 3  # Should be pre-populated
        
        pool.close_all()
    
    def test_get_and_return_connection(self, connection_pool):
        """Test getting and returning connections."""
        # Get connection
        conn = connection_pool.get_connection()
        assert conn is not None
        assert isinstance(conn, sqlite3.Connection)
        
        # Verify connection works
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        assert result[0] == 1
        
        # Return connection
        connection_pool.return_connection(conn)
        
        # Verify stats
        stats = connection_pool.get_stats()
        assert stats['connections_checked_out'] == 1
        assert stats['connections_checked_in'] == 1
    
    def test_connection_context_manager(self, connection_pool):
        """Test connection context manager."""
        with connection_pool.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS test_table (id INTEGER)")
            cursor.execute("INSERT INTO test_table (id) VALUES (1)")
            cursor.close()
        
        # Connection should be returned to pool automatically
        stats = connection_pool.get_stats()
        assert stats['connections_checked_out'] == 1
        assert stats['connections_checked_in'] == 1
    
    def test_transaction_context_manager(self, connection_pool):
        """Test transaction context manager."""
        # Create test table
        with connection_pool.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS test_trans (id INTEGER, value TEXT)")
            cursor.close()
        
        # Test successful transaction
        with connection_pool.transaction() as cursor:
            cursor.execute("INSERT INTO test_trans (id, value) VALUES (1, 'test')")
        
        # Verify data was committed
        with connection_pool.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM test_trans")
            count = cursor.fetchone()[0]
            cursor.close()
            assert count == 1
        
        # Test failed transaction
        try:
            with connection_pool.transaction() as cursor:
                cursor.execute("INSERT INTO test_trans (id, value) VALUES (2, 'rollback')")
                raise ValueError("Simulated error")
        except ValueError:
            pass
        
        # Verify rollback - count should still be 1
        with connection_pool.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM test_trans")
            count = cursor.fetchone()[0]
            cursor.close()
            assert count == 1
    
    def test_concurrent_connections(self, temp_database):
        """Test concurrent connection usage."""
        pool = SQLiteConnectionPool(temp_database, pool_size=3, max_overflow=2)
        
        results = []
        errors = []
        
        def worker(worker_id):
            try:
                with pool.connection(timeout=5.0) as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT ? as worker_id", (worker_id,))
                    result = cursor.fetchone()[0]
                    cursor.close()
                    time.sleep(0.1)  # Simulate work
                    results.append(result)
            except Exception as e:
                errors.append(e)
        
        # Start multiple threads
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(worker, i) for i in range(5)]
            for future in as_completed(futures):
                future.result()  # Wait for completion
        
        assert len(errors) == 0
        assert len(results) == 5
        assert sorted(results) == list(range(5))
        
        pool.close_all()
    
    def test_pool_capacity_limits(self, temp_database):
        """Test pool capacity and overflow limits."""
        pool = SQLiteConnectionPool(temp_database, pool_size=2, max_overflow=1, timeout=1.0)
        
        # Get connections up to capacity
        conn1 = pool.get_connection()
        conn2 = pool.get_connection()
        conn3 = pool.get_connection()  # This should use overflow
        
        # Next connection should timeout
        with pytest.raises(RuntimeError, match="pool at maximum capacity"):
            pool.get_connection(timeout=0.1)
        
        # Return connections
        pool.return_connection(conn1)
        pool.return_connection(conn2)
        pool.return_connection(conn3)
        
        # Should be able to get connection again
        conn4 = pool.get_connection()
        assert conn4 is not None
        
        pool.return_connection(conn4)
        pool.close_all()
    
    def test_connection_validation(self, temp_database):
        """Test connection validation and replacement."""
        pool = SQLiteConnectionPool(temp_database, pool_size=1)
        
        # Get connection and close it manually (simulate stale connection)
        conn = pool.get_connection()
        conn.close()  # Manually close to make it invalid
        
        # When we return it, pool should detect it's invalid
        pool.return_connection(conn)
        
        # Next get should create a new valid connection
        new_conn = pool.get_connection()
        assert new_conn is not None
        
        # Test the new connection works
        cursor = new_conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        assert result[0] == 1
        
        pool.return_connection(new_conn)
        pool.close_all()
    
    def test_pool_statistics(self, connection_pool):
        """Test pool statistics collection."""
        # Initial stats
        initial_stats = connection_pool.get_stats()
        
        # Use some connections
        conn1 = connection_pool.get_connection()
        conn2 = connection_pool.get_connection()
        
        mid_stats = connection_pool.get_stats()
        assert mid_stats['connections_checked_out'] == initial_stats['connections_checked_out'] + 2
        assert mid_stats['checked_out'] == 2
        
        connection_pool.return_connection(conn1)
        connection_pool.return_connection(conn2)
        
        final_stats = connection_pool.get_stats()
        assert final_stats['connections_checked_in'] == initial_stats['connections_checked_in'] + 2
        assert final_stats['checked_out'] == 0
        
        # Test efficiency metrics
        assert 'hit_rate' in final_stats
        assert 'miss_rate' in final_stats
        assert final_stats['hit_rate'] >= 0.0
        assert final_stats['miss_rate'] >= 0.0
    
    def test_pool_context_manager(self, temp_database):
        """Test pool context manager protocol."""
        with SQLiteConnectionPool(temp_database, pool_size=2) as pool:
            conn = pool.get_connection()
            assert conn is not None
            pool.return_connection(conn)
        
        # Pool should be closed after context
        # Attempting to get connection should fail
        with pytest.raises(Exception):
            pool.get_connection()


class TestSingletonConnectionPool:
    """Test suite for SingletonConnectionPool class."""
    
    def test_singleton_behavior(self, temp_database):
        """Test that singleton returns same pool instance for same database."""
        pool1 = SingletonConnectionPool.get_pool(temp_database)
        pool2 = SingletonConnectionPool.get_pool(temp_database)
        
        assert pool1 is pool2
        
        SingletonConnectionPool.close_all_pools()
    
    def test_different_databases_different_pools(self, temp_database):
        """Test different databases get different pool instances."""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp2:
            db2_path = tmp2.name
        
        try:
            pool1 = SingletonConnectionPool.get_pool(temp_database)
            pool2 = SingletonConnectionPool.get_pool(db2_path)
            
            assert pool1 is not pool2
            
        finally:
            SingletonConnectionPool.close_all_pools()
            Path(db2_path).unlink(missing_ok=True)
    
    def test_get_all_stats(self, temp_database):
        """Test getting statistics for all pools."""
        pool = SingletonConnectionPool.get_pool(temp_database)
        
        # Use the pool a bit
        with pool.connection():
            pass
        
        all_stats = SingletonConnectionPool.get_all_stats()
        
        assert len(all_stats) == 1
        assert str(Path(temp_database).resolve()) in all_stats
        
        SingletonConnectionPool.close_all_pools()
    
    def test_close_all_pools(self, temp_database):
        """Test closing all singleton pools."""
        pool1 = SingletonConnectionPool.get_pool(temp_database)
        
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp2:
            db2_path = tmp2.name
        
        try:
            pool2 = SingletonConnectionPool.get_pool(db2_path)
            
            # Both pools should exist
            assert len(SingletonConnectionPool._pools) == 2
            
            SingletonConnectionPool.close_all_pools()
            
            # All pools should be closed and removed
            assert len(SingletonConnectionPool._pools) == 0
            
        finally:
            Path(db2_path).unlink(missing_ok=True)


class TestDatabaseEdgeCases:
    """Test edge cases and error scenarios for database components."""
    
    def test_large_data_insertion(self, sqlite_manager):
        """Test handling of large data insertions."""
        project_id = sqlite_manager.create_project("Large Data Test")
        profile_id = sqlite_manager.save_context_profile(project_id, "large_profile", {})
        
        # Create large content
        large_content = "print('line')\n" * 10000  # Large Python file
        large_metadata = {
            "language": "python",
            "functions": [{"name": f"func_{i}"} for i in range(1000)],
            "classes": [{"name": f"Class_{i}"} for i in range(100)],
            "imports": ["module"] * 500,
            "file_size": len(large_content)
        }
        
        # Should handle large insertion without issues
        context_id = sqlite_manager.add_code_context(
            profile_id, "large_file.py", large_content, large_metadata
        )
        
        assert context_id is not None
        
        # Verify data integrity
        cursor = sqlite_manager.conn.cursor()
        cursor.execute("SELECT content FROM code_contexts WHERE id = ?", (context_id,))
        stored_content = cursor.fetchone()[0]
        cursor.close()
        
        assert len(stored_content) == len(large_content)
    
    def test_concurrent_database_access(self, temp_database):
        """Test concurrent access to database."""
        results = []
        errors = []
        
        def worker(worker_id):
            try:
                with SQLiteContextManager(temp_database) as manager:
                    project_id = manager.create_project(f"Concurrent Project {worker_id}")
                    project = manager.get_project(project_id)
                    results.append(project['name'])
            except Exception as e:
                errors.append(e)
        
        # Run multiple workers concurrently
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(worker, i) for i in range(5)]
            for future in as_completed(futures):
                future.result()
        
        # Should have no errors and all projects created
        assert len(errors) == 0
        assert len(results) == 5
        assert len(set(results)) == 5  # All unique names
    
    def test_database_corruption_recovery(self, temp_database):
        """Test behavior when database file is corrupted."""
        # First, create a valid database
        with SQLiteContextManager(temp_database) as manager:
            manager.create_project("Test Project")
        
        # Corrupt the database file
        with open(temp_database, 'wb') as f:
            f.write(b'corrupted data')
        
        # Should handle corruption gracefully
        with pytest.raises(sqlite3.DatabaseError):
            SQLiteContextManager(temp_database)
    
    def test_disk_space_full_simulation(self, sqlite_manager):
        """Test behavior when disk space is full (simulated)."""
        project_id = sqlite_manager.create_project("Disk Space Test")
        
        # Mock disk full error
        with patch.object(sqlite_manager.conn, 'execute') as mock_execute:
            mock_execute.side_effect = sqlite3.OperationalError("database or disk is full")
            
            with pytest.raises(sqlite3.OperationalError):
                sqlite_manager.save_context_profile(project_id, "test", {})
    
    def test_very_long_strings(self, sqlite_manager):
        """Test handling of very long strings."""
        project_id = sqlite_manager.create_project("Long String Test")
        
        # Create very long strings
        long_description = "A" * 1000000  # 1MB string
        long_settings = {"key": "B" * 500000}  # 500KB value
        
        # Should handle without issues (SQLite has high limits)
        profile_id = sqlite_manager.save_context_profile(
            project_id, 
            "long_profile", 
            {"description": long_description, "settings": long_settings}
        )
        
        # Verify data integrity
        profile = sqlite_manager.get_context_profile(profile_id)
        assert len(profile['profile_data']['description']) == 1000000
        assert len(profile['profile_data']['settings']['key']) == 500000
    
    def test_special_characters_in_search(self, sqlite_manager):
        """Test full-text search with special characters."""
        project_id = sqlite_manager.create_project("Special Chars Test")
        profile_id = sqlite_manager.save_context_profile(project_id, "special_profile", {})
        
        # Add content with special characters
        special_content = """
        def search_test():
            # Test with special characters: !@#$%^&*()
            query = "SELECT * FROM table WHERE column LIKE '%test%'"
            regex = r"\\d+\\.\\d+"
            return f"Result: {query} matches {regex}"
        """
        
        sqlite_manager.add_code_context(
            profile_id, "special.py", special_content, {"language": "python"}
        )
        
        # Test search with special characters
        results = sqlite_manager.search_context("SELECT * FROM", profile_id=profile_id)
        assert len(results) > 0
        
        results = sqlite_manager.search_context("\\d+", profile_id=profile_id)
        assert len(results) > 0
    
    def test_null_and_empty_value_handling(self, sqlite_manager):
        """Test handling of NULL and empty values."""
        # Test with minimal data
        project_id = sqlite_manager.create_project("Minimal", description=None, settings=None)
        profile_id = sqlite_manager.save_context_profile(project_id, "minimal", {})
        
        # Add code context with minimal metadata
        sqlite_manager.add_code_context(
            profile_id, "", "", {}  # Empty values
        )
        
        # Should handle gracefully
        project = sqlite_manager.get_project(project_id)
        assert project['description'] is None
        assert project['settings'] is None
        
        profile = sqlite_manager.get_context_profile(profile_id)
        assert profile['profile_data'] == {}
    
    def test_json_serialization_edge_cases(self, sqlite_manager):
        """Test JSON serialization with edge cases."""
        project_id = sqlite_manager.create_project("JSON Test")
        
        # Test with various data types that need JSON serialization
        complex_data = {
            "string": "test",
            "number": 42,
            "float": 3.14,
            "boolean": True,
            "null": None,
            "array": [1, 2, 3],
            "nested": {"key": "value"},
            "empty_dict": {},
            "empty_list": []
        }
        
        profile_id = sqlite_manager.save_context_profile(
            project_id, "json_profile", complex_data
        )
        
        # Verify all data types are preserved
        profile = sqlite_manager.get_context_profile(profile_id)
        assert profile['profile_data'] == complex_data