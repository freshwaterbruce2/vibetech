-- Create tables if they don't exist
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

-- Create indices
CREATE INDEX IF NOT EXISTS idx_mistakes_timestamp ON mistakes(timestamp);
CREATE INDEX IF NOT EXISTS idx_mistakes_source ON mistakes(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge(source);

-- Insert new knowledge entries
INSERT INTO knowledge (timestamp, category, content, tags, source) VALUES
  (datetime('now'), 'project_architecture', 'Digital Content Builder: Electron + React app with AI integration, templates system, rich editor, multi-format exports, and security hardening.', 'electron,react,ai,content-generation,templates,security', 'nova'),
  (datetime('now'), 'integration_patterns', 'IPC Bridge implementation for real-time WebSocket communication between desktop apps. Command routing and learning adapter integration.', 'ipc,websocket,integration,real-time,communication', 'nova'),
  (datetime('now'), 'monorepo_structure', 'Monorepo with shared packages (@vibetech/shared-config, db-learning, vibetech-shared), dual-DB architecture, IPC contracts, CI/CD pipeline.', 'monorepo,pnpm,shared-packages,databases,ci-cd', 'nova'),
  (datetime('now'), 'build_management', 'Build process: Delete old builds before new ones. Use pnpm. User handles build commands directly due to time consumption.', 'build,pnpm,package-management,optimization', 'deepcode'),
  (datetime('now'), 'code_standards', 'File size limit: Max 360 lines from 11/22/2025. Promotes better code organization and maintainability.', 'standards,file-size,code-organization,maintainability', 'deepcode'),
  (datetime('now'), 'platform_preferences', 'Desktop apps: Windows 11 and PowerShell only. Platform-specific optimizations for Windows environment.', 'windows11,powershell,desktop,platform-specific', 'deepcode'),
  (datetime('now'), 'security_patterns', 'Digital Content Builder security: contextBridge API verification, secure preload scripts, localStorage restoration, IPC security boundaries.', 'security,electron,context-bridge,ipc,preload', 'nova'),
  (datetime('now'), 'performance_optimization', 'Fixed React infinite loops. Token-based context limiting for API overflow prevention. Database WAL mode and append-only patterns.', 'performance,react,api-limits,database,optimization', 'nova'),
  (datetime('now'), 'testing_strategy', 'Pre-commit hooks for automated testing. Validation protocols for agent learning systems. Unit tests for shared packages.', 'testing,pre-commit,validation,unit-tests,automation', 'nova'),
  (datetime('now'), 'active_projects', 'Active: Taskmaster, DeepCode Editor, Digital Content Builder, Vibe Tech Platform, Business Booking Platform, Shipping PWA, IconForge', 'projects,active,taskmaster,deepcode,vibe,pwa', 'nova'),
  (datetime('now'), 'unified_intelligence', 'Phase 3 Unified Intelligence Platform 85% complete. Cross-app learning, shared intelligence, unified desktop integration.', 'intelligence,unified-platform,learning,integration,phase3', 'nova'),
  (datetime('now'), 'ipc_communication', 'IPC Bridge auto-starts on app launch with port checking and clean shutdown. WebSocket server for real-time cross-app communication.', 'ipc,websocket,auto-start,communication,real-time', 'nova'),
  (datetime('now'), 'git_workflow', 'Git LFS configured for large media files. Pre-commit hooks for validation. Automated testing integration.', 'git,lfs,pre-commit,automation,workflow', 'nova'),
  (datetime('now'), 'electron_patterns', 'Electron best practices: Secure contextBridge usage, proper preload scripts, localStorage management, IPC security boundaries.', 'electron,security,best-practices,ipc,preload', 'deepcode'),
  (datetime('now'), 'package_management', 'PNPM workspace configuration for monorepo. Shared packages strategy. Dependency management best practices.', 'pnpm,workspace,monorepo,packages,dependencies', 'nova');

-- Insert recent mistakes and fixes
INSERT INTO mistakes (timestamp, platform, category, description, fix, severity, source) VALUES
  (datetime('now'), 'electron', 'api_security', 'Context bridge API not properly verified in preload script causing security vulnerability', 'Implement proper contextBridge.exposeInMainWorld with explicit API verification and type checking', 'high', 'deepcode'),
  (datetime('now'), 'react', 'performance', 'React infinite loop caused by improper dependency arrays in useEffect hooks', 'Fixed dependency arrays and implemented proper cleanup functions in useEffect hooks', 'critical', 'nova'),
  (datetime('now'), 'api', 'rate_limiting', 'DeepSeek API overflow due to excessive context in requests', 'Implemented token-based context limiting with proper chunking strategy', 'high', 'deepcode'),
  (datetime('now'), 'build', 'configuration', 'Build artifacts not properly cleaned causing conflicts in subsequent builds', 'Always delete old build directories before creating new ones', 'medium', 'deepcode'),
  (datetime('now'), 'git', 'file_management', 'Large media files causing repository bloat', 'Configured Git LFS for large media files to optimize repository performance', 'medium', 'nova'),
  (datetime('now'), 'electron', 'localStorage', 'localStorage data not persisting across app restarts in Electron', 'Proper localStorage restoration in preload script with contextBridge', 'medium', 'deepcode'),
  (datetime('now'), 'eslint', 'configuration', 'ESLint plugin prefix incorrect causing configuration errors', 'Corrected ESLint plugin prefix and added media file ignore rules', 'low', 'nova'),
  (datetime('now'), 'node', 'module_version', 'Node module version mismatch for native dependencies', 'Rebuild native modules with correct Node version using pnpm rebuild', 'high', 'nova'),
  (datetime('now'), 'pnpm', 'store_location', 'PNPM store location mismatch causing dependency issues', 'Reinstall dependencies with pnpm install to use correct store location', 'medium', 'deepcode'),
  (datetime('now'), 'typescript', 'compilation', 'TypeScript compilation errors due to missing type definitions', 'Install proper @types packages and configure tsconfig correctly', 'medium', 'nova');

-- Display summary
SELECT 'Knowledge entries: ' || COUNT(*) FROM knowledge;
SELECT 'Mistake entries: ' || COUNT(*) FROM mistakes;
SELECT '';
SELECT 'Knowledge by category:';
SELECT '  - ' || category || ': ' || COUNT(*) as count
FROM knowledge
GROUP BY category
ORDER BY COUNT(*) DESC;
SELECT '';
SELECT 'Mistakes by platform:';
SELECT '  - ' || platform || ': ' || COUNT(*) as count
FROM mistakes
GROUP BY platform
ORDER BY COUNT(*) DESC;