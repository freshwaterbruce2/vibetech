/**
 * Shared command execution utility for scripts
 * Provides consistent command execution with error handling
 */

const { execSync } = require('child_process');
const { logInfo, logError } = require('./logger');

/**
 * Execute a command synchronously
 * @param {string} command - Command to execute
 * @param {string} description - Human-readable description
 * @param {object} options - Additional options
 * @param {boolean} options.verbose - Whether to show command output
 * @param {boolean} options.throwOnError - Whether to throw on error (default: true)
 * @param {number} options.maxBuffer - Max buffer size (default: 10MB)
 * @returns {string|boolean} Command output or success status
 */
function execCommand(command, description, options = {}) {
  const {
    verbose = false,
    throwOnError = true,
    maxBuffer = 10 * 1024 * 1024, // 10MB
  } = options;

  if (description) {
    logInfo(`Executing: ${description}`);
  }

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
      maxBuffer,
    });
    return output;
  } catch (error) {
    logError(`Command failed: ${command}`);
    if (throwOnError) {
      throw error;
    }
    return false;
  }
}

/**
 * Run a command and return success status
 * @param {string} command - Command to execute
 * @param {string} description - Human-readable description
 * @returns {boolean} True if command succeeded, false otherwise
 */
function runCommand(command, description) {
  if (description) {
    console.log(`\n${description}...`);
  }

  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed: ${description}`);
    return false;
  }
}

module.exports = {
  execCommand,
  runCommand,
};

