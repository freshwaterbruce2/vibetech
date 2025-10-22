/**
 * Test PostgreSQL Connection and Identify Constraint Error Source
 */

import fs from 'fs';
import path from 'path';

// Check if we can connect to the PostgreSQL mentioned in environment variables
const connectionString = process.env.POSTGRES_CONNECTION_STRING ||
                        'postgresql://user:password@localhost:5432/dbname';

console.log('=== PostgreSQL Connection Test ===\n');
console.log(`Environment variable POSTGRES_CONNECTION_STRING: ${process.env.POSTGRES_CONNECTION_STRING}`);
console.log(`Attempting to connect to: ${connectionString}\n`);

// Try using built-in node-postgres if available
try {
  const pg = await import('pg');
  const { Client } = pg.default || pg;

  async function testConnection() {
    const client = new Client({
      connectionString: connectionString
    });

    try {
      console.log('Attempting to connect to PostgreSQL...');
      await client.connect();
      console.log('✓ Successfully connected to PostgreSQL!\n');

      // Query for the specific constraint
      const constraintQuery = `
        SELECT
          n.nspname as schema_name,
          t.tablename as table_name,
          con.conname as constraint_name
        FROM pg_constraint con
        LEFT JOIN pg_class c ON c.oid = con.conrelid
        LEFT JOIN pg_tables t ON t.tablename = c.relname
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE con.conname = 'IDX_1b101e71abe9ce72d910e95b9f'
      `;

      console.log('Searching for constraint IDX_1b101e71abe9ce72d910e95b9f...');
      const result = await client.query(constraintQuery);

      if (result.rows.length > 0) {
        console.log('✓ Found constraint!');
        console.log('Details:', result.rows[0]);
      } else {
        console.log('✗ Constraint not found in this database');

        // Check indexes too
        const indexQuery = `
          SELECT * FROM pg_indexes
          WHERE indexname = 'IDX_1b101e71abe9ce72d910e95b9f'
        `;

        console.log('\nChecking indexes...');
        const indexResult = await client.query(indexQuery);

        if (indexResult.rows.length > 0) {
          console.log('✓ Found as index!');
          console.log('Details:', indexResult.rows[0]);
        } else {
          console.log('✗ Not found as index either');
        }
      }

      // List all tables
      const tablesQuery = `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        LIMIT 10
      `;

      console.log('\nSample tables in database:');
      const tablesResult = await client.query(tablesQuery);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });

    } catch (err) {
      console.log('✗ Connection failed!');
      console.log('Error:', err.message);

      if (err.code === 'ECONNREFUSED') {
        console.log('\nPostgreSQL is not running on localhost:5432');
        console.log('This confirms the error is from an external source.\n');
      }
    } finally {
      await client.end();
    }
  }

  testConnection();

} catch (moduleErr) {
  console.log('pg module not installed.');
  console.log('To test PostgreSQL connection, install it with:');
  console.log('  npm install pg\n');

  // Check if any app has pg installed

  console.log('Checking for pg module in existing projects...\n');

  const projectDirs = [
    'C:\\dev\\projects\\active\\web-apps\\vibe-booking-platform',
    'C:\\dev\\projects\\active\\desktop-apps\\nova-agent-current',
    'C:\\dev\\backend'
  ];

  projectDirs.forEach(dir => {
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.dependencies && pkg.dependencies.pg) {
          console.log(`✓ Found pg in ${dir}`);
          console.log(`  Version: ${pkg.dependencies.pg}`);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });

  console.log('\nNote: The constraint error IDX_1b101e71abe9ce72d910e95b9f');
  console.log('is likely coming from:');
  console.log('1. A cloud PostgreSQL database (Heroku, AWS RDS, etc.)');
  console.log('2. A remote development/staging server');
  console.log('3. A Docker container running PostgreSQL');
  console.log('4. An ORM that generates this constraint name pattern');
}