/**
 * Nova Integration Service
 * 
 * Renderer-side service for DeepCode Editor to communicate with Nova Agent.
 * Handles:
 * - Cross-app command routing (@nova commands)
 * - File open requests from Nova
 * - Learning data synchronization
 * - Activity context updates
 * - Monaco editor integration for file navigation
 */

import { logger } from './Logger';

// Types for Nova integration
export interface NovaConnectionStatus {
    connected: boolean;
    clientId?: string;
    connectedAt?: number;
    messageCount?: number;
}

export interface NovaCommand {
    commandId: string;
    text: string;
    context?: Record<string, unknown>;
    source: string;
}

export interface FileOpenRequest {
    filePath: string;
    line?: number | undefined;
    column?: number | undefined;
}

export interface LearningMistake {
    file_path: string;
    error_type: string;
    error_message: string;
    original_code: string;
    corrected_code: string;
    explanation: string;
    language: string;
    context?: string;
    confidence?: number;
}

export interface LearningKnowledge {
    category: string;
    topic: string;
    content: string;
    examples?: string;
    metadata?: string;
    relevance_score?: number;
}

export interface LearningStats {
    totalMistakes: number;
    totalKnowledge: number;
    mistakesByLanguage: Record<string, number>;
    mistakesByType: Record<string, number>;
    knowledgeByCategory: Record<string, number>;
    recentMistakes: LearningMistake[];
    recentKnowledge: LearningKnowledge[];
}

// Command handler type
type NovaCommandHandler = (command: NovaCommand) => Promise<{ success: boolean; result?: unknown; error?: string }>;

// File open handler type  
type FileOpenHandler = (request: FileOpenRequest) => void;

class NovaIntegrationService {
    private isInitialized = false;
    private commandHandlers: Map<string, NovaCommandHandler> = new Map();
    private fileOpenHandler: FileOpenHandler | null = null;
    private contextUpdateCallbacks: ((context: Record<string, unknown>) => void)[] = [];
    private connectionStatusCallbacks: ((connected: boolean) => void)[] = [];

    /**
     * Initialize the Nova integration service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Check if we're in Electron environment
            const electron = getNovaElectron();
            if (!electron?.nova) {
                logger.warn('[NovaIntegration] Not running in Electron environment, Nova integration disabled');
                return;
            }

            // Set up event listeners for Nova messages
            this.setupEventListeners();

            // Register default command handlers
            this.registerDefaultHandlers();

            this.isInitialized = true;
            logger.info('[NovaIntegration] Service initialized');

            // Check initial connection status
            const connected = await this.isNovaConnected();
            logger.info(`[NovaIntegration] Nova connection status: ${connected ? 'connected' : 'disconnected'}`);

        } catch (error) {
            logger.error('[NovaIntegration] Failed to initialize:', error);
        }
    }

    /**
     * Set up event listeners for Nova messages
     */
    private setupEventListeners(): void {
        const electron = getNovaElectron();
        const nova = electron?.nova;
        if (!nova) return;

        // Handle file open requests from Nova
        nova.onFileOpen((data) => {
            logger.info(`[NovaIntegration] File open request: ${data.filePath} at line ${data.line}`);
            if (this.fileOpenHandler) {
                this.fileOpenHandler(data);
            }
        });

        // Handle command requests from Nova
        nova.onCommandRequest(async (data) => {
            logger.info(`[NovaIntegration] Command request from ${data.source}: ${data.text}`);
            await this.handleIncomingCommand(data);
        });

        // Handle context updates from Nova
        nova.onContextUpdate((data) => {
            logger.debug('[NovaIntegration] Context update received');
            this.contextUpdateCallbacks.forEach(callback => callback(data));
        });

        // Handle learning events from Nova
        nova.onLearningEvent((data) => {
            logger.debug('[NovaIntegration] Learning event received:', data);
            // Sync learning data from Nova
            const mistakes = data['mistakes'] as unknown[] | undefined;
            const knowledge = data['knowledge'] as unknown[] | undefined;
            if (mistakes || knowledge) {
                this.syncLearningFromNova(mistakes ?? [], knowledge ?? []);
            }
        });

        // Handle Nova disconnection
        nova.onClientDisconnected((data) => {
            if (data.source === 'nova') {
                logger.warn('[NovaIntegration] Nova Agent disconnected');
                this.connectionStatusCallbacks.forEach(callback => callback(false));
            }
        });
    }

