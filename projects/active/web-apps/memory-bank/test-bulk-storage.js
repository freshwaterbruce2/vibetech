#!/usr/bin/env node
/**
 * Test bulk storage routing to D drive
 */

const MemoryManager = require('./memory_manager.js');

async function testBulkStorage() {
    const manager = new MemoryManager();
    await manager.initialize();

    console.log('Testing memory routing to D drive for large data...\n');

    // Create large data (>10MB to trigger D drive storage)
    const largeData = {
        description: 'Large dataset for D drive testing',
        timestamp: new Date().toISOString(),
        // Create a large array to exceed 10MB
        data: Array(1000000).fill(0).map((_, i) => ({
            index: i,
            value: Math.random(),
            text: 'This is test data that should go to D drive bulk storage ' + i
        }))
    };

    const metadata = {
        type: 'large_dataset',
        purpose: 'Testing D drive routing'
    };

    console.log('Storing large data (should go to D drive)...');
    const result = await manager.storeData('test-bulk-data', largeData, metadata);

    if (result.success) {
        console.log(`✅ Data stored in ${result.storage}`);
        console.log(`📁 Path: ${result.path}`);

        if (result.storage === 'bulkStorage' && result.path.includes('D:')) {
            console.log('✅ SUCCESS: Large data correctly routed to D drive!');
        } else {
            console.log('❌ ISSUE: Large data was not routed to D drive');
        }
    } else {
        console.log('❌ Failed to store data:', result.error);
    }

    // Test small data (should stay on C drive)
    const smallData = {
        description: 'Small dataset for C drive',
        timestamp: new Date().toISOString(),
        value: 'This should stay on C drive for fast access'
    };

    const smallMetadata = {
        type: 'session_state',
        purpose: 'Testing C drive routing'
    };

    console.log('\nStoring small session data (should stay on C drive)...');
    const result2 = await manager.storeData('test-small-data', smallData, smallMetadata);

    if (result2.success) {
        console.log(`✅ Data stored in ${result2.storage}`);
        console.log(`📁 Path: ${result2.path}`);

        if (result2.storage === 'localMemory' && result2.path.includes('C:')) {
            console.log('✅ SUCCESS: Small data correctly kept on C drive!');
        } else {
            console.log('❌ ISSUE: Small data was not kept on C drive');
        }
    }

    // Show storage stats
    console.log('\n=== Storage Statistics ===');
    const stats = await manager.getStorageStats();
    console.log(`C Drive (Local): ${stats.localMemory.files} files, ${stats.localMemory.totalSizeFormatted}`);
    console.log(`D Drive (Bulk): ${stats.bulkStorage.files} files, ${stats.bulkStorage.totalSizeFormatted}`);
}

testBulkStorage().catch(console.error);