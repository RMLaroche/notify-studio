export interface Client {
  id: number;
  name: string;
  connectionType: 'websocket' | 'rest' | 'both';
  createdAt: string;
  lastSeen?: string;
  messageCount: number;
  status: 'online' | 'offline';
}

export interface OutputModule {
  id: number;
  name: string;
  type: 'discord' | 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface Message {
  clientId: number;
  clientName: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  streamType: 'logs' | 'alerts';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PlatformStats {
  totalClients: number;
  activeClients: number;
  messagesLastHour: number;
  activeModules: number;
}