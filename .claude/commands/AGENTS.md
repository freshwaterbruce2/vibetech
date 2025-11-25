# AGENTS.md - Claude Commands System

This file extends the root AGENTS.md with specific instructions for developing Claude Code commands and hooks. This system must be **production-grade and seamlessly integrated** with the development workflow.

## Command System Architecture

### Command Development Standards
- **Language**: Markdown for command definitions, PowerShell/Bash for complex logic
- **Naming**: Kebab-case with clear, descriptive names (e.g., `crypto:trading-status`)
- **Categories**: Organized by domain (web, crypto, dev, git, etc.)
- **Execution**: Fast, reliable, with proper error handling and user feedback
- **Integration**: Deep integration with monorepo structure and project patterns

### Command Structure Requirements
```markdown
# Command Name

Brief description of what the command does and when to use it.

## Usage
```
/command-name [required-param] [optional-param]
```

## Parameters
- `required-param`: Description of required parameter
- `optional-param`: Description of optional parameter (default: value)

## Examples
```
/command-name value1 value2
```

## Implementation
[Detailed implementation logic or script reference]

## Error Handling
[How the command handles various error scenarios]
```

## Command Categories & Patterns

### Web Application Commands (`web/`)
```markdown
# /web:quality-check [fix]

Run complete quality pipeline for the web application.

## Implementation Pattern
1. **Analysis Phase**: Check current code quality metrics
2. **Testing Phase**: Run full test suite (unit + E2E)
3. **Build Phase**: Validate production build
4. **Report Phase**: Generate comprehensive quality report
5. **Fix Phase** (if `fix` parameter): Automatically resolve fixable issues

## Quality Gates
- [ ] ESLint passes with zero errors
- [ ] TypeScript compilation successful
- [ ] All tests pass (unit + E2E)
- [ ] Performance budget maintained
- [ ] Accessibility compliance verified
- [ ] Security audit clean

## Auto-Fix Capabilities
- Code formatting with Prettier
- ESLint auto-fixable issues
- Import organization
- Unused import removal
- Basic TypeScript type fixes
```

### Crypto Trading Commands (`crypto/`)
```markdown
# /crypto:trading-status

Real-time trading system health and status check.

## Implementation Pattern
```powershell
# Navigate to crypto project
cd projects/crypto-enhanced

# Check system health
python simple_status.py

# Verify API connectivity
python test_credentials.py

# Check database state
sqlite3 trading.db "SELECT COUNT(*) as open_positions FROM positions WHERE status='open';"

# Monitor recent activity
tail -20 trading_new.log
```

## Safety Protocols
- **NEVER start trading** without explicit confirmation
- **ALWAYS verify** API credentials before operations
- **CHECK balance** and position limits before any trades
- **MONITOR** system health continuously during operations

## Risk Management Integration
- Position size validation against configured limits
- Circuit breaker status verification
- Recent error analysis and pattern detection
- Market condition assessment
```

### Development Commands (`dev/`)
```markdown
# /dev:parallel-dev [web|crypto|both]

Start development servers in parallel for maximum productivity.

## Implementation Architecture
```powershell
# Web development server
if ($Group -eq "web" -or $Group -eq "both") {
    Start-Job -Name "WebDev" -ScriptBlock {
        Set-Location $using:WebPath
        npm run dev
    }
}

# Crypto system monitoring
if ($Group -eq "crypto" -or $Group -eq "both") {
    Start-Job -Name "CryptoMonitor" -ScriptBlock {
        Set-Location $using:CryptoPath
        python start_monitoring.py
    }
}

# Memory bank system
if ($Group -eq "memory" -or $Group -eq "both") {
    Start-Job -Name "MemoryBank" -ScriptBlock {
        Set-Location $using:MemoryPath
        python monitoring_service.py
    }
}
```

## Process Management
- Proper job cleanup on termination
- Health monitoring for all processes
- Automatic restart on failure
- Resource usage monitoring
```

### Git Integration Commands (`git/`)
```markdown
# /git:smart-commit <commit-message>

Intelligent commit with automatic quality checks and optimization.

## Pre-Commit Workflow
1. **Quality Check**: Run linting and type checking
2. **Test Validation**: Execute relevant test suites
3. **Security Scan**: Check for exposed secrets or vulnerabilities
4. **Performance Check**: Validate bundle size and performance metrics
5. **Documentation Update**: Auto-update relevant documentation

## Implementation Pattern
```powershell
# Quality gates
npm run quality

