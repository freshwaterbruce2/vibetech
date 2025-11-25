#!/usr/bin/env python3
"""
Production Observability Module
OpenTelemetry integration with Prometheus metrics and distributed tracing
2025 best practices for AI/LLM observability
"""

import asyncio
import functools
import logging
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime

# OpenTelemetry imports
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
from opentelemetry.instrumentation.asyncio import AsyncioInstrumentor
from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.semconv.trace import SpanAttributes
import structlog

# Prometheus client for custom metrics
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Set up structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

class ComponentType(Enum):
    """Component types for observability"""
    MEMORY_MANAGER = "memory_manager"
    VECTOR_DATABASE = "vector_database"
    CACHE_SYSTEM = "cache_system"
    AGENT_BRIDGE = "agent_bridge"
    LEARNING_BRIDGE = "learning_bridge"
    API_ENDPOINT = "api_endpoint"
    LLM_INTERACTION = "llm_interaction"

@dataclass
class TraceContext:
    """Trace context for correlation"""
    trace_id: str
    span_id: str
    correlation_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    operation: Optional[str] = None

class ObservabilityManager:
    """
    Production-grade observability manager with OpenTelemetry
    Provides tracing, metrics, and logging for the memory system
    """

    def __init__(self,
                 service_name: str = "enhanced-memory-system",
                 service_version: str = "1.0.0",
                 environment: str = "production",
                 enable_prometheus: bool = True,
                 enable_otlp: bool = False,
                 otlp_endpoint: str = "http://localhost:4317"):

        self.service_name = service_name
        self.service_version = service_version
        self.environment = environment

        # Initialize OpenTelemetry
        self._setup_tracing(enable_otlp, otlp_endpoint)
        self._setup_metrics(enable_prometheus, enable_otlp, otlp_endpoint)
        self._setup_instrumentation()

        # Custom metrics
        self._init_custom_metrics()

        # Trace and metric providers
        self.tracer = trace.get_tracer(__name__)
        self.meter = metrics.get_meter(__name__)

        # Start Prometheus server if enabled
        if enable_prometheus:
            start_http_server(8000)
            logger.info("Prometheus metrics server started on port 8000")

        logger.info("Observability manager initialized",
                   service=service_name, version=service_version, env=environment)

    def _setup_tracing(self, enable_otlp: bool, otlp_endpoint: str):
        """Setup distributed tracing with OpenTelemetry"""
        resource = Resource.create({
            ResourceAttributes.SERVICE_NAME: self.service_name,
            ResourceAttributes.SERVICE_VERSION: self.service_version,
            ResourceAttributes.DEPLOYMENT_ENVIRONMENT: self.environment,
        })

        trace.set_tracer_provider(TracerProvider(resource=resource))

        if enable_otlp:
            otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
            span_processor = BatchSpanProcessor(otlp_exporter)
            trace.get_tracer_provider().add_span_processor(span_processor)

    def _setup_metrics(self, enable_prometheus: bool, enable_otlp: bool, otlp_endpoint: str):
        """Setup metrics collection with Prometheus and/or OTLP"""
        resource = Resource.create({
            ResourceAttributes.SERVICE_NAME: self.service_name,
            ResourceAttributes.SERVICE_VERSION: self.service_version,
        })

        readers = []

        if enable_prometheus:
            readers.append(PrometheusMetricReader())

        if enable_otlp:
            otlp_reader = OTLPMetricExporter(endpoint=otlp_endpoint, insecure=True)
            readers.append(otlp_reader)

        metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=readers))

    def _setup_instrumentation(self):
        """Setup automatic instrumentation"""
        # Instrument common libraries
        AioHttpClientInstrumentor().instrument()
        AsyncioInstrumentor().instrument()
        SQLite3Instrumentor().instrument()

    def _init_custom_metrics(self):
        """Initialize custom Prometheus metrics"""
        # Memory operation metrics
        self.memory_operations_total = Counter(
            'memory_operations_total',
            'Total number of memory operations',
            ['operation_type', 'memory_type', 'status']
        )

        self.memory_operation_duration = Histogram(
            'memory_operation_duration_seconds',
            'Duration of memory operations',
            ['operation_type', 'memory_type'],
            buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
        )

        # Cache metrics
        self.cache_hits_total = Counter(
            'cache_hits_total',
            'Total number of cache hits',
            ['cache_level', 'cache_type']
        )

        self.cache_misses_total = Counter(
            'cache_misses_total',
            'Total number of cache misses',
            ['cache_level', 'cache_type']
        )

        # Vector database metrics
        self.vector_search_duration = Histogram(
            'vector_search_duration_seconds',
            'Duration of vector search operations',
            ['index_type', 'search_type'],
            buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
        )

        self.vector_embeddings_total = Counter(
            'vector_embeddings_total',
            'Total number of embeddings created',
            ['model_name', 'status']
        )

        # Agent interaction metrics
        self.agent_executions_total = Counter(
            'agent_executions_total',
            'Total number of agent executions',
            ['agent_name', 'status']
        )

        self.agent_execution_duration = Histogram(
            'agent_execution_duration_seconds',
            'Duration of agent executions',
            ['agent_name'],
            buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0]
        )

        # LLM interaction metrics (AI observability)
        self.llm_requests_total = Counter(
            'llm_requests_total',
            'Total number of LLM requests',
            ['model_name', 'operation_type', 'status']
        )

        self.llm_tokens_total = Counter(
            'llm_tokens_total',
            'Total number of tokens processed',
            ['model_name', 'token_type']  # input_tokens, output_tokens
        )

        self.llm_request_duration = Histogram(
            'llm_request_duration_seconds',
            'Duration of LLM requests',
            ['model_name', 'operation_type'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0]
        )

        # System health metrics
        self.system_health = Gauge(
            'system_health_status',
            'System health status (1=healthy, 0=unhealthy)',
            ['component']
        )

        self.active_connections = Gauge(
            'active_connections_total',
            'Number of active connections',
            ['connection_type']
        )

    def create_trace_context(self,
                           operation: str = None,
                           user_id: str = None,
                           session_id: str = None) -> TraceContext:
        """Create a new trace context"""
        current_span = trace.get_current_span()
        span_context = current_span.get_span_context()

        return TraceContext(
            trace_id=format(span_context.trace_id, '032x'),
            span_id=format(span_context.span_id, '016x'),
            correlation_id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            operation=operation
        )

    @asynccontextmanager
    async def trace_operation(self,
                            operation_name: str,
                            component: ComponentType,
                            attributes: Dict[str, Any] = None,
                            record_metrics: bool = True):
        """Context manager for tracing operations with metrics"""
        start_time = time.perf_counter()

        with self.tracer.start_as_current_span(
            operation_name,
            attributes={
                "component.type": component.value,
                "service.name": self.service_name,
                **(attributes or {})
            }
        ) as span:

            # Create structured logger with trace context
            trace_ctx = self.create_trace_context(operation_name)
            operation_logger = logger.bind(
                trace_id=trace_ctx.trace_id,
                span_id=trace_ctx.span_id,
                correlation_id=trace_ctx.correlation_id,
                operation=operation_name,
                component=component.value
            )

            try:
                operation_logger.info("Operation started")
                yield span, operation_logger

                # Record success metrics
                if record_metrics:
                    duration = time.perf_counter() - start_time
                    self._record_operation_metrics(operation_name, component, "success", duration)

                span.set_status(trace.Status(trace.StatusCode.OK))
                operation_logger.info("Operation completed successfully",
                                    duration_seconds=time.perf_counter() - start_time)

            except Exception as e:
                # Record error metrics
                if record_metrics:
                    duration = time.perf_counter() - start_time
                    self._record_operation_metrics(operation_name, component, "error", duration)

                span.record_exception(e)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                operation_logger.error("Operation failed",
                                     error=str(e),
                                     duration_seconds=time.perf_counter() - start_time)
                raise

    def _record_operation_metrics(self, operation: str, component: ComponentType,
                                status: str, duration: float):
        """Record operation metrics"""
        # Determine metric labels based on component
        if component == ComponentType.MEMORY_MANAGER:
            memory_type = "unknown"  # Could be extracted from attributes
            self.memory_operations_total.labels(
                operation_type=operation,
                memory_type=memory_type,
                status=status
            ).inc()
            self.memory_operation_duration.labels(
                operation_type=operation,
                memory_type=memory_type
            ).observe(duration)

        elif component == ComponentType.VECTOR_DATABASE:
            self.vector_search_duration.labels(
                index_type="unknown",
                search_type=operation
            ).observe(duration)

        elif component == ComponentType.AGENT_BRIDGE:
            agent_name = "unknown"  # Could be extracted from attributes
            self.agent_executions_total.labels(
                agent_name=agent_name,
                status=status
            ).inc()
            self.agent_execution_duration.labels(
                agent_name=agent_name
            ).observe(duration)

    def record_cache_hit(self, cache_level: str, cache_type: str):
        """Record cache hit metric"""
        self.cache_hits_total.labels(cache_level=cache_level, cache_type=cache_type).inc()

    def record_cache_miss(self, cache_level: str, cache_type: str):
        """Record cache miss metric"""
        self.cache_misses_total.labels(cache_level=cache_level, cache_type=cache_type).inc()

    def record_llm_interaction(self,
                             model_name: str,
                             operation_type: str,
                             status: str,
                             duration: float,
                             input_tokens: int = 0,
                             output_tokens: int = 0):
        """Record LLM interaction metrics for AI observability"""
        self.llm_requests_total.labels(
            model_name=model_name,
            operation_type=operation_type,
            status=status
        ).inc()

        self.llm_request_duration.labels(
            model_name=model_name,
            operation_type=operation_type
        ).observe(duration)

        if input_tokens > 0:
            self.llm_tokens_total.labels(
                model_name=model_name,
                token_type="input"
            ).inc(input_tokens)

        if output_tokens > 0:
            self.llm_tokens_total.labels(
                model_name=model_name,
                token_type="output"
            ).inc(output_tokens)

    def update_system_health(self, component: str, healthy: bool):
        """Update system health gauge"""
        self.system_health.labels(component=component).set(1 if healthy else 0)

    def update_active_connections(self, connection_type: str, count: int):
        """Update active connections gauge"""
        self.active_connections.labels(connection_type=connection_type).set(count)

    def trace_decorator(self,
                       operation_name: str = None,
                       component: ComponentType = ComponentType.API_ENDPOINT,
                       record_metrics: bool = True):
        """Decorator for automatic operation tracing"""
        def decorator(func: Callable):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"

            if asyncio.iscoroutinefunction(func):
                @functools.wraps(func)
                async def async_wrapper(*args, **kwargs):
                    async with self.trace_operation(op_name, component, record_metrics=record_metrics) as (span, logger):
                        # Add function arguments as span attributes
                        if args:
                            span.set_attribute("function.args_count", len(args))
                        if kwargs:
                            span.set_attribute("function.kwargs_count", len(kwargs))

                        result = await func(*args, **kwargs)

                        # Add result attributes if available
                        if hasattr(result, '__len__'):
                            span.set_attribute("result.size", len(result))

                        return result
                return async_wrapper
            else:
                @functools.wraps(func)
                def sync_wrapper(*args, **kwargs):
                    # For sync functions, run in asyncio context if available
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            # Can't use async context manager in sync function with running loop
                            with self.tracer.start_as_current_span(op_name) as span:
                                return func(*args, **kwargs)
                    except RuntimeError:
                        pass

                    # Fallback for sync execution
                    with self.tracer.start_as_current_span(op_name) as span:
                        return func(*args, **kwargs)

                return sync_wrapper

        return decorator

    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        return {
            "service": self.service_name,
            "version": self.service_version,
            "environment": self.environment,
            "timestamp": datetime.now().isoformat(),
            "tracing_enabled": True,
            "metrics_enabled": True,
            "uptime_seconds": time.perf_counter(),
        }

