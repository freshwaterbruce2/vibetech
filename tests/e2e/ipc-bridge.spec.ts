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
});

