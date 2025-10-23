#!/usr/bin/env python3
"""
Agent Training Script - Automated Learning Pipeline
Analyzes agent executions, discovers patterns, and generates recommendations

Run this script daily to keep agent knowledge up-to-date:
  python train_agents.py --hours 168  # Analyze last week
  python train_agents.py --all        # Analyze all data
"""

import argparse
import asyncio
import json
import sqlite3
import logging
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict, Counter

from enhanced_memory_manager import EnhancedMemoryManager
from learning_bridge import LearningBridge

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path(__file__).parent / 'training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

DATABASE_PATH = Path(r"D:\databases\database.db")

class AgentTrainer:
    """Automated agent training and pattern analysis"""

    def __init__(self):
        self.memory_manager = EnhancedMemoryManager()
        self.learning_bridge = LearningBridge(self.memory_manager)
        self.db_path = DATABASE_PATH

    async def analyze_agent_performance(self, hours=168):
        """Analyze agent performance over time window"""
        logger.info(f"Analyzing agent performance (last {hours} hours)...")

        cutoff_time = datetime.now() - timedelta(hours=hours)

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get agent performance stats
            cursor.execute("""
                SELECT
                    ar.name,
                    ar.agent_type,
                    COUNT(ae.id) as total_executions,
                    AVG(ae.success_score) as avg_success,
                    AVG(ae.execution_time_seconds) as avg_time,
                    COUNT(CASE WHEN ae.status = 'success' THEN 1 END) as successes,
                    COUNT(CASE WHEN ae.status = 'failure' THEN 1 END) as failures
                FROM agent_registry ar
                LEFT JOIN agent_executions ae ON ar.id = ae.agent_id
                WHERE ae.executed_at >= ?
                GROUP BY ar.id, ar.name, ar.agent_type
                ORDER BY total_executions DESC
            """, (cutoff_time,))

            results = cursor.fetchall()
            conn.close()

            performance_data = []
            for row in results:
                name, agent_type, total, avg_success, avg_time, successes, failures = row
                if total > 0:  # Only include agents with executions
                    performance_data.append({
                        'agent_name': name,
                        'agent_type': agent_type,
                        'total_executions': total,
                        'avg_success_score': avg_success or 0.0,
                        'avg_execution_time': avg_time or 0.0,
                        'successes': successes,
                        'failures': failures,
                        'success_rate': successes / total if total > 0 else 0.0
                    })

            logger.info(f"Analyzed {len(performance_data)} agents with execution history")

            # Display top performers
            logger.info("\n📊 Top Performing Agents:")
            for agent in sorted(performance_data, key=lambda x: x['avg_success_score'], reverse=True)[:10]:
                logger.info(f"  {agent['agent_name']}: {agent['avg_success_score']:.2f} avg success ({agent['total_executions']} tasks)")

            return performance_data

        except Exception as e:
            logger.error(f"Failed to analyze agent performance: {e}")
            return []

    async def discover_patterns(self, hours=168):
        """Discover patterns from agent executions"""
        logger.info(f"Discovering patterns from last {hours} hours...")

        try:
            # Use learning bridge to analyze patterns
            patterns = await self.learning_bridge.analyze_memory_patterns(time_window_hours=hours)

            logger.info(f"\n🔍 Pattern Discovery Results:")
            logger.info(f"  Total Patterns: {len(patterns)}")

            # Categorize patterns
            pattern_types = defaultdict(int)
            for pattern in patterns:
                pattern_types[pattern.pattern_type.value] += 1

            for pattern_type, count in pattern_types.items():
                logger.info(f"  {pattern_type}: {count}")

            # Show top patterns
            logger.info(f"\n⭐ Top Patterns by Confidence:")
            for pattern in sorted(patterns, key=lambda x: x.confidence, reverse=True)[:5]:
                logger.info(f"\n  {pattern.pattern_id}")
                logger.info(f"    Type: {pattern.pattern_type.value}")
                logger.info(f"    Confidence: {pattern.confidence:.3f}")
                logger.info(f"    Frequency: {pattern.frequency}")
                logger.info(f"    Success Rate: {pattern.success_rate:.1%}")
                logger.info(f"    Description: {pattern.description}")
                if pattern.recommendations:
                    logger.info(f"    Recommendations:")
                    for rec in pattern.recommendations[:3]:
                        logger.info(f"      - {rec}")

            return patterns

        except Exception as e:
            logger.error(f"Failed to discover patterns: {e}")
            import traceback
            traceback.print_exc()
            return []

    async def generate_agent_insights(self, performance_data, patterns):
        """Generate insights for each specialist agent"""
        logger.info("\n🧠 Generating Agent Insights...")

        insights = {}

        for agent_data in performance_data:
            agent_name = agent_data['agent_name']

            # Find relevant patterns for this agent
            agent_patterns = [p for p in patterns if agent_name in p.projects_applicable or agent_data['agent_type'] in p.description.lower()]

            # Collect recommendations
            recommendations = []
            for pattern in agent_patterns:
                recommendations.extend(pattern.recommendations)

            # Deduplicate
            unique_recs = list(set(recommendations))[:10]

            insights[agent_name] = {
                'performance': agent_data,
                'relevant_patterns': len(agent_patterns),
                'recommendations': unique_recs,
                'top_patterns': [p.pattern_id for p in sorted(agent_patterns, key=lambda x: x.confidence, reverse=True)[:5]]
            }

            logger.info(f"\n  {agent_name}:")
            logger.info(f"    Performance: {agent_data['avg_success_score']:.2f} avg success")
            logger.info(f"    Relevant Patterns: {len(agent_patterns)}")
            logger.info(f"    Recommendations: {len(unique_recs)}")

        return insights

    async def save_training_results(self, performance_data, patterns, insights):
        """Save training results for future use"""
        logger.info("\n💾 Saving Training Results...")

        training_data = {
            'timestamp': datetime.now().isoformat(),
            'performance_data': performance_data,
            'pattern_count': len(patterns),
            'agent_insights': insights
        }

        output_file = Path(__file__).parent / 'training_results.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2)

        logger.info(f"✓ Training results saved to {output_file}")

        # Also save a summary for quick reference
        summary_file = Path(__file__).parent / 'training_summary.txt'
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"Agent Training Summary - {datetime.now().isoformat()}\n")
            f.write("=" * 70 + "\n\n")

            f.write(f"Agents Analyzed: {len(performance_data)}\n")
            f.write(f"Patterns Discovered: {len(patterns)}\n")
            f.write(f"Insights Generated: {len(insights)}\n\n")

            f.write("Top Performing Agents:\n")
            for agent in sorted(performance_data, key=lambda x: x['avg_success_score'], reverse=True)[:10]:
                f.write(f"  {agent['agent_name']}: {agent['avg_success_score']:.2f} ({agent['total_executions']} tasks)\n")

        logger.info(f"✓ Training summary saved to {summary_file}")

    async def train(self, hours=168, analyze_all=False):
        """Run complete training pipeline"""
        logger.info("=" * 70)
        logger.info("AGENT TRAINING PIPELINE")
        logger.info("=" * 70)
        logger.info(f"Mode: {'Full Analysis' if analyze_all else f'Last {hours} hours'}")
        logger.info(f"Started: {datetime.now()}")
        logger.info("=" * 70)

        if analyze_all:
            hours = 24 * 365 * 10  # 10 years worth of data

        try:
            # Step 1: Analyze agent performance
            performance_data = await self.analyze_agent_performance(hours)

            # Step 2: Discover patterns
            patterns = await self.discover_patterns(hours)

            # Step 3: Generate insights
            insights = await self.generate_agent_insights(performance_data, patterns)

            # Step 4: Save results
            await self.save_training_results(performance_data, patterns, insights)

            # Step 5: Update learning metrics
            metrics = self.learning_bridge.get_learning_metrics()
            logger.info("\n📈 Learning System Metrics:")
            logger.info(f"  Total Patterns: {metrics.total_patterns}")
            logger.info(f"  Active Patterns: {metrics.active_patterns}")
            logger.info(f"  Avg Confidence: {metrics.avg_confidence:.3f}")
            logger.info(f"  Success Rate Improvement: {metrics.success_rate_improvement:.1%}")
            logger.info(f"  Memory Integration Score: {metrics.memory_integration_score:.3f}")
            logger.info(f"  Cross-Project Transfers: {metrics.cross_project_transfers}")

            logger.info("\n" + "=" * 70)
            logger.info("✅ TRAINING COMPLETE")
            logger.info("=" * 70)
            logger.info(f"  Agents Analyzed: {len(performance_data)}")
            logger.info(f"  Patterns Discovered: {len(patterns)}")
            logger.info(f"  Insights Generated: {len(insights)}")
            logger.info(f"  Duration: {datetime.now()}")
            logger.info("=" * 70)

            return True

        except Exception as e:
            logger.error(f"❌ Training failed: {e}")
            import traceback
            traceback.print_exc()
            return False

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Agent Training Pipeline')
    parser.add_argument('--hours', type=int, default=168,
                      help='Analyze last N hours of data (default: 168 = 1 week)')
    parser.add_argument('--all', action='store_true',
                      help='Analyze all available data')
    parser.add_argument('--quiet', action='store_true',
                      help='Reduce logging output')

    args = parser.parse_args()

    if args.quiet:
        logging.getLogger().setLevel(logging.WARNING)

    trainer = AgentTrainer()
    success = await trainer.train(hours=args.hours, analyze_all=args.all)

    return 0 if success else 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
