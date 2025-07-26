import { Router, Request, Response } from 'express';
import { db } from '../database/database';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await db.get('SELECT 1');
    
    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM clients WHERE last_seen > datetime('now', '-5 minutes')) as active_clients,
        (SELECT COUNT(*) FROM message_history WHERE created_at > datetime('now', '-1 hour')) as messages_last_hour,
        (SELECT COUNT(*) FROM output_modules WHERE is_active = 1) as active_modules
    `);
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      database: 'connected',
      stats: {
        totalClients: stats.total_clients || 0,
        activeClients: stats.active_clients || 0,
        messagesLastHour: stats.messages_last_hour || 0,
        activeModules: stats.active_modules || 0
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

export default router;