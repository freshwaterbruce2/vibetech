#!/usr/bin/env powershell
# Enhanced Session Start Hook - Production Grade Context Loading
# Integrates with Enhanced Memory Manager for comprehensive context retrieval

param(
    [string]$SessionId = "",
    [switch]$VerboseLogging = $false,
    [switch]$ForceRefresh = $false
)

# Enhanced logging configuration
$LogPath = "C:\dev\projects\active\web-apps\memory-bank\logs"
if (-not (Test-Path $LogPath)) { New-Item -ItemType Directory -Path $LogPath -Force | Out-Null }

$LogFile = Join-Path $LogPath "session-start-$(Get-Date -Format 'yyyy-MM-dd').log"

function Write-EnhancedLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $LogEntry = "[$Timestamp] [$Level] $Message"

    # Write to console with color coding
    switch ($Level) {
        "ERROR" { Write-Host $LogEntry -ForegroundColor Red }
        "WARN"  { Write-Host $LogEntry -ForegroundColor Yellow }
        "INFO"  { Write-Host $LogEntry -ForegroundColor Green }
        "DEBUG" { if ($VerboseLogging) { Write-Host $LogEntry -ForegroundColor Gray } }
        default { Write-Host $LogEntry }
    }

    # Write to log file
    Add-Content -Path $LogFile -Value $LogEntry
}

function Get-SessionContext {
    param([string]$SessionId)

    try {
        $OriginalLocation = Get-Location
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"

        Write-EnhancedLog "Initializing enhanced memory retrieval for session: $SessionId" "INFO"

        # Use enhanced memory manager to retrieve context
        $PythonPath = Get-Command python -ErrorAction SilentlyContinue
        if (-not $PythonPath) {
            Write-EnhancedLog "Python not found in PATH, falling back to basic memory retrieval" "WARN"
            return Get-BasicSessionContext
        }

        # Call enhanced memory manager
        $MemoryScript = @"
import asyncio
import sys
import json
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType

async def retrieve_session_context(session_id):
    manager = EnhancedMemoryManager()

    # Retrieve last session context
    last_session = await manager.retrieve_memory(
        'last-session',
        MemoryType.SHORT_TERM,
        expand_context=True
    )

    # Retrieve project-specific context
    project_context = await manager.retrieve_memory(
        f'project-context-{session_id}',
        MemoryType.LONG_TERM,
        expand_context=True
    )

    # Get performance metrics
    performance = manager.get_performance_report()

    return {
        'last_session': last_session,
        'project_context': project_context,
        'performance': performance,
        'session_id': session_id
    }

if __name__ == '__main__':
    session_id = sys.argv[1] if len(sys.argv) > 1 else 'default'
    result = asyncio.run(retrieve_session_context(session_id))
    print(json.dumps(result, indent=2))
"@

        # Write temporary script
        $TempScript = Join-Path $env:TEMP "retrieve_context.py"
        $MemoryScript | Out-File -FilePath $TempScript -Encoding UTF8

        # Execute enhanced memory retrieval
        $Result = python $TempScript $SessionId 2>&1
        Remove-Item $TempScript -Force -ErrorAction SilentlyContinue

        if ($LASTEXITCODE -eq 0) {
            $Context = $Result | ConvertFrom-Json
            Write-EnhancedLog "Enhanced memory retrieval successful" "INFO"
            return $Context
        } else {
            Write-EnhancedLog "Enhanced memory retrieval failed: $Result" "ERROR"
            return Get-BasicSessionContext
        }

    } catch {
        Write-EnhancedLog "Error in enhanced context retrieval: $($_.Exception.Message)" "ERROR"
        return Get-BasicSessionContext
    } finally {
        Set-Location $OriginalLocation
    }
}

