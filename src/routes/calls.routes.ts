import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeCall = (row: any) => ({
  id: row.id,
  phone: row.phone,
  contact_name: row.contact_name,
  description: row.description,
  is_claim: Boolean(row.is_claim),
  user_name: row.user_name || '',
  first_name: row.first_name || '',
  last_name: row.last_name || '',
  created_at: row.created_at,
  customer_id: row.customer_id || null,
  order_id: row.order_id || null,
});

router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.name AS user_name, cu.first_name, cu.last_name
      FROM calls c
      LEFT JOIN users u ON u.id = c.user_id
      LEFT JOIN customers cu ON cu.id = c.customer_id
      ORDER BY c.id DESC
    `);
    res.json((rows as any[]).map(normalizeCall));
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { phone, contact_name, description, is_claim, customer_id, order_id } = req.body as any;
    const userId = req.user?.id || null;
    await pool.query(
      'INSERT INTO calls (phone, contact_name, description, is_claim, customer_id, order_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [phone || '', contact_name || '', description || '', is_claim ? 1 : 0, customer_id || null, order_id || null, userId],
    );
    const [rows] = await pool.query('SELECT c.*, u.name AS user_name, cu.first_name, cu.last_name FROM calls c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN customers cu ON cu.id = c.customer_id ORDER BY c.id DESC LIMIT 1');
    res.status(201).json(normalizeCall((rows as any[])[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM calls WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
