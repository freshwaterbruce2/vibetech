# Advanced CI/CD Implementation

Advanced CI/CD features including preview environments, performance regression testing, dependency management, and security scanning.

## 🚀 Features Overview

### 1. Dependabot Auto-Updates

**File:** `.github/dependabot.yml`

**What it does:**
- ✅ Automatically checks for dependency updates weekly
- ✅ Groups related dependencies together
- ✅ Separate tracking for dev vs production dependencies
- ✅ Supports npm, pip, Docker, and GitHub Actions
- ✅ Auto-labels PRs by type

**Configuration:**
```yaml
# Update frequency: Weekly on Monday 9:00 AM
# Max open PRs: 10 for npm, 5 for pip
# Grouping: Dev dependencies together, prod separately
```

**Auto-merge workflow:**
- Minor and patch updates auto-approved and merged
- Major updates require manual review
- Only applies to dependencies, not devDependencies

### 2. Security Scanning

**File:** `.github/workflows/security-scan.yml`

**Scans included:**

#### CodeQL Analysis
- Static analysis for JavaScript/TypeScript/Python
- Security and quality queries
- Runs on every push and PR

#### NPM Audit
- Checks for known vulnerabilities in npm packages
- Audit level: moderate and above
- Generates JSON report artifact

#### Snyk Security
- Comprehensive vulnerability scanning
- High severity threshold
- SARIF output for GitHub Security tab
- Requires `SNYK_TOKEN` secret

#### Python Security (Bandit + Safety)
- Bandit: Static security analysis
- Safety: Known vulnerability database
- JSON reports uploaded as artifacts

#### Secret Scanning
- TruffleHog for secret detection
- Scans entire git history
- Only verified secrets trigger alerts

#### License Compliance
- Checks all dependency licenses
- Generates license report
- Summary in workflow output

**Setup required:**
```powershell
# Add Snyk token to GitHub secrets
gh secret set SNYK_TOKEN --body "your-snyk-api-token"

# Get token from: https://app.snyk.io/account
```

### 3. Performance Regression Testing

**File:** `.github/workflows/performance-regression.yml`

**Tests included:**

#### Node.js Performance
- Runs Vitest benchmarks
- Tracks performance over time
- Alerts on 50%+ regressions
- Auto-fails if threshold exceeded

#### Python Performance
- pytest-benchmark for crypto system
- Compares against baseline
- JSON results stored

#### API Load Testing
- Locust load testing (100 users)
- 60-second test duration
- Realistic user scenarios
- HTML report generated

#### Build Time Tracking
- Measures build duration
- Comments on PR with results
- Tracks trends over time

**Performance thresholds:**
- Alert: 150% of baseline (50% slower)
- Fail: Yes (prevents merge)
- Storage: GitHub Pages (optional)

### 4. Preview Environments

**File:** `.github/workflows/preview-deploy.yml`

**Features:**
- ✅ Automatic preview deployment for each PR
- ✅ Unique URL per PR (e.g., `pr-42.preview.example.com`)
- ✅ Auto-updates on new commits
- ✅ Auto-cleanup when PR closes
- ✅ Comments PR with preview link

**Deployment options:**

**Option A: Vercel**
```yaml
- name: Deploy to Vercel
  run: vercel --token=${{ secrets.VERCEL_TOKEN }} --prod=false
```

**Option B: Netlify**
```yaml
- name: Deploy to Netlify
  run: netlify deploy --dir=dist --alias=pr-${{ github.event.pull_request.number }}
```

**Option C: Azure Static Web Apps**
```yaml
- name: Deploy to Azure
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
```

**Option D: AWS S3 + CloudFront**
```yaml
- name: Deploy to S3
  run: |
    aws s3 sync dist/ s3://preview-bucket/pr-${{ github.event.pull_request.number }}/
    aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

## 📋 Setup Instructions

### Step 1: Enable Dependabot

```powershell
# Dependabot config is auto-detected
# Just push .github/dependabot.yml to GitHub
git add .github/dependabot.yml
git commit -m "chore(ci): add Dependabot configuration"
git push

# Enable auto-merge workflow
git add .github/workflows/dependabot-automerge.yml
git commit -m "chore(ci): add Dependabot auto-merge"
git push
```

**Update configuration:**
Edit `.github/dependabot.yml`:
```yaml
reviewers:
  - "your-github-username"  # ← Change this
```

### Step 2: Set Up Security Scanning

```powershell
# 1. Enable CodeQL on GitHub
# Settings → Code security and analysis → Enable CodeQL

# 2. Get Snyk API token
# Visit: https://app.snyk.io/account
# Copy API token

# 3. Add to GitHub secrets
gh secret set SNYK_TOKEN --body "your-snyk-api-token-here"

# 4. Push security workflow
git add .github/workflows/security-scan.yml
git commit -m "chore(ci): add security scanning"
git push
```

**Optional: Configure notifications**
```yaml
# In security-scan.yml, add:
- name: Notify on failure
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      // Send Slack/email notification
```

### Step 3: Enable Performance Testing

```powershell
# 1. Install benchmark dependencies
cd C:\dev
pnpm add -D vitest @vitest/ui
pip install pytest-benchmark locust

# 2. Create benchmark tests
# Add to packages/*/tests/benchmarks/

# 3. Push workflow
git add .github/workflows/performance-regression.yml
git commit -m "chore(ci): add performance regression testing"
git push

