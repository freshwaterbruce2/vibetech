#!/usr/bin/env node

/**
 * Package Manager Enforcement Script
 * Prevents usage of npm or yarn in favor of pnpm
 * 
 * This script is triggered by npm/yarn preinstall hooks
 * to ensure developers use the correct package manager.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PACKAGE_MANAGER = 'pnpm';
const REQUIRED_VERSION = '9.15.0';

// Detect which package manager is being used
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || '';
  
  if (userAgent.includes('yarn')) {
    return 'yarn';
  } else if (userAgent.includes('pnpm')) {
    return 'pnpm';
  } else if (userAgent.includes('npm')) {
    return 'npm';
  }
  
  return 'unknown';
}

// Get installed pnpm version
function getPnpmVersion() {
  try {
    const version = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
    return version;
  } catch (error) {
    return null;
  }
}

// Main enforcement logic
function enforcePackageManager() {
  const currentPM = detectPackageManager();
  
  // Allow pnpm
  if (currentPM === 'pnpm') {
    const version = getPnpmVersion();
    console.log(`✅ Using ${PACKAGE_MANAGER} ${version || REQUIRED_VERSION}`);
    
    // Warn if version doesn't match
    if (version && version !== REQUIRED_VERSION) {
      console.warn(`⚠️  Warning: Expected pnpm version ${REQUIRED_VERSION}, but found ${version}`);
      console.warn(`   Consider updating: npm install -g pnpm@${REQUIRED_VERSION}`);
    }
    
    return;
  }
  
  // Block npm and yarn
  if (currentPM === 'npm' || currentPM === 'yarn') {
    console.error('');
    console.error('❌ ERROR: This project uses pnpm as the package manager');
    console.error('');
    console.error(`   You tried to use: ${currentPM}`);
    console.error(`   Please use: ${PACKAGE_MANAGER}`);
    console.error('');
    console.error('   Installation:');
    console.error(`   npm install -g pnpm@${REQUIRED_VERSION}`);
    console.error('');
    console.error('   Then run:');
    console.error('   pnpm install');
    console.error('');
    console.error('   See: docs/guides/LOCAL-DEVELOPMENT-GUIDE.md');
    console.error('');
    process.exit(1);
  }
}

// Skip enforcement in CI environments if needed
if (process.env.CI && process.env.SKIP_PNPM_CHECK) {
  console.log('⚠️  Skipping package manager check in CI');
  process.exit(0);
}

// Run enforcement
enforcePackageManager();
