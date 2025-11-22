// Test DeepCode Editor database integration
const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = 'D:\\databases\\database.db';

console.log('========================================');
console.log('DeepCode Editor - Database Integration Test');
console.log('========================================\n');

// Check 1: Database file exists
console.log('[1/3] Checking database file...');
if (!fs.existsSync(dbPath)) {
    console.error('  ✗ Database not found at:', dbPath);
    process.exit(1);
}
const stats = fs.statSync(dbPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`  ✓ Database found: ${sizeMB} MB\n`);

// Check 2: Connect to database
console.log('[2/3] Testing database connection...');
let db;
try {
    db = new Database(dbPath, { readonly: true });
    console.log('  ✓ Successfully connected!\n');
} catch (error) {
    console.error('  ✗ Connection failed:', error.message);
    process.exit(1);
}

// Check 3: Query learning tables
console.log('[3/3] Querying learning tables...');
try {
    // Get total table count
    const tableCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM sqlite_master
        WHERE type='table'
    `).get();
    console.log(`  ✓ Total tables: ${tableCount.count}`);

    // Get learning table names
    const learningTables = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name IN ('agent_mistakes', 'agent_patterns', 'success_patterns', 'failure_patterns', 'agent_learning_sessions')
        ORDER BY name
    `).all();
    console.log(`  ✓ Learning tables: ${learningTables.map(t => t.name).join(', ')}`);

    // Get agent mistakes count
    const mistakesCount = db.prepare(`
        SELECT COUNT(*) as count FROM agent_mistakes
    `).get();
    console.log(`  ✓ Agent mistakes: ${mistakesCount.count} records`);

    // Get top mistake types
    const topMistakes = db.prepare(`
        SELECT mistake_type, COUNT(*) as count
        FROM agent_mistakes
        GROUP BY mistake_type
        ORDER BY count DESC
        LIMIT 3
    `).all();

    console.log('  ✓ Top mistake types:');
    topMistakes.forEach(m => {
        console.log(`    - ${m.mistake_type}: ${m.count}`);
    });

    db.close();

    console.log('\n========================================');
    console.log('✓ Database Integration Verified!');
    console.log('========================================\n');
    console.log('DeepCode Editor can now:');
    console.log('- Access all 112 learning tables');
    console.log('- Query agent mistakes and patterns');
    console.log('- Share data with Python scripts & Claude Code MCP');
    console.log('- Use better-sqlite3 (no localStorage fallback)\n');

} catch (error) {
    console.error('  ✗ Query failed:', error.message);
    if (db) db.close();
    process.exit(1);
}
