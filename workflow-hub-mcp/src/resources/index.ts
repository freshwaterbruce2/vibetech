import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

// Define all available resources
export const RESOURCES: Resource[] = [
  {
    uri: 'workflow://claude-md',
    name: 'CLAUDE.md',
    description: 'Main Claude Code configuration and workspace guidelines',
    mimeType: 'text/markdown',
  },
  {
    uri: 'workflow://recent-tasks',
    name: 'Recent Tasks',
    description: 'Last 50 tasks from memory bank',
    mimeType: 'application/json',
  },
  {
    uri: 'workflow://last-session',
    name: 'Last Session',
    description: 'Previous session context for resuming work',
    mimeType: 'application/json',
  },
  {
    uri: 'workflow://crypto/config',
    name: 'Crypto Bot Config',
    description: 'Trading bot configuration and risk parameters',
    mimeType: 'text/plain',
  },
  {
    uri: 'workflow://crypto/logs/latest',
    name: 'Crypto Bot Latest Logs',
    description: 'Last 100 lines from trading bot logs',
    mimeType: 'text/plain',
  },
  {
    uri: 'workflow://project/readme',
    name: 'Project README',
    description: 'Main project README.md from C:\\dev',
    mimeType: 'text/markdown',
  },
];

const PATHS = {
  CLAUDE_MD: 'C:\\dev\\CLAUDE.md',
  RECENT_TASKS: 'C:\\dev\\projects\\active\\web-apps\\memory-bank\\quick-access\\recent-tasks.json',
  LAST_SESSION: 'C:\\dev\\projects\\active\\web-apps\\memory-bank\\quick-access\\last-session.json',
  CRYPTO_CONFIG: 'C:\\dev\\projects\\crypto-enhanced\\config.py',
  CRYPTO_LOGS: 'C:\\dev\\projects\\crypto-enhanced\\logs\\trading.log',
  PROJECT_README: 'C:\\dev\\README.md',
};

export async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case 'workflow://claude-md':
      return await readFileIfExists(PATHS.CLAUDE_MD, 'CLAUDE.md not found');

    case 'workflow://recent-tasks':
      return await readFileIfExists(PATHS.RECENT_TASKS, '[]');

    case 'workflow://last-session':
      return await readFileIfExists(PATHS.LAST_SESSION, '{}');

    case 'workflow://crypto/config':
      return await readFileIfExists(PATHS.CRYPTO_CONFIG, 'Config file not found');

    case 'workflow://crypto/logs/latest':
      return await getLatestLogs(PATHS.CRYPTO_LOGS, 100);

    case 'workflow://project/readme':
      return await readFileIfExists(PATHS.PROJECT_README, 'README.md not found');

    default:
      throw new Error(`Unknown resource URI: ${uri}`);
  }
}

async function readFileIfExists(path: string, fallback: string): Promise<string> {
  if (!existsSync(path)) {
    return fallback;
  }

  try {
    return await readFile(path, 'utf-8');
  } catch (error) {
    return `Error reading file: ${error}`;
  }
}

async function getLatestLogs(logPath: string, lines: number = 100): Promise<string> {
  if (!existsSync(logPath)) {
    return 'Log file not found';
  }

  try {
    const content = await readFile(logPath, 'utf-8');
    const logLines = content.split('\n');
    const latestLines = logLines.slice(-lines);
    return latestLines.join('\n');
  } catch (error) {
    return `Error reading logs: ${error}`;
  }
}
