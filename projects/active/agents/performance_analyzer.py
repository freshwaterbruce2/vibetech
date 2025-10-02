#!/usr/bin/env python3
"""Performance analyzer - generates optimization targets"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = r"D:\learning-system\agent_learning.db"

def analyze():
    """Extract metrics and generate optimization targets"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Agent performance
    cur.execute("""
        SELECT name, agent_type, success_rate, total_tasks, 
               successful_tasks, avg_execution_time, avg_tokens_used
        FROM agents
        ORDER BY total_tasks DESC
    """)
    agents = cur.fetchall()
    
    # Recent executions
    cur.execute("""
        SELECT agent_name, status, execution_time, tokens_used, created_at
        FROM agent_executions
        WHERE created_at > datetime('now', '-7 days')
        ORDER BY created_at DESC
        LIMIT 100
    """)
    executions = cur.fetchall()
    
    # Calculate bottlenecks
    metrics = {
        'agents': [
            {
                'name': a[0], 'type': a[1], 'success_rate': a[2],
                'total_tasks': a[3], 'successful': a[4],
                'avg_time': a[5], 'avg_tokens': a[6]
            } for a in agents
        ],
        'recent_executions': len(executions),
        'avg_execution_time': sum(e[2] for e in executions if e[2]) / len(executions) if executions else 0,
        'avg_tokens': sum(e[3] for e in executions if e[3]) / len(executions) if executions else 0,
        'success_rate': sum(1 for e in executions if e[1] == 'success') / len(executions) * 100 if executions else 0
    }
    
    # Identify optimization targets
    targets = []
    for agent in metrics['agents']:
        if agent['success_rate'] < 0.85:
            targets.append({
                'agent': agent['name'],
                'issue': 'low_success_rate',
                'current': agent['success_rate'],
                'target': 0.90
            })
        if agent['avg_tokens'] > 8000:
            targets.append({
                'agent': agent['name'],
                'issue': 'high_token_usage',
                'current': agent['avg_tokens'],
                'target': 6000
            })
    
    conn.close()
    
    output = {
        'timestamp': datetime.now().isoformat(),
        'metrics': metrics,
        'optimization_targets': targets
    }
    
    with open('performance_report.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(json.dumps(output, indent=2))
    return output

if __name__ == '__main__':
    analyze()
