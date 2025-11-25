/**
 * Secure API Key Manager
 * Provides validation, encryption, and secure storage for API keys
 */
import * as CryptoJS from 'crypto-js';

import { logger } from '../services/Logger';

// API key validation patterns
const API_KEY_PATTERNS = {
  DEEPSEEK: /^sk-[a-zA-Z0-9]{32,}$/, // Fixed: DeepSeek uses alphanumeric, not just hex
  OPENAI: /^sk-[a-zA-Z0-9]{48,}$/,
  ANTHROPIC: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
  GOOGLE: /^AIza[a-zA-Z0-9\-_]{35}$/,
  GITHUB: /^ghp_[a-zA-Z0-9]{36}$|^github_pat_[a-zA-Z0-9_]{82}$/
};

interface ApiKeyMetadata {
  provider: string;
  isValid: boolean;
  lastValidated: Date;
  encrypted: boolean;
}

interface StoredApiKey {
  key: string;
  metadata: ApiKeyMetadata;
}

interface ElectronStorageAPI {
  get: (key: string) => Promise<{ success: boolean; value: any; error?: string }>;
  set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
  remove: (key: string) => Promise<{ success: boolean; error?: string }>;
  keys: () => Promise<{ success: boolean; keys: string[]; error?: string }>;
}

export class SecureApiKeyManager {
  private static instance: SecureApiKeyManager;
  private encryptionKey: string;
  private storage: Storage;
  private electronStorage: ElectronStorageAPI | null = null;
  private isElectron: boolean = false;

  private constructor() {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electron?.storage) {
      this.isElectron = true;
      this.electronStorage = (window as any).electron.storage;
      logger.info('Using Electron secure storage for API keys');
    } else {
      logger.info('Using localStorage for API keys (browser mode)');
    }

    // Initialize storage first, then get encryption key
    this.storage = window.localStorage;
    // Generate or retrieve encryption key from secure storage
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  public static getInstance(): SecureApiKeyManager {
    if (!SecureApiKeyManager.instance) {
      SecureApiKeyManager.instance = new SecureApiKeyManager();
    }
    return SecureApiKeyManager.instance;
  }

