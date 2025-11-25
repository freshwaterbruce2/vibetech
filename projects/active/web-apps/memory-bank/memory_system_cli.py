#!/usr/bin/env python3
"""
Memory System CLI - Complete Command Line Interface
Production deployment and management tool
"""

import asyncio
import click
import json
import sys
from pathlib import Path
from datetime import datetime

from enhanced_memory_manager import EnhancedMemoryManager, MemoryType
from context_retrieval_service import ContextRetrievalService, ContextQuery, RetrievalStrategy
from learning_bridge import LearningBridge
from monitoring_service import MonitoringService

@click.group()
@click.option('--config', default='production_config.json', help='Configuration file path')
@click.pass_context
def cli(ctx, config):
    """Enhanced Memory System CLI"""
    ctx.ensure_object(dict)
    ctx.obj['config'] = config

@cli.command()
@click.pass_context
def init(ctx):
    """Initialize the memory system"""
    config_path = ctx.obj['config']

    if not Path(config_path).exists():
        click.echo(f"Error: Configuration file {config_path} not found")
        sys.exit(1)

    try:
        memory_manager = EnhancedMemoryManager(config_path)
        click.echo("Memory system initialized successfully")

        # Test basic functionality
        test_data = {"init_test": True, "timestamp": datetime.now().isoformat()}
        result = asyncio.run(memory_manager.store_memory(
            "init_test", test_data, MemoryType.SHORT_TERM, {"init": True}
        ))

        if result["success"]:
            click.echo("System test passed - ready for use")
        else:
            click.echo("System test failed")
            sys.exit(1)

    except Exception as e:
        click.echo(f"Initialization failed: {e}")
        sys.exit(1)

@cli.command()
@click.argument('key')
@click.argument('data')
@click.option('--type', default='short_term', help='Memory type')
@click.option('--metadata', default='{}', help='Metadata JSON')
@click.pass_context
async def store(ctx, key, data, type, metadata):
    """Store data in memory system"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])

        # Parse inputs
        data_obj = json.loads(data) if data.startswith('{') else {"content": data}
        metadata_obj = json.loads(metadata)
        memory_type = getattr(MemoryType, type.upper())

        result = await memory_manager.store_memory(key, data_obj, memory_type, metadata_obj)

        if result["success"]:
            click.echo(f"Stored {key} successfully ({result['size_bytes']} bytes)")
        else:
            click.echo(f"Storage failed: {result.get('error', 'Unknown error')}")
            sys.exit(1)

    except Exception as e:
        click.echo(f"Storage error: {e}")
        sys.exit(1)

@cli.command()
@click.argument('key')
@click.option('--expand', is_flag=True, help='Expand compressed content')
@click.pass_context
async def retrieve(ctx, key, expand):
    """Retrieve data from memory system"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])
        result = await memory_manager.retrieve_memory(key, expand_context=expand)

        if result:
            click.echo(f"Retrieved {key}:")
            click.echo(f"Cache hit: {result.get('cache_hit', False)}")
            click.echo(f"Data: {json.dumps(result['data'], indent=2)}")
        else:
            click.echo(f"Key {key} not found")
            sys.exit(1)

    except Exception as e:
        click.echo(f"Retrieval error: {e}")
        sys.exit(1)

@cli.command()
@click.option('--keywords', required=True, help='Search keywords (comma-separated)')
@click.option('--intent', default='unknown', help='Intent category')
@click.option('--strategy', default='hybrid_scoring', help='Retrieval strategy')
@click.option('--limit', default=5, help='Max results')
@click.pass_context
async def search(ctx, keywords, intent, strategy, limit):
    """Search for relevant contexts"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])
        retrieval_service = ContextRetrievalService(memory_manager)

        query = ContextQuery(
            keywords=keywords.split(','),
            intent_category=intent,
            priority_level='normal',
            max_results=limit,
            strategy=getattr(RetrievalStrategy, strategy.upper())
        )

        results = await retrieval_service.query_context(query)

        click.echo(f"Found {len(results)} relevant contexts:")
        for i, result in enumerate(results, 1):
            click.echo(f"\n{i}. {result.key}")
            click.echo(f"   Relevance: {result.relevance_score:.3f}")
            click.echo(f"   Combined Score: {result.combined_score:.3f}")
            click.echo(f"   Type: {result.memory_type}")

    except Exception as e:
        click.echo(f"Search error: {e}")
        sys.exit(1)

@cli.command()
@click.option('--hours', default=168, help='Time window in hours')
@click.pass_context
async def analyze(ctx, hours):
    """Analyze patterns and generate insights"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])
        learning_bridge = LearningBridge(memory_manager)

        click.echo(f"Analyzing patterns from last {hours} hours...")
        patterns = await learning_bridge.analyze_memory_patterns(time_window_hours=hours)

        click.echo(f"Discovered {len(patterns)} patterns:")
        for pattern in patterns:
            click.echo(f"\n- {pattern.pattern_type.value}: {pattern.description}")
            click.echo(f"  Confidence: {pattern.confidence:.3f}")
            click.echo(f"  Frequency: {pattern.frequency}")
            click.echo(f"  Recommendations: {', '.join(pattern.recommendations[:2])}")

    except Exception as e:
        click.echo(f"Analysis error: {e}")
        sys.exit(1)

