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

// ---------- Calidad ISO 9001 (etapa 1): recepción → liberación → no conforme ----------
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }), dia = hoy.replaceAll('-', '');
const estadoOK = { empaque: 'Sí', sin_danos: 'Sí', identificacion: 'Sí', cantidad_ok: 'Sí', fotos_ok: 'Sí', separado: 'Sí' };
const rec = (a, who = ana) => call('POST', '/api/calidad/rec', { answers: { fecha: hoy, hora: '08:00', cliente: 'KH México', remision: 'R-1', fotos: [foto], ...estadoOK, ...a } }, who);
const criterios = (nok = -1) => [...Array(8)].map((_, i) => ({ criterio: ['Recubrimiento 100 % removido', 'Sin residuos de proceso', 'Sin residuo químico',
  'Sin daño por temperatura', 'Sin daño mecánico', 'Roscas y barrenos limpios', 'Especificación particular del cliente', 'Identificación conservada'][i], resultado: i === nok ? 'NOK' : 'OK' }));
const lib = a => call('POST', '/api/calidad/lib', { answers: { fecha: hoy, proceso: 'Pirólisis', criterios: criterios(), inspeccionadas: '10', aceptadas: '10', disposicion: 'LIBERADO', ...a } }, ana);

assert.equal((await rec({ fotos: [] })).status, 400); // foto obligatoria
assert.equal((await rec({ partidas: [] })).status, 400); // al menos una partida
assert.equal((await rec({ cliente: 'Summit Silao', partidas: [{ parte: 'P-1', remision: '1', contada: '1', proceso: 'Lavado' }] })).status, 400); // cliente de otra planta
const rec1 = (await rec({ partidas: [{ parte: 'P-1', remision: '10', contada: '10', proceso: 'Pirólisis' }] })).data;
assert.deepEqual([rec1.folio, rec1.anomalia, rec1.partidas[0].lote, rec1.partidas[0].diferencia], ['REC-0001', false, `QRO-${dia}-01`, '0']);
// Diferencia de conteo → aviso para levantar NC (status CON OBSERVACIONES).
const rec2 = (await rec({ remision: 'R-2', partidas: [{ parte: 'P-2', remision: '10', contada: '8', proceso: 'Lavado' }] })).data;
assert.deepEqual([rec2.folio, rec2.anomalia, rec2.partidas[0].diferencia, rec2.partidas[0].lote], ['REC-0002', true, '-2', `QRO-${dia}-02`]);

// Liberación: no se entrega sin LIBERADO; NOK no deja liberar y retiene el lote.
assert.equal((await lib({ lote: `QRO-${dia}-02`, criterios: criterios(2) })).status, 400); // NOK + LIBERADO
assert.equal((await lib({ lote: `QRO-${dia}-02`, disposicion: 'RETRABAJO INTERNO', entrega_fecha: hoy, remision_polar: 'P-9', recibio: 'X' })).status, 400); // entrega sin liberar
assert.equal((await lib({ lote: `QRO-${dia}-01`, entrega_fecha: hoy })).status, 400); // entrega incompleta
const lib1 = (await ok('POST', '/api/calidad/lib', { answers: { fecha: hoy, proceso: 'Pirólisis', criterios: criterios(), inspeccionadas: '10', aceptadas: '10',
  disposicion: 'LIBERADO', lote: `QRO-${dia}-01`, entrega_fecha: hoy, remision_polar: 'POL-1', recibio: 'Juan (KH)' } }, ana)).data;
assert.deepEqual([lib1.folio, lib1.status, lib1.cliente, lib1.rec, lib1.pct], ['LIB-0001', 'ENTREGADO', 'KH México', 'REC-0001', '100']);
assert.equal((await lib({ lote: `QRO-${dia}-01` })).status, 400); // ya no está EN PLANTA
const lib2 = (await ok('POST', '/api/calidad/lib', { answers: { fecha: hoy, proceso: 'Lavado', criterios: criterios(2), inspeccionadas: '8', aceptadas: '6',
  disposicion: 'RETENIDO / NO CONFORME', lote: `QRO-${dia}-02` } }, ana)).data;
assert.deepEqual([lib2.status, lib2.requiereNC, lib2.pct], ['RETENIDO', true, '75']);
assert.equal((await call('POST', '/api/calidad/entrega', { folio: lib2.folio, answers: { entrega_fecha: hoy, remision_polar: 'P', recibio: 'X' } }, ana)).status, 400);
let cal = (await ok('GET', '/api/calidad', null, ana)).data;
assert.equal(cal.lotes.find(l => l.code === `QRO-${dia}-02`).status, 'RETENIDO');
assert.ok(cal.alertas.some(a => a.text.includes('RETENIDO sin no conforme'))); // pide levantar el NC

