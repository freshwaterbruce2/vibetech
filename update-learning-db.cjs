const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Determine the database path
const dbPath = path.join(process.env.APPDATA || process.env.HOME, 'vibetech', 'databases', 'learning.db');
const dbDir = path.dirname(dbPath);

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open database
const db = new Database(dbPath, {
  verbose: console.log
});

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS mistakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    platform TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    fix TEXT NOT NULL,
    severity TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('nova', 'deepcode')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('nova', 'deepcode')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_mistakes_timestamp ON mistakes(timestamp);
  CREATE INDEX IF NOT EXISTS idx_mistakes_source ON mistakes(source);
  CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
  CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge(source);
`);

const currentTimestamp = new Date().toISOString();

// Prepare statements
const addKnowledge = db.prepare(`
  INSERT INTO knowledge (timestamp, category, content, tags, source)
  VALUES (?, ?, ?, ?, ?)
`);

const logMistake = db.prepare(`
  INSERT INTO mistakes (timestamp, platform, category, description, fix, severity, source)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Recent project patterns and knowledge
const newKnowledgeEntries = [
  {
    timestamp: currentTimestamp,
    category: 'project_architecture',
    content: 'Digital Content Builder: Electron + React app with AI integration, templates system, rich editor, multi-format exports, and security hardening.',
    tags: 'electron,react,ai,content-generation,templates,security',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'integration_patterns',
    content: 'IPC Bridge implementation for real-time WebSocket communication between desktop apps. Command routing and learning adapter integration.',
    tags: 'ipc,websocket,integration,real-time,communication',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'monorepo_structure',
    content: 'Monorepo with shared packages (@vibetech/shared-config, db-learning, vibetech-shared), dual-DB architecture, IPC contracts, CI/CD pipeline.',
    tags: 'monorepo,pnpm,shared-packages,databases,ci-cd',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'build_management',
    content: 'Build process: Delete old builds before new ones. Use pnpm. User handles build commands directly due to time consumption.',
    tags: 'build,pnpm,package-management,optimization',
    source: 'deepcode'
  },
  {
    timestamp: currentTimestamp,
    category: 'code_standards',
    content: 'File size limit: Max 360 lines from 11/22/2025. Promotes better code organization and maintainability.',
    tags: 'standards,file-size,code-organization,maintainability',
    source: 'deepcode'
  },
  {
    timestamp: currentTimestamp,
    category: 'platform_preferences',
    content: 'Desktop apps: Windows 11 and PowerShell only. Platform-specific optimizations for Windows environment.',
    tags: 'windows11,powershell,desktop,platform-specific',
    source: 'deepcode'
  },
  {
    timestamp: currentTimestamp,
    category: 'security_patterns',
    content: 'Digital Content Builder security: contextBridge API verification, secure preload scripts, localStorage restoration, IPC security boundaries.',
    tags: 'security,electron,context-bridge,ipc,preload',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'performance_optimization',
    content: 'Fixed React infinite loops. Token-based context limiting for API overflow prevention. Database WAL mode and append-only patterns.',
    tags: 'performance,react,api-limits,database,optimization',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'testing_strategy',
    content: 'Pre-commit hooks for automated testing. Validation protocols for agent learning systems. Unit tests for shared packages.',
    tags: 'testing,pre-commit,validation,unit-tests,automation',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'active_projects',
    content: 'Active: Taskmaster, DeepCode Editor, Digital Content Builder, Vibe Tech Platform, Business Booking Platform, Shipping PWA, IconForge',
    tags: 'projects,active,taskmaster,deepcode,vibe,pwa',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'unified_intelligence',
    content: 'Phase 3 Unified Intelligence Platform 85% complete. Cross-app learning, shared intelligence, unified desktop integration.',
    tags: 'intelligence,unified-platform,learning,integration,phase3',
    source: 'nova'
  },
  {
    timestamp: currentTimestamp,
    category: 'ipc_communication',
    content: 'IPC Bridge auto-starts on app launch with port checking and clean shutdown. WebSocket server for real-time cross-app communication.',
    tags: 'ipc,websocket,auto-start,communication,real-time',
    source: 'nova'
  }
];

// Recent mistakes and fixes
const recentMistakes = [
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
  },
  {
    timestamp: currentTimestamp,
    platform: 'electron',
    category: 'localStorage',
    description: 'localStorage data not persisting across app restarts in Electron',
    fix: 'Proper localStorage restoration in preload script with contextBridge',
    severity: 'medium',
    source: 'deepcode'
  },
  {
    timestamp: currentTimestamp,
    platform: 'eslint',
    category: 'configuration',
    description: 'ESLint plugin prefix incorrect causing configuration errors',
    fix: 'Corrected ESLint plugin prefix and added media file ignore rules',
    severity: 'low',
    source: 'nova'
  }
];

// Insert knowledge entries
console.log('Adding new knowledge entries...');
let knowledgeCount = 0;
newKnowledgeEntries.forEach(entry => {
  try {
    addKnowledge.run(
      entry.timestamp,
      entry.category,
      entry.content,
      entry.tags,
      entry.source
    );
    knowledgeCount++;
    console.log(`Added: ${entry.category}`);
  } catch (error) {
    console.error(`Failed to add knowledge entry: ${error.message}`);
  }
});

// Insert mistake entries
console.log('\nAdding recent mistakes and fixes...');
let mistakeCount = 0;
recentMistakes.forEach(entry => {
  try {
    logMistake.run(
      entry.timestamp,
      entry.platform,
      entry.category,
      entry.description,
      entry.fix,
      entry.severity,
      entry.source
    );
    mistakeCount++;
    console.log(`Logged: ${entry.category} (${entry.platform})`);
  } catch (error) {
    console.error(`Failed to log mistake: ${error.message}`);
  }
});

// Generate summary statistics
console.log('\n========================================');
console.log('Learning System Update Summary');
console.log('========================================');
console.log(`New knowledge entries added: ${knowledgeCount}`);
console.log(`New mistake entries logged: ${mistakeCount}`);

// Get total counts
const totalKnowledge = db.prepare('SELECT COUNT(*) as count FROM knowledge').get();
const totalMistakes = db.prepare('SELECT COUNT(*) as count FROM mistakes').get();

console.log(`\nTotal knowledge entries: ${totalKnowledge.count}`);
console.log(`Total mistake entries: ${totalMistakes.count}`);

// Category breakdown for knowledge
const knowledgeCategories = db.prepare(`
  SELECT category, COUNT(*) as count
  FROM knowledge
  GROUP BY category
  ORDER BY count DESC
`).all();

console.log('\nKnowledge by category:');
knowledgeCategories.forEach(row => {
  console.log(`  - ${row.category}: ${row.count}`);
});

// Platform breakdown for mistakes
const mistakePlatforms = db.prepare(`
  SELECT platform, COUNT(*) as count
  FROM mistakes
  GROUP BY platform
  ORDER BY count DESC
`).all();

console.log('\nMistakes by platform:');
mistakePlatforms.forEach(row => {
  console.log(`  - ${row.platform}: ${row.count}`);
});

// Perform checkpoint
console.log('\nPerforming database checkpoint...');
db.pragma('wal_checkpoint(TRUNCATE)');
console.log('Learning system update complete!');

// Close the database
db.close();