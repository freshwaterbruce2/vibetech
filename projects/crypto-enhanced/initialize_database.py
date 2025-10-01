#!/usr/bin/env python3
"""
Initialize or update database schema
Adds missing tables to existing database
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from database import Database

async def initialize_database():
    """Initialize database with all tables"""
    print("Initializing database schema...")

    db = Database("trading.db")
    await db.initialize()

    print("Database schema updated successfully!")
    print("\nChecking tables...")

    # Test that tables exist
    cursor = await db.conn.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = await cursor.fetchall()

    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")

    await db.close()

if __name__ == "__main__":
    asyncio.run(initialize_database())