#!/usr/bin/env python3
"""
30-Day Performance Monitoring System
Tracks proof of profitability for capital scaling decision
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import statistics


class PerformanceMonitor:
    """Monitor trading performance to validate profitability"""

    def __init__(self, db_path: str = "trading.db"):
        self.db_path = db_path
        self.start_date = datetime.now()

    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)

    def calculate_metrics(self, days: int = 30) -> Dict:
        """Calculate comprehensive performance metrics"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')

        # Get all completed trades (filled orders)
        cursor.execute("""
            SELECT
                side,
                last_price,
                last_qty,
                cost,
                fee_usd_equiv,
                timestamp,
                liquidity_ind
            FROM executions
            WHERE order_status = 'filled'
            AND timestamp >= ?
            ORDER BY timestamp
        """, (cutoff,))

        trades = cursor.fetchall()

        # Get balance history
        cursor.execute("""
            SELECT usd_balance, xlm_balance, timestamp
            FROM balance_history
            WHERE timestamp >= ?
            ORDER BY timestamp
        """, (cutoff,))

        balance_history = cursor.fetchall()

        # Get system events (crashes, errors)
        cursor.execute("""
            SELECT COUNT(*) as error_count
            FROM events
            WHERE severity IN ('ERROR', 'CRITICAL')
            AND timestamp >= ?
        """, (cutoff,))

        error_count = cursor.fetchone()[0]

        conn.close()

        # Calculate metrics
        if not trades:
            return {
                'status': 'insufficient_data',
                'message': 'No trades in period',
                'days_monitored': 0
            }

        metrics = self._analyze_trades(trades, balance_history)
        metrics['error_count'] = error_count
        metrics['days_monitored'] = days

        return metrics

    def _analyze_trades(self, trades: List, balance_history: List) -> Dict:
        """Analyze trade performance"""

        # Separate buys and sells
        buys = []
        sells = []

        for trade in trades:
            side, price, qty, cost, fee, timestamp, liquidity = trade

            if side == 'buy':
                buys.append({
                    'price': price,
                    'qty': qty,
                    'cost': cost,
                    'fee': fee,
                    'timestamp': timestamp,
                    'liquidity': liquidity
                })
            else:
                sells.append({
                    'price': price,
                    'qty': qty,
                    'cost': cost,
                    'fee': fee,
                    'timestamp': timestamp,
                    'liquidity': liquidity
                })

        # Calculate P&L by matching buys to sells (FIFO)
        realized_pnl = []
        total_fees = sum(t.get('fee', 0) for t in trades if t[4])

        # Simple approach: match sells to oldest buys
        buy_queue = list(buys)

        for sell in sells:
            if not buy_queue:
                break

            # Match this sell to oldest buy
            buy = buy_queue.pop(0)

            # P&L = (sell_price - buy_price) * qty - fees
            pnl = (sell['price'] - buy['price']) * min(sell['qty'], buy['qty'])
            pnl -= (buy['fee'] + sell['fee'])

            realized_pnl.append({
                'pnl': pnl,
                'buy_price': buy['price'],
                'sell_price': sell['price'],
                'qty': min(sell['qty'], buy['qty']),
                'return_pct': ((sell['price'] - buy['price']) / buy['price']) * 100
            })

        # Calculate statistics
        if realized_pnl:
            wins = [p for p in realized_pnl if p['pnl'] > 0]
            losses = [p for p in realized_pnl if p['pnl'] < 0]

            win_count = len(wins)
            loss_count = len(losses)
            total_count = len(realized_pnl)

            win_rate = (win_count / total_count * 100) if total_count > 0 else 0

            avg_win = statistics.mean([w['pnl'] for w in wins]) if wins else 0
            avg_loss = statistics.mean([l['pnl'] for l in losses]) if losses else 0

            total_pnl = sum(p['pnl'] for p in realized_pnl)

            # Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
            expectancy = (win_rate/100 * avg_win) - ((100-win_rate)/100 * abs(avg_loss))

            # Profit factor = Gross Profit / Gross Loss
            gross_profit = sum(w['pnl'] for w in wins) if wins else 0
            gross_loss = abs(sum(l['pnl'] for l in losses)) if losses else 0
            profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else float('inf')

        else:
            win_rate = 0
            avg_win = 0
            avg_loss = 0
            total_pnl = 0
            expectancy = 0
            profit_factor = 0
            win_count = 0
            loss_count = 0
            total_count = 0

        # Calculate drawdown from balance history
        max_drawdown = self._calculate_max_drawdown(balance_history)

        # Determine if ready to scale
        ready_to_scale = self._assess_readiness(
            win_rate, expectancy, max_drawdown, total_count
        )

        return {
            'status': 'active',
            'total_trades': len(trades),
            'completed_pairs': total_count,
            'buy_count': len(buys),
            'sell_count': len(sells),
            'win_count': win_count,
            'loss_count': loss_count,
            'win_rate': round(win_rate, 2),
            'avg_win': round(avg_win, 4),
            'avg_loss': round(avg_loss, 4),
            'total_pnl': round(total_pnl, 4),
            'total_fees_paid': round(total_fees, 4),
            'net_pnl': round(total_pnl, 4),
            'expectancy': round(expectancy, 4),
            'profit_factor': round(profit_factor, 2) if profit_factor != float('inf') else 'N/A',
            'max_drawdown_pct': round(max_drawdown, 2),
            'ready_to_scale': ready_to_scale,
            'timestamp': datetime.now().isoformat()
        }

    def _calculate_max_drawdown(self, balance_history: List) -> float:
        """Calculate maximum drawdown percentage"""
        if not balance_history or len(balance_history) < 2:
            return 0.0

        balances = [b[0] + (b[1] * 0.35) for b in balance_history]  # USD + XLM value estimate

        peak = balances[0]
        max_dd = 0.0

        for balance in balances:
            if balance > peak:
                peak = balance

            dd = ((peak - balance) / peak) * 100
            if dd > max_dd:
                max_dd = dd

        return max_dd

    def _assess_readiness(self, win_rate: float, expectancy: float,
                         max_drawdown: float, trade_count: int) -> Dict:
        """Assess if ready to scale capital"""

        criteria = {
            'minimum_trades': trade_count >= 50,  # At least 50 complete trades
            'positive_expectancy': expectancy > 0.01,  # Positive expected value
            'acceptable_win_rate': win_rate >= 52,  # Above break-even
            'controlled_drawdown': max_drawdown < 30,  # Less than 30% drawdown
        }

        ready = all(criteria.values())

        return {
            'ready': ready,
            'criteria_met': criteria,
            'recommendation': self._get_recommendation(criteria, trade_count)
        }

    def _get_recommendation(self, criteria: Dict, trade_count: int) -> str:
        """Get scaling recommendation"""
        if all(criteria.values()):
            return "✅ READY TO SCALE - All criteria met"

        missing = [k for k, v in criteria.items() if not v]

        if 'minimum_trades' in missing:
            trades_needed = 50 - trade_count
            return f"⏳ WAIT - Need {trades_needed} more complete trades for validation"

        if 'positive_expectancy' in missing:
            return "❌ NOT READY - Negative expectancy (losing strategy)"

        if 'acceptable_win_rate' in missing:
            return "⚠️ CAUTION - Win rate too low (below 52%)"

        if 'controlled_drawdown' in missing:
            return "⚠️ HIGH RISK - Drawdown exceeds 30% (too volatile)"

        return "⏳ MONITORING - Continue gathering data"

    def generate_report(self, days: int = 7) -> str:
        """Generate human-readable performance report"""
        metrics = self.calculate_metrics(days)

        if metrics.get('status') == 'insufficient_data':
            return "📊 INSUFFICIENT DATA - No trades recorded yet\n"

        report = []
        report.append("=" * 70)
        report.append(f"📊 TRADING PERFORMANCE REPORT - Last {days} Days")
        report.append("=" * 70)
        report.append("")

        # Trading Activity
        report.append("📈 TRADING ACTIVITY")
        report.append(f"  Total Executions: {metrics['total_trades']}")
        report.append(f"  Complete Pairs: {metrics['completed_pairs']} (Buy → Sell)")
        report.append(f"  Buys: {metrics['buy_count']} | Sells: {metrics['sell_count']}")
        report.append("")

        # Performance Metrics
        report.append("💰 PERFORMANCE METRICS")
        report.append(f"  Win Rate: {metrics['win_rate']}% ({metrics['win_count']}W / {metrics['loss_count']}L)")
        report.append(f"  Average Win: ${metrics['avg_win']:.2f}")
        report.append(f"  Average Loss: ${metrics['avg_loss']:.2f}")
        report.append(f"  Total P&L: ${metrics['net_pnl']:.2f}")
        report.append(f"  Total Fees: ${metrics['total_fees_paid']:.2f}")
        report.append(f"  Expectancy: ${metrics['expectancy']:.4f} per trade")
        report.append(f"  Profit Factor: {metrics['profit_factor']}")
        report.append("")

        # Risk Metrics
        report.append("⚠️ RISK METRICS")
        report.append(f"  Max Drawdown: {metrics['max_drawdown_pct']:.2f}%")
        report.append(f"  System Errors: {metrics['error_count']}")
        report.append("")

        # Scaling Assessment
        readiness = metrics['ready_to_scale']
        report.append("🎯 CAPITAL SCALING ASSESSMENT")
        report.append(f"  Status: {readiness['recommendation']}")
        report.append("")
        report.append("  Criteria Checklist:")
        for criterion, met in readiness['criteria_met'].items():
            status = "✅" if met else "❌"
            criterion_name = criterion.replace('_', ' ').title()
            report.append(f"    {status} {criterion_name}")
        report.append("")

        # Recommendations
        report.append("💡 RECOMMENDATIONS")
        if readiness['ready']:
            report.append("  • System validated - consider scaling capital")
            report.append("  • Maintain current position sizing ratio")
            report.append("  • Continue monitoring for regression")
        else:
            report.append("  • Continue paper trading with current capital")
            report.append("  • Focus on improving win rate and expectancy")
            report.append("  • Wait for minimum 50 complete trades")
            report.append("  • DO NOT add capital yet")

        report.append("")
        report.append("=" * 70)
        report.append(f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 70)

        return "\n".join(report)

    def save_daily_snapshot(self):
        """Save daily performance snapshot"""
        metrics = self.calculate_metrics(30)

        if metrics.get('status') == 'insufficient_data':
            return

        snapshot_dir = Path("performance_snapshots")
        snapshot_dir.mkdir(exist_ok=True)

        filename = snapshot_dir / f"snapshot_{datetime.now().strftime('%Y-%m-%d')}.json"

        with open(filename, 'w') as f:
            json.dump(metrics, f, indent=2)

        print(f"Daily snapshot saved: {filename}")


def main():
    """Main monitoring interface"""
    import sys

    monitor = PerformanceMonitor()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'daily':
            print(monitor.generate_report(1))
        elif command == 'weekly':
            print(monitor.generate_report(7))
        elif command == 'monthly':
            print(monitor.generate_report(30))
        elif command == 'snapshot':
            monitor.save_daily_snapshot()
            print("✅ Daily snapshot saved")
        else:
            print(f"Unknown command: {command}")
            print("Usage: python performance_monitor.py [daily|weekly|monthly|snapshot]")
    else:
        # Default: weekly report
        print(monitor.generate_report(7))


if __name__ == "__main__":
    main()
