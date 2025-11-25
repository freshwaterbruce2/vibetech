#!/usr/bin/env python3
"""
Register Specialist Agents from Claude Code Configuration
Syncs specialist agents from .claude/agents.json to D: drive database
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
AGENTS_CONFIG_PATH = Path(r"C:\dev\.claude\agents.json")
DATABASE_PATH = Path(r"D:\databases\database.db")

def load_agents_config():
    """Load specialist agents configuration"""
    try:
        with open(AGENTS_CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except Exception as e:
        logger.error(f"Failed to load agents config: {e}")
        return None

def register_specialist_agents():
    """Register all specialist agents in database"""
    # Load configuration
    config = load_agents_config()
    if not config:
        logger.error("Failed to load agents configuration")
        return False

    agent_definitions = config.get('agent_definitions', {})
    if not agent_definitions:
        logger.error("No agent definitions found in configuration")
        return False

    # Connect to database
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        logger.info(f"Connected to database: {DATABASE_PATH}")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return False

    registered_count = 0
    updated_count = 0

    for agent_name, agent_def in agent_definitions.items():
        try:
            # Check if agent already exists
            cursor.execute("SELECT id, name FROM agent_registry WHERE name = ?", (agent_name,))
            existing = cursor.fetchone()

            display_name = agent_def.get('display_name', agent_name)
            description = agent_def.get('description', '')
            expertise = ', '.join(agent_def.get('expertise', []))
            primary_directive = agent_def.get('primary_directive', '')

            if existing:
                # Update existing agent
                cursor.execute("""
                    UPDATE agent_registry
                    SET description = ?,
                        updated_at = ?
                    WHERE name = ?
                """, (
                    description,
                    datetime.now(),
                    agent_name
                ))
                updated_count += 1
                logger.info(f"✓ Updated: {agent_name} ({display_name})")
            else:
                # Insert new agent
                cursor.execute("""
                    INSERT INTO agent_registry
                    (name, agent_type, description, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    agent_name,
                    'specialist',
                    description,
                    datetime.now(),
                    datetime.now()
                ))
                registered_count += 1
                logger.info(f"+ Registered: {agent_name} ({display_name})")

            # Log details
            logger.info(f"  Expertise: {expertise}")
            logger.info(f"  Directive: {primary_directive}")

        except Exception as e:
            logger.error(f"Failed to register {agent_name}: {e}")
            continue

    # Commit changes
    try:
        conn.commit()
        logger.info(f"\n✅ Database updated successfully")
        logger.info(f"   Registered: {registered_count} new agents")
        logger.info(f"   Updated: {updated_count} existing agents")
    except Exception as e:
        logger.error(f"Failed to commit changes: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

    return True

def verify_registration():
    """Verify all specialist agents are registered"""
    config = load_agents_config()
    if not config:
        return False

    agent_definitions = config.get('agent_definitions', {})

    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        logger.info("\n📊 Verification Report:")
        logger.info("=" * 70)

        for agent_name in agent_definitions.keys():
            cursor.execute("""
                SELECT
                    ar.id,
                    ar.name,
                    ar.agent_type,
                    ar.description,
                    ar.total_tasks,
                    ar.success_rate,
                    ar.avg_execution_time,
                    ar.last_active
                FROM agent_registry ar
                WHERE ar.name = ?
            """, (agent_name,))

            result = cursor.fetchone()
            if result:
                agent_id, name, agent_type, description, total_tasks, success_rate, avg_time, last_active = result
                logger.info(f"\n✓ {name}")
                logger.info(f"  ID: {agent_id}")
                logger.info(f"  Type: {agent_type}")
                logger.info(f"  Total Tasks: {total_tasks or 0}")
                logger.info(f"  Success Rate: {success_rate or 0.0:.1%}")
                logger.info(f"  Avg Execution Time: {avg_time or 0:.2f}s")
                logger.info(f"  Last Active: {last_active or 'Never'}")
            else:
                logger.warning(f"\n✗ {agent_name} - NOT FOUND IN DATABASE")

        logger.info("\n" + "=" * 70)

        conn.close()
        return True

    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return False

def main():
    """Main entry point"""
    logger.info("=" * 70)
    logger.info("Specialist Agent Registration Tool")
    logger.info("=" * 70)
    logger.info(f"Config: {AGENTS_CONFIG_PATH}")
    logger.info(f"Database: {DATABASE_PATH}")
    logger.info("=" * 70)

    # Register agents
    success = register_specialist_agents()

    if success:
        # Verify registration
        verify_registration()
    else:
        logger.error("❌ Registration failed")
        return 1

    logger.info("\n✅ All specialist agents registered and verified")
    return 0

if __name__ == "__main__":
    exit(main())
