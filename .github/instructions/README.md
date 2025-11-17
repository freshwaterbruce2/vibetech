# GitHub Copilot Instructions

This directory contains GitHub Copilot instruction files that provide context and coding guidelines for the Vibe Tech monorepo.

## Structure

### Main Instruction File
- **`.github/copilot-instructions.md`** - Main instructions that apply to all files in the repository
  - Architecture overview
  - Critical workflows and commands
  - Project-specific conventions
  - Build configuration
  - Common pitfalls
  - Deployment checklists

### Domain-Specific Instructions
Located in `.github/instructions/`:

- **`PNPM.instructions.md`** - Package manager guidelines
  - Applies to: All files (`**`)
  - Emphasizes using `pnpm` instead of `npm` or `yarn`

- **`TypeScript.instructions.md`** - TypeScript and React conventions
  - Applies to: `**/*.{ts,tsx}`
  - Import aliases, component patterns, state management, styling

- **`Python.instructions.md`** - Python crypto trading system guidelines
  - Applies to: `projects/crypto-enhanced/**/*.py`
  - Async best practices, risk management, security warnings

- **`Testing.instructions.md`** - Testing conventions and best practices
  - Applies to: `**/*.{test,spec}.{ts,tsx,js,py}`
  - E2E tests (Playwright), unit tests (Vitest), Python tests (pytest)

## YAML Frontmatter

Each instruction file uses YAML frontmatter to specify its scope:

```yaml
---
applyTo: 'pattern/**/*.ext'
optionalKey: value
---
```

### Common Patterns

- `**` - All files
- `**/*.{ts,tsx}` - TypeScript and TSX files
- `path/to/dir/**/*.py` - Python files in specific directory
- `**/*.{test,spec}.*` - Test files

## How GitHub Copilot Uses These Instructions

1. **Context-Aware**: Copilot reads relevant instruction files based on the file you're editing
2. **Pattern Matching**: Files are matched using the `applyTo` glob patterns
3. **Hierarchical**: Main instructions apply globally, domain-specific instructions add context
4. **Best Practices**: Instructions guide code generation, completion, and chat responses

## Validation

To validate the instruction files, run:

```bash
python3 /tmp/validate_copilot_instructions.py
```

All instruction files should have:
- Valid YAML frontmatter wrapped in `---`
- Required `applyTo` field with a valid glob pattern
- Clear, actionable guidelines in Markdown format

## Adding New Instructions

1. Create a new `.md` file in `.github/instructions/`
2. Add YAML frontmatter with appropriate `applyTo` pattern
3. Write clear, specific guidelines for the domain
4. Validate using the validation script
5. Commit and push changes

### Template

```markdown
---
applyTo: 'your/pattern/**/*.ext'
---

## Domain Name Guidelines

### Section 1
Clear, actionable guidelines...

### Section 2
More specific instructions...
```

## Best Practices for Writing Instructions

1. **Be Specific**: Provide concrete examples and code snippets
2. **Use Consistent Formatting**: Follow existing file structure
3. **Avoid Ambiguity**: Use "✅ Correct" and "❌ Incorrect" examples
4. **Prioritize Critical Information**: Put important warnings at the top
5. **Keep It Concise**: Focus on essential guidelines and patterns
6. **Use Proper Scope**: Target instructions to relevant files only

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Best Practices for Copilot Coding Agent](https://gh.io/copilot-coding-agent-tips)
- [Repository README](../../README.md)
