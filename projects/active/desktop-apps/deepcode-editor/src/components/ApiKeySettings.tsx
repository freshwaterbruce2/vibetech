import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Save, TestTube, Trash2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import SecureApiKeyManager from '../utils/SecureApiKeyManager';

const Container = styled.div`
  padding: ${vibeTheme.spacing.lg};
  background: ${vibeTheme.colors.secondary};
  border-radius: ${vibeTheme.borderRadius.large};
  border: 2px solid rgba(139, 92, 246, 0.2);
  box-shadow: ${vibeTheme.shadows.large};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  margin-bottom: ${vibeTheme.spacing.lg};
  padding-bottom: ${vibeTheme.spacing.md};
  border-bottom: 2px solid rgba(139, 92, 246, 0.2);
`;

const Title = styled.h2`
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.lg};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  margin: 0;
`;

const SecurityNote = styled.div`
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.medium};
  padding: ${vibeTheme.spacing.md};
  margin-bottom: ${vibeTheme.spacing.lg};
  display: flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing.sm};
`;

const SecurityText = styled.p`
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};
  margin: 0;
  line-height: 1.5;
`;

const ProviderSection = styled.div`
  margin-bottom: ${vibeTheme.spacing.lg};
  padding: ${vibeTheme.spacing.md};
  background: rgba(26, 26, 46, 0.5);
  border-radius: ${vibeTheme.borderRadius.medium};
  border: 1px solid rgba(139, 92, 246, 0.2);
`;

const ProviderHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${vibeTheme.spacing.md};
`;

const ProviderTitle = styled.h3`
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  margin: 0;
`;

const StatusBadge = styled.div<{ status: 'valid' | 'invalid' | 'unknown' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  background: ${props => {
    switch (props.status) {
      case 'valid': return 'rgba(34, 197, 94, 0.2)';
      case 'invalid': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'valid': return '#22c55e';
      case 'invalid': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const InputGroup = styled.div`
  margin-bottom: ${vibeTheme.spacing.md};
`;

const Label = styled.label`
  display: block;
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  margin-bottom: ${vibeTheme.spacing.xs};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  gap: ${vibeTheme.spacing.sm};
`;

const Input = styled.input`
  flex: 1;
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  padding-right: 40px;
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  transition: all ${vibeTheme.animation.duration.normal} ease;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const IconButton = styled(motion.button)`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textMuted};
  cursor: pointer;
  padding: 4px;
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    color: ${vibeTheme.colors.cyan};
    background: rgba(139, 92, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.sm};
`;

const Button = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return vibeTheme.gradients.primary;
      case 'danger': return 'rgba(239, 68, 68, 0.8)';
      default: return 'rgba(139, 92, 246, 0.2)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.variant) {
      case 'primary': return 'transparent';
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(139, 92, 246, 0.3)';
    }
  }};
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.medium};
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  transition: all ${vibeTheme.animation.duration.normal} ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${vibeTheme.shadows.medium};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
  margin-top: ${vibeTheme.spacing.xs};
`;

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
  margin-top: ${vibeTheme.spacing.xs};
`;

interface ApiKeyStatus {
  provider: string;
  hasKey: boolean;
  isValid: boolean;
  lastValidated?: Date;
}

const PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  { id: 'github', name: 'GitHub', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
];

