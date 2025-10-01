---
allowed-tools: Bash(sqlite3:*), Bash(python:*)
description: Analyze current trading positions with risk metrics
---

# Trading Position Analysis

Comprehensive analysis of all current trading positions with risk metrics and recommendations.

## Current Open Positions:

!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT p.*, o.price as entry_price, o.volume FROM positions p LEFT JOIN orders o ON p.order_id = o.id WHERE p.status = 'open';" 2>/dev/null

## Position Statistics:

!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT pair, COUNT(*) as position_count, SUM(CAST(volume as REAL)) as total_volume, AVG(CAST(entry_price as REAL)) as avg_entry FROM positions WHERE status = 'open' GROUP BY pair;" 2>/dev/null

## Risk Metrics:

!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT SUM(CAST(volume as REAL) * CAST(entry_price as REAL)) as total_exposure FROM positions WHERE status = 'open';" 2>/dev/null

## Recent Performance:

!cd projects/crypto-enhanced && sqlite3 trading.db "SELECT DATE(closed_at) as date, COUNT(*) as trades, SUM(profit_loss) as daily_pnl FROM positions WHERE status = 'closed' AND closed_at > datetime('now', '-7 days') GROUP BY DATE(closed_at);" 2>/dev/null

## Analysis:

Based on the position data above, I'll provide:

1. **Risk Assessment:**
   - Current exposure vs limits
   - Position concentration
   - Drawdown analysis

2. **Performance Metrics:**
   - Win rate
   - Average profit/loss
   - Sharpe ratio estimate

3. **Recommendations:**
   - Rebalancing suggestions
   - Risk reduction if needed
   - Opportunity identification

$ARGUMENTS