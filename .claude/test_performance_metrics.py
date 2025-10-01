#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect(r'D:\learning-system\agent_learning.db')
cursor = conn.cursor()

# Get metrics
cursor.execute('SELECT COUNT(*) FROM agent_executions')
exec_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(DISTINCT a.name) FROM agent_executions ae JOIN agents a ON ae.agent_id = a.id')
agent_count = cursor.fetchone()[0]

cursor.execute('SELECT AVG(execution_time_seconds) FROM agent_executions WHERE execution_time_seconds IS NOT NULL')
avg_time = cursor.fetchone()[0] or 0

cursor.execute('SELECT COUNT(*) FROM agent_executions WHERE status = \'success\'')
success_count = cursor.fetchone()[0]

success_rate = (success_count / exec_count * 100) if exec_count > 0 else 0

print(f'Executions: {exec_count}')
print(f'Unique Agents: {agent_count}')
print(f'Avg Time: {avg_time:.2f}s')
print(f'Success Rate: {success_rate:.1f}%')

conn.close()