module.exports = {
  // TypeScript files (general)
  // Fast operations only - tests run on pre-push hook
  '*.{ts,tsx}': [
    // Run import sorting with ESLint with zero tolerance for warnings
    'eslint --fix --max-warnings 0',
    // Run Prettier after ESLint to ensure consistent formatting
    'prettier --write',
  ],

  // JavaScript files
  '*.{js,jsx}': [
    // Run ESLint without TypeScript type checking with zero tolerance for warnings
    'eslint --fix --max-warnings 0',
    // Run Prettier after ESLint to ensure consistent formatting
    'prettier --write',
  ],

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],

  // CSS files
  '*.{css,scss,sass}': ['prettier --write'],

  // HTML files
  '*.html': ['prettier --write'],

  // YAML files
  '*.{yml,yaml}': ['prettier --write'],

  // Package.json special handling
  'package.json': [
    'prettier --write',
    // Sort package.json
    'npx sort-package-json',
  ],
};
