#!/usr/bin/env node

/**
 * Local Development Environment Verification
 * 
 * This script verifies that the local development environment
 * is properly configured for the Vibe Tech monorepo.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Local Development Environment\n');

let allChecks = true;

// Check 1: Node.js version
console.log('1. Checking Node.js version...');
try {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (major >= 18) {
    console.log(`   ✅ Node.js ${nodeVersion} (>=18.x required)\n`);
  } else {
    console.log(`   ❌ Node.js ${nodeVersion} - Please upgrade to 18.x or higher\n`);
    allChecks = false;
  }
} catch (error) {
  console.log(`   ❌ Failed to check Node.js version: ${error.message}\n`);
  allChecks = false;
}

// Check 2: pnpm installation
console.log('2. Checking pnpm installation...');
try {
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
  
  if (pnpmVersion === '9.15.0') {
    console.log(`   ✅ pnpm ${pnpmVersion} (exact match)\n`);
  } else {
    console.log(`   ⚠️  pnpm ${pnpmVersion} (expected 9.15.0, but should work)\n`);
  }
} catch (error) {
  console.log('   ❌ pnpm not found - Install with: npm install -g pnpm@9.15.0\n');
  allChecks = false;
}

// Check 3: Git configuration
console.log('3. Checking Git installation...');
try {
  const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim();
  console.log(`   ✅ ${gitVersion}\n`);
} catch (error) {
  console.log('   ❌ Git not found - Please install Git\n');
  allChecks = false;
}

// Check 4: Python (optional but recommended)
console.log('4. Checking Python installation (optional for crypto trading)...');
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
  console.log(`   ✅ ${pythonVersion}\n`);
} catch (error) {
  console.log('   ⚠️  Python not found (only needed for crypto trading system)\n');
}

// Check 5: Package.json configuration
console.log('5. Checking package.json configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  if (packageJson.packageManager === 'pnpm@9.15.0') {
    console.log('   ✅ Package manager correctly configured as pnpm@9.15.0\n');
  } else {
    console.log(`   ⚠️  Package manager: ${packageJson.packageManager}\n`);
  }
} catch (error) {
  console.log(`   ❌ Failed to read package.json: ${error.message}\n`);
  allChecks = false;
}

// Check 6: Workspace configuration
console.log('6. Checking pnpm workspace...');
try {
  if (fs.existsSync('pnpm-workspace.yaml')) {
    console.log('   ✅ pnpm-workspace.yaml found\n');
  } else {
    console.log('   ❌ pnpm-workspace.yaml not found\n');
    allChecks = false;
  }
} catch (error) {
  console.log(`   ❌ Failed to check workspace: ${error.message}\n`);
  allChecks = false;
}

// Check 7: Dependencies installed
console.log('7. Checking if dependencies are installed...');
try {
  if (fs.existsSync('node_modules')) {
    console.log('   ✅ node_modules directory exists\n');
  } else {
    console.log('   ⚠️  node_modules not found - Run: pnpm install\n');
  }
} catch (error) {
  console.log(`   ❌ Failed to check dependencies: ${error.message}\n`);
}

// Check 8: Environment files
console.log('8. Checking environment configuration...');
const envFiles = ['.env', '.env.development', '.env.local'];
let envFound = false;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    console.log(`   ✅ ${envFile} found`);
    envFound = true;
  }
}

if (!envFound) {
  console.log('   ℹ️  No .env file found - Copy from .env.example if needed');
}
console.log();

// Check 9: Documentation files
console.log('9. Checking documentation...');
const docs = [
  'README.md',
  'QUICK-REFERENCE.md',
  'docs/guides/LOCAL-DEVELOPMENT-GUIDE.md',
  '.github/copilot-instructions.md'
];

let allDocsExist = true;
for (const doc of docs) {
  if (fs.existsSync(doc)) {
    console.log(`   ✅ ${doc}`);
  } else {
    console.log(`   ❌ ${doc} not found`);
    allDocsExist = false;
  }
}
console.log();

// Summary
console.log('━'.repeat(60));
if (allChecks) {
  console.log('✅ All critical checks passed! Environment is ready.');
  console.log('\nNext steps:');
  console.log('  1. Run: pnpm install');
  console.log('  2. Run: pnpm run dev');
  console.log('\nFor detailed setup, see: docs/guides/LOCAL-DEVELOPMENT-GUIDE.md');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\nFor help, see: docs/guides/LOCAL-DEVELOPMENT-GUIDE.md');
  process.exit(1);
}
console.log('━'.repeat(60));
