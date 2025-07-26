import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { QueuedMessage } from '../types';

export class OfflineQueue {
  private queueDir: string;
  private maxSize: number;

  constructor(queueDir: string = './.notify-queue', maxSize: number = 1000) {
    this.queueDir = queueDir;
    this.maxSize = maxSize;
    this.ensureQueueDir();
  }

  private async ensureQueueDir(): Promise<void> {
    await fs.ensureDir(this.queueDir);
  }

  private getQueueFilePath(): string {
    return path.join(this.queueDir, 'messages.json');
  }

  async enqueue(message: string, level?: string, type?: string, metadata?: Record<string, any>): Promise<void> {
    await this.ensureQueueDir();
    
    const queuedMessage: QueuedMessage = {
      id: uuidv4(),
      message,
      level: level as any,
      type: type as any,
      metadata,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    const messages = await this.getMessages();
    
    // Enforce queue size limit
    if (messages.length >= this.maxSize) {
      messages.shift(); // Remove oldest message
    }
    
    messages.push(queuedMessage);
    await this.saveMessages(messages);
    
    console.log(`📦 Message queued offline (${messages.length}/${this.maxSize})`);
  }

  async dequeue(count: number = 10): Promise<QueuedMessage[]> {
    const messages = await this.getMessages();
    const toProcess = messages.slice(0, count);
    
    if (toProcess.length > 0) {
      const remaining = messages.slice(count);
      await this.saveMessages(remaining);
    }
    
    return toProcess;
  }

  async peek(): Promise<QueuedMessage[]> {
    return await this.getMessages();
  }

  async size(): Promise<number> {
    const messages = await this.getMessages();
    return messages.length;
  }

  async clear(): Promise<void> {
    await this.saveMessages([]);
  }

  async markFailed(messageId: string): Promise<void> {
    const messages = await this.getMessages();
    const message = messages.find(m => m.id === messageId);
    
    if (message) {
      message.retryCount++;
      
      // If retry count exceeds limit, move to end of queue
      if (message.retryCount >= 3) {
        const index = messages.indexOf(message);
        messages.splice(index, 1);
        messages.push(message);
      }
      
      await this.saveMessages(messages);
    }
  }

  private async getMessages(): Promise<QueuedMessage[]> {
    const filePath = this.getQueueFilePath();
    
    try {
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.warn('Failed to read queue file:', error);
    }
    
    return [];
  }

  private async saveMessages(messages: QueuedMessage[]): Promise<void> {
    const filePath = this.getQueueFilePath();
    
    try {
      await fs.writeJson(filePath, messages, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save queue file:', error);
    }
  }
}