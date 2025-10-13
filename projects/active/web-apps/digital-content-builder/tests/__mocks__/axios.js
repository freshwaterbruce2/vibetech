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

const mockAxiosInstance = {
    get: () => Promise.resolve(mockModelsResponse),
    post: () => Promise.resolve(mockResponse),
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
    post: () => Promise.resolve(mockResponse),
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
