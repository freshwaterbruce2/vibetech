---
description: Check if a port is in use and identify the process using it
argument-hint: <port_number>
model: sonnet
---

You are checking the status of a network port on Windows to determine if it's in use and which process is occupying it.

## Step 1: Validate Argument

First, check if the user provided a port number argument. The argument will be available as `{{arg1}}` or in the user's message.

If no port number is provided ({{arg1}} is empty or the user didn't specify a port), respond with:
```
════════════════════════════════════════
  PORT CHECK - USAGE
════════════════════════════════════════

Please provide a port number to check.

Usage: /dev:port-check <port_number>

Examples:
  /dev:port-check 3005
  /dev:port-check 5556
  /dev:port-check 8080

Common Ports in Your Projects:
  - 3005 (digital-content-builder)
  - 5556 (various dev servers)
  - 5173 (Vite dev server)
  - 8083, 8084, 8087 (crypto services)

════════════════════════════════════════
```

And STOP execution.

## Step 2: Execute Port Check

If a port number was provided, execute this PowerShell command (replace PORT_NUMBER with the actual port from {{arg1}}):

```powershell
$port = {{arg1}}
Write-Output "════════════════════════════════════════"
Write-Output "  PORT STATUS CHECK: $port"
Write-Output "════════════════════════════════════════"
Write-Output ""

$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connection) {
    Write-Output "Status: ⚠ PORT IN USE"
    Write-Output ""
    $processId = $connection.OwningProcess | Select-Object -First 1
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

    if ($process) {
        Write-Output "Port $port is currently in use by:"
        Write-Output ""
        Write-Output "  Process Name: $($process.ProcessName)"
        Write-Output "  Process ID (PID): $($process.Id)"
        Write-Output "  Start Time: $($process.StartTime)"
        Write-Output "  Memory Usage: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB"
        Write-Output ""
        Write-Output "Connection Details:"
        Write-Output "  Local Address: $($connection.LocalAddress):$($connection.LocalPort)"
        Write-Output "  Remote Address: $($connection.RemoteAddress):$($connection.RemotePort)"
        Write-Output "  State: $($connection.State)"
        Write-Output ""
        Write-Output "────────────────────────────────────────"
        Write-Output "To stop this process:"
        Write-Output "  Stop-Process -Id $($process.Id) -Force"
        Write-Output "────────────────────────────────────────"
    } else {
        Write-Output "Port $port is in use, but unable to retrieve process details."
        Write-Output "Process ID: $processId"
    }
} else {
    Write-Output "Status: ✓ PORT AVAILABLE"
    Write-Output ""
    Write-Output "Port $port is free and available for use."
    Write-Output ""
    Write-Output "You can safely start a server on this port."
}

Write-Output ""
Write-Output "════════════════════════════════════════"
```

## Step 3: Present Results

Show the complete output from the PowerShell command to the user.

## Step 4: Additional Context (Optional)

If the port is in use and it's one of the known project ports, provide helpful context:

- **Port 3005**: This is typically used by digital-content-builder server
  - To restart properly: `/web:restart-server`

- **Port 5173**: This is the default Vite development server port
  - Check if `npm run dev` is running

- **Port 8083, 8084, 8087**: These are used by crypto trading services
  - Check trading system status: `/crypto:status`

**IMPORTANT EXECUTION NOTES:**
- Execute the PowerShell command using the Bash tool with: `powershell.exe -Command "..."`
- Replace {{arg1}} with the actual port number provided by the user
- If no argument is provided, show the usage message and stop
- The Get-NetTCPConnection command requires the port to be an integer
- Common port numbers: 80, 443, 3000, 3005, 5173, 5432, 5556, 8000, 8080, 8083, 8084, 8087
