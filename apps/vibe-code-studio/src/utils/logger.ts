/**
 * Logger utility for the application
 */
import { logger as baseLogger } from '../services/Logger';

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

class ConsoleLogger implements Logger {
  info(message: string, ...args: any[]): void {
    baseLogger.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    baseLogger.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    baseLogger.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      baseLogger.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger: Logger = new ConsoleLogger();