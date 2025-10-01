#!/usr/bin/env python3
"""
Agent-Memory Integration Bridge
Connects Claude Code agents with the enhanced memory system
Enables agents to store and retrieve context across sessions
"""

import asyncio
import json
import sqlite3
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

# Import memory system components
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType
from context_retrieval_service import ContextRetrievalService, ContextQuery, RetrievalStrategy
from learning_bridge import LearningBridge

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class AgentExecution:
    """Represents an agent execution with memory context"""
    agent_name: str
    task_description: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    success_score: float = 0.0
    execution_time_ms: int = 0
    memory_context: Optional[List[Dict]] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class AgentMemoryBridge:
    """Bridge between Claude Code agents and enhanced memory system"""

    def __init__(self, memory_config_path: str = "production_config.json",
                 learning_db_path: str = r"D:\databases\database.db"):
        self.memory_manager = EnhancedMemoryManager(memory_config_path)
        self.context_service = ContextRetrievalService(self.memory_manager)
        self.learning_bridge = LearningBridge(self.memory_manager)
        self.learning_db_path = learning_db_path

        # Agent performance tracking
        self.agent_stats = {}

        logger.info("Agent-Memory Bridge initialized")

    async def prepare_agent_context(self, agent_name: str, task: str,
                                  task_metadata: Dict = None) -> Dict[str, Any]:
        """
        Prepare context for agent execution by querying memory system
        Returns relevant memory context and recommendations
        """
        try:
            # Extract keywords from task
            keywords = self._extract_keywords(task)

            # Query memory for relevant context
            query = ContextQuery(
                keywords=keywords,
                intent_category=self._determine_intent_category(task),
                priority_level="high" if task_metadata and task_metadata.get("priority") == "high" else "normal",
                max_results=10,
                strategy=RetrievalStrategy.HYBRID_SCORING
            )

            memory_results = await self.context_service.query_context(query)

            # Get learning recommendations
            learning_recs = await self.learning_bridge.get_learning_recommendations(task)

            # Query agent execution history
            agent_history = await self._get_agent_history(agent_name, limit=5)

            # Build comprehensive context
            context = {
                "agent_name": agent_name,
                "task": task,
                "timestamp": datetime.now().isoformat(),
                "memory_context": [
                    {
                        "key": result.key,
                        "relevance": result.relevance_score,
                        "data": result.data,
                        "memory_type": result.memory_type.value
                    }
                    for result in memory_results
                ],
                "learning_recommendations": learning_recs,
                "agent_history": agent_history,
                "success_patterns": await self._identify_success_patterns(agent_name, keywords)
            }

            # Store context preparation for future analysis
            await self._store_context_preparation(agent_name, task, context)

            logger.info(f"Prepared context for {agent_name}: {len(memory_results)} memories, {len(learning_recs)} recommendations")
            return context

        except Exception as e:
            logger.error(f"Error preparing agent context: {e}")
            return {"error": str(e), "agent_name": agent_name, "task": task}

    async def store_agent_execution(self, execution: AgentExecution) -> Dict[str, Any]:
        """
        Store agent execution results in memory system with proper categorization
        """
        try:
            # Determine memory type based on execution characteristics
            memory_type = self._determine_memory_type(execution)

            # Prepare execution data for storage
            execution_data = {
                "agent_name": execution.agent_name,
                "task_description": execution.task_description,
                "input_data": execution.input_data,
                "output_data": execution.output_data,
                "success_score": execution.success_score,
                "execution_time_ms": execution.execution_time_ms,
                "timestamp": execution.timestamp.isoformat(),
                "memory_context_used": len(execution.memory_context) if execution.memory_context else 0
            }

            # Create memory key
            memory_key = f"agent_exec_{execution.agent_name}_{execution.timestamp.strftime('%Y%m%d_%H%M%S')}"

            # Prepare metadata
            metadata = {
                "agent_name": execution.agent_name,
                "execution_type": "agent_task",
                "success_score": execution.success_score,
                "execution_time_ms": execution.execution_time_ms,
                "keywords": self._extract_keywords(execution.task_description),
                "intent_category": self._determine_intent_category(execution.task_description)
            }

            # Store in memory system
            result = await self.memory_manager.store_memory(
                memory_key, execution_data, memory_type, metadata
            )

            # Update agent statistics
            await self._update_agent_stats(execution)

            # Store in learning database for pattern analysis
            await self._store_in_learning_db(execution)

            # Analyze for patterns
            if execution.success_score > 0.8:
                await self._analyze_success_pattern(execution)
            elif execution.success_score < 0.5:
                await self._analyze_failure_pattern(execution)

            logger.info(f"Stored agent execution: {memory_key} (success: {execution.success_score:.2f})")
            return result

        except Exception as e:
            logger.error(f"Error storing agent execution: {e}")
            return {"success": False, "error": str(e)}

    async def get_agent_recommendations(self, current_context: str) -> List[Dict[str, Any]]:
        """
        Get recommendations for which agents should be activated based on current context
        """
        try:
            # Query memory for similar contexts
            keywords = self._extract_keywords(current_context)
            query = ContextQuery(
                keywords=keywords,
                intent_category=self._determine_intent_category(current_context),
                priority_level="normal",
                strategy=RetrievalStrategy.HYBRID_SCORING,
                max_results=20
            )

            similar_contexts = await self.context_service.query_context(query)

            # Analyze successful agent patterns
            agent_recommendations = {}

            for context in similar_contexts:
                if context.data.get("agent_name") and context.data.get("success_score", 0) > 0.7:
                    agent_name = context.data["agent_name"]
                    if agent_name not in agent_recommendations:
                        agent_recommendations[agent_name] = {
                            "agent_name": agent_name,
                            "confidence": 0.0,
                            "success_rate": 0.0,
                            "relevant_executions": 0,
                            "reasons": []
                        }

                    agent_recommendations[agent_name]["confidence"] += context.combined_score
                    agent_recommendations[agent_name]["relevant_executions"] += 1
                    agent_recommendations[agent_name]["reasons"].append(
                        f"Successful with similar task: {context.data.get('task_description', 'Unknown')[:50]}..."
                    )

            # Get learning bridge recommendations
            learning_recs = await self.learning_bridge.get_learning_recommendations(current_context)

            # Combine recommendations
            final_recommendations = []
            for agent_data in agent_recommendations.values():
                if agent_data["relevant_executions"] > 0:
                    agent_data["confidence"] = agent_data["confidence"] / agent_data["relevant_executions"]
                    final_recommendations.append(agent_data)

            # Sort by confidence
            final_recommendations.sort(key=lambda x: x["confidence"], reverse=True)

            return final_recommendations[:5]  # Top 5 recommendations

        except Exception as e:
            logger.error(f"Error getting agent recommendations: {e}")
            return []

    async def get_cross_project_insights(self, project_context: str) -> Dict[str, Any]:
        """
        Get insights from similar projects and successful patterns
        """
        try:
            # Query for similar project contexts
            keywords = self._extract_keywords(project_context) + ["project", "implementation", "development"]

            query = ContextQuery(
                keywords=keywords,
                strategy=RetrievalStrategy.ATTENTION_WEIGHTED,
                max_results=30
            )

            project_memories = await self.context_service.query_context(query)

            # Analyze patterns across projects
            patterns = await self.learning_bridge.analyze_memory_patterns(time_window_hours=168*4)  # 4 weeks

            insights = {
                "similar_projects": len(project_memories),
                "success_patterns": [p for p in patterns if p.confidence > 0.7],
                "common_tools": self._extract_common_tools(project_memories),
                "best_practices": self._extract_best_practices(project_memories),
                "potential_pitfalls": self._extract_pitfalls(project_memories)
            }

            return insights

        except Exception as e:
            logger.error(f"Error getting cross-project insights: {e}")
            return {}

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        import re

        # Common development keywords
        dev_keywords = [
            "implement", "create", "build", "develop", "write", "add", "modify",
            "update", "fix", "debug", "optimize", "refactor", "test", "deploy",
            "api", "database", "frontend", "backend", "ui", "ux", "performance",
            "security", "authentication", "authorization", "validation", "error"
        ]

        text_lower = text.lower()
        keywords = []

        # Extract development keywords
        for keyword in dev_keywords:
            if re.search(r'\b' + keyword + r'\b', text_lower):
                keywords.append(keyword)

        # Extract file extensions and tech terms
        tech_patterns = [
            r'\.js\b', r'\.py\b', r'\.ts\b', r'\.json\b', r'\.yaml\b', r'\.yml\b',
            r'\breact\b', r'\bvue\b', r'\bangular\b', r'\bnode\b', r'\bpython\b',
            r'\bdocker\b', r'\bkubernetes\b', r'\baws\b', r'\bazure\b', r'\bgcp\b'
        ]

        for pattern in tech_patterns:
            matches = re.findall(pattern, text_lower)
            keywords.extend(matches)

        return list(set(keywords))  # Remove duplicates

    def _determine_intent_category(self, text: str) -> str:
        """Determine the intent category of the text"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['error', 'bug', 'fix', 'debug', 'issue']):
            return 'debugging'
        elif any(word in text_lower for word in ['implement', 'create', 'build', 'develop']):
            return 'development'
        elif any(word in text_lower for word in ['test', 'validate', 'verify']):
            return 'testing'
        elif any(word in text_lower for word in ['deploy', 'release', 'production']):
            return 'deployment'
        elif any(word in text_lower for word in ['optimize', 'performance', 'speed']):
            return 'optimization'
        else:
            return 'general'

    def _determine_memory_type(self, execution: AgentExecution) -> MemoryType:
        """Determine appropriate memory type for agent execution"""
        if execution.success_score > 0.8:
            # High success - store as procedural knowledge
            return MemoryType.PROCEDURAL
        elif execution.execution_time_ms < 5000:  # Quick tasks
            return MemoryType.SHORT_TERM
        elif "implement" in execution.task_description.lower() or "create" in execution.task_description.lower():
            return MemoryType.SEMANTIC
        else:
            return MemoryType.EPISODIC

    async def _get_agent_history(self, agent_name: str, limit: int = 5) -> List[Dict]:
        """Get recent execution history for an agent"""
        try:
            conn = sqlite3.connect(self.learning_db_path)
            cursor = conn.cursor()

            cursor.execute("""
                SELECT task, success_score, executed_at, execution_time_ms
                FROM agent_executions
                WHERE agent_name = ?
                ORDER BY executed_at DESC
                LIMIT ?
            """, (agent_name, limit))

            history = []
            for row in cursor.fetchall():
                history.append({
                    "task": row[0],
                    "success_score": row[1],
                    "executed_at": row[2],
                    "execution_time_ms": row[3]
                })

            conn.close()
            return history

        except Exception as e:
            logger.error(f"Error getting agent history: {e}")
            return []

    async def _identify_success_patterns(self, agent_name: str, keywords: List[str]) -> List[Dict]:
        """Identify successful patterns for agent and keywords"""
        try:
            # Query memory for successful executions with similar keywords
            successful_memories = []

            for keyword in keywords:
                query = ContextQuery(
                    keywords=[keyword],
                    intent_category="general",
                    priority_level="normal",
                    strategy=RetrievalStrategy.HYBRID_SCORING,
                    max_results=5
                )

                results = await self.context_service.query_context(query)
                for result in results:
                    if (result.data.get("agent_name") == agent_name and
                        result.data.get("success_score", 0) > 0.8):
                        successful_memories.append(result)

            # Extract patterns
            patterns = []
            for memory in successful_memories:
                patterns.append({
                    "task": memory.data.get("task_description", ""),
                    "success_score": memory.data.get("success_score", 0),
                    "approach": memory.data.get("output_data", {}).get("approach", ""),
                    "tools_used": memory.data.get("output_data", {}).get("tools_used", [])
                })

            return patterns

        except Exception as e:
            logger.error(f"Error identifying success patterns: {e}")
            return []

    async def _store_context_preparation(self, agent_name: str, task: str, context: Dict):
        """Store context preparation for analysis"""
        try:
            memory_key = f"context_prep_{agent_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            prep_data = {
                "agent_name": agent_name,
                "task": task,
                "context_size": len(context.get("memory_context", [])),
                "recommendations_count": len(context.get("learning_recommendations", [])),
                "history_items": len(context.get("agent_history", [])),
                "timestamp": datetime.now().isoformat()
            }

            metadata = {
                "type": "context_preparation",
                "agent_name": agent_name
            }

            await self.memory_manager.store_memory(
                memory_key, prep_data, MemoryType.SHORT_TERM, metadata
            )

        except Exception as e:
            logger.error(f"Error storing context preparation: {e}")

    async def _update_agent_stats(self, execution: AgentExecution):
        """Update agent performance statistics"""
        agent_name = execution.agent_name

        if agent_name not in self.agent_stats:
            self.agent_stats[agent_name] = {
                "total_executions": 0,
                "total_success_score": 0.0,
                "avg_execution_time": 0.0,
                "last_execution": None
            }

        stats = self.agent_stats[agent_name]
        stats["total_executions"] += 1
        stats["total_success_score"] += execution.success_score
        stats["avg_execution_time"] = (
            (stats["avg_execution_time"] * (stats["total_executions"] - 1) +
             execution.execution_time_ms) / stats["total_executions"]
        )
        stats["last_execution"] = execution.timestamp.isoformat()

    async def _store_in_learning_db(self, execution: AgentExecution):
        """Store execution in learning database"""
        try:
            conn = sqlite3.connect(self.learning_db_path)
            cursor = conn.cursor()

            # Store in agent_executions table
            cursor.execute("""
                INSERT INTO agent_executions
                (agent_name, task, input_data, output_data, success_score,
                 execution_time_ms, executed_at, memory_context_size)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                execution.agent_name,
                execution.task_description,
                json.dumps(execution.input_data),
                json.dumps(execution.output_data) if execution.output_data else None,
                execution.success_score,
                execution.execution_time_ms,
                execution.timestamp,
                len(execution.memory_context) if execution.memory_context else 0
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            logger.error(f"Error storing in learning DB: {e}")

    async def _analyze_success_pattern(self, execution: AgentExecution):
        """Analyze successful execution for patterns"""
        try:
            # Store success pattern in learning bridge
            pattern_data = {
                "agent_name": execution.agent_name,
                "task_type": self._determine_intent_category(execution.task_description),
                "success_factors": execution.output_data.get("success_factors", []) if execution.output_data else [],
                "tools_used": execution.output_data.get("tools_used", []) if execution.output_data else [],
                "execution_time": execution.execution_time_ms,
                "memory_context_used": len(execution.memory_context) if execution.memory_context else 0
            }

            await self.learning_bridge.store_success_pattern(execution.agent_name, pattern_data)

        except Exception as e:
            logger.error(f"Error analyzing success pattern: {e}")

    async def _analyze_failure_pattern(self, execution: AgentExecution):
        """Analyze failed execution for learning"""
        try:
            # Store failure pattern for learning
            failure_data = {
                "agent_name": execution.agent_name,
                "task_type": self._determine_intent_category(execution.task_description),
                "failure_reasons": execution.output_data.get("errors", []) if execution.output_data else [],
                "attempted_approach": execution.output_data.get("approach", "") if execution.output_data else "",
                "execution_time": execution.execution_time_ms
            }

            await self.learning_bridge.store_failure_pattern(execution.agent_name, failure_data)

        except Exception as e:
            logger.error(f"Error analyzing failure pattern: {e}")

    def _extract_common_tools(self, memories: List) -> List[str]:
        """Extract commonly used tools from memory results"""
        tool_counts = {}

        for memory in memories:
            tools = memory.data.get("output_data", {}).get("tools_used", [])
            for tool in tools:
                tool_counts[tool] = tool_counts.get(tool, 0) + 1

        # Return most common tools
        return sorted(tool_counts.keys(), key=tool_counts.get, reverse=True)[:10]

    def _extract_best_practices(self, memories: List) -> List[str]:
        """Extract best practices from successful memories"""
        practices = []

        for memory in memories:
            if memory.data.get("success_score", 0) > 0.8:
                success_factors = memory.data.get("output_data", {}).get("success_factors", [])
                practices.extend(success_factors)

        # Count and return most common practices
        practice_counts = {}
        for practice in practices:
            practice_counts[practice] = practice_counts.get(practice, 0) + 1

        return sorted(practice_counts.keys(), key=practice_counts.get, reverse=True)[:5]

    def _extract_pitfalls(self, memories: List) -> List[str]:
        """Extract common pitfalls from failed memories"""
        pitfalls = []

        for memory in memories:
            if memory.data.get("success_score", 1) < 0.5:
                errors = memory.data.get("output_data", {}).get("errors", [])
                pitfalls.extend(errors)

        # Count and return most common pitfalls
        pitfall_counts = {}
        for pitfall in pitfalls:
            pitfall_counts[pitfall] = pitfall_counts.get(pitfall, 0) + 1

        return sorted(pitfall_counts.keys(), key=pitfall_counts.get, reverse=True)[:5]

    def get_performance_report(self) -> Dict[str, Any]:
        """Get performance report for all agents"""
        report = {
            "total_agents": len(self.agent_stats),
            "agents": {}
        }

        for agent_name, stats in self.agent_stats.items():
            avg_success = stats["total_success_score"] / stats["total_executions"] if stats["total_executions"] > 0 else 0
            report["agents"][agent_name] = {
                "total_executions": stats["total_executions"],
                "average_success_score": avg_success,
                "average_execution_time_ms": stats["avg_execution_time"],
                "last_execution": stats["last_execution"]
            }

        return report


async def main():
    """Test the agent-memory bridge"""
    bridge = AgentMemoryBridge()

    print("Agent-Memory Bridge Test")
    print("=" * 50)

    # Test context preparation
    context = await bridge.prepare_agent_context(
        "general-purpose",
        "Implement a new React component for user authentication"
    )

    print(f"Context prepared: {len(context.get('memory_context', []))} memories found")

    # Test agent execution storage
    execution = AgentExecution(
        agent_name="general-purpose",
        task_description="Implement React authentication component",
        input_data={"component_type": "authentication", "framework": "react"},
        output_data={"success": True, "tools_used": ["react", "typescript", "hooks"]},
        success_score=0.9,
        execution_time_ms=15000
    )

    result = await bridge.store_agent_execution(execution)
    print(f"Execution stored: {result.get('success', False)}")

    # Test recommendations
    recommendations = await bridge.get_agent_recommendations("Fix authentication bug in React app")
    print(f"Agent recommendations: {len(recommendations)} found")
    for rec in recommendations:
        print(f"  - {rec['agent_name']}: {rec['confidence']:.3f}")

if __name__ == "__main__":
    asyncio.run(main())