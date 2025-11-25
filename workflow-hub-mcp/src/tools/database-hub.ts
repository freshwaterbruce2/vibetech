import Database from 'better-sqlite3';

const DATABASES = {
  trading: 'C:\\dev\\projects\\crypto-enhanced\\trading.db',
  nova: 'D:\\databases\\nova_activity.db',
  unified: 'D:\\databases\\database.db',
};

interface QueryDatabaseArgs {
  database: 'trading' | 'nova' | 'unified';
  query: string;
}

export async function queryDatabase(args: QueryDatabaseArgs) {
  try {
    // Security: Only allow SELECT queries
    const normalizedQuery = args.query.trim().toUpperCase();
    if (!normalizedQuery.startsWith('SELECT')) {
      return {
        content: [
          {
            type: 'text',
            text: '⛔ Security Error: Only SELECT queries are allowed for safety.',
          },
        ],
        isError: true,
      };
    }

    const dbPath = DATABASES[args.database];
    if (!dbPath) {
      return {
        content: [
          {
            type: 'text',
            text: `⛔ Unknown database: ${args.database}. Available: trading, nova, unified`,
          },
        ],
        isError: true,
      };
    }

    const db = new Database(dbPath, { readonly: true });

    const results = db.prepare(args.query).all();

    db.close();

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📊 Query returned no results.',
          },
        ],
      };
    }

    // Format results as markdown table
    const columns = Object.keys(results[0] as object);
    const header = `| ${columns.join(' | ')} |`;
    const separator = `| ${columns.map(() => '---').join(' | ')} |`;

    const rows = results.slice(0, 50).map((row: any) => {
      const values = columns.map((col) => {
        const val = row[col];
        return val === null ? 'NULL' : String(val);
      });
      return `| ${values.join(' | ')} |`;
    });

    const table = [
      `📊 **Query Results** (${results.length} rows):`,
      '',
      header,
      separator,
      ...rows,
    ];

    if (results.length > 50) {
      table.push('', `_... and ${results.length - 50} more rows_`);
    }

    return {
      content: [
        {
          type: 'text',
          text: table.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Database query error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getDatabaseSummary() {
  try {
    const results: string[] = ['📚 **Database Summary**:\n'];

    for (const [name, path] of Object.entries(DATABASES)) {
      try {
        const db = new Database(path, { readonly: true });

        // Get table count
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];

        results.push(`**${name.toUpperCase()} Database** (${path})`);
        results.push(`  Tables: ${tables.length}`);

        // Get row counts for each table
        for (const table of tables.slice(0, 5)) {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as any;
          results.push(`    - ${table.name}: ${count.count} rows`);
        }

        if (tables.length > 5) {
          results.push(`    ... and ${tables.length - 5} more tables`);
        }

        results.push('');

        db.close();
      } catch (error) {
        results.push(`**${name.toUpperCase()} Database**: ❌ Error - ${error}`);
        results.push('');
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting database summary: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
