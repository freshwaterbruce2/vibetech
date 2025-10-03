# AGENTS.md

This file provides AI coding agents with comprehensive instructions for working with this multi-project monorepo. This system follows the agents.md standard, with nested AGENTS.md files providing project-specific guidance.

## Monorepo Architecture

This is a sophisticated multi-project monorepo with two primary focus areas:

1. **React/TypeScript Web Application** (root level) - Vite-based with shadcn/ui components
2. **Python Trading System** (projects/crypto-enhanced) - Live cryptocurrency trading with Kraken API
3. **Memory & Learning Systems** (projects/active/web-apps/memory-bank) - Claude Code context management
4. **Desktop Applications** (projects/active/desktop-apps/) - Tauri-based native apps
5. **Additional Web Apps** (projects/active/web-apps/) - Specialized applications

## Core Development Principles

### 1. Production-First Mindset
- **NEVER leave projects in MVP state** - always implement complete, production-ready solutions
- Every feature must include comprehensive error handling, testing, and documentation
- All code must pass quality gates before being considered "complete"
- Focus on finishing products that users can actually rely on

### 2. Quality Gates (MANDATORY)
Before marking any task as complete, ensure:
- [ ] All tests pass (`npm run test` for web, `python run_tests.py` for Python)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes with no errors (`npm run lint`)
- [ ] Performance benchmarks met (see project-specific AGENTS.md)
- [ ] Security review completed
- [ ] Error handling comprehensive
- [ ] Documentation updated
- [ ] Production deployment checklist reviewed

### 3. Build & Test Commands

#### Root Level (Web Application)
```bash
npm run quality          # Full pipeline: lint + typecheck + test + build
npm run quality:fix      # Auto-fix lint issues + typecheck
npm run dev              # Development server (port 5173)
npm run build            # Production build
npm run test             # Playwright E2E tests
npm run test:ui          # Playwright UI mode for debugging
```

#### Python Projects
```bash
cd projects/crypto-enhanced
python run_tests.py      # Test suite
python -m pytest tests/ # Alternative test runner
.venv\Scripts\activate   # Activate virtual environment (Windows)
```

### 4. Code Style Guidelines

#### TypeScript/React
- Use shadcn/ui components exclusively for UI primitives
- Implement proper TypeScript types - no `any` types
- Follow React Hook patterns and proper state management
- Use React Query (TanStack Query) for server state
- Implement proper error boundaries

#### Python
- Follow PEP 8 style guidelines
- Use type hints consistently
- Implement comprehensive error handling with custom error classes
- Use async/await patterns for I/O operations
- Maintain clean separation of concerns

### 5. Testing Requirements

#### Web Application
- Playwright for E2E testing with visual regression testing
- Component testing with React Testing Library patterns
- Minimum 80% code coverage for critical paths
- Performance testing for Core Web Vitals compliance

#### Python Systems
- pytest with async support for all API operations
- Mock external services (WebSocket, REST APIs) in unit tests
- Integration testing for database operations
- Performance testing for latency-critical operations

### 6. Security Considerations

#### Credentials & Secrets
- NEVER commit API keys, tokens, or credentials to git
- Use .env files with .env.example templates
- Implement proper secret rotation mechanisms
- Regular security audits for dependencies

#### Trading System Specific
- Implement circuit breakers for trading operations
- Position size limits and exposure controls
- API rate limiting and nonce management
- Comprehensive audit logging

### 7. Performance Standards

#### Web Application
- Lighthouse Performance Score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Bundle size monitoring with alerts
- Tree shaking and code splitting implementation

#### Trading System
- WebSocket reconnection < 5 seconds
- Order execution latency < 500ms
- Database operations < 100ms
- Memory usage < 200MB per process

### 8. Development Workflow

#### Pre-Development Checklist
1. Read project-specific AGENTS.md file
2. Understand existing patterns and conventions
3. Review recent git commits for context
4. Check for existing similar implementations
5. Plan comprehensive solution (not just MVP)

#### Implementation Pattern
1. **Analysis Phase**: Understand requirements fully
2. **Design Phase**: Plan complete solution architecture
3. **Implementation Phase**: Build with error handling and testing
4. **Integration Phase**: Connect with existing systems
5. **Quality Phase**: Full testing and performance validation
6. **Documentation Phase**: Update all relevant docs
7. **Production Phase**: Deploy with monitoring

#### Post-Implementation Checklist
1. Run full quality pipeline
2. Update documentation
3. Add monitoring/alerting if needed
4. Create or update integration tests
5. Verify performance benchmarks
6. Update AGENTS.md if patterns changed

### 9. Integration Patterns

