#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Setting up Git hooks...\n');

try {
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not in a git repository!');
    console.log('Please run this script from the root of your git repository.');
    process.exit(1);
  }

  // Install husky
  console.log('📦 Installing Husky...');
  execSync('npx husky install', { stdio: 'inherit' });

  // Set up husky hooks
  const hooks = [
    {
      name: 'pre-commit',
      command: 'npm run hook:pre-commit',
    },
    {
      name: 'commit-msg',
      command: 'npx --no -- commitlint --edit "$1"',
    },
    {
      name: 'pre-push',
      command: 'npm test -- --run',
    },
  ];

  // Create hooks
  hooks.forEach((hook) => {
    console.log(`📝 Creating ${hook.name} hook...`);
    try {
      execSync(`npx husky add .husky/${hook.name} "${hook.command}"`, { stdio: 'inherit' });
    } catch (error) {
      // Hook might already exist, that's okay
      console.log(`  ℹ️  ${hook.name} hook already exists, skipping...`);
    }
  });

  // Make hooks executable
  const huskyDir = path.join(process.cwd(), '.husky');
  if (fs.existsSync(huskyDir)) {
    const hookFiles = fs.readdirSync(huskyDir).filter((file) => !file.startsWith('.'));
    hookFiles.forEach((file) => {
      const hookPath = path.join(huskyDir, file);
      fs.chmodSync(hookPath, '755');
    });
  }

  // Verify installation
  console.log('\n✅ Git hooks setup completed!');
  console.log('\n📋 Installed hooks:');
  console.log('  - pre-commit: Runs TypeScript checking, linting, and formatting');
  console.log('  - commit-msg: Validates commit messages follow conventional format');
  console.log('  - pre-push: Runs all tests before pushing');

  console.log('\n💡 Tips:');
  console.log('  - Use "git commit --no-verify" to skip hooks (not recommended)');
  console.log('  - Run "npm run lint:fix" to auto-fix linting issues');
  console.log('  - Run "npm run format" to format all files');
  console.log('  - Run "npm run typecheck" to check TypeScript types');

  console.log('\n📝 Commit message format:');
  console.log('  <type>(<scope>): <subject>');
  console.log('  Example: feat(editor): add syntax highlighting');
} catch (error) {
  console.error('❌ Error setting up hooks:', error.message);
  process.exit(1);
}
