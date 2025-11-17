/**
 * Shared utilities index
 * Central export point for all utility modules
 */

const logger = require('./logger');
const commandExec = require('./command-exec');
const puppeteerHelpers = require('./puppeteer-helpers');
const fsHelpers = require('./fs-helpers');

module.exports = {
  // Logger utilities
  ...logger,
  logger,

  // Command execution utilities
  ...commandExec,
  commandExec,

  // Puppeteer utilities
  ...puppeteerHelpers,
  puppeteerHelpers,

  // File system utilities
  ...fsHelpers,
  fsHelpers,
};