#### Cross-Project Communication
- Use well-defined APIs between projects
- Implement proper error handling for cross-project calls
- Document integration points clearly
- Version API contracts properly

#### Database Integration
- SQLite for local/development (crypto-enhanced)
- PostgreSQL for production systems
- Proper connection pooling and transaction management
- Database migration strategies

#### Real-time Communication
- WebSocket connections with automatic reconnection
- Event-driven architecture for system communication
- Proper error handling and fallback mechanisms

### 10. Monitoring & Observability

#### Logging Standards
- Structured logging with consistent formats
- Separate log levels (DEBUG, INFO, WARN, ERROR)
- Performance metrics logging
- Security event logging

#### Health Checks
- Application health endpoints
- Database connectivity checks
- External service dependency checks
- Performance metrics collection

### 11. Production Deployment

#### Pre-Deployment Checklist
- [ ] All quality gates passed
- [ ] Performance benchmarks validated
- [ ] Security review completed
- [ ] Backup strategies verified
- [ ] Rollback procedures documented
- [ ] Monitoring alerts configured
- [ ] Documentation updated

#### Deployment Strategy
- Blue-green deployments for web applications
- Rolling updates for backend services
- Database migration coordination
- Feature flags for gradual rollouts

### 12. Error Recovery & Troubleshooting

#### Common Issues & Solutions
- Network connectivity problems: Implement retry logic with exponential backoff
- Database connection issues: Connection pooling and health checks
- API rate limiting: Implement proper backoff and circuit breakers
- Memory leaks: Regular profiling and monitoring

#### MCP Server Troubleshooting
**Desktop Commander & Other MCP Servers**

Common issues when working with MCP servers in Claude Desktop/Code:

1. **Version Mismatch**
   - **Symptom**: Server reports different version than package.json
   - **Cause**: Version hardcoded in src/version.ts not synced
   - **Fix**: Run `npm run sync-version` then rebuild
   - **Verification**: Check logs for correct version

2. **Connection Failures**
   - **Symptom**: "Cannot connect to MCP server" errors
   - **Cause**: Windows npx path issues or config errors
   - **Fix**: Use full path `C:\\Program Files\\nodejs\\npx.cmd` in config
   - **Verification**: Check `claude_desktop_config.json` syntax

3. **Timeout Errors (Error -32001)**
   - **Symptom**: Operations fail after 60 seconds
   - **Cause**: Claude Desktop has hard 60s timeout limit
   - **Workaround**: Use streaming/progressive results or background processes
   - **Note**: Not configurable as of October 2025

4. **Changes Don't Apply After Restart**
   - **Symptom**: Rebuilt server shows old behavior
   - **Cause**: Incomplete Claude Desktop quit
   - **Fix**: Complete quit (system tray → Quit), wait 10s, relaunch
   - **Verification**: Check process list for lingering Claude processes

**Quick Diagnostic Steps:**
```bash
# 1. Check MCP server logs
Get-Content "$env:APPDATA\Claude\logs\mcp-server-[name].log" -Tail 50

# 2. Verify configuration
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json

# 3. Check if Claude is running
Get-Process | Where-Object {$_.Name -like "*Claude*"}

# 4. Validate version sync
cat dist/version.js && cat package.json | grep version
```

**Documentation**: See [MCP Server Troubleshooting Guide](docs/troubleshooting/MCP_SERVER_ISSUES.md)

#### Debug Information Collection
- Comprehensive logging at error points
- Stack trace capture and analysis
- Performance profiling data
- System resource utilization metrics

## Project-Specific Instructions

For detailed, project-specific instructions, AI agents should read the nearest AGENTS.md file in the directory tree:
- `projects/crypto-enhanced/AGENTS.md` - Trading system specifics
- `projects/active/web-apps/memory-bank/AGENTS.md` - Memory system patterns
- `projects/active/web-apps/*/AGENTS.md` - Individual web app conventions
- `projects/active/desktop-apps/*/AGENTS.md` - Desktop app patterns
- `.claude/commands/AGENTS.md` - Command development guidelines

## Success Metrics

### Definition of "Complete"
A task is only complete when:
1. Functionality works in production environment
2. All edge cases handled gracefully
3. Performance meets documented benchmarks
4. Security review passed
5. Documentation comprehensive and accurate
6. Monitoring and alerting configured
7. Users can rely on it without intervention

### Avoid MVP Trap
- Always plan for the complete solution from the start
- Implement proper error handling from day one
- Build with scalability and maintainability in mind
- Never ship "temporary" solutions to production
- Focus on user experience and reliability

Remember: The goal is to build systems that work reliably in production, not just prototypes that demonstrate functionality.