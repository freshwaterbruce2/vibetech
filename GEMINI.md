# Project Context
This is a complex monorepo for the **VibeTech / Nova** ecosystem, managed with **pnpm** and **Turbo**.

## Directory Structure

### Applications (`apps/`)
All end-user applications and tools are located in the `apps` directory:

- **Desktop Apps**:
  - `vibe-code-studio`: Next-generation AI-powered code editor (formerly `deepcode-editor`).
  - `nova-agent`: The flagship Nova Agent application (formerly `nova-agent-current`).
  - `taskmaster`: Task management application.
  - `desktop-commander-v3`: MCP Server for desktop automation and command execution.
  - `chatbox-cli`: CLI tool for chat interactions.
- **Web Apps**:
  - `business-booking-platform`: Hotel/Business booking system.
  - `shipping-pwa`: Shipping logistics PWA.
  - `vibe-tech-lovable`: VibeTech Lovable website/app.
  - `digital-content-builder`: Content creation tool.
  - `iconforge`: Icon generation tool.
  - `memory-bank`: Memory management interface.
- **Mobile Apps**:
  - `kids-app-lock`: Mobile application for parental controls.
  - `nova-mobile-app`: Mobile companion for Nova Agent.
  - `vibe-subscription-guard`: Subscription management app.
- **Tools & Others**:
  - `workflow-hub-mcp`: Model Context Protocol hub.
  - `vibe-tutor`: Educational platform.
  - `crypto-enhanced`: Crypto trading tools.
  - `kraken-momentum-bot`: Trading bot.

### Backend Services (`backend/`)
- `ipc-bridge`: Inter-Process Communication bridge. Routes commands between apps (Nova, Vibe) and services (Workflow Engine, MCPs).
- `workflow-engine`: Core workflow execution engine. **Integrates with `desktop-commander-v3` for enhanced desktop automation.**
- `dap-proxy`: Debug Adapter Protocol proxy.
- `lsp-proxy`: Language Server Protocol proxy.
- `search-service`: Search functionality.

### Shared Packages (`packages/`)
- **Core**: `nova-core`, `nova-types`, `nova-database`.
- **VibeTech**: `vibetech-shared`, `vibetech-hooks`, `vibetech-types`.
- **Utils**: `shared-config`, `shared-ipc`, `shared-utils`, `logger`.
- **UI**: `ui`.

## Technical Stack & Standards
- **Package Manager**: `pnpm` (Workspace enabled).
- **Build System**: `turbo` (configured in `turbo.json` and `package.json`).
- **Language**: TypeScript (v5+).
- **Linting/Formatting**: ESLint, Prettier.
- **Architecture**: STRICTLY MODULAR. See **[STANDARDS.md](./STANDARDS.md)** for rules on:
  - Plug-and-Play Services (MCPs).
  - Feature Module isolation in Frontends.
  - Shared IPC protocols.

## Development Commands
- **Build**: `pnpm build` (runs `turbo run build`)
- **Test**: `pnpm test` (runs `turbo run test`)
- **Dev (Vibe)**: `pnpm dev:vibe` (starts Vibe Code Studio)
- **Dev (Nova)**: `pnpm dev:nova` (starts Nova Agent)
