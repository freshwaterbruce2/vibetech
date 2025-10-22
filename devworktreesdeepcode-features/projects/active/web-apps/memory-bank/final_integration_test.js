/**
 * Final VS Code Memory Integration Test
 * Comprehensive validation of all components after fixes
 */

const fs = require('fs').promises;
const path = require('path');

class FinalIntegrationTest {
    constructor() {
        this.projectRoot = 'C:\\dev\\projects';
        this.memoryBankPath = 'C:\\dev\\projects\\memory-bank';
        this.testResults = {
            memorySystem: { status: 'pending', score: 0, maxScore: 10 },
            vscodeIntegration: { status: 'pending', score: 0, maxScore: 10 },
            mcpConnections: { status: 'pending', score: 0, maxScore: 10 },
            jestConfiguration: { status: 'pending', score: 0, maxScore: 10 },
            workspaceHealth: { status: 'pending', score: 0, maxScore: 10 }
        };
        this.overallScore = 0;
        this.maxOverallScore = 50;
    }

    async runFinalValidation() {
        console.log('🎯 Final VS Code Memory Integration Validation');
        console.log('═════════════════════════════════════════════════');

        try {
            await this.testMemorySystemCore();
            await this.testVSCodeIntegration();
            await this.testMCPConnections();
            await this.testJestConfiguration();
            await this.testWorkspaceHealth();
            await this.generateFinalReport();
        } catch (error) {
            console.error('❌ Final validation failed:', error.message);
        }
    }

    async testMemorySystemCore() {
        console.log('\\n🧠 Testing Memory System Core Functionality');
        console.log('─'.repeat(50));

        let score = 0;
        const maxScore = 10;

        try {
            // Test 1: Memory manager initialization (2 points)
            const MemoryManager = require('./memory_manager.js');
            const manager = new MemoryManager();
            const initResult = await manager.initialize();

            if (initResult) {
                score += 2;
                console.log('   ✅ [2/2] Memory manager initializes successfully');
            } else {
                console.log('   ❌ [0/2] Memory manager initialization failed');
            }

            // Test 2: Storage statistics (2 points)
            try {
                const stats = await manager.getStorageStats();
                if (stats && stats.localMemory && stats.bulkStorage) {
                    score += 2;
                    console.log(`   ✅ [2/2] Storage stats working - ${stats.localMemory.files + stats.bulkStorage.files} total files`);
                } else {
                    console.log('   ❌ [0/2] Storage statistics failed');
                }
            } catch (error) {
                console.log('   ❌ [0/2] Storage statistics error:', error.message);
            }

            // Test 3: Data storage/retrieval cycle (3 points)
            try {
                const testData = {
                    test: 'final-validation',
                    timestamp: new Date().toISOString(),
                    source: 'final-integration-test'
                };

                const storeResult = await manager.storeData('final-test', testData, { type: 'validation' });
                if (storeResult.success) {
                    score += 1.5;
                    console.log('   ✅ [1.5/1.5] Data storage successful');

                    const retrieveResult = await manager.retrieveData('final-test');
                    if (retrieveResult.success && retrieveResult.data.test === testData.test) {
                        score += 1.5;
                        console.log('   ✅ [1.5/1.5] Data retrieval successful');
                    } else {
                        console.log('   ❌ [0/1.5] Data retrieval failed');
                    }
                } else {
                    console.log('   ❌ [0/3] Data storage failed');
                }
            } catch (error) {
                console.log('   ❌ [0/3] Storage/retrieval test error:', error.message);
            }

            // Test 4: Cleanup functionality (2 points)
            try {
                const cleanupResult = await manager.cleanup();
                if (cleanupResult && typeof cleanupResult.archivedFiles === 'number') {
                    score += 2;
                    console.log('   ✅ [2/2] Cleanup functionality working');
                } else {
                    console.log('   ❌ [0/2] Cleanup functionality failed');
                }
            } catch (error) {
                console.log('   ❌ [0/2] Cleanup test error:', error.message);
            }

            // Test 5: Health check (1 point)
            try {
                const healthResult = await this.executeNodeCommand('node memory_cli.js health');
                if (healthResult.success && healthResult.output.includes('healthy')) {
                    score += 1;
                    console.log('   ✅ [1/1] Health check passes');
                } else {
                    console.log('   ❌ [0/1] Health check failed');
                }
            } catch (error) {
                console.log('   ❌ [0/1] Health check error:', error.message);
            }

        } catch (error) {
            console.log('   ❌ Memory system core test failed:', error.message);
        }

        this.testResults.memorySystem = {
            status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor',
            score,
            maxScore
        };

        console.log(`   📊 Memory System Score: ${score}/${maxScore} (${this.getGrade(score, maxScore)})`);
    }

