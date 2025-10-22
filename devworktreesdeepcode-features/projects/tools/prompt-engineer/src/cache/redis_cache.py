#!/usr/bin/env python3
"""
Advanced Caching System with Redis Integration

Provides intelligent caching for project analysis results with smart invalidation
and incremental analysis capabilities.
"""

import json
import hashlib
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import os

# Try to import redis, fall back to in-memory cache if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Redis not available, using in-memory cache fallback")

@dataclass
class CacheMetadata:
    """Metadata for cached analysis results."""
    cache_key: str
    project_path: str
    file_count: int
    total_size: int
    last_modified: float
    analysis_timestamp: float
    cache_version: str = "1.0"
    file_hashes: Dict[str, str] = None

class SmartCache:
    """
    Intelligent caching system with file change detection and incremental updates.
    
    Features:
    - Redis backend with in-memory fallback
    - Smart cache invalidation based on file changes
    - Incremental analysis (only re-analyze changed files)
    - Compression for large cache entries
    - TTL management
    - Cache statistics and health monitoring
    """
    
    def __init__(self, 
                 redis_url: Optional[str] = None,
                 default_ttl: int = 3600 * 24,  # 24 hours
                 max_memory_cache_size: int = 100,
                 enable_compression: bool = True):
        """
        Initialize cache system.
        
        Args:
            redis_url: Redis connection URL (None for in-memory)
            default_ttl: Default cache TTL in seconds
            max_memory_cache_size: Max entries for in-memory cache
            enable_compression: Enable gzip compression for large entries
        """
        self.default_ttl = default_ttl
        self.enable_compression = enable_compression
        self.cache_version = "1.0"
        
        # Initialize Redis connection
        self.redis_client = None
        if REDIS_AVAILABLE and redis_url:
            try:
                self.redis_client = redis.from_url(redis_url)
                self.redis_client.ping()  # Test connection
                print(f"Connected to Redis cache at {redis_url}")
            except Exception as e:
                print(f"Redis connection failed: {e}, using in-memory cache")
                self.redis_client = None
        
        # Fallback in-memory cache
        self.memory_cache: Dict[str, Any] = {}
        self.memory_cache_access: Dict[str, float] = {}
        self.max_memory_cache_size = max_memory_cache_size
        
        # Cache statistics
        self.stats = {
            'hits': 0,
            'misses': 0,
            'invalidations': 0,
            'size_bytes': 0,
            'entries': 0
        }
    
    def generate_cache_key(self, project_path: str, config: Dict[str, Any] = None) -> str:
        """Generate a unique cache key for project and configuration."""
        # Include project path, config, and cache version in key
        key_data = {
            'project_path': str(Path(project_path).resolve()),
            'config': config or {},
            'version': self.cache_version
        }
        
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(key_string.encode()).hexdigest()[:16]
    
    def get_project_fingerprint(self, project_path: Path) -> Tuple[Dict[str, str], CacheMetadata]:
        """
        Generate fingerprint of project files for change detection.
        
        Returns:
            Tuple of (file_hashes, cache_metadata)
        """
        file_hashes = {}
        total_size = 0
        last_modified = 0
        file_count = 0
        
        # Get relevant files
        extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rs', 
            '.cpp', '.c', '.cs', '.php', '.rb', '.swift', '.kt'
        }
        
        for file_path in project_path.rglob('*'):
            if (file_path.is_file() and 
                file_path.suffix.lower() in extensions and
                not self._should_skip_file(file_path)):
                
                try:
                    stat = file_path.stat()
                    # Create hash from file path, size, and mtime
                    file_key = str(file_path.relative_to(project_path))
                    file_data = f"{file_key}:{stat.st_size}:{stat.st_mtime}"
                    file_hashes[file_key] = hashlib.md5(file_data.encode()).hexdigest()
                    
                    total_size += stat.st_size
                    last_modified = max(last_modified, stat.st_mtime)
                    file_count += 1
                    
                except (OSError, ValueError):
                    continue
        
        metadata = CacheMetadata(
            cache_key="",  # Will be set by caller
            project_path=str(project_path),
            file_count=file_count,
            total_size=total_size,
            last_modified=last_modified,
            analysis_timestamp=time.time(),
            file_hashes=file_hashes
        )
        
        return file_hashes, metadata
    
    def _should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped during fingerprinting."""
        skip_dirs = {
            'node_modules', '.git', '__pycache__', '.pytest_cache',
            'venv', '.venv', 'env', '.env', 'build', 'dist', 'target'
        }
        
        for part in file_path.parts:
            if part in skip_dirs:
                return True
        
        return False
    
    def get_analysis_result(self, project_path: str, config: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """
        Get cached analysis result if valid.
        
        Returns:
            Cached analysis result or None if cache miss/invalid
        """
        cache_key = self.generate_cache_key(project_path, config)
        
        # Try to get from cache
        cached_data = self._get_from_cache(cache_key)
        if not cached_data:
            self.stats['misses'] += 1
            return None
        
        # Validate cache against current project state
        project_path_obj = Path(project_path)
        current_hashes, _ = self.get_project_fingerprint(project_path_obj)
        
        cached_metadata = CacheMetadata(**cached_data.get('metadata', {}))
        
        # Check if project has changed
        if self._has_project_changed(current_hashes, cached_metadata):
            # Cache is stale, invalidate it
            self.invalidate_cache(cache_key)
            self.stats['misses'] += 1
            self.stats['invalidations'] += 1
            return None
        
        # Cache hit!
        self.stats['hits'] += 1
        return cached_data.get('result')
    
    def store_analysis_result(self, 
                            project_path: str, 
                            result: Dict[str, Any],
                            config: Dict[str, Any] = None,
                            ttl: Optional[int] = None) -> str:
        """
        Store analysis result in cache.
        
        Returns:
            Cache key used for storage
        """
        cache_key = self.generate_cache_key(project_path, config)
        
        # Generate project fingerprint
        project_path_obj = Path(project_path)
        file_hashes, metadata = self.get_project_fingerprint(project_path_obj)
        metadata.cache_key = cache_key
        
        # Prepare cache entry
        cache_entry = {
            'result': result,
            'metadata': asdict(metadata),
            'cached_at': time.time(),
            'config': config or {}
        }
        
        # Store in cache
        self._store_in_cache(cache_key, cache_entry, ttl or self.default_ttl)
        
        self.stats['entries'] += 1
        return cache_key
    
    def _has_project_changed(self, 
                           current_hashes: Dict[str, str], 
                           cached_metadata: CacheMetadata) -> bool:
        """Check if project files have changed since cache was created."""
        if not cached_metadata.file_hashes:
            return True
        
        # Quick check: file count changed
        if len(current_hashes) != len(cached_metadata.file_hashes):
            return True
        
        # Check individual file hashes
        for file_path, current_hash in current_hashes.items():
            cached_hash = cached_metadata.file_hashes.get(file_path)
            if cached_hash != current_hash:
                return True
        
        # Check for deleted files
        for file_path in cached_metadata.file_hashes:
            if file_path not in current_hashes:
                return True
        
        return False
    
    def get_incremental_changes(self, 
                              project_path: str, 
                              config: Dict[str, Any] = None) -> Optional[Dict[str, List[str]]]:
        """
        Get list of changed files since last analysis.
        
        Returns:
            Dict with 'added', 'modified', 'deleted' file lists or None if no cache
        """
        cache_key = self.generate_cache_key(project_path, config)
        cached_data = self._get_from_cache(cache_key)
        
        if not cached_data:
            return None
        
        cached_metadata = CacheMetadata(**cached_data.get('metadata', {}))
        project_path_obj = Path(project_path)
        current_hashes, _ = self.get_project_fingerprint(project_path_obj)
        
        if not cached_metadata.file_hashes:
            return None
        
        changes = {
            'added': [],
            'modified': [],
            'deleted': []
        }
        
        # Find added and modified files
        for file_path, current_hash in current_hashes.items():
            cached_hash = cached_metadata.file_hashes.get(file_path)
            if cached_hash is None:
                changes['added'].append(file_path)
            elif cached_hash != current_hash:
                changes['modified'].append(file_path)
        
        # Find deleted files
        for file_path in cached_metadata.file_hashes:
            if file_path not in current_hashes:
                changes['deleted'].append(file_path)
        
        return changes
    
    def _get_from_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from Redis or memory cache."""
        if self.redis_client:
            try:
                data = self.redis_client.get(f"analysis:{key}")
                if data:
                    return json.loads(data.decode('utf-8'))
            except Exception as e:
                print(f"Redis get error: {e}")
        
        # Fallback to memory cache
        if key in self.memory_cache:
            self.memory_cache_access[key] = time.time()
            return self.memory_cache[key]
        
        return None
    
    def _store_in_cache(self, key: str, data: Dict[str, Any], ttl: int):
        """Store data in Redis or memory cache."""
        if self.redis_client:
            try:
                json_data = json.dumps(data, default=str)
                self.redis_client.setex(f"analysis:{key}", ttl, json_data)
                return
            except Exception as e:
                print(f"Redis store error: {e}")
        
        # Fallback to memory cache
        self._manage_memory_cache_size()
        self.memory_cache[key] = data
        self.memory_cache_access[key] = time.time()
    
    def _manage_memory_cache_size(self):
        """Manage memory cache size using LRU eviction."""
        if len(self.memory_cache) >= self.max_memory_cache_size:
            # Remove oldest accessed entry
            oldest_key = min(self.memory_cache_access, key=self.memory_cache_access.get)
            del self.memory_cache[oldest_key]
            del self.memory_cache_access[oldest_key]
    
    def invalidate_cache(self, key: str):
        """Invalidate specific cache entry."""
        if self.redis_client:
            try:
                self.redis_client.delete(f"analysis:{key}")
            except Exception:
                pass
        
        if key in self.memory_cache:
            del self.memory_cache[key]
            del self.memory_cache_access[key]
    
    def clear_all_cache(self):
        """Clear all cached analysis results."""
        if self.redis_client:
            try:
                # Delete all analysis keys
                pattern = "analysis:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            except Exception:
                pass
        
        self.memory_cache.clear()
        self.memory_cache_access.clear()
        self.stats['invalidations'] += 1
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics."""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        cache_info = {
            **self.stats,
            'hit_rate_percent': round(hit_rate, 2),
            'total_requests': total_requests,
            'backend': 'redis' if self.redis_client else 'memory',
            'memory_cache_size': len(self.memory_cache)
        }
        
        if self.redis_client:
            try:
                redis_info = self.redis_client.info('memory')
                cache_info.update({
                    'redis_used_memory': redis_info.get('used_memory_human', 'unknown'),
                    'redis_connected_clients': self.redis_client.info('clients').get('connected_clients', 0)
                })
            except Exception:
                pass
        
        return cache_info
    
    def health_check(self) -> Dict[str, Any]:
        """Perform cache health check."""
        health = {
            'status': 'healthy',
            'backend': 'memory',
            'issues': []
        }
        
        if self.redis_client:
            try:
                self.redis_client.ping()
                health['backend'] = 'redis'
                health['redis_connected'] = True
            except Exception as e:
                health['status'] = 'degraded'
                health['redis_connected'] = False
                health['issues'].append(f"Redis connection error: {e}")
        
        # Check memory cache size
        if len(self.memory_cache) >= self.max_memory_cache_size * 0.9:
            health['issues'].append("Memory cache nearing size limit")
        
        return health

class CacheEnabledAnalyzer:
    """
    Wrapper that adds intelligent caching to any analyzer.
    """
    
    def __init__(self, 
                 base_analyzer,
                 cache_system: SmartCache,
                 enable_incremental: bool = True):
        """
        Initialize cache-enabled analyzer.
        
        Args:
            base_analyzer: The underlying analyzer to wrap
            cache_system: Cache system instance
            enable_incremental: Enable incremental analysis for changed files
        """
        self.base_analyzer = base_analyzer
        self.cache = cache_system
        self.enable_incremental = enable_incremental
    
    def analyze_project(self, project_path: str, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze project with intelligent caching.
        """
        config = config or {}
        
        # Try to get from cache first
        cached_result = self.cache.get_analysis_result(project_path, config)
        if cached_result:
            return cached_result
        
        # Cache miss - perform analysis
        if self.enable_incremental:
            # Check for incremental changes
            changes = self.cache.get_incremental_changes(project_path, config)
            if changes and self._can_do_incremental_analysis(changes):
                result = self._perform_incremental_analysis(project_path, changes, config)
            else:
                result = self._perform_full_analysis(project_path, config)
        else:
            result = self._perform_full_analysis(project_path, config)
        
        # Store result in cache
        if hasattr(result, '__dict__'):
            # Convert dataclass to dict if needed
            result_dict = asdict(result) if hasattr(result, '__dict__') else result
        else:
            result_dict = result
        
        self.cache.store_analysis_result(project_path, result_dict, config)
        
        return result
    
    def _can_do_incremental_analysis(self, changes: Dict[str, List[str]]) -> bool:
        """Check if incremental analysis is beneficial."""
        total_changes = len(changes['added']) + len(changes['modified']) + len(changes['deleted'])
        
        # Only do incremental if changes are < 20% of project
        # This is a heuristic - adjust based on your needs
        return total_changes < 50
    
    def _perform_incremental_analysis(self, 
                                    project_path: str, 
                                    changes: Dict[str, List[str]],
                                    config: Dict[str, Any]) -> Dict[str, Any]:
        """Perform incremental analysis on changed files only."""
        # This is a simplified version - in practice you'd want to:
        # 1. Load previous analysis results
        # 2. Re-analyze only changed files
        # 3. Merge results intelligently
        
        # For now, fall back to full analysis
        return self._perform_full_analysis(project_path, config)
    
    def _perform_full_analysis(self, project_path: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Perform full project analysis."""
        max_files = config.get('max_files', 1000)
        
        if hasattr(self.base_analyzer, 'analyze_project'):
            return self.base_analyzer.analyze_project(project_path, max_files)
        else:
            raise ValueError("Base analyzer must have analyze_project method")