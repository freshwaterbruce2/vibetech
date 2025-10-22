# Changelog

## [1.1.0] - 2025-10-19

### Added
- **Resources capability** - Direct access to key files
  - `workflow://claude-md` - Main configuration
  - `workflow://recent-tasks` - Memory bank tasks
  - `workflow://last-session` - Session context
  - `workflow://crypto/config` - Bot configuration
  - `workflow://crypto/logs/latest` - Trading logs (last 100 lines)
  - `workflow://project/readme` - Project README

- **Prompts capability** - Pre-written workflow templates
  - `morning-briefing` - Comprehensive morning status
  - `crypto-health` - Detailed bot health check
  - `debug-mode` - Systematic debugging workflow
  - `deploy-checklist` - Pre-deployment verification
  - `weekly-review` - Weekly progress summary

### Fixed
- Database query bug in `crypto-trading.ts` (column name: `executed_at` vs `timestamp`)
- Improved error handling for missing trade timestamps

### Changed
- Updated to MCP SDK with Resources and Prompts support
- Enhanced TypeScript types for all MCP features

---

## [1.0.0] - 2025-10-18

### Initial Release
- 10 tools for crypto, memory, database, project, and commands
- Multi-database support (trading, nova, unified)
- Slash command execution
- Security: Read-only database access, no destructive commands
