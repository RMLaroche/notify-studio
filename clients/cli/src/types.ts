export interface CLIOptions {
  server: string;
  token: string;
  message?: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  type?: 'logs' | 'alerts';
  stream?: boolean;
  offline?: boolean;
  queueSize?: number;
  exec?: string;
  watch?: string;
}

export interface QueuedMessage {
  id: string;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  type?: 'logs' | 'alerts';
  metadata?: Record<string, any>;
  timestamp: string;
  retryCount: number;
}

export interface ClientConfig {
  server?: string;
  token?: string;
  defaultLevel?: 'info' | 'warn' | 'error' | 'debug';
  defaultType?: 'logs' | 'alerts';
  queueSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
}