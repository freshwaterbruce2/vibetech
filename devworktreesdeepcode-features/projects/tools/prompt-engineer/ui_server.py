#!/usr/bin/env python3
"""
Simple web server for the Context Collector UI.
"""

import sys
import os
import json
import threading
import webbrowser
import socket
from pathlib import Path
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from collectors import CodeScanner

class ContextCollectorHandler(BaseHTTPRequestHandler):
    """HTTP handler for the context collector UI."""
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/' or path == '/index.html':
            self.serve_file('ui/index.html', 'text/html')
        elif path.startswith('/download/'):
            # Serve context files for download
            filename = path.split('/')[-1]
            file_path = Path(filename)
            if file_path.exists() and file_path.suffix == '.json':
                self.serve_file(str(file_path), 'application/json', download=True)
            else:
                self.send_error(404, "File not found")
        else:
            self.send_error(404, "Not found")
    
    def do_POST(self):
        """Handle POST requests."""
        if self.path == '/analyze':
            self.handle_analyze_request()
        else:
            self.send_error(404, "Not found")
    
    def serve_file(self, file_path, content_type, download=False):
        """Serve a file with appropriate headers."""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            
            if download:
                filename = Path(file_path).name
                self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, f"Server error: {e}")
    
    def handle_analyze_request(self):
        """Handle project analysis request."""
        try:
            # Read request data
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            request_data = json.loads(post_data)
            
            # Extract parameters
            project_path = request_data.get('projectPath', '.')
            max_files = int(request_data.get('maxFiles', 100))
            include_tests = request_data.get('includeTests', True)
            include_configs = request_data.get('includeConfigs', True)
            deep_analysis = request_data.get('deepAnalysis', True)
            include_docs = request_data.get('includeDocs', True)
            
            # Analyze the project
            result = self.analyze_project(
                project_path, max_files, include_tests, 
                include_configs, deep_analysis, include_docs
            )
            
            # Send response
            self.send_json_response(result)
            
        except Exception as e:
            error_response = {'error': str(e)}
            self.send_json_response(error_response, status_code=500)
    
    def analyze_project(self, project_path, max_files, include_tests, 
                       include_configs, deep_analysis, include_docs):
        """Analyze project and return results."""
        
        print(f"[INFO] Analyzing project: {project_path}")
        
        try:
            base_path = Path(project_path).resolve()
            
            if not base_path.exists():
                raise ValueError(f"Path does not exist: {project_path}")
            
            # Use the CodeScanner for analysis
            scanner = CodeScanner()
            scan_results = scanner.scan_directory(
                directory=str(base_path),
                recursive=True,
                max_files=max_files
            )
            
            # Extract summary information
            summary = scan_results['summary']
            languages = summary.get('languages', {})
            
            # Create result data
            result_data = {
                'collection_info': {
                    'timestamp': datetime.now().isoformat(),
                    'base_path': str(base_path),
                    'max_files': max_files,
                    'options': {
                        'include_tests': include_tests,
                        'include_configs': include_configs,
                        'deep_analysis': deep_analysis,
                        'include_docs': include_docs
                    }
                },
                'summary': summary,
                'file_details': []
            }
            
            # Add file details (simplified for UI)
            for code_file in scan_results['files'][:50]:  # Limit for UI display
                file_info = {
                    'path': code_file.path,
                    'language': code_file.language,
                    'lines_of_code': code_file.lines_of_code,
                    'function_count': len(code_file.functions),
                    'class_count': len(code_file.classes)
                }
                result_data['file_details'].append(file_info)
            
            # Save to file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ui_context_{timestamp}.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, indent=2, ensure_ascii=False)
            
            print(f"[OK] Analysis complete. Results saved to: {filename}")
            
            # Return summary for UI
            return {
                'success': True,
                'filename': filename,
                'total_files': summary.get('total_files', 0),
                'total_functions': summary.get('function_count', 0),
                'total_classes': summary.get('class_count', 0),
                'languages_count': len(languages),
                'languages': list(languages.keys()),
                'total_lines': summary.get('total_lines', 0)
            }
            
        except Exception as e:
            print(f"[FAIL] Analysis error: {e}")
            raise
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response."""
        response = json.dumps(data, indent=2).encode('utf-8')
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response)))
        self.send_header('Access-Control-Allow-Origin', '*')  # For development
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(response)
    
    def log_message(self, format, *args):
        """Override to reduce logging noise."""
        if '--verbose' in sys.argv:
            super().log_message(format, *args)

def find_free_port():
    """Find a free port to use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('localhost', 0))
        return s.getsockname()[1]

def start_server(port=None, auto_open=True):
    """Start the web server."""
    
    print("=" * 60)
    print("Context Collector - Web UI")
    print("=" * 60)
    
    # Find a free port if none specified
    if port is None:
        port = find_free_port()
        print(f"Using available port: {port}")
    else:
        print(f"Trying port {port}...")
    
    try:
        server = HTTPServer(('localhost', port), ContextCollectorHandler)
        server_url = f"http://localhost:{port}"
        
        print(f"[OK] Server running at: {server_url}")
        print("[INFO] Use Ctrl+C to stop the server")
        
        if auto_open:
            # Open browser in a separate thread after a short delay
            def open_browser():
                import time
                time.sleep(1)  # Give server time to start
                try:
                    webbrowser.open(server_url)
                    print(f"[OK] Opened browser at: {server_url}")
                except Exception as e:
                    print(f"[WARN] Could not open browser: {e}")
            
            threading.Thread(target=open_browser, daemon=True).start()
        
        print()
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\\n[INFO] Server stopped by user")
    except Exception as e:
        print(f"[FAIL] Server error: {e}")

def main():
    """Main function."""
    
    # Parse command line arguments
    port = None  # Let server find a free port
    auto_open = True
    
    # Check for no-browser flag first
    if '--no-browser' in sys.argv:
        auto_open = False
    
    # Then check for port number
    for arg in sys.argv[1:]:
        if arg != '--no-browser' and not arg.startswith('--'):
            try:
                port = int(arg)
            except ValueError:
                print(f"Invalid port: {arg}")
                sys.exit(1)
            break
    
    start_server(port, auto_open)

if __name__ == "__main__":
    main()