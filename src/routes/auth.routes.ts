import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signToken, verifyToken } from '../services/jwt.service.js';
import { comparePassword } from '../services/password.service.js';
import pool from '../config/db.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const parsePermissions = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const [rows] = await pool.query('SELECT id, name, email, password, role, active, permissions FROM users WHERE email = ? LIMIT 1', [email]);
    const users = rows as Array<{ id: number; name: string; email: string; password: string; role: string; active?: number; permissions?: string | null }>;
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (Number(user.active ?? 1) === 0) {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: parsePermissions(user.permissions),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token requerido' });
    }

    const token = authorization.slice(7);
    const payload = verifyToken(token);
    const [rows] = await pool.query('SELECT id, name, email, role, active, permissions, created_at FROM users WHERE id = ? LIMIT 1', [payload.id]);
    const user = (rows as Array<any>)[0];
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: Boolean(user.active),
        permissions: parsePermissions(user.permissions),
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
