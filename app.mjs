// Lógica de la app (API). La usan server.mjs (Node + SQLite en la compu) y worker.mjs (Cloudflare Workers + D1).
// db: { get(sql, ...params), all(sql, ...params), run(sql, ...params) → { changes, lastInsertRowid } } — todos async.
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

// Cuestionario = formato PL-FOR-26 rev. 06 (Reporte diario de operación e incidencias).
// Sección 1: fecha, planta y elaboró se llenan solos; solo se pregunta el turno.
// Campo: { id, label, type: text|textarea|number|select|date|time|checks|photos, options, required, list (sugerencias), wide, after (va después de la tabla) }
// Tabla: renglones repetibles. Columnas con auto: true las calcula el servidor (no se preguntan).
const SN = ['Sí', 'No'];
const PLANTS = ['Querétaro', 'Silao']; // únicas plantas (también en public/app.js)
const badPlant = () => Object.assign(new Error('Elige una planta: Querétaro o Silao'), { code: 400 });
const FORM = [
  { n: 1, title: 'Datos generales', fields: [{ id: 'turno', label: 'Turno', type: 'select', options: ['Matutino', 'Vespertino', 'Nocturno'], required: true }] },
  { n: 2, title: 'Personal', hint: 'Tipo: F = falta, P = permiso, V = vacaciones, R = reporte (llamada de atención o acta administrativa). Una persona por renglón.',
    fields: [{ id: 'presentes', label: 'Presentes', type: 'number', required: true }, { id: 'faltas', label: 'Faltas', type: 'number' },
      { id: 'permisos', label: 'Permisos', type: 'number' }, { id: 'vacaciones', label: 'Vacaciones', type: 'number' },
      { id: 'hubo_reportes', label: '¿Hubo reportes de personal? (llamada de atención / acta)', type: 'select', options: SN, required: true, wide: true },
      { id: 'reportes_n', label: '¿Cuántos?', type: 'number' }],
    table: { id: 'personal', item: 'persona', cols: [{ id: 'nombre', label: 'Nombre', wide: true }, { id: 'tipo', label: 'Tipo', type: 'select', options: ['F', 'P', 'V', 'R'] },
      { id: 'justif', label: '¿Justif.? (faltas)', type: 'select', options: SN }, { id: 'motivo', label: 'Motivo / detalle', wide: true }, { id: 'autorizo', label: '¿Quién autorizó?', wide: true }] } },
  { n: 3, title: 'Vehículos (cada unidad que se movió hoy)', hint: 'El km / horómetro inicial se llena solo con el final de la última vez que se usó la unidad. Montacargas: anotar horómetro. Check list con más de 7 días: hacerlo antes de mover la unidad.',
    // Vehículo: sus opciones son los camiones de la planta (los registra el admin); el cliente las llena.
    table: { id: 'vehiculos', item: 'vehículo', cols: [{ id: 'vehiculo', label: 'Vehículo', type: 'select', options: [], wide: true }, { id: 'km_ini', label: 'Km / horómetro inicial', type: 'number' },
      { id: 'km_fin', label: 'Km / horóm. final', type: 'number' }, { id: 'recorrido', label: 'Recorrido', auto: true }, { id: 'checklist', label: 'Último check list', type: 'date' },
      { id: 'obs', label: 'Observaciones (fallas, golpes, llantas)', wide: true }] } },
  { n: 4, title: 'Gas', hint: 'Leer el medidor al iniciar y al terminar el día. Si hubo carga de gas, anotar litros e importe y anexar el ticket.',
    table: { id: 'gas', fixed: ['Gas bodega / hornos', 'Gas montacargas', 'Otro: '], cols: [{ id: 'tanque', label: 'Tanque' }, { id: 'na', label: 'N/A', type: 'check', disables: ['pct_ini', 'pct_fin', 'sin_carga', 'litros', 'importe'] },
      { id: 'pct_ini', label: '% inicial', type: 'number' }, { id: 'pct_fin', label: '% final', type: 'number' },
      { id: 'sin_carga', label: 'Litros cargados: N/A (no hubo carga)', type: 'check', wide: true, disables: ['litros', 'importe'] },
      { id: 'litros', label: 'Litros cargados', type: 'number' }, { id: 'importe', label: 'Importe carga ($)', type: 'number' }] },
    fields: [{ id: 'fotos_gas', label: 'Fotos de tickets', type: 'photos', wide: true, after: true }] },
  { n: 5, title: 'Hornos', hint: 'El total de hornos y de ciclos se calcula solo.', table: { id: 'hornos', item: 'horno', cols: [{ id: 'horno', label: 'Horno (Pirólisis #)' }, { id: 'ciclos', label: 'No. de ciclos', type: 'number' },
    { id: 'cliente', label: 'Cliente / material', list: 'clientes', wide: true }, { id: 'hora_ini', label: 'Hora inicio', type: 'time' }, { id: 'hora_fin', label: 'Hora fin', type: 'time' },
    { id: 'obs', label: 'Observaciones', wide: true }] } },
  { n: 6, title: 'Químicos', hint: 'Existencia: S = suficiente, PT = por terminarse, A = agotado. Si alguno está por terminarse o agotado, avisar a gerencia ese mismo día. Unidad: barril, L o kg.',
    table: { id: 'quimicos', item: 'químico', cols: [{ id: 'quimico', label: 'Químico (nombre / tipo)', wide: true }, { id: 'proceso', label: 'Proceso en que se usó', wide: true },
      { id: 'cantidad', label: 'Cantidad usada', type: 'number' }, { id: 'unidad', label: 'Unidad', type: 'select', options: ['Barril', 'L', 'Kg'] },
      { id: 'existencia', label: 'Existencia', type: 'select', options: ['S', 'PT', 'A'] }, { id: 'queda', label: '¿Cuánto queda?' }] },
    fields: [{ id: 'pedir', label: 'Otros químicos que hay que pedir (los PT y A se agregan solos)', wide: true }] },
  { n: 7, title: 'Material por cliente (piezas)', hint: 'Un renglón por cada pieza o número de parte. Si es puntie anotar (P) junto a la pieza. Se calculan solos: saldo en planta = saldo anterior + piezas − entregado; pendientes por procesar = pendientes anteriores + piezas − procesado.',
    table: { id: 'material', item: 'pieza', cols: [{ id: 'cliente', label: 'Cliente', list: 'clientes' }, { id: 'folio', label: 'Folio' },
      { id: 'cantidad', label: 'Piezas', type: 'number' }, { id: 'pieza', label: 'Modelo/No. Parte', list: 'piezas' },
      { id: 'saldo_ant', label: 'Saldo anterior', auto: true },
      { id: 'procesado', label: 'Procesado hoy', type: 'number' },
      { id: 'entregado', label: 'Entregado hoy', type: 'number' }, { id: 'saldo', label: 'Saldo en planta', auto: true },
      { id: 'pendientes', label: 'Pendientes por procesar', auto: true }] },
    fields: [{ id: 'sin_material', label: 'Clientes que no enviaron material', wide: true, after: true }] },
  { n: 8, title: 'Actividades realizadas', hint: 'Otras actividades — Tipo: R = rutinaria (se hace seguido pero no está en la lista), E = extraordinaria (trabajo especial o fuera de lo normal).',
    fields: [{ id: 'actividades', label: 'Marca las que se hicieron', type: 'checks', options: ['Recolección de material', 'Entrega de material', 'Lavado de material',
      'Proceso en pirólisis', 'Armado de carritos / pallets', 'Limpieza de hornos', 'Limpieza de bodega / áreas', 'Limpieza de baños', 'Áreas verdes (pasto / ramas)',
      'Revisión de fugas de gas', 'Nivel de aceite hidrolavadora', 'Plática de seguridad (registrar en PL-FOR-25)'] }],
    table: { id: 'otras', item: 'actividad', cols: [{ id: 'descripcion', label: 'Otra actividad / extraordinaria', wide: true }, { id: 'tipo', label: 'Tipo', type: 'select', options: ['R', 'E'] },
      { id: 'horas', label: 'Tiempo (hrs)', type: 'number' }, { id: 'quien', label: '¿Quién la hizo?', wide: true }] } },
  { n: 9, title: 'Visitas a la planta', hint: 'Tipo: PR = proveedor, CL = cliente, GO = dependencia de gobierno, EM = solicitud de empleo, IN = informes / pregunta, OT = otro. Si es dependencia de gobierno avisar a gerencia de inmediato y tomar foto de cualquier documento que deje.',
    table: { id: 'visitas', item: 'visita', cols: [{ id: 'nombre', label: 'Nombre y teléfono', wide: true }, { id: 'empresa', label: 'Empresa / dependencia' },
      { id: 'tipo', label: 'Tipo', type: 'select', options: ['PR', 'CL', 'GO', 'EM', 'IN', 'OT'] }, { id: 'motivo', label: 'Motivo de la visita', wide: true },
      { id: 'atendio', label: 'Atendió y hora' }, { id: 'seguimiento', label: '¿Requiere seguimiento?', type: 'select', options: SN }] },
    fields: [{ id: 'fotos_visitas', label: 'Fotos de documentos', type: 'photos', wide: true, after: true }] },
  { n: 10, title: 'Incidencias del día', hint: 'Tipo: GA = gas, EL = eléctrica, EQ = equipo / herramienta, SE = seguridad / accidente, CA = calidad / rechazo, CL = cliente, PE = personal. Toda falla de equipo que no se resuelva hoy se pasa a mantenimiento. Fuga de gas, falla eléctrica, incendio o accidente: avisar por teléfono a gerencia de inmediato.',
    table: { id: 'incidencias', item: 'incidencia', empty: 'SIN INCIDENCIAS', cols: [{ id: 'tipo', label: 'Tipo', type: 'select', options: ['GA', 'EL', 'EQ', 'SE', 'CA', 'CL', 'PE'] },
      { id: 'hora', label: 'Hora', type: 'time' }, { id: 'que_paso', label: 'Qué pasó', type: 'textarea', wide: true },
      { id: 'impacto', label: 'Impacto (qué se dejó de hacer / atrasos)', wide: true }, { id: 'que_se_hizo', label: 'Qué se hizo / quién autorizó', wide: true },
      { id: 'aviso', label: '¿Se avisó?', type: 'select', options: SN }] },
    fields: [{ id: 'fotos_incidencias', label: 'Fotos', type: 'photos', wide: true, after: true }] },
  { n: 11, title: 'Mantenimiento — lista de pendientes', hint: 'Los pendientes ABIERTOS del día anterior se copian solos. Un pendiente solo deja de copiarse cuando se marca CERRADO con su fecha de cierre.',
    table: { id: 'mantenimiento', item: 'pendiente', cols: [{ id: 'detectado', label: 'Fecha en que se detectó', type: 'date' }, { id: 'equipo', label: 'Equipo' },
      { id: 'falla', label: 'Falla / qué se necesita', wide: true }, { id: 'responsable', label: 'Responsable' }, { id: 'compromiso', label: 'Fecha compromiso', type: 'date' },
      { id: 'costo', label: 'Costo ($)', type: 'number' }, { id: 'estatus', label: 'Estatus', type: 'select', options: ['Abierto', 'Cerrado'] },
      { id: 'cierre', label: 'Fecha de cierre', type: 'date' }] } },
  { n: 12, title: 'Gastos del día', hint: 'Anotar TODO lo que se compre o se pague, incluyendo reparaciones, refacciones y equipo nuevo. Anexar tickets o facturas.',
    table: { id: 'gastos', item: 'gasto', cols: [{ id: 'cant', label: 'Cant.', type: 'number' }, { id: 'importe', label: 'Importe ($)', type: 'number' },
      { id: 'concepto', label: 'Concepto', wide: true }, { id: 'pago', label: 'Forma de pago', type: 'select', options: ['T. Polar', 'Efectivo'] },
      { id: 'factura', label: '¿Factura?', type: 'select', options: SN }] },
    fields: [{ id: 'fotos_gastos', label: 'Fotos de tickets / facturas', type: 'photos', wide: true, after: true }] },
  { n: 13, title: 'Pendientes para mañana', fields: [{ id: 'manana', label: 'Pendientes para mañana', type: 'textarea', required: true, wide: true }] },
];
const num = v => Number(v) || 0;
const PHOTO = /^[a-f0-9]{32}\.jpg$/; // clave de una foto subida (R2 en Cloudflare, uploads/ en la compu)
const DAY = 86_400_000, SESSION_MS = 30 * DAY;
const matKey = m => `${m.cliente}|${m.pieza}`.trim().toLowerCase();


