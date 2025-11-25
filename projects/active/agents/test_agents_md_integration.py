#!/usr/bin/env python3
"""
Test script for AGENTS.md integration validation
Tests all project types and context extraction
"""

import sys
import os
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from claude_code_bridge import ClaudeCodeBridge
import logging

logging.basicConfig(level=logging.WARNING)  # Reduce noise for tests

def test_agents_md_integration():
    """Comprehensive test of AGENTS.md integration"""
    bridge = ClaudeCodeBridge()

    test_cases = [
        {
            'name': 'Root Directory (Monorepo)',
            'directory': '../../..',
            'expected_project_type': 'monorepo-root',
            'expected_tech_count': 8,
            'test_prompt': 'create a new React component'
        },
        {
            'name': 'Crypto Trading System',
            'directory': '../../../projects/crypto-enhanced',
            'expected_project_type': 'crypto-trading',
            'expected_tech_count': 2,
            'test_prompt': 'implement security measures for trading API'
        },
        {
            'name': 'Memory Bank System',
            'directory': '../../../projects/active/web-apps/memory-bank',
            'expected_project_type': 'memory-system',
            'expected_tech_count': 1,
            'test_prompt': 'optimize cache performance'
        }
    ]

    results = []

    print("AGENTS.md Integration Test Suite")
    print("=" * 50)

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   Directory: {test_case['directory']}")

        try:
            # Test AGENTS.md discovery
            agents_md_content = bridge.find_agents_md(test_case['directory'])
            if not agents_md_content:
                print(f"   ❌ FAILED: No AGENTS.md found")
                results.append(False)
                continue

            # Test context extraction
            context = bridge.extract_agents_md_context(agents_md_content)

            # Validate project type
            actual_type = context.get('project_type', 'unknown')
            expected_type = test_case['expected_project_type']
            type_match = actual_type == expected_type

            # Validate technology count
            tech_count = len(context.get('technology_stack', []))
            expected_count = test_case['expected_tech_count']
            tech_match = tech_count >= expected_count  # At least expected count

            # Test task routing
            task_context = {'working_directory': test_case['directory']}
            analysis = bridge.analyze_task(test_case['test_prompt'], task_context)
            routing_success = len(analysis.get('required_agents', [])) > 0

            # Report results
            print(f"   Project Type: {actual_type} {'PASS' if type_match else 'FAIL'}")
            print(f"   Tech Stack: {tech_count} technologies {'PASS' if tech_match else 'FAIL'}")
            print(f"   Agent Routing: {analysis.get('required_agents', [])} {'PASS' if routing_success else 'FAIL'}")

            if context.get('specific_patterns'):
                print(f"   Patterns: {', '.join(context['specific_patterns'])}")

            test_passed = type_match and tech_match and routing_success
            results.append(test_passed)

            if test_passed:
                print(f"   RESULT: PASSED")
            else:
                print(f"   RESULT: FAILED")

        except Exception as e:
            print(f"   ERROR: {e}")
            results.append(False)

    # Summary
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)

    if passed == total:
        print(f"ALL TESTS PASSED ({passed}/{total})")
        print("\nAGENTS.md Integration is PRODUCTION READY")
        return True
    else:
        print(f"{total - passed} TESTS FAILED ({passed}/{total})")
        return False

if __name__ == "__main__":
    success = test_agents_md_integration()
    sys.exit(0 if success else 1)