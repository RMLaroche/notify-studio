import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../database/database';

const router = Router();

const AlertSchema = z.object({
  message: z.string().min(1).max(10000),
  level: z.enum(['info', 'warn', 'error', 'debug']).optional().default('info'),
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
    
    // TODO: Route message to configured output modules based on routing rules
    // For now, just log the message
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

export default router;