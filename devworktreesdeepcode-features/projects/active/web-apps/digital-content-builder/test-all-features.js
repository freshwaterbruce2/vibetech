/**
 * Comprehensive Test Suite for Vibe Content AI
 * Tests all major features and endpoints
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5556';
const TEST_RESULTS = [];

// Test configuration
const TESTS = [
    {
        name: 'Health Check',
        method: 'GET',
        endpoint: '/api/health',
        expectedStatus: 200
    },
    {
        name: 'API Documentation',
        method: 'GET',
        endpoint: '/api-docs',
        expectedStatus: 200
    },
    {
        name: 'OpenAPI Schema',
        method: 'GET',
        endpoint: '/api-docs.json',
        expectedStatus: 200
    },
    {
        name: 'Main Interface',
        method: 'GET',
        endpoint: '/',
        expectedStatus: 200
    },
    {
        name: 'Content Generation - Blog',
        method: 'POST',
        endpoint: '/api/deepseek/generate',
        data: {
            prompt: 'Write a brief blog post about AI technology in 2025',
            contentType: 'blog',
            model: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 500,
            stream: false
        },
        expectedStatus: 200
    },
    {
        name: 'Content Generation - Landing Page',
        method: 'POST',
        endpoint: '/api/deepseek/generate',
        data: {
            prompt: 'Create landing page copy for a tech startup',
            contentType: 'landing',
            model: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 300,
            stream: false
        },
        expectedStatus: 200
    }
];

async function runTest(test) {
    const startTime = performance.now();

    try {
        console.log(`🧪 Testing: ${test.name}`);

        const config = {
            method: test.method,
            url: `${BASE_URL}${test.endpoint}`,
            timeout: 30000,
            validateStatus: () => true // Don't throw on any status code
        };

        if (test.data) {
            config.data = test.data;
            config.headers = {
                'Content-Type': 'application/json'
            };
        }

        const response = await axios(config);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const result = {
            name: test.name,
            status: response.status === test.expectedStatus ? '✅ PASS' : '❌ FAIL',
            statusCode: response.status,
            expectedStatus: test.expectedStatus,
            duration: `${duration}ms`,
            responseSize: response.data ? JSON.stringify(response.data).length : 0,
            success: response.status === test.expectedStatus
        };

        // Additional validation for specific tests
        if (test.name === 'Health Check' && response.status === 200) {
            const health = response.data;
            result.details = {
                status: health.status,
                uptime: health.uptime,
                memory: health.memory,
                apiStatus: health.deepseek?.status
            };
        }

        if (test.name.includes('Content Generation') && response.status === 200) {
            const content = response.data;
            result.details = {
                hasContent: !!content.content,
                hasSanitized: !!content.sanitizedContent,
                hasMetadata: !!content.metadata,
                contentLength: content.content?.length || 0
            };
        }

        TEST_RESULTS.push(result);
        console.log(`   ${result.status} - ${result.duration} - Status: ${result.statusCode}`);

        if (result.details) {
            console.log(`   Details:`, result.details);
        }

    } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const result = {
            name: test.name,
            status: '❌ ERROR',
            statusCode: 'N/A',
            expectedStatus: test.expectedStatus,
            duration: `${duration}ms`,
            error: error.message,
            success: false
        };

        TEST_RESULTS.push(result);
        console.log(`   ❌ ERROR - ${error.message}`);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite for Vibe Content AI');
    console.log('=' .repeat(60));

    const overallStart = performance.now();

    for (const test of TESTS) {
        await runTest(test);

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const overallEnd = performance.now();
    const totalDuration = Math.round(overallEnd - overallStart);

    // Generate summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));

    const passed = TEST_RESULTS.filter(r => r.success).length;
    const failed = TEST_RESULTS.filter(r => !r.success).length;

    console.log(`Total Tests: ${TEST_RESULTS.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${Math.round((passed / TEST_RESULTS.length) * 100)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);

    console.log('\nDetailed Results:');
    TEST_RESULTS.forEach(result => {
        console.log(`${result.status} ${result.name} (${result.duration})`);
        if (result.error) {
            console.log(`    Error: ${result.error}`);
        }
    });

    // Feature verification
    console.log('\n🔍 FEATURE VERIFICATION:');
    console.log(`✅ Server Health: ${TEST_RESULTS.find(r => r.name === 'Health Check')?.success ? 'Working' : 'Failed'}`);
    console.log(`✅ UI Interface: ${TEST_RESULTS.find(r => r.name === 'Main Interface')?.success ? 'Loading' : 'Failed'}`);
    console.log(`✅ API Documentation: ${TEST_RESULTS.find(r => r.name === 'API Documentation')?.success ? 'Available' : 'Failed'}`);
    console.log(`✅ AI Content Generation: ${TEST_RESULTS.filter(r => r.name.includes('Content Generation') && r.success).length > 0 ? 'Working' : 'Failed'}`);

    const overallSuccess = failed === 0;
    console.log(`\n${overallSuccess ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
    console.log('Vibe Content AI is ' + (overallSuccess ? 'READY FOR PRODUCTION! 🚀' : 'needs attention before deployment'));

    return overallSuccess;
}

// Run the tests
runAllTests().catch(console.error);