// ---------- Personalización del formulario (admin) ----------
// Sobre el PL-FOR-26 base el admin puede: renombrar secciones y preguntas, ocultar secciones (menos la 1) y preguntas
// no protegidas, y agregar preguntas propias. Las que usan los cálculos automáticos solo se pueden renombrar.
const PROTECTED = new Set(['turno', 'presentes', 'hubo_reportes', 'reportes_n', 'manana', 'vehiculos.vehiculo', 'vehiculos.km_ini', 'vehiculos.km_fin',
  'gas.tanque', 'gas.na', 'gas.sin_carga', 'gas.litros', 'gas.importe', 'hornos.ciclos', 'quimicos.quimico', 'quimicos.existencia',
  'material.cliente', 'material.pieza', 'material.cantidad', 'material.procesado', 'material.entregado', 'mantenimiento.estatus', 'gastos.importe']);
const EXTRA_TYPES = ['text', 'textarea', 'number', 'sino', 'select', 'date', 'time'];
const keysOf = s => [...(s.fields || []).map(f => [f.id, f]), ...(s.table ? s.table.cols.map(c => [`${s.table.id}.${c.id}`, c]) : [])];
const canHide = (key, f) => !PROTECTED.has(key) && !f.required && !f.auto;

// Valida una configuración (del admin o de la IA): todo lo desconocido o no permitido se descarta.
function cleanConfig(c = {}) {
  const str = (v, n = 120) => String(v ?? '').trim().slice(0, n), out = { sections: {}, fields: {}, extra: {} }, ids = new Set();
  for (const s of FORM) {
    // Un texto igual al original no es un cambio (la IA suele copiar todo tal cual).
    const sc = c.sections?.[s.n] || {}, title = str(sc.title) === s.title ? '' : str(sc.title), hidden = s.n !== 1 && !!sc.hidden;
    if (title || hidden) out.sections[s.n] = { ...(title && { title }), ...(hidden && { hidden }) };
    for (const [key, f] of keysOf(s)) {
      const fc = c.fields?.[key] || {}, label = str(fc.label) === f.label ? '' : str(fc.label), hide = canHide(key, f) && !!fc.hidden;
      if (label || hide) out.fields[key] = { ...(label && { label }), ...(hide && { hidden: true }) };
    }
    const extra = (Array.isArray(c.extra?.[s.n]) ? c.extra[s.n] : []).slice(0, 20).map(x => {
      let id = str(x?.id, 40);
      if (!/^x_[a-z0-9_]{1,36}$/.test(id) || ids.has(id)) id = 'x_' + crypto.randomBytes(4).toString('hex');
      ids.add(id);
      const type = EXTRA_TYPES.includes(x?.type) ? x.type : 'text';
      return { id, label: str(x?.label), type, required: !!x?.required,
        ...(type === 'select' && { options: [].concat(x?.options ?? []).map(o => str(o, 60)).filter(Boolean).slice(0, 20) }) };
    }).filter(x => x.label && (x.type !== 'select' || x.options.length));
    if (extra.length) out.extra[s.n] = extra;
  }
  return out;
}

