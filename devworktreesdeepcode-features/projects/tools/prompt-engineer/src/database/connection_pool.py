"""
SQLite Connection Pool for multi-threading support in the Interactive Prompt Engineering Tool.

Provides thread-safe connection pooling for SQLite database operations
with Windows-specific optimizations.
"""

import sqlite3
import logging
import threading
from queue import Queue, Empty
from contextlib import contextmanager
from typing import Optional, Dict, Any
from pathlib import Path

from .optimizations import optimize_for_windows

logger = logging.getLogger(__name__)

class SQLiteConnectionPool:
    """
    Thread-safe connection pool for SQLite database operations.
    
    Manages a pool of SQLite connections for concurrent access,
    with automatic connection creation and recycling.
    """
    
    def __init__(self, database_path: str, pool_size: int = 5, max_overflow: int = 10, timeout: float = 30.0):
        """
        Initialize connection pool.
        
        Args:
            database_path: Path to SQLite database
            pool_size: Base number of connections in pool
            max_overflow: Maximum additional connections beyond pool_size
            timeout: Connection timeout in seconds
        """
        self.database_path = Path(database_path)
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.timeout = timeout
        
        # Connection pool and tracking
        self.pool = Queue(maxsize=pool_size + max_overflow)
        self.checked_out = set()
        self.overflow_count = 0
        
        # Thread safety
        self.lock = threading.RLock()
        
        # Pool statistics
        self.stats = {
            'connections_created': 0,
            'connections_checked_out': 0,
            'connections_checked_in': 0,
            'pool_hits': 0,
            'pool_misses': 0,
            'timeouts': 0
        }
        
        # Initialize pool with base connections
        self._populate_pool()
        
        logger.info(f"Connection pool initialized with {pool_size} connections for {database_path}")
    
    def _populate_pool(self) -> None:
        """Populate pool with initial connections."""
        for _ in range(self.pool_size):
            conn = self._create_connection()
            if conn:
                self.pool.put(conn)
    
    def _create_connection(self) -> Optional[sqlite3.Connection]:
        """
        Create a new optimized SQLite connection.
        
        Returns:
            SQLite connection or None if creation fails
        """
        try:
            conn = sqlite3.connect(
                str(self.database_path),
                check_same_thread=False,
                timeout=self.timeout,
                isolation_level=None  # Autocommit mode
            )
            
            # Enable row factory for dict-like access
            conn.row_factory = sqlite3.Row
            
            # Apply Windows optimizations
            optimize_for_windows(conn)
            
            with self.lock:
                self.stats['connections_created'] += 1
            
            logger.debug(f"Created new database connection")
            return conn
            
        except sqlite3.Error as e:
            logger.error(f"Failed to create database connection: {e}")
            return None
    
    def get_connection(self, timeout: Optional[float] = None) -> sqlite3.Connection:
        """
        Get a connection from the pool.
        
        Args:
            timeout: Optional timeout override
            
        Returns:
            SQLite connection
            
        Raises:
            Empty: If no connection available within timeout
            RuntimeError: If pool is at capacity
        """
        timeout = timeout or self.timeout
        
        try:
            # Try to get existing connection from pool
            conn = self.pool.get(timeout=timeout)
            
            with self.lock:
                self.checked_out.add(id(conn))
                self.stats['connections_checked_out'] += 1
                self.stats['pool_hits'] += 1
            
            # Verify connection is still valid
            if self._is_connection_valid(conn):
                return conn
            else:
                # Connection is stale, create a new one
                self._close_connection(conn)
                return self._create_overflow_connection()
        
        except Empty:
            # Pool is empty, try to create overflow connection
            with self.lock:
                self.stats['pool_misses'] += 1
                
                if self.overflow_count < self.max_overflow:
                    return self._create_overflow_connection()
                else:
                    self.stats['timeouts'] += 1
                    raise RuntimeError("Connection pool at maximum capacity")
    
    def _create_overflow_connection(self) -> sqlite3.Connection:
        """Create an overflow connection beyond pool size."""
        conn = self._create_connection()
        if not conn:
            raise RuntimeError("Failed to create overflow connection")
        
        with self.lock:
            self.overflow_count += 1
            self.checked_out.add(id(conn))
            self.stats['connections_checked_out'] += 1
        
        return conn
    
    def return_connection(self, conn: sqlite3.Connection) -> None:
        """
        Return a connection to the pool.
        
        Args:
            conn: Connection to return
        """
        conn_id = id(conn)
        
        with self.lock:
            if conn_id not in self.checked_out:
                logger.warning("Attempted to return connection not checked out from pool")
                return
            
            self.checked_out.remove(conn_id)
            self.stats['connections_checked_in'] += 1
        
        # Check if connection is still valid
        if self._is_connection_valid(conn):
            try:
                # If pool is full or this is overflow, close the connection
                if self.pool.full() or self.overflow_count > 0:
                    self._close_connection(conn)
                    if self.overflow_count > 0:
                        with self.lock:
                            self.overflow_count -= 1
                else:
                    # Return to pool
                    self.pool.put_nowait(conn)
            except:
                # Pool is full, close the connection
                self._close_connection(conn)
        else:
            # Connection is invalid, close it
            self._close_connection(conn)
    
    def _is_connection_valid(self, conn: sqlite3.Connection) -> bool:
        """
        Check if connection is still valid.
        
        Args:
            conn: Connection to test
            
        Returns:
            True if connection is valid
        """
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            return True
        except sqlite3.Error:
            return False
    
    def _close_connection(self, conn: sqlite3.Connection) -> None:
        """Safely close a database connection."""
        try:
            conn.close()
            logger.debug("Closed database connection")
        except sqlite3.Error as e:
            logger.warning(f"Error closing connection: {e}")
    
    @contextmanager
    def connection(self, timeout: Optional[float] = None):
        """
        Context manager for getting and returning connections.
        
        Args:
            timeout: Optional timeout override
            
        Yields:
            SQLite connection
        """
        conn = self.get_connection(timeout)
        try:
            yield conn
        finally:
            self.return_connection(conn)
    
    @contextmanager
    def transaction(self, timeout: Optional[float] = None):
        """
        Context manager for database transactions.
        
        Args:
            timeout: Optional timeout override
            
        Yields:
            SQLite cursor within transaction
        """
        with self.connection(timeout) as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("BEGIN")
                yield cursor
                cursor.execute("COMMIT")
            except Exception:
                cursor.execute("ROLLBACK")
                raise
            finally:
                cursor.close()
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get connection pool statistics.
        
        Returns:
            Dictionary of pool statistics
        """
        with self.lock:
            pool_size = self.pool.qsize()
            checked_out_count = len(self.checked_out)
            
            stats = self.stats.copy()
            stats.update({
                'pool_size': self.pool_size,
                'max_overflow': self.max_overflow,
                'current_pool_size': pool_size,
                'checked_out': checked_out_count,
                'overflow_count': self.overflow_count,
                'total_connections': pool_size + checked_out_count
            })
            
            # Calculate efficiency metrics
            total_requests = stats['connections_checked_out']
            if total_requests > 0:
                stats['hit_rate'] = stats['pool_hits'] / total_requests
                stats['miss_rate'] = stats['pool_misses'] / total_requests
            else:
                stats['hit_rate'] = 0.0
                stats['miss_rate'] = 0.0
        
        return stats
    
    def close_all(self) -> None:
        """Close all connections in the pool."""
        logger.info("Closing all connections in pool")
        
        # Close all pooled connections
        while not self.pool.empty():
            try:
                conn = self.pool.get_nowait()
                self._close_connection(conn)
            except Empty:
                break
        
        # Wait for checked out connections to be returned
        # In a real application, you might want to force close these
        with self.lock:
            if self.checked_out:
                logger.warning(f"{len(self.checked_out)} connections still checked out")
        
        logger.info("Connection pool closed")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close_all()

class SingletonConnectionPool:
    """
    Singleton wrapper for SQLiteConnectionPool to ensure one pool per database.
    """
    
    _pools: Dict[str, SQLiteConnectionPool] = {}
    _lock = threading.Lock()
    
    @classmethod
    def get_pool(cls, database_path: str, **kwargs) -> SQLiteConnectionPool:
        """
        Get or create connection pool for database.
        
        Args:
            database_path: Path to database
            **kwargs: Arguments for SQLiteConnectionPool
            
        Returns:
            Connection pool instance
        """
        abs_path = str(Path(database_path).resolve())
        
        with cls._lock:
            if abs_path not in cls._pools:
                cls._pools[abs_path] = SQLiteConnectionPool(abs_path, **kwargs)
            
            return cls._pools[abs_path]
    
    @classmethod
    def close_all_pools(cls) -> None:
        """Close all connection pools."""
        with cls._lock:
            for pool in cls._pools.values():
                pool.close_all()
            cls._pools.clear()
    
    @classmethod
    def get_all_stats(cls) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all pools."""
        with cls._lock:
            return {path: pool.get_stats() for path, pool in cls._pools.items()}