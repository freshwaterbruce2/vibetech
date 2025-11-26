# Security Policy

## Supported Versions

This monorepo contains multiple projects with different version support:

### Web Applications
| Project | Version | Supported          |
| ------- | ------- | ------------------ |
| business-booking-platform | 2.0.x | :white_check_mark: |
| digital-content-builder | 1.0.x | :white_check_mark: |
| iconforge | 1.0.x | :white_check_mark: |
| shipping-pwa | 1.x.x | :white_check_mark: |
| vibe-tech-lovable | 1.x.x | :white_check_mark: |

### Desktop Applications
| Project | Version | Supported          |
| ------- | ------- | ------------------ |
| nova-agent | 1.6.x | :white_check_mark: |
| deepcode-editor | 1.0.x | :white_check_mark: |

### Mobile Applications
| Project | Version | Supported          |
| ------- | ------- | ------------------ |
| Vibe-Tutor | 1.0.x | :white_check_mark: |

### Backend & Services
| Project | Version | Supported          |
| ------- | ------- | ------------------ |
| vibe-tech-backend | 1.x.x | :white_check_mark: |
| crypto-enhanced | 1.x.x | :white_check_mark: |

### Workspace
| Project | Version | Supported          |
| ------- | ------- | ------------------ |
| Workspace Root | 0.0.0 | :white_check_mark: |

## Reporting a Vulnerability

### Where to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities via:
- **GitHub Security Advisories (Preferred):** Use the "Security" tab → "Report a vulnerability"
- This ensures secure, private communication and proper tracking

### Critical Security Projects

The following projects require immediate attention for security issues:
- **crypto-enhanced**: Financial safety vulnerabilities (trading system with live capital)
- **nova-agent**: Desktop AI agent with filesystem access
- **deepcode-editor**: Code editor with arbitrary code execution capabilities

### What to Include

When reporting a vulnerability, please include:

1. **Description** - Clear description of the vulnerability
2. **Impact** - What the vulnerability could allow an attacker to do
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Affected Versions** - Which projects/versions are affected
5. **Proposed Fix** - If you have suggestions for fixing it

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Every 5 business days
- **Resolution Target:**
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 60 days

### What to Expect

**If Accepted:**
1. We will confirm the vulnerability
2. Work on a fix in a private branch
3. Release a security patch
4. Credit you in the security advisory (unless you prefer to remain anonymous)
5. Publish a CVE if applicable

**If Declined:**
1. We will explain why we don't consider it a security issue
2. Suggest alternative solutions if applicable
3. You may request a second review

## Security Best Practices

This repository follows these security practices:

### Dependency Management
- Regular `pnpm audit` checks in CI/CD
- Automated Dependabot updates
- Lockfile (`pnpm-lock.yaml`) committed to repository

### Secrets Management & API Key Best Practices

#### Storage Requirements
- **NEVER** commit API keys, tokens, or credentials to git
- **USE** `.env` files for all secrets (automatically excluded via `.gitignore`)
- **STORE** production keys in secure environment variables only
- **VERIFY** `.gitignore` includes: `.env`, `.env.*`, `*_credentials.json`, `*.pem`, `*.key`

#### API Key Lifecycle Management

**1. Key Generation**
- Generate unique keys per environment (dev, staging, production)
- Use least privilege principle (minimum permissions required)
- Enable IP whitelisting when available
- Document key purpose and owner in secure key vault

**2. Key Storage**
- **Development:** Store in `.env` file at project root
- **Production:** Use environment variables or secret management service
- **CI/CD:** Use GitHub Actions secrets or equivalent
- **Desktop Apps:** Use OS-native secure storage (Windows Credential Manager, macOS Keychain)

**3. Key Rotation Policy**
- **Regular Rotation:** Every 90 days for production keys
- **Immediate Rotation:** If key compromise suspected or team member leaves
- **Automated Alerts:** Set calendar reminders for rotation deadlines
- **Zero Downtime:** Use dual-key strategy during rotation (old + new keys active simultaneously)

