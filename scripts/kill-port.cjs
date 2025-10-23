
const { exec } = require('child_process');
const os = require('os');

const port = process.argv[2];

if (!port) {
  console.error('Please provide a port number.');
  process.exit(1);
}

const platform = os.platform();

if (platform === 'win32') {
  const command = `netstat -aon | findstr ":${port}"`;
  exec(command, (err, stdout, stderr) => {
    if (err && !stdout) {
      console.log(`Port ${port} is free.`);
      return;
    }

    if (stderr) {
      console.error(`Error finding process on port ${port}:`, stderr);
      return;
    }

    const lines = stdout.trim().split('\n');
    const pids = new Set();

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    });

    if (pids.size === 0) {
      console.log(`Port ${port} is free.`);
      return;
    }

    pids.forEach(pid => {
      const killCommand = `taskkill /pid ${pid} /f`;
      exec(killCommand, (killErr, killStdout, killStderr) => {
        if (killErr) {
          console.error(`Failed to kill process ${pid}:`, killErr);
          return;
        }
        if (killStderr) {
          // taskkill can output to stderr on success, so we log it as info
          console.log(`taskkill stderr for PID ${pid}: ${killStderr}`);
        }
        console.log(`Process ${pid} on port ${port} killed.`);
      });
    });
  });
} else {
  // For macOS and Linux
  const command = `lsof -i :${port} -t`;
  exec(command, (err, stdout, stderr) => {
    if (err && !stdout) {
      console.log(`Port ${port} is free.`);
      return;
    }
    
    if (stderr) {
        // lsof can write to stderr when no process is found
        console.log(`Port ${port} is free.`);
        return;
    }

    const pids = stdout.trim().split('\n');
    if (pids.length === 0 || (pids.length === 1 && pids[0] === '')) {
        console.log(`Port ${port} is free.`);
        return;
    }

    pids.forEach(pid => {
      if (pid) {
        const killCommand = `kill -9 ${pid}`;
        exec(killCommand, (killErr, killStdout, killStderr) => {
          if (killErr) {
            console.error(`Failed to kill process ${pid}:`, killErr);
            return;
          }
          console.log(`Process ${pid} on port ${port} killed.`);
        });
      }
    });
  });
}
