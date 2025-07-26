import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import { DiscordConfig } from './config/discord-config';
import { MessageFormatter, NotificationMessage } from './message-formatter';

export class DiscordClient {
  private client: Client;
  private formatter: MessageFormatter;
  private isReady = false;
  private messageQueue: NotificationMessage[] = [];
  private rateLimitTracker = new Map<string, number[]>();

  constructor(private config: DiscordConfig) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ]
    });

    this.formatter = new MessageFormatter(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      console.log(`✅ Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
      this.processMessageQueue();
    });

    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      console.log('⚠️ Discord bot disconnected');
      this.isReady = false;
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.login(this.config.botToken);
    } catch (error) {
      console.error('❌ Failed to connect to Discord:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
    }
  }

  public async sendNotification(notification: NotificationMessage): Promise<void> {
    if (!this.isReady) {
      console.log('📦 Queueing message (Discord bot not ready)');
      this.messageQueue.push(notification);
      return;
    }

    try {
      const channelId = this.getChannelId(notification);
      const channel = await this.getChannel(channelId);
      
      if (!channel) {
        console.error(`❌ Channel not found: ${channelId}`);
        return;
      }

      // Check rate limiting
      if (this.isRateLimited(channelId)) {
        console.log(`⏳ Rate limited for channel ${channelId}, queueing message`);
        this.messageQueue.push(notification);
        return;
      }

      await this.sendToChannel(channel, notification);
      this.trackMessage(channelId);

    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error);
      // Queue the message for retry
      this.messageQueue.push(notification);
    }
  }

  private async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.isReady) {
      const notification = this.messageQueue.shift();
      if (notification) {
        await this.sendNotification(notification);
        // Small delay to avoid overwhelming Discord
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private getChannelId(notification: NotificationMessage): string {
    const channels = this.config.channels;
    
    // Route by message level first
    if (notification.level === 'error' && channels.errors) {
      return channels.errors;
    }
    
    // Then by message type
    if (notification.type === 'alerts' && channels.alerts) {
      return channels.alerts;
    }
    
    if (notification.type === 'logs' && channels.logs) {
      return channels.logs;
    }
    
    // Fallback to default
    return channels.default;
  }

  private async getChannel(channelId: string): Promise<TextChannel | null> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      return channel?.isTextBased() ? channel as TextChannel : null;
    } catch (error) {
      console.error(`❌ Failed to fetch channel ${channelId}:`, error);
      return null;
    }
  }

  private async sendToChannel(channel: TextChannel, notification: NotificationMessage): Promise<void> {
    const embed = this.formatter.formatAsEmbed(notification);
    
    try {
      await channel.send({ embeds: [embed] });
      console.log(`✅ Sent Discord notification to #${channel.name}`);
    } catch (error) {
      console.error('❌ Failed to send embed, trying plain text:', error);
      // Fallback to plain text if embed fails
      const plainText = this.formatter.formatAsPlainText(notification);
      await channel.send(plainText);
      console.log(`✅ Sent Discord notification (plain text) to #${channel.name}`);
    }
  }

  private isRateLimited(channelId: string): boolean {
    if (!this.config.rateLimiting.enabled) {
      return false;
    }

    const now = Date.now();
    const windowStart = now - this.config.rateLimiting.windowMs;
    const messages = this.rateLimitTracker.get(channelId) || [];
    
    // Remove old messages outside the window
    const recentMessages = messages.filter(timestamp => timestamp > windowStart);
    this.rateLimitTracker.set(channelId, recentMessages);
    
    return recentMessages.length >= this.config.rateLimiting.maxMessages;
  }

  private trackMessage(channelId: string): void {
    if (!this.config.rateLimiting.enabled) {
      return;
    }

    const now = Date.now();
    const messages = this.rateLimitTracker.get(channelId) || [];
    messages.push(now);
    this.rateLimitTracker.set(channelId, messages);
  }

  public getStatus(): { connected: boolean; user?: string; guilds: number } {
    return {
      connected: this.isReady,
      user: this.client.user?.tag,
      guilds: this.client.guilds.cache.size
    };
  }

  public async testConnection(): Promise<boolean> {
    try {
      // Try to fetch bot user info
      if (this.client.user) {
        await this.client.user.fetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Discord connection test failed:', error);
      return false;
    }
  }
}