**4. Key Revocation Procedures**
If keys are compromised:
1. **Immediate:** Revoke compromised keys at provider (Kraken, OpenAI, DeepSeek, etc.)
2. **Audit:** Search git history for exposed keys: `git log -S "api_key" --all`
3. **Rotate:** Generate new keys with different values
4. **Monitor:** Check account activity logs for unauthorized usage
5. **Report:** If financial impact, follow security incident reporting procedures

#### Pre-commit Secret Detection
Git pre-commit hook automatically scans for:
- Hardcoded API keys matching patterns (e.g., `sk-`, `api_key=`)
- AWS credentials (`AKIA...`, `aws_secret_access_key`)
- Private keys (`.pem`, `.key` files)
- JWT tokens and OAuth secrets
- Database connection strings with passwords

**Bypass (NOT Recommended):**
```bash
git commit --no-verify  # Only use for false positives, never for real secrets
```

#### Project-Specific Key Security

**Crypto Trading (crypto-enhanced):**
- Kraken API keys in `projects/crypto-enhanced/.env`
- Require separate keys for read (monitoring) and write (trading)
- Never use master API keys (generate sub-keys with limited permissions)

**AI Services (nova-agent, deepcode-editor, digital-content-builder):**
- DeepSeek API keys: `DEEPSEEK_API_KEY` in `.env`
- OpenAI API keys: `OPENAI_API_KEY` in `.env`
- Use separate keys per project to track usage and costs

**Web Applications:**
- Clerk authentication: `VITE_CLERK_PUBLISHABLE_KEY` (public), `CLERK_SECRET_KEY` (private)
- Database URLs: Never commit connection strings with passwords
- Payment APIs (Square): Use test keys in development, production keys only in prod env

#### Environment Variable Validation
Each project should validate required environment variables at startup:

```typescript
// Example validation (TypeScript)
const requiredEnvVars = ['DEEPSEEK_API_KEY', 'DATABASE_URL'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
```

#### Key Access Logging
For sensitive operations:
- Log API key usage (last 4 characters only: `sk-...xyz123`)
- Monitor failed authentication attempts
- Alert on unusual API usage patterns (rate spikes, geographic anomalies)

### Code Security
- Pre-commit hooks scan for hardcoded secrets
- ESLint security rules enabled
- TypeScript strict mode for type safety

### Crypto Trading System Security

#### Financial Safety Limits
- **Max Position Size:** $10 USD per trade (hardcoded safety limit)
- **Max Total Exposure:** $10 USD (maximum 1 concurrent position)
- **Trading Pair:** XLM/USD only (no unauthorized pairs)
- **Account Balance:** ~$135 USD (verify with `python check_status.py`)

#### API Key Security
- **Storage:** Stored in `projects/crypto-enhanced/.env` (never committed to git)
- **Permissions:** Read-only keys recommended for monitoring, write-only for trading
- **Rotation:** Rotate API keys every 90 days or if compromise suspected
- **Environment:** Separate keys for development and production (never reuse)

#### Monitoring Requirements
- **Daily Health Checks:** Run `python check_status.py` to verify system health
- **Weekly Performance:** Run `python performance_monitor.py weekly` for detailed metrics
- **Log Reviews:** Monitor `logs/trading.log` for errors and anomalies
- **Pre-commit Validation:** Git hooks automatically check trading system health before commits

#### Emergency Procedures
**Immediate Shutdown:**
```bash
# Stop trading immediately
docker-compose down  # If using Docker
# OR
pkill -f start_live_trading.py  # Kill running process
```

**Emergency Actions Required:**
1. Stop all running trading processes immediately
2. Review `trading.db` for open positions and orders
3. Manually close positions on Kraken web interface if needed
4. Investigate logs in `logs/` directory for root cause
5. Do NOT restart trading until issue is fully understood and resolved

