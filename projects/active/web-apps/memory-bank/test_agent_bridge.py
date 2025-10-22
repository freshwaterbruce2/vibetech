#!/usr/bin/env python3
"""
Test Agent Memory Bridge Integration
Verifies schema fixes and database connectivity
"""

import asyncio
import logging
from datetime import datetime
from agent_memory_bridge import AgentMemoryBridge, AgentExecution

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_agent_history():
    """Test retrieving agent history with fixed schema"""
    logger.info("=" * 70)
    logger.info("TEST 1: Agent History Retrieval")
    logger.info("=" * 70)

    try:
        bridge = AgentMemoryBridge()

        # Test getting history for a registered agent
        history = await bridge._get_agent_history('crypto-expert', limit=5)

        if history is not None:
            logger.info(f"✓ Retrieved {len(history)} history items")
            for item in history:
                logger.info(f"  Task: {item.get('task', 'N/A')}")
                logger.info(f"  Success: {item.get('success_score', 0):.2f}")
                logger.info(f"  Time: {item.get('execution_time_seconds', 0):.2f}s")
                logger.info(f"  Date: {item.get('executed_at', 'N/A')}")
                logger.info("")
            return True
        else:
            logger.error("✗ Failed to retrieve history")
            return False

    except Exception as e:
        logger.error(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_agent_execution_storage():
    """Test storing agent execution with fixed schema"""
    logger.info("=" * 70)
    logger.info("TEST 2: Agent Execution Storage")
    logger.info("=" * 70)

    try:
        bridge = AgentMemoryBridge()

        # Create test execution
        execution = AgentExecution(
            agent_name='crypto-expert',
            task_description='Test schema fixes for agent database integration',
            input_data={'test_mode': True, 'schema_version': 'v2'},
            output_data={
                'success': True,
                'tools_used': ['sqlite3', 'python'],
                'changes_made': ['Fixed created_at → executed_at', 'Fixed type → agent_type']
            },
            success_score=0.95,
            execution_time_ms=1500,
            memory_context=[],
            timestamp=datetime.now()
        )

        # Store execution
        result = await bridge.store_agent_execution(execution)

        if result.get('success'):
            logger.info("✓ Agent execution stored successfully")
            logger.info(f"  Agent: {execution.agent_name}")
            logger.info(f"  Success Score: {execution.success_score}")
            logger.info(f"  Execution Time: {execution.execution_time_ms}ms")
            return True
        else:
            logger.error(f"✗ Storage failed: {result.get('error')}")
            return False

    except Exception as e:
        logger.error(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_agent_recommendations():
    """Test getting agent recommendations"""
    logger.info("=" * 70)
    logger.info("TEST 3: Agent Recommendations")
    logger.info("=" * 70)

    try:
        bridge = AgentMemoryBridge()

        # Test context
        context = "Fix Python database schema errors in trading system"

        recommendations = await bridge.get_agent_recommendations(context)

        logger.info(f"✓ Retrieved {len(recommendations)} recommendations")
        for i, rec in enumerate(recommendations, 1):
            logger.info(f"\n{i}. {rec['agent_name']}")
            logger.info(f"   Confidence: {rec['confidence']:.3f}")
            logger.info(f"   Relevant Executions: {rec['relevant_executions']}")
            logger.info(f"   Reasons: {rec['reasons'][:2]}")  # Show first 2 reasons

        return True

    except Exception as e:
        logger.error(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    logger.info("\n" + "=" * 70)
    logger.info("Agent Memory Bridge - Schema Fix Verification")
    logger.info("=" * 70)

    results = []

    # Test 1: Agent History
    results.append(await test_agent_history())

    # Test 2: Agent Execution Storage
    results.append(await test_agent_execution_storage())

    # Test 3: Agent Recommendations
    results.append(await test_agent_recommendations())

    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("TEST SUMMARY")
    logger.info("=" * 70)
    passed = sum(results)
    total = len(results)
    logger.info(f"Passed: {passed}/{total} tests")

    if passed == total:
        logger.info("✅ All tests passed - schema fixes verified!")
        return 0
    else:
        logger.error(f"❌ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
