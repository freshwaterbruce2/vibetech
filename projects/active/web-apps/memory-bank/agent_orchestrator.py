#!/usr/bin/env python3
"""
Agent Orchestrator - Automatic agent selection and invocation
Routes tasks to specialist agents based on learned patterns
"""

import json
import sqlite3
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATABASE_PATH = Path(r"D:\databases\database.db")
PATTERN_MAPPING_PATH = Path(r"C:\dev\projects\active\web-apps\memory-bank\agent_pattern_mapping.json")
AGENTS_CONFIG_PATH = Path(r"C:\dev\.claude\agents.json")


class AgentOrchestrator:
    """Routes tasks to appropriate specialist agents"""

    def __init__(self):
        self.pattern_mapping = self._load_pattern_mapping()
        self.agents_config = self._load_agents_config()
        self.conn = sqlite3.connect(DATABASE_PATH)
        self.conn.row_factory = sqlite3.Row

    def _load_pattern_mapping(self) -> Dict:
        """Load agent pattern mapping"""
        if not PATTERN_MAPPING_PATH.exists():
            logger.warning(f"Pattern mapping not found: {PATTERN_MAPPING_PATH}")
            return {}

        with open(PATTERN_MAPPING_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _load_agents_config(self) -> Dict:
        """Load agents configuration"""
        if not AGENTS_CONFIG_PATH.exists():
            logger.warning(f"Agents config not found: {AGENTS_CONFIG_PATH}")
            return {}

        with open(AGENTS_CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)

    def analyze_task_context(self, task_description: str, project_context: Optional[str] = None) -> Dict:
        """Analyze task and return context information"""
        task_lower = task_description.lower()

        # Keywords for different specialist areas
        crypto_keywords = ['trading', 'crypto', 'kraken', 'websocket', 'order', 'market', 'price', 'strategy', 'nonce']
        webapp_keywords = ['react', 'component', 'ui', 'frontend', 'tailwind', 'shadcn', 'vite', 'router', 'page']
        desktop_keywords = ['tauri', 'electron', 'desktop', 'window', 'native']
        mobile_keywords = ['capacitor', 'android', 'ios', 'mobile', 'app', 'native']
        backend_keywords = ['api', 'database', 'server', 'backend', 'endpoint', 'auth', 'rest', 'graphql']
        devops_keywords = ['docker', 'deploy', 'ci', 'cd', 'pipeline', 'github actions', 'build', 'test']

        # Task type keywords
        fix_keywords = ['fix', 'bug', 'error', 'issue', 'problem', 'broken', 'crash', 'fail']
        monitor_keywords = ['monitor', 'watch', 'track', 'observe', 'check status']
        analysis_keywords = ['analyze', 'analysis', 'review', 'investigate', 'debug']
        refactor_keywords = ['refactor', 'improve', 'optimize', 'clean', 'restructure']

        # Calculate keyword scores
        scores = {
            'crypto-expert': sum(1 for kw in crypto_keywords if kw in task_lower),
            'webapp-expert': sum(1 for kw in webapp_keywords if kw in task_lower),
            'desktop-expert': sum(1 for kw in desktop_keywords if kw in task_lower),
            'mobile-expert': sum(1 for kw in mobile_keywords if kw in task_lower),
            'backend-expert': sum(1 for kw in backend_keywords if kw in task_lower),
            'devops-expert': sum(1 for kw in devops_keywords if kw in task_lower)
        }

        # Determine task type
        task_type = 'general'
        if any(kw in task_lower for kw in fix_keywords):
            task_type = 'auto_fix_cycle'
        elif any(kw in task_lower for kw in monitor_keywords):
            task_type = 'monitoring_cycle'
        elif any(kw in task_lower for kw in analysis_keywords):
            task_type = 'market_analysis'
        elif any(kw in task_lower for kw in refactor_keywords):
            task_type = 'refactoring'

        # Project context boost
        if project_context:
            project_lower = project_context.lower()
            if 'crypto-enhanced' in project_lower:
                scores['crypto-expert'] += 5
            elif any(p in project_lower for p in ['digital-content', 'business-booking', 'shipping-pwa', 'vibe-tech']):
                scores['webapp-expert'] += 5
            elif any(p in project_lower for p in ['taskmaster', 'deepcode', 'nova-agent', 'desktop-commander']):
                scores['desktop-expert'] += 5
            elif 'vibe-tutor' in project_lower:
                scores['mobile-expert'] += 5
            elif 'memory-bank' in project_lower:
                scores['backend-expert'] += 5

        return {
            'task_type': task_type,
            'keyword_scores': scores,
            'task_description': task_description,
            'project_context': project_context
        }

    def select_agent(self, task_description: str, project_context: Optional[str] = None) -> Optional[Tuple[str, float, Dict]]:
        """
        Select the most appropriate specialist agent for a task

        Returns:
            Tuple of (agent_name, confidence, reasons) or None
        """
        # Analyze task context
        context = self.analyze_task_context(task_description, project_context)
        keyword_scores = context['keyword_scores']
        task_type = context['task_type']

        # Get specialist patterns
        specialist_patterns = self.pattern_mapping.get('specialist_patterns', {})

        # Calculate confidence scores
        agent_scores = {}
        agent_reasons = {}

        for agent_name, score in keyword_scores.items():
            if agent_name not in specialist_patterns:
                continue

            patterns = specialist_patterns[agent_name]
            confidence = score  # Base score from keywords

            reasons = []

            # Boost based on inherited performance
            if patterns.get('inherited_from'):
                total_executions = sum(i['executions'] for i in patterns['inherited_from'])
                avg_success = sum(i['success_rate'] * i['executions'] for i in patterns['inherited_from']) / total_executions
                confidence += avg_success * 2  # Weight by success rate
                reasons.append(f"Inherited from {len(patterns['inherited_from'])} proven performers")

            # Boost if task type matches learned patterns
            if task_type in patterns.get('task_types', {}):
                task_patterns = patterns['task_types'][task_type]
                total_task_execs = sum(p['execution_count'] for p in task_patterns)
                avg_task_success = sum(p['avg_success'] * p['execution_count'] for p in task_patterns) / total_task_execs
                confidence += avg_task_success * 3  # Higher weight for exact task type match
                reasons.append(f"Proven track record with {task_type} tasks ({total_task_execs} executions)")

            # Boost for project context match
            if project_context:
                project_agents = self.agents_config.get('project_agents', {})
                for project, assigned_agent in project_agents.items():
                    if project in (project_context or '') and assigned_agent == agent_name:
                        confidence += 3
                        reasons.append(f"Assigned specialist for {project}")

            agent_scores[agent_name] = confidence
            agent_reasons[agent_name] = reasons

        # Select agent with highest confidence
        if not agent_scores:
            return None

        best_agent = max(agent_scores.items(), key=lambda x: x[1])
        agent_name, confidence = best_agent

        if confidence < 1.0:  # Minimum threshold
            return None

        return (agent_name, confidence, {
            'reasons': agent_reasons[agent_name],
            'task_type': task_type,
            'keyword_score': keyword_scores[agent_name]
        })

    def get_agent_recommendation(self, task_description: str, project_context: Optional[str] = None) -> Dict:
        """Get full agent recommendation with details"""
        selection = self.select_agent(task_description, project_context)

        if not selection:
            return {
                'recommended': False,
                'reason': 'No specialist agent matched this task'
            }

        agent_name, confidence, details = selection

        # Get agent definition
        agent_def = self.agents_config.get('agent_definitions', {}).get(agent_name, {})

        # Get inherited patterns
        specialist_patterns = self.pattern_mapping.get('specialist_patterns', {}).get(agent_name, {})

        return {
            'recommended': True,
            'agent': agent_name,
            'confidence': confidence,
            'display_name': agent_def.get('display_name', agent_name),
            'expertise': agent_def.get('expertise', []),
            'reasons': details['reasons'],
            'task_type': details['task_type'],
            'performance_targets': specialist_patterns.get('performance_targets', {}),
            'inherited_from': [i['agent'] for i in specialist_patterns.get('inherited_from', [])]
        }

    def should_invoke_agent(self, task_description: str, project_context: Optional[str] = None) -> bool:
        """Determine if an agent should be automatically invoked"""
        selection = self.select_agent(task_description, project_context)

        if not selection:
            return False

        agent_name, confidence, details = selection

        # Auto-invoke if confidence is high and task matches learned patterns
        return confidence >= 3.0  # Threshold for auto-invocation

    def close(self):
        """Close database connection"""
        self.conn.close()


def main():
    """CLI interface for agent orchestrator"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: agent_orchestrator.py <task_description> [project_context]"}))
        return 1

    task_description = sys.argv[1]
    project_context = sys.argv[2] if len(sys.argv) > 2 else None

    orchestrator = AgentOrchestrator()

    # Get recommendation
    recommendation = orchestrator.get_agent_recommendation(task_description, project_context)

    # Pretty print
    print(json.dumps(recommendation, indent=2))

    orchestrator.close()
    return 0


if __name__ == "__main__":
    exit(main())
