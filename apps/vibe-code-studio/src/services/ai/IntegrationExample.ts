/**
 * Integration Example
 *
 * Demonstrates how to use the modular 7-layer system with plugins
 * Shows integration with existing TaskPlanner and ExecutionEngine
 */

import { AgentTask } from '@nova/types';

// Import plugin system
import { pluginRegistry, pluginLoader } from './plugin-system';
import SecurityPlugin from './plugins/ExampleSecurityPlugin';

// Import orchestration components
import { MultiTaskOrchestrator } from './orchestration';

// Import integration components
import { IntegratedSevenLayerSystem } from './integration';

// Import existing services
import { TaskPlanner } from './TaskPlanner';
import { ExecutionEngine } from './ExecutionEngine';
import { SevenLayerPromptArchitecture } from './SevenLayerPromptArchitecture';
import { UnifiedAIService } from './UnifiedAIService';
import { FileSystemService } from '../FileSystemService';
import { WorkspaceService } from '../WorkspaceService';
import { GitService } from '../GitService';

/**
 * Example: Initialize the complete system
 */
export async function initializeAISystem(
  fileSystemService: FileSystemService,
  workspaceService: WorkspaceService,
  gitService: GitService
): Promise<{
  orchestrator: MultiTaskOrchestrator;
  integratedSystem: IntegratedSevenLayerSystem;
}> {
  console.log('🚀 Initializing AI System with Plugin Architecture');

  // Step 1: Initialize core services
  const aiService = new UnifiedAIService();
  const taskPlanner = new TaskPlanner(aiService, fileSystemService);
  const executionEngine = new ExecutionEngine(
    fileSystemService,
    aiService,
    workspaceService,
    gitService
  );

  // Step 2: Load plugins
  console.log('📦 Loading plugins...');

  // Register security plugin
  await pluginRegistry.register(SecurityPlugin);

  // Load plugins from configuration
  await pluginLoader.loadFromConfig();

  const stats = pluginRegistry.getStats();
  console.log(`✅ Loaded ${stats.totalPlugins} plugins`);
  console.log(`   - Layers: ${stats.byType.layer}`);
  console.log(`   - Reviewers: ${stats.byType.reviewer}`);
  console.log(`   - Executors: ${stats.byType.executor}`);
  console.log(`   - Databases: ${stats.byType.database}`);

  // Step 3: Initialize 7-layer architecture
  const sevenLayer = new SevenLayerPromptArchitecture();

  // Step 4: Initialize orchestrator with modular components
  const orchestrator = new MultiTaskOrchestrator(
    sevenLayer,
    taskPlanner,
    executionEngine,
    {
      maxParallelTasks: 5,
      maxParallelEdits: 10,
      enableReview: true,
      enableAmendments: true,
      enableRollback: true,
      atomicBatchSize: 3
    }
  );

  // Step 5: Initialize integrated system
  const integratedSystem = new IntegratedSevenLayerSystem(
    fileSystemService,
    {
      monorepoRoot: 'C:\\dev',
      enableLearning: true,
      enableMonorepoOptimization: true
    }
  );

  console.log('✨ AI System initialized successfully');

  return { orchestrator, integratedSystem };
}

/**
 * Example: Process a task through the system
 */
