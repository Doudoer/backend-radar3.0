import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'radar-v3-local-secret';

export function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
}
