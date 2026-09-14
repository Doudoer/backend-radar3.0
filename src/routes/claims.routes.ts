import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeClaim = (row: any) => ({
  id: row.id,
  order_id: row.order_id,
  order_code: row.order_code || row.order_number || row.claim_code,
  brand: row.brand || '',
  model: row.model || '',
  year: row.year || null,
  product_type: row.product_type || '',
  product_specs: row.product_specs || '',
  price: Number(row.price || row.total_amount || 0),
  first_name: row.first_name || '',
  last_name: row.last_name || '',
  description: row.description || '',
  status: row.status || 'Pending',
  assigned_user_name: row.assigned_user_name || '',
  created_at: row.created_at,
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM claims');
    const [rows] = await pool.query(`
      SELECT c.*, o.order_number, o.brand, o.model, o.year, o.product_type, o.product_specs, o.total_amount, cu.first_name, cu.last_name, u.name AS assigned_user_name
      FROM claims c
      LEFT JOIN orders o ON o.id = c.order_id
      LEFT JOIN customers cu ON cu.id = o.customer_id
      LEFT JOIN users u ON u.id = c.assigned_user_id
      ORDER BY c.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    const total = Number((countRows as any[])[0]?.total || 0);
    res.json({
      data: (rows as any[]).map(normalizeClaim),
      meta: { total, page, last_page: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { order_id, description, assigned_user_id } = req.body as any;
    const claimCode = `CLM-${Date.now()}`;
    await pool.query('INSERT INTO claims (order_id, claim_code, description, assigned_user_id, status) VALUES (?, ?, ?, ?, ?)', [order_id, claimCode, description || '', assigned_user_id || null, 'Pending']);
    const [rows] = await pool.query(`
      SELECT c.*, o.order_number, o.brand, o.model, o.year, o.product_type, o.product_specs, o.total_amount, cu.first_name, cu.last_name, u.name AS assigned_user_name
      FROM claims c
      LEFT JOIN orders o ON o.id = c.order_id
      LEFT JOIN customers cu ON cu.id = o.customer_id
      LEFT JOIN users u ON u.id = c.assigned_user_id
      WHERE c.claim_code = ? LIMIT 1
    `, [claimCode]);
    res.status(201).json(normalizeClaim((rows as any[])[0]));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.body as any;
    await pool.query('UPDATE claims SET status = ? WHERE id = ?', [status || 'Pending', req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM claims WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
