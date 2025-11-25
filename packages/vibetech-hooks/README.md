# @vibetech/hooks

Shared React hooks for VibeTech monorepo projects.

## Installation

```bash
pnpm add @vibetech/hooks@workspace:*
```

## Hooks

### useTheme

Theme management hook with localStorage persistence and system preference detection.

**Features:**
- Light/Dark/System theme modes
- Automatic system preference detection
- localStorage persistence across sessions
- CSS class and data-attribute application
- TypeScript support

**Usage:**
```tsx
import { useTheme } from '@vibetech/hooks/useTheme';

function ThemeToggle() {
  const { theme, setTheme, toggleTheme, systemTheme } = useTheme();

  return (
    <div>
      <p>Current: {theme}</p>
      <p>System: {systemTheme}</p>

      <button onClick={toggleTheme}>
        Toggle Theme
      </button>

      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

**API:**

```typescript
interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}
```

**Behavior:**
- Adds CSS class `light` or `dark` to `<html>` element
- Sets `data-theme` attribute for CSS custom properties
- Stores preference in `localStorage` as `vibetech-theme`
- Cycles through: light → dark → system on toggle
- Automatically detects and responds to system theme changes

## Projects Using This Package

- business-booking-platform - Theme switching for luxury hotel UI
- nova-agent-current - Tauri desktop app theming
- (Add your project when you integrate)

## Development

```bash
# Build hooks
pnpm run build

# Clean build output
pnpm run clean
```

## Version History

- **1.0.0** (2025-10-26) - Initial release with useTheme hook
