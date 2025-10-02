#!/usr/bin/env python3
"""Performance analysis with 2025 benchmarks"""
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = r"D:\learning-system\agent_learning.db"

def analyze_agents():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Agent performance
    c.execute("""
        SELECT name, agent_type, success_rate, total_tasks, 
               successful_tasks, avg_execution_time, avg_tokens_used,
               created_at, updated_at
        FROM agents
        ORDER BY success_rate DESC
    """)
    agents = [{
        'name': r[0], 'type': r[1], 'success_rate': r[2],
        'total_tasks': r[3], 'successful': r[4],
        'avg_time': r[5], 'avg_tokens': r[6],
        'created': r[7], 'updated': r[8]
    } for r in c.fetchall()]
    
    # Recent executions (last 30 days)
    cutoff = (datetime.now() - timedelta(days=30)).isoformat()
    c.execute("""
        SELECT agent_id, status, execution_time, tokens_used,
               error_message, created_at
        FROM agent_executions
        WHERE created_at > ?
        ORDER BY created_at DESC
        LIMIT 100
    """, (cutoff,))
    executions = [{
        'agent': r[0], 'status': r[1], 'time': r[2],
        'tokens': r[3], 'error': r[4], 'timestamp': r[5]
    } for r in c.fetchall()]
    
    # Performance insights
    c.execute("""
        SELECT ai.insight_type, ai.insight_data, ai.confidence_score,
               ai.created_at
        FROM agent_insights ai
        ORDER BY ai.created_at DESC
        LIMIT 50
    """)
    insights = [{
        'type': r[0], 'data': json.loads(r[1]), 
        'confidence': r[2], 'timestamp': r[3]
    } for r in c.fetchall()]
    
    conn.close()
    
    # Calculate 2025 benchmarks
    total_success = sum(a['successful'] for a in agents)
    total_tasks = sum(a['total_tasks'] for a in agents)
    overall_success = (total_success / total_tasks * 100) if total_tasks > 0 else 0
    
    avg_time = sum(a['avg_time'] for a in agents if a['avg_time']) / len([a for a in agents if a['avg_time']]) if agents else 0
    avg_tokens = sum(a['avg_tokens'] for a in agents if a['avg_tokens']) / len([a for a in agents if a['avg_tokens']]) if agents else 0
    
    # Recent performance
    recent_success = len([e for e in executions if e['status'] == 'success'])
    recent_total = len(executions)
    recent_rate = (recent_success / recent_total * 100) if recent_total > 0 else 0
    
    metrics = {
        'timestamp': datetime.now().isoformat(),
        'overall': {
            'success_rate': round(overall_success, 2),
            'total_tasks': total_tasks,
            'successful_tasks': total_success,
            'avg_execution_time': round(avg_time, 2),
            'avg_tokens_used': round(avg_tokens, 2),
            'agent_count': len(agents)
        },
        'recent_30d': {
            'success_rate': round(recent_rate, 2),
            'total_executions': recent_total,
            'successful_executions': recent_success,
            'failed_executions': recent_total - recent_success
        },
        'agents': agents,
        'recent_executions': executions[:20],
        'insights': insights[:10],
        'benchmarks_2025': {
            'target_success_rate': 90,
            'target_avg_time': 45,
            'target_tokens_per_task': 8000,
            'current_vs_target': {
                'success_delta': round(90 - overall_success, 2),
                'time_delta': round(45 - avg_time, 2),
                'tokens_delta': round(8000 - avg_tokens, 2)
            }
        }
    }
    
    return metrics

if __name__ == '__main__':
    metrics = analyze_agents()
    print(json.dumps(metrics, indent=2))
