/**
 * Secure API Key Manager
 * Provides validation, encryption, and secure storage for API keys
 */

import * as CryptoJS from 'crypto-js';

// API key validation patterns
const API_KEY_PATTERNS = {
  DEEPSEEK: /^sk-[a-f0-9]{32,}$/i,
  OPENAI: /^sk-[a-zA-Z0-9]{48,}$/,
  ANTHROPIC: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
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

export class SecureApiKeyManager {
  private static instance: SecureApiKeyManager;
  private encryptionKey: string;
  private storage: Storage;

  private constructor() {
    // Generate or retrieve encryption key from secure storage
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.storage = window.localStorage;
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
  }

  /**
   * Encrypt API key before storage
   */
  public encryptApiKey(key: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(key, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Failed to encrypt API key:', error);
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
      console.error('Failed to decrypt API key:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Store API key securely
   */
  public storeApiKey(provider: string, key: string): boolean {
    try {
      // Validate the key first
      if (!this.validateApiKey(key, provider)) {
        throw new Error(`Invalid ${provider} API key format`);
      }

      // Encrypt the key
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
      this.storage.setItem(storageKey, JSON.stringify(storedKey));

      // Also update environment variable for immediate use
      this.updateEnvironmentVariable(provider, key);

      return true;
    } catch (error) {
      console.error('Failed to store API key:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt API key
   */
  public getApiKey(provider: string): string | null {
    try {
      const storageKey = `secure_api_key_${provider.toLowerCase()}`;
      const storedData = this.storage.getItem(storageKey);

      if (!storedData) {
        // Fallback to environment variable
        return this.getEnvironmentVariable(provider);
      }

      const storedKey: StoredApiKey = JSON.parse(storedData);
      
      // Verify metadata
      if (!storedKey.metadata.encrypted) {
        console.warn('API key not encrypted, removing...');
        this.removeApiKey(provider);
        return null;
      }

      // Decrypt and return
      const decryptedKey = this.decryptApiKey(storedKey.key);
      
      // Validate decrypted key
      if (!this.validateApiKey(decryptedKey, provider)) {
        console.warn('Stored API key is invalid, removing...');
        this.removeApiKey(provider);
        return null;
      }

      return decryptedKey;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      this.removeApiKey(provider); // Remove corrupted key
      return null;
    }
  }

  /**
   * Remove API key from storage
   */
  public removeApiKey(provider: string): boolean {
    try {
      const storageKey = `secure_api_key_${provider.toLowerCase()}`;
      this.storage.removeItem(storageKey);
      
      // Also clear environment variable
      this.clearEnvironmentVariable(provider);
      
      return true;
    } catch (error) {
      console.error('Failed to remove API key:', error);
      return false;
    }
  }

  /**
   * List stored API key providers (without exposing keys)
   */
  public getStoredProviders(): Array<{ provider: string; metadata: ApiKeyMetadata }> {
    const providers: Array<{ provider: string; metadata: ApiKeyMetadata }> = [];

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith('secure_api_key_')) {
          const provider = key.replace('secure_api_key_', '');
          const storedData = this.storage.getItem(key);
          
          if (storedData) {
            const storedKey: StoredApiKey = JSON.parse(storedData);
            providers.push({
              provider,
              metadata: storedKey.metadata
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to list providers:', error);
    }

    return providers;
  }

  /**
   * Test API key by making a validation request
   */
  public async testApiKey(provider: string, key?: string): Promise<boolean> {
    const apiKey = key || this.getApiKey(provider);
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
        case 'github':
          return await this.testGitHubKey(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to test ${provider} API key:`, error);
      return false;
    }
  }

  private getOrCreateEncryptionKey(): string {
    const keyName = 'deepcode_encryption_key';
    let key = this.storage.getItem(keyName);
    
    if (!key) {
      // Generate a new encryption key
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      this.storage.setItem(keyName, key);
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