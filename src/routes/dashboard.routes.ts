import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { buildDashboardPayload } from '../services/dashboard.service.js';

const router = Router();

router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const [countRows] = await pool.query('SELECT (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM warranties) AS warranties, (SELECT COUNT(*) FROM invoices) AS invoices');

    const [columnRows] = await pool.query('SHOW COLUMNS FROM orders');
    const columns = new Set((columnRows as Array<{ Field: string }>).map((column) => column.Field));

    const orderNumberColumn = columns.has('order_number')
      ? 'order_number'
      : columns.has('orderNumber')
        ? 'orderNumber'
        : 'id';

    const customerNameColumn = columns.has('customer_name')
      ? 'customer_name'
      : columns.has('customer')
        ? 'customer'
        : columns.has('name')
          ? 'name'
          : 'id';

    const statusColumn = columns.has('status') ? 'status' : "'Pendiente'";
    const amountColumn = columns.has('total_amount')
      ? 'total_amount'
      : columns.has('amount')
        ? 'amount'
        : '0';

    const createdColumn = columns.has('created_at')
      ? 'created_at'
      : columns.has('createdAt')
        ? 'createdAt'
        : 'id';

    const latestOrdersQuery = `
      SELECT
        id,
        ${orderNumberColumn} AS order_number,
        ${customerNameColumn} AS customer_name,
        ${statusColumn} AS status,
        ${amountColumn} AS total_amount
      FROM orders
      ORDER BY ${createdColumn} DESC
      LIMIT 5
    `;

    const [latestOrders] = await pool.query(latestOrdersQuery);
    const counts = (countRows as any[])[0] as { orders: number; customers: number; warranties: number; invoices: number };

    res.json({
      ok: true,
      ...buildDashboardPayload(
        {
          orders: Number(counts.orders ?? 0),
          customers: Number(counts.customers ?? 0),
          warranties: Number(counts.warranties ?? 0),
          invoices: Number(counts.invoices ?? 0),
        },
        latestOrders as Array<{ id: number; order_number: string; customer_name: string; status: string; total_amount: number }>,
      ),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authMiddleware, async (_req, res, next) => {
  try {
    const [countRows] = await pool.query('SELECT (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM warranties) AS warranties, (SELECT COUNT(*) FROM invoices) AS invoices');
    const counts = (countRows as any[])[0] as { orders: number; customers: number; warranties: number; invoices: number };
    res.json({
      ok: true,
      ...buildDashboardPayload(
        {
          orders: Number(counts.orders ?? 0),
          customers: Number(counts.customers ?? 0),
          warranties: Number(counts.warranties ?? 0),
          invoices: Number(counts.invoices ?? 0),
        },
        [],
      ),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
