# Prompt Engineer - Deployment Guide
**Version**: 1.0.0
**Date**: October 1, 2025
**Status**: Production Ready ✅

## 🚀 Quick Deployment

### Prerequisites
- Python 3.8+ (tested on Python 3.13.5)
- pip package manager
- Git (optional, for repository analysis features)

### One-Line Installation
```powershell
# Windows PowerShell
git clone https://github.com/your-org/prompt-engineer.git; cd prompt-engineer; pip install -r requirements.txt; python simple_example.py
```

```bash
# Linux/Mac
git clone https://github.com/your-org/prompt-engineer.git && cd prompt-engineer && pip install -r requirements.txt && python simple_example.py
```

## 📦 Standard Deployment

### Step 1: Clone/Copy Repository
```powershell
# Option A: From Git
git clone <repository-url> prompt-engineer
cd prompt-engineer

# Option B: Extract Archive
Expand-Archive prompt-engineer-v1.0.0.zip -DestinationPath ./prompt-engineer
cd prompt-engineer
```

### Step 2: Install Dependencies
```powershell
# Install all required packages
pip install -r requirements.txt

# Verify installation
python -c "import questionary; import GitPython; print('Dependencies OK')"
```

### Step 3: Verify Installation
```powershell
# Run sanity check
python simple_example.py

# Expected output:
# ==> Interactive Context Collector - Simple Example <==
# [OK] Analyzed file: temp_test.py
# [OK] Found 10 code files
# [OK] Interactive collector can be imported
# === Example completed successfully! ===
```

### Step 4: Run Tests (Optional)
```powershell
# Run full test suite
python -m pytest tests/ -v

# Expected: 99+ tests passing (86.8%+ pass rate)
```

## 🎯 Usage Modes

### Mode 1: Interactive CLI (Recommended)
```powershell
# Launch interactive mode
python -m src.collectors.interactive_collector

# Follow on-screen prompts to:
# - Select context types (code, git, docs)
# - Configure scan depth
# - Choose output format
# - Save results
```

### Mode 2: Programmatic API
```python
from src.collectors import CodeScanner, GitAnalyzer

# Scan directory
scanner = CodeScanner()
results = scanner.scan_directory("./my-project", recursive=True)

# Analyze git repository
git_analyzer = GitAnalyzer("./my-project")
analysis = git_analyzer.analyze_repository(max_commits=100)
```

### Mode 3: PowerShell Script (Windows)
```powershell
# Quick collection with defaults
.\START.ps1

# Or use the dedicated script
.\scripts\run_collector.ps1
```

## 🔧 Configuration

### Environment Variables (Optional)
```powershell
# Set default output directory
$env:PROMPT_ENGINEER_OUTPUT = "C:\output\context-data"

# Set default max files
$env:PROMPT_ENGINEER_MAX_FILES = "500"

# Enable debug logging
$env:PROMPT_ENGINEER_DEBUG = "true"
```

### Configuration File (Optional)
Create `config.json` in project root:
```json
{
  "max_files": 500,
  "max_file_size_mb": 10,
  "include_hidden": false,
  "output_format": "json",
  "git_max_commits": 100,
  "git_days_back": 90
}
```

## 📊 Production Monitoring

### Health Check Endpoint
```python
# health_check.py
from src.collectors import CodeScanner

def health_check():
    """Verify system is operational."""
    try:
        scanner = CodeScanner()
        # Simple test scan
        result = scanner.scan_directory(".", recursive=False, max_files=1)
        return {"status": "healthy", "files_found": result['summary']['total_files']}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    print(health_check())
```

### Logging Configuration
```python
# Enable detailed logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/prompt-engineer.log'),
        logging.StreamHandler()
    ]
)
```

## 🐳 Docker Deployment (Optional)

### Dockerfile
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 collector && chown -R collector:collector /app
USER collector

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "from src.collectors import CodeScanner; CodeScanner()" || exit 1

