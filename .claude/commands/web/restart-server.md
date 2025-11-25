---
description: Restart the digital-content-builder server with health check verification
model: sonnet
---

You are automating the server restart workflow for the digital-content-builder project. Execute the following steps using PowerShell commands:

## Step 1: Kill Existing Node Processes

Execute this PowerShell command to stop all running node processes:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

After execution, report to the user:
"✓ Stopped all existing node.exe processes"

If no processes were found, report:
"✓ No existing node.exe processes found"

## Step 2: Start the Server

Execute this PowerShell command to start the server in the background:
```powershell
cd 'C:\dev\projects\active\web-apps\digital-content-builder'; Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js" -WindowStyle Minimized
```

After execution, report to the user:
"✓ Started server.js in background on port 3005"

## Step 3: Wait for Server Initialization

Execute this PowerShell command to wait 5 seconds:
```powershell
Start-Sleep -Seconds 5
```

Report to the user:
"⏳ Waiting 5 seconds for server initialization..."

## Step 4: Health Check

Execute this PowerShell command to verify the server is healthy:
```powershell
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3005/api/health" -Method GET -TimeoutSec 10
    Write-Output "✓ SERVER HEALTHY"
    Write-Output "  Status: $($response.status)"
    Write-Output "  Version: $($response.version)"
    if ($response.uptime) { Write-Output "  Uptime: $($response.uptime)s" }
    if ($response.deepseek) { Write-Output "  DeepSeek: $($response.deepseek)" }
} catch {
    Write-Output "✗ HEALTH CHECK FAILED"
    Write-Output "  Error: $($_.Exception.Message)"
    Write-Output "  The server may still be starting or there may be an error."
    Write-Output "  Check the server window for error messages."
}
```

Report the complete output from this command to the user.

## Step 5: Final Summary

After all steps complete, provide a summary:
```
════════════════════════════════════════
  SERVER RESTART COMPLETE
════════════════════════════════════════
Server URL: http://localhost:3005
Server Window: Minimized PowerShell window
To view logs: Check the minimized PowerShell window
To stop: Use /web:stop-server or manually close the window
════════════════════════════════════════
```

**IMPORTANT EXECUTION NOTES:**
- Execute each PowerShell command using the Bash tool with the command: `powershell.exe -Command "..."`
- Wait for each command to complete before moving to the next step
- If any step fails, report the error clearly and stop the process
- The server will run in a minimized PowerShell window that stays open
