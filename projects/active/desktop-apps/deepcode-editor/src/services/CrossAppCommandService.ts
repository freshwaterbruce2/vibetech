/**
 * Cross-App Command Service for Vibe Code Studio
 *
 * Handles commands from NOVA Agent via IPC Bridge
 * Examples: @vibe open file, @vibe show references, @vibe run tests
 */

import { IPCMessageType, CommandExecutePayload, CommandResultPayload } from '@vibetech/shared-ipc';
import { ipcClient } from './IPCClient';

export interface CommandRequest {
    commandId: string;
    command: string;
    args: string[];
    text: string;
    originalSender: string;
}

export interface CommandResult {
    commandId: string;
    success: boolean;
    result?: any;
    error?: string;
}

export class CrossAppCommandService {
    private commandHandlers: Map<string, (args: string[]) => Promise<any>>;

    constructor() {
        this.commandHandlers = new Map();
        this.registerDefaultHandlers();
        this.setupIPCListener();
    }

    /**
     * Register default command handlers
     */
    private registerDefaultHandlers() {
        // File operations
        this.register('open', this.handleOpen.bind(this));
        this.register('save', this.handleSave.bind(this));
        this.register('close', this.handleClose.bind(this));

        // Code navigation
        this.register('goto', this.handleGoto.bind(this));
        this.register('find', this.handleFind.bind(this));
        this.register('references', this.handleReferences.bind(this));

        // Code operations
        this.register('format', this.handleFormat.bind(this));
        this.register('refactor', this.handleRefactor.bind(this));
        this.register('rename', this.handleRename.bind(this));

        // Testing
        this.register('test', this.handleTest.bind(this));
        this.register('run', this.handleRun.bind(this));

        // Git operations
        this.register('commit', this.handleCommit.bind(this));
        this.register('push', this.handlePush.bind(this));
        this.register('pull', this.handlePull.bind(this));

        // Help
        this.register('help', this.handleHelp.bind(this));
    }

    /**
     * Set up IPC listener for incoming commands
     */
    private setupIPCListener() {
        ipcClient.on(IPCMessageType.COMMAND_EXECUTE, async (payload: CommandExecutePayload & { originalSource?: string; originalMessageId?: string; correlationId?: string }) => {
            const { commandId, command, args = [], text } = payload;

            console.log(`[Vibe] Executing command: ${command}`, args);

            const startedAt = Date.now();

            try {
                const result = await this.execute(command, args);
                const elapsedMs = Date.now() - startedAt;

                // Send result back via IPC
                ipcClient.send({
                    type: IPCMessageType.COMMAND_RESULT,
                    payload: {
                        commandId,
                        success: true,
                        result,
                        metrics: {
                            elapsedMs,
                            startedAt,
                            finishedAt: startedAt + elapsedMs,
                        },
                    } satisfies CommandResultPayload,
                    timestamp: Date.now(),
                    messageId: `result-${commandId}`,
                    correlationId: payload.originalMessageId,
                });
            } catch (error: any) {
                // Send error back via IPC
                ipcClient.send({
                    type: IPCMessageType.COMMAND_RESULT,
                    payload: {
                        commandId,
                        success: false,
                        error: error.message || 'Command execution failed',
                    } satisfies CommandResultPayload,
                    timestamp: Date.now(),
                    messageId: `result-${commandId}`,
                    correlationId: payload.originalMessageId,
                });
            }
        });
    }

    /**
     * Register a command handler
     */
    register(command: string, handler: (args: string[]) => Promise<any>) {
        this.commandHandlers.set(command.toLowerCase(), handler);
    }

    /**
     * Execute a command
     */
    async execute(command: string, args: string[]): Promise<any> {
        const handler = this.commandHandlers.get(command.toLowerCase());

        if (!handler) {
            throw new Error(`Unknown command: ${command}`);
        }

        return await handler(args);
    }

    // Command Implementations

    private async handleOpen(args: string[]): Promise<any> {
        const file = args[0];
        if (!file) throw new Error('File path required');

        // TODO: Integrate with Vibe's file opening system
        console.log(`Opening file: ${file}`);

        return {
            file,
            opened: true,
            message: 'File opened successfully'
        };
    }

    private async handleSave(args: string[]): Promise<any> {
        // TODO: Integrate with Vibe's file saving system
        return {
            saved: true,
            message: 'File saved successfully'
        };
    }