# Global observability instance
_observability_manager: Optional[ObservabilityManager] = None

def init_observability(service_name: str = "enhanced-memory-system", **kwargs) -> ObservabilityManager:
    """Initialize global observability manager"""
    global _observability_manager
    _observability_manager = ObservabilityManager(service_name=service_name, **kwargs)
    return _observability_manager

def get_observability() -> ObservabilityManager:
    """Get the global observability manager"""
    if _observability_manager is None:
        raise RuntimeError("Observability not initialized. Call init_observability() first.")
    return _observability_manager

# Convenience functions
def trace_operation(operation_name: str, component: ComponentType, **kwargs):
    """Convenience function for tracing operations"""
    return get_observability().trace_operation(operation_name, component, **kwargs)

def trace_decorator(operation_name: str = None, component: ComponentType = ComponentType.API_ENDPOINT, **kwargs):
    """Convenience decorator for tracing"""
    return get_observability().trace_decorator(operation_name, component, **kwargs)

# Example usage
async def main():
    """Test observability system"""
    # Initialize observability
    obs = init_observability("test-memory-system", environment="development")

    # Test tracing
    async with obs.trace_operation("test_operation", ComponentType.MEMORY_MANAGER) as (span, logger):
        logger.info("Performing test operation")
        await asyncio.sleep(0.1)
        span.set_attribute("test.value", "success")

    # Test decorator
    @obs.trace_decorator("decorated_function", ComponentType.VECTOR_DATABASE)
    async def test_function():
        await asyncio.sleep(0.05)
        return {"result": "success"}

    result = await test_function()
    print(f"Result: {result}")

    # Test metrics
    obs.record_cache_hit("memory", "query")
    obs.record_llm_interaction("gpt-4", "completion", "success", 1.5, 100, 50)

    # Check health
    health = obs.get_health_status()
    print(f"Health: {health}")

if __name__ == "__main__":
    asyncio.run(main())