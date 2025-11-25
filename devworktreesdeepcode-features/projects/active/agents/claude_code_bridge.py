#!/usr/bin/env python3
"""
Claude Code Bridge - Integration Layer
Connects Claude Code's Task tool with local agent orchestrator
Enables intelligent agent routing and parallel execution
"""

import json
import re
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import asyncio
import sys

# Add learning system to path
sys.path.append(r'D:\learning-system')

from agent_orchestrator import AgentOrchestrator
from learning_adapter import LearningAdapter

import sys

# Configure logging to stderr to avoid interfering with JSON output
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)


class ClaudeCodeBridge:
    """
    Bridge between Claude Code Task tool and local agent orchestrator
    Provides intelligent agent selection and task routing
    """

    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.learning_adapter = LearningAdapter()
        self.enhanced_definitions = self.load_enhanced_definitions()
        self.task_patterns = self.load_task_patterns()
        self.agents_md_cache = {}  # Cache for AGENTS.md content

    def load_enhanced_definitions(self) -> Dict:
        """Load enhanced agent definitions with modern prompts"""
        definitions_path = Path("enhanced_agent_definitions.json")
        if definitions_path.exists():
            with open(definitions_path, 'r') as f:
                return json.load(f)
        return {}

    def load_task_patterns(self) -> Dict[str, List[str]]:
        """Load task identification patterns for intelligent routing"""
        return {
            'code-builder': [
                r'\b(component|ui|interface|page|view|frontend|react)\b',
                r'\b(create|build|implement|design)\s+.*\b(component|page|ui)\b',
                r'\b(tailwind|css|styling|layout|responsive)\b',
                r'\b(button|form|modal|card|header|footer|navigation|table)\b',
                r'\b(user\s+(profile|form)|data\s+table)\b'
            ],
            'state-manager': [
                r'\b(state|store|zustand|context|data\s+flow)\b',
                r'\b(manage|handle|update)\s+.*\b(state|data)\b',
                r'\b(react\s+query|api\s+state|global\s+state)\b',
                r'\b(persistence|cache|storage)\b',
                r'\b(shopping\s+cart|authentication).*\b(state|management)\b'
            ],
            'type-guardian': [
                r'\b(typescript|type|interface|build|compile)\b',
                r'\b(error|fix|typing|type\s+safety)\b',
                r'\b(tsc|typecheck|build\s+error)\b',
                r'\b(vite|build\s+pipeline|configuration)\b'
            ],
            'test-commander': [
                r'\b(test|testing|spec|vitest|playwright)\b',
                r'\b(unit\s+test|integration\s+test|e2e)\b',
                r'\b(coverage|mock|assertion)\b',
                r'\b(tdd|bdd|quality\s+assurance)\b',
                r'\bsetup.*testing\b',
                r'\btesting\s+infrastructure\b'
            ],
            'performance-optimizer': [
                r'\b(performance|optimize|pwa|lighthouse)\b',
                r'\b(core\s+web\s+vitals|lcp|fid|cls)\b',
                r'\b(cache|service\s+worker|offline)\b',
                r'\b(bundle\s+size|loading|speed)\b'
            ],
            'api-integrator': [
                r'\b(api|backend|endpoint|fetch|request)\b',
                r'\b(integration|client|server|rest)\b',
                r'\b(mock\s+data|api\s+layer)\b',
                r'\b(error\s+handling|retry|timeout)\b'
            ]
        }

    def find_agents_md(self, working_directory: str = None) -> Optional[str]:
        """
        Find the nearest AGENTS.md file by traversing up the directory tree
        Returns the content of the nearest AGENTS.md file or None if not found
        """
        if working_directory is None:
            # Default to current working directory or common monorepo root
            working_directory = Path.cwd()
        else:
            working_directory = Path(working_directory)

        # Check cache first
        cache_key = str(working_directory.resolve())
        if cache_key in self.agents_md_cache:
            return self.agents_md_cache[cache_key]

        # Traverse up the directory tree looking for AGENTS.md
        current_path = working_directory
        agents_md_content = None

        for _ in range(10):  # Limit traversal depth
            agents_md_path = current_path / "AGENTS.md"
            if agents_md_path.exists():
                try:
                    with open(agents_md_path, 'r', encoding='utf-8') as f:
                        agents_md_content = f.read()
                    logger.info(f"Found AGENTS.md at: {agents_md_path}")
                    break
                except Exception as e:
                    logger.warning(f"Failed to read AGENTS.md at {agents_md_path}: {e}")

            # Move up one directory
            parent = current_path.parent
            if parent == current_path:  # Reached root
                break
            current_path = parent

        # Cache the result (even if None)
        self.agents_md_cache[cache_key] = agents_md_content
        return agents_md_content

    def extract_agents_md_context(self, agents_md_content: str) -> Dict[str, Any]:
        """
        Extract relevant context from AGENTS.md content for agent enhancement
        """
        if not agents_md_content:
            return {}

        context = {
            'project_type': 'general',
            'technology_stack': [],
            'quality_standards': [],
            'performance_requirements': [],
            'security_guidelines': [],
            'testing_requirements': [],
            'specific_patterns': []
        }

        content_lower = agents_md_content.lower()

        # Detect project type - check more specific patterns first
        # Check for monorepo root indicator
        if 'monorepo' in content_lower and 'sophisticated multi-project' in content_lower:
            context['project_type'] = 'monorepo-root'
        # Crypto trading - check first before memory patterns
        elif ('crypto enhanced trading' in content_lower or
              'cryptocurrency trading' in content_lower or
              'production trading system' in content_lower or
              'kraken api integration' in content_lower or
              ('trading system' in content_lower and 'real money' in content_lower) or
              ('crypto' in content_lower and 'trading' in content_lower) or
              'kraken' in content_lower):
            context['project_type'] = 'crypto-trading'
        # Memory system - more specific patterns only
        elif ('enhanced memory system' in content_lower or
              ('memory bank' in content_lower and 'claude code' in content_lower)):
            context['project_type'] = 'memory-system'
        elif 'hotel booking' in content_lower or 'booking platform' in content_lower:
            context['project_type'] = 'booking-platform'
        elif 'desktop application' in content_lower or 'tauri' in content_lower:
            context['project_type'] = 'desktop-app'
        elif 'claude commands' in content_lower or 'command system' in content_lower:
            context['project_type'] = 'command-system'
        elif 'web application' in content_lower and 'react' in content_lower:
            context['project_type'] = 'web-application'
        elif 'memory' in content_lower and 'learning' in content_lower:
            context['project_type'] = 'memory-system'
        elif 'command' in content_lower or 'hook' in content_lower:
            context['project_type'] = 'command-system'

        # Extract technology stack
        tech_indicators = {
            'react': r'\breact\b',
            'typescript': r'\btypescript\b',
            'vite': r'\bvite\b',
            'tauri': r'\btauri\b',
            'python': r'\bpython\b',
            'sqlite': r'\bsqlite\b',
            'shadcn': r'\bshadcn\b',
            'tailwind': r'\btailwind\b',
            'playwright': r'\bplaywright\b',
            'vitest': r'\bvitest\b'
        }

        for tech, pattern in tech_indicators.items():
            if re.search(pattern, content_lower):
                context['technology_stack'].append(tech)

        # Extract performance requirements
        perf_patterns = [
            r'<(\d+)ms',  # Performance targets like <500ms
            r'lighthouse.*score.*>(\d+)',  # Lighthouse scores
            r'bundle.*size.*<(\d+)',  # Bundle size limits
            r'memory.*<(\d+)',  # Memory limits
        ]

        for pattern in perf_patterns:
            matches = re.findall(pattern, content_lower)
            if matches:
                context['performance_requirements'].extend(matches)

        # Extract specific patterns and requirements
        if 'production-ready' in content_lower:
            context['specific_patterns'].append('production-ready-focus')
        if 'no mvp' in content_lower or 'not mvp' in content_lower:
            context['specific_patterns'].append('no-mvp-policy')
        if 'security' in content_lower:
            context['specific_patterns'].append('security-focused')
        if 'real money' in content_lower or 'live trading' in content_lower:
            context['specific_patterns'].append('high-stakes-system')

        return context

    def format_agents_md_context(self, agents_md_context: Dict[str, Any]) -> str:
        """
        Format AGENTS.md context into a readable summary for agent prompts
        """
        if not agents_md_context:
            return "No project-specific AGENTS.md guidance found."

        context_summary = []

        # Project type and focus
        project_type = agents_md_context.get('project_type', 'general')
        context_summary.append(f"📋 **Project Type**: {project_type.replace('-', ' ').title()}")

        # Technology stack
        tech_stack = agents_md_context.get('technology_stack', [])
        if tech_stack:
            context_summary.append(f"🛠️ **Technology Stack**: {', '.join(tech_stack)}")

        # Special patterns and requirements
        patterns = agents_md_context.get('specific_patterns', [])
        if patterns:
            pattern_descriptions = {
                'production-ready-focus': "🎯 **PRODUCTION-READY FOCUS**: Build complete, deployable solutions - NO MVPs",
                'no-mvp-policy': "⛔ **NO MVP POLICY**: Always implement full, production-grade features",
                'security-focused': "🔒 **SECURITY FOCUSED**: Implement comprehensive security measures",
                'high-stakes-system': "⚠️ **HIGH-STAKES SYSTEM**: Handle with extreme care - real money/data involved"
            }

            # Add monorepo-specific guidance
            if agents_md_context.get('project_type') == 'monorepo-root':
                context_summary.append("🏭 **MONOREPO ROOT**: Follow cross-project integration patterns and maintain consistency")

            for pattern in patterns:
                if pattern in pattern_descriptions:
                    context_summary.append(pattern_descriptions[pattern])

        # Performance requirements
        perf_reqs = agents_md_context.get('performance_requirements', [])
        if perf_reqs:
            context_summary.append(f"⚡ **Performance Requirements**: {', '.join(perf_reqs)}")

        # Combine all context
        if context_summary:
            return "\n".join(context_summary) + "\n\n**🔥 CRITICAL**: Follow project-specific AGENTS.md patterns exactly. This guidance overrides generic approaches."
        else:
            return "General project - follow standard development best practices."

    def analyze_task(self, user_prompt: str, context: Dict = None) -> Dict[str, Any]:
        """
        Analyze user prompt to determine required agents and task complexity
        Enhanced with AGENTS.md context for project-specific guidance
        """
        prompt_lower = user_prompt.lower()

        # Read AGENTS.md context for project-specific guidance
        working_directory = context.get('working_directory') if context else None
        agents_md_content = self.find_agents_md(working_directory)
        agents_md_context = self.extract_agents_md_context(agents_md_content)

        logger.info(f"AGENTS.md context: {agents_md_context['project_type']} project with {len(agents_md_context['technology_stack'])} technologies")

        # Calculate task complexity
        complexity_indicators = [
            len(user_prompt.split()) > 50,  # Long descriptions
            'and' in prompt_lower and prompt_lower.count('and') > 2,  # Multiple requirements
            any(word in prompt_lower for word in ['complex', 'advanced', 'comprehensive', 'full']),
            any(word in prompt_lower for word in ['multiple', 'several', 'various', 'all']),
            len(re.findall(r'\b(implement|create|build|fix|optimize|setup)\b', prompt_lower)) > 2
        ]

        complexity_score = sum(complexity_indicators) / len(complexity_indicators)

        # Identify required agents
        required_agents = []
        confidence_scores = {}

        for agent, patterns in self.task_patterns.items():
            agent_score = 0
            matches = 0

            for pattern in patterns:
                if re.search(pattern, prompt_lower):
                    matches += 1
                    agent_score += 1

            if matches > 0:
                confidence = min(matches / len(patterns), 1.0)
                confidence_scores[agent] = confidence

                if confidence > 0.3:  # Threshold for inclusion
                    required_agents.append(agent)

        # If no specific agents identified, analyze further for better routing
        if not required_agents:
            # Use more aggressive pattern matching for edge cases
            prompt_words = prompt_lower.split()

            # Check for implicit indicators
            if any(word in prompt_words for word in ['component', 'ui', 'form', 'page', 'table']):
                required_agents.append('code-builder')
                confidence_scores['code-builder'] = 0.6
            elif any(word in prompt_words for word in ['test', 'testing', 'spec']):
                required_agents.append('test-commander')
                confidence_scores['test-commander'] = 0.6
            elif any(word in prompt_words for word in ['api', 'client', 'endpoint']):
                required_agents.append('api-integrator')
                confidence_scores['api-integrator'] = 0.6
            elif any(word in prompt_words for word in ['performance', 'optimize', 'fast']):
                required_agents.append('performance-optimizer')
                confidence_scores['performance-optimizer'] = 0.6
            else:
                required_agents = ['general-purpose']
                confidence_scores['general-purpose'] = 0.8

        # Determine if parallel execution is beneficial
        parallel_beneficial = (
            len(required_agents) > 1 and
            complexity_score > 0.3 and  # Lower threshold
            not any(word in prompt_lower for word in ['step by step', 'sequential', 'order'])
        )

        # Force parallel for complex multi-domain tasks
        multi_domain_indicators = [
            'complete feature', 'full stack', 'comprehensive', 'end to end',
            'ui.*state.*test', 'component.*api.*test', 'frontend.*backend'
        ]

        if any(re.search(indicator, prompt_lower) for indicator in multi_domain_indicators):
            # Add multiple agents for comprehensive tasks
            comprehensive_agents = set(required_agents)

            if 'complete' in prompt_lower or 'full' in prompt_lower:
                comprehensive_agents.update(['code-builder', 'state-manager', 'test-commander'])

            if 'ui' in prompt_lower and 'state' in prompt_lower:
                comprehensive_agents.update(['code-builder', 'state-manager'])

            if 'test' in prompt_lower and len(comprehensive_agents) == 1:
                comprehensive_agents.add('test-commander')

            required_agents = list(comprehensive_agents)
            parallel_beneficial = len(required_agents) > 1

            # Update confidence scores for added agents
            for agent in required_agents:
                if agent not in confidence_scores:
                    confidence_scores[agent] = 0.5

        return {
            'required_agents': required_agents,
            'confidence_scores': confidence_scores,
            'complexity_score': complexity_score,
            'parallel_execution': parallel_beneficial,
            'task_type': self.determine_task_type(prompt_lower),
            'estimated_duration': self.estimate_duration(complexity_score, len(required_agents)),
            'agents_md_context': agents_md_context,
            'agents_md_content': agents_md_content[:500] + "..." if agents_md_content and len(agents_md_content) > 500 else agents_md_content
        }

    def determine_task_type(self, prompt_lower: str) -> str:
        """Determine the primary task type for learning purposes"""
        task_types = {
            'development': ['create', 'build', 'implement', 'develop'],
            'debugging': ['fix', 'debug', 'error', 'issue', 'problem'],
            'optimization': ['optimize', 'improve', 'performance', 'speed'],
            'testing': ['test', 'verify', 'validate', 'check'],
            'refactoring': ['refactor', 'restructure', 'reorganize', 'clean'],
            'documentation': ['document', 'explain', 'describe', 'comment']
        }

        for task_type, keywords in task_types.items():
            if any(keyword in prompt_lower for keyword in keywords):
                return task_type

        return 'general'

    def estimate_duration(self, complexity_score: float, agent_count: int) -> int:
        """Estimate task duration in seconds"""
        base_duration = 30  # Base 30 seconds
        complexity_multiplier = 1 + (complexity_score * 2)  # 1x to 3x based on complexity
        agent_multiplier = 1 + (agent_count * 0.3)  # Additional time for coordination

        estimated = int(base_duration * complexity_multiplier * agent_multiplier)
        return min(estimated, 300)  # Cap at 5 minutes

    def create_agent_prompts(self, user_prompt: str, analysis: Dict, context: Dict = None) -> List[Dict]:
        """
        Create specialized prompts for each required agent using enhanced definitions
        """
        agent_tasks = []
        agents_config = self.enhanced_definitions.get('agents', {})

        for agent_name in analysis['required_agents']:
            if agent_name == 'general-purpose':
                # Use general-purpose Task tool approach
                agent_tasks.append({
                    'agent_name': 'general-purpose',
                    'task_type': analysis['task_type'],
                    'prompt': self.enhance_general_prompt(user_prompt, analysis),
                    'context': context or {},
                    'use_task_tool': True
                })
                continue

            agent_config = agents_config.get(agent_name, {})
            system_prompt = agent_config.get('system_prompt', '')

            # Build enhanced prompt using the system prompt template with AGENTS.md context
            agents_md_context = analysis.get('agents_md_context', {})
            agents_md_summary = self.format_agents_md_context(agents_md_context)

            enhanced_prompt = f"""{system_prompt}

<current_task>
User Request: {user_prompt}

Context Information:
- Task Complexity: {analysis['complexity_score']:.2f}/1.0
- Confidence Score: {analysis['confidence_scores'].get(agent_name, 0):.2f}
- Parallel Execution: {analysis['parallel_execution']}
- Estimated Duration: {analysis['estimated_duration']} seconds
- Task Type: {analysis['task_type']}
</current_task>

<project_context>
{agents_md_summary}
</project_context>

<execution_instructions>
You are operating in PRODUCTION MODE with the following requirements:
1. Use WebSearch to find the most current 2025 information and best practices
2. Follow the exact workflow: INVESTIGATE → SEARCH → APPLY → TEST → ITERATE
3. Provide clear XML-formatted responses as specified in your role
4. Focus on production-ready solutions with proper error handling
5. Ensure code quality, type safety, and performance optimization
6. Include comprehensive testing and validation steps
</execution_instructions>

Begin by thinking step by step about this {analysis['task_type']} task..."""

            agent_tasks.append({
                'agent_name': agent_name,
                'task_type': analysis['task_type'],
                'prompt': enhanced_prompt,
                'context': context or {},
                'system_prompt': system_prompt,
                'use_task_tool': True  # All agents use Claude Code Task tool
            })

        return agent_tasks

    def enhance_general_prompt(self, user_prompt: str, analysis: Dict) -> str:
        """Enhance prompt for general-purpose agent with task analysis and AGENTS.md context"""
        agents_md_context = analysis.get('agents_md_context', {})
        agents_md_summary = self.format_agents_md_context(agents_md_context)

        return f"""You are a general-purpose development agent handling a {analysis['task_type']} task.

Task Analysis:
- Complexity Score: {analysis['complexity_score']:.2f}/1.0
- Estimated Duration: {analysis['estimated_duration']} seconds
- Task Type: {analysis['task_type']}

Project Context:
{agents_md_summary}

User Request: {user_prompt}

Please use the following workflow:
1. INVESTIGATE: Analyze the current codebase and requirements
2. SEARCH: Use WebSearch to find current 2025 best practices and solutions
3. APPLY: Implement the solution using modern patterns and tools
4. TEST: Verify the implementation works correctly

Remember: Follow the project-specific AGENTS.md guidance above. This overrides generic development approaches.
5. ITERATE: Refine based on testing results

Focus on production-ready code with proper error handling, type safety, and documentation."""

    def route_task(self, user_prompt: str, context: Dict = None) -> Dict[str, Any]:
        """
        Main entry point: Analyze task and route to appropriate agents
        Returns execution plan for Claude Code Task tool
        """
        logger.info(f"Routing task: {user_prompt[:100]}...")

        # Analyze the task
        analysis = self.analyze_task(user_prompt, context)

        # Create agent prompts
        agent_tasks = self.create_agent_prompts(user_prompt, analysis, context)

        # Generate execution plan
        execution_plan = {
            'task_analysis': analysis,
            'execution_strategy': {
                'parallel': analysis['parallel_execution'],
                'agent_count': len(agent_tasks),
                'estimated_duration': analysis['estimated_duration']
            },
            'agent_assignments': agent_tasks,
            'claude_code_integration': {
                'use_task_tool': True,
                'parallel_execution': analysis['parallel_execution'],
                'subagent_type': 'general-purpose',  # Default for Claude Code
                'specialized_routing': True
            },
            'monitoring': {
                'start_time': datetime.now().isoformat(),
                'success_criteria': ['task_completion', 'code_quality', 'test_success'],
                'learning_enabled': True
            }
        }

        logger.info(f"Task routed to {len(agent_tasks)} agents: {[t['agent_name'] for t in agent_tasks]}")
        return execution_plan

    def format_for_claude_code(self, execution_plan: Dict) -> str:
        """
        Format execution plan for Claude Code Task tool integration
        """
        if not execution_plan['agent_assignments']:
            return execution_plan['agent_assignments'][0]['prompt']

        # For parallel execution, create a comprehensive prompt
        if execution_plan['execution_strategy']['parallel']:
            main_prompt = f"""PARALLEL AGENT EXECUTION PLAN

Task Analysis:
- Agents Required: {', '.join([task['agent_name'] for task in execution_plan['agent_assignments']])}
- Complexity: {execution_plan['task_analysis']['complexity_score']:.2f}/1.0
- Parallel Execution: Enabled
- Estimated Duration: {execution_plan['execution_strategy']['estimated_duration']} seconds

Execution Strategy:
Execute the following specialized agents in parallel using the Task tool:

"""
            for i, task in enumerate(execution_plan['agent_assignments'], 1):
                main_prompt += f"""
Agent {i}: {task['agent_name']}
Confidence: {execution_plan['task_analysis']['confidence_scores'].get(task['agent_name'], 0):.2f}
Specialized Prompt:
{task['prompt']}

---
"""
            return main_prompt

        # For single agent execution, return the specialized prompt directly
        return execution_plan['agent_assignments'][0]['prompt']


