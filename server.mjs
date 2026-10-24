// Arranque en la compu: Node + SQLite (data.db). La lógica está en app.mjs, la misma que corre en Cloudflare con worker.mjs.
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync, mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import os from 'node:os';
import { createApp, NO_CACHE } from './app.mjs';

try { process.loadEnvFile(); } catch {}
const { PORT = 3000, ADMIN_PORT = 3001 } = process.env;

const sqlite = new DatabaseSync('data.db');
sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
// Bases creadas con versiones anteriores: agregar las columnas que falten.
for (const sql of ['ALTER TABLE users ADD COLUMN plant TEXT', 'ALTER TABLE reports ADD COLUMN plant TEXT', "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'activo'",
  'ALTER TABLE sessions ADD COLUMN created INTEGER NOT NULL DEFAULT 0', 'ALTER TABLE users ADD COLUMN nomina INTEGER NOT NULL DEFAULT 0'])
  try { sqlite.exec(sql); } catch {} // ya existe
const db = {
  get: async (sql, ...p) => sqlite.prepare(sql).get(...p),
  all: async (sql, ...p) => sqlite.prepare(sql).all(...p),
  run: async (sql, ...p) => { const r = sqlite.prepare(sql).run(...p); return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }; },
};
// Fotos en la carpeta uploads/ (en Cloudflare van a R2).
const uploads = new URL('./uploads/', import.meta.url);
mkdirSync(uploads, { recursive: true });
const files = {
  put: (key, bytes) => writeFile(new URL(key, uploads), bytes),
  get: key => readFile(new URL(key, uploads)).catch(() => null),
};
const handleApi = createApp({ db, files, env: process.env });

async function handler(req, res) {
  try {
    const path = req.url.split('?')[0];
    if (!path.startsWith('/api/')) {
      // Puerto admin (o /admin, para hosting de un solo puerto) → panel web; lo demás → app de teléfono.
      const admin = req.socket.localPort === Number(ADMIN_PORT) || path.startsWith('/admin');
      const [file, type] = path === '/app.js' ? ['app.js', 'text/javascript'] : [admin ? 'admin.html' : 'index.html', 'text/html'];
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, ...NO_CACHE });
      return res.end(await readFile(new URL(`./public/${file}`, import.meta.url)));
    }
    const chunks = []; let size = 0;
    for await (const c of req) { if ((size += c.length) > 3_000_000) return res.writeHead(413).end(); chunks.push(c); }
    const r = await handleApi(new Request(`http://${req.headers.host}${req.url}`,
      { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500).end();
  }
}

// Misma API y misma base de datos en ambos puertos.
const lan = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254.'))?.address; // 169.254 = sin red
http.createServer(handler).listen(PORT, () =>
  console.log(`App (teléfono):  http://localhost:${PORT}${lan ? `   ·  desde tu celular (misma Wi-Fi): http://${lan}:${PORT}` : ''}`));
http.createServer(handler).listen(ADMIN_PORT, () =>
  console.log(`Admin (web):     http://localhost:${ADMIN_PORT}${lan ? `   ·  desde otra compu (misma Wi-Fi): http://${lan}:${ADMIN_PORT}` : ''}`));
