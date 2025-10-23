"""
Windows-specific SQLite optimizations for maximum performance on D drive storage.
"""

import sqlite3
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def optimize_for_windows(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Apply Windows-specific SQLite optimizations for D drive storage.
    
    Args:
        conn: SQLite database connection
        
    Returns:
        Dict containing applied optimization settings
    """
    cursor = conn.cursor()
    
    # Windows-specific pragmas optimized for NTFS and SSD storage
    optimizations = [
        # Use memory-mapped I/O (very fast on Windows with SSD)
        ("mmap_size", "536870912"),  # 512MB
        
        # Optimize for NTFS file system (4KB clusters)
        ("page_size", "4096"),
        
        # Large cache for better performance (128MB)
        ("cache_size", "-128000"),
        
        # WAL mode for better concurrency and crash recovery
        ("journal_mode", "WAL"),
        
        # Reduce sync operations (safe with WAL mode)
        ("synchronous", "NORMAL"),
        
        # Keep temporary tables in memory
        ("temp_store", "MEMORY"),
        
        # Automatic indexing for query optimization
        ("automatic_index", "ON"),
        
        # Enable case-insensitive LIKE for better text search
        ("case_sensitive_like", "OFF"),
        
        # Optimize checkpoint behavior for WAL mode
        ("wal_autocheckpoint", "1000"),
        
        # Set busy timeout for better concurrency
        ("busy_timeout", "30000"),  # 30 seconds
    ]
    
    applied_settings = {}
    
    try:
        for pragma_name, value in optimizations:
            pragma_sql = f"PRAGMA {pragma_name} = {value}"
            cursor.execute(pragma_sql)
            
            # Verify the setting was applied
            cursor.execute(f"PRAGMA {pragma_name}")
            result = cursor.fetchone()
            if result:
                applied_settings[pragma_name] = result[0]
                logger.debug(f"Applied {pragma_name}: {result[0]}")
        
        # Run ANALYZE to update query planner statistics
        cursor.execute("PRAGMA optimize")
        logger.info("Database optimization completed for Windows")
        
    except sqlite3.Error as e:
        logger.error(f"Error applying optimizations: {e}")
        raise
    finally:
        cursor.close()
    
    return applied_settings

def get_performance_stats(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Get current performance statistics from SQLite.
    
    Args:
        conn: SQLite database connection
        
    Returns:
        Dict containing performance metrics
    """
    cursor = conn.cursor()
    stats = {}
    
    try:
        # Cache statistics
        cursor.execute("PRAGMA cache_stats")
        cache_stats = cursor.fetchone()
        if cache_stats:
            stats['cache_hits'] = cache_stats[0]
            stats['cache_misses'] = cache_stats[1]
            stats['cache_hit_ratio'] = cache_stats[0] / (cache_stats[0] + cache_stats[1]) if (cache_stats[0] + cache_stats[1]) > 0 else 0
        
        # Database file size
        cursor.execute("PRAGMA page_count")
        page_count = cursor.fetchone()[0]
        cursor.execute("PRAGMA page_size")
        page_size = cursor.fetchone()[0]
        stats['database_size_bytes'] = page_count * page_size
        stats['database_size_mb'] = (page_count * page_size) / (1024 * 1024)
        
        # WAL file info
        cursor.execute("PRAGMA wal_checkpoint(PASSIVE)")
        wal_info = cursor.fetchone()
        if wal_info:
            stats['wal_busy'] = wal_info[0]
            stats['wal_log_pages'] = wal_info[1]
            stats['wal_checkpointed_pages'] = wal_info[2]
        
        # Connection statistics
        cursor.execute("PRAGMA compile_options")
        compile_options = [row[0] for row in cursor.fetchall()]
        stats['sqlite_compile_options'] = compile_options
        
        logger.debug(f"Performance stats retrieved: {stats}")
        
    except sqlite3.Error as e:
        logger.error(f"Error retrieving performance stats: {e}")
        stats['error'] = str(e)
    finally:
        cursor.close()
    
    return stats

def run_maintenance(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Run database maintenance operations for optimal performance.
    
    Args:
        conn: SQLite database connection
        
    Returns:
        Dict containing maintenance results
    """
    cursor = conn.cursor()
    results = {}
    
    try:
        # Run integrity check
        cursor.execute("PRAGMA integrity_check")
        integrity_result = cursor.fetchone()
        results['integrity_check'] = integrity_result[0] if integrity_result else 'Unknown'
        
        # Analyze database for query optimization
        cursor.execute("ANALYZE")
        results['analyze_completed'] = True
        
        # Optimize database
        cursor.execute("PRAGMA optimize")
        results['optimize_completed'] = True
        
        # WAL checkpoint
        cursor.execute("PRAGMA wal_checkpoint(FULL)")
        wal_result = cursor.fetchone()
        if wal_result:
            results['wal_checkpoint'] = {
                'busy': wal_result[0],
                'log_pages': wal_result[1],
                'checkpointed_pages': wal_result[2]
            }
        
        logger.info("Database maintenance completed successfully")
        
    except sqlite3.Error as e:
        logger.error(f"Error during maintenance: {e}")
        results['error'] = str(e)
        raise
    finally:
        cursor.close()
    
    return results