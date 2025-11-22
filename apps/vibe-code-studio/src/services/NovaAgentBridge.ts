/**
 * NOVA Agent Bridge Service
 *
 * Handles communication with NOVA Agent via IPC Bridge (WebSocket on port 5004)
 * Uses the shared WebSocketBridge from @vibetech/shared
 * Integrates with shared learning databases on D:\databases\
 */

import type { ActivitySyncPayload, ContextUpdatePayload, FileOpenPayload, IPCMessage, LearningUpdatePayload } from '@vibetech/shared';
import { WebSocketBridge } from '@vibetech/shared';
import { DatabaseService } from './DatabaseService';
import { logger } from './Logger';

export class NovaAgentBridge {
    private bridge: WebSocketBridge;
    private connected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private databaseService: DatabaseService | null = null;

    constructor(databaseService?: DatabaseService) {
        this.bridge = new WebSocketBridge('vibe', {
            port: 5004,
            host: 'localhost',
            reconnectInterval: 5000,
            maxReconnectAttempts: this.maxReconnectAttempts,
        });

        this.databaseService = databaseService || null;
        this.setupHandlers();
    }

    /**
     * Initialize and connect to IPC Bridge
     */
    async initialize(): Promise<void> {
        try {
            await this.bridge.connect();
            this.connected = true;
            this.reconnectAttempts = 0;
            logger.info('[NovaAgentBridge] Connected to IPC Bridge');

            // Send initial context update
            this.sendContextUpdate();
        } catch (error) {
            logger.error('[NovaAgentBridge] Failed to connect:', error);
            this.connected = false;
            throw error;
        }
    }

    /**
     * Setup message handlers
     */
    private setupHandlers(): void {
        // Handle file open requests from NOVA
        this.bridge.on('file_open', async (message: IPCMessage<FileOpenPayload>) => {
            logger.info('[NovaAgentBridge] Received file_open request:', message.payload);

            // Emit event that App.tsx can listen to
            window.dispatchEvent(new CustomEvent('nova-file-open', {
                detail: message.payload
            }));
        });

        // Handle context updates from NOVA
        this.bridge.on('context_update', async (message: IPCMessage<ContextUpdatePayload>) => {
            logger.debug('[NovaAgentBridge] Received context update from NOVA');
            // Could update internal state if needed
        });

        // Handle activity sync requests
        this.bridge.on('activity_sync', async (message: IPCMessage<ActivitySyncPayload>) => {
            logger.debug('[NovaAgentBridge] Received activity sync request');
            // Send our activity data back
            this.sendActivitySync();
        });

        // Handle learning updates from NOVA - sync to our database
        this.bridge.on('learning_update', async (message: IPCMessage<LearningUpdatePayload>) => {
            logger.info('[NovaAgentBridge] Received learning update from NOVA');

            if (!this.databaseService) {
                logger.warn('[NovaAgentBridge] Database service not available, cannot sync learning data');
                return;
            }

            try {
                const { mistakes, knowledge, patterns } = message.payload;

                // Sync mistakes from NOVA to shared learning database (D:\databases\agent_learning.db)
                // TODO: Implement direct connection to shared learning database
                // For now, log that we received the data
                if (mistakes && mistakes.length > 0) {
                    logger.info(`[NovaAgentBridge] Received ${mistakes.length} mistakes from NOVA (stored in shared DB: D:\\databases\\agent_learning.db)`);
                    // Note: Mistakes are already in the shared database (NOVA writes directly)
                    // We just need to refresh our view/UI if needed
                }

                // Sync knowledge from NOVA to shared learning database
                if (knowledge && knowledge.length > 0) {
                    logger.info(`[NovaAgentBridge] Received ${knowledge.length} knowledge entries from NOVA (stored in shared DB: D:\\databases\\agent_learning.db)`);
                    // Note: Knowledge is already in the shared database (NOVA writes directly)
                    // We just need to refresh our view/UI if needed
                }

                // Sync patterns from NOVA
                if (patterns && patterns.length > 0) {
                    logger.debug(`[NovaAgentBridge] Syncing ${patterns.length} patterns from NOVA`);
                    for (const pattern of patterns) {
                        try {
                            await this.databaseService.savePattern(pattern);
                        } catch (error) {
                            logger.error('[NovaAgentBridge] Failed to sync pattern:', error);
                        }
                    }
                }

                logger.info('[NovaAgentBridge] Learning data synced successfully from NOVA');
            } catch (error) {
                logger.error('[NovaAgentBridge] Error syncing learning data:', error);
            }
        });

        // Global handler for debugging
        this.bridge.onAny((message: IPCMessage) => {
            logger.debug(`[NovaAgentBridge] Received ${message.type} from NOVA`);
        });
    }

