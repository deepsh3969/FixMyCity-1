import { app, ensureDb } from '../server/src/index.js';

export default async (req, res) => {
  try {
    await ensureDb();
  } catch (err) {
    const scrub = (s) => String(s || '').replace(/\/\/[^@\s]+@/g, '//***@');
    const detail = {
      name: err?.name,
      code: err?.code,
      causeCode: err?.cause?.code,
      causeMsg: scrub(err?.cause?.message)?.slice(0, 200),
      reasonCode: err?.reason?.code,
      reasonMsg: scrub(err?.reason?.message)?.slice(0, 200),
      subErrors: Array.isArray(err?.cause?.errors)
        ? err.cause.errors.slice(0, 3).map((e) => ({ code: e.code, msg: scrub(e.message).slice(0, 160) }))
        : undefined,
    };
    console.error('DB_UNAVAILABLE:', scrub(err?.message || err), JSON.stringify(detail));
    if (!res.headersSent) {
      res.status(503).json({ error: 'Database unavailable. Check MONGO_URI and Atlas network access.' });
    }
    return;
  }
  return app(req, res);
};
