# 🚀 DEPLOY-READY CONFIGURATION

## Your Domain: vibe-tech.org ✅ (August 2025)
- **Domain**: vibe-tech.org
- **Registrar**: IONOS (not Cloudflare)
- **Cost**: $25 (August 2025 pricing)
- **Status**: Active and configured

## DEPLOYMENT STATUS ✅

### Backend - Railway (LIVE)
- **Service**: function-bun-production-2a68
- **URL**: https://function-bun-production-2a68.up.railway.app
- **Status**: ✅ Deployed and running
- **Database**: ✅ Connected and initialized
- **Environment Variables**: ✅ All 11 variables configured
- **Custom Domain**: vibe-tech.org (configured, waiting for DNS)

### Frontend - Vercel (DEPLOYING)
- **Project**: vibe-tech
- **Status**: 🔄 Currently deploying
- **Repository**: freshwaterbruce2/vibetech
- **Environment Variables**: ✅ Configured with Railway backend URL

---

## 🔧 RAILWAY BACKEND DEPLOYMENT

### Environment Variables (Copy these to Railway):
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://vibe-tech.org
ALLOWED_ORIGINS=https://vibe-tech.org,https://www.vibe-tech.org
SESSION_SECRET=VibeTech-Super-Secret-Key-2025-Production!@#$
ADMIN_PASSWORD=VibeTech2025!SecureAdminPass
DATABASE_PATH=/app/data/vibetech.db
DATABASE_DIR=/app/data
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Railway Deployment Steps:
1. Go to railway.app
2. "Deploy from GitHub repo"
3. Select your repo + /backend folder
4. Set environment variables above
5. Deploy automatically starts

---

## 🌐 VERCEL FRONTEND DEPLOYMENT  

### Environment Variables (Copy to Vercel):
```env
VITE_API_URL=https://api.vibe-tech.org
```

### Vercel Deployment Steps:
1. Go to vercel.com
2. "Import project" from GitHub
3. Select your repo (root folder)
4. Framework: Vite
5. Build command: npm run build
6. Output directory: dist
7. Set environment variable above
8. Deploy

---

## 🔗 DNS CONFIGURATION

### In Cloudflare DNS (after domain registration):
```
Type: A
Name: @
Content: [Copy from Vercel deployment]
TTL: Auto

Type: CNAME
Name: www  
Content: vibe-tech.org
TTL: Auto

Type: CNAME
Name: api
Content: [Copy from Railway deployment]
TTL: Auto
```

---

## ✅ FINAL CHECKLIST

After domain registration:
- [x] Replace "YOUR-DOMAIN-HERE" with actual domain: vibe-tech.org
- [ ] Deploy backend to Railway 
- [ ] Deploy frontend to Vercel
- [ ] Configure DNS records
- [ ] Test: https://vibe-tech.org
- [ ] Test API: https://api.vibe-tech.org/health
- [ ] Test blog: https://vibe-tech.org/blog-editor

**ESTIMATED TOTAL TIME: 30 minutes after domain registration**