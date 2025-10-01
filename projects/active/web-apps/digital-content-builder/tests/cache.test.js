/**
 * Cache System Test Suite - Digital Content Builder v2.0.0
 * Tests caching functionality, performance, and TTL behavior
 */

import request from 'supertest';
import { faker } from '@faker-js/faker';

// Import the app and server
let app;
let server;

beforeAll(async () => {
    // Dynamically import the server with cache-busting
    const serverModule = await import(`../server.js?${Date.now()}`);
    app = serverModule.app;
    server = serverModule.server;

    // Wait a moment for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
});

describe('Cache System Tests', () => {
    describe('Cache Headers and Middleware', () => {
        test('Health endpoint includes cache headers', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            // Check for cache headers
            expect(response.headers).toHaveProperty('x-cache');
            expect(response.headers).toHaveProperty('etag');
            expect(['HIT', 'MISS']).toContain(response.headers['x-cache']);
        });

        test('Models endpoint supports caching', async () => {
            // First request should be a MISS or HIT from cache warming
            const response1 = await request(app)
                .get('/api/deepseek/models')
                .expect(200);

            expect(response1.headers).toHaveProperty('x-cache');
            expect(['HIT', 'MISS']).toContain(response1.headers['x-cache']);

            // Second request should be a HIT (models are static)
            const response2 = await request(app)
                .get('/api/deepseek/models')
                .expect(200);

            expect(response2.headers['x-cache']).toBe('HIT');
            expect(response2.body).toEqual(response1.body);
        });

        test('Cache statistics are included in responses', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('cache');
            expect(response.body.cache).toHaveProperty('status');
            expect(response.body.cache).toHaveProperty('hitRatio');
            expect(response.body.cache).toHaveProperty('memoryUsage');
        });
    });

    describe('Cache Performance', () => {
        test('Cached responses are faster than uncached', async () => {
            // First request (likely cache miss)
            const start1 = Date.now();
            await request(app)
                .get('/api/deepseek/models')
                .expect(200);
            const time1 = Date.now() - start1;

            // Second request (should be cache hit)
            const start2 = Date.now();
            await request(app)
                .get('/api/deepseek/models')
                .expect(200);
            const time2 = Date.now() - start2;

            // Cache hit should be significantly faster
            console.log(`Uncached: ${time1}ms, Cached: ${time2}ms`);
            expect(time2).toBeLessThan(time1 * 0.5); // At least 50% faster
        });

        test('Cache statistics show correct metrics', async () => {
            // Make several requests to generate cache activity
            await request(app).get('/api/deepseek/models');
            await request(app).get('/api/deepseek/models');
            await request(app).get('/api/health');

            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body).toHaveProperty('cache');
            expect(response.body.cache).toHaveProperty('hits');
            expect(response.body.cache).toHaveProperty('misses');
            expect(response.body.cache).toHaveProperty('sets');
            expect(response.body.cache).toHaveProperty('hitRatio');

            // Should have some cache activity
            const totalRequests = response.body.cache.hits + response.body.cache.misses;
            expect(totalRequests).toBeGreaterThan(0);
        });
    });

    describe('Content Generation Caching', () => {
        test('Identical content generation requests are cached', async () => {
            const testPrompt = faker.lorem.sentences(2);
            const requestData = {
                prompt: testPrompt,
                contentType: 'general',
                model: 'deepseek-chat',
                temperature: 0.7
            };

            // First request
            const response1 = await request(app)
                .post('/api/deepseek/generate')
                .send(requestData)
                .expect(200);

            expect(response1.headers['x-cache']).toBe('MISS');

            // Second identical request should be cached
            const response2 = await request(app)
                .post('/api/deepseek/generate')
                .send(requestData)
                .expect(200);

            expect(response2.headers['x-cache']).toBe('HIT');
            expect(response2.body.content).toBe(response1.body.content);
        });

        test('Different prompts generate different cache keys', async () => {
            const prompt1 = faker.lorem.sentences(2);
            const prompt2 = faker.lorem.sentences(2);

            const response1 = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: prompt1,
                    contentType: 'general'
                })
                .expect(200);

            const response2 = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: prompt2,
                    contentType: 'general'
                })
                .expect(200);

            // Both should be cache misses (different prompts)
            expect(response1.headers['x-cache']).toBe('MISS');
            expect(response2.headers['x-cache']).toBe('MISS');
            expect(response1.body.content).not.toBe(response2.body.content);
        });

        test('Different content types have different cache keys', async () => {
            const testPrompt = faker.lorem.sentences(2);

            const response1 = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: testPrompt,
                    contentType: 'blog'
                })
                .expect(200);

            const response2 = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: testPrompt,
                    contentType: 'landing'
                })
                .expect(200);

            // Both should be cache misses (different content types)
            expect(response1.headers['x-cache']).toBe('MISS');
            expect(response2.headers['x-cache']).toBe('MISS');
        });
    });

    describe('ETag Support', () => {
        test('ETags are generated for responses', async () => {
            const response = await request(app)
                .get('/api/deepseek/models')
                .expect(200);

            expect(response.headers).toHaveProperty('etag');
            expect(response.headers.etag).toMatch(/^W?\/".*"$/);
        });

        test('If-None-Match returns 304 for unchanged content', async () => {
            // Get initial response with ETag
            const response1 = await request(app)
                .get('/api/deepseek/models')
                .expect(200);

            const etag = response1.headers.etag;
            expect(etag).toBeDefined();

            // Request with If-None-Match should return 304
            const response2 = await request(app)
                .get('/api/deepseek/models')
                .set('If-None-Match', etag)
                .expect(304);

            expect(response2.body).toEqual({});
        });
    });

    describe('Cache Configuration', () => {
        test('Cache system status is reported correctly', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body.cache).toHaveProperty('status');
            expect(['memory-only', 'redis+memory']).toContain(response.body.cache.status);
        });

        test('Memory usage is tracked', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body.cache).toHaveProperty('memoryUsage');
            expect(response.body.cache.memoryUsage).toMatch(/^\d+MB$/);
        });

        test('Cache uptime is tracked', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body.cache).toHaveProperty('uptime');
            expect(typeof response.body.cache.uptime).toBe('number');
            expect(response.body.cache.uptime).toBeGreaterThan(0);
        });
    });

    describe('Cache Warming', () => {
        test('Popular endpoints are pre-warmed', async () => {
            // Check that cache warming has populated some entries
            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            // Should have some cache sets from warming
            expect(response.body.cache.sets).toBeGreaterThan(0);
        });

        test('Warmed endpoints return cache hits', async () => {
            // Models endpoint should be warmed
            const response = await request(app)
                .get('/api/deepseek/models')
                .expect(200);

            // Should be a hit from cache warming
            expect(response.headers['x-cache']).toBe('HIT');
        });
    });
});

