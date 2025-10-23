#!/usr/bin/env node
/**
 * Memory Management CLI for VS Code Integration
 * Provides easy access to memory management functions from VS Code tasks
 */

const MemoryManager = require('./memory_manager.js');
const path = require('path');

class MemoryCLI {
    constructor() {
        this.manager = new MemoryManager();
    }

    async run() {
        const command = process.argv[2];
        const args = process.argv.slice(3);

        try {
            switch (command) {
                case 'init':
                    await this.init();
                    break;
                case 'stats':
                    await this.stats();
                    break;
                case 'list':
                    await this.list(args[0]);
                    break;
                case 'cleanup':
                    await this.cleanup();
                    break;
                case 'test':
                    await this.test();
                    break;
                case 'store':
                    await this.store(args[0], args[1], args[2]);
                    break;
                case 'retrieve':
                    await this.retrieve(args[0], args[1]);
                    break;
                case 'health':
                    await this.health();
                    break;
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('CLI Error:', error.message);
            process.exit(1);
        }
    }

    async init() {
        console.log('Initializing Memory Management System...');
        const success = await this.manager.initialize();
        if (success) {
            console.log('✅ Memory system initialized successfully');
            console.log('📁 Local Memory: C:\\dev\\projects\\memory-bank');
            console.log('🗄️ Bulk Storage: D:\\dev-memory\\claude-code');
        } else {
            console.log('❌ Failed to initialize memory system');
            process.exit(1);
        }
    }

    async stats() {
        console.log('📊 Memory System Statistics');
        console.log('══════════════════════════');

        const stats = await this.manager.getStorageStats();

        console.log(`\n🚀 Local Memory (C: Drive - Fast Access)`);
        console.log(`   Files: ${stats.localMemory.files}`);
        console.log(`   Size: ${stats.localMemory.totalSizeFormatted}`);

        console.log(`\n🗄️ Bulk Storage (D: Drive - Large Data)`);
        console.log(`   Files: ${stats.bulkStorage.files}`);
        console.log(`   Size: ${stats.bulkStorage.totalSizeFormatted}`);

        const totalFiles = stats.localMemory.files + stats.bulkStorage.files;
        const totalSize = stats.localMemory.totalSize + stats.bulkStorage.totalSize;

        console.log(`\n📋 Total Storage`);
        console.log(`   Files: ${totalFiles}`);
        console.log(`   Size: ${this.manager.formatBytes(totalSize)}`);
    }

    async list(storage = 'both') {
        console.log('🗂️ Stored Data Listing');
        console.log('═════════════════════');

        const data = await this.manager.listStoredData(storage);

        if (data.localMemory.length > 0) {
            console.log(`\n🚀 Local Memory (${data.localMemory.length} items):`);
            data.localMemory.forEach(item => {
                console.log(`   📄 ${item.key} [${item.type}] - ${item.size} (${new Date(item.modified).toLocaleDateString()})`);
            });
        }

        if (data.bulkStorage.length > 0) {
            console.log(`\n🗄️ Bulk Storage (${data.bulkStorage.length} items):`);
            data.bulkStorage.forEach(item => {
                console.log(`   📦 ${item.key} [${item.type}] - ${item.size} (${new Date(item.modified).toLocaleDateString()})`);
            });
        }

        if (data.localMemory.length === 0 && data.bulkStorage.length === 0) {
            console.log('📭 No data stored in memory system yet');
        }
    }

    async cleanup() {
        console.log('🧹 Running Memory System Cleanup...');
        const result = await this.manager.cleanup();

        console.log(`✅ Cleanup completed:`);
        console.log(`   📦 Files archived: ${result.archivedFiles}`);

        if (result.archivedFiles > 0) {
            console.log(`   ➡️ Old files moved from C: drive to D: drive for long-term storage`);
        }
    }

    async test() {
        console.log('🧪 Testing Memory System...');

        const testData = {
            message: 'Test session from VS Code integration',
            timestamp: new Date().toISOString(),
            source: 'memory_cli',
            testId: Math.random().toString(36).substring(7)
        };

        const metadata = {
            type: 'session_state',
            source: 'vscode_integration',
            created: new Date().toISOString()
        };

        console.log('📤 Storing test data...');
        const storeResult = await this.manager.storeData('test-vscode-session', testData, metadata);

        if (storeResult.success) {
            console.log(`✅ Data stored successfully in ${storeResult.storage}`);
            console.log(`   📁 Path: ${storeResult.path}`);

            console.log('📥 Retrieving test data...');
            const retrieveResult = await this.manager.retrieveData('test-vscode-session');

            if (retrieveResult.success) {
                console.log(`✅ Data retrieved successfully from ${retrieveResult.storage}`);
                console.log(`   🔍 Test ID: ${retrieveResult.data.testId}`);
                console.log('🎉 Memory system test completed successfully!');
            } else {
                console.log('❌ Failed to retrieve test data:', retrieveResult.error);
            }
        } else {
            console.log('❌ Failed to store test data:', storeResult.error);
        }
    }

    async store(key, dataJson, metadataJson) {
        if (!key || !dataJson) {
            console.log('❌ Usage: store <key> <data-json> [metadata-json]');
            return;
        }

        try {
            const data = JSON.parse(dataJson);
            const metadata = metadataJson ? JSON.parse(metadataJson) : {};

            console.log(`📤 Storing data with key: ${key}`);
            const result = await this.manager.storeData(key, data, metadata);

            if (result.success) {
                console.log(`✅ Data stored in ${result.storage}`);
                console.log(`   📁 Path: ${result.path}`);
            } else {
                console.log(`❌ Storage failed: ${result.error}`);
            }
        } catch (error) {
            console.log(`❌ JSON parsing error: ${error.message}`);
        }
    }

    async retrieve(key, type) {
        if (!key) {
            console.log('❌ Usage: retrieve <key> [type]');
            return;
        }

        console.log(`📥 Retrieving data with key: ${key}`);
        const result = await this.manager.retrieveData(key, type);

        if (result.success) {
            console.log(`✅ Data retrieved from ${result.storage}`);
            console.log(`📄 Data:`, JSON.stringify(result.data, null, 2));
            console.log(`📋 Metadata:`, JSON.stringify(result.metadata, null, 2));
        } else {
            console.log(`❌ Retrieval failed: ${result.error}`);
        }
    }

    async health() {
        console.log('🏥 Memory System Health Check');
        console.log('═══════════════════════════');

        let healthy = true;

        console.log('🔍 Checking configuration...');
        const initResult = await this.manager.initialize();
        if (initResult) {
            console.log('✅ Configuration loaded successfully');
        } else {
            console.log('❌ Configuration failed to load');
            healthy = false;
        }

        console.log('📁 Checking directories...');
        const fs = require('fs').promises;

        try {
            await fs.access('C:\\dev\\projects\\memory-bank');
            console.log('✅ Local memory directory accessible');
        } catch {
            console.log('❌ Local memory directory not accessible');
            healthy = false;
        }

        try {
            await fs.access('D:\\dev-memory\\claude-code');
            console.log('✅ Bulk storage directory accessible');
        } catch {
            console.log('❌ Bulk storage directory not accessible');
            healthy = false;
        }

        console.log('📊 Checking system stats...');
        try {
            const stats = await this.manager.getStorageStats();
            console.log(`✅ Storage stats: ${stats.localMemory.files + stats.bulkStorage.files} total files`);
        } catch (error) {
            console.log(`❌ Stats check failed: ${error.message}`);
            healthy = false;
        }

        if (healthy) {
            console.log('\n🎉 Memory system is healthy and ready for use!');
        } else {
            console.log('\n⚠️ Memory system has issues that need attention');
            process.exit(1);
        }
    }

    showHelp() {
        console.log('🧠 Memory Management CLI');
        console.log('═══════════════════════');
        console.log('');
        console.log('Available commands:');
        console.log('  init             Initialize memory system');
        console.log('  stats            Show storage statistics');
        console.log('  list [storage]   List stored data (both|localMemory|bulkStorage)');
        console.log('  cleanup          Archive old files to bulk storage');
        console.log('  test             Test memory system functionality');
        console.log('  store <key> <json> [metadata]  Store data');
        console.log('  retrieve <key> [type]          Retrieve data');
        console.log('  health           Run health check');
        console.log('  help             Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  node memory_cli.js init');
        console.log('  node memory_cli.js stats');
        console.log('  node memory_cli.js test');
        console.log('  node memory_cli.js cleanup');
    }
}

if (require.main === module) {
    const cli = new MemoryCLI();
    cli.run();
}

module.exports = MemoryCLI;
