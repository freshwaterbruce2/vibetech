# AGENTS.md - Enhanced Memory System for Claude Code

This file extends the root AGENTS.md with specific instructions for the Enhanced Memory System. This is a **production-grade cognitive system** that must achieve enterprise-level reliability and performance.

## Project Overview

Production-grade memory and learning system enabling Claude Code to remember context across sessions, learn from patterns, and provide intelligent suggestions. Features 5 memory types, multi-level caching, and real-time pattern analysis.

## Critical Performance Requirements

### 🎯 TARGET METRICS (MANDATORY)
- **Cache Hit Rate**: >95% for short-term, >85% for long-term
- **Retrieval Latency**: <10ms for cached items, <100ms for database
- **Memory Usage**: <500MB total system footprint
- **Storage Efficiency**: >90% compression ratio for archived memories
- **Learning Accuracy**: >80% pattern recognition success rate

### 🧠 MEMORY TYPE ARCHITECTURE
```python
class MemoryTypes(Enum):
    SHORT_TERM = "short_term"      # Active session context (5-10 items)
    LONG_TERM = "long_term"        # Cross-session knowledge
    EPISODIC = "episodic"          # Specific task episodes
    SEMANTIC = "semantic"          # General knowledge patterns
    PROCEDURAL = "procedural"      # Learned workflows and procedures
```

## Development Workflow

### Pre-Development Checklist
1. **System Health**: Run `python integration_test.py` to validate all components
2. **Performance Baseline**: Check current cache hit rates and latency metrics
3. **Database State**: Verify vector database integrity and indexes
4. **Memory Pressure**: Monitor current memory usage and compression ratios
5. **Learning Models**: Validate pattern recognition accuracy

### Implementation Patterns

#### 1. Memory Storage Architecture
```python
class MemoryManager:
    def __init__(self):
        self.kv_cache = MultiLevelCache()
        self.vector_db = VectorDatabase()
        self.compression_engine = CompressionEngine()
        self.learning_bridge = LearningBridge()

    async def store_memory(self, memory: Memory) -> str:
        # Route to appropriate storage tier
        # Apply compression if needed
        # Update indexes and vectors
        # Trigger learning analysis
```

#### 2. Context-Aware Retrieval
```python
class ContextRetrieval:
    async def retrieve_relevant(self, context: Context) -> List[Memory]:
        # Multi-strategy search
        results = []
        results.extend(await self.relevance_search(context))
        results.extend(await self.temporal_search(context))
        results.extend(await self.attention_weighted_search(context))

        return self.hybrid_ranking(results, context)
```

#### 3. Pattern Learning Implementation
```python
class PatternAnalyzer:
    async def analyze_patterns(self, memories: List[Memory]) -> PatternInsights:
        # Success pattern detection
        success_patterns = await self.identify_success_patterns(memories)

        # Tool usage optimization
        tool_patterns = await self.analyze_tool_usage(memories)

        # Workflow optimization
        workflow_patterns = await self.extract_workflows(memories)

        return PatternInsights(success_patterns, tool_patterns, workflow_patterns)
```

#### 4. Real-Time Monitoring Integration
```python
class MonitoringService:
    def __init__(self):
        self.websocket_server = WebSocketServer()
        self.metrics_collector = MetricsCollector()
        self.alert_manager = AlertManager()

    async def broadcast_metrics(self):
        metrics = await self.collect_real_time_metrics()
        await self.websocket_server.broadcast(metrics)

        # Check thresholds and alert if needed
        await self.alert_manager.check_thresholds(metrics)
```

## Testing Requirements

### Unit Testing
```bash
# Full test suite with coverage
python test_suite.py

# Specific component tests
python -m pytest tests/test_memory_manager.py -v
python -m pytest tests/test_vector_database.py -v
python -m pytest tests/test_pattern_analyzer.py -v
python -m pytest tests/test_compression.py -v
```

### Performance Testing
```bash
# Latency benchmarks
python test_suite.py --benchmark-latency

# Memory usage profiling
python test_suite.py --profile-memory

# Cache efficiency testing
python test_suite.py --test-cache-performance

# Compression ratio validation
python test_suite.py --test-compression
```

### Integration Testing
```bash
# Full system integration
python integration_test.py

# Claude Code hooks integration
python test_hooks_integration.py

# WebSocket monitoring integration
python test_monitoring_service.py
```

### Pre-Production Validation
- [ ] All unit tests pass with >95% coverage
- [ ] Performance benchmarks meet target metrics
- [ ] Memory leaks eliminated (tested over 24 hours)
- [ ] Cache hit rates consistently >95% for short-term
- [ ] Vector database queries <100ms consistently
- [ ] Compression ratios >90% achieved
- [ ] Pattern recognition accuracy >80% validated

