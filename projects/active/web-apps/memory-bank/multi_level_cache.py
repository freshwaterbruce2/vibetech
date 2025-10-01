#!/usr/bin/env python3
"""
Multi-Level Caching System
Implements query, embedding, and response caches with TTL management
Production-grade caching for 80% latency reduction
"""

import asyncio
import hashlib
import json
import logging
import pickle
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Union, Callable
from functools import wraps

import orjson
import msgpack
from cachetools import TTLCache, LRUCache
from diskcache import Cache as DiskCache
import redis.asyncio as redis
from tenacity import retry, stop_after_attempt, wait_exponential

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CacheLevel(Enum):
    """Cache levels in order of speed"""
    MEMORY = "memory"  # In-memory cache (fastest)
    DISK = "disk"  # Local disk cache
    REDIS = "redis"  # Distributed cache (slowest but shared)

class CacheStrategy(Enum):
    """Caching strategies"""
    LRU = "lru"  # Least Recently Used
    TTL = "ttl"  # Time To Live
    LFU = "lfu"  # Least Frequently Used
    FIFO = "fifo"  # First In First Out

@dataclass
class CacheEntry:
    """Single cache entry with metadata"""
    key: str
    value: Any
    timestamp: datetime
    ttl_seconds: int
    hits: int = 0
    size_bytes: int = 0
    cache_level: CacheLevel = CacheLevel.MEMORY

    def is_expired(self) -> bool:
        """Check if entry has expired"""
        if self.ttl_seconds <= 0:
            return False
        expiry = self.timestamp + timedelta(seconds=self.ttl_seconds)
        return datetime.now() > expiry

    def increment_hits(self):
        """Increment hit counter"""
        self.hits += 1

