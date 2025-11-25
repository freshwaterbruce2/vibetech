/**
 * Editor Stream Panel Component
 *
 * Control panel for live editor streaming settings and status
 */

import React, { useEffect,useState } from 'react';
import styled from 'styled-components';

import {
  liveEditorStream,
  LiveStreamSettings,
  StreamProgress,
} from '../services/LiveEditorStream';
import { vibeTheme } from '../styles/theme';

interface EditorStreamPanelProps {
  isStreaming: boolean;
  onApprove?: (filePath: string) => void;
  onReject?: (filePath: string) => void;
  minimized?: boolean;
}

const PanelContainer = styled.div<{ minimized: boolean }>`
  position: fixed;
  bottom: ${props => props.minimized ? '-200px' : '20px'};
  right: 20px;
  width: 350px;
  background: #1e1e1e;
  border: 1px solid #3e3e3e;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: ${props => props.minimized ? '8px' : '16px'};
  z-index: 1000;
  transition: all 0.3s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #d4d4d4;
`;

const MinimizeButton = styled.button`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  font-size: 16px;

  &:hover {
    color: ${vibeTheme.colors.text};
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${vibeTheme.colors.secondary};
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ percent: number }>`
  height: 100%;
  width: ${props => props.percent}%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  display: flex;
  justify-content: space-between;
`;

const SettingsSection = styled.div`
  margin-bottom: 16px;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SettingLabel = styled.label`
  font-size: 13px;
  color: ${vibeTheme.colors.text};
  cursor: pointer;
`;

const SettingCheckbox = styled.input`
  cursor: pointer;
`;

const SpeedSlider = styled.input`
  width: 100%;
  margin-top: 8px;
`;

const SpeedLabel = styled.div`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  margin-top: 4px;
  text-align: center;
`;

const ApprovalSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: ${vibeTheme.borders.divider};
`;

const ApprovalButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: ${vibeTheme.colors.secondary};
          color: ${vibeTheme.colors.text};
          &:hover { background: ${vibeTheme.colors.tertiary}; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.div<{ status: 'idle' | 'streaming' | 'paused' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;

  ${props => {
    switch (props.status) {
      case 'streaming':
        return `
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        `;
      case 'paused':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        `;
    }
  }}
`;

export const EditorStreamPanel: React.FC<EditorStreamPanelProps> = ({
  isStreaming,
  onApprove,
  onReject,
  minimized: initialMinimized = false,
}) => {
  const [minimized, setMinimized] = useState(initialMinimized);
  const [settings, setSettings] = useState<LiveStreamSettings>(
    liveEditorStream.getSettings()
  );
  const [progress, setProgress] = useState<StreamProgress | null>(null);
  const [currentFile, setCurrentFile] = useState<string>('');

  useEffect(() => {
    // Subscribe to progress updates
    liveEditorStream.onProgress((prog) => {
      setProgress(prog);
      setCurrentFile(prog.filePath);
    });

    // Subscribe to approval requests
    liveEditorStream.onApprovalRequired((approved, filePath) => {
      if (approved && onApprove) {
        onApprove(filePath);
      } else if (!approved && onReject) {
        onReject(filePath);
      }
    });
  }, [onApprove, onReject]);

  const handleSettingChange = (key: keyof LiveStreamSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    liveEditorStream.updateSettings(newSettings);
  };

  const handleApprove = () => {
    if (onApprove && currentFile) {
      onApprove(currentFile);
    }
  };

  const handleReject = () => {
    if (onReject && currentFile) {
      onReject(currentFile);
    }
  };

  const handleStop = () => {
    liveEditorStream.stopStreaming();
  };

  const getStatus = (): 'idle' | 'streaming' | 'paused' => {
    if (isStreaming) {return 'streaming';}
    return 'idle';
  };

  return (
    <PanelContainer minimized={minimized}>
      <PanelHeader onClick={() => setMinimized(!minimized)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PanelTitle>Live Editor Streaming</PanelTitle>
          <StatusBadge status={getStatus()}>{getStatus()}</StatusBadge>
        </div>
        <MinimizeButton>
          {minimized ? '▲' : '▼'}
        </MinimizeButton>
      </PanelHeader>

      {!minimized && (
        <>
          {isStreaming && progress && (
            <ProgressContainer>
              <ProgressBar>
                <ProgressFill percent={progress.percentComplete} />
              </ProgressBar>
              <ProgressText>
                <span>{progress.currentChar} / {progress.totalChars} chars</span>
                <span>{progress.percentComplete}%</span>
              </ProgressText>
              <ProgressText>
                <span>+{progress.linesAdded} lines</span>
                <span>-{progress.linesRemoved} lines</span>
              </ProgressText>
            </ProgressContainer>
          )}

          <SettingsSection>
            <SettingRow>
              <SettingLabel>
                <SettingCheckbox
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                />
                {' '}Enable Live Streaming
              </SettingLabel>
            </SettingRow>

            <SettingRow>
              <SettingLabel>
                <SettingCheckbox
                  type="checkbox"
                  checked={settings.autoApprove}
                  onChange={(e) => handleSettingChange('autoApprove', e.target.checked)}
                  disabled={!settings.enabled}
                />
                {' '}Auto-approve Changes
              </SettingLabel>
            </SettingRow>

            <SettingRow>
              <SettingLabel>
                <SettingCheckbox
                  type="checkbox"
                  checked={settings.showDiffOnly}
                  onChange={(e) => handleSettingChange('showDiffOnly', e.target.checked)}
                  disabled={!settings.enabled}
                />
                {' '}Show Diff Only (No Streaming)
              </SettingLabel>
            </SettingRow>

            {settings.enabled && !settings.showDiffOnly && (
              <>
                <div>
                  <SettingLabel>Stream Speed: {settings.streamSpeed} chars/sec</SettingLabel>
                  <SpeedSlider
                    type="range"
                    min="1"
                    max="100"
                    value={settings.streamSpeed}
                    onChange={(e) => handleSettingChange('streamSpeed', parseInt(e.target.value))}
                  />
                  <SpeedLabel>
                    {settings.streamSpeed < 20 ? 'Slow' : settings.streamSpeed < 60 ? 'Medium' : 'Fast'}
                  </SpeedLabel>
                </div>
              </>
            )}
          </SettingsSection>

          {isStreaming && (
            <ApprovalSection>
              <ApprovalButtons>
                <Button variant="primary" onClick={handleApprove}>
                  ✓ Approve
                </Button>
                <Button variant="danger" onClick={handleReject}>
                  ✗ Reject
                </Button>
                <Button variant="secondary" onClick={handleStop}>
                  ⏸ Stop
                </Button>
              </ApprovalButtons>
            </ApprovalSection>
          )}
        </>
      )}
    </PanelContainer>
  );
};
