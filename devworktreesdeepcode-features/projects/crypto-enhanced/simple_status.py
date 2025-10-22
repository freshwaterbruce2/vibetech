#!/usr/bin/env python3
"""Simple status check without API calls"""

import sqlite3
import json
import os
from datetime import datetime, timedelta

def check_database_status():
    """Check trading database for recent activity"""
    try:
        conn = sqlite3.connect('trading.db')
        cursor = conn.cursor()

        # Check recent orders
        cursor.execute("""
            SELECT COUNT(*) FROM orders
            WHERE created_at > datetime('now', '-24 hours')
        """)
        recent_orders = cursor.fetchone()[0]

        # Check total orders
        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]

        # Check recent executions
        cursor.execute("""
            SELECT COUNT(*) FROM executions
            WHERE timestamp > datetime('now', '-24 hours')
        """)
        recent_executions = cursor.fetchone()[0]

        # Check balance from most recent entry
        cursor.execute("""
            SELECT usd_balance, xlm_balance, timestamp
            FROM balance_history
            ORDER BY timestamp DESC LIMIT 1
        """)
        balance_row = cursor.fetchone()

        conn.close()

        return {
            'recent_orders': recent_orders,
            'total_orders': total_orders,
            'recent_executions': recent_executions,
            'last_balance': balance_row if balance_row else None
        }
    except Exception as e:
        return {'error': str(e)}

def check_config():
    """Check trading configuration"""
    try:
        with open('trading_config.json', 'r') as f:
            config = json.load(f)
        return config
    except Exception as e:
        return {'error': str(e)}

def check_processes():
    """Check if trading processes are running"""
    import psutil
    trading_processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
            if 'start_live_trading.py' in cmdline or 'trading_engine.py' in cmdline:
                trading_processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'cmdline': cmdline
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    return trading_processes

def main():
    print("=" * 60)
    print("CRYPTO TRADING SYSTEM - SIMPLE STATUS CHECK")
    print("=" * 60)

    # Check configuration
    print("\n[CONFIG]")
    config = check_config()
    if 'error' in config:
        print(f"  Config Error: {config['error']}")
    else:
        print(f"  Trading Pairs: {config.get('trading_pairs', 'N/A')}")
        print(f"  Max Position Size: ${config.get('max_position_size', 'N/A')}")
        print(f"  Max Total Exposure: ${config.get('max_total_exposure', 'N/A')}")

    # Check database
    print("\n[DATABASE]")
    db_status = check_database_status()
    if 'error' in db_status:
        print(f"  Database Error: {db_status['error']}")
    else:
        print(f"  Total Orders: {db_status['total_orders']}")
        print(f"  Recent Orders (24h): {db_status['recent_orders']}")
        print(f"  Recent Executions (24h): {db_status['recent_executions']}")

        if db_status['last_balance']:
            usd, xlm, timestamp = db_status['last_balance']
            print(f"  Last Balance: ${usd:.2f} USD, {xlm:.4f} XLM ({timestamp})")

    # Check running processes
    print("\n[PROCESSES]")
    processes = check_processes()
    if processes:
        print(f"  Found {len(processes)} trading process(es):")
        for proc in processes:
            print(f"     PID {proc['pid']}: {proc['name']}")
    else:
        print("  No active trading processes found")

    # Check recent log files
    print("\n[LOGS]")
    log_files = ['trading_new.log', 'trading.log']
    for log_file in log_files:
        if os.path.exists(log_file):
            stat = os.stat(log_file)
            size_mb = stat.st_size / (1024 * 1024)
            mod_time = datetime.fromtimestamp(stat.st_mtime)
            time_diff = datetime.now() - mod_time

            if time_diff < timedelta(minutes=5):
                status = "ACTIVE"
            elif time_diff < timedelta(hours=1):
                status = "RECENT"
            else:
                status = "OLD"

            print(f"  {status} {log_file}: {size_mb:.1f}MB, modified {time_diff} ago")

    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()