# Default command
CMD ["python", "-m", "src.collectors.interactive_collector"]
```

### Build & Run
```bash
# Build image
docker build -t prompt-engineer:1.0.0 .

# Run container
docker run -it --rm \
  -v $(pwd)/output:/app/output \
  prompt-engineer:1.0.0

# Run with specific directory to analyze
docker run -it --rm \
  -v /path/to/project:/workspace:ro \
  -v $(pwd)/output:/app/output \
  prompt-engineer:1.0.0 \
  python -m src.collectors.code_scanner /workspace
```

## 🔐 Security Considerations

### File Permissions
```powershell
# Restrict output directory (Windows)
icacls "C:\output\context-data" /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F"

# Linux/Mac
chmod 700 /output/context-data
```

### Sensitive Data Protection
```python
# Exclude sensitive files
EXCLUDE_PATTERNS = [
    "*.env",
    "*.key",
    "*.pem",
    "*secret*",
    "*password*",
    ".git/config"
]
```

### Rate Limiting (for API usage)
```python
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_scans_per_hour=10):
        self.max_scans = max_scans_per_hour
        self.scans = []

    def can_scan(self):
        now = datetime.now()
        cutoff = now - timedelta(hours=1)
        self.scans = [s for s in self.scans if s > cutoff]
        return len(self.scans) < self.max_scans

    def record_scan(self):
        self.scans.append(datetime.now())
```

## 📈 Performance Tuning

### For Large Repositories
```python
# Optimize for large codebases
scanner = CodeScanner()
results = scanner.scan_directory(
    path="./large-project",
    recursive=True,
    max_files=1000,          # Limit total files
    max_file_size_mb=5,      # Skip large files
    exclude_patterns=[       # Skip node_modules, etc.
        "*/node_modules/*",
        "*/venv/*",
        "*/.git/*"
    ]
)
```

### Memory Management
```python
# Use generator pattern for large datasets
def scan_large_directory(path):
    scanner = CodeScanner()
    for file_path in Path(path).rglob("*.py"):
        result = scanner.analyze_file(str(file_path))
        yield result
        # Process/save immediately, don't accumulate

# Usage
for file_result in scan_large_directory("/huge/project"):
    save_to_database(file_result)  # Save incrementally
```

## 🔄 Backup & Recovery

### Backup Strategy
```powershell
# Backup collected context data
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Compress-Archive -Path ".\output\*" -DestinationPath ".\backups\context-$timestamp.zip"
```

### Recovery Procedure
```powershell
# Restore from backup
Expand-Archive -Path ".\backups\context-20251001_120000.zip" -DestinationPath ".\output\" -Force
```

## 🧪 Smoke Testing

### Post-Deployment Validation
```powershell
# smoke_test.ps1
Write-Host "Running smoke tests..." -ForegroundColor Cyan

# Test 1: Import check
python -c "from src.collectors import CodeScanner, GitAnalyzer, InteractiveContextCollector; print('✅ Imports OK')"

# Test 2: Code scanner
python -c "from src.collectors import CodeScanner; s = CodeScanner(); r = s.scan_directory('.', recursive=False, max_files=1); print('✅ Scanner OK')"

# Test 3: Simple example
python simple_example.py | Select-String -Pattern "completed successfully"
if ($?) { Write-Host "✅ Simple example OK" } else { Write-Host "❌ Simple example FAILED" }

