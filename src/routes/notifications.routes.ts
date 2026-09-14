import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, title, message, type, priority, link, is_read, created_at FROM notifications ORDER BY id DESC LIMIT 50');
    res.json((rows as any[]).map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      priority: row.priority || 'low',
      link: row.link || '',
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
    })));
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, message, type, priority, link } = req.body as any;
    await pool.query('INSERT INTO notifications (title, message, type, priority, link, is_read) VALUES (?, ?, ?, ?, ?, 0)', [title || 'Notificación', message || '', type || 'system', priority || 'low', link || '']);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/all', authMiddleware, async (_req, res, next) => {
  try {
    await pool.query('DELETE FROM notifications');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
