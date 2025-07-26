import { OfflineQueue } from '../src/queue/offline-queue';
import fs from 'fs-extra';
import path from 'path';

describe('OfflineQueue', () => {
  const testQueueDir = path.join(__dirname, 'test-queue');
  let queue: OfflineQueue;

  beforeEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testQueueDir)) {
      await fs.remove(testQueueDir);
    }
    
    queue = new OfflineQueue(testQueueDir, 5); // Small queue for testing
  });

  afterEach(async () => {
    if (await fs.pathExists(testQueueDir)) {
      await fs.remove(testQueueDir);
    }
  });

  describe('enqueue', () => {
    it('should add message to queue', async () => {
      await queue.enqueue('Test message', 'info', 'alerts');
      
      const messages = await queue.peek();
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Test message');
      expect(messages[0].level).toBe('info');
      expect(messages[0].type).toBe('alerts');
    });

    it('should respect maximum queue size', async () => {
      // Fill queue to max
      for (let i = 0; i < 5; i++) {
        await queue.enqueue(`Message ${i}`, 'info', 'alerts');
      }

      // Add one more - should remove oldest
      await queue.enqueue('Overflow message', 'info', 'alerts');

      const messages = await queue.peek();
      expect(messages).toHaveLength(5);
      expect(messages[messages.length - 1].message).toBe('Overflow message');
    });

    it('should persist messages to disk', async () => {
      await queue.enqueue('Persistent message', 'error', 'alerts');

      // Check file exists
      const queueFile = path.join(testQueueDir, 'messages.json');
      expect(await fs.pathExists(queueFile)).toBe(true);
    });
  });

  describe('dequeue', () => {
    it('should return and process messages', async () => {
      await queue.enqueue('First message', 'info', 'alerts');
      await queue.enqueue('Second message', 'error', 'alerts');

      const dequeued = await queue.dequeue(2);
      expect(dequeued).toHaveLength(2);
      expect(dequeued[0].message).toBe('First message');
      expect(dequeued[1].message).toBe('Second message');
      
      // Messages should be removed after dequeue
      const remaining = await queue.peek();
      expect(remaining).toHaveLength(0);
    });

    it('should return empty array when queue is empty', async () => {
      const dequeued = await queue.dequeue();
      expect(dequeued).toEqual([]);
    });

    it('should limit dequeue count', async () => {
      // Add more messages than default dequeue count
      for (let i = 0; i < 5; i++) {
        await queue.enqueue(`Message ${i}`, 'info', 'alerts');
      }

      const dequeued = await queue.dequeue(3);
      expect(dequeued).toHaveLength(3);
      
      const remaining = await queue.peek();
      expect(remaining).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should remove all messages', async () => {
      // Add multiple messages
      for (let i = 0; i < 3; i++) {
        await queue.enqueue(`Message ${i}`, 'info', 'alerts');
      }

      let messages = await queue.peek();
      expect(messages).toHaveLength(3);

      await queue.clear();

      messages = await queue.peek();
      expect(messages).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('should persist messages across instances', async () => {
      // Create queue and add messages
      await queue.enqueue('Persistent 1', 'info', 'alerts');
      await queue.enqueue('Persistent 2', 'error', 'alerts');
      
      let messages = await queue.peek();
      expect(messages).toHaveLength(2);

      // Create new queue instance with same directory
      const newQueue = new OfflineQueue(testQueueDir, 10);
      const loadedMessages = await newQueue.peek();
      
      expect(loadedMessages).toHaveLength(2);
      expect(loadedMessages[0].message).toBe('Persistent 1');
      expect(loadedMessages[1].message).toBe('Persistent 2');
    });
  });

  describe('queue size management', () => {
    it('should enforce maximum queue size', async () => {
      // Fill beyond max size
      for (let i = 0; i < 8; i++) {
        await queue.enqueue(`Message ${i}`, 'info', 'alerts');
      }

      const messages = await queue.peek();
      expect(messages).toHaveLength(5); // Should be limited to maxSize
      
      // Should have newest messages
      expect(messages[messages.length - 1].message).toBe('Message 7');
    });
  });
});