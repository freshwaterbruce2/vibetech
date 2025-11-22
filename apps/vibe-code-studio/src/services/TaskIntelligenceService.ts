/**
 * Task Intelligence Service for Vibe Code Studio
 *
 * Connects to Task Intelligence API (port 5001)
 * Integrates task tracking with the code editor
 * Syncs with NOVA Agent via IPC Bridge
 */

import { logger } from './Logger';

export interface Task {
    task_id: string;
    task_type: 'ml' | 'web' | 'trading' | 'generic';
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
    app_source: 'nova' | 'vibe';
    context_data?: string;
    mistake_count?: number;
    knowledge_count?: number;
    [key: string]: any;
}

export interface TaskPrediction {
    predicted_hours: number;
    confidence: number;
    based_on: string;
    message: string;
}

export interface TaskInsights {
    task_id: string;
    task_type: string;
    completion_prediction: TaskPrediction;
    related_mistakes: any[];
    related_knowledge: any[];
    similar_tasks: any[];
    recommendations: string[];
}

export class TaskIntelligenceService {
    private apiUrl = 'http://127.0.0.1:5001';
    private currentTask: Task | null = null;
    private pollingInterval: NodeJS.Timeout | null = null;

    constructor() {
        logger.info('TaskIntelligenceService initialized');
    }

    /**
     * Check if API is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                return data.status === 'healthy';
            }
            return false;
        } catch (error) {
            logger.error('Task Intelligence API not available:', error);
            return false;
        }
    }

    /**
     * Get all active tasks
     */
    async getActiveTasks(appSource?: 'nova' | 'vibe'): Promise<Task[]> {
        try {
            const url = new URL(`${this.apiUrl}/api/tasks/active`);
            if (appSource) {
                url.searchParams.append('app_source', appSource);
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.tasks || [];
        } catch (error) {
            logger.error('Error getting active tasks:', error);
            return [];
        }
    }

    /**
     * Get insights for a task
     */
    async getTaskInsights(taskId: string, taskType: string): Promise<TaskInsights | null> {
        try {
            const url = new URL(`${this.apiUrl}/api/tasks/${taskId}/insights`);
            url.searchParams.append('task_type', taskType);

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            logger.error('Error getting task insights:', error);
            return null;
        }
    }

    /**
     * Predict task completion time
     */
    async predictCompletion(taskId: string, taskType: string): Promise<TaskPrediction | null> {
        try {
            const url = new URL(`${this.apiUrl}/api/tasks/${taskId}/predict-completion`);
            url.searchParams.append('task_type', taskType);

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            logger.error('Error predicting completion:', error);
            return null;
        }
    }

    /**
     * Start working on a task
     */
    async startTask(taskId: string, taskType: string, contextData?: any): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/api/tasks/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    task_type: taskType,
                    app_source: 'vibe',
                    context_data: JSON.stringify(contextData || {})
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                this.currentTask = {
                    task_id: taskId,
                    task_type: taskType as any,
                    status: 'in_progress',
                    app_source: 'vibe',
                    context_data: JSON.stringify(contextData)
                };
                logger.info(`Started task: ${taskId}`);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error starting task:', error);
            return false;
        }
    }

    /**
     * Stop working on a task
     */
    async stopTask(taskId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/api/tasks/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    app_source: 'vibe'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                if (this.currentTask?.task_id === taskId) {
                    this.currentTask = null;
                }
                logger.info(`Stopped task: ${taskId}`);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error stopping task:', error);
            return false;
        }
    }

    /**
     * Get task patterns
     */
    async getPatterns(): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiUrl}/api/patterns`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.patterns || [];
        } catch (error) {
            logger.error('Error getting patterns:', error);
            return [];
        }
    }

    /**
     * Get task templates
     */
    async getTemplates(): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiUrl}/api/tasks/templates`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.templates || [];
        } catch (error) {
            logger.error('Error getting templates:', error);
            return [];
        }
    }

    /**
     * Get current active task
     */
    getCurrentTask(): Task | null {
        return this.currentTask;
    }

    /**
     * Start polling for task updates
     */
    startPolling(intervalMs: number = 30000) {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(async () => {
            if (this.currentTask) {
                // Refresh current task insights
                const insights = await this.getTaskInsights(
                    this.currentTask.task_id,
                    this.currentTask.task_type
                );

                if (insights) {
                    logger.debug('Task insights refreshed');
                }
            }
        }, intervalMs);

        logger.info(`Task polling started (interval: ${intervalMs}ms)`);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            logger.info('Task polling stopped');
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPolling();
        if (this.currentTask) {
            this.stopTask(this.currentTask.task_id);
        }
    }
}

// Singleton instance
export const taskIntelligenceService = new TaskIntelligenceService();
