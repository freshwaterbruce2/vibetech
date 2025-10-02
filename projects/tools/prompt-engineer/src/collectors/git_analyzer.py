"""
Git Repository Analyzer for extracting development insights and hot spots.
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from dataclasses import dataclass

try:
    import git
    GIT_AVAILABLE = True
except ImportError:
    GIT_AVAILABLE = False
    logging.warning("GitPython not available. Git analysis features will be limited.")

logger = logging.getLogger(__name__)

@dataclass
class CommitInfo:
    """Information about a git commit."""
    hash: str
    author: str
    date: datetime
    message: str
    files_changed: List[str]
    insertions: int
    deletions: int

@dataclass
class FileHotSpot:
    """Information about a frequently changed file."""
    path: str
    change_count: int
    last_modified: datetime
    authors: List[str]
    complexity_score: float

class GitAnalyzer:
    """
    Analyzes Git repositories to extract development insights.
    
    Provides information about:
    - Frequently changed files (hot spots)
    - Developer contributions
    - Change patterns over time
    - Code complexity indicators
    """
    
    def __init__(self, repo_path: str):
        """
        Initialize Git analyzer.
        
        Args:
            repo_path: Path to Git repository
            
        Raises:
            ValueError: If path is not a valid Git repository
        """
        self.repo_path = Path(repo_path)
        
        if not GIT_AVAILABLE:
            raise ImportError("GitPython is required for Git analysis. Install with: pip install GitPython")
        
        try:
            self.repo = git.Repo(self.repo_path)
        except git.InvalidGitRepositoryError:
            raise ValueError(f"Not a valid Git repository: {repo_path}")
        
        logger.info(f"Initialized Git analyzer for: {repo_path}")
    
    def analyze_repository(self, 
                         max_commits: int = 1000,
                         days_back: int = 365,
                         include_merge_commits: bool = False) -> Dict[str, Any]:
        """
        Perform comprehensive repository analysis.
        
        Args:
            max_commits: Maximum number of commits to analyze
            days_back: Number of days to look back
            include_merge_commits: Whether to include merge commits
            
        Returns:
            Dictionary containing analysis results
        """
        analysis_start = datetime.now()
        since_date = analysis_start - timedelta(days=days_back)
        
        logger.info(f"Analyzing repository: {self.repo_path}")
        logger.info(f"Parameters: max_commits={max_commits}, days_back={days_back}")
        
        try:
            # Get commit history
            commits = self._get_commit_history(max_commits, since_date, include_merge_commits)
            
            # Perform various analyses
            hot_spots = self._analyze_hot_spots(commits)
            contributors = self._analyze_contributors(commits)
            change_patterns = self._analyze_change_patterns(commits)
            branch_info = self._analyze_branches()
            repo_stats = self._get_repository_stats()
            
            analysis_results = {
                'repository_path': str(self.repo_path),
                'analysis_date': analysis_start.isoformat(),
                'parameters': {
                    'max_commits': max_commits,
                    'days_back': days_back,
                    'include_merge_commits': include_merge_commits,
                    'commits_analyzed': len(commits)
                },
                'repository_stats': repo_stats,
                'hot_spots': hot_spots,
                'contributors': contributors,
                'change_patterns': change_patterns,
                'branch_info': branch_info,
                'analysis_duration': (datetime.now() - analysis_start).total_seconds()
            }
            
            logger.info(f"Analysis completed in {analysis_results['analysis_duration']:.2f} seconds")
            return analysis_results
            
        except Exception as e:
            logger.error(f"Error during repository analysis: {e}")
            raise
    
    def _get_commit_history(self, 
                           max_commits: int,
                           since_date: datetime,
                           include_merge_commits: bool) -> List[CommitInfo]:
        """Get commit history within specified parameters."""
        commits = []
        
        try:
            commit_iter = self.repo.iter_commits(
                max_count=max_commits,
                since=since_date
            )
            
            for commit in commit_iter:
                # Skip merge commits if requested
                if not include_merge_commits and len(commit.parents) > 1:
                    continue
                
                # Get file changes
                files_changed = []
                insertions = 0
                deletions = 0
                
                try:
                    if commit.parents:  # Not the initial commit
                        diff = commit.parents[0].diff(commit)
                        for diff_item in diff:
                            if diff_item.a_path:
                                files_changed.append(diff_item.a_path)
                            if diff_item.b_path and diff_item.b_path not in files_changed:
                                files_changed.append(diff_item.b_path)
                        
                        # Get stats
                        stats = commit.stats.total
                        insertions = stats['insertions']
                        deletions = stats['deletions']
                
                except Exception as e:
                    logger.debug(f"Error getting diff for commit {commit.hexsha}: {e}")
                
                commit_info = CommitInfo(
                    hash=commit.hexsha,
                    author=commit.author.name,
                    date=datetime.fromtimestamp(commit.committed_date),
                    message=commit.message.strip(),
                    files_changed=files_changed,
                    insertions=insertions,
                    deletions=deletions
                )
                
                commits.append(commit_info)
                
        except Exception as e:
            logger.error(f"Error retrieving commit history: {e}")
            raise
        
        logger.debug(f"Retrieved {len(commits)} commits")
        return commits
    
    def _analyze_hot_spots(self, commits: List[CommitInfo]) -> List[Dict[str, Any]]:
        """Analyze frequently changed files (hot spots)."""
        file_changes = defaultdict(list)
        file_authors = defaultdict(set)
        
        # Collect file change information
        for commit in commits:
            for file_path in commit.files_changed:
                file_changes[file_path].append({
                    'commit': commit.hash,
                    'date': commit.date,
                    'author': commit.author,
                    'insertions': commit.insertions,
                    'deletions': commit.deletions
                })
                file_authors[file_path].add(commit.author)
        
        # Calculate hot spots
        hot_spots = []
        for file_path, changes in file_changes.items():
            if len(changes) < 2:  # Skip files with only one change
                continue
            
            # Calculate complexity score based on:
            # - Number of changes
            # - Number of different authors
            # - Recency of changes
            change_count = len(changes)
            author_count = len(file_authors[file_path])
            
            # Recent changes get higher weight
            recent_changes = sum(1 for c in changes 
                               if (datetime.now() - c['date']).days <= 30)
            
            complexity_score = (
                change_count * 0.4 +
                author_count * 0.3 +
                recent_changes * 0.3
            )
            
            hot_spot = {
                'path': file_path,
                'change_count': change_count,
                'author_count': author_count,
                'authors': list(file_authors[file_path]),
                'last_modified': max(c['date'] for c in changes).isoformat(),
                'complexity_score': round(complexity_score, 2),
                'recent_changes': recent_changes,
                'total_insertions': sum(c['insertions'] for c in changes),
                'total_deletions': sum(c['deletions'] for c in changes)
            }
            
            hot_spots.append(hot_spot)
        
        # Sort by complexity score and return top hot spots
        hot_spots.sort(key=lambda x: x['complexity_score'], reverse=True)
        return hot_spots[:50]  # Top 50 hot spots
    
    def _analyze_contributors(self, commits: List[CommitInfo]) -> Dict[str, Any]:
        """Analyze contributor statistics."""
        author_stats = defaultdict(lambda: {
            'commits': 0,
            'insertions': 0,
            'deletions': 0,
            'files_touched': set(),
            'first_commit': None,
            'last_commit': None
        })
        
        for commit in commits:
            author = commit.author
            stats = author_stats[author]
            
            stats['commits'] += 1
            stats['insertions'] += commit.insertions
            stats['deletions'] += commit.deletions
            stats['files_touched'].update(commit.files_changed)
            
            if stats['first_commit'] is None or commit.date < stats['first_commit']:
                stats['first_commit'] = commit.date
            if stats['last_commit'] is None or commit.date > stats['last_commit']:
                stats['last_commit'] = commit.date
        
        # Convert to serializable format
        contributors = {}
        for author, stats in author_stats.items():
            contributors[author] = {
                'commits': stats['commits'],
                'insertions': stats['insertions'],
                'deletions': stats['deletions'],
                'files_touched': len(stats['files_touched']),
                'first_commit': stats['first_commit'].isoformat() if stats['first_commit'] else None,
                'last_commit': stats['last_commit'].isoformat() if stats['last_commit'] else None,
                'lines_changed': stats['insertions'] + stats['deletions']
            }
        
        # Calculate additional metrics
        total_commits = sum(c['commits'] for c in contributors.values())
        total_lines = sum(c['lines_changed'] for c in contributors.values())
        
        # Sort contributors by activity
        sorted_contributors = sorted(
            contributors.items(),
            key=lambda x: x[1]['commits'],
            reverse=True
        )
        
        return {
            'contributors': dict(sorted_contributors),
            'summary': {
                'total_contributors': len(contributors),
                'total_commits': total_commits,
                'total_lines_changed': total_lines,
                'active_contributors': len([c for c in contributors.values() 
                                          if c['commits'] >= 5]),
                'top_contributor': sorted_contributors[0][0] if sorted_contributors else None
            }
        }
    
    def _analyze_change_patterns(self, commits: List[CommitInfo]) -> Dict[str, Any]:
        """Analyze patterns in changes over time."""
        # Group commits by time periods
        daily_changes = defaultdict(int)
        weekly_changes = defaultdict(int)
        monthly_changes = defaultdict(int)
        hourly_changes = defaultdict(int)
        
        file_extension_changes = defaultdict(int)
        commit_size_distribution = {'small': 0, 'medium': 0, 'large': 0, 'huge': 0}
        
        for commit in commits:
            date = commit.date
            
            # Time-based grouping
            daily_changes[date.strftime('%Y-%m-%d')] += 1
            weekly_changes[date.strftime('%Y-W%U')] += 1
            monthly_changes[date.strftime('%Y-%m')] += 1
            hourly_changes[date.hour] += 1
            
            # File extension analysis
            for file_path in commit.files_changed:
                ext = Path(file_path).suffix.lower()
                if ext:
                    file_extension_changes[ext] += 1
            
            # Commit size classification
            lines_changed = commit.insertions + commit.deletions
            if lines_changed <= 10:
                commit_size_distribution['small'] += 1
            elif lines_changed <= 100:
                commit_size_distribution['medium'] += 1
            elif lines_changed <= 1000:
                commit_size_distribution['large'] += 1
            else:
                commit_size_distribution['huge'] += 1
        
        # Find peak activity periods
        peak_hour = max(hourly_changes.items(), key=lambda x: x[1])[0] if hourly_changes else None
        peak_day = max(daily_changes.items(), key=lambda x: x[1])[0] if daily_changes else None
        
        return {
            'temporal_patterns': {
                'peak_hour': peak_hour,
                'peak_day': peak_day,
                'hourly_distribution': dict(hourly_changes),
                'daily_activity': dict(sorted(daily_changes.items())[-30:])  # Last 30 days
            },
            'file_patterns': {
                'extensions': dict(sorted(file_extension_changes.items(), 
                                        key=lambda x: x[1], reverse=True)[:20])
            },
            'commit_patterns': {
                'size_distribution': commit_size_distribution,
                'average_files_per_commit': sum(len(c.files_changed) for c in commits) / len(commits) if commits else 0,
                'average_lines_per_commit': sum(c.insertions + c.deletions for c in commits) / len(commits) if commits else 0
            }
        }
    
    def _analyze_branches(self) -> Dict[str, Any]:
        """Analyze branch information."""
        try:
            branches = {
                'current_branch': self.repo.active_branch.name,
                'all_branches': [branch.name for branch in self.repo.branches],
                'remote_branches': [branch.name for branch in self.repo.remote().refs],
                'total_branches': len(list(self.repo.branches))
            }
            
            # Get information about the current branch
            current_branch = self.repo.active_branch
            try:
                commit_count = sum(1 for _ in self.repo.iter_commits(current_branch))
                branches['current_branch_commits'] = commit_count
            except Exception:
                branches['current_branch_commits'] = 0
            
            return branches
            
        except Exception as e:
            logger.warning(f"Error analyzing branches: {e}")
            return {
                'current_branch': 'unknown',
                'all_branches': [],
                'remote_branches': [],
                'total_branches': 0,
                'current_branch_commits': 0
            }
    
    def _get_repository_stats(self) -> Dict[str, Any]:
        """Get general repository statistics."""
        try:
            # Get total commit count
            total_commits = sum(1 for _ in self.repo.iter_commits())
            
            # Get repository size (approximate)
            repo_size = sum(
                f.stat().st_size for f in Path(self.repo_path).rglob('*') 
                if f.is_file() and '.git' not in str(f)
            )
            
            # Get file count by type
            file_count = 0
            file_types = defaultdict(int)
            
            for file_path in Path(self.repo_path).rglob('*'):
                if file_path.is_file() and '.git' not in str(file_path):
                    file_count += 1
                    ext = file_path.suffix.lower()
                    if ext:
                        file_types[ext] += 1
                    else:
                        file_types['no_extension'] += 1
            
            # Get remote information
            remotes = [remote.name for remote in self.repo.remotes]
            
            return {
                'total_commits': total_commits,
                'repository_size_bytes': repo_size,
                'repository_size_mb': round(repo_size / (1024 * 1024), 2),
                'total_files': file_count,
                'file_types': dict(sorted(file_types.items(), key=lambda x: x[1], reverse=True)[:20]),
                'remotes': remotes,
                'is_dirty': self.repo.is_dirty(),
                'has_untracked_files': bool(self.repo.untracked_files)
            }
            
        except Exception as e:
            logger.warning(f"Error getting repository stats: {e}")
            return {
                'total_commits': 0,
                'repository_size_bytes': 0,
                'repository_size_mb': 0,
                'total_files': 0,
                'file_types': {},
                'remotes': [],
                'is_dirty': False,
                'has_untracked_files': False
            }
    
    def get_file_history(self, file_path: str, max_commits: int = 50) -> List[Dict[str, Any]]:
        """
        Get commit history for a specific file.
        
        Args:
            file_path: Path to the file
            max_commits: Maximum number of commits to retrieve
            
        Returns:
            List of commit information for the file
        """
        try:
            commits = []
            for commit in self.repo.iter_commits(paths=file_path, max_count=max_commits):
                commit_info = {
                    'hash': commit.hexsha,
                    'author': commit.author.name,
                    'date': datetime.fromtimestamp(commit.committed_date).isoformat(),
                    'message': commit.message.strip(),
                    'short_hash': commit.hexsha[:8]
                }
                commits.append(commit_info)
            
            return commits
            
        except Exception as e:
            logger.error(f"Error getting file history for {file_path}: {e}")
            return []