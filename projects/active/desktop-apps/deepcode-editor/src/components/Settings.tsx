import React, { useEffect, useState } from 'react';
import { Info, RotateCcw, Save, X } from 'lucide-react';
import styled from 'styled-components';

import { EditorSettings } from '../types';

import ApiKeySettings from './ApiKeySettings';
import { ModelComparison } from './ModelComparison';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}

const SettingsOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SettingsPanel = styled.div`
  background: #2d2d2d;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  border: 1px solid #404040;
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #404040;

  h2 {
    margin: 0;
    color: #d4d4d4;
    font-size: 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #404040;
  }
`;

const SettingsContent = styled.div`
  padding: 24px;
`;

const SettingsSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #d4d4d4;
  font-size: 1.1rem;
  font-weight: 600;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  color: #d4d4d4;
  font-size: 0.95rem;
  cursor: pointer;
  flex: 1;

  span {
    display: block;
    font-size: 0.85rem;
    color: #888;
    margin-top: 2px;
  }
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Toggle = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const NumberInput = styled.input.attrs({ type: 'number' })`
  background: #1e1e1e;
  border: 1px solid #404040;
  border-radius: 4px;
  color: #d4d4d4;
  padding: 6px 8px;
  width: 80px;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #61dafb;
  }
`;

const Select = styled.select`
  background: linear-gradient(135deg, #1e1e1e 0%, #252525 100%);
  border: 2px solid #404040;
  border-radius: 6px;
  color: #d4d4d4;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;

  &:hover {
    border-color: #61dafb;
    box-shadow: 0 0 8px rgba(97, 218, 251, 0.2);
  }

  &:focus {
    outline: none;
    border-color: #61dafb;
    box-shadow: 0 0 12px rgba(97, 218, 251, 0.3);
  }

  option {
    background: #2d2d2d;
    color: #d4d4d4;
    padding: 8px;
    font-weight: 400;
  }

  optgroup {
    background: #1e1e1e;
    color: #61dafb;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 6px 0;
    letter-spacing: 0.5px;
  }
`;

const ModelPricingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(97, 218, 251, 0.05);
  border: 1px solid rgba(97, 218, 251, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 8px;

  .pricing-label {
    color: #61dafb;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pricing-details {
    display: flex;
    gap: 12px;
    color: #d4d4d4;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  }

  .pricing-item {
    display: flex;
    gap: 4px;

    .label {
      color: #888;
    }

    .value {
      color: #61dafb;
      font-weight: 600;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #404040;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === 'primary'
      ? `
    background: #61dafb;
    color: #1e1e1e;
    border-color: #61dafb;
    
    &:hover {
      background: #4fa8c5;
      border-color: #4fa8c5;
    }
  `
      : `
    background: transparent;
    color: #d4d4d4;
    border-color: #404040;
    
    &:hover {
      background: #404040;
    }
  `}
`;

const defaultSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  aiAutoComplete: true,
  aiSuggestions: true,
  aiModel: 'deepseek-chat',
  showReasoningProcess: false,
  lineNumbers: true,
  folding: true,
  bracketMatching: true,
  autoIndent: true,
  formatOnSave: true,
  rulers: [80, 120],
  renderWhitespace: false,
  smoothScrolling: true,
  cursorBlinking: true,
};

const MODEL_PRICING = {
  'gpt-5': { input: '$1.25', output: '$10.00', context: '272K' },
  'gpt-5-mini': { input: '$0.25', output: '$2.00', context: '272K' },
  'gpt-5-nano': { input: '$0.05', output: '$0.40', context: '272K' },
  'claude-sonnet-4-5': { input: '$3.00', output: '$15.00', context: '200K' },
  'claude-opus-4-1': { input: '$20.00', output: '$80.00', context: '200K' },
  'gemini-2-5-pro': { input: '$1.25', output: '$10.00', context: '2M' },
  'gemini-2-5-flash': { input: '$0.30', output: '$1.20', context: '1M' },
  'gemini-2-5-flash-lite': { input: '$0.075', output: '$0.30', context: '1M' },
  'gemini-2-0-flash': { input: '$0.10', output: '$0.40', context: '1M' },
  'deepseek-chat': { input: '$0.028', output: '$0.042', context: '128K' },
  'deepseek-reasoner': { input: '$0.028', output: '$0.042', context: '128K' },
};

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState<EditorSettings>(settings);
  const [showModelComparison, setShowModelComparison] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
  };

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getModelPricing = (modelId: string | undefined) => {
    if (!modelId) return null;
    return MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
  };

  return (
    <SettingsOverlay $isOpen={isOpen}>
      <SettingsPanel>
        <SettingsHeader>
          <h2>Settings</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </SettingsHeader>

        <SettingsContent>
          <SettingsSection>
            <SectionTitle>Appearance</SectionTitle>

            <SettingItem>
              <SettingLabel>
                Theme
                <span>Choose between dark and light themes</span>
              </SettingLabel>
              <SettingControl>
                <Select
                  id="theme-select"
                  name="theme"
                  aria-label="Theme selection"
                  value={localSettings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light')}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </Select>
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Font Size
                <span>Editor font size in pixels</span>
              </SettingLabel>
              <SettingControl>
                <NumberInput
                  id="font-size-input"
                  name="fontSize"
                  aria-label="Font size in pixels"
                  value={localSettings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  min="10"
                  max="24"
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Show Minimap
                <span>Display code minimap on the right side</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.minimap}
                  onChange={(e) => updateSetting('minimap', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>
          </SettingsSection>

          <SettingsSection>
            <SectionTitle>Editor</SectionTitle>

            <SettingItem>
              <SettingLabel>
                Tab Size
                <span>Number of spaces for indentation</span>
              </SettingLabel>
              <SettingControl>
                <NumberInput
                  id="tab-size-input"
                  name="tabSize"
                  aria-label="Tab size in spaces"
                  value={localSettings.tabSize}
                  onChange={(e) => updateSetting('tabSize', parseInt(e.target.value))}
                  min="1"
                  max="8"
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Word Wrap
                <span>Wrap long lines to fit editor width</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.wordWrap}
                  onChange={(e) => updateSetting('wordWrap', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Auto Save
                <span>Automatically save files after changes</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Line Numbers
                <span>Show line numbers in the editor</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.lineNumbers ?? true}
                  onChange={(e) => updateSetting('lineNumbers', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Code Folding
                <span>Enable code folding for functions and blocks</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.folding ?? true}
                  onChange={(e) => updateSetting('folding', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Bracket Matching
                <span>Highlight matching brackets</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.bracketMatching ?? true}
                  onChange={(e) => updateSetting('bracketMatching', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Auto Indent
                <span>Automatically indent new lines</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.autoIndent ?? true}
                  onChange={(e) => updateSetting('autoIndent', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Format on Save
                <span>Automatically format code when saving</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.formatOnSave ?? true}
                  onChange={(e) => updateSetting('formatOnSave', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Render Whitespace
                <span>Show spaces and tabs as visible characters</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.renderWhitespace ?? false}
                  onChange={(e) => updateSetting('renderWhitespace', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Smooth Scrolling
                <span>Enable smooth scrolling animation</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.smoothScrolling ?? true}
                  onChange={(e) => updateSetting('smoothScrolling', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                Cursor Blinking
                <span>Enable cursor blinking animation</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.cursorBlinking ?? true}
                  onChange={(e) => updateSetting('cursorBlinking', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>
          </SettingsSection>

          <SettingsSection>
            <SectionTitle>AI Features</SectionTitle>

            <SettingItem>
              <SettingLabel>
                AI Auto Complete
                <span>Enable AI-powered code completions</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.aiAutoComplete}
                  onChange={(e) => updateSetting('aiAutoComplete', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                AI Suggestions
                <span>Show AI suggestions in chat</span>
              </SettingLabel>
              <SettingControl>
                <Toggle
                  checked={localSettings.aiSuggestions}
                  onChange={(e) => updateSetting('aiSuggestions', e.target.checked)}
                />
              </SettingControl>
            </SettingItem>

            <SettingItem>
              <SettingLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  AI Model
                  <button
                    onClick={() => setShowModelComparison(!showModelComparison)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8b5cf6',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    title="Compare AI models"
                  >
                    <Info size={14} />
                  </button>
                </div>
                <span>Choose the AI model for code assistance</span>
              </SettingLabel>
              <SettingControl>
                <Select
                  id="ai-model-select"
                  name="aiModel"
                  aria-label="AI model selection"
                  value={localSettings.aiModel || 'deepseek-chat'}
                  onChange={(e) =>
                    updateSetting(
                      'aiModel',
                      e.target.value as any
                    )
                  }
                >
                  <optgroup label="OpenAI GPT-5">
                    <option value="gpt-5">GPT-5</option>
                    <option value="gpt-5-mini">GPT-5 Mini</option>
                    <option value="gpt-5-nano">GPT-5 Nano</option>
                  </optgroup>
                  <optgroup label="Anthropic Claude 4">
                    <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                    <option value="claude-opus-4-1">Claude Opus 4.1</option>
                  </optgroup>
                  <optgroup label="Google Gemini">
                    <option value="gemini-2-5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2-5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2-5-flash-lite">Gemini 2.5 Flash-Lite</option>
                    <option value="gemini-2-0-flash">Gemini 2.0 Flash</option>
                  </optgroup>
                  <optgroup label="DeepSeek (V3.2-Exp)">
                    <option value="deepseek-chat">DeepSeek Chat (Fast, General)</option>
                    <option value="deepseek-reasoner">DeepSeek Reasoner (Thinking, Agents)</option>
                  </optgroup>
                </Select>
              </SettingControl>
            </SettingItem>

            {getModelPricing(localSettings.aiModel) && (
              <ModelPricingInfo>
                <div className="pricing-label">Pricing per 1M tokens</div>
                <div className="pricing-details">
                  <div className="pricing-item">
                    <span className="label">Input:</span>
                    <span className="value">{getModelPricing(localSettings.aiModel)?.input}</span>
                  </div>
                  <div className="pricing-item">
                    <span className="label">Output:</span>
                    <span className="value">{getModelPricing(localSettings.aiModel)?.output}</span>
                  </div>
                  <div className="pricing-item">
                    <span className="label">Context:</span>
                    <span className="value">{getModelPricing(localSettings.aiModel)?.context}</span>
                  </div>
                </div>
              </ModelPricingInfo>
            )}

            {showModelComparison && (
              <ModelComparison currentModel={localSettings.aiModel || undefined} />
            )}

            {(localSettings.aiModel === 'gpt-5' ||
              localSettings.aiModel === 'gpt-5-mini' ||
              localSettings.aiModel === 'gpt-5-nano' ||
              localSettings.aiModel === 'claude-sonnet-4-5' ||
              localSettings.aiModel === 'claude-opus-4-1' ||
              localSettings.aiModel === 'gemini-2-5-pro') && (
              <SettingItem>
                <SettingLabel>
                  Show Reasoning Process
                  <span>Display extended thinking in AI responses</span>
                </SettingLabel>
                <SettingControl>
                  <Toggle
                    checked={localSettings.showReasoningProcess || false}
                    onChange={(e) => updateSetting('showReasoningProcess', e.target.checked)}
                  />
                </SettingControl>
              </SettingItem>
            )}
          </SettingsSection>

          <SettingsSection>
            <SectionTitle>API Keys</SectionTitle>
            <ApiKeySettings />
          </SettingsSection>
        </SettingsContent>

        <ButtonGroup>
          <Button onClick={handleReset}>
            <RotateCcw size={16} />
            Reset to Defaults
          </Button>
          <Button $variant="primary" onClick={handleSave}>
            <Save size={16} />
            Save Changes
          </Button>
        </ButtonGroup>
      </SettingsPanel>
    </SettingsOverlay>
  );
};

export default Settings;
