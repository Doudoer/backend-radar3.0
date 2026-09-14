import { Router } from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeLogistics = (row: any) => ({
  id: row.id,
  name: row.name,
  operator_name: row.operator_name || '',
  item_count: Number(row.item_count || 0),
  found_count: Number(row.found_count || 0),
  language: row.language || 'es',
  secure_hash: row.secure_hash,
  created_at: row.created_at,
});

router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM logistics ORDER BY id DESC');
    res.json((rows as any[]).map(normalizeLogistics));
  } catch (error) {
    next(error);
  }
});

router.get('/public/:hash', async (req, res, next) => {
  try {
    const [routeRows] = await pool.query('SELECT * FROM logistics WHERE secure_hash = ? LIMIT 1', [req.params.hash]);
    const route = (routeRows as any[])[0];
    if (!route) return res.status(404).json({ message: 'Ruta no encontrada' });

    const [itemRows] = await pool.query('SELECT * FROM logistics_items WHERE list_id = ? ORDER BY id ASC', [route.id]);
    res.json({ ok: true, route: normalizeLogistics(route), items: itemRows });
  } catch (error) {
    next(error);
  }
});

router.patch('/public/item/:id', async (req, res, next) => {
  try {
    const { status } = req.body as any;
    await pool.query('UPDATE logistics_items SET status = ? WHERE id = ?', [status || 'Pending', req.params.id]);
    const [rows] = await pool.query('SELECT list_id FROM logistics_items WHERE id = ? LIMIT 1', [req.params.id]);
    const item = (rows as any[])[0];
    if (item?.list_id) {
      const [counts] = await pool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN status = "Delivered" THEN 1 ELSE 0 END) AS found_count FROM logistics_items WHERE list_id = ?', [item.list_id]);
      const summary = (counts as any[])[0];
      await pool.query('UPDATE logistics SET item_count = ?, found_count = ? WHERE id = ?', [Number(summary?.total || 0), Number(summary?.found_count || 0), item.list_id]);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, operator_id, language, order_ids } = req.body as any;
    const ids = Array.isArray(order_ids) ? order_ids.map(Number).filter(Number.isFinite) : [];
    const [operatorRows] = await pool.query('SELECT id, name FROM users WHERE id = ? LIMIT 1', [operator_id || null]);
    const operator = (operatorRows as any[])[0];
    const secureHash = crypto.randomBytes(18).toString('hex');
    await pool.query(
      'INSERT INTO logistics (name, operator_id, operator_name, language, secure_hash, order_ids, item_count, found_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name || 'Ruta logística', operator?.id || null, operator?.name || '', language || 'es', secureHash, JSON.stringify(ids), ids.length, 0],
    );
    const [routeRows] = await pool.query('SELECT * FROM logistics WHERE secure_hash = ? LIMIT 1', [secureHash]);
    const route = (routeRows as any[])[0];

    try {
      await pool.query(
        'INSERT INTO logistics_lists (id, name, operator_id, language, secure_hash) VALUES (?, ?, ?, ?, ?)',
        [route.id, route.name, route.operator_id || null, String(route.language || 'es').toUpperCase(), route.secure_hash],
      );
    } catch {
      // Ignore when legacy row already exists with this id/hash.
    }

    let insertedItems = 0;
    for (const orderId of ids) {
      try {
        await pool.query('INSERT INTO logistics_items (list_id, order_id, status) VALUES (?, ?, ?)', [route.id, orderId, 'Search']);
        insertedItems += 1;
      } catch {
        // In some legacy schemas list_id references logistics_lists; keep route creation even if item insert is blocked.
      }
    }
    if (insertedItems !== ids.length) {
      await pool.query('UPDATE logistics SET item_count = ? WHERE id = ?', [insertedItems, route.id]);
      route.item_count = insertedItems;
    }
    res.status(201).json(normalizeLogistics(route));
  } catch (error) {
    next(error);
  }
});

export default router;
