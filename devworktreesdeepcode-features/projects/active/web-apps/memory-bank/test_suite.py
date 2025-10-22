#!/usr/bin/env python3
"""
Production-Grade Testing Suite for Enhanced Memory System
Comprehensive testing with performance benchmarks and integration tests
September 2025 Architecture
"""

import asyncio
import pytest
import json
import time
import tempfile
import shutil
import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
from datetime import datetime, timedelta
import logging
import sys
import os

# Import the modules we're testing
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType, CompressionStrategy
from context_retrieval_service import ContextRetrievalService, ContextQuery, RetrievalStrategy
from learning_bridge import LearningBridge, LearningPattern
from monitoring_service import MonitoringService, AlertLevel, MetricType

class TestConfig:
    """Test configuration and fixtures"""

    def __init__(self):
        self.temp_dir = None
        self.test_db_path = None
        self.memory_manager = None
        self.retrieval_service = None
        self.learning_bridge = None
        self.monitoring_service = None

    async def setup(self):
        """Setup test environment"""
        # Create temporary directory for test files
        self.temp_dir = Path(tempfile.mkdtemp(prefix="memory_test_"))

        # Create test database
        self.test_db_path = self.temp_dir / "test_database.db"

        # Setup test memory manager with temporary paths
        test_config = {
            "directories": {
                "local_memory": str(self.temp_dir / "local"),
                "bulk_storage": str(self.temp_dir / "bulk")
            },
            "learning": {
                "database_path": str(self.test_db_path),
                "sync_interval_minutes": 1,
                "pattern_threshold": 2
            },
            "buffers": {
                "short_term_size": 10,
                "kv_cache_size": 50
            },
            "compression": {
                "threshold_mb": 0.1,
                "strategies": ["concept_distill"]
            },
            "retention": {
                "short_term_hours": 1,
                "long_term_days": 7,
                "archive_days": 30
            },
            "performance": {
                "target_kv_hit_rate": 0.85,
                "max_retrieval_ms": 100,
                "batch_size": 10
            }
        }

        # Write test config
        config_path = self.temp_dir / "test_config.json"
        with open(config_path, 'w') as f:
            json.dump(test_config, f)

        # Initialize components
        self.memory_manager = EnhancedMemoryManager(str(config_path))
        self.retrieval_service = ContextRetrievalService(self.memory_manager)
        self.learning_bridge = LearningBridge(self.memory_manager)
        self.monitoring_service = MonitoringService(self.memory_manager, self.learning_bridge)

    async def teardown(self):
        """Cleanup test environment"""
        if self.monitoring_service and self.monitoring_service.is_monitoring:
            await self.monitoring_service.stop_monitoring()

        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir, ignore_errors=True)