    async testVSCodeIntegration() {
        console.log('\\n🔧 Testing VS Code Integration');
        console.log('─'.repeat(50));

        let score = 0;
        const maxScore = 10;

        try {
            // Test 1: Workspace file validity (3 points)
            const workspacePath = path.join(this.projectRoot, 'projects-workspace.code-workspace');
            const workspaceContent = await fs.readFile(workspacePath, 'utf8');

            try {
                const workspace = JSON.parse(workspaceContent);
                score += 2;
                console.log('   ✅ [2/2] Workspace JSON is valid');

                // Check memory bank folder
                const memoryBankFolder = workspace.folders.find(f => f.name === '🧠 Memory Bank');
                if (memoryBankFolder) {
                    score += 1;
                    console.log('   ✅ [1/1] Memory Bank folder configured');
                } else {
                    console.log('   ❌ [0/1] Memory Bank folder missing');
                }
            } catch (error) {
                console.log('   ❌ [0/3] Workspace JSON invalid:', error.message);
            }

            // Test 2: Memory tasks configuration (3 points)
            try {
                const workspace = JSON.parse(workspaceContent);
                const memoryTasks = workspace.tasks.tasks.filter(t => t.label.includes('Memory'));
                if (memoryTasks.length >= 5) {
                    score += 3;
                    console.log(`   ✅ [3/3] Found ${memoryTasks.length} memory tasks configured`);
                } else if (memoryTasks.length >= 3) {
                    score += 2;
                    console.log(`   ⚠️ [2/3] Found ${memoryTasks.length} memory tasks (expected 5+)`);
                } else {
                    score += 1;
                    console.log(`   ❌ [1/3] Only ${memoryTasks.length} memory tasks found`);
                }
            } catch (error) {
                console.log('   ❌ [0/3] Memory tasks check failed:', error.message);
            }

            // Test 3: Environment variables (2 points)
            try {
                const workspace = JSON.parse(workspaceContent);
                const envVars = workspace.settings['terminal.integrated.env.windows'];
                if (envVars && envVars.MEMORY_BANK_PATH && envVars.BULK_STORAGE_PATH) {
                    score += 2;
                    console.log('   ✅ [2/2] Environment variables configured correctly');
                } else {
                    console.log('   ❌ [0/2] Environment variables missing or incomplete');
                }
            } catch (error) {
                console.log('   ❌ [0/2] Environment variables check failed:', error.message);
            }

            // Test 4: Directory accessibility (2 points)
            const dirs = [
                this.memoryBankPath,
                'D:\\dev-memory\\claude-code'
            ];

            let accessibleDirs = 0;
            for (const dir of dirs) {
                try {
                    await fs.access(dir);
                    accessibleDirs++;
                } catch {
                    console.log(`   ⚠️ Directory not accessible: ${dir}`);
                }
            }

            const dirScore = (accessibleDirs / dirs.length) * 2;
            score += dirScore;
            console.log(`   ✅ [${dirScore}/2] ${accessibleDirs}/${dirs.length} directories accessible`);

        } catch (error) {
            console.log('   ❌ VS Code integration test failed:', error.message);
        }

        this.testResults.vscodeIntegration = {
            status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor',
            score,
            maxScore
        };

        console.log(`   📊 VS Code Integration Score: ${score}/${maxScore} (${this.getGrade(score, maxScore)})`);
    }

