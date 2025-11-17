/**
 * Shared file system utilities
 * Provides reusable file system operations
 */

const fs = require('fs');
const path = require('path');

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectory(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

/**
 * Ensure multiple directories exist
 * @param {string[]} dirPaths - Array of directory paths
 * @returns {Promise<void>}
 */
async function ensureDirectories(...dirPaths) {
  await Promise.all(dirPaths.map((dir) => ensureDirectory(dir)));
}

/**
 * Get file sizes recursively in a directory
 * @param {string} dir - Directory path
 * @param {string} relativePath - Relative path for tracking
 * @returns {object} Object mapping file paths to sizes
 */
function getFileSizes(dir, relativePath = '') {
  const files = {};
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      Object.assign(files, getFileSizes(fullPath, relPath));
    } else {
      files[relPath] = stats.size;
    }
  }

  return files;
}

/**
 * Calculate total size of files
 * @param {object} fileSizes - Object mapping file paths to sizes
 * @returns {number} Total size in bytes
 */
function getTotalSize(fileSizes) {
  return Object.values(fileSizes).reduce((a, b) => a + b, 0);
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted size string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Clean directory by removing it and its contents
 * @param {string} dirPath - Directory path to clean
 * @returns {boolean} True if directory was cleaned, false if it didn't exist
 */
function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * Clean multiple directories
 * @param {string[]} dirPaths - Array of directory paths
 * @returns {string[]} Array of cleaned directories
 */
function cleanDirectories(...dirPaths) {
  const cleaned = [];
  for (const dir of dirPaths) {
    if (cleanDirectory(dir)) {
      cleaned.push(dir);
    }
  }
  return cleaned;
}

module.exports = {
  ensureDirectory,
  ensureDirectories,
  getFileSizes,
  getTotalSize,
  formatBytes,
  cleanDirectory,
  cleanDirectories,
};

