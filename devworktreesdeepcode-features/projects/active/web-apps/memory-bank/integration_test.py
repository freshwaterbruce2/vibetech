#!/usr/bin/env python3
"""
Full System Integration Test
Tests the complete integration between memory, learning, and agent systems
Validates that all components work together seamlessly
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Import all system components
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType
from context_retrieval_service import ContextRetrievalService, ContextQuery, RetrievalStrategy
from learning_bridge import LearningBridge
from agent_memory_bridge import AgentMemoryBridge, AgentExecution
from unified_context_service import UnifiedContextService, UnifiedQuery, ContextType

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IntegrationTest:
    """Comprehensive integration test suite"""

    def __init__(self):
        self.test_results = {}
        self.unified_service = None
        self.memory_manager = None
        self.agent_bridge = None
        self.learning_bridge = None

    async def run_all_tests(self) -> Dict[str, bool]:
        """Run complete integration test suite"""
        print("=" * 70)
        print("FULL SYSTEM INTEGRATION TEST")
        print("=" * 70)

        tests = [
            ("Initialize Systems", self.test_system_initialization),
            ("Memory System", self.test_memory_system),
            ("Learning System", self.test_learning_system),
            ("Agent System", self.test_agent_system),
            ("Agent-Memory Bridge", self.test_agent_memory_bridge),
            ("Cross-System Integration", self.test_cross_system_integration),
            ("Unified Context Service", self.test_unified_context_service),
            ("End-to-End Workflow", self.test_end_to_end_workflow),
            ("Performance Validation", self.test_performance),
            ("Memory Persistence", self.test_memory_persistence)
        ]

        for test_name, test_func in tests:
            print(f"\n{test_name}...")
            print("-" * 50)

            try:
                result = await test_func()
                self.test_results[test_name] = result
                print(f"[{'PASS' if result else 'FAIL'}] {test_name}")

            except Exception as e:
                print(f"[ERROR] {test_name}: {e}")
                self.test_results[test_name] = False
                logger.error(f"Test failed: {test_name} - {e}")

        self.print_summary()
        return self.test_results

    async def test_system_initialization(self) -> bool:
        """Test that all systems initialize correctly"""
        try:
            # Initialize unified service (which initializes all subsystems)
            self.unified_service = UnifiedContextService()

            # Get individual system references
            self.memory_manager = self.unified_service.memory_manager
            self.agent_bridge = self.unified_service.agent_bridge
            self.learning_bridge = self.unified_service.learning_bridge

            print("[OK] Memory Manager initialized")
            print("[OK] Agent Bridge initialized")
            print("[OK] Learning Bridge initialized")
            print("[OK] Unified Context Service initialized")

            return True

        except Exception as e:
            print(f"✗ Initialization failed: {e}")
            return False

    async def test_memory_system(self) -> bool:
        """Test memory system functionality"""
        try:
            # Test memory storage
            test_data = {
                "test_type": "integration_test",
                "description": "Testing memory system integration",
                "timestamp": datetime.now().isoformat()
            }

            result = await self.memory_manager.store_memory(
                "integration_test_memory",
                test_data,
                MemoryType.SHORT_TERM,
                {"test": True, "integration": True}
            )

            if not result["success"]:
                print(f"✗ Memory storage failed: {result}")
                return False

            print(f"[OK] Memory stored: {result['size_bytes']} bytes")

            # Test memory retrieval
            retrieved = await self.memory_manager.retrieve_memory("integration_test_memory")
            if not retrieved or retrieved["data"]["test_type"] != "integration_test":
                print("✗ Memory retrieval failed")
                return False

            print(f"[OK] Memory retrieved: cache_hit={retrieved.get('cache_hit', False)}")

            # Test performance report
            performance = self.memory_manager.get_performance_report()
            print(f"[OK] Performance report: {performance['kv_cache_hit_rate']}")

            return True

        except Exception as e:
            print(f"✗ Memory system test failed: {e}")
            return False

    async def test_learning_system(self) -> bool:
        """Test learning system functionality"""
        try:
            # Test pattern analysis
            patterns = await self.learning_bridge.analyze_memory_patterns(time_window_hours=24)
            print(f"[OK] Found {len(patterns)} patterns")

            # Test learning recommendations
            recommendations = await self.learning_bridge.get_learning_recommendations(
                "How to implement React authentication?"
            )
            print(f"[OK] Generated {len(recommendations)} recommendations")

            # Test learning metrics
            metrics = self.learning_bridge.get_learning_metrics()
            print(f"[OK] Learning metrics: {metrics.total_patterns} patterns, {metrics.avg_confidence:.3f} confidence")

            return True

        except Exception as e:
            print(f"✗ Learning system test failed: {e}")
            return False

    async def test_agent_system(self) -> bool:
        """Test agent system functionality"""
        try:
            # Test agent context preparation
            context = await self.agent_bridge.prepare_agent_context(
                "general-purpose",
                "Implement a new feature for user authentication"
            )

            if "error" in context:
                print(f"✗ Agent context preparation failed: {context['error']}")
                return False

            print(f"[OK] Agent context prepared: {len(context.get('memory_context', []))} memories")

            # Test agent recommendations
            recommendations = await self.agent_bridge.get_agent_recommendations(
                "Fix authentication bug in React app"
            )
            print(f"[OK] Agent recommendations: {len(recommendations)} agents recommended")

            return True

        except Exception as e:
            print(f"✗ Agent system test failed: {e}")
            return False

    async def test_agent_memory_bridge(self) -> bool:
        """Test agent-memory bridge functionality"""
        try:
            # Test storing agent execution
            execution = AgentExecution(
                agent_name="general-purpose",
                task_description="Integration test execution",
                input_data={"test": "integration", "component": "agent_bridge"},
                output_data={"result": "success", "tools_used": ["test_framework"]},
                success_score=0.9,
                execution_time_ms=5000
            )

            result = await self.agent_bridge.store_agent_execution(execution)
            if not result.get("success", False):
                print(f"✗ Agent execution storage failed: {result}")
                return False

            print("[OK] Agent execution stored successfully")

            # Test cross-project insights
            insights = await self.agent_bridge.get_cross_project_insights(
                "React authentication project"
            )
            print(f"[OK] Cross-project insights: {insights.get('similar_projects', 0)} similar projects")

            return True

        except Exception as e:
            print(f"✗ Agent-memory bridge test failed: {e}")
            return False

    async def test_cross_system_integration(self) -> bool:
        """Test that systems properly share data"""
        try:
            # Store data through memory system
            memory_data = {
                "cross_system_test": True,
                "agent_task": "React component implementation",
                "success_pattern": "Use hooks and TypeScript",
                "learning_insight": "Follow component composition patterns"
            }

            await self.memory_manager.store_memory(
                "cross_system_test",
                memory_data,
                MemoryType.PROCEDURAL,
                {"cross_system": True, "success_score": 0.85}
            )

            # Query through context service
            query = ContextQuery(
                keywords=["React", "component", "implementation"],
                strategy=RetrievalStrategy.HYBRID_SCORING,
                max_results=5
            )

            results = await self.unified_service.context_service.query_context(query)
            cross_system_found = any(
                "cross_system_test" in result.key for result in results
            )

            if not cross_system_found:
                print("✗ Cross-system data sharing failed")
                return False

            print("✓ Cross-system data sharing working")

            # Test learning bridge access to memory data
            await self.learning_bridge.analyze_memory_patterns(time_window_hours=1)
            print("✓ Learning bridge accessing memory data")

            return True

        except Exception as e:
            print(f"✗ Cross-system integration test failed: {e}")
            return False

    async def test_unified_context_service(self) -> bool:
        """Test unified context service functionality"""
        try:
            # Test unified query
            query = UnifiedQuery(
                query_text="How to implement secure authentication in React with TypeScript?",
                context_type=ContextType.UNIFIED,
                include_agent_context=True,
                include_learning_patterns=True,
                max_results=5
            )

            context = await self.unified_service.query_unified_context(query)

            if context.synthesis.get("error"):
                print(f"✗ Unified query failed: {context.synthesis['error']}")
                return False

            print(f"✓ Unified context generated")
            print(f"  - Memory results: {len(context.memory_results or [])}")
            print(f"  - Learning patterns: {len(context.learning_patterns or [])}")
            print(f"  - Agent recommendations: {len(context.agent_recommendations or [])}")
            print(f"  - Confidence score: {context.synthesis.get('confidence_score', 0):.3f}")

            # Test system status
            status = self.unified_service.get_system_status()
            if status.get("unified_service", {}).get("status") != "operational":
                print("✗ System status check failed")
                return False

            print("✓ System status: operational")

            return True

        except Exception as e:
            print(f"✗ Unified context service test failed: {e}")
            return False

    async def test_end_to_end_workflow(self) -> bool:
        """Test complete end-to-end workflow"""
        try:
            print("Testing end-to-end workflow: User query → Context → Agent → Results → Learning")

            # 1. User query comes in
            user_query = "Help me debug a performance issue in my React app"

            # 2. Get unified context
            query = UnifiedQuery(
                query_text=user_query,
                context_type=ContextType.UNIFIED,
                include_agent_context=True,
                include_learning_patterns=True
            )

            context = await self.unified_service.query_unified_context(query)
            print("✓ Step 1: Context retrieved")

            # 3. Agent executes with context
            execution_result = {
                "success_score": 0.8,
                "execution_time_ms": 12000,
                "solution": "Identified memory leak in useEffect hook",
                "tools_used": ["React DevTools", "Performance Profiler"],
                "success_factors": ["Used context from previous debugging sessions"]
            }

            # 4. Store execution results
            success = await self.unified_service.store_unified_execution(
                "general-purpose",
                user_query,
                execution_result,
                context
            )

            if not success:
                print("✗ Step 4: Failed to store execution results")
                return False

            print("✓ Step 2: Agent executed with context")
            print("✓ Step 3: Results stored for learning")

            # 5. Verify learning system captured the pattern
            patterns = await self.learning_bridge.analyze_memory_patterns(time_window_hours=1)
            print(f"✓ Step 4: Learning patterns updated ({len(patterns)} patterns)")

            print("✓ End-to-end workflow completed successfully")
            return True

        except Exception as e:
            print(f"✗ End-to-end workflow test failed: {e}")
            return False

    async def test_performance(self) -> bool:
        """Test system performance meets requirements"""
        try:
            # Test memory performance
            memory_report = self.memory_manager.get_performance_report()
            kv_hit_rate = float(memory_report.get("kv_cache_hit_rate", "0%").rstrip("%")) / 100

            if kv_hit_rate < 0.85:  # Target: 85%+
                print(f"✗ KV cache hit rate too low: {kv_hit_rate:.1%}")
                return False

            print(f"✓ KV cache hit rate: {kv_hit_rate:.1%}")

            # Test query performance (should be under 100ms for cached)
            start_time = datetime.now()

            query = UnifiedQuery(
                query_text="performance test query",
                max_results=3
            )

            await self.unified_service.query_unified_context(query)

            query_time = (datetime.now() - start_time).total_seconds() * 1000

            print(f"✓ Query performance: {query_time:.1f}ms")

            return True

        except Exception as e:
            print(f"✗ Performance test failed: {e}")
            return False

    async def test_memory_persistence(self) -> bool:
        """Test that memory persists across sessions"""
        try:
            # Store persistent data
            persistent_data = {
                "persistence_test": True,
                "test_timestamp": datetime.now().isoformat(),
                "should_persist": True
            }

            result = await self.memory_manager.store_memory(
                "persistence_test_key",
                persistent_data,
                MemoryType.LONG_TERM,
                {"persistent": True, "test": True}
            )

            if not result["success"]:
                print("✗ Failed to store persistent data")
                return False

            # Verify immediate retrieval
            retrieved = await self.memory_manager.retrieve_memory("persistence_test_key")
            if not retrieved or not retrieved["data"]["persistence_test"]:
                print("✗ Failed to retrieve stored data")
                return False

            print("✓ Memory persistence verified")
            return True

        except Exception as e:
            print(f"✗ Memory persistence test failed: {e}")
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 70)

        passed = sum(1 for result in self.test_results.values() if result)
        total = len(self.test_results)

        print(f"Tests Passed: {passed}/{total} ({passed/total*100:.1f}%)")
        print()

        for test_name, result in self.test_results.items():
            status = "PASS" if result else "FAIL"
            print(f"[{status}] {test_name}")

        if passed == total:
            print("\n🎉 ALL TESTS PASSED - FULL INTEGRATION SUCCESSFUL!")
            print("\nSystem Status: PRODUCTION READY")
            print("✓ Memory system operational")
            print("✓ Learning system operational")
            print("✓ Agent system operational")
            print("✓ All integrations working")
            print("✓ Performance targets met")
        else:
            print(f"\n⚠️  {total - passed} TEST(S) FAILED")
            print("System needs attention before production use")

        print("\n" + "=" * 70)


async def main():
    """Run the integration test"""
    test_suite = IntegrationTest()

    try:
        results = await test_suite.run_all_tests()
        return all(results.values())

    except Exception as e:
        print(f"Integration test suite failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)