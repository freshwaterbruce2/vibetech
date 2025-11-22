export interface ErrorInfo {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
  retryable?: boolean;
}

export class ApiError extends Error {
  code?: string | undefined;
  details?: unknown;
  retryable: boolean;

  constructor(message: string, code?: string, details?: unknown, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;

interface ErrorWithCode {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data: unknown;
    headers?: Record<string, string>;
  };
}

export function handleApiError(error: unknown): ErrorInfo {
  const timestamp = new Date();
  const err = error as ErrorWithCode;
  
  // Network errors
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please check your connection and try again.',
      code: ErrorCodes.TIMEOUT,
      details: err,
      timestamp,
      retryable: true,
    };
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return {
      message: 'Unable to connect to the AI service. Please check your internet connection.',
      code: ErrorCodes.NETWORK_ERROR,
      details: err,
      timestamp,
      retryable: true,
    };
  }

  // API response errors
  if (err.response) {
    const { status } = err.response;
    const { data } = err.response;

    switch (status) {
      case 401:
        return {
          message: 'Invalid API key. Please check your DeepSeek API key in settings.',
          code: ErrorCodes.AUTH_ERROR,
          details: data,
          timestamp,
          retryable: false,
        };

      case 429: {
        const retryAfter = err.response.headers?.['retry-after'];
        return {
          message: `Rate limit exceeded. ${retryAfter ? `Please wait ${retryAfter} seconds.` : 'Please try again later.'}`,
          code: ErrorCodes.RATE_LIMIT,
          details: { ...(typeof data === 'object' && data !== null ? data : {}), retryAfter },
          timestamp,
          retryable: true,
        };
      }

      case 400:
        return {
          message: 'Invalid request. Please check your input and try again.',
          code: ErrorCodes.INVALID_REQUEST,
          details: data,
          timestamp,
          retryable: false,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: 'The AI service is temporarily unavailable. Please try again later.',
          code: ErrorCodes.SERVER_ERROR,
          details: data,
          timestamp,
          retryable: true,
        };

      default:
        return {
          message: `An error occurred: ${(data as { message?: string })?.message || status}`,
          code: ErrorCodes.UNKNOWN,
          details: data,
          timestamp,
          retryable: false,
        };
    }
  }

  // Generic errors
  return {
    message: err.message || 'An unexpected error occurred',
    code: ErrorCodes.UNKNOWN,
    details: err,
    timestamp,
    retryable: false,
  };
}

export function getUserFriendlyError(error: ErrorInfo): string {
  if (error.code === ErrorCodes.AUTH_ERROR) {
    return '🔑 Authentication failed. Please update your API key in settings.';
  }

  if (error.code === ErrorCodes.RATE_LIMIT) {
    return `⏱️ ${error.message}`;
  }

  if (error.code === ErrorCodes.NETWORK_ERROR || error.code === ErrorCodes.TIMEOUT) {
    return `🌐 ${error.message}`;
  }

  if (error.code === ErrorCodes.SERVER_ERROR) {
    return `🔧 ${error.message}`;
  }

  return `❌ ${error.message}`;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = handleApiError(error);

      if (!errorInfo.retryable || i === maxRetries - 1) {
        throw new ApiError(
          errorInfo.message,
          errorInfo.code,
          errorInfo.details,
          errorInfo.retryable
        );
      }

      const delay = initialDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
