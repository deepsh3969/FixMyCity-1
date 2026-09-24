import { app, ensureDb } from '../server/src/index.js';

export default async (req, res) => {
  await ensureDb();
  return app(req, res);
};
