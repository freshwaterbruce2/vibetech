/**
 * Lint-Staged Configuration
 * Runs on staged files before commit
 *
 * Last Updated: October 16, 2025
 */

module.exports = {
  // TypeScript and TSX files
  '*.{ts,tsx}': [
    // 1. Fix ESLint errors
    'eslint --fix',

    // 2. Format with Prettier
    'prettier --write',

    // 3. Type check (CRITICAL - prevents errors from being committed)
    // Note: This runs on ALL files, not just staged ones, because TypeScript
    // needs to analyze the entire codebase for accurate type checking
    () => 'tsc --noEmit',
  ],

  // JavaScript files
  '*.{js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],

  // JSON, Markdown, YAML files
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],

  // CSS files
  '*.{css,scss,sass}': [
    'prettier --write',
  ],
};
