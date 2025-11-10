/**
 * Health check endpoints for IPC Bridge
 */

export const createHealthHandler = (wss) => {
  return (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ipc-bridge',
      version: '1.0.0',
      uptime: process.uptime(),
      connections: {
        total: wss.clients.size,
        active: Array.from(wss.clients).filter(client => client.readyState === 1).length,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  };
};

export const createReadinessHandler = (wss) => {
  return (req, res) => {
    // Check if WebSocket server is actually ready to accept connections
    // A server is ready when:
    // 1. The WebSocket server exists and is listening
    // 2. The server hasn't encountered a fatal error
    const isListening = wss && wss._server && wss._server.listening;

    const status = {
      ready: isListening,
      timestamp: new Date().toISOString(),
      details: {
        serverExists: !!wss,
        listening: isListening,
      },
    };

    const statusCode = isListening ? 200 : 503;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  };
};

export const createMetricsHandler = (wss, messageStats) => {
  return (req, res) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      connections: {
        current: wss.clients.size,
        total: messageStats.totalConnections || 0,
      },
      messages: {
        sent: messageStats.sent || 0,
        received: messageStats.received || 0,
        errors: messageStats.errors || 0,
      },
      uptime: process.uptime(),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics, null, 2));
  };
};