function Get-BasicSessionContext {
    Write-EnhancedLog "Using basic session context retrieval" "INFO"

    try {
        # Basic memory retrieval using CLI
        $OriginalLocation = Get-Location
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"

        $BasicResult = node memory_cli.js retrieve "last-session" "session_state" 2>&1

        if ($BasicResult -like "*Data retrieved successfully*") {
            Write-EnhancedLog "Basic memory retrieval successful" "INFO"
            return @{
                'basic_session' = $BasicResult
                'enhanced_available' = $false
            }
        } else {
            Write-EnhancedLog "No previous session found in basic memory" "WARN"
            return @{
                'basic_session' = $null
                'enhanced_available' = $false
            }
        }
    } catch {
        Write-EnhancedLog "Basic memory retrieval failed: $($_.Exception.Message)" "ERROR"
        return @{
            'error' = $_.Exception.Message
            'enhanced_available' = $false
        }
    } finally {
        Set-Location $OriginalLocation
    }
}

function Display-ContextSummary {
    param($Context)

    Write-Host "" -ForegroundColor White
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                           ENHANCED SESSION CONTEXT LOADED                           ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    if ($Context.enhanced_available -eq $false) {
        Write-Host "⚠️  Enhanced memory system not available - using basic fallback" -ForegroundColor Yellow
        if ($Context.basic_session) {
            Write-Host "📋 Basic session data loaded" -ForegroundColor Green
        } else {
            Write-Host "🆕 No previous session found (new workspace)" -ForegroundColor Blue
        }
        Write-Host ""
        return
    }

    # Display enhanced context information
    if ($Context.last_session -and $Context.last_session.data) {
        $LastSession = $Context.last_session.data
        Write-Host "📅 Last Session: $(Get-Date $LastSession.timestamp -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Green

        if ($LastSession.task) {
            Write-Host "🎯 Last Task: $($LastSession.task)" -ForegroundColor Cyan
        }

        if ($LastSession.branch) {
            Write-Host "🌿 Branch: $($LastSession.branch)" -ForegroundColor Yellow
        }

        if ($LastSession.status) {
            Write-Host "📊 Status: $($LastSession.status)" -ForegroundColor Magenta
        }

        if ($LastSession.important_context) {
            Write-Host "💡 Context: $($LastSession.important_context)" -ForegroundColor White
        }
    }

    # Display performance metrics
    if ($Context.performance) {
        $Perf = $Context.performance
        Write-Host ""
        Write-Host "🚀 Memory Performance:" -ForegroundColor Blue
        Write-Host "   Cache Hit Rate: $($Perf.kv_cache_hit_rate) (Target: $($Perf.target_hit_rate))" -ForegroundColor Gray
        Write-Host "   Avg Retrieval: $([math]::Round($Perf.avg_retrieval_ms, 2))ms" -ForegroundColor Gray

        if ($Perf.memory_stats) {
            $Stats = $Perf.memory_stats
            Write-Host "   Total Memories: $($Stats.total_memories)" -ForegroundColor Gray
            Write-Host "   Storage Size: $([math]::Round($Stats.total_size_mb, 2))MB" -ForegroundColor Gray
        }
    }

    # Project context
    if ($Context.project_context -and $Context.project_context.data) {
        Write-Host ""
        Write-Host "📁 Project Context Available" -ForegroundColor Green
    }

    Write-Host ""
}

function Get-GitContextInfo {
    try {
        $Branch = git branch --show-current 2>$null
        $ModifiedFiles = git status --porcelain 2>$null
        $RecentCommits = git log --oneline -5 2>$null

        $GitInfo = @{
            'branch' = $Branch
            'modified_files_count' = if ($ModifiedFiles) { ($ModifiedFiles | Measure-Object).Count } else { 0 }
            'recent_commits' = $RecentCommits
        }

        if ($Branch) {
            Write-EnhancedLog "Git context - Branch: $Branch, Modified files: $($GitInfo.modified_files_count)" "INFO"
        }

        return $GitInfo
    } catch {
        Write-EnhancedLog "Unable to retrieve git context: $($_.Exception.Message)" "WARN"
        return @{}
    }
}