    /**
     * Register default command handlers for @vibe commands
     */
    private registerDefaultHandlers(): void {
        // @vibe open-file <path> [line]
        this.registerCommand('open-file', async (command) => {
            const match = command.text.match(/open-file\s+(.+?)(?:\s+(\d+))?$/);
            if (match && match[1]) {
                const filePath = match[1];
                const line = match[2];
                if (this.fileOpenHandler) {
                    this.fileOpenHandler({ filePath, line: line ? parseInt(line) : undefined });
                }
                return { success: true };
            }
            return { success: false, error: 'Invalid open-file command format' };
        });

        // @vibe search <query>
        this.registerCommand('search', async (command) => {
            const query = command.text.replace(/^search\s+/, '');
            // This would integrate with the SearchService
            return { success: true, result: { query, note: 'Search integration pending' } };
        });

        // @vibe run-agent <task>
        this.registerCommand('run-agent', async (command) => {
            const task = command.text.replace(/^run-agent\s+/, '');
            // This would trigger the agent mode
            return { success: true, result: { task, note: 'Agent mode integration pending' } };
        });

        // @vibe get-context
        this.registerCommand('get-context', async (_command) => {
            // Return current editor context
            return {
                success: true,
                result: {
                    // This would be populated with actual editor state
                    activeFile: null,
                    selection: null,
                    diagnostics: [],
                },
            };
        });

        // @vibe learning-stats
        this.registerCommand('learning-stats', async (_command) => {
            const stats = await this.getLearningStats();
            return { success: true, result: stats };
        });
    }

    /**
     * Handle incoming command from Nova
     */
    private async handleIncomingCommand(data: NovaCommand): Promise<void> {
        const { commandId, text, context, source } = data;

        // Parse command name from text (e.g., "@vibe open-file path" -> "open-file")
        const commandMatch = text.match(/^@?vibe\s+(\S+)/i);
        if (!commandMatch) {
            logger.warn(`[NovaIntegration] Invalid command format: ${text}`);
            return;
        }

        const commandName = commandMatch[1]?.toLowerCase();
        if (!commandName) {
            logger.warn(`[NovaIntegration] Could not extract command name from: ${text}`);
            return;
        }
        const handler = this.commandHandlers.get(commandName);

        if (handler) {
            try {
                const result = await handler({ commandId, text, context: context ?? {}, source });
                logger.info(`[NovaIntegration] Command ${commandName} completed:`, result);
                // Note: Response would be sent back through IPC bridge automatically
            } catch (error) {
                logger.error(`[NovaIntegration] Command ${commandName} failed:`, error);
            }
        } else {
            logger.warn(`[NovaIntegration] Unknown command: ${commandName}`);
        }
    }

    /**
     * Register a command handler for @vibe commands
     */
    registerCommand(commandName: string, handler: NovaCommandHandler): void {
        this.commandHandlers.set(commandName.toLowerCase(), handler);
        logger.debug(`[NovaIntegration] Registered command handler: ${commandName}`);
    }

    /**
     * Set the file open handler (typically connects to Monaco editor)
     */
    setFileOpenHandler(handler: FileOpenHandler): void {
        this.fileOpenHandler = handler;
    }

