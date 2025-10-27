module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'node_modules',
    'public',
    'release',
    'electron/preload.js',
    'electron/main.js',
    'scripts/**/*.js',
    '*.config.js',
    '.lintstagedrc.js',
    '.prettierrc.js',
    '.claude/**/*.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: ['react-refresh', '@typescript-eslint', 'react', 'simple-import-sort', 'import'],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // React rules
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Import sorting rules
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports
          ['^\\u0000'],
          // Node.js builtins
          ['^node:'],
          // React and packages
          ['^react', '^@?\\w'],
          // Internal imports (using @/ alias)
          ['^@/'],
          // Parent imports
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports
          ['^.+\\.s?css$'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'off', // Disabled due to resolver issues

    // General rules
    'no-console':
      process.env.NODE_ENV === 'production'
        ? ['error', { allow: ['warn', 'error'] }]
        : ['warn', { allow: ['log', 'warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-nested-ternary': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
  },
};