#### 30-Day Validation & Capital Scaling
**IMPORTANT: NO CAPITAL SCALING until system validation complete**

**Validation Period:** October 13 - November 12, 2025

**Readiness Criteria (ALL required):**
1. Minimum 50 complete trades (statistical significance)
2. Win rate ≥52% (above break-even with fees)
3. Positive expectancy >$0.01 per trade (proven edge)
4. Max drawdown <30% (acceptable risk tolerance)

**Check Readiness:**
```bash
python performance_monitor.py monthly  # Review 30-day validation report
```

**System Status Indicators:**
- "READY TO SCALE" - All 4 criteria met, safe to add capital
- "NOT READY" - One or more criteria failed, continue monitoring
- "INSUFFICIENT DATA" - Less than 50 trades, continue collecting data

#### Database Backup & Recovery
- **Backup Location:** `trading.db` backups stored in `D:\databases\backups\`
- **Frequency:** Automatic daily backups at 11:59 PM via `setup_monitoring.ps1`
- **Retention:** 30 days of trading data (automatic cleanup)
- **Compression:** 97% compression ratio for backup files
- **Recovery:** To restore: `cp D:\databases\backups\trading_backup_YYYYMMDD.db trading.db`

#### Pre-commit Safety Checks
Git pre-commit hook automatically validates:
- No more than 5 failed orders in last 24 hours
- No more than 10 errors in last 100 log lines
- Critical files exist (config.py, nonce_state_primary.json)
- Open positions with P&L < -$5 trigger warnings

**Bypass (Emergency Only):**
```bash
git commit --no-verify -m "emergency fix"  # Use with extreme caution
```

#### Rate Limiting & API Protection
- **Kraken API Limits:** Built-in rate limiting in `kraken_client.py`
- **Nonce Management:** Nanosecond precision to prevent replay attacks
- **WebSocket Health:** Automatic reconnection with exponential backoff
- **Circuit Breaker:** Automatic trading halt after consecutive failures

### Web Application Security
- Input validation with Zod schemas
- CORS configured for production domains
- Content Security Policy headers
- XSS protection via React's automatic escaping

## Known Security Considerations

### Crypto Trading System
- Requires manual YES confirmation for live trading
- Database stores trade history (protect `trading.db`)
- WebSocket connections use token authentication
- Nonce management prevents replay attacks

### Database Security (D:\databases\)

**MANDATORY POLICY:** All databases, logs, and large datasets MUST be stored on D:\ drive, never in C:\dev\ or project directories.

#### Database Storage Structure
```
D:\
├── databases/
│   ├── database.db              # IconForge unified database
│   ├── trading.db               # Crypto trading system
│   ├── nova_activity.db         # Nova Agent activity tracking
│   ├── vibe_learning.db         # Vibe-Tutor learning system
│   └── backups/                 # Daily automated backups
├── logs/                        # Application logs
├── data/                        # Large datasets
└── learning/                    # ML training data
```

#### File Permissions (Windows 11)
**Recommended ACL Configuration:**
```powershell
# Restrict database access to current user only
icacls "D:\databases\trading.db" /inheritance:r
icacls "D:\databases\trading.db" /grant:r "$env:USERNAME:(F)"
icacls "D:\databases\trading.db" /remove "Users"

# Apply to all databases
Get-ChildItem D:\databases\*.db | ForEach-Object {
    icacls $_.FullName /inheritance:r
    icacls $_.FullName /grant:r "$env:USERNAME:(F)"
    icacls $_.FullName /remove "Users"
}
```

**Verification:**
```powershell
icacls "D:\databases\trading.db"  # Should show only your username with Full Control
```

#### Backup Strategy

**Automated Backups:**
- **Frequency:** Daily at 11:59 PM (trading system), on-demand for others
- **Location:** `D:\databases\backups\`
- **Retention:** 30 days (automatic cleanup)
- **Format:** SQLite database files with `.db` extension
- **Compression:** 97% compression ratio using gzip

**Manual Backup Commands:**
```powershell
# Backup trading database
Copy-Item "D:\databases\trading.db" "D:\databases\backups\trading_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"

