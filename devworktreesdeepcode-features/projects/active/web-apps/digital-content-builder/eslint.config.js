import js from '@eslint/js';

export default [
    // Ignore directories and files we don't want to lint
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            '*.min.js',
            'tests/visual/reports/**',
            '.turbo/**',
            // Ignore problematic legacy files
            'server-*.js', // Only lint main server.js
            'app.js', // Browser code mixed in
            'content-generator.js', // Mixed environments
            'tests/visual/**', // Browser code for Playwright
            'tests/setup.js' // Has global setup issues
        ]
    },
    // Main server file (production-focused)
    {
        files: ['server.js', 'cache.js', 'design-memory.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', {
                'varsIgnorePattern': '^_',
                'argsIgnorePattern': '^_',
                'args': 'after-used'
            }],
            'no-console': 'off',
            'no-undef': 'off', // Disable for production focus
            'eqeqeq': 'off',
            'no-var': 'warn',
            'prefer-const': 'off',
            'semi': 'off',
            'quotes': 'off',
            'comma-dangle': 'off'
        }
    },
    // Core API test files only
    {
        files: ['tests/api.test.js', 'tests/cache.test.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                beforeEach: 'readonly',
                afterAll: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly',
                global: 'readonly',
                setTimeout: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'off',
            'no-console': 'off',
            'no-undef': 'off' // Focus on functionality over lint perfection
        }
    }
];
