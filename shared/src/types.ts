export interface Client {
  id: number;
  name: string;
  token: string;
  created_at: string;
  last_seen?: string;
  connection_type: 'websocket' | 'rest' | 'both';
}

export interface OutputModule {
  id: number;
  name: string;
  type: 'discord' | 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface RoutingRule {
  id: number;
  client_id: number;
  output_module_id: number;
  stream_type: 'logs' | 'alerts';
  filters?: Record<string, any>;
  rate_limit?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface MessageHistory {
  id: number;
  client_id: number;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  stream_type?: 'logs' | 'alerts';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DiscordConfig {
  bot_token: string;
  channel_id: string;
  mentions?: string[];
  message_template?: string;
}

export interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  recipients: string[];
  subject_template?: string;
  html_template?: string;
}

export interface SlackConfig {
  webhook_url?: string;
  bot_token?: string;
  channel: string;
  username?: string;
  message_template?: string;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload_template?: string;
  auth?: {
    type: 'bearer' | 'basic' | 'api_key';
    token: string;
    header?: string;
  };
}