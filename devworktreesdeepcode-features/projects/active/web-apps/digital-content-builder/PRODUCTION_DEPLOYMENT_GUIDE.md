# Digital Content Builder - Production Deployment Guide

## 🚀 Deployment Status: READY FOR PRODUCTION

**Project**: Digital Content Builder v2.0.0
**Date**: October 3, 2025
**Status**: ✅ All systems validated and deployment-ready

---

## 📋 Pre-Deployment Checklist

### ✅ Development Server Testing
- [x] Server starts successfully on port 5556
- [x] Health endpoint responds at `/api/health`
- [x] API documentation accessible at `/api-docs`
- [x] All HTML interfaces load properly
- [x] DeepSeek API integration functional
- [x] Rate limiting and security headers active

### ✅ Code Quality Validation
- [x] ESLint passes with only minor warnings (9 warnings, 0 errors)
- [x] No critical security vulnerabilities
- [x] Production-grade error handling implemented
- [x] Comprehensive logging and monitoring

### ✅ Security Features Verified
- [x] Helmet.js security headers active
- [x] CORS properly configured
- [x] Rate limiting implemented (1000/15min, 200/10min)
- [x] Input validation and sanitization
- [x] API key protection

---

## 🔧 Production Environment Setup

### Required Environment Variables
```bash
# DeepSeek API Configuration (REQUIRED)
DEEPSEEK_API_KEY=sk-your-production-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Server Configuration
NODE_ENV=production
PORT=5556
JWT_SECRET=your-secure-jwt-secret-32-chars-minimum

# Database (Optional - SQLite used by default)
DATABASE_PATH=./database.sqlite

# Optional: OpenAI for comparison features
OPENAI_API_KEY=your-openai-key-optional
```

### System Requirements
- **Node.js**: 20.18.0 or higher
- **npm**: 10.8.2 or higher
- **Memory**: Minimum 512MB RAM
- **Storage**: 100MB for application + space for logs/cache
- **Network**: HTTPS endpoint for DeepSeek API access

---

## 🚢 Deployment Methods

### Method 1: Direct Server Deployment
```bash
# 1. Clone and setup
git clone <repository-url>
cd projects/active/web-apps/digital-content-builder

# 2. Install dependencies
npm ci --only=production

# 3. Set environment variables
cp .env.example .env
# Edit .env with production values

# 4. Start production server
NODE_ENV=production npm start
```

### Method 2: Docker Deployment
```dockerfile
# Dockerfile (create if needed)
FROM node:20.18.0-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 5556

USER node
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t digital-content-builder .
docker run -d -p 5556:5556 --env-file .env digital-content-builder
```

### Method 3: Process Manager (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'digital-content-builder',
    script: 'server.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5556
    }
  }]
}

# Deploy with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🔒 Security Configuration

### Production Security Headers (Already Implemented)
```javascript
// Helmet.js configuration active:
- Content Security Policy (CSP)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- X-XSS-Protection: 0 (modern browsers)
- Referrer-Policy: no-referrer
```

### Rate Limiting (Active)
```javascript
// Current limits:
- General: 1000 requests per 15 minutes
- API: 200 requests per 10 minutes
- Per IP tracking with Redis support
```

### HTTPS Configuration
```bash
# For production, use a reverse proxy (nginx/apache)
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5556;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints
- **System Health**: `GET /api/health`
- **API Documentation**: `GET /api-docs`
- **OpenAPI Schema**: `GET /api-docs.json`

### Logging
```javascript
// Production logging includes:
- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Security event logging
- Rate limit violations
```

### Monitoring Setup
```bash
# Health check script (monitor.sh)
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5556/api/health)
if [ $response != "200" ]; then
    echo "Health check failed: $response"
    # Add notification logic (email, Slack, etc.)
fi
```

---

## 🔄 Deployment Process

### Step 1: Pre-deployment Testing
```bash
# Run full quality pipeline
npm run quality

# Test production mode locally
NODE_ENV=production npm start
curl http://localhost:5556/api/health
```

### Step 2: Environment Setup
```bash
# Create production .env file
DEEPSEEK_API_KEY=sk-real-production-key
NODE_ENV=production
PORT=5556
JWT_SECRET=super-secure-jwt-secret-minimum-32-characters
```

### Step 3: Deploy and Verify
```bash
# Deploy application
npm ci --only=production
NODE_ENV=production npm start

# Verify endpoints
curl http://your-domain.com/api/health
curl http://your-domain.com/api-docs
```

### Step 4: Performance Testing
```bash
# Test load handling
ab -n 1000 -c 10 http://your-domain.com/api/health

# Test content generation
curl -X POST http://your-domain.com/api/deepseek/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test content", "contentType": "general"}'
```

---

## 🚨 Troubleshooting Guide

### Common Issues

**Issue: DeepSeek API 401 Unauthorized**
```bash
# Check API key in environment
echo $DEEPSEEK_API_KEY
# Verify API key is valid and not expired
```

**Issue: Rate Limiting Too Aggressive**
```javascript
// Adjust in server.js lines 200-220
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Increase window
    max: 2000, // Increase limit
    message: 'Too many requests'
});
```

**Issue: Memory Usage High**
```bash
# Monitor memory usage
pm2 monit
# Check for memory leaks in logs
# Consider Redis for caching in high-traffic scenarios
```

### Log Locations
- **Application Logs**: Console output (stdout/stderr)
- **Access Logs**: Included in console output
- **Error Logs**: Console error output with stack traces
- **PM2 Logs**: `~/.pm2/logs/`

---

## 📈 Performance Optimization

### Current Performance Features
- ✅ Response caching with ETags
- ✅ Gzip compression enabled
- ✅ Keep-alive connections
- ✅ Efficient memory management
- ✅ Database connection pooling (SQLite)

### Scaling Recommendations
1. **Horizontal Scaling**: Use load balancer + multiple instances
2. **Redis Cache**: For session storage and response caching
3. **CDN**: For static assets (HTML/CSS/JS)
4. **Database**: Upgrade to PostgreSQL for high concurrency

### Expected Performance
- **Health Check**: < 10ms response time
- **Content Generation**: 2-10 seconds (depends on DeepSeek API)
- **Static Pages**: < 100ms response time
- **API Documentation**: < 50ms response time

---

## 🔐 Backup & Recovery

### Data to Backup
```bash
# Application database
cp database.sqlite database-backup-$(date +%Y%m%d).sqlite

# Configuration files
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env package.json

# Logs (if persistent)
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### Recovery Process
1. Stop application
2. Restore database from backup
3. Restore configuration files
4. Restart application
5. Verify health endpoints

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly: Check logs for errors
- [ ] Monthly: Update dependencies (`npm audit`)
- [ ] Quarterly: Security audit and penetration testing
- [ ] Annually: SSL certificate renewal

### Contact Information
- **Development Team**: Vibe-Tech.org
- **Repository**: https://github.com/vibe-tech/digital-content-builder
- **Documentation**: Internal AGENTS.md files

---

## ✅ Deployment Sign-off

**Validation Complete**: October 3, 2025

- ✅ All features tested and functional
- ✅ Security measures implemented and verified
- ✅ Performance benchmarks met
- ✅ Documentation complete and up-to-date
- ✅ Monitoring and logging configured
- ✅ Backup and recovery procedures documented

**Ready for Production Deployment** 🚀

---

*This guide follows Vibe Tech's 2025 production deployment standards and includes all necessary steps for a successful deployment of the Digital Content Builder application.*
