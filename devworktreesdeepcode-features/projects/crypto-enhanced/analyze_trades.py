"""
Analyze trading database and generate comprehensive performance report
"""
import sqlite3
import json
from datetime import datetime
from collections import defaultdict

# Connect to database
conn = sqlite3.connect('C:/dev/projects/crypto-enhanced/trading.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("=" * 80)
print("CRYPTO TRADING BOT - PERFORMANCE ANALYSIS")
print("=" * 80)

# Check what tables exist
print("\n📊 DATABASE STRUCTURE")
print("-" * 80)
tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print(f"Available tables: {', '.join([t[0] for t in tables])}")

# Analyze TRADES table
print("\n" + "=" * 80)
print("💰 TRADES ANALYSIS")
print("=" * 80)

try:
    # Get all trades
    trades = c.execute("""
        SELECT * FROM trades 
        ORDER BY timestamp DESC
    """).fetchall()
    
    if not trades:
        print("❌ No trades found in database")
    else:
        print(f"\n✅ Total Trades: {len(trades)}")
        
        # Show schema
        print("\nTable Schema:")
        for col in trades[0].keys():
            print(f"  - {col}")
        
        # Statistics
        total_volume = 0
        total_fees = 0
        buy_count = 0
        sell_count = 0
        symbols = defaultdict(int)
        
        print("\n" + "-" * 80)
        print("RECENT TRADES (Last 10)")
        print("-" * 80)
        
        for i, trade in enumerate(trades[:10]):
            # Convert Row to dict for easier access
            t = dict(trade)
            
            side = t.get('side', 'unknown')
            symbol = t.get('symbol', 'unknown')
            quantity = t.get('quantity', 0)
            price = t.get('price', 0)
            fee = t.get('fee', 0)
            timestamp = t.get('timestamp', 'unknown')
            
            print(f"\n{i+1}. {timestamp}")
            print(f"   Symbol: {symbol} | Side: {side.upper()}")
            print(f"   Quantity: {quantity} | Price: ${price:.6f}")
            print(f"   Value: ${quantity * price:.2f} | Fee: ${fee:.4f}")
            
            # Accumulate stats
            if side.lower() == 'buy':
                buy_count += 1
            elif side.lower() == 'sell':
                sell_count += 1
            
            symbols[symbol] += 1
            total_volume += quantity * price
            total_fees += fee
        
        # Overall statistics
        print("\n" + "=" * 80)
        print("📈 OVERALL STATISTICS")
        print("=" * 80)
        print(f"Total Trades: {len(trades)}")
        print(f"  - Buy Orders: {buy_count}")
        print(f"  - Sell Orders: {sell_count}")
        print(f"\nTotal Volume Traded: ${total_volume:.2f}")
        print(f"Total Fees Paid: ${total_fees:.4f}")
        print(f"Average Fee per Trade: ${total_fees/len(trades):.4f}")
        
        print(f"\nSymbols Traded:")
        for symbol, count in symbols.items():
            print(f"  - {symbol}: {count} trades")

except sqlite3.Error as e:
    print(f"❌ Error querying trades: {e}")

# Analyze POSITIONS table
print("\n" + "=" * 80)
print("📍 POSITIONS ANALYSIS")
print("=" * 80)

try:
    positions = c.execute("""
        SELECT * FROM positions 
        ORDER BY timestamp DESC
    """).fetchall()
    
    if not positions:
        print("✅ No open positions (flat)")
    else:
        print(f"\nTotal Positions: {len(positions)}")
        
        open_positions = [p for p in positions if dict(p).get('status') == 'open']
        closed_positions = [p for p in positions if dict(p).get('status') == 'closed']
        
        print(f"  - Open: {len(open_positions)}")
        print(f"  - Closed: {len(closed_positions)}")
        
        if open_positions:
            print("\n⚠️ OPEN POSITIONS:")
            for pos in open_positions:
                p = dict(pos)
                print(f"  {p.get('symbol')}: {p.get('quantity')} @ ${p.get('entry_price'):.6f}")

except sqlite3.Error as e:
    print(f"❌ Error querying positions: {e}")

# Analyze ORDERS table if exists
print("\n" + "=" * 80)
print("📋 ORDERS ANALYSIS")
print("=" * 80)

try:
    orders = c.execute("""
        SELECT * FROM orders 
        ORDER BY timestamp DESC 
        LIMIT 10
    """).fetchall()
    
    if not orders:
        print("No orders found in database")
    else:
        print(f"\nRecent Orders (Last 10):")
        for order in orders:
            o = dict(order)
            status = o.get('status', 'unknown')
            symbol = o.get('symbol', 'unknown')
            side = o.get('side', 'unknown')
            quantity = o.get('quantity', 0)
            price = o.get('price', 0)
            
            print(f"  {symbol} {side.upper()}: {quantity} @ ${price:.6f} - Status: {status}")

except sqlite3.Error as e:
    print(f"Note: {e}")

# Analyze METRICS table if exists
print("\n" + "=" * 80)
print("📊 PERFORMANCE METRICS")
print("=" * 80)

try:
    metrics = c.execute("""
        SELECT * FROM metrics 
        ORDER BY timestamp DESC 
        LIMIT 1
    """).fetchone()
    
    if metrics:
        m = dict(metrics)
        print("\nLatest Metrics:")
        for key, value in m.items():
            print(f"  {key}: {value}")
    else:
        print("No metrics recorded yet")

except sqlite3.Error as e:
    print(f"Note: {e}")

print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)

conn.close()
