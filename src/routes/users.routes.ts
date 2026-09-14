import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { hashPassword } from '../services/password.service.js';

const router = Router();

const parsePermissions = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const normalizeUser = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  active: Boolean(row.active ?? true),
  permissions: parsePermissions(row.permissions),
  created_at: row.created_at,
});

router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, active, permissions, created_at FROM users ORDER BY id DESC');
    res.json((rows as any[]).map(normalizeUser));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, active, permissions, created_at FROM users WHERE id = ? LIMIT 1', [req.params.id]);
    const user = (rows as any[])[0];
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(normalizeUser(user));
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, email, password, role, active, permissions } = req.body as any;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y password son requeridos' });
    }

    const hashed = await hashPassword(password);
    const permissionText = JSON.stringify(parsePermissions(permissions));
    await pool.query(
      'INSERT INTO users (name, email, password, role, active, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, role || 'operator', active === false ? 0 : 1, permissionText],
    );
    const [rows] = await pool.query('SELECT id, name, email, role, active, permissions, created_at FROM users WHERE email = ? LIMIT 1', [email]);
    res.status(201).json(normalizeUser((rows as any[])[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, active, permissions } = req.body as any;
    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
    if (permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(parsePermissions(permissions))); }
    if (password) { fields.push('password = ?'); values.push(await hashPassword(password)); }

    if (!fields.length) {
      return res.status(400).json({ message: 'No hay cambios para guardar' });
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, name, email, role, active, permissions, created_at FROM users WHERE id = ? LIMIT 1', [id]);
    const user = (rows as any[])[0];
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(normalizeUser(user));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
