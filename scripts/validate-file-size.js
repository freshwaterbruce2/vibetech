#!/usr/bin/env node

/**
 * File Size Validation Script
 * Enforces the 360-line maximum rule for all code files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_LINES = 360;
const WARNING_THRESHOLD = 300;

// File extensions to check
const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.java', '.cpp', '.c', '.cs', '.go',
  '.rs', '.swift', '.kt', '.rb', '.php'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.next',
  'out'
];

const violations = [];
const warnings = [];
let checkedFiles = 0;

function shouldCheckFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CODE_EXTENSIONS.includes(ext);
}

function shouldIgnoreDir(dirPath) {
  const dirName = path.basename(dirPath);
  return IGNORE_DIRS.includes(dirName) || dirName.startsWith('.');
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return 0;
  }
}

function checkFile(filePath) {
  if (!shouldCheckFile(filePath)) return;

  checkedFiles++;
  const lines = countLines(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  if (lines > MAX_LINES) {
    violations.push({
      file: relativePath,
      lines: lines,
      excess: lines - MAX_LINES
    });
  } else if (lines > WARNING_THRESHOLD) {
    warnings.push({
      file: relativePath,
      lines: lines,
      remaining: MAX_LINES - lines
    });
  }
}

function walkDirectory(dirPath) {
  if (shouldIgnoreDir(dirPath)) return;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        walkDirectory(fullPath);
      } else if (entry.isFile()) {
        checkFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error accessing ${dirPath}: ${error.message}`);
  }
}

// Main execution
console.log('🔍 Validating file sizes...\n');
console.log(`📏 Maximum allowed lines: ${MAX_LINES}`);
console.log(`⚠️  Warning threshold: ${WARNING_THRESHOLD}\n`);

const startPath = process.cwd();
walkDirectory(startPath);

// Report results
console.log(`\n✅ Checked ${checkedFiles} files\n`);

if (warnings.length > 0) {
  console.log('⚠️  FILES APPROACHING LIMIT:');
  console.log('─'.repeat(60));
  warnings.forEach(w => {
    console.log(`  ${w.file}`);
    console.log(`    Lines: ${w.lines} (${w.remaining} remaining)`);
  });
  console.log('');
}

if (violations.length > 0) {
  console.log('❌ VIOLATIONS FOUND:');
  console.log('═'.repeat(60));
  violations.forEach(v => {
    console.log(`  ${v.file}`);
    console.log(`    Lines: ${v.lines} (${v.excess} over limit)`);
    console.log(`    Action Required: Split into modules`);
  });
  console.log('');
  console.log(`🚫 ${violations.length} file(s) violate the 360-line rule!`);
  console.log('   These MUST be split into smaller modules.\n');

  process.exit(1);
} else {
  console.log('✨ All files comply with the 360-line limit!\n');
  process.exit(0);
}