// Formulario efectivo = PL-FOR-26 base + configuración del admin. Es el que llenan los encargados y el que se valida.
function formFor(c) {
  const lab = (key, f) => ({ ...f, label: c.fields[key]?.label || f.label });
  return FORM.filter(s => !c.sections[s.n]?.hidden).map(s => {
    const fields = [...(s.fields || []).filter(f => !c.fields[f.id]?.hidden).map(f => lab(f.id, f)),
      ...(c.extra[s.n] || []).map(x => x.type === 'sino' ? { ...x, type: 'select', options: SN } : x)];
    return { ...s, title: c.sections[s.n]?.title || s.title, fields: fields.length ? fields : undefined,
      ...(s.table && { table: { ...s.table, cols: s.table.cols.filter(col => !c.fields[`${s.table.id}.${col.id}`]?.hidden).map(col => lab(`${s.table.id}.${col.id}`, col)) } }) };
  });
}

// Normaliza las respuestas al formulario efectivo; las columnas auto se ignoran (las calcula el servidor).
function clean(answers, form) {
  const str = v => String(v ?? '').trim().slice(0, 3000), out = {};
  for (const s of form) {
    for (const f of s.fields || []) {
      if (f.type === 'checks') { out[f.id] = [].concat(answers[f.id] ?? []).map(str).filter(v => f.options.includes(v)); continue; }
      if (f.type === 'photos') { out[f.id] = [].concat(answers[f.id] ?? []).map(str).filter(k => PHOTO.test(k)).slice(0, 10); continue; }
      out[f.id] = str(answers[f.id]);
      if (f.required && !out[f.id]) throw Object.assign(new Error(`Falta responder: ${s.n}. ${s.title} — ${f.label}`), { code: 400 });
    }
    if (!s.table) continue;
    const cols = s.table.cols.filter(c => !c.auto), keys = s.table.fixed ? cols.slice(1) : cols;
    out[s.table.id] = [].concat(answers[s.table.id] ?? []).slice(0, 50)
      .map(r => Object.fromEntries(cols.map(c => [c.id, str(r?.[c.id])])))
      .filter(r => keys.some(c => r[c.id]));
    // Casillas N/A: marcan como N/A los campos que desactivan (p. ej. tanque que no aplica, sin carga de gas).
    for (const r of out[s.table.id]) for (const c of cols) if (c.disables && r[c.id]) {
      r[c.id] = 'N/A';
      for (const d of c.disables) if (r[d] !== undefined && !cols.find(x => x.id === d)?.disables) r[d] = 'N/A';
    }
  }
  return out;
}

