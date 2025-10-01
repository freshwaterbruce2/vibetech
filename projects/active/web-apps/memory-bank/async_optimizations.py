#!/usr/bin/env python3
"""
AsyncIO Optimizations Module
Implements uvloop, connection pooling, and production async patterns
Achieves 2-4x performance improvement over default asyncio
"""

import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Callable, TypeVar, Coroutine
from functools import wraps
import platform

import aiohttp
import aiodns
from aiohttp import ClientSession, TCPConnector
from tenacity import retry, stop_after_attempt, wait_exponential
import orjson

# Conditionally import uvloop (not available on Windows)
try:
    import uvloop
    UVLOOP_AVAILABLE = True
except ImportError:
    UVLOOP_AVAILABLE = False
    logging.warning("uvloop not available, using default event loop")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

T = TypeVar('T')

@dataclass
class ConnectionPoolConfig:
    """Configuration for connection pools"""
    max_connections: int = 100
    max_connections_per_host: int = 30
    ttl_dns_cache: int = 300
    enable_cleanup_closed: bool = True
    keepalive_timeout: int = 30
    force_close: bool = False
    limit: int = 0  # 0 = no limit

class AsyncOptimizer:
    """
    Optimizes async operations with uvloop and connection pooling
    Provides production-grade async patterns and utilities
    """

    def __init__(self, enable_uvloop: bool = True):
        self.enable_uvloop = enable_uvloop and UVLOOP_AVAILABLE
        self.session_pool: Dict[str, ClientSession] = {}
        self.semaphores: Dict[str, asyncio.Semaphore] = {}
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time_ms": 0,
            "connection_reuses": 0
        }

        # Initialize optimized event loop
        self._setup_event_loop()

        logger.info(f"Async optimizer initialized (uvloop: {self.enable_uvloop})")

    def _setup_event_loop(self):
        """Setup optimized event loop with uvloop if available"""
        if self.enable_uvloop and platform.system() != "Windows":
            try:
                # Set uvloop as the event loop policy
                asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
                logger.info("uvloop event loop policy set - 2-4x performance boost enabled")
            except Exception as e:
                logger.warning(f"Failed to set uvloop policy: {e}")
                self.enable_uvloop = False
        else:
            logger.info("Using default asyncio event loop")

    def get_optimized_loop(self) -> asyncio.AbstractEventLoop:
        """Get or create an optimized event loop"""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No loop running, create a new one
            if self.enable_uvloop:
                loop = uvloop.new_event_loop()
            else:
                loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        # Set loop options for better performance
        if hasattr(loop, 'set_debug'):
            loop.set_debug(False)  # Disable debug mode in production

        return loop

    @asynccontextmanager
    async def get_session(self,
                         pool_name: str = "default",
                         config: ConnectionPoolConfig = None) -> ClientSession:
        """
        Get or create an optimized aiohttp session with connection pooling
        Uses context manager pattern for proper cleanup
        """
        if pool_name not in self.session_pool:
            await self._create_session_pool(pool_name, config)

        session = self.session_pool[pool_name]
        try:
            yield session
        finally:
            # Don't close here, keep for reuse
            self.metrics["connection_reuses"] += 1

    async def _create_session_pool(self,
                                  pool_name: str,
                                  config: ConnectionPoolConfig = None):
        """Create an optimized session with connection pooling"""
        if config is None:
            config = ConnectionPoolConfig()

        # Create DNS resolver for faster DNS lookups
        resolver = aiodns.DNSResolver()

        # Create optimized connector with connection pooling
        connector = TCPConnector(
            limit=config.max_connections,
            limit_per_host=config.max_connections_per_host,
            ttl_dns_cache=config.ttl_dns_cache,
            enable_cleanup_closed=config.enable_cleanup_closed,
            keepalive_timeout=config.keepalive_timeout,
            force_close=config.force_close,
            resolver=resolver
        )

        # Create session with optimized settings
        timeout = aiohttp.ClientTimeout(
            total=30,
            connect=10,
            sock_read=10,
            sock_connect=10
        )

        session = ClientSession(
            connector=connector,
            timeout=timeout,
            json_serialize=lambda obj: orjson.dumps(obj).decode(),  # Fast JSON
            headers={
                'User-Agent': 'MemorySystem/1.0',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        )

        self.session_pool[pool_name] = session
        logger.info(f"Created optimized session pool: {pool_name}")

    async def close_all_sessions(self):
        """Close all session pools properly"""
        for name, session in self.session_pool.items():
            await session.close()
            logger.info(f"Closed session pool: {name}")
        self.session_pool.clear()

    def get_semaphore(self, name: str, limit: int) -> asyncio.Semaphore:
        """Get or create a named semaphore for rate limiting"""
        if name not in self.semaphores:
            self.semaphores[name] = asyncio.Semaphore(limit)
        return self.semaphores[name]

    async def gather_with_concurrency(self,
                                     tasks: List[Coroutine],
                                     limit: int = 10) -> List[Any]:
        """
        Execute tasks with controlled concurrency
        Better than asyncio.gather for large task lists
        """
        semaphore = asyncio.Semaphore(limit)

        async def run_with_semaphore(task):
            async with semaphore:
                return await task

        return await asyncio.gather(
            *[run_with_semaphore(task) for task in tasks],
            return_exceptions=True
        )

    async def batch_process(self,
                          items: List[Any],
                          processor: Callable,
                          batch_size: int = 100,
                          concurrency: int = 10) -> List[Any]:
        """
        Process items in batches with controlled concurrency
        Optimal for processing large datasets
        """
        results = []

        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]

            # Create tasks for batch
            tasks = [processor(item) for item in batch]

            # Process batch with concurrency limit
            batch_results = await self.gather_with_concurrency(tasks, concurrency)
            results.extend(batch_results)

            # Small delay between batches to prevent overwhelming
            if i + batch_size < len(items):
                await asyncio.sleep(0.1)

        return results

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def resilient_request(self,
                               url: str,
                               method: str = "GET",
                               pool_name: str = "default",
                               **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic and connection pooling
        Production-grade resilient request handling
        """
        start_time = time.perf_counter()
        self.metrics["total_requests"] += 1

        try:
            async with self.get_session(pool_name) as session:
                async with session.request(method, url, **kwargs) as response:
                    response.raise_for_status()

                    # Parse response based on content type
                    content_type = response.headers.get('Content-Type', '')
                    if 'application/json' in content_type:
                        data = await response.json()
                    else:
                        data = await response.text()

                    # Update metrics
                    self.metrics["successful_requests"] += 1
                    elapsed_ms = (time.perf_counter() - start_time) * 1000
                    self._update_avg_response_time(elapsed_ms)

                    return {
                        "status": response.status,
                        "data": data,
                        "headers": dict(response.headers),
                        "elapsed_ms": elapsed_ms
                    }

        except Exception as e:
            self.metrics["failed_requests"] += 1
            logger.error(f"Request failed: {url} - {e}")
            raise

    def _update_avg_response_time(self, elapsed_ms: float):
        """Update average response time metric"""
        total = self.metrics["successful_requests"]
        self.metrics["avg_response_time_ms"] = (
            (self.metrics["avg_response_time_ms"] * (total - 1) + elapsed_ms) / total
        )

    def optimize_coroutine(self, coro_func: Callable) -> Callable:
        """
        Decorator to optimize coroutine execution
        Adds performance tracking and error handling
        """
        @wraps(coro_func)
        async def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = await coro_func(*args, **kwargs)
                elapsed_ms = (time.perf_counter() - start_time) * 1000

                if elapsed_ms > 1000:  # Log slow operations
                    logger.warning(f"{coro_func.__name__} took {elapsed_ms:.2f}ms")

                return result
            except asyncio.CancelledError:
                # Handle cancellation properly
                logger.info(f"{coro_func.__name__} cancelled")
                raise
            except Exception as e:
                logger.error(f"{coro_func.__name__} failed: {e}")
                raise

        return wrapper

    async def run_with_timeout(self,
                              coro: Coroutine[Any, Any, T],
                              timeout_seconds: float) -> Optional[T]:
        """
        Run coroutine with timeout
        Returns None if timeout occurs
        """
        try:
            return await asyncio.wait_for(coro, timeout=timeout_seconds)
        except asyncio.TimeoutError:
            logger.warning(f"Coroutine timed out after {timeout_seconds}s")
            return None

    def create_task_with_callback(self,
                                 coro: Coroutine,
                                 callback: Callable = None,
                                 error_callback: Callable = None) -> asyncio.Task:
        """
        Create task with success/error callbacks
        Useful for fire-and-forget operations with logging
        """
        task = asyncio.create_task(coro)

        def done_callback(future: asyncio.Future):
            try:
                result = future.result()
                if callback:
                    callback(result)
            except Exception as e:
                if error_callback:
                    error_callback(e)
                else:
                    logger.error(f"Task failed: {e}")

        task.add_done_callback(done_callback)
        return task

    async def parallel_map(self,
                         func: Callable,
                         items: List[Any],
                         max_workers: int = 10) -> List[Any]:
        """
        Parallel map operation with worker pool pattern
        More efficient than creating tasks for each item
        """
        queue = asyncio.Queue()
        results = {}

        # Fill queue with items
        for idx, item in enumerate(items):
            await queue.put((idx, item))

        # Worker coroutine
        async def worker():
            while True:
                try:
                    idx, item = await asyncio.wait_for(queue.get(), timeout=1)
                    result = await func(item) if asyncio.iscoroutinefunction(func) else func(item)
                    results[idx] = result
                    queue.task_done()
                except asyncio.TimeoutError:
                    break

        # Create workers
        workers = [asyncio.create_task(worker()) for _ in range(max_workers)]

        # Wait for queue to be processed
        await queue.join()

        # Cancel workers
        for w in workers:
            w.cancel()

        # Return results in original order
        return [results[i] for i in sorted(results.keys())]

    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        metrics = self.metrics.copy()

        # Calculate success rate
        if metrics["total_requests"] > 0:
            metrics["success_rate"] = (
                metrics["successful_requests"] / metrics["total_requests"]
            )
        else:
            metrics["success_rate"] = 0

        # Add event loop info
        metrics["event_loop_type"] = "uvloop" if self.enable_uvloop else "asyncio"

        return metrics

# Context manager for automatic session cleanup
class AsyncSessionManager:
    """
    Context manager for async sessions with automatic cleanup
    """
    def __init__(self, optimizer: AsyncOptimizer):
        self.optimizer = optimizer

    async def __aenter__(self):
        return self.optimizer

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.optimizer.close_all_sessions()

# Production-ready async utilities

async def run_in_executor(func: Callable, *args, executor=None):
    """
    Run blocking function in thread pool executor
    Prevents blocking the event loop
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, func, *args)

