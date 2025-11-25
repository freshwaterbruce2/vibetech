/**
 * IPCConnectionManager Tests
 *
 * Tests for WebSocket connection lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IPCConnectionManager } from '../../../services/ipc/IPCConnectionManager';

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null,
})) as any;

describe('IPCConnectionManager', () => {
  let manager: IPCConnectionManager;
  let mockWs: any;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new IPCConnectionManager({
      url: 'ws://localhost:5004',
      reconnectInterval: 100,
      maxReconnectAttempts: 3,
      pingInterval: 1000,
    });
  });

  afterEach(() => {
    if (manager) {
      manager.disconnect();
    }
  });

  describe('Connection', () => {
    it('should connect to WebSocket successfully', () => {
      manager.connect();
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:5004');
      expect(manager.getStatus()).toBe('connecting');
    });

    it('should emit connected status when WebSocket opens', () => {
      const statusHandler = vi.fn();
      manager.on('status', statusHandler);

      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      mockWs.onopen();

      expect(statusHandler).toHaveBeenCalledWith('connected');
      expect(manager.getStatus()).toBe('connected');
      expect(manager.isConnected()).toBe(true);
    });

    it('should not reconnect if already connected', () => {
      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      mockWs.onopen();

      manager.connect();
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disconnection', () => {
    it('should disconnect cleanly', () => {
      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;

      manager.disconnect();

      expect(mockWs.close).toHaveBeenCalledWith(1000, 'Manual disconnect');
      expect(manager.getStatus()).toBe('disconnected');
    });

    it('should emit disconnected status', () => {
      const disconnectHandler = vi.fn();
      manager.on('disconnected', disconnectHandler);

      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      mockWs.onopen();
      mockWs.onclose({ code: 1001 });

      expect(disconnectHandler).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should send messages when connected', () => {
      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      mockWs.onopen();

      const result = manager.send('test message');

      expect(result).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith('test message');
    });

    it('should not send when disconnected', () => {
      const result = manager.send('test message');
      expect(result).toBe(false);
    });

    it('should emit messages received', () => {
      const messageHandler = vi.fn();
      manager.on('message', messageHandler);

      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      mockWs.onmessage({ data: 'test data' });

      expect(messageHandler).toHaveBeenCalledWith('test data');
    });
  });

  describe('Health Checks', () => {
    it('should track ping time', () => {
      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      mockWs.onmessage({ data: '{}' });

      const pingTime = manager.getTimeSinceLastPing();
      expect(pingTime).toBeGreaterThanOrEqual(0);
    });

    it('should return null if no ping received', () => {
      expect(manager.getTimeSinceLastPing()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const errorHandler = vi.fn();
      manager.on('error', errorHandler);

      manager.connect();
      mockWs = (global.WebSocket as any).mock.results[0].value;
      const errorEvent = new Event('error');
      mockWs.onerror(errorEvent);

      expect(errorHandler).toHaveBeenCalledWith(errorEvent);
      expect(manager.getStatus()).toBe('error');
    });
  });
});
