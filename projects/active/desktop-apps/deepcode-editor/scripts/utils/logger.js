/**
 * Shared logging utility for scripts
 * Provides consistent colored logging across all scripts
 */

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  // Aliases for consistency
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warning: '\x1b[33m', // Yellow
  error: '\x1b[31m',   // Red
};

/**
 * Log a message with optional color
 * @param {string} message - Message to log
 * @param {string} level - Color/level (info, success, warning, error, reset, etc.)
 */
function log(message, level = 'reset') {
  const color = colors[level] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a message with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Color/level (info, success, warning, error)
 */
function logWithTimestamp(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Log an error message
 * @param {string} message - Error message
 */
function logError(message) {
  log(message, 'error');
}

/**
 * Log a success message
 * @param {string} message - Success message
 */
function logSuccess(message) {
  log(message, 'success');
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
function logWarning(message) {
  log(message, 'warning');
}

/**
 * Log an info message
 * @param {string} message - Info message
 */
function logInfo(message) {
  log(message, 'info');
}

module.exports = {
  log,
  logWithTimestamp,
  logError,
  logSuccess,
  logWarning,
  logInfo,
  colors,
};

