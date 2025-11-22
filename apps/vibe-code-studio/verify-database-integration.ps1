# Verify DeepCode Editor Database Integration
# Checks if better-sqlite3 is installed and can connect to unified database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DeepCode Editor - Database Integration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Verify better-sqlite3 is installed
Write-Host "[1/4] Checking better-sqlite3 installation..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$hasBetterSqlite = $packageJson.dependencies.'better-sqlite3'

if ($hasBetterSqlite) {
    Write-Host "  ✓ better-sqlite3 $hasBetterSqlite found in package.json" -ForegroundColor Green
} else {
    Write-Host "  ✗ better-sqlite3 NOT found in package.json" -ForegroundColor Red
    Write-Host "  Run: pnpm add better-sqlite3" -ForegroundColor Yellow
    exit 1
}

# Check 2: Verify unified database exists
Write-Host ""
Write-Host "[2/4] Checking unified database..." -ForegroundColor Yellow
$dbPath = "D:\databases\database.db"

if (Test-Path $dbPath) {
    $dbSize = [math]::Round((Get-Item $dbPath).Length / 1MB, 2)
    Write-Host "  ✓ Database found: $dbPath ($dbSize MB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Database NOT found at: $dbPath" -ForegroundColor Red
    exit 1
}

# Check 3: Verify DatabaseService.ts is configured
Write-Host ""
Write-Host "[3/4] Checking DatabaseService.ts configuration..." -ForegroundColor Yellow
$dbService = Get-Content "src\services\DatabaseService.ts" -Raw

if ($dbService -match 'D:\\databases\\database\.db') {
    Write-Host "  ✓ DatabaseService.ts points to unified database" -ForegroundColor Green
} else {
    Write-Host "  ✗ DatabaseService.ts NOT configured for unified database" -ForegroundColor Red
    Write-Host "  Expected: D:\\databases\\database.db" -ForegroundColor Yellow
    exit 1
}

# Check 4: Query database using better-sqlite3
Write-Host ""
Write-Host "[4/4] Testing database connection..." -ForegroundColor Yellow

$testScript = @"
const Database = require('better-sqlite3');
const db = new Database('D:\\databases\\database.db', { readonly: true });

try {
    // Get table count
    const tableCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM sqlite_master
        WHERE type='table'
    `).get();

    // Get learning tables
    const learningTables = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name IN ('agent_mistakes', 'agent_patterns', 'success_patterns', 'failure_patterns')
        ORDER BY name
    `).all();

    // Get agent mistakes count
    const mistakesCount = db.prepare(`
        SELECT COUNT(*) as count FROM agent_mistakes
    `).get();

    db.close();

    console.log(JSON.stringify({
        success: true,
        tableCount: tableCount.count,
        learningTables: learningTables.map(t => t.name),
        mistakesCount: mistakesCount.count
    }));
} catch (error) {
    console.log(JSON.stringify({
        success: false,
        error: error.message
    }));
    db.close();
    process.exit(1);
}
"@

$testScript | Out-File -FilePath "temp_db_test.js" -Encoding UTF8

try {
    $result = node temp_db_test.js 2>&1 | Out-String
    $data = $result | ConvertFrom-Json

    if ($data.success) {
        Write-Host "  ✓ Successfully connected to database!" -ForegroundColor Green
        Write-Host "    - Total tables: $($data.tableCount)" -ForegroundColor Cyan
        Write-Host "    - Learning tables: $($data.learningTables -join ', ')" -ForegroundColor Cyan
        Write-Host "    - Agent mistakes: $($data.mistakesCount)" -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ Connection failed: $($data.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Test failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item "temp_db_test.js" -ErrorAction SilentlyContinue
}

# Success!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Database Integration Verified!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Build the app: pnpm run build" -ForegroundColor White
Write-Host "2. Start the app: pnpm run dev" -ForegroundColor White
Write-Host "3. Check logs for:" -ForegroundColor White
Write-Host "   [DEBUG] [DatabaseService] ✓ Connected to database" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected Behavior:" -ForegroundColor Cyan
Write-Host "- NO 'Using localStorage fallback' message" -ForegroundColor White
Write-Host "- Direct database access via better-sqlite3" -ForegroundColor White
Write-Host "- Access to all 112 learning tables" -ForegroundColor White
Write-Host ""