# 4. Enable GitHub Pages (for benchmark storage)
# Settings → Pages → Source: gh-pages branch
```

**Create example benchmark:**
```typescript
// packages/shared/tests/benchmarks/example.bench.ts
import { bench, describe } from 'vitest'

describe('Performance', () => {
  bench('fast operation', () => {
    // Your code here
  })
})
```

### Step 4: Set Up Preview Environments

**Choose your platform:**

**Option A: Vercel (Recommended for Node.js)**
```powershell
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Get Vercel token
vercel login
vercel whoami
# Visit: https://vercel.com/account/tokens

# 3. Add to GitHub secrets
gh secret set VERCEL_TOKEN --body "your-vercel-token"

# 4. Update preview-deploy.yml
# Replace deployment section with Vercel commands

# 5. Push workflow
git add .github/workflows/preview-deploy.yml
git commit -m "chore(ci): add preview deployments"
git push
```

**Option B: Netlify**
```powershell
# 1. Get Netlify token
# Visit: https://app.netlify.com/user/applications/personal

# 2. Add to GitHub secrets
gh secret set NETLIFY_AUTH_TOKEN --body "your-netlify-token"
gh secret set NETLIFY_SITE_ID --body "your-site-id"

# 3. Update preview-deploy.yml with Netlify commands
```

**Option C: Self-hosted**
```yaml
# Deploy to your own server via SSH
- name: Deploy to server
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USER }}
    key: ${{ secrets.SSH_KEY }}
    script: |
      cd /var/www/previews/pr-${{ github.event.pull_request.number }}
      git pull
      npm install
      npm run build
```

## 🔧 Customization

### Adjust Dependabot Frequency

```yaml
# .github/dependabot.yml
schedule:
  interval: "daily"  # or "weekly", "monthly"
  day: "monday"
  time: "09:00"
  timezone: "America/New_York"
```

### Customize Security Thresholds

```yaml
# security-scan.yml
- name: Run Snyk
  with:
    args: --severity-threshold=medium  # Change: low, medium, high, critical
```

### Adjust Performance Thresholds

```yaml
# performance-regression.yml
- name: Store benchmarks
  with:
    alert-threshold: '200%'  # Alert at 2x slower
    fail-on-alert: false     # Don't fail PR
```

### Custom Preview URL

```yaml
# preview-deploy.yml
environment_url: `https://pr-${prNumber}.staging.yourdomain.com`
```

## 📊 Monitoring & Reports

### View Security Alerts

```
GitHub → Security → Code scanning alerts
GitHub → Security → Dependabot alerts
GitHub → Security → Secret scanning alerts
```

### View Performance Trends

```
GitHub → Actions → Performance Regression Testing
Artifacts → benchmark-results.json
GitHub Pages (if enabled) → benchmark history
```

### View Preview Deployments

```
GitHub → Pull Request → Deployments section
Click "View deployment" button
```

### Download Reports

```powershell
# List artifacts from latest run
gh run view --web

# Download specific artifact
gh run download <run-id> -n npm-audit-results

# View security scanning results
gh api /repos/:owner/:repo/code-scanning/alerts
```

## 🚨 Troubleshooting

### Dependabot PRs Not Auto-Merging

1. Check branch protection rules allow Dependabot
2. Ensure workflow has correct permissions
3. Verify auto-merge is enabled on repo

```powershell
# Enable auto-merge on repo
gh repo edit --enable-auto-merge
```

### Security Scanning Fails

```powershell
# Check Snyk token
gh secret list | Select-String "SNYK"

# Verify CodeQL is enabled
# Settings → Code security and analysis

# Test Snyk locally
snyk test --severity-threshold=high
```

### Performance Tests Timeout

```yaml
# Increase timeout in workflow
jobs:
  node-performance:
    timeout-minutes: 30  # Default: 15
```

### Preview Deploy Fails

```powershell
# Check deployment secrets
gh secret list

# Test deployment locally
vercel --prod=false --token=$VERCEL_TOKEN

# Check deployment logs
gh run view <run-id> --log
```

## 🔒 Security Best Practices

1. ✅ **Rotate tokens regularly** (Snyk, Vercel, etc.)
2. ✅ **Use branch protection** for main/develop
3. ✅ **Require status checks** before merge
4. ✅ **Enable secret scanning** on repo
5. ✅ **Review Dependabot PRs** for major updates
6. ✅ **Monitor security alerts** weekly
7. ✅ **Audit licenses** before using new packages

## 📚 Additional Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Docs](https://codeql.github.com/docs/)
- [Snyk Documentation](https://docs.snyk.io/)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
- [Vercel Deployment](https://vercel.com/docs)
- [Locust Documentation](https://docs.locust.io/)

## 🎯 Success Metrics

Track these metrics to measure CI/CD effectiveness:

| Metric | Target | Current |
|--------|--------|---------|
| **Time to Deploy** | < 10 min | - |
| **Security Alerts** | 0 high/critical | - |
| **Test Coverage** | > 80% | - |
| **Build Success Rate** | > 95% | - |
| **Dependency Updates** | < 7 days old | - |
| **Performance Regressions** | 0 per month | - |

## 🎉 Next Steps

1. ✅ Push all workflows to GitHub
2. ✅ Configure secrets (Snyk, Vercel, etc.)
3. ✅ Create first PR to test workflows
4. ✅ Monitor security dashboard
5. ✅ Review and merge Dependabot PRs
6. ✅ Set up performance baselines
7. ✅ Configure Slack/email notifications

Happy deploying! 🚀
