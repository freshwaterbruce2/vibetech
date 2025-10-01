#!/usr/bin/env python3
"""
Learning System Bridge
Connects enhanced memory system with existing learning database
Enables pattern analysis and cross-project knowledge transfer
September 2025 Architecture
"""

import asyncio
import json
import sqlite3
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import logging
from collections import defaultdict, Counter

from enhanced_memory_manager import EnhancedMemoryManager, MemoryType
from context_retrieval_service import ContextRetrievalService, ContextQuery, RetrievalStrategy

class LearningPattern(Enum):
    """Types of learning patterns"""
    SUCCESS_PATTERN = "success_pattern"
    FAILURE_PATTERN = "failure_pattern"
    TOOL_USAGE = "tool_usage"
    WORKFLOW_PATTERN = "workflow_pattern"
    ERROR_RESOLUTION = "error_resolution"
    PERFORMANCE_OPTIMIZATION = "performance_optimization"

@dataclass
class PatternInsight:
    """Discovered pattern insight"""
    pattern_id: str
    pattern_type: LearningPattern
    confidence: float
    frequency: int
    success_rate: float
    description: str
    context_data: Dict[str, Any]
    recommendations: List[str]
    discovered_at: str
    projects_applicable: List[str]

@dataclass
class LearningMetrics:
    """Learning system performance metrics"""
    total_patterns: int
    active_patterns: int
    avg_confidence: float
    success_rate_improvement: float
    memory_integration_score: float
    cross_project_transfers: int
    last_analysis: str

