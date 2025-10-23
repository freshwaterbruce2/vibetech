"""
Comprehensive unit tests for GitAnalyzer component.

Tests Git repository analysis functionality including:
- Repository analysis and statistics
- Hot spots identification
- Contributor analysis
- Change pattern detection
- Branch information
- Edge cases and error handling
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import Mock, MagicMock, patch
from dataclasses import dataclass
from typing import List, Dict, Any

try:
    import git
    GIT_AVAILABLE = True
except ImportError:
    GIT_AVAILABLE = False

from collectors.git_analyzer import GitAnalyzer, CommitInfo, FileHotSpot


@pytest.fixture
def mock_git_repo():
    """Create a mock git repository for testing."""
    mock_repo = MagicMock()
    mock_repo.working_dir = "/path/to/repo"
    
    # Mock commits
    commits = []
    for i in range(10):
        commit = MagicMock()
        commit.hexsha = f"abc123{i:03d}"
        commit.author.name = f"Developer{i % 3 + 1}"
        commit.committed_date = (datetime.now() - timedelta(days=i)).timestamp()
        commit.message = f"Commit message {i}"
        commit.parents = [MagicMock()] if i > 0 else []
        
        # Mock stats
        stats_mock = MagicMock()
        stats_mock.total = {'insertions': 10 + i, 'deletions': 5 + i}
        commit.stats = stats_mock
        
        # Mock diff
        diff_item = MagicMock()
        diff_item.a_path = f"file_{i % 3}.py"
        diff_item.b_path = f"file_{i % 3}.py"
        
        if i > 0:
            diff_mock = [diff_item]
            commit.parents[0].diff.return_value = diff_mock
        
        commits.append(commit)
    
    mock_repo.iter_commits.return_value = commits
    
    # Mock branches
    branch1 = MagicMock()
    branch1.name = "main"
    branch2 = MagicMock()
    branch2.name = "feature-branch"
    
    mock_repo.branches = [branch1, branch2]
    mock_repo.active_branch = branch1
    
    # Mock remote
    remote_ref1 = MagicMock()
    remote_ref1.name = "origin/main"
    remote_ref2 = MagicMock()
    remote_ref2.name = "origin/develop"
    
    remote_mock = MagicMock()
    remote_mock.refs = [remote_ref1, remote_ref2]
    mock_repo.remote.return_value = remote_mock
    
    mock_repo.is_dirty.return_value = False
    mock_repo.untracked_files = []
    
    return mock_repo


@pytest.mark.skipif(not GIT_AVAILABLE, reason="GitPython not available")
class TestGitAnalyzer:
    """Test suite for GitAnalyzer class."""
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_initialization_success(self, mock_repo_class):
        """Test successful GitAnalyzer initialization."""
        mock_repo_class.return_value = Mock()
        
        analyzer = GitAnalyzer("/path/to/repo")
        
        assert isinstance(analyzer, GitAnalyzer)
        assert analyzer.repo_path == Path("/path/to/repo")
        mock_repo_class.assert_called_once_with("/path/to/repo")
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_initialization_invalid_repo(self, mock_repo_class):
        """Test initialization with invalid repository."""
        mock_repo_class.side_effect = git.InvalidGitRepositoryError("Not a git repository")
        
        with pytest.raises(ValueError, match="Not a valid Git repository"):
            GitAnalyzer("/invalid/path")
    
    def test_initialization_git_not_available(self):
        """Test initialization when GitPython is not available."""
        with patch('collectors.git_analyzer.GIT_AVAILABLE', False):
            with pytest.raises(ImportError, match="GitPython is required"):
                GitAnalyzer("/path/to/repo")
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_analyze_repository_success(self, mock_repo_class, mock_git_repo):
        """Test successful repository analysis."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        with patch.object(analyzer, '_get_commit_history') as mock_commits:
            mock_commits.return_value = self._create_mock_commits()
            
            results = analyzer.analyze_repository(max_commits=100, days_back=30)
            
            # Verify result structure
            assert 'repository_path' in results
            assert 'analysis_date' in results
            assert 'parameters' in results
            assert 'repository_stats' in results
            assert 'hot_spots' in results
            assert 'contributors' in results
            assert 'change_patterns' in results
            assert 'branch_info' in results
            assert 'analysis_duration' in results
            
            # Verify parameters
            params = results['parameters']
            assert params['max_commits'] == 100
            assert params['days_back'] == 30
            assert params['include_merge_commits'] == False
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_get_commit_history_success(self, mock_repo_class, mock_git_repo):
        """Test successful commit history retrieval."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        since_date = datetime.now() - timedelta(days=30)
        commits = analyzer._get_commit_history(50, since_date, False)
        
        assert len(commits) <= 50
        assert all(isinstance(commit, CommitInfo) for commit in commits)
        
        # Verify commit structure
        if commits:
            commit = commits[0]
            assert hasattr(commit, 'hash')
            assert hasattr(commit, 'author')
            assert hasattr(commit, 'date')
            assert hasattr(commit, 'message')
            assert hasattr(commit, 'files_changed')
            assert hasattr(commit, 'insertions')
            assert hasattr(commit, 'deletions')
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_analyze_hot_spots(self, mock_repo_class, mock_git_repo):
        """Test hot spots analysis."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        commits = self._create_mock_commits()
        hot_spots = analyzer._analyze_hot_spots(commits)
        
        assert isinstance(hot_spots, list)
        
        if hot_spots:
            hot_spot = hot_spots[0]
            assert 'path' in hot_spot
            assert 'change_count' in hot_spot
            assert 'author_count' in hot_spot
            assert 'authors' in hot_spot
            assert 'last_modified' in hot_spot
            assert 'complexity_score' in hot_spot
            assert 'recent_changes' in hot_spot
            
            # Verify sorting by complexity score
            complexity_scores = [hs['complexity_score'] for hs in hot_spots]
            assert complexity_scores == sorted(complexity_scores, reverse=True)
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_analyze_contributors(self, mock_repo_class, mock_git_repo):
        """Test contributor analysis."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        commits = self._create_mock_commits()
        contributors = analyzer._analyze_contributors(commits)
        
        assert 'contributors' in contributors
        assert 'summary' in contributors
        
        # Verify summary statistics
        summary = contributors['summary']
        assert 'total_contributors' in summary
        assert 'total_commits' in summary
        assert 'total_lines_changed' in summary
        assert 'active_contributors' in summary
        assert 'top_contributor' in summary
        
        # Verify contributor details
        if contributors['contributors']:
            contributor_name = next(iter(contributors['contributors']))
            contributor_data = contributors['contributors'][contributor_name]
            
            assert 'commits' in contributor_data
            assert 'insertions' in contributor_data
            assert 'deletions' in contributor_data
            assert 'files_touched' in contributor_data
            assert 'first_commit' in contributor_data
            assert 'last_commit' in contributor_data
            assert 'lines_changed' in contributor_data
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_analyze_change_patterns(self, mock_repo_class, mock_git_repo):
        """Test change pattern analysis."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        commits = self._create_mock_commits()
        patterns = analyzer._analyze_change_patterns(commits)
        
        assert 'temporal_patterns' in patterns
        assert 'file_patterns' in patterns
        assert 'commit_patterns' in patterns
        
        # Verify temporal patterns
        temporal = patterns['temporal_patterns']
        assert 'peak_hour' in temporal
        assert 'peak_day' in temporal
        assert 'hourly_distribution' in temporal
        assert 'daily_activity' in temporal
        
        # Verify file patterns
        file_patterns = patterns['file_patterns']
        assert 'extensions' in file_patterns
        
        # Verify commit patterns
        commit_patterns = patterns['commit_patterns']
        assert 'size_distribution' in commit_patterns
        assert 'average_files_per_commit' in commit_patterns
        assert 'average_lines_per_commit' in commit_patterns
        
        # Verify size distribution categories
        size_dist = commit_patterns['size_distribution']
        assert 'small' in size_dist
        assert 'medium' in size_dist
        assert 'large' in size_dist
        assert 'huge' in size_dist
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_analyze_branches(self, mock_repo_class, mock_git_repo):
        """Test branch analysis."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        branch_info = analyzer._analyze_branches()
        
        assert 'current_branch' in branch_info
        assert 'all_branches' in branch_info
        assert 'remote_branches' in branch_info
        assert 'total_branches' in branch_info
        assert 'current_branch_commits' in branch_info
        
        assert branch_info['current_branch'] == 'main'
        assert len(branch_info['all_branches']) == 2
        assert 'main' in branch_info['all_branches']
        assert 'feature-branch' in branch_info['all_branches']
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_get_repository_stats(self, mock_repo_class, mock_git_repo):
        """Test repository statistics calculation."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        with patch('pathlib.Path.rglob') as mock_rglob, \
             patch('pathlib.Path.stat') as mock_stat:
            
            # Mock file system traversal
            mock_files = [
                Mock(is_file=Mock(return_value=True), suffix='.py'),
                Mock(is_file=Mock(return_value=True), suffix='.js'),
                Mock(is_file=Mock(return_value=True), suffix=''),
            ]
            mock_rglob.return_value = mock_files
            
            mock_stat_obj = Mock()
            mock_stat_obj.st_size = 1024
            mock_stat.return_value = mock_stat_obj
            
            stats = analyzer._get_repository_stats()
            
            assert 'total_commits' in stats
            assert 'repository_size_bytes' in stats
            assert 'repository_size_mb' in stats
            assert 'total_files' in stats
            assert 'file_types' in stats
            assert 'remotes' in stats
            assert 'is_dirty' in stats
            assert 'has_untracked_files' in stats
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_get_file_history(self, mock_repo_class, mock_git_repo):
        """Test file-specific commit history."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        # Mock file-specific commits
        file_commits = []
        for i in range(5):
            commit = Mock()
            commit.hexsha = f"file_commit_{i}"
            commit.author.name = f"Author{i}"
            commit.committed_date = (datetime.now() - timedelta(days=i)).timestamp()
            commit.message = f"Modified file {i}"
            file_commits.append(commit)
        
        mock_git_repo.iter_commits.return_value = file_commits
        
        history = analyzer.get_file_history("specific_file.py", max_commits=10)
        
        assert len(history) <= 10
        assert all('hash' in commit for commit in history)
        assert all('author' in commit for commit in history)
        assert all('date' in commit for commit in history)
        assert all('message' in commit for commit in history)
        assert all('short_hash' in commit for commit in history)
    
    def test_commit_info_dataclass(self):
        """Test CommitInfo dataclass functionality."""
        commit_date = datetime.now()
        
        commit_info = CommitInfo(
            hash="abc123",
            author="Test Author",
            date=commit_date,
            message="Test commit message",
            files_changed=["file1.py", "file2.js"],
            insertions=10,
            deletions=5
        )
        
        assert commit_info.hash == "abc123"
        assert commit_info.author == "Test Author"
        assert commit_info.date == commit_date
        assert commit_info.message == "Test commit message"
        assert commit_info.files_changed == ["file1.py", "file2.js"]
        assert commit_info.insertions == 10
        assert commit_info.deletions == 5
    
    def test_file_hot_spot_dataclass(self):
        """Test FileHotSpot dataclass functionality."""
        hot_spot_date = datetime.now()
        
        hot_spot = FileHotSpot(
            path="src/main.py",
            change_count=15,
            last_modified=hot_spot_date,
            authors=["Author1", "Author2"],
            complexity_score=8.5
        )
        
        assert hot_spot.path == "src/main.py"
        assert hot_spot.change_count == 15
        assert hot_spot.last_modified == hot_spot_date
        assert hot_spot.authors == ["Author1", "Author2"]
        assert hot_spot.complexity_score == 8.5
    
    def _create_mock_commits(self) -> List[CommitInfo]:
        """Create mock commit data for testing."""
        commits = []
        authors = ["Alice", "Bob", "Charlie"]
        files = ["src/main.py", "src/utils.py", "tests/test_main.py", "README.md"]
        
        for i in range(20):
            commit = CommitInfo(
                hash=f"commit_hash_{i:03d}",
                author=authors[i % len(authors)],
                date=datetime.now() - timedelta(days=i),
                message=f"Commit message {i}",
                files_changed=[files[j % len(files)] for j in range(i % 3 + 1)],
                insertions=10 + (i % 20),
                deletions=5 + (i % 10)
            )
            commits.append(commit)
        
        return commits


class TestGitAnalyzerEdgeCases:
    """Test edge cases and error scenarios for GitAnalyzer."""
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_empty_repository(self, mock_repo_class):
        """Test behavior with empty repository (no commits)."""
        mock_repo = Mock()
        mock_repo.iter_commits.return_value = []
        mock_repo.branches = []
        mock_repo.active_branch = None
        mock_repo_class.return_value = mock_repo
        
        analyzer = GitAnalyzer("/path/to/empty/repo")
        
        with patch.object(analyzer, '_get_commit_history', return_value=[]):
            results = analyzer.analyze_repository()
            
            assert results['parameters']['commits_analyzed'] == 0
            assert len(results['hot_spots']) == 0
            assert results['contributors']['summary']['total_contributors'] == 0
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_repository_with_merge_commits(self, mock_repo_class, mock_git_repo):
        """Test handling of merge commits."""
        # Create commits with merge commits (multiple parents)
        merge_commits = []
        for i in range(5):
            commit = Mock()
            commit.hexsha = f"merge_{i}"
            commit.author.name = "Merger"
            commit.committed_date = (datetime.now() - timedelta(days=i)).timestamp()
            commit.message = f"Merge commit {i}"
            commit.parents = [Mock(), Mock()] if i % 2 == 0 else [Mock()]  # Every other is merge
            merge_commits.append(commit)
        
        mock_git_repo.iter_commits.return_value = merge_commits
        mock_repo_class.return_value = mock_git_repo
        
        analyzer = GitAnalyzer("/path/to/repo")
        
        # Test excluding merge commits (default)
        commits_no_merge = analyzer._get_commit_history(10, datetime.now() - timedelta(days=30), False)
        merge_count_excluded = len([c for c in commits_no_merge if "Merge" in c.message])
        
        # Test including merge commits
        commits_with_merge = analyzer._get_commit_history(10, datetime.now() - timedelta(days=30), True)
        merge_count_included = len([c for c in commits_with_merge if "Merge" in c.message])
        
        assert merge_count_included >= merge_count_excluded
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_commit_diff_errors(self, mock_repo_class, mock_git_repo):
        """Test handling of errors when getting commit diffs."""
        # Create commits where diff operations fail
        error_commits = []
        for i in range(3):
            commit = Mock()
            commit.hexsha = f"error_commit_{i}"
            commit.author.name = "Author"
            commit.committed_date = datetime.now().timestamp()
            commit.message = f"Commit {i}"
            commit.parents = [Mock()]
            
            # Make diff operation raise an exception
            commit.parents[0].diff.side_effect = git.GitCommandError("diff", "error")
            
            # Make stats operation fail too
            commit.stats.total = {'insertions': 0, 'deletions': 0}
            
            error_commits.append(commit)
        
        mock_git_repo.iter_commits.return_value = error_commits
        mock_repo_class.return_value = mock_git_repo
        
        analyzer = GitAnalyzer("/path/to/repo")
        
        # Should handle errors gracefully
        commits = analyzer._get_commit_history(10, datetime.now() - timedelta(days=30), False)
        
        assert len(commits) == 3
        for commit in commits:
            # Files changed should be empty due to diff errors
            assert len(commit.files_changed) == 0
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_branch_analysis_errors(self, mock_repo_class):
        """Test branch analysis with various error conditions."""
        mock_repo = Mock()
        
        # Simulate detached HEAD state
        mock_repo.active_branch = None
        mock_repo.branches = []
        mock_repo.remote.side_effect = git.GitCommandError("remote", "no remote")
        mock_repo.iter_commits.side_effect = git.GitCommandError("log", "no commits")
        
        mock_repo_class.return_value = mock_repo
        
        analyzer = GitAnalyzer("/path/to/repo")
        branch_info = analyzer._analyze_branches()
        
        # Should return default values on errors
        assert branch_info['current_branch'] == 'unknown'
        assert branch_info['all_branches'] == []
        assert branch_info['remote_branches'] == []
        assert branch_info['total_branches'] == 0
        assert branch_info['current_branch_commits'] == 0
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_repository_stats_filesystem_errors(self, mock_repo_class, mock_git_repo):
        """Test repository stats with file system access errors."""
        mock_repo_class.return_value = mock_git_repo
        analyzer = GitAnalyzer("/path/to/repo")
        
        with patch('pathlib.Path.rglob') as mock_rglob:
            # Simulate file system error
            mock_rglob.side_effect = OSError("Permission denied")
            
            stats = analyzer._get_repository_stats()
            
            # Should return default values on errors
            assert stats['total_files'] == 0
            assert stats['file_types'] == {}
            assert stats['repository_size_bytes'] == 0
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_very_large_repository_performance(self, mock_repo_class, mock_git_repo):
        """Test performance with simulated large repository."""
        # Create a large number of mock commits
        large_commit_list = []
        for i in range(1000):
            commit = Mock()
            commit.hexsha = f"large_commit_{i:04d}"
            commit.author.name = f"Author{i % 10}"
            commit.committed_date = (datetime.now() - timedelta(minutes=i)).timestamp()
            commit.message = f"Large repo commit {i}"
            commit.parents = [Mock()] if i > 0 else []
            
            # Mock minimal stats to avoid performance issues in tests
            stats_mock = Mock()
            stats_mock.total = {'insertions': 1, 'deletions': 1}
            commit.stats = stats_mock
            
            if i > 0:
                diff_mock = [Mock()]
                diff_mock[0].a_path = f"file_{i % 100}.py"
                diff_mock[0].b_path = f"file_{i % 100}.py"
                commit.parents[0].diff.return_value = diff_mock
            
            large_commit_list.append(commit)
        
        mock_git_repo.iter_commits.return_value = large_commit_list
        mock_repo_class.return_value = mock_git_repo
        
        analyzer = GitAnalyzer("/path/to/repo")
        
        # Test with limited commits to ensure performance
        start_time = datetime.now()
        results = analyzer.analyze_repository(max_commits=500, days_back=365)
        duration = (datetime.now() - start_time).total_seconds()
        
        assert duration < 10.0  # Should complete within 10 seconds
        assert results['parameters']['commits_analyzed'] <= 500
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_unicode_handling_in_commit_messages(self, mock_repo_class, mock_git_repo):
        """Test handling of Unicode characters in commit messages and author names."""
        unicode_commits = []
        unicode_authors = ["José García", "李明", "Владимир Петров", "عبد الله"]
        unicode_messages = [
            "Fix café menu encoding",
            "添加中文支持",
            "Исправить ошибку кодировки",
            "إصلاح مشكلة التشفير"
        ]
        
        for i, (author, message) in enumerate(zip(unicode_authors, unicode_messages)):
            commit = Mock()
            commit.hexsha = f"unicode_commit_{i}"
            commit.author.name = author
            commit.committed_date = (datetime.now() - timedelta(days=i)).timestamp()
            commit.message = message
            commit.parents = [Mock()] if i > 0 else []
            
            stats_mock = Mock()
            stats_mock.total = {'insertions': 5, 'deletions': 2}
            commit.stats = stats_mock
            
            unicode_commits.append(commit)
        
        mock_git_repo.iter_commits.return_value = unicode_commits
        mock_repo_class.return_value = mock_git_repo
        
        analyzer = GitAnalyzer("/path/to/repo")
        
        # Should handle Unicode without errors
        commits = analyzer._get_commit_history(10, datetime.now() - timedelta(days=30), False)
        
        assert len(commits) == 4
        for commit in commits:
            assert isinstance(commit.author, str)
            assert isinstance(commit.message, str)
            # Verify Unicode characters are preserved
            assert len(commit.author) > 0
            assert len(commit.message) > 0
    
    @patch('collectors.git_analyzer.git.Repo')
    def test_file_path_edge_cases(self, mock_repo_class, mock_git_repo):
        """Test handling of various file path edge cases."""
        edge_case_commits = []
        edge_case_files = [
            "normal_file.py",
            "file with spaces.js",
            "file-with-dashes.cpp",
            "file_with_unicode_café.py",
            "deeply/nested/directory/structure/file.py",
            "file.with.multiple.dots.py",
            ".hidden_file.py",
            "UPPERCASE_FILE.PY",
            "123_numeric_start.py",
            "special$chars@file.py"
        ]
        
        for i, file_path in enumerate(edge_case_files):
            commit = Mock()
            commit.hexsha = f"edge_commit_{i}"
            commit.author.name = "Edge Tester"
            commit.committed_date = (datetime.now() - timedelta(days=i)).timestamp()
            commit.message = f"Modified {file_path}"
            commit.parents = [Mock()]
            
            # Mock diff with edge case file paths
            diff_mock = [Mock()]
            diff_mock[0].a_path = file_path
            diff_mock[0].b_path = file_path
            commit.parents[0].diff.return_value = diff_mock
            
            stats_mock = Mock()
            stats_mock.total = {'insertions': 3, 'deletions': 1}
            commit.stats = stats_mock
            
            edge_case_commits.append(commit)
        
        mock_git_repo.iter_commits.return_value = edge_case_commits
        mock_repo_class.return_value = mock_git_repo
        
        analyzer = GitAnalyzer("/path/to/repo")
        commits = analyzer._get_commit_history(20, datetime.now() - timedelta(days=30), False)
        
        # Verify all edge case files are handled
        all_files = []
        for commit in commits:
            all_files.extend(commit.files_changed)
        
        assert len(set(all_files)) == len(edge_case_files)
        for edge_file in edge_case_files:
            assert edge_file in all_files


@pytest.mark.skipif(GIT_AVAILABLE, reason="Testing behavior when GitPython is not available")
class TestGitAnalyzerWithoutGitPython:
    """Test GitAnalyzer behavior when GitPython is not available."""
    
    def test_import_error_on_initialization(self):
        """Test that proper error is raised when GitPython is not available."""
        with pytest.raises(ImportError, match="GitPython is required for Git analysis"):
            GitAnalyzer("/path/to/repo")