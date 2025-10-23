"""
Analyze trades from ultra_simple.log to calculate P&L and performance metrics
"""
import re
from datetime import datetime
from collections import defaultdict

def parse_trades(log_file):
    """Parse BUY/SELL orders from log file"""
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    trades = []
    current_position = None

    for line in lines:
        # Match BUY orders
        buy_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - \[BUY\] AGGRESSIVE BUY ([\d.]+) XLM at \$([\d.]+)', line)
        if buy_match:
            timestamp = datetime.strptime(buy_match.group(1), '%Y-%m-%d %H:%M:%S')
            volume = float(buy_match.group(2))
            price = float(buy_match.group(3))

            if current_position is None:
                current_position = {
                    'buy_time': timestamp,
                    'buy_price': price,
                    'volume': volume,
                    'buy_value': volume * price
                }
            continue

        # Match SELL orders
        sell_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - \[SELL\] AGGRESSIVE SELL \(([^)]+)\) ([\d.]+) XLM at \$([\d.]+) \| Gross: ([+-][\d.]+)% \| Net: ([+-][\d.]+)%', line)
        if sell_match and current_position:
            timestamp = datetime.strptime(sell_match.group(1), '%Y-%m-%d %H:%M:%S')
            exit_type = sell_match.group(2)
            volume = float(sell_match.group(3))
            price = float(sell_match.group(4))
            gross_pnl_pct = float(sell_match.group(5))
            net_pnl_pct = float(sell_match.group(6))

            # Calculate dollar P&L
            net_pnl_usd = current_position['buy_value'] * (net_pnl_pct / 100)

            # Calculate hold time
            hold_time = (timestamp - current_position['buy_time']).total_seconds() / 3600  # hours

            trades.append({
                'buy_time': current_position['buy_time'],
                'sell_time': timestamp,
                'hold_hours': round(hold_time, 2),
                'buy_price': current_position['buy_price'],
                'sell_price': price,
                'volume': volume,
                'gross_pnl_pct': gross_pnl_pct,
                'net_pnl_pct': net_pnl_pct,
                'net_pnl_usd': round(net_pnl_usd, 4),
                'exit_type': exit_type,
                'is_win': net_pnl_pct > 0
            })

            current_position = None

    # Check for open position
    open_position = current_position

    return trades, open_position

def calculate_metrics(trades):
    """Calculate performance metrics"""
    if not trades:
        return None

    total_trades = len(trades)
    winners = [t for t in trades if t['is_win']]
    losers = [t for t in trades if not t['is_win']]

    win_count = len(winners)
    loss_count = len(losers)
    win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0

    # P&L calculations
    total_pnl = sum(t['net_pnl_usd'] for t in trades)
    avg_win = sum(t['net_pnl_usd'] for t in winners) / win_count if winners else 0
    avg_loss = sum(t['net_pnl_usd'] for t in losers) / loss_count if losers else 0

    # Expectancy (average P&L per trade)
    expectancy = total_pnl / total_trades if total_trades > 0 else 0

    # Profit factor
    gross_profit = sum(t['net_pnl_usd'] for t in winners) if winners else 0
    gross_loss = abs(sum(t['net_pnl_usd'] for t in losers)) if losers else 0
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else float('inf')

    # Drawdown calculation (cumulative)
    cumulative_pnl = 0
    peak = 0
    max_drawdown = 0

    for trade in trades:
        cumulative_pnl += trade['net_pnl_usd']
        if cumulative_pnl > peak:
            peak = cumulative_pnl
        drawdown = peak - cumulative_pnl
        if drawdown > max_drawdown:
            max_drawdown = drawdown

    max_drawdown_pct = (max_drawdown / 7.00) * 100 if total_trades > 0 else 0  # $7 per trade

    # Average hold time
    avg_hold_hours = sum(t['hold_hours'] for t in trades) / total_trades

    # Exit type breakdown
    exit_types = defaultdict(int)
    for trade in trades:
        exit_types[trade['exit_type']] += 1

    return {
        'total_trades': total_trades,
        'win_count': win_count,
        'loss_count': loss_count,
        'win_rate': round(win_rate, 2),
        'total_pnl_usd': round(total_pnl, 4),
        'avg_win_usd': round(avg_win, 4),
        'avg_loss_usd': round(avg_loss, 4),
        'expectancy': round(expectancy, 4),
        'profit_factor': round(profit_factor, 2) if profit_factor != float('inf') else 'N/A',
        'max_drawdown_usd': round(max_drawdown, 4),
        'max_drawdown_pct': round(max_drawdown_pct, 2),
        'avg_hold_hours': round(avg_hold_hours, 2),
        'exit_types': dict(exit_types)
    }

