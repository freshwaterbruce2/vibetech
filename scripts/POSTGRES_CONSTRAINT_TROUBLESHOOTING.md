# PostgreSQL Unique Constraint Violation Troubleshooting Guide

## Error Details
```
Error: duplicate key value violates unique constraint "IDX_1b101e71abe9ce72d910e95b9f"
Code: 23505
```

## Quick Diagnosis

### 1. Locate the Constraint

Run this SQL to find which table and column have the constraint:

```sql
-- Check constraints
SELECT
    n.nspname as schema_name,
    t.tablename as table_name,
    con.conname as constraint_name,
    a.attname as column_name
FROM pg_constraint con
LEFT JOIN pg_class c ON c.oid = con.conrelid
LEFT JOIN pg_tables t ON t.tablename = c.relname
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
WHERE con.conname = 'IDX_1b101e71abe9ce72d910e95b9f';

-- Check indexes if constraint not found
SELECT * FROM pg_indexes WHERE indexname = 'IDX_1b101e71abe9ce72d910e95b9f';
```

### 2. Find Duplicate Values

Once you know the table and column:

```sql
-- Find all duplicates
SELECT your_column, COUNT(*) as count
FROM your_table
GROUP BY your_column
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### 3. View Duplicate Records

```sql
-- See full records with duplicates
WITH duplicates AS (
    SELECT your_column
    FROM your_table
    GROUP BY your_column
    HAVING COUNT(*) > 1
)
SELECT t.*
FROM your_table t
INNER JOIN duplicates d ON t.your_column = d.your_column
ORDER BY t.your_column, t.created_at;
```

## Resolution Strategies

### Strategy 1: Remove Duplicates (Keep Newest)

```sql
-- Keep the record with the highest ID
DELETE FROM your_table a
USING your_table b
WHERE a.your_column = b.your_column
AND a.id < b.id;
```

### Strategy 2: Remove Duplicates (Keep Oldest)

```sql
-- Keep the oldest record by created_at
DELETE FROM your_table a
USING your_table b
WHERE a.your_column = b.your_column
AND a.created_at > b.created_at;
```

### Strategy 3: Make Duplicates Unique

```sql
-- Append ID to make values unique
UPDATE your_table t1
SET your_column = your_column || '_' || t1.id
WHERE EXISTS (
    SELECT 1
    FROM your_table t2
    WHERE t2.your_column = t1.your_column
    AND t2.id != t1.id
);
```

### Strategy 4: Merge Duplicate Records

```sql
-- Example: Merge data from duplicates into one record
-- This is complex and depends on your business logic
WITH keeper AS (
    SELECT DISTINCT ON (your_column) *
    FROM your_table
    ORDER BY your_column, created_at ASC
)
-- Update keeper records with aggregated data from duplicates
-- Then delete the duplicates
```

## Application-Level Fixes

### TypeScript/Node.js with pg Library

```typescript
// Use ON CONFLICT for inserts
async function safeInsert(data: any) {
  const query = `
    INSERT INTO your_table (column1, column2, unique_column)
    VALUES ($1, $2, $3)
    ON CONFLICT (unique_column)
    DO UPDATE SET
      column1 = EXCLUDED.column1,
      column2 = EXCLUDED.column2,
      updated_at = NOW()
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [data.column1, data.column2, data.unique_column]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      console.error('Duplicate key violation:', error.constraint);
      // Handle the specific case
    }
    throw error;
  }
}
```

### Python with psycopg2

```python
import psycopg2
from psycopg2 import errors

def safe_insert(conn, data):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO your_table (column1, unique_column)
            VALUES (%s, %s)
            ON CONFLICT (unique_column) DO NOTHING
            RETURNING *;
        """, (data['column1'], data['unique_column']))

        result = cursor.fetchone()
        conn.commit()
        return result

    except errors.UniqueViolation as e:
        conn.rollback()
        print(f"Duplicate key violation: {e.diag.constraint_name}")
        # Handle the duplicate case
        return None
    finally:
        cursor.close()
```

### Express.js Middleware

```javascript
// Error handling middleware
function handleDatabaseErrors(err, req, res, next) {
  if (err.code === '23505') {
    // PostgreSQL unique violation
    const constraint = err.constraint || 'unknown';
    const detail = err.detail || '';

    // Extract field name from detail if possible
    const fieldMatch = detail.match(/Key \((.*?)\)=/);
    const field = fieldMatch ? fieldMatch[1] : 'unknown field';

    return res.status(409).json({
      error: 'Duplicate Entry',
      message: `The value for ${field} already exists`,
      constraint: constraint,
      code: 'UNIQUE_VIOLATION'
    });
  }

  next(err);
}

app.use(handleDatabaseErrors);
```

## Prevention Best Practices

### 1. Use UUIDs for Primary Keys

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE your_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- other columns
);
```

### 2. Add Unique Constraints Properly

```sql
-- Single column unique
ALTER TABLE your_table ADD CONSTRAINT unique_email UNIQUE (email);

