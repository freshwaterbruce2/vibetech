// Environment configuration with validation and type safety
interface EnvironmentConfig {
  app: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
  }
  api: {
    baseUrl: string
    timeout: number
  }
  services: {
    liteApi: {
      baseUrl: string
      apiKey: string
    }
    square: {
      applicationId: string
      locationId: string
      environment: 'sandbox' | 'production'
    }
    mapbox: {
      accessToken: string
    }
  }
  auth: {
    domain: string
    clientId: string
    jwtSecret: string
  }
  features: {
    analytics: boolean
    chatSupport: boolean
    pushNotifications: boolean
    devTools: boolean
  }
  monitoring: {
    sentryDsn?: string
    gtmId?: string
  }
  logs: {
    level: 'debug' | 'info' | 'warn' | 'error'
  }
}

// Validation function to ensure required environment variables are present
function validateEnvironment(): void {
  const requiredVars = [
    'VITE_APP_NAME',
    'VITE_APP_VERSION',
    'VITE_APP_ENVIRONMENT',
    'VITE_API_BASE_URL',
    'VITE_LITEAPI_BASE_URL',
    'VITE_AUTH_DOMAIN',
    'VITE_SQUARE_APPLICATION_ID'
  ]

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
}

// Helper function to parse boolean environment variables
function parseBooleanEnv(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

// Helper function to parse number environment variables
function parseNumberEnv(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

// Validate environment on module load
validateEnvironment()

// Export validated and typed configuration
export const config: EnvironmentConfig = {
  app: {
    name: import.meta.env.VITE_APP_NAME!,
    version: import.meta.env.VITE_APP_VERSION!,
    environment: import.meta.env.VITE_APP_ENVIRONMENT as 'development' | 'staging' | 'production'
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL!,
    timeout: parseNumberEnv(import.meta.env.VITE_API_TIMEOUT, 30000)
  },
  services: {
    liteApi: {
      baseUrl: import.meta.env.VITE_LITEAPI_BASE_URL!,
      apiKey: import.meta.env.VITE_LITEAPI_API_KEY || ''
    },
    square: {
      applicationId: import.meta.env.VITE_SQUARE_APPLICATION_ID!,
      locationId: import.meta.env.VITE_SQUARE_LOCATION_ID || '',
      environment: (import.meta.env.VITE_SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    },
    mapbox: {
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
    }
  },
  auth: {
    domain: import.meta.env.VITE_AUTH_DOMAIN!,
    clientId: import.meta.env.VITE_AUTH_CLIENT_ID || '',
    jwtSecret: import.meta.env.VITE_JWT_SECRET || ''
  },
  features: {
    analytics: parseBooleanEnv(import.meta.env.VITE_ENABLE_ANALYTICS),
    chatSupport: parseBooleanEnv(import.meta.env.VITE_ENABLE_CHAT_SUPPORT, true),
    pushNotifications: parseBooleanEnv(import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS),
    devTools: parseBooleanEnv(import.meta.env.VITE_ENABLE_DEV_TOOLS, true)
  },
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    gtmId: import.meta.env.VITE_GTM_ID
  },
  logs: {
    level: (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info'
  }
}

// Environment-specific flags
export const isDevelopment = config.app.environment === 'development'
export const isProduction = config.app.environment === 'production'
export const isStaging = config.app.environment === 'staging'

// API endpoint builders
export const endpoints = {
  auth: {
    login: `${config.api.baseUrl}/auth/login`,
    register: `${config.api.baseUrl}/auth/register`,
    refresh: `${config.api.baseUrl}/auth/refresh`,
    logout: `${config.api.baseUrl}/auth/logout`
  },
  hotels: {
    search: `${config.services.liteApi.baseUrl}/hotels/search`,
    details: (id: string) => `${config.services.liteApi.baseUrl}/hotels/${id}`,
    availability: `${config.services.liteApi.baseUrl}/hotels/availability`,
    booking: `${config.services.liteApi.baseUrl}/bookings`
  },
  user: {
    profile: `${config.api.baseUrl}/user/profile`,
    bookings: `${config.api.baseUrl}/user/bookings`,
    favorites: `${config.api.baseUrl}/user/favorites`
  },
  payment: {
    createPayment: `${config.api.baseUrl}/payments/create`,
    processPayment: `${config.api.baseUrl}/payments/process`,
    refund: `${config.api.baseUrl}/payments/refund`
  }
}

export default config