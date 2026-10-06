// Arranque en Cloudflare: Workers + D1 (funciona con la compu apagada). La lógica está en app.mjs, la misma que usa server.mjs.
import { createApp, NO_CACHE } from './app.mjs';

// D1 con la misma interfaz que server.mjs le da a SQLite.
const d1 = DB => {
  const st = (sql, p) => DB.prepare(sql).bind(...p);
  return {
    get: async (sql, ...p) => (await st(sql, p).first()) ?? undefined,
    all: async (sql, ...p) => (await st(sql, p).all()).results,
    run: async (sql, ...p) => { const { meta } = await st(sql, p).run(); return { changes: meta.changes, lastInsertRowid: meta.last_row_id }; },
  };
};

export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path.startsWith('/api/')) return createApp({ db: d1(env.DB), env })(req);
    // Archivos de public/: /admin… → panel web; /app.js; lo demás → app de teléfono.
    const file = path === '/app.js' ? '/app.js' : path.startsWith('/admin') ? '/admin.html' : '/index.html';
    const res = await env.ASSETS.fetch(new Request(new URL(file, req.url)));
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(NO_CACHE)) out.headers.set(k, v);
    return out;
  },
};
