#!/usr/bin/env python3
"""
Real-time Dashboard for Claude Code Agent Monitoring
Displays agent performance, token usage, and execution status
"""

import json
import sqlite3
import time
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Tuple
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


class AgentDashboard:
    """
    Real-time monitoring dashboard for Claude Code agents
    """

    def __init__(self):
        self.db_path = r"D:\learning-system\agent_learning.db"
        self.refresh_interval = 2  # seconds
        self.display_lines = 30

    def clear_screen(self):
        """Clear the console screen"""
        os.system('cls' if os.name == 'nt' else 'clear')

    def get_agent_metrics(self) -> List[Dict]:
        """Get current metrics for all agents"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                a.name,
                a.agent_type,
                a.status,
                a.success_rate,
                a.total_tasks,
                a.successful_tasks,
                COUNT(DISTINCT ae.id) as recent_executions,
                AVG(ae.execution_time) as avg_execution_time,
                AVG(ae.tokens_used) as avg_tokens,
                MAX(ae.created_at) as last_execution
            FROM agents a
            LEFT JOIN agent_executions ae ON a.name = ae.agent_name
                AND ae.created_at > datetime('now', '-1 hour')
            GROUP BY a.name
            ORDER BY a.name
        """)

        metrics = []
        for row in cursor.fetchall():
            metrics.append({
                'name': row[0],
                'type': row[1],
                'status': row[2],
                'success_rate': row[3] or 0,
                'total_tasks': row[4] or 0,
                'successful_tasks': row[5] or 0,
                'recent_executions': row[6] or 0,
                'avg_execution_time': row[7] or 0,
                'avg_tokens': row[8] or 0,
                'last_execution': row[9] or 'Never'
            })

        conn.close()
        return metrics

    def get_recent_executions(self, limit: int = 5) -> List[Dict]:
        """Get recent agent executions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                agent_name,
                task_type,
                success,
                execution_time,
                tokens_used,
                error_message,
                created_at
            FROM agent_executions
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))

        executions = []
        for row in cursor.fetchall():
            executions.append({
                'agent': row[0],
                'task': row[1],
                'success': '✓' if row[2] else '✗',
                'time': f"{row[3]:.2f}s" if row[3] else 'N/A',
                'tokens': row[4] or 0,
                'error': row[5][:30] + '...' if row[5] and len(row[5]) > 30 else row[5],
                'timestamp': row[6]
            })

        conn.close()
        return executions

    def get_performance_stats(self) -> Dict:
        """Get overall performance statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Overall stats
        cursor.execute("""
            SELECT
                COUNT(*) as total_executions,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                AVG(execution_time) as avg_time,
                SUM(tokens_used) as total_tokens,
                COUNT(DISTINCT agent_name) as active_agents
            FROM agent_executions
            WHERE created_at > datetime('now', '-24 hours')
        """)

        row = cursor.fetchone()
        stats = {
            'total_executions_24h': row[0] or 0,
            'successful_24h': row[1] or 0,
            'avg_execution_time': row[2] or 0,
            'total_tokens_24h': row[3] or 0,
            'active_agents': row[4] or 0
        }

        # Calculate success rate
        if stats['total_executions_24h'] > 0:
            stats['success_rate_24h'] = (stats['successful_24h'] / stats['total_executions_24h']) * 100
        else:
            stats['success_rate_24h'] = 0

        conn.close()
        return stats

    def format_dashboard(self) -> str:
        """Format the dashboard display"""
        output = []

        # Header
        output.append("=" * 80)
        output.append("CLAUDE CODE AGENT MONITORING DASHBOARD".center(80))
        output.append(f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(80))
        output.append("=" * 80)

        # Performance Stats
        stats = self.get_performance_stats()
        output.append("\n📊 PERFORMANCE STATS (Last 24 Hours)")
        output.append("-" * 40)
        output.append(f"Total Executions: {stats['total_executions_24h']}")
        output.append(f"Success Rate: {stats['success_rate_24h']:.1f}%")
        output.append(f"Active Agents: {stats['active_agents']}")
        output.append(f"Avg Execution Time: {stats['avg_execution_time']:.2f}s")
        output.append(f"Total Tokens Used: {stats['total_tokens_24h']:,}")

        # Agent Metrics
        output.append("\n🤖 AGENT STATUS")
        output.append("-" * 80)
        output.append(f"{'Agent':<20} {'Type':<15} {'Status':<8} {'Success':<10} {'Tasks':<10} {'Recent':<8}")
        output.append("-" * 80)

        metrics = self.get_agent_metrics()
        for agent in metrics[:10]:  # Show top 10 agents
            output.append(
                f"{agent['name']:<20} "
                f"{agent['type']:<15} "
                f"{agent['status']:<8} "
                f"{agent['success_rate']*100:>6.1f}% "
                f"{agent['total_tasks']:>10} "
                f"{agent['recent_executions']:>8}"
            )

        # Recent Executions
        output.append("\n📋 RECENT EXECUTIONS")
        output.append("-" * 80)
        output.append(f"{'Agent':<20} {'Task':<20} {'Status':<8} {'Time':<10} {'Tokens':<10}")
        output.append("-" * 80)

        executions = self.get_recent_executions(5)
        for exec in executions:
            output.append(
                f"{exec['agent']:<20} "
                f"{exec['task']:<20} "
                f"{exec['success']:<8} "
                f"{exec['time']:<10} "
                f"{exec['tokens']:<10}"
            )

        # Footer
        output.append("\n" + "=" * 80)
        output.append(f"Press Ctrl+C to exit | Refresh: {self.refresh_interval}s".center(80))

        return "\n".join(output)

    def run(self, continuous: bool = True):
        """Run the dashboard"""
        try:
            if continuous:
                while True:
                    self.clear_screen()
                    print(self.format_dashboard())
                    time.sleep(self.refresh_interval)
            else:
                print(self.format_dashboard())

        except KeyboardInterrupt:
            print("\nDashboard stopped.")

    def get_json_metrics(self) -> Dict:
        """Get metrics in JSON format for API consumption"""
        return {
            'timestamp': datetime.now().isoformat(),
            'performance_stats': self.get_performance_stats(),
            'agent_metrics': self.get_agent_metrics(),
            'recent_executions': self.get_recent_executions(10)
        }


# Command-line interface
def main():
    """Main entry point for the dashboard"""
    import argparse

    parser = argparse.ArgumentParser(description='Claude Code Agent Monitoring Dashboard')
    parser.add_argument('--json', action='store_true', help='Output JSON format')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    parser.add_argument('--refresh', type=int, default=2, help='Refresh interval in seconds')

    args = parser.parse_args()

    dashboard = AgentDashboard()
    dashboard.refresh_interval = args.refresh

    if args.json:
        print(json.dumps(dashboard.get_json_metrics(), indent=2))
    else:
        dashboard.run(continuous=not args.once)


if __name__ == "__main__":
    main()