# Backup all databases
Get-ChildItem D:\databases\*.db | ForEach-Object {
    Copy-Item $_.FullName "D:\databases\backups\$($_.BaseName)_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
}
```

**Restore Procedures:**
```powershell
# Restore from backup (stop application first!)
Copy-Item "D:\databases\backups\trading_20251125.db" "D:\databases\trading.db" -Force
```

#### Encryption Considerations

**Sensitive Databases (Recommended for Production):**
- **trading.db:** Contains financial transaction history
- **nova_activity.db:** User behavior and activity patterns
- **vibe_learning.db:** Student learning data

**Encryption Options:**
1. **SQLite Encryption Extension (SEE):** Commercial solution for transparent encryption
2. **SQLCipher:** Open-source SQLite encryption (AES-256)
3. **Windows BitLocker:** Full disk encryption for D:\ drive (easiest option)
4. **File-level Encryption:** Windows EFS (Encrypting File System)

**Enable BitLocker (Recommended):**
```powershell
# Check if BitLocker is enabled
Get-BitLockerVolume -MountPoint "D:"

# Enable BitLocker (requires admin)
Enable-BitLocker -MountPoint "D:" -EncryptionMethod Aes256 -UsedSpaceOnly
```

#### Access Control

**Application-Only Access:**
- Databases should only be accessed by their respective applications
- No direct user editing of production databases
- Use SQLite browser tools for debugging only (development environment)

**Connection Security:**
```typescript
// Example: Secure database connection (TypeScript)
const dbPath = process.env.DATABASE_PATH || 'D:\\databases\\database.db';

// Validate path is on D:\ drive
if (!dbPath.startsWith('D:\\databases\\')) {
  throw new Error('Database must be stored on D:\\databases\\');
}

// Open with read-only flag for reporting
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
```

#### Integrity Checks

**Regular Validation:**
```bash
# SQLite integrity check
sqlite3 D:\databases\trading.db "PRAGMA integrity_check;"

# Quick check (faster)
sqlite3 D:\databases\trading.db "PRAGMA quick_check;"
```

**Automated Monitoring:**
- Run integrity checks before automated backups
- Alert on corruption detection
- Maintain last known good backup separately

#### Database-Specific Security

**Trading Database (trading.db):**
- Contains financial transaction history (high sensitivity)
- Backup before ANY schema changes
- Enable WAL mode: `PRAGMA journal_mode=WAL;`
- Set busy timeout: `PRAGMA busy_timeout=5000;`

**Nova Activity Database (nova_activity.db):**
- User activity and deep work tracking
- 30-day data retention policy (automatic cleanup)
- Session duration validation (max 8 hours)

**IconForge Database (database.db):**
- User-generated content and metadata
- Regular vacuum to reclaim space: `VACUUM;`
- Foreign key enforcement: `PRAGMA foreign_keys=ON;`

#### Migration Safety

**Schema Changes:**
1. **Backup First:** Always create backup before migrations
2. **Test on Copy:** Test migration on database copy first
3. **Rollback Plan:** Document rollback procedure
4. **Downtime Notice:** Plan for application downtime during migration

**Migration Example:**
```bash
# 1. Backup
cp D:\databases\trading.db D:\databases\backups\trading_pre_migration_$(date +%Y%m%d).db

# 2. Test on copy
cp D:\databases\trading.db D:\databases\trading_test.db
sqlite3 D:\databases\trading_test.db < migration.sql

# 3. Verify test
sqlite3 D:\databases\trading_test.db "PRAGMA integrity_check;"

