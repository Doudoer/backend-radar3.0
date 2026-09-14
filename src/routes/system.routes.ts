import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { testConnection } from '../config/db.js';
import pool from '../config/db.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const dbStatus = await testConnection();
  res.json({
    ok: true,
    service: 'radar-v3-backend',
    database: dbStatus ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

router.get('/ai-status', authMiddleware, async (_req, res, next) => {
  try {
    const dbStatus = await testConnection();
    const [counts] = await pool.query('SELECT (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM calls) AS calls, (SELECT COUNT(*) FROM claims) AS claims, (SELECT COUNT(*) FROM notifications) AS notifications');
    res.json({
      ok: true,
      database: dbStatus ? 'connected' : 'unavailable',
      modules: { aiReports: true, notifications: true },
      stats: (counts as any[])[0],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/backups', authMiddleware, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, filename, file_path, size, metadata, created_at FROM backups ORDER BY id DESC LIMIT 20');
    res.json((rows as any[]).map((row) => ({
      id: row.id,
      filename: row.filename,
      file_path: row.file_path,
      size: Number(row.size || 0),
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      created_at: row.created_at,
    })));
  } catch (error) {
    next(error);
  }
});

router.post('/backups', authMiddleware, async (_req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `radar_v3_backup_${timestamp}.sql`;
    const backupDir = path.resolve(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const filePath = path.join(backupDir, filename);
    const [counts] = await pool.query('SELECT COUNT(*) AS orders FROM orders');
    const content = `-- Radar V3 backup generated at ${new Date().toISOString()}\n-- Orders: ${(counts as any[])[0]?.orders || 0}\n`;
    await fs.writeFile(filePath, content, 'utf8');
    const stats = await fs.stat(filePath);
    await pool.query('INSERT INTO backups (filename, file_path, size, metadata) VALUES (?, ?, ?, ?)', [filename, filePath, stats.size, JSON.stringify({ generatedAt: new Date().toISOString() })]);
    res.status(201).json({ ok: true, filename, filePath });
  } catch (error) {
    next(error);
  }
});

router.get('/backups/download/:filename', async (req, res, next) => {
  try {
    const filePath = path.resolve(process.cwd(), 'backups', req.params.filename);
    await fs.access(filePath);
    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
