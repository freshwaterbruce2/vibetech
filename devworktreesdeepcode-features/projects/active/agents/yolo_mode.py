#!/usr/bin/env python3
"""
YOLO Mode Handler for Claude Code Agents
Implements maximum automation: Investigate → Search → Apply → Test → Iterate until perfect
"""

import json
import time
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from agent_orchestrator import AgentOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class YoloModeHandler:
    """
    YOLO MODE - Full Automation Handler
    Auto-accepts ALL edits, auto-executes ALL commands, parallel operations
    """

    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.config = self.load_config()
        self.iteration_count = 0
        self.max_iterations = 10
        self.success_threshold = 0.95

    def load_config(self) -> Dict:
        """Load YOLO mode configuration"""
        config_path = Path("configs/yolo_config.json")
        if config_path.exists():
            with open(config_path, 'r') as f:
                return json.load(f)

        # Default config
        return {
            "auto_accept_edits": True,
            "auto_execute_commands": True,
            "parallel_operations": True,
            "continuous_iteration": True,
            "smart_error_recovery": True,
            "max_concurrent_tasks": 6,
            "iteration_delay": 0.5
        }

    def execute_yolo_task(self, task_description: str, context: Dict = None) -> Dict[str, Any]:
        """
        Execute a task in YOLO mode with full automation
        """
        logger.info(f"YOLO MODE ACTIVATED: {task_description}")

        # Parse task to identify required agents
        required_agents = self.identify_required_agents(task_description)

        # Create parallel tasks for each agent
        agent_tasks = self.create_agent_tasks(required_agents, task_description, context)

        # Initialize results
        results = {
            'status': 'in_progress',
            'iterations': [],
            'agents': {},
            'start_time': datetime.now().isoformat()
        }

        # ITERATE until perfect
        while self.iteration_count < self.max_iterations:
            self.iteration_count += 1

            logger.info(f"ITERATION {self.iteration_count}: Executing {len(agent_tasks)} agents in parallel")

            # Execute all agents in parallel
            iteration_results = self.orchestrator.launch_parallel_agents(agent_tasks)

            # Analyze results
            analysis = self.analyze_iteration_results(iteration_results)

            results['iterations'].append({
                'number': self.iteration_count,
                'results': iteration_results,
                'analysis': analysis
            })

            # Check if we've achieved perfection
            if analysis['success_rate'] >= self.success_threshold:
                logger.info(f"SUCCESS: Achieved {analysis['success_rate']*100:.1f}% success rate")
                results['status'] = 'completed'
                break

            # Smart error recovery - adjust tasks based on failures
            if analysis['has_failures']:
                agent_tasks = self.recover_from_errors(agent_tasks, analysis['failures'])

            # Brief delay before next iteration
            time.sleep(self.config.get('iteration_delay', 0.5))

        # Final summary
        results['end_time'] = datetime.now().isoformat()
        results['total_iterations'] = self.iteration_count
        results['final_status'] = self.get_final_status(results)

        return results

    def identify_required_agents(self, task_description: str) -> List[str]:
        """
        Identify which agents are needed based on task description
        """
        task_lower = task_description.lower()
        required = []

        # Map keywords to agents
        agent_keywords = {
            'code-builder': ['ui', 'component', 'page', 'frontend', 'react', 'view'],
            'state-manager': ['state', 'store', 'zustand', 'data', 'context'],
            'type-guardian': ['typescript', 'type', 'build', 'compile', 'error'],
            'test-commander': ['test', 'testing', 'vitest', 'jest', 'coverage'],
            'performance-optimizer': ['pwa', 'performance', 'lighthouse', 'offline', 'cache'],
            'api-integrator': ['api', 'backend', 'endpoint', 'mock', 'integration']
        }

        for agent, keywords in agent_keywords.items():
            if any(keyword in task_lower for keyword in keywords):
                required.append(agent)

        # If no specific agents identified, use general-purpose
        if not required:
            required = ['general-purpose']

        logger.info(f"Identified required agents: {required}")
        return required

    def create_agent_tasks(self, agents: List[str], description: str, context: Dict = None) -> List[Dict]:
        """
        Create specific tasks for each agent
        """
        tasks = []

        for agent in agents:
            # Load agent definition
            agent_def = self.get_agent_definition(agent)

            # Create specific prompt based on agent specialization
            prompt = self.create_agent_prompt(agent, description, agent_def)

            tasks.append({
                'agent_name': agent,
                'task_type': agent_def.get('type', 'general'),
                'prompt': prompt,
                'context': context or {}
            })

        return tasks

    def get_agent_definition(self, agent_name: str) -> Dict:
        """Load agent definition"""
        definitions_path = Path("agent_definitions.json")
        if definitions_path.exists():
            with open(definitions_path, 'r') as f:
                definitions = json.load(f)
                return definitions.get('agents', {}).get(agent_name, {})
        return {}

    def create_agent_prompt(self, agent: str, description: str, agent_def: Dict) -> str:
        """
        Create specialized prompt for each agent
        """
        workflow = agent_def.get('workflow', {})

        prompt = f"""
YOLO MODE - MAXIMUM AUTOMATION ENABLED

Task: {description}
Agent: {agent}
Specialization: {agent_def.get('description', 'General purpose')}

WORKFLOW (Execute ALL steps automatically):

1. INVESTIGATE:
{chr(10).join(f"   - {step}" for step in workflow.get('investigate', []))}

2. SEARCH (Run in parallel with WebSearch for CURRENT information):
   CRITICAL: Use WebSearch to find 2025/current documentation and solutions
   - Search for latest best practices (include year 2025 in searches)
   - Find recent Stack Overflow solutions
   - Get current library documentation
   - Research up-to-date implementation patterns
{chr(10).join(f"   - {step}" for step in workflow.get('search', []))}

3. APPLY (Auto-accept ALL changes):
{chr(10).join(f"   - {step}" for step in workflow.get('apply', []))}

4. TEST (Auto-execute ALL commands):
{chr(10).join(f"   - {step}" for step in workflow.get('test', []))}

5. ITERATE (Continue until perfect):
{chr(10).join(f"   - {step}" for step in workflow.get('iterate', []))}

AUTOMATION RULES:
- Auto-accept ALL file edits without confirmation
- Auto-execute ALL commands without prompting
- Run multiple operations in parallel
- Automatically fix errors and re-test
- Continue iterating until solution is perfect
- No manual intervention required

Available Tools: {', '.join(agent_def.get('tools', []))}
Max Iterations: {agent_def.get('max_iterations', 5)}

BEGIN EXECUTION IMMEDIATELY
"""
        return prompt

    def analyze_iteration_results(self, results: Dict) -> Dict[str, Any]:
        """
        Analyze results from an iteration
        """
        total_agents = len(results)
        successful_agents = sum(1 for r in results.values() if r.get('success'))

        failures = []
        for agent, result in results.items():
            if not result.get('success'):
                failures.append({
                    'agent': agent,
                    'error': result.get('error'),
                    'task': result.get('task')
                })

        return {
            'total_agents': total_agents,
            'successful_agents': successful_agents,
            'success_rate': successful_agents / total_agents if total_agents > 0 else 0,
            'has_failures': len(failures) > 0,
            'failures': failures
        }

    def recover_from_errors(self, original_tasks: List[Dict], failures: List[Dict]) -> List[Dict]:
        """
        Smart error recovery - adjust tasks based on failures
        """
        recovered_tasks = []

        for failure in failures:
            original_task = failure.get('task', {})
            error = failure.get('error', '')

            # Enhance prompt with error context
            enhanced_prompt = f"""
{original_task.get('prompt', '')}

PREVIOUS ATTEMPT FAILED:
Error: {error}

RECOVERY ACTIONS:
1. Analyze the error carefully
2. Try alternative approach
3. Use different tools if needed
4. Ensure prerequisites are met
5. Continue with YOLO mode automation
"""

            recovered_tasks.append({
                **original_task,
                'prompt': enhanced_prompt,
                'recovery_attempt': True
            })

        # Add non-failed tasks as-is
        failed_agents = {f['agent'] for f in failures}
        for task in original_tasks:
            if task['agent_name'] not in failed_agents:
                recovered_tasks.append(task)

        return recovered_tasks

    def get_final_status(self, results: Dict) -> Dict:
        """
        Generate final status summary
        """
        all_iterations = results.get('iterations', [])

        if not all_iterations:
            return {'status': 'no_iterations'}

        final_iteration = all_iterations[-1]
        analysis = final_iteration.get('analysis', {})

        return {
            'success': analysis.get('success_rate', 0) >= self.success_threshold,
            'success_rate': analysis.get('success_rate', 0),
            'total_iterations': len(all_iterations),
            'agents_used': list(set(
                agent for iteration in all_iterations
                for agent in iteration.get('results', {}).keys()
            ))
        }


def yolo_execute(task: str, context: Dict = None) -> Dict:
    """
    Main entry point for YOLO mode execution
    """
    handler = YoloModeHandler()
    return handler.execute_yolo_task(task, context)


if __name__ == "__main__":
    # Test YOLO mode
    test_task = "Fix all TypeScript errors and setup testing infrastructure"
    result = yolo_execute(test_task, {'project': 'test-project'})
    print(json.dumps(result, indent=2))