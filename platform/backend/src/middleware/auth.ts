import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { db } from '../database/database';

export interface AuthenticatedRequest extends Request {
  client?: {
    id: number;
    name: string;
    token: string;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!verifyToken(token)) {
    return res.status(403).json({ error: 'Invalid token format' });
  }

  try {
    // Look up client by token
    const client = await db.get(
      'SELECT id, name, token FROM clients WHERE token = ?',
      [token]
    );

    if (!client) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Update last_seen
    await db.run(
      'UPDATE clients SET last_seen = ? WHERE id = ?',
      [new Date().toISOString(), client.id]
    );

    req.client = client;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}