const ApiKeySettings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [statuses, setStatuses] = useState<Record<string, ApiKeyStatus>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successes, setSuccesses] = useState<Record<string, string>>({});

  const keyManager = SecureApiKeyManager.getInstance();

  useEffect(() => {
    loadApiKeyStatuses();
  }, []);

  const loadApiKeyStatuses = () => {
    const storedProviders = keyManager.getStoredProviders();
    const newStatuses: Record<string, ApiKeyStatus> = {};

    PROVIDERS.forEach(provider => {
      const stored = storedProviders.find(s => s.provider === provider.id);
      newStatuses[provider.id] = {
        provider: provider.id,
        hasKey: !!stored,
        isValid: stored?.metadata.isValid ?? false,
        ...(stored?.metadata.lastValidated && { lastValidated: stored.metadata.lastValidated })
      };
    });

    setStatuses(newStatuses);
  };

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setErrors(prev => ({ ...prev, [provider]: '' }));
    setSuccesses(prev => ({ ...prev, [provider]: '' }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const saveApiKey = async (provider: string) => {
    const key = apiKeys[provider];
    if (!key?.trim()) {
      setErrors(prev => ({ ...prev, [provider]: 'API key is required' }));
      return;
    }

    try {
      const isValid = keyManager.validateApiKey(key, provider);
      if (!isValid) {
        setErrors(prev => ({ ...prev, [provider]: 'Invalid API key format' }));
        return;
      }

      const saved = keyManager.storeApiKey(provider, key);
      if (saved) {
        setSuccesses(prev => ({ ...prev, [provider]: 'API key saved securely' }));
        setApiKeys(prev => ({ ...prev, [provider]: '' }));
        loadApiKeyStatuses();
      } else {
        setErrors(prev => ({ ...prev, [provider]: 'Failed to save API key' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [provider]: error instanceof Error ? error.message : 'Failed to save API key' }));
    }
  };

  const testApiKey = async (provider: string) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    setErrors(prev => ({ ...prev, [provider]: '' }));
    setSuccesses(prev => ({ ...prev, [provider]: '' }));

    try {
      const isValid = await keyManager.testApiKey(provider);
      if (isValid) {
        setSuccesses(prev => ({ ...prev, [provider]: 'API key is valid and working' }));
      } else {
        setErrors(prev => ({ ...prev, [provider]: 'API key test failed - key may be invalid or expired' }));
      }
      loadApiKeyStatuses();
    } catch (error) {
      setErrors(prev => ({ ...prev, [provider]: error instanceof Error ? error.message : 'Test failed' }));
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const removeApiKey = (provider: string) => {
    const removed = keyManager.removeApiKey(provider);
    if (removed) {
      setSuccesses(prev => ({ ...prev, [provider]: 'API key removed' }));
      loadApiKeyStatuses();
    } else {
      setErrors(prev => ({ ...prev, [provider]: 'Failed to remove API key' }));
    }
  };

  const getStatusBadge = (status: ApiKeyStatus) => {
    if (!status.hasKey) return 'unknown';
    return status.isValid ? 'valid' : 'invalid';
  };

  const getStatusText = (status: ApiKeyStatus) => {
    if (!status.hasKey) return 'Not configured';
    return status.isValid ? 'Valid' : 'Invalid';
  };

  const getStatusIcon = (status: ApiKeyStatus) => {
    if (!status.hasKey) return <AlertTriangle size={12} />;
    return status.isValid ? <CheckCircle size={12} /> : <AlertTriangle size={12} />;
  };

  return (
    <Container>
      <Header>
        <Shield size={24} color={vibeTheme.colors.cyan} />
        <Title>API Key Security Settings</Title>
      </Header>

      <SecurityNote>
        <Shield size={16} color={vibeTheme.colors.cyan} />
        <SecurityText>
          All API keys are encrypted using AES-256 before being stored locally. 
          Keys are validated for format and security before storage. 
          Never share your API keys or store them in version control.
        </SecurityText>
      </SecurityNote>

      {PROVIDERS.map(provider => {
        const status = statuses[provider.id] || { provider: provider.id, hasKey: false, isValid: false };
        
        return (
          <ProviderSection key={provider.id}>
            <ProviderHeader>
              <ProviderTitle>{provider.name}</ProviderTitle>
              <StatusBadge status={getStatusBadge(status)}>
                {getStatusIcon(status)}
                {getStatusText(status)}
              </StatusBadge>
            </ProviderHeader>

            <InputGroup>
              <Label htmlFor={provider.id}>API Key</Label>
              <InputWrapper>
                <Input
                  id={provider.id}
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={apiKeys[provider.id] || ''}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  placeholder={provider.placeholder}
                />
                <IconButton
                  onClick={() => toggleShowKey(provider.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </InputWrapper>

              {errors[provider.id] && (
                <ErrorMessage>{errors[provider.id]}</ErrorMessage>
              )}

              {successes[provider.id] && (
                <SuccessMessage>{successes[provider.id]}</SuccessMessage>
              )}
            </InputGroup>

            <ButtonGroup>
              <Button
                variant="primary"
                onClick={() => saveApiKey(provider.id)}
                disabled={!apiKeys[provider.id]?.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save size={16} />
                Save Key
              </Button>

              {status.hasKey && (
                <>
                  <Button
                    onClick={() => testApiKey(provider.id)}
                    disabled={testing[provider.id]}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TestTube size={16} />
                    {testing[provider.id] ? 'Testing...' : 'Test Key'}
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => removeApiKey(provider.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trash2 size={16} />
                    Remove
                  </Button>
                </>
              )}
            </ButtonGroup>
          </ProviderSection>
        );
      })}
    </Container>
  );
};

export default ApiKeySettings;