describe('Cache Integration with Existing Tests', () => {
    test('Caching does not interfere with rate limiting', async () => {
        // Make multiple cached requests
        for (let i = 0; i < 5; i++) {
            const response = await request(app)
                .get('/api/deepseek/models')
                .expect(200);

            // Should still have rate limit headers
            expect(response.headers).toHaveProperty('ratelimit-policy');
            expect(response.headers).toHaveProperty('ratelimit');
        }
    });

    test('Caching does not interfere with security headers', async () => {
        const response = await request(app)
            .get('/api/health')
            .expect(200);

        // Should have both cache and security headers
        expect(response.headers).toHaveProperty('x-cache');
        expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
        expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
    });

    test('Cache statistics are consistent across requests', async () => {
        const response1 = await request(app)
            .get('/api/stats')
            .expect(200);

        const initialHits = response1.body.cache.hits;
        const initialMisses = response1.body.cache.misses;

        // Make a cached request
        await request(app).get('/api/deepseek/models');

        const response2 = await request(app)
            .get('/api/stats')
            .expect(200);

        // Statistics should have updated
        const newTotal = response2.body.cache.hits + response2.body.cache.misses;
        const oldTotal = initialHits + initialMisses;
        expect(newTotal).toBeGreaterThanOrEqual(oldTotal);
    });
});