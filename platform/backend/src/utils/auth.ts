import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(): string {
  // Generate 6-character alphanumeric token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = randomBytes(6);
  
  for (let i = 0; i < 6; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

export function verifyToken(token: string): boolean {
  try {
    // For now, just validate format (6 alphanumeric chars)
    return /^[A-Z0-9]{6}$/.test(token);
  } catch (error) {
    return false;
  }
}

export function generateJWT(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}