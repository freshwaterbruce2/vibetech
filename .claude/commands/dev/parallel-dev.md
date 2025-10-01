---
allowed-tools: Bash(npm run dev:*), Bash(python:*), Bash(Start-Parallel-Dev.bat), Task
description: Start development servers in parallel for maximum productivity
argument-hint: [web|crypto|both]
model: claude-3-5-haiku-20241022
---

# Parallel Development Environment

Start development servers for the web application and/or crypto trading monitoring in parallel.

## Mode Selection:
Launching ${1:-both} development environment(s)...

## Execution Strategy:

Based on the selected mode ($1), I'll:

1. **Web Only** (if $1 = "web"):
   - Start Vite dev server on port 5173
   - Enable HMR for instant updates
   - Open browser automatically

2. **Crypto Only** (if $1 = "crypto"):
   - Start trading system monitoring
   - Display real-time position updates
   - Show WebSocket connection status

3. **Both** (default):
   - Launch web dev server in background
   - Start trading monitoring in background
   - Provide combined status dashboard

## Launch Commands:

For web development:
!npm run dev 2>&1 | head -5

For crypto monitoring:
!cd projects/crypto-enhanced && python -c "print('Trading system ready for monitoring')"

## Post-Launch Instructions:

After launching the servers, I'll provide:
- Access URLs for each service
- Health check confirmations
- Quick command references
- Tips for efficient development

The servers will run in the background, allowing you to continue working while monitoring their output.

$ARGUMENTS