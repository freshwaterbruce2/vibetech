// Production-ready Express server for Vibe Tech
// Load environment variables first
require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const compression = require('compression');

// Import custom modules
const { getDatabaseConfig } = require('./config/database');
const { logger, requestLogger } = require('./config/logger');
const {
  securityHeaders,
  authRateLimit,
  apiRateLimit,
  validateRequest,
  blogValidation,
  leadValidation,
  errorHandler
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware (apply first)
app.use(securityHeaders);

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8082')
      .split(',')
      .map(url => url.trim());
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiRateLimit);

// Database initialization
let db;

function initializeDatabase() {
  const dbConfig = getDatabaseConfig();
  
  logger.info('Initializing database', {
    path: dbConfig.path,
    directory: dbConfig.directory,
    isProduction: dbConfig.isProduction
  });

  db = new sqlite3.Database(dbConfig.path, (err) => {
    if (err) {
      logger.error('Database connection failed', { error: err.message, path: dbConfig.path });
      process.exit(1);
    } else {
      logger.info('Database connected successfully', { path: dbConfig.path });
      createTables();
    }
  });
}

function createTables() {
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
    `, (err) => {
      if (err) logger.error('Failed to create customers table', { error: err.message });
    });

    // Invoices table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        amount_cents INTEGER NOT NULL,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        job_id TEXT,
        paid BOOLEAN DEFAULT 0
      )
    `, (err) => {
      if (err) logger.error('Failed to create invoices table', { error: err.message });
    });

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
    `, (err) => {
      if (err) logger.error('Failed to create leads table', { error: err.message });
    });

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
    `, (err) => {
      if (err) {
        logger.error('Failed to create blog_posts table', { error: err.message });
      } else {
        logger.info('Database tables initialized successfully');
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error.message;
    res.status(503).json(healthCheck);
  }
});

// Blog authentication endpoint (with strict rate limiting)
app.post('/api/auth', authRateLimit, (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    logger.warn('Authentication attempt without password', { ip: req.ip });
    return res.status(400).json({ error: 'Password is required' });
  }
  
  if (password === process.env.ADMIN_PASSWORD) {
    logger.info('Successful authentication', { ip: req.ip });
    // In a real app, you'd generate and return a JWT token
    res.json({ success: true, message: 'Authentication successful' });
  } else {
    logger.warn('Failed authentication attempt', { ip: req.ip });
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Blog posts endpoints
app.get('/api/blog', (req, res) => {
  const { published } = req.query;
  let query = 'SELECT * FROM blog_posts';
  const params = [];
  
  if (published === 'true') {
    query += ' WHERE published = 1';
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error('Failed to fetch blog posts', { error: err.message, query });
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    } else {
      logger.debug('Blog posts fetched', { count: rows.length, published });
      res.json(rows);
    }
  });
});

app.get('/api/blog/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM blog_posts WHERE id = ? OR slug = ?', [id, id], (err, row) => {
    if (err) {
      logger.error('Failed to fetch blog post', { error: err.message, id });
      res.status(500).json({ error: 'Failed to fetch blog post' });
    } else if (!row) {
      res.status(404).json({ error: 'Blog post not found' });
    } else {
      logger.debug('Blog post fetched', { id: row.id, title: row.title });
      res.json(row);
    }
  });
});

app.post('/api/blog', blogValidation, validateRequest, (req, res) => {
  const {
    id, title, slug, excerpt, content, category, author, image, tags,
    featured, published, seo_title, seo_description, focus_keyword,
    canonical_url, no_index, no_follow, affiliate_recommendations
  } = req.body;

  const now = new Date().toISOString();
  const publishedAt = published ? now : null;

  const query = `
    INSERT OR REPLACE INTO blog_posts (
      id, title, slug, excerpt, content, category, author, image, tags,
      featured, published, seo_title, seo_description, focus_keyword,
      canonical_url, no_index, no_follow, affiliate_recommendations,
      updated_at, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id, title, slug, excerpt, content, category, author || 'Vibe Tech',
    image, typeof tags === 'string' ? tags : JSON.stringify(tags || []),
    featured ? 1 : 0, published ? 1 : 0, seo_title, seo_description,
    focus_keyword, canonical_url, no_index ? 1 : 0, no_follow ? 1 : 0,
    typeof affiliate_recommendations === 'string' ? affiliate_recommendations : JSON.stringify(affiliate_recommendations || []),
    now, publishedAt
  ];

  db.run(query, params, function(err) {
    if (err) {
      logger.error('Failed to save blog post', { error: err.message, title });
      res.status(500).json({ error: 'Failed to save blog post' });
    } else {
      logger.info('Blog post saved', { id, title, published: !!published });
      res.json({ success: true, id, message: 'Blog post saved successfully' });
    }
  });
});

// Leads endpoints  
app.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      logger.error('Failed to fetch leads', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch leads' });
    } else {
      logger.debug('Leads fetched', { count: rows.length });
      res.json(rows);
    }
  });
});

app.post('/api/leads', leadValidation, validateRequest, (req, res) => {
  const { id, company_name, contact_email, contact_name, phone, notes } = req.body;
  
  const query = `
    INSERT INTO leads (id, company_name, contact_email, contact_name, phone, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [id, company_name, contact_email, contact_name, phone, notes], function(err) {
    if (err) {
      logger.error('Failed to create lead', { error: err.message, company_name });
      res.status(500).json({ error: 'Failed to create lead' });
    } else {
      logger.info('Lead created', { id, company_name, contact_email });
      res.json({ success: true, id: this.lastID });
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 Not Found', { url: req.originalUrl, method: req.method, ip: req.ip });
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown handling
function gracefulShutdown() {
  logger.info('Received shutdown signal, closing database connection...');
  
  if (db) {
    db.close((err) => {
      if (err) {
        logger.error('Error closing database', { error: err.message });
      } else {
        logger.info('Database connection closed successfully');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize and start server
initializeDatabase();

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV,
    pid: process.pid
  });
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;