# 🔒 SECURITY DEPLOYMENT CHECKLIST
**Vibe Booking Platform - Production Security Guide**

Created: October 1, 2025

---

## ✅ Phase 1: IMMEDIATE (Do Today)

### 1.1 Add Security Headers to Netlify

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Action:**
1. Copy `netlify-booking-platform-config.toml` to your GitHub repo as `netlify.toml`
2. Commit and push to GitHub
3. Netlify will auto-deploy with new security headers

**Files:**
- `C:\dev\netlify-booking-platform-config.toml` → Copy to your vibe-booking-platform repo

**Verification:**
```bash
# Test security headers after deploy
curl -I https://vibe-booking-prod.netlify.app
```

Look for these headers:
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Content-Security-Policy: ...`
- ✅ `Strict-Transport-Security: ...`

---

### 1.2 Configure Environment Variables

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Action:**
1. Go to: https://app.netlify.com/projects/vibe-booking-prod/settings/env
2. Add each required variable from `.env.booking-platform.example`
3. Set proper scope and context for each

**Priority Variables (Must Add First):**

```bash
# Database (Choose one)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# OR
DATABASE_URL=postgresql://...

# Payment Processing (Required for bookings)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Production key
STRIPE_SECRET_KEY=sk_live_...            # NEVER use VITE_ prefix!
STRIPE_WEBHOOK_SECRET=whsec_...

# Security (Required)
JWT_SECRET=generate_a_random_32_char_secret_here
SESSION_SECRET=another_random_32_char_secret_here

# Email (Required for confirmations)
SENDGRID_API_KEY=SG.xxx  # OR use SMTP settings
FROM_EMAIL=bookings@yourdomain.com
```

**How to Generate Secrets:**
```bash
# In PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Important:**
- ⚠️ Use `VITE_` prefix ONLY for variables you want exposed to browser
- ⚠️ NEVER prefix secrets with `VITE_` (JWT_SECRET, STRIPE_SECRET_KEY, etc.)
- ⚠️ Use PRODUCTION keys for production, TEST keys for deploy previews

---

### 1.3 Enable Netlify Forms Security

**Status:** ✅ Complete (Already enabled)

**Verification:**
1. Go to: https://app.netlify.com/projects/vibe-booking-prod/settings/forms
2. Confirm forms are enabled
3. Add spam protection (reCAPTCHA recommended)

**Add reCAPTCHA (Recommended):**
1. Get keys: https://www.google.com/recaptcha/admin
2. Add to environment variables:
   ```bash
   VITE_RECAPTCHA_SITE_KEY=6Lc...
   RECAPTCHA_SECRET_KEY=6Lc...
   ```
3. Update forms in your code to use reCAPTCHA

---

## ✅ Phase 2: CRITICAL (This Week)

