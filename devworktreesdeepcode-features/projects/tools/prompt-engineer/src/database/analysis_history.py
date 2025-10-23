"""
Analysis History Management System for Project Intelligence Tool

Provides comprehensive tracking of project analysis results over time with
historical comparison, trend analysis, and improvement metrics.
"""

import sqlite3
import os
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import hashlib
import statistics

from .optimizations import optimize_for_windows, get_performance_stats, run_maintenance

logger = logging.getLogger(__name__)

@dataclass
class AnalysisSnapshot:
    """Represents a single analysis snapshot in history."""
    id: Optional[int] = None
    project_path: str = ""
    project_name: str = ""
    analysis_date: datetime = None
    health_score: int = 0
    critical_issues: int = 0
    high_priority_issues: int = 0
    medium_priority_issues: int = 0
    low_priority_issues: int = 0
    total_issues: int = 0
    project_type: str = ""
    tech_stack: List[str] = None
    file_count: int = 0
    lines_of_code: int = 0
    test_coverage: float = 0.0
    security_score: int = 0
    performance_score: int = 0
    maintainability_score: int = 0
    analysis_version: str = "1.0"
    project_hash: str = ""
    raw_analysis_data: str = ""  # JSON string of full analysis
    tags: List[str] = None
    notes: str = ""
    
    def __post_init__(self):
        if self.tech_stack is None:
            self.tech_stack = []
        if self.tags is None:
            self.tags = []
        if self.analysis_date is None:
            self.analysis_date = datetime.now()
        self.total_issues = (self.critical_issues + self.high_priority_issues + 
                           self.medium_priority_issues + self.low_priority_issues)

@dataclass 
class TrendAnalysis:
    """Analysis trends over time."""
    metric_name: str
    current_value: float
    previous_value: float
    change_amount: float
    change_percentage: float
    trend_direction: str  # 'improving', 'declining', 'stable'
    confidence_level: str  # 'high', 'medium', 'low'
    
@dataclass
class ComparisonReport:
    """Comprehensive comparison between two analysis snapshots."""
    baseline_snapshot: AnalysisSnapshot
    current_snapshot: AnalysisSnapshot
    trends: List[TrendAnalysis]
    new_issues: List[Dict[str, Any]]
    resolved_issues: List[Dict[str, Any]]
    issue_changes: Dict[str, Any]
    overall_improvement: bool
    improvement_percentage: float
    key_insights: List[str]
    recommendations: List[str]

