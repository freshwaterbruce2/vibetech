#!/usr/bin/env python3
"""
Advanced scheduler for Data Processing Pipeline with dependency management
"""

import os
import sys
import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
import redis
import croniter
from dataclasses import dataclass, field
from enum import Enum
import threading
import queue

sys.path.append(str(Path(__file__).parent.parent))


class JobStatus(Enum):
    """Job execution status."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"


@dataclass
class Job:
    """Represents a scheduled job."""
    id: str
    name: str
    pipeline: str
    cron: str
    dependencies: List[str] = field(default_factory=list)
    timeout: int = 3600
    retry_count: int = 3
    retry_delay: int = 300
    status: JobStatus = JobStatus.PENDING
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None
    run_count: int = 0
    failure_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


class DependencyGraph:
    """Manages job dependencies."""

    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.dependencies: Dict[str, List[str]] = {}
        self.logger = logging.getLogger(self.__class__.__name__)

    def add_job(self, job: Job):
        """Add job to dependency graph."""
        self.jobs[job.id] = job
        self.dependencies[job.id] = job.dependencies

    def get_ready_jobs(self) -> List[Job]:
        """Get jobs that are ready to run (dependencies satisfied)."""
        ready = []
        for job_id, job in self.jobs.items():
            if job.status == JobStatus.PENDING:
                if self._dependencies_satisfied(job_id):
                    ready.append(job)
        return ready

    def _dependencies_satisfied(self, job_id: str) -> bool:
        """Check if all dependencies for a job are satisfied."""
        deps = self.dependencies.get(job_id, [])
        for dep_id in deps:
            dep_job = self.jobs.get(dep_id)
            if not dep_job or dep_job.status != JobStatus.SUCCESS:
                return False
        return True

    def get_dependency_chain(self, job_id: str) -> List[str]:
        """Get full dependency chain for a job."""
        chain = []
        visited = set()

        def traverse(jid: str):
            if jid in visited:
                return
            visited.add(jid)
            for dep in self.dependencies.get(jid, []):
                traverse(dep)
            chain.append(jid)

        traverse(job_id)
        return chain


class PipelineScheduler:
    """Advanced pipeline scheduler with cron support."""

    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        self.setup_logging()
        self.setup_redis(redis_host, redis_port)
        self.dependency_graph = DependencyGraph()
        self.job_queue = queue.PriorityQueue()
        self.workers: List[threading.Thread] = []
        self.running = True
        self.lock = threading.Lock()

    def setup_logging(self):
        """Configure logging."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/scheduler.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(self.__class__.__name__)

    def setup_redis(self, host: str, port: int):
        """Setup Redis connection for state management."""
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                decode_responses=True
            )
            self.redis_client.ping()
            self.logger.info("Connected to Redis")
        except Exception as e:
            self.logger.error(f"Redis connection failed: {e}")
            self.redis_client = None

    def load_jobs(self, config_path: str = "config/jobs.json"):
        """Load job configurations."""
        try:
            with open(config_path, 'r') as f:
                job_configs = json.load(f)

            for job_config in job_configs:
                job = Job(
                    id=job_config['id'],
                    name=job_config['name'],
                    pipeline=job_config['pipeline'],
                    cron=job_config['cron'],
                    dependencies=job_config.get('dependencies', []),
                    timeout=job_config.get('timeout', 3600),
                    retry_count=job_config.get('retry_count', 3),
                    retry_delay=job_config.get('retry_delay', 300)
                )

                # Calculate next run time
                cron = croniter.croniter(job.cron, datetime.now())
                job.next_run = cron.get_next(datetime)

                self.dependency_graph.add_job(job)
                self.logger.info(f"Loaded job: {job.name} (next run: {job.next_run})")

        except Exception as e:
            self.logger.error(f"Failed to load jobs: {e}")

    def start_workers(self, num_workers: int = 4):
        """Start worker threads for job execution."""
        for i in range(num_workers):
            worker = threading.Thread(
                target=self._worker_loop,
                name=f"Worker-{i}",
                daemon=True
            )
            worker.start()
            self.workers.append(worker)
            self.logger.info(f"Started worker thread: {worker.name}")

    def _worker_loop(self):
        """Worker loop for executing jobs."""
        while self.running:
            try:
                # Get job from queue (blocks if empty)
                priority, job = self.job_queue.get(timeout=1)

                # Execute job
                self._execute_job(job)

                self.job_queue.task_done()

            except queue.Empty:
                continue
            except Exception as e:
                self.logger.error(f"Worker error: {e}", exc_info=True)

    def _execute_job(self, job: Job):
        """Execute a single job."""
        self.logger.info(f"Executing job: {job.name}")
        start_time = time.time()

        try:
            # Update job status
            job.status = JobStatus.RUNNING
            job.last_run = datetime.now()
            self._save_job_state(job)

            # Create job execution context
            context = {
                'job_id': job.id,
                'job_name': job.name,
                'pipeline': job.pipeline,
                'run_count': job.run_count,
                'metadata': job.metadata
            }

            # Execute pipeline (this would call the actual pipeline)
            result = self._run_pipeline(job.pipeline, context, job.timeout)

            # Update job status based on result
            if result.get('success'):
                job.status = JobStatus.SUCCESS
                job.run_count += 1
                self.logger.info(f"Job {job.name} completed successfully")

                # Store result
                self._store_job_result(job, result)

                # Trigger dependent jobs
                self._trigger_dependent_jobs(job.id)
            else:
                raise Exception(f"Pipeline failed: {result.get('error', 'Unknown error')}")

        except Exception as e:
            self.logger.error(f"Job {job.name} failed: {e}")
            job.status = JobStatus.FAILED
            job.failure_count += 1

            # Retry if configured
            if job.failure_count <= job.retry_count:
                self.logger.info(f"Scheduling retry for job {job.name} (attempt {job.failure_count}/{job.retry_count})")
                time.sleep(job.retry_delay)
                job.status = JobStatus.PENDING
                self.schedule_job(job, delay=job.retry_delay)
            else:
                self.logger.error(f"Job {job.name} failed after {job.retry_count} retries")
                self._send_failure_notification(job, str(e))

        finally:
            # Calculate next run time
            if job.cron and job.status != JobStatus.FAILED:
                cron = croniter.croniter(job.cron, job.last_run)
                job.next_run = cron.get_next(datetime)
                job.status = JobStatus.PENDING
                job.failure_count = 0  # Reset failure count on success

            # Save final job state
            self._save_job_state(job)

            execution_time = time.time() - start_time
            self.logger.info(f"Job {job.name} execution time: {execution_time:.2f}s")

    def _run_pipeline(self, pipeline_name: str, context: Dict[str, Any], timeout: int) -> Dict[str, Any]:
        """Run the actual pipeline (placeholder for integration)."""
        # This would integrate with the actual pipeline runner
        # For now, simulate pipeline execution
        import random
        time.sleep(random.uniform(1, 5))  # Simulate work

        # Simulate occasional failures
        if random.random() < 0.1:
            return {'success': False, 'error': 'Simulated pipeline failure'}

        return {
            'success': True,
            'rows_processed': random.randint(1000, 10000),
            'execution_time': random.uniform(1, 60),
            'context': context
        }

    def _trigger_dependent_jobs(self, job_id: str):
        """Trigger jobs that depend on the completed job."""
        for dep_job_id, dep_job in self.dependency_graph.jobs.items():
            if job_id in dep_job.dependencies:
                if self.dependency_graph._dependencies_satisfied(dep_job_id):
                    self.logger.info(f"Triggering dependent job: {dep_job.name}")
                    self.schedule_job(dep_job, immediate=True)

    def schedule_job(self, job: Job, delay: int = 0, immediate: bool = False):
        """Schedule a job for execution."""
        if immediate:
            priority = 0  # Highest priority
        else:
            priority = int(job.next_run.timestamp()) if job.next_run else int(time.time() + delay)

        self.job_queue.put((priority, job))
        self.logger.debug(f"Scheduled job {job.name} with priority {priority}")

    def _save_job_state(self, job: Job):
        """Save job state to Redis."""
        if not self.redis_client:
            return

        try:
            job_data = {
                'id': job.id,
                'name': job.name,
                'status': job.status.value,
                'last_run': job.last_run.isoformat() if job.last_run else None,
                'next_run': job.next_run.isoformat() if job.next_run else None,
                'run_count': job.run_count,
                'failure_count': job.failure_count
            }

            self.redis_client.hset(
                f"scheduler:job:{job.id}",
                mapping=job_data
            )

            # Set expiry for completed jobs
            if job.status in [JobStatus.SUCCESS, JobStatus.FAILED]:
                self.redis_client.expire(f"scheduler:job:{job.id}", 86400)  # 24 hours

        except Exception as e:
            self.logger.error(f"Failed to save job state: {e}")

    def _store_job_result(self, job: Job, result: Dict[str, Any]):
        """Store job execution result."""
        if not self.redis_client:
            return

        try:
            result_key = f"scheduler:result:{job.id}:{datetime.now():%Y%m%d_%H%M%S}"
            self.redis_client.setex(
                result_key,
                86400,  # Expire after 24 hours
                json.dumps(result, default=str)
            )
        except Exception as e:
            self.logger.error(f"Failed to store job result: {e}")

    def _send_failure_notification(self, job: Job, error: str):
        """Send notification for job failure."""
        notification = {
            'job_id': job.id,
            'job_name': job.name,
            'error': error,
            'failure_count': job.failure_count,
            'timestamp': datetime.now().isoformat()
        }

        self.logger.error(f"JOB FAILURE NOTIFICATION: {notification}")

        # Store in Redis for monitoring dashboard
        if self.redis_client:
            try:
                self.redis_client.lpush(
                    "scheduler:failures",
                    json.dumps(notification)
                )
                self.redis_client.ltrim("scheduler:failures", 0, 99)  # Keep last 100 failures
            except Exception as e:
                self.logger.error(f"Failed to store failure notification: {e}")

    def run(self):
        """Main scheduler loop."""
        self.logger.info("Starting pipeline scheduler")

        # Start worker threads
        self.start_workers()

        # Main scheduling loop
        while self.running:
            try:
                # Check for jobs ready to run
                now = datetime.now()

                with self.lock:
                    for job in self.dependency_graph.jobs.values():
                        if job.status == JobStatus.PENDING and job.next_run:
                            if job.next_run <= now:
                                # Check dependencies
                                if self.dependency_graph._dependencies_satisfied(job.id):
                                    self.schedule_job(job, immediate=True)
                                else:
                                    self.logger.debug(f"Job {job.name} waiting for dependencies")

                # Sleep briefly
                time.sleep(10)  # Check every 10 seconds

            except KeyboardInterrupt:
                self.logger.info("Received interrupt signal")
                break
            except Exception as e:
                self.logger.error(f"Scheduler error: {e}", exc_info=True)
                time.sleep(60)  # Wait before retrying

        self.shutdown()

    def shutdown(self):
        """Gracefully shutdown the scheduler."""
        self.logger.info("Shutting down scheduler...")
        self.running = False

        # Wait for workers to finish
        self.job_queue.join()

        for worker in self.workers:
            worker.join(timeout=10)

        self.logger.info("Scheduler shutdown complete")

    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status."""
        jobs_status = {}
        for job_id, job in self.dependency_graph.jobs.items():
            jobs_status[job_id] = {
                'name': job.name,
                'status': job.status.value,
                'last_run': job.last_run.isoformat() if job.last_run else None,
                'next_run': job.next_run.isoformat() if job.next_run else None,
                'run_count': job.run_count,
                'failure_count': job.failure_count
            }

        return {
            'running': self.running,
            'worker_count': len(self.workers),
            'queue_size': self.job_queue.qsize(),
            'jobs': jobs_status
        }


def main():
    """Main entry point."""
    scheduler = PipelineScheduler(
        redis_host=os.getenv('REDIS_HOST', 'localhost'),
        redis_port=int(os.getenv('REDIS_PORT', 6379))
    )

    # Load job configurations
    config_path = os.getenv('JOBS_CONFIG', 'config/jobs.json')
    scheduler.load_jobs(config_path)

    try:
        scheduler.run()
    except Exception as e:
        logging.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()