function Save-SessionStart {
    param($SessionId, $Context, $GitInfo)

    try {
        $SessionStart = @{
            'session_id' = $SessionId
            'start_time' = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            'context_loaded' = $Context -ne $null
            'enhanced_memory' = $Context.enhanced_available -ne $false
            'git_info' = $GitInfo
            'performance_baseline' = if ($Context.performance) { $Context.performance } else { $null }
        }

        # Save to enhanced memory system
        $OriginalLocation = Get-Location
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"

        $SaveScript = @"
import asyncio
import json
import sys
from enhanced_memory_manager import EnhancedMemoryManager, MemoryType

async def save_session_start(session_data):
    manager = EnhancedMemoryManager()

    result = await manager.store_memory(
        'session-start-' + session_data['session_id'],
        session_data,
        MemoryType.SHORT_TERM,
        {
            'session_id': session_data['session_id'],
            'type': 'session_start',
            'timestamp': session_data['start_time']
        }
    )

    return result

if __name__ == '__main__':
    session_data = json.loads(sys.argv[1])
    result = asyncio.run(save_session_start(session_data))
    print(json.dumps(result))
"@

        $TempScript = Join-Path $env:TEMP "save_session_start.py"
        $SaveScript | Out-File -FilePath $TempScript -Encoding UTF8

        $SessionJson = $SessionStart | ConvertTo-Json -Compress
        $SaveResult = python $TempScript $SessionJson 2>&1
        Remove-Item $TempScript -Force -ErrorAction SilentlyContinue

        if ($LASTEXITCODE -eq 0) {
            Write-EnhancedLog "Session start saved to enhanced memory" "INFO"
        } else {
            Write-EnhancedLog "Failed to save session start: $SaveResult" "WARN"
        }

        Set-Location $OriginalLocation

    } catch {
        Write-EnhancedLog "Error saving session start: $($_.Exception.Message)" "WARN"
    }
}

# Main execution
try {
    Write-EnhancedLog "Enhanced session start hook initiated" "INFO"

    # Generate session ID if not provided
    if (-not $SessionId) {
        $SessionId = "session-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$([System.Guid]::NewGuid().ToString().Substring(0,8))"
    }

    Write-EnhancedLog "Session ID: $SessionId" "INFO"

    # Retrieve session context
    $Context = Get-SessionContext -SessionId $SessionId

    # Get git information
    $GitInfo = Get-GitContextInfo

    # Display context summary
    Display-ContextSummary -Context $Context

    # Save session start information
    Save-SessionStart -SessionId $SessionId -Context $Context -GitInfo $GitInfo

    # Set environment variable for use by other hooks
    $env:CLAUDE_SESSION_ID = $SessionId
    [Environment]::SetEnvironmentVariable("CLAUDE_SESSION_ID", $SessionId, "Process")

    Write-EnhancedLog "Enhanced session start completed successfully" "INFO"
    Write-Host "🎉 Session initialized with enhanced memory system" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-EnhancedLog "Critical error in enhanced session start: $($_.Exception.Message)" "ERROR"
    Write-Host "❌ Enhanced session start failed - continuing with basic mode" -ForegroundColor Red
    Write-Host ""
}

# Optional: Run system health check
if ($VerboseLogging) {
    try {
        Set-Location "C:\dev\projects\active\web-apps\memory-bank"
        $HealthCheck = python -c "
from enhanced_memory_manager import EnhancedMemoryManager
import asyncio
import json

async def health_check():
    manager = EnhancedMemoryManager()
    report = manager.get_performance_report()
    return report

result = asyncio.run(health_check())
print(json.dumps(result, indent=2))
" 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-EnhancedLog "Memory system health check passed" "INFO"
            if ($VerboseLogging) {
                Write-Host "🏥 Memory System Health Check:" -ForegroundColor Blue
                $HealthCheck | Write-Host -ForegroundColor Gray
            }
        }
    } catch {
        Write-EnhancedLog "Health check failed: $($_.Exception.Message)" "WARN"
    }
}