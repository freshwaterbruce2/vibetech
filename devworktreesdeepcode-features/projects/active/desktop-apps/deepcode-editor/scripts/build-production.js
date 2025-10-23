#!/usr/bin/env node

/**
 * Production Build Script - 2025 Optimized
 * 
 * Features:
 * - Pre-build validation and cleanup
 * - Parallel build processes where possible
 * - Bundle analysis and optimization reports
 * - Post-build verification
 * - Performance metrics
 * - Error handling and recovery
 * - Build artifacts management
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const { performance } = require('perf_hooks')

class ProductionBuilder {
  constructor() {
    this.startTime = performance.now()
    this.buildMetrics = {
      stages: {},
      warnings: [],
      errors: [],
      bundleSizes: {}
    }
    
    // Build configuration
    this.config = {
      analyze: process.env.ANALYZE === 'true',
      verbose: process.env.VERBOSE === 'true',
      skipTests: process.env.SKIP_TESTS === 'true',
      skipLinting: process.env.SKIP_LINTING === 'true',
      parallelBuilds: process.env.PARALLEL_BUILDS !== 'false'
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    }
    
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`)
    
    if (level === 'warning') this.buildMetrics.warnings.push(message)
    if (level === 'error') this.buildMetrics.errors.push(message)
  }

  async timeStage(stageName, fn) {
    const start = performance.now()
    this.log(`Starting stage: ${stageName}`)
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.buildMetrics.stages[stageName] = { duration, success: true }
      this.log(`Completed stage: ${stageName} (${Math.round(duration)}ms)`, 'success')
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.buildMetrics.stages[stageName] = { duration, success: false, error: error.message }
      this.log(`Failed stage: ${stageName} (${Math.round(duration)}ms): ${error.message}`, 'error')
      throw error
    }
  }

  execCommand(command, description) {
    this.log(`Executing: ${description}`)
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })
      return output
    } catch (error) {
      this.log(`Command failed: ${command}`, 'error')
      throw error
    }
  }

  async validateEnvironment() {
    return this.timeStage('Environment Validation', () => {
      // Check Node.js version
      const nodeVersion = process.version
      const requiredNodeVersion = '18.0.0'
      if (nodeVersion < `v${requiredNodeVersion}`) {
        throw new Error(`Node.js ${requiredNodeVersion}+ required, found ${nodeVersion}`)
      }

      // Check if required files exist
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'src/App.tsx'
      ]

      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Required file missing: ${file}`)
        }
      }

      // Electron main.js is optional (may not exist in all configurations)
      if (!fs.existsSync('electron/main.js')) {
        this.log('electron/main.js not found (optional for web-only builds)', 'warning')
      }

      // Check disk space (require at least 1GB free)
      const stats = fs.statSync('.')
      // Note: This is a simplified check, real implementation would check actual disk space

      this.log('Environment validation passed', 'success')
      return true
    })
  }

  async cleanupPreviousBuilds() {
    return this.timeStage('Cleanup', () => {
      const dirsToClean = ['dist', 'build', 'release']
      
      for (const dir of dirsToClean) {
        if (fs.existsSync(dir)) {
          this.log(`Removing ${dir}`)
          fs.rmSync(dir, { recursive: true, force: true })
        }
      }

      // Clean TypeScript build info
      const buildInfoFiles = ['.tsbuildinfo', 'dist/.tsbuildinfo']
      for (const file of buildInfoFiles) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      }

      this.log('Cleanup completed', 'success')
    })
  }

  async runQualityChecks() {
    if (this.config.skipLinting && this.config.skipTests) {
      this.log('Skipping quality checks (SKIP_LINTING and SKIP_TESTS set)')
      return
    }

    return this.timeStage('Quality Checks', async () => {
      const checks = []

      if (!this.config.skipLinting) {
        checks.push(async () => {
          this.log('Running ESLint...')
          this.execCommand('npm run lint', 'ESLint code analysis')
        })
      }

      if (!this.config.skipTests) {
        checks.push(async () => {
          this.log('Running tests...')
          this.execCommand('npm test -- --run', 'Test suite execution')
        })
      }

      // Run checks in parallel if enabled
      if (this.config.parallelBuilds && checks.length > 1) {
        await Promise.all(checks.map(check => check()))
      } else {
        for (const check of checks) {
          await check()
        }
      }

      this.log('Quality checks passed', 'success')
    })
  }

  async buildTypeScript() {
    return this.timeStage('TypeScript Build', () => {
      this.log('Building TypeScript...')
      this.execCommand(
        'npx tsc --project tsconfig.build.json', 
        'TypeScript compilation'
      )
      this.log('TypeScript build completed', 'success')
    })
  }

  async buildVite() {
    return this.timeStage('Vite Build', () => {
      const command = this.config.analyze 
        ? 'ANALYZE=true npm run build:prod'
        : 'npm run build:prod'
      
      this.log('Building with Vite...')
      this.execCommand(command, 'Vite production build')
      this.log('Vite build completed', 'success')
    })
  }

  async analyzeBundleSize() {
    return this.timeStage('Bundle Analysis', () => {
      if (!fs.existsSync('dist')) {
        this.log('Dist directory not found, skipping bundle analysis', 'warning')
        return
      }

      // Calculate bundle sizes
      const distPath = path.join(process.cwd(), 'dist')
      const files = this.getFileSizes(distPath)
      
      // Store metrics
      this.buildMetrics.bundleSizes = files

      // Log size information
      this.log('Bundle size analysis:')
      let totalSize = 0
      for (const [file, size] of Object.entries(files)) {
        const sizeKB = Math.round(size / 1024)
        totalSize += size
        this.log(`  ${file}: ${sizeKB} KB`)
      }

      const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100
      this.log(`Total bundle size: ${totalSizeMB} MB`)

      // Warn if bundle is too large
      if (totalSizeMB > 50) {
        this.log(`Bundle size is large (${totalSizeMB} MB). Consider optimization.`, 'warning')
      }

      return files
    })
  }

  getFileSizes(dir, relativePath = '') {
    const files = {}
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const relPath = path.join(relativePath, item)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        Object.assign(files, this.getFileSizes(fullPath, relPath))
      } else {
        files[relPath] = stats.size
      }
    }

    return files
  }

  async verifyBuild() {
    return this.timeStage('Build Verification', () => {
      // Check if critical files exist
      const criticalFiles = [
        'dist/index.html',
        'dist/assets'
      ]

      for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Critical build file missing: ${file}`)
        }
      }

      // Verify index.html has proper content
      const indexPath = 'dist/index.html'
      const indexContent = fs.readFileSync(indexPath, 'utf8')
      
      if (!indexContent.includes('<script')) {
        throw new Error('index.html appears to be missing JavaScript bundles')
      }

      // Check for source maps in production
      const jsFiles = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'))
      const sourceMapFiles = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js.map'))
      
      if (sourceMapFiles.length === 0 && jsFiles.length > 0) {
        this.log('No source maps found (this may be intentional)', 'warning')
      }

      this.log('Build verification passed', 'success')
    })
  }

  async buildElectronApp() {
    return this.timeStage('Electron Build', () => {
      this.log('Building Electron application...')
      this.execCommand('npm run dist', 'Electron application build')
      this.log('Electron build completed', 'success')
    })
  }

  async generateBuildReport() {
    return this.timeStage('Build Report', () => {
      const totalTime = performance.now() - this.startTime
      const report = {
        buildTime: Math.round(totalTime),
        timestamp: new Date().toISOString(),
        stages: this.buildMetrics.stages,
        bundleSizes: this.buildMetrics.bundleSizes,
        warnings: this.buildMetrics.warnings,
        errors: this.buildMetrics.errors,
        config: this.config,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      }

      // Write report to file
      const reportPath = 'dist/build-report.json'
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

      // Log summary
      this.log('='.repeat(60))
      this.log('BUILD SUMMARY', 'success')
      this.log('='.repeat(60))
      this.log(`Total build time: ${Math.round(totalTime / 1000)}s`)
      this.log(`Warnings: ${this.buildMetrics.warnings.length}`)
      this.log(`Errors: ${this.buildMetrics.errors.length}`)
      
      if (this.buildMetrics.bundleSizes.length > 0) {
        const totalSize = Object.values(this.buildMetrics.bundleSizes).reduce((a, b) => a + b, 0)
        const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100
        this.log(`Bundle size: ${totalSizeMB} MB`)
      }

      this.log(`Build report saved to: ${reportPath}`)
      this.log('='.repeat(60))

      return report
    })
  }

  async build() {
    try {
      this.log('Starting production build process...', 'info')

      // Run build stages
      await this.validateEnvironment()
      await this.cleanupPreviousBuilds()
      await this.runQualityChecks()
      
      // Build stages can run in parallel
      if (this.config.parallelBuilds) {
        await Promise.all([
          this.buildTypeScript(),
          // Vite build depends on TS, so we'll run it after
        ])
        await this.buildVite()
      } else {
        await this.buildTypeScript()
        await this.buildVite()
      }

      await this.analyzeBundleSize()
      await this.verifyBuild()
      
      // Generate build report
      const report = await this.generateBuildReport()

      this.log('Production build completed successfully!', 'success')
      return report

    } catch (error) {
      this.log(`Production build failed: ${error.message}`, 'error')
      process.exit(1)
    }
  }

  async buildWithElectron() {
    const report = await this.build()
    
    try {
      await this.buildElectronApp()
      this.log('Full application build completed successfully!', 'success')
      return report
    } catch (error) {
      this.log(`Electron build failed: ${error.message}`, 'error')
      process.exit(1)
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const includeElectron = args.includes('--electron') || args.includes('-e')
  
  const builder = new ProductionBuilder()
  
  if (includeElectron) {
    await builder.buildWithElectron()
  } else {
    await builder.build()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Build script failed:', error)
    process.exit(1)
  })
}

module.exports = { ProductionBuilder }