#Requires -Version 5.1
<#
.SYNOPSIS
    Diagnose and fix PostgreSQL unique constraint violations
.DESCRIPTION
    This script helps identify and resolve the PostgreSQL constraint error:
    "duplicate key value violates unique constraint IDX_1b101e71abe9ce72d910e95b9f"
.PARAMETER DatabaseHost
    PostgreSQL server hostname (default: localhost)
.PARAMETER DatabasePort
    PostgreSQL server port (default: 5432)
.PARAMETER DatabaseName
    Name of the database
.PARAMETER Username
    PostgreSQL username
.PARAMETER Password
    PostgreSQL password (will prompt if not provided)
.EXAMPLE
    .\Fix-PostgresConstraint.ps1 -DatabaseName mydb -Username postgres
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$DatabaseHost = "localhost",

    [Parameter()]
    [int]$DatabasePort = 5432,

    [Parameter(Mandatory=$true)]
    [string]$DatabaseName,

    [Parameter(Mandatory=$true)]
    [string]$Username,

    [Parameter()]
    [SecureString]$Password,

    [Parameter()]
    [string]$ConstraintName = "IDX_1b101e71abe9ce72d910e95b9f",

    [Parameter()]
    [switch]$AutoFix = $false
)

# Function to execute PostgreSQL queries
function Invoke-PostgreSQL {
    param(
        [string]$Query,
        [string]$Database = $DatabaseName
    )

    if (-not $Password) {
        $script:Password = Read-Host "Enter password for $Username" -AsSecureString
    }

    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

    $env:PGPASSWORD = $PlainPassword

    try {
        $result = & psql -h $DatabaseHost -p $DatabasePort -U $Username -d $Database -t -A -c $Query 2>&1

        if ($LASTEXITCODE -ne 0) {
            throw "PostgreSQL query failed: $result"
        }

        return $result
    }
    finally {
        $env:PGPASSWORD = $null
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    }
}

# Check if psql is available
try {
    $psqlVersion = & psql --version 2>&1
    Write-Host "Found PostgreSQL client: $psqlVersion" -ForegroundColor Green
}
catch {
    Write-Error "PostgreSQL client (psql) not found. Please install PostgreSQL client tools."
    Write-Host "You can install it via:"
    Write-Host "  - Download from: https://www.postgresql.org/download/windows/"
    Write-Host "  - Or via Chocolatey: choco install postgresql"
    Write-Host "  - Or via winget: winget install PostgreSQL.PostgreSQL"
    exit 1
}

Write-Host "`n=== PostgreSQL Constraint Violation Diagnostic Tool ===" -ForegroundColor Cyan
Write-Host "Constraint: $ConstraintName" -ForegroundColor Yellow
Write-Host "Database: $DatabaseName on $DatabaseHost:$DatabasePort" -ForegroundColor Yellow
Write-Host ""

# Step 1: Find constraint details
Write-Host "[Step 1] Identifying constraint details..." -ForegroundColor Magenta

$constraintQuery = @"
SELECT
    n.nspname as schema_name,
    t.tablename as table_name,
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition,
    array_to_string(array_agg(a.attname), ', ') as column_names
FROM pg_constraint con
LEFT JOIN pg_class c ON c.oid = con.conrelid
LEFT JOIN pg_tables t ON t.tablename = c.relname
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
WHERE con.conname = '$ConstraintName'
GROUP BY n.nspname, t.tablename, con.conname, con.contype, con.oid;
"@

try {
    $constraintResult = Invoke-PostgreSQL -Query $constraintQuery

    if ($constraintResult) {
        $parts = $constraintResult -split '\|'
        $schema = $parts[0]
        $table = $parts[1]
        $conName = $parts[2]
        $conType = $parts[3]
        $conDef = $parts[4]
        $columns = $parts[5]

        Write-Host "Found constraint!" -ForegroundColor Green
        Write-Host "  Schema: $schema" -ForegroundColor White
        Write-Host "  Table: $table" -ForegroundColor White
        Write-Host "  Type: $conType" -ForegroundColor White
        Write-Host "  Columns: $columns" -ForegroundColor White
        Write-Host "  Definition: $conDef" -ForegroundColor White
    }
    else {
        # Check if it's an index instead
        Write-Host "Constraint not found. Checking indexes..." -ForegroundColor Yellow

        $indexQuery = @"
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname = '$ConstraintName';
"@

        $indexResult = Invoke-PostgreSQL -Query $indexQuery

        if ($indexResult) {
            $parts = $indexResult -split '\|'
            $schema = $parts[0]
            $table = $parts[1]
            $indexName = $parts[2]
            $indexDef = $parts[3]

            Write-Host "Found as index!" -ForegroundColor Green
            Write-Host "  Schema: $schema" -ForegroundColor White
            Write-Host "  Table: $table" -ForegroundColor White
            Write-Host "  Index: $indexName" -ForegroundColor White
            Write-Host "  Definition: $indexDef" -ForegroundColor White

            # Extract columns from index definition
            if ($indexDef -match '\((.*?)\)') {
                $columns = $matches[1]
            }
        }
        else {
            Write-Error "Constraint or index '$ConstraintName' not found in database"
            exit 1
        }
    }
}
catch {
    Write-Error "Failed to query constraint: $_"
    exit 1
}

