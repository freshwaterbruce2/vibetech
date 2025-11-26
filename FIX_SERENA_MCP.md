# Fix Serena MCP Server - Python 3.13 Compatibility Issue

## Problem

The `oraios/serena` MCP server fails to build with Python 3.13 due to breaking changes in Python's internal APIs.

Error: `AttributeError: 'str' object has no attribute 'co_consts'`

## Solution Steps

### 1. Install Python 3.12

After the installer opens, make sure to:

- ✅ Check "Add Python 3.12 to PATH"
- ✅ Check "Install for all users" (optional)
- Choose "Customize installation" and enable all optional features
- Complete the installation

### 2. Verify Python 3.12 Installation

```powershell
py -3.12 --version
# Should show: Python 3.12.x
```

### 3. Update MCP Server Configuration

The MCP server configuration is typically in VS Code settings. You need to configure it to use Python 3.12 specifically.

**Option A: VS Code User Settings (settings.json)**

```json
{
  "mcp.servers": {
    "oraios/serena": {
      "command": "py",
      "args": ["-3.12", "-m", "mcp"],
      "env": {
        "PYTHON_VERSION": "3.12"
      }
    }
  }
}
```

**Option B: If using uvx (recommended by MCP)**
The MCP server likely uses `uvx` to run. Update the Python version uvx uses:

```powershell
# Set UV to use Python 3.12
$env:UV_PYTHON = "3.12"
# Or set permanently
[System.Environment]::SetEnvironmentVariable("UV_PYTHON", "3.12", "User")
```

### 4. Clear MCP Cache and Reinstall

```powershell
# Clear UV cache
uv cache clean

# Restart VS Code to reload MCP servers
```

### 5. Verify Fix

After restarting VS Code, check the MCP server logs to confirm it starts successfully without the `AttributeError`.

## Alternative: Use Python 3.11

If Python 3.12 still has issues, Python 3.11 is the most stable version for build tools:

```powershell
# Install Python 3.11
# Download from: https://www.python.org/ftp/python/3.11.11/python-3.11.11-amd64.exe

# Then use py -3.11 in configuration
```

## Root Cause

Python 3.13 introduced breaking changes to:

- Code object structure (`co_consts` attribute handling)
- Internal linecache module behavior
- Build system APIs

Many build tools (hatchling, setuptools, etc.) haven't been updated yet for Python 3.13 compatibility.
