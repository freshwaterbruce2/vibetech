import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "node_modules",
      ".pnpm",
      ".turbo",
      ".nx",
      ".next",
      ".venv*/**",
      "DesktopCommanderMCP/**",
      "Vibe-Tutor/**",
      "opcode/**",
      "edge_extension_deps/**",
      "database-proxy-standalone/**",
      "logs/**",
      "playwright-report/**",
      "active-projects/**",
      "projects/**",
      "PowerShell/**",
      "public/assets/**",
      "supabase/**",
      "desktop-commander-mcp/**",
      "*.min.js",
      "*.bundle.js"
    ]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Enable strict TypeScript rules
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Additional code quality rules
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
    },
  }
);
