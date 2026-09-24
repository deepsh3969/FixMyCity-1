import { app, ensureDb } from '../server/src/index.js';

export default async (req, res) => {
  try {
    await ensureDb();
  } catch (err) {
    console.error('DB_UNAVAILABLE:', err?.message || err);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Database unavailable. Check MONGO_URI and Atlas network access.' });
    }
    return;
  }
  return app(req, res);
};