// Texto del reporte para la IA. Solo lo que tiene respuesta (los tokens cuestan): sección vacía = "(vacío)".
const formatAnswers = (a, form) => form.map(s => {
  const val = f => f.type === 'photos' ? (a[f.id]?.length ? `${a[f.id].length} foto(s)` : '') : [].concat(a[f.id] ?? '').join(', ');
  const lines = [...(s.fields || []).filter(val).map(f => `${f.label}: ${val(f)}`),
    ...(s.table ? (a[s.table.id] || []).map(r => '- ' + s.table.cols.filter(c => r[c.id]).map(c => `${c.label}: ${r[c.id]}`).join(' | ')) : [])];
  return `${s.n}. ${s.title}\n${lines.join('\n') || '(vacío)'}`;
}).join('\n');

const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
const verify = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(pw, salt, 64));
};
const httpError = (code, msg) => Object.assign(new Error(msg), { code });
// no-store: el navegador nunca usa una copia vieja de la app o del cuestionario después de un cambio.
export const NO_CACHE = { 'Cache-Control': 'no-store' };
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...NO_CACHE } });
async function body(req) {
  const s = await req.text();
  if (s.length > 100_000) throw httpError(413, 'Solicitud demasiado grande');
  try { return s ? JSON.parse(s) : {}; } catch { throw httpError(400, 'Solicitud inválida'); }
}
const parseReport = r => ({ ...r, answers: JSON.parse(r.answers) });

