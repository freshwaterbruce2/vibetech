#!/usr/bin/env python3
"""
Real-time Memory System Monitoring Service
Production-grade observability with alerting and health checks
September 2025 Architecture
"""

import asyncio
import json
import time
import psutil
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import websockets
from concurrent.futures import ThreadPoolExecutor
import sqlite3
import numpy as np
from collections import deque, defaultdict

from enhanced_memory_manager import EnhancedMemoryManager
from learning_bridge import LearningBridge

class AlertLevel(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class MetricType(Enum):
    """Types of metrics to monitor"""
    PERFORMANCE = "performance"
    AVAILABILITY = "availability"
    CAPACITY = "capacity"
    RELIABILITY = "reliability"
    SECURITY = "security"

@dataclass
class Alert:
    """Alert data structure"""
    id: str
    level: AlertLevel
    metric_type: MetricType
    title: str
    message: str
    value: float
    threshold: float
    timestamp: str
    resolved: bool = False
    resolved_at: Optional[str] = None

@dataclass
class HealthStatus:
    """System health status"""
    overall_status: str  # healthy, degraded, unhealthy, critical
    memory_system_status: str
    learning_system_status: str
    database_status: str
    filesystem_status: str
    last_check: str
    issues: List[str]
    recommendations: List[str]

@dataclass
class PerformanceMetrics:
    """Current performance metrics"""
    kv_cache_hit_rate: float
    avg_retrieval_latency_ms: float
    avg_storage_latency_ms: float
    memory_usage_mb: float
    active_connections: int
    total_memories: int
    requests_per_minute: float
    error_rate: float
    system_cpu_percent: float
    system_memory_percent: float
    disk_usage_percent: float

class MonitoringService:
    """Production-grade monitoring service"""

    def __init__(self, memory_manager: EnhancedMemoryManager, learning_bridge: LearningBridge):
        self.memory_manager = memory_manager
        self.learning_bridge = learning_bridge
        self.learning_conn = memory_manager.learning_conn

        # Monitoring configuration
        self.config = self._load_monitoring_config()

        # Real-time metrics storage
        self.metrics_buffer = deque(maxlen=1000)  # Store last 1000 metrics
        self.alert_buffer = deque(maxlen=100)    # Store last 100 alerts
        self.health_history = deque(maxlen=24)   # Store last 24 health checks

        # Performance tracking
        self.request_counter = defaultdict(int)
        self.error_counter = defaultdict(int)
        self.latency_tracker = defaultdict(list)

        # Alert management
        self.active_alerts = {}
        self.alert_handlers = {}
        self.notification_channels = []

        # Monitoring state
        self.is_monitoring = False
        self.monitoring_thread = None
        self.websocket_server = None

        # Setup logging
        self.logger = self._setup_monitoring_logger()

        # Initialize monitoring database
        self._init_monitoring_database()

        # Register default alert handlers
        self._register_default_handlers()

    def _load_monitoring_config(self) -> Dict[str, Any]:
        """Load monitoring configuration"""
        return {
            "monitoring": {
                "interval_seconds": 30,
                "health_check_interval_seconds": 60,
                "alert_cooldown_seconds": 300,
                "metrics_retention_hours": 24,
                "websocket_port": 8765
            },
            "thresholds": {
                "kv_cache_hit_rate_warning": 0.70,
                "kv_cache_hit_rate_critical": 0.50,
                "retrieval_latency_warning_ms": 200,
                "retrieval_latency_critical_ms": 500,
                "storage_latency_warning_ms": 500,
                "storage_latency_critical_ms": 1000,
                "memory_usage_warning_mb": 500,
                "memory_usage_critical_mb": 1000,
                "error_rate_warning": 0.05,
                "error_rate_critical": 0.10,
                "cpu_usage_warning": 80,
                "cpu_usage_critical": 95,
                "memory_usage_warning_percent": 85,
                "memory_usage_critical_percent": 95,
                "disk_usage_warning_percent": 85,
                "disk_usage_critical_percent": 95
            },
            "notifications": {
                "email_enabled": False,
                "webhook_enabled": True,
                "log_enabled": True,
                "console_enabled": True
            }
        }

    def _setup_monitoring_logger(self) -> logging.Logger:
        """Setup dedicated monitoring logger"""
        logger = logging.getLogger("monitoring_service")
        logger.setLevel(logging.INFO)

        # Create logs directory
        log_dir = Path("C:/dev/projects/active/web-apps/memory-bank/logs")
        log_dir.mkdir(parents=True, exist_ok=True)

        # File handler for monitoring logs
        file_handler = logging.FileHandler(log_dir / "monitoring.log")
        file_handler.setLevel(logging.INFO)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)

        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        return logger

    def _init_monitoring_database(self):
        """Initialize monitoring database tables"""
        try:
            # Real-time metrics table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    kv_cache_hit_rate REAL,
                    avg_retrieval_latency_ms REAL,
                    avg_storage_latency_ms REAL,
                    memory_usage_mb REAL,
                    active_connections INTEGER,
                    total_memories INTEGER,
                    requests_per_minute REAL,
                    error_rate REAL,
                    system_cpu_percent REAL,
                    system_memory_percent REAL,
                    disk_usage_percent REAL,
                    overall_health_score REAL
                )
            """)

            # Alerts table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_alerts (
                    id TEXT PRIMARY KEY,
                    level TEXT NOT NULL,
                    metric_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT,
                    value REAL,
                    threshold REAL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    resolved BOOLEAN DEFAULT 0,
                    resolved_at TIMESTAMP,
                    resolution_notes TEXT
                )
            """)

            # Health checks table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_health_checks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    overall_status TEXT,
                    memory_system_status TEXT,
                    learning_system_status TEXT,
                    database_status TEXT,
                    filesystem_status TEXT,
                    issues TEXT,
                    recommendations TEXT,
                    health_score REAL
                )
            """)

            # Performance baselines table
            self.learning_conn.execute("""
                CREATE TABLE IF NOT EXISTS monitoring_baselines (
                    metric_name TEXT PRIMARY KEY,
                    baseline_value REAL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    confidence_level REAL,
                    sample_size INTEGER
                )
            """)

            self.learning_conn.commit()
            self.logger.info("Monitoring database initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize monitoring database: {e}")

    def _register_default_handlers(self):
        """Register default alert handlers"""
        self.register_alert_handler(AlertLevel.CRITICAL, self._handle_critical_alert)
        self.register_alert_handler(AlertLevel.ERROR, self._handle_error_alert)
        self.register_alert_handler(AlertLevel.WARNING, self._handle_warning_alert)
        self.register_alert_handler(AlertLevel.INFO, self._handle_info_alert)

    async def start_monitoring(self):
        """Start the monitoring service"""
        if self.is_monitoring:
            self.logger.warning("Monitoring service already running")
            return

        self.is_monitoring = True
        self.logger.info("Starting monitoring service")

        # Start monitoring thread
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()

        # Start WebSocket server for real-time updates
        await self._start_websocket_server()

        self.logger.info("Monitoring service started successfully")

    async def stop_monitoring(self):
        """Stop the monitoring service"""
        self.is_monitoring = False

        if self.websocket_server:
            self.websocket_server.close()
            await self.websocket_server.wait_closed()

        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)

        self.logger.info("Monitoring service stopped")

    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                # Collect metrics
                metrics = self._collect_performance_metrics()
                self.metrics_buffer.append(metrics)

                # Store metrics in database
                self._store_metrics(metrics)

                # Check thresholds and generate alerts
                self._check_thresholds(metrics)

                # Broadcast metrics to WebSocket clients
                asyncio.run(self._broadcast_metrics(metrics))

                # Perform health check periodically
                if time.time() % self.config["monitoring"]["health_check_interval_seconds"] < 30:
                    health_status = self._perform_health_check()
                    self.health_history.append(health_status)
                    self._store_health_status(health_status)

                # Wait for next interval
                time.sleep(self.config["monitoring"]["interval_seconds"])

            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(10)  # Wait before retrying

    def _collect_performance_metrics(self) -> PerformanceMetrics:
        """Collect current performance metrics"""
        try:
            # Get memory manager performance
            memory_report = self.memory_manager.get_performance_report()

            # Calculate request rate (simplified)
            current_minute = int(time.time() / 60)
            requests_per_minute = self.request_counter.get(current_minute, 0)

            # Calculate error rate
            total_requests = sum(self.request_counter.values())
            total_errors = sum(self.error_counter.values())
            error_rate = (total_errors / max(total_requests, 1)) if total_requests > 0 else 0.0

            # System metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_info = psutil.virtual_memory()
            disk_info = psutil.disk_usage('/')

            # Memory system metrics
            kv_hit_rate = float(memory_report["kv_cache_hit_rate"].strip('%')) / 100.0
            avg_retrieval = memory_report["avg_retrieval_ms"]
            avg_storage = memory_report["avg_storage_ms"]
            memory_usage = memory_report["memory_stats"]["total_size_mb"]
            total_memories = memory_report["memory_stats"]["total_memories"]

            metrics = PerformanceMetrics(
                kv_cache_hit_rate=kv_hit_rate,
                avg_retrieval_latency_ms=avg_retrieval,
                avg_storage_latency_ms=avg_storage,
                memory_usage_mb=memory_usage,
                active_connections=1,  # Simplified
                total_memories=total_memories,
                requests_per_minute=requests_per_minute,
                error_rate=error_rate,
                system_cpu_percent=cpu_percent,
                system_memory_percent=memory_info.percent,
                disk_usage_percent=disk_info.percent
            )

            return metrics

        except Exception as e:
            self.logger.error(f"Failed to collect performance metrics: {e}")
            # Return default metrics on error
            return PerformanceMetrics(0.0, 0.0, 0.0, 0.0, 0, 0, 0.0, 1.0, 0.0, 0.0, 0.0)

    def _store_metrics(self, metrics: PerformanceMetrics):
        """Store metrics in database"""
        try:
            health_score = self._calculate_health_score(metrics)

            self.learning_conn.execute("""
                INSERT INTO monitoring_metrics
                (kv_cache_hit_rate, avg_retrieval_latency_ms, avg_storage_latency_ms,
                 memory_usage_mb, active_connections, total_memories, requests_per_minute,
                 error_rate, system_cpu_percent, system_memory_percent, disk_usage_percent,
                 overall_health_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metrics.kv_cache_hit_rate,
                metrics.avg_retrieval_latency_ms,
                metrics.avg_storage_latency_ms,
                metrics.memory_usage_mb,
                metrics.active_connections,
                metrics.total_memories,
                metrics.requests_per_minute,
                metrics.error_rate,
                metrics.system_cpu_percent,
                metrics.system_memory_percent,
                metrics.disk_usage_percent,
                health_score
            ))

            self.learning_conn.commit()

        except Exception as e:
            self.logger.error(f"Failed to store metrics: {e}")

    def _check_thresholds(self, metrics: PerformanceMetrics):
        """Check metrics against thresholds and generate alerts"""
        thresholds = self.config["thresholds"]

        # KV Cache Hit Rate
        if metrics.kv_cache_hit_rate < thresholds["kv_cache_hit_rate_critical"]:
            self._create_alert(
                AlertLevel.CRITICAL, MetricType.PERFORMANCE,
                "KV Cache Hit Rate Critical",
                f"Cache hit rate {metrics.kv_cache_hit_rate:.2%} below critical threshold {thresholds['kv_cache_hit_rate_critical']:.2%}",
                metrics.kv_cache_hit_rate, thresholds["kv_cache_hit_rate_critical"]
            )
        elif metrics.kv_cache_hit_rate < thresholds["kv_cache_hit_rate_warning"]:
            self._create_alert(
                AlertLevel.WARNING, MetricType.PERFORMANCE,
                "KV Cache Hit Rate Low",
                f"Cache hit rate {metrics.kv_cache_hit_rate:.2%} below warning threshold {thresholds['kv_cache_hit_rate_warning']:.2%}",
                metrics.kv_cache_hit_rate, thresholds["kv_cache_hit_rate_warning"]
            )

        # Retrieval Latency
        if metrics.avg_retrieval_latency_ms > thresholds["retrieval_latency_critical_ms"]:
            self._create_alert(
                AlertLevel.CRITICAL, MetricType.PERFORMANCE,
                "Retrieval Latency Critical",
                f"Average retrieval latency {metrics.avg_retrieval_latency_ms:.2f}ms exceeds critical threshold",
                metrics.avg_retrieval_latency_ms, thresholds["retrieval_latency_critical_ms"]
            )
        elif metrics.avg_retrieval_latency_ms > thresholds["retrieval_latency_warning_ms"]:
            self._create_alert(
                AlertLevel.WARNING, MetricType.PERFORMANCE,
                "Retrieval Latency High",
                f"Average retrieval latency {metrics.avg_retrieval_latency_ms:.2f}ms exceeds warning threshold",
                metrics.avg_retrieval_latency_ms, thresholds["retrieval_latency_warning_ms"]
            )

        # Memory Usage
        if metrics.memory_usage_mb > thresholds["memory_usage_critical_mb"]:
            self._create_alert(
                AlertLevel.CRITICAL, MetricType.CAPACITY,
                "Memory Usage Critical",
                f"Memory usage {metrics.memory_usage_mb:.2f}MB exceeds critical threshold",
                metrics.memory_usage_mb, thresholds["memory_usage_critical_mb"]
            )

        # Error Rate
        if metrics.error_rate > thresholds["error_rate_critical"]:
            self._create_alert(
                AlertLevel.CRITICAL, MetricType.RELIABILITY,
                "Error Rate Critical",
                f"Error rate {metrics.error_rate:.2%} exceeds critical threshold",
                metrics.error_rate, thresholds["error_rate_critical"]
            )

        # System CPU
        if metrics.system_cpu_percent > thresholds["cpu_usage_critical"]:
            self._create_alert(
                AlertLevel.CRITICAL, MetricType.CAPACITY,
                "CPU Usage Critical",
                f"CPU usage {metrics.system_cpu_percent:.1f}% exceeds critical threshold",
                metrics.system_cpu_percent, thresholds["cpu_usage_critical"]
            )

        # System Memory
        if metrics.system_memory_percent > thresholds["memory_usage_critical_percent"]:
            self._create_alert(
                AlertLevel.CRITICAL, MetricType.CAPACITY,
                "System Memory Critical",
                f"System memory usage {metrics.system_memory_percent:.1f}% exceeds critical threshold",
                metrics.system_memory_percent, thresholds["memory_usage_critical_percent"]
            )

    def _create_alert(self, level: AlertLevel, metric_type: MetricType,
                     title: str, message: str, value: float, threshold: float):
        """Create and process a new alert"""
        alert_id = f"{metric_type.value}_{title.replace(' ', '_').lower()}_{int(time.time())}"

        # Check if similar alert is already active (prevent spam)
        similar_active = any(
            alert.title == title and not alert.resolved
            for alert in self.active_alerts.values()
        )

        if similar_active:
            return  # Don't create duplicate alerts

        alert = Alert(
            id=alert_id,
            level=level,
            metric_type=metric_type,
            title=title,
            message=message,
            value=value,
            threshold=threshold,
            timestamp=datetime.now().isoformat()
        )

        # Store alert
        self.active_alerts[alert_id] = alert
        self.alert_buffer.append(alert)

        # Store in database
        self._store_alert(alert)

        # Process alert through handlers
        asyncio.run(self._process_alert(alert))

        self.logger.warning(f"Alert created: {alert.title} - {alert.message}")

    def _store_alert(self, alert: Alert):
        """Store alert in database"""
        try:
            self.learning_conn.execute("""
                INSERT INTO monitoring_alerts
                (id, level, metric_type, title, message, value, threshold, timestamp, resolved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert.id, alert.level.value, alert.metric_type.value,
                alert.title, alert.message, alert.value, alert.threshold,
                alert.timestamp, alert.resolved
            ))
            self.learning_conn.commit()

        except Exception as e:
            self.logger.error(f"Failed to store alert: {e}")

    async def _process_alert(self, alert: Alert):
        """Process alert through registered handlers"""
        try:
            handler = self.alert_handlers.get(alert.level)
            if handler:
                await handler(alert)

            # Send to notification channels
            for channel in self.notification_channels:
                await channel(alert)

        except Exception as e:
            self.logger.error(f"Failed to process alert {alert.id}: {e}")

    def _perform_health_check(self) -> HealthStatus:
        """Perform comprehensive health check"""
        issues = []
        recommendations = []
        statuses = {}

        # Memory system health
        try:
            memory_report = self.memory_manager.get_performance_report()
            hit_rate = float(memory_report["kv_cache_hit_rate"].strip('%')) / 100.0

            if hit_rate >= 0.85:
                statuses['memory_system'] = 'healthy'
            elif hit_rate >= 0.70:
                statuses['memory_system'] = 'degraded'
                issues.append("KV cache hit rate below optimal")
                recommendations.append("Review cache sizing and access patterns")
            else:
                statuses['memory_system'] = 'unhealthy'
                issues.append("KV cache hit rate critically low")
                recommendations.append("Urgent: Investigate cache performance issues")

        except Exception as e:
            statuses['memory_system'] = 'critical'
            issues.append(f"Memory system check failed: {str(e)}")

        # Learning system health
        try:
            learning_metrics = self.learning_bridge.get_learning_metrics()
            if learning_metrics.total_patterns > 0:
                statuses['learning_system'] = 'healthy'
            else:
                statuses['learning_system'] = 'degraded'
                issues.append("No learning patterns discovered")
                recommendations.append("Run pattern analysis to populate learning system")

        except Exception as e:
            statuses['learning_system'] = 'critical'
            issues.append(f"Learning system check failed: {str(e)}")

        # Database health
        try:
            self.learning_conn.execute("SELECT 1").fetchone()
            statuses['database'] = 'healthy'
        except Exception as e:
            statuses['database'] = 'critical'
            issues.append(f"Database connection failed: {str(e)}")

        # Filesystem health
        try:
            memory_path = Path("C:/dev/projects/active/web-apps/memory-bank")
            bulk_path = Path("D:/dev-memory/claude-code")

            if memory_path.exists() and bulk_path.exists():
                statuses['filesystem'] = 'healthy'
            else:
                statuses['filesystem'] = 'degraded'
                issues.append("Memory storage directories not fully accessible")

        except Exception as e:
            statuses['filesystem'] = 'critical'
            issues.append(f"Filesystem check failed: {str(e)}")

        # Determine overall status
        status_values = list(statuses.values())
        if 'critical' in status_values:
            overall_status = 'critical'
        elif 'unhealthy' in status_values:
            overall_status = 'unhealthy'
        elif 'degraded' in status_values:
            overall_status = 'degraded'
        else:
            overall_status = 'healthy'

        return HealthStatus(
            overall_status=overall_status,
            memory_system_status=statuses.get('memory_system', 'unknown'),
            learning_system_status=statuses.get('learning_system', 'unknown'),
            database_status=statuses.get('database', 'unknown'),
            filesystem_status=statuses.get('filesystem', 'unknown'),
            last_check=datetime.now().isoformat(),
            issues=issues,
            recommendations=recommendations
        )

    def _store_health_status(self, health_status: HealthStatus):
        """Store health status in database"""
        try:
            health_score = self._calculate_overall_health_score(health_status)

            self.learning_conn.execute("""
                INSERT INTO monitoring_health_checks
                (overall_status, memory_system_status, learning_system_status,
                 database_status, filesystem_status, issues, recommendations, health_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                health_status.overall_status,
                health_status.memory_system_status,
                health_status.learning_system_status,
                health_status.database_status,
                health_status.filesystem_status,
                json.dumps(health_status.issues),
                json.dumps(health_status.recommendations),
                health_score
            ))

            self.learning_conn.commit()

        except Exception as e:
            self.logger.error(f"Failed to store health status: {e}")

    def _calculate_health_score(self, metrics: PerformanceMetrics) -> float:
        """Calculate overall health score from metrics"""
        scores = []

        # Cache performance (30% weight)
        cache_score = min(metrics.kv_cache_hit_rate * 1.2, 1.0)
        scores.append(cache_score * 0.3)

        # Latency performance (25% weight)
        latency_score = max(0, 1.0 - (metrics.avg_retrieval_latency_ms / 500.0))
        scores.append(latency_score * 0.25)

        # Error rate (20% weight)
        error_score = max(0, 1.0 - (metrics.error_rate * 10))
        scores.append(error_score * 0.2)

        # System resource usage (25% weight)
        cpu_score = max(0, 1.0 - (metrics.system_cpu_percent / 100.0))
        memory_score = max(0, 1.0 - (metrics.system_memory_percent / 100.0))
        resource_score = (cpu_score + memory_score) / 2
        scores.append(resource_score * 0.25)

        return sum(scores)

    def _calculate_overall_health_score(self, health_status: HealthStatus) -> float:
        """Calculate overall health score from health status"""
        status_scores = {
            'healthy': 1.0,
            'degraded': 0.7,
            'unhealthy': 0.4,
            'critical': 0.1,
            'unknown': 0.5
        }

        scores = [
            status_scores.get(health_status.memory_system_status, 0.5) * 0.4,  # 40% weight
            status_scores.get(health_status.learning_system_status, 0.5) * 0.3,  # 30% weight
            status_scores.get(health_status.database_status, 0.5) * 0.2,         # 20% weight
            status_scores.get(health_status.filesystem_status, 0.5) * 0.1        # 10% weight
        ]

        return sum(scores)

    async def _start_websocket_server(self):
        """Start WebSocket server for real-time monitoring"""
        try:
            port = self.config["monitoring"]["websocket_port"]
            self.websocket_server = await websockets.serve(
                self._websocket_handler,
                "localhost",
                port
            )
            self.logger.info(f"WebSocket monitoring server started on port {port}")

        except Exception as e:
            self.logger.error(f"Failed to start WebSocket server: {e}")

    async def _websocket_handler(self, websocket, path):
        """Handle WebSocket connections"""
        self.logger.info(f"New WebSocket connection from {websocket.remote_address}")

        try:
            # Send initial data
            if self.metrics_buffer:
                latest_metrics = self.metrics_buffer[-1]
                await websocket.send(json.dumps({
                    'type': 'metrics',
                    'data': asdict(latest_metrics)
                }))

            # Keep connection alive and send updates
            async for message in websocket:
                # Handle client messages (e.g., requests for specific data)
                try:
                    request = json.loads(message)
                    response = await self._handle_websocket_request(request)
                    if response:
                        await websocket.send(json.dumps(response))
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Invalid JSON'
                    }))

        except websockets.exceptions.ConnectionClosed:
            self.logger.info("WebSocket connection closed")
        except Exception as e:
            self.logger.error(f"WebSocket error: {e}")

    async def _handle_websocket_request(self, request: Dict) -> Optional[Dict]:
        """Handle WebSocket client requests"""
        req_type = request.get('type')

        if req_type == 'get_metrics':
            if self.metrics_buffer:
                return {
                    'type': 'metrics',
                    'data': asdict(self.metrics_buffer[-1])
                }

        elif req_type == 'get_alerts':
            active_alerts = [asdict(alert) for alert in self.active_alerts.values()
                           if not alert.resolved]
            return {
                'type': 'alerts',
                'data': active_alerts
            }

        elif req_type == 'get_health':
            if self.health_history:
                return {
                    'type': 'health',
                    'data': asdict(self.health_history[-1])
                }

        return None

    async def _broadcast_metrics(self, metrics: PerformanceMetrics):
        """Broadcast metrics to all WebSocket clients"""
        if not hasattr(self, 'websocket_server') or not self.websocket_server:
            return

        message = json.dumps({
            'type': 'metrics_update',
            'data': asdict(metrics),
            'timestamp': datetime.now().isoformat()
        })

        # Note: In a real implementation, you'd maintain a list of connected clients
        # and broadcast to all of them. This is simplified.

    # Alert handlers
    async def _handle_critical_alert(self, alert: Alert):
        """Handle critical alerts"""
        self.logger.critical(f"CRITICAL ALERT: {alert.title} - {alert.message}")

    async def _handle_error_alert(self, alert: Alert):
        """Handle error alerts"""
        self.logger.error(f"ERROR ALERT: {alert.title} - {alert.message}")

    async def _handle_warning_alert(self, alert: Alert):
        """Handle warning alerts"""
        self.logger.warning(f"WARNING ALERT: {alert.title} - {alert.message}")

    async def _handle_info_alert(self, alert: Alert):
        """Handle info alerts"""
        self.logger.info(f"INFO ALERT: {alert.title} - {alert.message}")

    # Public API methods
    def register_alert_handler(self, level: AlertLevel, handler: Callable):
        """Register alert handler for specific level"""
        self.alert_handlers[level] = handler

    def add_notification_channel(self, channel: Callable):
        """Add notification channel"""
        self.notification_channels.append(channel)

    def track_request(self):
        """Track a request (for metrics)"""
        current_minute = int(time.time() / 60)
        self.request_counter[current_minute] += 1

    def track_error(self):
        """Track an error (for metrics)"""
        current_minute = int(time.time() / 60)
        self.error_counter[current_minute] += 1

    def get_current_metrics(self) -> Optional[PerformanceMetrics]:
        """Get current performance metrics"""
        return self.metrics_buffer[-1] if self.metrics_buffer else None

    def get_current_health(self) -> Optional[HealthStatus]:
        """Get current health status"""
        return self.health_history[-1] if self.health_history else None

    def get_active_alerts(self) -> List[Alert]:
        """Get active alerts"""
        return [alert for alert in self.active_alerts.values() if not alert.resolved]

    def resolve_alert(self, alert_id: str, resolution_notes: str = ""):
        """Resolve an alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            alert.resolved_at = datetime.now().isoformat()

            # Update in database
            try:
                self.learning_conn.execute("""
                    UPDATE monitoring_alerts
                    SET resolved = 1, resolved_at = ?, resolution_notes = ?
                    WHERE id = ?
                """, (alert.resolved_at, resolution_notes, alert_id))
                self.learning_conn.commit()

                self.logger.info(f"Alert {alert_id} resolved: {resolution_notes}")

            except Exception as e:
                self.logger.error(f"Failed to update resolved alert: {e}")

    def get_monitoring_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        return {
            'current_metrics': asdict(self.get_current_metrics()) if self.get_current_metrics() else None,
            'current_health': asdict(self.get_current_health()) if self.get_current_health() else None,
            'active_alerts': [asdict(alert) for alert in self.get_active_alerts()],
            'metrics_history': [asdict(metrics) for metrics in list(self.metrics_buffer)[-20:]],  # Last 20
            'health_history': [asdict(health) for health in list(self.health_history)[-10:]],     # Last 10
            'system_info': {
                'monitoring_uptime': time.time() - getattr(self, '_start_time', time.time()),
                'total_alerts_generated': len(self.alert_buffer),
                'resolved_alerts': len([a for a in self.alert_buffer if a.resolved])
            }
        }


# CLI interface for testing
async def main():
    """Test the monitoring service"""
    from enhanced_memory_manager import EnhancedMemoryManager
    from learning_bridge import LearningBridge

    # Initialize dependencies
    memory_manager = EnhancedMemoryManager()
    learning_bridge = LearningBridge(memory_manager)

    # Create monitoring service
    monitoring = MonitoringService(memory_manager, learning_bridge)

    print("Starting monitoring service test...")

    # Start monitoring
    await monitoring.start_monitoring()

    # Let it run for a bit
    await asyncio.sleep(5)

    # Get current status
    metrics = monitoring.get_current_metrics()
    health = monitoring.get_current_health()
    alerts = monitoring.get_active_alerts()

    print(f"Current metrics: {metrics}")
    print(f"Current health: {health}")
    print(f"Active alerts: {len(alerts)}")

    # Get dashboard data
    dashboard = monitoring.get_monitoring_dashboard_data()
    print(f"Dashboard data keys: {list(dashboard.keys())}")

    # Stop monitoring
    await monitoring.stop_monitoring()

    print("Monitoring service test complete")


if __name__ == "__main__":
    asyncio.run(main())