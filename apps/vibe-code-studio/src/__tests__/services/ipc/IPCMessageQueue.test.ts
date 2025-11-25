/**
 * IPCMessageQueue Tests
 *
 * Tests for offline message queueing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IPCMessageQueue } from '../../../services/ipc/IPCMessageQueue';

describe('IPCMessageQueue', () => {
  let queue: IPCMessageQueue;

  beforeEach(() => {
    queue = new IPCMessageQueue(5);
  });

  describe('Enqueue', () => {
    it('should enqueue messages', () => {
      queue.enqueue('message1');
      expect(queue.size()).toBe(1);

      queue.enqueue('message2');
      expect(queue.size()).toBe(2);
    });

    it('should respect max queue size', () => {
      for (let i = 0; i < 7; i++) {
        queue.enqueue(`message${i}`);
      }

      expect(queue.size()).toBe(5);
    });

    it('should drop oldest message when full', () => {
      queue.enqueue('first');
      queue.enqueue('second');
      queue.enqueue('third');
      queue.enqueue('fourth');
      queue.enqueue('fifth');
      queue.enqueue('sixth');

      const messages = queue.flush();
      expect(messages[0].data).toBe('second');
      expect(messages.length).toBe(5);
    });

    it('should check if queue is full', () => {
      expect(queue.isFull()).toBe(false);

      for (let i = 0; i < 5; i++) {
        queue.enqueue(`message${i}`);
      }

      expect(queue.isFull()).toBe(true);
    });
  });

  describe('Flush', () => {
    it('should flush all messages', () => {
      queue.enqueue('message1');
      queue.enqueue('message2');
      queue.enqueue('message3');

      const messages = queue.flush();

      expect(messages.length).toBe(3);
      expect(messages[0].data).toBe('message1');
      expect(messages[1].data).toBe('message2');
      expect(messages[2].data).toBe('message3');
      expect(queue.size()).toBe(0);
    });

    it('should return empty array if queue is empty', () => {
      const messages = queue.flush();
      expect(messages).toEqual([]);
    });

    it('should include timestamps', () => {
      queue.enqueue('test');
      const messages = queue.flush();

      expect(messages[0].timestamp).toBeDefined();
      expect(typeof messages[0].timestamp).toBe('number');
    });

    it('should maintain FIFO order', () => {
      queue.enqueue('first');
      queue.enqueue('second');
      queue.enqueue('third');

      const messages = queue.flush();

      expect(messages[0].data).toBe('first');
      expect(messages[1].data).toBe('second');
      expect(messages[2].data).toBe('third');
    });
  });

  describe('Clear', () => {
    it('should clear all messages', () => {
      queue.enqueue('message1');
      queue.enqueue('message2');

      queue.clear();

      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('isEmpty', () => {
    it('should return true when empty', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false when not empty', () => {
      queue.enqueue('message');
      expect(queue.isEmpty()).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(queue.size()).toBe(0);

      queue.enqueue('message1');
      expect(queue.size()).toBe(1);

      queue.enqueue('message2');
      expect(queue.size()).toBe(2);

      queue.flush();
      expect(queue.size()).toBe(0);
    });
  });
});
