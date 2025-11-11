/**
 * DAP Proxy - WebSocket to Debug Adapter Bridge
 * Port: 5003 (as per documentation - FIXED from incorrect 5002)
 *
 * BUG FIX: Changed from port 5002 to 5003 to avoid conflict with LSP proxy
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');

// FIXED: Changed default port from 5002 to 5003
const PORT = process.env.PORT || 5003;
const wss = new WebSocket.Server({ port: PORT });

// FIXED: Corrected console.log to show actual port 5003
console.log(`DAP Proxy listening on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('Debug client connected');

  let dapProcess = null;
  let buffer = '';

  ws.on('message', (data) => {
    const message = data.toString();

    try {
      const dapMessage = JSON.parse(message);

      // Initialize request - spawn debug adapter
      if (dapMessage.command === 'initialize') {
        const adapterType = dapMessage.arguments?.adapterID || 'node';

        const adapter = getDebugAdapter(adapterType);
        if (adapter) {
          dapProcess = spawn(adapter.command, adapter.args);

          dapProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            processBuffer();
          });

          dapProcess.stderr.on('data', (data) => {
            console.error('DAP stderr:', data.toString());
          });

          dapProcess.on('close', (code) => {
            console.log(`DAP process exited with code ${code}`);
          });
        }
      }

      // Forward message to debug adapter
      if (dapProcess && dapProcess.stdin.writable) {
        const content = JSON.stringify(dapMessage);
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
        dapProcess.stdin.write(header + content);
      }

    } catch (error) {
      console.error('Failed to parse DAP message:', error);
    }
  });

  function processBuffer() {
    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = buffer.substring(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length: (\d+)/);

      if (!contentLengthMatch) break;

      const contentLength = parseInt(contentLengthMatch[1]);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (buffer.length < messageEnd) break;

      const content = buffer.substring(messageStart, messageEnd);
      buffer = buffer.substring(messageEnd);

      // Send to WebSocket client
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(content);
      }
    }
  }

  ws.on('close', () => {
    console.log('Debug client disconnected');
    if (dapProcess) {
      dapProcess.kill();
    }
  });
});

function getDebugAdapter(adapterType) {
  const adapters = {
    node: { command: 'node', args: ['--inspect-brk'] },
    python: { command: 'python', args: ['-m', 'debugpy', '--listen', '5678'] },
  };

  return adapters[adapterType] || adapters.node;
}

console.log('DAP Proxy ready. Waiting for debug connections...');
