#!/usr/bin/env python3
"""
Quick Status Dashboard - Daily trading system health check
Combines live API data with performance metrics
"""
import asyncio
import logging
import sqlite3
from datetime import datetime, timedelta
from config import Config
from kraken_client import KrakenClient
from performance_monitor import PerformanceMonitor

logging.basicConfig(level=logging.WARNING)  # Reduce noise

async def check_status():
    """Quick dashboard showing current system state"""

    # Initialize
    config = Config()
    monitor = PerformanceMonitor()

    # Header
    print("\n" + "="*70)
    print(f"TRADING SYSTEM DASHBOARD - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70 + "\n")

    # ======================
    # LIVE DATA (API)
    # ======================
    try:
        async with KrakenClient(config, use_secondary_key=True) as kraken:
            # Get balance
            balance = await kraken.get_account_balance()
            usd_balance = float(balance.get('ZUSD', 0))
            xlm_balance = float(balance.get('XXLM', 0))

            # Get open orders
            orders = await kraken.get_open_orders()
            open_order_count = len(orders.get('open', {})) if orders else 0

            print("LIVE ACCOUNT STATUS")
            print(f"  USD Balance: ${usd_balance:.2f}")
            print(f"  XLM Balance: {xlm_balance:.2f} XLM (~${xlm_balance * 0.35:.2f})")
            print(f"  Total Value: ${usd_balance + (xlm_balance * 0.35):.2f}")
            print(f"  Open Orders: {open_order_count}")
            print()

    except Exception as e:
        print(f"API ERROR - Could not fetch live data: {e}")
        print()

    # ======================
    # DATABASE STATS
    # ======================
    try:
        conn = sqlite3.connect('trading.db')
        cursor = conn.cursor()

        # Open positions
        cursor.execute("SELECT COUNT(*) FROM positions WHERE status='open'")
        open_positions = cursor.fetchone()[0]

        # Recent errors (last 24h)
        yesterday = (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            SELECT COUNT(*) FROM events
            WHERE severity IN ('ERROR', 'CRITICAL')
            AND timestamp >= ?
        """, (yesterday,))
        recent_errors = cursor.fetchone()[0]

        # Total trades today
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT COUNT(*) FROM executions
            WHERE order_status='filled'
            AND timestamp >= ?
        """, (today,))
        trades_today = cursor.fetchone()[0]

        conn.close()

        print("POSITION STATUS")
        print(f"  Open Positions: {open_positions}")
        print(f"  Trades Today: {trades_today}")
        print(f"  Errors (24h): {recent_errors}")
        print()

    except Exception as e:
        print(f"DATABASE ERROR - {e}")
        print()

    # ======================
    # 7-DAY PERFORMANCE
    # ======================
    try:
        metrics = monitor.calculate_metrics(days=7)

        if metrics.get('status') == 'insufficient_data':
            print("7-DAY PERFORMANCE")
            print("  Status: Insufficient data (no completed trades)")
            print()
        else:
            print("7-DAY PERFORMANCE")
            print(f"  Completed Trades: {metrics['completed_pairs']}")
            print(f"  Win Rate: {metrics['win_rate']}% ({metrics['win_count']}W / {metrics['loss_count']}L)")
            print(f"  Net P&L: ${metrics['net_pnl']:.2f}")
            print(f"  Expectancy: ${metrics['expectancy']:.4f} per trade")
            print(f"  Profit Factor: {metrics['profit_factor']}")
            print(f"  Max Drawdown: {metrics['max_drawdown_pct']:.2f}%")
            print()

    except Exception as e:
        print(f"PERFORMANCE CALC ERROR - {e}")
        print()

    # ======================
    # SCALING READINESS
    # ======================
    try:
        metrics_30d = monitor.calculate_metrics(days=30)

        if metrics_30d.get('status') == 'insufficient_data':
            print("CAPITAL SCALING READINESS")
            print("  Status: Monitoring in progress...")
            print("  Need: 50 complete trades for validation")
            print()
        else:
            readiness = metrics_30d['ready_to_scale']

            print("CAPITAL SCALING READINESS (30-day)")
            print(f"  {readiness['recommendation']}")
            print()
            print("  Criteria:")
            for criterion, met in readiness['criteria_met'].items():
                status = "✅" if met else "❌"
                name = criterion.replace('_', ' ').title()
                print(f"    {status} {name}")
            print()

    except Exception as e:
        print(f"READINESS CHECK ERROR - {e}")
        print()

    # ======================
    # QUICK COMMANDS
    # ======================
    print("="*70)
    print("MONITORING COMMANDS")
    print("="*70)
    print("  python performance_monitor.py daily    - Last 24 hours detailed")
    print("  python performance_monitor.py weekly   - Last 7 days detailed")
    print("  python performance_monitor.py monthly  - Last 30 days detailed")
    print("  python performance_monitor.py snapshot - Save daily snapshot")
    print("  python check_status.py                 - This dashboard")
    print("="*70)
    print()

if __name__ == "__main__":
    asyncio.run(check_status())