# 4. Apply to production
sqlite3 D:\databases\trading.db < migration.sql
```

#### Performance & Security Trade-offs

**WAL Mode (Recommended):**
- Better concurrency for read-heavy workloads
- Creates `-wal` and `-shm` files alongside `.db` file
- Checkpoint regularly to merge WAL into main database

**Secure Delete (Optional):**
```sql
PRAGMA secure_delete = ON;  -- Overwrites deleted data (performance impact)
```

**Memory Limits:**
```sql
PRAGMA max_page_count = 1073741823;  -- Limit database size to ~1TB
PRAGMA cache_size = -64000;          -- 64MB cache (negative = KB)
```

### Development Environment
- D:\ drive used for all persistent data (databases, logs, datasets)
- C:\dev\ for code only (no data storage)
- Local development uses `localhost` only
- Production builds must set proper `CORS` origins
- PowerShell execution policy: `RemoteSigned` or `Bypass` for development scripts

## Deployment Security Best Practices

### Production Build Security

#### Environment Separation
**CRITICAL: Never mix development and production environments**

**Development (.env.development):**
```bash
NODE_ENV=development
DEEPSEEK_API_KEY=sk-dev-...
DATABASE_URL=D:\databases\dev_database.db
CORS_ORIGIN=http://localhost:5173
```

**Production (.env.production):**
```bash
NODE_ENV=production
DEEPSEEK_API_KEY=sk-prod-...
DATABASE_URL=D:\databases\database.db
CORS_ORIGIN=https://yourdomain.com
```

#### Build-Time Security Checks

**Pre-build Validation:**
```bash
# Run before production builds
pnpm run quality              # Lint + typecheck + build
pnpm audit                    # Check for vulnerable dependencies
pnpm audit --fix              # Auto-fix vulnerabilities
```

**Environment Variable Validation:**
```typescript
// Example: Validate production environment
if (process.env.NODE_ENV === 'production') {
  if (process.env.DATABASE_URL?.includes('dev_')) {
    throw new Error('Development database detected in production build!');
  }
  if (!process.env.CORS_ORIGIN?.startsWith('https://')) {
    throw new Error('Production must use HTTPS CORS origins');
  }
}
```

#### Dependency Security

**Regular Audits:**
```bash
# Check for vulnerabilities
pnpm audit

# Update to latest secure versions
pnpm update

# Remove unused dependencies
pnpm prune
```

**Lockfile Integrity:**
- Always commit `pnpm-lock.yaml` to git
- Use `pnpm install --frozen-lockfile` in CI/CD
- Never manually edit `pnpm-lock.yaml`

**Dependabot Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### CI/CD Security (GitHub Actions)

#### Secrets Management

**GitHub Actions Secrets:**
- Store all production API keys as GitHub Actions secrets
- Use environment-specific secrets (development, staging, production)
- Rotate secrets every 90 days or when team members leave

**Example Workflow with Secrets:**
```yaml
name: Deploy Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Build
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY_PROD }}
          DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
        run: pnpm run build:production
```

#### Workflow Security

**Best Practices:**
- Use pinned action versions: `actions/checkout@v4.1.0` (not `@v4` or `@main`)
- Limit workflow permissions: `permissions: read-all`
- Use environment protection rules for production
- Require manual approval for production deployments

**Example Secure Workflow:**
```yaml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4.1.0
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Desktop Application Security

#### Code Signing (Windows)

**Why Code Signing Matters:**
- Prevents "Unknown Publisher" warnings
- Establishes trust with Windows SmartScreen
- Required for Microsoft Store distribution

**Electron/Tauri Code Signing:**
```javascript
// electron-builder.config.js
module.exports = {
  win: {
    certificateFile: process.env.WINDOWS_CERT_FILE,
    certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
    sign: './sign.js',  // Custom signing script
    signingHashAlgorithms: ['sha256']
  }
}
```

**Certificate Management:**
- Store certificates securely (not in git)
- Use hardware security modules (HSM) for production certificates
- Renew certificates before expiration (typically 1-3 years)

#### Auto-Update Security

