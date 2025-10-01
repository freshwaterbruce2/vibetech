/**
 * PostgreSQL Unique Constraint Violation Handler
 * Handles error: duplicate key value violates unique constraint "IDX_1b101e71abe9ce72d910e95b9f"
 */

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
 * Parse PostgreSQL error to extract constraint details
 */
export function parsePostgresError(error: any): DatabaseConstraintError | null {
  // Check if it's a PostgreSQL error
  if (!error.code || !error.constraint) {
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
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on constraint violations
      if (error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
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
    private db: any, // Your database connection/client
    private tableName: string
  ) {}

  /**
   * Insert with conflict resolution
   */
  async upsert(
    data: Record<string, any>,
    conflictColumns: string[],
    updateColumns?: string[]
  ): Promise<any> {
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
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      const constraintError = parsePostgresError(error);
      if (constraintError) {
        throw constraintError;
      }
      throw error;
    }
  }

  /**
   * Batch insert with duplicate handling
   */
  async batchInsert(
    records: Record<string, any>[],
    conflictColumns: string[],
    options: {
      chunkSize?: number;
      onConflict?: 'skip' | 'update' | 'error';
    } = {}
  ): Promise<any[]> {
    const { chunkSize = 100, onConflict = 'skip' } = options;
    const results: any[] = [];

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

            const result = await this.db.query(query, values);
            results.push(result.rows[0]);
          }
        } catch (error: any) {
          if (onConflict === 'error') {
            throw error;
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
export function constraintErrorHandler(
  err: any,
  req: any,
  res: any,
  next: any
) {
  const constraintError = parsePostgresError(err);

  if (constraintError) {
    return res.status(409).json({
      error: 'Constraint Violation',
      message: constraintError.message,
      code: constraintError.code,
      constraint: constraintError.constraint,
      detail: constraintError.detail
    });
  }

  // Pass to next error handler
  next(err);
}

/**
 * Helper to handle specific constraint "IDX_1b101e71abe9ce72d910e95b9f"
 */
export async function handleSpecificConstraintViolation(
  db: any,
  error: any,
  retryOperation?: () => Promise<any>
): Promise<any> {
  if (error.constraint !== 'IDX_1b101e71abe9ce72d910e95b9f') {
    throw error;
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
    const result = await db.query(constraintQuery, ['IDX_1b101e71abe9ce72d910e95b9f']);

    if (result.rows.length > 0) {
      const { table_name, column_name } = result.rows[0];

      console.log(`Constraint violation on table: ${table_name}, column: ${column_name}`);

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
export async function exampleUsage(db: any) {
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

    console.log('Upsert successful:', result);
  } catch (error: any) {
    if (error instanceof DatabaseConstraintError) {
      console.error('Constraint violation:', error.message);
      // Handle specific constraint violation
      // Maybe update existing record or notify user
    } else {
      // Handle other errors
      throw error;
    }
  }
}