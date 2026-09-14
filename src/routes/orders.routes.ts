import { Router } from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const normalizeOrder = (row: any) => ({
  ...row,
  order_code: row.order_code,
  order_number: row.order_code,
  customer_name: row.customer_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
  customer_phone: row.customer_phone || row.phone || '',
  customer_email: row.customer_email || row.email || '',
  shipping_toggle: Boolean(row.shipping_toggle),
  year: row.year != null ? Number(row.year) : null,
  shipping_cost: Number(row.shipping_cost || 0),
  warranty_days: Number(row.warranty_days || 0),
  workflow_step: Number(row.workflow_step || 1),
  total_amount: Number(row.price || 0),
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const filters: string[] = [];
    const values: any[] = [];
    const query = req.query as Record<string, string>;

    if (query.status) {
      filters.push('status = ?');
      values.push(query.status);
    }
    if (query.customer_id) {
      filters.push('customer_id = ?');
      values.push(query.customer_id);
    }
    if (query.brand) {
      filters.push('brand = ?');
      values.push(query.brand);
    }
    if (query.product_type) {
      filters.push('product_type = ?');
      values.push(query.product_type);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.phone, c.email,
             CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS customer_name,
             c.phone AS customer_phone,
             c.email AS customer_email
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      ${where}
      ORDER BY o.created_at DESC, o.id DESC
    `, values);
    res.json((rows as any[]).map(normalizeOrder));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.phone, c.email,
             CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS customer_name,
             c.phone AS customer_phone,
             c.email AS customer_email
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?
      LIMIT 1
    `, [req.params.id]);
    const order = (rows as any[])[0];
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json({ order: normalizeOrder(order) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orderCode = String(body.order_number || body.order_code || `ORD-${Date.now()}`);
    const customerName = String(body.customer_name || body.name || '').trim();
    const customerPhone = String(body.customer_phone || body.phone || '');
    const customerEmail = String(body.customer_email || body.email || '');

    const customerId = body.customer_id ? Number(body.customer_id) : null;

    await pool.query(
      `INSERT INTO orders (
        order_code, vin_nr, brand, model, sub_model, year, color, product_type, transmission_type, product_specs,
        stock_nr, customer_id, user_id, price, core_fee, down_payment, shipping_toggle, shipping_address, shipping_cost,
        warranty_days, status, workflow_step, scheduled_pickup_at, prorogation_until, core_status, description, claim_reason, payment_method, delivered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        orderCode,
        body.vin_nr || '',
        body.brand || '',
        body.model || '',
        body.sub_model || '',
        body.year || null,
        body.color || '',
        body.product_type || '',
        body.transmission_type || null,
        body.product_specs || '',
        body.stock_nr || '',
        customerId,
        req.user?.id || null,
        body.total_amount || body.price || 0,
        body.core_fee || 0,
        body.down_payment || 0,
        body.shipping_toggle ? 1 : 0,
        body.shipping_address || '',
        body.shipping_cost || 0,
        body.warranty_days || 30,
        body.status || 'Cotización',
        body.workflow_step || 1,
        body.scheduled_pickup_at || null,
        body.prorogation_until || null,
        body.core_status || 'Pendiente',
        body.description || '',
        body.claim_reason || '',
        body.payment_method || null,
        body.delivered_at || null,
      ],
    );

    const [rows] = await pool.query('SELECT * FROM orders WHERE order_code = ? LIMIT 1', [orderCode]);
    res.status(201).json(normalizeOrder((rows as any[])[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const fields: string[] = [];
    const values: any[] = [];

    const addField = (key: string, value: unknown) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    };

    addField('customer_id', body.customer_id);
    addField('vin_nr', body.vin_nr);
    addField('brand', body.brand);
    addField('model', body.model);
    addField('sub_model', body.sub_model);
    addField('year', body.year);
    addField('color', body.color);
    addField('stock_nr', body.stock_nr);
    addField('product_type', body.product_type);
    addField('product_specs', body.product_specs);
    addField('status', body.status);
    if (body.shipping_toggle !== undefined) addField('shipping_toggle', body.shipping_toggle ? 1 : 0);
    addField('shipping_cost', body.shipping_cost);
    addField('warranty_days', body.warranty_days);
    addField('description', body.description);
    addField('shipping_address', body.shipping_address);
    addField('claim_reason', body.claim_reason);
    addField('core_status', body.core_status);
    addField('workflow_step', body.workflow_step);
    addField('prorogation_until', body.prorogation_until);
    addField('scheduled_pickup_at', body.scheduled_pickup_at);
    addField('delivered_at', body.delivered_at);
    addField('price', body.total_amount ?? body.price);
    addField('core_fee', body.core_fee);
    addField('down_payment', body.down_payment);
    addField('payment_method', body.payment_method);

    if (!fields.length) {
      return res.status(400).json({ message: 'No hay cambios para guardar' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [req.params.id]);
    res.json({ ok: true, order: normalizeOrder((rows as any[])[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status, claim_reason } = req.body as Record<string, unknown>;
    await pool.query('UPDATE orders SET status = ?, claim_reason = COALESCE(?, claim_reason) WHERE id = ?', [status || 'Cotización', claim_reason || null, req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/workflow', authMiddleware, async (req, res, next) => {
  try {
    const { workflow_step, prorogation_until, scheduled_pickup_at, core_status } = req.body as Record<string, unknown>;
    await pool.query(
      'UPDATE orders SET workflow_step = COALESCE(?, workflow_step), prorogation_until = COALESCE(?, prorogation_until), scheduled_pickup_at = COALESCE(?, scheduled_pickup_at), core_status = COALESCE(?, core_status) WHERE id = ?',
      [workflow_step ?? null, prorogation_until || null, scheduled_pickup_at || null, core_status || null, req.params.id],
    );
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [req.params.id]);
    res.json({ ok: true, order: normalizeOrder((rows as any[])[0]) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/dates', authMiddleware, async (req, res, next) => {
  try {
    const { created_at, delivered_at } = req.body as Record<string, unknown>;
    await pool.query('UPDATE orders SET created_at = COALESCE(?, created_at), delivered_at = COALESCE(?, delivered_at) WHERE id = ?', [created_at || null, delivered_at || null, req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/customer-notification', authMiddleware, async (req, res, next) => {
  try {
    const { message, contact_channel, contact_reason, contact_result, customer_response } = req.body as Record<string, unknown>;
    await pool.query(
      'INSERT INTO order_customer_notifications (order_id, message, contact_channel, contact_reason, contact_result, customer_response) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, message || '', contact_channel || '', contact_reason || '', contact_result || '', customer_response || ''],
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/attachments', authMiddleware, upload.array('files'), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    for (const file of files) {
      await pool.query(
        'INSERT INTO order_attachments (order_id, file_path, original_name, file_type, file_size, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, file.filename || file.originalname, file.originalname, file.mimetype, file.size, req.user?.id || null],
      );
    }
    res.status(201).json({ ok: true, uploaded: files.length });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM order_attachments WHERE order_id = ?', [req.params.id]);
    await pool.query('DELETE FROM order_customer_notifications WHERE order_id = ?', [req.params.id]);
    await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