@cli.command()
@click.pass_context
async def status(ctx):
    """Show system status and performance"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])
        learning_bridge = LearningBridge(memory_manager)

        # Memory performance
        report = memory_manager.get_performance_report()
        click.echo("Memory System Status:")
        click.echo(f"  Cache Hit Rate: {report['kv_cache_hit_rate']}")
        click.echo(f"  Total Memories: {report['memory_stats']['total_memories']}")
        click.echo(f"  Storage Size: {report['memory_stats']['total_size_mb']:.2f}MB")

        # Learning metrics
        metrics = learning_bridge.get_learning_metrics()
        click.echo(f"\nLearning System Status:")
        click.echo(f"  Total Patterns: {metrics.total_patterns}")
        click.echo(f"  Active Patterns: {metrics.active_patterns}")
        click.echo(f"  Average Confidence: {metrics.avg_confidence:.3f}")
        click.echo(f"  Memory Integration: {metrics.memory_integration_score:.3f}")

    except Exception as e:
        click.echo(f"Status error: {e}")
        sys.exit(1)

@cli.command()
@click.option('--port', default=8765, help='WebSocket port')
@click.pass_context
async def monitor(ctx, port):
    """Start real-time monitoring service"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])
        learning_bridge = LearningBridge(memory_manager)
        monitoring_service = MonitoringService(memory_manager, learning_bridge)

        click.echo(f"Starting monitoring service on port {port}...")
        await monitoring_service.start_monitoring()

        click.echo("Monitoring service running. Press Ctrl+C to stop.")
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            click.echo("\nStopping monitoring service...")
            await monitoring_service.stop_monitoring()

    except Exception as e:
        click.echo(f"Monitoring error: {e}")
        sys.exit(1)

@cli.command()
@click.pass_context
async def cleanup(ctx):
    """Run memory cleanup and maintenance"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])

        click.echo("Running memory cleanup...")
        await memory_manager.cleanup_old_memories()

        click.echo("Running sync with learning system...")
        await memory_manager.sync_with_learning()

        click.echo("Cleanup completed successfully")

    except Exception as e:
        click.echo(f"Cleanup error: {e}")
        sys.exit(1)

@cli.command()
@click.argument('context')
@click.pass_context
async def recommend(ctx, context):
    """Get learning-based recommendations"""
    try:
        memory_manager = EnhancedMemoryManager(ctx.obj['config'])
        learning_bridge = LearningBridge(memory_manager)

        recommendations = await learning_bridge.get_learning_recommendations(context)

        click.echo(f"Recommendations for: '{context}'")
        for i, rec in enumerate(recommendations, 1):
            click.echo(f"\n{i}. {rec['description']}")
            click.echo(f"   Confidence: {rec['confidence']:.3f}")
            for suggestion in rec['recommendations']:
                click.echo(f"   - {suggestion}")

    except Exception as e:
        click.echo(f"Recommendation error: {e}")
        sys.exit(1)

@cli.command()
@click.pass_context
async def test(ctx):
    """Run system validation tests"""
    try:
        from simple_test import test_basic_functionality, test_performance_metrics

        click.echo("Running system validation tests...")

        basic_result = await test_basic_functionality()
        perf_result = await test_performance_metrics()

        if basic_result and perf_result:
            click.echo("All tests passed - system is ready for production")
        else:
            click.echo("Some tests failed - check system configuration")
            sys.exit(1)

    except Exception as e:
        click.echo(f"Test error: {e}")
        sys.exit(1)

def main():
    """Main CLI entry point"""
    cli()

if __name__ == '__main__':
    main()