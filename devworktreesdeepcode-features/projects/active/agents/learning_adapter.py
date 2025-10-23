#!/usr/bin/env python3
"""
Adapter for Learning System Integration
Provides compatibility layer between agent orchestrator and learning system
"""

import json
import sqlite3
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class LearningAdapter:
    """
    Adapter to integrate with the learning system
    Provides simplified interface for agent orchestrator
    """

    def __init__(self):
        self.db_path = r"D:\learning-system\agent_learning.db"

    def learn_from_execution(self, agent_name: str, task_type: str,
                            success: bool, tools_used: List[str] = None,
                            execution_time: float = None, tokens_used: int = None,
                            error_message: str = None, project: str = None) -> Dict[str, Any]:
        """
        Record agent execution in learning database
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Record execution
            cursor.execute("""
                INSERT INTO agent_executions
                (agent_name, project, task_type, success, execution_time,
                 tokens_used, tools_used, error_message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                agent_name,
                project or 'unknown',
                task_type,
                1 if success else 0,
                execution_time,
                tokens_used,
                json.dumps(tools_used) if tools_used else '[]',
                error_message
            ))

            # Update agent stats
            if success:
                cursor.execute("""
                    UPDATE agents
                    SET successful_tasks = successful_tasks + 1,
                        total_tasks = total_tasks + 1,
                        success_rate = CAST(successful_tasks + 1 AS REAL) / (total_tasks + 1)
                    WHERE name = ?
                """, (agent_name,))
            else:
                cursor.execute("""
                    UPDATE agents
                    SET total_tasks = total_tasks + 1,
                        success_rate = CAST(successful_tasks AS REAL) / (total_tasks + 1)
                    WHERE name = ?
                """, (agent_name,))

            conn.commit()
            conn.close()

            logger.info(f"Recorded execution for {agent_name}: {'success' if success else 'failure'}")

            # Return learning insights
            return {
                'recorded': True,
                'agent_name': agent_name,
                'success': success,
                'learning_insights': self._generate_learning_insights(agent_name, task_type, success, execution_time)
            }

        except Exception as e:
            logger.error(f"Failed to record execution: {e}")
            return {
                'recorded': False,
                'error': str(e),
                'agent_name': agent_name
            }

    def _generate_learning_insights(self, agent_name: str, task_type: str, success: bool, execution_time: float) -> Dict:
        """Generate learning insights from execution data"""
        insights = {
            'performance_trend': 'unknown',
            'optimization_suggestions': [],
            'success_patterns': []
        }

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get recent performance trend
            cursor.execute("""
                SELECT AVG(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) as success_rate,
                       AVG(execution_time_seconds) as avg_time,
                       COUNT(*) as total_executions
                FROM agent_executions ae
                JOIN agents a ON ae.agent_id = a.id
                WHERE a.name = ? AND ae.executed_at > datetime('now', '-7 days')
            """, (agent_name,))

            row = cursor.fetchone()
            if row and row[2] > 0:  # Has executions
                success_rate, avg_time, total = row

                if success_rate >= 0.8:
                    insights['performance_trend'] = 'excellent'
                elif success_rate >= 0.6:
                    insights['performance_trend'] = 'good'
                else:
                    insights['performance_trend'] = 'needs_improvement'

                # Generate optimization suggestions
                if avg_time and execution_time:
                    if execution_time > avg_time * 1.5:
                        insights['optimization_suggestions'].append('Consider prompt optimization to reduce execution time')

                if success_rate < 0.7:
                    insights['optimization_suggestions'].append('Review error patterns and enhance system prompts')

            conn.close()

        except Exception as e:
            logger.error(f"Failed to generate learning insights: {e}")

        return insights

    def get_recommendations(self, task_type: str, context: Dict = None) -> List[Dict]:
        """
        Get recommendations for a task type based on historical performance
        """
        recommendations = []

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get successful approaches for this task type
            cursor.execute("""
                SELECT agent_name, tools_used, execution_time, tokens_used
                FROM agent_executions
                WHERE task_type = ? AND success = 1
                ORDER BY execution_time ASC, tokens_used ASC
                LIMIT 5
            """, (task_type,))

            for row in cursor.fetchall():
                agent, tools_json, exec_time, tokens = row
                tools = json.loads(tools_json) if tools_json else []

                recommendations.append({
                    'approach': f"Use {agent} agent approach",
                    'reason': f"Completed in {exec_time:.1f}s with {tokens} tokens",
                    'tools': tools
                })

            # Get patterns from knowledge pool
            cursor.execute("""
                SELECT pattern, confidence, tools_used
                FROM agent_knowledge
                WHERE task_type = ?
                ORDER BY confidence DESC
                LIMIT 3
            """, (task_type,))

            for row in cursor.fetchall():
                pattern, confidence, tools_json = row
                tools = json.loads(tools_json) if tools_json else []

                recommendations.append({
                    'approach': pattern,
                    'reason': f"Confidence: {confidence:.2f}",
                    'tools': tools
                })

            conn.close()

        except Exception as e:
            logger.error(f"Failed to get recommendations: {e}")

        return recommendations

    def initialize_agents(self):
        """
        Ensure all agents are registered in the database
        """
        agents = [
            ('code-builder', 'development', 'UI/Component development specialist'),
            ('state-manager', 'architecture', 'Data layer and state management specialist'),
            ('type-guardian', 'quality', 'TypeScript and build pipeline specialist'),
            ('test-commander', 'testing', 'Testing infrastructure and test generation'),
            ('performance-optimizer', 'optimization', 'PWA features and performance optimization'),
            ('api-integrator', 'integration', 'API integration and mock data specialist')
        ]

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            for name, agent_type, description in agents:
                cursor.execute("""
                    INSERT OR IGNORE INTO agents
                    (name, agent_type, description, status, created_at)
                    VALUES (?, ?, ?, 'active', datetime('now'))
                """, (name, agent_type, description))

            conn.commit()
            conn.close()

            logger.info("Initialized agents in database")

        except Exception as e:
            logger.error(f"Failed to initialize agents: {e}")