def route_user_task(user_prompt: str, context: Dict = None) -> Dict[str, Any]:
    """
    Main function for routing user tasks to appropriate agents
    Used by Claude Code hooks and integration points
    """
    bridge = ClaudeCodeBridge()
    return bridge.route_task(user_prompt, context)


def get_claude_code_prompt(user_prompt: str, context: Dict = None) -> str:
    """
    Get formatted prompt for Claude Code Task tool
    """
    bridge = ClaudeCodeBridge()
    execution_plan = bridge.route_task(user_prompt, context)
    return bridge.format_for_claude_code(execution_plan)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Claude Code Bridge - Agent Routing')
    parser.add_argument('--analyze', type=str, help='Analyze task and provide routing recommendations')
    parser.add_argument('--working-directory', type=str, help='Working directory for AGENTS.md context discovery')
    parser.add_argument('--test', action='store_true', help='Run test scenarios')

    args = parser.parse_args()

    bridge = ClaudeCodeBridge()

    if args.analyze:
        # Analyze single task for PowerShell hook
        try:
            # Prepare context with working directory for AGENTS.md discovery
            context = {}
            if args.working_directory:
                context['working_directory'] = args.working_directory

            execution_plan = bridge.route_task(args.analyze, context)

            # Output concise routing info for PowerShell
            routing_info = {
                'agents': [t['agent_name'] for t in execution_plan['agent_assignments']],
                'parallel': execution_plan['execution_strategy']['parallel'],
                'complexity': round(execution_plan['task_analysis']['complexity_score'], 2),
                'duration': execution_plan['execution_strategy']['estimated_duration'],
                'task_type': execution_plan['task_analysis']['task_type']
            }

            print(json.dumps(routing_info))

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            print(json.dumps({'error': str(e)}))

    elif args.test:
        # Test the bridge with various task types
        test_tasks = [
            "Create a responsive user profile component with TypeScript",
            "Fix all TypeScript errors and optimize the build pipeline",
            "Implement comprehensive testing for the authentication module",
            "Optimize performance and add PWA features to the application",
            "Setup state management with Zustand and API integration"
        ]

        for task in test_tasks:
            print(f"\n{'='*60}")
            print(f"TASK: {task}")
            print('='*60)

            execution_plan = bridge.route_task(task)

            print(f"Agents: {[t['agent_name'] for t in execution_plan['agent_assignments']]}")
            print(f"Parallel: {execution_plan['execution_strategy']['parallel']}")
            print(f"Complexity: {execution_plan['task_analysis']['complexity_score']:.2f}")
            print(f"Duration: {execution_plan['execution_strategy']['estimated_duration']}s")

    else:
        parser.print_help()