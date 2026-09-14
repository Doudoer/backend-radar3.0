import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/jwt.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const token = authorization.slice(7);
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
