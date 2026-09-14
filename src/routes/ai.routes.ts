import { Router } from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const summarizeText = (text: string) => {
  const clean = String(text || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  return clean.length <= 180 ? clean : `${clean.slice(0, 177)}...`;
};

const buildReportPayload = async () => {
  const [orderRows] = await pool.query('SELECT COUNT(*) AS total FROM orders');
  const [claimRows] = await pool.query('SELECT COUNT(*) AS total FROM claims');
  const [invoiceRows] = await pool.query('SELECT COUNT(*) AS total FROM invoices');
  const [callRows] = await pool.query('SELECT COUNT(*) AS total FROM calls');

  return {
    highlights: ['Datos sincronizados desde radar_v3', 'API conectada con MySQL en MAMP'],
    risks: ['Verificar que JWT esté activo para rutas privadas'],
    actions: ['Revisar órdenes, reclamos y notificaciones desde el CRM'],
    reportSuggestions: ['Usar el panel semanal para seguimiento operativo'],
    dataset: {
      kpis: {
        ordersCurrent: Number((orderRows as any[])[0]?.total || 0),
        claimsOpen: Number((claimRows as any[])[0]?.total || 0),
        callsTotal: Number((callRows as any[])[0]?.total || 0),
        revenueCurrent: Number((invoiceRows as any[])[0]?.total || 0),
      },
    },
  };
};

const toReport = (row: any) => ({
  id: row.id,
  reportType: row.report_type || row.type || 'weekly',
  title: row.title,
  summary: row.summary,
  weekStart: row.week_start || null,
  weekEnd: row.week_end || null,
  model: row.model || 'local-radar',
  createdAt: row.created_at,
  payload: row.payload
    ? JSON.parse(row.payload)
    : {
        highlights: [],
        risks: [],
        actions: Array.isArray(row.recommendations) ? row.recommendations : [],
        reportSuggestions: Array.isArray(row.recommendations) ? row.recommendations : [],
        dataset: {
          kpis: row.metrics || {},
          rawData: row.raw_data || {},
        },
      },
});

const listReports = async (_reportType: string) => {
  const [rows] = await pool.query('SELECT * FROM ai_reports ORDER BY id DESC LIMIT 12');
  return (rows as any[]).map(toReport);
};

router.post('/summarize', authMiddleware, async (req, res) => {
  const { text } = req.body as any;
  res.json({ ok: true, summary: summarizeText(text) });
});

router.get('/reports/weekly', authMiddleware, async (_req, res, next) => {
  try {
    res.json(await listReports('weekly'));
  } catch (error) {
    next(error);
  }
});

router.get('/reports/deliveries-weekly', authMiddleware, async (_req, res, next) => {
  try {
    res.json(await listReports('deliveries-weekly'));
  } catch (error) {
    next(error);
  }
});

router.get('/reports/status-request', authMiddleware, async (_req, res, next) => {
  try {
    res.json(await listReports('status-request'));
  } catch (error) {
    next(error);
  }
});

const safeWeekCode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90 + 10);
  return `W${year}${month}${day}${rand}`;
};

const insertGeneratedReport = async (_reportType: string, title: string, summary: string, payload: any) => {
  const weekCode = safeWeekCode();
  const metrics = payload?.dataset?.kpis || {};
  const recommendations = payload?.reportSuggestions || payload?.actions || [];
  const rawData = payload?.dataset || {};
  await pool.query('INSERT INTO ai_reports (week_code, title, summary, metrics, recommendations, raw_data) VALUES (?, ?, ?, ?, ?, ?)', [weekCode, title, summary, JSON.stringify(metrics), JSON.stringify(recommendations), JSON.stringify(rawData)]);
  const [rows] = await pool.query('SELECT * FROM ai_reports WHERE week_code = ? LIMIT 1', [weekCode]);
  return toReport((rows as any[])[0]);
};

router.post('/reports/weekly/generate', authMiddleware, async (_req, res, next) => {
  try {
    const payload = await buildReportPayload();
    const created = await insertGeneratedReport('weekly', 'Reporte semanal Radar V3', `Órdenes: ${payload.dataset.kpis.ordersCurrent}, Reclamos: ${payload.dataset.kpis.claimsOpen}, Llamadas: ${payload.dataset.kpis.callsTotal}.`, payload);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.post('/reports/deliveries-weekly/generate', authMiddleware, async (_req, res, next) => {
  try {
    const payload = await buildReportPayload();
    const created = await insertGeneratedReport('deliveries-weekly', 'Reporte de entregas Radar V3', 'Reporte de entregas generado desde la base radar_v3.', payload);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.post('/reports/status-request/generate', authMiddleware, async (_req, res, next) => {
  try {
    const payload = await buildReportPayload();
    const created = await insertGeneratedReport('status-request', 'Solicitud de estatus Radar V3', 'Solicitud de estatus generada desde la base radar_v3.', payload);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.delete('/reports/:id', authMiddleware, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM ai_reports WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