// files: { put(key, bytes), get(key) → cuerpo | null } — fotos JPEG (R2 en Cloudflare, carpeta uploads/ en la compu).
export function createApp({ db, files, env = {} }) {
  const { ADMIN_EMAIL = '', AI_API_KEY = '', AI_BASE_URL = 'https://api.cheaperinference.com/v1',
    AI_MODEL = 'deepseek-v4-flash', // rápido y barato (antes gpt-6-luna y gpt-oss-120b, que tardaba ~1 min)
    TZ = 'America/Mexico_City' } = env;
  // Fechas siempre en hora de México (en la nube el servidor está en UTC).
  const ymd = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: TZ });

  // Arrastre entre días por planta: último km de cada unidad, último saldo por pieza y pendientes abiertos del último reporte.
  // exclude: el reporte que se está corrigiendo (se recalcula contra los anteriores).
  async function carry(plant, exclude = 0) {
    const rows = plant ? (await db.all('SELECT answers FROM reports WHERE plant = ? AND id != ? ORDER BY date, id', plant, exclude)).map(r => JSON.parse(r.answers)) : [];
    const km = {}, saldos = {};
    for (const a of rows) {
      for (const v of a.vehiculos || []) if (v.vehiculo && v.km_fin) km[v.vehiculo] = v.km_fin;
      for (const m of a.material || []) saldos[matKey(m)] = m;
    }
    return { km, saldos, pendientes: (rows.at(-1)?.mantenimiento || []).filter(m => m.estatus !== 'Cerrado') };
  }
  const getConfig = async () => cleanConfig(JSON.parse((await db.get("SELECT value FROM settings WHERE key = 'form'"))?.value || '{}'));
  const currentForm = async () => formFor(await getConfig());

  async function ai(system, user, asJson, ms = 90_000) {
    if (!AI_API_KEY) throw new Error('Falta AI_API_KEY');
    const r = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST', signal: AbortSignal.timeout(ms),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        ...(asJson && { response_format: { type: 'json_object' } }) }),
    });
    if (!r.ok) throw new Error(`IA ${r.status}: ${await r.text()}`);
    return (await r.json()).choices[0].message.content;
  }

  async function evaluate(answers, form) {
    const out = JSON.parse(await ai(
      'Eres un supervisor que revisa el reporte diario de operación e incidencias (formato PL-FOR-26) de una planta de retrabajos industriales y limpiezas. ' +
      'Escribe siempre en español. Responde SOLO un JSON con las claves: ' +
      '"resumen" (2-3 oraciones para el administrador con lo más importante: incidencias, faltas, químicos por agotarse, gastos y pendientes), ' +
      '"calidad" (entero 0-100: qué tan completo, específico y útil es el reporte), ' +
      '"retroalimentacion" (1-2 oraciones para el encargado sobre cómo mejorar su reporte, en tono amable).',
      formatAnswers(answers, form), true));
    return { summary: String(out.resumen ?? ''), score: Math.max(0, Math.min(100, Math.round(Number(out.calidad) || 0))), feedback: String(out.retroalimentacion ?? '') };
  }

  // Limpia las respuestas y calcula los campos automáticos (para guardar o para corregir; exclude = el reporte que se corrige).
  async function prepare(plant, answers, exclude = 0) {
    const form = await currentForm(), a = clean(answers, form), { saldos } = await carry(plant, exclude);
    if (a.hubo_reportes === 'No') a.reportes_n = 'N/A';
    // Solo camiones registrados de la planta (secciones ocultas no traen tabla, de ahí el || []).
    const trucks = new Set((await db.all('SELECT name FROM trucks WHERE plant = ?', plant)).map(t => t.name));
    for (const v of a.vehiculos || []) {
      if (!trucks.has(v.vehiculo)) throw httpError(400, `El vehículo "${v.vehiculo || '(vacío)'}" no está registrado en la planta ${plant}`);
      v.recorrido = v.km_ini && v.km_fin ? String(num(v.km_fin) - num(v.km_ini)) : '';
    }
    for (const m of a.material || []) {
      m.saldo_ant = String(num(saldos[matKey(m)]?.saldo));
      m.saldo = String(num(m.saldo_ant) + num(m.cantidad) - num(m.entregado)); // las piezas del renglón son lo que entró
      m.pendientes = String(num(saldos[matKey(m)]?.pendientes) + num(m.cantidad) - num(m.procesado)); // se arrastra como el saldo
    }
    return { a, form };
  }
  // El reporte se guarda aunque la IA falle; queda sin calificación (o con la anterior, si se corrigió).
  async function grade(id, a, form) {
    try {
      const ev = await evaluate(a, form);
      await db.run('UPDATE reports SET summary = ?, score = ?, feedback = ? WHERE id = ?', ev.summary, ev.score, ev.feedback, id);
    } catch (e) { console.error('Evaluación IA falló:', e.message); }
  }

  const userOf = req => {
    const t = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.get('cookie') || '')?.[1];
    return t ? db.get("SELECT u.id, u.name, u.email, u.role, u.plant FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.created > ? AND u.status = 'activo'",
      t, Date.now() - SESSION_MS) : null;
  };
  const adminOnly = fn => (req, user, out) => user.role !== 'admin' ? json(403, { error: 'Solo admin' }) : fn(req, user, out);

  // Valida y crea una cuenta (autoregistro o creada por el admin).
  async function createUser({ name = '', email = '', password = '' }, role, status, plant = null) {
    const e = String(email).trim().toLowerCase();
    if (!String(name).trim() || !/^\S+@\S+\.\S+$/.test(e) || String(password).length < 8)
      throw httpError(400, 'Nombre, correo válido y contraseña de al menos 8 caracteres son obligatorios');
    if (await db.get('SELECT 1 FROM users WHERE email = ?', e)) throw httpError(409, 'Ese correo ya está registrado');
    if (plant !== null && !PLANTS.includes(plant)) throw badPlant();
    return (await db.run('INSERT INTO users(name, email, pass, role, status, plant) VALUES (?, ?, ?, ?, ?, ?)',
      String(name).trim().slice(0, 80), e, hash(String(password)), role, status, plant)).lastInsertRowid;
  }
  // La cookie de sesión la agrega handleApi() a la respuesta; Secure cuando el sitio va por https (Cloudflare).
  async function startSession(req, out, userId) {
    const t = crypto.randomBytes(32).toString('hex');
    await db.run('DELETE FROM sessions WHERE created < ?', Date.now() - SESSION_MS); // limpia las vencidas
    await db.run('INSERT INTO sessions(token, user_id, created) VALUES (?, ?, ?)', t, userId, Date.now());
    out.cookie = `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
  }

  const routes = {
    'GET /api/questions': async () => json(200, await currentForm()),

    // Valores que se llenan solos en el formulario (km inicial, sugerencias, pendientes abiertos).
    // ?planta= y ?excluir= (admin corrigiendo un reporte): la planta de ese reporte y el arrastre sin él.
    'GET /api/defaults': async (req, user) => {
      const q = new URL(req.url).searchParams, plant = (user.role === 'admin' && q.get('planta')) || user.plant;
      const { km, saldos, pendientes } = await carry(plant, Number(q.get('excluir')) || 0), mats = Object.values(saldos);
      const pend = Object.fromEntries(Object.entries(saldos).map(([k, m]) => [k, num(m.pendientes)])); // pendientes por procesar de días anteriores
      const trucks = await db.all('SELECT name, horometro FROM trucks WHERE plant = ? ORDER BY name', plant ?? '');
      return json(200, { km, pendientes, pend, trucks, lists: {
        clientes: [...new Set(mats.map(m => m.cliente).filter(Boolean))], piezas: [...new Set(mats.map(m => m.pieza).filter(Boolean))] } });
    },

    // Autoregistro: queda pendiente hasta que el admin lo aprueba (salvo ADMIN_EMAIL, que entra directo como admin).
    'POST /api/register': async (req, user, out) => {
      const b = await body(req);
      const isAdmin = ADMIN_EMAIL && String(b.email ?? '').trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
      const id = await createUser(b, isAdmin ? 'admin' : 'colaborador', isAdmin ? 'activo' : 'pendiente');
      if (!isAdmin) return json(200, { pending: true });
      await startSession(req, out, id);
      return json(200, { ok: true });
    },

    // 5 intentos fallidos seguidos bloquean ese correo 15 minutos (se revisa antes de scrypt, que gasta CPU).
    'POST /api/login': async (req, user, out) => {
      const { email = '', password = '' } = await body(req), e = String(email).trim().toLowerCase(), now = Date.now();
      const f = await db.get('SELECT n, until FROM login_fails WHERE email = ?', e);
      if (f?.until > now) return json(429, { error: 'Demasiados intentos fallidos. Espera 15 minutos o pide al administrador una contraseña nueva.' });
      const u = await db.get('SELECT id, pass, status FROM users WHERE email = ?', e);
      if (!u || !verify(String(password), u.pass)) {
        const n = (f?.n || 0) + 1;
        await db.run('INSERT INTO login_fails(email, n, until) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET n = excluded.n, until = excluded.until',
          e, n % 5, n >= 5 ? now + 15 * 60_000 : 0);
        return json(401, { error: 'Correo o contraseña incorrectos' });
      }
      await db.run('DELETE FROM login_fails WHERE email = ?', e);
      if (u.status !== 'activo') return json(403, { error: 'Tu cuenta está pendiente de aprobación del administrador' });
      await startSession(req, out, u.id);
      return json(200, { ok: true });
    },

    'POST /api/logout': async (req, user, out) => {
      await db.run('DELETE FROM sessions WHERE user_id = ?', user.id);
      out.cookie = 'sid=; Path=/; Max-Age=0';
      return json(200, { ok: true });
    },

    'GET /api/me': (req, user) => json(200, user),

    // Cambiar mi contraseña (pide la actual). Cierra las demás sesiones; esta sigue abierta con una sesión nueva.
    'POST /api/me/password': async (req, user, out) => {
      const { current = '', password = '' } = await body(req);
      if (String(password).length < 8) return json(400, { error: 'La contraseña nueva debe tener al menos 8 caracteres' });
      if (!verify(String(current), (await db.get('SELECT pass FROM users WHERE id = ?', user.id)).pass)) return json(400, { error: 'La contraseña actual no es correcta' });
      await db.run('UPDATE users SET pass = ? WHERE id = ?', hash(String(password)), user.id);
      await db.run('DELETE FROM sessions WHERE user_id = ?', user.id);
      await startSession(req, out, user.id);
      return json(200, { ok: true });
    },

    // Filtros opcionales: ?id=, ?desde=, ?hasta= (AAAA-MM-DD), ?planta=. El encargado solo ve los suyos.
    'GET /api/reports': async (req, user) => {
      const q = new URL(req.url).searchParams, where = [], p = [];
      if (user.role !== 'admin') { where.push('r.user_id = ?'); p.push(user.id); }
      for (const [k, sql] of [['id', 'r.id = ?'], ['desde', 'r.date >= ?'], ['hasta', 'r.date <= ?'], ['planta', 'r.plant = ?']])
        if (q.get(k)) { where.push(sql); p.push(k === 'id' ? Number(q.get(k)) : q.get(k)); }
      return json(200, (await db.all(`SELECT r.*, u.name FROM reports r JOIN users u ON u.id = r.user_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.date DESC, r.id DESC`, ...p)).map(parseReport));
    },

    'POST /api/reports': async (req, user) => {
      const { answers = {} } = await body(req);
      // La planta se guarda en el usuario la primera vez; después se llena sola.
      const plant = user.plant || String(answers.planta ?? '').trim();
      if (!PLANTS.includes(plant)) throw badPlant();
      const { a, form } = await prepare(plant, answers);
      if (!user.plant) await db.run('UPDATE users SET plant = ? WHERE id = ?', plant, user.id);
      let id;
      try {
        id = (await db.run('INSERT INTO reports(user_id, date, answers, plant) VALUES (?, ?, ?, ?)', user.id, ymd(), JSON.stringify(a), plant)).lastInsertRowid;
      } catch (e) {
        if (String(e.message).includes('UNIQUE')) return json(409, { error: 'Ya enviaste tu reporte de hoy' });
        throw e;
      }
      await grade(id, a, form);
      return json(200, parseReport(await db.get('SELECT * FROM reports WHERE id = ?', id)));
    },

    // Corregir: el encargado, su reporte de hoy; el admin, cualquiera. Solo el último de la planta,
    // porque los siguientes ya arrastraron sus km y saldos.
    'POST /api/reports/edit': async (req, user) => {
      const { id, answers = {} } = await body(req);
      const r = await db.get('SELECT id, user_id, date, plant FROM reports WHERE id = ?', Number(id));
      if (!r || (user.role !== 'admin' && (r.user_id !== user.id || r.date !== ymd()))) throw httpError(403, 'Solo puedes corregir tu reporte de hoy');
      const last = await db.get('SELECT id FROM reports WHERE plant = ? ORDER BY date DESC, id DESC LIMIT 1', r.plant);
      if (last?.id !== r.id) return json(409, { error: 'Solo se puede corregir el último reporte de la planta' });
      const { a, form } = await prepare(r.plant, answers, r.id);
      await db.run('UPDATE reports SET answers = ? WHERE id = ?', JSON.stringify(a), r.id);
      await grade(r.id, a, form);
      return json(200, parseReport(await db.get('SELECT * FROM reports WHERE id = ?', r.id)));
    },

    // Fotos: el teléfono las reduce a JPEG antes de subirlas. La clave aleatoria (128 bits) no se puede adivinar.
    // ponytail: las fotos que se suben pero no se envían en un reporte quedan huérfanas; limpiarlas si el bucket crece.
    'POST /api/upload': async req => {
      if (req.headers.get('content-type') !== 'image/jpeg') return json(400, { error: 'Solo se aceptan fotos' });
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (!bytes.length || bytes.length > 2_000_000) throw httpError(413, 'La foto pesa demasiado');
      const key = crypto.randomBytes(16).toString('hex') + '.jpg';
      await files.put(key, bytes);
      return json(200, { key });
    },

    'GET /api/files/': async req => {
      const key = new URL(req.url).pathname.slice('/api/files/'.length), f = PHOTO.test(key) && await files.get(key);
      if (!f) return json(404, { error: 'Foto no encontrada' });
      return new Response(f, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' } });
    },

    // ---- Camiones por planta (el admin los registra; el encargado solo ve los de su planta) ----
    'GET /api/trucks': async (req, user) => json(200, user.role === 'admin'
      ? await db.all('SELECT * FROM trucks ORDER BY plant, name')
      : await db.all('SELECT * FROM trucks WHERE plant = ? ORDER BY name', user.plant ?? '')),

    'POST /api/trucks': adminOnly(async req => {
      const { plant = '', name = '', horometro } = await body(req), n = String(name).trim().slice(0, 60);
      if (!PLANTS.includes(plant)) throw badPlant();
      if (!n) return json(400, { error: 'Escribe el nombre o las placas del camión' });
      try { await db.run('INSERT INTO trucks(plant, name, horometro) VALUES (?, ?, ?)', plant, n, horometro ? 1 : 0); }
      catch (e) { if (String(e.message).includes('UNIQUE')) return json(409, { error: `Ya existe "${n}" en ${plant}` }); throw e; }
      return json(200, { ok: true });
    }),

    // Los reportes ya enviados conservan el nombre del camión.
    'POST /api/trucks/delete': adminOnly(async req => {
      await db.run('DELETE FROM trucks WHERE id = ?', Number((await body(req)).id));
      return json(200, { ok: true });
    }),

    // ---- Personalización del formulario (solo admin) ----
    'GET /api/form-config': adminOnly(async () => json(200, { base: FORM, config: await getConfig(), protected: [...PROTECTED] })),

    'POST /api/form-config': adminOnly(async req => {
      const config = cleanConfig((await body(req)).config);
      await db.run("INSERT INTO settings(key, value) VALUES ('form', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(config));
      return json(200, config);
    }),

    // La IA solo PROPONE: devuelve una configuración validada que el admin revisa y aplica (o descarta).
    'POST /api/form-config/ai': adminOnly(async req => {
      const instruction = String((await body(req)).instruction ?? '').trim().slice(0, 1000);
      if (!instruction) return json(400, { error: 'Escribe qué quieres cambiar' });
      const out = JSON.parse(await ai(
        'Modificas la configuración del formulario PL-FOR-26 de una app de reportes diarios. Escribe en español. ' +
        'Responde SOLO un JSON con las claves "config" (la configuración COMPLETA nueva) y "resumen" (1-3 oraciones de lo que cambiaste). ' +
        'Formato de config: {"sections":{"<n>":{"title":"...","hidden":true}},"fields":{"<clave>":{"label":"...","hidden":true}},' +
        '"extra":{"<n>":[{"id":"x_...","label":"...","type":"text|textarea|number|sino|select|date|time","options":["..."],"required":false}]}}. ' +
        'Reglas: conserva todo lo que no se pidió cambiar; para preguntas nuevas usa id "x_" + palabras en minúsculas con guion bajo; ' +
        'type "select" requiere options; no ocultes campos con protegido=true ni la sección 1.',
        JSON.stringify({ secciones: FORM.map(s => ({ n: s.n, titulo: s.title, campos: keysOf(s).map(([k, f]) => ({ clave: k, etiqueta: f.label, protegido: !canHide(k, f) })) })),
          config_actual: await getConfig(), instruccion: instruction }), true));
      return json(200, { config: cleanConfig(out.config), resumen: String(out.resumen ?? '') });
    }),

    // ---- Cuentas (solo admin) ----
    'GET /api/users': adminOnly(async (req, user) => json(200,
      await db.all("SELECT id, name, email, plant, role, status FROM users WHERE id != ? AND status != 'eliminado' ORDER BY status = 'pendiente' DESC, name", user.id))),

    // Cambiar rol (encargado ↔ admin). Aplica en la siguiente petición: el rol se lee de la base en cada una.
    'POST /api/users/role': adminOnly(async (req, user) => {
      const { id, role } = await body(req);
      if (Number(id) === user.id) return json(400, { error: 'No puedes cambiar tu propio rol' });
      if (!['admin', 'colaborador'].includes(role)) return json(400, { error: 'Rol inválido' });
      await db.run("UPDATE users SET role = ? WHERE id = ? AND status = 'activo'", role, Number(id));
      return json(200, { ok: true });
    }),

    // Eliminar = quitar el acceso. Los reportes se conservan (son historial de la planta) y el correo queda libre.
    'POST /api/users/delete': adminOnly(async (req, user) => {
      const id = Number((await body(req)).id);
      if (id === user.id) return json(400, { error: 'No puedes eliminar tu propia cuenta' });
      await db.run("UPDATE users SET status = 'eliminado', email = 'eliminado-' || id || '-' || email WHERE id = ? AND status = 'activo'", id);
      await db.run('DELETE FROM sessions WHERE user_id = ?', id);
      return json(200, { ok: true });
    }),

    'POST /api/users': adminOnly(async req => {
      const b = await body(req);
      const role = b.role === 'admin' ? 'admin' : 'colaborador', plant = String(b.plant ?? '').trim() || null;
      if (role === 'colaborador' && !plant) throw badPlant(); // el encargado siempre tiene planta
      await createUser(b, role, 'activo', plant);
      return json(200, { ok: true });
    }),

    // Contraseña nueva (para quien la olvidó): cierra sus sesiones y quita el bloqueo por intentos fallidos.
    'POST /api/users/password': adminOnly(async req => {
      const { id, password = '' } = await body(req);
      if (String(password).length < 8) return json(400, { error: 'La contraseña debe tener al menos 8 caracteres' });
      const u = await db.get("SELECT email FROM users WHERE id = ? AND status = 'activo'", Number(id));
      if (!u) return json(400, { error: 'Cuenta no encontrada' });
      await db.run('UPDATE users SET pass = ? WHERE id = ?', hash(String(password)), Number(id));
      await db.run('DELETE FROM sessions WHERE user_id = ?', Number(id));
      await db.run('DELETE FROM login_fails WHERE email = ?', u.email);
      return json(200, { ok: true });
    }),

    'POST /api/users/approve': adminOnly(async req => {
      const { id, plant = '' } = await body(req);
      if (!PLANTS.includes(plant)) throw badPlant();
      await db.run("UPDATE users SET status = 'activo', plant = ? WHERE id = ? AND status = 'pendiente'", plant, Number(id));
      return json(200, { ok: true });
    }),

    // Rechazar = borrar la solicitud (una cuenta pendiente no tiene reportes).
    'POST /api/users/reject': adminOnly(async req => {
      await db.run("DELETE FROM users WHERE id = ? AND status = 'pendiente'", Number((await body(req)).id));
      return json(200, { ok: true });
    }),

    'GET /api/weekly': adminOnly(async () => json(200, await db.all('SELECT * FROM weekly ORDER BY id DESC'))),

    'POST /api/weekly': adminOnly(async () => {
      const start = ymd(new Date(Date.now() - 6 * DAY)), form = await currentForm();
      const rows = (await db.all('SELECT r.*, u.name FROM reports r JOIN users u ON u.id = r.user_id WHERE r.date >= ? ORDER BY u.name, r.date', start)).map(parseReport);
      if (!rows.length) return json(400, { error: 'No hay reportes en los últimos 7 días' });
      const text = await ai(
        'Eres un analista que prepara el resumen semanal de los reportes diarios de operación e incidencias (PL-FOR-26) de las plantas para gerencia. ' +
        'Escribe en español, texto plano (sin markdown), con estas secciones: Panorama general, Personal (faltas, permisos, reportes), ' +
        'Material por cliente y producción, Gas y gastos (con totales), Químicos por pedir, Incidencias y mantenimiento pendiente, ' +
        'Desempeño por encargado (incluye su calidad promedio de reporte), Recomendaciones.',
        rows.map(r => `### ${r.name} — planta ${r.plant ?? '—'} — ${r.date} (calidad: ${r.score ?? 'sin evaluar'})\n${formatAnswers(r.answers, form)}`).join('\n\n'),
        false, 300_000);
      await db.run('INSERT INTO weekly(start, end, text) VALUES (?, ?, ?)', start, ymd(), text);
      return json(200, { ok: true });
    }),
  };

  // Atiende /api/*: Request → Response (Fetch API, igual en Node y en Workers).
  return async function handleApi(req) {
    try {
      const path = new URL(req.url).pathname, route = routes[`${req.method} ${path.startsWith('/api/files/') ? '/api/files/' : path}`];
      if (!route) return json(404, { error: 'No encontrado' });
      const open = ['/api/questions', '/api/register', '/api/login'].includes(path);
      const user = await userOf(req);
      if (!open && !user) return json(401, { error: 'Inicia sesión' });
      const out = { cookie: null }, res = await route(req, user, out);
      if (out.cookie) res.headers.set('Set-Cookie', out.cookie);
      return res;
    } catch (e) {
      console.error(e);
      return json([400, 403, 409, 413].includes(e.code) ? e.code : 500, { error: e.message });
    }
  };
}
