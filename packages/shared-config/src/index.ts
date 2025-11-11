import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { resolve, normalize } from 'path';
import { existsSync } from 'fs';

// Load .env from monorepo root
loadEnv({ path: resolve(process.cwd(), '.env') });

// Environment schema with validation
const envSchema = z.object({
    APP_DB_PATH: z.string().default('D:\\databases\\database.db'),
    LEARNING_DB_PATH: z.string().default('D:\\databases\\agent_learning.db'),
    LEARNING_SYSTEM_DIR: z.string().default('D:\\learning-system'),
    IPC_WS_URL: z.string().url().default('ws://localhost:5004'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

type EnvConfig = z.infer<typeof envSchema>;

// Parse and validate environment
const parseEnv = (): EnvConfig => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        console.error('Environment validation failed:', error);
        // Return defaults if validation fails
        return envSchema.parse({});
    }
};

// Normalize Windows paths
export const normalizePath = (path: string): string => {
    return normalize(path.replace(/\//g, '\\'));
};

// Validated environment config
export const env = parseEnv();

// Database paths with validation
export const getDatabasePath = (type: 'app' | 'learning'): string => {
    const path = type === 'app' ? env.APP_DB_PATH : env.LEARNING_DB_PATH;
    return normalizePath(path);
};

// Learning system directory
export const getLearningSystemDir = (): string => {
    return normalizePath(env.LEARNING_SYSTEM_DIR);
};

// Check if path exists
export const validatePath = (path: string): boolean => {
    return existsSync(path);
};

// IPC configuration
export const getIPCConfig = () => ({
    url: env.IPC_WS_URL,
    reconnectDelay: 1000,
    maxReconnectAttempts: 5,
});

// Export everything
export { EnvConfig };
export default env;
