/**
 * ESLint Rule: no-localstorage-electron
 *
 * Prevents usage of localStorage in Electron applications.
 * Uses AST-based analysis for accurate detection without false positives.
 *
 * @version 1.0.0
 * @date 2025-11-02
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow localStorage usage in Electron apps',
      recommended: true,
      url: 'https://github.com/electron/electron/blob/main/docs/api/storage.md'
    },
    fixable: 'code',
    messages: {
      noLocalStorage: 'localStorage is forbidden in Electron apps. Use electron-store with IPC bridge instead.',
      noSessionStorage: 'sessionStorage is forbidden in Electron apps. Use electron-store with IPC bridge instead.',
      useElectronStore: 'Replace with: await window.electronAPI.store.{{method}}({{args}})'
    },
    schema: []
  },

  create(context) {
    // Helper to check if we're in an Electron project
    const isElectronProject = () => {
      const filename = context.getFilename();
      // Check if file is in an Electron project structure
      return filename.includes('/electron/') ||
             filename.includes('\\electron\\') ||
             filename.includes('/src/') ||
             filename.includes('\\src\\') ||
             filename.includes('electron');
    };

    return {
      // Check for localStorage.setItem, localStorage.getItem, etc.
      MemberExpression(node) {
        if (!isElectronProject()) return;

        // Check for localStorage
        if (node.object.name === 'localStorage') {
          context.report({
            node,
            messageId: 'noLocalStorage',
            fix(fixer) {
              const method = node.property.name;
              const parent = node.parent;

              // Handle common localStorage patterns
              if (parent.type === 'CallExpression') {
                switch(method) {
                  case 'setItem':
                    if (parent.arguments.length === 2) {
                      const key = context.getSourceCode().getText(parent.arguments[0]);
                      const value = context.getSourceCode().getText(parent.arguments[1]);
                      return fixer.replaceText(parent, `window.electronAPI.store.set(${key}, ${value})`);
                    }
                    break;
                  case 'getItem':
                    if (parent.arguments.length === 1) {
                      const key = context.getSourceCode().getText(parent.arguments[0]);
                      return fixer.replaceText(parent, `window.electronAPI.store.get(${key})`);
                    }
                    break;
                  case 'removeItem':
                    if (parent.arguments.length === 1) {
                      const key = context.getSourceCode().getText(parent.arguments[0]);
                      return fixer.replaceText(parent, `window.electronAPI.store.delete(${key})`);
                    }
                    break;
                  case 'clear':
                    return fixer.replaceText(parent, `window.electronAPI.store.clear()`);
                }
              }

              // For property access like localStorage['key']
              if (parent.type === 'MemberExpression' && node.property.type === 'Literal') {
                return fixer.replaceText(node, `window.electronAPI.store`);
              }

              // Default replacement
              return fixer.replaceText(node, 'window.electronAPI.store');
            }
          });
        }

        // Check for sessionStorage
        if (node.object.name === 'sessionStorage') {
          context.report({
            node,
            messageId: 'noSessionStorage'
          });
        }

        // Check for window.localStorage pattern
        if (node.object.type === 'MemberExpression' &&
            node.object.object.name === 'window' &&
            node.object.property.name === 'localStorage') {
          context.report({
            node: node.object,
            messageId: 'noLocalStorage',
            fix(fixer) {
              return fixer.replaceText(node.object, 'window.electronAPI.store');
            }
          });
        }
      },

      // Check for direct property assignment like localStorage.key = value
      AssignmentExpression(node) {
        if (!isElectronProject()) return;

        if (node.left.type === 'MemberExpression') {
          if (node.left.object.name === 'localStorage') {
            const key = node.left.property.name || node.left.property.value;
            const value = context.getSourceCode().getText(node.right);

            context.report({
              node,
              messageId: 'noLocalStorage',
              fix(fixer) {
                return fixer.replaceText(node, `window.electronAPI.store.set('${key}', ${value})`);
              }
            });
          }
        }
      }
    };
  }
};