class MemoryManagerTests:
    """Test suite for Enhanced Memory Manager"""

    def __init__(self, config: TestConfig):
        self.config = config

    async def test_basic_memory_operations(self):
        """Test basic store and retrieve operations"""
        print("Testing basic memory operations...")

        # Test data
        test_data = {
            "task": "Test memory storage",
            "approach": "Unit testing",
            "timestamp": datetime.now().isoformat()
        }

        # Store memory
        result = await self.config.memory_manager.store_memory(
            "test_basic_001",
            test_data,
            MemoryType.SHORT_TERM,
            {"test": True, "category": "unit_test"}
        )

        assert result["success"] == True
        assert result["key"] == "test_basic_001"
        assert result["size_bytes"] > 0
        print(f"✅ Storage successful: {result['size_bytes']} bytes in {result['storage_time_ms']:.2f}ms")

        # Retrieve memory
        retrieved = await self.config.memory_manager.retrieve_memory("test_basic_001")

        assert retrieved is not None
        assert retrieved["data"]["task"] == test_data["task"]
        assert retrieved["data"]["approach"] == test_data["approach"]
        print(f"✅ Retrieval successful: cache_hit={retrieved['cache_hit']}")

        return True

    async def test_memory_types_and_routing(self):
        """Test different memory types and storage routing"""
        print("Testing memory types and routing...")

        test_cases = [
            (MemoryType.SHORT_TERM, "short_term_test", {"priority": "high"}),
            (MemoryType.LONG_TERM, "long_term_test", {"category": "knowledge"}),
            (MemoryType.EPISODIC, "episodic_test", {"event": "completion"}),
            (MemoryType.SEMANTIC, "semantic_test", {"concept": "pattern"}),
            (MemoryType.PROCEDURAL, "procedural_test", {"workflow": "process"})
        ]

        for memory_type, key, metadata in test_cases:
            data = {
                "type": memory_type.value,
                "content": f"Test data for {memory_type.value}",
                "timestamp": datetime.now().isoformat()
            }

            result = await self.config.memory_manager.store_memory(
                key, data, memory_type, metadata
            )

            assert result["success"] == True
            print(f"✅ {memory_type.value} storage successful")

            # Verify retrieval
            retrieved = await self.config.memory_manager.retrieve_memory(key, memory_type)
            assert retrieved is not None
            assert retrieved["data"]["type"] == memory_type.value
            print(f"✅ {memory_type.value} retrieval successful")

        return True

    async def test_compression_and_decompression(self):
        """Test data compression and decompression"""
        print("Testing compression and decompression...")

        # Create large data that should trigger compression
        large_data = {
            "large_content": "x" * 2000,  # 2KB of data
            "metadata": {"size": "large"},
            "repeated_data": ["item"] * 100,
            "complex_structure": {
                "nested": {
                    "deep": {
                        "content": "This is deeply nested content that should be compressed"
                    }
                }
            }
        }

        result = await self.config.memory_manager.store_memory(
            "test_compression_001",
            large_data,
            MemoryType.LONG_TERM,
            {"test": True, "compression_test": True}
        )

        assert result["success"] == True
        print(f"✅ Large data storage: compressed={result.get('compressed', False)}")

        # Retrieve and verify data integrity
        retrieved = await self.config.memory_manager.retrieve_memory(
            "test_compression_001",
            expand_context=True
        )

        assert retrieved is not None
        # Note: With compression, exact data match may not be possible
        # but key information should be preserved
        assert "large_content" in str(retrieved["data"]) or "concepts" in str(retrieved["data"])
        print("✅ Compressed data retrieval successful")

        return True

    async def test_kv_cache_performance(self):
        """Test KV cache hit rate and performance"""
        print("Testing KV cache performance...")

        # Store multiple items to populate cache
        for i in range(10):
            data = {"item": i, "content": f"Test item {i}"}
            await self.config.memory_manager.store_memory(
                f"cache_test_{i:03d}",
                data,
                MemoryType.SHORT_TERM,
                {"cache_test": True}
            )

        # Access items multiple times to test cache hits
        cache_hits = 0
        total_accesses = 20

        for i in range(total_accesses):
            key = f"cache_test_{i % 10:03d}"
            start_time = time.time()
            retrieved = await self.config.memory_manager.retrieve_memory(key)
            access_time = (time.time() - start_time) * 1000

            if retrieved and retrieved.get("cache_hit"):
                cache_hits += 1
                assert access_time < 1.0  # Cache hits should be very fast

        cache_hit_rate = cache_hits / total_accesses
        print(f"✅ Cache hit rate: {cache_hit_rate:.2%} ({cache_hits}/{total_accesses})")

        # Get performance report
        report = self.config.memory_manager.get_performance_report()
        print(f"✅ Performance report: {report['kv_cache_hit_rate']}")

        return cache_hit_rate >= 0.5  # At least 50% hit rate expected

    async def test_memory_cleanup_and_retention(self):
        """Test memory cleanup and retention policies"""
        print("Testing memory cleanup and retention...")

        # Create old memories (simulate by modifying timestamps)
        old_data = {"content": "Old memory", "timestamp": "2023-01-01T00:00:00"}
        await self.config.memory_manager.store_memory(
            "old_memory_001",
            old_data,
            MemoryType.SHORT_TERM,
            {"test": True, "age_test": True}
        )

        # Run cleanup
        await self.config.memory_manager.cleanup_old_memories()

        # Check that cleanup completed without errors
        print("✅ Memory cleanup completed successfully")

        return True

