/**
 * Production-Grade Caching Layer - Digital Content Builder v2.0.0
 * Implements 2025 best practices with cache-manager v7.2.0
 * Features: In-memory + Redis, TTL strategies, cache warming, performance monitoring
 *
 * @version 2.0.0
 * @author Vibe-Tech.org
 * @license MIT
 */

import { createCache } from 'cache-manager';
import { createHash } from 'crypto';
import etag from 'etag';

// Configuration
const nodeEnv = process.env.NODE_ENV || 'development';
const isTestEnv = nodeEnv === 'test';

const cacheConfig = {
    // TTL configurations in seconds
    ttl: {
        health: 10,              // Health endpoint - 10 seconds
        models: 300,             // Models endpoint - 5 minutes
        content: {
            general: 3600,       // General content - 1 hour
            landing: 21600,      // Landing pages - 6 hours
            blog: 7200,          // Blog posts - 2 hours
            email: 1800,         // Email templates - 30 minutes
            code: 14400,         // Code documentation - 4 hours
            social: 900          // Social media - 15 minutes
        }
    },
    // Memory limits
    maxSize: isTestEnv ? 50 : 1000,  // Max cache entries
    maxMemory: isTestEnv ? 10 : 100   // Max memory in MB
};

// Cache statistics
export const cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    memoryUsage: 0,
    lastReset: Date.now(),

    // Calculate hit ratio
    get hitRatio() {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total * 100).toFixed(2) : 0;
    },

    // Reset statistics
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.sets = 0;
        this.deletes = 0;
        this.errors = 0;
        this.lastReset = Date.now();
    }
};

// Initialize in-memory cache with cache-manager v7 API
const memoryCache = createCache({
    // Use memory store
    ttl: 3600000, // Default 1 hour in milliseconds
    max: cacheConfig.maxSize,

    // Memory management
    maxSize: cacheConfig.maxMemory * 1024 * 1024, // Convert MB to bytes
    sizeCalculation: (value) => {
        return JSON.stringify(value).length;
    },

    // LRU eviction policy
    updateAgeOnGet: true,
    updateAgeOnHas: true
});

// Future Redis cache for distributed deployment
let redisCache = null;
if (process.env.REDIS_URL && !isTestEnv) {
    try {
        // Import Redis store dynamically
        const { default: Keyv } = await import('@keyv/redis');

        // Redis configuration for production
        redisCache = createCache({
            store: Keyv,
            url: process.env.REDIS_URL,
            ttl: 3600000, // 1 hour default

            // Connection options
            retryDelayOnFailover: 100,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 3,

            // Compression for large content
            compression: 'gzip'
        });
        console.log('✅ Redis cache initialized for distributed deployment');
    } catch (error) {
        console.warn('⚠️ Redis cache failed to initialize, using memory cache only:', error.message);
    }
}

// Cache key generation with content versioning
export const generateCacheKey = (type, params) => {
    const keyParts = [type];

    switch (type) {
        case 'content':
            const { contentType, prompt, model, temperature } = params;
            // Create deterministic hash of prompt for consistent caching
            const promptHash = createHash('sha256')
                .update(prompt.toLowerCase().trim())
                .digest('hex')
                .substring(0, 16);

            keyParts.push(
                contentType,
                model || 'deepseek-chat',
                `temp-${temperature || 0.7}`,
                promptHash,
                'v2' // Version for cache invalidation
            );
            break;

        case 'health':
            keyParts.push('status');
            break;

        case 'models':
            keyParts.push('list');
            break;

        default:
            keyParts.push(JSON.stringify(params));
    }

    return keyParts.join(':');
};

// Get appropriate TTL based on content type
export const getTTL = (type, contentType = 'general') => {
    switch (type) {
        case 'health':
            return cacheConfig.ttl.health * 1000; // Convert to milliseconds
        case 'models':
            return cacheConfig.ttl.models * 1000;
        case 'content':
            return (cacheConfig.ttl.content[contentType] || cacheConfig.ttl.content.general) * 1000;
        default:
            return 3600000; // 1 hour default
    }
};

// Cache operations with fallback strategy
export const cache = {
    async get(key) {
        try {
            // Try Redis first in production, then memory
            let value = redisCache ? await redisCache.get(key) : null;

            if (!value) {
                value = await memoryCache.get(key);
            }

            if (value) {
                cacheStats.hits++;
                return value;
            } else {
                cacheStats.misses++;
                return null;
            }
        } catch (error) {
            console.error('Cache get error:', error);
            cacheStats.errors++;
            cacheStats.misses++;
            return null;
        }
    },

    async set(key, value, ttl) {
        try {
            cacheStats.sets++;

            // Set in both caches if available
            const promises = [memoryCache.set(key, value, ttl)];
            if (redisCache) {
                promises.push(redisCache.set(key, value, ttl));
            }

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            cacheStats.errors++;
            return false;
        }
    },

    async del(key) {
        try {
            cacheStats.deletes++;

            const promises = [memoryCache.del(key)];
            if (redisCache) {
                promises.push(redisCache.del(key));
            }

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            cacheStats.errors++;
            return false;
        }
    },

    async clear() {
        try {
            const promises = [memoryCache.clear()];
            if (redisCache) {
                promises.push(redisCache.clear());
            }

            await Promise.all(promises);
            cacheStats.reset();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            cacheStats.errors++;
            return false;
        }
    }
};

