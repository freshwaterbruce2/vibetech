#!/usr/bin/env python3
"""
Production Monitoring and Health Check System
Real-time monitoring for agent system performance and reliability
"""

import json
import sqlite3
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import sys
import os

# Add learning system to path
sys.path.append(r'D:\learning-system')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProductionMonitor:
    """
    Production-grade monitoring system for agent orchestration
    Tracks performance, reliability, and system health
    """

    def __init__(self):
        self.db_path = r"D:\learning-system\agent_learning.db"
        self.monitoring_db = r"D:\learning-system\monitoring.db"
        self.alert_thresholds = {
            'success_rate_critical': 0.5,
            'success_rate_warning': 0.7,
            'avg_execution_time_critical': 300,  # 5 minutes
            'avg_execution_time_warning': 120,   # 2 minutes
            'error_rate_critical': 0.3,
            'error_rate_warning': 0.1
        }
        self.initialize_monitoring_db()

    def initialize_monitoring_db(self):
        """Initialize monitoring database schema"""
        try:
            conn = sqlite3.connect(self.monitoring_db)
            cursor = conn.cursor()

            # Health check results table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS health_checks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    check_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details JSON,
                    response_time_ms REAL
                )
            """)

            # Performance metrics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metric_name TEXT NOT NULL,
                    metric_value REAL NOT NULL,
                    metric_unit TEXT,
                    tags JSON
                )
            """)

            # Alert history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    resolved_at DATETIME,
                    details JSON
                )
            """)

            # System status table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS system_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    overall_status TEXT NOT NULL,
                    agent_statuses JSON,
                    performance_summary JSON,
                    active_alerts INTEGER DEFAULT 0
                )
            """)

            conn.commit()
            conn.close()
            logger.info("Monitoring database initialized")

        except Exception as e:
            logger.error(f"Failed to initialize monitoring database: {e}")

    def run_health_checks(self) -> Dict[str, Any]:
        """Run comprehensive health checks"""
        health_status = {
            'overall_status': 'healthy',
            'checks': {},
            'timestamp': datetime.now().isoformat(),
            'alerts': []
        }

        # Database connectivity check
        db_check = self._check_database_connectivity()
        health_status['checks']['database'] = db_check

        # Agent system check
        agent_check = self._check_agent_system()
        health_status['checks']['agent_system'] = agent_check

        # Performance check
        performance_check = self._check_performance_metrics()
        health_status['checks']['performance'] = performance_check

        # Learning system check
        learning_check = self._check_learning_system()
        health_status['checks']['learning_system'] = learning_check

        # File system check
        filesystem_check = self._check_filesystem()
        health_status['checks']['filesystem'] = filesystem_check

        # Determine overall status
        failed_checks = [name for name, check in health_status['checks'].items()
                        if check['status'] != 'healthy']

        if len(failed_checks) == 0:
            health_status['overall_status'] = 'healthy'
        elif len(failed_checks) <= 2:
            health_status['overall_status'] = 'degraded'
        else:
            health_status['overall_status'] = 'critical'

        # Generate alerts for failed checks
        for check_name, check_result in health_status['checks'].items():
            if check_result['status'] != 'healthy':
                alert = {
                    'type': f'{check_name}_failure',
                    'severity': 'critical' if check_result['status'] == 'critical' else 'warning',
                    'message': check_result.get('message', f'{check_name} health check failed'),
                    'details': check_result
                }
                health_status['alerts'].append(alert)
                self._record_alert(alert)

        # Record health check results
        self._record_health_check(health_status)

        return health_status

    def _check_database_connectivity(self) -> Dict[str, Any]:
        """Check database connectivity and basic operations"""
        start_time = time.time()

        try:
            # Test main database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM agents")
            agent_count = cursor.fetchone()[0]
            conn.close()

            # Test monitoring database
            conn = sqlite3.connect(self.monitoring_db)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM health_checks")
            check_count = cursor.fetchone()[0]
            conn.close()

            response_time = (time.time() - start_time) * 1000

            if response_time > 5000:  # 5 seconds
                return {
                    'status': 'critical',
                    'message': f'Database response time too slow: {response_time:.0f}ms',
                    'response_time_ms': response_time,
                    'agent_count': agent_count
                }
            elif response_time > 1000:  # 1 second
                return {
                    'status': 'warning',
                    'message': f'Database response time slow: {response_time:.0f}ms',
                    'response_time_ms': response_time,
                    'agent_count': agent_count
                }
            else:
                return {
                    'status': 'healthy',
                    'message': 'Database connectivity normal',
                    'response_time_ms': response_time,
                    'agent_count': agent_count,
                    'health_check_count': check_count
                }

        except Exception as e:
            return {
                'status': 'critical',
                'message': f'Database connectivity failed: {str(e)}',
                'response_time_ms': (time.time() - start_time) * 1000,
                'error': str(e)
            }

    def _check_agent_system(self) -> Dict[str, Any]:
        """Check agent system performance and status"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get recent execution statistics
            cursor.execute("""
                SELECT
                    a.name,
                    COUNT(*) as total_executions,
                    COUNT(CASE WHEN ae.status = 'success' THEN 1 END) as successful_executions,
                    AVG(ae.execution_time_seconds) as avg_execution_time
                FROM agents a
                LEFT JOIN agent_executions ae ON a.id = ae.agent_id
                    AND ae.executed_at > datetime('now', '-24 hours')
                WHERE a.status = 'active'
                GROUP BY a.id, a.name
            """)

            agent_stats = {}
            overall_success_rate = 0
            total_executions = 0
            successful_executions = 0

            for row in cursor.fetchall():
                name, total, successful, avg_time = row
                success_rate = (successful / total) if total > 0 else 1.0

                agent_stats[name] = {
                    'total_executions': total,
                    'successful_executions': successful,
                    'success_rate': success_rate,
                    'avg_execution_time': avg_time or 0
                }

                total_executions += total
                successful_executions += successful

            overall_success_rate = (successful_executions / total_executions) if total_executions > 0 else 1.0

            conn.close()

            # Determine status based on thresholds
            if overall_success_rate < self.alert_thresholds['success_rate_critical']:
                status = 'critical'
                message = f'Critical: Overall success rate {overall_success_rate:.1%}'
            elif overall_success_rate < self.alert_thresholds['success_rate_warning']:
                status = 'warning'
                message = f'Warning: Low success rate {overall_success_rate:.1%}'
            else:
                status = 'healthy'
                message = f'Agent system performing well: {overall_success_rate:.1%} success rate'

            return {
                'status': status,
                'message': message,
                'overall_success_rate': overall_success_rate,
                'total_executions_24h': total_executions,
                'agent_details': agent_stats
            }

        except Exception as e:
            return {
                'status': 'critical',
                'message': f'Agent system check failed: {str(e)}',
                'error': str(e)
            }

    def _check_performance_metrics(self) -> Dict[str, Any]:
        """Check system performance metrics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get recent performance data
            cursor.execute("""
                SELECT
                    AVG(execution_time_seconds) as avg_execution_time,
                    MAX(execution_time_seconds) as max_execution_time,
                    COUNT(*) as total_executions
                FROM agent_executions
                WHERE executed_at > datetime('now', '-1 hour')
            """)

            row = cursor.fetchone()
            avg_time, max_time, total = row

            conn.close()

            if not total or total == 0:
                return {
                    'status': 'warning',
                    'message': 'No recent executions to analyze',
                    'total_executions_1h': 0
                }

            # Check performance thresholds
            if avg_time > self.alert_thresholds['avg_execution_time_critical']:
                status = 'critical'
                message = f'Critical: Avg execution time {avg_time:.1f}s'
            elif avg_time > self.alert_thresholds['avg_execution_time_warning']:
                status = 'warning'
                message = f'Warning: Slow execution time {avg_time:.1f}s'
            else:
                status = 'healthy'
                message = f'Performance normal: {avg_time:.1f}s avg execution time'

            return {
                'status': status,
                'message': message,
                'avg_execution_time': avg_time,
                'max_execution_time': max_time,
                'total_executions_1h': total
            }

        except Exception as e:
            return {
                'status': 'critical',
                'message': f'Performance check failed: {str(e)}',
                'error': str(e)
            }

    def _check_learning_system(self) -> Dict[str, Any]:
        """Check learning system functionality"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Check if learning data is being recorded
            cursor.execute("""
                SELECT COUNT(*) FROM agent_executions
                WHERE executed_at > datetime('now', '-24 hours')
            """)
            recent_executions = cursor.fetchone()[0]

            # Check agent knowledge base
            cursor.execute("SELECT COUNT(*) FROM agents")
            agent_count = cursor.fetchone()[0]

            conn.close()

            if recent_executions == 0:
                return {
                    'status': 'warning',
                    'message': 'No recent learning data recorded',
                    'recent_executions': 0,
                    'total_agents': agent_count
                }
            else:
                return {
                    'status': 'healthy',
                    'message': f'Learning system active: {recent_executions} recent executions',
                    'recent_executions': recent_executions,
                    'total_agents': agent_count
                }

        except Exception as e:
            return {
                'status': 'critical',
                'message': f'Learning system check failed: {str(e)}',
                'error': str(e)
            }

    def _check_filesystem(self) -> Dict[str, Any]:
        """Check filesystem health and disk space"""
        try:
            # Check if key directories exist
            required_paths = [
                Path("C:/dev/projects/active/agents"),
                Path("D:/learning-system"),
                Path("D:/databases")
            ]

            missing_paths = []
            for path in required_paths:
                if not path.exists():
                    missing_paths.append(str(path))

            if missing_paths:
                return {
                    'status': 'critical',
                    'message': f'Missing required directories: {", ".join(missing_paths)}',
                    'missing_paths': missing_paths
                }

            # Check disk space (Windows)
            try:
                import shutil
                total, used, free = shutil.disk_usage("D:/")
                free_percent = (free / total) * 100

                if free_percent < 5:  # Less than 5% free
                    return {
                        'status': 'critical',
                        'message': f'Critical: Low disk space {free_percent:.1f}% free',
                        'free_space_percent': free_percent
                    }
                elif free_percent < 15:  # Less than 15% free
                    return {
                        'status': 'warning',
                        'message': f'Warning: Low disk space {free_percent:.1f}% free',
                        'free_space_percent': free_percent
                    }
                else:
                    return {
                        'status': 'healthy',
                        'message': f'Filesystem healthy: {free_percent:.1f}% free space',
                        'free_space_percent': free_percent
                    }

            except Exception:
                # Fallback if disk usage check fails
                return {
                    'status': 'healthy',
                    'message': 'Filesystem paths accessible',
                    'required_paths_exist': True
                }

        except Exception as e:
            return {
                'status': 'critical',
                'message': f'Filesystem check failed: {str(e)}',
                'error': str(e)
            }

    def _record_health_check(self, health_status: Dict):
        """Record health check results in monitoring database"""
        try:
            conn = sqlite3.connect(self.monitoring_db)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO health_checks (check_type, status, details)
                VALUES (?, ?, ?)
            """, (
                'comprehensive',
                health_status['overall_status'],
                json.dumps(health_status)
            ))

            # Record in system status
            cursor.execute("""
                INSERT INTO system_status (overall_status, agent_statuses, performance_summary, active_alerts)
                VALUES (?, ?, ?, ?)
            """, (
                health_status['overall_status'],
                json.dumps(health_status['checks']),
                json.dumps({
                    'timestamp': health_status['timestamp'],
                    'overall_status': health_status['overall_status']
                }),
                len(health_status.get('alerts', []))
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            logger.error(f"Failed to record health check: {e}")

    def _record_alert(self, alert: Dict):
        """Record alert in monitoring database"""
        try:
            conn = sqlite3.connect(self.monitoring_db)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO alerts (alert_type, severity, message, details)
                VALUES (?, ?, ?, ?)
            """, (
                alert['type'],
                alert['severity'],
                alert['message'],
                json.dumps(alert.get('details', {}))
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            logger.error(f"Failed to record alert: {e}")

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get overall system metrics
            cursor.execute("""
                SELECT
                    COUNT(*) as total_executions,
                    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
                    AVG(execution_time_seconds) as avg_execution_time,
                    COUNT(DISTINCT agent_id) as active_agents
                FROM agent_executions
                WHERE executed_at > datetime('now', '-24 hours')
            """)

            total, successful, avg_time, active_agents = cursor.fetchone()
            success_rate = (successful / total * 100) if total > 0 else 100

            # Get per-agent metrics
            cursor.execute("""
                SELECT
                    a.name,
                    COUNT(*) as executions,
                    COUNT(CASE WHEN ae.status = 'success' THEN 1 END) as successes,
                    AVG(ae.execution_time_seconds) as avg_time
                FROM agents a
                JOIN agent_executions ae ON a.id = ae.agent_id
                WHERE ae.executed_at > datetime('now', '-24 hours')
                GROUP BY a.id, a.name
                ORDER BY executions DESC
            """)

            agent_metrics = []
            for row in cursor.fetchall():
                name, executions, successes, avg_time = row
                agent_success_rate = (successes / executions * 100) if executions > 0 else 100

                agent_metrics.append({
                    'agent_name': name,
                    'executions': executions,
                    'success_rate': round(agent_success_rate, 1),
                    'avg_execution_time': round(avg_time or 0, 2)
                })

            conn.close()

            return {
                'system_overview': {
                    'total_executions_24h': total,
                    'success_rate': round(success_rate, 1),
                    'avg_execution_time': round(avg_time or 0, 2),
                    'active_agents': active_agents
                },
                'agent_performance': agent_metrics,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get system metrics: {e}")
            return {'error': str(e)}

    def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive monitoring dashboard data"""
        health_status = self.run_health_checks()
        system_metrics = self.get_system_metrics()

        return {
            'health_status': health_status,
            'system_metrics': system_metrics,
            'last_updated': datetime.now().isoformat(),
            'monitoring_version': '1.0.0'
        }


def run_health_check():
    """Standalone health check function"""
    monitor = ProductionMonitor()
    return monitor.run_health_checks()


def get_system_status():
    """Get current system status"""
    monitor = ProductionMonitor()
    return monitor.get_monitoring_dashboard()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Production Monitoring System')
    parser.add_argument('--health', action='store_true', help='Run health checks')
    parser.add_argument('--metrics', action='store_true', help='Show system metrics')
    parser.add_argument('--dashboard', action='store_true', help='Show full dashboard')
    parser.add_argument('--watch', action='store_true', help='Continuous monitoring')

    args = parser.parse_args()

    monitor = ProductionMonitor()

    if args.health:
        health = monitor.run_health_checks()
        print(json.dumps(health, indent=2))

    elif args.metrics:
        metrics = monitor.get_system_metrics()
        print(json.dumps(metrics, indent=2))

    elif args.dashboard:
        dashboard = monitor.get_monitoring_dashboard()
        print(json.dumps(dashboard, indent=2))

    elif args.watch:
        print("Starting continuous monitoring... (Ctrl+C to stop)")
        try:
            while True:
                health = monitor.run_health_checks()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Status: {health['overall_status']} | "
                      f"Alerts: {len(health.get('alerts', []))}")
                time.sleep(30)  # Check every 30 seconds
        except KeyboardInterrupt:
            print("\nMonitoring stopped")

    else:
        parser.print_help()