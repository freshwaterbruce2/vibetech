#!/usr/bin/env python3
"""
Agent Pattern Migration Script
Extracts patterns from proven performers and migrates to specialist agents
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATABASE_PATH = Path(r"D:\databases\database.db")
AGENTS_CONFIG_PATH = Path(r"C:\dev\.claude\agents.json")
OUTPUT_PATH = Path(r"C:\dev\projects\active\web-apps\memory-bank\agent_pattern_mapping.json")

# Map proven performers to specialist agents
AGENT_MAPPING = {
    'auto_fixer_001': ['crypto-expert', 'backend-expert', 'webapp-expert'],  # General fixer patterns
    'crypto-enhanced-trading': ['crypto-expert'],  # Trading-specific patterns
    'crypto_auto_fixer': ['crypto-expert'],  # Crypto-specific fixes
    'enhanced_market_001': ['crypto-expert']  # Market analysis patterns
}

class PatternExtractor:
    """Extract execution patterns from proven performers"""

    def __init__(self):
        self.conn = sqlite3.connect(DATABASE_PATH)
        self.conn.row_factory = sqlite3.Row

    def extract_agent_patterns(self, agent_name):
        """Extract patterns from a specific agent's executions"""
        cursor = self.conn.cursor()

        # Get agent ID
        cursor.execute("SELECT id FROM agent_registry WHERE name = ?", (agent_name,))
        agent_row = cursor.fetchone()
        if not agent_row:
            logger.warning(f"Agent {agent_name} not found in registry")
            return None

        agent_id = agent_row['id']

        # Get execution statistics
        cursor.execute("""
            SELECT
                task_type,
                COUNT(*) as execution_count,
                AVG(success_score) as avg_success,
                AVG(execution_time_seconds) as avg_time,
                MIN(execution_time_seconds) as min_time,
                MAX(execution_time_seconds) as max_time
            FROM agent_executions
            WHERE agent_id = ? AND status = 'success'
            GROUP BY task_type
            ORDER BY execution_count DESC
        """, (agent_id,))

        task_patterns = []
        for row in cursor.fetchall():
            task_patterns.append({
                'task_type': row['task_type'],
                'execution_count': row['execution_count'],
                'avg_success_score': row['avg_success'],
                'avg_execution_time': row['avg_time'],
                'min_execution_time': row['min_time'],
                'max_execution_time': row['max_time']
            })

        # Get sample task descriptions for each type
        task_samples = {}
        for pattern in task_patterns:
            cursor.execute("""
                SELECT task_description
                FROM agent_executions
                WHERE agent_id = ? AND task_type = ? AND status = 'success'
                ORDER BY success_score DESC
                LIMIT 5
            """, (agent_id, pattern['task_type']))

            samples = [row['task_description'] for row in cursor.fetchall()]
            task_samples[pattern['task_type']] = samples

        # Get overall performance
        cursor.execute("""
            SELECT
                COUNT(*) as total_executions,
                AVG(success_score) as overall_success,
                AVG(execution_time_seconds) as overall_avg_time,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count
            FROM agent_executions
            WHERE agent_id = ?
        """, (agent_id,))

        stats = cursor.fetchone()

        return {
            'agent_name': agent_name,
            'total_executions': stats['total_executions'],
            'success_rate': stats['success_count'] / stats['total_executions'] if stats['total_executions'] > 0 else 0,
            'avg_success_score': stats['overall_success'],
            'avg_execution_time': stats['overall_avg_time'],
            'task_patterns': task_patterns,
            'task_samples': task_samples
        }

    def extract_all_patterns(self):
        """Extract patterns from all proven performers"""
        all_patterns = {}

        for agent_name in AGENT_MAPPING.keys():
            logger.info(f"Extracting patterns from {agent_name}...")
            patterns = self.extract_agent_patterns(agent_name)
            if patterns:
                all_patterns[agent_name] = patterns
                logger.info(f"  - {patterns['total_executions']} executions")
                logger.info(f"  - {patterns['success_rate']:.2%} success rate")
                logger.info(f"  - {len(patterns['task_patterns'])} task types")

        return all_patterns

    def close(self):
        self.conn.close()


