# BACKEND API GUIDE - Node.js/Express Server

## Overview

**Location:** `C:\dev\backend\`  
**Server:** Express.js on Node.js  
**Database:** SQLite3 at `D:\vibe-tech-data\vibetech.db`  
**Port:** 9001 (configurable via `PORT` env var)  
**CORS:** Enabled for all origins  

---

## Architecture

```
backend/
├── server.js              # Main development server
├── server-production.js   # Production server (with security)
├── middleware/            # Custom middleware (rate limiting, auth)
├── config/                # Configuration files
├── data/                  # Static data or migrations
└── package.json           # Dependencies
```

---

## Database Schema

### Location & Access

**Database Path:** `D:\vibe-tech-data\vibetech.db`  
**Type:** SQLite3  
**Auto-Created:** Yes (if directory doesn't exist)

**Access Commands:**
```bash
# Query from command line
sqlite3 D:\vibe-tech-data\vibetech.db "SELECT * FROM blog_posts;"

# Open interactive
sqlite3 D:\vibe-tech-data\vibetech.db

# Backup
cp D:\vibe-tech-data\vibetech.db D:\vibe-tech-data\vibetech-backup-$(date +%Y%m%d).db
```

### Tables

#### 1. **blog_posts** (Primary Table)

```sql
CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,                    -- UUID
  title TEXT NOT NULL,                    -- Post title
  slug TEXT UNIQUE NOT NULL,              -- URL-friendly slug
  excerpt TEXT,                           -- Short description
  content TEXT NOT NULL,                  -- Full markdown/HTML content
  category TEXT NOT NULL,                 -- Category tag
  author TEXT DEFAULT 'Vibe Tech',        -- Author name
  image TEXT,                             -- Cover image URL
  tags TEXT,                              -- JSON array of tags
  featured BOOLEAN DEFAULT 0,             -- Featured post flag
  published BOOLEAN DEFAULT 0,            -- Published status
  
  -- SEO Fields
  seo_title TEXT,                         -- Meta title (60 chars)
  seo_description TEXT,                   -- Meta description (160 chars)
  focus_keyword TEXT,                     -- Primary keyword
  canonical_url TEXT,                     -- Canonical URL
  no_index BOOLEAN DEFAULT 0,             -- Robots noindex
  no_follow BOOLEAN DEFAULT 0,            -- Robots nofollow
  
  -- Affiliate Marketing
  affiliate_recommendations TEXT,         -- JSON array of products
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME                   -- When published
);
```

#### 2. **customers**
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **invoices**
```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  amount_cents INTEGER NOT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  job_id TEXT,
  paid BOOLEAN DEFAULT 0
);
```

#### 4. **leads**
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new'
);
```

---

## API Endpoints

### Base URL
**Development:** `http://localhost:9001`  
**Production:** `https://your-domain.com`

### Health & Status

#### `GET /`
Returns API information and available endpoints.

