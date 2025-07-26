import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import { OfflineQueue } from '../queue/offline-queue';
import { CLIOptions, QueuedMessage } from '../types';

export class NotifyClient {
  private httpClient: AxiosInstance;
  private wsClient?: Socket;
  private queue: OfflineQueue;
  private isOnline: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(private options: CLIOptions) {
    this.httpClient = axios.create({
      baseURL: `http://${options.server}`,
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    this.queue = new OfflineQueue('./.notify-queue', options.queueSize || 1000);
    
    if (options.stream) {
      this.initWebSocket();
    }
  }

  private initWebSocket(): void {
    this.wsClient = io(`http://${this.options.server}`, {
      auth: {
        token: this.options.token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.wsClient.on('connect', () => {
      console.log('🔗 Connected to platform via WebSocket');
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.processQueue();
    });

    this.wsClient.on('disconnect', () => {
      console.log('📡 Disconnected from platform');
      this.isOnline = false;
    });

    this.wsClient.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
    });

    this.wsClient.on('reconnect_failed', () => {
      console.log('❌ Failed to reconnect via WebSocket');
      this.isOnline = false;
    });

    this.wsClient.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
      this.isOnline = false;
    });
  }

  async sendAlert(message: string, level: string = 'info', metadata?: Record<string, any>): Promise<boolean> {
    if (this.isOnline || !this.options.offline) {
      try {
        await this.httpClient.post('/api/alert', {
          message,
          level,
          type: 'alerts',
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            client: 'notify-cli'
          }
        });
        
        console.log(`✅ Alert sent: ${message}`);
        return true;
      } catch (error: any) {
        console.error('❌ Failed to send alert:', error.message);
        
        if (this.options.offline) {
          await this.queue.enqueue(message, level, 'alerts', metadata);
        }
        return false;
      }
    } else {
      await this.queue.enqueue(message, level, 'alerts', metadata);
      return true;
    }
  }

  async streamMessage(message: string, level: string = 'info', metadata?: Record<string, any>): Promise<boolean> {
    if (this.wsClient && this.isOnline) {
      try {
        this.wsClient.emit('stream-message', {
          message,
          level,
          streamType: 'logs',
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            client: 'notify-cli'
          }
        });
        
        return true;
      } catch (error: any) {
        console.error('❌ Failed to stream message:', error.message);
        
        if (this.options.offline) {
          await this.queue.enqueue(message, level, 'logs', metadata);
        }
        return false;
      }
    } else {
      if (this.options.offline) {
        await this.queue.enqueue(message, level, 'logs', metadata);
      } else {
        console.error('❌ Not connected to WebSocket and offline mode disabled');
      }
      return false;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/health');
      this.isOnline = true;
      return true;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queueSize = await this.queue.size();
    if (queueSize === 0) return;

    console.log(`📤 Processing ${queueSize} queued messages...`);
    
    const messages = await this.queue.dequeue(10);
    
    for (const message of messages) {
      try {
        if (message.type === 'alerts') {
          await this.sendAlert(message.message, message.level, message.metadata);
        } else {
          await this.streamMessage(message.message, message.level, message.metadata);
        }
      } catch (error) {
        console.error(`❌ Failed to process queued message ${message.id}:`, error);
        await this.queue.markFailed(message.id);
      }
    }

    // Process more if queue still has messages
    const remainingSize = await this.queue.size();
    if (remainingSize > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async getQueueInfo(): Promise<{ size: number; messages: QueuedMessage[] }> {
    const size = await this.queue.size();
    const messages = await this.queue.peek();
    return { size, messages };
  }

  async clearQueue(): Promise<void> {
    await this.queue.clear();
    console.log('🗑️  Queue cleared');
  }

  disconnect(): void {
    if (this.wsClient) {
      this.wsClient.disconnect();
    }
  }
}