async def create_background_task(coro: Coroutine,
                                name: str = None,
                                log_errors: bool = True) -> asyncio.Task:
    """
    Create a background task with proper error handling
    """
    task = asyncio.create_task(coro, name=name)

    if log_errors:
        def error_handler(future):
            try:
                future.result()
            except Exception as e:
                logger.error(f"Background task '{name or 'unnamed'}' failed: {e}")

        task.add_done_callback(error_handler)

    return task

async def safe_gather(*coros, return_exceptions: bool = True):
    """
    Safely gather coroutines with exception handling
    """
    return await asyncio.gather(*coros, return_exceptions=return_exceptions)

# Example usage
async def main():
    """Test async optimizations"""
    optimizer = AsyncOptimizer(enable_uvloop=True)

    # Test connection pooling
    urls = [
        "https://api.github.com",
        "https://jsonplaceholder.typicode.com/posts/1",
        "https://httpbin.org/delay/1"
    ]

    # Test parallel requests with connection pooling
    async def fetch_url(url):
        return await optimizer.resilient_request(url)

    results = await optimizer.parallel_map(fetch_url, urls, max_workers=3)

    print(f"Fetched {len(results)} URLs")
    print(f"Metrics: {optimizer.get_metrics()}")

    # Test batch processing
    items = list(range(100))

    async def process_item(item):
        await asyncio.sleep(0.01)  # Simulate work
        return item * 2

    batch_results = await optimizer.batch_process(
        items, process_item, batch_size=20, concurrency=5
    )

    print(f"Processed {len(batch_results)} items in batches")

    # Cleanup
    await optimizer.close_all_sessions()

if __name__ == "__main__":
    # Run with optimized event loop
    if UVLOOP_AVAILABLE and platform.system() != "Windows":
        uvloop.run(main())
    else:
        asyncio.run(main())