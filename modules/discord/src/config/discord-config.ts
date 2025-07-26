import { z } from 'zod';

export const DiscordConfigSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
  guildId: z.string().optional(),
  channels: z.object({
    alerts: z.string().optional(),
    logs: z.string().optional(),
    errors: z.string().optional(),
    default: z.string().min(1, 'Default channel is required')
  }),
  embed: z.object({
    colors: z.object({
      info: z.number().default(0x3498db),     // Blue
      success: z.number().default(0x2ecc71),  // Green
      warning: z.number().default(0xf39c12),  // Orange
      error: z.number().default(0xe74c3c),    // Red
      default: z.number().default(0x95a5a6)   // Gray
    }).default({}),
    author: z.object({
      name: z.string().default('Notify-Studio'),
      iconUrl: z.string().optional()
    }).default({}),
    footer: z.object({
      text: z.string().default('Notify-Studio'),
      iconUrl: z.string().optional()
    }).default({})
  }).default({}),
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    maxMessages: z.number().default(50),
    windowMs: z.number().default(60000) // 1 minute
  }).default({})
});

export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;

export const createDefaultConfig = (): Partial<DiscordConfig> => ({
  channels: {
    default: '' // Will be overridden by environment
  },
  embed: {
    colors: {
      info: 0x3498db,
      success: 0x2ecc71,
      warning: 0xf39c12,
      error: 0xe74c3c,
      default: 0x95a5a6
    },
    author: {
      name: 'Notify-Studio'
    },
    footer: {
      text: 'Notify-Studio'
    }
  },
  rateLimiting: {
    enabled: true,
    maxMessages: 50,
    windowMs: 60000
  }
});