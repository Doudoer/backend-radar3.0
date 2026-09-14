import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import customersRoutes from './routes/customers.routes.js';
import warrantiesRoutes from './routes/warranties.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import claimsRoutes from './routes/claims.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import systemRoutes from './routes/system.routes.js';
import usersRoutes from './routes/users.routes.js';
import callsRoutes from './routes/calls.routes.js';
import deliveriesRoutes from './routes/deliveries.routes.js';
import logisticsRoutes from './routes/logistics.routes.js';
import aiRoutes from './routes/ai.routes.js';
import vinRoutes from './routes/vin.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'radar-v3-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/warranties', warrantiesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vin', vinRoutes);

app.use(errorMiddleware);

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend Radar V3 escuchando en http://0.0.0.0:${port}`);
});
