import io from 'socket.io-client';
import { Message } from '../types';

class WebSocketService {
  private socket: any | null = null;
  private connected = false;

  connect(serverUrl: string = 'http://localhost:3001') {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to platform via WebSocket');
      this.connected = true;
      // Identify as dashboard
      this.socket?.emit('dashboard-connect');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from platform');
      this.connected = false;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  // Event listeners
  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('new-message', callback);
  }

  onClientStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('client-status-update', callback);
  }

  onMetricsUpdate(callback: (data: any) => void) {
    this.socket?.on('metrics-update', callback);
  }

  onRoutingUpdate(callback: (data: any) => void) {
    this.socket?.on('routing-update', callback);
  }

  // Remove listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const wsService = new WebSocketService();