    async testMCPConnections() {
        console.log('\\n🔌 Testing MCP Server Connections');
        console.log('─'.repeat(50));

        let score = 0;
        const maxScore = 10;

        try {
            // Test 1: MCP configuration file validity (3 points)
            const mcpPath = path.join(this.projectRoot, '.mcp.json');
            const mcpContent = await fs.readFile(mcpPath, 'utf8');

            try {
                const mcpConfig = JSON.parse(mcpContent);
                score += 2;
                console.log('   ✅ [2/2] MCP configuration JSON is valid');

                const serverCount = Object.keys(mcpConfig.mcpServers).length;
                if (serverCount >= 8) {
                    score += 1;
                    console.log(`   ✅ [1/1] ${serverCount} MCP servers configured`);
                } else {
                    console.log(`   ❌ [0/1] Only ${serverCount} MCP servers configured (expected 8+)`);
                }
            } catch (error) {
                console.log('   ❌ [0/3] MCP configuration invalid:', error.message);
            }

            // Test 2: Required servers present (4 points)
            try {
                const mcpConfig = JSON.parse(mcpContent);
                const requiredServers = ['filesystem', 'github', 'playwright', 'puppeteer'];
                let foundServers = 0;

                for (const server of requiredServers) {
                    if (mcpConfig.mcpServers[server]) {
                        foundServers++;
                        console.log(`   ✅ Required server configured: ${server}`);
                    } else {
                        console.log(`   ❌ Missing server: ${server}`);
                    }
                }

                score += foundServers;
                console.log(`   📊 [${foundServers}/4] Required servers configured`);
            } catch (error) {
                console.log('   ❌ [0/4] Server configuration check failed:', error.message);
            }

            // Test 3: Problematic servers removed (2 points)
            try {
                const mcpConfig = JSON.parse(mcpContent);
                if (!mcpConfig.mcpServers['memory-bank']) {
                    score += 2;
                    console.log('   ✅ [2/2] Problematic memory-bank server properly removed');
                } else {
                    console.log('   ❌ [0/2] Problematic memory-bank server still configured');
                }
            } catch (error) {
                console.log('   ❌ [0/2] Server removal check failed:', error.message);
            }

            // Test 4: Configuration structure (1 point)
            try {
                const mcpConfig = JSON.parse(mcpContent);
                if (mcpConfig.mcpServers && typeof mcpConfig.mcpServers === 'object') {
                    score += 1;
                    console.log('   ✅ [1/1] MCP configuration structure is correct');
                } else {
                    console.log('   ❌ [0/1] MCP configuration structure invalid');
                }
            } catch (error) {
                console.log('   ❌ [0/1] Configuration structure check failed:', error.message);
            }

        } catch (error) {
            console.log('   ❌ MCP connections test failed:', error.message);
        }

        this.testResults.mcpConnections = {
            status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor',
            score,
            maxScore
        };

        console.log(`   📊 MCP Connections Score: ${score}/${maxScore} (${this.getGrade(score, maxScore)})`);
    }

