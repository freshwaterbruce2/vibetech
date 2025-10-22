#!/usr/bin/env python3
"""
Enhanced Memory Manager for Claude Code
Production-grade context persistence with learning integration
September 2025 Architecture
"""

import json
import sqlite3
import hashlib
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum
import aiofiles
import numpy as np
from collections import deque, defaultdict

class MemoryType(Enum):
    """Memory storage types based on 2025 best practices"""
    SHORT_TERM = "short_term"  # Active task context (RAM-like)
    LONG_TERM = "long_term"    # Persistent knowledge (Disk-like)
    EPISODIC = "episodic"      # Specific events/sessions
    SEMANTIC = "semantic"      # General knowledge/patterns
    PROCEDURAL = "procedural"  # How-to knowledge/workflows

class CompressionStrategy(Enum):
    """Restorable compression strategies"""
    CONCEPT_DISTILL = "concept_distillation"
    PROGRESSIVE_LOAD = "progressive_loading"
    EMBEDDING_CLUSTER = "embedding_clustering"
    ATTENTION_PRUNE = "attention_pruning"

class EnhancedMemoryManager:
    """Production-grade memory management with learning integration"""

    def __init__(self, config_path: str = "memory_config_enhanced.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()

        # Initialize storage paths
        self.local_memory = Path(self.config["directories"]["local_memory"])
        self.bulk_storage = Path(self.config["directories"]["bulk_storage"])
        self.learning_db = Path(self.config["learning"]["database_path"])

        # Memory buffers for performance
        self.short_term_buffer = deque(maxlen=self.config["buffers"]["short_term_size"])
        self.kv_cache = {}  # Key-value cache for fast access
        self.attention_weights = defaultdict(float)

        # Metrics tracking
        self.metrics = {
            "kv_cache_hits": 0,
            "kv_cache_misses": 0,
            "compression_ratio": 0.0,
            "retrieval_latency_ms": deque(maxlen=100),
            "storage_latency_ms": deque(maxlen=100)
        }

        # Setup logging
        self.local_memory.mkdir(parents=True, exist_ok=True)  # Ensure directory exists first
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.local_memory / "memory_manager.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

        # Initialize databases
        self._init_databases()

    def _load_config(self) -> Dict:
        """Load enhanced configuration"""
        default_config = {
            "directories": {
                "local_memory": "C:\\dev\\projects\\active\\web-apps\\memory-bank",
                "bulk_storage": "D:\\dev-memory\\claude-code"
            },
            "learning": {
                "database_path": "D:\\databases\\database.db",
                "sync_interval_minutes": 5,
                "pattern_threshold": 3
            },
            "buffers": {
                "short_term_size": 100,
                "kv_cache_size": 1000
            },
            "compression": {
                "threshold_mb": 1,
                "strategies": ["concept_distill", "progressive_load"]
            },
            "retention": {
                "short_term_hours": 24,
                "long_term_days": 90,
                "archive_days": 365
            },
            "performance": {
                "target_kv_hit_rate": 0.85,
                "max_retrieval_ms": 100,
                "batch_size": 50
            }
        }

        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                loaded = json.load(f)
                # Merge with defaults
                return {**default_config, **loaded}
        return default_config

    def _init_databases(self):
        """Initialize memory and learning databases"""
        # Create directories if needed
        self.local_memory.mkdir(parents=True, exist_ok=True)
        self.bulk_storage.mkdir(parents=True, exist_ok=True)

        # Initialize learning database connection
        self.learning_conn = sqlite3.connect(str(self.learning_db))
        self.learning_conn.execute("PRAGMA journal_mode=WAL")

        # Create memory tracking tables
        self.learning_conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                key TEXT NOT NULL,
                size_bytes INTEGER,
                access_count INTEGER DEFAULT 1,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                relevance_score REAL DEFAULT 0.5,
                compression_strategy TEXT,
                storage_location TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        """)

        self.learning_conn.execute("""
            CREATE TABLE IF NOT EXISTS context_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_hash TEXT UNIQUE,
                pattern_type TEXT,
                frequency INTEGER DEFAULT 1,
                success_rate REAL,
                avg_performance_gain REAL,
                context_data TEXT,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.learning_conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                kv_cache_hit_rate REAL,
                avg_retrieval_ms REAL,
                avg_storage_ms REAL,
                compression_ratio REAL,
                total_memories INTEGER,
                active_memories INTEGER,
                archived_memories INTEGER
            )
        """)

        self.learning_conn.commit()

    async def store_memory(self,
                          key: str,
                          data: Any,
                          memory_type: MemoryType,
                          metadata: Optional[Dict] = None) -> Dict:
        """Store memory with intelligent routing and compression"""
        start_time = datetime.now()

        # Calculate size
        data_str = json.dumps(data)
        size_bytes = len(data_str.encode())

        # Determine compression strategy
        compression = None
        if size_bytes > self.config["compression"]["threshold_mb"] * 1024 * 1024:
            compression = await self._compress_data(data, CompressionStrategy.CONCEPT_DISTILL)
            data_str = json.dumps(compression["compressed"])
            size_bytes = len(data_str.encode())

        # Determine storage location based on memory type and size
        storage_path = self._route_storage(memory_type, size_bytes)

        # Create memory envelope
        envelope = {
            "timestamp": datetime.now().isoformat(),
            "memory_type": memory_type.value,
            "key": key,
            "data": data if not compression else compression["compressed"],
            "metadata": metadata or {},
            "size_bytes": size_bytes,
            "checksum": hashlib.sha256(data_str.encode()).hexdigest(),
            "compression": compression["strategy"] if compression else None,
            "restoration_info": compression["restoration"] if compression else None
        }

        # Store to filesystem
        file_path = storage_path / f"{memory_type.value}" / f"{key}.json"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        async with aiofiles.open(file_path, 'w') as f:
            await f.write(json.dumps(envelope, indent=2))

        # Update caches
        if memory_type == MemoryType.SHORT_TERM:
            self.short_term_buffer.append({"key": key, "data": data})
            self.kv_cache[key] = data

        # Track in database
        self.learning_conn.execute("""
            INSERT INTO memory_usage
            (session_id, memory_type, key, size_bytes, compression_strategy, storage_location, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            metadata.get("session_id", "default"),
            memory_type.value,
            key,
            size_bytes,
            compression["strategy"] if compression else None,
            str(file_path),
            json.dumps(metadata or {})
        ))
        self.learning_conn.commit()

        # Update metrics
        storage_time_ms = (datetime.now() - start_time).total_seconds() * 1000
        self.metrics["storage_latency_ms"].append(storage_time_ms)

        self.logger.info(f"Stored {memory_type.value} memory: {key} ({size_bytes} bytes) in {storage_time_ms:.2f}ms")

        return {
            "success": True,
            "key": key,
            "storage_path": str(file_path),
            "size_bytes": size_bytes,
            "compressed": compression is not None,
            "storage_time_ms": storage_time_ms
        }

    async def retrieve_memory(self,
                            key: str,
                            memory_type: Optional[MemoryType] = None,
                            expand_context: bool = False) -> Optional[Dict]:
        """Retrieve memory with smart caching and progressive loading"""
        start_time = datetime.now()

        # Check KV cache first
        if key in self.kv_cache:
            self.metrics["kv_cache_hits"] += 1
            self.logger.debug(f"KV cache hit for {key}")
            return {
                "data": self.kv_cache[key],
                "cache_hit": True,
                "retrieval_time_ms": 0.1
            }

        self.metrics["kv_cache_misses"] += 1

        # Search for memory file
        search_paths = []
        if memory_type:
            search_paths.append(self.local_memory / memory_type.value)
            search_paths.append(self.bulk_storage / memory_type.value)
        else:
            # Search all locations
            for mt in MemoryType:
                search_paths.append(self.local_memory / mt.value)
                search_paths.append(self.bulk_storage / mt.value)

        for path in search_paths:
            file_path = path / f"{key}.json"
            if file_path.exists():
                async with aiofiles.open(file_path, 'r') as f:
                    content = await f.read()
                    envelope = json.loads(content)

                # Decompress if needed
                data = envelope["data"]
                if envelope.get("compression"):
                    data = await self._decompress_data(
                        data,
                        envelope["restoration_info"],
                        expand_context
                    )

                # Update cache
                self.kv_cache[key] = data

                # Update access tracking
                self.learning_conn.execute("""
                    UPDATE memory_usage
                    SET access_count = access_count + 1,
                        last_accessed = CURRENT_TIMESTAMP
                    WHERE key = ?
                """, (key,))
                self.learning_conn.commit()

                # Update metrics
                retrieval_time_ms = (datetime.now() - start_time).total_seconds() * 1000
                self.metrics["retrieval_latency_ms"].append(retrieval_time_ms)

                return {
                    "data": data,
                    "metadata": envelope.get("metadata"),
                    "memory_type": envelope.get("memory_type"),
                    "cache_hit": False,
                    "retrieval_time_ms": retrieval_time_ms
                }

        self.logger.warning(f"Memory not found: {key}")
        return None

    async def _compress_data(self, data: Any, strategy: CompressionStrategy) -> Dict:
        """Apply intelligent compression strategies"""
        if strategy == CompressionStrategy.CONCEPT_DISTILL:
            # Extract key concepts and create summary
            concepts = self._extract_concepts(data)
            return {
                "compressed": {
                    "concepts": concepts,
                    "summary": self._generate_summary(data),
                    "key_entities": self._extract_entities(data)
                },
                "strategy": strategy.value,
                "restoration": {
                    "method": "concept_expansion",
                    "original_size": len(json.dumps(data))
                }
            }

        elif strategy == CompressionStrategy.ATTENTION_PRUNE:
            # Remove low-attention content
            pruned = self._prune_by_attention(data)
            return {
                "compressed": pruned,
                "strategy": strategy.value,
                "restoration": {
                    "method": "attention_restoration",
                    "pruned_keys": list(set(data.keys()) - set(pruned.keys()))
                }
            }

        return {"compressed": data, "strategy": "none", "restoration": {}}

    async def _decompress_data(self, compressed: Any, restoration_info: Dict, expand: bool) -> Any:
        """Restore compressed data"""
        if not expand:
            return compressed

        method = restoration_info.get("method")

        if method == "concept_expansion":
            # Expand concepts back to fuller representation
            expanded = {
                "concepts": compressed.get("concepts"),
                "summary": compressed.get("summary"),
                "entities": compressed.get("key_entities"),
                "expanded_context": "Full context would be loaded from original sources"
            }
            return expanded

        elif method == "attention_restoration":
            # Restore pruned content if needed
            return compressed

        return compressed

    def _route_storage(self, memory_type: MemoryType, size_bytes: int) -> Path:
        """Determine optimal storage location"""
        # Short-term always goes to local for fast access
        if memory_type == MemoryType.SHORT_TERM:
            return self.local_memory

        # Large files go to bulk storage
        if size_bytes > 10 * 1024 * 1024:  # 10MB
            return self.bulk_storage

        # Recent long-term memories stay local
        if memory_type == MemoryType.LONG_TERM:
            return self.local_memory

        # Everything else to bulk
        return self.bulk_storage

    def _extract_concepts(self, data: Any) -> List[str]:
        """Extract key concepts from data"""
        # Simplified concept extraction
        if isinstance(data, dict):
            concepts = []
            for key, value in data.items():
                if key in ["task", "goal", "method", "result", "error"]:
                    concepts.append(f"{key}: {str(value)[:100]}")
            return concepts
        return [str(data)[:200]]

    def _generate_summary(self, data: Any) -> str:
        """Generate summary of data"""
        if isinstance(data, dict):
            return f"Object with {len(data)} keys: {', '.join(list(data.keys())[:5])}"
        return str(data)[:200]

    def _extract_entities(self, data: Any) -> List[str]:
        """Extract key entities from data"""
        entities = []
        if isinstance(data, dict):
            for key in ["file_path", "function_name", "class_name", "module"]:
                if key in data:
                    entities.append(data[key])
        return entities

    def _prune_by_attention(self, data: Dict) -> Dict:
        """Prune low-attention content"""
        if not isinstance(data, dict):
            return data

        # Keep only high-attention keys
        important_keys = ["error", "result", "task", "goal", "status", "output"]
        pruned = {}
        for key in important_keys:
            if key in data:
                pruned[key] = data[key]

        # Keep keys with high attention weights
        for key, value in data.items():
            if self.attention_weights.get(key, 0) > 0.5:
                pruned[key] = value

        return pruned

    async def sync_with_learning(self):
        """Synchronize memory patterns with learning system"""
        # Analyze access patterns
        patterns = self.learning_conn.execute("""
            SELECT memory_type, COUNT(*) as frequency, AVG(access_count) as avg_access
            FROM memory_usage
            WHERE last_accessed > datetime('now', '-7 days')
            GROUP BY memory_type
            HAVING frequency > ?
        """, (self.config["learning"]["pattern_threshold"],)).fetchall()

        for pattern in patterns:
            memory_type, frequency, avg_access = pattern

            # Store pattern in learning system
            pattern_data = {
                "memory_type": memory_type,
                "frequency": frequency,
                "avg_access": avg_access,
                "timestamp": datetime.now().isoformat()
            }

            pattern_hash = hashlib.md5(json.dumps(pattern_data).encode()).hexdigest()

            self.learning_conn.execute("""
                INSERT OR REPLACE INTO context_patterns
                (pattern_hash, pattern_type, frequency, context_data, last_used)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (pattern_hash, "memory_access", frequency, json.dumps(pattern_data)))

        # Calculate and store performance metrics
        kv_hit_rate = (self.metrics["kv_cache_hits"] /
                      max(1, self.metrics["kv_cache_hits"] + self.metrics["kv_cache_misses"]))

        avg_retrieval = np.mean(self.metrics["retrieval_latency_ms"]) if self.metrics["retrieval_latency_ms"] else 0
        avg_storage = np.mean(self.metrics["storage_latency_ms"]) if self.metrics["storage_latency_ms"] else 0

        memory_stats = self.learning_conn.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN memory_type = 'short_term' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN storage_location LIKE '%bulk%' THEN 1 ELSE 0 END) as archived
            FROM memory_usage
        """).fetchone()

        self.learning_conn.execute("""
            INSERT INTO memory_performance
            (kv_cache_hit_rate, avg_retrieval_ms, avg_storage_ms, compression_ratio,
             total_memories, active_memories, archived_memories)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (kv_hit_rate, avg_retrieval, avg_storage, self.metrics["compression_ratio"],
              memory_stats[0], memory_stats[1], memory_stats[2]))

        self.learning_conn.commit()

        self.logger.info(f"Memory sync complete - KV hit rate: {kv_hit_rate:.2%}, "
                        f"Avg retrieval: {avg_retrieval:.2f}ms")

        # Alert if performance below target
        if kv_hit_rate < self.config["performance"]["target_kv_hit_rate"]:
            self.logger.warning(f"KV cache hit rate {kv_hit_rate:.2%} below target "
                              f"{self.config['performance']['target_kv_hit_rate']:.2%}")

    async def cleanup_old_memories(self):
        """Archive or remove old memories based on retention policy"""
        cutoff_short = datetime.now() - timedelta(hours=self.config["retention"]["short_term_hours"])
        cutoff_long = datetime.now() - timedelta(days=self.config["retention"]["long_term_days"])
        cutoff_archive = datetime.now() - timedelta(days=self.config["retention"]["archive_days"])

        # Move short-term to long-term
        old_short = self.learning_conn.execute("""
            SELECT key, storage_location FROM memory_usage
            WHERE memory_type = 'short_term' AND last_accessed < ?
        """, (cutoff_short.isoformat(),)).fetchall()

        for key, location in old_short:
            # Move file from short-term to long-term
            old_path = Path(location)
            if old_path.exists():
                new_path = self.bulk_storage / "long_term" / old_path.name
                new_path.parent.mkdir(parents=True, exist_ok=True)
                old_path.rename(new_path)

                # Update database
                self.learning_conn.execute("""
                    UPDATE memory_usage
                    SET memory_type = 'long_term', storage_location = ?
                    WHERE key = ?
                """, (str(new_path), key))

        # Archive old long-term memories
        old_long = self.learning_conn.execute("""
            SELECT key, storage_location FROM memory_usage
            WHERE memory_type = 'long_term' AND last_accessed < ?
        """, (cutoff_long.isoformat(),)).fetchall()

        for key, location in old_long:
            path = Path(location)
            if path.exists():
                archive_path = self.bulk_storage / "archive" / path.name
                archive_path.parent.mkdir(parents=True, exist_ok=True)
                path.rename(archive_path)

                self.learning_conn.execute("""
                    UPDATE memory_usage
                    SET memory_type = 'archive', storage_location = ?
                    WHERE key = ?
                """, (str(archive_path), key))

        # Delete very old archives
        very_old = self.learning_conn.execute("""
            SELECT key, storage_location FROM memory_usage
            WHERE last_accessed < ?
        """, (cutoff_archive.isoformat(),)).fetchall()

        for key, location in very_old:
            path = Path(location)
            if path.exists():
                path.unlink()

            self.learning_conn.execute("DELETE FROM memory_usage WHERE key = ?", (key,))

        self.learning_conn.commit()

        self.logger.info(f"Cleanup complete: Moved {len(old_short)} to long-term, "
                        f"archived {len(old_long)}, deleted {len(very_old)}")

    def get_performance_report(self) -> Dict:
        """Generate performance report"""
        kv_hit_rate = (self.metrics["kv_cache_hits"] /
                      max(1, self.metrics["kv_cache_hits"] + self.metrics["kv_cache_misses"]))

        report = {
            "kv_cache_hit_rate": f"{kv_hit_rate:.2%}",
            "target_hit_rate": f"{self.config['performance']['target_kv_hit_rate']:.2%}",
            "avg_retrieval_ms": np.mean(self.metrics["retrieval_latency_ms"]) if self.metrics["retrieval_latency_ms"] else 0,
            "avg_storage_ms": np.mean(self.metrics["storage_latency_ms"]) if self.metrics["storage_latency_ms"] else 0,
            "total_cache_hits": self.metrics["kv_cache_hits"],
            "total_cache_misses": self.metrics["kv_cache_misses"],
            "short_term_buffer_size": len(self.short_term_buffer),
            "kv_cache_size": len(self.kv_cache)
        }

        # Get database stats
        db_stats = self.learning_conn.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN memory_type = 'short_term' THEN 1 ELSE 0 END) as short_term,
                SUM(CASE WHEN memory_type = 'long_term' THEN 1 ELSE 0 END) as long_term,
                SUM(size_bytes) as total_bytes
            FROM memory_usage
        """).fetchone()

        report["memory_stats"] = {
            "total_memories": db_stats[0],
            "short_term": db_stats[1],
            "long_term": db_stats[2],
            "total_size_mb": db_stats[3] / (1024 * 1024) if db_stats[3] else 0
        }

        return report


async def main():
    """Test the enhanced memory manager"""
    manager = EnhancedMemoryManager()

    # Test storing different memory types
    test_data = {
        "task": "Implement memory system",
        "approach": "Use layered architecture with compression",
        "result": "Success",
        "timestamp": datetime.now().isoformat()
    }

    # Store short-term memory
    result = await manager.store_memory(
        "test_session_001",
        test_data,
        MemoryType.SHORT_TERM,
        {"session_id": "test", "project": "memory-bank"}
    )
    print(f"Storage result: {result}")

    # Retrieve memory
    retrieved = await manager.retrieve_memory("test_session_001")
    print(f"Retrieved: {retrieved}")

    # Sync with learning system
    await manager.sync_with_learning()

    # Get performance report
    report = manager.get_performance_report()
    print(f"Performance Report: {json.dumps(report, indent=2)}")

    # Cleanup
    await manager.cleanup_old_memories()


if __name__ == "__main__":
    asyncio.run(main())