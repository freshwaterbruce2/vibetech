const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup on D: drive
const dbDir = 'D:\\vibe-tech-data';
const dbPath = path.join(dbDir, 'vibetech.db');

// Create directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoices table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        amount_cents INTEGER NOT NULL,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        job_id TEXT,
        paid BOOLEAN DEFAULT 0
      )
    `);

    // Leads table
    db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        phone TEXT,
        status TEXT DEFAULT 'new'
      )
    `);

    // Blog posts table
    db.run(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        author TEXT DEFAULT 'Vibe Tech',
        image TEXT,
        tags TEXT, -- JSON string of tags array
        featured BOOLEAN DEFAULT 0,
        published BOOLEAN DEFAULT 0,
        seo_title TEXT,
        seo_description TEXT,
        focus_keyword TEXT,
        canonical_url TEXT,
        no_index BOOLEAN DEFAULT 0,
        no_follow BOOLEAN DEFAULT 0,
        affiliate_recommendations TEXT, -- JSON string of affiliate recommendations
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME
      )
    `);

    console.log('Database tables initialized');
  });
}

// Helper function to generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// API Routes

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Vibe Tech Backend API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      customers: '/api/customers',
      invoices: '/api/invoices',
      leads: '/api/leads',
      blog: '/api/blog'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: dbPath });
});

// Customers
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

app.post('/api/customers', (req, res) => {
  const { email, full_name, phone } = req.body;
  const id = generateId();
  
  db.run(
    'INSERT INTO customers (id, email, full_name, phone) VALUES (?, ?, ?, ?)',
    [id, email, full_name, phone],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { email, full_name, phone } = req.body;
  
  db.run(
    'UPDATE customers SET email = ?, full_name = ?, phone = ? WHERE id = ?',
    [email, full_name, phone, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(204).send();
    }
  });
});

// Invoices
app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices ORDER BY issued_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

app.post('/api/invoices', (req, res) => {
  const { amount_cents, job_id, paid } = req.body;
  const id = generateId();
  
  db.run(
    'INSERT INTO invoices (id, amount_cents, job_id, paid) VALUES (?, ?, ?, ?)',
    [id, amount_cents, job_id, paid || 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

// Leads
app.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

app.post('/api/leads', (req, res) => {
  const { company_name, contact_email, contact_name, notes, phone, status } = req.body;
  const id = generateId();
  
  db.run(
    'INSERT INTO leads (id, company_name, contact_email, contact_name, notes, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, company_name, contact_email, contact_name, notes, phone, status || 'new'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM leads WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

app.put('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const { company_name, contact_email, contact_name, notes, phone, status } = req.body;
  
  db.run(
    'UPDATE leads SET company_name = ?, contact_email = ?, contact_name = ?, notes = ?, phone = ?, status = ? WHERE id = ?',
    [company_name, contact_email, contact_name, notes, phone, status, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT * FROM leads WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM leads WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(204).send();
    }
  });
});

// Blog Posts API

// Get all blog posts (published and drafts for admin, only published for public)
app.get('/api/blog', (req, res) => {
  const { published_only = 'true' } = req.query;
  
  let query = 'SELECT * FROM blog_posts';
  if (published_only === 'true') {
    query += ' WHERE published = 1';
  }
  query += ' ORDER BY created_at DESC';
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Parse JSON fields
      const posts = rows.map(post => ({
        ...post,
        tags: post.tags ? JSON.parse(post.tags) : [],
        affiliate_recommendations: post.affiliate_recommendations ? JSON.parse(post.affiliate_recommendations) : [],
        featured: Boolean(post.featured),
        published: Boolean(post.published),
        no_index: Boolean(post.no_index),
        no_follow: Boolean(post.no_follow)
      }));
      res.json(posts);
    }
  });
});

// Get single blog post by slug or ID
app.get('/api/blog/:identifier', (req, res) => {
  const { identifier } = req.params;
  
  // Try to find by slug first, then by ID
  db.get(
    'SELECT * FROM blog_posts WHERE slug = ? OR id = ?',
    [identifier, identifier],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (!row) {
        res.status(404).json({ error: 'Blog post not found' });
      } else {
        // Parse JSON fields
        const post = {
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : [],
          affiliate_recommendations: row.affiliate_recommendations ? JSON.parse(row.affiliate_recommendations) : [],
          featured: Boolean(row.featured),
          published: Boolean(row.published),
          no_index: Boolean(row.no_index),
          no_follow: Boolean(row.no_follow)
        };
        res.json(post);
      }
    }
  );
});

// Create new blog post
app.post('/api/blog', (req, res) => {
  const {
    title,
    excerpt,
    content,
    category,
    author = 'Vibe Tech',
    image,
    tags = [],
    featured = false,
    published = false,
    seo_title,
    seo_description,
    focus_keyword,
    canonical_url,
    no_index = false,
    no_follow = false,
    affiliate_recommendations = []
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const id = generateId();
  const slug = req.body.slug || generateSlug(title);
  const published_at = published ? new Date().toISOString() : null;

  db.run(`
    INSERT INTO blog_posts (
      id, title, slug, excerpt, content, category, author, image, tags,
      featured, published, seo_title, seo_description, focus_keyword,
      canonical_url, no_index, no_follow, affiliate_recommendations, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, title, slug, excerpt, content, category, author, image,
    JSON.stringify(tags), featured ? 1 : 0, published ? 1 : 0,
    seo_title, seo_description, focus_keyword, canonical_url,
    no_index ? 1 : 0, no_follow ? 1 : 0, JSON.stringify(affiliate_recommendations),
    published_at
  ], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'A blog post with this slug already exists' });
      } else {
        res.status(500).json({ error: err.message });
      }
    } else {
      // Return the created post
      db.get('SELECT * FROM blog_posts WHERE id = ?', [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          const post = {
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : [],
            affiliate_recommendations: row.affiliate_recommendations ? JSON.parse(row.affiliate_recommendations) : [],
            featured: Boolean(row.featured),
            published: Boolean(row.published),
            no_index: Boolean(row.no_index),
            no_follow: Boolean(row.no_follow)
          };
          res.status(201).json(post);
        }
      });
    }
  });
});

