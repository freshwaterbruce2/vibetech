#!/usr/bin/env python3
"""
Production runner for Data Processing Pipeline
Handles scheduling, monitoring, and error recovery
"""

import os
import sys
import yaml
import json
import logging
import signal
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import schedule
import redis
import psutil
from dataclasses import asdict

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from pipeline_integrated import (
    DataPipeline,
    PipelineConfig,
    TransformConfig
)


class ProductionPipelineRunner:
    """Production-grade pipeline runner with monitoring and recovery."""

    def __init__(self, config_path: str = "config/production.yaml"):
        """Initialize the production runner."""
        self.config_path = config_path
        self.config = self._load_config()
        self.setup_logging()
        self.setup_monitoring()
        self.setup_signal_handlers()
        self.running = True
        self.current_pipeline = None

    def _load_config(self) -> Dict[str, Any]:
        """Load production configuration."""
        config_path = Path(self.config_path)
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Substitute environment variables
        config_str = yaml.dump(config)
        for key, value in os.environ.items():
            config_str = config_str.replace(f"${{{key}}}", value)

        return yaml.safe_load(config_str)

    def setup_logging(self):
        """Configure production logging."""
        log_level = self.config['monitoring'].get('log_level', 'INFO')
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

        # Configure root logger
        logging.basicConfig(
            level=getattr(logging, log_level),
            format=log_format,
            handlers=[
                logging.FileHandler(f"logs/pipeline_{datetime.now():%Y%m%d}.log"),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info("Production pipeline runner initialized")

    def setup_monitoring(self):
        """Setup monitoring connections."""
        try:
            # Connect to Redis for metrics
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                decode_responses=True
            )
            self.redis_client.ping()
            self.logger.info("Connected to Redis for metrics")
        except Exception as e:
            self.logger.warning(f"Redis connection failed: {e}. Metrics will be logged only.")
            self.redis_client = None

        # Initialize metrics
        self.metrics = {
            'pipelines_run': 0,
            'pipelines_successful': 0,
            'pipelines_failed': 0,
            'total_rows_processed': 0,
            'total_execution_time': 0,
            'last_run': None,
            'errors': []
        }

    def setup_signal_handlers(self):
        """Setup graceful shutdown handlers."""
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}. Shutting down gracefully...")
            self.running = False
            if self.current_pipeline:
                self.logger.info("Waiting for current pipeline to complete...")

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    def run_pipeline(self, pipeline_name: str = "main") -> Dict[str, Any]:
        """Run a single pipeline execution."""
        self.logger.info(f"Starting pipeline: {pipeline_name}")
        self.current_pipeline = pipeline_name
        start_time = time.time()

        try:
            # Create pipeline configuration
            pipeline_config = self._create_pipeline_config(pipeline_name)
            transform_config = self._create_transform_config()

            # Initialize pipeline
            pipeline = DataPipeline(pipeline_config)

            # Execute with monitoring
            result = self._execute_with_monitoring(pipeline, transform_config)

            # Update metrics
            self._update_metrics(result, time.time() - start_time)

            # Send alerts if needed
            self._check_alerts(result)

            self.logger.info(f"Pipeline {pipeline_name} completed successfully")
            return result

        except Exception as e:
            self.logger.error(f"Pipeline {pipeline_name} failed: {e}", exc_info=True)
            self.metrics['pipelines_failed'] += 1
            self.metrics['errors'].append({
                'timestamp': datetime.now().isoformat(),
                'pipeline': pipeline_name,
                'error': str(e)
            })

            # Send failure alert
            self._send_alert('failure', f"Pipeline {pipeline_name} failed: {e}")

            # Retry if configured
            if self.config['pipeline']['processing'].get('retry_attempts', 0) > 0:
                self.logger.info("Scheduling retry...")
                time.sleep(self.config['pipeline']['processing']['retry_delay_seconds'])
                return self.run_pipeline(pipeline_name)

            raise

        finally:
            self.current_pipeline = None

    def _create_pipeline_config(self, pipeline_name: str) -> PipelineConfig:
        """Create pipeline configuration from production config."""
        config = PipelineConfig(
            name=f"{self.config['pipeline']['name']} - {pipeline_name}",
            source_path="data/input.csv",  # This would be dynamic in production
            output_path=f"output/{pipeline_name}_{datetime.now():%Y%m%d_%H%M%S}.csv",
            chunk_size=self.config['pipeline']['processing']['chunk_size'],
            enable_monitoring=True,
            enable_validation=True
        )
        return config

    def _create_transform_config(self) -> TransformConfig:
        """Create transformation configuration."""
        transform_settings = self.config['transformation']
        return TransformConfig(
            handle_missing=transform_settings['handle_missing'],
            remove_outliers=transform_settings['remove_outliers'],
            scale_numeric=transform_settings['scaling']['enabled'],
            encode_categorical=transform_settings['encoding']['enabled']
        )

    def _execute_with_monitoring(
        self,
        pipeline: DataPipeline,
        transform_config: TransformConfig
    ) -> Dict[str, Any]:
        """Execute pipeline with resource monitoring."""
        # Monitor resources during execution
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024

        # Check resource limits
        memory_limit = self.config['pipeline']['processing']['memory_limit_mb']
        if initial_memory > memory_limit * 0.8:
            self.logger.warning(f"High memory usage before pipeline: {initial_memory:.1f}MB")

        # Execute pipeline
        result = pipeline.execute(transform_config=transform_config)

        # Check resource usage
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_delta = final_memory - initial_memory

        if final_memory > memory_limit:
            self._send_alert('warning', f"Memory limit exceeded: {final_memory:.1f}MB")

        # Add resource metrics to result
        result['resource_metrics'] = {
            'memory_initial_mb': initial_memory,
            'memory_final_mb': final_memory,
            'memory_delta_mb': memory_delta,
            'cpu_percent': process.cpu_percent()
        }

        return result

    def _update_metrics(self, result: Dict[str, Any], execution_time: float):
        """Update metrics with pipeline results."""
        self.metrics['pipelines_run'] += 1

        if result.get('success'):
            self.metrics['pipelines_successful'] += 1
            self.metrics['total_rows_processed'] += result.get('rows_processed', 0)

        self.metrics['total_execution_time'] += execution_time
        self.metrics['last_run'] = datetime.now().isoformat()

        # Store in Redis if available
        if self.redis_client:
            try:
                self.redis_client.hset('pipeline:metrics', mapping={
                    'pipelines_run': self.metrics['pipelines_run'],
                    'pipelines_successful': self.metrics['pipelines_successful'],
                    'pipelines_failed': self.metrics['pipelines_failed'],
                    'total_rows_processed': self.metrics['total_rows_processed'],
                    'last_run': self.metrics['last_run']
                })

                # Store detailed result
                result_key = f"pipeline:result:{datetime.now():%Y%m%d_%H%M%S}"
                self.redis_client.setex(
                    result_key,
                    86400,  # Expire after 24 hours
                    json.dumps(result, default=str)
                )
            except Exception as e:
                self.logger.error(f"Failed to store metrics in Redis: {e}")

    def _check_alerts(self, result: Dict[str, Any]):
        """Check if any alerts should be triggered."""
        thresholds = self.config['monitoring']['thresholds']

        # Check error rate
        if self.metrics['pipelines_run'] > 0:
            error_rate = self.metrics['pipelines_failed'] / self.metrics['pipelines_run']
            if error_rate > thresholds['error_rate']:
                self._send_alert('warning', f"High error rate: {error_rate:.2%}")

        # Check processing time
        if result.get('execution_time', 0) > thresholds['processing_time']:
            self._send_alert('warning', f"Slow processing: {result['execution_time']:.1f}s")

        # Check memory usage
        if result.get('resource_metrics', {}).get('memory_final_mb', 0) > thresholds['memory_usage_mb']:
            self._send_alert('warning', f"High memory usage: {result['resource_metrics']['memory_final_mb']:.1f}MB")

    def _send_alert(self, severity: str, message: str):
        """Send alert through configured channels."""
        alert = {
            'severity': severity,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'pipeline': self.current_pipeline
        }

        self.logger.warning(f"ALERT [{severity}]: {message}")

        # Store alert
        if self.redis_client:
            try:
                alert_key = f"pipeline:alert:{datetime.now():%Y%m%d_%H%M%S}"
                self.redis_client.setex(alert_key, 86400, json.dumps(alert))
            except Exception as e:
                self.logger.error(f"Failed to store alert: {e}")

        # Send to configured channels (would implement actual sending in production)
        for channel in self.config['monitoring']['alerting']['channels']:
            if (severity == 'failure' and channel.get('on_failure')) or \
               (severity == 'warning' and channel.get('on_warning')) or \
               (severity == 'critical' and channel.get('on_critical')):
                self.logger.info(f"Would send alert to {channel['type']}: {message}")

    def schedule_jobs(self):
        """Schedule pipeline jobs based on configuration."""
        if not self.config['scheduling']['enabled']:
            return

        for job in self.config['scheduling']['jobs']:
            cron = job['cron']
            pipeline_name = job['pipeline']

            # Parse cron expression and schedule job
            # This is simplified - would use croniter in production
            if cron == "0 * * * *":  # Hourly
                schedule.every().hour.do(self.run_pipeline, pipeline_name)
                self.logger.info(f"Scheduled {pipeline_name} to run hourly")
            elif cron == "0 2 * * *":  # Daily at 2 AM
                schedule.every().day.at("02:00").do(self.run_pipeline, pipeline_name)
                self.logger.info(f"Scheduled {pipeline_name} to run daily at 2 AM")
            elif cron == "0 3 * * 0":  # Weekly on Sunday at 3 AM
                schedule.every().sunday.at("03:00").do(self.run_pipeline, pipeline_name)
                self.logger.info(f"Scheduled {pipeline_name} to run weekly on Sunday at 3 AM")

    def run(self):
        """Main run loop for production pipeline."""
        self.logger.info("Starting production pipeline runner")

        # Schedule jobs
        self.schedule_jobs()

        # Run initial pipeline
        try:
            self.run_pipeline("startup")
        except Exception as e:
            self.logger.error(f"Startup pipeline failed: {e}")

        # Main loop
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(1)
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
                time.sleep(60)  # Wait before retrying

        self.logger.info("Production pipeline runner stopped")

    def get_status(self) -> Dict[str, Any]:
        """Get current pipeline status."""
        return {
            'running': self.running,
            'current_pipeline': self.current_pipeline,
            'metrics': self.metrics,
            'config': {
                'environment': self.config['pipeline']['environment'],
                'version': self.config['pipeline']['version']
            }
        }


def main():
    """Main entry point."""
    # Get config path from environment or use default
    config_path = os.getenv('PIPELINE_CONFIG', 'config/production.yaml')

    # Create and run pipeline runner
    runner = ProductionPipelineRunner(config_path)

    try:
        runner.run()
    except Exception as e:
        logging.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()