  /**
   * Validate API key format and structure
   */
  public validateApiKey(key: string, provider: string): boolean {
    try {
      if (!key || typeof key !== 'string') {
        return false;
      }

      // Remove whitespace
      const cleanKey = key.trim();

      // Check minimum length
      if (cleanKey.length < 20) {
        return false;
      }

      // Check for obvious security issues
      if (this.containsSuspiciousPatterns(cleanKey)) {
        return false;
      }

      // Validate against provider-specific patterns
      const pattern = API_KEY_PATTERNS[provider.toUpperCase() as keyof typeof API_KEY_PATTERNS];
      if (pattern && !pattern.test(cleanKey)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('API key validation error:', error);
      return false;
    }
  }

  /**
   * Encrypt API key before storage
   */
  public encryptApiKey(key: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(key, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      logger.error('Failed to encrypt API key:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt API key from storage
   */
  public decryptApiKey(encryptedKey: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedKey, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error('Invalid encryption key or corrupted data');
      }

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt API key:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Store API key securely
   */
  public async storeApiKey(provider: string, key: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('[SecureApiKeyManager] storeApiKey called for provider:', provider);
    logger.debug('[SecureApiKeyManager] isElectron:', this.isElectron);
    logger.debug('[SecureApiKeyManager] electronStorage exists:', !!this.electronStorage);

    try {
      // Validate the key first
      logger.debug('[SecureApiKeyManager] Validating API key...');
      if (!this.validateApiKey(key, provider)) {
        logger.error('[SecureApiKeyManager] API key validation FAILED');
        throw new Error(`Invalid ${provider} API key format`);
      }
      logger.debug('[SecureApiKeyManager] API key validation passed');

      // Encrypt the key
      logger.debug('[SecureApiKeyManager] Encrypting API key...');
      const encryptedKey = this.encryptApiKey(key);

      // Create metadata
      const metadata: ApiKeyMetadata = {
        provider: provider.toLowerCase(),
        isValid: true,
        lastValidated: new Date(),
        encrypted: true
      };

      // Store the encrypted key with metadata
      const storedKey: StoredApiKey = {
        key: encryptedKey,
        metadata
      };

      const storageKey = `secure_api_key_${provider.toLowerCase()}`;
      logger.debug('[SecureApiKeyManager] Storage key:', storageKey);

      // Use Electron storage if available
      if (this.isElectron && this.electronStorage) {
        logger.debug('[SecureApiKeyManager] Calling Electron storage.set via IPC...');
        const result = await this.electronStorage.set(storageKey, JSON.stringify(storedKey));
        logger.debug('[SecureApiKeyManager] Electron storage.set result:', result);

        if (!result.success) {
          logger.error('[SecureApiKeyManager] Electron storage.set returned failure:', result);
          throw new Error('Failed to save to Electron storage: ' + (result.error || 'unknown error'));
        }
        logger.debug('[SecureApiKeyManager] Electron storage.set SUCCESS');
      } else {
        logger.warn('[SecureApiKeyManager] Electron storage NOT available, isElectron:', this.isElectron);
      }

      // Always also save to localStorage as a fallback for immediate use
      logger.debug('[SecureApiKeyManager] Saving to localStorage as fallback...');
      this.storage.setItem(storageKey, JSON.stringify(storedKey));
      logger.debug('[SecureApiKeyManager] localStorage save complete');

      // Also update environment variable for immediate use
      this.updateEnvironmentVariable(provider, key);

      logger.debug('[SecureApiKeyManager] storeApiKey completed successfully');
      return { success: true };
    } catch (error) {
      logger.error('[SecureApiKeyManager] storeApiKey FAILED:', error);
      logger.error('Failed to store API key:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Retrieve and decrypt API key
   */
  public async getApiKey(provider: string): Promise<string | null> {
    try {
      const storageKey = `secure_api_key_${provider.toLowerCase()}`;
      let storedData = null;

      // Try Electron storage first
      if (this.isElectron && this.electronStorage) {
        const result = await this.electronStorage.get(storageKey);
        if (result.success && result.value) {
          storedData = result.value;
        }
      }

      // Fallback to localStorage if not found in Electron storage
      if (!storedData) {
        storedData = this.storage.getItem(storageKey);
      }

      if (!storedData) {
        // Fallback to environment variable
        return this.getEnvironmentVariable(provider);
      }

      const storedKey: StoredApiKey = typeof storedData === 'string' ?
        JSON.parse(storedData) : storedData;

      // Verify metadata
      if (!storedKey.metadata.encrypted) {
        logger.warn('API key not encrypted, removing...');
        await this.removeApiKey(provider);
        return null;
      }

      // Decrypt and return
      const decryptedKey = this.decryptApiKey(storedKey.key);

      // Validate decrypted key
      if (!this.validateApiKey(decryptedKey, provider)) {
        logger.warn('Stored API key is invalid, removing...');
        await this.removeApiKey(provider);
        return null;
      }

      return decryptedKey;
    } catch (error) {
      logger.error('Failed to retrieve API key:', error);
      await this.removeApiKey(provider); // Remove corrupted key
      return null;
    }
  }

  /**
   * Remove API key from storage
   */
  public async removeApiKey(provider: string): Promise<boolean> {
    try {
      const storageKey = `secure_api_key_${provider.toLowerCase()}`;

      // Remove from Electron storage if available
      if (this.isElectron && this.electronStorage) {
        await this.electronStorage.remove(storageKey);
      }

      // Also remove from localStorage
      this.storage.removeItem(storageKey);

      // Also clear environment variable
      this.clearEnvironmentVariable(provider);

      return true;
    } catch (error) {
      logger.error('Failed to remove API key:', error);
      return false;
    }
  }

  /**
   * List stored API key providers (without exposing keys)
   */
  public async getStoredProviders(): Promise<Array<{ provider: string; metadata: ApiKeyMetadata }>> {
    const providers: Array<{ provider: string; metadata: ApiKeyMetadata }> = [];

    try {
      let keys: string[] = [];

      // Try Electron storage first
      if (this.isElectron && this.electronStorage) {
        const result = await this.electronStorage.keys();
        if (result.success && result.keys) {
          ({ keys } = result);
        }
      }

      // Fallback to localStorage
      if (keys.length === 0) {
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key) { keys.push(key); }
        }
      }

      // Process keys
      for (const key of keys) {
        if (key && key.startsWith('secure_api_key_')) {
          const provider = key.replace('secure_api_key_', '');
          let storedData = null;

          // Try Electron storage first
          if (this.isElectron && this.electronStorage) {
            const result = await this.electronStorage.get(key);
            if (result.success && result.value) {
              storedData = result.value;
            }
          }

          // Fallback to localStorage
          if (!storedData) {
            storedData = this.storage.getItem(key);
          }

          if (storedData) {
            const storedKey: StoredApiKey = typeof storedData === 'string' ?
              JSON.parse(storedData) : storedData;
            providers.push({
              provider,
              metadata: storedKey.metadata
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to list providers:', error);
    }

    return providers;
  }

  /**
   * Test API key by making a validation request
   */
  public async testApiKey(provider: string, key?: string): Promise<boolean> {
    const apiKey = key || await this.getApiKey(provider);
    if (!apiKey) {
      return false;
    }

    try {
      switch (provider.toLowerCase()) {
        case 'deepseek':
          return await this.testDeepSeekKey(apiKey);
        case 'openai':
          return await this.testOpenAIKey(apiKey);
        case 'anthropic':
          return await this.testAnthropicKey(apiKey);
        case 'google':
          return await this.testGoogleKey(apiKey);
        case 'github':
          return await this.testGitHubKey(apiKey);
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Failed to test ${provider} API key:`, error);
      return false;
    }
  }


  private getOrCreateEncryptionKey(): string {
    const keyName = 'deepcode_encryption_key';
    let key = this.storage.getItem(keyName);

    if (!key) {
      // Generate a new encryption key
      key = CryptoJS.lib.WordArray.random(256 / 8).toString();
      this.storage.setItem(keyName, key);

      // Also save to Electron storage if available (non-blocking)
      if (this.isElectron && this.electronStorage) {
        this.electronStorage.set(keyName, key).catch(err =>
          logger.error('Failed to save encryption key to Electron storage:', err)
        );
      }
    }

    return key;
  }

  private containsSuspiciousPatterns(key: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /eval\(/i,
      /function\s*\(/i,
      /\bexec\b/i,
      /\bsystem\b/i,
      /\.\.\//,
      /[<>'"]/
    ];

    return suspiciousPatterns.some(pattern => pattern.test(key));
  }

  private updateEnvironmentVariable(provider: string, key: string): void {
    // Update the environment variable for immediate use
    const envVarName = `VITE_${provider.toUpperCase()}_API_KEY`;
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // In Electron, we can't directly set env vars, but we can store for the session
      (window as any).electronAPI.setTempEnvVar(envVarName, key);
    }
  }

  private getEnvironmentVariable(provider: string): string | null {
    const envVarName = `VITE_${provider.toUpperCase()}_API_KEY`;
    try {
      // Try process.env first (Node.js environment)
      if (typeof process !== 'undefined' && process.env) {
        return process.env[envVarName] || null;
      }
      // For browser environments, this will be handled by bundler
      // Return null as we can't access import.meta.env safely here
    } catch (error) {
      // Environment variables not available
    }
    return null;
  }

  private clearEnvironmentVariable(provider: string): void {
    const envVarName = `VITE_${provider.toUpperCase()}_API_KEY`;
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.clearTempEnvVar(envVarName);
    }
  }

  private async testDeepSeekKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testOpenAIKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testAnthropicKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  private async testGoogleKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testGitHubKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${key}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default SecureApiKeyManager;