// Update blog post
app.put('/api/blog/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    slug,
    excerpt,
    content,
    category,
    author,
    image,
    tags = [],
    featured = false,
    published = false,
    seo_title,
    seo_description,
    focus_keyword,
    canonical_url,
    no_index = false,
    no_follow = false,
    affiliate_recommendations = []
  } = req.body;

  // If publishing for the first time, set published_at
  db.get('SELECT published FROM blog_posts WHERE id = ?', [id], (err, currentPost) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!currentPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const wasPublished = Boolean(currentPost.published);
    const published_at = (!wasPublished && published) ? new Date().toISOString() : undefined;

    let updateQuery = `
      UPDATE blog_posts SET
        title = ?, slug = ?, excerpt = ?, content = ?, category = ?, author = ?,
        image = ?, tags = ?, featured = ?, published = ?, seo_title = ?,
        seo_description = ?, focus_keyword = ?, canonical_url = ?, no_index = ?,
        no_follow = ?, affiliate_recommendations = ?, updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [
      title, slug, excerpt, content, category, author, image,
      JSON.stringify(tags), featured ? 1 : 0, published ? 1 : 0,
      seo_title, seo_description, focus_keyword, canonical_url,
      no_index ? 1 : 0, no_follow ? 1 : 0, JSON.stringify(affiliate_recommendations)
    ];

    if (published_at) {
      updateQuery += ', published_at = ?';
      params.push(published_at);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    db.run(updateQuery, params, function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          res.status(400).json({ error: 'A blog post with this slug already exists' });
        } else {
          res.status(500).json({ error: err.message });
        }
      } else {
        // Return the updated post
        db.get('SELECT * FROM blog_posts WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            const post = {
              ...row,
              tags: row.tags ? JSON.parse(row.tags) : [],
              affiliate_recommendations: row.affiliate_recommendations ? JSON.parse(row.affiliate_recommendations) : [],
              featured: Boolean(row.featured),
              published: Boolean(row.published),
              no_index: Boolean(row.no_index),
              no_follow: Boolean(row.no_follow)
            };
            res.json(post);
          }
        });
      }
    });
  });
});

// Delete blog post
app.delete('/api/blog/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM blog_posts WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Blog post not found' });
    } else {
      res.status(204).send();
    }
  });
});

// Publish/unpublish blog post
app.patch('/api/blog/:id/publish', (req, res) => {
  const { id } = req.params;
  const { published } = req.body;
  
  const published_at = published ? new Date().toISOString() : null;
  
  db.run(
    'UPDATE blog_posts SET published = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [published ? 1 : 0, published_at, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Blog post not found' });
      } else {
        res.json({ published: Boolean(published), published_at });
      }
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Database location: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});