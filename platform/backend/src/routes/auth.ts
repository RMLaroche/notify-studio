import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateToken } from '../utils/auth';
import { db } from '../database/database';

const router = Router();

const GenerateTokenSchema = z.object({
  clientName: z.string().min(1).max(100)
});

const RegisterClientSchema = z.object({
  name: z.string().min(1).max(100),
  token: z.string().length(6),
  connectionType: z.enum(['websocket', 'rest', 'both']).optional().default('both')
});

// Generate a new client token
router.post('/generate-token', async (req: Request, res: Response) => {
  try {
    const { clientName } = GenerateTokenSchema.parse(req.body);
    
    const token = generateToken();
    
    res.json({
      clientName,
      token,
      message: 'Token generated. Use this token to register your client.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.issues });
    }
    
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Register a new client with token
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, token, connectionType } = RegisterClientSchema.parse(req.body);
    
    // Check if token already exists
    const existingClient = await db.get(
      'SELECT id FROM clients WHERE token = ?',
      [token]
    );
    
    if (existingClient) {
      return res.status(409).json({ error: 'Token already in use' });
    }
    
    // Insert new client
    const result = await db.run(
      'INSERT INTO clients (name, token, connection_type, created_at) VALUES (?, ?, ?, ?)',
      [name, token, connectionType, new Date().toISOString()]
    );
    
    const client = await db.get(
      'SELECT id, name, token, connection_type, created_at FROM clients WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      message: 'Client registered successfully',
      client: {
        id: client.id,
        name: client.name,
        token: client.token,
        connectionType: client.connection_type,
        createdAt: client.created_at
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.issues });
    }
    
    console.error('Client registration error:', error);
    res.status(500).json({ error: 'Failed to register client' });
  }
});

export default router;