### 2.1 SSL/HTTPS Configuration

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Verification:**
- ✅ Netlify auto-provisions SSL (Let's Encrypt)
- ✅ Check: https://vibe-booking-prod.netlify.app should work
- ✅ HTTP should redirect to HTTPS (configured in netlify.toml)

**Test:**
```bash
# Should redirect to HTTPS
curl -L http://vibe-booking-prod.netlify.app
```

---

### 2.2 Content Security Policy (CSP) Tuning

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Action:**
1. Deploy your site with default CSP from `netlify.toml`
2. Open browser DevTools Console
3. Look for CSP violations
4. Adjust CSP in `netlify.toml` as needed

**Common CSP Adjustments:**

If you see errors like:
```
Refused to load script from 'https://example.com/script.js' 
because it violates the following Content Security Policy directive...
```

Update CSP in `netlify.toml`:
```toml
Content-Security-Policy = """
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://example.com;
  # Add the blocked domain here ↑
"""
```

**Test Tool:**
- https://csp-evaluator.withgoogle.com/

---

### 2.3 Rate Limiting Setup

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Options:**

**Option A: Cloudflare (Free)**
1. Add your domain to Cloudflare
2. Enable rate limiting rules
3. Point DNS to Netlify
4. Free: 10,000 requests/month

**Option B: Netlify Functions + Redis**
```javascript
// netlify/functions/api-proxy.js
import { rateLimit } from '@netlify/functions'

export const handler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}, async (event, context) => {
  // Your API logic here
})
```

**Option C: Backend Rate Limiting**
Implement in your backend API using express-rate-limit

---

### 2.4 Secrets Management

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Action:**
1. Store backup of all secrets in password manager
2. Document which secrets are used where
3. Set up secret rotation schedule

**Password Managers:**
- 1Password (Recommended for teams)
- Bitwarden (Open source)
- LastPass

**Create Vault Structure:**
```
Vibe Booking Platform/
├── Production/
│   ├── Database Credentials
│   ├── Stripe Live Keys
│   ├── JWT Secrets
│   └── Email API Keys
├── Staging/
│   └── [Test credentials]
└── Development/
    └── [Dev credentials]
```

---

## ✅ Phase 3: IMPORTANT (This Month)

### 3.1 Custom Domain with HTTPS

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Steps:**
1. Purchase domain (Namecheap, Cloudflare, etc.)
2. Add custom domain in Netlify
3. Configure DNS records
4. Enable HTTPS (automatic)

**Guide:** See `DOMAIN-REGISTRATION-GUIDE.md`

---

### 3.2 Security Monitoring

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Recommended Tools:**

**Sentry (Error Tracking):**
```bash
npm install @sentry/react
```
```javascript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

**Logtail (Log Management):**
```bash
npm install @logtail/browser
```

**Uptime Monitoring:**
- UptimeRobot (Free)
- Better Uptime (Paid)
- Pingdom (Paid)

---

### 3.3 Backup Strategy

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**What to Backup:**
- ✅ Database (automated daily)
- ✅ Uploaded files (S3, Cloudinary, etc.)
- ✅ Environment variables (stored in password manager)
- ✅ Code (Git repository)

**Database Backups:**
```bash
# Supabase: Automatic daily backups (keep 7 days on free plan)
# Verify in: https://app.supabase.com/project/_/settings/addons

# Or manual backup script:
# backup-db.sh
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

### 3.4 Penetration Testing

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Free Security Scanners:**

1. **SSL Labs:**
   - https://www.ssllabs.com/ssltest/
   - Tests SSL/TLS configuration

2. **Security Headers:**
   - https://securityheaders.com/
   - Scans HTTP security headers
   - Target: A+ rating

3. **Mozilla Observatory:**
   - https://observatory.mozilla.org/
   - Comprehensive security scan
   - Target: A+ rating

4. **OWASP ZAP:**
   - https://www.zaproxy.org/
   - Free penetration testing tool
   - Scan for common vulnerabilities

**Schedule:** Run quarterly or after major changes

---

## ✅ Phase 4: ONGOING (Maintenance)

### 4.1 Dependency Updates

**Frequency:** Weekly

**Action:**
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

**Automate:**
- Enable Dependabot on GitHub
- Or use Renovate Bot

---

### 4.2 Secret Rotation

**Frequency:** Quarterly (every 3 months)

**Rotate These:**
- ✅ JWT secrets
- ✅ Session secrets
- ✅ Database passwords
- ✅ API keys (if provider allows)

**Process:**
1. Generate new secret
2. Add as secondary key (if supported)
3. Deploy with new key
4. Monitor for 24 hours
5. Remove old key
6. Update password manager

---

### 4.3 Access Reviews

**Frequency:** Monthly

**Review:**
- ✅ Netlify team members
- ✅ GitHub repository access
- ✅ Third-party integrations
- ✅ API keys in use

**Remove:**
- Former team members
- Unused API keys
- Unused integrations

---

### 4.4 Security Logs Review

**Frequency:** Weekly

**Monitor:**
- ✅ Failed login attempts
- ✅ Payment processing errors
- ✅ API rate limit hits
- ✅ CSP violations
- ✅ Error rates in Sentry

**Set Alerts For:**
- Spike in 4xx/5xx errors
- Unusual traffic patterns
- Failed payment attempts
- Database connection failures

---

## 🎯 VERIFICATION CHECKLIST

After completing all phases, verify:

### Security Headers
- [ ] Run: https://securityheaders.com/?q=https://vibe-booking-prod.netlify.app
- [ ] Target: A+ rating

### SSL Configuration  
- [ ] Run: https://www.ssllabs.com/ssltest/analyze.html?d=vibe-booking-prod.netlify.app
- [ ] Target: A+ rating

### Content Security Policy
- [ ] No CSP violations in browser console
- [ ] All external resources whitelisted
- [ ] No 'unsafe-eval' if possible

### Environment Variables
- [ ] All sensitive keys set in Netlify dashboard
- [ ] No secrets in code/git history
- [ ] Proper VITE_ prefix usage
- [ ] Production vs test keys correctly set

### Monitoring
- [ ] Sentry capturing errors
- [ ] Uptime monitoring active
- [ ] Email notifications configured
- [ ] Backup strategy in place

---

## 📞 SECURITY INCIDENT RESPONSE

### If Security Breach Detected:

1. **Immediate Actions:**
   - Rotate ALL API keys and secrets
   - Disable affected services temporarily
   - Enable maintenance mode if needed

2. **Investigation:**
   - Check Netlify deploy logs
   - Review Sentry errors
   - Check database access logs
   - Review email notifications

3. **Communication:**
   - Notify affected users (if required by GDPR)
   - Document incident
   - Update security measures

4. **Prevention:**
   - Identify root cause
   - Implement additional safeguards
   - Update this checklist

---

## 📚 ADDITIONAL RESOURCES

- [Netlify Security Best Practices](https://docs.netlify.com/security/secure-access-to-sites/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [CSP Reference](https://content-security-policy.com/)

---

**Last Updated:** October 1, 2025
**Next Review:** October 8, 2025