# Step 2: Find duplicate values
if ($table -and $columns) {
    Write-Host "`n[Step 2] Checking for duplicate values..." -ForegroundColor Magenta

    $duplicateQuery = @"
WITH duplicates AS (
    SELECT
        $columns,
        COUNT(*) as duplicate_count
    FROM $schema.$table
    GROUP BY $columns
    HAVING COUNT(*) > 1
)
SELECT COUNT(*) FROM duplicates;
"@

    try {
        $duplicateCount = Invoke-PostgreSQL -Query $duplicateQuery

        if ([int]$duplicateCount -gt 0) {
            Write-Host "Found $duplicateCount duplicate value(s) in column(s): $columns" -ForegroundColor Red

            # Show sample duplicates
            $sampleQuery = @"
WITH duplicates AS (
    SELECT
        $columns,
        COUNT(*) as duplicate_count
    FROM $schema.$table
    GROUP BY $columns
    HAVING COUNT(*) > 1
    LIMIT 5
)
SELECT $columns, duplicate_count FROM duplicates;
"@

            Write-Host "`nSample duplicate values:" -ForegroundColor Yellow
            $samples = Invoke-PostgreSQL -Query $sampleQuery
            $samples -split "`n" | ForEach-Object {
                if ($_) {
                    Write-Host "  $_" -ForegroundColor White
                }
            }

            # Step 3: Offer fix options
            if ($AutoFix) {
                Write-Host "`n[Step 3] Auto-fixing duplicates..." -ForegroundColor Magenta

                $fixQuery = @"
DELETE FROM $schema.$table a
USING $schema.$table b
WHERE a.$columns = b.$columns
AND a.ctid < b.ctid;
"@

                try {
                    $fixResult = Invoke-PostgreSQL -Query $fixQuery
                    Write-Host "Duplicates removed successfully!" -ForegroundColor Green
                }
                catch {
                    Write-Error "Failed to fix duplicates: $_"
                }
            }
            else {
                Write-Host "`n[Step 3] Fix Options:" -ForegroundColor Magenta
                Write-Host "1. Run this script with -AutoFix to remove duplicates automatically" -ForegroundColor White
                Write-Host "2. Manually fix using SQL:" -ForegroundColor White
                Write-Host @"
   -- Option A: Delete duplicates keeping newest
   DELETE FROM $schema.$table a
   USING $schema.$table b
   WHERE a.$columns = b.$columns
   AND a.ctid < b.ctid;

   -- Option B: Update duplicates to make unique
   UPDATE $schema.$table t1
   SET $columns = $columns || '_' || t1.ctid
   WHERE EXISTS (
       SELECT 1 FROM $schema.$table t2
       WHERE t2.$columns = t1.$columns
       AND t2.ctid != t1.ctid
   );
"@ -ForegroundColor Cyan
            }
        }
        else {
            Write-Host "No duplicate values found." -ForegroundColor Green
            Write-Host "The constraint violation might be from new inserts." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Error "Failed to check duplicates: $_"
    }
}

# Step 4: Provide application-level recommendations
Write-Host "`n[Step 4] Application-Level Recommendations:" -ForegroundColor Magenta
Write-Host @"
1. Update your INSERT statements to handle conflicts:
   INSERT INTO $table ($columns)
   VALUES (...)
   ON CONFLICT ($columns) DO NOTHING;

2. Or use UPSERT pattern:
   INSERT INTO $table ($columns)
   VALUES (...)
   ON CONFLICT ($columns)
   DO UPDATE SET updated_at = NOW();

3. Check your application code for:
   - Race conditions in concurrent inserts
   - Missing uniqueness checks before insert
   - Incorrect ID generation logic

4. Consider adding application-level validation before database operations
"@ -ForegroundColor White

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan