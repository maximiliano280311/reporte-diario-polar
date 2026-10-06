// Prueba de la API y los cálculos con una base en memoria (no toca data.db ni producción). Correr: node test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './app.mjs';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const db = {
  get: async (sql, ...p) => sqlite.prepare(sql).get(...p),
  all: async (sql, ...p) => sqlite.prepare(sql).all(...p),
  run: async (sql, ...p) => { const r = sqlite.prepare(sql).run(...p); return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }; },
};
const store = new Map(), files = { put: async (k, b) => store.set(k, b), get: async k => store.get(k) ?? null };
const app = createApp({ db, files, env: { ADMIN_EMAIL: 'admin@polar.test' } }); // sin AI_API_KEY: los reportes quedan "Sin evaluar"

// Llama a la API; devuelve { status, data, cookie }.
async function call(method, path, data, cookie = '', headers = {}) {
  const raw = data instanceof Uint8Array;
  const r = await app(new Request('http://x' + path, { method, headers: { cookie, ...(data && !raw && { 'Content-Type': 'application/json' }), ...headers },
    body: raw ? data : data && JSON.stringify(data) }));
  const type = r.headers.get('content-type') || '';
  return { status: r.status, data: type.includes('json') ? await r.json() : new Uint8Array(await r.arrayBuffer()),
    cookie: /sid=[a-f0-9]+/.exec(r.headers.get('set-cookie') || '')?.[0] };
}
const ok = async (...a) => { const r = await call(...a); assert.equal(r.status, 200, JSON.stringify(r.data)); return r; };
const login = async (email, password = 'secreta123') => (await ok('POST', '/api/login', { email, password })).cookie;
const pass = 'secreta123';

// Cuentas: admin + dos encargados de Querétaro (el arrastre es por planta: el 2º reporte ve al 1º como "anterior").
const admin = (await ok('POST', '/api/register', { name: 'Admin', email: 'admin@polar.test', password: pass })).cookie;
await ok('POST', '/api/trucks', { plant: 'Querétaro', name: 'NP300' }, admin);
await ok('POST', '/api/users', { name: 'Ana', email: 'ana@polar.test', password: pass, plant: 'Querétaro' }, admin);
await ok('POST', '/api/users', { name: 'Beto', email: 'beto@polar.test', password: pass, plant: 'Querétaro' }, admin);
const ana = await login('ana@polar.test'), beto = await login('beto@polar.test');

const base = { turno: 'Matutino', presentes: '5', hubo_reportes: 'No', manana: 'Nada' };
// Foto: sube y se puede descargar con sesión; sin sesión no.
const foto = (await ok('POST', '/api/upload', new Uint8Array([255, 216, 255, 1]), ana, { 'Content-Type': 'image/jpeg' })).data.key;
assert.match(foto, /^[a-f0-9]{32}\.jpg$/);
assert.deepEqual([...(await ok('GET', '/api/files/' + foto, null, beto)).data], [255, 216, 255, 1]);
assert.equal((await call('GET', '/api/files/' + foto)).status, 401);
assert.equal((await call('POST', '/api/upload', new Uint8Array([1]), ana, { 'Content-Type': 'text/plain' })).status, 400);

// Reporte 1 (Ana).
const r1 = (await ok('POST', '/api/reports', { answers: { ...base, reportes_n: '3',
  vehiculos: [{ vehiculo: 'NP300', km_ini: '100', km_fin: '150' }],
  gas: [{ tanque: 'Gas bodega / hornos', na: 'N/A', pct_ini: '40' }, { tanque: 'Gas montacargas', pct_ini: '50', pct_fin: '30', sin_carga: 'N/A', litros: '9' }],
  material: [{ cliente: 'ACME', pieza: 'P-1', cantidad: '10', procesado: '4', entregado: '3' }],
  mantenimiento: [{ equipo: 'Horno 1', estatus: 'Abierto' }, { equipo: 'Bomba', estatus: 'Cerrado' }],
  fotos_gastos: [foto, 'malo.jpg'] } }, ana)).data;
const a1 = r1.answers;
assert.equal(r1.score, null);
assert.equal(a1.reportes_n, 'N/A'); // sin reportes de personal
assert.equal(a1.vehiculos[0].recorrido, '50');
assert.deepEqual([a1.gas[0].na, a1.gas[0].pct_ini, a1.gas[0].litros], ['N/A', 'N/A', 'N/A']);
assert.deepEqual([a1.gas[1].pct_ini, a1.gas[1].sin_carga, a1.gas[1].litros, a1.gas[1].importe], ['50', 'N/A', 'N/A', 'N/A']);
assert.deepEqual([a1.material[0].saldo_ant, a1.material[0].saldo, a1.material[0].pendientes], ['0', '7', '6']);
assert.deepEqual(a1.fotos_gastos, [foto]); // claves inválidas se descartan
assert.equal((await call('POST', '/api/reports', { answers: base }, ana)).status, 409); // uno por día

// Lo que se arrastra al siguiente reporte de la planta.
const d = (await ok('GET', '/api/defaults', null, beto)).data;
assert.equal(d.km.NP300, '150');
assert.deepEqual(d.pendientes.map(m => m.equipo), ['Horno 1']);
assert.deepEqual(d.lists, { clientes: ['ACME'], piezas: ['P-1'] });
assert.equal((await call('POST', '/api/reports', { answers: { ...base, vehiculos: [{ vehiculo: 'Otro' }] } }, beto)).status, 400); // camión no registrado

// Reporte 2 (Beto): saldo y pendientes se arrastran (case-insensitive).
const r2 = (await ok('POST', '/api/reports', { answers: { ...base, material: [{ cliente: 'acme', pieza: 'p-1', cantidad: '5', procesado: '8', entregado: '6' }] } }, beto)).data;
assert.deepEqual([r2.answers.material[0].saldo_ant, r2.answers.material[0].saldo, r2.answers.material[0].pendientes], ['7', '6', '3']);

// Corregir: solo el último de la planta; se recalcula contra los anteriores, no contra sí mismo.
assert.equal((await call('POST', '/api/reports/edit', { id: r1.id, answers: base }, ana)).status, 409);
assert.equal((await call('POST', '/api/reports/edit', { id: r2.id, answers: base }, ana)).status, 403); // no es suyo
const e2 = (await ok('POST', '/api/reports/edit', { id: r2.id, answers: { ...base, material: [{ cliente: 'ACME', pieza: 'P-1', cantidad: '5', procesado: '1', entregado: '2' }] } }, beto)).data;
assert.deepEqual([e2.answers.material[0].saldo_ant, e2.answers.material[0].saldo, e2.answers.material[0].pendientes], ['7', '10', '10']);
await ok('POST', '/api/reports/edit', { id: r2.id, answers: base }, admin); // el admin también
assert.equal((await ok('GET', '/api/defaults?planta=Querétaro&excluir=' + r2.id, null, admin)).data.km.NP300, '150');

// Filtros de reportes.
assert.equal((await ok('GET', '/api/reports', null, admin)).data.length, 2);
assert.equal((await ok('GET', '/api/reports', null, ana)).data.length, 1); // el encargado solo ve los suyos
assert.equal((await ok('GET', '/api/reports?id=' + r1.id, null, admin)).data[0].name, 'Ana');
assert.equal((await ok('GET', '/api/reports?planta=Silao', null, admin)).data.length, 0);
assert.equal((await ok('GET', '/api/reports?desde=2999-01-01', null, admin)).data.length, 0);

// Login: 5 fallos bloquean 15 minutos (aunque luego la contraseña sea correcta); el admin pone una nueva y desbloquea.
for (let i = 0; i < 4; i++) assert.equal((await call('POST', '/api/login', { email: 'ana@polar.test', password: 'mala1234' })).status, 401);
assert.equal((await call('POST', '/api/login', { email: 'ana@polar.test', password: 'mala1234' })).status, 401);
assert.equal((await call('POST', '/api/login', { email: 'ana@polar.test', password: pass })).status, 429);
const anaId = (await ok('GET', '/api/me', null, ana)).data.id;
assert.equal((await call('POST', '/api/users/password', { id: anaId, password: 'corta' }, admin)).status, 400);
assert.equal((await call('POST', '/api/users/password', { id: anaId, password: 'nueva12345' }, ana)).status, 403); // solo admin
await ok('POST', '/api/users/password', { id: anaId, password: 'nueva12345' }, admin);
assert.equal((await call('GET', '/api/me', null, ana)).status, 401); // sus sesiones se cerraron
const ana2 = await login('ana@polar.test', 'nueva12345');

// Cambiar mi contraseña: pide la actual; la sesión sigue con la cookie nueva y la vieja deja de servir.
assert.equal((await call('POST', '/api/me/password', { current: 'mala1234', password: 'otra12345' }, ana2)).status, 400);
const ana3 = (await ok('POST', '/api/me/password', { current: 'nueva12345', password: 'otra12345' }, ana2)).cookie;
assert.equal((await call('GET', '/api/me', null, ana2)).status, 401);
await ok('GET', '/api/me', null, ana3);
await login('ana@polar.test', 'otra12345');

// Sesiones vencidas (más de 30 días) ya no sirven.
sqlite.prepare('UPDATE sessions SET created = 0').run();
assert.equal((await call('GET', '/api/me', null, admin)).status, 401);

console.log('OK: todas las pruebas pasaron');