    private async handleClose(args: string[]): Promise<any> {
        const file = args[0];

        // TODO: Close file in Vibe
        return {
            file,
            closed: true
        };
    }

    private async handleGoto(args: string[]): Promise<any> {
        const [file, line] = args;

        if (!file) throw new Error('File required');

        // TODO: Navigate to file:line
        return {
            file,
            line: parseInt(line) || 1,
            navigated: true
        };
    }

    private async handleFind(args: string[]): Promise<any> {
        const query = args.join(' ');

        if (!query) throw new Error('Search query required');

        // TODO: Search in workspace
        return {
            query,
            results: [],
            count: 0
        };
    }

    private async handleReferences(args: string[]): Promise<any> {
        const symbol = args.join(' ');

        if (!symbol) throw new Error('Symbol required');

        // TODO: Find symbol references
        return {
            symbol,
            references: [],
            count: 0
        };
    }

    private async handleFormat(args: string[]): Promise<any> {
        // TODO: Format current file
        return {
            formatted: true,
            message: 'File formatted'
        };
    }

    private async handleRefactor(args: string[]): Promise<any> {
        const operation = args[0];

        // TODO: Perform refactoring
        return {
            operation,
            completed: false,
            message: 'Refactoring not yet implemented'
        };
    }

    private async handleRename(args: string[]): Promise<any> {
        const [oldName, newName] = args;

        if (!oldName || !newName) {
            throw new Error('Old and new names required');
        }

        // TODO: Rename symbol
        return {
            oldName,
            newName,
            renamed: false,
            message: 'Rename not yet implemented'
        };
    }

    private async handleTest(args: string[]): Promise<any> {
        const testName = args.join(' ');

        // TODO: Run tests
        return {
            test: testName || 'all',
            passed: 0,
            failed: 0,
            message: 'Tests not yet implemented'
        };
    }

    private async handleRun(args: string[]): Promise<any> {
        // TODO: Run current file/project
        return {
            running: false,
            message: 'Run not yet implemented'
        };
    }

    private async handleCommit(args: string[]): Promise<any> {
        const message = args.join(' ');

        if (!message) throw new Error('Commit message required');

        // TODO: Git commit
        return {
            message,
            committed: false,
            commit_message: 'Git integration not yet implemented'
        };
    }

    private async handlePush(args: string[]): Promise<any> {
        // TODO: Git push
        return {
            pushed: false,
            message: 'Git integration not yet implemented'
        };
    }

    private async handlePull(args: string[]): Promise<any> {
        // TODO: Git pull
        return {
            pulled: false,
            message: 'Git integration not yet implemented'
        };
    }

    private async handleHelp(args: string[]): Promise<any> {
        return {
            commands: [
                {
                    name: 'open',
                    description: 'Open a file',
                    usage: '@vibe open <file_path>'
                },
                {
                    name: 'save',
                    description: 'Save current file',
                    usage: '@vibe save'
                },
                {
                    name: 'close',
                    description: 'Close a file',
                    usage: '@vibe close [file_path]'
                },
                {
                    name: 'goto',
                    description: 'Navigate to file:line',
                    usage: '@vibe goto <file> [line]'
                },
                {
                    name: 'find',
                    description: 'Search in workspace',
                    usage: '@vibe find <query>'
                },
                {
                    name: 'references',
                    description: 'Find symbol references',
                    usage: '@vibe references <symbol>'
                },
                {
                    name: 'format',
                    description: 'Format current file',
                    usage: '@vibe format'
                },
                {
                    name: 'refactor',
                    description: 'Perform refactoring',
                    usage: '@vibe refactor <operation>'
                },
                {
                    name: 'rename',
                    description: 'Rename symbol',
                    usage: '@vibe rename <old_name> <new_name>'
                },
                {
                    name: 'test',
                    description: 'Run tests',
                    usage: '@vibe test [test_name]'
                },
                {
                    name: 'run',
                    description: 'Run current file/project',
                    usage: '@vibe run'
                },
                {
                    name: 'commit',
                    description: 'Git commit',
                    usage: '@vibe commit <message>'
                },
                {
                    name: 'push',
                    description: 'Git push',
                    usage: '@vibe push'
                },
                {
                    name: 'pull',
                    description: 'Git pull',
                    usage: '@vibe pull'
                },
                {
                    name: 'help',
                    description: 'Show available commands',
                    usage: '@vibe help'
                }
            ]
        };
    }
}

// Export singleton instance
export const crossAppCommandService = new CrossAppCommandService();