    async testJestConfiguration() {
        console.log('\\n🧪 Testing Jest Configuration');
        console.log('─'.repeat(50));

        let score = 0;
        const maxScore = 10;

        try {
            // Test 1: Vibetech-21-Main Jest setup (4 points)
            const vibetechPackagePath = path.join(this.projectRoot, 'vibetech-21-main', 'package.json');
            try {
                const packageData = await fs.readFile(vibetechPackagePath, 'utf8');
                const packageJson = JSON.parse(packageData);

                if (packageJson.devDependencies && packageJson.devDependencies.jest) {
                    score += 2;
                    console.log('   ✅ [2/2] Vibetech-21-Main: Jest dependency added');
                } else {
                    console.log('   ❌ [0/2] Vibetech-21-Main: Jest dependency missing');
                }

                if (packageJson.scripts && packageJson.scripts.test) {
                    score += 2;
                    console.log('   ✅ [2/2] Vibetech-21-Main: Test scripts configured');
                } else {
                    console.log('   ❌ [0/2] Vibetech-21-Main: Test scripts missing');
                }
            } catch (error) {
                console.log('   ❌ [0/4] Vibetech-21-Main Jest check failed:', error.message);
            }

            // Test 2: Revenue Management Center Jest setup (3 points)
            const revenuePackagePath = path.join(this.projectRoot, 'revenue-management-center', 'backend', 'package.json');
            try {
                const packageData = await fs.readFile(revenuePackagePath, 'utf8');
                const packageJson = JSON.parse(packageData);

                if (packageJson.devDependencies && packageJson.devDependencies.jest) {
                    score += 2;
                    console.log('   ✅ [2/2] Revenue Center: Jest dependency added');
                } else {
                    console.log('   ❌ [0/2] Revenue Center: Jest dependency missing');
                }

                if (packageJson.scripts && packageJson.scripts.test) {
                    score += 1;
                    console.log('   ✅ [1/1] Revenue Center: Test scripts configured');
                } else {
                    console.log('   ❌ [0/1] Revenue Center: Test scripts missing');
                }
            } catch (error) {
                console.log('   ❌ [0/3] Revenue Center Jest check failed:', error.message);
            }

            // Test 3: VS Code Jest settings (3 points)
            const workspacePath = path.join(this.projectRoot, 'projects-workspace.code-workspace');
            try {
                const workspaceContent = await fs.readFile(workspacePath, 'utf8');
                const workspace = JSON.parse(workspaceContent);

                if (workspace.settings && workspace.settings['jest.autoRun']) {
                    score += 2;
                    console.log('   ✅ [2/2] VS Code Jest settings configured');
                } else {
                    console.log('   ❌ [0/2] VS Code Jest settings missing');
                }

                if (workspace.settings && workspace.settings['jest.disabledWorkspaceFolders']) {
                    score += 1;
                    console.log('   ✅ [1/1] Jest disabled for non-Jest projects');
                } else {
                    console.log('   ❌ [0/1] Jest workspace exclusions missing');
                }
            } catch (error) {
                console.log('   ❌ [0/3] VS Code Jest settings check failed:', error.message);
            }

        } catch (error) {
            console.log('   ❌ Jest configuration test failed:', error.message);
        }

        this.testResults.jestConfiguration = {
            status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor',
            score,
            maxScore
        };

        console.log(`   📊 Jest Configuration Score: ${score}/${maxScore} (${this.getGrade(score, maxScore)})`);
    }