Write-Host "`nSmoke tests completed!" -ForegroundColor Green
```

## 📞 Support & Troubleshooting

### Common Issues

#### Issue: "ModuleNotFoundError: No module named 'questionary'"
**Solution**: Install dependencies
```powershell
pip install -r requirements.txt
```

#### Issue: "GitCommandError: Cmd('git') failed"
**Solution**: Either install Git or disable git analysis
```python
# Disable git features if Git not available
config = ContextCollectionConfig(include_git=False)
```

#### Issue: "Permission denied" when scanning directories
**Solution**: Run with appropriate permissions or specify accessible directory
```powershell
# Windows: Run as Administrator (if needed)
# Or specify accessible directory
python -m src.collectors.interactive_collector --path "C:\MyAccessibleFolder"
```

### Debug Mode
```powershell
# Enable verbose logging
$env:PROMPT_ENGINEER_DEBUG = "true"
python -m src.collectors.interactive_collector
```

### Logs Location
- **Windows**: `%APPDATA%\prompt-engineer\logs\`
- **Linux/Mac**: `~/.prompt-engineer/logs/`
- **Current Directory**: `./logs/` (fallback)

## 📊 Metrics & KPIs

### Success Criteria (First 48 Hours)
- [ ] Zero critical errors in logs
- [ ] < 5 second scan time for typical project (< 100 files)
- [ ] Memory usage < 500MB for large projects (1000+ files)
- [ ] 100% uptime (if running as service)

### Monitoring Queries
```python
# Check recent errors
import json
from pathlib import Path

log_file = Path("logs/prompt-engineer.log")
errors = [line for line in log_file.read_text().splitlines() if "ERROR" in line]
print(f"Total errors in last session: {len(errors)}")

# Performance metrics
import time
start = time.time()
scanner = CodeScanner()
results = scanner.scan_directory(".")
duration = time.time() - start
print(f"Scan completed in {duration:.2f}s for {results['summary']['total_files']} files")
```

## 🎓 Training & Documentation

### User Training Resources
1. **Quick Start Guide**: `README.md`
2. **Usage Examples**: `examples/` directory
3. **API Documentation**: `docs/api.md`
4. **Video Tutorial**: (link to demo video)

### Administrator Guide
- Configuration options: See `config/` directory
- Database schema: See `databases/schema.sql`
- Performance tuning: This document, section "Performance Tuning"

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Verify Python 3.8+ installed
- [ ] Install all dependencies (`pip install -r requirements.txt`)
- [ ] Run smoke tests (`python simple_example.py`)
- [ ] Review security settings
- [ ] Configure logging destination
- [ ] Set up backup schedule (if needed)

### Deployment
- [ ] Copy files to production location
- [ ] Set environment variables (if using)
- [ ] Create output directories with proper permissions
- [ ] Test with sample project
- [ ] Verify logs are being written

### Post-Deployment
- [ ] Run full smoke test suite
- [ ] Monitor logs for first hour
- [ ] Test all user workflows
- [ ] Document any environment-specific configurations
- [ ] Schedule first backup

### Day 2 Review
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Gather initial user feedback
- [ ] Update documentation with lessons learned

## 🎯 Rollback Plan

### Emergency Rollback Procedure
```powershell
# 1. Stop current deployment
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue

# 2. Restore previous version
Copy-Item -Path ".\backups\prompt-engineer-v0.9.0\*" -Destination ".\" -Recurse -Force

# 3. Verify rollback
python simple_example.py

# 4. Notify stakeholders
Write-Host "Rolled back to v0.9.0" -ForegroundColor Yellow
```

---

## 📝 Deployment Log Template

```
DEPLOYMENT LOG
Date: _____________
Version: 1.0.0
Deployed By: _____________
Environment: Production

Pre-Deployment Checks:
☐ Dependencies installed
☐ Tests passing (99/114)
☐ Smoke tests completed
☐ Backup created

Deployment Steps:
☐ Files copied to production
☐ Configuration updated
☐ Permissions set
☐ Service started/verified

Post-Deployment Validation:
☐ Health check passing
☐ Simple example runs successfully
☐ Logs show no errors
☐ User acceptance test completed

Issues Encountered: None / [describe]
Resolution: N/A / [describe]

Sign-off: _____________ Date: _______
```

---

**Deployment Status**: Ready ✅
**Next Review**: 48 hours post-deployment
**Support Contact**: [Your contact information]
