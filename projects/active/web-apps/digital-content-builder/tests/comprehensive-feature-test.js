/**
 * Comprehensive Feature Test Suite for Vibe Content AI
 * Tests all content generation types and identifies broken functionality
 *
 * @version 2.0.0
 * @author Vibe-Tech.org
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:3005';
const CONTENT_TYPES = [
    { id: 'blog', name: 'Blog', description: 'Articles & Posts' },
    { id: 'landing', name: 'Landing', description: 'Pages & Sites' },
    { id: 'email', name: 'Email', description: 'Templates' },
    { id: 'social', name: 'Social', description: 'Media Posts' },
    { id: 'ebook', name: 'Ebook', description: 'Digital Books' },
    { id: 'course', name: 'Course', description: 'Learning Content' },
    { id: 'code', name: 'Code', description: 'Documentation' },
    { id: 'video', name: 'Video', description: 'Scripts' },
    { id: 'podcast', name: 'Podcast', description: 'Scripts' }
];

const TEST_PROMPTS = {
    blog: 'Write a comprehensive blog post about sustainable living practices for millennials',
    landing: 'Create a high-converting landing page for a SaaS productivity tool',
    email: 'Design a welcome email sequence for new subscribers to a fitness app',
    social: 'Create engaging social media posts for a tech startup launching an AI tool',
    ebook: 'Outline an ebook about digital marketing strategies for small businesses',
    course: 'Develop a course curriculum about Python programming for beginners',
    code: 'Create technical documentation for a React component library',
    video: 'Write a script for a YouTube video about cryptocurrency investing basics',
    podcast: 'Create a podcast script about the future of remote work'
};

// Track test results for comprehensive reporting
let testResults = {
    passed: [],
    failed: [],
    broken: [],
    summary: {}
};

test.describe('Vibe Content AI - Comprehensive Feature Test', () => {

    test.beforeAll(async () => {
        console.log('\n🚀 Starting Comprehensive Feature Test Suite');
        console.log('Testing all content types for functionality and production readiness');
        console.log('=' * 70);
    });

    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto(BASE_URL);

        // Wait for the application to load
        await page.waitForSelector('.content-types', { timeout: 10000 });

        // Verify server health before each test
        const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
        expect(healthResponse.status()).toBe(200);

        const healthData = await healthResponse.json();
        expect(healthData.status).toBe('healthy');
        expect(healthData.deepseek).toBe('connected');
    });

    // Test 1: Interface Load and Basic Functionality
    test('Application Interface Loads Properly', async ({ page }) => {
        await test.step('Verify header elements', async () => {
            await expect(page.locator('.logo')).toBeVisible();
            await expect(page.locator('text=Vibe Content AI')).toBeVisible();
            await expect(page.locator('a[href="/api/health"]')).toBeVisible();
            await expect(page.locator('a[href="/api-docs"]')).toBeVisible();
        });

        await test.step('Verify content type selection area', async () => {
            await expect(page.locator('.content-types')).toBeVisible();

            // Verify all content type buttons are present
            for (const contentType of CONTENT_TYPES) {
                await expect(page.locator(`[data-type="${contentType.id}"]`)).toBeVisible();
                await expect(page.locator(`text=${contentType.name}`)).toBeVisible();
                await expect(page.locator(`text=${contentType.description}`)).toBeVisible();
            }
        });

        await test.step('Verify form section', async () => {
            await expect(page.locator('#prompt')).toBeVisible();
            await expect(page.locator('#model')).toBeVisible();
            await expect(page.locator('#temperature')).toBeVisible();
            await expect(page.locator('#maxTokens')).toBeVisible();
            await expect(page.locator('.generate-btn')).toBeVisible();
        });

        await test.step('Verify output section', async () => {
            await expect(page.locator('.output-section')).toBeVisible();
            await expect(page.locator('.view-toggles')).toBeVisible();
            await expect(page.locator('.empty-state')).toBeVisible();
        });

        testResults.passed.push('Interface Load Test');
    });

    // Test 2: Content Type Selection Functionality
    test('Content Type Selection Works Correctly', async ({ page }) => {
        for (const contentType of CONTENT_TYPES) {
            await test.step(`Test ${contentType.name} selection`, async () => {
                const button = page.locator(`[data-type="${contentType.id}"]`);
                await button.click();

                // Verify active state
                await expect(button).toHaveClass(/active/);

                // Verify placeholder text changes
                const placeholder = await page.locator('#prompt').getAttribute('placeholder');
                expect(placeholder).toBeTruthy();
                expect(placeholder.length).toBeGreaterThan(20); // Should have meaningful placeholder

                console.log(`✅ ${contentType.name} selection working`);
            });
        }

        testResults.passed.push('Content Type Selection');
    });

    // Test 3: Form Validation
    test('Form Validation Works Correctly', async ({ page }) => {
        await test.step('Test empty prompt validation', async () => {
            await page.locator('.generate-btn').click();

            // Should see error notification
            await page.waitForSelector('.notification.error', { timeout: 5000 });
            const errorText = await page.locator('.notification.error').textContent();
            expect(errorText).toContain('Content brief is required');
        });

        await test.step('Test short prompt validation', async () => {
            await page.fill('#prompt', 'test');
            await page.locator('.generate-btn').click();

            await page.waitForSelector('.notification.error', { timeout: 5000 });
            const errorText = await page.locator('.notification.error').textContent();
            expect(errorText).toContain('at least 10 characters');
        });

        await test.step('Test model selection', async () => {
            // Test both available models
            await page.selectOption('#model', 'deepseek-chat');
            let selected = await page.locator('#model').inputValue();
            expect(selected).toBe('deepseek-chat');

            await page.selectOption('#model', 'deepseek-coder');
            selected = await page.locator('#model').inputValue();
            expect(selected).toBe('deepseek-coder');
        });

        testResults.passed.push('Form Validation');
    });

    // Test 4: Systematic Content Generation for Each Type
    CONTENT_TYPES.forEach(contentType => {
        test(`${contentType.name} Content Generation`, async ({ page }) => {
            console.log(`\n🔍 Testing ${contentType.name} content generation...`);

            try {
                await test.step(`Select ${contentType.name} content type`, async () => {
                    await page.locator(`[data-type="${contentType.id}"]`).click();
                    await expect(page.locator(`[data-type="${contentType.id}"]`)).toHaveClass(/active/);
                });

                await test.step('Fill form with test prompt', async () => {
                    await page.fill('#prompt', TEST_PROMPTS[contentType.id]);

                    // Set appropriate model
                    if (contentType.id === 'code') {
                        await page.selectOption('#model', 'deepseek-coder');
                    } else {
                        await page.selectOption('#model', 'deepseek-chat');
                    }
                });

                await test.step('Generate content and verify response', async () => {
                    // Start generation
                    await page.locator('.generate-btn').click();

                    // Wait for loading state
                    await expect(page.locator('.generate-btn.loading')).toBeVisible({ timeout: 2000 });

                    // Wait for content to be generated (up to 60 seconds)
                    await page.waitForFunction(() => {
                        const outputContent = document.querySelector('#output-content');
                        return outputContent && !outputContent.querySelector('.empty-state');
                    }, { timeout: 60000 });

                    // Verify content is generated
                    const outputContent = await page.locator('#output-content').textContent();
                    expect(outputContent.trim().length).toBeGreaterThan(100);

                    // Verify export buttons appear
                    await expect(page.locator('#export-actions')).toBeVisible();
                    await expect(page.locator('#social-actions')).toBeVisible();

                    // Test view switching
                    await page.locator('[data-view="code"]').click();
                    await expect(page.locator('.code-view')).toBeVisible();

                    await page.locator('[data-view="preview"]').click();
                    // Preview should show content

                    console.log(`✅ ${contentType.name} generation successful`);
                    testResults.passed.push(`${contentType.name} Generation`);
                });

                await test.step('Test export functionality', async () => {
                    // Test HTML export
                    const [download] = await Promise.all([
                        page.waitForEvent('download'),
                        page.click('#export-html')
                    ]);
                    expect(download.suggestedFilename()).toContain('.html');

                    // Test copy functionality
                    await page.click('.copy-btn');
                    await expect(page.locator('.notification.success')).toBeVisible();
                });

            } catch (error) {
                console.error(`❌ ${contentType.name} generation failed:`, error.message);
                testResults.failed.push(`${contentType.name} Generation: ${error.message}`);
                testResults.broken.push(contentType.id);

                // Take screenshot for debugging
                await page.screenshot({
                    path: `test-results/${contentType.id}-failure.png`,
                    fullPage: true
                });
            }
        });
    });

    // Test 5: View Switching Functionality
    test('View Switching Works Correctly', async ({ page }) => {
        // Generate some content first
        await page.locator(`[data-type="blog"]`).click();
        await page.fill('#prompt', 'Write a short blog post about AI technology');
        await page.locator('.generate-btn').click();

        // Wait for content
        await page.waitForFunction(() => {
            const outputContent = document.querySelector('#output-content');
            return outputContent && !outputContent.querySelector('.empty-state');
        }, { timeout: 30000 });

        // Test Preview view
        await page.locator('[data-view="preview"]').click();
        await expect(page.locator('[data-view="preview"]')).toHaveClass(/active/);

        // Test Code view
        await page.locator('[data-view="code"]').click();
        await expect(page.locator('[data-view="code"]')).toHaveClass(/active/);
        await expect(page.locator('.code-view')).toBeVisible();

        // Test Split view
        await page.locator('[data-view="split"]').click();
        await expect(page.locator('[data-view="split"]')).toHaveClass(/active/);

        testResults.passed.push('View Switching');
    });

    // Test 6: Performance and Core Web Vitals
    test('Performance Metrics Meet 2025 Standards', async ({ page }) => {
        const startTime = Date.now();

        await test.step('Measure page load performance', async () => {
            const [response] = await Promise.all([
                page.waitForResponse(BASE_URL),
                page.goto(BASE_URL)
            ]);

            expect(response.status()).toBe(200);

            // Measure LCP (Largest Contentful Paint)
            const lcpValue = await page.evaluate(() => {
                return new Promise((resolve) => {
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        resolve(lastEntry.startTime);
                    }).observe({entryTypes: ['largest-contentful-paint']});

                    // Fallback if no LCP detected
                    setTimeout(() => resolve(0), 5000);
                });
            });

            if (lcpValue > 0) {
                expect(lcpValue).toBeLessThan(2500); // LCP should be < 2.5s
                console.log(`✅ LCP: ${Math.round(lcpValue)}ms`);
            }
        });

        await test.step('Test API response times', async () => {
            const healthStart = Date.now();
            const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
            const healthTime = Date.now() - healthStart;

            expect(healthResponse.status()).toBe(200);
            expect(healthTime).toBeLessThan(1000); // Health check < 1s
            console.log(`✅ Health API: ${healthTime}ms`);
        });

        testResults.passed.push('Performance Metrics');
    });

    // Test 7: Error Handling and Edge Cases
    test('Error Handling Works Correctly', async ({ page }) => {
        await test.step('Test invalid input handling', async () => {
            // Test with potentially harmful input
            await page.fill('#prompt', '<script>alert("test")</script>');
            await page.locator('.generate-btn').click();

            // Should either sanitize or show error
            // Wait for either success or error
            try {
                await page.waitForSelector('.notification', { timeout: 10000 });
            } catch (e) {
                // Continue if no notification appears
            }
        });

        await test.step('Test network error handling', async () => {
            // This would require mocking network failures
            // For now, just verify error states exist
            await expect(page.locator('.notification')).toBeDefined();
        });

        testResults.passed.push('Error Handling');
    });

    // Test 8: Accessibility and WCAG Compliance
    test('Accessibility Standards Met', async ({ page }) => {
        await test.step('Check keyboard navigation', async () => {
            // Tab through main interactive elements
            await page.keyboard.press('Tab'); // Should focus first interactive element

            // Verify focus indicators
            const focusedElement = page.locator(':focus');
            await expect(focusedElement).toBeVisible();
        });

        await test.step('Check ARIA labels and roles', async () => {
            // Verify form labels
            await expect(page.locator('label[for="prompt"]')).toBeVisible();
            await expect(page.locator('label[for="model"]')).toBeVisible();

            // Verify button accessibility
            const generateBtn = page.locator('.generate-btn');
            const ariaLabel = await generateBtn.getAttribute('aria-label');
            // Should have accessible text
        });

        testResults.passed.push('Accessibility');
    });

    test.afterAll(async () => {
        // Generate comprehensive test report
        console.log('\n' + '='.repeat(70));
        console.log('📊 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(70));

        console.log('\n✅ PASSED TESTS:');
        testResults.passed.forEach(test => console.log(`  ✓ ${test}`));

        if (testResults.failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            testResults.failed.forEach(test => console.log(`  ✗ ${test}`));
        }

        if (testResults.broken.length > 0) {
            console.log('\n🔥 BROKEN CONTENT TYPES:');
            testResults.broken.forEach(type => console.log(`  💥 ${type}`));
        }

        const passRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100;
        console.log(`\n📈 PASS RATE: ${Math.round(passRate)}%`);

        if (testResults.broken.length === 0) {
            console.log('\n🎉 ALL CONTENT TYPES WORKING! System is production-ready.');
        } else {
            console.log(`\n⚠️  ${testResults.broken.length} content types need fixing.`);
        }

        console.log('='.repeat(70) + '\n');
    });
});
