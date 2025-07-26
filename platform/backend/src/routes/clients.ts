import { Router, Request, Response } from 'express';
import { db } from '../database/database';

const router = Router();

// Get all clients
router.get('/', async (req: Request, res: Response) => {
  try {
    const clients = await db.all(`
      SELECT 
        id, 
        name, 
        connection_type, 
        created_at, 
        last_seen,
        (SELECT COUNT(*) FROM message_history WHERE client_id = clients.id) as message_count
      FROM clients 
      ORDER BY last_seen DESC, created_at DESC
    `);
    
    res.json({
      clients: clients.map(client => ({
        id: client.id,
        name: client.name,
        connectionType: client.connection_type,
        createdAt: client.created_at,
        lastSeen: client.last_seen,
        messageCount: client.message_count,
        status: client.last_seen && 
                new Date(client.last_seen).getTime() > Date.now() - 5 * 60 * 1000 
                ? 'online' : 'offline'
      }))
    });
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await db.get(`
      SELECT 
        id, 
        name, 
        connection_type, 
        created_at, 
        last_seen
      FROM clients 
      WHERE id = ?
    `, [id]);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Get recent messages
    const recentMessages = await db.all(`
      SELECT 
        message, 
        level, 
        stream_type, 
        created_at 
      FROM message_history 
      WHERE client_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [id]);
    
    res.json({
      client: {
        id: client.id,
        name: client.name,
        connectionType: client.connection_type,
        createdAt: client.created_at,
        lastSeen: client.last_seen,
        status: client.last_seen && 
                new Date(client.last_seen).getTime() > Date.now() - 5 * 60 * 1000 
                ? 'online' : 'offline'
      },
      recentMessages: recentMessages.map(msg => ({
        message: msg.message,
        level: msg.level,
        streamType: msg.stream_type,
        timestamp: msg.created_at
      }))
    });
  } catch (error) {
    console.error('Failed to fetch client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Delete client
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db.run('DELETE FROM clients WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;