module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type rules
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Code change that improves performance
        'test', // Adding missing tests or correcting existing tests
        'chore', // Changes to the build process or auxiliary tools
        'revert', // Reverts a previous commit
        'build', // Changes that affect the build system
        'ci', // Changes to CI configuration files and scripts
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope rules
    'scope-case': [2, 'always', 'lower-case'],
    'scope-enum': [
      1,
      'always',
      [
        // Components
        'editor',
        'ai-chat',
        'sidebar',
        'command-palette',
        'find-replace',
        'settings',
        'workspace',

        // Services
        'deepseek',
        'file-system',
        'electron',
        'context',
        'multi-agent',

        // Build/Config
        'deps',
        'build',
        'config',
        'hooks',

        // Testing
        'test',
        'e2e',
      ],
    ],

    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 3],
    'subject-max-length': [2, 'always', 50],

    // Header rules
    'header-max-length': [2, 'always', 100],

    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'body-min-length': [1, 'always', 10],

    // Footer rules
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};
