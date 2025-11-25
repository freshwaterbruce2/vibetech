/**
 * Optimized Claude Code Memory Management System
 * Intelligently routes data between C drive (fast access) and D drive (bulk storage)
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MemoryManager {
    constructor() {
        this.config = null;
        this.configPath = path.join(__dirname, 'memory_config.json');
    }

    async initialize() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(configData);
            console.log('Memory Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Memory Manager:', error.message);
            return false;
        }
    }

    async storeData(key, data, metadata = {}) {
        if (!this.config) await this.initialize();

        const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
        const storage = this.determineStorage(data, metadata, dataSize);

        const storageConfig = this.config.storageConfiguration[storage];
        const filePath = this.getStoragePath(storage, key, metadata.type);

        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // Store data with metadata
            const envelope = {
                timestamp: new Date().toISOString(),
                size: dataSize,
                storage: storage,
                metadata: metadata,
                data: data,
                checksum: this.generateChecksum(data)
            };

            await fs.writeFile(filePath, JSON.stringify(envelope, null, 2));
            console.log(`Data stored in ${storage}: ${key} (${this.formatBytes(dataSize)})`);

            return { success: true, path: filePath, storage: storage };
        } catch (error) {
            console.error(`Failed to store data ${key}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async retrieveData(key, type = null) {
        if (!this.config) await this.initialize();

        // Try local memory first, then bulk storage
        for (const storage of ['localMemory', 'bulkStorage']) {
            const filePath = this.getStoragePath(storage, key, type);

            try {
                const data = await fs.readFile(filePath, 'utf8');
                const envelope = JSON.parse(data);

                // Verify checksum
                if (envelope.checksum && !this.verifyChecksum(envelope.data, envelope.checksum)) {
                    console.warn(`Checksum mismatch for ${key}, data may be corrupted`);
                }

                console.log(`Data retrieved from ${storage}: ${key}`);
                return { success: true, data: envelope.data, metadata: envelope.metadata, storage: storage };
            } catch (error) {
                // File not found in this storage, try next
                continue;
            }
        }

        return { success: false, error: 'Data not found in any storage location' };
    }

    determineStorage(data, metadata, dataSize) {
        const rules = this.config.dataRouting.rules;

        for (const rule of rules) {
            if (this.evaluateRule(rule.condition, data, metadata, dataSize)) {
                return rule.destination;
            }
        }

        // Default to local memory for small, active data
        return 'localMemory';
    }

    evaluateRule(condition, data, metadata, dataSize) {
        // Convert size to MB for comparison
        const sizeMB = dataSize / (1024 * 1024);

        if (condition.includes('size >')) {
            const threshold = parseFloat(condition.match(/size > (\d+)MB/)?.[1]);
            return threshold && sizeMB > threshold;
        }

        if (condition.includes('type ===')) {
            const types = condition.match(/'([^']+)'/g)?.map(t => t.replace(/'/g, ''));
            return types && types.includes(metadata.type);
        }

        if (condition.includes('extension ===')) {
            const extensions = condition.match(/'([^']+)'/g)?.map(e => e.replace(/'/g, ''));
            const fileExt = metadata.filename ? path.extname(metadata.filename) : null;
            return extensions && extensions.includes(fileExt);
        }

        if (condition.includes('age >')) {
            const days = parseInt(condition.match(/age > (\d+) days/)?.[1]);
            if (days && metadata.created) {
                const ageMs = Date.now() - new Date(metadata.created).getTime();
                const ageDays = ageMs / (1000 * 60 * 60 * 24);
                return ageDays > days;
            }
        }

        return false;
    }

    getStoragePath(storage, key, type) {
        const baseDir = this.config.directories[storage];

        if (type && baseDir[type]) {
            return path.join(baseDir[type], `${key}.json`);
        }

        // Default paths based on storage type
        if (storage === 'localMemory') {
            return path.join(baseDir.quickAccess, `${key}.json`);
        } else {
            return path.join(baseDir.archives, `${key}.json`);
        }
    }

    generateChecksum(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    verifyChecksum(data, expectedChecksum) {
        const actualChecksum = this.generateChecksum(data);
        return actualChecksum === expectedChecksum;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async listStoredData(storage = 'both') {
        if (!this.config) await this.initialize();

        const results = { localMemory: [], bulkStorage: [] };
        const storages = storage === 'both' ? ['localMemory', 'bulkStorage'] : [storage];

        for (const storageType of storages) {
            const dirs = this.config.directories[storageType];

            for (const [dirType, dirPath] of Object.entries(dirs)) {
                try {
                    const files = await fs.readdir(dirPath);
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const filePath = path.join(dirPath, file);
                            const stats = await fs.stat(filePath);
                            results[storageType].push({
                                key: path.basename(file, '.json'),
                                type: dirType,
                                path: filePath,
                                size: this.formatBytes(stats.size),
                                modified: stats.mtime.toISOString()
                            });
                        }
                    }
                } catch (error) {
                    // Directory doesn't exist or is empty
                    continue;
                }
            }
        }

        return results;
    }

    async cleanup() {
        if (!this.config) await this.initialize();

        const maintenanceConfig = this.config.maintenance;
        let cleanedFiles = 0;
        let archivedFiles = 0;

        // Archive old files from local memory to bulk storage
        const localDirs = this.config.directories.localMemory;

        for (const [dirType, dirPath] of Object.entries(localDirs)) {
            try {
                const files = await fs.readdir(dirPath);

                for (const file of files) {
                    if (!file.endsWith('.json')) continue;

                    const filePath = path.join(dirPath, file);
                    const stats = await fs.stat(filePath);
                    const ageMs = Date.now() - stats.mtime.getTime();
                    const ageDays = ageMs / (1000 * 60 * 60 * 24);

                    if (ageDays > parseInt(maintenanceConfig.archiveThreshold)) {
                        // Move to bulk storage
                        const bulkDir = this.config.directories.bulkStorage.archives;
                        const bulkPath = path.join(bulkDir, file);

                        await fs.mkdir(bulkDir, { recursive: true });
                        await fs.copyFile(filePath, bulkPath);
                        await fs.unlink(filePath);

                        archivedFiles++;
                        console.log(`Archived: ${file} (${Math.round(ageDays)} days old)`);
                    }
                }
            } catch (error) {
                console.warn(`Cleanup error in ${dirType}:`, error.message);
            }
        }

        console.log(`Cleanup completed: ${archivedFiles} files archived`);
        return { archivedFiles, cleanedFiles };
    }

    async getStorageStats() {
        if (!this.config) await this.initialize();

        const stats = {
            localMemory: { files: 0, totalSize: 0 },
            bulkStorage: { files: 0, totalSize: 0 }
        };

        for (const [storageType, dirs] of Object.entries(this.config.directories)) {
            for (const dirPath of Object.values(dirs)) {
                try {
                    const files = await fs.readdir(dirPath);
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const filePath = path.join(dirPath, file);
                            const stat = await fs.stat(filePath);
                            stats[storageType].files++;
                            stats[storageType].totalSize += stat.size;
                        }
                    }
                } catch (error) {
                    // Directory doesn't exist, skip
                    continue;
                }
            }
        }

        stats.localMemory.totalSizeFormatted = this.formatBytes(stats.localMemory.totalSize);
        stats.bulkStorage.totalSizeFormatted = this.formatBytes(stats.bulkStorage.totalSize);

        return stats;
    }
}

// CLI interface
if (require.main === module) {
    const manager = new MemoryManager();
    const command = process.argv[2];

    async function runCommand() {
        switch (command) {
            case 'init':
                await manager.initialize();
                console.log('Memory Manager initialized');
                break;

            case 'stats':
                const stats = await manager.getStorageStats();
                console.log('Storage Statistics:');
                console.log(`Local Memory: ${stats.localMemory.files} files, ${stats.localMemory.totalSizeFormatted}`);
                console.log(`Bulk Storage: ${stats.bulkStorage.files} files, ${stats.bulkStorage.totalSizeFormatted}`);
                break;

            case 'list':
                const data = await manager.listStoredData();
                console.log('Stored Data:');
                if (data.localMemory.length) {
                    console.log('Local Memory:', data.localMemory.length, 'items');
                }
                if (data.bulkStorage.length) {
                    console.log('Bulk Storage:', data.bulkStorage.length, 'items');
                }
                break;

            case 'cleanup':
                const result = await manager.cleanup();
                console.log(`Cleanup complete: ${result.archivedFiles} files archived`);
                break;

            case 'test':
                // Test storage system
                const testData = { message: 'Hello Claude Code Memory System', timestamp: new Date().toISOString() };
                const storeResult = await manager.storeData('test-session', testData, { type: 'session_state' });
                console.log('Store result:', storeResult);

                const retrieveResult = await manager.retrieveData('test-session');
                console.log('Retrieve result:', retrieveResult.success ? 'Success' : 'Failed');
                break;

            default:
                console.log('Available commands: init, stats, list, cleanup, test');
                break;
        }
    }

    runCommand().catch(console.error);
}

module.exports = MemoryManager;
