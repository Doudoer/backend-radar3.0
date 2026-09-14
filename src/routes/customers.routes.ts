import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const normalizeCustomer = (row: any) => ({
  id: row.id,
  first_name: row.first_name || row.name?.split(' ')[0] || '',
  last_name: row.last_name || row.name?.split(' ').slice(1).join(' ') || '',
  phone: row.phone || '',
  whatsapp: row.whatsapp || row.phone || '',
  email: row.email || '',
  address_shipping: row.address_shipping || row.company || '',
  zip_code: row.zip_code || '',
  notes: row.notes || '',
  company: row.company || '',
  name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
  created_at: row.created_at,
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const limit = Number(req.query.limit || 100);
    const page = Number(req.query.page || 1);
    const offset = (page - 1) * limit;
    const where = search ? 'WHERE first_name LIKE ? OR last_name LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?' : '';
    const params = search ? Array(5).fill(`%${search}%`) : [];
    const [rows] = await pool.query(`SELECT * FROM customers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    res.json((rows as any[]).map(normalizeCustomer));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
    const customer = (rows as any[])[0];
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(normalizeCustomer(customer));
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { first_name, last_name, phone, whatsapp, email, address_shipping, zip_code, notes, company, name } = req.body as Record<string, unknown>;
    const customerName = String(name || `${first_name || ''} ${last_name || ''}`.trim()).trim();

    const [result] = await pool.query(
      'INSERT INTO customers (first_name, last_name, phone, whatsapp, email, address_shipping, zip_code, notes, company, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name || '', last_name || '', phone || '', whatsapp || phone || '', email || '', address_shipping || '', zip_code || '', notes || '', company || '', customerName],
    );

    res.status(201).json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { first_name, last_name, phone, whatsapp, email, address_shipping, zip_code, notes, company, name } = req.body as Record<string, unknown>;
    const customerName = String(name || `${first_name || ''} ${last_name || ''}`.trim()).trim();
    await pool.query(
      'UPDATE customers SET first_name = ?, last_name = ?, phone = ?, whatsapp = ?, email = ?, address_shipping = ?, zip_code = ?, notes = ?, company = ?, name = ? WHERE id = ?',
      [first_name || '', last_name || '', phone || '', whatsapp || phone || '', email || '', address_shipping || '', zip_code || '', notes || '', company || '', customerName, req.params.id],
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
    res.json(normalizeCustomer((rows as any[])[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
