"""
End-to-end integration tests for the Interactive Context Collector system.

Tests the complete workflow from code scanning through database storage
to context retrieval and search functionality.
"""

import pytest
import tempfile
import shutil
import json
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from src.collectors.code_scanner import CodeScanner
from src.collectors.git_analyzer import GitAnalyzer
from src.database.sqlite_manager import SQLiteContextManager
from src.database.connection_pool import SingletonConnectionPool
from tests.fixtures.mock_data_generator import MockDataGenerator, create_test_git_repo, create_sample_projects_structure


@pytest.fixture(scope="module")
def integration_workspace():
    """Create a complete workspace for integration testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        workspace = Path(temp_dir) / "integration_workspace"
        workspace.mkdir()
        
        # Create project structure
        projects_dir = workspace / "projects"
        create_sample_projects_structure(str(projects_dir))
        
        # Create git repository
        git_repo = workspace / "git_repo"
        create_test_git_repo(str(git_repo))
        
        # Create database
        db_path = workspace / "test.db"
        
        yield {
            'workspace': workspace,
            'projects_dir': projects_dir,
            'git_repo': git_repo,
            'db_path': str(db_path)
        }
        
        # Cleanup handled by tempfile context manager


@pytest.fixture
def mock_data_generator():
    """Mock data generator for testing."""
    return MockDataGenerator(seed=42)


class TestEndToEndWorkflow:
    """Test complete workflow integration."""
    
    def test_complete_project_analysis_workflow(self, integration_workspace, mock_data_generator):
        """Test complete workflow from project scanning to database storage."""
        workspace = integration_workspace
        
        # Initialize components
        scanner = CodeScanner()
        
        with SQLiteContextManager(workspace['db_path']) as db_manager:
            # Step 1: Create project in database
            project_id = db_manager.create_project(
                name="Integration Test Project",
                description="End-to-end workflow test",
                settings={"test_mode": True}
            )
            
            # Step 2: Scan code files
            scan_results = scanner.scan_directory(
                str(workspace['projects_dir']),
                recursive=True,
                max_files=100
            )
            
            assert len(scan_results['files']) > 0
            assert scan_results['summary']['total_files'] > 0
            
            # Step 3: Create context profile
            profile_data = {
                'scan_results': scan_results,
                'created_at': datetime.now().isoformat(),
                'project_path': str(workspace['projects_dir']),
                'scan_parameters': {
                    'recursive': True,
                    'max_files': 100
                }
            }
            
            profile_id = db_manager.save_context_profile(
                project_id, "integration_profile", profile_data
            )
            
            # Step 4: Store code contexts in database
            stored_contexts = 0
            for file_data in scan_results['files']:
                if hasattr(file_data, 'path'):  # CodeFile object
                    context_id = db_manager.add_code_context(
                        profile_id,
                        file_data.path,
                        file_data.content,
                        {
                            'language': file_data.language,
                            'imports': file_data.imports,
                            'functions': file_data.functions,
                            'classes': file_data.classes,
                            'file_hash': file_data.hash,
                            'file_size': file_data.size,
                            'lines_of_code': file_data.lines_of_code
                        }
                    )
                    assert context_id is not None
                    stored_contexts += 1
            
            assert stored_contexts > 0
            
            # Step 5: Search stored contexts
            search_results = db_manager.search_context(
                "function", 
                profile_id=profile_id
            )
            
            assert len(search_results) > 0
            
            # Step 6: Verify data integrity
            retrieved_profile = db_manager.get_context_profile(profile_id)
            assert retrieved_profile is not None
            assert retrieved_profile['name'] == "integration_profile"
            assert retrieved_profile['project_id'] == project_id
            
            # Step 7: Get database statistics
            stats = db_manager.get_database_stats()
            assert stats['projects_count'] >= 1
            assert stats['context_profiles_count'] >= 1
            assert stats['code_contexts_count'] >= stored_contexts
    
    @patch('collectors.git_analyzer.GIT_AVAILABLE', True)
    @patch('collectors.git_analyzer.git.Repo')
    def test_git_analysis_integration(self, mock_repo_class, integration_workspace, mock_data_generator):
        """Test Git analysis integration with database storage."""
        # Setup mock git repository
        mock_repo = Mock()
        mock_commits = mock_data_generator.generate_commit_history(50)
        
        # Convert CommitInfo objects to mock git commit objects
        git_commits = []
        for commit_info in mock_commits:
            git_commit = Mock()
            git_commit.hexsha = commit_info.hash
            git_commit.author.name = commit_info.author
            git_commit.committed_date = commit_info.date.timestamp()
            git_commit.message = commit_info.message
            git_commit.parents = [Mock()] if git_commits else []
            
            # Mock stats
            stats_mock = Mock()
            stats_mock.total = {
                'insertions': commit_info.insertions, 
                'deletions': commit_info.deletions
            }
            git_commit.stats = stats_mock
            
            # Mock diff
            if git_commit.parents:
                diff_items = []
                for file_path in commit_info.files_changed:
                    diff_item = Mock()
                    diff_item.a_path = file_path
                    diff_item.b_path = file_path
                    diff_items.append(diff_item)
                git_commit.parents[0].diff.return_value = diff_items
            
            git_commits.append(git_commit)
        
        mock_repo.iter_commits.return_value = git_commits[:20]  # Limit for test
        
        # Mock branches
        branch_mock = Mock()
        branch_mock.name = "main"
        mock_repo.branches = [branch_mock]
        mock_repo.active_branch = branch_mock
        
        # Mock remote
        remote_mock = Mock()
        remote_ref = Mock()
        remote_ref.name = "origin/main"
        remote_mock.refs = [remote_ref]
        mock_repo.remote.return_value = remote_mock
        
        mock_repo.is_dirty.return_value = False
        mock_repo.untracked_files = []
        
        mock_repo_class.return_value = mock_repo
        
        # Test integration
        with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
            # Create project
            project_id = db_manager.create_project("Git Analysis Project")
            profile_id = db_manager.save_context_profile(project_id, "git_profile", {})
            
            # Perform git analysis
            git_analyzer = GitAnalyzer(str(integration_workspace['git_repo']))
            analysis_results = git_analyzer.analyze_repository(max_commits=20)
            
            # Store git analysis results
            cursor = db_manager.conn.cursor()
            cursor.execute('''
                INSERT INTO git_analysis 
                (profile_id, repo_path, commit_hash, branch, hot_spots, contributors, change_frequency)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                profile_id,
                str(integration_workspace['git_repo']),
                "test_commit_hash",
                "main",
                json.dumps(analysis_results.get('hot_spots', [])),
                json.dumps(analysis_results.get('contributors', {})),
                json.dumps(analysis_results.get('change_patterns', {}))
            ))
            cursor.close()
            
            # Verify storage
            cursor = db_manager.conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM git_analysis WHERE profile_id = ?", (profile_id,))
            count = cursor.fetchone()[0]
            cursor.close()
            
            assert count == 1
            
            # Verify analysis results structure
            assert 'repository_path' in analysis_results
            assert 'hot_spots' in analysis_results
            assert 'contributors' in analysis_results
            assert 'change_patterns' in analysis_results
    
    def test_multi_language_project_analysis(self, integration_workspace, mock_data_generator):
        """Test analysis of projects with multiple programming languages."""
        workspace = integration_workspace
        
        # Create multi-language project
        multi_lang_project = workspace['projects_dir'] / "multi-lang-project"
        multi_lang_project.mkdir(exist_ok=True)
        
        # Generate files in different languages
        languages = ['python', 'javascript', 'typescript', 'java']
        generated_files = {}
        
        for language in languages:
            code_file = mock_data_generator.generate_code_file(language)
            file_path = multi_lang_project / f"sample.{language.replace('script', '')}"
            if language == 'typescript':
                file_path = multi_lang_project / "sample.ts"
            elif language == 'javascript':
                file_path = multi_lang_project / "sample.js"
            
            file_path.write_text(code_file.content)
            generated_files[language] = str(file_path)
        
        # Scan the multi-language project
        scanner = CodeScanner()
        scan_results = scanner.scan_directory(str(multi_lang_project))
        
        # Verify all languages were detected
        detected_languages = set()
        for file_data in scan_results['files']:
            if hasattr(file_data, 'language'):
                detected_languages.add(file_data.language)
        
        assert len(detected_languages) >= 3  # Should detect most languages
        
        # Store in database and verify search across languages
        with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
            project_id = db_manager.create_project("Multi-Language Project")
            profile_id = db_manager.save_context_profile(project_id, "multi_lang", {})
            
            # Store each file
            for file_data in scan_results['files']:
                if hasattr(file_data, 'path'):
                    db_manager.add_code_context(
                        profile_id,
                        file_data.path,
                        file_data.content,
                        {'language': file_data.language}
                    )
            
            # Search for common programming constructs
            function_results = db_manager.search_context("function", profile_id=profile_id)
            class_results = db_manager.search_context("class", profile_id=profile_id)
            
            assert len(function_results) > 0 or len(class_results) > 0
    
    def test_database_connection_pooling_integration(self, integration_workspace):
        """Test database connection pooling in multi-threaded scenario."""
        import threading
        import time
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        results = []
        errors = []
        
        def worker_task(worker_id):
            try:
                pool = SingletonConnectionPool.get_pool(
                    integration_workspace['db_path'], 
                    pool_size=3, 
                    max_overflow=2
                )
                
                with pool.connection() as conn:
                    cursor = conn.cursor()
                    
                    # Simulate work
                    cursor.execute("CREATE TABLE IF NOT EXISTS test_worker (id INTEGER, worker_id INTEGER)")
                    cursor.execute("INSERT INTO test_worker (id, worker_id) VALUES (?, ?)", 
                                 (int(time.time() * 1000000), worker_id))
                    
                    cursor.execute("SELECT COUNT(*) FROM test_worker WHERE worker_id = ?", (worker_id,))
                    count = cursor.fetchone()[0]
                    cursor.close()
                    
                    results.append((worker_id, count))
                    
            except Exception as e:
                errors.append((worker_id, str(e)))
        
        # Run multiple workers concurrently
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(worker_task, i) for i in range(10)]
            for future in as_completed(futures):
                future.result()  # Wait for completion
        
        # Clean up
        SingletonConnectionPool.close_all_pools()
        
        # Verify results
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == 10
        assert all(count > 0 for _, count in results)
    
    def test_large_dataset_performance(self, integration_workspace, mock_data_generator):
        """Test system performance with larger datasets."""
        from fixtures.mock_data_generator import PerformanceDataGenerator
        
        perf_generator = PerformanceDataGenerator(seed=42)
        
        with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
            # Create project for performance testing
            project_id = db_manager.create_project("Performance Test Project")
            profile_id = db_manager.save_context_profile(project_id, "perf_profile", {})
            
            # Add many code contexts
            start_time = datetime.now()
            
            languages = ['python', 'javascript', 'java']
            contexts_added = 0
            
            for i in range(50):  # Add 50 contexts
                language = languages[i % len(languages)]
                code_file = perf_generator.generate_code_file(language)
                
                context_id = db_manager.add_code_context(
                    profile_id,
                    f"/perf/file_{i}.{language}",
                    code_file.content,
                    {
                        'language': language,
                        'file_size': len(code_file.content),
                        'functions': code_file.functions,
                        'classes': code_file.classes
                    }
                )
                
                if context_id:
                    contexts_added += 1
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # Performance assertions
            assert contexts_added == 50
            assert duration < 30.0  # Should complete within 30 seconds
            
            # Test search performance
            search_start = datetime.now()
            search_results = db_manager.search_context("function", profile_id=profile_id, limit=100)
            search_duration = (datetime.now() - search_start).total_seconds()
            
            assert len(search_results) > 0
            assert search_duration < 5.0  # Search should be fast
    
    def test_backup_integration_workflow(self, integration_workspace):
        """Test integration with backup system workflow."""
        # This test would normally invoke the PowerShell backup script
        # For integration testing, we'll simulate the backup workflow
        
        workspace = integration_workspace
        
        # Simulate backup metadata that would be created by PowerShell script
        backup_metadata = {
            'project_name': 'integration-test-project',
            'backup_type': 'full',
            'timestamp': datetime.now().isoformat(),
            'original_path': str(workspace['projects_dir']),
            'backup_path': str(workspace['workspace'] / 'backup'),
            'files_count': 0,
            'original_size': 0
        }
        
        # Count actual files for verification
        project_files = list(workspace['projects_dir'].rglob('*'))
        project_files = [f for f in project_files if f.is_file()]
        backup_metadata['files_count'] = len(project_files)
        backup_metadata['original_size'] = sum(f.stat().st_size for f in project_files)
        
        # Simulate backup creation by copying files
        backup_path = workspace['workspace'] / 'backup'
        backup_path.mkdir(exist_ok=True)
        
        # Copy a few representative files
        for i, file_path in enumerate(project_files[:5]):  # Just first 5 for test
            relative_path = file_path.relative_to(workspace['projects_dir'])
            backup_file = backup_path / relative_path
            backup_file.parent.mkdir(parents=True, exist_ok=True)
            backup_file.write_bytes(file_path.read_bytes())
        
        # Save backup metadata
        metadata_file = backup_path / 'backup-metadata.json'
        metadata_file.write_text(json.dumps(backup_metadata, indent=2))
        
        # Verify backup integrity
        assert backup_path.exists()
        assert metadata_file.exists()
        
        # Load and verify metadata
        loaded_metadata = json.loads(metadata_file.read_text())
        assert loaded_metadata['project_name'] == 'integration-test-project'
        assert loaded_metadata['files_count'] > 0
        assert loaded_metadata['original_size'] > 0
    
    def test_error_recovery_integration(self, integration_workspace):
        """Test error handling and recovery in integrated workflow."""
        with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
            # Test database recovery from constraint violations
            project_id = db_manager.create_project("Error Recovery Test")
            
            # Try to create duplicate project (should handle gracefully)
            try:
                duplicate_id = db_manager.create_project("Error Recovery Test")
                assert False, "Should have raised integrity error"
            except Exception as e:
                assert "UNIQUE constraint" in str(e) or "IntegrityError" in str(e)
            
            # Verify original project still exists
            project = db_manager.get_project(project_id)
            assert project is not None
            assert project['name'] == "Error Recovery Test"
            
            # Test recovery from invalid profile data
            profile_id = db_manager.save_context_profile(project_id, "recovery_profile", {})
            
            # Try to add invalid code context (should handle gracefully)
            try:
                invalid_context_id = db_manager.add_code_context(
                    999999,  # Non-existent profile_id
                    "invalid.py",
                    "content",
                    {}
                )
                # Should either return None or raise exception
                if invalid_context_id is not None:
                    assert False, "Should not succeed with invalid profile_id"
            except Exception:
                pass  # Expected behavior
            
            # Verify database is still functional
            valid_context_id = db_manager.add_code_context(
                profile_id,
                "valid.py",
                "print('valid content')",
                {'language': 'python'}
            )
            assert valid_context_id is not None


class TestComponentInteraction:
    """Test interactions between different components."""
    
    def test_scanner_database_interaction(self, integration_workspace, mock_data_generator):
        """Test CodeScanner results storage and retrieval from database."""
        scanner = CodeScanner()
        
        # Create test files
        test_dir = integration_workspace['workspace'] / "scanner_test"
        test_dir.mkdir()
        
        # Generate realistic code files
        for language in ['python', 'javascript']:
            for i in range(3):
                code_file = mock_data_generator.generate_code_file(language)
                file_path = test_dir / f"file_{i}.{language}"
                file_path.write_text(code_file.content)
        
        # Scan files
        scan_results = scanner.scan_directory(str(test_dir))
        
        # Store in database
        with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
            project_id = db_manager.create_project("Scanner Test")
            profile_id = db_manager.save_context_profile(project_id, "scan_profile", {
                'scan_summary': scan_results['summary']
            })
            
            # Store each scanned file
            stored_files = 0
            for file_data in scan_results['files']:
                if hasattr(file_data, 'path'):
                    context_id = db_manager.add_code_context(
                        profile_id,
                        file_data.path,
                        file_data.content,
                        {
                            'language': file_data.language,
                            'functions': file_data.functions,
                            'classes': file_data.classes,
                            'imports': file_data.imports,
                            'file_hash': file_data.hash
                        }
                    )
                    if context_id:
                        stored_files += 1
            
            assert stored_files > 0
            
            # Retrieve and verify
            profile = db_manager.get_context_profile(profile_id)
            assert profile['profile_data']['scan_summary']['total_files'] == stored_files
    
    def test_git_scanner_database_integration(self, integration_workspace, mock_data_generator):
        """Test combined Git analysis and code scanning with database storage."""
        # This test would require more complex mocking for full git integration
        # For now, we'll test the data flow pattern
        
        with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
            project_id = db_manager.create_project("Git+Scanner Integration")
            
            # Simulate git analysis results
            mock_git_analysis = {
                'repository_path': str(integration_workspace['git_repo']),
                'hot_spots': [
                    {'path': 'main.py', 'change_count': 15, 'complexity_score': 8.5},
                    {'path': 'utils.py', 'change_count': 8, 'complexity_score': 5.2}
                ],
                'contributors': {
                    'Alice': {'commits': 25, 'lines_changed': 500},
                    'Bob': {'commits': 18, 'lines_changed': 350}
                },
                'change_patterns': {
                    'file_patterns': {'extensions': {'.py': 15, '.js': 8}},
                    'commit_patterns': {'size_distribution': {'small': 10, 'medium': 8, 'large': 2}}
                }
            }
            
            # Simulate code scan results
            scanner = CodeScanner()
            if integration_workspace['projects_dir'].exists():
                scan_results = scanner.scan_directory(str(integration_workspace['projects_dir']))
            else:
                # Create minimal scan results for test
                scan_results = {
                    'files': [],
                    'summary': {'total_files': 0, 'languages': {}, 'total_lines': 0}
                }
            
            # Create combined profile
            combined_profile_data = {
                'git_analysis': mock_git_analysis,
                'code_scan': scan_results,
                'integration_timestamp': datetime.now().isoformat(),
                'analysis_type': 'combined_git_scan'
            }
            
            profile_id = db_manager.save_context_profile(
                project_id, 
                "combined_analysis", 
                combined_profile_data
            )
            
            # Verify combined data storage
            retrieved_profile = db_manager.get_context_profile(profile_id)
            assert 'git_analysis' in retrieved_profile['profile_data']
            assert 'code_scan' in retrieved_profile['profile_data']
            assert retrieved_profile['profile_data']['analysis_type'] == 'combined_git_scan'
    
    def test_connection_pool_database_manager_interaction(self, integration_workspace):
        """Test interaction between connection pool and database manager."""
        from database.connection_pool import SQLiteConnectionPool
        
        # Create connection pool
        pool = SQLiteConnectionPool(integration_workspace['db_path'], pool_size=2)
        
        try:
            # Use pool to perform database operations
            with pool.connection() as conn:
                cursor = conn.cursor()
                
                # Create test table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS pool_test 
                    (id INTEGER PRIMARY KEY, data TEXT)
                ''')
                
                # Insert test data
                cursor.execute("INSERT INTO pool_test (data) VALUES (?)", ("test_data",))
                cursor.close()
            
            # Verify data with database manager
            with SQLiteContextManager(integration_workspace['db_path']) as db_manager:
                cursor = db_manager.conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM pool_test")
                count = cursor.fetchone()[0]
                cursor.close()
                
                assert count > 0
            
            # Test concurrent access through pool
            results = []
            
            def pool_worker(worker_id):
                with pool.connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("INSERT INTO pool_test (data) VALUES (?)", (f"worker_{worker_id}",))
                    cursor.execute("SELECT COUNT(*) FROM pool_test")
                    count = cursor.fetchone()[0]
                    cursor.close()
                    results.append(count)
            
            import threading
            threads = [threading.Thread(target=pool_worker, args=(i,)) for i in range(3)]
            
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            
            assert len(results) == 3
            assert all(count > 0 for count in results)
            
        finally:
            pool.close_all()


if __name__ == "__main__":
    # Run specific integration test
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "generate":
        # Generate mock data for integration tests
        generator = MockDataGenerator(seed=42)
        output_dir = Path(__file__).parent.parent / "fixtures" / "integration_data"
        generator.save_mock_data(str(output_dir))
        print(f"Integration test data generated in {output_dir}")
    else:
        pytest.main([__file__, "-v"])