/**
 * Integration Status Component (Vibe Code Studio)
 *
 * Displays IPC Bridge connection status with real-time updates
 *
 * Features:
 * - Real-time connection indicator (🟢🟡🔴)
 * - Manual reconnect button
 * - Last ping timestamp
 * - Queued messages count
 * - Health metrics tooltip
 * - Click to expand details
 *
 * Based on 2025 Best Practices:
 * - Zustand for state management
 * - Styled components for theming
 * - Accessibility support
 */

import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useIPCConnectionStatus, useIPCActions } from '../stores/useIPCStore';
import { ipcClient } from '../services/IPCClient';

const Container = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--bg-elevated, #2a2a2a);
  border-radius: 6px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s;
  font-size: 12px;
  border: 1px solid var(--border-color, #333);

  &:hover {
    background: ${props => props.$clickable ? 'var(--bg-hover, #3a3a3a)' : 'var(--bg-elevated, #2a2a2a)'};
    border-color: ${props => props.$clickable ? 'var(--accent-color, #00d2ff)' : 'var(--border-color, #333)'};
  }
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  animation: ${props => props.$status === 'connecting' ? 'pulse 1.5s infinite' : 'none'};
  box-shadow: ${props => {
    switch (props.$status) {
      case 'connected': return '0 0 8px rgba(34, 197, 94, 0.5)';
      case 'error': return '0 0 8px rgba(239, 68, 68, 0.5)';
      default: return 'none';
    }
  }};

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

const StatusText = styled.span`
  color: var(--text-primary, #d4d4d4);
  font-weight: 500;
`;

const StatusIcon = styled.span`
  font-size: 14px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #888);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--bg-hover, #3a3a3a);
    color: var(--text-primary, #d4d4d4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DetailsPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-elevated, #2a2a2a);
  border: 1px solid var(--border-color, #3e3e42);
  border-radius: 8px;
  padding: 16px;
  min-width: 250px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: slideDown 0.2s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color, #3e3e42);

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: var(--text-secondary, #858585);
  font-size: 12px;
`;

const DetailValue = styled.span`
  color: var(--text-primary, #d4d4d4);
  font-size: 12px;
  font-weight: 500;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 8px 12px;
  margin-top: 12px;
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 210, 255, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Wrapper = styled.div`
  position: relative;
`;

interface IntegrationStatusProps {
  compact?: boolean;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({ compact = false }) => {
  const { status, isConnected, lastPing, lastError, queuedMessageCount } = useIPCConnectionStatus();
  const { connect, disconnect } = useIPCActions();
  const [showDetails, setShowDetails] = useState(false);

  // Memoize derived values to prevent unnecessary recalculations
  const statusText = useMemo(() => {
    switch (status) {
      case 'connected': return compact ? 'IPC' : 'IPC Connected';
      case 'connecting': return compact ? 'IPC...' : 'Connecting...';
      case 'error': return compact ? 'IPC ✗' : 'Connection Error';
      default: return compact ? 'IPC ○' : 'IPC Disconnected';
    }
  }, [status, compact]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case 'connected': return '🔗';
      case 'connecting': return '⏳';
      case 'error': return '⚠️';
      default: return '○';
    }
  }, [status]);

  const timeSinceLastPing = useMemo(() => {
    if (!lastPing) return 'Never';
    const seconds = Math.floor((Date.now() - lastPing) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [lastPing]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleReconnect = useCallback(() => {
    ipcClient.disconnect();
    setTimeout(() => ipcClient.connect(), 500);
  }, []);

  const handleToggleDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(prev => !prev);
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDetails(false);
  }, [disconnect]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  // Close details when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowDetails(false);
    if (showDetails) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDetails]);

  return (
    <Wrapper>
      <Container $clickable={!compact} onClick={compact ? undefined : handleToggleDetails}>
        <StatusDot $status={status} />
        {!compact && <StatusIcon>{statusIcon}</StatusIcon>}
        <StatusText>{statusText}</StatusText>

        {queuedMessageCount > 0 && !compact && (
          <span style={{
            fontSize: '10px',
            color: '#f59e0b',
            fontWeight: 600,
            marginLeft: '4px'
          }}>
            ({queuedMessageCount})
          </span>
        )}

        {status !== 'connecting' && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleReconnect();
            }}
            disabled={status === 'connecting'}
            title="Reconnect"
          >
            ↻
          </IconButton>
        )}
      </Container>

      {showDetails && !compact && (
        <DetailsPanel onClick={(e) => e.stopPropagation()}>
          <DetailRow>
            <DetailLabel>Status</DetailLabel>
            <DetailValue style={{
              color: isConnected ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b'
            }}>
              {status.toUpperCase()}
            </DetailValue>
          </DetailRow>

          {isConnected && (
            <DetailRow>
              <DetailLabel>Last Ping</DetailLabel>
              <DetailValue>{timeSinceLastPing}</DetailValue>
            </DetailRow>
          )}

          {queuedMessageCount > 0 && (
            <DetailRow>
              <DetailLabel>Queued Messages</DetailLabel>
              <DetailValue style={{ color: '#f59e0b' }}>
                {queuedMessageCount}
              </DetailValue>
            </DetailRow>
          )}

          {lastError && (
            <DetailRow>
              <DetailLabel>Last Error</DetailLabel>
              <DetailValue style={{ color: '#ef4444', fontSize: '10px' }}>
                {lastError.length > 30 ? `${lastError.substring(0, 30)}...` : lastError}
              </DetailValue>
            </DetailRow>
          )}

          <DetailRow>
            <DetailLabel>Bridge URL</DetailLabel>
            <DetailValue style={{ fontSize: '10px', fontFamily: 'monospace' }}>
              ws://localhost:5004
            </DetailValue>
          </DetailRow>

          {!isConnected && (
            <ActionButton onClick={handleConnect}>
              Connect to IPC Bridge
            </ActionButton>
          )}

          {isConnected && (
            <ActionButton onClick={handleDisconnect}>
              Disconnect
            </ActionButton>
          )}
        </DetailsPanel>
      )}
    </Wrapper>
  );
};

export default IntegrationStatus;