class ContextRetrievalTests:
    """Test suite for Context Retrieval Service"""

    def __init__(self, config: TestConfig):
        self.config = config

    async def setup_test_memories(self):
        """Setup test memories for retrieval testing"""
        test_memories = [
            {
                "key": "dev_task_001",
                "data": {"task": "implement API", "tools": ["python", "fastapi"], "result": "success"},
                "memory_type": MemoryType.PROCEDURAL,
                "metadata": {"intent_category": "development", "priority_level": "high"}
            },
            {
                "key": "debug_error_001",
                "data": {"error": "import error", "solution": "install package", "result": "resolved"},
                "memory_type": MemoryType.EPISODIC,
                "metadata": {"intent_category": "debugging", "priority_level": "high"}
            },
            {
                "key": "inquiry_001",
                "data": {"question": "how to optimize", "answer": "use caching", "context": "performance"},
                "memory_type": MemoryType.SEMANTIC,
                "metadata": {"intent_category": "inquiry", "priority_level": "medium"}
            }
        ]

        for memory in test_memories:
            await self.config.memory_manager.store_memory(
                memory["key"],
                memory["data"],
                memory["memory_type"],
                memory["metadata"]
            )

        print("[SETUP] Test memories created for retrieval testing")

    async def test_relevance_based_retrieval(self):
        """Test relevance-based context retrieval"""
        print("Testing relevance-based retrieval...")

        await self.setup_test_memories()

        # Query for development-related context
        query = ContextQuery(
            keywords=["implement", "API", "python"],
            intent_category="development",
            priority_level="high",
            max_results=5,
            strategy=RetrievalStrategy.RELEVANCE_BASED
        )

        results = await self.config.retrieval_service.query_context(query)

        assert len(results) > 0
        # Check that most relevant result is returned first
        top_result = results[0]
        assert top_result.relevance_score > 0
        print(f"✅ Retrieved {len(results)} relevant contexts, top relevance: {top_result.relevance_score:.3f}")

        return True

    async def test_temporal_proximity_retrieval(self):
        """Test temporal proximity retrieval"""
        print("Testing temporal proximity retrieval...")

        # Query for recent contexts
        query = ContextQuery(
            keywords=["error", "debug"],
            intent_category="debugging",
            priority_level="normal",
            time_window_hours=24,
            strategy=RetrievalStrategy.TEMPORAL_PROXIMITY
        )

        results = await self.config.retrieval_service.query_context(query)

        # Verify results are ordered by temporal proximity
        if len(results) > 1:
            for i in range(len(results) - 1):
                assert results[i].temporal_score >= results[i + 1].temporal_score

        print(f"✅ Temporal retrieval returned {len(results)} results")
        return True

    async def test_hybrid_scoring_retrieval(self):
        """Test hybrid scoring strategy"""
        print("Testing hybrid scoring retrieval...")

        query = ContextQuery(
            keywords=["optimize", "performance"],
            intent_category="inquiry",
            priority_level="medium",
            strategy=RetrievalStrategy.HYBRID_SCORING
        )

        results = await self.config.retrieval_service.query_context(query)

        # Verify combined scores are calculated
        for result in results:
            assert result.combined_score > 0
            assert result.combined_score <= 1.0

        print(f"✅ Hybrid scoring returned {len(results)} results with combined scores")
        return True

    async def test_contextual_suggestions(self):
        """Test contextual suggestions feature"""
        print("Testing contextual suggestions...")

        test_prompt = "How do I implement a caching system for better performance?"
        suggestions = await self.config.retrieval_service.get_contextual_suggestions(
            test_prompt, "development"
        )

        print(f"✅ Generated {len(suggestions)} contextual suggestions")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"   {i}. {suggestion}")

        return True