// No conforme: retiene, avisa a gerencia, sugiere 8D si se repite; al cerrarlo el lote vuelve a EN PLANTA.
const ncBase = { fecha: hoy, cliente: 'KH México', parte: 'P-2', cantidad: '2', lotes: [`QRO-${dia}-02`], detectado: 'Inspección final',
  tipo: ['Residuo químico'], descripcion: 'Residuo en roscas', fotos: [foto], separado: 'Sí', disposicion: 'Retrabajo' };
assert.equal((await call('POST', '/api/calidad/nc', { answers: { ...ncBase, fotos: [] } }, ana)).status, 400); // foto obligatoria
const nc1 = (await ok('POST', '/api/calidad/nc', { answers: ncBase, origen: lib2.folio }, ana)).data;
assert.deepEqual([nc1.folio, nc1.estatus, nc1.origen, nc1.sugiere_8d], ['NC-0001', 'ABIERTO', 'LIB-0002', 'No']);
const nc2 = (await ok('POST', '/api/calidad/nc', { answers: { ...ncBase, lotes: [] } }, ana)).data; // mismo cliente y tipo en 90 días
assert.equal(nc2.sugiere_8d, 'Sí');
cal = (await ok('GET', '/api/calidad', null, admin)).data;
assert.ok(cal.alertas.some(a => a.folio === 'NC-0001' && a.id)); // alerta a gerencia
assert.ok(!cal.alertas.some(a => a.text.includes('sin no conforme')));
assert.equal((await ok('GET', '/api/calidad', null, ana)).data.alertas.filter(a => a.id).length, 0); // las alertas guardadas son de gerencia
assert.equal((await call('POST', '/api/calidad/nc/actualizar', { folio: nc1.folio, answers: { ...ncBase, estatus: 'CERRADO' } }, ana)).status, 400); // sin fecha de cierre
await ok('POST', '/api/calidad/nc/actualizar', { folio: nc1.folio, answers: { ...ncBase, estatus: 'CERRADO', cierre: hoy } }, ana);
assert.equal((await ok('GET', '/api/calidad', null, ana)).data.lotes.find(l => l.code === `QRO-${dia}-02`).status, 'EN PLANTA');
assert.equal((await ok('GET', '/api/calidad/registro?folio=NC-0001', null, ana)).data.status, 'CERRADO');
assert.equal((await ok('GET', '/api/calidad/registro?folio=LIB-0002', null, ana)).data.ligados[0].folio, 'NC-0001');

// Cada planta ve solo lo suyo.
await ok('POST', '/api/users', { name: 'Sara', email: 'sara@polar.test', password: pass, plant: 'Silao' }, admin);
const sara = await login('sara@polar.test');
cal = (await ok('GET', '/api/calidad', null, sara)).data;
assert.deepEqual([cal.lotes.length, cal.registros.length, cal.clientes.map(c => c.name)], [0, 0, ['Summit Silao', 'Summit Guanajuato']]);
assert.equal((await call('GET', '/api/calidad/registro?folio=REC-0001', null, sara)).status, 404);
assert.equal((await call('POST', '/api/calidad/config', { clientes: [] }, ana)).status, 403); // catálogo: solo admin

// Reporte 1 (Ana): la sección 7 toma lo recibido (REC) y entregado (LIB) de hoy; solo se captura lo procesado.
const r1 = (await ok('POST', '/api/reports', { answers: { ...base, reportes_n: '3',
  vehiculos: [{ vehiculo: 'NP300', km_ini: '100', km_fin: '150' }],
  gas: [{ tanque: 'Gas bodega / hornos', na: 'N/A', pct_ini: '40' }, { tanque: 'Gas montacargas', pct_ini: '50', pct_fin: '30', sin_carga: 'N/A', litros: '9' }],
  material: [{ cliente: 'KH México', pieza: 'P-1', cantidad: '999', entregado: '999', procesado: '4' }], // cantidad / entregado capturados se ignoran
  mantenimiento: [{ equipo: 'Horno 1', estatus: 'Abierto' }, { equipo: 'Bomba', estatus: 'Cerrado' }],
  fotos_gastos: [foto, 'malo.jpg'] } }, ana)).data;
const a1 = r1.answers, m1 = a1.material.find(m => m.pieza === 'P-1'), m2 = a1.material.find(m => m.pieza === 'P-2');
assert.equal(r1.score, null);
assert.equal(a1.reportes_n, 'N/A'); // sin reportes de personal
assert.equal(a1.vehiculos[0].recorrido, '50');
assert.deepEqual([a1.gas[0].na, a1.gas[0].pct_ini, a1.gas[0].litros], ['N/A', 'N/A', 'N/A']);
assert.deepEqual([a1.gas[1].pct_ini, a1.gas[1].sin_carga, a1.gas[1].litros, a1.gas[1].importe], ['50', 'N/A', 'N/A', 'N/A']);
assert.deepEqual([m1.cantidad, m1.entregado, m1.folio, m1.saldo_ant, m1.saldo, m1.pendientes], ['10', '10', 'REC-0001, LIB-0001', '0', '0', '6']);
assert.deepEqual([m2.cantidad, m2.entregado, m2.saldo, m2.pendientes], ['8', '0', '8', '8']); // renglón que se agregó solo
assert.deepEqual(a1.fotos_gastos, [foto]); // claves inválidas se descartan
assert.equal((await call('POST', '/api/reports', { answers: base }, ana)).status, 409); // uno por día

// Lo que se arrastra al siguiente reporte de la planta.
const d = (await ok('GET', '/api/defaults', null, beto)).data;
assert.equal(d.km.NP300, '150');
assert.deepEqual(d.pendientes.map(m => m.equipo), ['Horno 1']);
assert.deepEqual(d.lists, { clientes: ['KH México', 'Mitchell'], piezas: ['P-1', 'P-2'] });
assert.equal(d.mov['kh méxico|p-1'].recibido, 10);
assert.equal((await call('POST', '/api/reports', { answers: { ...base, vehiculos: [{ vehiculo: 'Otro' }] } }, beto)).status, 400); // camión no registrado

// Reporte 2 (Beto, misma planta y día): los movimientos de hoy ya contaron en el de Ana; saldo y pendientes se arrastran (sin importar mayúsculas).
const r2 = (await ok('POST', '/api/reports', { answers: { ...base, material: [{ cliente: 'kh méxico', pieza: 'p-1', procesado: '2' }] } }, beto)).data;
assert.deepEqual([r2.answers.material[0].cantidad, r2.answers.material[0].saldo_ant, r2.answers.material[0].saldo, r2.answers.material[0].pendientes], ['0', '0', '0', '4']);

// Corregir: solo el último de la planta; se recalcula contra los anteriores, no contra sí mismo.
assert.equal((await call('POST', '/api/reports/edit', { id: r1.id, answers: base }, ana)).status, 409);
assert.equal((await call('POST', '/api/reports/edit', { id: r2.id, answers: base }, ana)).status, 403); // no es suyo
const e2 = (await ok('POST', '/api/reports/edit', { id: r2.id, answers: { ...base, material: [{ cliente: 'KH México', pieza: 'P-1', procesado: '1' }] } }, beto)).data;
assert.deepEqual([e2.answers.material[0].saldo_ant, e2.answers.material[0].saldo, e2.answers.material[0].pendientes], ['0', '0', '5']);
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

// Vista previa del formulario: aplica la configuración sin guardarla; solo admin.
const prev = (await ok('POST', '/api/form-config/preview', { config: { sections: { 9: { hidden: true }, 2: { title: 'Gente' } } } }, admin)).data;
assert.ok(!prev.some(s => s.n === 9) && prev.find(s => s.n === 2).title === 'Gente');
assert.ok((await ok('GET', '/api/questions')).data.some(s => s.n === 9)); // no se guardó
assert.equal((await call('POST', '/api/form-config/preview', { config: {} }, beto)).status, 403);

// ---------- Nómina: solo admin y encargados con acceso; el encargado ve su planta y nunca montos ----------
const beto2 = await login('beto@polar.test');
const betoId = (await ok('GET', '/api/users', null, admin)).data.find(u => u.email === 'beto@polar.test').id;
await ok('GET', '/api/nomina', null, beto2); // el encargado nuevo ya trae acceso
await ok('POST', '/api/users/nomina', { id: betoId, nomina: false }, admin);
assert.equal((await call('GET', '/api/nomina', null, beto2)).status, 403); // el admin se lo quitó
await ok('POST', '/api/users/nomina', { id: betoId, nomina: true }, admin);
assert.equal((await call('POST', '/api/users/nomina', { id: betoId, nomina: true }, beto2)).status, 403); // asignar es solo del admin
await ok('POST', '/api/nomina/emp', { nombre: 'Luis', planta: 'Querétaro', sueldo: 2400, bono: 500, ingreso: '2024-01-15' }, admin);
await ok('POST', '/api/nomina/emp', { nombre: 'Rosa', planta: 'Silao', sueldo: 2600 }, admin);
let nom = (await ok('GET', '/api/nomina', null, beto2)).data;
assert.deepEqual(nom.emps.map(e => e.nombre), ['Luis']); // solo su planta
const luis = nom.emps[0];
assert.equal(luis.sueldo, undefined); assert.equal(luis.bono, undefined); assert.equal(luis.conBono, true); assert.equal(nom.config, null);
assert.equal((await call('POST', '/api/nomina/cerrar', { payday: hoy }, beto2)).status, 403);
// Encargado captura; un bono lo captura con monto pero ya no lo vuelve a ver.
await ok('POST', '/api/nomina/inc', { emps: [luis.id], tipo: 'falta', fecha: hoy, cantidad: 1 }, beto2);
await ok('POST', '/api/nomina/inc', { emps: [luis.id], tipo: 'bono', fecha: hoy, cantidad: 300, nota: 'Urgente' }, beto2);
assert.equal((await call('POST', '/api/nomina/inc', { emps: [luis.id], tipo: 'bono', fecha: hoy, cantidad: 300 }, beto2)).status, 400); // bono sin motivo
const rosaId = (await ok('GET', '/api/nomina', null, admin)).data.emps.find(e => e.nombre === 'Rosa').id;
assert.equal((await call('POST', '/api/nomina/inc', { emps: [rosaId], tipo: 'falta', fecha: hoy, cantidad: 1 }, beto2)).status, 404); // otra planta
nom = (await ok('GET', '/api/nomina', null, beto2)).data;
const bono = nom.incs.find(i => i.tipo === 'bono');
assert.equal(bono.cantidad, undefined);
assert.equal(nom.incs.find(i => i.tipo === 'falta').cantidad, 1);
// Al editar el bono el encargado no puede cambiar el monto.
await ok('POST', '/api/nomina/inc/edit', { id: bono.id, fecha: hoy, cantidad: 99999, nota: 'Urgente 2' }, beto2);
// Editar empleado (encargado) conserva el sueldo que puso el admin.
await ok('POST', '/api/nomina/emp', { id: luis.id, nombre: 'Luis P.', sueldo: 1, planta: 'Silao' }, beto2);
let nomA = (await ok('GET', '/api/nomina', null, admin)).data;
const luisA = nomA.emps.find(e => e.id === luis.id);
assert.deepEqual([luisA.nombre, luisA.sueldo, luisA.planta], ['Luis P.', 2400, 'Querétaro']);
assert.equal(nomA.incs.find(i => i.id === bono.id).cantidad, 300);
// Bono de puntualidad: monto del empleado, uno por mes.
await ok('POST', '/api/nomina/bono', { emps: [luis.id], mes: '2026-09' }, beto2);
assert.equal((await ok('POST', '/api/nomina/bono', { emps: [luis.id], mes: '2026-09' }, beto2)).data.n, 0);
// Cierre: marca pagadas; el encargado ya no puede borrarlas; reabrir las regresa.
nomA = (await ok('GET', '/api/nomina', null, admin)).data;
const ids = nomA.incs.map(i => i.id);
assert.equal(nomA.incs.find(i => i.tipo === 'bono_puntualidad').cantidad, 500);
await ok('POST', '/api/nomina/cerrar', { payday: '2026-10-31', total: 1, lineas: [], incIds: ids }, admin);
assert.equal((await call('POST', '/api/nomina/cerrar', { payday: '2026-10-31', incIds: ids }, admin)).status, 409);
assert.equal((await call('POST', '/api/nomina/inc/delete', { id: ids[0] }, beto2)).status, 403);
await ok('POST', '/api/nomina/reabrir', { payday: '2026-10-31' }, admin);
await ok('POST', '/api/nomina/inc/delete', { id: ids[0] }, beto2);
await ok('POST', '/api/users/nomina', { id: betoId, nomina: false }, admin);
assert.equal((await call('GET', '/api/nomina', null, beto2)).status, 403); // se le quitó el acceso

// ---------- Formatos semanales: check lists, plática y mantenimiento ----------
const qf = async kind => (await ok('GET', `/api/calidad/form?tipo=${kind}`, null, beto2)).data;
const puntos = (f, res = () => 'BIEN', obs = '') => Object.fromEntries(f.sections.filter(s => s.table).map(s => [s.table.id, s.table.fixed.map((p, i) => ({ punto: p, res: res(s, i), obs }))]));
let sem = (await ok('GET', '/api/semana', null, beto2)).data.formatos;
assert.deepEqual(sem.find(x => x.kind === 'CL21').faltan, ['NP300']); // camión registrado de Querétaro
assert.ok(sem.every(x => x.plant === 'Querétaro' && x.faltan.length));
const cl21 = await qf('CL21');
assert.deepEqual(cl21.sections[0].fields[0].options, ['NP300']);
const chk = (answers) => call('POST', '/api/calidad/cl21', { answers: { unidad: 'NP300', fecha: hoy, hora: '07:00', km: '1000', operador: 'Juan', resultado: 'APROBADA', ...answers } }, beto2);
assert.equal((await chk({ g1: [] })).status, 400); // faltan puntos
const conMal = puntos(cl21, (s, i) => s.table.id === 'g1' && i === 0 ? 'MAL' : 'BIEN');
assert.equal((await chk(conMal)).status, 400); // MAL sin observación
assert.equal((await chk({ ...puntos(cl21, (s, i) => s.table.id === 'g1' && i === 0 ? 'MAL' : 'BIEN', 'Fuga') })).status, 400); // APROBADA con falla
const c1 = (await ok('POST', '/api/calidad/cl21', { answers: { unidad: 'NP300', fecha: hoy, hora: '07:00', km: '1000', operador: 'Juan',
  resultado: 'RECHAZADA (NO SALE)', ...puntos(cl21, (s, i) => s.table.id === 'g1' && i === 0 ? 'MAL' : 'BIEN', 'Fuga') } }, beto2)).data;
assert.deepEqual([c1.folio, c1.status, c1.fallas], ['CL21-0001', 'RECHAZADA (NO SALE)', '1']);
assert.ok((await ok('GET', '/api/calidad', null, admin)).data.alertas.some(a => a.folio === 'CL21-0001')); // rechazada avisa a gerencia
// Plática: al menos un asistente; duración y total se calculan.
const pla = { fecha: hoy, hora: '08:00', hora_fin: '08:45', imparte: 'Beto', tema: 'Uso de EPP', puntos: 'Guantes y lentes' };
assert.equal((await call('POST', '/api/calidad/pla', { answers: pla }, beto2)).status, 400);
const p1 = (await ok('POST', '/api/calidad/pla', { answers: { ...pla, otros: 'Pedro, Juan' } }, beto2)).data;
assert.deepEqual([p1.duracion, p1.total, p1.status], ['45', '2', 'REALIZADA']);
// Mantenimiento: trabajo nuevo que NO FUNCIONA abre pendiente; otro MT que lo deja FUNCIONANDO lo cierra.
const mt = { fecha: hoy, tipo: 'CORRECTIVO (REPARACIÓN)', equipo: 'Bomba Rotoplas', falla: 'Sello', trabajo: 'Se cambió sello', quien: 'PERSONAL INTERNO', nombre: 'Beto', libero: 'Beto' };
await ok('POST', '/api/calidad/mt', { answers: { ...mt, pendiente: 'NO, ES UN TRABAJO NUEVO', resultado: 'NO FUNCIONA (SIGUE PENDIENTE)', refacciones: [{ cant: '1', descripcion: 'Sello', costo: '350' }], mano_obra: '200' } }, beto2);
let pend = (await ok('GET', '/api/defaults', null, beto2)).data.pendientes;
assert.ok(pend.some(m => m.equipo === 'Bomba Rotoplas'));
assert.ok((await qf('MT')).sections[0].fields[2].options.includes('Bomba Rotoplas — Sello'));
const mt2 = (await ok('POST', '/api/calidad/mt', { answers: { ...mt, pendiente: 'Bomba Rotoplas — Sello', resultado: 'FUNCIONANDO' } }, beto2)).data;
assert.equal(mt2.folio, 'MT-0002');
assert.ok(!(await ok('GET', '/api/defaults', null, beto2)).data.pendientes.some(m => m.equipo === 'Bomba Rotoplas'));
sem = (await ok('GET', '/api/semana', null, beto2)).data.formatos;
assert.deepEqual(sem.filter(x => x.faltan.length).map(x => x.kind), ['CL22', 'CL23']);

// Sesiones vencidas (más de 30 días) ya no sirven.
sqlite.prepare('UPDATE sessions SET created = 0').run();
assert.equal((await call('GET', '/api/me', null, admin)).status, 401);

console.log('OK: todas las pruebas pasaron');