class PatternMigrator:
    """Migrate patterns from proven performers to specialist agents"""

    def __init__(self, extracted_patterns):
        self.patterns = extracted_patterns

    def map_patterns_to_specialists(self):
        """Map extracted patterns to specialist agents"""
        specialist_patterns = defaultdict(lambda: {
            'inherited_from': [],
            'task_types': defaultdict(list),
            'capabilities': [],
            'performance_targets': {},
            'execution_samples': []
        })

        for proven_agent, pattern_data in self.patterns.items():
            target_specialists = AGENT_MAPPING.get(proven_agent, [])

            for specialist in target_specialists:
                # Record inheritance
                specialist_patterns[specialist]['inherited_from'].append({
                    'agent': proven_agent,
                    'executions': pattern_data['total_executions'],
                    'success_rate': pattern_data['success_rate']
                })

                # Transfer task patterns
                for task_pattern in pattern_data['task_patterns']:
                    task_type = task_pattern['task_type']
                    specialist_patterns[specialist]['task_types'][task_type].append({
                        'from_agent': proven_agent,
                        'execution_count': task_pattern['execution_count'],
                        'avg_success': task_pattern['avg_success_score'],
                        'avg_time': task_pattern['avg_execution_time']
                    })

                # Add execution samples
                for task_type, samples in pattern_data['task_samples'].items():
                    specialist_patterns[specialist]['execution_samples'].extend([
                        {'task': sample, 'type': task_type, 'from': proven_agent}
                        for sample in samples[:2]  # Top 2 samples per type
                    ])

                # Set performance targets based on proven performance
                if not specialist_patterns[specialist]['performance_targets']:
                    specialist_patterns[specialist]['performance_targets'] = {
                        'target_success_rate': pattern_data['success_rate'],
                        'target_execution_time': pattern_data['avg_execution_time']
                    }

        # Generate capabilities list for each specialist
        for specialist, data in specialist_patterns.items():
            task_types = list(data['task_types'].keys())
            data['capabilities'] = self._generate_capabilities(specialist, task_types)

        return dict(specialist_patterns)

    def _generate_capabilities(self, specialist, task_types):
        """Generate capability descriptions based on task types"""
        capability_map = {
            'crypto-expert': {
                'database': 'Database schema management and migration',
                'api': 'Kraken API integration and error handling',
                'websocket': 'WebSocket V2 connection management',
                'trading': 'Trading strategy execution and monitoring',
                'debugging': 'Trading system debugging and diagnostics',
                'testing': 'Test suite development and execution',
                'refactoring': 'Code refactoring for performance and maintainability'
            },
            'webapp-expert': {
                'component': 'React component development and optimization',
                'state': 'State management with React Query',
                'routing': 'React Router configuration and navigation',
                'ui': 'shadcn/ui component integration',
                'testing': 'Playwright and Vitest test development',
                'debugging': 'Frontend debugging and error handling',
                'refactoring': 'Component refactoring and code reuse'
            },
            'backend-expert': {
                'api': 'REST API development and error handling',
                'database': 'Database design and optimization',
                'authentication': 'Authentication and authorization',
                'testing': 'API test suite development',
                'debugging': 'Backend debugging and logging',
                'refactoring': 'Backend architecture improvements'
            }
        }

        specialist_capabilities = capability_map.get(specialist, {})
        capabilities = []

        for task_type in task_types:
            # Match task type to capability
            for key, desc in specialist_capabilities.items():
                if key in task_type.lower() or task_type.lower() in key:
                    capabilities.append(desc)

        return list(set(capabilities))  # Remove duplicates

    def save_migration_data(self, output_path):
        """Save migration data to JSON file"""
        specialist_patterns = self.map_patterns_to_specialists()

        migration_data = {
            'timestamp': datetime.now().isoformat(),
            'source_agents': list(self.patterns.keys()),
            'specialist_patterns': specialist_patterns,
            'mapping': AGENT_MAPPING,
            'summary': {
                'proven_performers': len(self.patterns),
                'specialists_enhanced': len(specialist_patterns),
                'total_executions_analyzed': sum(p['total_executions'] for p in self.patterns.values())
            }
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(migration_data, f, indent=2, ensure_ascii=False)

        logger.info(f"\n✅ Migration data saved to {output_path}")
        return migration_data


def main():
    """Main execution"""
    logger.info("Starting agent pattern migration...")
    logger.info("=" * 60)

    # Extract patterns from proven performers
    extractor = PatternExtractor()
    patterns = extractor.extract_all_patterns()
    extractor.close()

    logger.info("\n" + "=" * 60)
    logger.info("Pattern Extraction Complete")
    logger.info("=" * 60)

    # Migrate patterns to specialists
    migrator = PatternMigrator(patterns)
    migration_data = migrator.save_migration_data(OUTPUT_PATH)

    # Display summary
    logger.info("\n" + "=" * 60)
    logger.info("MIGRATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Proven Performers Analyzed: {migration_data['summary']['proven_performers']}")
    logger.info(f"Specialists Enhanced: {migration_data['summary']['specialists_enhanced']}")
    logger.info(f"Total Executions Analyzed: {migration_data['summary']['total_executions_analyzed']}")

    logger.info("\nSpecialist Enhancements:")
    for specialist, data in migration_data['specialist_patterns'].items():
        logger.info(f"\n  {specialist}:")
        logger.info(f"    Inherited from: {', '.join([i['agent'] for i in data['inherited_from']])}")
        logger.info(f"    Task types: {len(data['task_types'])}")
        logger.info(f"    Capabilities: {len(data['capabilities'])}")
        logger.info(f"    Target success rate: {data['performance_targets']['target_success_rate']:.2%}")

    return migration_data


if __name__ == "__main__":
    exit(0 if main() else 1)
