import { describe, it, expect } from 'vitest';
import {
    IPCMessageType,
    openFileMessageSchema,
    gitStatusUpdateMessageSchema,
    learningEventMessageSchema,
    validateIPCMessage,
    isValidIPCMessage,
    createOpenFileMessage,
    createGitStatusUpdateMessage,
    createLearningEventMessage,
} from '../src/index.js';

describe('IPC Message Schemas', () => {
    describe('OpenFileMessage', () => {
        it('should validate a valid open file message', () => {
            const message = createOpenFileMessage('nova', {
                filePath: 'C:\\dev\\test.ts',
                line: 10,
                column: 5,
            });

            expect(isValidIPCMessage(message)).toBe(true);
            const validated = validateIPCMessage(message);
            expect(validated.type).toBe(IPCMessageType.OPEN_FILE);
            expect(validated.payload.filePath).toBe('C:\\dev\\test.ts');
        });

    it('should reject empty file path', () => {
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: IPCMessageType.OPEN_FILE,
        timestamp: Date.now(),
        sender: 'nova',
        version: '1.0.0',
        payload: {
          filePath: '',
        },
      };

      expect(() => validateIPCMessage(invalidMessage)).toThrow('File path cannot be empty');
    });

    it('should reject missing file path', () => {
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: IPCMessageType.OPEN_FILE,
        timestamp: Date.now(),
        sender: 'nova',
        version: '1.0.0',
        payload: {},
      };

      expect(() => validateIPCMessage(invalidMessage)).toThrow();
    });
    });

    describe('GitStatusUpdateMessage', () => {
        it('should validate git status update', () => {
            const message = createGitStatusUpdateMessage('deepcode', {
                branch: 'main',
                modified: ['file1.ts', 'file2.ts'],
                added: ['file3.ts'],
                deleted: [],
                untracked: ['temp.txt'],
            });

            expect(isValidIPCMessage(message)).toBe(true);
            const validated = validateIPCMessage(message);
            expect(validated.payload.branch).toBe('main');
            expect(validated.payload.modified).toHaveLength(2);
        });
    });

    describe('LearningEventMessage', () => {
        it('should validate learning event', () => {
            const message = createLearningEventMessage('nova', {
                eventType: 'mistake',
                data: { error: 'TypeScript error', fix: 'Added type annotation' },
                source: 'nova',
            });

            expect(isValidIPCMessage(message)).toBe(true);
            const validated = validateIPCMessage(message);
            expect(validated.payload.eventType).toBe('mistake');
        });
    });

    describe('Message versioning', () => {
        it('should include version in all messages', () => {
            const message = createOpenFileMessage('nova', {
                filePath: 'test.ts',
            });

            expect(message.version).toBe('1.0.0');
        });
    });

    describe('Sender validation', () => {
        it('should only accept nova or deepcode as sender', () => {
            const invalidMessage = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                type: IPCMessageType.OPEN_FILE,
                timestamp: Date.now(),
                sender: 'invalid',
                version: '1.0.0',
                payload: {
                    filePath: 'test.ts',
                },
            };

            expect(() => validateIPCMessage(invalidMessage)).toThrow();
        });
    });
});