    async testWorkspaceHealth() {
        console.log('\\n🏥 Testing Overall Workspace Health');
        console.log('─'.repeat(50));

        let score = 0;
        const maxScore = 10;

        try {
            // Test 1: Critical files present (3 points)
            const criticalFiles = [
                path.join(this.projectRoot, 'projects-workspace.code-workspace'),
                path.join(this.projectRoot, '.mcp.json'),
                path.join(this.memoryBankPath, 'memory_manager.js'),
                path.join(this.memoryBankPath, 'memory_config.json')
            ];

            let presentFiles = 0;
            for (const file of criticalFiles) {
                try {
                    await fs.access(file);
                    presentFiles++;
                } catch {
                    console.log(`   ⚠️ Missing critical file: ${path.basename(file)}`);
                }
            }

            const fileScore = (presentFiles / criticalFiles.length) * 3;
            score += fileScore;
            console.log(`   ✅ [${fileScore}/3] ${presentFiles}/${criticalFiles.length} critical files present`);

            // Test 2: Configuration consistency (3 points)
            try {
                const workspacePath = path.join(this.projectRoot, 'projects-workspace.code-workspace');
                const workspaceContent = await fs.readFile(workspacePath, 'utf8');
                const workspace = JSON.parse(workspaceContent);

                // Check for consistent paths
                let consistencyScore = 0;
                if (workspace.settings && workspace.settings['terminal.integrated.env.windows']) {
                    const envVars = workspace.settings['terminal.integrated.env.windows'];
                    if (envVars.MEMORY_BANK_PATH === 'C:\\\\dev\\\\projects\\\\memory-bank') {
                        consistencyScore += 1;
                    }
                    if (envVars.BULK_STORAGE_PATH === 'D:\\\\dev-memory\\\\claude-code') {
                        consistencyScore += 1;
                    }
                    if (envVars.PROJECTS_ROOT === 'C:\\\\dev\\\\projects') {
                        consistencyScore += 1;
                    }
                }

                score += consistencyScore;
                console.log(`   ✅ [${consistencyScore}/3] Configuration paths consistent`);
            } catch (error) {
                console.log('   ❌ [0/3] Configuration consistency check failed:', error.message);
            }

            // Test 3: No conflicting configurations (2 points)
            let conflictScore = 2; // Start with full points, subtract for conflicts

            try {
                // Check for Jest/Vitest conflicts
                const invoicePackagePath = path.join(this.projectRoot, 'invoice-saas', 'package.json');
                const invoiceData = await fs.readFile(invoicePackagePath, 'utf8');
                const invoiceJson = JSON.parse(invoiceData);

                if (invoiceJson.scripts && invoiceJson.scripts.test && invoiceJson.scripts.test.includes('vitest')) {
                    // This is correct - invoice-saas should use vitest
                    console.log('   ✅ [1/1] Invoice-SaaS correctly uses Vitest');
                } else {
                    conflictScore -= 1;
                    console.log('   ❌ [0/1] Invoice-SaaS test configuration issue');
                }

                // Check workspace Jest settings exclude trading projects
                const workspaceContent = await fs.readFile(path.join(this.projectRoot, 'projects-workspace.code-workspace'), 'utf8');
                const workspace = JSON.parse(workspaceContent);

                if (workspace.settings && workspace.settings['jest.disabledWorkspaceFolders']) {
                    const disabled = workspace.settings['jest.disabledWorkspaceFolders'];
                    if (disabled.includes('🚀 Crypto Trading')) {
                        console.log('   ✅ [1/1] Jest properly disabled for crypto trading project');
                    } else {
                        conflictScore -= 1;
                        console.log('   ❌ [0/1] Jest not disabled for crypto trading project');
                    }
                }

                score += conflictScore;
            } catch (error) {
                console.log('   ❌ [0/2] Conflict detection failed:', error.message);
            }

            // Test 4: Performance indicators (2 points)
            try {
                // Check if memory system is responsive
                const healthResult = await this.executeNodeCommand('node memory_cli.js stats');
                if (healthResult.success && healthResult.output.length > 0) {
                    score += 1;
                    console.log('   ✅ [1/1] Memory system responsive');
                } else {
                    console.log('   ❌ [0/1] Memory system unresponsive');
                }

                // Check workspace file size (should be reasonable)
                const workspaceStats = await fs.stat(path.join(this.projectRoot, 'projects-workspace.code-workspace'));
                if (workspaceStats.size < 50000) { // Less than 50KB is reasonable
                    score += 1;
                    console.log('   ✅ [1/1] Workspace file size reasonable');
                } else {
                    console.log('   ❌ [0/1] Workspace file unusually large');
                }
            } catch (error) {
                console.log('   ❌ [0/2] Performance check failed:', error.message);
            }

        } catch (error) {
            console.log('   ❌ Workspace health test failed:', error.message);
        }

        this.testResults.workspaceHealth = {
            status: score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor',
            score,
            maxScore
        };

        console.log(`   📊 Workspace Health Score: ${score}/${maxScore} (${this.getGrade(score, maxScore)})`);
    }

