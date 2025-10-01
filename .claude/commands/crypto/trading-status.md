---
allowed-tools: Bash(python:*), Bash(sqlite3:*), Bash(tail:*), Read
description: Check current trading positions, orders, and system health
---

# Crypto Trading System Status

Check the comprehensive status of the live cryptocurrency trading system.

## System Health Check:

!cd projects/crypto-enhanced && python -c "import os; print('Trading system directory:', os.getcwd())"
!cd projects/crypto-enhanced && tail -20 trading_new.log 2>/dev/null || tail -20 logs/trading.log 2>/dev/null || echo "No recent logs found"

## Database Analysis:

!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT COUNT(*) as total_orders FROM orders;" 2>/dev/null || echo "Database not accessible"
!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT status, COUNT(*) as count FROM positions GROUP BY status;" 2>/dev/null
!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT * FROM orders WHERE status='open' ORDER BY created_at DESC LIMIT 5;" 2>/dev/null

## API Connectivity Test:

!cd projects/crypto-enhanced && python test_api_status.py 2>/dev/null || echo "API test script not available"

## Current Orders Check:

!cd projects/crypto-enhanced && python check_orders.py 2>/dev/null || echo "Order check script not available"

## Analysis:
Based on the status checks above, I'll provide:
1. System health assessment
2. Active positions summary
3. Recent trading activity
4. Any issues or warnings detected
5. Recommendations for optimization

$ARGUMENTS