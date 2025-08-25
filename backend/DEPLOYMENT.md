# Vibe Tech Backend - Production Deployment Guide

## 🚀 Quick Start

The backend is now production-ready with enterprise-grade security, logging, and monitoring.

### Environment Requirements
- Node.js 18+ (LTS recommended)
- Docker (optional but recommended)
- Minimum 512MB RAM
- 1GB disk space

## 📋 Deployment Options

### Option 1: Railway Deployment (Recommended - $5/month)

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Deploy from GitHub:**
   ```bash
   # Connect your GitHub repo to Railway
   # Railway will auto-detect Node.js and deploy
   ```

3. **Set environment variables in Railway:**
   ```env
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://yourdomain.com
   ALLOWED_ORIGINS=https://yourdomain.com
   SESSION_SECRET=your-super-secret-key-here
   ADMIN_PASSWORD=your-secure-admin-password
   ```

4. **Database setup:**
   - Railway provides persistent volumes automatically
   - Database will be created at `/app/data/vibetech.db`

### Option 2: Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Edit .env.production with your values
   # Then build and start
   docker-compose up -d
   ```

2. **Or build manually:**
   ```bash
   docker build -t vibe-tech-backend .
   docker run -p 3000:3000 \
     -e NODE_ENV=production \
     -e FRONTEND_URL=https://yourdomain.com \
     -e SESSION_SECRET=your-secret \
     -v vibe-data:/app/data \
     vibe-tech-backend
   ```

### Option 3: Traditional Server Deployment

1. **Clone and install:**
   ```bash
   git clone your-repo
   cd backend
   npm ci --only=production
   ```

2. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   export FRONTEND_URL=https://yourdomain.com
   export SESSION_SECRET=your-secret
   ```

3. **Start with PM2 (recommended for production):**
   ```bash
   npm install -g pm2
   pm2 start server-production.js --name vibe-backend
   pm2 startup
   pm2 save
   ```

## 🔧 Environment Variables

### Required Variables
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
SESSION_SECRET=your-super-secret-session-key
ADMIN_PASSWORD=your-admin-password
```

### Optional Variables
```env
DATABASE_PATH=/app/data/vibetech.db
DATABASE_DIR=/app/data
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## 🔒 Security Features

### ✅ Implemented Security Measures
- **Helmet.js**: Security headers protection
- **Rate limiting**: API abuse prevention
- **Input validation**: SQL injection and XSS protection  
- **CORS configuration**: Cross-origin request control
- **Request logging**: Comprehensive audit trail
- **Error handling**: Secure error responses
- **Graceful shutdown**: Clean process termination

### 🛡️ Security Headers Applied
- Content Security Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```bash
GET /health
```

Response:
```json
{
  "uptime": 12345,
  "message": "OK", 
  "timestamp": 1693766400000,
  "environment": "production",
  "version": "1.0.0"
}
```

### Log Files
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output**: Structured JSON in production

### Monitoring Commands
```bash
# Check health
npm run health

# View logs (Docker)
docker-compose logs -f backend

# Check PM2 status
pm2 status
pm2 logs vibe-backend
```

## 🗄️ Database Management

### SQLite Configuration
- **Development**: Uses `D:\vibe-tech-data\vibetech.db`
- **Production**: Uses `/app/data/vibetech.db` (or configured path)
- **Auto-migration**: Tables created automatically on startup

### Database Schema
- **customers**: Customer information
- **invoices**: Invoice tracking
- **leads**: Lead management
- **blog_posts**: Blog content with SEO and affiliate features

### Backup Strategy
```bash
# Create database backup
cp /app/data/vibetech.db /app/data/vibetech-backup-$(date +%Y%m%d).db

# Restore from backup
cp /app/data/vibetech-backup-20250824.db /app/data/vibetech.db
```

## 🔄 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /api/blog?published=true` - Published blog posts
- `GET /api/blog/:id` - Single blog post

### Protected Endpoints (require authentication)
- `POST /api/auth` - Admin authentication
- `POST /api/blog` - Create/update blog post
- `GET /api/leads` - Fetch leads
- `POST /api/leads` - Create lead

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in environment variables
   export PORT=3001
   ```

2. **Database permission errors**
   ```bash
   # Ensure data directory exists and is writable
   mkdir -p /app/data
   chmod 755 /app/data
   ```

3. **CORS errors**
   ```bash
   # Update ALLOWED_ORIGINS to match your domain
   export ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

4. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=1024 server-production.js
   ```

### Debug Mode
```bash
# Run with debug logging
export LOG_LEVEL=debug
npm start
```

## 📈 Performance Optimization

### Applied Optimizations
- **Compression**: Gzip compression enabled
- **Connection pooling**: SQLite connection management
- **Request validation**: Input sanitization
- **Error caching**: Structured error handling
- **Process management**: Graceful shutdowns

### Scaling Recommendations
- Use Redis for session storage (multi-instance)
- Implement database connection pooling
- Add CDN for static assets
- Use load balancer for multiple instances

## 🎯 Next Steps After Deployment

1. **Test all endpoints** with production URLs
2. **Verify health checks** are responding
3. **Check logs** for any errors
4. **Test blog publishing** workflow
5. **Verify CORS** with frontend domain
6. **Set up monitoring** alerts
7. **Configure backups** schedule

## 📞 Support

For deployment issues:
1. Check logs first: `docker-compose logs` or `pm2 logs`
2. Verify environment variables are set correctly
3. Test health endpoint: `curl https://yourapi.com/health`
4. Check CORS configuration matches your domain

**Your backend is now enterprise-ready for production! 🎉**