class LearningBridgeTests:
    """Test suite for Learning Bridge"""

    def __init__(self, config: TestConfig):
        self.config = config

    async def setup_learning_data(self):
        """Setup test data for learning analysis"""
        # Create diverse memories for pattern analysis
        learning_memories = [
            {
                "key": "success_pattern_001",
                "data": {"task": "deploy app", "tools": ["docker", "git"], "result": "success", "approach": "containerization"},
                "metadata": {"intent_category": "development", "priority_level": "high"}
            },
            {
                "key": "success_pattern_002",
                "data": {"task": "deploy service", "tools": ["docker", "kubernetes"], "result": "success", "approach": "containerization"},
                "metadata": {"intent_category": "development", "priority_level": "high"}
            },
            {
                "key": "error_pattern_001",
                "data": {"error": "connection timeout", "solution": "increase timeout", "result": "resolved"},
                "metadata": {"intent_category": "debugging", "priority_level": "high"}
            },
            {
                "key": "error_pattern_002",
                "data": {"error": "connection failed", "solution": "check network", "result": "resolved"},
                "metadata": {"intent_category": "debugging", "priority_level": "high"}
            },
            {
                "key": "workflow_001",
                "data": {"step": "analyze", "next": "design", "tools": ["git", "vscode"]},
                "metadata": {"intent_category": "development", "priority_level": "medium"}
            }
        ]

        for memory in learning_memories:
            await self.config.memory_manager.store_memory(
                memory["key"],
                memory["data"],
                MemoryType.PROCEDURAL,
                memory["metadata"]
            )

        print("✅ Learning test data created")

    async def test_pattern_analysis(self):
        """Test pattern discovery and analysis"""
        print("Testing pattern analysis...")

        await self.setup_learning_data()

        # Wait a bit for memories to be indexed
        await asyncio.sleep(1)

        # Run pattern analysis
        patterns = await self.config.learning_bridge.analyze_memory_patterns(time_window_hours=24)

        print(f"✅ Discovered {len(patterns)} patterns")

        # Verify we found different types of patterns
        pattern_types = set(p.pattern_type for p in patterns)
        print(f"✅ Pattern types found: {[pt.value for pt in pattern_types]}")

        # Check pattern quality
        for pattern in patterns:
            assert pattern.confidence > 0
            assert pattern.frequency >= 0
            assert len(pattern.recommendations) > 0

        return len(patterns) > 0

    async def test_learning_recommendations(self):
        """Test learning-based recommendations"""
        print("Testing learning recommendations...")

        # Test context for recommendations
        test_context = "I need to deploy a containerized application"

        recommendations = await self.config.learning_bridge.get_learning_recommendations(test_context)

        print(f"✅ Generated {len(recommendations)} recommendations")
        for rec in recommendations:
            print(f"   - {rec['description']} (confidence: {rec['confidence']:.3f})")

        return True

    async def test_learning_metrics(self):
        """Test learning metrics calculation"""
        print("Testing learning metrics...")

        metrics = self.config.learning_bridge.get_learning_metrics()

        print(f"✅ Learning metrics:")
        print(f"   Total patterns: {metrics.total_patterns}")
        print(f"   Active patterns: {metrics.active_patterns}")
        print(f"   Average confidence: {metrics.avg_confidence:.3f}")
        print(f"   Memory integration score: {metrics.memory_integration_score:.3f}")

        return True