def check_scaling_readiness(metrics):
    """Check if system meets capital scaling criteria"""
    if not metrics:
        return {'ready': False, 'reasons': ['No trades recorded']}

    reasons = []
    ready = True

    # Criteria 1: Minimum 50 complete trades
    if metrics['total_trades'] < 50:
        ready = False
        reasons.append(f"❌ Only {metrics['total_trades']}/50 trades (need {50 - metrics['total_trades']} more)")
    else:
        reasons.append(f"✅ Trade count: {metrics['total_trades']}/50")

    # Criteria 2: Win rate ≥52%
    if metrics['win_rate'] < 52:
        ready = False
        reasons.append(f"❌ Win rate: {metrics['win_rate']}% (need ≥52%)")
    else:
        reasons.append(f"✅ Win rate: {metrics['win_rate']}%")

    # Criteria 3: Positive expectancy >$0.01
    if metrics['expectancy'] <= 0.01:
        ready = False
        reasons.append(f"❌ Expectancy: ${metrics['expectancy']} (need >$0.01)")
    else:
        reasons.append(f"✅ Expectancy: ${metrics['expectancy']}")

    # Criteria 4: Max drawdown <30%
    if metrics['max_drawdown_pct'] >= 30:
        ready = False
        reasons.append(f"❌ Max drawdown: {metrics['max_drawdown_pct']}% (need <30%)")
    else:
        reasons.append(f"✅ Max drawdown: {metrics['max_drawdown_pct']}%")

    return {'ready': ready, 'reasons': reasons}

def generate_report(trades, metrics, open_position, scaling_readiness):
    """Generate comprehensive performance report"""
    print("=" * 80)
    print("ULTRA SIMPLE BOT - TRADE ANALYSIS REPORT")
    print("=" * 80)
    print()

    if not trades:
        print("❌ NO COMPLETED TRADES FOUND")
        return

    # Summary
    print("📊 TRADING SUMMARY")
    print("-" * 80)
    print(f"Total Trades:        {metrics['total_trades']}")
    print(f"Wins:                {metrics['win_count']} ({metrics['win_rate']}%)")
    print(f"Losses:              {metrics['loss_count']}")
    print(f"Total P&L:           ${metrics['total_pnl_usd']:.4f}")
    print(f"Average Win:         ${metrics['avg_win_usd']:.4f}")
    print(f"Average Loss:        ${metrics['avg_loss_usd']:.4f}")
    print(f"Expectancy/Trade:    ${metrics['expectancy']:.4f}")
    print(f"Profit Factor:       {metrics['profit_factor']}")
    print(f"Max Drawdown:        ${metrics['max_drawdown_usd']:.4f} ({metrics['max_drawdown_pct']:.2f}%)")
    print(f"Avg Hold Time:       {metrics['avg_hold_hours']:.2f} hours")
    print()

    # Exit type breakdown
    print("🚪 EXIT TYPE BREAKDOWN")
    print("-" * 80)
    for exit_type, count in metrics['exit_types'].items():
        pct = (count / metrics['total_trades']) * 100
        print(f"{exit_type:25} {count:3d} ({pct:.1f}%)")
    print()

    # Time range
    print("📅 TIME RANGE")
    print("-" * 80)
    first_trade = trades[0]
    last_trade = trades[-1]
    print(f"First Trade:         {first_trade['buy_time'].strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Last Trade:          {last_trade['sell_time'].strftime('%Y-%m-%d %H:%M:%S')}")
    days = (last_trade['sell_time'] - first_trade['buy_time']).days
    print(f"Total Days Trading:  {days}")
    print()

    # Open position
    if open_position:
        print("🔓 OPEN POSITION")
        print("-" * 80)
        print(f"Buy Time:            {open_position['buy_time'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Buy Price:           ${open_position['buy_price']:.4f}")
        print(f"Volume:              {open_position['volume']:.1f} XLM")
        print(f"Value:               ${open_position['buy_value']:.2f}")
        hours_held = (datetime.now() - open_position['buy_time']).total_seconds() / 3600
        print(f"Hours Held:          {hours_held:.2f}")
        print()

    # Capital scaling readiness
    print("💰 CAPITAL SCALING READINESS")
    print("-" * 80)
    for reason in scaling_readiness['reasons']:
        print(reason)
    print()
    if scaling_readiness['ready']:
        print("✅ READY TO SCALE - All criteria met!")
    else:
        print("⏳ NOT READY - Continue monitoring")
    print()

    # Recent trades (last 10)
    print("📈 RECENT TRADES (Last 10)")
    print("-" * 80)
    print(f"{'Date':<19} {'Buy $':<8} {'Sell $':<8} {'Hold(h)':<8} {'P&L %':<8} {'P&L $':<10} {'Exit':<15}")
    print("-" * 80)
    for trade in trades[-10:]:
        date_str = trade['sell_time'].strftime('%Y-%m-%d %H:%M')
        pnl_symbol = '✅' if trade['is_win'] else '❌'
        print(f"{date_str:<19} {trade['buy_price']:<8.4f} {trade['sell_price']:<8.4f} "
              f"{trade['hold_hours']:<8.2f} {trade['net_pnl_pct']:>+6.2f}% "
              f"{pnl_symbol} ${trade['net_pnl_usd']:>+7.4f}  {trade['exit_type']:<15}")
    print()
    print("=" * 80)

if __name__ == '__main__':
    log_file = 'ultra_simple.log'

    print("Parsing trades from ultra_simple.log...")
    trades, open_position = parse_trades(log_file)

    print(f"Found {len(trades)} completed trades")
    if open_position:
        print(f"⚠️  1 open position detected")
    print()

    metrics = calculate_metrics(trades)
    scaling_readiness = check_scaling_readiness(metrics)

    generate_report(trades, metrics, open_position, scaling_readiness)
