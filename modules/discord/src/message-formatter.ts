import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { DiscordConfig } from './config/discord-config';

export interface NotificationMessage {
  message: string;
  level: 'info' | 'success' | 'warn' | 'warning' | 'error' | 'debug';
  type: 'alerts' | 'logs';
  clientName?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export class MessageFormatter {
  constructor(private config: DiscordConfig) {}

  public formatAsEmbed(notification: NotificationMessage): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(this.getTitle(notification))
      .setDescription(notification.message)
      .setColor(this.getColor(notification.level))
      .setTimestamp(notification.timestamp ? new Date(notification.timestamp) : new Date());

    // Add author if configured
    if (this.config.embed.author.name) {
      embed.setAuthor({
        name: this.config.embed.author.name,
        iconURL: this.config.embed.author.iconUrl
      });
    }

    // Add footer if configured
    if (this.config.embed.footer.text) {
      embed.setFooter({
        text: this.config.embed.footer.text,
        iconURL: this.config.embed.footer.iconUrl
      });
    }

    // Add fields for additional information
    if (notification.clientName) {
      embed.addFields({
        name: 'Client',
        value: notification.clientName,
        inline: true
      });
    }

    embed.addFields({
      name: 'Level',
      value: notification.level.toUpperCase(),
      inline: true
    });

    embed.addFields({
      name: 'Type',
      value: notification.type.toUpperCase(),
      inline: true
    });

    // Add metadata as fields if present
    if (notification.metadata && Object.keys(notification.metadata).length > 0) {
      const metadataStr = this.formatMetadata(notification.metadata);
      if (metadataStr.length <= 1024) { // Discord field value limit
        embed.addFields({
          name: 'Metadata',
          value: metadataStr,
          inline: false
        });
      }
    }

    return embed;
  }

  public formatAsPlainText(notification: NotificationMessage): string {
    const emoji = this.getLevelEmoji(notification.level);
    const timestamp = notification.timestamp 
      ? new Date(notification.timestamp).toLocaleString()
      : new Date().toLocaleString();
    
    let message = `${emoji} **[${notification.level.toUpperCase()}]** ${notification.message}`;
    
    if (notification.clientName) {
      message += `\n📍 **Client:** ${notification.clientName}`;
    }
    
    message += `\n🕒 **Time:** ${timestamp}`;
    message += `\n📂 **Type:** ${notification.type.toUpperCase()}`;

    if (notification.metadata && Object.keys(notification.metadata).length > 0) {
      const metadataStr = this.formatMetadata(notification.metadata);
      if (metadataStr.length <= 1800) { // Leave room for the rest of the message
        message += `\n📋 **Metadata:**\n${metadataStr}`;
      }
    }

    return message;
  }

  private getTitle(notification: NotificationMessage): string {
    const typeTitle = notification.type === 'alerts' ? 'Alert' : 'Log';
    const levelTitle = notification.level.charAt(0).toUpperCase() + notification.level.slice(1);
    return `${typeTitle} - ${levelTitle}`;
  }

  private getColor(level: string): ColorResolvable {
    const colors = this.config.embed.colors;
    switch (level) {
      case 'info': return colors.info;
      case 'success': return colors.success;
      case 'warn':
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'debug': return colors.default;
      default: return colors.default;
    }
  }

  private getLevelEmoji(level: string): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warn':
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      default: return '📝';
    }
  }

  private formatMetadata(metadata: Record<string, any>): string {
    return Object.entries(metadata)
      .map(([key, value]) => `**${key}:** ${this.formatValue(value)}`)
      .join('\n');
  }

  private formatValue(value: any): string {
    if (typeof value === 'object' && value !== null) {
      return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
    }
    return String(value);
  }
}