-- Composite unique constraint
ALTER TABLE your_table ADD CONSTRAINT unique_user_role
  UNIQUE (user_id, role_id);
```

### 3. Use Database Transactions

```typescript
async function createWithTransaction(data: any) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if exists
    const exists = await client.query(
      'SELECT id FROM your_table WHERE unique_column = $1',
      [data.unique_column]
    );

    if (exists.rows.length > 0) {
      await client.query('ROLLBACK');
      return { error: 'Already exists', existing: exists.rows[0] };
    }

    // Insert if not exists
    const result = await client.query(
      'INSERT INTO your_table (unique_column) VALUES ($1) RETURNING *',
      [data.unique_column]
    );

    await client.query('COMMIT');
    return result.rows[0];

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### 4. Implement Idempotency

```sql
-- Create function for idempotent inserts
CREATE OR REPLACE FUNCTION upsert_record(
    p_unique_column TEXT,
    p_data JSONB
) RETURNS TABLE (
    id UUID,
    created BOOLEAN
) AS $$
DECLARE
    v_id UUID;
    v_created BOOLEAN := FALSE;
BEGIN
    -- Try to insert
    INSERT INTO your_table (unique_column, data)
    VALUES (p_unique_column, p_data)
    ON CONFLICT (unique_column) DO NOTHING
    RETURNING your_table.id INTO v_id;

    IF v_id IS NOT NULL THEN
        v_created := TRUE;
    ELSE
        -- Get existing record
        SELECT your_table.id INTO v_id
        FROM your_table
        WHERE unique_column = p_unique_column;
    END IF;

    RETURN QUERY SELECT v_id, v_created;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring and Logging

### 1. Log All Constraint Violations

```sql
-- Create audit table
CREATE TABLE constraint_violations (
    id SERIAL PRIMARY KEY,
    occurred_at TIMESTAMP DEFAULT NOW(),
    constraint_name TEXT,
    table_name TEXT,
    error_detail TEXT,
    query_text TEXT,
    application_name TEXT,
    client_addr INET
);

-- Create trigger function (requires custom implementation)
```

### 2. Monitor for Patterns

```sql
-- Find most common constraint violations
SELECT
    constraint_name,
    COUNT(*) as violation_count,
    MAX(occurred_at) as last_occurrence
FROM constraint_violations
WHERE occurred_at > NOW() - INTERVAL '7 days'
GROUP BY constraint_name
ORDER BY violation_count DESC;
```

## Common Causes and Solutions

| Cause | Symptom | Solution |
|-------|---------|----------|
| Race Condition | Multiple simultaneous inserts | Use `ON CONFLICT` or advisory locks |
| Missing Validation | App doesn't check uniqueness | Add pre-insert validation |
| Import/Migration | Bulk data has duplicates | Clean data before import |
| ID Generation | Non-unique ID algorithm | Use UUIDs or sequences |
| Case Sensitivity | 'Email' vs 'email' | Use LOWER() in constraints |
| Whitespace | ' value' vs 'value' | TRIM() values before insert |
| Null Handling | Multiple NULL values | Use partial unique indexes |

## Emergency Fixes

### Temporarily Disable Constraint

```sql
-- Disable (drops the constraint)
ALTER TABLE your_table DROP CONSTRAINT IDX_1b101e71abe9ce72d910e95b9f;

-- Fix your data here

-- Re-enable (recreate constraint)
ALTER TABLE your_table ADD CONSTRAINT IDX_1b101e71abe9ce72d910e95b9f
  UNIQUE (your_column);
```

### Find and Fix in One Query

```sql
-- Delete all but one duplicate
DELETE FROM your_table
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY unique_column ORDER BY created_at DESC) AS rn
        FROM your_table
    ) t
    WHERE t.rn > 1
);
```

## Tools and Scripts

### PowerShell Diagnostic Script
```powershell
# Run the diagnostic script
.\Fix-PostgresConstraint.ps1 -DatabaseName mydb -Username postgres
```

### SQL Diagnostic Script
```sql
-- Run the comprehensive diagnostic
\i fix-postgres-constraint-error.sql
```

### TypeScript Handler
```typescript
import { PostgresUpsertHandler } from './postgres-constraint-handler';

const handler = new PostgresUpsertHandler(db, 'your_table');
await handler.upsert(data, ['unique_column'], ['updated_at']);
```

## Next Steps

1. **Identify** the exact table and column using the SQL queries above
2. **Analyze** your application logs to find what operation causes the error
3. **Choose** a resolution strategy based on your business requirements
4. **Implement** application-level handling to prevent future occurrences
5. **Monitor** for patterns and adjust your approach as needed

## Need More Help?

If the constraint name doesn't exist in your database, check:
- External databases or services your app connects to
- ORM-generated constraint names (TypeORM, Prisma, Sequelize)
- Docker containers running PostgreSQL
- Cloud databases (AWS RDS, Heroku Postgres, etc.)
- Migration files that might have different constraint names