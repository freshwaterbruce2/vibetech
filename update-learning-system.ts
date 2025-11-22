import { LearningDatabase, KnowledgeEntry, MistakeEntry } from './packages/db-learning/src/index';

// Initialize the learning database
const learningDb = LearningDatabase.getInstance();

// Function to add new knowledge entries
function updateLearningData() {
  const currentTimestamp = new Date().toISOString();

  // Recent project patterns and knowledge
  const newKnowledgeEntries: KnowledgeEntry[] = [
    // Digital Content Builder Project
    {
      timestamp: currentTimestamp,
      category: 'project_architecture',
      content: 'Digital Content Builder: Electron + React app with AI integration, templates system, rich editor, multi-format exports, and security hardening. Key features include content generation, template management, and export capabilities.',
      tags: 'electron,react,ai,content-generation,templates,security',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      category: 'integration_patterns',
      content: 'IPC Bridge implementation for real-time WebSocket communication between desktop apps. Enables command routing and learning adapter integration for cross-app intelligence sharing.',
      tags: 'ipc,websocket,integration,real-time,communication',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      category: 'monorepo_structure',
      content: 'Monorepo setup with shared packages (@vibetech/shared-config, db-learning, vibetech-shared), dual-database architecture, standardized IPC contracts, and integrated CI/CD pipeline.',
      tags: 'monorepo,pnpm,shared-packages,databases,ci-cd',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      category: 'build_management',
      content: 'Build process pattern: Always delete old builds before creating new ones. Use pnpm for package management. Build commands are time-consuming so user handles them directly.',
      tags: 'build,pnpm,package-management,optimization',
      source: 'deepcode'
    },
    {
      timestamp: currentTimestamp,
      category: 'code_standards',
      content: 'File size limit: No files should exceed 360 lines from 11/22/2025 onwards. This promotes better code organization and maintainability.',
      tags: 'standards,file-size,code-organization,maintainability',
      source: 'deepcode'
    },
    {
      timestamp: currentTimestamp,
      category: 'platform_preferences',
      content: 'Desktop apps are Windows 11 and PowerShell only. Use platform-specific optimizations and tools for Windows environment.',
      tags: 'windows11,powershell,desktop,platform-specific',
      source: 'deepcode'
    },
    {
      timestamp: currentTimestamp,
      category: 'security_patterns',
      content: 'Security hardening implemented in Digital Content Builder: contextBridge API verification, secure preload scripts, localStorage restoration, and proper IPC security boundaries.',
      tags: 'security,electron,context-bridge,ipc,preload',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      category: 'performance_optimization',
      content: 'Fixed critical React infinite loops in Vibe Code Studio. Implemented token-based context limiting to prevent DeepSeek API overflow. Database optimizations with WAL mode and append-only patterns.',
      tags: 'performance,react,api-limits,database,optimization',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      category: 'testing_strategy',
      content: 'Pre-commit hook integration for automated testing. Validation protocols for agent learning systems. Unit tests for shared packages and database singletons.',
      tags: 'testing,pre-commit,validation,unit-tests,automation',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      category: 'active_projects',
      content: 'Current active projects: Taskmaster (new), DeepCode Editor (enhanced), Digital Content Builder (new), Vibe Tech Platform, Business Booking Platform, Shipping PWA, IconForge',
      tags: 'projects,active,taskmaster,deepcode,vibe,pwa',
      source: 'nova'
    }
  ];

  // Recent mistakes and fixes
  const recentMistakes: MistakeEntry[] = [
    {
      timestamp: currentTimestamp,
      platform: 'electron',
      category: 'api_security',
      description: 'Context bridge API not properly verified in preload script causing security vulnerability',
      fix: 'Implement proper contextBridge.exposeInMainWorld with explicit API verification and type checking',
      severity: 'high',
      source: 'deepcode'
    },
    {
      timestamp: currentTimestamp,
      platform: 'react',
      category: 'performance',
      description: 'React infinite loop caused by improper dependency arrays in useEffect hooks',
      fix: 'Fixed dependency arrays and implemented proper cleanup functions in useEffect hooks',
      severity: 'critical',
      source: 'nova'
    },
    {
      timestamp: currentTimestamp,
      platform: 'api',
      category: 'rate_limiting',
      description: 'DeepSeek API overflow due to excessive context in requests',
      fix: 'Implemented token-based context limiting with proper chunking strategy',
      severity: 'high',
      source: 'deepcode'
    },
    {
      timestamp: currentTimestamp,
      platform: 'build',
      category: 'configuration',
      description: 'Build artifacts not properly cleaned causing conflicts in subsequent builds',
      fix: 'Always delete old build directories before creating new ones',
      severity: 'medium',
      source: 'deepcode'
    },
    {
      timestamp: currentTimestamp,
      platform: 'git',
      category: 'file_management',
      description: 'Large media files causing repository bloat',
      fix: 'Configured Git LFS for large media files to optimize repository performance',
      severity: 'medium',
      source: 'nova'
    }
  ];

  // Insert knowledge entries
  console.log('Adding new knowledge entries...');
  newKnowledgeEntries.forEach(entry => {
    try {
      const id = learningDb.addKnowledge(entry);
      console.log(`Added knowledge entry ${id}: ${entry.category}`);
    } catch (error) {
      console.error(`Failed to add knowledge entry: ${error}`);
    }
  });

  // Insert mistake entries
  console.log('\nAdding recent mistakes and fixes...');
  recentMistakes.forEach(entry => {
    try {
      const id = learningDb.logMistake(entry);
      console.log(`Logged mistake ${id}: ${entry.category} - ${entry.platform}`);
    } catch (error) {
      console.error(`Failed to log mistake: ${error}`);
    }
  });

  // Generate summary statistics
  console.log('\nLearning System Update Summary:');
  console.log('================================');

  const allKnowledge = learningDb.getKnowledge();
  const allMistakes = learningDb.getMistakes();

  console.log(`Total knowledge entries: ${allKnowledge.length}`);
  console.log(`Total mistake entries: ${allMistakes.length}`);

  // Category breakdown for knowledge
  const knowledgeCategories = new Map<string, number>();
  allKnowledge.forEach(entry => {
    knowledgeCategories.set(entry.category, (knowledgeCategories.get(entry.category) || 0) + 1);
  });

  console.log('\nKnowledge by category:');
  Array.from(knowledgeCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });

  // Platform breakdown for mistakes
  const mistakePlatforms = new Map<string, number>();
  allMistakes.forEach(entry => {
    mistakePlatforms.set(entry.platform, (mistakePlatforms.get(entry.platform) || 0) + 1);
  });

  console.log('\nMistakes by platform:');
  Array.from(mistakePlatforms.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([platform, count]) => {
      console.log(`  - ${platform}: ${count}`);
    });

  // Perform checkpoint to ensure data is persisted
  console.log('\nPerforming database checkpoint...');
  learningDb.checkpoint();
  console.log('Learning system update complete!');
}

// Run the update
try {
  updateLearningData();
} catch (error) {
  console.error('Error updating learning system:', error);
} finally {
  // Clean up
  learningDb.close();
}