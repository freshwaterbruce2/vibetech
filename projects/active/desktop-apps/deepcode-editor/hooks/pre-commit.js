#!/usr/bin/env node

/**
 * Pre-commit hook for code quality enforcement
 * Runs TypeScript checking, linting, and formatting
 */

import { execSync } from 'child_process';
import { exit } from 'process';

console.log('🔍 Running pre-commit checks...\n');

let hasErrors = false;

// 1. TypeScript Check (CRITICAL - blocks commit on errors)
console.log('📘 TypeScript check...');
try {
  execSync('pnpm exec tsc --noEmit', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ TypeScript check passed\n');
} catch (error) {
  console.error('❌ TypeScript errors detected!');
  console.error('   Run: pnpm typecheck');
  console.error('   To see all errors\n');
  hasErrors = true;
}

// 2. ESLint Check (warnings allowed, errors block)
console.log('🔧 ESLint check...');
try {
  execSync('pnpm run lint', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ ESLint check passed\n');
} catch (error) {
  console.error('❌ ESLint errors detected!');
  console.error('   Run: pnpm run lint:fix');
  console.error('   To auto-fix issues\n');
  hasErrors = true;
}

// 3. Format Check (informational)
console.log('✨ Prettier format check...');
try {
  execSync('pnpm run format:check', {
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('✅ Code formatting is correct\n');
} catch (error) {
  console.warn('⚠️  Some files need formatting');
  console.warn('   Run: pnpm run format');
  console.warn('   (Not blocking commit)\n');
}

// Final result
if (hasErrors) {
  console.error('\n❌ Pre-commit checks FAILED');
  console.error('   Fix the errors above before committing\n');
  exit(1);
}

console.log('✅ All pre-commit checks passed!\n');
exit(0);
