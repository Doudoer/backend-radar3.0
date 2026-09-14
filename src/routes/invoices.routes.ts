import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeInvoice = (row: any) => ({
  id: row.id,
  order_id: row.order_id,
  invoice_number: row.invoice_number,
  amount: Number(row.amount || 0),
  status: row.status,
  customer_name: row.customer_name || '',
  user_name: row.user_name || '',
  type: row.type || 'Invoice',
  created_at: row.created_at,
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 15);
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM invoices');
    const [rows] = await pool.query(`
      SELECT i.*, o.customer_name, u.name AS user_name
      FROM invoices i
      LEFT JOIN orders o ON o.id = i.order_id
      LEFT JOIN users u ON u.id = o.customer_id
      ORDER BY i.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    const total = Number((countRows as any[])[0]?.total || 0);
    res.json({ data: (rows as any[]).map(normalizeInvoice), meta: { total, page, last_page: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ? LIMIT 1', [req.params.id]);
    const invoice = (rows as any[])[0];
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
    res.json(normalizeInvoice(invoice));
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { order_id, invoice_number, amount, status } = req.body as Record<string, unknown>;

    const [result] = await pool.query(
      'INSERT INTO invoices (order_id, invoice_number, amount, status) VALUES (?, ?, ?, ?)',
      [order_id, invoice_number, amount || 0, status || 'Emitida'],
    );

    res.status(201).json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
