// Test file for validating git hooks
import { logger } from './services/Logger';
export function testFunction(a: number, b: number): number {
  return a + b;
}

const result = testFunction(5, 10);
logger.debug(`Result: ${result}`);