#!/usr/bin/env python3
import sqlite3

try:
    # Test Learning DB
    conn1 = sqlite3.connect(r'D:\learning-system\agent_learning.db')
    cursor1 = conn1.cursor()
    cursor1.execute('SELECT COUNT(*) FROM agent_executions')
    executions = cursor1.fetchone()[0]
    conn1.close()

    # Test Main DB
    conn2 = sqlite3.connect(r'D:\databases\database.db')
    cursor2 = conn2.cursor()
    cursor2.execute('SELECT COUNT(*) FROM sqlite_master WHERE type=\'table\'')
    tables = cursor2.fetchone()[0]
    conn2.close()

    print(f'SUCCESS: {executions} executions, {tables} tables')
except Exception as e:
    print(f'ERROR: {e}')