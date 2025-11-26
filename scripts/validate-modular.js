#!/usr/bin/env node

/**
 * Modular Architecture Validation Script
 * Ensures code follows modular architecture principles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expected modular structure patterns
const MODULAR_PATTERNS = {
  modules: /^(modules?|features?|components?|services?|plugins?)/i,
  shared: /^(shared|common|utils?|helpers?|lib)/i,
  interfaces: /^(interfaces?|types?|models?|schemas?)/i,
  config: /^(config|settings?|constants?)/i
};

// Anti-patterns that indicate non-modular code
const ANTI_PATTERNS = [
  'GodObject',
  'MonolithicController',
  'SuperClass',
  'DoEverything',
  'Manager',  // Often indicates a class doing too much
  'Utils'     // When it's a catch-all utilities file
];

const issues = [];
const suggestions = [];
let checkedProjects = 0;

function checkProjectStructure(projectPath) {
  const srcPath = path.join(projectPath, 'src');
  if (!fs.existsSync(srcPath)) return false;

  checkedProjects++;
  const entries = fs.readdirSync(srcPath);

  let hasModularStructure = false;
  const foundPatterns = [];

  // Check for modular directory structure
  for (const entry of entries) {
    for (const [patternName, pattern] of Object.entries(MODULAR_PATTERNS)) {
      if (pattern.test(entry)) {
        hasModularStructure = true;
        foundPatterns.push(`${patternName}: ${entry}`);
      }
    }
  }

  const projectName = path.basename(projectPath);

  if (!hasModularStructure) {
    issues.push({
      project: projectName,
      issue: 'Missing modular directory structure',
      path: srcPath,
      suggestion: 'Reorganize code into modules/, shared/, interfaces/, and config/ directories'
    });
  } else {
    console.log(`✅ ${projectName}: Found modular structure (${foundPatterns.join(', ')})`);
  }

  return hasModularStructure;
}

function checkForAntiPatterns(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.ts') &&
      !filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));

    // Check filename for anti-patterns
    for (const antiPattern of ANTI_PATTERNS) {
      if (fileName.toLowerCase().includes(antiPattern.toLowerCase())) {
        const relativePath = path.relative(process.cwd(), filePath);

        // Special handling for legitimate uses
        if (antiPattern === 'Manager' && fileName.includes('StateManager')) continue;
        if (antiPattern === 'Utils' && content.length < 1000) continue; // Small utils are OK

        suggestions.push({
          file: relativePath,
          pattern: antiPattern,
          suggestion: `Consider breaking up '${fileName}' into smaller, focused modules`
        });
      }
    }

    // Check for classes/modules doing too much (rough heuristic)
    const exportCount = (content.match(/export\s+(const|function|class|interface|type)/g) || []).length;
    if (exportCount > 10) {
      const relativePath = path.relative(process.cwd(), filePath);
      suggestions.push({
        file: relativePath,
        pattern: 'Too many exports',
        suggestion: `File has ${exportCount} exports. Consider splitting into focused modules`
      });
    }
  } catch (error) {
    // Ignore read errors
  }
}

function walkDirectory(dirPath, checkAntiPatterns = false) {
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.turbo'];

  if (ignoreDirs.includes(path.basename(dirPath))) return;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        walkDirectory(fullPath, checkAntiPatterns);
      } else if (entry.isFile() && checkAntiPatterns) {
        checkForAntiPatterns(fullPath);
      }
    }
  } catch (error) {
    // Ignore access errors
  }
}

// Main execution
console.log('🏗️  Validating modular architecture...\n');

const rootPath = process.cwd();

// Check apps directory
const appsPath = path.join(rootPath, 'apps');
if (fs.existsSync(appsPath)) {
  const apps = fs.readdirSync(appsPath, { withFileTypes: true });
  for (const app of apps) {
    if (app.isDirectory()) {
      const appPath = path.join(appsPath, app.name);
      checkProjectStructure(appPath);
    }
  }
}

// Check packages directory
const packagesPath = path.join(rootPath, 'packages');
if (fs.existsSync(packagesPath)) {
  const packages = fs.readdirSync(packagesPath, { withFileTypes: true });
  for (const pkg of packages) {
    if (pkg.isDirectory()) {
      const pkgPath = path.join(packagesPath, pkg.name);
      checkProjectStructure(pkgPath);
    }
  }
}

// Check for anti-patterns
console.log('\n🔍 Checking for anti-patterns...\n');
walkDirectory(rootPath, true);

// Report results
console.log(`\n📊 Checked ${checkedProjects} projects\n`);

if (suggestions.length > 0) {
  console.log('💡 SUGGESTIONS FOR IMPROVEMENT:');
  console.log('─'.repeat(60));
  suggestions.forEach(s => {
    console.log(`  ${s.file}`);
    console.log(`    Pattern: ${s.pattern}`);
    console.log(`    ${s.suggestion}`);
  });
  console.log('');
}

if (issues.length > 0) {
  console.log('❌ MODULAR ARCHITECTURE ISSUES:');
  console.log('═'.repeat(60));
  issues.forEach(i => {
    console.log(`  Project: ${i.project}`);
    console.log(`    Issue: ${i.issue}`);
    console.log(`    Path: ${i.path}`);
    console.log(`    Fix: ${i.suggestion}`);
  });
  console.log('');
  console.log(`🚫 ${issues.length} project(s) need restructuring!\n`);
  process.exit(1);
} else {
  console.log('✨ All projects follow modular architecture!\n');

  if (suggestions.length > 0) {
    console.log('   (See suggestions above for further improvements)\n');
  }

  process.exit(0);
}