    /**
     * Send file open notification to NOVA
     */
    sendFileOpen(filePath: string, lineNumber?: number, projectPath?: string): void {
        if (!this.isConnected()) {
            logger.warn('[NovaAgentBridge] Not connected, cannot send file_open');
            return;
        }

        const message = {
            type: 'file_open' as const,
            payload: {
                filePath,
                lineNumber,
                projectPath,
            },
            timestamp: Date.now(),
            source: 'vibe' as const,
            messageId: `vibe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        this.bridge.send(message);
        logger.debug('[NovaAgentBridge] Sent file_open to NOVA:', filePath);
    }

    /**
     * Send context update to NOVA
     */
    sendContextUpdate(context?: {
        currentFile?: string;
        workspaceRoot?: string;
        projectType?: string;
        gitBranch?: string;
        recentFiles?: string[];
    }): void {
        if (!this.isConnected()) {
            return;
        }

        const message = {
            type: 'context_update' as const,
            payload: context || {},
            timestamp: Date.now(),
            source: 'vibe' as const,
            messageId: `vibe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        this.bridge.send(message);
    }

    /**
     * Send activity sync to NOVA
     */
    sendActivitySync(events?: Array<{ type: string; timestamp: number; data?: any }>): void {
        if (!this.isConnected()) {
            return;
        }

        const message = {
            type: 'activity_sync' as const,
            payload: {
                events: events || [],
            },
            timestamp: Date.now(),
            source: 'vibe' as const,
            messageId: `vibe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        this.bridge.send(message);
    }

    /**
     * Send learning update to NOVA
     * Fetches recent learning data from database and sends to NOVA
     */
    async sendLearningUpdate(update?: { mistakes?: any[]; knowledge?: any[]; patterns?: any[] }): Promise<void> {
        if (!this.isConnected()) {
            return;
        }

        let payload: LearningUpdatePayload;

        if (update) {
            // Use provided update
            payload = update;
        } else if (this.databaseService) {
            // Fetch recent patterns from our database
            // Note: Mistakes and knowledge are in shared DB (D:\databases\agent_learning.db)
            // NOVA reads directly from there, so we only send patterns
            try {
                const recentPatterns = await this.databaseService.queryPatterns(10);

                payload = {
                    mistakes: [], // Stored in shared DB, NOVA reads directly
                    knowledge: [], // Stored in shared DB, NOVA reads directly
                    patterns: recentPatterns,
                };
            } catch (error) {
                logger.error('[NovaAgentBridge] Failed to fetch learning data:', error);
                return;
            }
        } else {
            logger.warn('[NovaAgentBridge] No update provided and database service not available');
            return;
        }

        const message = {
            type: 'learning_update' as const,
            payload,
            timestamp: Date.now(),
            source: 'vibe' as const,
            messageId: `vibe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        this.bridge.send(message);
        logger.debug('[NovaAgentBridge] Sent learning update to NOVA');
    }

    /**
     * Sync learning data bidirectionally with NOVA
     * Called periodically or when significant learning events occur
     */
    async syncLearningData(): Promise<void> {
        if (!this.isConnected()) {
            logger.warn('[NovaAgentBridge] Not connected, cannot sync learning data');
            return;
        }

        logger.info('[NovaAgentBridge] Initiating bidirectional learning data sync');

        // Send our learning data to NOVA
        await this.sendLearningUpdate();

        // NOVA will respond with its learning data via learning_update message
        // which is handled by the handler above
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connected && this.bridge.isConnected();
    }

    /**
     * Disconnect from IPC Bridge
     */
    disconnect(): void {
        this.bridge.disconnect();
        this.connected = false;
        logger.info('[NovaAgentBridge] Disconnected from IPC Bridge');
    }
}

// Singleton instance
let bridgeInstance: NovaAgentBridge | null = null;

export function getNovaAgentBridge(databaseService?: DatabaseService): NovaAgentBridge {
    if (!bridgeInstance) {
        bridgeInstance = new NovaAgentBridge(databaseService);
    } else if (databaseService && !bridgeInstance.databaseService) {
        // Update database service if provided and not already set
        (bridgeInstance as any).databaseService = databaseService;
    }
    return bridgeInstance;
}
