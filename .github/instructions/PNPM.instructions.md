---
applyTo: '**'
packageManager: pnpm
---

## Package Manager

This project uses **pnpm** as the package manager.

### Commands
- Install dependencies: `pnpm install`
- Add a package: `pnpm add <package>`
- Add dev dependency: `pnpm add -D <package>`
- Remove a package: `pnpm remove <package>`
- Run scripts: `pnpm run <script>` or `pnpm <script>`
- Update dependencies: `pnpm update`

### Workspace Commands (Monorepo)
- Install all workspace dependencies: `pnpm install`
- Run script in specific workspace: `pnpm --filter <workspace> <script>`
- Add dependency to workspace: `pnpm --filter <workspace> add <package>`

Yes, this looks correct and will work as intended! Here's why:

**Structure is valid:**
- The frontmatter metadata (`applyTo: '**'`, `packageManager: pnpm`) is properly formatted
- The `$SELECTION_PLACEHOLDER$` is correctly positioned where you want the selected content to appear
- The YAML frontmatter and Markdown content are properly separated

**Functionality:**
- The `applyTo: '**'` means this instruction applies to all files in your workspace
- When GitHub Copilot processes this, it will replace `$SELECTION_PLACEHOLDER$` with your selected text
- The instruction clearly emphasizes using `pnpm` over other package managers

**What will happen:**
When Copilot reads this file, it will see:
1. Apply these rules to all files (`'**'`)
2. This project uses `pnpm`
3. Here are the common commands
4. **Important**: Always use `pnpm` commands, never `npm` or `yarn` (your selected text)

**Minor suggestion:**
You might want to move the "Important" note higher in the document for better visibility, but the current placement after the command examples works fine too.

The file is ready to use as-is! ✓
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
