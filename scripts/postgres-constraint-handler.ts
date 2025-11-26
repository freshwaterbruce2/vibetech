/**
 * PostgreSQL Unique Constraint Violation Handler
 * Handles error: duplicate key value violates unique constraint "IDX_1b101e71abe9ce72d910e95b9f"
 */

import type {
  BatchInsertOptions,
  ConstraintMetadata,
  DatabaseClient,
  DatabaseRecord,
  ExpressErrorHandler,
  PostgresError
} from './postgres-types';

// Error codes for PostgreSQL
const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514'
};

/**
 * Custom error class for database constraint violations
 */
export class DatabaseConstraintError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly constraint: string,
    public readonly table?: string,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'DatabaseConstraintError';
  }
}

/**
 * Type guard to check if error is a PostgresError
 */
function isPostgresError(error: unknown): error is PostgresError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'constraint' in error
  );
}

/**
 * Parse PostgreSQL error to extract constraint details
 */
export function parsePostgresError(error: unknown): DatabaseConstraintError | null {
  // Type guard to check if error is a PostgresError
  if (!isPostgresError(error)) {
    return null;
  }

  if (error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
    const constraint = error.constraint || 'unknown';
    const table = error.table || extractTableFromDetail(error.detail);
    const field = extractFieldFromDetail(error.detail);

    const message = `Duplicate value for ${field ? `field '${field}'` : 'unique field'} in ${table ? `table '${table}'` : 'table'}`;

    return new DatabaseConstraintError(
      message,
      error.code,
      constraint,
      table,
      error.detail
    );
  }

  return null;
}

/**
 * Extract table name from error detail
 */
function extractTableFromDetail(detail?: string): string | undefined {
  if (!detail) return undefined;
  const match = detail.match(/Key \((.*?)\)=\((.*?)\) already exists/);
  return match ? match[1] : undefined;
}

/**
 * Extract field name from error detail
 */
function extractFieldFromDetail(detail?: string): string | undefined {
  if (!detail) return undefined;
  const match = detail.match(/Key \((.*?)\)=/);
  return match ? match[1] : undefined;
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error = new Error('Max retries exceeded');

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on constraint violations
      if (isPostgresError(error) && error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Upsert handler for PostgreSQL
 */
export class PostgresUpsertHandler {
  constructor(
    private db: DatabaseClient,
    private tableName: string
  ) {}

  /**
   * Insert with conflict resolution
   */
  async upsert(
    data: DatabaseRecord,
    conflictColumns: string[],
    updateColumns?: string[]
  ): Promise<DatabaseRecord | null> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    let query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    if (conflictColumns.length > 0) {
      query += `
        ON CONFLICT (${conflictColumns.join(', ')})
      `;

      if (updateColumns && updateColumns.length > 0) {
        const updates = updateColumns.map(col =>
          `${col} = EXCLUDED.${col}`
        ).join(', ');

        query += `
          DO UPDATE SET ${updates}, updated_at = NOW()
        `;
      } else {
        query += ' DO NOTHING';
      }
    }

    query += ' RETURNING *';

    try {
      const result = await this.db.query<DatabaseRecord>(query, values);
      return result.rows[0] || null;
    } catch (error: unknown) {
      const constraintError = parsePostgresError(error);
      if (constraintError) {
        throw constraintError;
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Batch insert with duplicate handling
   */
  async batchInsert(
    records: DatabaseRecord[],
    conflictColumns: string[],
    options: BatchInsertOptions = {}
  ): Promise<DatabaseRecord[]> {
    const { chunkSize = 100, onConflict = 'skip' } = options;
    const results: DatabaseRecord[] = [];

    // Process in chunks
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);

      for (const record of chunk) {
        try {
          if (onConflict === 'skip' || onConflict === 'update') {
            const result = await this.upsert(
              record,
              conflictColumns,
              onConflict === 'update' ? Object.keys(record) : undefined
            );
            if (result) {
              results.push(result);
            }
          } else {
            // Regular insert that will throw on conflict
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
              INSERT INTO ${this.tableName} (${columns.join(', ')})
              VALUES (${placeholders})
              RETURNING *
            `;

            const result = await this.db.query<DatabaseRecord>(query, values);
            if (result.rows[0]) {
              results.push(result.rows[0]);
            }
          }
        } catch (error: unknown) {
          if (onConflict === 'error') {
            throw error instanceof Error ? error : new Error(String(error));
          }
          // Log and continue for skip mode
          console.error(`Failed to insert record:`, error);
        }
      }
    }

    return results;
  }
}

/**
 * Middleware for Express to handle constraint errors
 */
export const constraintErrorHandler: ExpressErrorHandler = (
  err,
  _req,
  res,
  next
) => {
  const constraintError = parsePostgresError(err);

  if (constraintError) {
    res.status(409).json({
      error: 'Constraint Violation',
      message: constraintError.message,
      code: constraintError.code,
      constraint: constraintError.constraint,
      detail: constraintError.detail
    });
    return;
  }

  // Pass to next error handler
  next(err);
};

/**
 * Helper to handle specific constraint "IDX_1b101e71abe9ce72d910e95b9f"
 */
export async function handleSpecificConstraintViolation(
  db: DatabaseClient,
  error: unknown,
  retryOperation?: () => Promise<DatabaseRecord | null>
): Promise<DatabaseRecord | null> {
  if (!isPostgresError(error) || error.constraint !== 'IDX_1b101e71abe9ce72d910e95b9f') {
    throw error instanceof Error ? error : new Error(String(error));
  }

  // First, identify what this constraint is
  const constraintQuery = `
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
    WHERE con.conname = $1
  `;

  try {
    const result = await db.query<ConstraintMetadata>(constraintQuery, ['IDX_1b101e71abe9ce72d910e95b9f']);

    if (result.rows.length > 0) {
      const { table_name, column_name } = result.rows[0];

      console.warn(`Constraint violation on table: ${table_name}, column: ${column_name}`);

      // Option 1: Try to update instead of insert
      if (retryOperation) {
        return await retryOperation();
      }

      // Option 2: Return informative error
      throw new DatabaseConstraintError(
        `Duplicate value in ${table_name}.${column_name}`,
        PG_ERROR_CODES.UNIQUE_VIOLATION,
        'IDX_1b101e71abe9ce72d910e95b9f',
        table_name,
        `Column ${column_name} must be unique`
      );
    }
  } catch (queryError) {
    console.error('Failed to identify constraint:', queryError);
  }

  // Re-throw original error if we can't handle it
  throw error;
}

/**
 * Example usage in your application
 */
export async function exampleUsage(db: DatabaseClient): Promise<void> {
  const handler = new PostgresUpsertHandler(db, 'your_table');

  try {
    // Attempt insert
    const result = await handler.upsert(
      {
        email: 'user@example.com',
        name: 'John Doe',
        created_at: new Date()
      },
      ['email'], // Conflict on email column
      ['name', 'updated_at'] // Update these fields on conflict
    );

    if (result) {
      console.warn('Upsert successful:', result);
    }
  } catch (error: unknown) {
    if (error instanceof DatabaseConstraintError) {
      console.error('Constraint violation:', error.message);
      // Handle specific constraint violation
      // Maybe update existing record or notify user
    } else {
      // Handle other errors
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
