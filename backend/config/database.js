const path = require('path');
const fs = require('fs');

/**
 * Database configuration with environment-based path resolution
 * Supports both development (D: drive) and production (container-friendly) paths
 */

function getDatabaseConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  let dbDir, dbPath;
  
  if (isProduction) {
    // Production: Use container-friendly or app-relative path
    dbDir = process.env.DATABASE_DIR || path.join(__dirname, '..', 'data');
    dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'vibetech.db');
  } else {
    // Development: Maintain backward compatibility with D: drive
    dbDir = process.env.DATABASE_DIR || 'D:\\vibe-tech-data';
    dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'vibetech.db');
  }
  
  // Ensure directory exists
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`✓ Created database directory: ${dbDir}`);
    }
  } catch (error) {
    console.error(`✗ Failed to create database directory: ${dbDir}`, error);
    // Fallback to current directory for production
    if (isProduction) {
      dbDir = path.join(process.cwd(), 'data');
      dbPath = path.join(dbDir, 'vibetech.db');
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`✓ Using fallback database directory: ${dbDir}`);
    } else {
      throw error;
    }
  }
  
  return {
    path: dbPath,
    directory: dbDir,
    isProduction
  };
}

module.exports = { getDatabaseConfig };