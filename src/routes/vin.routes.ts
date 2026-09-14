import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const FALLBACK_MAKES = ['Samsung', 'Apple', 'Xiaomi', 'Honda', 'Toyota', 'Nissan'];

router.get('/makes', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT brand AS name FROM orders WHERE brand IS NOT NULL AND brand <> "" ORDER BY brand ASC');
    const makes = (rows as any[]).map((row) => ({ id: row.name, name: row.name }));
    res.json(makes.length ? makes : FALLBACK_MAKES.map((name) => ({ id: name, name })));
  } catch (error) {
    next(error);
  }
});

router.get('/models/:make/:year', authMiddleware, async (req, res, next) => {
  try {
    const { make } = req.params;
    const [rows] = await pool.query('SELECT DISTINCT model AS name FROM orders WHERE brand = ? AND model IS NOT NULL AND model <> "" ORDER BY model ASC', [make]);
    const models = (rows as any[]).map((row) => ({ id: row.name, name: row.name }));
    res.json(models.length ? models : [{ id: `${make}-default-${req.params.year}`, name: `${make} ${req.params.year}` }]);
  } catch (error) {
    next(error);
  }
});

router.get('/decode/:vin', authMiddleware, async (req, res, next) => {
  try {
    const vin = Array.isArray(req.params.vin) ? req.params.vin[0] : String(req.params.vin || '');
    const [rows] = await pool.query('SELECT brand, model, year FROM orders WHERE vin_nr = ? LIMIT 1', [vin]);
    const order = (rows as any[])[0];
    if (order) {
      return res.json({ brand: order.brand, model: order.model, year: order.year });
    }

    res.json({
      brand: vin.slice(0, 3).toUpperCase() || 'N/A',
      model: vin.slice(3, 6).toUpperCase() || 'N/A',
      year: new Date().getFullYear(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
