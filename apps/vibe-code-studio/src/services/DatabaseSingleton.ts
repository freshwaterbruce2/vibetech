import { DatabaseService, databaseService } from './DatabaseService';
import { logger } from './Logger';

let dbService: DatabaseService | null = null;
export let dbInitError: Error | null = null;

export const getDatabase = async (): Promise<DatabaseService> => {
    if (!dbService) {
        // Use the wrapped singleton from DatabaseService (includes IPC sync)
        dbService = databaseService as any;
        try {
            await dbService.initialize();
            logger.info('[App] Database initialized successfully with IPC sync enabled');
        } catch (error) {
            dbInitError = error as Error;
            logger.warn('[App] Database initialization failed, using localStorage fallback:', error);
            // Service will automatically use localStorage fallback
        }

        // Expose to window for debugging (development only)
        if (process.env.NODE_ENV === 'development') {
            (window as any).__deepcodeDB = dbService;
            (window as any).__deepcodeDBStatus = () => dbService?.getStatus();
            logger.debug('[App] Database service with IPC sync exposed to window.__deepcodeDB for debugging');
        }
    }
    return dbService;
};
