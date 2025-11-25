#!/usr/bin/env python3
"""
Standalone HTTP server for Crypto Trading Dashboard
Serves the built dist/ folder on port 5173
Handles React Router by serving index.html for all routes
"""

import http.server
import socketserver
import os
from pathlib import Path

PORT = 5173
DIRECTORY = "dist"

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Serve static assets directly
        if Path(self.translate_path(self.path)).is_file():
            return super().do_GET()

        # For all other routes (React Router), serve index.html
        self.path = '/index.html'
        return super().do_GET()

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), SPAHTTPRequestHandler) as httpd:
    print(f"""
╔════════════════════════════════════════════════╗
║   Crypto Trading Dashboard Server             ║
╠════════════════════════════════════════════════╣
║                                                ║
║   🚀 Server running on:                       ║
║      http://localhost:{PORT}                   ║
║                                                ║
║   📊 Dashboard URL:                           ║
║      http://localhost:{PORT}/trading           ║
║                                                ║
║   🔌 API Backend:                             ║
║      http://localhost:8001 (must be running)   ║
║                                                ║
║   Press Ctrl+C to stop                         ║
╚════════════════════════════════════════════════╝
    """)
    httpd.serve_forever()