    async generateFinalReport() {
        console.log('\\n🎯 Final Integration Test Report');
        console.log('═════════════════════════════════════════════════════════════');

        // Calculate overall score
        for (const [category, result] of Object.entries(this.testResults)) {
            this.overallScore += result.score;
        }

        const overallPercentage = Math.round((this.overallScore / this.maxOverallScore) * 100);
        const overallGrade = this.getGrade(this.overallScore, this.maxOverallScore);

        console.log('\\n📊 Category Scores:');
        for (const [category, result] of Object.entries(this.testResults)) {
            const percentage = Math.round((result.score / result.maxScore) * 100);
            const statusIcon = this.getStatusIcon(result.status);
            console.log(`   ${statusIcon} ${category.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${result.score}/${result.maxScore} (${percentage}%)`);
        }

        console.log('\\n🏆 Overall Results:');
        console.log(`   📈 Total Score: ${this.overallScore}/${this.maxOverallScore} (${overallPercentage}%)`);
        console.log(`   🎯 Grade: ${overallGrade}`);
        console.log(`   📊 Status: ${this.getOverallStatus(overallPercentage)}`);

        // Recommendations
        console.log('\\n💡 Recommendations:');
        if (overallPercentage >= 90) {
            console.log('   🎉 Excellent! Your VS Code memory system integration is working perfectly.');
            console.log('   ✅ All critical components are functioning optimally.');
            console.log('   🚀 You can now use Claude Code Chat with full memory system support.');
        } else if (overallPercentage >= 80) {
            console.log('   👍 Very Good! Most components are working well.');
            console.log('   🔧 Consider addressing any remaining minor issues for optimal performance.');
        } else if (overallPercentage >= 70) {
            console.log('   ⚠️ Good, but some improvements needed.');
            console.log('   🔍 Review failed tests and apply fixes for better integration.');
        } else {
            console.log('   ❌ Issues detected that need attention.');
            console.log('   🛠️ Please address failed tests before using the memory system.');
        }

        // Save comprehensive report
        const reportPath = path.join(this.memoryBankPath, 'final_integration_report.json');
        const report = {
            timestamp: new Date().toISOString(),
            overallScore: this.overallScore,
            maxOverallScore: this.maxOverallScore,
            overallPercentage,
            overallGrade,
            categoryResults: this.testResults,
            status: overallPercentage >= 80 ? 'ready' : 'needs-attention'
        };

        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\\n📄 Comprehensive report saved to: ${reportPath}`);

        if (overallPercentage >= 80) {
            console.log('\\n🎉 VS Code Memory System Integration is READY FOR USE!');
        } else {
            console.log('\\n⚠️ VS Code Memory System Integration needs additional work before use.');
        }
    }

    async executeNodeCommand(command) {
        const { exec } = require('child_process');
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

    getGrade(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 95) return 'A+';
        if (percentage >= 90) return 'A';
        if (percentage >= 85) return 'A-';
        if (percentage >= 80) return 'B+';
        if (percentage >= 75) return 'B';
        if (percentage >= 70) return 'B-';
        if (percentage >= 65) return 'C+';
        if (percentage >= 60) return 'C';
        return 'F';
    }

    getStatusIcon(status) {
        switch (status) {
            case 'excellent': return '🌟';
            case 'good': return '✅';
            case 'fair': return '⚠️';
            case 'poor': return '❌';
            default: return '⏳';
        }
    }

    getOverallStatus(percentage) {
        if (percentage >= 90) return 'EXCELLENT - Ready for Production';
        if (percentage >= 80) return 'GOOD - Ready for Use';
        if (percentage >= 70) return 'FAIR - Needs Minor Fixes';
        return 'POOR - Requires Major Fixes';
    }
}

// Run final validation if executed directly
if (require.main === module) {
    const tester = new FinalIntegrationTest();
    tester.runFinalValidation().catch(console.error);
}

module.exports = FinalIntegrationTest;
