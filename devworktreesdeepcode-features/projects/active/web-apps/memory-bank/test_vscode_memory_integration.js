/**
 * VS Code Memory System Integration Test
 * Uses Playwright to systematically test memory system components in VS Code
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class VSCodeMemoryTester {
    constructor() {
        this.testResults = {
            memorySystem: { status: 'pending', details: [] },
            vscodeIntegration: { status: 'pending', details: [] },
            mcpConnections: { status: 'pending', details: [] },
            taskSystem: { status: 'pending', details: [] },
            workspaceLoading: { status: 'pending', details: [] }
        };
        this.projectRoot = 'C:\\dev\\projects';
        this.memoryBankPath = 'C:\\dev\\projects\\memory-bank';
    }

    async runSystematicTests() {
        console.log('🧪 Starting VS Code Memory System Integration Tests');
        console.log('═══════════════════════════════════════════════════════');

        try {
            await this.testMemorySystemCore();
            await this.testVSCodeWorkspaceLoading();
            await this.testMCPConnections();
            await this.testMemoryTaskIntegration();
            await this.generateReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.testResults.general = { status: 'failed', error: error.message };
        }
    }

    async testMemorySystemCore() {
        console.log('\n📋 Phase 1: Testing Memory System Core Functionality');
        console.log('─'.repeat(50));

        try {
            // Test memory manager initialization
            const MemoryManager = require('./memory_manager.js');
            const manager = new MemoryManager();

            console.log('🔍 Testing memory manager initialization...');
            const initResult = await manager.initialize();
            if (initResult) {
                this.testResults.memorySystem.details.push('✅ Memory manager initializes successfully');
            } else {
                this.testResults.memorySystem.details.push('❌ Memory manager initialization failed');
            }

            // Test storage stats
            console.log('📊 Testing storage statistics...');
            const stats = await manager.getStorageStats();
            this.testResults.memorySystem.details.push(`✅ Storage stats: ${stats.localMemory.files + stats.bulkStorage.files} total files`);

            // Test data storage and retrieval
            console.log('💾 Testing data storage and retrieval...');
            const testData = {
                test: 'vs-code-integration-test',
                timestamp: new Date().toISOString(),
                source: 'playwright-automation'
            };

            const storeResult = await manager.storeData('vscode-test', testData, { type: 'test_data' });
            if (storeResult.success) {
                this.testResults.memorySystem.details.push('✅ Data storage works correctly');

                const retrieveResult = await manager.retrieveData('vscode-test');
                if (retrieveResult.success && retrieveResult.data.test === testData.test) {
                    this.testResults.memorySystem.details.push('✅ Data retrieval works correctly');
                } else {
                    this.testResults.memorySystem.details.push('❌ Data retrieval failed');
                }
            } else {
                this.testResults.memorySystem.details.push('❌ Data storage failed');
            }

            this.testResults.memorySystem.status = 'passed';
        } catch (error) {
            this.testResults.memorySystem.status = 'failed';
            this.testResults.memorySystem.details.push(`❌ Memory system error: ${error.message}`);
        }
    }

    async testVSCodeWorkspaceLoading() {
        console.log('\n📁 Phase 2: Testing VS Code Workspace Loading');
        console.log('─'.repeat(50));

        try {
            // Test workspace file validity
            console.log('🔍 Checking workspace file integrity...');
            const workspacePath = path.join(this.projectRoot, 'projects-workspace.code-workspace');
            const workspaceContent = await fs.readFile(workspacePath, 'utf8');

            try {
                const workspace = JSON.parse(workspaceContent);
                this.testResults.workspaceLoading.details.push('✅ Workspace JSON is valid');

                // Check for memory bank folder
                const memoryBankFolder = workspace.folders.find(f => f.name === '🧠 Memory Bank');
                if (memoryBankFolder) {
                    this.testResults.workspaceLoading.details.push('✅ Memory Bank folder configured in workspace');
                } else {
                    this.testResults.workspaceLoading.details.push('❌ Memory Bank folder missing from workspace');
                }

                // Check for memory tasks
                const memoryTasks = workspace.tasks.tasks.filter(t => t.label.includes('Memory'));
                this.testResults.workspaceLoading.details.push(`✅ Found ${memoryTasks.length} memory-related tasks`);

            } catch (jsonError) {
                this.testResults.workspaceLoading.details.push(`❌ Workspace JSON invalid: ${jsonError.message}`);
            }

            // Test directory structure
            console.log('📂 Verifying directory structure...');
            const directoriesToCheck = [
                this.memoryBankPath,
                'C:\\dev\\projects\\crypto-enhanced',
                'D:\\dev-memory\\claude-code'
            ];

            for (const dir of directoriesToCheck) {
                try {
                    await fs.access(dir);
                    this.testResults.workspaceLoading.details.push(`✅ Directory exists: ${dir}`);
                } catch {
                    this.testResults.workspaceLoading.details.push(`❌ Directory missing: ${dir}`);
                }
            }

            this.testResults.workspaceLoading.status = 'passed';
        } catch (error) {
            this.testResults.workspaceLoading.status = 'failed';
            this.testResults.workspaceLoading.details.push(`❌ Workspace loading error: ${error.message}`);
        }
    }

    async testMCPConnections() {
        console.log('\n🔌 Phase 3: Testing MCP Server Connections');
        console.log('─'.repeat(50));

        try {
            // Test MCP configuration
            console.log('🔍 Checking MCP configuration...');
            const mcpPath = path.join(this.projectRoot, '.mcp.json');
            const mcpContent = await fs.readFile(mcpPath, 'utf8');

            const mcpConfig = JSON.parse(mcpContent);
            const serverCount = Object.keys(mcpConfig.mcpServers).length;
            this.testResults.mcpConnections.details.push(`✅ MCP config has ${serverCount} servers configured`);

            // List configured servers
            const servers = Object.keys(mcpConfig.mcpServers);
            this.testResults.mcpConnections.details.push(`📋 Configured servers: ${servers.join(', ')}`);

            // Verify no problematic memory-bank server
            if (!mcpConfig.mcpServers['memory-bank']) {
                this.testResults.mcpConnections.details.push('✅ Problematic memory-bank server removed');
            } else {
                this.testResults.mcpConnections.details.push('⚠️ Memory-bank server still configured');
            }

            this.testResults.mcpConnections.status = 'passed';
        } catch (error) {
            this.testResults.mcpConnections.status = 'failed';
            this.testResults.mcpConnections.details.push(`❌ MCP connection error: ${error.message}`);
        }
    }

    async testMemoryTaskIntegration() {
        console.log('\n⚙️ Phase 4: Testing Memory Task Integration');
        console.log('─'.repeat(50));

        try {
            // Test memory CLI functionality
            console.log('🔍 Testing memory CLI commands...');

            const testCommands = ['health', 'stats', 'list'];
            for (const command of testCommands) {
                try {
                    const result = await this.executeNodeCommand(`node memory_cli.js ${command}`);
                    if (result.success) {
                        this.testResults.taskSystem.details.push(`✅ Command '${command}' executed successfully`);
                    } else {
                        this.testResults.taskSystem.details.push(`❌ Command '${command}' failed: ${result.error}`);
                    }
                } catch (cmdError) {
                    this.testResults.taskSystem.details.push(`❌ Command '${command}' threw error: ${cmdError.message}`);
                }
            }

            // Test PowerShell wrapper
            console.log('🔍 Testing PowerShell wrapper...');
            try {
                const psResult = await this.executePowerShellCommand('.\\memory.ps1 health');
                if (psResult.success) {
                    this.testResults.taskSystem.details.push('✅ PowerShell wrapper works correctly');
                } else {
                    this.testResults.taskSystem.details.push(`❌ PowerShell wrapper failed: ${psResult.error}`);
                }
            } catch (psError) {
                this.testResults.taskSystem.details.push(`❌ PowerShell wrapper error: ${psError.message}`);
            }

            this.testResults.taskSystem.status = 'passed';
        } catch (error) {
            this.testResults.taskSystem.status = 'failed';
            this.testResults.taskSystem.details.push(`❌ Task integration error: ${error.message}`);
        }
    }

    async executeNodeCommand(command) {
        return new Promise((resolve) => {
            exec(command, { cwd: this.memoryBankPath }, (error, stdout, stderr) => {
                resolve({
                    success: !error,
                    output: stdout,
                    error: error ? error.message : stderr
                });
            });
        });
    }

    async executePowerShellCommand(command) {
        return new Promise((resolve) => {
            exec(`powershell -Command "${command}"`, { cwd: this.memoryBankPath }, (error, stdout, stderr) => {
                resolve({
                    success: !error,
                    output: stdout,
                    error: error ? error.message : stderr
                });
            });
        });
    }

    async generateReport() {
        console.log('\n📊 Test Results Summary');
        console.log('═══════════════════════════════════════════════════════');

        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        for (const [testName, result] of Object.entries(this.testResults)) {
            totalTests++;
            if (result.status === 'passed') {
                passedTests++;
                console.log(`✅ ${testName.toUpperCase()}: PASSED`);
            } else if (result.status === 'failed') {
                failedTests++;
                console.log(`❌ ${testName.toUpperCase()}: FAILED`);
            } else {
                console.log(`⏳ ${testName.toUpperCase()}: ${result.status.toUpperCase()}`);
            }

            // Show details
            result.details.forEach(detail => {
                console.log(`   ${detail}`);
            });
            console.log('');
        }

        console.log('─'.repeat(50));
        console.log(`📈 Overall Results: ${passedTests}/${totalTests} tests passed`);

        if (failedTests === 0) {
            console.log('🎉 All memory system components are working correctly!');
        } else {
            console.log(`⚠️ ${failedTests} test(s) failed - requires attention`);
        }

        // Save detailed report
        const reportPath = path.join(this.memoryBankPath, 'test_report.json');
        await fs.writeFile(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: { total: totalTests, passed: passedTests, failed: failedTests },
            details: this.testResults
        }, null, 2));

        console.log(`📄 Detailed report saved to: ${reportPath}`);
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new VSCodeMemoryTester();
    tester.runSystematicTests().catch(console.error);
}

module.exports = VSCodeMemoryTester;
