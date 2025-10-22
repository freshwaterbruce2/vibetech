# @vibetech/ui

Shared UI component library for the Vibe Tech monorepo.

## Installation

This package is available as a workspace dependency. Add to your project's `package.json`:

```json
{
  "dependencies": {
    "@vibetech/ui": "workspace:*"
  }
}
```

## Usage

```typescript
// Import components
import { Button, Card, Badge, Input } from '@vibetech/ui'

// Import utilities
import { cn } from '@vibetech/ui'

// Use in your React component
export function MyComponent() {
  return (
    <Card>
      <Button variant="default">Click me</Button>
      <Badge>New</Badge>
      <Input placeholder="Enter text..." />
    </Card>
  )
}
```

## Available Components

### Core Components (v0.0.0)
- ✅ **Button** - Multiple variants (default, destructive, outline, secondary, ghost, link)
- ✅ **Card** - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- ✅ **Badge** - Badge with variants (default, secondary, destructive, outline)
- ✅ **Input** - Styled input component

### Utilities
- ✅ **cn()** - Tailwind className utility with clsx and tailwind-merge

## Development

```bash
# Type check
cd packages/ui
bun run typecheck

# Lint
bun run lint
```

## Adding New Components

1. Create component file in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Run `bun install` from monorepo root
4. Import in your app

## Architecture

This package uses:
- **TypeScript** for type safety
- **Radix UI** primitives for accessibility
- **class-variance-authority** for variant management
- **Tailwind CSS** for styling
- **React 18.3.1** as peer dependency

## Future Roadmap

Phase 2 will extract remaining 35+ components from shipping-pwa:
- Dialog, Dropdown, Popover, Tooltip
- Select, Checkbox, Radio, Switch
- Accordion, Tabs, Command
- Calendar, Date Picker, Chart
- And more...
