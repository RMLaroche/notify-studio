import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../database/database';
import { WebSocketService } from '../services/websocket';

export function createAlertRoutes(wsService: WebSocketService) {
  const router = Router();

const AlertSchema = z.object({
  message: z.string().min(1).max(10000),
  level: z.enum(['info', 'success', 'warn', 'warning', 'error', 'debug']).optional().default('info'),
  type: z.enum(['logs', 'alerts']).optional().default('alerts'),
  metadata: z.record(z.string(), z.any()).optional()
});

// Send alert message (REST endpoint for CLI)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, level, type, metadata } = AlertSchema.parse(req.body);
    const client = req.client!;
    
    // Store message in history
    await db.run(
      'INSERT INTO message_history (client_id, message, level, stream_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        client.id,
        message,
        level,
        type,
        metadata ? JSON.stringify(metadata) : null,
        new Date().toISOString()
      ]
    );
    
    // Route message to all connected output modules
    const notificationPayload = {
      message,
      level,
      type,
      clientName: client.name,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata })
    };
    
    // Broadcast to all connected modules
    wsService.broadcastToModules('notification', notificationPayload);
    
    // Log for debugging
    console.log(`[${client.name}] [${level}] [${type}] ${message}`);
    if (metadata) {
      console.log('Metadata:', metadata);
    }
    
    res.json({
      success: true,
      message: 'Alert received and queued for processing',
      messageId: Date.now(), // Temporary ID
      client: client.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid alert data', details: error.issues });
    }
    
    console.error('Alert processing error:', error);
    res.status(500).json({ error: 'Failed to process alert' });
  }
});

  return router;
}