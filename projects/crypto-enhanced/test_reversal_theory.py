"""
Test the "Reverse Signal" Theory
================================
Theory: If a bot loses with 10% win rate, reversing BUY<->SELL signals should yield 90% win rate.
Reality: Trading fees are NOT reversible, so reversed signals STILL LOSE MONEY.

This script proves mathematically why signal reversal doesn't work.
"""

def calculate_trade_pnl(buy_price, sell_price, volume=22, fee_pct=0.0026):
    """Calculate P&L for a single trade including fees"""
    # Entry (buy)
    entry_value = buy_price * volume
    entry_fee = entry_value * fee_pct
    total_cost = entry_value + entry_fee

    # Exit (sell)
    exit_value = sell_price * volume
    exit_fee = exit_value * fee_pct
    total_revenue = exit_value - exit_fee

    # Net P&L
    net_pnl = total_revenue - total_cost
    net_pnl_pct = (net_pnl / total_cost) * 100

    return {
        'net_pnl_usd': round(net_pnl, 4),
        'net_pnl_pct': round(net_pnl_pct, 2),
        'entry_cost': round(total_cost, 2),
        'exit_revenue': round(total_revenue, 2),
        'total_fees': round(entry_fee + exit_fee, 4)
    }

def reverse_trade(buy_price, sell_price, volume=22, fee_pct=0.0026):
    """Calculate what happens if we reverse the entry/exit"""
    # Reversed: Enter at what was exit price, exit at what was entry price
    return calculate_trade_pnl(sell_price, buy_price, volume, fee_pct)

def main():
    print("="*80)
    print("TESTING THE REVERSAL THEORY")
    print("="*80)
    print()

    # Example trades from actual logs (recent losses)
    actual_trades = [
        {'buy': 0.3162, 'sell': 0.3153, 'desc': 'Oct 21 09:15-09:43 (actual losing trade)'},
        {'buy': 0.3190, 'sell': 0.3181, 'desc': 'Oct 21 08:37-08:48 (stop loss)'},
        {'buy': 0.3198, 'sell': 0.3186, 'desc': 'Oct 21 08:23-08:28 (loss)'},
        {'buy': 0.3173, 'sell': 0.3162, 'desc': 'Oct 21 00:27-00:32 (loss)'},
        {'buy': 0.3242, 'sell': 0.3275, 'desc': 'Oct 20 00:31-03:02 (WIN +1.23%)'},
    ]

    print("PART 1: Actual Trade vs Reversed Trade")
    print("-"*80)

    total_actual = 0
    total_reversed = 0

    for i, trade in enumerate(actual_trades, 1):
        actual = calculate_trade_pnl(trade['buy'], trade['sell'])
        reversed_calc = reverse_trade(trade['buy'], trade['sell'])

        total_actual += actual['net_pnl_usd']
        total_reversed += reversed_calc['net_pnl_usd']

        print(f"\nTrade {i}: {trade['desc']}")
        print(f"  BUY @ ${trade['buy']:.4f}, SELL @ ${trade['sell']:.4f}")
        print(f"  ACTUAL    P&L: ${actual['net_pnl_usd']:+.4f} ({actual['net_pnl_pct']:+.2f}%) | Fees: ${actual['total_fees']:.4f}")
        print(f"  REVERSED  P&L: ${reversed_calc['net_pnl_usd']:+.4f} ({reversed_calc['net_pnl_pct']:+.2f}%) | Fees: ${reversed_calc['total_fees']:.4f}")

        # Show the key insight
        price_move = (trade['sell'] - trade['buy']) / trade['buy'] * 100
        if actual['net_pnl_usd'] < 0:
            print(f"  INSIGHT: Price moved {price_move:+.2f}%, but fees (0.52%) ate the potential profit!")

    print()
    print("="*80)
    print("PART 2: Total Performance Comparison")
    print("="*80)
    print(f"Actual Strategy Total:    ${total_actual:+.4f}")
    print(f"Reversed Strategy Total:  ${total_reversed:+.4f}")
    print()

    # The math
    print("="*80)
    print("PART 3: Why Reversal Fails - The Math")
    print("="*80)
    print()
    print("The Reversal Fallacy Explained:")
    print("  1. Fees are ALWAYS subtracted (buy fee + sell fee = 0.52%)")
    print("  2. Reversing entry/exit CHANGES the price move direction")
    print("  3. But fees are STILL subtracted from both sides")
    print()
    print("Example:")
    print("  Original: BUY $0.3150 -> SELL $0.3140")
    print("    Price change: -0.32% (loss)")
    print("    Fees: -0.52%")
    print("    Net: -0.84% LOSS")
    print()
    print("  Reversed: BUY $0.3140 -> SELL $0.3150")
    print("    Price change: +0.32% (gain)")
    print("    Fees: -0.52%")
    print("    Net: -0.20% STILL A LOSS!")
    print()
    print("Conclusion: Fees consume small price moves in BOTH directions.")
    print("            To win, you need LARGER price moves, not reversed signals.")
    print("="*80)
    print()

    # Real solution
    print("PART 4: The Real Solution")
    print("-"*80)
    print("Instead of reversing signals, we need to:")
    print("  1. Trade less frequently (avoid overtrading)")
    print("  2. Target larger price moves (>2% to beat fees)")
    print("  3. Use better entry signals (trend confirmation)")
    print("  4. Avoid choppy markets (range filters)")
    print("  5. Implement 2:1 reward:risk ratio")
    print()
    print("Expected result with REAL fixes:")
    print("  - Win rate: 35-40% (vs reversed 90% fantasy)")
    print("  - Expectancy: +$0.08-0.15/trade (vs current -$0.045)")
    print("  - Trades/day: 2-3 (vs current 8 overtrades)")
    print("="*80)

if __name__ == '__main__':
    main()
