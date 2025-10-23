# VibePilot - Advanced Task Management Desktop Application

[![CI/CD Pipeline](https://github.com/username/vibepilot/actions/workflows/ci.yml/badge.svg)](https://github.com/username/vibepilot/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

VibePilot is a modern, cross-platform desktop task management application built with React, TypeScript, and Tauri. It features AI-powered task optimization, time tracking with Pomodoro techniques, and a beautiful, intuitive user interface.

## Features

### 🎯 Core Task Management
- **Smart Task Organization**: Create, edit, and organize tasks with projects, priorities, and due dates
- **Advanced Filtering**: Filter by status (active, completed, starred) and search across all task fields
- **Flexible Sorting**: Sort by creation date, update date, title, due date, or priority
- **Progress Tracking**: Visual progress indicators and completion tracking

### ⏱️ Time Management
- **Pomodoro Timer**: Built-in timer with customizable durations (default 25 minutes)
- **Session Tracking**: Track work sessions with notes and quality ratings
- **Time Analytics**: Comprehensive time tracking and productivity insights

### 🤖 AI Integration
- **Smart Suggestions**: AI-powered task prioritization and scheduling recommendations
- **Local Processing**: Privacy-first AI with local heuristic algorithms
- **External Provider Support**: Integration with DeepSeek and other AI providers

### 🎨 Modern UI/UX
- **Beautiful Interface**: Clean, modern design built with shadcn/ui components
- **Responsive Layout**: Optimized for all screen sizes and resolutions
- **Dark/Light Mode**: Full theme support with system preference detection
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation support

### 🔧 Technical Excellence
- **Cross-Platform**: Native desktop apps for Windows, macOS, and Linux
- **High Performance**: Built with Tauri for minimal resource usage (600KB bundle)
- **Type Safety**: Full TypeScript support with strict type checking
- **State Management**: Robust state management with Zustand
- **Testing**: Comprehensive test suite with Vitest and React Testing Library

## Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Rust** (latest stable)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/vibepilot.git
   cd vibepilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri:dev
   ```

### Development Commands

#### Frontend Development
```bash
# Start web development server
npm run dev              # Vite dev server on http://localhost:5173

# Testing
npm run test             # Interactive test runner
npm run test:run         # Single test run
npm run test:ui          # Test UI dashboard
npm run test:coverage    # Test coverage report

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint issues
npm run typecheck        # TypeScript compilation check
npm run quality          # Full quality pipeline (lint + typecheck + test + build)
npm run quality:fix      # Auto-fix + quality checks

# Build
npm run build            # Production build
npm run preview          # Preview production build
```

#### Desktop Development
```bash
# Tauri development
npm run tauri:dev        # Start Tauri development mode
npm run tauri:build      # Build production desktop app

# Tauri utilities
npm run tauri            # Access Tauri CLI directly
```

## Architecture Overview

### Frontend Stack
- **React 19**: Latest React with concurrent features
- **TypeScript**: Strict type checking and modern JavaScript features
- **Vite**: Lightning-fast build tool and development server
- **shadcn/ui**: Beautiful, accessible component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Zustand**: Lightweight state management with DevTools support

### Desktop Integration
- **Tauri**: Rust-based desktop framework for native performance
- **Cross-Platform**: Single codebase for Windows, macOS, and Linux
- **Native APIs**: Access to file system, notifications, and OS integration
- **Security**: Sandboxed environment with controlled API access

### State Management
```typescript
// Task Store - Comprehensive task management
const taskStore = useTaskStore()
taskStore.loadTasks()
taskStore.filteredTasks  // Computed filtered and sorted tasks
taskStore.addTask(newTask)

// Session Store - Time tracking and Pomodoro
const sessionStore = useSessionStore()
sessionStore.startNewSession(taskId, notes, duration)
sessionStore.timer.isRunning
sessionStore.progressPercentage
```

### API Layer
```typescript
// Type-safe API functions
import { createTask, getTasks, updateTask } from '@/lib/api/tasks'
import { startSession, endSession } from '@/lib/api/sessions'

// All API calls are strongly typed with Zod validation
const newTask = await createTask({
  title: 'New Task',
  description: 'Task description',
  priority: 'high'
})
```

## Testing Strategy

### Unit Tests
- **API Functions**: Comprehensive testing of all API operations
- **Zustand Stores**: State management logic and computed properties
- **Utility Functions**: Helper functions and utilities
- **Components**: UI components with React Testing Library

### Integration Tests
- **User Workflows**: End-to-end user interactions
- **Store Integration**: Cross-store communication and side effects
- **API Integration**: Backend integration testing

### Quality Assurance
```bash
# Run full quality pipeline
npm run quality

# Individual quality checks
npm run lint              # ESLint for code quality
npm run typecheck         # TypeScript type checking
npm run test:run          # Unit and integration tests
npm run build             # Production build verification
```

## Configuration

### Environment Setup
Create a `.env.local` file for local development:
```env
# AI Provider Configuration
VITE_AI_PROVIDER=local
VITE_DEEPSEEK_API_KEY=your_api_key_here

# Database Configuration
VITE_DB_PATH=./data/vibepilot.db

# Development Settings
VITE_DEBUG_MODE=true
```

### Tauri Configuration
The desktop app configuration is in `src-tauri/tauri.conf.json`:
- Window settings and behavior
- Security permissions and API access
- Build targets and bundle configuration
- Auto-updater and distribution settings

## Contributing

### Development Workflow
1. **Fork the repository** and create a feature branch
2. **Install dependencies** and set up development environment
3. **Write tests** for new functionality
4. **Implement features** with type safety and error handling
5. **Run quality checks** with `npm run quality`
6. **Submit pull request** with comprehensive description

### Code Standards
- **TypeScript**: Strict mode with no implicit any
- **ESLint**: Enforced code style and best practices
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages
- **Test Coverage**: Minimum 80% coverage for new code

### Pull Request Process
- All tests must pass in CI/CD pipeline
- Code review required from maintainers
- TypeScript compilation must succeed
- ESLint and Prettier checks must pass
- Security scan must complete without high-severity issues

## Performance

### Optimization Features
- **Bundle Splitting**: Automatic code splitting for optimal loading
- **Tree Shaking**: Eliminate unused code from production builds
- **Asset Optimization**: Compressed images and optimized resources
- **Memory Management**: Efficient state updates and cleanup
- **Native Performance**: Tauri's Rust backend for system operations

### Lighthouse Scores
- **Performance**: 90+ score target
- **Accessibility**: 95+ score requirement
- **Best Practices**: 90+ score target
- **SEO**: 90+ score target

## Security

### Security Measures
- **Tauri Security**: Sandboxed environment with controlled API access
- **Input Validation**: Zod schemas for all user inputs and API responses
- **SQL Injection Protection**: Prepared statements and parameterized queries
- **Dependency Scanning**: Regular security audits with Snyk and npm audit
- **Content Security Policy**: Strict CSP headers in production builds

### Data Privacy
- **Local Storage**: All data stored locally on user's device
- **No Tracking**: Zero analytics or tracking without explicit consent
- **Encryption**: Sensitive data encrypted at rest
- **Backup Safety**: Local backup files with user control

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

### Documentation
- **API Reference**: Comprehensive API documentation
- **Component Library**: Storybook component documentation
- **Architecture Guide**: Detailed technical architecture
- **Deployment Guide**: Production deployment instructions

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community support and questions
- **Discord**: Real-time chat and development updates
- **Contributing Guide**: How to contribute to the project

### Professional Support
- **Enterprise Support**: Priority support for business users
- **Custom Development**: Tailored features and integrations
- **Training**: Team training and onboarding services
- **Consulting**: Architecture and implementation consulting

---

**Built with ❤️ by the VibePilot Team**

*VibePilot - Where productivity meets innovation*