## Performance Optimization Requirements

### Multi-Level Caching Strategy
```python
class MultiLevelCache:
    def __init__(self):
        self.l1_cache = LRUCache(maxsize=100)      # Hot items, <1ms
        self.l2_cache = LRUCache(maxsize=1000)     # Warm items, <5ms
        self.l3_cache = CompressedCache(maxsize=10000)  # Cold items, <50ms

    async def get(self, key: str) -> Optional[Any]:
        # L1 cache check
        if value := self.l1_cache.get(key):
            return value

        # L2 cache check with promotion
        if value := self.l2_cache.get(key):
            self.l1_cache[key] = value
            return value

        # L3 cache check with decompression
        if compressed_value := self.l3_cache.get(key):
            value = await self.decompress(compressed_value)
            self.l2_cache[key] = value
            return value

        return None
```

### Vector Database Optimization
```python
class VectorDatabase:
    def __init__(self):
        self.index = FAISSIndex()
        self.connection_pool = AsyncConnectionPool(min_size=5, max_size=20)

    async def similarity_search(self, query_vector: np.ndarray, k: int = 10) -> List[Match]:
        # Optimized similarity search with batching
        async with self.connection_pool.acquire() as conn:
            results = await self.index.search(query_vector, k)
            return [self.hydrate_result(r) for r in results]

    async def batch_insert(self, vectors: List[Tuple[str, np.ndarray]]):
        # Batch insertion for efficiency
        batch_size = 1000
        for batch in self.chunked(vectors, batch_size):
            await self.index.add_batch(batch)
```

### Memory Management Patterns
```python
class MemoryPressureManager:
    def __init__(self):
        self.max_memory_mb = 500
        self.warning_threshold = 0.8
        self.critical_threshold = 0.9

    async def monitor_memory_usage(self):
        current_usage = self.get_memory_usage()
        usage_ratio = current_usage / self.max_memory_mb

        if usage_ratio > self.critical_threshold:
            await self.emergency_cleanup()
        elif usage_ratio > self.warning_threshold:
            await self.scheduled_cleanup()

    async def emergency_cleanup(self):
        # Aggressive memory cleanup
        await self.clear_l3_cache()
        await self.force_compression()
        await self.archive_old_memories()
```

## Claude Code Integration Patterns

### Hook Integration
```python
class ClaudeHookIntegration:
    async def on_session_start(self, session_context: dict):
        # Load relevant memories for session
        memories = await self.retrieve_session_memories(session_context)
        await self.prime_cache(memories)

    async def on_tool_usage(self, tool_name: str, context: dict, result: dict):
        # Learn from tool usage patterns
        memory = self.create_tool_memory(tool_name, context, result)
        await self.store_memory(memory)

        # Update success patterns
        await self.update_tool_patterns(tool_name, result)

    async def on_task_completion(self, task: dict, success: bool):
        # Store episodic memory of task
        episodic_memory = self.create_episodic_memory(task, success)
        await self.store_memory(episodic_memory)

        # Learn from success/failure patterns
        if success:
            await self.reinforce_success_pattern(task)
        else:
            await self.analyze_failure_pattern(task)
```

### Context Enrichment
```python
class ContextEnrichment:
    async def enrich_context(self, current_context: dict) -> dict:
        # Retrieve relevant historical context
        similar_memories = await self.find_similar_contexts(current_context)

        # Extract patterns and suggestions
        patterns = await self.extract_applicable_patterns(similar_memories)
        suggestions = await self.generate_suggestions(patterns, current_context)

        return {
            **current_context,
            'historical_context': similar_memories,
            'learned_patterns': patterns,
            'ai_suggestions': suggestions
        }
```

## Real-Time Monitoring Standards

### WebSocket Dashboard Implementation
```python
class MonitoringDashboard:
    def __init__(self):
        self.websocket_server = WebSocketServer(port=8080)
        self.metrics_interval = 1.0  # seconds

    async def start_monitoring(self):
        await self.websocket_server.start()
        asyncio.create_task(self.metrics_broadcast_loop())

    async def metrics_broadcast_loop(self):
        while True:
            metrics = await self.collect_metrics()
            await self.websocket_server.broadcast({
                'timestamp': time.time(),
                'metrics': metrics,
                'alerts': await self.check_alerts()
            })
            await asyncio.sleep(self.metrics_interval)
```