**Response:**
```json
{
  "message": "Vibe Tech Backend API",
  "status": "running",
  "endpoints": {
    "health": "/api/health",
    "customers": "/api/customers",
    "invoices": "/api/invoices",
    "leads": "/api/leads",
    "blog": "/api/blog"
  }
}
```

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "database": "D:\\vibe-tech-data\\vibetech.db"
}
```

---

### Blog Post Workflow (Complete Guide)

#### **CREATE** - `POST /api/blog`

Creates a new blog post with full SEO and affiliate support.

**Request Body:**
```json
{
  "title": "10 Best React Libraries for 2025",
  "excerpt": "Discover the top React libraries that will boost your productivity in 2025.",
  "content": "# Introduction\n\nReact has evolved...",
  "category": "Web Development",
  "author": "Vibe Tech",
  "image": "https://example.com/react-libraries.jpg",
  "tags": ["react", "javascript", "libraries", "2025"],
  
  "featured": true,
  "published": true,
  
  // SEO Fields
  "seo_title": "10 Best React Libraries for 2025 - Complete Guide",
  "seo_description": "Explore the top React libraries for 2025 including state management, UI components, and developer tools. Boost your productivity today!",
  "focus_keyword": "react libraries 2025",
  "canonical_url": "https://vibetech.com/blog/react-libraries-2025",
  "no_index": false,
  "no_follow": false,
  
  // Affiliate Recommendations
  "affiliate_recommendations": [
    {
      "product": "React Mastery Course",
      "link": "https://affiliate.com/react-course?ref=vibetech",
      "price": "$99",
      "description": "Master React in 30 days"
    }
  ]
}
```

**Required Fields:**
- `title` (string, required)
- `content` (string, required)

**Auto-Generated Fields:**
- `id`: UUID v4
- `slug`: Generated from title if not provided
- `published_at`: Current timestamp if `published: true`
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "10 Best React Libraries for 2025",
  "slug": "10-best-react-libraries-for-2025",
  "excerpt": "Discover the top React libraries...",
  "content": "# Introduction...",
  "category": "Web Development",
  "author": "Vibe Tech",
  "image": "https://example.com/react-libraries.jpg",
  "tags": ["react", "javascript", "libraries", "2025"],
  "featured": true,
  "published": true,
  "seo_title": "10 Best React Libraries for 2025 - Complete Guide",
  "seo_description": "Explore the top React libraries...",
  "focus_keyword": "react libraries 2025",
  "canonical_url": "https://vibetech.com/blog/react-libraries-2025",
  "no_index": false,
  "no_follow": false,
  "affiliate_recommendations": [...],
  "created_at": "2025-10-01T12:00:00.000Z",
  "updated_at": "2025-10-01T12:00:00.000Z",
  "published_at": "2025-10-01T12:00:00.000Z"
}
```

**Error Responses:**
- `400`: Missing required fields or duplicate slug
- `500`: Database error

---

#### **READ** - `GET /api/blog`

Get all blog posts (with optional filters).

**Query Parameters:**
- `published` (boolean): Filter by published status
- `featured` (boolean): Filter by featured status
- `category` (string): Filter by category
- `limit` (number): Limit number of results
- `offset` (number): Pagination offset

**Example:**
```
GET /api/blog?published=true&featured=true&limit=10
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "10 Best React Libraries for 2025",
    "slug": "10-best-react-libraries-for-2025",
    "excerpt": "Discover the top React libraries...",
    "category": "Web Development",
    "featured": true,
    "published": true,
    "created_at": "2025-10-01T12:00:00.000Z"
  },
  // More posts...
]
```

---

#### **READ ONE** - `GET /api/blog/:slug`

Get single blog post by slug (SEO-friendly URL).

**Example:**
```
GET /api/blog/10-best-react-libraries-for-2025
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "10 Best React Libraries for 2025",
  "slug": "10-best-react-libraries-for-2025",
  "content": "# Introduction\n\nFull content here...",
  "tags": ["react", "javascript"],
  "affiliate_recommendations": [...],
  // All fields included
}
```

**Error Responses:**
- `404`: Post not found

---

#### **UPDATE** - `PUT /api/blog/:id`

Update existing blog post.

**Request Body:** Same as CREATE (all fields optional except those you want to update)

**Key Behavior:**
- If changing `published` from false → true, sets `published_at` timestamp
- Updates `updated_at` automatically
- Validates unique slug constraint

**Response (200 OK):**
```json
{
  // Updated post object
}
```

**Error Responses:**
- `400`: Duplicate slug
- `404`: Post not found
- `500`: Database error

---

#### **DELETE** - `DELETE /api/blog/:id`

Permanently delete a blog post.

**Response:**
- `204 No Content` (success)
- `404`: Post not found
- `500`: Database error

---

## SEO Best Practices

### 1. **SEO Title**
```json
"seo_title": "Primary Keyword | Secondary Keyword | Brand"
```
- Max 60 characters
- Include focus keyword
- Front-load important terms

### 2. **SEO Description**
```json
"seo_description": "Compelling description that includes focus keyword and secondary keywords naturally. Call to action at end."
```
- 155-160 characters optimal
- Include focus keyword naturally
- Write for humans first, search engines second

### 3. **Focus Keyword**
```json
"focus_keyword": "react libraries 2025"
```
- 1-3 word phrase
- What people actually search for
- Use in title, first paragraph, and naturally throughout

### 4. **Canonical URL**
```json
"canonical_url": "https://vibetech.com/blog/react-libraries-2025"
```
- Prevent duplicate content issues
- Use absolute URLs
- Match slug structure

