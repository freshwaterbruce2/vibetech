import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ExecuteCommandArgs {
  command: string;
}

const COMMAND_MAP: Record<string, string> = {
  '/crypto:status': 'powershell -File C:\\dev\\.claude\\commands\\crypto\\status.md',
  '/crypto:performance': 'powershell -File C:\\dev\\.claude\\commands\\crypto\\performance.md',
  '/crypto:restart': 'powershell -File C:\\dev\\.claude\\commands\\crypto\\restart.md',
  '/web:quality-check': 'powershell -File C:\\dev\\.claude\\commands\\web\\quality-check.md',
  '/web:test-all': 'powershell -File C:\\dev\\.claude\\commands\\web\\test-all.md',
};

export async function executeSlashCommand(args: ExecuteCommandArgs) {
  try {
    const { command } = args;

    // Check if it's a known slash command
    if (command.startsWith('/')) {
      const script = COMMAND_MAP[command];

      if (!script) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unknown command: ${command}\n\nAvailable commands:\n${Object.keys(COMMAND_MAP).join('\n')}`,
            },
          ],
          isError: true,
        };
      }

      const { stdout, stderr } = await execAsync(script, {
        timeout: 60000, // 60 second timeout
        cwd: 'C:\\dev',
      });

      const output = stdout || stderr || 'Command executed successfully (no output)';

      return {
        content: [
          {
            type: 'text',
            text: `✅ **Command**: ${command}\n\n${output}`,
          },
        ],
      };
    }

    // Otherwise, execute as PowerShell command (with restrictions)
    if (command.includes('rm ') || command.includes('del ') || command.includes('Remove-Item')) {
      return {
        content: [
          {
            type: 'text',
            text: '⛔ Security Error: Destructive commands are not allowed.',
          },
        ],
        isError: true,
      };
    }

    const { stdout, stderr } = await execAsync(`powershell -Command "${command}"`, {
      timeout: 30000,
      cwd: 'C:\\dev',
    });

    const output = stdout || stderr || 'Command executed successfully (no output)';

    return {
      content: [
        {
          type: 'text',
          text: `✅ **Executed**: ${command}\n\n${output}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Command execution error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