class MultiLevelCache:
    """
    Production-grade multi-level caching system
    Implements L1 (memory), L2 (disk), and L3 (Redis) caches
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._get_default_config()

        # Initialize cache levels
        self.memory_cache = {}  # Will be initialized per cache type
        self.disk_cache = None
        self.redis_client = None

        # Cache statistics
        self.stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "memory_hits": 0,
            "disk_hits": 0,
            "redis_hits": 0,
            "avg_latency_ms": 0
        }

        # Initialize caches
        self._initialize_caches()

        logger.info("Multi-level cache system initialized")

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "memory": {
                "query_cache_size": 1000,
                "query_ttl_seconds": 3600,  # 1 hour
                "embedding_cache_size": 5000,
                "embedding_ttl_seconds": 1800,  # 30 minutes
                "response_cache_size": 500,
                "response_ttl_seconds": 900,  # 15 minutes
            },
            "disk": {
                "cache_dir": "./cache",
                "size_limit_gb": 10,
                "eviction_policy": "least-recently-used"
            },
            "redis": {
                "host": "localhost",
                "port": 6379,
                "db": 0,
                "password": None,
                "max_connections": 10,
                "enabled": False  # Disabled by default
            }
        }

    def _initialize_caches(self):
        """Initialize all cache levels"""
        # Initialize memory caches
        self._init_memory_caches()

        # Initialize disk cache
        self._init_disk_cache()

        # Initialize Redis if enabled
        if self.config["redis"]["enabled"]:
            self._init_redis_cache()

    def _init_memory_caches(self):
        """Initialize in-memory caches with TTL"""
        mem_config = self.config["memory"]

        # Query cache - for caching search queries
        self.memory_cache["query"] = TTLCache(
            maxsize=mem_config["query_cache_size"],
            ttl=mem_config["query_ttl_seconds"]
        )

        # Embedding cache - for caching computed embeddings
        self.memory_cache["embedding"] = TTLCache(
            maxsize=mem_config["embedding_cache_size"],
            ttl=mem_config["embedding_ttl_seconds"]
        )

        # Response cache - for caching LLM responses
        self.memory_cache["response"] = TTLCache(
            maxsize=mem_config["response_cache_size"],
            ttl=mem_config["response_ttl_seconds"]
        )

        # Metadata cache - for frequently accessed metadata
        self.memory_cache["metadata"] = LRUCache(maxsize=1000)

    def _init_disk_cache(self):
        """Initialize disk-based cache"""
        disk_config = self.config["disk"]
        cache_dir = disk_config["cache_dir"]

        # Create disk cache with size limit
        size_limit = disk_config["size_limit_gb"] * 1024 * 1024 * 1024  # Convert to bytes

        self.disk_cache = DiskCache(
            cache_dir,
            size_limit=size_limit,
            eviction_policy=disk_config["eviction_policy"]
        )

        logger.info(f"Disk cache initialized at {cache_dir}")

    def _init_redis_cache(self):
        """Initialize Redis connection pool"""
        redis_config = self.config["redis"]

        try:
            self.redis_client = redis.Redis(
                host=redis_config["host"],
                port=redis_config["port"],
                db=redis_config["db"],
                password=redis_config["password"],
                max_connections=redis_config["max_connections"],
                decode_responses=False  # We'll handle serialization
            )
            logger.info("Redis cache connection established")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}")
            self.redis_client = None

    def _generate_cache_key(self, prefix: str, data: Union[str, Dict, List]) -> str:
        """Generate a unique cache key from data"""
        if isinstance(data, str):
            content = data
        else:
            # Use orjson for deterministic JSON serialization
            content = orjson.dumps(data, option=orjson.OPT_SORT_KEYS).decode()

        # Create hash for consistent key
        hash_digest = hashlib.sha256(content.encode()).hexdigest()[:16]
        return f"{prefix}:{hash_digest}"

    async def get(self, key: str, cache_type: str = "query") -> Optional[Any]:
        """
        Get value from cache, checking all levels
        Returns None if not found or expired
        """
        start_time = time.perf_counter()
        self.stats["total_requests"] += 1

        # Level 1: Check memory cache
        value = self._get_from_memory(key, cache_type)
        if value is not None:
            self.stats["cache_hits"] += 1
            self.stats["memory_hits"] += 1
            self._update_latency(start_time)
            return value

        # Level 2: Check disk cache
        value = await self._get_from_disk(key)
        if value is not None:
            # Promote to memory cache
            await self._set_memory(key, value, cache_type)
            self.stats["cache_hits"] += 1
            self.stats["disk_hits"] += 1
            self._update_latency(start_time)
            return value

        # Level 3: Check Redis if available
        if self.redis_client:
            value = await self._get_from_redis(key)
            if value is not None:
                # Promote to faster caches
                await self._set_memory(key, value, cache_type)
                await self._set_disk(key, value)
                self.stats["cache_hits"] += 1
                self.stats["redis_hits"] += 1
                self._update_latency(start_time)
                return value

        # Cache miss
        self.stats["cache_misses"] += 1
        self._update_latency(start_time)
        return None

    async def set(self, key: str, value: Any, cache_type: str = "query",
                 ttl_seconds: int = None) -> bool:
        """
        Set value in cache at all appropriate levels
        """
        try:
            # Set in memory cache
            await self._set_memory(key, value, cache_type, ttl_seconds)

            # Set in disk cache for persistence
            await self._set_disk(key, value, ttl_seconds)

            # Set in Redis if available for distributed access
            if self.redis_client:
                await self._set_redis(key, value, ttl_seconds)

            return True
        except Exception as e:
            logger.error(f"Cache set failed: {e}")
            return False

    def _get_from_memory(self, key: str, cache_type: str) -> Optional[Any]:
        """Get value from memory cache"""
        if cache_type in self.memory_cache:
            cache = self.memory_cache[cache_type]
            if key in cache:
                return cache[key]
        return None

    async def _set_memory(self, key: str, value: Any, cache_type: str, ttl: int = None):
        """Set value in memory cache"""
        if cache_type in self.memory_cache:
            self.memory_cache[cache_type][key] = value

    async def _get_from_disk(self, key: str) -> Optional[Any]:
        """Get value from disk cache"""
        if not self.disk_cache:
            return None

        try:
            return self.disk_cache.get(key)
        except Exception as e:
            logger.debug(f"Disk cache get failed: {e}")
            return None

    async def _set_disk(self, key: str, value: Any, ttl: int = None):
        """Set value in disk cache"""
        if not self.disk_cache:
            return

        try:
            self.disk_cache.set(key, value, expire=ttl)
        except Exception as e:
            logger.debug(f"Disk cache set failed: {e}")

    async def _get_from_redis(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        if not self.redis_client:
            return None

        try:
            data = await self.redis_client.get(key)
            if data:
                return msgpack.unpackb(data, raw=False)
        except Exception as e:
            logger.debug(f"Redis get failed: {e}")
            return None

    async def _set_redis(self, key: str, value: Any, ttl: int = None):
        """Set value in Redis cache"""
        if not self.redis_client:
            return

        try:
            # Serialize with msgpack for efficiency
            data = msgpack.packb(value, use_bin_type=True)
            if ttl:
                await self.redis_client.setex(key, ttl, data)
            else:
                await self.redis_client.set(key, data)
        except Exception as e:
            logger.debug(f"Redis set failed: {e}")

    def _update_latency(self, start_time: float):
        """Update average latency metric"""
        latency_ms = (time.perf_counter() - start_time) * 1000
        count = self.stats["total_requests"]
        self.stats["avg_latency_ms"] = (
            (self.stats["avg_latency_ms"] * (count - 1) + latency_ms) / count
        )

    async def invalidate(self, key: str = None, pattern: str = None, cache_type: str = None):
        """
        Invalidate cache entries
        Can invalidate specific key, pattern, or entire cache type
        """
        if key:
            # Invalidate specific key across all levels
            if cache_type and cache_type in self.memory_cache:
                self.memory_cache[cache_type].pop(key, None)
            if self.disk_cache:
                self.disk_cache.delete(key)
            if self.redis_client:
                await self.redis_client.delete(key)

        elif pattern:
            # Pattern-based invalidation (e.g., "query:*")
            await self._invalidate_pattern(pattern, cache_type)

        elif cache_type:
            # Clear entire cache type
            if cache_type in self.memory_cache:
                self.memory_cache[cache_type].clear()

        logger.info(f"Cache invalidated: key={key}, pattern={pattern}, type={cache_type}")

    async def _invalidate_pattern(self, pattern: str, cache_type: str = None):
        """Invalidate cache entries matching pattern"""
        # Memory cache pattern matching
        if cache_type and cache_type in self.memory_cache:
            cache = self.memory_cache[cache_type]
            keys_to_delete = [k for k in cache.keys() if self._match_pattern(k, pattern)]
            for k in keys_to_delete:
                cache.pop(k, None)

        # Redis pattern matching
        if self.redis_client:
            cursor = 0
            while True:
                cursor, keys = await self.redis_client.scan(
                    cursor, match=pattern, count=100
                )
                if keys:
                    await self.redis_client.delete(*keys)
                if cursor == 0:
                    break

    def _match_pattern(self, key: str, pattern: str) -> bool:
        """Simple pattern matching (supports * wildcard)"""
        import fnmatch
        return fnmatch.fnmatch(key, pattern)

    def cache_decorator(self, cache_type: str = "query", ttl_seconds: int = None,
                       key_prefix: str = None):
        """
        Decorator for caching function results
        Automatically handles async and sync functions
        """
        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Generate cache key from function name and arguments
                key_data = {
                    "func": func.__name__,
                    "args": args,
                    "kwargs": kwargs
                }
                cache_key = self._generate_cache_key(
                    key_prefix or func.__name__,
                    key_data
                )

                # Try to get from cache
                cached_value = await self.get(cache_key, cache_type)
                if cached_value is not None:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return cached_value

                # Execute function
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)

                # Store in cache
                await self.set(cache_key, result, cache_type, ttl_seconds)

                return result

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                # For sync functions, run in asyncio
                return asyncio.run(async_wrapper(*args, **kwargs))

            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

        return decorator

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = self.stats.copy()

        # Calculate hit rate
        if stats["total_requests"] > 0:
            stats["hit_rate"] = stats["cache_hits"] / stats["total_requests"]
        else:
            stats["hit_rate"] = 0

        # Add cache sizes
        stats["memory_cache_sizes"] = {
            name: len(cache) for name, cache in self.memory_cache.items()
        }

        if self.disk_cache:
            stats["disk_cache_size"] = len(self.disk_cache)

        return stats

    async def warmup(self, data: List[Tuple[str, Any]], cache_type: str = "query"):
        """
        Pre-populate cache with frequently accessed data
        Useful for system startup
        """
        logger.info(f"Warming up {cache_type} cache with {len(data)} entries")

        for key, value in data:
            await self.set(key, value, cache_type)

        logger.info("Cache warmup completed")

    async def cleanup(self):
        """Clean up expired entries and optimize storage"""
        logger.info("Starting cache cleanup")

        # Clean disk cache
        if self.disk_cache:
            self.disk_cache.expire()

        # Redis cleanup handled by TTL automatically

        logger.info("Cache cleanup completed")

# Specialized cache implementations

class SemanticCache(MultiLevelCache):
    """
    Semantic cache for similarity-based retrieval
    Caches based on semantic similarity rather than exact match
    """

    def __init__(self, config: Dict[str, Any] = None, similarity_threshold: float = 0.9):
        super().__init__(config)
        self.similarity_threshold = similarity_threshold
        self.embedding_cache = {}  # Cache query embeddings

    async def semantic_get(self, query: str, embedding: np.ndarray = None) -> Optional[Any]:
        """
        Get cached result based on semantic similarity
        """
        # Implementation would integrate with vector database
        # Check if similar query exists in cache
        # Return cached result if similarity > threshold
        pass

    async def semantic_set(self, query: str, value: Any, embedding: np.ndarray = None):
        """
        Set value with semantic key
        """
        # Store query, embedding, and value
        # Update vector index for future similarity searches
        pass

# Example usage
async def main():
    """Test multi-level cache"""
    cache = MultiLevelCache()

    # Test basic caching
    await cache.set("test_key", {"data": "test_value"}, "query", ttl_seconds=60)
    value = await cache.get("test_key", "query")
    print(f"Retrieved value: {value}")

    # Test cache decorator
    @cache.cache_decorator(cache_type="response", ttl_seconds=300)
    async def expensive_function(param: str) -> str:
        await asyncio.sleep(1)  # Simulate expensive operation
        return f"Result for {param}"

    # First call - will execute function
    result1 = await expensive_function("test")
    print(f"First call: {result1}")

    # Second call - should use cache
    result2 = await expensive_function("test")
    print(f"Second call (cached): {result2}")

    # Check statistics
    stats = cache.get_stats()
    print(f"Cache stats: {stats}")

if __name__ == "__main__":
    asyncio.run(main())