export async function processTask(
  task: AgentTask,
  orchestrator: MultiTaskOrchestrator,
  integratedSystem: IntegratedSevenLayerSystem
): Promise<void> {
  console.log(`\n🎯 Processing task: ${task.title}`);

  try {
    // Option 1: Process through integrated 7-layer system
    console.log('📊 Processing through 7-layer system...');
    const layerResult = await integratedSystem.processWithMaxProbability(task);

    console.log(`✅ Layer processing complete:`);
    console.log(`   - Success probability: ${Math.round(layerResult.successProbability * 100)}%`);
    console.log(`   - Execution time: ${layerResult.executionTime}ms`);
    console.log(`   - Generated ${layerResult.multiTaskQueue.length} tasks`);
    console.log(`   - ${layerResult.editOperations.length} edit operations`);
    console.log(`   - ${layerResult.reviews.length} reviews`);

    // Option 2: Process through multi-task orchestrator
    if (layerResult.multiTaskQueue.length > 1) {
      console.log('\n🔄 Processing tasks through orchestrator...');
      const batch = await orchestrator.executeMultiTask(layerResult.multiTaskQueue);

      console.log(`✅ Orchestration complete:`);
      console.log(`   - Batch status: ${batch.status}`);
      console.log(`   - Review score: ${batch.reviewScore ? Math.round(batch.reviewScore * 100) + '%' : 'N/A'}`);
      console.log(`   - Execution time: ${batch.endTime ? (batch.endTime.getTime() - batch.startTime.getTime()) / 1000 + 's' : 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Task processing failed:', error);
    throw error;
  }
}

/**
 * Example: Create and register a custom plugin
 */
export async function createCustomPlugin(): Promise<void> {
  console.log('\n🔌 Creating custom plugin...');

  // Define a custom executor plugin for Docker operations
  const dockerPlugin = {
    id: 'docker-executor',
    name: 'Docker Executor Plugin',
    version: '1.0.0',
    type: 'executor' as const,
    actionType: 'docker_command',

    capabilities: [{
      name: 'execute-docker',
      description: 'Execute Docker commands',
      handler: async (params: any) => {
        console.log(`[Docker] Executing: ${params.command}`);
        // Simulate Docker command execution
        return {
          success: true,
          message: `Docker command completed: ${params.command}`,
          data: { containerId: 'abc123' }
        };
      }
    }],

    execute: async function (params: any) {
      return this.capabilities[0].handler(params);
    },

    validateParams: function (params: any): boolean {
      return typeof params.command === 'string';
    }
  };

  // Register the plugin
  await pluginRegistry.register(dockerPlugin);
  console.log('✅ Custom Docker plugin registered');

  // Now the ExecutionEngine can handle 'docker_command' action type
  const executor = pluginRegistry.getExecutorForAction('docker_command');
  if (executor) {
    const result = await executor.execute({ command: 'docker ps' });
    console.log('Docker execution result:', result);
  }
}

/**
 * Example: Use plugin capabilities
 */
export async function demonstratePluginCapabilities(): Promise<void> {
  console.log('\n🎨 Demonstrating plugin capabilities...');

  // Execute a capability across all plugins that support it
  const securityResults = await pluginRegistry.executeCapability(
    'security-review',
    { id: 'test-task', title: 'Test', steps: [] },
    []
  );

  console.log(`Security reviews completed: ${securityResults.length}`);

  // Get all review plugins and run them
  const reviewPlugins = pluginRegistry.getReviewPlugins();
  console.log(`Available review plugins: ${reviewPlugins.length}`);

  for (const plugin of reviewPlugins) {
    console.log(`  - ${plugin.name}: ${plugin.reviewPerspective}`);
  }
}

/**
 * Example: Complete workflow
 */
export async function runCompleteWorkflow(): Promise<void> {
  console.log('\n🚀 Running complete AI workflow\n');
  console.log('='.repeat(50));

  // Mock services for example
  const fileSystemService = {} as FileSystemService;
  const workspaceService = {} as WorkspaceService;
  const gitService = {} as GitService;

  // Initialize system
  const { orchestrator, integratedSystem } = await initializeAISystem(
    fileSystemService,
    workspaceService,
    gitService
  );

  // Create a sample task
  const sampleTask: AgentTask = {
    id: 'task-001',
    title: 'Refactor authentication system',
    description: 'Refactor the authentication system to use JWT tokens',
    userRequest: 'Please refactor our auth system to use JWT',
    steps: [
      {
        id: 'step-1',
        taskId: 'task-001',
        order: 1,
        title: 'Analyze current auth implementation',
        description: 'Review existing authentication code',
        action: {
          type: 'analyze_code',
          params: { filePath: 'src/auth/index.ts' }
        },
        status: 'pending',
        requiresApproval: false,
        maxRetries: 3,
        retryCount: 0
      }
    ],
    status: 'planning',
    createdAt: new Date()
  };

  // Process the task
  await processTask(sampleTask, orchestrator, integratedSystem);

  // Create custom plugin
  await createCustomPlugin();

  // Demonstrate plugin capabilities
  await demonstratePluginCapabilities();

  // Show final statistics
  console.log('\n📊 Final Statistics:');
  const orchestratorStats = orchestrator.getStats();
  console.log('Orchestrator:', orchestratorStats);

  const systemStats = await integratedSystem.getStats();
  console.log('Integrated System:', systemStats);

  const registryStats = pluginRegistry.getStats();
  console.log('Plugin Registry:', registryStats);

  console.log('\n✨ Workflow complete!');
}

/**
 * Export for use in other modules
 */
export {
  initializeAISystem as initialize,
  processTask as process,
  createCustomPlugin as createPlugin,
  demonstratePluginCapabilities as demonstratePlugins,
  runCompleteWorkflow as runWorkflow
};