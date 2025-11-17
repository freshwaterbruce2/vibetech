# Shared Script Utilities

This directory contains shared utility modules used by various build and automation scripts in the project.

## Modules

### `logger.js`
Provides consistent colored logging across all scripts.

**Functions:**
- `log(message, level)` - Log a message with optional color level
- `logWithTimestamp(message, level)` - Log with ISO timestamp
- `logInfo(message)` - Log info message (cyan)
- `logSuccess(message)` - Log success message (green)
- `logWarning(message)` - Log warning message (yellow)
- `logError(message)` - Log error message (red)

**Example:**
```javascript
const { logInfo, logSuccess, logError } = require('./utils');

logInfo('Starting process...');
logSuccess('Process completed!');
logError('Something went wrong');
```

### `command-exec.js`
Provides consistent command execution with error handling.

**Functions:**
- `execCommand(command, description, options)` - Execute a command synchronously with logging
- `runCommand(command, description)` - Run command and return success status

**Example:**
```javascript
const { execCommand } = require('./utils');

execCommand('npm test', 'Running tests', { verbose: true });
```

### `fs-helpers.js`
Common file system operations.

**Functions:**
- `ensureDirectory(dirPath)` - Create directory if it doesn't exist
- `ensureDirectories(...dirPaths)` - Create multiple directories
- `getFileSizes(dir, relativePath)` - Get file sizes recursively
- `getTotalSize(fileSizes)` - Calculate total size from file size object
- `formatBytes(bytes, decimals)` - Format bytes to human-readable string
- `cleanDirectory(dirPath)` - Remove directory and contents
- `cleanDirectories(...dirPaths)` - Remove multiple directories

**Example:**
```javascript
const { ensureDirectory, formatBytes, cleanDirectory } = require('./utils');

await ensureDirectory('./output');
console.log(formatBytes(1024 * 1024)); // "1 MB"
cleanDirectory('./temp');
```

### `puppeteer-helpers.js`
Reusable browser automation functions using Puppeteer.

**Functions:**
- `launchBrowser(options)` - Launch browser with common configuration
- `takeScreenshot(page, path, options)` - Take and save screenshot
- `getPerformanceMetrics(page)` - Get formatted performance metrics
- `analyzeVibeTechDesign(page)` - Analyze Vibe Tech design elements
- `countGradientElements(page)` - Count elements with gradients
- `countColorElements(page, colorValues)` - Count elements with specific colors

**Example:**
```javascript
const { launchBrowser, takeScreenshot, getPerformanceMetrics } = require('./utils');

const browser = await launchBrowser({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:3001');
await takeScreenshot(page, './screenshot.png');
const metrics = await getPerformanceMetrics(page);
console.log('Memory:', metrics.jsHeapUsedMB, 'MB');
await browser.close();
```

## Usage

All utilities can be imported from the index file:

```javascript
// Import specific utilities
const { logInfo, execCommand, ensureDirectory, launchBrowser } = require('./utils');

// Or import by module
const { logger, commandExec, fsHelpers, puppeteerHelpers } = require('./utils');
```

## Testing

Tests are located in the `__tests__` directory and can be run with:

```bash
npm test scripts/utils
```

## Module System

This directory uses CommonJS (`require`/`module.exports`) to maintain compatibility with existing build scripts. The `package.json` file in this directory marks it as CommonJS, even though the parent project uses ES modules.
