-- PostgreSQL Unique Constraint Violation Fix Script
-- Error: duplicate key value violates unique constraint "IDX_1b101e71abe9ce72d910e95b9f"
-- ===================================================================================

-- Step 1: Identify the constraint details
-- Find which table and columns are affected by this constraint
SELECT
    n.nspname as schema_name,
    t.tablename as table_name,
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition,
    a.attname as column_name
FROM pg_constraint con
LEFT JOIN pg_class c ON c.oid = con.conrelid
LEFT JOIN pg_tables t ON t.tablename = c.relname
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
WHERE con.conname = 'IDX_1b101e71abe9ce72d910e95b9f';

-- Step 2: If the above returns no results, check indexes instead
-- This might be an index, not a constraint
SELECT
    schemaname as schema_name,
    tablename as table_name,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE indexname = 'IDX_1b101e71abe9ce72d910e95b9f';

-- Step 3: Find duplicate values in the affected table
-- Replace 'your_table' and 'your_column' with actual values from Step 1 or 2
-- This query finds all duplicate values
/*
WITH duplicates AS (
    SELECT
        your_column,
        COUNT(*) as duplicate_count
    FROM your_table
    GROUP BY your_column
    HAVING COUNT(*) > 1
)
SELECT
    t.*,
    d.duplicate_count
FROM your_table t
INNER JOIN duplicates d ON t.your_column = d.your_column
ORDER BY d.your_column, t.created_at DESC;
*/

-- Step 4: Common resolution strategies
-- =====================================

-- Option A: Remove duplicates, keeping only the most recent
/*
DELETE FROM your_table a
USING your_table b
WHERE a.your_column = b.your_column
AND a.id < b.id;  -- Keeps the record with the highest ID
*/

-- Option B: Remove duplicates, keeping the oldest
/*
DELETE FROM your_table a
USING your_table b
WHERE a.your_column = b.your_column
AND a.created_at > b.created_at;  -- Keeps the oldest record
*/

-- Option C: Update duplicates to make them unique
/*
UPDATE your_table t1
SET your_column = your_column || '_' || t1.id
WHERE EXISTS (
    SELECT 1
    FROM your_table t2
    WHERE t2.your_column = t1.your_column
    AND t2.id != t1.id
);
*/

-- Option D: Temporarily disable constraint, fix data, re-enable
/*
-- Disable constraint
ALTER TABLE your_table DROP CONSTRAINT IDX_1b101e71abe9ce72d910e95b9f;

-- Fix your data here

-- Re-create constraint
ALTER TABLE your_table
ADD CONSTRAINT IDX_1b101e71abe9ce72d910e95b9f UNIQUE (your_column);
*/

-- Step 5: Prevent future violations
-- ==================================

-- Add ON CONFLICT clause in your INSERT statements
/*
INSERT INTO your_table (column1, column2, your_unique_column)
VALUES ('value1', 'value2', 'unique_value')
ON CONFLICT (your_unique_column)
DO UPDATE SET
    column1 = EXCLUDED.column1,
    column2 = EXCLUDED.column2,
    updated_at = NOW();
*/

-- Or ignore conflicts
/*
INSERT INTO your_table (column1, column2, your_unique_column)
VALUES ('value1', 'value2', 'unique_value')
ON CONFLICT (your_unique_column) DO NOTHING;
*/

-- Step 6: Debugging queries
-- =========================

-- Show all constraints on all tables
SELECT
    n.nspname as schema,
    t.tablename as table,
    con.conname as constraint_name,
    con.contype as type,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
LEFT JOIN pg_class c ON c.oid = con.conrelid
LEFT JOIN pg_tables t ON t.tablename = c.relname
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, t.tablename;

-- Show table structure with constraints
/*
\d+ your_table_name
*/

-- Find recently failed inserts (if you have query logging enabled)
/*
SELECT * FROM pg_stat_activity
WHERE state = 'idle'
AND query LIKE '%INSERT%'
ORDER BY query_start DESC
LIMIT 10;
*/

-- Check for pending transactions that might be holding locks
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Step 7: Application-level fixes
-- ================================
-- See accompanying TypeScript/JavaScript files for application code fixes