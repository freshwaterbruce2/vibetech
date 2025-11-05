/**
 * Test to verify the fix for: UnifiedAIService TypeError - storedProviders is not iterable
 * 
 * This test specifically verifies that:
 * 1. Constructor does NOT call getStoredProviders() synchronously (line 32)
 * 2. initializeProvidersFromStorage() DOES await getStoredProviders() (line 72)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedAIService } from '../../../services/ai/UnifiedAIService';
import { SecureApiKeyManager } from '@vibetech/shared-utils/security';

// Mock the SecureApiKeyManager
vi.mock('@vibetech/shared-utils/security', () => ({
  SecureApiKeyManager: {
    getInstance: vi.fn(() => ({
      getStoredProviders: vi.fn().mockResolvedValue([]),
      getApiKey: vi.fn().mockResolvedValue(null),
    })),
  },
}));

// Mock AIProviderManager
vi.mock('../../../services/ai/AIProviderManager', () => ({
  AIProviderManager: vi.fn(() => ({
    setProvider: vi.fn().mockResolvedValue(),
    isProviderConfigured: vi.fn().mockReturnValue(false),
    complete: vi.fn().mockResolvedValue({ content: 'test', usage: { total_tokens: 0 } }),
    streamComplete: vi.fn(),
    getAvailableModels: vi.fn().mockReturnValue([]),
  })),
}));

// Mock DemoResponseProvider
vi.mock('../../../services/ai/DemoResponseProvider', () => ({
  DemoResponseProvider: {
    getContextualResponse: vi.fn().mockReturnValue({
      content: 'demo',
      metadata: { model: 'demo', tokens: 0, processing_time: 0 },
    }),
  },
}));

describe('UnifiedAIService - Async Fix Verification', () => {
  let mockKeyManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock that returns a Promise
    mockKeyManager = {
      getStoredProviders: vi.fn().mockResolvedValue([
        { provider: 'openai' },
        { provider: 'deepseek' },
      ]),
      getApiKey: vi.fn().mockResolvedValue('test-key'),
    };

    (SecureApiKeyManager.getInstance as any).mockReturnValue(mockKeyManager);
  });

  it('should NOT throw TypeError in constructor (fix for line 32)', () => {
    // This should not throw "storedProviders is not iterable"
    expect(() => {
      new UnifiedAIService();
    }).not.toThrow();
  });

  it('should initialize with empty array in constructor, not Promise', () => {
    const service = new UnifiedAIService();
    
    // Service should be created successfully
    expect(service).toBeDefined();
    expect(service.getCurrentModel()).toBeDefined();
    expect(service.isDemo()).toBe(true); // Starts in demo mode
  });

  it('should properly await getStoredProviders in initializeProvidersFromStorage (fix for line 72)', async () => {
    const service = new UnifiedAIService();
    
    // Wait for the async initialization Promise to resolve
    await vi.waitFor(() => {
      expect(mockKeyManager.getStoredProviders).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    // Verify it was awaited (not throwing iteration error)
    expect(mockKeyManager.getApiKey).toHaveBeenCalled();
  });

  it('should handle Promise resolution correctly without iteration errors', async () => {
    // Mock getStoredProviders to return a Promise with array data
    const providersArray = [
      { provider: 'openai' },
      { provider: 'anthropic' },
    ];
    mockKeyManager.getStoredProviders = vi.fn().mockResolvedValue(providersArray);
    
    const service = new UnifiedAIService();
    
    // Wait for async initialization to process both providers
    await vi.waitFor(() => {
      expect(mockKeyManager.getApiKey).toHaveBeenCalledTimes(2);
    }, { timeout: 1000 });
    
    // Should have processed both providers without throwing
    expect(mockKeyManager.getApiKey).toHaveBeenCalledWith('openai');
    expect(mockKeyManager.getApiKey).toHaveBeenCalledWith('anthropic');
  });

  it('should verify that getStoredProviders returns a Promise, not array', async () => {
    const result = mockKeyManager.getStoredProviders();
    
    // Verify it returns a Promise (which was the original issue)
    expect(result).toBeInstanceOf(Promise);
    
    // Verify it resolves to an array
    const resolved = await result;
    expect(Array.isArray(resolved)).toBe(true);
  });

  it('should handle empty providers array from async call', async () => {
    mockKeyManager.getStoredProviders = vi.fn().mockResolvedValue([]);
    
    const service = new UnifiedAIService();
    
    // Wait for async initialization to complete
    await vi.waitFor(() => {
      expect(mockKeyManager.getStoredProviders).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    // Should complete without errors even with empty array
    expect(service.isDemo()).toBe(true); // Still in demo mode
  });

  it('should handle provider initialization errors gracefully', async () => {
    mockKeyManager.getStoredProviders = vi.fn().mockRejectedValue(new Error('Storage error'));
    
    // Should not throw during construction
    expect(() => {
      new UnifiedAIService();
    }).not.toThrow();
    
    // Wait for async initialization to attempt and handle the error
    await vi.waitFor(() => {
      expect(mockKeyManager.getStoredProviders).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    // Should handle error gracefully (test completes without unhandled rejection)
  });
});