**Secure Update Server:**
- Serve updates over HTTPS only
- Implement signature verification for update packages
- Use content delivery network (CDN) with DDoS protection

**Electron Example:**
```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'yourusername',
  repo: 'yourrepo',
  token: process.env.GITHUB_TOKEN  // Private repo access
});

// Verify signature before installing
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.checkForUpdatesAndNotify();
```

### Mobile Application Security (Capacitor)

#### Android APK Signing

**Generate Keystore (Once):**
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Signing Configuration:**
```gradle
// android/app/build.gradle
android {
  signingConfigs {
    release {
      storeFile file(System.getenv("RELEASE_KEYSTORE_FILE"))
      storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD")
      keyAlias System.getenv("RELEASE_KEY_ALIAS")
      keyPassword System.getenv("RELEASE_KEY_PASSWORD")
    }
  }
}
```

**Keystore Security:**
- Store keystore file securely (NOT in git)
- Use GitHub Actions secrets for CI/CD builds
- Backup keystore in secure location (losing it means you can't update your app)

#### Play Store Security

**App Permissions:**
- Request minimum permissions required
- Declare all permissions in `AndroidManifest.xml`
- Provide clear justification for sensitive permissions

**ProGuard/R8 (Code Obfuscation):**
```gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

### Web Application Deployment

#### CORS Security

**Development:**
```typescript
// Allow localhost during development
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
```

**Production:**
```typescript
// Strict origin control in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### Content Security Policy (CSP)

**Web Application Headers:**
```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.deepseek.com https://api.kraken.com"
  );
  next();
});
```

#### HTTPS Enforcement

**Production Requirements:**
- All production deployments MUST use HTTPS
- Redirect HTTP to HTTPS automatically
- Use HSTS headers to enforce HTTPS

**Express Example:**
```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// HSTS header
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### Update & Patching Policy

#### Security Patch Timeline

**Critical Vulnerabilities:**
- **Response Time:** Within 24 hours of disclosure
- **Deployment:** Emergency patch deployed within 48 hours
- **Notification:** Users notified via in-app notification or email

**High Severity:**
- **Response Time:** Within 72 hours
- **Deployment:** Patch deployed within 7 days
- **Notification:** Release notes and changelog

**Medium/Low Severity:**
- **Response Time:** Within 2 weeks
- **Deployment:** Included in next regular release (monthly)
- **Notification:** Changelog only

#### Dependency Update Strategy

**Automated Updates (Dependabot):**
- Security patches: Auto-merge if tests pass
- Minor version bumps: Weekly review and merge
- Major version bumps: Manual review required

**Manual Testing:**
```bash
# Before merging dependency updates
pnpm install
pnpm run quality        # Lint + typecheck + build
pnpm run test:all       # All test suites
pnpm run crypto:test    # Crypto trading system tests
```

### Monitoring & Incident Response

#### Production Monitoring

**Application Monitoring:**
- Log all authentication attempts (success and failure)
- Monitor API usage patterns for anomalies
- Track error rates and alert on spikes
- Monitor database query performance

**Trading System Monitoring:**
- Daily automated health checks (`python check_status.py`)
- Weekly performance reviews (`python performance_monitor.py weekly`)
- Real-time alerting on failed trades or errors
- P&L tracking and anomaly detection

#### Incident Response Procedure

**Security Incident Detected:**
1. **Assess:** Determine severity and scope
2. **Contain:** Isolate affected systems (e.g., stop trading, revoke API keys)
3. **Investigate:** Review logs, identify root cause
4. **Remediate:** Apply fixes, rotate credentials
5. **Document:** Create post-mortem report
6. **Communicate:** Notify affected users if applicable

**Post-Incident Review:**
- Document timeline of events
- Identify preventive measures
- Update security policies
- Conduct team training if needed

## Security Contacts

- **Primary Maintainer:** (Add your contact info)
- **Security Team:** (Add team contact if applicable)

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve our security.

---

Last Updated: 2025-11-25
