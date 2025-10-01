/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENVIRONMENT: 'development' | 'staging' | 'production'

  // API Configuration
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string

  // Hotel Booking APIs
  readonly VITE_LITEAPI_BASE_URL: string
  readonly VITE_LITEAPI_API_KEY: string

  // Authentication
  readonly VITE_AUTH_DOMAIN: string
  readonly VITE_AUTH_CLIENT_ID: string
  readonly VITE_JWT_SECRET: string

  // Payment Processing
  readonly VITE_SQUARE_APPLICATION_ID: string
  readonly VITE_SQUARE_LOCATION_ID: string
  readonly VITE_SQUARE_ENVIRONMENT: 'sandbox' | 'production'

  // Map Integration
  readonly VITE_MAPBOX_ACCESS_TOKEN: string

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_CHAT_SUPPORT: string
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS: string

  // Development Tools
  readonly VITE_ENABLE_DEV_TOOLS: string
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'

  // Optional monitoring
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GTM_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}