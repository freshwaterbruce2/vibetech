/**
 * Type definitions for PostgreSQL error handling
 */

/**
 * PostgreSQL error object structure
 */
export interface PostgresError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  detail?: string;
  schema?: string;
  column?: string;
  severity?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  file?: string;
  line?: string;
  routine?: string;
}

/**
 * Database query result structure
 */
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  command: string;
  fields: {
    name: string;
    dataTypeID: number;
  }[];
}

/**
 * Database client interface
 */
export interface DatabaseClient {
  query<T = unknown>(
    sql: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
}

/**
 * Constraint metadata from database
 */
export interface ConstraintMetadata {
  schema_name: string;
  table_name: string;
  constraint_name: string;
  column_name: string;
}

/**
 * Batch insert options
 */
export interface BatchInsertOptions {
  chunkSize?: number;
  onConflict?: 'skip' | 'update' | 'error';
}

/**
 * Record type for database operations
 */
export type DatabaseRecord = Record<string, unknown>;

/**
 * Express-like request object (minimal typing)
 */
export interface ExpressRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Express-like response object (minimal typing)
 */
export interface ExpressResponse {
  status(code: number): this;
  json(data: unknown): this;
  send(data: unknown): this;
}

/**
 * Express-like next function
 */
export type ExpressNext = (err?: Error) => void;

/**
 * Express error handler signature
 */
export type ExpressErrorHandler = (
  err: Error | PostgresError,
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNext
) => void | Promise<void>;
