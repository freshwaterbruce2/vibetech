#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

// Helper function to run commands and capture output
function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed: ${description}`);
    return false;
  }
}

console.log('🔧 Fixing common code issues...\n');

// 1. Fix import sorting
console.log('📦 Fixing import sorting...');
runCommand('npm run lint:fix', 'Running ESLint with auto-fix');

// 2. Format code
console.log('\n✨ Formatting code...');
runCommand('npm run format', 'Running Prettier');

// 3. Check TypeScript
console.log('\n🔍 Checking TypeScript types...');
const tsSuccess = runCommand('npm run typecheck', 'Running TypeScript type check');

// 4. Run tests
console.log('\n🧪 Running tests...');
const testSuccess = runCommand('npm test -- --run', 'Running tests');

// Summary
console.log('\n📊 Summary:');
console.log('✅ Import sorting: Fixed');
console.log('✅ Code formatting: Fixed');
console.log(tsSuccess ? '✅ TypeScript: No errors' : '❌ TypeScript: Has errors');
console.log(testSuccess ? '✅ Tests: Passing' : '❌ Tests: Failing');

if (!tsSuccess || !testSuccess) {
  console.log(
    '\n⚠️  Some issues could not be automatically fixed. Please review the errors above.'
  );
  process.exit(1);
} else {
  console.log('\n✨ All issues fixed successfully!');
}
