#!/usr/bin/env python3
"""
Parallel Agent Launcher for Claude Code
Launches multiple agents simultaneously using the Task tool
"""

import json
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
import sys

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from agent_orchestrator import AgentOrchestrator
from yolo_mode import YoloModeHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ParallelAgentLauncher:
    """
    Launches multiple Claude Code agents in parallel
    Integrates with Task tool for actual execution
    """

    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.yolo_handler = YoloModeHandler()
        self.active_agents = {}
        self.results = {}

    def launch_agents_for_project(self, project_name: str, project_type: str = 'web-app') -> Dict:
        """
        Launch all necessary agents for a project based on its type
        """
        logger.info(f"Launching agents for project: {project_name} (type: {project_type})")

        # Define agent tasks based on project type
        if project_type == 'web-app':
            agent_tasks = self.create_web_app_tasks(project_name)
        elif project_type == 'desktop-app':
            agent_tasks = self.create_desktop_app_tasks(project_name)
        elif project_type == 'trading-bot':
            agent_tasks = self.create_trading_bot_tasks(project_name)
        else:
            agent_tasks = self.create_general_tasks(project_name)

        # Launch all agents in parallel
        results = self.orchestrator.launch_parallel_agents(agent_tasks)

        # Store results
        self.results[project_name] = {
            'timestamp': datetime.now().isoformat(),
            'project_type': project_type,
            'agents_launched': len(agent_tasks),
            'results': results
        }

        return results

    def create_web_app_tasks(self, project_name: str) -> List[Dict]:
        """
        Create tasks for web application development
        """
        base_path = f"C:\\dev\\projects\\active\\web-apps\\{project_name}"

        return [
            {
                'agent_name': 'code-builder',
                'task_type': 'ui_development',
                'prompt': f"""
                YOLO MODE: Build all UI components for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze design requirements and existing components
                2. SEARCH: Find component patterns and UI libraries
                3. APPLY: Create all pages and components
                4. TEST: Visual verification and component testing
                5. ITERATE: Fix UI issues until perfect

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            },
            {
                'agent_name': 'state-manager',
                'task_type': 'state_management',
                'prompt': f"""
                YOLO MODE: Setup state management for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze data flow requirements
                2. SEARCH: Find data models and API patterns
                3. APPLY: Create Zustand stores for all entities
                4. TEST: Verify state persistence and updates
                5. ITERATE: Optimize until data flow is perfect

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            },
            {
                'agent_name': 'type-guardian',
                'task_type': 'typescript_fixes',
                'prompt': f"""
                YOLO MODE: Fix all TypeScript errors in {project_name}
                Path: {base_path}

                1. INVESTIGATE: Run typecheck and identify all errors
                2. SEARCH: Find type definitions and interfaces
                3. APPLY: Fix all type errors and add missing types
                4. TEST: Run npm run typecheck until zero errors
                5. ITERATE: Continue until build succeeds perfectly

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            },
            {
                'agent_name': 'test-commander',
                'task_type': 'testing_setup',
                'prompt': f"""
                YOLO MODE: Setup testing infrastructure for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze testing requirements
                2. SEARCH: Find testable code and patterns
                3. APPLY: Setup Vitest and create test suites
                4. TEST: Run full test suite
                5. ITERATE: Achieve 80% coverage minimum

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            },
            {
                'agent_name': 'performance-optimizer',
                'task_type': 'pwa_optimization',
                'prompt': f"""
                YOLO MODE: Implement PWA features for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze PWA requirements
                2. SEARCH: Find service worker and manifest files
                3. APPLY: Implement offline mode and caching
                4. TEST: Run Lighthouse audit
                5. ITERATE: Achieve 90+ Lighthouse score

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            },
            {
                'agent_name': 'api-integrator',
                'task_type': 'api_setup',
                'prompt': f"""
                YOLO MODE: Create API integration for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze API requirements
                2. SEARCH: Find API endpoints and schemas
                3. APPLY: Create service layer with mock data
                4. TEST: Verify all data flows
                5. ITERATE: Ensure smooth API operations

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            }
        ]

    def create_desktop_app_tasks(self, project_name: str) -> List[Dict]:
        """
        Create tasks for desktop application (Tauri) development
        """
        base_path = f"C:\\dev\\projects\\active\\desktop-apps\\{project_name}"

        return [
            {
                'agent_name': 'general-purpose',
                'task_type': 'tauri_setup',
                'prompt': f"""
                YOLO MODE: Setup Tauri desktop app for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze desktop app requirements
                2. SEARCH: Find Tauri configuration patterns
                3. APPLY: Configure Tauri with React frontend
                4. TEST: Build and run desktop app
                5. ITERATE: Fix any build issues

                Use Tauri (NOT Electron), auto-accept all changes
                """,
                'context': {'project': project_name, 'path': base_path}
            }
        ]

    def create_trading_bot_tasks(self, project_name: str) -> List[Dict]:
        """
        Create tasks for trading bot development
        """
        base_path = f"C:\\dev\\projects\\{project_name}"

        return [
            {
                'agent_name': 'general-purpose',
                'task_type': 'trading_system',
                'prompt': f"""
                YOLO MODE: Optimize trading system for {project_name}
                Path: {base_path}

                1. INVESTIGATE: Analyze trading logic and API integration
                2. SEARCH: Find optimization opportunities
                3. APPLY: Implement improvements
                4. TEST: Run backtests and simulations
                5. ITERATE: Optimize performance metrics

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name, 'path': base_path}
            }
        ]

    def create_general_tasks(self, project_name: str) -> List[Dict]:
        """
        Create general tasks for any project type
        """
        return [
            {
                'agent_name': 'general-purpose',
                'task_type': 'general_development',
                'prompt': f"""
                YOLO MODE: Complete development tasks for {project_name}

                1. INVESTIGATE: Analyze project requirements
                2. SEARCH: Find relevant code and patterns
                3. APPLY: Implement required features
                4. TEST: Verify functionality
                5. ITERATE: Fix issues until perfect

                Auto-accept all edits, run all commands automatically
                """,
                'context': {'project': project_name}
            }
        ]

    def get_agent_status(self) -> Dict:
        """
        Get status of all active agents
        """
        status = {
            'active_agents': len(self.active_agents),
            'completed_projects': len(self.results),
            'agents': {}
        }

        # Get status from orchestrator
        agent_status = self.orchestrator.get_agent_status()

        for agent_name, agent_info in agent_status.items():
            status['agents'][agent_name] = {
                'status': agent_info.get('status'),
                'success_rate': f"{agent_info.get('success_rate', 0)*100:.1f}%",
                'total_tasks': agent_info.get('total_tasks'),
                'successful_tasks': agent_info.get('successful_tasks')
            }

        return status

    def launch_yolo_mode(self, task_description: str) -> Dict:
        """
        Launch agents in YOLO mode for a specific task
        """
        return self.yolo_handler.execute_yolo_task(task_description)


# Command-line interface
def main():
    """
    Main entry point for parallel agent launcher
    """
    import argparse

    parser = argparse.ArgumentParser(description='Launch Claude Code agents in parallel')
    parser.add_argument('--project', required=True, help='Project name')
    parser.add_argument('--type', default='web-app',
                       choices=['web-app', 'desktop-app', 'trading-bot', 'general'],
                       help='Project type')
    parser.add_argument('--yolo', action='store_true', help='Use YOLO mode')
    parser.add_argument('--task', help='Specific task for YOLO mode')
    parser.add_argument('--status', action='store_true', help='Show agent status')

    args = parser.parse_args()

    launcher = ParallelAgentLauncher()

    if args.status:
        status = launcher.get_agent_status()
        print(json.dumps(status, indent=2))

    elif args.yolo and args.task:
        result = launcher.launch_yolo_mode(args.task)
        print(json.dumps(result, indent=2))

    else:
        results = launcher.launch_agents_for_project(args.project, args.type)
        print(f"Launched {len(results)} agents for {args.project}")
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()