// Middleware for API response caching
export const cacheMiddleware = (type, _options = {}) => {
    return async (req, res, next) => {
        // Skip caching for certain conditions
        if (req.method !== 'GET' && req.method !== 'POST') {
            return next();
        }

        // Generate cache key based on request
        let cacheKey;
        if (type === 'content') {
            // For content generation endpoint
            if (req.method !== 'POST' || !req.body) {
                return next();
            }

            cacheKey = generateCacheKey('content', {
                contentType: req.body.contentType,
                prompt: req.body.prompt,
                model: req.body.model,
                temperature: req.body.temperature
            });
        } else {
            // For other endpoints
            cacheKey = generateCacheKey(type, { url: req.originalUrl });
        }

        try {
            // Try to get cached response
            const cachedData = await cache.get(cacheKey);

            if (cachedData) {
                // Set cache headers for browser caching
                const maxAge = Math.floor(getTTL(type, req.body?.contentType) / 1000);
                res.set({
                    'Cache-Control': `private, max-age=${maxAge}, must-revalidate`,
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey.substring(0, 32) + '...'
                });

                // Add ETag for validation
                const responseETag = etag(JSON.stringify(cachedData));
                res.set('ETag', responseETag);

                // Check if client has cached version
                if (req.headers['if-none-match'] === responseETag) {
                    return res.status(304).end();
                }

                console.log(`📦 Cache HIT: ${cacheKey.substring(0, 50)}...`);
                return res.json(cachedData);
            }

            // Cache miss - proceed with request but intercept response
            const originalSend = res.json;
            const _originalEnd = res.end;
            let responseData = null;

            res.json = function(data) {
                responseData = data;
                return originalSend.call(this, data);
            };

            res.on('finish', async () => {
                // Only cache successful responses
                if (res.statusCode === 200 && responseData) {
                    const ttl = getTTL(type, req.body?.contentType);
                    await cache.set(cacheKey, responseData, ttl);
                    console.log(`💾 Cache SET: ${cacheKey.substring(0, 50)}... (TTL: ${ttl/1000}s)`);
                }
            });

            // Set cache miss headers
            res.set({
                'X-Cache': 'MISS',
                'X-Cache-Key': cacheKey.substring(0, 32) + '...'
            });

            next();

        } catch (error) {
            console.error('Cache middleware error:', error);
            cacheStats.errors++;
            next();
        }
    };
};

// Cache warming for popular content
export const warmCache = async () => {
    console.log('🔥 Starting cache warming...');

    try {
        // Warm health endpoint
        const healthKey = generateCacheKey('health', {});
        const healthData = {
            status: 'healthy',
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            uptime: 0,
            deepseek: 'connected',
            features: {
                streaming: true,
                models: ['deepseek-chat', 'deepseek-coder'],
                maxTokens: 8000
            }
        };
        await cache.set(healthKey, healthData, getTTL('health'));

        // Warm models endpoint
        const modelsKey = generateCacheKey('models', {});
        const modelsData = {
            models: [
                {
                    id: 'deepseek-chat',
                    name: 'DeepSeek Chat',
                    description: 'General purpose content generation',
                    maxTokens: 8000,
                    contextWindow: 32768
                },
                {
                    id: 'deepseek-coder',
                    name: 'DeepSeek Coder',
                    description: 'Code and technical content generation',
                    maxTokens: 8000,
                    contextWindow: 16384
                }
            ]
        };
        await cache.set(modelsKey, modelsData, getTTL('models'));

        console.log('✅ Cache warming completed');
    } catch (error) {
        console.error('❌ Cache warming failed:', error);
    }
};

// Memory usage monitoring
export const updateMemoryUsage = () => {
    const memUsage = process.memoryUsage();
    cacheStats.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
};

// Start memory monitoring
if (!isTestEnv) {
    setInterval(updateMemoryUsage, 30000); // Update every 30 seconds
}

// Cache health check
export const getCacheHealth = () => {
    return {
        status: redisCache ? 'redis+memory' : 'memory-only',
        stats: {
            ...cacheStats,
            uptime: Math.floor((Date.now() - cacheStats.lastReset) / 1000)
        },
        config: {
            maxSize: cacheConfig.maxSize,
            maxMemory: cacheConfig.maxMemory,
            environment: nodeEnv
        }
    };
};

export default {
    cache,
    cacheMiddleware,
    generateCacheKey,
    getTTL,
    warmCache,
    getCacheHealth,
    cacheStats
};
