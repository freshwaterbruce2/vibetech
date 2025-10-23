#!/usr/bin/env node
/**
 * Standalone server for Crypto Trading Dashboard
 * Runs on port 5173 without interfering with main site
 */

const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5173;

// Proxy API requests to the Python backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
}));

// Serve static files from dist (production build)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   Crypto Trading Dashboard Server             ║
╠════════════════════════════════════════════════╣
║                                                ║
║   🚀 Server running on:                       ║
║      http://localhost:${PORT}                   ║
║                                                ║
║   📊 Dashboard URL:                           ║
║      http://localhost:${PORT}/trading           ║
║                                                ║
║   🔌 API Backend:                             ║
║      http://localhost:8001                     ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});
