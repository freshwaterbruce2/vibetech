"""
Complete Trade Review and Analysis
Shows all trades from database with performance metrics
"""
import sqlite3
import pandas as pd
from datetime import datetime

print("=" * 80)
print("TRADING PERFORMANCE REVIEW")
print("=" * 80)

try:
    conn = sqlite3.connect('trading.db')
    
    # Get all tables
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    
    print(f"\n📊 Available tables: {', '.join(tables)}")
    
    # Try to get trades
    if 'trades' in tables:
        df = pd.read_sql_query("SELECT * FROM trades ORDER BY timestamp DESC", conn)
        
        if len(df) == 0:
            print("\n⚠️  No trades found in database yet.")
            print("   The bot may not have executed any trades, or trades are logged elsewhere.")
        else:
            print(f"\n📈 TRADE HISTORY ({len(df)} total trades)")
            print("=" * 80)
            
            # Show recent trades
            print("\nMOST RECENT TRADES:")
            for idx, row in df.head(10).iterrows():
                print(f"\n  Trade #{row.get('id', idx)}:")
                for col in df.columns:
                    if col != 'id':
                        print(f"    {col}: {row[col]}")
            
            # Calculate statistics if we have the right columns
            if 'profit' in df.columns or 'pnl' in df.columns:
                profit_col = 'profit' if 'profit' in df.columns else 'pnl'
                total_profit = df[profit_col].sum()
                win_trades = df[df[profit_col] > 0]
                loss_trades = df[df[profit_col] < 0]
                
                print(f"\n💰 PERFORMANCE SUMMARY:")
                print(f"  Total Trades: {len(df)}")
                print(f"  Winning Trades: {len(win_trades)} ({len(win_trades)/len(df)*100:.1f}%)")
                print(f"  Losing Trades: {len(loss_trades)} ({len(loss_trades)/len(df)*100:.1f}%)")
                print(f"  Total P&L: ${total_profit:.2f}")
                
                if len(win_trades) > 0:
                    print(f"  Avg Win: ${win_trades[profit_col].mean():.2f}")
                if len(loss_trades) > 0:
                    print(f"  Avg Loss: ${loss_trades[profit_col].mean():.2f}")
    
    # Check for orders table
    if 'orders' in tables:
        orders_df = pd.read_sql_query("SELECT * FROM orders ORDER BY timestamp DESC LIMIT 20", conn)
        print(f"\n📋 RECENT ORDERS ({len(orders_df)} shown):")
        print("=" * 80)
        
        for idx, row in orders_df.iterrows():
            print(f"\n  Order #{row.get('id', idx)}:")
            for col in orders_df.columns:
                if col != 'id':
                    print(f"    {col}: {row[col]}")
    
    # Check for positions table
    if 'positions' in tables:
        positions_df = pd.read_sql_query("SELECT * FROM positions", conn)
        if len(positions_df) > 0:
            print(f"\n📊 OPEN POSITIONS:")
            print("=" * 80)
            for idx, row in positions_df.iterrows():
                print(f"\n  Position #{row.get('id', idx)}:")
                for col in positions_df.columns:
                    print(f"    {col}: {row[col]}")
        else:
            print(f"\n✅ No open positions")
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"\n❌ Database error: {e}")
    print("\nTrying alternative: Check log file for trades...")
    
    # Parse log file for trades
    try:
        with open('ultra_simple.log', 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        buy_lines = [l for l in lines if '[BUY]' in l]
        sell_lines = [l for l in lines if '[SELL]' in l]
        
        print(f"\n📊 LOG FILE ANALYSIS:")
        print(f"  Buy orders logged: {len(buy_lines)}")
        print(f"  Sell orders logged: {len(sell_lines)}")
        
        if buy_lines:
            print(f"\n  RECENT BUY ORDERS:")
            for line in buy_lines[-5:]:
                print(f"    {line.strip()}")
        
        if sell_lines:
            print(f"\n  RECENT SELL ORDERS:")
            for line in sell_lines[-5:]:
                print(f"    {line.strip()}")
        
        # Extract profit data
        profits = []
        for line in sell_lines:
            if 'Profit:' in line:
                import re
                match = re.search(r'Profit: ([+-]?\$?[\d.]+)', line)
                if match:
                    profit_str = match.group(1).replace('$', '')
                    try:
                        profits.append(float(profit_str))
                    except:
                        pass
        
        if profits:
            print(f"\n💰 PROFIT ANALYSIS FROM LOGS:")
            print(f"  Total trades with profit data: {len(profits)}")
            print(f"  Total P&L: ${sum(profits):.2f}")
            print(f"  Average profit per trade: ${sum(profits)/len(profits):.2f}")
            wins = [p for p in profits if p > 0]
            losses = [p for p in profits if p < 0]
            if wins and losses:
                print(f"  Win rate: {len(wins)/len(profits)*100:.1f}%")
        
    except Exception as e2:
        print(f"\n❌ Could not parse log file: {e2}")

print("\n" + "=" * 80)
print("Review complete!")
print("=" * 80)
