import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeWarranty = (row: any) => ({
  id: row.id,
  order_id: row.order_id,
  order_code: row.order_code || row.order_number || row.claim_code,
  product_type: row.product_type || '',
  warranty_days: Number(row.warranty_days || 30),
  start_date: row.start_date || row.created_at,
  end_date: row.end_date || row.created_at,
  days_left: Number(row.days_left || 0),
  first_name: row.first_name || '',
  last_name: row.last_name || '',
  phone: row.phone || '',
  brand: row.brand || '',
  model: row.model || '',
  year: row.year || null,
  status: row.status || 'Pendiente',
  created_at: row.created_at,
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 4);
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM warranties');
    const [rows] = await pool.query(`
      SELECT w.*, o.order_number, o.product_type, o.warranty_days, o.created_at AS start_date, DATE_ADD(o.created_at, INTERVAL COALESCE(o.warranty_days, 30) DAY) AS end_date,
             DATEDIFF(DATE_ADD(o.created_at, INTERVAL COALESCE(o.warranty_days, 30) DAY), CURDATE()) AS days_left,
             cu.first_name, cu.last_name, cu.phone, o.brand, o.model, o.year
      FROM warranties w
      LEFT JOIN orders o ON o.id = w.order_id
      LEFT JOIN customers cu ON cu.id = o.customer_id
      ORDER BY w.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    const total = Number((countRows as any[])[0]?.total || 0);
    res.json({ data: (rows as any[]).map(normalizeWarranty), meta: { total, page, last_page: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    next(error);
  }
});

router.get('/active', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.*, o.order_number, o.product_type, o.warranty_days, o.created_at AS start_date, DATE_ADD(o.created_at, INTERVAL COALESCE(o.warranty_days, 30) DAY) AS end_date,
             DATEDIFF(DATE_ADD(o.created_at, INTERVAL COALESCE(o.warranty_days, 30) DAY), CURDATE()) AS days_left,
             cu.first_name, cu.last_name, cu.phone, o.brand, o.model, o.year
      FROM warranties w
      LEFT JOIN orders o ON o.id = w.order_id
      LEFT JOIN customers cu ON cu.id = o.customer_id
      WHERE DATEDIFF(DATE_ADD(o.created_at, INTERVAL COALESCE(o.warranty_days, 30) DAY), CURDATE()) <= 7
      ORDER BY w.id DESC
    `);
    res.json({ data: (rows as any[]).map(normalizeWarranty) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { order_id, claim_code, status } = req.body as Record<string, unknown>;

    const [result] = await pool.query(
      'INSERT INTO warranties (order_id, claim_code, status) VALUES (?, ?, ?)',
      [order_id, claim_code, status || 'Pendiente'],
    );

    res.status(201).json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

export default router;
