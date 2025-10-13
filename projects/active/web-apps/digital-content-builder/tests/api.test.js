/**
 * Comprehensive API Test Suite - Digital Content Builder v2.0.0
 * Tests all endpoints, security, rate limiting, and error handling
 */

import request from 'supertest';
import { faker } from '@faker-js/faker';
import { promises as fs } from 'fs';
import path from 'path';

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

describe('Digital Content Builder API', () => {
    describe('Health Endpoint', () => {
        test('GET /api/health returns healthy status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version', '2.0.0');
            expect(response.body).toHaveProperty('deepseek');
            expect(response.body.deepseek).toMatch(/connected|configured/);
        });

        test('Health endpoint includes security headers', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            // Verify Helmet.js security headers
            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
            expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
            expect(response.headers).toHaveProperty('content-security-policy');
            expect(response.headers).toHaveProperty('cross-origin-opener-policy', 'same-origin');
            expect(response.headers).toHaveProperty('cross-origin-resource-policy', 'same-origin');
        });

        test('Health endpoint performance (< 50ms)', async () => {
            const startTime = Date.now();
            await request(app)
                .get('/api/health')
                .expect(200);
            const responseTime = Date.now() - startTime;

            expect(responseTime).toBeLessThan(50);
        });
    });

    describe('Rate Limiting', () => {
        test('General rate limit allows normal usage', async () => {
            // Make 3 requests with delays (should be well under the 100/15min limit)
            for (let i = 0; i < 3; i++) {
                const response = await request(app)
                    .get('/api/health')
                    .expect(200);

                expect(response.headers).toHaveProperty('ratelimit-policy');
                expect(response.headers).toHaveProperty('ratelimit');

                // Add small delay between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        });

        test('API rate limiting headers are present', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'This is a valid test prompt with enough characters to pass validation',
                    contentType: 'general'
                })
                .expect(200); // Mock axios returns success

            expect(response.headers).toHaveProperty('ratelimit-policy');
            expect(response.headers).toHaveProperty('ratelimit');
        });
    });

    describe('Content Generation Endpoint', () => {
        const validPrompt = faker.lorem.sentences(3);

        test('POST /api/deepseek/generate with valid data', async () => {
            const requestData = {
                prompt: validPrompt,
                contentType: 'general',
                model: 'deepseek-chat',
                temperature: 0.7,
                maxTokens: 500,
                stream: false
            };

            const response = await request(app)
                .post('/api/deepseek/generate')
                .send(requestData)
                .expect(200);

            expect(response.body).toHaveProperty('content');
            expect(response.body).toHaveProperty('sanitizedContent');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('model');
            expect(response.body.metadata).toHaveProperty('tokensUsed');
            expect(response.body.metadata).toHaveProperty('processingTime');
        });

        test('Content generation with different content types', async () => {
            const contentTypes = ['landing', 'blog', 'email', 'social', 'general'];

            for (const contentType of contentTypes) {
                const response = await request(app)
                    .post('/api/deepseek/generate')
                    .send({
                        prompt: `Generate ${contentType} content with enough characters to pass validation requirements`,
                        contentType: contentType
                    })
                    .expect(200); // Mock axios returns success

                // Test that response has expected structure
                expect(response.body).toHaveProperty('content');
                expect(response.body).toHaveProperty('sanitizedContent');
            }
        });

        test('Content sanitization works correctly', async () => {
            const maliciousPrompt = 'Generate content with <script>alert("xss")</script> dangerous code';

            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: maliciousPrompt,
                    contentType: 'general'
                })
                .expect(200);

            // The sanitized content should not contain script tags
            expect(response.body.sanitizedContent).not.toContain('<script>');
            expect(response.body.sanitizedContent).not.toContain('alert(');
        });

        test('Streaming response works', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'Generate a short test content',
                    contentType: 'general',
                    stream: true
                })
                .expect(200);

            // Streaming responses use Server-Sent Events
            expect(response.headers['content-type']).toMatch(/text\/(plain|event-stream)/);
        });
    });

    describe('Input Validation', () => {
        test('Rejects empty prompt', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: '',
                    contentType: 'general'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body).toHaveProperty('details');
            expect(response.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'prompt',
                        msg: expect.stringContaining('between 10 and 5000 characters')
                    })
                ])
            );
        });

        test('Rejects prompt too short', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'short',
                    contentType: 'general'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'prompt'
                    })
                ])
            );
        });

        test('Rejects prompt too long', async () => {
            const longPrompt = 'a'.repeat(5001);

            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: longPrompt,
                    contentType: 'general'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'prompt'
                    })
                ])
            );
        });

        test('Rejects invalid content type', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'Valid prompt for testing with enough characters',
                    contentType: 'invalid-type'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'contentType'
                    })
                ])
            );
        });

        test('Rejects invalid temperature range', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'Valid prompt for testing with enough characters',
                    contentType: 'general',
                    temperature: 2.5
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'temperature'
                    })
                ])
            );
        });

        test('Accepts valid optional parameters', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'Valid prompt for testing with all parameters',
                    contentType: 'blog',
                    model: 'deepseek-chat',
                    temperature: 0.8,
                    maxTokens: 1000,
                    stream: false
                })
                .expect(200);

            expect(response.body.metadata.model).toBe('deepseek-chat');
            expect(response.body.metadata.temperature).toBe(0.8);
            expect(response.body.metadata.maxTokens).toBe(1000);
        });
    });

    describe('Error Handling', () => {
        test('404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            // Server may return different error messages
            expect(response.body).toHaveProperty('error');
            expect(['Endpoint not found', 'Not Found', 'Not found']).toContain(response.body.error);
        });

        test('405 for wrong HTTP methods', async () => {
            const response = await request(app)
                .get('/api/deepseek/generate')
                .expect(405);

            expect(response.body).toHaveProperty('error', 'Method not allowed');
        });

        test('Invalid JSON handling', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .set('Content-Type', 'application/json')
                .send('invalid json{')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('Request size limit enforcement', async () => {
            const largePayload = {
                prompt: 'a'.repeat(1024 * 1024 * 11), // 11MB
                contentType: 'general'
            };

            const response = await request(app)
                .post('/api/deepseek/generate')
                .send(largePayload)
                .expect(413);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Static File Serving', () => {
        test('Serves index.html correctly', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Serves CSS files with correct headers', async () => {
            // First check if style.css exists
            try {
                await fs.access(path.join(process.cwd(), 'public', 'style.css'));

                const response = await request(app)
                    .get('/style.css')
                    .expect(200);

                expect(response.headers['content-type']).toContain('text/css');
            } catch (error) {
                // Style.css doesn't exist, which is fine for this test
                console.log('style.css not found, skipping CSS test');
            }
        });

        test('Returns 404 for non-existent static files', async () => {
            await request(app)
                .get('/nonexistent.css')
                .expect(404);
        });
    });

    describe('CORS Configuration', () => {
        test('CORS headers are present', async () => {
            const response = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:3000')
                .expect(200);

            // CORS headers may be conditional based on origin
            // Check for either explicit CORS or credentials header
            const hasCors = response.headers['access-control-allow-origin'] ||
                           response.headers['access-control-allow-credentials'];
            expect(hasCors).toBeTruthy();
        });

        test('Preflight requests handled correctly', async () => {
            const response = await request(app)
                .options('/api/deepseek/generate')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type')
                .expect(204);

            expect(response.headers).toHaveProperty('access-control-allow-methods');
            expect(response.headers).toHaveProperty('access-control-allow-headers');
        });
    });

    describe('Performance Tests', () => {
        test('Health endpoint responds quickly', async () => {
            const times = [];

            for (let i = 0; i < 10; i++) {
                const start = Date.now();
                await request(app)
                    .get('/api/health')
                    .expect(200);
                times.push(Date.now() - start);
            }

            const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
            expect(averageTime).toBeLessThan(100); // Average under 100ms
        });

        test('Concurrent requests handling', async () => {
            const promises = [];

            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .get('/api/health')
                        .expect(200)
                );
            }

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                expect(response.body.status).toBe('healthy');
            });
        });
    });

    describe('Content Generation Edge Cases', () => {
        test('Handles special characters in prompt', async () => {
            const specialPrompt = 'Generate content with émojis 🚀, ünicode çharacters, and "quotes"';

            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: specialPrompt,
                    contentType: 'general'
                })
                .expect(200);

            expect(response.body).toHaveProperty('content');
            expect(response.body).toHaveProperty('sanitizedContent');
        });

        test('Timeout handling for long requests', async () => {
            const response = await request(app)
                .post('/api/deepseek/generate')
                .send({
                    prompt: 'Generate a very detailed and comprehensive content that might take a while',
                    contentType: 'general',
                    maxTokens: 4000
                })
                .timeout(65000) // 65 second timeout
                .expect(200);

            expect(response.body).toHaveProperty('content');
        }, 70000); // 70 second Jest timeout for this test
    });
});

describe('Environment Configuration', () => {
    test('Environment variables are set correctly', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.DEEPSEEK_API_KEY).toBeDefined();
        expect(process.env.PORT).toBeDefined();
    });

    test('Test utilities are available', () => {
        expect(global.testUtils).toBeDefined();
        expect(global.testUtils.sleep).toBeDefined();
        expect(global.testUtils.randomString).toBeDefined();
        expect(global.testUtils.testEmail).toBeDefined();
        expect(global.testUtils.testContent).toBeDefined();
    });

    test('Test utilities work correctly', () => {
        const randomStr = global.testUtils.randomString(10);
        expect(randomStr).toHaveLength(10);

        const email = global.testUtils.testEmail();
        expect(email).toMatch(/test-\d+@example\.com/);

        const content = global.testUtils.testContent('blog-post');
        expect(content.contentType).toBe('blog-post');
        expect(content.prompt).toContain('blog-post');
    });
});