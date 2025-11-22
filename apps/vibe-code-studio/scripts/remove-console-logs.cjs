#!/usr/bin/env node
/**
 * Script to replace console.log/warn/error with logger service
 * Run: node scripts/remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    'src/services/Logger.ts',
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'src/test-setup.ts',
  ]
});

console.log(`Found ${files.length} files to process`);

let totalReplacements = 0;

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let replacements = 0;

  // Check if file needs logger import
  const hasConsoleLog = /console\.(log|warn|error|info|debug|group|groupEnd|table|time|timeEnd)/.test(content);

  if (hasConsoleLog) {
    // Add logger import if not present
    if (!content.includes('from \'../services/Logger\'') &&
        !content.includes('from \'../../services/Logger\'') &&
        !content.includes('from \'./Logger\'') &&
        !content.includes('from \'@/services/Logger\'')) {

      // Determine relative path to Logger
      const normalizedPath = filePath.replace(/\\/g, '/');
      const pathParts = normalizedPath.split('/');
      const srcIndex = pathParts.indexOf('src');
      const depth = pathParts.length - srcIndex - 2; // Distance from src folder

      let importPath;
      if (depth <= 0) {
        importPath = './services/Logger';
      } else if (depth === 1) {
        importPath = '../services/Logger';
      } else {
        importPath = '../'.repeat(depth) + 'services/Logger';
      }

      // Add import after first line (usually after comment or at top)
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find where to insert (after initial comments/directives)
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith('//') && !lines[i].startsWith('/*') && lines[i].trim() !== '') {
          insertIndex = i;
          break;
        }
      }

      lines.splice(insertIndex, 0, `import { logger } from '${importPath}';`);
      content = lines.join('\n');
    }

    // Replace console methods
    content = content.replace(/console\.log\(/g, () => {
      replacements++;
      return 'logger.debug(';
    });

    content = content.replace(/console\.info\(/g, () => {
      replacements++;
      return 'logger.info(';
    });

    content = content.replace(/console\.warn\(/g, () => {
      replacements++;
      return 'logger.warn(';
    });

    content = content.replace(/console\.error\(/g, () => {
      replacements++;
      return 'logger.error(';
    });

    content = content.replace(/console\.debug\(/g, () => {
      replacements++;
      return 'logger.debug(';
    });

    content = content.replace(/console\.group\(/g, () => {
      replacements++;
      return 'logger.group(';
    });

    content = content.replace(/console\.groupEnd\(/g, () => {
      replacements++;
      return 'logger.groupEnd(';
    });

    content = content.replace(/console\.table\(/g, () => {
      replacements++;
      return 'logger.table(';
    });

    content = content.replace(/console\.time\(/g, () => {
      replacements++;
      return 'logger.time(';
    });

    content = content.replace(/console\.timeEnd\(/g, () => {
      replacements++;
      return 'logger.timeEnd(';
    });

    if (replacements > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}: ${replacements} replacements`);
      totalReplacements += replacements;
    }
  }
});

console.log(`\n✨ Complete! Replaced ${totalReplacements} console statements across ${files.length} files`);
console.log('🔍 Run "pnpm run typecheck" to verify no issues');
console.log('🚀 Logger service is now production-ready!');