### Performance Metrics Collection
```python
class MetricsCollector:
    async def collect_metrics(self) -> Dict[str, Any]:
        return {
            'cache_metrics': {
                'l1_hit_rate': await self.calculate_l1_hit_rate(),
                'l2_hit_rate': await self.calculate_l2_hit_rate(),
                'l3_hit_rate': await self.calculate_l3_hit_rate(),
                'total_requests': self.total_cache_requests,
                'total_hits': self.total_cache_hits
            },
            'memory_metrics': {
                'current_usage_mb': self.get_memory_usage(),
                'compression_ratio': await self.calculate_compression_ratio(),
                'memory_pressure': self.calculate_memory_pressure()
            },
            'performance_metrics': {
                'avg_retrieval_latency': await self.calculate_avg_latency(),
                'p95_retrieval_latency': await self.calculate_p95_latency(),
                'db_query_time': await self.measure_db_performance()
            },
            'learning_metrics': {
                'pattern_accuracy': await self.calculate_pattern_accuracy(),
                'memories_processed': self.total_memories_processed,
                'learning_rate': self.calculate_learning_rate()
            }
        }
```

## Error Handling & Recovery

### Comprehensive Error Classes
```python
from enum import Enum

class MemorySystemError(Exception):
    pass

class CacheError(MemorySystemError):
    pass

class VectorDatabaseError(MemorySystemError):
    pass

class CompressionError(MemorySystemError):
    pass

class LearningError(MemorySystemError):
    pass

class PerformanceThresholdError(MemorySystemError):
    pass
```

### Graceful Degradation
```python
class GracefulDegradation:
    async def handle_cache_failure(self):
        # Fallback to direct database access
        logger.warning("Cache system failed, falling back to direct DB access")
        self.cache_enabled = False
        await self.notify_monitoring_system("CACHE_FAILURE")

    async def handle_vector_db_failure(self):
        # Fallback to keyword-based search
        logger.error("Vector database failed, using keyword fallback")
        self.vector_search_enabled = False
        await self.emergency_notification("VECTOR_DB_FAILURE")

    async def handle_learning_failure(self):
        # Disable learning features but maintain memory operations
        logger.error("Learning system failed, disabling pattern analysis")
        self.learning_enabled = False
        await self.emergency_notification("LEARNING_FAILURE")
```

## Production Deployment Checklist

### Pre-Deployment Validation
- [ ] Performance benchmarks exceed target metrics by 20%
- [ ] Memory usage stable under load for 48+ hours
- [ ] Cache hit rates consistently above targets
- [ ] Vector database indexes optimized and validated
- [ ] Compression ratios meeting efficiency targets
- [ ] Learning accuracy validated with production data
- [ ] Monitoring and alerting systems operational
- [ ] Graceful degradation tested under failure conditions

### Memory System Health Checks
```python
class HealthChecker:
    async def comprehensive_health_check(self) -> Dict[str, bool]:
        return {
            'cache_system': await self.check_cache_health(),
            'vector_database': await self.check_vector_db_health(),
            'compression_engine': await self.check_compression_health(),
            'learning_system': await self.check_learning_health(),
            'monitoring_system': await self.check_monitoring_health(),
            'memory_pressure': await self.check_memory_pressure(),
            'performance_metrics': await self.check_performance_metrics()
        }
```

## Integration Points

### With Trading System
- Learn trading patterns and optimization strategies
- Store successful trading workflows for replication
- Monitor trading system performance patterns
- Suggest optimizations based on historical data

### With Main Web Application
- Provide context-aware suggestions in UI
- Cache frequently accessed data for performance
- Learn user interaction patterns
- Optimize component rendering based on usage

### With Claude Commands
- `/memory-status` - Real-time system health and metrics
- `/auto-memory` - Automated memory optimization
- Pattern-based command suggestions

## Production Monitoring

### Key Performance Indicators
- **Cache Hit Rate**: Target >95%, Alert <90%
- **Retrieval Latency**: Target <10ms, Alert >50ms
- **Memory Usage**: Target <500MB, Alert >750MB
- **Learning Accuracy**: Target >80%, Alert <70%
- **System Availability**: Target 99.9%, Alert <99%

### Automated Alerting
```python
class AlertManager:
    def __init__(self):
        self.thresholds = {
            'cache_hit_rate': 0.90,
            'retrieval_latency_ms': 50,
            'memory_usage_mb': 750,
            'learning_accuracy': 0.70
        }

    async def check_and_alert(self, metrics: Dict[str, float]):
        for metric, value in metrics.items():
            if metric in self.thresholds:
                if value < self.thresholds[metric]:
                    await self.send_alert(f"{metric} below threshold: {value}")
```

Remember: This is a cognitive system that Claude Code relies on for intelligent behavior. **Performance, reliability, and accuracy are non-negotiable**. Every component must be production-ready and maintain enterprise-grade reliability.