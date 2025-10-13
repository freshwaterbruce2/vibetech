/**
 * Axios Mock for Jest Tests
 * Prevents real HTTP requests during testing
 */

const mockResponse = {
    data: {
        id: 'mock-completion-id',
        choices: [{
            message: {
                role: 'assistant',
                content: '<html><head><title>Mock Content</title></head><body><h1>Test Content</h1><p>This is mocked content for testing.</p></body></html>'
            },
            finish_reason: 'stop'
        }],
        usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300
        }
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
};

const mockModelsResponse = {
    data: {
        data: [
            { id: 'deepseek-chat', object: 'model' },
            { id: 'deepseek-coder', object: 'model' }
        ]
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
};

// Mock error response for authentication failures
const mockUnauthorizedError = {
    response: {
        status: 401,
        statusText: 'Unauthorized',
        data: {
            error: {
                message: 'Invalid authentication credentials',
                type: 'invalid_request_error',
                code: 'invalid_api_key'
            }
        }
    },
    message: 'Request failed with status code 401'
};

const mockAxiosInstance = {
    get: () => Promise.resolve(mockModelsResponse),
    post: () => {
        // Simulate API key validation - test environment uses fake key
        if (process.env.NODE_ENV === 'test' && process.env.DEEPSEEK_API_KEY === 'sk-test-key-for-testing') {
            return Promise.reject(mockUnauthorizedError);
        }
        return Promise.resolve(mockResponse);
    },
    put: () => Promise.resolve(mockResponse),
    delete: () => Promise.resolve(mockResponse),
    patch: () => Promise.resolve(mockResponse),
    defaults: {
        headers: {
            common: {},
            get: {},
            post: {},
            put: {},
            delete: {},
            patch: {}
        }
    },
    interceptors: {
        request: { use: () => {}, eject: () => {} },
        response: { use: () => {}, eject: () => {} }
    }
};

const axios = {
    get: () => Promise.resolve(mockModelsResponse),
    post: () => {
        // Simulate API key validation - test environment uses fake key
        if (process.env.NODE_ENV === 'test' && process.env.DEEPSEEK_API_KEY === 'sk-test-key-for-testing') {
            return Promise.reject(mockUnauthorizedError);
        }
        return Promise.resolve(mockResponse);
    },
    put: () => Promise.resolve(mockResponse),
    delete: () => Promise.resolve(mockResponse),
    patch: () => Promise.resolve(mockResponse),
    create: () => mockAxiosInstance,
    defaults: {
        headers: {
            common: {},
            get: {},
            post: {},
            put: {},
            delete: {},
            patch: {}
        }
    },
    interceptors: {
        request: { use: () => {}, eject: () => {} },
        response: { use: () => {}, eject: () => {} }
    }
};

export default axios;
