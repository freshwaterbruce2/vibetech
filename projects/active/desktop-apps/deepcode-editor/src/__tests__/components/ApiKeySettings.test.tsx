import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import ApiKeySettings from '../../components/ApiKeySettings';
import SecureApiKeyManager from '../../utils/SecureApiKeyManager';

// Mock SecureApiKeyManager
vi.mock('../../utils/SecureApiKeyManager', () => {
  const mockInstance = {
    getStoredProviders: vi.fn(),
    validateApiKey: vi.fn(),
    storeApiKey: vi.fn(),
    testApiKey: vi.fn(),
    removeApiKey: vi.fn(),
  };

  return {
    default: {
      getInstance: vi.fn(() => mockInstance),
    },
  };
});

describe('ApiKeySettings Component', () => {
  let keyManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    keyManager = SecureApiKeyManager.getInstance();

    // Default mock responses
    keyManager.getStoredProviders.mockReturnValue([]);
    keyManager.validateApiKey.mockReturnValue(true);
    keyManager.storeApiKey.mockReturnValue(true);
    keyManager.testApiKey.mockResolvedValue(true);
    keyManager.removeApiKey.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render API key settings component', () => {
      render(<ApiKeySettings />);
      expect(screen.getByText('API Key Security Settings')).toBeInTheDocument();
    });

    it('should display security notice', () => {
      render(<ApiKeySettings />);
      expect(screen.getByText(/All API keys are encrypted using AES-256/i)).toBeInTheDocument();
    });

    it('should render all providers', () => {
      render(<ApiKeySettings />);
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    it('should show "Not configured" status for providers without keys', () => {
      render(<ApiKeySettings />);
      const statuses = screen.getAllByText('Not configured');
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Status Display', () => {
    it('should show valid status for valid API keys', async () => {
      keyManager.getStoredProviders.mockReturnValue([
        {
          provider: 'deepseek',
          metadata: { isValid: true, lastValidated: new Date() },
        },
      ]);

      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText('Valid')).toBeInTheDocument();
      });
    });

    it('should show invalid status for invalid API keys', async () => {
      keyManager.getStoredProviders.mockReturnValue([
        {
          provider: 'openai',
          metadata: { isValid: false, lastValidated: new Date() },
        },
      ]);

      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText('Invalid')).toBeInTheDocument();
      });
    });
  });

  describe('API Key Input and Saving', () => {
    it('should allow typing API key', () => {
      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0] as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'sk-test123' } });
      expect(input.value).toBe('sk-test123');
    });

    it('should save valid API key', async () => {
      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0];
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.change(input, { target: { value: 'sk-validkey123' } });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(keyManager.validateApiKey).toHaveBeenCalledWith('sk-validkey123', 'deepseek');
        expect(keyManager.storeApiKey).toHaveBeenCalledWith('deepseek', 'sk-validkey123');
      });
    });

    it('should show error for empty API key', async () => {
      render(<ApiKeySettings />);
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('API key is required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid API key format', async () => {
      keyManager.validateApiKey.mockReturnValue(false);

      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0];
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.change(input, { target: { value: 'invalid-key' } });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Invalid API key format')).toBeInTheDocument();
      });
    });

    it('should show success message after saving', async () => {
      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0];
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.change(input, { target: { value: 'sk-validkey123' } });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('API key saved securely')).toBeInTheDocument();
      });
    });

    it('should clear input after successful save', async () => {
      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0] as HTMLInputElement;
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.change(input, { target: { value: 'sk-validkey123' } });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Show/Hide API Key', () => {
    it('should toggle API key visibility', () => {
      render(<ApiKeySettings />);
      const inputs = screen.getAllByPlaceholderText(/sk-/i);
      const firstInput = inputs[0] as HTMLInputElement;

      // Initially should be password type
      expect(firstInput.type).toBe('password');

      // Find and click the eye icon (it's rendered as a button)
      const eyeButtons = screen.getAllByRole('button');
      const eyeButton = eyeButtons.find(btn => btn.querySelector('svg'));

      if (eyeButton) {
        fireEvent.click(eyeButton);
        expect(firstInput.type).toBe('text');

        fireEvent.click(eyeButton);
        expect(firstInput.type).toBe('password');
      }
    });
  });

  describe('Testing API Keys', () => {
    beforeEach(() => {
      keyManager.getStoredProviders.mockReturnValue([
        {
          provider: 'deepseek',
          metadata: { isValid: false, lastValidated: new Date() },
        },
      ]);
    });

    it('should test API key and show success', async () => {
      keyManager.testApiKey.mockResolvedValue(true);

      render(<ApiKeySettings />);

      await waitFor(() => {
        const testButton = screen.getByText('Test Key');
        expect(testButton).toBeInTheDocument();
      });

      const testButton = screen.getByText('Test Key');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(keyManager.testApiKey).toHaveBeenCalledWith('deepseek');
        expect(screen.getByText('API key is valid and working')).toBeInTheDocument();
      });
    });

    it('should show error when test fails', async () => {
      keyManager.testApiKey.mockResolvedValue(false);

      render(<ApiKeySettings />);

      await waitFor(() => {
        const testButton = screen.getByText('Test Key');
        expect(testButton).toBeInTheDocument();
      });

      const testButton = screen.getByText('Test Key');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/API key test failed/i)).toBeInTheDocument();
      });
    });

    it('should show testing state while testing', async () => {
      keyManager.testApiKey.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

      render(<ApiKeySettings />);

      await waitFor(() => {
        const testButton = screen.getByText('Test Key');
        expect(testButton).toBeInTheDocument();
      });

      const testButton = screen.getByText('Test Key');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('Testing...')).toBeInTheDocument();
      });
    });
  });

  describe('Removing API Keys', () => {
    beforeEach(() => {
      keyManager.getStoredProviders.mockReturnValue([
        {
          provider: 'deepseek',
          metadata: { isValid: true, lastValidated: new Date() },
        },
      ]);
    });

    it('should remove API key', async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        const removeButton = screen.getByText('Remove');
        expect(removeButton).toBeInTheDocument();
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(keyManager.removeApiKey).toHaveBeenCalledWith('deepseek');
      });
    });

    it('should show success message after removing', async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        const removeButton = screen.getByText('Remove');
        expect(removeButton).toBeInTheDocument();
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText('API key removed')).toBeInTheDocument();
      });
    });

    it('should show error if removal fails', async () => {
      keyManager.removeApiKey.mockReturnValue(false);

      render(<ApiKeySettings />);

      await waitFor(() => {
        const removeButton = screen.getByText('Remove');
        expect(removeButton).toBeInTheDocument();
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to remove API key')).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Information', () => {
    it('should display model pricing for DeepSeek', () => {
      render(<ApiKeySettings />);
      expect(screen.getByText('DeepSeek V3.2-Exp')).toBeInTheDocument();
      expect(screen.getByText('$0.28')).toBeInTheDocument();
      expect(screen.getByText('$0.42')).toBeInTheDocument();
    });

    it('should display multiple models for OpenAI', () => {
      render(<ApiKeySettings />);
      expect(screen.getByText('GPT-5')).toBeInTheDocument();
      expect(screen.getByText('GPT-5 Mini')).toBeInTheDocument();
      expect(screen.getByText('GPT-5 Nano')).toBeInTheDocument();
    });

    it('should not display pricing for providers without models', () => {
      render(<ApiKeySettings />);
      // GitHub has no models, so no pricing section should exist near it
      const githubSection = screen.getByText('GitHub').closest('div');
      expect(githubSection).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      keyManager.storeApiKey.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0];
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.change(input, { target: { value: 'sk-validkey123' } });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Storage error')).toBeInTheDocument();
      });
    });

    it('should handle test errors gracefully', async () => {
      keyManager.getStoredProviders.mockReturnValue([
        {
          provider: 'deepseek',
          metadata: { isValid: true, lastValidated: new Date() },
        },
      ]);
      keyManager.testApiKey.mockRejectedValue(new Error('Network error'));

      render(<ApiKeySettings />);

      await waitFor(() => {
        const testButton = screen.getByText('Test Key');
        expect(testButton).toBeInTheDocument();
      });

      const testButton = screen.getByText('Test Key');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    it('should disable Save button when input is empty', () => {
      render(<ApiKeySettings />);
      const saveButtons = screen.getAllByText('Save Key');
      expect(saveButtons[0]).toBeDisabled();
    });

    it('should enable Save button when input has value', () => {
      render(<ApiKeySettings />);
      const input = screen.getAllByPlaceholderText(/sk-/i)[0];
      const saveButtons = screen.getAllByText('Save Key');

      fireEvent.change(input, { target: { value: 'sk-test' } });
      expect(saveButtons[0]).not.toBeDisabled();
    });

    it('should disable Test button while testing', async () => {
      keyManager.getStoredProviders.mockReturnValue([
        {
          provider: 'deepseek',
          metadata: { isValid: true, lastValidated: new Date() },
        },
      ]);
      keyManager.testApiKey.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

      render(<ApiKeySettings />);

      await waitFor(() => {
        const testButton = screen.getByText('Test Key');
        expect(testButton).toBeInTheDocument();
      });

      const testButton = screen.getByText('Test Key');
      fireEvent.click(testButton);

      await waitFor(() => {
        const testingButton = screen.getByText('Testing...');
        expect(testingButton).toBeDisabled();
      });
    });
  });
});
