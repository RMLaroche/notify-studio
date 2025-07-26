import dotenv from 'dotenv';
import { io, Socket } from 'socket.io-client';
import { DiscordClient } from './discord-client';
import { DiscordConfig, DiscordConfigSchema, createDefaultConfig } from './config/discord-config';
import { NotificationMessage } from './message-formatter';

// Load environment variables
dotenv.config();

class DiscordModule {
  private discordClient?: DiscordClient;
  private socket?: Socket;
  private config?: DiscordConfig;
  private isRunning = false;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Debug: Log what environment variables are actually loaded
      console.log('🔍 Debug - Environment variables:');
      console.log('DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? '***set***' : 'NOT SET');
      console.log('DISCORD_DEFAULT_CHANNEL:', process.env.DISCORD_DEFAULT_CHANNEL || 'NOT SET');
      console.log('DISCORD_ALERTS_CHANNEL:', process.env.DISCORD_ALERTS_CHANNEL || 'NOT SET');
      console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
      
      // Try to load from environment variables
      const defaultConfig = createDefaultConfig();
      const envConfig = {
        ...defaultConfig,
        botToken: process.env.DISCORD_BOT_TOKEN || '',
        guildId: process.env.DISCORD_GUILD_ID,
        channels: {
          ...defaultConfig.channels,
          // Override defaults with environment values (only if set)
          ...(process.env.DISCORD_ALERTS_CHANNEL && { alerts: process.env.DISCORD_ALERTS_CHANNEL }),
          ...(process.env.DISCORD_LOGS_CHANNEL && { logs: process.env.DISCORD_LOGS_CHANNEL }),
          ...(process.env.DISCORD_ERRORS_CHANNEL && { errors: process.env.DISCORD_ERRORS_CHANNEL }),
          ...(process.env.DISCORD_DEFAULT_CHANNEL && { default: process.env.DISCORD_DEFAULT_CHANNEL })
        }
      };

      console.log('🔍 Debug - Parsed config:', {
        hasToken: !!envConfig.botToken,
        defaultChannel: envConfig.channels.default
      });

      this.config = DiscordConfigSchema.parse(envConfig);
      console.log('✅ Discord configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Discord configuration:', error);
      console.log('Please check your environment variables:');
      console.log('- DISCORD_BOT_TOKEN (required)');
      console.log('- DISCORD_DEFAULT_CHANNEL (required)');
      console.log('- DISCORD_ALERTS_CHANNEL (optional)');
      console.log('- DISCORD_LOGS_CHANNEL (optional)');
      console.log('- DISCORD_ERRORS_CHANNEL (optional)');
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Discord module is already running');
      return;
    }

    try {
      await this.initializeDiscordClient();
      await this.connectToPlatform();
      this.isRunning = true;
      console.log('🚀 Discord module started successfully');
    } catch (error) {
      console.error('❌ Failed to start Discord module:', error);
      throw error;
    }
  }

  private async initializeDiscordClient(): Promise<void> {
    if (!this.config) {
      throw new Error('Discord configuration not loaded');
    }

    this.discordClient = new DiscordClient(this.config);
    await this.discordClient.connect();
  }

  private async connectToPlatform(): Promise<void> {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3001';
    const moduleToken = process.env.MODULE_TOKEN || 'discord-module-token';

    console.log(`🔌 Connecting to platform at ${platformUrl}`);

    this.socket = io(platformUrl, {
      auth: {
        token: moduleToken,
        type: 'module',
        name: 'discord'
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Notify-Studio platform');
      
      // Send module authentication
      this.socket?.emit('module-connect', {
        token: moduleToken,
        type: 'discord',
        name: 'Discord Module'
      });
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Module authenticated:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️ Disconnected from platform');
    });

    this.socket.on('notification', async (data: NotificationMessage) => {
      console.log('📨 Received notification:', data);
      await this.handleNotification(data);
    });

    this.socket.on('test', async () => {
      console.log('🧪 Received test request');
      await this.handleTestNotification();
    });

    this.socket.on('status', () => {
      const status = this.getModuleStatus();
      this.socket?.emit('status-response', status);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  private async handleNotification(notification: NotificationMessage): Promise<void> {
    if (!this.discordClient) {
      console.error('❌ Discord client not initialized');
      return;
    }

    try {
      await this.discordClient.sendNotification(notification);
    } catch (error) {
      console.error('❌ Failed to handle notification:', error);
    }
  }

  private async handleTestNotification(): Promise<void> {
    const testNotification: NotificationMessage = {
      message: 'This is a test notification from Notify-Studio Discord module! 🎉',
      level: 'info',
      type: 'alerts',
      clientName: 'Discord Module Test',
      timestamp: new Date().toISOString(),
      metadata: {
        test: true,
        module: 'discord',
        version: '1.0.0'
      }
    };

    await this.handleNotification(testNotification);
  }

  private getModuleStatus() {
    const discordStatus = this.discordClient?.getStatus() || { connected: false, guilds: 0 };
    
    return {
      name: 'discord',
      type: 'output',
      status: this.isRunning && discordStatus.connected ? 'online' : 'offline',
      config: {
        hasToken: !!this.config?.botToken,
        channels: this.config?.channels,
        rateLimiting: this.config?.rateLimiting
      },
      discord: discordStatus,
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }

  public async stop(): Promise<void> {
    console.log('🛑 Stopping Discord module...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.discordClient) {
      await this.discordClient.disconnect();
    }
    
    this.isRunning = false;
    console.log('✅ Discord module stopped');
  }
}

// Handle process signals for graceful shutdown
const discordModule = new DiscordModule();

process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down gracefully');
  await discordModule.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down gracefully');
  await discordModule.stop();
  process.exit(0);
});

// Start the module
discordModule.start().catch((error) => {
  console.error('💥 Failed to start Discord module:', error);
  process.exit(1);
});