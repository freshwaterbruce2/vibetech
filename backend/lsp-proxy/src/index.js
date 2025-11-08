/**
 * LSP Proxy - WebSocket to Language Server Bridge
 * Port: 5002 (as per documentation)
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 5002;
const wss = new WebSocket.Server({ port: PORT });

console.log(`LSP Proxy listening on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('Client connected');

  let lspProcess = null;
  let buffer = '';

  ws.on('message', (data) => {
    const message = data.toString();

    // Parse JSON-RPC message
    try {
      const jsonRpc = JSON.parse(message);

      // Initialize request - spawn language server
      if (jsonRpc.method === 'initialize') {
        const languageId = jsonRpc.params?.capabilities?.textDocument?.languageId || 'typescript';

        // Spawn appropriate language server
        const lsCommand = getLanguageServerCommand(languageId);
        if (lsCommand) {
          lspProcess = spawn(lsCommand.command, lsCommand.args);

          lspProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            processBuffer();
          });

          lspProcess.stderr.on('data', (data) => {
            console.error('LSP stderr:', data.toString());
          });

          lspProcess.on('close', (code) => {
            console.log(`LSP process exited with code ${code}`);
          });
        }
      }

      // Forward message to language server
      if (lspProcess && lspProcess.stdin.writable) {
        const content = JSON.stringify(jsonRpc);
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
        lspProcess.stdin.write(header + content);
      }

    } catch (error) {
      console.error('Failed to parse message:', error);
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
    console.log('Client disconnected');
    if (lspProcess) {
      lspProcess.kill();
    }
  });
});

function getLanguageServerCommand(languageId) {
  const servers = {
    typescript: { command: 'typescript-language-server', args: ['--stdio'] },
    javascript: { command: 'typescript-language-server', args: ['--stdio'] },
    python: { command: 'pyright-langserver', args: ['--stdio'] },
    rust: { command: 'rust-analyzer', args: [] },
  };

  return servers[languageId] || servers.typescript;
}

console.log('LSP Proxy ready. Waiting for connections...');
