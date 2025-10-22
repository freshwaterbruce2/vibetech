/**
 * DeepSeek API Mock for Testing
 * Provides realistic mock responses for AI completion tests
 */

import { Page } from 'puppeteer';

export interface MockCompletionOptions {
  completionText?: string;
  delay?: number;
  shouldFail?: boolean;
  errorMessage?: string;
}

/**
 * Setup mock for DeepSeek API calls
 * Intercepts requests and returns predefined responses
 */
export async function setupDeepSeekMock(
  page: Page,
  options: MockCompletionOptions = {}
): Promise<void> {
  const {
    completionText = '  return a + b;\n}',
    delay = 100,
    shouldFail = false,
    errorMessage = 'API Error'
  } = options;

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const url = request.url();

    // Only intercept DeepSeek API calls
    if (url.includes('api.deepseek.com') || url.includes('/chat/completions')) {
      if (shouldFail) {
        request.respond({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: errorMessage,
              type: 'api_error'
            }
          })
        });
      } else {
        setTimeout(() => {
          request.respond({
            status: 200,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: JSON.stringify({
              id: 'chatcmpl-mock-' + Date.now(),
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: 'deepseek-chat',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: completionText
                  },
                  finish_reason: 'stop'
                }
              ],
              usage: {
                prompt_tokens: 50,
                completion_tokens: 15,
                total_tokens: 65
              }
            })
          });
        }, delay);
      }
    } else {
      // Let other requests through
      request.continue();
    }
  });
}

/**
 * Mock completion for function declaration
 */
export const MOCK_FUNCTION_COMPLETION = `  const sum = a + b;
  console.log('Calculating sum:', sum);
  return sum;
}`;

/**
 * Mock completion for class declaration
 */
export const MOCK_CLASS_COMPLETION = `  constructor(name: string) {
    this.name = name;
  }

  greet() {
    console.log(\`Hello, \${this.name}!\`);
  }
}`;

/**
 * Mock completion for arrow function
 */
export const MOCK_ARROW_FUNCTION_COMPLETION = ` {
  return a + b;
};`;

/**
 * Mock completion for comment
 */
export const MOCK_COMMENT_COMPLETION = ` add error handling here
   if (!input) {
     throw new Error('Input is required');
   }`;

/**
 * Setup mock with predefined completion based on code context
 */
export async function setupContextualMock(page: Page): Promise<void> {
  await page.setRequestInterception(true);

  page.on('request', async (request) => {
    const url = request.url();

    if (url.includes('api.deepseek.com') || url.includes('/chat/completions')) {
      try {
        const postData = request.postData();
        if (!postData) {
          request.continue();
          return;
        }

        const data = JSON.parse(postData);
        const messages = data.messages || [];
        const lastMessage = messages[messages.length - 1];
        const content = lastMessage?.content || '';

        // Determine completion based on context
        let completionText = '  return result;\n}';

        if (content.includes('function')) {
          completionText = MOCK_FUNCTION_COMPLETION;
        } else if (content.includes('class')) {
          completionText = MOCK_CLASS_COMPLETION;
        } else if (content.includes('=>')) {
          completionText = MOCK_ARROW_FUNCTION_COMPLETION;
        } else if (content.includes('TODO')) {
          completionText = MOCK_COMMENT_COMPLETION;
        }

        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify({
            id: 'chatcmpl-contextual-' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'deepseek-chat',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: completionText
                },
                finish_reason: 'stop'
              }
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 30,
              total_tokens: 130
            }
          })
        });
      } catch (error) {
        console.error('Error parsing request data:', error);
        request.continue();
      }
    } else {
      request.continue();
    }
  });
}

/**
 * Clear all request interception
 */
export async function clearMocks(page: Page): Promise<void> {
  await page.setRequestInterception(false);
  page.removeAllListeners('request');
}

/**
 * Setup streaming mock (for future streaming tests)
 */
export async function setupStreamingMock(page: Page): Promise<void> {
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const url = request.url();

    if (url.includes('api.deepseek.com') || url.includes('/chat/completions')) {
      // Simulate streaming response with SSE format
      const chunks = [
        'data: {"id":"1","choices":[{"delta":{"content":"  return"}}]}\n\n',
        'data: {"id":"1","choices":[{"delta":{"content":" a"}}]}\n\n',
        'data: {"id":"1","choices":[{"delta":{"content":" +"}}]}\n\n',
        'data: {"id":"1","choices":[{"delta":{"content":" b"}}]}\n\n',
        'data: {"id":"1","choices":[{"delta":{"content":";"}}]}\n\n',
        'data: {"id":"1","choices":[{"delta":{"content":"\\n}"}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      request.respond({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: chunks.join('')
      });
    } else {
      request.continue();
    }
  });
}
