import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist',
      '**/dist/**',
      'build',
      '**/build/**',
      'node_modules',
      '.pnpm',
      '.turbo',
      '.nx',
      '.next',
      '.vite-cache/**',
      '.vscode/**',
      '.venv*/**',
      'DesktopCommanderMCP/**',
      'Vibe-Tutor/**',
      'opcode/**',
      'edge_extension_deps/**',
      'database-proxy-standalone/**',
      'devworktrees*/**',
      'backups/**',
      'logs/**',
      'playwright-report/**',
      'active-projects/**',
      'projects/**',
      'PowerShell/**',
      'public/assets/**',
      'supabase/**',
      'desktop-commander-mcp/**',
      'workflow-hub-mcp/**',
      '*.min.js',
      '*.bundle.js',
      'coverage/**'
    ]
  },
  
  // Base JavaScript configuration
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  
  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
      'prefer-template': 'error'
    }
  }
);