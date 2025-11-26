import { CommandRequestPayload, CommandResultPayload, IPCMessageType } from '@vibetech/shared-ipc';
import { logger } from './Logger';
import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type MCPRole = 'system-monitor' | 'process-manager' | 'file-manager' | 'automation';

interface CommandHandler {
  role: MCPRole;
  execute: (args: string[], context?: any) => Promise<any>;
  requiresConfirmation?: boolean;
}

export class CommandExecutor {
  private handlers = new Map<string, CommandHandler>();

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    // System Monitor Role
    this.register('get-cpu', 'system-monitor', async () => {
      return await si.currentLoad();
    });

    this.register('get-mem', 'system-monitor', async () => {
      return await si.mem();
    });

    this.register('get-system-info', 'system-monitor', async () => {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const os = await si.osInfo();
        return { cpu, mem, os };
    });

    // Process Manager Role (Strictly limited for now)
    this.register('list-processes', 'process-manager', async () => {
        const processes = await si.processes();
        return processes.list.slice(0, 50); // Limit to top 50
    });

    // Automation Role
    this.register('open-url', 'automation', async ([url]) => {
        if (!url) throw new Error('URL required');
        // Security check: only http/https
        if (!url.startsWith('http')) throw new Error('Only HTTP/HTTPS URLs allowed');
        
        await execAsync(`start ${url}`); // Windows specific
        return { opened: true, url };
    });
  }

  private register(command: string, role: MCPRole, execute: (args: string[], context?: any) => Promise<any>, requiresConfirmation = false) {
    this.handlers.set(command, { role, execute, requiresConfirmation });
  }

  public async execute(request: CommandRequestPayload): Promise<any> {
    const { text, context } = request;
    
    // Parse command (simple "command arg1 arg2" format for now)
    const [commandName, ...args] = text.split(' ');
    
    const handler = this.handlers.get(commandName);
    
    if (!handler) {
      logger.warn(`Unknown command requested: ${commandName}`);
      throw new Error(`Unknown command: ${commandName}`);
    }

    logger.info(`Executing command: ${commandName} (Role: ${handler.role})`);

    try {
        // TODO: Check permissions based on context/user (if available)
        
        const result = await handler.execute(args, context);
        return result;
    } catch (error) {
        logger.error(`Error executing ${commandName}:`, error);
        throw error;
    }
  }
}