# Security scan
git secrets --scan

# Performance validation
npm run analyze

# Auto-update documentation if needed
if (Test-Path "CHANGELOG.md") {
    # Update changelog with commit details
}

# Create commit with enhanced message
git commit -m "$(Get-EnhancedCommitMessage -Message $CommitMessage)"
```

## Commit Enhancement
- Add relevant issue references
- Include performance impact summary
- Reference affected components
- Add testing status
```

## Hook Integration Patterns

### Session Start Hook
```powershell
# .claude/hooks/enhanced-session-start.ps1

# Initialize session memory context
python projects/active/web-apps/memory-bank/load_session_context.py

# Check system health across all projects
.\scripts\health-check-all.ps1

# Load relevant project context based on recent activity
$RecentProjects = Get-RecentProjects -Days 7
foreach ($Project in $RecentProjects) {
    Write-Host "Loading context for: $($Project.Name)"
    Set-ProjectContext -Path $Project.Path
}

# Initialize parallel development environment if configured
if (Get-Setting "auto-parallel-dev") {
    /dev:parallel-dev both
}
```

### User Prompt Submit Hook
```powershell
# .claude/hooks/enhanced-user-prompt-submit.ps1

param(
    [string]$UserPrompt,
    [string]$SessionId
)

# Analyze prompt for command suggestions
$SuggestedCommands = Analyze-PromptForCommands -Prompt $UserPrompt

if ($SuggestedCommands) {
    Write-Host "💡 Suggested commands: $($SuggestedCommands -join ', ')"
}

# Store prompt context for learning
Store-PromptContext -Prompt $UserPrompt -Session $SessionId

# Auto-trigger memory system updates
if ($UserPrompt -match "implement|create|build|develop") {
    python projects/active/web-apps/memory-bank/context_enrichment.py
}

# Check if prompt relates to specific projects and load context
$ProjectMentions = Extract-ProjectReferences -Prompt $UserPrompt
foreach ($Project in $ProjectMentions) {
    Load-ProjectSpecificContext -Project $Project
}
```

## Command Testing Framework

### Test Structure
```powershell
# tests/command-tests.ps1

Describe "Web Quality Check Command" {
    BeforeEach {
        # Setup test environment
        Set-Location (Join-Path $TestRoot "web-test-project")
    }

    It "Should run quality checks successfully" {
        $Result = Invoke-Command "/web:quality-check"
        $Result.ExitCode | Should -Be 0
        $Result.Output | Should -Match "Quality check passed"
    }

    It "Should auto-fix issues when requested" {
        # Introduce fixable issues
        Add-LintError -Type "fixable"

        $Result = Invoke-Command "/web:quality-check fix"
        $Result.ExitCode | Should -Be 0
        $Result.Output | Should -Match "Issues auto-fixed"

        # Verify fixes were applied
        $LintResult = npm run lint
        $LintResult | Should -Match "No errors found"
    }
}

Describe "Crypto Trading Status Command" {
    It "Should check trading system safely" {
        $Result = Invoke-Command "/crypto:trading-status"
        $Result.ExitCode | Should -Be 0
        $Result.Output | Should -Match "System Status"

        # Should never initiate trades
        $Result.Output | Should -Not -Match "Trade executed"
    }
}
```

### Integration Testing
```powershell
# tests/integration-tests.ps1

Describe "Command Integration" {
    It "Should integrate with memory system" {
        # Execute command and verify memory storage
        $Result = Invoke-Command "/web:component-create TestComponent"

        # Check if action was stored in memory
        $MemoryRecord = Get-MemoryRecord -Type "component_creation" -Latest
        $MemoryRecord.ComponentName | Should -Be "TestComponent"
    }

    It "Should update project context correctly" {
        $BeforeContext = Get-ProjectContext
        Invoke-Command "/dev:cleanup quick"
        $AfterContext = Get-ProjectContext

        $AfterContext.LastCleanup | Should -BeGreaterThan $BeforeContext.LastCleanup
    }
}
```

## Performance Requirements

### Command Execution Standards
- **Simple Commands**: <500ms execution time
- **Complex Operations**: <5s with progress feedback
- **Background Tasks**: Proper job management with status updates
- **Resource Usage**: Minimal impact on system performance
- **Error Recovery**: Graceful handling with clear error messages

