import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeDelivery = (row: any) => ({
  id: row.id,
  delivery_code: row.delivery_code,
  driver_name: row.driver_name || '',
  receiver_name: row.receiver_name,
  delivery_address: row.delivery_address,
  notes: row.notes || '',
  status: row.status,
  order_count: Number(row.order_count || 0),
  created_at: row.created_at,
  order_ids: row.order_ids ? JSON.parse(row.order_ids) : [],
});

router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, u.name AS driver_name
      FROM deliveries d
      LEFT JOIN users u ON u.id = d.driver_id
      ORDER BY d.id DESC
    `);
    res.json((rows as any[]).map(normalizeDelivery));
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { driver_id, receiver_name, delivery_address, notes, order_ids } = req.body as any;
    const ids = Array.isArray(order_ids) ? order_ids.map(Number).filter(Number.isFinite) : [];
    const [driverRows] = await pool.query('SELECT id, name FROM users WHERE id = ? LIMIT 1', [driver_id || null]);
    const driver = (driverRows as any[])[0];
    const deliveryCode = `DEL-${Date.now()}`;
    await pool.query(
      'INSERT INTO deliveries (delivery_code, driver_id, receiver_name, delivery_address, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
      [deliveryCode, driver?.id || null, receiver_name || '', delivery_address || '', notes || '', 'Pending'],
    );
    const [rows] = await pool.query('SELECT d.*, u.name AS driver_name FROM deliveries d LEFT JOIN users u ON u.id = d.driver_id WHERE d.delivery_code = ? LIMIT 1', [deliveryCode]);
    res.status(201).json(normalizeDelivery((rows as any[])[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.body as any;
    await pool.query('UPDATE deliveries SET status = ? WHERE id = ?', [status || 'Pending', req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
