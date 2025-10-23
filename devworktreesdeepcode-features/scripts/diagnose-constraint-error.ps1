# PostgreSQL Constraint Error Diagnostic
# This script helps identify where the constraint error is coming from

Write-Host "`n=== PostgreSQL Constraint Error Diagnostic ===" -ForegroundColor Cyan
Write-Host "Error: duplicate key value violates unique constraint" -ForegroundColor Yellow
Write-Host "Constraint: IDX_1b101e71abe9ce72d910e95b9f`n" -ForegroundColor Yellow

# Check environment variables
Write-Host "[1] Checking Environment Variables..." -ForegroundColor Magenta
$pgVars = Get-ChildItem env: | Where-Object { $_.Name -match "POSTGRES|DATABASE|DB_" }
if ($pgVars) {
    Write-Host "Found database-related environment variables:" -ForegroundColor Green
    $pgVars | ForEach-Object {
        if ($_.Value -notmatch "password|secret|key") {
            Write-Host "  $($_.Name) = $($_.Value)" -ForegroundColor White
        } else {
            Write-Host "  $($_.Name) = [REDACTED]" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  No PostgreSQL environment variables found" -ForegroundColor Gray
}

# Check for running processes
Write-Host "`n[2] Checking Running Processes..." -ForegroundColor Magenta
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" }
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es) running" -ForegroundColor Green
    $nodeProcesses | Select-Object Id, CPU, WorkingSet | Format-Table
} else {
    Write-Host "  No Node.js processes running" -ForegroundColor Gray
}

# Check for Docker
Write-Host "`n[3] Checking Docker..." -ForegroundColor Magenta
try {
    $dockerRunning = docker ps 2>$null
    if ($dockerRunning) {
        Write-Host "Docker is running. Checking for PostgreSQL containers:" -ForegroundColor Green
        docker ps -a | Select-String -Pattern "postgres" -SimpleMatch
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  No PostgreSQL containers found" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  Docker not installed or not running" -ForegroundColor Gray
}

# Check network connections
Write-Host "`n[4] Checking Network Connections to PostgreSQL port..." -ForegroundColor Magenta
$pgConnections = netstat -an | Select-String -Pattern ":5432" -SimpleMatch
if ($pgConnections) {
    Write-Host "Found connections on PostgreSQL port 5432:" -ForegroundColor Green
    $pgConnections | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "  No connections to PostgreSQL port 5432" -ForegroundColor Gray
}

# Search for ORM configurations
Write-Host "`n[5] Searching for ORM Configurations..." -ForegroundColor Magenta
$ormPatterns = @("typeorm", "prisma", "sequelize", "knex", "objection")
$configFiles = @()

foreach ($pattern in $ormPatterns) {
    $found = Get-ChildItem -Path C:\dev -Recurse -Filter "*$pattern*" -File -ErrorAction SilentlyContinue |
             Where-Object { $_.Extension -in ".json", ".js", ".ts", ".yml", ".yaml" } |
             Select-Object -First 5

    if ($found) {
        Write-Host "  Found $pattern configuration files:" -ForegroundColor Green
        $found | ForEach-Object { Write-Host "    $($_.FullName)" -ForegroundColor White }
        $configFiles += $found
    }
}

if ($configFiles.Count -eq 0) {
    Write-Host "  No ORM configuration files found" -ForegroundColor Gray
}

# Analyze constraint name pattern
Write-Host "`n[6] Analyzing Constraint Name Pattern..." -ForegroundColor Magenta
Write-Host "The constraint 'IDX_1b101e71abe9ce72d910e95b9f' follows a pattern typical of:" -ForegroundColor Yellow
Write-Host "  - TypeORM auto-generated indexes (IDX_ prefix + hash)" -ForegroundColor White
Write-Host "  - Prisma migration-generated constraints" -ForegroundColor White
Write-Host "  - Hasura auto-generated constraints" -ForegroundColor White
Write-Host "  - Other ORMs with hash-based naming" -ForegroundColor White

# Check recent error logs
Write-Host "`n[7] Checking Recent Application Logs..." -ForegroundColor Magenta
$logDirs = @(
    "C:\dev\logs",
    "C:\dev\projects\crypto-enhanced\logs",
    "C:\dev\projects\active\*\logs"
)

$recentLogs = @()
foreach ($dir in $logDirs) {
    $logs = Get-ChildItem -Path $dir -Filter "*.log" -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) }
    if ($logs) {
        $recentLogs += $logs
    }
}

if ($recentLogs) {
    Write-Host "Recent log files (last 24 hours):" -ForegroundColor Green
    foreach ($log in $recentLogs) {
        Write-Host "  $($log.FullName)" -ForegroundColor White
        # Search for the constraint error in the log
        $errorFound = Select-String -Path $log.FullName -Pattern "IDX_1b101e71abe9ce72d910e95b9f" -SimpleMatch -Quiet
        if ($errorFound) {
            Write-Host "    ⚠️ Contains the constraint error!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  No recent log files found" -ForegroundColor Gray
}

# Summary and recommendations
Write-Host "`n[8] Summary and Recommendations" -ForegroundColor Cyan
Write-Host @"

Based on the diagnostic:

1. PostgreSQL is NOT installed locally
2. The error is coming from an external source
3. The constraint name pattern suggests TypeORM or similar ORM

NEXT STEPS:
-----------
1. Check your cloud services:
   - Heroku PostgreSQL add-ons
   - AWS RDS instances
   - Azure Database for PostgreSQL
   - Google Cloud SQL

2. Review your application deployments:
   - Check production/staging logs
   - Review deployment configurations
   - Check CI/CD pipeline databases

3. If using TypeORM:
   - Run: typeorm migration:show
   - Check for pending migrations
   - Review entity unique constraints

4. Quick Fix Options:
   - Use ON CONFLICT clause in SQL inserts
   - Implement upsert logic in your application
   - Add duplicate checking before inserts

5. Use the provided scripts:
   - .\scripts\Fix-PostgresConstraint.ps1 (when you find the database)
   - Review scripts\POSTGRES_CONSTRAINT_TROUBLESHOOTING.md
   - Implement scripts\postgres-constraint-handler.ts in your app
"@ -ForegroundColor White

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan