# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe-Tech Lovable is a modern React/TypeScript portfolio website with a full-stack architecture. Built with Lovable.dev, it features a React frontend with shadcn/ui components and a Node.js/Express backend API, both managing the same SQLite database structure as the original Vibe-Tech project.

## Architecture

### Frontend Structure
- **Framework**: React 18.3.1 with TypeScript and Vite
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v6
- **3D Graphics**: React Three Fiber with Drei helpers
- **Animations**: Framer Motion for advanced animations

### Backend Structure
- **Framework**: Express.js 4.21.2 (vs 5.1.0 in original)
- **Database**: SQLite3 with file persistence on D: drive (identical schema)
- **Port**: 3002 (vs 3001 in original Vibe-Tech)
- **Development**: Includes nodemon for hot reload

## Development Commands

### Frontend Development
```powershell
# Install dependencies
npm i

# Start development server with hot reload (port 8080)
npm run dev

# Build for production
npm run build

# Build for production optimized
npm run build:production

# Build for development environment
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview

# Bundle analysis
npm run analyze

# Testing
npm run test           # Run Playwright tests
npm run test:ui        # Run tests with UI
npm run test:debug     # Debug tests
npm run test:report    # View test report
```

### Backend Development
```powershell
cd backend

# Start server with nodemon hot reload (port 9001)
npm run dev

# Start server in production mode
npm run start

# Production mode with environment
npm run prod           # Windows
npm run prod:unix      # Unix/Linux

# Development in production mode
npm run dev:prod       # Windows  
npm run dev:prod:unix  # Unix/Linux

# Direct server start
node server.js

# Health check
npm run health
```

## Component Architecture

### UI Components (shadcn/ui)
Comprehensive component library including:
- **Form Controls**: Input, Select, Checkbox, Radio Group, Switch
- **Layout**: Card, Sheet, Dialog, Accordion, Tabs
- **Navigation**: Navigation Menu, Breadcrumb, Command
- **Data Display**: Table, Badge, Avatar, Progress
- **Feedback**: Toast, Alert Dialog, Hover Card
- **Advanced**: Chart (Recharts), Calendar, Carousel

### Custom Components
- **3D Elements**: Particle networks, hologram containers, mesh aurora backgrounds
- **Business Logic**: Dashboard components, lead management, project portfolios
- **Animation**: Animate-on-scroll, gradient icons, neon UI effects

### Page Structure
```
pages/
├── Index.tsx (Homepage)
├── About.tsx (Company information)
├── Blog.tsx (Blog listing)
├── Contact.tsx (Contact form)
├── Dashboard.tsx (Business dashboard)
├── Portfolio.tsx (Project showcase)
├── Services.tsx (Service offerings)
├── Tools.tsx (Tools and integrations)
├── Pricing.tsx (Pricing plans)
└── public/BlogPostPage.tsx (Individual blog posts)
```

## Key Differences from Original Vibe-Tech

### Frontend Architecture
**Original**: Backend-only API service
**Lovable**: Full React/TypeScript SPA with modern tooling

### Technology Stack
- **Build Tool**: Vite (modern) vs plain Node.js
- **UI Framework**: React with shadcn/ui vs no frontend
- **TypeScript**: Full TypeScript support vs JavaScript only
- **State Management**: React Query vs no client state
- **Styling**: Tailwind CSS design system vs no styling

### Development Experience
- **Hot Reload**: Vite HMR + nodemon vs manual server restart
- **Type Safety**: Full TypeScript coverage vs no types
- **Component System**: Reusable component library vs no components
- **Linting**: ESLint configuration vs no linting

### Backend Similarities
- **Database**: Identical SQLite schema and API endpoints
- **Location**: Same D: drive storage path (`D:\vibe-tech-data\vibetech.db`)
- **API Design**: Same RESTful endpoints structure  
- **Port Difference**: 9001 (Lovable backend) vs 3001 (original)
- **Frontend Port**: 8080 (Vite dev server) vs 8082 (Playwright test server)

## Lovable Integration

### Development Workflow
- **Lovable Editor**: Web-based development at lovable.dev
- **Auto-commit**: Changes in Lovable automatically commit to repository
- **Local Development**: Can clone and develop locally with full IDE support
- **GitHub Integration**: Supports direct GitHub editing and Codespaces

### Deployment
- **Lovable Hosting**: One-click deployment via Share -> Publish
- **Custom Domains**: Configurable through Project > Settings > Domains
- **Git Integration**: Automatic sync between Lovable and repository

## Database Configuration

### Shared Database
Both projects use the same database:
- **Location**: `D:\vibe-tech-data\vibetech.db`
- **Schema**: Identical customers, invoices, and leads tables
- **Access**: Can run both backends simultaneously on different ports
- **Test Database**: `backend/data/test-vibetech.db` for development

### Development Considerations
- Original Vibe-Tech runs on port 3001
- Lovable version backend runs on port 9001  
- Lovable frontend runs on port 8080 (dev) / 8082 (test)
- Both can access the same database without conflicts
- Consider which server is the primary data source

## Advanced Features

### 3D and Visual Effects
- React Three Fiber integration for 3D graphics
- Custom particle network animations
- Hologram and aurora background effects
- Advanced CSS animations and transitions

### Business Dashboard
- Lead management system
- Customer relationship management
- Invoice tracking
- Real-time notifications
- Data visualization with Recharts

### Modern React Patterns
- Custom hooks for data fetching and state management
- Context providers for global state
- Lazy loading and code splitting
- Responsive design with mobile-first approach

## Development Best Practices

### Code Organization
- Modular component structure with clear separation of concerns
- Custom hooks for reusable logic  
- Service layer for API communication
- Type definitions for data models
- Path aliases configured (@/ points to src/)

### Performance Optimization
- React Query for efficient server state management
- Lazy loading for route-based code splitting
- Optimized builds with Vite
- Tree shaking and bundle analysis available
- Component-level code splitting for non-critical routes

### TypeScript Configuration
- Relaxed strictness settings (noImplicitAny: false, strictNullChecks: false)
- Unused variable warnings disabled for development comfort
- Path aliases and module resolution configured

### Testing & Quality
- Playwright for E2E testing across multiple browsers (Chrome, Firefox, Safari)
- Mobile testing on simulated devices (Pixel 5, iPhone 12) 
- Visual regression testing with screenshots
- Accessibility testing with color contrast checks

### Accessibility
- Radix UI primitives for accessible components
- Proper ARIA labels and keyboard navigation
- Color contrast testing included
- Screen reader compatibility

## Production Deployment

### Build Process
```powershell
# Frontend production build
npm run build

# Backend can run as-is
cd backend && npm start
```

### Environment Considerations
- Configure environment variables for production
- Ensure D: drive exists or modify database path for Windows deployments
- Set appropriate CORS origins for production domains
- Consider using PM2 or similar for backend process management
- Docker support available in backend (see Dockerfile and docker-compose.yml)

## Quick Start

### Full Development Setup
```powershell
# Start both frontend and backend
# Terminal 1 - Frontend (port 8080)
npm run dev

# Terminal 2 - Backend (port 9001)  
cd backend && npm run dev
```

### Single Command Development
```powershell
# Use the batch file for Windows development
./start-dev.bat
```