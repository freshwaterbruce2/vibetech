/**
 * Jest Test Setup - Digital Content Builder v2.0.0
 * Follows 2025 testing best practices
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port
process.env.DEEPSEEK_API_KEY = 'sk-test-key-for-testing';

// Note: axios is mocked via manual mock in tests/__mocks__/axios.js
// This prevents real HTTP requests to DeepSeek API during testing

// Global test timeout (30 seconds for AI generation tests)
// Note: setTimeout is set in Jest config or individual test files

// Mock console methods in tests (can be overridden in individual tests)
global.console = {
    ...console,
    // Uncomment to suppress logs during tests
    // log: jest.fn(),
    // error: jest.fn(),
    // warn: jest.fn(),
    // info: jest.fn(),
};

// Global test utilities
global.testUtils = {
    // Sleep utility for async testing
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Generate random test data
    randomString: (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Generate test email
    testEmail: () => `test-${Date.now()}@example.com`,

    // Generate test content
    testContent: (type = 'general') => ({
        prompt: `Generate a test ${type} content for automated testing purposes`,
        contentType: type,
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 1000,
        stream: false
    })
};

// Setup and teardown hooks
beforeAll(() => {
    console.log('🧪 Starting Digital Content Builder Test Suite v2.0.0');
});

afterAll(() => {
    console.log('✅ Test Suite Completed');
});

// Handle unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process in tests, just log
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process in tests, just log
});

// Export test utilities for use in test files
export const testUtils = global.testUtils;