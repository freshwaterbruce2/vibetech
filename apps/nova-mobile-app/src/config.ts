// Configuration for NOVA Mobile App

// For development on simulator/emulator
// - iOS Simulator: Use 'localhost' or '127.0.0.1'
// - Android Emulator: Use '10.0.2.2' (special alias for host machine)
// - Physical device: Use your computer's IP address (e.g., '192.168.1.100')

const DEV_CONFIG = {
  // Update this with your computer's IP when testing on physical device
  API_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.nova-ai.com',
  
  // WebSocket URL for real-time features (future enhancement)
  WS_URL: __DEV__ ? 'ws://localhost:3000' : 'wss://api.nova-ai.com',
  
  // API timeout in milliseconds
  API_TIMEOUT: 30000,
  
  // Enable debug logging
  DEBUG: __DEV__,
};

export const config = {
  ...DEV_CONFIG,
  
  // App metadata
  APP_NAME: 'NOVA AI Assistant',
  APP_VERSION: '1.0.0',
  
  // Feature flags
  FEATURES: {
    VOICE_INPUT: true,
    OFFLINE_MODE: false,
    BIOMETRIC_AUTH: false,
    PUSH_NOTIFICATIONS: true,
  },
  
  // UI configuration
  UI: {
    MAX_MESSAGE_LENGTH: 5000,
    MESSAGE_BATCH_SIZE: 20,
    THEME: {
      PRIMARY_COLOR: '#007bff',
      SECONDARY_COLOR: '#2d2d2d',
      BACKGROUND_COLOR: '#1a1a1a',
      TEXT_COLOR: '#ffffff',
      BORDER_COLOR: '#404040',
    },
  },
};

// Helper function to get the correct API URL
export const getApiUrl = (endpoint: string) => {
  const baseUrl = config.API_URL;
  return `${baseUrl}${endpoint}`;
};