### 5. **Robots Meta Tags**
```json
"no_index": false,  // Allow indexing (default)
"no_follow": false  // Allow link following (default)
```
- Set `no_index: true` for duplicate content, thin pages
- Set `no_follow: true` for user-generated content pages

---

## Affiliate Marketing Integration

### Structure
```json
"affiliate_recommendations": [
  {
    "product": "Product Name",
    "link": "https://affiliate-url.com/?ref=vibetech",
    "price": "$99",
    "description": "Why this is recommended",
    "image": "https://product-image.jpg",
    "rating": 4.5,
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Con 1"]
  }
]
```

### Best Practices
1. **Disclosure:** Always include affiliate disclosure
2. **Relevance:** Only recommend truly relevant products
3. **Honesty:** Include both pros and cons
4. **Testing:** Test affiliate links before publishing
5. **Tracking:** Use UTM parameters for analytics

### Rendering in Frontend
```jsx
{post.affiliate_recommendations?.map(product => (
  <AffiliateCard
    key={product.link}
    product={product}
    disclosure="This is an affiliate link. We may earn commission."
  />
))}
```

---

## Security Features

### Production Server (server-production.js)

**Helmet.js Security Headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Rate Limiting:**
```javascript
// Applied to all routes
limiter: {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requests per window
}
```

---

## Running the Server

### Development
```bash
cd backend
npm install
node server.js

# Or with nodemon (auto-restart)
npm install -g nodemon
nodemon server.js
```

### Production
```bash
cd backend
npm install --production
node server-production.js
```

### Environment Variables
```bash
# .env file
PORT=9001
NODE_ENV=production
DB_PATH=D:\vibe-tech-data\vibetech.db
LOG_LEVEL=info
```

---

## Common Operations

### Add New Blog Post (cURL)
```bash
curl -X POST http://localhost:9001/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Post",
    "content": "Post content here",
    "category": "Tech",
    "published": true,
    "seo_title": "My New Post - SEO Title",
    "seo_description": "SEO description here",
    "focus_keyword": "new post"
  }'
```

### Publish Draft Post
```bash
curl -X PUT http://localhost:9001/api/blog/{id} \
  -H "Content-Type: application/json" \
  -d '{"published": true}'
```

### Get All Published Posts
```bash
curl http://localhost:9001/api/blog?published=true
```

### Delete Post
```bash
curl -X DELETE http://localhost:9001/api/blog/{id}
```

---

## Database Maintenance

### Backup
```bash
# Manual backup
sqlite3 D:\vibe-tech-data\vibetech.db ".backup 'D:\vibe-tech-data\vibetech-backup.db'"

# Automated (add to cron/scheduled task)
sqlite3 D:\vibe-tech-data\vibetech.db ".backup 'D:\vibe-tech-data\vibetech-backup-$(date +%Y%m%d).db'"
```

### Vacuum (Optimize)
```bash
sqlite3 D:\vibe-tech-data\vibetech.db "VACUUM;"
```

### Query Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_blog_published ON blog_posts(published);
CREATE INDEX idx_blog_featured ON blog_posts(featured);
CREATE INDEX idx_blog_category ON blog_posts(category);
CREATE INDEX idx_blog_published_at ON blog_posts(published_at);
```

---

## Troubleshooting

### Database Locked Error
```bash
# Check for other connections
lsof D:\vibe-tech-data\vibetech.db

# Fix: Close other SQLite connections or restart server
```

### Port Already in Use
```bash
# Find process using port 9001
netstat -ano | findstr :9001

# Kill process (Windows)
taskkill /PID <pid> /F
```

### CORS Errors
```javascript
// In server.js, update CORS config
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

---

## Testing

### Manual API Testing
```bash
# Using cURL (see examples above)

# Or using tools:
# - Postman: https://www.postman.com/
# - Insomnia: https://insomnia.rest/
# - HTTPie: https://httpie.io/
```

### Automated Testing
```javascript
// test/blog.test.js
const request = require('supertest');
const app = require('../server');

describe('Blog API', () => {
  test('GET /api/blog returns posts', async () => {
    const response = await request(app).get('/api/blog');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

---

**Last Updated:** October 1, 2025  
**Server Version:** 1.0.0  
**Database:** SQLite3 at D:\vibe-tech-data\vibetech.db
