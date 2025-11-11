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
            expect(validated.type).toBe(IPCMessageType.FILE_OPEN);
            expect(validated.payload.filePath).toBe('C:\\dev\\test.ts');
        });

    it('should reject empty file path', () => {
      const invalidMessage = {
        messageId: 'nova-test-invalid',
        type: IPCMessageType.FILE_OPEN,
        timestamp: Date.now(),
        source: 'nova',
        version: '1.0.0',
        payload: {
          filePath: '',
        },
      };

      expect(() => validateIPCMessage(invalidMessage)).toThrow('File path cannot be empty');
    });

    it('should reject missing file path', () => {
      const invalidMessage = {
        messageId: 'nova-test-missing',
        type: IPCMessageType.FILE_OPEN,
        timestamp: Date.now(),
        source: 'nova',
        version: '1.0.0',
        payload: {},
      };

      expect(() => validateIPCMessage(invalidMessage)).toThrow();
    });
    });

    describe('GitStatusUpdateMessage', () => {
        it('should validate git status update', () => {
            const message = createGitStatusUpdateMessage('vibe', {
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

    describe('Source validation', () => {
        it('should only accept nova or vibe as source', () => {
            const invalidMessage = {
                messageId: 'invalid-source',
                type: IPCMessageType.FILE_OPEN,
                timestamp: Date.now(),
                source: 'invalid',
                version: '1.0.0',
                payload: {
                    filePath: 'test.ts',
                },
            };

            expect(() => validateIPCMessage(invalidMessage)).toThrow();
        });
    });
});