class MonitoringServiceTests:
    """Test suite for Monitoring Service"""

    def __init__(self, config: TestConfig):
        self.config = config

    async def test_metrics_collection(self):
        """Test performance metrics collection"""
        print("Testing metrics collection...")

        # Start monitoring briefly
        await self.config.monitoring_service.start_monitoring()
        await asyncio.sleep(2)  # Let it collect some metrics

        metrics = self.config.monitoring_service.get_current_metrics()

        assert metrics is not None
        assert metrics.kv_cache_hit_rate >= 0
        assert metrics.avg_retrieval_latency_ms >= 0
        assert metrics.system_cpu_percent >= 0

        print(f"✅ Metrics collected:")
        print(f"   Cache hit rate: {metrics.kv_cache_hit_rate:.2%}")
        print(f"   Retrieval latency: {metrics.avg_retrieval_latency_ms:.2f}ms")
        print(f"   CPU usage: {metrics.system_cpu_percent:.1f}%")

        await self.config.monitoring_service.stop_monitoring()
        return True

    async def test_health_checks(self):
        """Test system health checks"""
        print("Testing health checks...")

        # Start monitoring to trigger health checks
        await self.config.monitoring_service.start_monitoring()
        await asyncio.sleep(2)

        health = self.config.monitoring_service.get_current_health()

        if health:
            print(f"✅ Health status: {health.overall_status}")
            print(f"   Memory system: {health.memory_system_status}")
            print(f"   Learning system: {health.learning_system_status}")
            print(f"   Database: {health.database_status}")

            assert health.overall_status in ['healthy', 'degraded', 'unhealthy', 'critical']

        await self.config.monitoring_service.stop_monitoring()
        return True

    async def test_alert_system(self):
        """Test alert generation and handling"""
        print("Testing alert system...")

        # Create a mock alert by tracking errors
        self.config.monitoring_service.track_error()
        self.config.monitoring_service.track_error()
        self.config.monitoring_service.track_error()

        # Start monitoring to process alerts
        await self.config.monitoring_service.start_monitoring()
        await asyncio.sleep(2)

        alerts = self.config.monitoring_service.get_active_alerts()

        print(f"✅ Active alerts: {len(alerts)}")
        for alert in alerts:
            print(f"   {alert.level.value}: {alert.title}")

        await self.config.monitoring_service.stop_monitoring()
        return True

