#!/usr/bin/env python3
"""
Unified Context Service
Provides a single interface for all context operations across memory, learning, and agent systems
Enables seamless integration and data flow between all components
"""

import asyncio
import json
import sqlite3
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

# Import system components
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType
from context_retrieval_service import ContextRetrievalService, ContextQuery, RetrievalStrategy
from learning_bridge import LearningBridge
from agent_memory_bridge import AgentMemoryBridge, AgentExecution

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContextType(Enum):
    """Types of context that can be requested"""
    MEMORY_ONLY = "memory_only"
    LEARNING_ONLY = "learning_only"
    AGENT_ONLY = "agent_only"
    UNIFIED = "unified"
    CROSS_PROJECT = "cross_project"
    PERFORMANCE = "performance"

@dataclass
class UnifiedQuery:
    """Unified query structure for all context types"""
    query_text: str
    context_type: ContextType = ContextType.UNIFIED
    keywords: List[str] = None
    intent_category: str = "general"
    priority_level: str = "normal"
    time_window_hours: int = 168  # 1 week default
    max_results: int = 10
    include_agent_context: bool = True
    include_learning_patterns: bool = True
    include_cross_project: bool = False
    agent_name: Optional[str] = None
    project_context: Optional[str] = None

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = self._extract_keywords(self.query_text)

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from query text"""
        import re

        # Basic keyword extraction
        words = re.findall(r'\b\w+\b', text.lower())

        # Filter out common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]

        return keywords[:10]  # Limit to 10 keywords

@dataclass
class UnifiedContext:
    """Complete context response combining all systems"""
    query: UnifiedQuery
    memory_results: List[Dict] = None
    learning_patterns: List[Dict] = None
    agent_recommendations: List[Dict] = None
    cross_project_insights: Dict = None
    performance_metrics: Dict = None
    synthesis: Dict = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class UnifiedContextService:
    """
    Unified Context Service
    Single point of access for all context operations across systems
    """

    def __init__(self, memory_config_path: str = "production_config.json",
                 learning_db_path: str = r"D:\databases\database.db"):

        # Initialize all system components
        self.memory_manager = EnhancedMemoryManager(memory_config_path)
        self.context_service = ContextRetrievalService(self.memory_manager)
        self.learning_bridge = LearningBridge(self.memory_manager)
        self.agent_bridge = AgentMemoryBridge(memory_config_path, learning_db_path)

        # System state
        self.learning_db_path = learning_db_path
        self.last_sync_time = datetime.now()

        logger.info("Unified Context Service initialized with all subsystems")

    async def query_unified_context(self, query: UnifiedQuery) -> UnifiedContext:
        """
        Main entry point for unified context queries
        Returns comprehensive context from all relevant systems
        """
        try:
            logger.info(f"Processing unified query: {query.query_text}")

            context = UnifiedContext(query=query)

            # Run queries in parallel for performance
            tasks = []

            if query.context_type in [ContextType.MEMORY_ONLY, ContextType.UNIFIED]:
                tasks.append(self._get_memory_context(query))

            if query.context_type in [ContextType.LEARNING_ONLY, ContextType.UNIFIED]:
                tasks.append(self._get_learning_context(query))

            if query.context_type in [ContextType.AGENT_ONLY, ContextType.UNIFIED] and query.include_agent_context:
                tasks.append(self._get_agent_context(query))

            if query.context_type in [ContextType.CROSS_PROJECT, ContextType.UNIFIED] and query.include_cross_project:
                tasks.append(self._get_cross_project_context(query))

            if query.context_type in [ContextType.PERFORMANCE, ContextType.UNIFIED]:
                tasks.append(self._get_performance_context(query))

            # Execute all queries concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            result_index = 0

            if query.context_type in [ContextType.MEMORY_ONLY, ContextType.UNIFIED]:
                context.memory_results = results[result_index] if not isinstance(results[result_index], Exception) else []
                result_index += 1

            if query.context_type in [ContextType.LEARNING_ONLY, ContextType.UNIFIED]:
                context.learning_patterns = results[result_index] if not isinstance(results[result_index], Exception) else []
                result_index += 1

            if query.context_type in [ContextType.AGENT_ONLY, ContextType.UNIFIED] and query.include_agent_context:
                context.agent_recommendations = results[result_index] if not isinstance(results[result_index], Exception) else []
                result_index += 1

            if query.context_type in [ContextType.CROSS_PROJECT, ContextType.UNIFIED] and query.include_cross_project:
                context.cross_project_insights = results[result_index] if not isinstance(results[result_index], Exception) else {}
                result_index += 1

            if query.context_type in [ContextType.PERFORMANCE, ContextType.UNIFIED]:
                context.performance_metrics = results[result_index] if not isinstance(results[result_index], Exception) else {}

            # Synthesize unified response
            context.synthesis = await self._synthesize_context(context)

            logger.info(f"Unified context generated: {len(context.memory_results or [])} memories, "
                       f"{len(context.learning_patterns or [])} patterns, "
                       f"{len(context.agent_recommendations or [])} agent recs")

            return context

        except Exception as e:
            logger.error(f"Error in unified context query: {e}")
            return UnifiedContext(query=query, synthesis={"error": str(e)})

    async def _get_memory_context(self, query: UnifiedQuery) -> List[Dict]:
        """Get memory context using the context retrieval service"""
        try:
            memory_query = ContextQuery(
                keywords=query.keywords,
                intent_category=query.intent_category,
                priority_level=query.priority_level,
                max_results=query.max_results,
                strategy=RetrievalStrategy.HYBRID_SCORING
            )

            results = await self.context_service.query_context(memory_query)

            return [
                {
                    "key": result.key,
                    "data": result.data,
                    "memory_type": result.memory_type.value,
                    "relevance_score": result.relevance_score,
                    "combined_score": result.combined_score,
                    "timestamp": result.timestamp,
                    "source": "memory_system"
                }
                for result in results
            ]

        except Exception as e:
            logger.error(f"Error getting memory context: {e}")
            return []

    async def _get_learning_context(self, query: UnifiedQuery) -> List[Dict]:
        """Get learning patterns and recommendations"""
        try:
            # Get learning patterns
            patterns = await self.learning_bridge.analyze_memory_patterns(
                time_window_hours=query.time_window_hours
            )

            # Get specific recommendations
            recommendations = await self.learning_bridge.get_learning_recommendations(
                query.query_text
            )

            return [
                {
                    "type": "pattern",
                    "pattern_type": pattern.pattern_type.value,
                    "description": pattern.description,
                    "confidence": pattern.confidence,
                    "frequency": pattern.frequency,
                    "recommendations": pattern.recommendations,
                    "source": "learning_system"
                }
                for pattern in patterns
            ] + [
                {
                    "type": "recommendation",
                    "description": rec.get("description", ""),
                    "confidence": rec.get("confidence", 0),
                    "recommendations": rec.get("recommendations", []),
                    "source": "learning_system"
                }
                for rec in recommendations
            ]

        except Exception as e:
            logger.error(f"Error getting learning context: {e}")
            return []

    async def _get_agent_context(self, query: UnifiedQuery) -> List[Dict]:
        """Get agent recommendations and execution history"""
        try:
            # Get agent recommendations
            recommendations = await self.agent_bridge.get_agent_recommendations(query.query_text)

            # If specific agent requested, get its history
            agent_history = []
            if query.agent_name:
                agent_history = await self.agent_bridge._get_agent_history(query.agent_name, limit=5)

            return [
                {
                    "type": "agent_recommendation",
                    "agent_name": rec.get("agent_name"),
                    "confidence": rec.get("confidence", 0),
                    "success_rate": rec.get("success_rate", 0),
                    "relevant_executions": rec.get("relevant_executions", 0),
                    "reasons": rec.get("reasons", []),
                    "source": "agent_system"
                }
                for rec in recommendations
            ] + [
                {
                    "type": "agent_history",
                    "agent_name": query.agent_name,
                    "task": item.get("task", ""),
                    "success_score": item.get("success_score", 0),
                    "executed_at": item.get("executed_at", ""),
                    "source": "agent_system"
                }
                for item in agent_history
            ]

        except Exception as e:
            logger.error(f"Error getting agent context: {e}")
            return []

    async def _get_cross_project_context(self, query: UnifiedQuery) -> Dict:
        """Get cross-project insights"""
        try:
            insights = await self.agent_bridge.get_cross_project_insights(
                query.project_context or query.query_text
            )

            insights["source"] = "cross_project_analysis"
            return insights

        except Exception as e:
            logger.error(f"Error getting cross-project context: {e}")
            return {}

    async def _get_performance_context(self, query: UnifiedQuery) -> Dict:
        """Get performance metrics from all systems"""
        try:
            memory_performance = self.memory_manager.get_performance_report()
            agent_performance = self.agent_bridge.get_performance_report()
            learning_metrics = self.learning_bridge.get_learning_metrics()

            return {
                "memory_system": memory_performance,
                "agent_system": agent_performance,
                "learning_system": {
                    "total_patterns": learning_metrics.total_patterns,
                    "active_patterns": learning_metrics.active_patterns,
                    "avg_confidence": learning_metrics.avg_confidence,
                    "memory_integration_score": learning_metrics.memory_integration_score
                },
                "source": "performance_monitoring"
            }

        except Exception as e:
            logger.error(f"Error getting performance context: {e}")
            return {}

    async def _synthesize_context(self, context: UnifiedContext) -> Dict:
        """Synthesize unified context into actionable insights"""
        try:
            synthesis = {
                "summary": self._generate_summary(context),
                "key_insights": self._extract_key_insights(context),
                "recommended_actions": self._generate_recommendations(context),
                "confidence_score": self._calculate_confidence(context),
                "context_completeness": self._assess_completeness(context)
            }

            return synthesis

        except Exception as e:
            logger.error(f"Error synthesizing context: {e}")
            return {"error": f"Synthesis failed: {e}"}

    def _generate_summary(self, context: UnifiedContext) -> str:
        """Generate a summary of the unified context"""
        memory_count = len(context.memory_results or [])
        learning_count = len(context.learning_patterns or [])
        agent_count = len(context.agent_recommendations or [])

        summary = f"Found {memory_count} relevant memories, {learning_count} learning patterns, "
        summary += f"and {agent_count} agent recommendations for query: '{context.query.query_text}'"

        return summary

    def _extract_key_insights(self, context: UnifiedContext) -> List[str]:
        """Extract key insights from all context sources"""
        insights = []

        # From memory results
        if context.memory_results:
            high_relevance = [r for r in context.memory_results if r.get("combined_score", 0) > 0.8]
            if high_relevance:
                insights.append(f"Found {len(high_relevance)} highly relevant memories")

        # From learning patterns
        if context.learning_patterns:
            high_confidence = [p for p in context.learning_patterns if p.get("confidence", 0) > 0.7]
            if high_confidence:
                insights.append(f"Identified {len(high_confidence)} high-confidence patterns")

        # From agent recommendations
        if context.agent_recommendations:
            top_agents = [a for a in context.agent_recommendations if a.get("confidence", 0) > 0.6]
            if top_agents:
                agent_names = [a.get("agent_name") for a in top_agents]
                insights.append(f"Recommended agents: {', '.join(agent_names[:3])}")

        return insights

    def _generate_recommendations(self, context: UnifiedContext) -> List[str]:
        """Generate actionable recommendations based on context"""
        recommendations = []

        # Memory-based recommendations
        if context.memory_results:
            procedural_memories = [r for r in context.memory_results if r.get("memory_type") == "procedural"]
            if procedural_memories:
                recommendations.append("Review procedural knowledge for implementation guidance")

        # Learning-based recommendations
        if context.learning_patterns:
            patterns_with_recs = [p for p in context.learning_patterns if p.get("recommendations")]
            if patterns_with_recs:
                recommendations.append("Apply identified success patterns from learning analysis")

        # Agent-based recommendations
        if context.agent_recommendations:
            top_agent = max(context.agent_recommendations, key=lambda x: x.get("confidence", 0), default=None)
            if top_agent and top_agent.get("confidence", 0) > 0.5:
                recommendations.append(f"Consider using {top_agent.get('agent_name')} agent for this task")

        return recommendations

    def _calculate_confidence(self, context: UnifiedContext) -> float:
        """Calculate overall confidence score for the context"""
        scores = []

        # Memory confidence
        if context.memory_results:
            memory_scores = [r.get("combined_score", 0) for r in context.memory_results]
            if memory_scores:
                scores.append(sum(memory_scores) / len(memory_scores))

        # Learning confidence
        if context.learning_patterns:
            learning_scores = [p.get("confidence", 0) for p in context.learning_patterns]
            if learning_scores:
                scores.append(sum(learning_scores) / len(learning_scores))

        # Agent confidence
        if context.agent_recommendations:
            agent_scores = [a.get("confidence", 0) for a in context.agent_recommendations]
            if agent_scores:
                scores.append(sum(agent_scores) / len(agent_scores))

        return sum(scores) / len(scores) if scores else 0.0

    def _assess_completeness(self, context: UnifiedContext) -> Dict[str, bool]:
        """Assess the completeness of the context"""
        return {
            "has_memory_context": bool(context.memory_results),
            "has_learning_patterns": bool(context.learning_patterns),
            "has_agent_recommendations": bool(context.agent_recommendations),
            "has_cross_project_insights": bool(context.cross_project_insights),
            "has_performance_metrics": bool(context.performance_metrics)
        }

    async def store_unified_execution(self, agent_name: str, task: str,
                                    execution_result: Dict, context_used: UnifiedContext) -> bool:
        """Store execution results with full context for future learning"""
        try:
            # Create execution record
            execution = AgentExecution(
                agent_name=agent_name,
                task_description=task,
                input_data={
                    "query": context_used.query.query_text,
                    "context_type": context_used.query.context_type.value,
                    "memory_context_size": len(context_used.memory_results or []),
                    "learning_patterns_used": len(context_used.learning_patterns or [])
                },
                output_data=execution_result,
                success_score=execution_result.get("success_score", 0.5),
                execution_time_ms=execution_result.get("execution_time_ms", 0),
                memory_context=context_used.memory_results
            )

            # Store in agent bridge
            result = await self.agent_bridge.store_agent_execution(execution)

            # Also store context effectiveness for learning
            await self._store_context_effectiveness(context_used, execution_result)

            return result.get("success", False)

        except Exception as e:
            logger.error(f"Error storing unified execution: {e}")
            return False

    async def _store_context_effectiveness(self, context: UnifiedContext, result: Dict):
        """Store how effective the context was for learning"""
        try:
            effectiveness_data = {
                "query": context.query.query_text,
                "context_completeness": context.synthesis.get("context_completeness", {}),
                "confidence_score": context.synthesis.get("confidence_score", 0),
                "success_score": result.get("success_score", 0),
                "memory_items_used": len(context.memory_results or []),
                "learning_patterns_used": len(context.learning_patterns or []),
                "agent_recommendations_used": len(context.agent_recommendations or [])
            }

            # Store as semantic memory for future context optimization
            await self.memory_manager.store_memory(
                f"context_effectiveness_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                effectiveness_data,
                MemoryType.SEMANTIC,
                {
                    "type": "context_effectiveness",
                    "success_score": result.get("success_score", 0),
                    "context_type": context.query.context_type.value
                }
            )

        except Exception as e:
            logger.error(f"Error storing context effectiveness: {e}")

    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive status of all integrated systems"""
        try:
            memory_report = self.memory_manager.get_performance_report()
            agent_report = self.agent_bridge.get_performance_report()
            learning_metrics = self.learning_bridge.get_learning_metrics()

            return {
                "unified_service": {
                    "status": "operational",
                    "last_sync": self.last_sync_time.isoformat(),
                    "integration_health": "healthy"
                },
                "memory_system": memory_report,
                "agent_system": agent_report,
                "learning_system": {
                    "total_patterns": learning_metrics.total_patterns,
                    "active_patterns": learning_metrics.active_patterns,
                    "avg_confidence": learning_metrics.avg_confidence,
                    "integration_score": learning_metrics.memory_integration_score
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e)}


async def main():
    """Test the unified context service"""
    service = UnifiedContextService()

    print("Unified Context Service Test")
    print("=" * 50)

    # Test unified query
    query = UnifiedQuery(
        query_text="How do I implement React authentication with memory integration?",
        context_type=ContextType.UNIFIED,
        include_agent_context=True,
        include_learning_patterns=True,
        include_cross_project=True
    )

    context = await service.query_unified_context(query)

    print(f"Query: {query.query_text}")
    print(f"Summary: {context.synthesis.get('summary', 'No summary')}")
    print(f"Confidence: {context.synthesis.get('confidence_score', 0):.3f}")
    print(f"Key Insights: {len(context.synthesis.get('key_insights', []))}")
    print(f"Recommendations: {len(context.synthesis.get('recommended_actions', []))}")

    # Test system status
    status = service.get_system_status()
    print(f"\nSystem Status: {status.get('unified_service', {}).get('status', 'unknown')}")

if __name__ == "__main__":
    asyncio.run(main())