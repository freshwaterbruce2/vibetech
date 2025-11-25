"""
SQL database data loader with support for multiple database engines.
"""

import pandas as pd
import sqlite3
from typing import Optional, Dict, Any, List
from urllib.parse import quote_plus
from .base import DataLoader
from ..core.exceptions import DataLoadException


class SQLLoader(DataLoader):
    """Loader for SQL databases with connection pooling and query optimization."""

    SUPPORTED_ENGINES = ['sqlite', 'postgresql', 'mysql', 'mssql', 'oracle']

    def __init__(self, config: Any):
        """Initialize SQL loader with database configuration."""
        super().__init__(config)
        self.connection = None
        self.engine = None

    def _create_connection_string(self) -> str:
        """Create database connection string from configuration."""
        params = self.config.connection_params
        engine = params.get('engine', 'sqlite').lower()

        if engine == 'sqlite':
            return f"sqlite:///{params.get('database', 'data.db')}"

        # Build connection string for other databases
        user = params.get('user', '')
        password = quote_plus(params.get('password', ''))
        host = params.get('host', 'localhost')
        port = params.get('port', '')
        database = params.get('database', '')

        if engine == 'postgresql':
            default_port = 5432
        elif engine == 'mysql':
            default_port = 3306
        elif engine == 'mssql':
            default_port = 1433
        elif engine == 'oracle':
            default_port = 1521
        else:
            default_port = ''

        port = port or default_port

        if engine == 'mssql':
            driver = params.get('driver', 'ODBC+Driver+17+for+SQL+Server')
            return f"mssql+pyodbc://{user}:{password}@{host}:{port}/{database}?driver={driver}"

        return f"{engine}://{user}:{password}@{host}:{port}/{database}"

    def _get_connection(self):
        """Get database connection with proper error handling."""
        if self.connection is not None:
            return self.connection

        params = self.config.connection_params
        engine = params.get('engine', 'sqlite').lower()

        try:
            if engine == 'sqlite':
                self.connection = sqlite3.connect(params.get('database', 'data.db'))
            else:
                # Use SQLAlchemy for other databases
                from sqlalchemy import create_engine
                connection_string = self._create_connection_string()
                self.engine = create_engine(
                    connection_string,
                    pool_pre_ping=True,
                    pool_recycle=3600
                )
                self.connection = self.engine.connect()

            self.logger.info(f"Connected to {engine} database")
            return self.connection

        except Exception as e:
            raise DataLoadException(f"Failed to connect to database: {e}")

    def load(
        self,
        query: Optional[str] = None,
        table: Optional[str] = None,
        columns: Optional[List[str]] = None,
        where: Optional[str] = None,
        limit: Optional[int] = None,
        chunksize: Optional[int] = None,
        **kwargs
    ) -> pd.DataFrame:
        """
        Load data from SQL database.

        Args:
            query: SQL query to execute
            table: Table name (alternative to query)
            columns: Columns to select
            where: WHERE clause conditions
            limit: Maximum rows to retrieve
            chunksize: Number of rows per chunk for memory efficiency
            **kwargs: Additional pandas read_sql parameters

        Returns:
            Loaded DataFrame

        Raises:
            DataLoadException: If query execution fails
        """
        # Build query if not provided
        if not query and table:
            query = self._build_query(table, columns, where, limit)
        elif not query:
            raise DataLoadException("No query or table specified")

        self.logger.info(f"Executing SQL query: {query[:100]}...")

        # Use configured chunk size if not provided
        if chunksize is None:
            chunksize = self.config.batch_size if self.config.batch_size > 0 else None

        try:
            connection = self._get_connection()

            if chunksize:
                # Read in chunks for memory efficiency
                chunks = []
                total_rows = 0

                for chunk in pd.read_sql(
                    query,
                    connection,
                    chunksize=chunksize,
                    **kwargs
                ):
                    chunks.append(chunk)
                    total_rows += len(chunk)
                    self.logger.debug(f"Loaded chunk: {len(chunk)} rows (total: {total_rows})")

                df = pd.concat(chunks, ignore_index=True)
                self.logger.info(f"Loaded {total_rows} rows from database")
            else:
                # Read entire result at once
                df = pd.read_sql(query, connection, **kwargs)
                self.logger.info(f"Loaded {len(df)} rows from database")

            return df

        except Exception as e:
            raise DataLoadException(f"Failed to execute query: {e}")

    def _build_query(
        self,
        table: str,
        columns: Optional[List[str]] = None,
        where: Optional[str] = None,
        limit: Optional[int] = None
    ) -> str:
        """Build SQL query from parameters."""
        # Select clause
        select_clause = ', '.join(columns) if columns else '*'
        query = f"SELECT {select_clause} FROM {table}"

        # Where clause
        if where:
            query += f" WHERE {where}"

        # Limit clause
        if limit:
            engine = self.config.connection_params.get('engine', 'sqlite').lower()
            if engine in ['mssql']:
                query = query.replace('SELECT', f'SELECT TOP {limit}')
            else:
                query += f" LIMIT {limit}"

        return query

    def load_tables(self, tables: List[str], **kwargs) -> Dict[str, pd.DataFrame]:
        """
        Load multiple tables from database.

        Args:
            tables: List of table names
            **kwargs: Parameters for load method

        Returns:
            Dictionary mapping table names to DataFrames
        """
        result = {}

        for table in tables:
            try:
                df = self.load(table=table, **kwargs)
                result[table] = df
                self.logger.info(f"Loaded table '{table}': {len(df)} rows")
            except Exception as e:
                self.logger.error(f"Failed to load table '{table}': {e}")
                if not self.config.connection_params.get('skip_errors', False):
                    raise

        return result

    def execute(self, query: str) -> Any:
        """
        Execute arbitrary SQL query.

        Args:
            query: SQL query to execute

        Returns:
            Query result
        """
        try:
            connection = self._get_connection()
            result = connection.execute(query)
            self.logger.info(f"Executed query: {query[:100]}...")
            return result
        except Exception as e:
            raise DataLoadException(f"Query execution failed: {e}")

    def get_tables(self) -> List[str]:
        """Get list of available tables in database."""
        engine = self.config.connection_params.get('engine', 'sqlite').lower()

        if engine == 'sqlite':
            query = "SELECT name FROM sqlite_master WHERE type='table'"
        elif engine == 'postgresql':
            query = "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        elif engine == 'mysql':
            query = "SHOW TABLES"
        elif engine == 'mssql':
            query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
        elif engine == 'oracle':
            query = "SELECT table_name FROM user_tables"
        else:
            raise DataLoadException(f"Unsupported database engine: {engine}")

        df = self.load(query=query)
        return df.iloc[:, 0].tolist()

    def get_table_info(self, table: str) -> Dict[str, Any]:
        """
        Get information about a database table.

        Args:
            table: Table name

        Returns:
            Dictionary with table information
        """
        # Get row count
        count_query = f"SELECT COUNT(*) FROM {table}"
        count_df = self.load(query=count_query)
        row_count = count_df.iloc[0, 0]

        # Get sample data
        sample_df = self.load(table=table, limit=5)

        # Get column info
        engine = self.config.connection_params.get('engine', 'sqlite').lower()
        if engine == 'sqlite':
            info_query = f"PRAGMA table_info({table})"
        elif engine in ['postgresql', 'mysql']:
            info_query = f"SELECT * FROM {table} LIMIT 0"
        else:
            info_query = f"SELECT TOP 0 * FROM {table}"

        return {
            'table': table,
            'row_count': row_count,
            'columns': list(sample_df.columns),
            'dtypes': sample_df.dtypes.to_dict(),
            'sample': sample_df.to_dict('records')
        }

    def validate_connection(self) -> bool:
        """Validate database connection."""
        try:
            self._get_connection()
            # Test with simple query
            engine = self.config.connection_params.get('engine', 'sqlite').lower()
            if engine == 'sqlite':
                self.execute("SELECT 1")
            else:
                self.execute("SELECT 1 AS test")
            return True
        except Exception as e:
            self.logger.error(f"Connection validation failed: {e}")
            return False

    def close(self):
        """Close database connection."""
        if self.connection:
            try:
                self.connection.close()
                self.logger.info("Database connection closed")
            except:
                pass
        if self.engine:
            try:
                self.engine.dispose()
            except:
                pass
        self.connection = None
        self.engine = None

    def __del__(self):
        """Cleanup connections on deletion."""
        self.close()