    /**
     * Add context update callback
     */
    onContextUpdate(callback: (context: Record<string, unknown>) => void): () => void {
        this.contextUpdateCallbacks.push(callback);
        return () => {
            const index = this.contextUpdateCallbacks.indexOf(callback);
            if (index > -1) this.contextUpdateCallbacks.splice(index, 1);
        };
    }

    /**
     * Add connection status callback
     */
    onConnectionStatusChange(callback: (connected: boolean) => void): () => void {
        this.connectionStatusCallbacks.push(callback);
        return () => {
            const index = this.connectionStatusCallbacks.indexOf(callback);
            if (index > -1) this.connectionStatusCallbacks.splice(index, 1);
        };
    }

    /**
     * Send a command to Nova Agent
     */
    async sendCommandToNova(command: string, context?: Record<string, unknown>): Promise<{ success: boolean; messageId?: string }> {
        try {
            const electron = getNovaElectron();
            if (!electron?.nova) {
                return { success: false };
            }

            const result = await electron.nova.sendCommand(command, context);
            logger.info(`[NovaIntegration] Sent command to Nova: ${command}`);
            return result;

        } catch (error) {
            logger.error('[NovaIntegration] Failed to send command to Nova:', error);
            return { success: false };
        }
    }

    /**
     * Notify Nova that a file was opened
     */
    async notifyFileOpened(filePath: string, content?: string): Promise<void> {
        try {
            const electron = getNovaElectron();
            if (!electron?.nova) return;

            await electron.nova.notifyFileOpened(filePath, content);
            logger.debug(`[NovaIntegration] Notified Nova of file open: ${filePath}`);

        } catch (error) {
            logger.error('[NovaIntegration] Failed to notify file opened:', error);
        }
    }

