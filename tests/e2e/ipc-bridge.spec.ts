import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';

let bridgeProcess: ChildProcess | null = null;

test.describe('IPC Bridge Integration', () => {
  test.beforeAll(async () => {
    // Start IPC Bridge
    bridgeProcess = spawn('node', ['src/server.js'], {
      cwd: 'C:\\dev\\backend\\ipc-bridge',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait for bridge to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test.afterAll(async () => {
    if (bridgeProcess) {
      bridgeProcess.kill();
    }
  });

  test('should connect to IPC bridge', async () => {
    const ws = new WebSocket('ws://localhost:5004');

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  test('should handle ping/pong', async () => {
    const ws = new WebSocket('ws://localhost:5004');

    await new Promise((resolve) => {
      ws.on('open', resolve);
    });

    ws.ping();

    const pongReceived = await new Promise((resolve) => {
      ws.on('pong', () => resolve(true));
      setTimeout(() => resolve(false), 1000);
    });

    expect(pongReceived).toBe(true);
    ws.close();
  });

  test('should broadcast messages to multiple clients', async () => {
    const ws1 = new WebSocket('ws://localhost:5004');
    const ws2 = new WebSocket('ws://localhost:5004');

    await Promise.all([
      new Promise((resolve) => ws1.on('open', resolve)),
      new Promise((resolve) => ws2.on('open', resolve)),
    ]);

    const messagePromise = new Promise((resolve) => {
      ws2.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    ws1.send(JSON.stringify({
      type: 'test',
      data: 'Hello from client 1',
    }));

    const receivedMessage = await messagePromise;
    expect(receivedMessage).toMatchObject({
      type: 'test',
      data: 'Hello from client 1',
    });

    ws1.close();
    ws2.close();
  });

  test('should route command_request from nova to vibe and return command_result', async () => {
    const wsNova = new WebSocket('ws://localhost:5004');
    const wsVibe = new WebSocket('ws://localhost:5004');

    await Promise.all([
      new Promise((resolve) => wsNova.on('open', resolve)),
      new Promise((resolve) => wsVibe.on('open', resolve)),
    ]);

    // Helper to generate ids
    const genId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Set initial identification by sending a benign valid message from both
    wsNova.send(JSON.stringify({
      type: 'ping',
      payload: { ts: Date.now() },
      timestamp: Date.now(),
      source: 'nova',
      messageId: genId('nova'),
    }));

    wsVibe.send(JSON.stringify({
      type: 'ping',
      payload: { ts: Date.now() },
      timestamp: Date.now(),
      source: 'vibe',
      messageId: genId('vibe'),
    }));

    // Vibe listens for command_execute and responds with command_result
    wsVibe.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg?.type === 'command_execute' && msg?.payload?.commandId) {
          const { commandId } = msg.payload;
          const response = {
            type: 'command_result',
            source: 'vibe',
            payload: {
              commandId,
              success: true,
              result: { ok: true },
            },
            timestamp: Date.now(),
            messageId: `resp-${commandId}`,
          };
          wsVibe.send(JSON.stringify(response));
        }
      } catch {}
    });

    // Nova waits for command_result
    const novaResult = new Promise<{ payload: any }>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('Timeout waiting for command_result')), 5000);
      wsNova.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg?.type === 'command_result') {
            clearTimeout(to);
            resolve(msg);
          }
        } catch {}
      });
    });

    // Send command_request from nova
    const requestId = genId('cmd');
    wsNova.send(JSON.stringify({
      type: 'command_request',
      source: 'nova',
      payload: {
        text: '@vibe open C:\\\\dev\\\\README.md',
        target: 'vibe',
      },
      timestamp: Date.now(),
      messageId: requestId,
      timeoutMs: 8000,
    }));

    const resultMsg = await novaResult;
    expect(resultMsg.payload).toMatchObject({
      success: true,
      result: { ok: true },
    });

    wsNova.close();
    wsVibe.close();
  });

  test('should return error result when target does not respond within timeout', async () => {
    const wsNova = new WebSocket('ws://localhost:5004');
    const wsVibe = new WebSocket('ws://localhost:5004');

    await Promise.all([
      new Promise((resolve) => wsNova.on('open', resolve)),
      new Promise((resolve) => wsVibe.on('open', resolve)),
    ]);

    const genId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Identify both clients
    wsNova.send(JSON.stringify({
      type: 'ping',
      payload: { ts: Date.now() },
      timestamp: Date.now(),
      source: 'nova',
      messageId: genId('nova'),
    }));
    wsVibe.send(JSON.stringify({
      type: 'ping',
      payload: { ts: Date.now() },
      timestamp: Date.now(),
      source: 'vibe',
      messageId: genId('vibe'),
    }));

    // Intentionally DO NOT respond from vibe to simulate timeout

    const novaResult = new Promise<{ payload: any }>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('Timeout waiting for command_result')), 12000);
      wsNova.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg?.type === 'command_result') {
            clearTimeout(to);
            resolve(msg);
          }
        } catch {}
      });
    });

    wsNova.send(JSON.stringify({
      type: 'command_request',
      source: 'nova',
      payload: {
        text: '@vibe help',
        target: 'vibe',
      },
      timestamp: Date.now(),
      messageId: genId('cmd'),
      timeoutMs: 2000, // short timeout
    }));

    const resultMsg = await novaResult;
    expect(resultMsg.payload).toMatchObject({
      success: false,
    });

    wsNova.close();
    wsVibe.close();
  });
});