### Optimization Patterns
```powershell
# Fast command execution pattern
function Invoke-FastCommand {
    param([string]$Command)

    # Cache frequently used data
    $CachedData = Get-CachedProjectData -MaxAge 300 # 5 minutes

    # Parallel execution where possible
    $Jobs = @()
    $Jobs += Start-Job -ScriptBlock { Get-SystemStatus }
    $Jobs += Start-Job -ScriptBlock { Get-ProjectHealth }

    # Wait for completion with timeout
    $Results = Wait-Job -Job $Jobs -Timeout 30 | Receive-Job

    # Cleanup
    Remove-Job -Job $Jobs

    return $Results
}
```

## Error Handling & Recovery

### Comprehensive Error Management
```powershell
function Invoke-CommandSafely {
    param(
        [string]$CommandName,
        [hashtable]$Parameters
    )

    try {
        # Pre-execution validation
        Test-CommandPrerequisites -Command $CommandName -Parameters $Parameters

        # Execute with monitoring
        $Result = & $CommandName @Parameters

        # Post-execution validation
        Test-CommandResult -Result $Result

        return $Result
    }
    catch [System.UnauthorizedAccessException] {
        Write-Error "Permission denied. Run as administrator or check file permissions."
        return $null
    }
    catch [System.IO.FileNotFoundException] {
        Write-Error "Required files missing. Run setup or check project structure."
        return $null
    }
    catch {
        Write-Error "Command failed: $($_.Exception.Message)"

        # Log error for analysis
        Add-ErrorLog -Command $CommandName -Error $_.Exception

        # Suggest recovery actions
        $RecoveryActions = Get-RecoveryActions -Command $CommandName -Error $_.Exception
        if ($RecoveryActions) {
            Write-Host "💡 Try these recovery actions: $($RecoveryActions -join ', ')"
        }

        return $null
    }
}
```

### Rollback Mechanisms
```powershell
function Invoke-CommandWithRollback {
    param(
        [string]$Command,
        [scriptblock]$RollbackAction
    )

    # Create system snapshot before execution
    $Snapshot = New-SystemSnapshot

    try {
        $Result = Invoke-Expression $Command

        if ($Result.Success) {
            Remove-SystemSnapshot $Snapshot
            return $Result
        } else {
            throw "Command execution failed"
        }
    }
    catch {
        Write-Warning "Command failed, initiating rollback..."

        # Execute rollback
        & $RollbackAction

        # Restore from snapshot if needed
        Restore-SystemSnapshot $Snapshot

        throw
    }
}
```

## Production Deployment Standards

### Command Validation Checklist
- [ ] All command parameters validated and sanitized
- [ ] Error handling comprehensive and user-friendly
- [ ] Performance meets execution time requirements
- [ ] Integration with memory system functional
- [ ] Hook integration working correctly
- [ ] Test coverage >90% for all command logic
- [ ] Documentation complete and accurate
- [ ] Security review passed (no command injection vulnerabilities)
- [ ] Cross-platform compatibility verified

### Monitoring & Analytics
```powershell
# Command usage analytics
function Track-CommandUsage {
    param(
        [string]$CommandName,
        [hashtable]$Parameters,
        [timespan]$ExecutionTime,
        [bool]$Success
    )

    $Usage = @{
        Timestamp = Get-Date
        Command = $CommandName
        Parameters = $Parameters | ConvertTo-Json -Compress
        ExecutionTime = $ExecutionTime.TotalMilliseconds
        Success = $Success
        User = $env:USERNAME
        Project = Get-CurrentProject
    }

    # Store in memory system for analysis
    Store-CommandUsage $Usage

    # Update command performance metrics
    Update-CommandMetrics -CommandName $CommandName -ExecutionTime $ExecutionTime
}
```

## Command Development Workflow

### New Command Creation
1. **Design Phase**: Define command purpose, parameters, expected outcomes
2. **Implementation**: Write command logic following established patterns
3. **Testing**: Comprehensive testing including edge cases and error scenarios
4. **Documentation**: Complete command documentation with examples
5. **Integration**: Hook integration and memory system updates
6. **Review**: Security and performance review
7. **Deployment**: Add to command registry and update help system

### Command Maintenance
- Regular performance monitoring and optimization
- Error pattern analysis and prevention
- User feedback integration and improvements
- Compatibility updates for new project requirements
- Security updates and vulnerability patching

Remember: Commands are the primary interface between developers and the monorepo system. They must be **lightning-fast, bulletproof, and intuitive** to use. Every command should feel like a natural extension of the development workflow.