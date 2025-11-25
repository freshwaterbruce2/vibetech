#!/usr/bin/env python3
"""
Claude Code Agent Orchestrator
Central coordinator for parallel agent execution following YOLO mode pattern
"""

import json
import sqlite3
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

# Add learning system to path
sys.path.append(r'D:\learning-system')

# Use learning adapter for compatibility
from learning_adapter import LearningAdapter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Main orchestrator for Claude Code agents
    Implements: INVESTIGATE → SEARCH → APPLY → TEST → ITERATE
    """

    def __init__(self):
        self.agents = {}
        self.learning_adapter = LearningAdapter()
        self.db_path = r"D:\learning-system\agent_learning.db"
        self.learning_adapter.initialize_agents()
        self.load_agents()

    def load_agents(self):
        """Load agent definitions from database and config"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT name, agent_type, description, capabilities, specializations
                FROM agents
                WHERE status = 'active'
            """)

            for row in cursor.fetchall():
                name, agent_type, description, capabilities, specializations = row
                self.agents[name] = {
                    'name': name,
                    'type': agent_type,
                    'description': description,
                    'capabilities': json.loads(capabilities) if capabilities else [],
                    'specializations': json.loads(specializations) if specializations else []
                }
            conn.close()
            logger.info(f"Loaded {len(self.agents)} active agents")

        except Exception as e:
            logger.error(f"Failed to load agents: {e}")

    def launch_parallel_agents(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Launch multiple agents in parallel for different tasks
        Each task should have: {agent_name, task_type, prompt, context}
        """
        results = {}

        with ThreadPoolExecutor(max_workers=len(tasks)) as executor:
            # Submit all tasks
            future_to_task = {}
            for task in tasks:
                future = executor.submit(self.execute_agent_task, task)
                future_to_task[future] = task

            # Collect results as they complete
            for future in as_completed(future_to_task):
                task = future_to_task[future]
                agent_name = task.get('agent_name')
                try:
                    result = future.result(timeout=300)  # 5 minute timeout
                    results[agent_name] = {
                        'success': True,
                        'result': result,
                        'task': task
                    }

                    # Learn from execution
                    self.learning_adapter.learn_from_execution(
                        agent_name=agent_name,
                        task_type=task.get('task_type'),
                        success=True,
                        tools_used=result.get('tools_used', []),
                        execution_time=result.get('execution_time'),
                        tokens_used=result.get('tokens_used'),
                        project=task.get('context', {}).get('project')
                    )

                except Exception as e:
                    results[agent_name] = {
                        'success': False,
                        'error': str(e),
                        'task': task
                    }

                    # Learn from failure
                    self.learning_engine.learn_from_execution(
                        agent_name=agent_name,
                        task_type=task.get('task_type'),
                        success=False,
                        tools_used=[],
                        error_message=str(e),
                        project=task.get('context', {}).get('project')
                    )

        return results

    def execute_agent_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single agent task following YOLO pattern"""
        agent_name = task.get('agent_name')
        task_type = task.get('task_type')
        prompt = task.get('prompt')
        context = task.get('context', {})

        logger.info(f"Executing {agent_name} for {task_type}")

        # Get recommendations from learning system
        recommendations = self.learning_adapter.get_recommendations(
            task_type=task_type,
            context=context
        )

        # Build enhanced prompt with recommendations
        enhanced_prompt = self.build_enhanced_prompt(prompt, recommendations)

        # Execute through Task tool (simulated here)
        result = self.simulate_task_execution(agent_name, enhanced_prompt)

        return result

    def build_enhanced_prompt(self, base_prompt: str, recommendations: List[Dict]) -> str:
        """Enhance prompt with learning recommendations"""
        enhanced = base_prompt

        if recommendations:
            enhanced += "\n\n## Learning System Recommendations:"
            for rec in recommendations[:3]:  # Top 3 recommendations
                enhanced += f"\n- {rec.get('approach', '')}: {rec.get('reason', '')}"
                if rec.get('tools'):
                    enhanced += f" (Tools: {', '.join(rec['tools'])})"

        enhanced += "\n\nCRITICAL: During SEARCH phase, use WebSearch to find:"
        enhanced += "\n- Latest documentation (2025)"
        enhanced += "\n- Current best practices"
        enhanced += "\n- Recent solutions to similar problems"
        enhanced += "\n- Up-to-date library versions and APIs"
        enhanced += "\n\nFollow YOLO MODE: Auto-accept edits, auto-execute commands, iterate until perfect."

        return enhanced

    def simulate_task_execution(self, agent_name: str, prompt: str) -> Dict[str, Any]:
        """
        Simulate task execution - in real implementation this would use Task tool
        """
        # This is where the actual Task tool would be invoked
        # For now, returning simulated result
        import time
        import random

        start_time = time.time()

        # Simulate some work
        time.sleep(random.uniform(0.5, 2.0))

        execution_time = time.time() - start_time

        return {
            'agent': agent_name,
            'status': 'completed',
            'tools_used': ['Read', 'Edit', 'Bash', 'Test'],
            'execution_time': execution_time,
            'tokens_used': random.randint(1000, 5000),
            'iterations': random.randint(1, 5),
            'result': f"Task completed by {agent_name}"
        }

    def get_agent_status(self) -> Dict[str, Any]:
        """Get current status of all agents"""
        status = {}

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT name, status, success_rate, total_tasks, successful_tasks
                FROM agents
            """)

            for row in cursor.fetchall():
                name, agent_status, success_rate, total_tasks, successful_tasks = row
                status[name] = {
                    'status': agent_status,
                    'success_rate': success_rate,
                    'total_tasks': total_tasks,
                    'successful_tasks': successful_tasks
                }

            conn.close()

        except Exception as e:
            logger.error(f"Failed to get agent status: {e}")

        return status

    def optimize_agent_performance(self):
        """Analyze and optimize agent performance based on learning data"""
        # Get performance metrics
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT agent_name, AVG(execution_time) as avg_time,
                   AVG(tokens_used) as avg_tokens,
                   COUNT(*) as task_count,
                   SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
            FROM agent_executions
            WHERE created_at > datetime('now', '-7 days')
            GROUP BY agent_name
        """)

        optimizations = []
        for row in cursor.fetchall():
            agent_name, avg_time, avg_tokens, task_count, success_rate = row

            if success_rate < 70:
                optimizations.append({
                    'agent': agent_name,
                    'issue': 'low_success_rate',
                    'recommendation': 'Review error patterns and update prompts'
                })

            if avg_tokens > 10000:
                optimizations.append({
                    'agent': agent_name,
                    'issue': 'high_token_usage',
                    'recommendation': 'Implement token optimization strategies'
                })

        conn.close()
        return optimizations


if __name__ == "__main__":
    # Test the orchestrator
    orchestrator = AgentOrchestrator()

    # Example parallel task launch
    test_tasks = [
        {
            'agent_name': 'general-purpose',
            'task_type': 'code_search',
            'prompt': 'Find all TypeScript errors in the project',
            'context': {'project': 'shipping-pwa'}
        },
        {
            'agent_name': 'test-maestro',
            'task_type': 'test_generation',
            'prompt': 'Create unit tests for the shipment module',
            'context': {'project': 'shipping-pwa'}
        }
    ]

    results = orchestrator.launch_parallel_agents(test_tasks)
    print(json.dumps(results, indent=2))

    # Get agent status
    status = orchestrator.get_agent_status()
    print("\nAgent Status:")
    print(json.dumps(status, indent=2))