    /**
     * Check if Nova Agent is connected
     */
    async isNovaConnected(): Promise<boolean> {
        try {
            const electron = getNovaElectron();
            if (!electron?.nova) return false;
            return await electron.nova.isConnected();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get IPC bridge stats
     */
    async getBridgeStats(): Promise<unknown> {
        try {
            const electron = getNovaElectron();
            if (!electron?.nova) return null;
            return await electron.nova.getStats();
        } catch (error) {
            return null;
        }
    }

    // ==================== Learning Database Methods ====================

    /**
     * Record a coding mistake
     */
    async recordMistake(mistake: LearningMistake): Promise<{ success: boolean; id?: number }> {
        try {
            const electron = getNovaElectron();
            if (!electron?.learning) {
                return { success: false };
            }

            const result = await electron.learning.recordMistake(mistake);

            // Also send to Nova for cross-app sync
            if (electron?.nova) {
                await electron.nova.sendLearningEvent('mistake', mistake as unknown as Record<string, unknown>);
            }

            return result;

        } catch (error) {
            logger.error('[NovaIntegration] Failed to record mistake:', error);
            return { success: false };
        }
    }

    /**
     * Record learned knowledge
     */
    async recordKnowledge(knowledge: LearningKnowledge): Promise<{ success: boolean; id?: number }> {
        try {
            const electron = getNovaElectron();
            if (!electron?.learning) {
                return { success: false };
            }

            const result = await electron.learning.recordKnowledge(knowledge);

            // Also send to Nova for cross-app sync
            if (electron?.nova) {
                await electron.nova.sendLearningEvent('knowledge', knowledge as unknown as Record<string, unknown>);
            }

            return result;

        } catch (error) {
            logger.error('[NovaIntegration] Failed to record knowledge:', error);
            return { success: false };
        }
    }

    /**
     * Find similar mistakes for error correction
     */
    async findSimilarMistakes(errorType: string, language: string, limit?: number): Promise<LearningMistake[]> {
        try {
            const electron = getNovaElectron();
            if (!electron?.learning) return [];
            return await electron.learning.findSimilarMistakes(errorType, language, limit);
        } catch (error) {
            logger.error('[NovaIntegration] Failed to find similar mistakes:', error);
            return [];
        }
    }

    /**
     * Find relevant knowledge
     */
    async findKnowledge(category: string, searchTerm: string, limit?: number): Promise<LearningKnowledge[]> {
        try {
            const electron = getNovaElectron();
            if (!electron?.learning) return [];
            return await electron.learning.findKnowledge(category, searchTerm, limit);
        } catch (error) {
            logger.error('[NovaIntegration] Failed to find knowledge:', error);
            return [];
        }
    }

    /**
     * Get learning statistics
     */
    async getLearningStats(): Promise<LearningStats | null> {
        try {
            const electron = getNovaElectron();
            if (!electron?.learning) return null;
            return await electron.learning.getStats();
        } catch (error) {
            logger.error('[NovaIntegration] Failed to get learning stats:', error);
            return null;
        }
    }

    /**
     * Sync learning data from Nova
     */
    private async syncLearningFromNova(mistakes: unknown[], knowledge: unknown[]): Promise<void> {
        try {
            const electron = getNovaElectron();
            if (!electron?.learning) return;

            const result = await electron.learning.syncFromNova(mistakes, knowledge);
            logger.info(`[NovaIntegration] Synced from Nova: ${result.mistakesAdded} mistakes, ${result.knowledgeAdded} knowledge`);

        } catch (error) {
            logger.error('[NovaIntegration] Failed to sync from Nova:', error);
        }
    }

    /**
     * Cleanup listeners on service destruction
     */
    destroy(): void {
        const electron = getNovaElectron();
        if (electron?.nova) {
            electron.nova.removeAllListeners();
        }
        this.commandHandlers.clear();
        this.contextUpdateCallbacks = [];
        this.connectionStatusCallbacks = [];
        this.fileOpenHandler = null;
        this.isInitialized = false;
        logger.info('[NovaIntegration] Service destroyed');
    }
}

// Export singleton instance
export const novaIntegration = new NovaIntegrationService();
export default novaIntegration;

// Nova-specific electron APIs (accessed via window.electron cast)
// These types are used internally - the actual window.electron type is in electron.d.ts
export interface NovaElectronAPI {
    nova?: {
        sendCommand: (command: string, context?: Record<string, unknown>) => Promise<{ success: boolean; messageId?: string }>;
        notifyFileOpened: (filePath: string, content?: string) => Promise<{ success: boolean }>;
        sendLearningEvent: (eventType: string, data: Record<string, unknown>) => Promise<{ success: boolean }>;
        isConnected: () => Promise<boolean>;
        getStats: () => Promise<unknown>;
        onFileOpen: (callback: (data: FileOpenRequest) => void) => void;
        onCommandRequest: (callback: (data: NovaCommand) => void) => void;
        onContextUpdate: (callback: (data: Record<string, unknown>) => void) => void;
        onLearningEvent: (callback: (data: Record<string, unknown>) => void) => void;
        onClientDisconnected: (callback: (data: { clientId: string; source: string }) => void) => void;
        removeAllListeners: () => void;
    };
    learning?: {
        recordMistake: (mistake: LearningMistake) => Promise<{ success: boolean; id?: number }>;
        recordKnowledge: (knowledge: LearningKnowledge) => Promise<{ success: boolean; id?: number }>;
        findSimilarMistakes: (errorType: string, language: string, limit?: number) => Promise<LearningMistake[]>;
        findKnowledge: (category: string, searchTerm: string, limit?: number) => Promise<LearningKnowledge[]>;
        getStats: () => Promise<LearningStats | null>;
        exportForSync: (since?: string) => Promise<{ mistakes: unknown[]; knowledge: unknown[] }>;
        syncFromNova: (mistakes: unknown[], knowledge: unknown[]) => Promise<{ mistakesAdded: number; knowledgeAdded: number }>;
    };
}

// Helper to get typed electron API with Nova extensions
function getNovaElectron(): NovaElectronAPI | undefined {
    return (window as unknown as { electron?: NovaElectronAPI }).electron;
}