class LearningBridge:
    """Bridge between memory and learning systems"""

    def __init__(self, memory_manager: EnhancedMemoryManager):
        self.memory_manager = memory_manager
        self.retrieval_service = ContextRetrievalService(memory_manager)
        self.learning_conn = memory_manager.learning_conn

        # Pattern analysis configuration
        self.min_pattern_frequency = 3
        self.min_confidence_threshold = 0.6
        self.max_patterns_per_analysis = 50

        # Pattern storage
        self.discovered_patterns = {}
        self.pattern_effectiveness = defaultdict(list)

        # Setup logging
        self.logger = logging.getLogger(__name__)

        # Initialize learning tables if needed
        self._init_learning_tables()

    def _init_learning_tables(self):
        """Initialize additional learning tables for bridge functionality"""
        try:
            # Pattern insights table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS pattern_insights (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern_id TEXT UNIQUE,
                    pattern_type TEXT NOT NULL,
                    confidence REAL,
                    frequency INTEGER,
                    success_rate REAL,
                    description TEXT,
                    context_data TEXT,
                    recommendations TEXT,
                    projects_applicable TEXT,
                    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_validated TIMESTAMP,
                    validation_score REAL DEFAULT 0.0,
                    is_active BOOLEAN DEFAULT 1
                )
            """)

            # Cross-project learning table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS cross_project_learning (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_project TEXT,
                    target_project TEXT,
                    pattern_id TEXT,
                    transfer_type TEXT,
                    success_outcome BOOLEAN,
                    performance_impact REAL,
                    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    validation_notes TEXT,
                    FOREIGN KEY (pattern_id) REFERENCES pattern_insights(pattern_id)
                )
            """)

            # Memory learning correlation table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS memory_learning_correlation (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    memory_key TEXT,
                    pattern_id TEXT,
                    correlation_strength REAL,
                    correlation_type TEXT,
                    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (pattern_id) REFERENCES pattern_insights(pattern_id)
                )
            """)

            # Learning effectiveness tracking
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS learning_effectiveness (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    analysis_date DATE,
                    total_patterns INTEGER,
                    active_patterns INTEGER,
                    avg_confidence REAL,
                    success_rate_improvement REAL,
                    memory_integration_score REAL,
                    cross_project_transfers INTEGER,
                    performance_baseline TEXT,
                    recommendations_generated INTEGER,
                    patterns_validated INTEGER
                )
            """)

            self.learning_conn.commit()
            self.logger.info("Learning bridge tables initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize learning tables: {e}")

    async def analyze_memory_patterns(self, time_window_hours: int = 168) -> List[PatternInsight]:
        """Analyze memory patterns to discover learning insights"""
        self.logger.info(f"Starting pattern analysis for last {time_window_hours} hours")

        # Get recent memory usage data
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)

        memory_data = self.learning_conn.execute("""
            SELECT mu.key, mu.memory_type, mu.access_count, mu.last_accessed,
                   mu.metadata, mu.storage_location
            FROM memory_usage mu
            WHERE mu.last_accessed >= ?
            ORDER BY mu.access_count DESC, mu.last_accessed DESC
        """, (cutoff_time.isoformat(),)).fetchall()

        # Load actual memory content for analysis
        memory_contents = []
        for mem_data in memory_data[:100]:  # Limit to top 100 for performance
            try:
                key = mem_data[0]
                memory_result = await self.memory_manager.retrieve_memory(key)
                if memory_result and memory_result.get('data'):
                    memory_contents.append({
                        'key': key,
                        'memory_type': mem_data[1],
                        'access_count': mem_data[2],
                        'last_accessed': mem_data[3],
                        'metadata': json.loads(mem_data[4]) if mem_data[4] else {},
                        'data': memory_result['data']
                    })
            except Exception as e:
                self.logger.warning(f"Failed to load memory {key}: {e}")

        # Analyze patterns
        patterns = []

        # 1. Success patterns
        success_patterns = await self._analyze_success_patterns(memory_contents)
        patterns.extend(success_patterns)

        # 2. Tool usage patterns
        tool_patterns = await self._analyze_tool_patterns(memory_contents)
        patterns.extend(tool_patterns)

        # 3. Workflow patterns
        workflow_patterns = await self._analyze_workflow_patterns(memory_contents)
        patterns.extend(workflow_patterns)

        # 4. Error resolution patterns
        error_patterns = await self._analyze_error_patterns(memory_contents)
        patterns.extend(error_patterns)

        # Store discovered patterns
        await self._store_patterns(patterns)

        # Update effectiveness metrics
        await self._update_learning_metrics(patterns)

        self.logger.info(f"Pattern analysis complete. Discovered {len(patterns)} patterns")
        return patterns

    async def _analyze_success_patterns(self, memory_contents: List[Dict]) -> List[PatternInsight]:
        """Analyze successful task completion patterns"""
        success_patterns = []

        # Group by intent category
        intent_groups = defaultdict(list)
        for memory in memory_contents:
            intent = memory['metadata'].get('intent_category', 'unknown')
            intent_groups[intent].append(memory)

        for intent, memories in intent_groups.items():
            if len(memories) < self.min_pattern_frequency:
                continue

            # Look for successful outcomes
            successful_memories = []
            for memory in memories:
                data = memory['data']
                if self._is_successful_outcome(data):
                    successful_memories.append(memory)

            if len(successful_memories) >= self.min_pattern_frequency:
                success_rate = len(successful_memories) / len(memories)

                # Extract common success factors
                success_factors = self._extract_success_factors(successful_memories)

                pattern = PatternInsight(
                    pattern_id=f"success_{intent}_{hashlib.md5(str(success_factors).encode()).hexdigest()[:8]}",
                    pattern_type=LearningPattern.SUCCESS_PATTERN,
                    confidence=min(success_rate + 0.1, 1.0),
                    frequency=len(successful_memories),
                    success_rate=success_rate,
                    description=f"Successful {intent} pattern with {success_rate:.1%} success rate",
                    context_data={
                        'intent_category': intent,
                        'success_factors': success_factors,
                        'sample_size': len(memories),
                        'successful_count': len(successful_memories)
                    },
                    recommendations=self._generate_success_recommendations(success_factors),
                    discovered_at=datetime.now().isoformat(),
                    projects_applicable=self._identify_applicable_projects(successful_memories)
                )
                success_patterns.append(pattern)

        return success_patterns

    async def _analyze_tool_patterns(self, memory_contents: List[Dict]) -> List[PatternInsight]:
        """Analyze tool usage effectiveness patterns"""
        tool_patterns = []

        # Extract tool usage from memories
        tool_usage = defaultdict(list)
        for memory in memory_contents:
            tools = self._extract_tools_used(memory['data'])
            for tool in tools:
                tool_usage[tool].append(memory)

        for tool, tool_memories in tool_usage.items():
            if len(tool_memories) < self.min_pattern_frequency:
                continue

            # Calculate tool effectiveness
            successful_uses = sum(1 for mem in tool_memories
                                if self._is_successful_outcome(mem['data']))
            success_rate = successful_uses / len(tool_memories)

            if success_rate >= 0.5:  # Tool is reasonably effective
                # Find contexts where tool works best
                best_contexts = self._find_optimal_tool_contexts(tool, tool_memories)

                pattern = PatternInsight(
                    pattern_id=f"tool_{tool}_{hashlib.md5(str(best_contexts).encode()).hexdigest()[:8]}",
                    pattern_type=LearningPattern.TOOL_USAGE,
                    confidence=success_rate,
                    frequency=len(tool_memories),
                    success_rate=success_rate,
                    description=f"Tool '{tool}' effective in {success_rate:.1%} of uses",
                    context_data={
                        'tool_name': tool,
                        'optimal_contexts': best_contexts,
                        'usage_count': len(tool_memories),
                        'successful_uses': successful_uses
                    },
                    recommendations=self._generate_tool_recommendations(tool, best_contexts),
                    discovered_at=datetime.now().isoformat(),
                    projects_applicable=self._identify_applicable_projects(tool_memories)
                )
                tool_patterns.append(pattern)

        return tool_patterns

    async def _analyze_workflow_patterns(self, memory_contents: List[Dict]) -> List[PatternInsight]:
        """Analyze workflow and process patterns"""
        workflow_patterns = []

        # Group memories by temporal sequences
        temporal_sequences = self._group_temporal_sequences(memory_contents)

        for sequence in temporal_sequences:
            if len(sequence) < 3:  # Need at least 3 steps for a workflow
                continue

            # Extract workflow steps
            steps = self._extract_workflow_steps(sequence)

            # Check if this workflow pattern appears multiple times
            workflow_signature = self._generate_workflow_signature(steps)
            similar_workflows = self._find_similar_workflows(workflow_signature, temporal_sequences)

            if len(similar_workflows) >= self.min_pattern_frequency:
                # Calculate workflow effectiveness
                successful_workflows = [w for w in similar_workflows
                                      if self._is_successful_workflow(w)]
                success_rate = len(successful_workflows) / len(similar_workflows)

                pattern = PatternInsight(
                    pattern_id=f"workflow_{workflow_signature[:16]}",
                    pattern_type=LearningPattern.WORKFLOW_PATTERN,
                    confidence=success_rate,
                    frequency=len(similar_workflows),
                    success_rate=success_rate,
                    description=f"Workflow pattern with {len(steps)} steps, {success_rate:.1%} success rate",
                    context_data={
                        'workflow_steps': steps,
                        'signature': workflow_signature,
                        'variations': len(similar_workflows),
                        'avg_duration': self._calculate_avg_workflow_duration(similar_workflows)
                    },
                    recommendations=self._generate_workflow_recommendations(steps, successful_workflows),
                    discovered_at=datetime.now().isoformat(),
                    projects_applicable=self._identify_applicable_projects([mem for seq in similar_workflows for mem in seq])
                )
                workflow_patterns.append(pattern)

        return workflow_patterns

    async def _analyze_error_patterns(self, memory_contents: List[Dict]) -> List[PatternInsight]:
        """Analyze error resolution patterns"""
        error_patterns = []

        # Find error-related memories
        error_memories = []
        for memory in memory_contents:
            if self._contains_error(memory['data']):
                error_memories.append(memory)

        # Group by error type
        error_groups = defaultdict(list)
        for memory in error_memories:
            error_type = self._classify_error_type(memory['data'])
            error_groups[error_type].append(memory)

        for error_type, memories in error_groups.items():
            if len(memories) < self.min_pattern_frequency:
                continue

            # Find resolution patterns
            resolved_memories = [mem for mem in memories
                               if self._was_error_resolved(mem['data'])]

            if resolved_memories:
                resolution_rate = len(resolved_memories) / len(memories)
                resolution_methods = self._extract_resolution_methods(resolved_memories)

                pattern = PatternInsight(
                    pattern_id=f"error_{error_type}_{hashlib.md5(str(resolution_methods).encode()).hexdigest()[:8]}",
                    pattern_type=LearningPattern.ERROR_RESOLUTION,
                    confidence=resolution_rate,
                    frequency=len(memories),
                    success_rate=resolution_rate,
                    description=f"Error resolution pattern for {error_type} with {resolution_rate:.1%} resolution rate",
                    context_data={
                        'error_type': error_type,
                        'resolution_methods': resolution_methods,
                        'total_occurrences': len(memories),
                        'resolved_count': len(resolved_memories)
                    },
                    recommendations=self._generate_error_resolution_recommendations(error_type, resolution_methods),
                    discovered_at=datetime.now().isoformat(),
                    projects_applicable=self._identify_applicable_projects(memories)
                )
                error_patterns.append(pattern)

        return error_patterns

    def _is_successful_outcome(self, data: Any) -> bool:
        """Determine if memory represents successful outcome"""
        if isinstance(data, dict):
            # Check for explicit success indicators
            success_indicators = ['success', 'complete', 'done', 'finished', 'resolved']
            for field in ['result', 'status', 'outcome']:
                if field in data:
                    value = str(data[field]).lower()
                    if any(indicator in value for indicator in success_indicators):
                        return True

            # Check for absence of error indicators
            error_indicators = ['error', 'fail', 'exception', 'problem']
            for field in ['error', 'status', 'result']:
                if field in data:
                    value = str(data[field]).lower()
                    if any(indicator in value for indicator in error_indicators):
                        return False

            # Check completion signals
            if data.get('intent_category') == 'completion':
                return True

        return False

    def _extract_success_factors(self, successful_memories: List[Dict]) -> List[str]:
        """Extract common factors from successful memories"""
        factors = []

        # Common tools used
        tool_counts = Counter()
        for memory in successful_memories:
            tools = self._extract_tools_used(memory['data'])
            tool_counts.update(tools)

        # Most common tools
        for tool, count in tool_counts.most_common(3):
            if count >= len(successful_memories) * 0.5:  # Used in at least 50% of cases
                factors.append(f"tool:{tool}")

        # Common approaches/methods
        approach_counts = Counter()
        for memory in successful_memories:
            approaches = self._extract_approaches(memory['data'])
            approach_counts.update(approaches)

        for approach, count in approach_counts.most_common(3):
            if count >= len(successful_memories) * 0.3:  # Used in at least 30% of cases
                factors.append(f"approach:{approach}")

        return factors

    def _extract_tools_used(self, data: Any) -> List[str]:
        """Extract tools mentioned in memory data"""
        tools = []
        text = str(data).lower()

        # Common development tools
        tool_patterns = [
            'npm', 'yarn', 'pip', 'poetry', 'git', 'docker', 'kubectl',
            'node', 'python', 'bash', 'powershell', 'cmd', 'terminal',
            'vscode', 'vim', 'emacs', 'jest', 'pytest', 'mocha',
            'webpack', 'vite', 'rollup', 'babel', 'typescript',
            'eslint', 'prettier', 'black', 'flake8', 'mypy'
        ]

        for tool in tool_patterns:
            if tool in text:
                tools.append(tool)

        return tools

    def _extract_approaches(self, data: Any) -> List[str]:
        """Extract approaches/methods from memory data"""
        approaches = []

        if isinstance(data, dict):
            for field in ['approach', 'method', 'strategy', 'technique']:
                if field in data:
                    approaches.append(str(data[field]).lower()[:50])

        return approaches

    def _generate_success_recommendations(self, success_factors: List[str]) -> List[str]:
        """Generate recommendations based on success factors"""
        recommendations = []

        tool_factors = [f for f in success_factors if f.startswith('tool:')]
        approach_factors = [f for f in success_factors if f.startswith('approach:')]

        if tool_factors:
            tools = [f.split(':')[1] for f in tool_factors]
            recommendations.append(f"Use proven tools: {', '.join(tools)}")

        if approach_factors:
            approaches = [f.split(':')[1] for f in approach_factors]
            recommendations.append(f"Apply successful approaches: {', '.join(approaches)}")

        if not recommendations:
            recommendations.append("Follow established patterns for this task type")

        return recommendations

    def _identify_applicable_projects(self, memories: List[Dict]) -> List[str]:
        """Identify which projects this pattern applies to"""
        projects = set()

        for memory in memories:
            # Extract project info from working directory or metadata
            working_dir = memory.get('metadata', {}).get('working_dir', '')
            if working_dir:
                # Extract project name from path
                path_parts = working_dir.split('\\') if '\\' in working_dir else working_dir.split('/')
                for part in reversed(path_parts):
                    if part and part not in ['dev', 'projects', 'active', 'web-apps']:
                        projects.add(part)
                        break

        return list(projects)

    async def _store_patterns(self, patterns: List[PatternInsight]):
        """Store discovered patterns in database"""
        for pattern in patterns:
            try:
                self.learning_conn.execute("""
                    INSERT OR REPLACE INTO pattern_insights
                    (pattern_id, pattern_type, confidence, frequency, success_rate,
                     description, context_data, recommendations, projects_applicable,
                     discovered_at, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, (
                    pattern.pattern_id,
                    pattern.pattern_type.value,
                    pattern.confidence,
                    pattern.frequency,
                    pattern.success_rate,
                    pattern.description,
                    json.dumps(pattern.context_data),
                    json.dumps(pattern.recommendations),
                    json.dumps(pattern.projects_applicable),
                    pattern.discovered_at
                ))

                self.discovered_patterns[pattern.pattern_id] = pattern

            except Exception as e:
                self.logger.error(f"Failed to store pattern {pattern.pattern_id}: {e}")

        self.learning_conn.commit()

    async def _update_learning_metrics(self, patterns: List[PatternInsight]):
        """Update learning effectiveness metrics"""
        try:
            # Calculate metrics
            total_patterns = len(patterns)
            active_patterns = len([p for p in patterns if p.confidence >= self.min_confidence_threshold])
            avg_confidence = np.mean([p.confidence for p in patterns]) if patterns else 0.0
            avg_success_rate = np.mean([p.success_rate for p in patterns]) if patterns else 0.0

            # Memory integration score (how well memory data correlates with patterns)
            memory_integration_score = self._calculate_memory_integration_score(patterns)

            # Cross-project transfer count
            cross_project_transfers = len([p for p in patterns if len(p.projects_applicable) > 1])

            # Store metrics
            self.learning_conn.execute("""
                INSERT INTO learning_effectiveness
                (analysis_date, total_patterns, active_patterns, avg_confidence,
                 success_rate_improvement, memory_integration_score, cross_project_transfers,
                 recommendations_generated, patterns_validated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                datetime.now().date().isoformat(),
                total_patterns,
                active_patterns,
                avg_confidence,
                avg_success_rate,
                memory_integration_score,
                cross_project_transfers,
                sum(len(p.recommendations) for p in patterns),
                active_patterns  # Assume active patterns are validated
            ))

            self.learning_conn.commit()

        except Exception as e:
            self.logger.error(f"Failed to update learning metrics: {e}")

    def _calculate_memory_integration_score(self, patterns: List[PatternInsight]) -> float:
        """Calculate how well memory data integrates with discovered patterns"""
        if not patterns:
            return 0.0

        # Score based on pattern confidence and frequency
        integration_scores = []
        for pattern in patterns:
            # High frequency + high confidence = good integration
            freq_score = min(pattern.frequency / 10.0, 1.0)
            conf_score = pattern.confidence
            integration_score = (freq_score + conf_score) / 2.0
            integration_scores.append(integration_score)

        return np.mean(integration_scores)

    async def get_learning_recommendations(self, context: str) -> List[Dict[str, Any]]:
        """Get learning-based recommendations for current context"""
        recommendations = []

        # Analyze context to extract keywords and intent
        keywords = self._extract_keywords_from_context(context)
        intent = self._classify_intent(context)

        # Find relevant patterns
        relevant_patterns = self.learning_conn.execute("""
            SELECT pattern_id, pattern_type, confidence, description,
                   context_data, recommendations
            FROM pattern_insights
            WHERE is_active = 1
            AND (json_extract(context_data, '$.intent_category') = ?
                 OR pattern_type IN ('success_pattern', 'tool_usage'))
            ORDER BY confidence DESC, frequency DESC
            LIMIT 10
        """, (intent,)).fetchall()

        for pattern_data in relevant_patterns:
            pattern_id, pattern_type, confidence, description, context_data_str, recs_str = pattern_data

            try:
                context_data = json.loads(context_data_str)
                pattern_recommendations = json.loads(recs_str)

                # Check keyword relevance
                pattern_keywords = self._extract_pattern_keywords(context_data)
                keyword_overlap = len(set(keywords) & set(pattern_keywords))

                if keyword_overlap > 0 or confidence > 0.8:
                    recommendation = {
                        'pattern_id': pattern_id,
                        'type': pattern_type,
                        'confidence': confidence,
                        'description': description,
                        'recommendations': pattern_recommendations,
                        'relevance_score': keyword_overlap / max(len(keywords), 1) + confidence,
                        'context_match': keyword_overlap > 0
                    }
                    recommendations.append(recommendation)

            except json.JSONDecodeError:
                continue

        # Sort by relevance score
        recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)

        return recommendations[:5]  # Return top 5 recommendations

    def get_learning_metrics(self) -> LearningMetrics:
        """Get current learning system metrics"""
        try:
            # Get latest metrics from database
            latest_metrics = self.learning_conn.execute("""
                SELECT total_patterns, active_patterns, avg_confidence,
                       success_rate_improvement, memory_integration_score,
                       cross_project_transfers, analysis_date
                FROM learning_effectiveness
                ORDER BY analysis_date DESC
                LIMIT 1
            """).fetchone()

            if latest_metrics:
                return LearningMetrics(
                    total_patterns=latest_metrics[0],
                    active_patterns=latest_metrics[1],
                    avg_confidence=latest_metrics[2],
                    success_rate_improvement=latest_metrics[3],
                    memory_integration_score=latest_metrics[4],
                    cross_project_transfers=latest_metrics[5],
                    last_analysis=latest_metrics[6]
                )
            else:
                return LearningMetrics(0, 0, 0.0, 0.0, 0.0, 0, "Never")

        except Exception as e:
            self.logger.error(f"Failed to get learning metrics: {e}")
            return LearningMetrics(0, 0, 0.0, 0.0, 0.0, 0, "Error")

    def _extract_keywords_from_context(self, context: str) -> List[str]:
        """Extract keywords from context string"""
        import re
        words = re.findall(r'\b\w+\b', context.lower())
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        return [word for word in words if word not in stop_words and len(word) > 2]

    def _classify_intent(self, context: str) -> str:
        """Classify intent from context"""
        context_lower = context.lower()

        if any(word in context_lower for word in ['implement', 'create', 'build', 'develop']):
            return 'development'
        elif any(word in context_lower for word in ['error', 'bug', 'fix', 'debug']):
            return 'debugging'
        elif any(word in context_lower for word in ['how', 'what', 'why', 'when']):
            return 'inquiry'
        elif any(word in context_lower for word in ['run', 'execute', 'start', 'deploy']):
            return 'execution'
        else:
            return 'conversation'

    def _extract_pattern_keywords(self, context_data: Dict) -> List[str]:
        """Extract keywords from pattern context data"""
        keywords = []

        # Extract from various fields
        for field in ['success_factors', 'tool_name', 'error_type', 'workflow_steps']:
            value = context_data.get(field)
            if value:
                if isinstance(value, list):
                    keywords.extend([str(item).lower() for item in value])
                else:
                    keywords.append(str(value).lower())

        return keywords

    # Additional helper methods for pattern analysis...
    def _group_temporal_sequences(self, memory_contents: List[Dict]) -> List[List[Dict]]:
        """Group memories into temporal sequences"""
        # Sort by timestamp
        sorted_memories = sorted(memory_contents,
                               key=lambda x: x.get('last_accessed', ''))

        sequences = []
        current_sequence = []
        last_time = None

        for memory in sorted_memories:
            try:
                current_time = datetime.fromisoformat(memory['last_accessed'])
                if last_time and (current_time - last_time).total_seconds() > 3600:  # 1 hour gap
                    if len(current_sequence) >= 2:
                        sequences.append(current_sequence)
                    current_sequence = []

                current_sequence.append(memory)
                last_time = current_time

            except (ValueError, KeyError):
                continue

        if len(current_sequence) >= 2:
            sequences.append(current_sequence)

        return sequences

    def _extract_workflow_steps(self, sequence: List[Dict]) -> List[str]:
        """Extract workflow steps from sequence"""
        steps = []
        for memory in sequence:
            intent = memory['metadata'].get('intent_category', 'unknown')
            if memory['data'] and isinstance(memory['data'], dict):
                task = memory['data'].get('task', memory['data'].get('prompt', ''))[:50]
                steps.append(f"{intent}:{task}")
        return steps

    def _generate_workflow_signature(self, steps: List[str]) -> str:
        """Generate signature for workflow pattern"""
        step_types = [step.split(':')[0] for step in steps]
        return hashlib.md5('->'.join(step_types).encode()).hexdigest()

    def _find_similar_workflows(self, signature: str, all_sequences: List[List[Dict]]) -> List[List[Dict]]:
        """Find workflows with similar signatures"""
        similar = []
        for sequence in all_sequences:
            seq_steps = self._extract_workflow_steps(sequence)
            seq_signature = self._generate_workflow_signature(seq_steps)
            if seq_signature == signature:
                similar.append(sequence)
        return similar

    def _is_successful_workflow(self, workflow: List[Dict]) -> bool:
        """Check if workflow was successful"""
        if not workflow:
            return False
        # Check if last step indicates success
        last_memory = workflow[-1]
        return self._is_successful_outcome(last_memory['data'])

    def _calculate_avg_workflow_duration(self, workflows: List[List[Dict]]) -> float:
        """Calculate average workflow duration"""
        durations = []
        for workflow in workflows:
            if len(workflow) >= 2:
                try:
                    start_time = datetime.fromisoformat(workflow[0]['last_accessed'])
                    end_time = datetime.fromisoformat(workflow[-1]['last_accessed'])
                    duration = (end_time - start_time).total_seconds() / 60  # minutes
                    durations.append(duration)
                except (ValueError, KeyError):
                    continue
        return np.mean(durations) if durations else 0.0

    def _generate_workflow_recommendations(self, steps: List[str], successful_workflows: List[List[Dict]]) -> List[str]:
        """Generate workflow recommendations"""
        recommendations = []
        if len(steps) > 1:
            recommendations.append(f"Follow {len(steps)}-step workflow pattern")
        if successful_workflows:
            avg_duration = self._calculate_avg_workflow_duration(successful_workflows)
            if avg_duration > 0:
                recommendations.append(f"Expected duration: {avg_duration:.1f} minutes")
        return recommendations

    def _contains_error(self, data: Any) -> bool:
        """Check if memory data contains error information"""
        text = str(data).lower()
        error_indicators = ['error', 'exception', 'fail', 'traceback', 'stderr']
        return any(indicator in text for indicator in error_indicators)

    def _classify_error_type(self, data: Any) -> str:
        """Classify the type of error"""
        text = str(data).lower()

        if 'syntax' in text:
            return 'syntax_error'
        elif 'import' in text or 'module' in text:
            return 'import_error'
        elif 'permission' in text or 'access' in text:
            return 'permission_error'
        elif 'network' in text or 'connection' in text:
            return 'network_error'
        elif 'type' in text and 'error' in text:
            return 'type_error'
        else:
            return 'general_error'

    def _was_error_resolved(self, data: Any) -> bool:
        """Check if error was resolved"""
        if isinstance(data, dict):
            # Look for resolution indicators
            for field in ['resolution', 'solution', 'fix', 'resolved']:
                if field in data:
                    return True
            # Check if later there's a success indicator
            if any(field in data for field in ['success', 'complete', 'working']):
                return True
        return False

    def _extract_resolution_methods(self, resolved_memories: List[Dict]) -> List[str]:
        """Extract methods used to resolve errors"""
        methods = []
        for memory in resolved_memories:
            data = memory['data']
            if isinstance(data, dict):
                for field in ['resolution', 'solution', 'fix', 'method']:
                    if field in data:
                        methods.append(str(data[field])[:100])
        return list(set(methods))  # Remove duplicates

    def _generate_error_resolution_recommendations(self, error_type: str, methods: List[str]) -> List[str]:
        """Generate error resolution recommendations"""
        recommendations = []
        if methods:
            recommendations.append(f"Proven solutions for {error_type}:")
            recommendations.extend(methods[:3])  # Top 3 methods
        else:
            recommendations.append(f"Research common solutions for {error_type}")
        return recommendations

    def _find_optimal_tool_contexts(self, tool: str, tool_memories: List[Dict]) -> List[str]:
        """Find contexts where tool works optimally"""
        successful_contexts = []
        for memory in tool_memories:
            if self._is_successful_outcome(memory['data']):
                intent = memory['metadata'].get('intent_category', 'unknown')
                successful_contexts.append(intent)

        # Return most common successful contexts
        context_counts = Counter(successful_contexts)
        return [context for context, count in context_counts.most_common(3)]

    def _generate_tool_recommendations(self, tool: str, contexts: List[str]) -> List[str]:
        """Generate tool usage recommendations"""
        recommendations = []
        if contexts:
            recommendations.append(f"Use {tool} for: {', '.join(contexts)}")
        recommendations.append(f"Tool {tool} shows good effectiveness")
        return recommendations

    async def store_success_pattern(self, agent_name: str, pattern_data: Dict) -> bool:
        """Store a success pattern for learning"""
        try:
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO agent_patterns (agent_name, pattern_type, pattern_data, confidence, identified_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                agent_name,
                pattern_data.get("task_type", "general"),
                json.dumps(pattern_data),
                0.8,  # Default high confidence for success patterns
                datetime.now()
            ))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            logger.error(f"Error storing success pattern: {e}")
            return False

    async def store_failure_pattern(self, agent_name: str, failure_data: Dict) -> bool:
        """Store a failure pattern for learning"""
        try:
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO agent_mistakes (agent_name, mistake_type, mistake_data, impact_level, identified_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                agent_name,
                failure_data.get("task_type", "general"),
                json.dumps(failure_data),
                "medium",
                datetime.now()
            ))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            logger.error(f"Error storing failure pattern: {e}")
            return False