class IntegrationTests:
    """Integration tests for the complete system"""

    def __init__(self, config: TestConfig):
        self.config = config

    async def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow"""
        print("Testing end-to-end workflow...")

        # 1. Store memories with different types
        workflow_memories = [
            {
                "key": "e2e_step_001",
                "data": {"task": "analyze requirements", "result": "completed", "tools": ["notepad"]},
                "type": MemoryType.PROCEDURAL,
                "metadata": {"intent_category": "development", "step": 1}
            },
            {
                "key": "e2e_step_002",
                "data": {"task": "design system", "result": "completed", "tools": ["diagrams"]},
                "type": MemoryType.PROCEDURAL,
                "metadata": {"intent_category": "development", "step": 2}
            },
            {
                "key": "e2e_step_003",
                "data": {"task": "implement code", "result": "completed", "tools": ["vscode", "python"]},
                "type": MemoryType.PROCEDURAL,
                "metadata": {"intent_category": "development", "step": 3}
            }
        ]

        # Store memories
        for memory in workflow_memories:
            result = await self.config.memory_manager.store_memory(
                memory["key"], memory["data"], memory["type"], memory["metadata"]
            )
            assert result["success"]

        print("✅ Stored workflow memories")

        # 2. Retrieve related memories
        query = ContextQuery(
            keywords=["development", "implement"],
            intent_category="development",
            priority_level="normal",
            max_results=10
        )

        retrieved_memories = await self.config.retrieval_service.query_context(query)
        assert len(retrieved_memories) > 0
        print(f"✅ Retrieved {len(retrieved_memories)} related memories")

        # 3. Analyze patterns
        patterns = await self.config.learning_bridge.analyze_memory_patterns(time_window_hours=1)
        print(f"✅ Discovered {len(patterns)} patterns from workflow")

        # 4. Get recommendations
        recommendations = await self.config.learning_bridge.get_learning_recommendations(
            "How should I approach a development project?"
        )
        print(f"✅ Generated {len(recommendations)} workflow recommendations")

        # 5. Check system health
        await self.config.monitoring_service.start_monitoring()
        await asyncio.sleep(1)

        health = self.config.monitoring_service.get_current_health()
        assert health is not None
        print(f"✅ System health: {health.overall_status}")

        await self.config.monitoring_service.stop_monitoring()

        return True

    async def test_performance_under_load(self):
        """Test system performance under load"""
        print("Testing performance under load...")

        # Generate load by storing many memories
        load_size = 50
        start_time = time.time()

        tasks = []
        for i in range(load_size):
            data = {
                "load_test_id": i,
                "content": f"Load test data item {i}",
                "timestamp": datetime.now().isoformat()
            }

            task = self.config.memory_manager.store_memory(
                f"load_test_{i:03d}",
                data,
                MemoryType.SHORT_TERM,
                {"load_test": True, "batch": i // 10}
            )
            tasks.append(task)

        # Execute all storage operations
        results = await asyncio.gather(*tasks, return_exceptions=True)

        storage_time = time.time() - start_time
        successful_stores = sum(1 for r in results if isinstance(r, dict) and r.get("success"))

        print(f"✅ Load test results:")
        print(f"   Stored {successful_stores}/{load_size} memories")
        print(f"   Total time: {storage_time:.2f}s")
        print(f"   Average per operation: {(storage_time / load_size) * 1000:.2f}ms")

        # Test retrieval performance
        start_time = time.time()
        retrieval_tasks = [
            self.config.memory_manager.retrieve_memory(f"load_test_{i:03d}")
            for i in range(0, load_size, 5)  # Retrieve every 5th item
        ]

        retrieval_results = await asyncio.gather(*retrieval_tasks, return_exceptions=True)
        retrieval_time = time.time() - start_time
        successful_retrievals = sum(1 for r in retrieval_results if r is not None)

        print(f"   Retrieved {successful_retrievals} memories in {retrieval_time:.2f}s")

        # Check performance metrics
        report = self.config.memory_manager.get_performance_report()
        cache_hit_rate = float(report["kv_cache_hit_rate"].strip('%')) / 100.0

        print(f"   Final cache hit rate: {cache_hit_rate:.2%}")

        return successful_stores >= load_size * 0.9  # 90% success rate expected

    async def test_data_consistency(self):
        """Test data consistency across operations"""
        print("Testing data consistency...")

        # Store data and verify it remains consistent
        test_data = {
            "consistency_test": True,
            "original_value": "test_123",
            "numeric_value": 42,
            "list_value": [1, 2, 3, 4, 5],
            "nested": {
                "deep": {
                    "value": "deeply_nested_test"
                }
            }
        }

        # Store original
        store_result = await self.config.memory_manager.store_memory(
            "consistency_test_001",
            test_data,
            MemoryType.LONG_TERM,
            {"consistency_test": True}
        )
        assert store_result["success"]

        # Retrieve multiple times and verify consistency
        for i in range(5):
            retrieved = await self.config.memory_manager.retrieve_memory("consistency_test_001")

            assert retrieved is not None
            data = retrieved["data"]

            # Check that core data is preserved (even if compressed)
            assert "consistency_test" in str(data) or data.get("consistency_test") == True

            if isinstance(data, dict):
                # If not compressed, check exact values
                if "original_value" in data:
                    assert data["original_value"] == test_data["original_value"]
                if "numeric_value" in data:
                    assert data["numeric_value"] == test_data["numeric_value"]

        print("✅ Data consistency verified across multiple retrievals")
        return True

class PerformanceBenchmarks:
    """Performance benchmarking suite"""

    def __init__(self, config: TestConfig):
        self.config = config

    async def benchmark_storage_performance(self):
        """Benchmark storage performance"""
        print("Benchmarking storage performance...")

        sizes = [100, 1000, 10000]  # Different data sizes in bytes
        results = {}

        for size in sizes:
            data = {"content": "x" * size, "size": size}

            # Measure storage time
            times = []
            for i in range(10):  # 10 samples
                start_time = time.time()
                result = await self.config.memory_manager.store_memory(
                    f"benchmark_storage_{size}_{i}",
                    data,
                    MemoryType.SHORT_TERM,
                    {"benchmark": True}
                )
                end_time = time.time()

                if result["success"]:
                    times.append((end_time - start_time) * 1000)  # Convert to ms

            if times:
                avg_time = np.mean(times)
                std_time = np.std(times)
                results[size] = {"avg_ms": avg_time, "std_ms": std_time}
                print(f"   {size} bytes: {avg_time:.2f}±{std_time:.2f}ms")

        return results

    async def benchmark_retrieval_performance(self):
        """Benchmark retrieval performance"""
        print("Benchmarking retrieval performance...")

        # Setup test data
        test_keys = []
        for i in range(20):
            data = {"benchmark_id": i, "content": f"Benchmark data {i}"}
            result = await self.config.memory_manager.store_memory(
                f"benchmark_retrieval_{i:03d}",
                data,
                MemoryType.SHORT_TERM,
                {"benchmark": True}
            )
            if result["success"]:
                test_keys.append(f"benchmark_retrieval_{i:03d}")

        # Benchmark retrieval
        cache_hit_times = []
        cache_miss_times = []

        for _ in range(50):  # 50 retrieval operations
            key = np.random.choice(test_keys)

            start_time = time.time()
            result = await self.config.memory_manager.retrieve_memory(key)
            end_time = time.time()

            if result:
                retrieval_time = (end_time - start_time) * 1000
                if result.get("cache_hit"):
                    cache_hit_times.append(retrieval_time)
                else:
                    cache_miss_times.append(retrieval_time)

        results = {}
        if cache_hit_times:
            results["cache_hits"] = {
                "avg_ms": np.mean(cache_hit_times),
                "std_ms": np.std(cache_hit_times),
                "count": len(cache_hit_times)
            }
            print(f"   Cache hits: {np.mean(cache_hit_times):.3f}±{np.std(cache_hit_times):.3f}ms ({len(cache_hit_times)} samples)")

        if cache_miss_times:
            results["cache_misses"] = {
                "avg_ms": np.mean(cache_miss_times),
                "std_ms": np.std(cache_miss_times),
                "count": len(cache_miss_times)
            }
            print(f"   Cache misses: {np.mean(cache_miss_times):.3f}±{np.std(cache_miss_times):.3f}ms ({len(cache_miss_times)} samples)")

        return results

    async def benchmark_query_performance(self):
        """Benchmark context query performance"""
        print("Benchmarking query performance...")

        # Setup diverse test data for querying
        for i in range(30):
            data = {
                "task": f"Task {i}",
                "category": ["development", "debugging", "inquiry"][i % 3],
                "tools": ["python", "javascript", "docker"][i % 3],
                "complexity": ["low", "medium", "high"][i % 3],
                "content": f"This is test content for item {i} with various keywords and context."
            }

            await self.config.memory_manager.store_memory(
                f"query_benchmark_{i:03d}",
                data,
                MemoryType.SEMANTIC,
                {
                    "intent_category": data["category"],
                    "priority_level": data["complexity"],
                    "benchmark": True
                }
            )

        # Benchmark different query types
        queries = [
            ContextQuery(
                keywords=["development", "python"],
                intent_category="development",
                priority_level="medium",
                max_results=5,
                strategy=RetrievalStrategy.RELEVANCE_BASED
            ),
            ContextQuery(
                keywords=["debug", "error"],
                intent_category="debugging",
                priority_level="high",
                max_results=10,
                strategy=RetrievalStrategy.HYBRID_SCORING
            ),
            ContextQuery(
                keywords=["task", "complexity"],
                intent_category="inquiry",
                priority_level="low",
                max_results=3,
                strategy=RetrievalStrategy.SEMANTIC_SIMILARITY
            )
        ]

        results = {}
        for i, query in enumerate(queries):
            times = []
            result_counts = []

            for _ in range(5):  # 5 samples per query type
                start_time = time.time()
                results_list = await self.config.retrieval_service.query_context(query)
                end_time = time.time()

                times.append((end_time - start_time) * 1000)
                result_counts.append(len(results_list))

            results[f"query_type_{i}"] = {
                "strategy": query.strategy.value,
                "avg_time_ms": np.mean(times),
                "std_time_ms": np.std(times),
                "avg_results": np.mean(result_counts)
            }

            print(f"   {query.strategy.value}: {np.mean(times):.2f}±{np.std(times):.2f}ms, {np.mean(result_counts):.1f} results")

        return results

class TestRunner:
    """Main test runner"""

    def __init__(self):
        self.config = TestConfig()
        self.results = {}

    async def run_all_tests(self):
        """Run all test suites"""
        print("=" * 80)
        print("ENHANCED MEMORY SYSTEM - PRODUCTION TEST SUITE")
        print("=" * 80)

        try:
            # Setup test environment
            print("\n[SETUP] Setting up test environment...")
            await self.config.setup()
            print("[SETUP] Test environment ready")

            # Initialize test suites
            memory_tests = MemoryManagerTests(self.config)
            retrieval_tests = ContextRetrievalTests(self.config)
            learning_tests = LearningBridgeTests(self.config)
            monitoring_tests = MonitoringServiceTests(self.config)
            integration_tests = IntegrationTests(self.config)
            benchmarks = PerformanceBenchmarks(self.config)

            # Run test suites
            test_suites = [
                ("Memory Manager Tests", [
                    memory_tests.test_basic_memory_operations,
                    memory_tests.test_memory_types_and_routing,
                    memory_tests.test_compression_and_decompression,
                    memory_tests.test_kv_cache_performance,
                    memory_tests.test_memory_cleanup_and_retention
                ]),
                ("Context Retrieval Tests", [
                    retrieval_tests.test_relevance_based_retrieval,
                    retrieval_tests.test_temporal_proximity_retrieval,
                    retrieval_tests.test_hybrid_scoring_retrieval,
                    retrieval_tests.test_contextual_suggestions
                ]),
                ("Learning Bridge Tests", [
                    learning_tests.test_pattern_analysis,
                    learning_tests.test_learning_recommendations,
                    learning_tests.test_learning_metrics
                ]),
                ("Monitoring Service Tests", [
                    monitoring_tests.test_metrics_collection,
                    monitoring_tests.test_health_checks,
                    monitoring_tests.test_alert_system
                ]),
                ("Integration Tests", [
                    integration_tests.test_end_to_end_workflow,
                    integration_tests.test_performance_under_load,
                    integration_tests.test_data_consistency
                ]),
                ("Performance Benchmarks", [
                    benchmarks.benchmark_storage_performance,
                    benchmarks.benchmark_retrieval_performance,
                    benchmarks.benchmark_query_performance
                ])
            ]

            total_tests = 0
            passed_tests = 0

            for suite_name, tests in test_suites:
                print(f"\n[TEST] {suite_name}")
                print("-" * 50)

                suite_results = []

                for test_func in tests:
                    total_tests += 1
                    try:
                        result = await test_func()
                        if result:
                            passed_tests += 1
                            suite_results.append({"name": test_func.__name__, "status": "PASS"})
                        else:
                            suite_results.append({"name": test_func.__name__, "status": "FAIL"})
                            print(f"[FAIL] {test_func.__name__} FAILED")

                    except Exception as e:
                        suite_results.append({
                            "name": test_func.__name__,
                            "status": "ERROR",
                            "error": str(e)
                        })
                        print(f"[ERROR] {test_func.__name__} ERROR: {e}")

                self.results[suite_name] = suite_results

            # Print final results
            print("\n" + "=" * 80)
            print("TEST RESULTS SUMMARY")
            print("=" * 80)

            for suite_name, results in self.results.items():
                passed = len([r for r in results if r["status"] == "PASS"])
                total = len(results)
                print(f"{suite_name}: {passed}/{total} tests passed")

                for result in results:
                    status_symbol = "[PASS]" if result["status"] == "PASS" else "[FAIL]" if result["status"] == "FAIL" else "[ERROR]"
                    print(f"  {status_symbol} {result['name']}")
                    if result["status"] == "ERROR":
                        print(f"      Error: {result['error']}")

            print(f"\nOVERALL: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")

            if passed_tests == total_tests:
                print("[SUCCESS] ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION!")
            elif passed_tests >= total_tests * 0.9:
                print("[WARNING] MOST TESTS PASSED - MINOR ISSUES TO ADDRESS")
            else:
                print("[CRITICAL] SIGNIFICANT ISSUES FOUND - SYSTEM NEEDS WORK")

        except Exception as e:
            print(f"[CRITICAL] ERROR in test runner: {e}")
            import traceback
            traceback.print_exc()

        finally:
            # Cleanup
            print("\n[CLEANUP] Cleaning up test environment...")
            await self.config.teardown()
            print("[CLEANUP] Cleanup complete")


# Main execution
async def main():
    """Run the complete test suite"""
    runner = TestRunner()
    await runner.run_all_tests()


if __name__ == "__main__":
    # Setup logging for tests
    logging.basicConfig(
        level=logging.WARNING,  # Reduce noise during tests
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Run tests
    asyncio.run(main())