class AnalysisHistoryManager:
    """
    Manages analysis history with comprehensive tracking and comparison capabilities.
    """
    
    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize the Analysis History Manager.
        
        Args:
            db_path: Path to the SQLite database. If None, uses default location.
        """
        if db_path is None:
            db_path = Path.cwd() / "databases" / "analysis_history.db"
        
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.conn = None
        self._connect()
        self._initialize_database()
        
        logger.info(f"Analysis History Manager initialized at: {self.db_path}")
    
    def _connect(self) -> None:
        """Establish optimized database connection."""
        try:
            self.conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,
                isolation_level=None,
                timeout=30.0
            )
            
            self.conn.row_factory = sqlite3.Row
            optimize_for_windows(self.conn)
            
            logger.debug(f"Analysis history database connected: {self.db_path}")
            
        except sqlite3.Error as e:
            logger.error(f"Failed to connect to analysis history database: {e}")
            raise
    
    def _initialize_database(self) -> None:
        """Initialize database schema for analysis history."""
        try:
            self._create_tables()
            self._create_indexes()
            self._create_views()
            self._insert_metadata()
            
            logger.info("Analysis history database schema initialized")
            
        except sqlite3.Error as e:
            logger.error(f"Failed to initialize analysis history database: {e}")
            raise
    
    def _create_tables(self) -> None:
        """Create analysis history tables."""
        cursor = self.conn.cursor()
        
        # Main analysis snapshots table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_path TEXT NOT NULL,
                project_name TEXT NOT NULL,
                analysis_date TIMESTAMP NOT NULL,
                health_score INTEGER NOT NULL,
                critical_issues INTEGER DEFAULT 0,
                high_priority_issues INTEGER DEFAULT 0,
                medium_priority_issues INTEGER DEFAULT 0,
                low_priority_issues INTEGER DEFAULT 0,
                total_issues INTEGER GENERATED ALWAYS AS (
                    critical_issues + high_priority_issues + 
                    medium_priority_issues + low_priority_issues
                ) STORED,
                project_type TEXT,
                tech_stack_json TEXT,  -- JSON array of tech stack
                file_count INTEGER DEFAULT 0,
                lines_of_code INTEGER DEFAULT 0,
                test_coverage REAL DEFAULT 0.0,
                security_score INTEGER DEFAULT 0,
                performance_score INTEGER DEFAULT 0,
                maintainability_score INTEGER DEFAULT 0,
                analysis_version TEXT DEFAULT '1.0',
                project_hash TEXT,  -- Hash of project files for change detection
                raw_analysis_data TEXT,  -- Full analysis as JSON
                tags_json TEXT,  -- JSON array of tags
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Individual issues tracking for detailed comparison
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                snapshot_id INTEGER NOT NULL,
                issue_type TEXT NOT NULL,
                issue_category TEXT,
                priority TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                file_path TEXT,
                line_number INTEGER,
                suggested_action TEXT,
                issue_hash TEXT,  -- Hash for tracking same issue across analyses
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolution_status TEXT DEFAULT 'open',  -- open, resolved, ignored
                FOREIGN KEY (snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE CASCADE
            )
        ''')
        
        # Project metadata for better organization
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                repository_url TEXT,
                primary_language TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_analyzed TIMESTAMP,
                analysis_count INTEGER DEFAULT 0,
                favorite BOOLEAN DEFAULT FALSE,
                archived BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Trend metrics for historical analysis
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trend_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                snapshot_id INTEGER NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metric_category TEXT,  -- health, quality, performance, security
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE CASCADE
            )
        ''')
        
        # Analysis comparisons cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_comparisons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                baseline_snapshot_id INTEGER NOT NULL,
                current_snapshot_id INTEGER NOT NULL,
                comparison_data TEXT,  -- JSON of comparison results
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (baseline_snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE CASCADE,
                FOREIGN KEY (current_snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE CASCADE,
                UNIQUE(baseline_snapshot_id, current_snapshot_id)
            )
        ''')
        
        # Export/import logs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS export_import_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operation_type TEXT NOT NULL,  -- export, import
                file_path TEXT,
                format_type TEXT,  -- json, csv, markdown
                snapshot_count INTEGER DEFAULT 0,
                operation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT
            )
        ''')
        
        cursor.close()
    
    def _create_indexes(self) -> None:
        """Create optimized indexes for performance."""
        cursor = self.conn.cursor()
        
        indexes = [
            # Analysis snapshots indexes
            "CREATE INDEX IF NOT EXISTS idx_snapshots_project_path ON analysis_snapshots(project_path)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_project_name ON analysis_snapshots(project_name)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_analysis_date ON analysis_snapshots(analysis_date DESC)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_health_score ON analysis_snapshots(health_score)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_project_hash ON analysis_snapshots(project_hash)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_project_type ON analysis_snapshots(project_type)",
            
            # Issues indexes
            "CREATE INDEX IF NOT EXISTS idx_issues_snapshot ON analysis_issues(snapshot_id)",
            "CREATE INDEX IF NOT EXISTS idx_issues_priority ON analysis_issues(priority)",
            "CREATE INDEX IF NOT EXISTS idx_issues_type ON analysis_issues(issue_type)",
            "CREATE INDEX IF NOT EXISTS idx_issues_hash ON analysis_issues(issue_hash)",
            "CREATE INDEX IF NOT EXISTS idx_issues_status ON analysis_issues(resolution_status)",
            "CREATE INDEX IF NOT EXISTS idx_issues_first_seen ON analysis_issues(first_seen)",
            
            # Projects indexes
            "CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path)",
            "CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)",
            "CREATE INDEX IF NOT EXISTS idx_projects_last_analyzed ON projects(last_analyzed DESC)",
            "CREATE INDEX IF NOT EXISTS idx_projects_favorite ON projects(favorite)",
            
            # Trend metrics indexes
            "CREATE INDEX IF NOT EXISTS idx_trends_snapshot ON trend_metrics(snapshot_id)",
            "CREATE INDEX IF NOT EXISTS idx_trends_metric_name ON trend_metrics(metric_name)",
            "CREATE INDEX IF NOT EXISTS idx_trends_category ON trend_metrics(metric_category)",
            
            # Comparisons indexes
            "CREATE INDEX IF NOT EXISTS idx_comparisons_baseline ON analysis_comparisons(baseline_snapshot_id)",
            "CREATE INDEX IF NOT EXISTS idx_comparisons_current ON analysis_comparisons(current_snapshot_id)",
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        cursor.close()
    
    def _create_views(self) -> None:
        """Create useful views for analysis queries."""
        cursor = self.conn.cursor()
        
        # Latest snapshots per project
        cursor.execute('''
            CREATE VIEW IF NOT EXISTS latest_project_snapshots AS
            SELECT s.*, p.name as project_display_name, p.description as project_description
            FROM analysis_snapshots s
            JOIN projects p ON s.project_path = p.path
            WHERE s.analysis_date = (
                SELECT MAX(analysis_date) 
                FROM analysis_snapshots s2 
                WHERE s2.project_path = s.project_path
            )
        ''')
        
        # Project health trends
        cursor.execute('''
            CREATE VIEW IF NOT EXISTS project_health_trends AS
            SELECT 
                project_path,
                project_name,
                analysis_date,
                health_score,
                total_issues,
                LAG(health_score) OVER (
                    PARTITION BY project_path 
                    ORDER BY analysis_date
                ) as previous_health_score,
                health_score - LAG(health_score) OVER (
                    PARTITION BY project_path 
                    ORDER BY analysis_date
                ) as health_score_change
            FROM analysis_snapshots
            ORDER BY project_path, analysis_date
        ''')
        
        # Issue resolution summary
        cursor.execute('''
            CREATE VIEW IF NOT EXISTS issue_resolution_summary AS
            SELECT 
                snapshot_id,
                priority,
                COUNT(*) as total_issues,
                SUM(CASE WHEN resolution_status = 'resolved' THEN 1 ELSE 0 END) as resolved_issues,
                SUM(CASE WHEN resolution_status = 'open' THEN 1 ELSE 0 END) as open_issues,
                ROUND(
                    (SUM(CASE WHEN resolution_status = 'resolved' THEN 1.0 ELSE 0 END) / COUNT(*)) * 100, 
                    2
                ) as resolution_percentage
            FROM analysis_issues
            GROUP BY snapshot_id, priority
        ''')
        
        cursor.close()
    
    def _insert_metadata(self) -> None:
        """Insert initial metadata."""
        cursor = self.conn.cursor()
        
        metadata = [
            ('schema_version', '1.0.0'),
            ('created_at', datetime.now().isoformat()),
            ('feature_set', 'comprehensive_history_tracking'),
            ('supported_formats', json.dumps(['json', 'csv', 'markdown']))
        ]
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history_metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        for key, value in metadata:
            cursor.execute('''
                INSERT OR IGNORE INTO history_metadata (key, value) 
                VALUES (?, ?)
            ''', (key, value))
        
        cursor.close()
    
    def save_analysis_snapshot(self, analysis_result, project_path: str, 
                              project_name: str = None, tags: List[str] = None, 
                              notes: str = "") -> int:
        """
        Save a complete analysis snapshot to history.
        
        Args:
            analysis_result: ProjectAnalysisResult object
            project_path: Path to the analyzed project
            project_name: Display name for the project
            tags: Optional tags for categorization
            notes: Optional notes about this analysis
            
        Returns:
            ID of the saved snapshot
        """
        cursor = self.conn.cursor()
        
        try:
            # Generate project hash for change detection
            project_hash = self._calculate_project_hash(project_path)
            
            # Extract data from analysis result
            if project_name is None:
                project_name = Path(project_path).name
            
            # Prepare snapshot data
            snapshot = AnalysisSnapshot(
                project_path=str(project_path),
                project_name=project_name,
                analysis_date=datetime.now(),
                health_score=getattr(analysis_result, 'health_score', 0),
                critical_issues=len(getattr(analysis_result, 'critical_issues', [])),
                high_priority_issues=len(getattr(analysis_result, 'high_priority_issues', [])),
                medium_priority_issues=len(getattr(analysis_result, 'medium_priority_issues', [])),
                low_priority_issues=len(getattr(analysis_result, 'low_priority_issues', [])),
                project_type=getattr(analysis_result, 'project_type', 'unknown'),
                tech_stack=getattr(analysis_result, 'tech_stack', []),
                project_hash=project_hash,
                raw_analysis_data=self._serialize_analysis_result(analysis_result),
                tags=tags or [],
                notes=notes
            )
            
            # Insert snapshot
            cursor.execute('''
                INSERT INTO analysis_snapshots (
                    project_path, project_name, analysis_date, health_score,
                    critical_issues, high_priority_issues, medium_priority_issues, low_priority_issues,
                    project_type, tech_stack_json, file_count, lines_of_code,
                    test_coverage, security_score, performance_score, maintainability_score,
                    analysis_version, project_hash, raw_analysis_data, tags_json, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                snapshot.project_path, snapshot.project_name, snapshot.analysis_date,
                snapshot.health_score, snapshot.critical_issues, snapshot.high_priority_issues,
                snapshot.medium_priority_issues, snapshot.low_priority_issues, snapshot.project_type,
                json.dumps(snapshot.tech_stack), snapshot.file_count, snapshot.lines_of_code,
                snapshot.test_coverage, snapshot.security_score, snapshot.performance_score,
                snapshot.maintainability_score, snapshot.analysis_version, snapshot.project_hash,
                snapshot.raw_analysis_data, json.dumps(snapshot.tags), snapshot.notes
            ))
            
            snapshot_id = cursor.lastrowid
            
            # Save individual issues
            self._save_issues(cursor, snapshot_id, analysis_result)
            
            # Update or create project record
            self._update_project_record(cursor, project_path, project_name)
            
            # Calculate and save trend metrics
            self._calculate_trend_metrics(cursor, snapshot_id, analysis_result)
            
            logger.info(f"Analysis snapshot saved with ID: {snapshot_id}")
            return snapshot_id
            
        except Exception as e:
            logger.error(f"Error saving analysis snapshot: {e}")
            raise
        finally:
            cursor.close()
    
    def _save_issues(self, cursor: sqlite3.Cursor, snapshot_id: int, analysis_result) -> None:
        """Save individual issues from analysis result."""
        all_issues = []
        
        # Collect all issues with their priority levels
        issue_categories = [
            (getattr(analysis_result, 'critical_issues', []), 'critical'),
            (getattr(analysis_result, 'high_priority_issues', []), 'high'),
            (getattr(analysis_result, 'medium_priority_issues', []), 'medium'),
            (getattr(analysis_result, 'low_priority_issues', []), 'low')
        ]
        
        for issues, priority in issue_categories:
            for issue in issues:
                # Generate issue hash for tracking across analyses
                issue_data = f"{getattr(issue, 'title', '')}-{getattr(issue, 'file_path', '')}-{getattr(issue, 'type', '')}"
                issue_hash = hashlib.md5(issue_data.encode()).hexdigest()
                
                cursor.execute('''
                    INSERT INTO analysis_issues (
                        snapshot_id, issue_type, issue_category, priority, title,
                        description, file_path, line_number, suggested_action, issue_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    snapshot_id,
                    getattr(issue, 'type', 'general'),
                    getattr(issue, 'category', 'code_quality'),
                    priority,
                    getattr(issue, 'title', 'Unknown Issue'),
                    getattr(issue, 'description', ''),
                    getattr(issue, 'file_path', ''),
                    getattr(issue, 'line_number', None),
                    getattr(issue, 'suggested_action', ''),
                    issue_hash
                ))
    
    def _update_project_record(self, cursor: sqlite3.Cursor, project_path: str, project_name: str) -> None:
        """Update or create project record."""
        cursor.execute('''
            INSERT OR REPLACE INTO projects (
                path, name, last_analyzed, analysis_count
            ) VALUES (
                ?, ?, ?, 
                COALESCE((SELECT analysis_count FROM projects WHERE path = ?), 0) + 1
            )
        ''', (project_path, project_name, datetime.now(), project_path))
    
    def _calculate_trend_metrics(self, cursor: sqlite3.Cursor, snapshot_id: int, analysis_result) -> None:
        """Calculate and save trend metrics."""
        metrics = [
            ('health_score', getattr(analysis_result, 'health_score', 0), 'health'),
            ('total_issues', len(getattr(analysis_result, 'critical_issues', [])) + 
                          len(getattr(analysis_result, 'high_priority_issues', [])) + 
                          len(getattr(analysis_result, 'medium_priority_issues', [])) + 
                          len(getattr(analysis_result, 'low_priority_issues', [])), 'quality'),
            ('critical_issues', len(getattr(analysis_result, 'critical_issues', [])), 'quality'),
            ('tech_stack_size', len(getattr(analysis_result, 'tech_stack', [])), 'complexity')
        ]
        
        for metric_name, value, category in metrics:
            cursor.execute('''
                INSERT INTO trend_metrics (snapshot_id, metric_name, metric_value, metric_category)
                VALUES (?, ?, ?, ?)
            ''', (snapshot_id, metric_name, value, category))
    
    def _calculate_project_hash(self, project_path: str) -> str:
        """Calculate a hash representing the current state of the project."""
        try:
            # Simple hash based on file modification times and sizes
            hash_content = ""
            project_path_obj = Path(project_path)
            
            if project_path_obj.exists():
                for file_path in project_path_obj.rglob("*"):
                    if file_path.is_file() and not any(part.startswith('.') for part in file_path.parts):
                        try:
                            stat = file_path.stat()
                            hash_content += f"{file_path.name}-{stat.st_size}-{stat.st_mtime}"
                        except (OSError, PermissionError):
                            continue
            
            return hashlib.sha256(hash_content.encode()).hexdigest()[:16]
        except Exception:
            return "unknown"
    
    def _serialize_analysis_result(self, analysis_result) -> str:
        """Serialize analysis result to JSON string."""
        try:
            # Convert analysis result to dict
            if hasattr(analysis_result, '__dict__'):
                data = {}
                for key, value in analysis_result.__dict__.items():
                    if hasattr(value, '__dict__'):
                        # Handle nested objects
                        data[key] = [item.__dict__ if hasattr(item, '__dict__') else str(item) 
                                   for item in (value if isinstance(value, list) else [value])]
                    else:
                        data[key] = value
                return json.dumps(data, default=str, ensure_ascii=False)
            else:
                return json.dumps(str(analysis_result), ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Could not serialize analysis result: {e}")
            return "{}"
    
    def get_project_history(self, project_path: str, limit: int = 50) -> List[AnalysisSnapshot]:
        """
        Get analysis history for a specific project.
        
        Args:
            project_path: Path to the project
            limit: Maximum number of snapshots to return
            
        Returns:
            List of analysis snapshots in reverse chronological order
        """
        cursor = self.conn.cursor()
        
        try:
            cursor.execute('''
                SELECT * FROM analysis_snapshots 
                WHERE project_path = ? 
                ORDER BY analysis_date DESC 
                LIMIT ?
            ''', (str(project_path), limit))
            
            snapshots = []
            for row in cursor.fetchall():
                snapshot = AnalysisSnapshot(
                    id=row['id'],
                    project_path=row['project_path'],
                    project_name=row['project_name'],
                    analysis_date=datetime.fromisoformat(row['analysis_date']),
                    health_score=row['health_score'],
                    critical_issues=row['critical_issues'],
                    high_priority_issues=row['high_priority_issues'],
                    medium_priority_issues=row['medium_priority_issues'],
                    low_priority_issues=row['low_priority_issues'],
                    project_type=row['project_type'],
                    tech_stack=json.loads(row['tech_stack_json'] or '[]'),
                    file_count=row['file_count'],
                    lines_of_code=row['lines_of_code'],
                    test_coverage=row['test_coverage'],
                    security_score=row['security_score'],
                    performance_score=row['performance_score'],
                    maintainability_score=row['maintainability_score'],
                    analysis_version=row['analysis_version'],
                    project_hash=row['project_hash'],
                    raw_analysis_data=row['raw_analysis_data'],
                    tags=json.loads(row['tags_json'] or '[]'),
                    notes=row['notes']
                )
                snapshots.append(snapshot)
            
            return snapshots
            
        finally:
            cursor.close()
    
    def compare_analyses(self, baseline_id: int, current_id: int) -> ComparisonReport:
        """
        Compare two analysis snapshots and generate comprehensive comparison report.
        
        Args:
            baseline_id: ID of the baseline snapshot
            current_id: ID of the current snapshot
            
        Returns:
            Detailed comparison report
        """
        # Check cache first
        cached_comparison = self._get_cached_comparison(baseline_id, current_id)
        if cached_comparison:
            return cached_comparison
        
        cursor = self.conn.cursor()
        
        try:
            # Get snapshots
            baseline = self._get_snapshot_by_id(baseline_id)
            current = self._get_snapshot_by_id(current_id)
            
            if not baseline or not current:
                raise ValueError("One or both snapshots not found")
            
            # Calculate trends
            trends = self._calculate_trends(baseline, current)
            
            # Analyze issue changes
            issue_changes = self._analyze_issue_changes(cursor, baseline_id, current_id)
            
            # Generate insights and recommendations
            insights = self._generate_insights(baseline, current, trends)
            recommendations = self._generate_recommendations(baseline, current, trends, issue_changes)
            
            # Calculate overall improvement
            improvement_percentage = self._calculate_improvement_percentage(baseline, current)
            overall_improvement = improvement_percentage > 0
            
            comparison = ComparisonReport(
                baseline_snapshot=baseline,
                current_snapshot=current,
                trends=trends,
                new_issues=issue_changes.get('new_issues', []),
                resolved_issues=issue_changes.get('resolved_issues', []),
                issue_changes=issue_changes,
                overall_improvement=overall_improvement,
                improvement_percentage=improvement_percentage,
                key_insights=insights,
                recommendations=recommendations
            )
            
            # Cache the comparison
            self._cache_comparison(baseline_id, current_id, comparison)
            
            return comparison
            
        finally:
            cursor.close()
    
    def _calculate_trends(self, baseline: AnalysisSnapshot, current: AnalysisSnapshot) -> List[TrendAnalysis]:
        """Calculate trend analysis between two snapshots."""
        trends = []
        
        # Define metrics to analyze
        metrics = [
            ('health_score', 'Health Score', baseline.health_score, current.health_score, 'higher_better'),
            ('total_issues', 'Total Issues', baseline.total_issues, current.total_issues, 'lower_better'),
            ('critical_issues', 'Critical Issues', baseline.critical_issues, current.critical_issues, 'lower_better'),
            ('high_priority_issues', 'High Priority', baseline.high_priority_issues, current.high_priority_issues, 'lower_better'),
            ('medium_priority_issues', 'Medium Priority', baseline.medium_priority_issues, current.medium_priority_issues, 'lower_better'),
            ('low_priority_issues', 'Low Priority', baseline.low_priority_issues, current.low_priority_issues, 'lower_better'),
        ]
        
        for metric_key, metric_name, baseline_value, current_value, direction_type in metrics:
            change_amount = current_value - baseline_value
            change_percentage = (change_amount / baseline_value * 100) if baseline_value != 0 else 0
            
            # Determine trend direction
            if direction_type == 'higher_better':
                if change_amount > 0:
                    trend_direction = 'improving'
                elif change_amount < 0:
                    trend_direction = 'declining'
                else:
                    trend_direction = 'stable'
            else:  # lower_better
                if change_amount < 0:
                    trend_direction = 'improving'
                elif change_amount > 0:
                    trend_direction = 'declining'
                else:
                    trend_direction = 'stable'
            
            # Calculate confidence level
            confidence_level = 'high' if abs(change_percentage) > 10 else 'medium' if abs(change_percentage) > 5 else 'low'
            
            trends.append(TrendAnalysis(
                metric_name=metric_name,
                current_value=current_value,
                previous_value=baseline_value,
                change_amount=change_amount,
                change_percentage=change_percentage,
                trend_direction=trend_direction,
                confidence_level=confidence_level
            ))
        
        return trends
    
    def _analyze_issue_changes(self, cursor: sqlite3.Cursor, baseline_id: int, current_id: int) -> Dict[str, Any]:
        """Analyze changes in issues between two snapshots."""
        # Get issues from both snapshots
        cursor.execute('''
            SELECT issue_hash, title, priority, issue_type, file_path, 'baseline' as source
            FROM analysis_issues WHERE snapshot_id = ?
            UNION ALL
            SELECT issue_hash, title, priority, issue_type, file_path, 'current' as source
            FROM analysis_issues WHERE snapshot_id = ?
        ''', (baseline_id, current_id))
        
        issues = cursor.fetchall()
        
        baseline_hashes = set()
        current_hashes = set()
        issue_details = {}
        
        for issue in issues:
            issue_hash = issue['issue_hash']
            issue_details[issue_hash] = {
                'title': issue['title'],
                'priority': issue['priority'],
                'type': issue['issue_type'],
                'file_path': issue['file_path']
            }
            
            if issue['source'] == 'baseline':
                baseline_hashes.add(issue_hash)
            else:
                current_hashes.add(issue_hash)
        
        # Find new and resolved issues
        new_issue_hashes = current_hashes - baseline_hashes
        resolved_issue_hashes = baseline_hashes - current_hashes
        
        new_issues = [issue_details[h] for h in new_issue_hashes]
        resolved_issues = [issue_details[h] for h in resolved_issue_hashes]
        
        # Calculate resolution rate
        total_baseline_issues = len(baseline_hashes)
        resolved_count = len(resolved_issues)
        resolution_rate = (resolved_count / total_baseline_issues * 100) if total_baseline_issues > 0 else 0
        
        return {
            'new_issues': new_issues,
            'resolved_issues': resolved_issues,
            'new_count': len(new_issues),
            'resolved_count': resolved_count,
            'resolution_rate': resolution_rate,
            'net_change': len(new_issues) - resolved_count
        }
    
    def _generate_insights(self, baseline: AnalysisSnapshot, current: AnalysisSnapshot, 
                          trends: List[TrendAnalysis]) -> List[str]:
        """Generate key insights from the comparison."""
        insights = []
        
        # Health score insights
        health_trend = next((t for t in trends if t.metric_name == 'Health Score'), None)
        if health_trend:
            if health_trend.trend_direction == 'improving':
                insights.append(f"✅ Health score improved by {abs(health_trend.change_amount)} points ({abs(health_trend.change_percentage):.1f}%)")
            elif health_trend.trend_direction == 'declining':
                insights.append(f"⚠️ Health score declined by {abs(health_trend.change_amount)} points ({abs(health_trend.change_percentage):.1f}%)")
            else:
                insights.append("➡️ Health score remained stable")
        
        # Issue trends
        total_issues_trend = next((t for t in trends if t.metric_name == 'Total Issues'), None)
        if total_issues_trend:
            if total_issues_trend.trend_direction == 'improving':
                insights.append(f"🎯 Total issues reduced by {abs(total_issues_trend.change_amount)} ({abs(total_issues_trend.change_percentage):.1f}%)")
            elif total_issues_trend.trend_direction == 'declining':
                insights.append(f"📈 Total issues increased by {abs(total_issues_trend.change_amount)} ({abs(total_issues_trend.change_percentage):.1f}%)")
        
        # Critical issues focus
        critical_trend = next((t for t in trends if t.metric_name == 'Critical Issues'), None)
        if critical_trend and critical_trend.current_value == 0 and critical_trend.previous_value > 0:
            insights.append("🏆 All critical issues have been resolved!")
        elif critical_trend and critical_trend.change_amount > 0:
            insights.append(f"🚨 {critical_trend.change_amount} new critical issues introduced")
        
        # Time-based insights
        time_diff = current.analysis_date - baseline.analysis_date
        if time_diff.days > 0:
            insights.append(f"📅 Analysis covers {time_diff.days} days of development")
        
        return insights
    
    def _generate_recommendations(self, baseline: AnalysisSnapshot, current: AnalysisSnapshot, 
                                 trends: List[TrendAnalysis], issue_changes: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        # Health score recommendations
        if current.health_score < 70:
            recommendations.append("🎯 Focus on improving overall project health - aim for 80+ score")
        
        # Critical issues
        if current.critical_issues > 0:
            recommendations.append(f"🚨 Address {current.critical_issues} critical issues immediately")
        
        # Trend-based recommendations
        declining_trends = [t for t in trends if t.trend_direction == 'declining' and t.confidence_level != 'low']
        if declining_trends:
            for trend in declining_trends[:3]:  # Top 3 declining trends
                recommendations.append(f"📊 Monitor {trend.metric_name} - showing declining trend ({trend.change_percentage:+.1f}%)")
        
        # Issue resolution recommendations
        if issue_changes.get('resolution_rate', 0) < 50:
            recommendations.append("🔧 Focus on resolving existing issues - current resolution rate is low")
        
        # New issues pattern
        if issue_changes.get('net_change', 0) > 5:
            recommendations.append("⚡ Implement preventive measures - new issues are being introduced faster than resolved")
        
        return recommendations
    
    def _calculate_improvement_percentage(self, baseline: AnalysisSnapshot, current: AnalysisSnapshot) -> float:
        """Calculate overall improvement percentage."""
        # Weighted scoring
        health_weight = 0.4
        issues_weight = 0.6
        
        # Health score improvement (normalized to 0-100)
        health_improvement = (current.health_score - baseline.health_score)
        
        # Issues improvement (negative change is good)
        baseline_issues = baseline.total_issues
        current_issues = current.total_issues
        
        if baseline_issues == 0:
            issues_improvement = 0 if current_issues == 0 else -current_issues * 10  # Penalty for new issues
        else:
            issues_improvement = ((baseline_issues - current_issues) / baseline_issues) * 100
        
        # Combined improvement
        total_improvement = (health_improvement * health_weight) + (issues_improvement * issues_weight)
        
        return round(total_improvement, 1)
    
    def _get_snapshot_by_id(self, snapshot_id: int) -> Optional[AnalysisSnapshot]:
        """Get analysis snapshot by ID."""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM analysis_snapshots WHERE id = ?', (snapshot_id,))
            row = cursor.fetchone()
            
            if row:
                return AnalysisSnapshot(
                    id=row['id'],
                    project_path=row['project_path'],
                    project_name=row['project_name'],
                    analysis_date=datetime.fromisoformat(row['analysis_date']),
                    health_score=row['health_score'],
                    critical_issues=row['critical_issues'],
                    high_priority_issues=row['high_priority_issues'],
                    medium_priority_issues=row['medium_priority_issues'],
                    low_priority_issues=row['low_priority_issues'],
                    project_type=row['project_type'],
                    tech_stack=json.loads(row['tech_stack_json'] or '[]'),
                    file_count=row['file_count'],
                    lines_of_code=row['lines_of_code'],
                    test_coverage=row['test_coverage'],
                    security_score=row['security_score'],
                    performance_score=row['performance_score'],
                    maintainability_score=row['maintainability_score'],
                    analysis_version=row['analysis_version'],
                    project_hash=row['project_hash'],
                    raw_analysis_data=row['raw_analysis_data'],
                    tags=json.loads(row['tags_json'] or '[]'),
                    notes=row['notes']
                )
            return None
            
        finally:
            cursor.close()
    
    def _get_cached_comparison(self, baseline_id: int, current_id: int) -> Optional[ComparisonReport]:
        """Get cached comparison if available and recent."""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute('''
                SELECT comparison_data, generated_at FROM analysis_comparisons 
                WHERE baseline_snapshot_id = ? AND current_snapshot_id = ?
                AND generated_at > datetime('now', '-1 hour')
            ''', (baseline_id, current_id))
            
            row = cursor.fetchone()
            if row:
                try:
                    return self._deserialize_comparison(row['comparison_data'])
                except:
                    pass  # Fall through to regenerate
                    
            return None
            
        finally:
            cursor.close()
    
    def _cache_comparison(self, baseline_id: int, current_id: int, comparison: ComparisonReport) -> None:
        """Cache comparison result."""
        cursor = self.conn.cursor()
        
        try:
            comparison_json = json.dumps(asdict(comparison), default=str, ensure_ascii=False)
            
            cursor.execute('''
                INSERT OR REPLACE INTO analysis_comparisons 
                (baseline_snapshot_id, current_snapshot_id, comparison_data, generated_at)
                VALUES (?, ?, ?, datetime('now'))
            ''', (baseline_id, current_id, comparison_json))
            
        except Exception as e:
            logger.warning(f"Could not cache comparison: {e}")
        finally:
            cursor.close()
    
    def _deserialize_comparison(self, comparison_json: str) -> ComparisonReport:
        """Deserialize comparison from JSON."""
        # This would need proper implementation to reconstruct ComparisonReport
        # For now, return None to force regeneration
        return None
    
    def get_trend_data(self, project_path: str, metric_name: str = None, days: int = 30) -> Dict[str, List]:
        """
        Get trend data for visualization.
        
        Args:
            project_path: Path to the project
            metric_name: Specific metric to analyze (optional)
            days: Number of days to analyze
            
        Returns:
            Dictionary with trend data for charts
        """
        cursor = self.conn.cursor()
        
        try:
            since_date = datetime.now() - timedelta(days=days)
            
            if metric_name:
                cursor.execute('''
                    SELECT s.analysis_date, tm.metric_name, tm.metric_value
                    FROM analysis_snapshots s
                    JOIN trend_metrics tm ON s.id = tm.snapshot_id
                    WHERE s.project_path = ? AND tm.metric_name = ? AND s.analysis_date >= ?
                    ORDER BY s.analysis_date
                ''', (str(project_path), metric_name, since_date.isoformat()))
            else:
                cursor.execute('''
                    SELECT s.analysis_date, tm.metric_name, tm.metric_value
                    FROM analysis_snapshots s
                    JOIN trend_metrics tm ON s.id = tm.snapshot_id
                    WHERE s.project_path = ? AND s.analysis_date >= ?
                    ORDER BY s.analysis_date
                ''', (str(project_path), since_date.isoformat()))
            
            results = cursor.fetchall()
            
            # Organize data by metric
            trend_data = {}
            for row in results:
                metric = row['metric_name']
                if metric not in trend_data:
                    trend_data[metric] = {'dates': [], 'values': []}
                
                trend_data[metric]['dates'].append(row['analysis_date'])
                trend_data[metric]['values'].append(row['metric_value'])
            
            return trend_data
            
        finally:
            cursor.close()
    
    def export_history(self, project_path: str = None, format_type: str = 'json', 
                      output_file: str = None) -> str:
        """
        Export analysis history to file.
        
        Args:
            project_path: Specific project to export (optional)
            format_type: Export format ('json', 'csv', 'markdown')
            output_file: Output file path (optional)
            
        Returns:
            Path to the exported file
        """
        cursor = self.conn.cursor()
        
        try:
            # Get snapshots to export
            if project_path:
                cursor.execute('''
                    SELECT * FROM analysis_snapshots 
                    WHERE project_path = ? 
                    ORDER BY analysis_date DESC
                ''', (str(project_path),))
            else:
                cursor.execute('''
                    SELECT * FROM analysis_snapshots 
                    ORDER BY project_path, analysis_date DESC
                ''')
            
            snapshots = cursor.fetchall()
            
            # Generate output filename if not provided
            if not output_file:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                project_suffix = f"_{Path(project_path).name}" if project_path else "_all_projects"
                output_file = f"analysis_history{project_suffix}_{timestamp}.{format_type}"
            
            # Export based on format
            if format_type == 'json':
                export_data = [dict(row) for row in snapshots]
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, default=str, ensure_ascii=False)
            
            elif format_type == 'csv':
                import csv
                with open(output_file, 'w', newline='', encoding='utf-8') as f:
                    if snapshots:
                        writer = csv.DictWriter(f, fieldnames=snapshots[0].keys())
                        writer.writeheader()
                        for row in snapshots:
                            writer.writerow(dict(row))
            
            elif format_type == 'markdown':
                self._export_markdown(snapshots, output_file)
            
            # Log export
            cursor.execute('''
                INSERT INTO export_import_logs (
                    operation_type, file_path, format_type, snapshot_count, success
                ) VALUES ('export', ?, ?, ?, TRUE)
            ''', (output_file, format_type, len(snapshots)))
            
            logger.info(f"Exported {len(snapshots)} snapshots to {output_file}")
            return output_file
            
        except Exception as e:
            # Log error
            cursor.execute('''
                INSERT INTO export_import_logs (
                    operation_type, file_path, format_type, success, error_message
                ) VALUES ('export', ?, ?, FALSE, ?)
            ''', (output_file or 'unknown', format_type, str(e)))
            
            logger.error(f"Export failed: {e}")
            raise
            
        finally:
            cursor.close()
    
    def _export_markdown(self, snapshots: List[sqlite3.Row], output_file: str) -> None:
        """Export snapshots as markdown report."""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Analysis History Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            if not snapshots:
                f.write("No analysis data found.\n")
                return
            
            # Group by project
            projects = {}
            for snapshot in snapshots:
                project_path = snapshot['project_path']
                if project_path not in projects:
                    projects[project_path] = []
                projects[project_path].append(snapshot)
            
            for project_path, project_snapshots in projects.items():
                f.write(f"## Project: {Path(project_path).name}\n\n")
                f.write(f"**Path:** `{project_path}`\n\n")
                
                # Summary table
                f.write("| Date | Health Score | Critical | High | Medium | Low | Total Issues |\n")
                f.write("|------|-------------|----------|------|--------|-----|-------------|\n")
                
                for snapshot in project_snapshots:
                    date = datetime.fromisoformat(snapshot['analysis_date']).strftime('%Y-%m-%d')
                    f.write(f"| {date} | {snapshot['health_score']} | {snapshot['critical_issues']} | {snapshot['high_priority_issues']} | {snapshot['medium_priority_issues']} | {snapshot['low_priority_issues']} | {snapshot['total_issues']} |\n")
                
                f.write("\n---\n\n")
    
    def import_history(self, import_file: str) -> int:
        """
        Import analysis history from file.
        
        Args:
            import_file: Path to the import file
            
        Returns:
            Number of snapshots imported
        """
        cursor = self.conn.cursor()
        imported_count = 0
        
        try:
            with open(import_file, 'r', encoding='utf-8') as f:
                if import_file.endswith('.json'):
                    data = json.load(f)
                    
                    for snapshot_data in data:
                        # Insert snapshot (handling conflicts)
                        cursor.execute('''
                            INSERT OR IGNORE INTO analysis_snapshots (
                                project_path, project_name, analysis_date, health_score,
                                critical_issues, high_priority_issues, medium_priority_issues, 
                                low_priority_issues, project_type, tech_stack_json, file_count, 
                                lines_of_code, test_coverage, security_score, performance_score,
                                maintainability_score, analysis_version, project_hash, 
                                raw_analysis_data, tags_json, notes
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            snapshot_data.get('project_path', ''),
                            snapshot_data.get('project_name', ''),
                            snapshot_data.get('analysis_date', datetime.now().isoformat()),
                            snapshot_data.get('health_score', 0),
                            snapshot_data.get('critical_issues', 0),
                            snapshot_data.get('high_priority_issues', 0),
                            snapshot_data.get('medium_priority_issues', 0),
                            snapshot_data.get('low_priority_issues', 0),
                            snapshot_data.get('project_type', 'unknown'),
                            snapshot_data.get('tech_stack_json', '[]'),
                            snapshot_data.get('file_count', 0),
                            snapshot_data.get('lines_of_code', 0),
                            snapshot_data.get('test_coverage', 0.0),
                            snapshot_data.get('security_score', 0),
                            snapshot_data.get('performance_score', 0),
                            snapshot_data.get('maintainability_score', 0),
                            snapshot_data.get('analysis_version', '1.0'),
                            snapshot_data.get('project_hash', ''),
                            snapshot_data.get('raw_analysis_data', '{}'),
                            snapshot_data.get('tags_json', '[]'),
                            snapshot_data.get('notes', '')
                        ))
                        
                        if cursor.rowcount > 0:
                            imported_count += 1
                
                else:
                    raise ValueError("Only JSON import is currently supported")
            
            # Log import
            cursor.execute('''
                INSERT INTO export_import_logs (
                    operation_type, file_path, format_type, snapshot_count, success
                ) VALUES ('import', ?, 'json', ?, TRUE)
            ''', (import_file, imported_count))
            
            logger.info(f"Imported {imported_count} snapshots from {import_file}")
            return imported_count
            
        except Exception as e:
            cursor.execute('''
                INSERT INTO export_import_logs (
                    operation_type, file_path, format_type, success, error_message
                ) VALUES ('import', ?, 'json', FALSE, ?)
            ''', (import_file, str(e)))
            
            logger.error(f"Import failed: {e}")
            raise
            
        finally:
            cursor.close()
    
    def get_project_summary(self) -> Dict[str, Any]:
        """Get summary statistics for all projects."""
        cursor = self.conn.cursor()
        
        try:
            # Get basic stats
            cursor.execute('''
                SELECT COUNT(*) as total_snapshots,
                       COUNT(DISTINCT project_path) as total_projects,
                       MIN(analysis_date) as earliest_analysis,
                       MAX(analysis_date) as latest_analysis
                FROM analysis_snapshots
            ''')
            basic_stats = dict(cursor.fetchone())
            
            # Get health score distribution
            cursor.execute('''
                SELECT 
                    AVG(health_score) as avg_health_score,
                    MIN(health_score) as min_health_score,
                    MAX(health_score) as max_health_score
                FROM latest_project_snapshots
            ''')
            health_stats = dict(cursor.fetchone())
            
            # Get most analyzed projects
            cursor.execute('''
                SELECT project_name, COUNT(*) as analysis_count
                FROM analysis_snapshots
                GROUP BY project_path, project_name
                ORDER BY analysis_count DESC
                LIMIT 5
            ''')
            top_projects = [dict(row) for row in cursor.fetchall()]
            
            return {
                **basic_stats,
                **health_stats,
                'top_analyzed_projects': top_projects
            }
            
        finally:
            cursor.close()
    
    def cleanup_old_data(self, days_to_keep: int = 90) -> int:
        """
        Clean up old analysis data.
        
        Args:
            days_to_keep: Number of days of history to keep
            
        Returns:
            Number of records deleted
        """
        cursor = self.conn.cursor()
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            cursor.execute('''
                DELETE FROM analysis_snapshots 
                WHERE analysis_date < ?
            ''', (cutoff_date.isoformat(),))
            
            deleted_count = cursor.rowcount
            
            # Clean up orphaned records
            cursor.execute('DELETE FROM analysis_issues WHERE snapshot_id NOT IN (SELECT id FROM analysis_snapshots)')
            cursor.execute('DELETE FROM trend_metrics WHERE snapshot_id NOT IN (SELECT id FROM analysis_snapshots)')
            cursor.execute('DELETE FROM analysis_comparisons WHERE baseline_snapshot_id NOT IN (SELECT id FROM analysis_snapshots) OR current_snapshot_id NOT IN (SELECT id FROM analysis_snapshots)')
            
            logger.info(f"Cleaned up {deleted_count} old analysis snapshots")
            return deleted_count
            
        finally:
            cursor.close()
    
    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Analysis history database connection closed")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()