# CLI Interface
async def main():
    """Test the learning bridge"""
    memory_manager = EnhancedMemoryManager()
    learning_bridge = LearningBridge(memory_manager)

    print("Testing Learning Bridge...")

    # Analyze patterns
    patterns = await learning_bridge.analyze_memory_patterns(time_window_hours=168)
    print(f"\nDiscovered {len(patterns)} patterns:")

    for pattern in patterns[:5]:  # Show first 5
        print(f"\nPattern: {pattern.pattern_id}")
        print(f"Type: {pattern.pattern_type.value}")
        print(f"Confidence: {pattern.confidence:.3f}")
        print(f"Description: {pattern.description}")
        print(f"Recommendations: {pattern.recommendations}")

    # Get learning metrics
    metrics = learning_bridge.get_learning_metrics()
    print(f"\nLearning Metrics:")
    print(f"Total Patterns: {metrics.total_patterns}")
    print(f"Active Patterns: {metrics.active_patterns}")
    print(f"Average Confidence: {metrics.avg_confidence:.3f}")
    print(f"Memory Integration Score: {metrics.memory_integration_score:.3f}")

    # Test recommendations
    test_context = "How do I implement a memory system with good performance?"
    recommendations = await learning_bridge.get_learning_recommendations(test_context)

    print(f"\nRecommendations for: '{test_context}'")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec['description']} (confidence: {rec['confidence']:.3f})")
        for suggestion in rec['recommendations']:
            print(f"   - {suggestion}")


if __name__ == "__main__":
    asyncio.run(main())