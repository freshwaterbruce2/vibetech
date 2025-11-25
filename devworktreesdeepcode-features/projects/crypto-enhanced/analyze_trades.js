// Analyze trading database using Node.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'C:/dev/projects/crypto-enhanced/trading.db';

console.log('='.repeat(80));
console.log('CRYPTO TRADING BOT - PERFORMANCE ANALYSIS');
console.log('='.repeat(80));

try {
    const db = new Database(dbPath, { readonly: true });
    
    // Get all tables
    console.log('\n📊 DATABASE STRUCTURE');
    console.log('-'.repeat(80));
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Available tables:', tables.map(t => t.name).join(', '));
    
    // Analyze TRADES
    console.log('\n' + '='.repeat(80));
    console.log('💰 TRADES ANALYSIS');
    console.log('='.repeat(80));
    
    const tradeCount = db.prepare('SELECT COUNT(*) as count FROM trades').get();
    console.log(`\n✅ Total Trades: ${tradeCount.count}`);
    
    if (tradeCount.count > 0) {
        // Get recent trades
        const recentTrades = db.prepare(`
            SELECT * FROM trades 
            ORDER BY timestamp DESC 
            LIMIT 10
        `).all();
        
        console.log('\n' + '-'.repeat(80));
        console.log('RECENT TRADES (Last 10)');
        console.log('-'.repeat(80));
        
        let totalVolume = 0;
        let totalFees = 0;
        let buyCount = 0;
        let sellCount = 0;
        
        recentTrades.forEach((trade, i) => {
            console.log(`\n${i + 1}. ${trade.timestamp}`);
            console.log(`   Symbol: ${trade.symbol} | Side: ${trade.side?.toUpperCase()}`);
            console.log(`   Quantity: ${trade.quantity} | Price: $${trade.price?.toFixed(6)}`);
            console.log(`   Value: $${(trade.quantity * trade.price).toFixed(2)} | Fee: $${trade.fee?.toFixed(4)}`);
            
            if (trade.side?.toLowerCase() === 'buy') buyCount++;
            if (trade.side?.toLowerCase() === 'sell') sellCount++;
            
            totalVolume += trade.quantity * trade.price;
            totalFees += trade.fee || 0;
        });
        
        // Overall stats
        const allTrades = db.prepare('SELECT * FROM trades').all();
        let allVolume = 0;
        let allFees = 0;
        let allBuys = 0;
        let allSells = 0;
        
        allTrades.forEach(trade => {
            if (trade.side?.toLowerCase() === 'buy') allBuys++;
            if (trade.side?.toLowerCase() === 'sell') allSells++;
            allVolume += trade.quantity * trade.price;
            allFees += trade.fee || 0;
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('📈 OVERALL STATISTICS');
        console.log('='.repeat(80));
        console.log(`Total Trades: ${allTrades.length}`);
        console.log(`  - Buy Orders: ${allBuys}`);
        console.log(`  - Sell Orders: ${allSells}`);
        console.log(`\nTotal Volume Traded: $${allVolume.toFixed(2)}`);
        console.log(`Total Fees Paid: $${allFees.toFixed(4)}`);
        console.log(`Average Fee per Trade: $${(allFees / allTrades.length).toFixed(4)}`);
    }
    
    // Analyze POSITIONS
    console.log('\n' + '='.repeat(80));
    console.log('📍 POSITIONS ANALYSIS');
    console.log('='.repeat(80));
    
    try {
        const positions = db.prepare('SELECT * FROM positions ORDER BY timestamp DESC').all();
        
        if (positions.length === 0) {
            console.log('\n✅ No open positions (flat)');
        } else {
            const openPos = positions.filter(p => p.status === 'open');
            const closedPos = positions.filter(p => p.status === 'closed');
            
            console.log(`\nTotal Positions: ${positions.length}`);
            console.log(`  - Open: ${openPos.length}`);
            console.log(`  - Closed: ${closedPos.length}`);
            
            if (openPos.length > 0) {
                console.log('\n⚠️ OPEN POSITIONS:');
                openPos.forEach(pos => {
                    console.log(`  ${pos.symbol}: ${pos.quantity} @ $${pos.entry_price?.toFixed(6)}`);
                });
            }
        }
    } catch (e) {
        console.log('No positions table or error:', e.message);
    }
    
    // Analyze ORDERS
    console.log('\n' + '='.repeat(80));
    console.log('📋 ORDERS ANALYSIS');
    console.log('='.repeat(80));
    
    try {
        const orders = db.prepare('SELECT * FROM orders ORDER BY timestamp DESC LIMIT 10').all();
        
        if (orders.length > 0) {
            console.log('\nRecent Orders (Last 10):');
            orders.forEach(order => {
                console.log(`  ${order.symbol} ${order.side?.toUpperCase()}: ${order.quantity} @ $${order.price?.toFixed(6)} - Status: ${order.status}`);
            });
        } else {
            console.log('\nNo orders found');
        }
    } catch (e) {
        console.log('No orders table or error:', e.message);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    
    db.close();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
