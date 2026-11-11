// Compartido por la app de teléfono (index.html, data-mode="app") y el panel web de admin (admin.html, data-mode="web").
const WEB = document.documentElement.dataset.mode === 'web';
// Computadora = pantalla de 1024px o más (o el panel web). Decide el diseño; los permisos los decide WEB.
const DESK = matchMedia('(min-width: 1024px)');
let WIDE = WEB || DESK.matches;

// Tokens copiados del design system de Stitch ("Sapphire Pulse") para poder pegar su HTML tal cual.
tailwind.config = { theme: { extend: {
  colors: { primary: "#004ac6", "primary-container": "#2563eb", "surface-tint": "#0053db", surface: "#f8f9ff",
    "surface-container-lowest": "#ffffff", "surface-container-low": "#eff4ff", "surface-container": "#e5eeff",
    "surface-container-high": "#dce9ff", "surface-container-highest": "#d3e4fe", "on-surface": "#0b1c30",
    "on-surface-variant": "#434655", outline: "#737686", "outline-variant": "#c3c6d7", "on-primary": "#ffffff", "on-primary-container": "#eeefff",
    secondary: "#006c49", "on-secondary": "#ffffff", "secondary-container": "#6cf8bb", "on-secondary-container": "#00714d",
    tertiary: "#784b00", "on-tertiary": "#ffffff", "tertiary-fixed": "#ffddb8", "tertiary-fixed-dim": "#ffb95f", "on-tertiary-fixed": "#2a1700",
    error: "#ba1a1a", "error-container": "#ffdad6", "on-error-container": "#93000a" },
  fontSize: { "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
    "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
    "headline-sm": ["18px", { lineHeight: "26px", fontWeight: "600" }],
    "body-lg": ["16px", "24px"], "body-md": ["14px", "20px"], "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.01em" }],
    "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
    "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
    "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.03em", fontWeight: "500" }] },
  spacing: { "space-xs": "0.25rem", "space-sm": "0.5rem", "space-md": "0.75rem", "space-lg": "1rem", "space-xl": "1.5rem", margin: "1rem", gutter: "1rem" },
  fontFamily: { sans: ["Manrope", "sans-serif"] } } } };

document.head.insertAdjacentHTML('beforeend', `<style>
  .card { background: #fff; border-radius: 1rem; box-shadow: 0 1px 3px rgba(15,23,42,.05), 0 1px 2px rgba(15,23,42,.03); }
  .input { width: 100%; border-radius: .75rem; border: 1.5px solid #cbd5e1; background: #fff; padding: .75rem 1rem; outline: none; }
  .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
  .input:disabled { background: #f1f5f9; border-color: #e2e8f0; cursor: not-allowed; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 48px; border-radius: .75rem; font-weight: 600; padding: 0 1.25rem; transition: all .15s; }
  .btn-primary { background: #2563eb; color: #fff; } .btn-primary:hover { background: #1d4ed8; } .btn:disabled { opacity: .6; }
  .chip { display: inline-flex; align-items: center; gap: .35rem; padding: .15rem .6rem; border-radius: 9999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  details > summary { list-style: none; cursor: pointer; } details > summary::-webkit-details-marker { display: none; }
  @media (min-width: 1024px) { body.chrome #shell { padding-left: 16rem; } } /* espacio del menú lateral (app en computadora) */
  /* Documento PL-FOR-26 (igual al formato en papel) */
  .pl { background: #fff; color: #000; font-size: 11px; padding: 16px; max-width: 900px; margin: 0 auto; overflow-x: auto; }
  .pl table { width: 100%; border-collapse: collapse; }
  .pl th, .pl td { border: 1px solid #000; padding: 3px 6px; vertical-align: top; }
  .pl th, .pl .k { background: #dce6f1; font-weight: 700; font-size: 10px; text-transform: uppercase; }
  .pl th { text-align: center; } .pl .k { width: 35%; } .pl .c { text-align: center; font-weight: 700; }
  .pl .bar { background: #1f4e79; color: #fff; font-weight: 700; text-align: center; padding: 3px; margin-top: 10px; }
  .pl .head .bar { margin: 0; } .pl .head td:last-child { white-space: nowrap; } .pl .head .t { text-align: center; font-weight: 700; font-size: 13px; vertical-align: middle; }
  .pl .head .logo { width: 120px; text-align: center; vertical-align: middle; font-weight: 700; font-size: 18px; color: #1f4e79; letter-spacing: .1em; }
  .pl .checks { display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #000; }
  .pl .checks span { padding: 2px 6px; border-right: 1px solid #000; border-bottom: 1px solid #000; }
  .pl .hint { font-style: italic; font-size: 9px; margin: 2px 0 0; }
  .pl .firmas { margin-top: 12px; } .pl .firmas td { height: 64px; vertical-align: bottom; text-align: center; width: 50%; }
  .pl .fotos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; } .pl figure { margin: 0; break-inside: avoid; }
  .pl .fotos img { width: 100%; max-height: 360px; object-fit: contain; border: 1px solid #000; } .pl figcaption { font-size: 9px; font-style: italic; }
  @media print { [data-chrome], .no-print { display: none !important; } #app { padding: 0 !important; max-width: none !important; } .pl { padding: 0; } }
</style>`);

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymd = (d = new Date()) => d.toLocaleDateString('en-CA');
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const fdate = (d, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => {
  const s = new Date(d + 'T12:00').toLocaleDateString('es-MX', opts); return s[0].toUpperCase() + s.slice(1);
};
async function api(path, data) {
  const r = await fetch(path, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {});
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.includes('login') && path !== '/api/me') { me = null; location.hash = '#/login'; }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Error inesperado'), { data: j }); // data: p. ej. el id del reporte que ya existe
  return j;
}
let me = null, questions = [], reports = [];
let filt = { planta: '', q: '', desde: daysAgo(30), hasta: '' }; // filtros de Reportes (admin); se conservan al ir y volver de un PL-FOR-26
let calPlant = '', calFilter = 'activos', alertN = 0; // Calidad: planta elegida (admin), filtro de lotes y alertas pendientes (insignia del menú)
let visPlant = ''; // Registro de visitantes: planta elegida (admin)

function quality(score) {
  if (score == null) return { cls: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline-variant', label: 'Sin evaluar' };
  if (score >= 80) return { cls: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary', label: `Excelente · ${score}` };
  if (score >= 60) return { cls: 'bg-tertiary-fixed text-on-tertiary-fixed', dot: 'bg-tertiary', label: `Aceptable · ${score}` };
  return { cls: 'bg-error-container text-on-error-container', dot: 'bg-error', label: `Mejorable · ${score}` };
}
const qChip = s => { const q = quality(s); return `<span class="chip ${q.cls}"><span class="w-1.5 h-1.5 rounded-full ${q.dot}"></span>${q.label}</span>`; };
const avg = xs => { const v = xs.filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
function streak(dates) {
  const set = new Set(dates), d = new Date(); let n = 0;
  if (!set.has(ymd(d))) d.setDate(d.getDate() - 1);
  while (set.has(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const PLANTS = ['Querétaro', 'Silao']; // igual que en server.mjs
const plantSelect = (attrs, v = '') => `<select class="input" ${attrs}><option value="">Selecciona planta…</option>${PLANTS.map(p => `<option ${p === v ? 'selected' : ''}>${p}</option>`).join('')}</select>`;
const dmy = d => d ? d.split('-').reverse().join('/') : '';
// Acciones destructivas: el primer toque pide confirmación en el mismo botón (sin diálogos del navegador).
const confirmed = btn => btn.dataset.sure ? true : (btn.dataset.sure = 1, btn.lastChild.textContent = '¿Seguro? Toca otra vez', false);
const showErr = err => { const e = $('#err'); e.textContent = err.message; e.classList.remove('hidden'); e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
const money = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const sum = (rows, k) => (rows || []).reduce((t, x) => t + (Number(x[k]) || 0), 0);
const nInc = r => r.answers.incidencias?.length || 0;
// Descarga un CSV que Excel abre con acentos (BOM) — rows: arreglo de renglones.
function csv(name, rows) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const a = Object.assign(document.createElement('a'), { download: name,
    href: URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })) });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
// Fotos: se reducen a JPEG de máx. 1600 px antes de subirlas (una foto de teléfono pesa varios MB).
async function upload(file) {
  const img = await createImageBitmap(file), k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.7));
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob }), j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo subir la foto');
  return j.key;
}
const photoThumb = (name, k) => `<div data-photo class="relative w-20 h-20"><a href="/api/files/${esc(k)}" target="_blank"><img src="/api/files/${esc(k)}" alt="Foto" class="w-full h-full object-cover rounded-lg"></a>
  <input type="hidden" name="${name}" value="${esc(k)}"><button type="button" data-del-photo class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-error text-white flex items-center justify-center" aria-label="Quitar foto"><span class="material-symbols-outlined text-[16px]">close</span></button></div>`;
// Secciones del reporte de un día: la del domingo (lunes: true) solo va en los reportes de lunes.
const esLunes = s => new Date(s + 'T12:00:00Z').getUTCDay() === 1;
const seccionesDel = date => questions.filter(s => !s.lunes || esLunes(date));
// Claves de todas las fotos de un reporte, con el nombre de su pregunta (y las de visitas de reportes de antes del Registro de visitantes).
const photosOf = r => [...questions.flatMap(s => (s.fields || []).filter(f => f.type === 'photos').flatMap(f => [].concat(r.answers[f.id] || []).map(k => [`${s.n}. ${f.label}`, k]))),
  ...[].concat(r.answers.fotos_visitas || []).map(k => ['9. Visitas — fotos de documentos', k])];
// Sección 9 de los reportes viejos (las visitas ahora van en el Registro de visitantes): solo para imprimirlas.
const VISITAS_ANT = [['nombre', 'Nombre y teléfono'], ['empresa', 'Empresa / dependencia'], ['tipo', 'Tipo'], ['motivo', 'Motivo de la visita'],
  ['atendio', 'Atendió y hora'], ['seguimiento', '¿Requiere seguimiento?']];

// ---------- Cuestionario PL-FOR-26 (el esquema viene de /api/questions) ----------
function input(f, name, v = '') {
  const req = f.required ? 'required' : '';
  if (f.type === 'textarea') return `<textarea class="input" rows="2" name="${name}" ${req}>${esc(v)}</textarea>`;
  if (f.type === 'select') return `<select class="input" name="${name}" ${req}><option value="">Selecciona…</option>${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  if (f.type === 'check') return `<input type="checkbox" name="${name}" value="N/A" ${v ? 'checked' : ''} class="w-6 h-6 shrink-0 accent-[#2563eb]">`;
  if (f.type === 'checks') return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-1">${f.options.map(o => `<label class="flex items-center gap-3 text-body-md text-on-surface"><input type="checkbox" name="${name}" value="${esc(o)}" ${[].concat(v || []).includes(o) ? 'checked' : ''} class="w-5 h-5 shrink-0 accent-[#2563eb]">${esc(o)}</label>`).join('')}</div>`;
  if (f.type === 'photos') return `<div class="flex flex-wrap gap-3 pt-2">${[].concat(v || []).map(k => photoThumb(name, k)).join('')}
    <label class="w-20 h-20 rounded-lg border-[1.5px] border-dashed border-[#cbd5e1] flex flex-col items-center justify-center text-primary cursor-pointer">
      <span class="material-symbols-outlined">add_a_photo</span><span class="text-[11px]">Agregar</span>
      <input type="file" accept="image/*" multiple class="sr-only" data-upload="${name}"></label></div>`;
  return `<input class="input ${f.readonly ? '!bg-transparent !border-0 !px-0 font-semibold text-on-surface' : ''}" name="${name}" value="${esc(v)}" type="${['number', 'date', 'time'].includes(f.type) ? f.type : 'text'}" ${f.type === 'number' ? 'step="any" min="0" inputmode="decimal"' : ''} ${f.list ? `list="dl-${f.list}"` : ''} ${f.readonly ? 'readonly tabindex="-1"' : ''} ${req}>`;
}
// Casillas múltiples y fotos llevan sus propios <label> adentro: se envuelven en <div> (un label dentro de otro activa el control equivocado).
const labeled = (f, html, tag = ['checks', 'photos'].includes(f.type) ? 'div' : 'label') => `<${tag} class="flex ${f.type === 'check' ? 'flex-row-reverse justify-end items-center self-end h-12 gap-2' : 'flex-col gap-1'} text-label-md text-on-surface-variant ${f.type === 'checks' ? 'col-span-2 lg:col-span-4' : f.wide ? 'col-span-2' : ''}">
  <span>${esc(f.label)}${f.required ? ' <span class="text-error">*</span>' : ''}</span>${html}</${tag}>`;
let rowN = 0; // los renglones se nombran tabla.N.columna
// Sección 7: recibido / entregado del día salen de Calidad (data-pend los muestra); REC: diferencia por partida (data-dif).
const rowHtml = (t, r = {}) => {
  const i = rowN++, cols = t.cols.filter(c => !c.auto), f = id => input(cols.find(c => c.id === id), `${t.id}.${i}.${id}`, r[id]);
  const info = { material: 'data-pend class="col-span-2 self-end p-2 rounded-lg bg-tertiary-fixed/50 text-label-md text-on-tertiary-fixed"',
    partidas: 'data-dif class="col-span-2 self-end p-2 rounded-lg bg-surface-container text-label-md"',
    modelos: 'data-mod class="col-span-2 self-end p-2 rounded-lg bg-surface-container text-label-md"' }[t.id];
  // Check lists (PL-FOR-21/22/23): renglón compacto — el punto arriba y en una línea el resultado y la observación.
  // Columnas con "cuando" (PL-FOR-21): solo se ven con esas respuestas (syncCuando); "¿Qué hay que hacer?" va en su propio renglón.
  if (cols[0].id === 'punto') {
    const cu = id => { const c = cols.find(x => x.id === id); return c?.cuando ? ` data-cuando="${esc(c.cuando.join('|'))}"` : ''; };
    const ph = id => f(id).replace('<input ', `<input placeholder="${esc(cols.find(x => x.id === id).label)}" `);
    const apilado = cols.some(c => c.cuando); // PL-FOR-21: resultado, observaciones y qué hay que hacer, uno debajo de otro
    return `<div data-row class="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-low">
    <p class="text-body-md font-medium text-on-surface">${esc(r.punto)}</p><input type="hidden" name="${t.id}.${i}.punto" value="${esc(r.punto)}">
    <div class="${apilado ? 'flex flex-col' : 'grid grid-cols-[minmax(110px,auto)_1fr]'} gap-2"><label><span class="sr-only">Resultado</span>${f('res')}</label>
      <label${cu('obs')}><span class="sr-only">Observaciones</span>${ph('obs')}</label>
      ${cols.some(c => c.id === 'accion') ? `<label${cu('accion')}><span class="sr-only">¿Qué hay que hacer?</span>${ph('accion')}</label>` : ''}</div></div>`;
  }
  return `
  <div data-row class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-xl bg-surface-container-low">
    ${cols.map(c => c.nok ? labeled({ ...c, required: true }, f(c.id)).replace('<label ', '<label data-nok ') : labeled(c, f(c.id))).join('')}
    ${info ? `<p ${info} aria-live="polite"></p>` : ''}
    ${t.fixed ? '' : '<button type="button" data-del class="col-span-2 lg:col-span-4 justify-self-end text-label-sm text-error flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">delete</span>Quitar</button>'}
  </div>`; };

// Respuestas del formulario tal como están en pantalla (para enviar o guardar como borrador). secs: sus secciones.
function collect(form, secs = questions) {
  const answers = {};
  for (const [k, v] of new FormData(form)) {
    const [id, i, col] = k.split('.');
    if (col) ((answers[id] ??= {})[i] ??= {})[col] = v;
    else answers[id] = id in answers ? [].concat(answers[id], v) : v; // casillas y fotos: varios valores
  }
  for (const s of secs) if (s.table) answers[s.table.id] = Object.values(answers[s.table.id] || {});
  return answers;
}
// Fotos: se suben en cuanto se eligen; en el formulario queda su clave. Devuelve true si el cambio era de fotos.
let uploading = 0;
function handleUpload(e, after) {
  const up = e.target.dataset.upload;
  if (!up) return false;
  const box = e.target.closest('label');
  for (const file of [...e.target.files]) {
    uploading++; box.classList.add('opacity-50', 'animate-pulse');
    upload(file).then(k => { box.insertAdjacentHTML('beforebegin', photoThumb(up, k)); after(); }, showErr)
      .finally(() => { if (!--uploading) box.classList.remove('opacity-50', 'animate-pulse'); });
  }
  e.target.value = '';
  return true;
}
// Secciones de un formulario (PL-FOR-26 o de Calidad) con sus respuestas previas; rows(t) = renglones iniciales de cada tabla.
const sectionsHtml = (secs, pre, rows, extra = () => '') => secs.map(s => { const top = (s.fields || []).filter(f => !f.after); return `
  <section class="card p-4 flex flex-col gap-3">
    <h2 class="text-label-lg text-primary">${s.n}. ${esc(s.title)}</h2>
    ${s.hint ? `<p class="text-body-sm text-on-surface-variant">${esc(s.hint)}</p>` : ''}
    ${extra(s, 'top')}
    ${top.length ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${top.map(f => f.padre
      ? `<div data-padre="${esc(f.padre)}" data-cuando="${esc(f.cuando || '')}" class="col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3 border-l-4 border-primary-container/40" style="padding-left:${12 * (f.nivel || 1)}px">${labeled({ ...f, wide: true }, input(f, f.id, pre?.[f.id]))}</div>`
      : condField(f, input(f, f.id, pre?.[f.id]))).join('')}</div>` : ''}
    ${s.table ? `<div data-table="${s.table.id}" class="flex flex-col gap-2">${rows(s.table).map(r => rowHtml(s.table, r)).join('')}</div>
      ${s.table.fixed ? '' : `<button type="button" data-add="${s.table.id}" class="btn border-[1.5px] border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">add</span>Agregar ${esc(s.table.item)}</button>`}` : ''}
    ${extra(s, 'bottom')}
    ${(s.fields || []).filter(f => f.after).map(f => `<div class="grid grid-cols-2">${labeled(f, input(f, f.id, pre?.[f.id]))}</div>`).join('')}
  </section>`; }).join('');
// Campo con cond (p. ej. "¿A quién del cliente?" del aviso en la entrega): lleva data-cond y su asterisco; syncCond lo muestra y lo exige solo cuando aplica.
const condField = (f, html) => f.cond ? labeled({ ...f, required: true }, html).replace(/^\s*<(\w+) /, `<$1 data-cond="${esc(f.cond)}" `) : labeled(f, html);
const syncCond = (root, cond, on) => root.querySelectorAll(`[data-cond="${cond}"]`).forEach(box => {
  box.classList.toggle('hidden', !on);
  box.querySelectorAll('input, select, textarea').forEach(x => { x.disabled = !on; x.required = on; });
});
// Check lists con columnas "cuando" (PL-FOR-21): cada una se ve y se exige solo si el resultado del punto es uno de sus valores.
function syncCuando(root) {
  root.querySelectorAll('[data-row]').forEach(row => {
    const res = row.querySelector('[name$=".res"]')?.value || '';
    row.querySelectorAll('[data-cuando]').forEach(box => {
      const on = box.dataset.cuando.split('|').includes(res);
      box.classList.toggle('hidden', !on);
      box.querySelectorAll('input, select, textarea').forEach(x => { x.disabled = !on; x.required = on; });
    });
  });
}
// Subpreguntas: se ven solo si su pregunta padre tiene respuesta (y es la de "cuando", si la hay). Las ocultas se desactivan:
// no se envían ni se exigen (el servidor hace lo mismo).
function syncSubs(root) {
  for (const box of root.querySelectorAll('[data-padre]')) {
    const p = root.querySelector(`[name="${CSS.escape(box.dataset.padre)}"]`), v = p && !p.disabled ? p.value : '';
    const show = !!v && (!box.dataset.cuando || v === box.dataset.cuando);
    box.classList.toggle('hidden', !show);
    box.querySelectorAll('input, select, textarea').forEach(x => { x.disabled = !show; });
  }
}
// Renglones de una tabla con valores previos; las fijas (gas, criterios) siempre llevan sus renglones.
const tableRows = (t, pre) => {
  if (!t.fixed) return pre?.[t.id] || [];
  const c0 = t.cols[0].id, rs = pre?.[t.id] || []; // gas: "Otro: …" es el renglón con nombre libre
  return t.fixed.map((v, i) => rs.find(r => r[c0] === v) || (i === t.fixed.length - 1 && rs.find(r => !t.fixed.includes(r[c0]))) || { [c0]: v });
};
// Chip de estatus de lotes y registros de Calidad.
const STATUS_CLS = { 'EN PLANTA': 'bg-surface-container-high text-primary', LIBERADO: 'bg-secondary-container text-on-secondary-container',
  ENTREGADO: 'bg-surface-container text-on-surface-variant', RETENIDO: 'bg-error-container text-on-error-container', RETRABAJO: 'bg-tertiary-fixed text-on-tertiary-fixed',
  ABIERTO: 'bg-error-container text-on-error-container', CERRADO: 'bg-surface-container text-on-surface-variant',
  CONFORME: 'bg-secondary-container text-on-secondary-container', 'CON OBSERVACIONES': 'bg-tertiary-fixed text-on-tertiary-fixed',
  APROBADA: 'bg-secondary-container text-on-secondary-container', 'APROBADA CON OBSERVACIONES': 'bg-tertiary-fixed text-on-tertiary-fixed',
  'RECHAZADA (NO SALE)': 'bg-error-container text-on-error-container', FUNCIONANDO: 'bg-secondary-container text-on-secondary-container',
  'FUNCIONA PARCIALMENTE': 'bg-tertiary-fixed text-on-tertiary-fixed', 'NO FUNCIONA (SIGUE PENDIENTE)': 'bg-error-container text-on-error-container',
  REALIZADA: 'bg-secondary-container text-on-secondary-container', REGISTRADA: 'bg-secondary-container text-on-secondary-container' };
const statusChip = s => `<span class="chip ${STATUS_CLS[s] || 'bg-surface-container'}">${esc(s)}</span>`;
const KIND = { REC: ['PL-FOR-28', 'Recepción', 'inventory'], LIB: ['PL-FOR-29', 'Liberación', 'fact_check'], NC: ['PL-FOR-30', 'No conforme', 'report'],
  CL21: ['PL-FOR-21', 'Check list de camión', 'local_shipping'], CL22: ['PL-FOR-22', 'Check list de gas', 'propane_tank'],
  CL23: ['PL-FOR-23', 'Check list de horno', 'local_fire_department'], PLA: ['PL-FOR-25', 'Plática', 'record_voice_over'], MT: ['PL-FOR-35', 'Mantenimiento', 'build'],
  VIS: ['REG-VIS', 'Visita', 'how_to_reg'] };
// Equipos para el PL-FOR-35 (catálogo base de MOD-000; se puede escribir otro).
const EQUIPOS = ['Horno de pirólisis', 'Quemador / control de flama', 'Controlador / PLC', 'Hidrolavadora', 'Montacargas', 'Vehículo', 'Compresor', 'Bomba / Rotoplas',
  'Instalación de gas', 'Instalación eléctrica', 'Tanque de proceso / decapado', 'Herramienta', 'Cómputo / software', 'Edificio'];
// Documentos vigentes para consultar o imprimir (public/docs, de la carpeta "Modificaciones App Polar").
const DOCS = [['Consulta', [['PL-POL-01', 'Política de calidad', 'PL-POL-01_POLITICA_DE_CALIDAD_v1.pdf'], ['PL-DOC-07', 'Instrucciones de trabajo', 'PL-DOC-07_INSTRUCCIONES_DE_TRABAJO_v1.pdf'],
    ['RIT', 'Reglamento interior de trabajo', 'REGLAMENTO_INTERIOR_DE_TRABAJO_POLAR_v1.pdf']]],
  ['Formatos para imprimir', [['PL-FOR-25', 'Asistencia a pláticas de seguridad', 'PL-FOR-25_ASISTENCIA_PLATICAS_SEGURIDAD_v1.pdf'],
    ['PL-FOR-26', 'Reporte diario de operación e incidencias', 'PL-FOR-26_REPORTE_DIARIO_INCIDENCIAS_v8.pdf'], ['PL-FOR-28', 'Recepción de material', 'PL-FOR-28_RECEPCION_MATERIAL_TRAZABILIDAD_v1.pdf'],
    ['PL-FOR-29', 'Inspección y liberación', 'PL-FOR-29_INSPECCION_LIBERACION_v1.pdf'], ['PL-FOR-30', 'Producto no conforme', 'PL-FOR-30_PRODUCTO_NO_CONFORME_v1.pdf'],
    ['PL-FOR-35', 'Registro de mantenimiento', 'PL-FOR-35_REGISTRO_MANTENIMIENTO_v1.pdf']]]];
// Botones de los formatos de operación (obligatorios 1 vez por semana). sem: /api/semana; plants: de qué plantas se cuenta lo que falta.
const fmtButtons = (sem, plants = PLANTS) => {
  const falta = kinds => (sem?.formatos || []).filter(x => kinds.includes(x.kind) && plants.includes(x.plant)).flatMap(x => x.faltan.map(f => plants.length > 1 ? `${x.plant}: ${f}` : f));
  const btn = (href, icon, label, code, kinds) => { const f = kinds && sem ? falta(kinds) : null; return `<a href="${href}" class="card p-3 flex flex-col gap-1 hover:bg-surface-container-low ${f?.length ? 'ring-2 ring-tertiary-fixed-dim' : ''}">
    <span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">${icon}</span><span class="text-label-lg leading-tight">${label}</span></span>
    <span class="text-[11px] text-on-surface-variant">${code}</span>
    ${!f ? '' : f.length ? `<span class="text-[11px] font-semibold text-tertiary">⚠ Falta esta semana${kinds[0] === 'CL21' || plants.length > 1 ? ': ' + esc(f.join(', ')) : ''}</span>` : '<span class="text-[11px] font-semibold text-secondary">✔ Hecho esta semana</span>'}</a>`; };
  return `<div class="grid grid-cols-2 gap-2">${btn('#/fmt/MT', 'build', 'Mantenimiento / actualización', 'PL-FOR-35', ['MT'])}${btn('#/fmt/CL21', 'local_shipping', 'Check list vehículos', 'PL-FOR-21', ['CL21'])}
    ${btn('#/fmt/HG', 'local_fire_department', 'Check list horno y gas', 'PL-FOR-22 / 23', ['CL22', 'CL23'])}${btn('#/fmt/PLA', 'record_voice_over', 'Plática / capacitación', 'PL-FOR-25', ['PLA'])}
    ${btn('#/docs', 'folder_open', 'Documentos', 'Política, instrucciones, reglamento')}</div>`;
};
// Franja roja de emergencia (sección 2 del documento): llamada directa a gerencia.
const emergencia = tel => tel ? `<a href="tel:${esc(tel.replace(/[^\d+]/g, ''))}" class="no-print flex items-center gap-3 p-3 rounded-xl bg-error text-white lg:col-span-2">
  <span class="material-symbols-outlined">emergency</span><span class="text-label-md">Fuga de gas, falla eléctrica, incendio o accidente: llama a gerencia</span>
  <span class="ml-auto font-bold whitespace-nowrap flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">call</span>${esc(tel)}</span></a>` : '';
// Botones de captura de Calidad (panel del encargado y tablero).
const qButtons = () => `<div class="grid grid-cols-3 gap-2">${['REC', 'LIB', 'NC'].map(k => `<a href="#/${k.toLowerCase()}" class="card p-3 flex flex-col items-center text-center gap-1 hover:bg-surface-container-low">
  <span class="material-symbols-outlined text-primary text-[28px]">${KIND[k][2]}</span><span class="text-label-lg leading-tight">${KIND[k][1]}</span><span class="text-[11px] text-on-surface-variant">${KIND[k][0]}</span></a>`).join('')}</div>`;
// Piezas pendientes por entregar: recepciones (PL-FOR-28) abiertas con el avance de cada lote. Se cierran al entregar todo.
const pendientesHtml = (abiertas, admin) => abiertas.length ? `<section class="card p-4 flex flex-col gap-2 border-l-4 border-tertiary-fixed-dim">
  <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-tertiary">pending_actions</span>Piezas pendientes por entregar
    <span class="chip bg-tertiary-fixed text-on-tertiary-fixed">${abiertas.reduce((t, r) => t + r.total, 0)} pzas</span></h2>
  <p class="text-body-sm text-on-surface-variant">Recepciones abiertas: no se cierran hasta entregar todo lo recibido. Se puede liberar y entregar por partes.</p>
  ${abiertas.map(r => `<div class="py-2 border-t border-[#f1f5f9]">
    <p class="font-semibold flex flex-wrap items-center gap-2"><a href="#/q/${esc(r.folio)}" class="text-primary">${esc(r.folio)}</a> ${esc(r.cliente)} · remisión ${esc(r.remision)}
      <span class="chip bg-tertiary-fixed text-on-tertiary-fixed">${r.total} por entregar</span></p>
    <p class="text-[12px] text-on-surface-variant">Recibido ${dmy(r.date)}${r.compromiso ? ` · compromiso ${dmy(r.compromiso)}${r.compromiso < ymd() ? ' ⚠ vencido' : ''}` : ''}${admin ? ' · ' + esc(r.plant) : ''}</p>
    ${r.partidas.filter(x => x.porEntregar).map(x => `<div class="flex flex-wrap items-center gap-2 mt-1 text-body-sm">
      <span class="font-medium">${esc(x.lote)}</span><span class="text-on-surface-variant">${esc(x.parte)} · recibidas ${x.recibidas} · entregadas ${x.entregadas}${x.rechazadas ? ` · rechazadas ${x.rechazadas}` : ''}${x.retenidas ? ` · <b class="text-error">retenidas ${x.retenidas}</b>` : ''}${x.faltanLlegar ? ` · faltan por llegar ${x.faltanLlegar}` : ''}</span>
      <b class="text-tertiary">${x.porEntregar} por entregar</b>
      ${x.porLiberar ? `<a href="#/lib/${encodeURIComponent(x.lote)}" class="text-label-sm text-primary font-semibold">Liberar ${x.porLiberar}</a>` : ''}
      ${x.libsPorEntregar.map(f => `<a href="#/q/${esc(f)}" class="text-label-sm text-primary font-semibold">Entregar ${esc(f)}</a>`).join(' ')}</div>`).join('')}
  </div>`).join('')}</section>` : '';
// Datos con los que se abre un no conforme desde una recepción, una liberación o un lote (#/nc/REC-0001, #/nc/LIB-0001, #/nc/QRO-…).
function ncPrefill(prev, arg, f) {
  const d = prev?.data;
  if (prev?.kind === 'REC') return { cliente: d.cliente, parte: d.partidas.map(p => p.parte).join(', '), lotes: d.partidas.map(p => p.lote),
    cantidad: String(d.partidas.reduce((t, p) => t + Math.abs(Number(p.diferencia) || 0), 0) || ''), detectado: 'Recepción', descripcion: d.danos || '' };
  if (prev?.kind === 'LIB') return { cliente: d.cliente, parte: d.parte, lotes: [d.lote], cantidad: Number(d.rechazadas) ? d.rechazadas : String(sum(d.criterios, 'piezas_nok') || ''),
    detectado: 'Inspección final', descripcion: (d.criterios || []).filter(c => c.resultado === 'NOK' && c.corregido === 'No').map(c => `${c.criterio}: ${c.piezas_nok} pza — ${c.accion}`).join('\n') };
  const l = f.lotes.find(x => x.code === arg);
  return l ? { cliente: l.client, parte: l.part, lotes: [l.code] } : {};
}
const cliRow = (x = {}) => `<div data-cli class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-xl bg-surface-container-low">
  ${labeled({ label: 'Cliente' }, `<input class="input" name="name" value="${esc(x.name || '')}" maxlength="60">`)}
  ${labeled({ label: 'Planta' }, plantSelect('name="plant"', x.plant))}
  ${labeled({ label: 'Especificación particular (criterio 7 de liberación)', wide: true }, `<input class="input" name="spec" value="${esc(x.spec || '')}" maxlength="300">`)}
  <button type="button" data-del-cli class="col-span-2 lg:col-span-4 justify-self-end text-label-sm text-error flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">delete</span>Quitar</button></div>`;
const controlado = (code, rev = '00') => `<p class="hint" style="text-align:center;margin-top:10px">${code} · Rev. ${rev} · Documento controlado — impreso = copia no controlada</p>`;

// Documento PL-FOR-26 armado con las respuestas (solo admin).
function plDoc(r) {
  const a = r.answers, gas = sum(a.gas, 'importe'), gastos = sum(a.gastos, 'importe'), fotos = photosOf(r);
  const pedir = [...(a.quimicos || []).filter(q => ['PT', 'A'].includes(q.existencia)).map(q => `${q.quimico} (${q.existencia})`), a.pedir].filter(Boolean).join(', ');
  const kv = pairs => `<table><tbody>${pairs.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v) || '&nbsp;'}</td></tr>`).join('')}</tbody></table>`;
  const extra = { 5: [['Total de hornos', (a.hornos || []).length], ['Total de ciclos', sum(a.hornos, 'ciclos')]],
    6: [['⚠ Químicos que hay que pedir', pedir]],
    12: [['Total gastos', money(gastos)], ['Total cargas de gas (sección 4)', money(gas)], ['Total del día', money(gastos + gas)]] };
  return `<div class="pl">
    <table class="head"><tr><td rowspan="3" class="logo">POLAR</td><td rowspan="2" class="t">RETRABAJOS INDUSTRIALES Y LIMPIEZAS ESPECIALIZADAS POLAR</td><td class="k">Número de control</td><td>PL-FOR-26</td></tr>
      <tr><td class="k">Revisión</td><td>06</td></tr>
      <tr><td class="bar">REPORTE DIARIO DE OPERACIÓN E INCIDENCIAS</td><td class="k">Fecha emisión</td><td>OCT-2026</td></tr></table>
    ${seccionesDel(r.date).map(s => {
      const t = s.table, rows = t ? a[t.id] || [] : [], fs = s.fields || [];
      const plain = fs.filter(f => !['checks', 'photos'].includes(f.type) && f.id !== 'pedir'), after = plain.filter(f => f.after).map(f => [f.label, a[f.id]]);
      const pairs = [...(s.n === 1 ? [['Fecha', dmy(r.date)], ['Planta', r.plant], ['Elaboró', r.name]] : []),
        ...plain.filter(f => !f.after).map(f => [f.label, a[f.id]])];
      return `<div class="bar">${s.n}. ${esc(s.title.toUpperCase())}</div>
      ${pairs.length ? kv(pairs) : ''}
      ${fs.filter(f => f.type === 'checks').map(f => `<div class="checks">${f.options.map(o => `<span>${(a[f.id] || []).includes(o) ? '☒' : '☐'} ${esc(o.toUpperCase())}</span>`).join('')}</div>`).join('')}
      ${t ? `<table><thead><tr>${t.cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.length
        ? rows.map(x => `<tr>${t.cols.map(c => `<td>${esc(c.type === 'date' ? dmy(x[c.id]) : x[c.id])}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${t.cols.length}" class="c">${t.empty || '—'}</td></tr>`}</tbody></table>` : ''}
      ${after.length || extra[s.n] ? kv([...after, ...(extra[s.n] || [])]) : ''}
      ${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ''}`;
    }).join('')}
    ${a.visitas?.length ? `<div class="bar">9. VISITAS A LA PLANTA (CAPTURADAS EN EL REPORTE; HOY VAN EN EL REGISTRO DE VISITANTES)</div>
      <table><thead><tr>${VISITAS_ANT.map(([, l]) => `<th>${esc(l)}</th>`).join('')}</tr></thead>
      <tbody>${a.visitas.map(x => `<tr>${VISITAS_ANT.map(([k]) => `<td>${esc(x[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
    <table class="firmas"><tr><td>${esc(r.name)}<br><b>ELABORÓ — ENCARGADO DE PLANTA</b></td><td><b>REVISÓ — GERENCIA</b></td></tr></table>
    ${fotos.length ? `<div class="bar">ANEXOS — FOTOS</div><div class="fotos">${fotos.map(([l, k]) => `<figure><img src="/api/files/${esc(k)}" alt="${esc(l)}"><figcaption>${esc(l)}</figcaption></figure>`).join('')}</div>` : ''}
    ${controlado('PL-FOR-26', '06')}
  </div>`;
}

// Registro de Calidad (PL-FOR-28 / 29 / 30) armado como el formato en papel, para ver e imprimir.
function qDoc(r) {
  const a = r.data, kv = pairs => `<table><tbody>${pairs.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v) || '&nbsp;'}</td></tr>`).join('')}</tbody></table>`;
  const head = { REC: [['Folio', r.folio], ['Planta', r.plant], ['Recibió', r.name], ['Estatus', r.status],
      ['Entrega', r.avance?.total ? `ABIERTA — ${r.avance.total} piezas por entregar` : 'COMPLETA']],
    LIB: [['Folio', r.folio], ['Planta', r.plant], ['Cliente', a.cliente], ['No. de parte', a.parte], ['Folio REC', a.rec], ['Estatus', r.status]],
    NC: [['Folio', r.folio], ['Planta', r.plant], ['Elaboró', r.name], ['Origen', a.origen || '—'], ['¿Requiere 8D? (sugerido)', a.sugiere_8d], ['Estatus', r.status]] }[r.kind]
    || [['Folio', r.folio], ['Planta', r.plant], ['Elaboró / revisó', r.name], ['Resultado', r.status],
      ...(a.fallas ? [['Puntos con falla', a.fallas]] : []), ...(a.duracion ? [['Duración (min)', a.duracion], ['Total de asistentes', a.total]] : []),
      ...(r.kind === 'MT' ? [['Costo total', money(Number(a.total) || 0)], ...(a.sin_respaldo === 'Sí' ? [['⚠ Software', 'Sin respaldo previo']] : [])] : [])];
  const fotos = r.sections.flatMap(s => (s.fields || []).filter(f => f.type === 'photos').flatMap(f => (a[f.id] || []).map(k => [f.label, k])));
  return `<div class="pl">
    <table class="head"><tr><td rowspan="3" class="logo">POLAR</td><td rowspan="2" class="t">RETRABAJOS INDUSTRIALES Y LIMPIEZAS ESPECIALIZADAS POLAR</td><td class="k">Número de control</td><td>${r.code}</td></tr>
      <tr><td class="k">Revisión</td><td>00</td></tr>
      <tr><td class="bar">${esc(r.title.toUpperCase())}</td><td class="k">Folio</td><td>${esc(r.folio)}</td></tr></table>
    <div class="bar">DATOS DEL REGISTRO</div>${kv(head)}
    ${r.sections.map(s => {
      const fs = (s.fields || []).filter(f => f.type !== 'photos' && !(f.cond && !a[f.id])), t = s.table, rows = t ? a[t.id] || [] : [];
      return `<div class="bar">${s.n}. ${esc(s.title.toUpperCase())}</div>
        ${fs.length ? kv(fs.map(f => [f.label, f.type === 'date' ? dmy(a[f.id]) : [].concat(a[f.id] ?? '').join(', ')])) : ''}
        ${t ? `<table><thead><tr>${t.cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.length
          ? rows.map(x => `<tr>${t.cols.map(c => `<td>${esc(x[c.id])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${t.cols.length}" class="c">—</td></tr>`}</tbody></table>` : ''}
        ${r.kind === 'LIB' && s.n === 3 ? kv([['Total inspeccionadas', a.inspeccionadas], ['Total aceptadas', a.aceptadas], ['% de aceptación', `${a.pct} %`],
          ['No conformes (inspeccionadas − aceptadas)', a.rechazadas || '0']]) : ''}
        ${r.kind === 'LIB' && s.n === 5 && a.aviso_contacto ? kv([['Aviso previo al cliente (registro anterior)', `${a.aviso_contacto} · ${dmy(a.aviso_fecha)} · ${a.aviso_medio}`]]) : ''}`;
    }).join('')}
    <table class="firmas"><tr><td>${esc(r.name)}<br><b>ELABORÓ</b></td><td><b>REVISÓ — GERENCIA</b></td></tr></table>
    ${fotos.length ? `<div class="bar">ANEXOS — FOTOS</div><div class="fotos">${fotos.map(([l, k]) => `<figure><img src="/api/files/${esc(k)}" alt="${esc(l)}"><figcaption>${esc(l)}</figcaption></figure>`).join('')}</div>` : ''}
    ${controlado(r.code)}
  </div>`;
}
const logo = size => `<span class="material-symbols-outlined text-primary-container" style="font-size:${size}px;font-variation-settings:'FILL' 1">verified_user</span>`;

// ---------- Vistas ----------
const views = {
  login() {
    let mode = 'login';
    const render = () => {
      $('#app').innerHTML = `
      <div class="max-w-md mx-auto ${WEB ? 'pt-16' : ''}">
      <div class="flex flex-col items-center text-center pt-8 gap-3">
        <div class="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center">${logo(48)}</div>
        <span class="chip bg-surface-container-high text-secondary"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>${WEB ? 'PANEL DE ADMINISTRACIÓN' : 'PLATAFORMA OPERATIVA'}</span>
        <h1 class="text-3xl font-bold tracking-tight">Reporte Diario Polar</h1>
        <p class="text-on-surface-variant">${WEB ? 'Supervisa los reportes de tu equipo con resúmenes de IA' : 'Gestiona tu jornada laboral de forma ágil y ordenada'}</p>
      </div>
      <form id="auth" class="card p-5 mt-6 flex flex-col gap-4">
        ${mode === 'register' ? `<label class="flex flex-col gap-1.5 text-sm font-medium">Nombre completo<input class="input" name="name" required autocomplete="name"></label>` : ''}
        <label class="flex flex-col gap-1.5 text-sm font-medium">Correo<input class="input" name="email" type="email" required autocomplete="email" placeholder="nombre@empresa.com"></label>
        <label class="flex flex-col gap-1.5 text-sm font-medium">Contraseña<input class="input" name="password" type="password" required minlength="8" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"></label>
        <p id="err" class="text-sm text-error hidden" role="alert"></p>
        <button class="btn btn-primary w-full">${mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}<span class="material-symbols-outlined">arrow_forward</span></button>
      </form>
      <p class="text-center text-sm text-on-surface-variant mt-6">${mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        <button id="toggle" class="text-primary font-semibold">${mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</button></p>
      </div>`;
      $('#toggle').onclick = () => { mode = mode === 'login' ? 'register' : 'login'; render(); };
      $('#auth').onsubmit = async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button'); btn.disabled = true;
        try {
          const r = await api(`/api/${mode}`, Object.fromEntries(new FormData(e.target)));
          if (!r.pending) return await boot();
          $('#auth').outerHTML = `<div class="card p-5 mt-6 flex flex-col items-center text-center gap-2">
            <span class="material-symbols-outlined text-tertiary text-[40px]">hourglass_top</span>
            <p class="font-semibold">Tu cuenta fue creada</p>
            <p class="text-sm text-on-surface-variant">Está pendiente de aprobación. Podrás iniciar sesión cuando el administrador la apruebe.</p></div>`;
        }
        catch (err) { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); btn.disabled = false; }
      };
    };
    render();
  },

  // Panel web: los colaboradores usan la app del teléfono.
  soloAdmin() {
    $('#app').innerHTML = `
    <div class="max-w-md mx-auto pt-24 flex flex-col items-center text-center gap-3">
      <div class="w-16 h-16 rounded-full bg-surface-container-high text-primary flex items-center justify-center"><span class="material-symbols-outlined text-[36px]">smartphone</span></div>
      <h1 class="text-2xl font-bold">Usa la app Reporte Diario Polar</h1>
      <p class="text-on-surface-variant">Hola ${esc(me.name)}, este panel es solo para administradores. Llena tus reportes desde la app en tu teléfono.</p>
      <button data-logout class="btn btn-primary mt-2"><span class="material-symbols-outlined">logout</span>Cerrar sesión</button>
    </div>`;
  },

  // Diseño: pantalla "Dashboard Principal" del proyecto Stitch "Remix of Daily Form Dashboard".
  async inicio() {
    let cal, sem; // panel de Calidad y formatos de la semana (si fallan, el resto del inicio se muestra igual)
    let cll;
    [reports, cal, sem, cll] = await Promise.all([api('/api/reports?desde=' + daysAgo(60)), api('/api/calidad').catch(() => null), api('/api/semana').catch(() => null),
      api('/api/cll').catch(() => null)]); // racha, semana y mes; check list del líder de hoy
    const nLot = st => cal ? cal.lotes.filter(l => l.status === st).length : 0;
    const today = ymd(), todayDone = reports.find(r => r.date === today);
    const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const week = [...Array(7)].map((_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return ymd(d); });
    const dates = reports.map(r => r.date), last = reports[0];
    const weekCount = week.filter(d => dates.includes(d)).length;
    const monthPct = Math.round(100 * dates.filter(d => d.startsWith(today.slice(0, 7))).length / new Date().getDate());
    const lastTitle = !last ? '' : last.date === today ? 'Formulario de hoy' : last.date === daysAgo(1) ? 'Formulario de ayer' : 'Formulario anterior';
    const lastTime = last?.created_at ? ' • ' + new Date(last.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' hrs' : '';
    const nCli = last ? new Set((last.answers.material || []).map(m => m.cliente)).size : 0;
    const inc = last ? nInc(last) : 0;
    $('#app').innerHTML = `
    <div class="grid w-full gap-space-lg lg:grid-cols-2 lg:items-start">
      ${emergencia(cal?.tel)}
      <div class="flex flex-col pt-space-xs lg:col-span-2">
        <div class="flex items-center gap-1.5">
          <h1 class="text-headline-lg-mobile text-on-surface tracking-tight">¡Hola, ${esc(me.name.split(' ')[0])}!</h1>
          <span class="text-xl animate-bounce">👋</span>
        </div>
        <p class="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
          <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span><span>${fdate(today)}</span></p>
      </div>
      ${cll ? `<div class="flex flex-col gap-2 lg:col-span-2">${cllAvisos(cll.avisos)}${cllPanel(cll.registro, true)}
        ${cll.registro ? '' : '<a href="#/cll" class="text-label-md text-primary font-semibold">¿No vino el líder? Llenar el check list</a>'}</div>` : ''}
      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-surface-tint p-space-lg text-on-primary shadow-xl">
        <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-on-primary/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="absolute top-3 right-3 opacity-15 pointer-events-none">
          <svg fill="none" height="84" viewBox="0 0 100 100" width="84" aria-hidden="true">
            <path d="M50 8L15 24V48C15 71 30 92 50 98C70 92 85 71 85 48V24L50 8Z" stroke="currentColor" stroke-linejoin="round" stroke-width="6"></path>
            <path d="M35 50L45 60L65 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"></path></svg>
        </div>
        <div class="relative z-10 flex flex-col gap-space-md">
          ${todayDone ? `
          <div><span class="chip bg-secondary-container text-on-secondary-container">Enviado</span></div>
          <div class="flex flex-col gap-1">
            <h2 class="text-headline-sm font-bold tracking-tight">Tu reporte de hoy ya fue enviado</h2>
            <p class="text-body-md text-on-primary-container/90 leading-relaxed">${esc(todayDone.feedback || 'Gracias por reportar tu jornada.')}</p>
          </div>
          <div class="flex items-center justify-between gap-2">${qChip(todayDone.score)}
            <a href="#/editar/${todayDone.id}" class="inline-flex items-center gap-1 text-label-md text-on-primary underline underline-offset-2"><span class="material-symbols-outlined text-[16px]">edit</span>Corregir</a></div>` : `
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold shadow-sm">
              <span class="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>Acción requerida</span>
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-on-primary/15 backdrop-blur-md text-label-sm">
              <span class="material-symbols-outlined text-[15px]">timer</span>10 min</span>
          </div>
          <div class="flex flex-col gap-1">
            <h2 class="text-headline-sm font-bold tracking-tight">Tu reporte diario de hoy está pendiente</h2>
            <p class="text-body-md text-on-primary-container/90 leading-relaxed">Registra tus actividades, avances y estado de tu equipo para cerrar la jornada con éxito.</p>
          </div>
          <a href="#/nuevo" class="inline-flex items-center justify-center w-full gap-2 py-3.5 px-5 rounded-lg bg-surface-container-lowest text-primary text-label-lg shadow-md hover:bg-surface-container active:scale-[0.98] transition-all">
            Llenar formulario de hoy<span class="material-symbols-outlined text-[20px]">arrow_forward</span></a>`}
        </div>
      </div>
      ${cal ? `<div class="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-label-lg flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[20px]">verified</span>Calidad ISO 9001</h3>
          <a href="#/calidad" class="text-label-sm text-primary font-bold flex items-center gap-0.5">Ver todo<span class="material-symbols-outlined text-[16px]">chevron_right</span></a>
        </div>
        ${qButtons()}
        <p class="text-label-sm text-on-surface-variant">${nLot('EN PLANTA')} lotes en planta · ${nLot('RETENIDO')} retenidos · ${nLot('LIBERADO')} por entregar${cal.abiertas?.length ? ` · <a href="#/calidad" class="text-tertiary font-semibold">${cal.abiertas.reduce((t, r) => t + r.total, 0)} pzas pendientes de entregar</a>` : ''}
          ${cal.alertas.length ? `· <a href="#/calidad" class="text-error font-semibold">⚠ ${cal.alertas.length} ${cal.alertas.length === 1 ? 'alerta' : 'alertas'}</a>` : ''}</p>
      </div>` : ''}
      <div class="flex flex-col gap-space-sm"><h3 class="text-label-lg flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[20px]">checklist</span>Formatos de la semana</h3>
        <p class="text-label-sm text-on-surface-variant -mt-1">Obligatorios al menos 1 vez por semana (el check list de vehículos, por cada unidad).</p>${fmtButtons(sem, [me.plant])}</div>
      <div class="grid grid-cols-2 gap-space-md">
        <div class="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary">
              <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">local_fire_department</span></div>
            ${weekCount ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold">+${weekCount} esta sem.</span>` : ''}
          </div>
          <div class="mt-space-md flex flex-col">
            <div class="flex items-baseline gap-1"><span class="text-headline-lg-mobile font-bold tracking-tight">${streak(dates)}</span><span class="text-label-md text-on-surface-variant font-medium">${streak(dates) === 1 ? 'día' : 'días'}</span></div>
            <span class="text-label-sm text-on-surface-variant mt-0.5">Racha actual activa</span>
          </div>
        </div>
        <div class="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">task_alt</span></div>
            <svg class="w-8 h-8 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <path class="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
              <path class="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${monthPct}, 100" stroke-linecap="round" stroke-width="3.5"></path></svg>
          </div>
          <div class="mt-space-md flex flex-col">
            <span class="text-headline-lg-mobile font-bold tracking-tight">${monthPct}%</span>
            <span class="text-label-sm text-on-surface-variant mt-0.5">Cumplimiento del mes</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-label-lg flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[20px]">date_range</span>Resumen de la semana</h3>
          <span class="text-label-sm text-secondary font-semibold">${weekCount} / 7 completados</span>
        </div>
        <div class="grid grid-cols-7 gap-1.5 pt-space-xs">${week.map((d, i) => {
          const done = dates.includes(d), isToday = d === today;
          return `<div class="flex flex-col items-center gap-1.5 py-2 rounded-lg ${isToday ? 'bg-surface-container-highest' : 'bg-surface-container-low'} ${d > today ? (i > 4 ? 'opacity-40' : 'opacity-60') : ''}">
            <span class="text-label-sm ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}">${'LMMJVSD'[i]}</span>
            ${done ? '<div class="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center"><span class="material-symbols-outlined text-[16px] font-bold">check</span></div>'
            : isToday ? `<div class="relative w-6 h-6 flex items-center justify-center"><span class="absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75 animate-ping"></span>
                <div class="relative w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center"><span class="material-symbols-outlined text-[14px]">edit</span></div></div>`
            : '<div class="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center"><span class="w-1.5 h-1.5 rounded-full bg-outline-variant"></span></div>'}
          </div>`; }).join('')}</div>
      </div>
      ${last ? `
      <div class="flex flex-col gap-space-sm">
        <div class="flex items-center justify-between px-0.5">
          <span class="text-headline-sm">Actividad reciente</span>
          <a href="#/historial" class="text-label-sm text-primary font-bold hover:underline flex items-center gap-0.5">Ver historial completo<span class="material-symbols-outlined text-[16px]">chevron_right</span></a>
        </div>
        <div class="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-start justify-between gap-space-sm">
            <div class="flex items-start gap-space-sm">
              <div class="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container mt-0.5">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">assignment_turned_in</span></div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <h4 class="text-label-lg">${lastTitle}</h4>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">Enviado</span>
                </div>
                <p class="text-body-sm text-on-surface-variant mt-0.5">${fdate(last.date, { weekday: 'long', day: 'numeric', month: 'long' })}${lastTime}</p>
              </div>
            </div>
            <a href="#/historial" aria-label="Ver detalles" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[20px]">more_vert</span></a>
          </div>
          <div class="mt-space-md p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="text-label-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-primary">folder_open</span>Material por cliente</span>
              <span class="text-label-sm font-semibold">${nCli} ${nCli === 1 ? 'cliente reportado' : 'clientes reportados'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-label-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px] ${inc ? 'text-tertiary' : 'text-secondary'}">${inc ? 'warning' : 'check_circle'}</span>Incidencias del día</span>
              <span class="text-label-sm font-semibold ${inc ? 'text-tertiary' : 'text-secondary'}">${inc ? `${inc} ${inc === 1 ? 'incidencia' : 'incidencias'}` : 'Sin incidencias'}</span>
            </div>
          </div>
        </div>
      </div>` : ''}
      <div class="flex items-center gap-3 p-space-md rounded-xl bg-surface-container-high/60 lg:col-span-2">
        <div class="w-9 h-9 shrink-0 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[20px]">lightbulb</span></div>
        <div class="flex flex-col">
          <span class="text-label-md">Tip de productividad</span>
          <span class="text-body-sm text-on-surface-variant">Llenar tu diario antes de las 18:00 mejora la precisión de tu equipo.</span>
        </div>
      </div>
    </div>`;
  },

  // Nuevo reporte, o corregir uno ya enviado (#/editar/ID). Lo escrito se guarda como borrador en este dispositivo.
  async nuevo(editId) {
    const edit = editId ? (await api('/api/reports?id=' + Number(editId)))[0] : null;
    if (editId && !edit) throw new Error('Reporte no encontrado');
    const d = await api('/api/defaults' + (edit ? `?planta=${encodeURIComponent(edit.plant || '')}&excluir=${edit.id}&fecha=${edit.date}` : '')); rowN = 0;
    // Borrador: uno por día (y por reporte que se corrige); los de otros días se borran.
    const key = `borrador:${me.id}:${ymd()}${edit ? ':' + edit.id : ''}`;
    let draft = null;
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith('borrador:') && !k.includes(`:${ymd()}`)) localStorage.removeItem(k);
      draft = JSON.parse(localStorage.getItem(key));
    } catch {}
    const pre = draft || edit?.answers;
    // Renglones iniciales: los del borrador o del reporte; si no hay, los pendientes abiertos (mantenimiento) y, en la
    // sección 7, cada pieza con movimiento hoy en Calidad o con pendientes por procesar.
    const k = m => `${m.cliente}|${m.pieza}`.trim().toLowerCase();
    const rowsOf = t => t.fixed ? tableRows(t, pre) : pre ? pre[t.id] || [] : t.id === 'mantenimiento' ? d.pendientes
      : t.id === 'material' ? [...new Map([...d.porProcesar, ...Object.values(d.mov)].map(m => [k(m), { cliente: m.cliente, pieza: m.pieza }])).values()] : [];
    // Vehículo: solo los camiones registrados de la planta.
    const cll = await api(`/api/cll?planta=${encodeURIComponent(edit?.plant || me.plant || '')}&fecha=${edit?.date || ymd()}`).catch(() => null);
    const veh = questions.find(s => s.table?.id === 'vehiculos')?.table.cols.find(c => c.id === 'vehiculo');
    if (veh) veh.options = d.trucks.map(t => t.name);
    $('#app').innerHTML = `
    <div class="mb-3">${emergencia(d.tel)}</div>
    <p class="text-label-sm font-semibold text-primary">PL-FOR-26 · REV. 06</p>
    <h1 class="text-headline-lg-mobile tracking-tight">${edit ? 'Corregir reporte' : 'Reporte diario de operación'}</h1>
    <p class="text-body-md text-on-surface-variant mb-4">${fdate(edit?.date || ymd())}${edit ? ` · Planta ${esc(edit.plant || '—')} · ${esc(edit.name)}` : me.plant ? ' · Planta ' + esc(me.plant) : ''}</p>
    ${draft ? `<div class="rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2 bg-tertiary-fixed/50">
      <span class="text-body-md flex items-center gap-2"><span class="material-symbols-outlined text-tertiary">history</span>Recuperamos lo que llevabas escrito.</span>
      <button type="button" id="discard" class="text-label-md text-primary font-semibold">Empezar de cero</button></div>` : ''}
    ${cll ? `<div class="mb-4">${cllPanel(cll.registro, true)}</div>` : ''}
    ${Object.entries(d.lists).map(([k, xs]) => `<datalist id="dl-${k}">${xs.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`).join('')}
    <form id="report" class="flex flex-col gap-4">
      ${sectionsHtml(seccionesDel(edit?.date || ymd()), pre, rowsOf, (s, at) => at === 'top'
        ? (s.table?.id === 'vehiculos' && !d.trucks.length ? '<p class="text-body-sm text-error">Tu planta no tiene camiones registrados. Pide al administrador que los agregue.</p>' : '')
          + (s.lunes ? '<p class="text-body-sm font-semibold text-tertiary flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">event</span>Reporte de lunes: incluye lo que el personal te avisó del domingo.</p>' : '')
          + (s.n === 1 && !me.plant && !edit ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${labeled({ label: 'Planta', required: true, wide: true }, plantSelect('name="planta" required', pre?.planta))}</div>` : '')
        : s.table?.id === 'hornos' ? '<p data-total-hornos class="p-3 rounded-xl bg-surface-container-high/60 text-label-lg text-primary" aria-live="polite"></p>' : '')}
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <button class="btn btn-primary w-full"><span class="material-symbols-outlined">send</span>${edit ? 'Guardar corrección' : 'Enviar reporte'}</button>
    </form>`;
    const form = $('#report');
    let ready = false; // no guardar borrador mientras se arma la pantalla
    const save = () => { if (ready) try { localStorage.setItem(key, JSON.stringify(collect(form))); } catch {} };
    if (draft) $('#discard').onclick = () => { try { localStorage.removeItem(key); } catch {} views.nuevo(editId); };
    form.onclick = e => {
      const add = e.target.closest('[data-add]'), del = e.target.closest('[data-del]'), delPhoto = e.target.closest('[data-del-photo]');
      if (add) form.querySelector(`[data-table="${add.dataset.add}"]`).insertAdjacentHTML('beforeend', rowHtml(questions.find(s => s.table?.id === add.dataset.add).table));
      if (del) del.closest('[data-row]').remove();
      if (delPhoto) delPhoto.closest('[data-photo]').remove();
      if (add || del || delPhoto) save();
      totalHornos(); pendientes();
    };
    // Sección 5: total de hornos y de ciclos, en vivo.
    const totalHornos = () => {
      const rows = [...form.querySelectorAll('[data-table="hornos"] [data-row]')], p = form.querySelector('[data-total-hornos]');
      if (p) p.textContent = `Total de hornos: ${rows.length} · Total de ciclos: ${sum(rows.map(r => ({ c: r.querySelector('[name$=".ciclos"]')?.value })), 'c')}`;
    };
    // Sección 7: recibido / entregado de hoy vienen de Calidad (PL-FOR-28 / 29); pendientes = anteriores + recibido − procesado. El servidor lo recalcula al guardar.
    const pendientes = () => form.querySelectorAll('[data-table="material"] [data-row]').forEach(r => {
      const v = id => r.querySelector(`[name$=".${id}"]`)?.value ?? '', key = `${v('cliente')}|${v('pieza')}`.trim().toLowerCase(), info = r.querySelector('[data-pend]');
      if (!info) return;
      const prev = d.pend[key] || 0, m = d.mov[key] || { recibido: 0, entregado: 0, folios: [] };
      info.textContent = `Recibido hoy: ${m.recibido} · Entregado hoy: ${m.entregado}${m.folios.length ? ` (${m.folios.join(', ')})` : ''} · `
        + `Pendientes por procesar: ${prev + m.recibido - (Number(v('procesado')) || 0)}` + (prev ? ` (incluye ${prev} de días anteriores)` : '');
    });
    form.oninput = () => { totalHornos(); pendientes(); save(); };
    form.onchange = e => {
      if (handleUpload(e, save)) return;
      // Km inicial = km final de la última vez que se usó la unidad.
      const n = e.target.name || '', ini = n.endsWith('.vehiculo') && form.elements[n.replace(/vehiculo$/, 'km_ini')];
      if (ini && !ini.value && d.km[e.target.value]) ini.value = d.km[e.target.value];
      // Sección 2: sin reportes de personal → "¿Cuántos?" = N/A; con reportes → obligatorio.
      if (n === 'hubo_reportes') {
        const c = form.elements.reportes_n, no = e.target.value === 'No';
        if (c) { Object.assign(c, { disabled: no, required: e.target.value === 'Sí', placeholder: no ? 'N/A' : '' }); if (no) c.value = ''; }
      }
      // Casillas N/A (gas): desactivan los campos de su lista "disables"; se recalcula todo el renglón.
      const row = e.target.closest('[data-row]'), t = questions.find(s => s.table?.id === n.split('.')[0])?.table;
      if (e.target.type === 'checkbox' && row && t?.cols.some(c => c.disables)) {
        const el = id => row.querySelector(`[name$=".${id}"]`);
        row.querySelectorAll('input').forEach(x => x.disabled = false);
        for (const c of t.cols) if (c.disables && el(c.id).checked) c.disables.forEach(d => {
          const x = el(d); x.disabled = true; x.type === 'checkbox' ? (x.checked = false) : (x.value = '');
        });
      }
      save();
    };
    // Con respuestas previas (borrador o corrección): dejar desactivado lo que corresponde, como si se hubiera elegido a mano.
    form.querySelectorAll('[name=hubo_reportes], [data-row] input[type=checkbox]:checked').forEach(x => x.dispatchEvent(new Event('change', { bubbles: true })));
    syncSubs(form); totalHornos(); pendientes(); ready = true;
    form.onsubmit = async e => {
      e.preventDefault();
      if (uploading) return showErr(new Error('Espera a que terminen de subir las fotos'));
      const btn = e.target.querySelector('button[class*=btn-primary]'), label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Analizando con IA…';
      const answers = collect(form);
      try {
        const r = await api(edit ? '/api/reports/edit' : '/api/reports', edit ? { id: edit.id, answers } : { answers });
        try { localStorage.removeItem(key); } catch {}
        if (!edit) me = await api('/api/me'); // la planta se guarda con el primer reporte
        $('#app').innerHTML = `
        <div class="flex flex-col items-center text-center gap-3 pt-6">
          <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span class="material-symbols-outlined text-[36px]">task_alt</span></div>
          <h1 class="text-2xl font-bold">${edit ? '¡Reporte corregido!' : '¡Reporte enviado!'}</h1>
          ${r.score != null ? `<p class="text-sm text-on-surface-variant">Calidad del reporte</p><p class="text-5xl font-bold text-primary">${r.score}</p>${qChip(r.score)}`
            : '<p class="text-sm text-on-surface-variant">El reporte se guardó; la evaluación de calidad no estuvo disponible.</p>'}
          ${r.feedback ? `<div class="card p-4 text-left w-full mt-2"><p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">lightbulb</span>Cómo mejorar</p><p class="text-sm mt-1">${esc(r.feedback)}</p></div>` : ''}
          <a href="#/${me.role === 'admin' ? 'admin' : 'inicio'}" class="btn btn-primary w-full mt-2">${me.role === 'admin' ? 'Volver a reportes' : 'Volver al inicio'}</a>
        </div>`;
      } catch (err) {
        showErr(err); btn.disabled = false; btn.innerHTML = label;
        // Ya hay reporte de la planta hoy: se ofrece corregirlo (lo escrito queda en el borrador).
        if (err.data?.id) $('#err').insertAdjacentHTML('beforeend', ` <a href="#/editar/${Number(err.data.id)}" class="font-semibold underline">Corregir el reporte de hoy</a>`);
      }
    };
  },
  editar: id => views.nuevo(id),

  async historial() {
    $('#app').innerHTML = `
    <p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">shield</span>MIS REPORTES</p>
    <h1 class="text-2xl font-semibold tracking-tight mb-4">Historial</h1>
    <div class="grid grid-cols-2 gap-3 mb-4 lg:max-w-md">${labeled({ label: 'Desde' }, `<input class="input" type="date" id="h-desde" value="${daysAgo(90)}">`)}
      ${labeled({ label: 'Hasta' }, '<input class="input" type="date" id="h-hasta">')}</div>
    <p id="err" class="text-sm text-error hidden mb-2" role="alert"></p>
    <div id="hist" class="grid gap-3 lg:grid-cols-2 lg:items-start"></div>`;
    const load = async () => {
      reports = await api(`/api/reports?desde=${$('#h-desde').value}&hasta=${$('#h-hasta').value}`);
      $('#hist').innerHTML = reports.length ? reports.map(r => reportCard(r, false, r.date === ymd())).join('') : '<p class="text-on-surface-variant text-sm">No tienes reportes en esas fechas.</p>';
    };
    $('#h-desde').onchange = $('#h-hasta').onchange = () => load().catch(showErr);
    await load();
  },

  async admin() {
    let users, week;
    let sem, cal;
    let cll;
    [week, users, sem, cal, cll] = await Promise.all([api('/api/reports?desde=' + daysAgo(6)), api('/api/users'), api('/api/semana').catch(() => null), api('/api/calidad').catch(() => null),
      api('/api/cll?planta=' + encodeURIComponent(PLANTS[0])).catch(() => null)]);
    users = users.filter(u => u.role === 'colaborador' && u.status === 'activo');
    const today = week.filter(r => r.date === ymd());
    const team = users.map(u => {
      const mine = week.filter(r => r.user_id === u.id);
      return { ...u, today: today.some(r => r.user_id === u.id), count: mine.length, score: avg(mine.map(r => r.score)) };
    });
    const tables = questions.filter(s => s.table);
    // Semáforo de gerencia (MOD-005): sale del último reporte de cada planta en la semana.
    const last = PLANTS.map(p => week.find(r => r.plant === p)).filter(Boolean);
    const rows = (list, id, keep, txt) => list.flatMap(r => (r.answers[id] || []).filter(keep).map(x => `${r.plant} · ${txt(x, r)}`));
    const abiertos = rows(last, 'mantenimiento', m => m.estatus !== 'Cerrado', m => `${m.equipo || ''} — ${m.falla || ''}`);
    const luces = [
      ['Plantas sin reporte hoy', PLANTS.filter(p => !today.some(r => r.plant === p)), 'red'],
      ['Pendientes de mantenimiento abiertos', abiertos, 'yellow'],
      ['Pendientes con más de 7 días', rows(last, 'mantenimiento', m => m.estatus !== 'Cerrado' && m.detectado && m.detectado < daysAgo(7), m => `${m.equipo || ''} — ${m.falla || ''} (desde ${m.detectado.split('-').reverse().join('/')})`), 'red'],
      ['Incidencias críticas de la semana', rows(week, 'incidencias', i => ['GA', 'EL', 'SE'].includes(i.tipo), (i, r) => `${r.date.split('-').reverse().join('/')} ${i.tipo}: ${i.que_paso || ''}`), 'red'],
      ['Químicos por pedir', rows(last, 'quimicos', q => ['PT', 'A'].includes(q.existencia), q => `${q.quimico} (${q.existencia})`), 'yellow'],
      ['Vehículos con check list vencido', rows(last, 'vehiculos', v => v.vehiculo && (!v.checklist || v.checklist < daysAgo(7)), v => `${v.vehiculo} (${v.checklist ? v.checklist.split('-').reverse().join('/') : 'sin registro'})`), 'red'],
      ['Check list del líder', (cll?.avisos || []).map(a => a.text), (cll?.avisos || []).some(a => a.nivel === 'red') ? 'red' : 'yellow'],
      ['Piezas pendientes por entregar', (cal?.abiertas || []).map(r => `${r.plant} · ${r.folio} ${r.cliente}: ${r.total} pzas`), 'yellow'],
      ['Formatos de la semana pendientes', (sem?.formatos || []).flatMap(x => x.faltan.map(f => `${x.plant} · ${x.code} ${x.title}${x.kind === 'CL21' ? ': ' + f : ''}`)), 'red']];
    $('#app').innerHTML = `
    <h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Reportes del equipo</h1>
    <p class="text-sm text-on-surface-variant">${fdate(ymd())}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 ${WIDE ? 'lg:grid-cols-3' : ''} gap-2 mt-4">
      ${luces.map(([l, items, mal]) => `<details class="card p-3"><summary class="flex items-center gap-2 cursor-pointer text-sm font-medium">
        <span class="w-3 h-3 rounded-full shrink-0 ${items.length ? (mal === 'red' ? 'bg-red-600' : 'bg-amber-400') : 'bg-green-600'}"></span>
        <span class="flex-1">${l}</span><span class="font-bold">${items.length}</span></summary>
        <ul class="mt-2 text-[12px] text-on-surface-variant list-disc pl-5">${items.map(t => `<li>${esc(t)}</li>`).join('') || '<li>Todo en orden</li>'}</ul></details>`).join('')}
    </div>
    <div class="grid ${WIDE ? 'grid-cols-4' : 'grid-cols-3'} gap-3 my-4">
      ${[['Reportaron hoy', `${today.length}/${users.length}`, 'today'], ['Reportes 7 días', week.length, 'date_range'],
         ['Calidad prom. semana', avg(week.map(r => r.score)) ?? '—', 'grade'],
         ...(WIDE ? [['Incidencias 7 días', week.reduce((t, r) => t + nInc(r), 0), 'warning']] : [])]
        .map(([l, v, i]) => `<div class="card ${WIDE ? 'p-5' : 'p-3'}"><span class="material-symbols-outlined text-primary">${i}</span><p class="text-2xl font-bold mt-1">${v}</p><p class="text-[11px] text-on-surface-variant">${l}</p></div>`).join('')}
    </div>
    <div class="${WIDE ? 'grid grid-cols-[minmax(0,1fr)_360px] gap-6 items-start' : 'flex flex-col gap-4'}">
      <div>
        <div id="filtros" class="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3 items-end">
          ${labeled({ label: 'Planta' }, `<select class="input" name="planta"><option value="">Todas</option>${PLANTS.map(p => `<option ${p === filt.planta ? 'selected' : ''}>${p}</option>`).join('')}</select>`)}
          ${labeled({ label: 'Buscar' }, `<input class="input" name="q" value="${esc(filt.q)}" placeholder="Nombre, texto…">`)}
          ${labeled({ label: 'Desde' }, `<input class="input" type="date" name="desde" value="${filt.desde}">`)}
          ${labeled({ label: 'Hasta' }, `<input class="input" type="date" name="hasta" value="${filt.hasta}">`)}
          ${labeled({ label: 'Exportar a Excel (CSV)', wide: true }, `<select class="input" id="x-sec"><option value="resumen">Resumen por reporte</option>
            ${tables.map(s => `<option value="${s.table.id}">${s.n}. ${esc(s.title)}</option>`).join('')}</select>`)}
          <button type="button" id="x-go" class="btn border-[1.5px] border-[#cbd5e1] text-primary col-span-2"><span class="material-symbols-outlined">download</span>Descargar CSV</button>
        </div>
        <p id="err" class="text-sm text-error hidden mb-2" role="alert"></p>
        <div id="list" class="flex flex-col gap-3"></div>
      </div>
      <div class="card p-4 ${WIDE ? 'sticky top-6' : 'order-first'}">
        <h3 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">groups</span>Equipo · últimos 7 días</h3>
        ${team.length ? `<table class="w-full text-sm">
          <thead><tr class="text-left text-[11px] uppercase tracking-wide text-on-surface-variant"><th class="py-2 font-semibold">Colaborador</th><th class="font-semibold">Hoy</th><th class="font-semibold text-center">7d</th><th class="font-semibold text-right">Calidad</th></tr></thead>
          <tbody>${team.map(u => `<tr class="border-t border-[#f1f5f9]">
            <td class="py-2 pr-2"><p class="font-medium">${esc(u.name)}</p><p class="text-[11px] text-on-surface-variant">${esc(u.plant || 'Sin planta')} · ${esc(u.email)}</p></td>
            <td>${u.today ? '<span class="material-symbols-outlined text-secondary" title="Reportó hoy">check_circle</span>' : '<span class="chip bg-tertiary-fixed text-on-tertiary-fixed">Pendiente</span>'}</td>
            <td class="text-center">${u.count}</td>
            <td class="text-right font-semibold">${u.score ?? '—'}</td></tr>`).join('')}</tbody></table>`
          : '<p class="text-sm text-on-surface-variant">Aún no hay colaboradores registrados.</p>'}
      </div>
    </div>`;
    const shown = () => reports.filter(r => JSON.stringify(r).toLowerCase().includes(filt.q.toLowerCase()));
    const draw = () => {
      const list = shown();
      $('#list').innerHTML = list.length ? list.map(r => reportCard(r, true, true)).join('') : '<p class="text-on-surface-variant text-sm">Sin reportes con esos filtros.</p>';
    };
    // Planta y fechas se piden al servidor; la búsqueda de texto filtra lo que ya se bajó.
    const load = async () => {
      reports = await api(`/api/reports?${new URLSearchParams({ planta: filt.planta, desde: filt.desde, hasta: filt.hasta })}`);
      draw();
    };
    $('#filtros').oninput = e => {
      if (!e.target.name) return;
      filt[e.target.name] = e.target.value;
      e.target.name === 'q' ? draw() : load().catch(showErr);
    };
    $('#x-go').onclick = () => {
      const sec = $('#x-sec').value, list = shown(), t = tables.find(s => s.table.id === sec)?.table;
      csv(`PL-FOR-26_${sec}_${filt.desde || 'inicio'}_${filt.hasta || ymd()}.csv`, sec === 'resumen'
        ? [['Fecha', 'Planta', 'Elaboró', 'Turno', 'Presentes', 'Calidad', 'Gastos ($)', 'Cargas de gas ($)', 'Incidencias', 'Resumen IA'],
          ...list.map(r => [r.date, r.plant, r.name, r.answers.turno, r.answers.presentes, r.score ?? 'Sin evaluar', sum(r.answers.gastos, 'importe'),
            sum(r.answers.gas, 'importe'), nInc(r), r.summary])]
        : [['Fecha', 'Planta', 'Elaboró', ...t.cols.map(c => c.label)],
          ...list.flatMap(r => (r.answers[t.id] || []).map(x => [r.date, r.plant, r.name, ...t.cols.map(c => x[c.id])]))]);
    };
    await load();
  },

  async semanal() {
    // 30 días: los totales usan 7; mantenimiento abierto usa el último reporte de cada planta.
    const [list, all] = await Promise.all([api('/api/weekly'), api('/api/reports?desde=' + daysAgo(30))]);
    const wk = all.filter(r => r.date >= daysAgo(6)), latest = {};
    for (const r of all) latest[r.plant] ??= r; // vienen del más reciente al más viejo
    const open = Object.values(latest).reduce((t, r) => t + (r.answers.mantenimiento || []).filter(m => m.estatus !== 'Cerrado').length, 0);
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-3xl' : ''}">
    <h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Resumen semanal</h1>
    <p class="text-sm text-on-surface-variant mb-4">Totales de los PL-FOR-26 de los últimos 7 días y resumen generado con IA. Solo visible para el administrador.</p>
    <div class="grid grid-cols-2 ${WIDE ? 'md:grid-cols-4' : ''} gap-3 mb-4">
      ${[['Gastos', money(wk.reduce((t, r) => t + sum(r.answers.gastos, 'importe'), 0)), 'payments'],
         ['Cargas de gas', money(wk.reduce((t, r) => t + sum(r.answers.gas, 'importe'), 0)), 'local_gas_station'],
         ['Incidencias', wk.reduce((t, r) => t + nInc(r), 0), 'warning'], ['Mantenimiento abierto', open, 'build']]
        .map(([l, v, i]) => `<div class="card p-4"><span class="material-symbols-outlined text-primary">${i}</span><p class="text-xl font-bold mt-1">${v}</p><p class="text-[11px] text-on-surface-variant">${l}</p></div>`).join('')}
    </div>
    <button id="gen" class="btn btn-primary ${WIDE ? '' : 'w-full'}"><span class="material-symbols-outlined">auto_awesome</span>Generar resumen de esta semana</button>
    <p id="err" class="text-sm text-error hidden mt-2" role="alert"></p>
    <div class="flex flex-col gap-3 mt-4">${list.map((w, i) => `
      <details class="card p-4" ${i === 0 ? 'open' : ''}>
        <summary class="flex items-center justify-between font-semibold">
          <span>${fdate(w.start, { day: 'numeric', month: 'short' })} – ${fdate(w.end, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span class="material-symbols-outlined text-on-surface-variant">expand_more</span></summary>
        <p class="text-sm whitespace-pre-wrap mt-3 leading-relaxed">${esc(w.text)}</p>
      </details>`).join('') || '<p class="text-on-surface-variant text-sm">Aún no hay resúmenes semanales.</p>'}</div>
    </div>`;
    $('#gen').onclick = async e => {
      const btn = e.currentTarget; btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Generando…';
      try { await api('/api/weekly', {}); views.semanal(); }
      catch (err) { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span>Generar resumen de esta semana'; }
    };
  },

  // Aprobar/rechazar solicitudes de registro y crear cuentas (solo admin).
  async cuentas() {
    const users = await api('/api/users'), pend = users.filter(u => u.status === 'pendiente'), act = users.filter(u => u.status !== 'pendiente');
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-3xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Cuentas</h1>
        <p class="text-sm text-on-surface-variant">Aprueba las solicitudes nuevas o crea cuentas para tu equipo.</p></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <section id="pend" class="card p-4 flex flex-col gap-3">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-tertiary">pending</span>Solicitudes pendientes (${pend.length})</h2>
        ${pend.length ? pend.map(u => `
        <div data-id="${u.id}" class="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low">
          <div><p class="font-medium">${esc(u.name)}</p><p class="text-xs text-on-surface-variant">${esc(u.email)}</p></div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex-1 min-w-[160px]">${plantSelect(`data-plant aria-label="Planta de ${esc(u.name)}"`, u.plant)}</div>
            <button data-approve class="btn btn-primary"><span class="material-symbols-outlined">check</span>Aprobar</button>
            <button data-reject class="btn border-[1.5px] border-[#cbd5e1] text-error"><span class="material-symbols-outlined">close</span>Rechazar</button>
          </div></div>`).join('') : '<p class="text-sm text-on-surface-variant">No hay solicitudes pendientes.</p>'}
      </section>
      <form id="nueva" class="card p-4 grid grid-cols-2 gap-3">
        <h2 class="col-span-2 font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">person_add</span>Crear cuenta</h2>
        ${labeled({ label: 'Nombre completo', required: true, wide: true }, '<input class="input" name="name" required autocomplete="off">')}
        ${labeled({ label: 'Correo', required: true, wide: true }, '<input class="input" name="email" type="email" required autocomplete="off">')}
        ${labeled({ label: 'Contraseña inicial', required: true, wide: true }, '<input class="input" name="password" type="text" required minlength="8" autocomplete="off">')}
        ${labeled({ label: 'Planta (obligatoria para encargado y líder)' }, plantSelect('name="plant"'))}
        ${labeled({ label: 'Rol' }, '<select class="input" name="role"><option value="colaborador">Encargado</option><option value="lider">Líder de grupo</option><option value="admin">Admin</option></select>')}
        <button class="btn btn-primary col-span-2"><span class="material-symbols-outlined">person_add</span>Crear cuenta</button>
      </form>
      <section id="act" class="card p-4">
        <h2 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">group</span>Cuentas activas (${act.length})</h2>
        ${act.length ? `<table class="w-full text-sm"><tbody>${act.map(u => `<tr class="border-t border-[#f1f5f9]">
          <td class="py-2 pr-2"><p class="font-medium">${esc(u.name)}</p><p class="text-[11px] text-on-surface-variant">${esc(u.email)}</p>
            <details class="mt-1"><summary class="text-label-sm text-primary font-semibold">Cambiar contraseña</summary>
              <form data-pass="${u.id}" class="flex flex-wrap gap-2 mt-2"><input class="input !py-2 flex-1 min-w-[140px]" name="password" type="text" required minlength="8" autocomplete="off" placeholder="Nueva (mín. 8)" aria-label="Contraseña nueva de ${esc(u.name)}">
                <button class="btn btn-primary !min-h-0 !py-2">Guardar</button></form></details></td>
          <td class="pr-2">${esc(u.plant || '—')}</td><td class="pr-2"><select data-role-user="${u.id}" class="input !py-2 !px-3 w-auto" aria-label="Rol de ${esc(u.name)}">
            ${[['colaborador', 'Encargado'], ['lider', 'Líder de grupo'], ['admin', 'Admin']].map(([v, l]) => `<option value="${v}" ${u.role === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            ${u.role === 'colaborador' ? `<label class="flex items-center gap-2 mt-1 text-label-sm whitespace-nowrap" title="Puede capturar incidencias, bonos, vacaciones y empleados de su planta (sin ver sueldos)"><input type="checkbox" data-nom-user="${u.id}" ${u.nomina ? 'checked' : ''} class="w-4 h-4 accent-[#2563eb]">Nómina</label>` : ''}</td>
          <td class="text-right"><button data-del-user="${u.id}" class="text-label-sm text-error font-semibold inline-flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-error-container whitespace-nowrap" aria-label="Eliminar a ${esc(u.name)}"><span class="material-symbols-outlined text-[18px]">delete</span>Eliminar</button></td></tr>`).join('')}</tbody></table>`
          : '<p class="text-sm text-on-surface-variant">Aún no hay otras cuentas.</p>'}
      </section>
    </div>`;
    const fail = err => { $('#err').textContent = err.message; $('#err').classList.remove('hidden'); };
    $('#pend').onclick = async e => {
      const btn = e.target.closest('[data-approve],[data-reject]'), row = btn?.closest('[data-id]');
      if (!row) return;
      btn.disabled = true;
      try { await api(`/api/users/${btn.matches('[data-approve]') ? 'approve' : 'reject'}`, { id: row.dataset.id, plant: row.querySelector('[data-plant]').value }); views.cuentas(); }
      catch (err) { fail(err); btn.disabled = false; }
    };
    // Doble clic para confirmar (sin diálogo del navegador).
    $('#act').onclick = async e => {
      const btn = e.target.closest('[data-del-user]');
      if (!btn) return;
      if (!confirmed(btn)) return;
      btn.disabled = true;
      try { await api('/api/users/delete', { id: btn.dataset.delUser }); views.cuentas(); } catch (err) { fail(err); btn.disabled = false; }
    };
    $('#act').onchange = async e => {
      const nom = e.target.closest('[data-nom-user]');
      if (nom) return api('/api/users/nomina', { id: nom.dataset.nomUser, nomina: nom.checked }).catch(err => { fail(err); nom.checked = !nom.checked; });
      const sel = e.target.closest('[data-role-user]');
      if (!sel) return;
      sel.disabled = true;
      try { await api('/api/users/role', { id: sel.dataset.roleUser, role: sel.value }); views.cuentas(); } catch (err) { fail(err); sel.disabled = false; }
    };
    // Contraseña nueva: la persona entra con ella (sus sesiones abiertas se cierran).
    $('#act').onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      try {
        await api('/api/users/password', { id: f.dataset.pass, password: f.elements.password.value });
        f.outerHTML = '<p class="text-label-sm text-secondary mt-2">Listo. Compártele la contraseña nueva; tendrá que volver a iniciar sesión.</p>';
      } catch (err) { fail(err); }
    };
    $('#nueva').onsubmit = async e => {
      e.preventDefault();
      try { await api('/api/users', Object.fromEntries(new FormData(e.target))); views.cuentas(); } catch (err) { fail(err); }
    };
  },

  // Camiones de cada planta (solo admin). El encargado solo puede reportar los de su planta.
  async camiones() {
    const trucks = await api('/api/trucks');
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-4xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Camiones</h1>
        <p class="text-sm text-on-surface-variant">Las unidades de cada planta. En la sección 3 el encargado solo puede elegir las de su planta.</p></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <form id="nuevo-camion" class="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <h2 class="col-span-2 lg:col-span-4 font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">add_circle</span>Agregar camión</h2>
        ${labeled({ label: 'Nombre o placas', required: true, wide: true }, '<input class="input" name="name" required maxlength="60" placeholder="Ej. Nissan NP300 · GTO-123">')}
        ${labeled({ label: 'Planta', required: true }, plantSelect('name="plant" required'))}
        ${labeled({ label: 'Tipo' }, '<select class="input" name="horometro"><option value="">Vehículo (km)</option><option value="1">Montacargas (horómetro)</option></select>')}
        <button class="btn btn-primary col-span-2 lg:col-span-4"><span class="material-symbols-outlined">add</span>Agregar</button>
      </form>
      <div id="lista" class="grid gap-4 lg:grid-cols-2 lg:items-start">${PLANTS.map(p => { const ts = trucks.filter(t => t.plant === p); return `
        <section class="card p-4">
          <h2 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">factory</span>${p} (${ts.length})</h2>
          ${ts.length ? ts.map(t => `<div class="flex items-center justify-between gap-2 py-2 border-t border-[#f1f5f9]">
            <div class="min-w-0"><p class="font-medium truncate">${esc(t.name)}</p><p class="text-[11px] text-on-surface-variant">${t.horometro ? 'Montacargas · horómetro' : 'Vehículo · km'}</p></div>
            <button data-del-truck="${t.id}" class="text-label-sm text-error font-semibold inline-flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-error-container whitespace-nowrap" aria-label="Eliminar ${esc(t.name)}"><span class="material-symbols-outlined text-[18px]">delete</span>Eliminar</button>
          </div>`).join('') : '<p class="text-sm text-on-surface-variant">Sin camiones registrados.</p>'}
        </section>`; }).join('')}</div>
    </div>`;
    $('#nuevo-camion').onsubmit = async e => {
      e.preventDefault();
      try { await api('/api/trucks', Object.fromEntries(new FormData(e.target))); views.camiones(); } catch (err) { showErr(err); }
    };
    $('#lista').onclick = async e => {
      const btn = e.target.closest('[data-del-truck]');
      if (!btn || !confirmed(btn)) return;
      btn.disabled = true;
      try { await api('/api/trucks/delete', { id: btn.dataset.delTruck }); views.camiones(); } catch (err) { showErr(err); btn.disabled = false; }
    };
  },

  // Personalizar el formulario (solo admin): a mano o con una propuesta de la IA que el admin aplica o descarta.
  async formulario() {
    const { base, config, protected: prot } = await api('/api/form-config'), P = new Set(prot);
    const keys = s => [...(s.fields || []).map(f => [f.id, f]), ...(s.table ? s.table.cols.map(c => [`${s.table.id}.${c.id}`, c]) : [])];
    const TYPES = { text: 'Texto', textarea: 'Texto largo', number: 'Número', sino: 'Sí / No', select: 'Lista de opciones', date: 'Fecha', time: 'Hora' };
    // Preguntas que pueden ser "padre" de una subpregunta: las del formato (no las de tabla) y las propias ya guardadas.
    const padres = (s, x) => [...(s.fields || []).map(f => [f.id, config.fields[f.id]?.label || f.label]),
      ...(config.extra[s.n] || []).filter(e => e.id && e.id !== x.id).map(e => [e.id, e.label])];
    const extraRow = (x = {}, s) => `
      <div data-extra class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-xl bg-surface-container-low items-end ${x.padre ? 'border-l-4 border-primary-container/60' : ''}">
        <input type="hidden" name="id" value="${esc(x.id || '')}">
        ${labeled({ label: x.padre ? 'Subpregunta' : 'Pregunta nueva', required: true, wide: true }, `<input class="input" name="label" value="${esc(x.label || '')}" required maxlength="120">`)}
        ${labeled({ label: 'Tipo' }, `<select class="input" name="type">${Object.entries(TYPES).map(([v, l]) => `<option value="${v}" ${x.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${labeled({ label: 'Obligatoria', type: 'check' }, `<input type="checkbox" name="required" ${x.required ? 'checked' : ''} class="w-6 h-6 accent-[#2563eb]">`)}
        ${labeled({ label: 'Opciones (solo para "Lista de opciones", separadas por coma)', wide: true }, `<input class="input" name="options" value="${esc((x.options || []).join(', '))}">`)}
        ${labeled({ label: 'Va adentro de la pregunta', wide: true }, `<select class="input" name="padre"><option value="">— Ninguna (pregunta suelta) —</option>${padres(s, x).map(([v, l]) => `<option value="${esc(v)}" ${x.padre === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`)}
        ${labeled({ label: 'Solo si la respuesta es (vacío = con cualquier respuesta)', wide: true }, `<input class="input" name="cuando" value="${esc(x.cuando || '')}" maxlength="60" placeholder="Ej. Sí">`)}
        <button type="button" data-del-extra class="col-span-2 justify-self-end text-label-sm text-error flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">delete</span>Quitar</button>
      </div>`;
    // Lista legible de lo que cambia entre dos configuraciones (para revisar la propuesta de la IA).
    const diff = (a, b) => base.flatMap(s => {
      const out = [], x = a.sections[s.n] || {}, y = b.sections[s.n] || {}, ea = a.extra[s.n] || [], eb = b.extra[s.n] || [];
      if ((x.title || '') !== (y.title || '')) out.push(`Sección ${s.n}: el título será "${y.title || s.title}"`);
      if (!!x.hidden !== !!y.hidden) out.push(`Sección ${s.n} (${s.title}): ${y.hidden ? 'se oculta' : 'se vuelve a mostrar'}`);
      for (const [k, f] of keys(s)) {
        const p = a.fields[k] || {}, q = b.fields[k] || {};
        if ((p.label || '') !== (q.label || '')) out.push(`Sección ${s.n}: "${p.label || f.label}" → "${q.label || f.label}"`);
        if (!!p.hidden !== !!q.hidden) out.push(`Sección ${s.n}: "${f.label}" ${q.hidden ? 'se oculta' : 'se vuelve a mostrar'}`);
        if ((p.required ?? !!f.required) !== (q.required ?? !!f.required)) out.push(`Sección ${s.n}: "${f.label}" ${q.required ?? f.required ? 'pasa a ser obligatoria' : 'deja de ser obligatoria'}`);
      }
      for (const e of eb) { const o = ea.find(z => z.id === e.id);
        if (!o) out.push(`Sección ${s.n}: nueva ${e.padre ? 'subpregunta' : 'pregunta'} "${e.label}" (${TYPES[e.type]}${e.required ? ', obligatoria' : ''})`);
        else if (JSON.stringify(o) !== JSON.stringify(e)) out.push(`Sección ${s.n}: cambia la pregunta "${e.label}"`); }
      for (const e of ea) if (!eb.some(z => z.id === e.id)) out.push(`Sección ${s.n}: se quita la pregunta "${e.label}"`);
      return out;
    });
    const save = async c => { await api('/api/form-config', { config: c }); questions = await api('/api/questions'); views.formulario(); };
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-4xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Formulario</h1>
        <p class="text-sm text-on-surface-variant">Personaliza el PL-FOR-26 para las dos plantas: cambia el texto, haz obligatoria o no cada pregunta, quita (oculta) las que no quieras
          y agrega preguntas o subpreguntas (van adentro de otra pregunta). Las preguntas con <span class="material-symbols-outlined text-[14px] align-middle text-tertiary">calculate</span>
          las usa un cálculo automático: si las quitas, ese cálculo queda vacío. Lo que se quita no se borra de los reportes ya enviados.</p></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <section class="card p-4 flex flex-col gap-3">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">auto_awesome</span>Modificar con IA</h2>
        <textarea id="ai-txt" class="input" rows="2" maxlength="1000" aria-label="Cambio que quieres hacer" placeholder='Ej. "Agrega en la sección 5 una pregunta de temperatura del horno (número) y oculta el folio de material"'></textarea>
        <button id="ai-go" class="btn btn-primary ${WIDE ? 'self-start' : ''}"><span class="material-symbols-outlined">auto_awesome</span>Proponer cambios</button>
        <div id="ai-out"></div>
      </section>
      <form id="cfg" class="flex flex-col gap-4">
        ${base.map(s => { const sc = config.sections[s.n] || {}; return `
        <section data-sec="${s.n}" class="card p-4 flex flex-col gap-3">
          <div class="flex flex-wrap items-end gap-3">
            <label class="flex-1 min-w-[200px] flex flex-col gap-1 text-label-md text-on-surface-variant"><span>Sección ${s.n} — título</span>
              <input class="input" name="stitle" value="${esc(sc.title || '')}" placeholder="${esc(s.title)}"></label>
            <label class="flex items-center gap-2 h-12 text-label-md"><input type="checkbox" name="shidden" ${sc.hidden ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Quitar sección</label>
          </div>
          <details><summary class="text-label-lg text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">expand_more</span>Preguntas del formato (${keys(s).length})</summary>
            <div class="flex flex-col gap-2 mt-2">${keys(s).map(([k, f]) => { const fc = config.fields[k] || {}, fija = s.table?.fixed && k === `${s.table.id}.${s.table.cols[0].id}`; return `
              <div data-field="${k}" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 border-b border-[#f1f5f9]">
                <input class="input flex-1 min-w-[200px]" name="label" value="${esc(fc.label || '')}" placeholder="${esc(f.label)}" aria-label="Nuevo texto para ${esc(f.label)}">
                ${P.has(k) ? '<span class="material-symbols-outlined text-[18px] text-tertiary" title="La usa un cálculo automático: si la quitas, ese cálculo queda vacío">calculate</span>' : ''}
                ${f.auto ? '<span class="text-label-sm text-on-surface-variant">Se calcula sola</span>' : `<label class="flex items-center gap-1.5 text-label-md"><input type="checkbox" name="required" ${(fc.required ?? !!f.required) ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Obligatoria</label>`}
                ${fija ? '<span class="text-label-sm text-on-surface-variant">Renglones fijos</span>' : `<label class="flex items-center gap-1.5 text-label-md text-error"><input type="checkbox" name="hidden" ${fc.hidden ? 'checked' : ''} class="w-5 h-5 accent-[#ba1a1a]">Quitar</label>`}
                ${s.table && k.includes('.') ? '' : `<button type="button" data-add-sub="${esc(k)}" class="text-label-sm text-primary font-semibold flex items-center gap-0.5"><span class="material-symbols-outlined text-[16px]">subdirectory_arrow_right</span>Subpregunta</button>`}
              </div>`; }).join('')}</div></details>
          <div data-extras class="flex flex-col gap-2">${(config.extra[s.n] || []).map(x => extraRow(x, s)).join('')}</div>
          <button type="button" data-add-extra class="btn border-[1.5px] border-[#cbd5e1] text-primary ${WIDE ? 'self-start' : ''}"><span class="material-symbols-outlined">add</span>Agregar pregunta</button>
        </section>`; }).join('')}
        <div class="sticky bottom-24 lg:bottom-4 grid grid-cols-2 gap-2">
          <button type="button" data-preview class="btn bg-surface-container-lowest border-[1.5px] border-[#cbd5e1] text-primary shadow-lg"><span class="material-symbols-outlined">visibility</span>Vista previa</button>
          <button class="btn btn-primary shadow-lg"><span class="material-symbols-outlined">save</span>Guardar cambios</button></div>
      </form>
      <div id="preview" class="hidden flex-col gap-4"></div>
    </div>`;
    const form = $('#cfg');
    // Lee la configuración tal como está en pantalla.
    const read = () => {
      const c = { sections: {}, fields: {}, extra: {} };
      for (const sec of form.querySelectorAll('[data-sec]')) {
        const n = sec.dataset.sec;
        c.sections[n] = { title: sec.querySelector('[name=stitle]').value, hidden: !!sec.querySelector('[name=shidden]')?.checked };
        for (const f of sec.querySelectorAll('[data-field]')) c.fields[f.dataset.field] = { label: f.querySelector('[name=label]').value, hidden: !!f.querySelector('[name=hidden]')?.checked,
          ...(f.querySelector('[name=required]') && { required: f.querySelector('[name=required]').checked }) };
        c.extra[n] = [...sec.querySelectorAll('[data-extra]')].map(x => { const v = k => x.querySelector(`[name=${k}]`);
          return { id: v('id').value, label: v('label').value, type: v('type').value, required: v('required').checked,
            options: v('options').value.split(',').map(o => o.trim()).filter(Boolean), padre: v('padre').value, cuando: v('cuando').value }; });
      }
      return c;
    };
    // Vista previa (solo para ver): el formulario como lo llena el encargado, con lo que hay en pantalla aunque no esté guardado.
    // Al volver, lo editado sigue ahí. Los camiones dependen de la planta, por eso esa lista sale vacía.
    const preview = async (c, what) => {
      const secs = await api('/api/form-config/preview', { config: c }), box = $('#preview');
      box.innerHTML = `<div class="rounded-xl p-3 flex flex-wrap items-center gap-2 bg-surface-container-high sticky top-0 lg:top-4 z-10 shadow">
          <span class="material-symbols-outlined text-primary">visibility</span>
          <span class="flex-1 min-w-[200px] text-body-md"><b>Vista previa</b> — así ve el formulario el encargado (${what}). No se puede enviar.</span>
          <button type="button" data-back class="btn btn-primary !min-h-10"><span class="material-symbols-outlined">edit</span>Volver a editar</button></div>
        <p class="text-label-sm font-semibold text-primary">PL-FOR-26 · REV. 06</p>
        <h2 class="text-headline-lg-mobile tracking-tight -mt-3">Reporte diario de operación</h2>
        <fieldset disabled class="flex flex-col gap-4">${sectionsHtml(secs, null, t => t.fixed ? tableRows(t) : [{}])}</fieldset>`;
      form.classList.add('hidden'); box.classList.replace('hidden', 'flex'); scrollTo(0, 0);
      box.querySelector('[data-back]').onclick = () => { box.classList.replace('flex', 'hidden'); form.classList.remove('hidden'); };
    };
    form.onclick = e => {
      if (e.target.closest('[data-preview]')) return preview(read(), 'con los cambios de esta pantalla, aunque no estén guardados').catch(showErr);
      const add = e.target.closest('[data-add-extra]'), del = e.target.closest('[data-del-extra]'), sub = e.target.closest('[data-add-sub]');
      const sec = e.target.closest('[data-sec]'), s = sec && base.find(x => String(x.n) === sec.dataset.sec);
      if (add) add.previousElementSibling.insertAdjacentHTML('beforeend', extraRow({}, s));
      if (sub) { sec.querySelector('[data-extras]').insertAdjacentHTML('beforeend', extraRow({ padre: sub.dataset.addSub }, s));
        sec.querySelector('[data-extras]').lastElementChild.querySelector('[name=label]').focus(); }
      if (del) del.closest('[data-extra]').remove();
    };
    form.onsubmit = async e => {
      e.preventDefault();
      const c = read(), bad = Object.values(c.extra).flat().find(x => x.type === 'select' && !x.options.length);
      if (bad) return showErr(new Error(`La pregunta "${bad.label}" es una lista: escribe sus opciones separadas por coma`));
      const btn = form.querySelector('.btn-primary'); btn.disabled = true;
      try { await save(c); } catch (err) { showErr(err); btn.disabled = false; }
    };
    $('#ai-go').onclick = async e => {
      const btn = e.currentTarget, out = $('#ai-out'), instruction = $('#ai-txt').value.trim();
      if (!instruction) return showErr(new Error('Escribe qué quieres cambiar'));
      btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Pensando…';
      try {
        const p = await api('/api/form-config/ai', { instruction }), changes = diff(config, p.config);
        out.innerHTML = `<div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2">
          <p class="text-label-lg">Propuesta de la IA</p>
          ${p.resumen ? `<p class="text-sm">${esc(p.resumen)}</p>` : ''}
          ${changes.length ? `<ul class="list-disc pl-5 text-sm">${changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '<p class="text-sm text-on-surface-variant">La IA no propuso cambios.</p>'}
          <div class="flex gap-2">${changes.length ? '<button id="ai-apply" class="btn btn-primary"><span class="material-symbols-outlined">check</span>Aplicar</button>' : ''}
            ${changes.length ? '<button id="ai-preview" class="btn border-[1.5px] border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">visibility</span>Vista previa</button>' : ''}
            <button id="ai-discard" class="btn border-[1.5px] border-[#cbd5e1]">Descartar</button></div></div>`;
        if (changes.length) $('#ai-preview').onclick = () => preview(p.config, 'con la propuesta de la IA, sin aplicar').catch(showErr);
        $('#ai-discard').onclick = () => { out.innerHTML = ''; };
        if (changes.length) $('#ai-apply').onclick = async () => { try { await save(p.config); } catch (err) { showErr(err); } };
      } catch (err) { showErr(err); }
      btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span>Proponer cambios';
    };
  },

  // Mi cuenta (todos): datos y cambiar mi contraseña.
  cuenta() {
    $('#app').innerHTML = `
    <div class="${WIDE ? 'max-w-xl' : ''} flex flex-col gap-4">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Mi cuenta</h1>
        <p class="text-sm text-on-surface-variant">${esc(me.name)} · ${esc(me.email)} · ${ROLE_L[me.role]}${me.plant ? ' · Planta ' + esc(me.plant) : ''}</p></div>
      <form id="mi-pass" class="card p-4 flex flex-col gap-3">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">key</span>Cambiar mi contraseña</h2>
        ${labeled({ label: 'Contraseña actual', required: true }, '<input class="input" name="current" type="password" required autocomplete="current-password">')}
        ${labeled({ label: 'Contraseña nueva (mín. 8)', required: true }, '<input class="input" name="password" type="password" required minlength="8" autocomplete="new-password">')}
        ${labeled({ label: 'Repite la contraseña nueva', required: true }, '<input class="input" name="again" type="password" required minlength="8" autocomplete="new-password">')}
        <p id="err" class="text-sm text-error hidden" role="alert"></p>
        <button class="btn btn-primary"><span class="material-symbols-outlined">save</span>Guardar contraseña</button>
      </form>
      <button data-logout class="btn border-[1.5px] border-[#cbd5e1] text-error"><span class="material-symbols-outlined">logout</span>Cerrar sesión</button>
    </div>`;
    $('#mi-pass').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, { current, password, again } = Object.fromEntries(new FormData(f));
      if (password !== again) return showErr(new Error('Las contraseñas nuevas no coinciden'));
      const btn = f.querySelector('.btn-primary'); btn.disabled = true;
      try {
        await api('/api/me/password', { current, password });
        f.outerHTML = '<div class="card p-4 flex items-center gap-2 text-secondary"><span class="material-symbols-outlined">check_circle</span>Listo, tu contraseña cambió. En tus otros dispositivos tendrás que volver a iniciar sesión.</div>';
      } catch (err) { showErr(err); btn.disabled = false; }
    };
  },

  // ---------- Calidad ISO 9001 (etapa 1) ----------
  // Tablero: emergencia, botones de captura, alertas, lotes y registros. Admin: filtro de planta y catálogo de clientes.
  async calidad() {
    const [c, sem] = await Promise.all([api('/api/calidad' + (me.role === 'admin' && calPlant ? '?planta=' + encodeURIComponent(calPlant) : '')), api('/api/semana').catch(() => null)]);
    if (me.role === 'admin') { alertN = c.alertas.length; renderNav('calidad'); }
    const F = { activos: ['EN PLANTA', 'RETENIDO', 'LIBERADO'], 'EN PLANTA': ['EN PLANTA'], RETENIDO: ['RETENIDO'], LIBERADO: ['LIBERADO'], ENTREGADO: ['ENTREGADO'] };
    const lotes = c.lotes.filter(l => F[calFilter].includes(l.status)), days = l => Math.round((Date.parse(ymd()) - Date.parse(l.received)) / 86_400_000);
    const go = (href, icon, text) => `<a href="${href}" class="btn border-[1.5px] border-[#cbd5e1] text-primary !min-h-0 !py-2 !px-3 text-label-md"><span class="material-symbols-outlined text-[18px]">${icon}</span>${text}</a>`;
    const accion = l => ({ 'EN PLANTA': go(`#/lib/${encodeURIComponent(l.code)}`, 'fact_check', 'Liberar'), RETENIDO: go(`#/nc/${encodeURIComponent(l.code)}`, 'report', 'No conforme'),
      LIBERADO: go(`#/q/${encodeURIComponent(l.lib)}`, 'local_shipping', 'Entregar') })[l.status] || '';
    $('#app').innerHTML = `
    <div class="flex flex-col gap-4 ${WIDE ? 'max-w-5xl' : ''}">
      ${emergencia(c.tel)}
      <div><p class="text-label-sm font-semibold text-primary">SISTEMA DE GESTIÓN DE CALIDAD</p>
        <h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Calidad ISO 9001</h1>
        <p class="text-sm text-on-surface-variant">Recepción, liberación y no conformes con folio, lote POLAR y trazabilidad.</p></div>
      ${me.role === 'admin' ? `<label class="flex items-center gap-2 text-label-md text-on-surface-variant">Planta
        <select id="cal-planta" class="input w-auto"><option value="">Todas</option>${PLANTS.map(p => `<option ${p === calPlant ? 'selected' : ''}>${p}</option>`).join('')}</select></label>` : ''}
      ${qButtons()}
      ${fmtButtons(sem, calPlant ? [calPlant] : me.role === 'admin' ? PLANTS : [me.plant])}
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      ${pendientesHtml(c.abiertas || [], me.role === 'admin')}
      ${c.alertas.length ? `<section id="alertas" class="card p-4 flex flex-col gap-2 border-l-4 border-error">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-error">notifications_active</span>Alertas (${c.alertas.length})</h2>
        ${c.alertas.map(a => `<div class="flex items-start justify-between gap-2 p-2 rounded-lg bg-error-container/40"><p class="text-sm">${esc(a.text)}
          ${a.folio ? ` <a href="#/q/${esc(a.folio)}" class="text-primary font-semibold">Ver ${esc(a.folio)}</a>` : a.lote ? ` <a href="#/nc/${esc(a.lote)}" class="text-primary font-semibold">Levantar no conforme</a>` : ''}</p>
          ${a.id ? `<button data-visto="${a.id}" class="text-label-sm text-primary font-semibold whitespace-nowrap">Marcar vista</button>` : ''}</div>`).join('')}</section>` : ''}
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <section class="card p-4 flex flex-col gap-3">
          <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">inventory_2</span>Lotes</h2>
          <div id="cal-filtro" class="flex flex-wrap gap-1">${Object.keys(F).map(k => `<button data-f="${k}" class="chip !py-1 ${k === calFilter ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface-variant'}">${k === 'activos' ? 'Activos' : k}</button>`).join('')}</div>
          ${lotes.length ? `<div class="flex flex-col">${lotes.map(l => `<div class="flex flex-wrap items-center justify-between gap-2 py-2 border-t border-[#f1f5f9]">
            <div class="min-w-0"><p class="font-semibold flex flex-wrap items-center gap-2">${esc(l.code)} ${statusChip(l.status)}</p>
              <p class="text-[12px] text-on-surface-variant">${esc(l.client)} · ${esc(l.part)} · ${l.qty} pza${l.delivered_qty && l.status !== 'ENTREGADO' ? ` (entregadas ${l.delivered_qty})` : ''} · recibido ${dmy(l.received)}${l.status === 'EN PLANTA' ? ` (${days(l)} d)` : ''}${me.role === 'admin' ? ' · ' + esc(l.plant) : ''}
                ${l.remision ? `· Remisión ${esc(l.remision)} ` : ''}· <a href="#/q/${esc(l.rec)}" class="text-primary">${esc(l.rec)}</a></p></div>
            ${accion(l)}</div>`).join('')}</div>` : '<p class="text-sm text-on-surface-variant">Sin lotes con ese filtro.</p>'}
        </section>
        <section class="card p-4 flex flex-col">
          <h2 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">history</span>Registros recientes</h2>
          ${c.registros.length ? c.registros.map(r => `<a href="#/q/${esc(r.folio)}" class="flex items-center justify-between gap-2 py-2 border-t border-[#f1f5f9] hover:bg-surface-container-low">
            <div class="min-w-0"><p class="font-semibold">${esc(r.folio)} <span class="text-label-sm text-on-surface-variant font-normal">${KIND[r.kind][1]} · ${KIND[r.kind][0]}</span></p>
              <p class="text-[12px] text-on-surface-variant truncate">${dmy(r.date)} · ${esc(r.data.cliente || r.data.unidad || r.data.horno || r.data.tema || r.data.equipo || '')} · ${esc(r.name)}${me.role === 'admin' ? ' · ' + esc(r.plant) : ''}</p></div>
            ${r.porEntregar ? `<span class="chip bg-tertiary-fixed text-on-tertiary-fixed">Abierta · ${r.porEntregar} por entregar</span>` : statusChip(r.status)}</a>`).join('') : '<p class="text-sm text-on-surface-variant">Aún no hay registros.</p>'}
        </section>
      </div>
      ${me.role === 'admin' ? `<section id="catalogo" class="card p-4 flex flex-col gap-3">
        <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">contacts</span>Catálogo de clientes y teléfono de gerencia</h2>
        ${calPlant ? '<p class="text-sm text-on-surface-variant">Elige "Todas" las plantas para editar el catálogo.</p>' : `
        <p class="text-body-sm text-on-surface-variant">Los clientes de cada planta aparecen en recepción y no conforme; su especificación particular, en el criterio 7 de la liberación.</p>
        <div data-clis class="flex flex-col gap-2">${c.clientes.map(cliRow).join('')}</div>
        <button type="button" data-add-cli class="btn border-[1.5px] border-[#cbd5e1] text-primary ${WIDE ? 'self-start' : ''}"><span class="material-symbols-outlined">add</span>Agregar cliente</button>
        ${labeled({ label: 'Teléfono de gerencia (franja roja de emergencia)' }, `<input class="input lg:max-w-xs" name="tel" value="${esc(c.tel)}" inputmode="tel" maxlength="20">`)}
        <button type="button" data-save-cli class="btn btn-primary ${WIDE ? 'self-start' : ''}"><span class="material-symbols-outlined">save</span>Guardar catálogo</button>`}
      </section>` : ''}
    </div>`;
    const cat = $('#catalogo'), al = $('#alertas');
    if ($('#cal-planta')) $('#cal-planta').onchange = e => { calPlant = e.target.value; views.calidad(); };
    $('#cal-filtro').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { calFilter = b.dataset.f; views.calidad(); } };
    if (al) al.onclick = async e => {
      const b = e.target.closest('[data-visto]');
      if (b) try { await api('/api/calidad/alertas/vista', { id: b.dataset.visto }); views.calidad(); } catch (err) { showErr(err); }
    };
    if (cat) cat.onclick = async e => {
      if (e.target.closest('[data-add-cli]')) cat.querySelector('[data-clis]').insertAdjacentHTML('beforeend', cliRow());
      if (e.target.closest('[data-del-cli]')) e.target.closest('[data-cli]').remove();
      if (!e.target.closest('[data-save-cli]')) return;
      const clientes = [...cat.querySelectorAll('[data-cli]')].map(r => Object.fromEntries(['name', 'plant', 'spec'].map(k => [k, r.querySelector(`[name=${k}]`).value])));
      try { await api('/api/calidad/config', { clientes, tel: cat.querySelector('[name=tel]').value }); views.calidad(); } catch (err) { showErr(err); }
    };
  },

  // Formatos de operación: #/fmt/CL21 · CL22 · CL23 · PLA · MT; HG = elegir check list de horno o de gas.
  async fmt(kind) {
    if (kind !== 'HG') return views.qnuevo(KIND[kind] && !['REC', 'LIB', 'NC'].includes(kind) ? kind : 'MT');
    const sem = await api('/api/semana').catch(() => null);
    $('#app').innerHTML = `<div class="flex flex-col gap-4 ${WIDE ? 'max-w-xl' : ''}">
      <a href="#/${me.role === 'admin' ? 'calidad' : 'inicio'}" class="text-primary text-label-md flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">arrow_back</span>Volver</a>
      <h1 class="text-headline-lg-mobile tracking-tight">Check list de horno y gas</h1>
      ${['CL22', 'CL23'].map(k => { const f = (sem?.formatos || []).filter(x => x.kind === k && (me.role === 'admin' || x.plant === me.plant) && x.faltan.length);
        return `<a href="#/fmt/${k}" class="card p-4 flex items-center gap-3 hover:bg-surface-container-low"><span class="material-symbols-outlined text-primary text-[32px]">${KIND[k][2]}</span>
          <span class="flex-1"><span class="text-label-lg block">${KIND[k][1]}</span><span class="text-[11px] text-on-surface-variant">${KIND[k][0]}</span></span>
          ${f.length ? `<span class="chip bg-tertiary-fixed text-on-tertiary-fixed">Falta esta semana${me.role === 'admin' ? ': ' + f.map(x => x.plant).join(', ') : ''}</span>` : '<span class="chip bg-secondary-container text-on-secondary-container">✔ Hecho</span>'}</a>`; }).join('')}</div>`;
  },
  // Documentos vigentes (solo consulta / imprimir).
  docs() {
    $('#app').innerHTML = `<div class="flex flex-col gap-4 ${WIDE ? 'max-w-2xl' : ''}">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Documentos</h1>
        <p class="text-sm text-on-surface-variant">Revisión vigente para consultar o imprimir.</p></div>
      ${DOCS.map(([g, xs]) => `<section class="card p-4"><h2 class="text-label-lg text-primary mb-2">${g}</h2>${xs.map(([code, name, file]) => `
        <a href="/docs/${file}" target="_blank" rel="noopener" class="flex items-center gap-3 py-2.5 border-t border-[#f1f5f9] first:border-0 hover:bg-surface-container-low">
          <span class="material-symbols-outlined text-error">picture_as_pdf</span><span class="flex-1 min-w-0"><span class="font-medium block">${name}</span><span class="text-[11px] text-on-surface-variant">${code}</span></span>
          <span class="material-symbols-outlined text-on-surface-variant">open_in_new</span></a>`).join('')}</section>`).join('')}</div>`;
  },
  rec: () => views.qnuevo('REC'),
  lib: lote => views.qnuevo('LIB', lote),
  nc: origen => views.qnuevo('NC', origen),
  ncedit: folio => views.qnuevo('NC', folio, true),
  fmtedit: folio => views.qnuevo(decodeURIComponent(folio).split('-')[0], folio, true), // admin: corregir check list, plática, mantenimiento o visita
  visita: () => views.qnuevo('VIS'),

  // Registro de visitantes (encargado, líder y admin): visitas de los últimos 60 días y botón para registrar una nueva.
  async visitas() {
    const vs = await api('/api/visitas' + (me.role === 'admin' && visPlant ? '?planta=' + encodeURIComponent(visPlant) : ''));
    const horas = d => [d.hora, d.hora_salida].filter(Boolean).join(' – ');
    $('#app').innerHTML = `
    <div class="flex flex-col gap-4 ${WIDE ? 'max-w-4xl' : ''}">
      <div><h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Registro de visitantes</h1>
        <p class="text-sm text-on-surface-variant">Anota a cada persona que llega a la planta: proveedores, clientes, dependencias de gobierno, solicitudes de empleo…</p></div>
      ${me.role === 'admin' ? `<label class="flex items-center gap-2 text-label-md text-on-surface-variant">Planta
        <select id="vis-planta" class="input w-auto"><option value="">Todas</option>${PLANTS.map(p => `<option ${p === visPlant ? 'selected' : ''}>${p}</option>`).join('')}</select></label>` : ''}
      <a href="#/visita" class="btn btn-primary w-full ${WIDE ? 'lg:w-auto lg:self-start' : ''}"><span class="material-symbols-outlined">how_to_reg</span>Registrar visita</a>
      <section class="card p-4 flex flex-col">
        <h2 class="font-semibold flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">history</span>Visitas de los últimos 60 días (${vs.length})</h2>
        ${vs.length ? vs.map(v => `<a href="#/q/${esc(v.folio)}" class="flex items-start justify-between gap-2 py-2 border-t border-[#f1f5f9] hover:bg-surface-container-low">
          <div class="min-w-0"><p class="font-semibold flex flex-wrap items-center gap-2">${esc(v.data.nombre)} <span class="chip ${v.data.tipo === 'Dependencia de gobierno' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface-variant'}">${esc(v.data.tipo)}</span></p>
            <p class="text-[12px] text-on-surface-variant">${esc(v.data.empresa)} · ${esc(v.data.motivo)}</p>
            <p class="text-[12px] text-on-surface-variant">${dmy(v.date)} · ${esc(horas(v.data))} · atendió ${esc(v.data.atendio)}${me.role === 'admin' ? ' · ' + esc(v.plant) : ''}${v.data.seguimiento === 'Sí' ? ' · <b class="text-tertiary">requiere seguimiento</b>' : ''}</p></div>
          <span class="text-label-sm text-on-surface-variant whitespace-nowrap">${esc(v.folio)}</span></a>`).join('')
          : '<p class="text-sm text-on-surface-variant">Sin visitas registradas en los últimos 60 días.</p>'}
      </section>
    </div>`;
    if ($('#vis-planta')) $('#vis-planta').onchange = e => { visPlant = e.target.value; views.visitas(); };
  },

  // Captura de PL-FOR-28 / 29 / 30. arg: LIB → lote preseleccionado; NC → folio REC / LIB de origen o código de lote; edit: NC a actualizar.
  async qnuevo(kind, arg = '', edit = false) {
    arg = decodeURIComponent(arg);
    const prev = /^(REC|LIB|NC|CL2[123]|PLA|MT|VIS)-\d+$/.test(arg) ? await api('/api/calidad/registro?folio=' + encodeURIComponent(arg)) : null;
    let plant = prev?.plant || (me.role === 'admin' ? calPlant || PLANTS[0] : me.plant);
    if (!plant) throw new Error('Tu cuenta no tiene planta asignada: pide al administrador que te asigne una.');
    const draw = async () => {
      const f = await api(`/api/calidad/form?tipo=${kind}&planta=${encodeURIComponent(plant)}`), secs = f.sections; rowN = 0;
      const pre = edit ? prev.data : { fecha: ymd(), hora: new Date().toTimeString().slice(0, 5),
        ...(kind === 'LIB' && { lote: arg, remision: f.lotes.find(l => l.code === arg)?.remision || '' }), ...(kind === 'NC' && ncPrefill(prev, arg, f)),
        ...(kind === 'VIS' && { atendio: me.name }) };
      $('#app').innerHTML = `
      <div class="flex flex-col gap-4 ${WIDE ? 'max-w-4xl' : ''}">
        <div><a href="${kind === 'VIS' ? '#/visitas' : '#/calidad'}" class="text-primary text-label-md flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">arrow_back</span>${kind === 'VIS' ? 'Visitantes' : 'Calidad'}</a>
          <p class="text-label-sm font-semibold text-primary mt-2">${f.code} · REV. 00${edit ? ' · ' + esc(prev.folio) : ''}</p>
          <h1 class="text-headline-lg-mobile tracking-tight">${esc(f.title)}</h1>
          <p class="text-body-md text-on-surface-variant">Planta ${esc(plant)} · ${esc(me.name)}${prev && !edit ? ` · desde ${esc(prev.folio)}` : ''}</p></div>
        ${me.role === 'admin' && !prev ? `<label class="flex flex-col gap-1 text-label-md text-on-surface-variant max-w-xs">Planta${plantSelect('id="q-planta"', plant)}</label>` : ''}
        ${kind === 'LIB' && !secs[0].fields.find(x => x.id === 'lote').options.length ? '<p class="card p-4 text-body-md">No hay lotes EN PLANTA para liberar. Registra primero la recepción (PL-FOR-28).</p>' : ''}
        <datalist id="dl-piezas">${[...new Set(f.lotes.map(l => l.part))].map(p => `<option value="${esc(p)}">`).join('')}</datalist>
        <datalist id="dl-equipos">${EQUIPOS.map(p => `<option value="${esc(p)}">`).join('')}</datalist>
        <form id="qform" class="flex flex-col gap-4">
          ${sectionsHtml(secs, pre, t => t.fixed ? tableRows(t, pre) : pre[t.id] || (t.id === 'partidas' ? [{}] : []), (s, at) => at !== 'bottom' ? ''
            : kind === 'LIB' && s.n === 1 ? '<p data-lote-info class="p-3 rounded-xl bg-surface-container text-label-md"></p>'
            : kind === 'LIB' && s.n === 3 ? '<p data-pct class="p-3 rounded-xl bg-surface-container-high/60 text-label-lg text-primary"></p>'
            : kind === 'LIB' && s.n === 4 ? '<p data-dispo class="hidden p-3 rounded-xl bg-error-container text-on-error-container text-label-md"></p>'            : kind === 'REC' && s.n === 3 ? '<p data-anomalia class="hidden p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-label-md">⚠ Hay diferencia de conteo o algo en "No": anótalo en la remisión antes de firmar. Al guardar podrás levantar el no conforme.</p>' : '')}
          <p id="err" class="text-sm text-error hidden" role="alert"></p>
          <button class="btn btn-primary w-full"><span class="material-symbols-outlined">save</span>${edit ? 'Guardar cambios' : 'Guardar ' + KIND[kind][1].toLowerCase()}</button>
        </form>
      </div>`;
      const form = $('#qform'), estado = secs.find(s => s.n === 3)?.fields?.map(x => x.id) || [];
      let loteTabla = null; // PL-FOR-29: lote cuyos modelos están en la tabla de cantidades (se rehace al cambiar de lote)
      // En vivo: diferencia por partida y aviso (REC); datos del lote y % de aceptación (LIB). El servidor lo recalcula al guardar.
      const live = () => {
        syncCuando(form); // PL-FOR-21: observaciones / qué hay que hacer según el resultado de cada punto
        if (kind === 'REC') {
          let anom = estado.some(id => form.elements[id]?.value === 'No');
          form.querySelectorAll('[data-table="partidas"] [data-row]').forEach(r => {
            const v = id => Number(r.querySelector(`[name$=".${id}"]`).value) || 0, dif = v('contada') - v('remision');
            r.querySelector('[data-dif]').textContent = `Diferencia: ${dif > 0 ? '+' : ''}${dif}`;
            if (dif) anom = true;
          });
          form.querySelector('[data-anomalia]').classList.toggle('hidden', !anom);
        }
        if (kind === 'LIB') {
          // Remisión → solo sus lotes; si eligen el lote primero, se pone su remisión.
          const selR = form.elements.remision, selL = form.elements.lote, remDe = code => f.lotes.find(x => x.code === code)?.remision;
          let l = f.lotes.find(x => x.code === selL.value);
          if (l && !selR.value) selR.value = l.remision || '';
          for (const o of selL.options) if (o.value) o.hidden = o.disabled = !!selR.value && remDe(o.value) !== selR.value;
          if (selL.selectedOptions[0]?.disabled) { selL.value = ''; l = null; }
          // Cada remisión es un lote: al elegir la remisión su lote se elige solo (si hubiera dos recepciones con la misma remisión, se escoge).
          const libres = [...selL.options].filter(o => o.value && !o.disabled);
          if (!l && selR.value && libres.length === 1) { selL.value = libres[0].value; l = f.lotes.find(x => x.code === selL.value); }
          const spec = l && f.specs[l.client];
          form.querySelector('[data-lote-info]').textContent = l ? `${l.client} · Remisión ${l.remision || '—'} · ${l.code} · quedan ${l.porLiberar} de ${l.qty} pza por liberar${l.entregadas ? ` (ya entregadas ${l.entregadas})` : ''} · ${l.rec}${spec ? ` · Especificación del cliente (criterio 7): ${spec}` : ''}`
            : selR.value ? 'Elige el lote de esta remisión para ver cliente, modelos y folio REC.' : 'Elige la remisión para ver su lote, cliente, modelos y folio REC.';
          // Sección 3: un renglón por modelo del lote, ya con todo lo que falta liberar (se cambia si se libera solo una parte).
          const tb = form.querySelector('[data-table="modelos"]');
          if ((l?.code ?? '') !== loteTabla) {
            loteTabla = l?.code ?? '';
            const t = secs.find(s => s.table?.id === 'modelos').table, pend = l ? l.modelos.filter(m => m.porLiberar > 0) : [];
            tb.innerHTML = pend.length ? pend.map(m => rowHtml(t, { parte: m.parte, inspeccionadas: String(m.porLiberar), aceptadas: String(m.porLiberar) })).join('')
              : `<p class="text-body-sm text-on-surface-variant">${l ? 'A este lote ya no le quedan piezas por liberar.' : 'Elige la remisión: aquí aparecen sus modelos.'}</p>`;
            tb.querySelectorAll('[data-row]').forEach(row => { const m = pend.find(x => x.parte === row.querySelector('[name$=".parte"]').value);
              if (m) row.querySelector('[data-mod]').textContent = `Quedan ${m.porLiberar} de ${m.qty} por liberar de este modelo`; });
          }
          const suma = id => [...tb.querySelectorAll(`[name$=".${id}"]`)].reduce((t, x) => t + (Number(x.value) || 0), 0);
          const ins = suma('inspeccionadas'), acc = suma('aceptadas');
          form.querySelector('[data-pct]').textContent = `% de aceptación: ${ins ? Math.round(acc / ins * 1000) / 10 : 0} % · No conformes: ${Math.max(0, ins - acc)}`;
          // Criterio NOK: se abren piezas no OK, ¿se corrigió? y qué se va a hacer (obligatorias). Si alguno no se corrigió, no se puede liberar.
          const sinCorregir = [];
          form.querySelectorAll('[data-table="criterios"] [data-row]').forEach(row => {
            const nok = row.querySelector('[name$=".resultado"]').value === 'NOK';
            row.querySelectorAll('[data-nok]').forEach(box => {
              box.classList.toggle('hidden', !nok);
              box.querySelectorAll('input, select, textarea').forEach(x => { x.disabled = !nok; x.required = nok; });
            });
            if (nok && row.querySelector('[name$=".corregido"]').value === 'No') sinCorregir.push(row.querySelector('[name$=".criterio"]').value);
          });
          // Con NOK sin corregir no se libera todo (LIBERADO); LIBERADO PARCIAL solo tiene sentido si los hay.
          const dispo = form.elements.disposicion, aviso = form.querySelector('[data-dispo]');
          for (const o of dispo.options) o.disabled = (o.value === 'LIBERADO' && sinCorregir.length > 0) || (o.value === 'LIBERADO PARCIAL' && !sinCorregir.length);
          if (dispo.selectedOptions[0]?.disabled) dispo.value = '';
          aviso.classList.toggle('hidden', !sinCorregir.length);
          aviso.textContent = sinCorregir.length ? `NOK sin corregir (${sinCorregir.join(', ')}): no se puede liberar todo. LIBERADO PARCIAL: salen las aceptadas y las no conformes quedan RETENIDAS ` +
            'con su no conforme (PL-FOR-30). CON DESVIACIÓN: si el cliente las acepta como están. O RETENIDO / RETRABAJO de todo lo inspeccionado.' : '';
          // Aviso al cliente (opcional): "¿A quién?" solo aparece (y se pide) si hay que darle aviso.
          syncCond(form, 'aviso', form.elements.aviso_requiere.value === 'Sí');
        }
      };
      form.onclick = e => {
        const add = e.target.closest('[data-add]'), del = e.target.closest('[data-del]'), delPhoto = e.target.closest('[data-del-photo]');
        if (add) form.querySelector(`[data-table="${add.dataset.add}"]`).insertAdjacentHTML('beforeend', rowHtml(secs.find(s => s.table?.id === add.dataset.add).table));
        if (del) del.closest('[data-row]').remove();
        if (delPhoto) delPhoto.closest('[data-photo]').remove();
        live();
      };
      form.oninput = live;
      form.onchange = e => { if (!handleUpload(e, () => {})) live(); };
      if ($('#q-planta')) $('#q-planta').onchange = e => { if (PLANTS.includes(e.target.value)) { plant = e.target.value; draw().catch(showErr); } };
      form.onsubmit = async e => {
        e.preventDefault();
        if (uploading) return showErr(new Error('Espera a que terminen de subir las fotos'));
        const btn = form.querySelector('.btn-primary'); btn.disabled = true;
        try {
          const answers = collect(form, secs);
          const r = edit ? await api(kind === 'NC' ? '/api/calidad/nc/actualizar' : '/api/calidad/formato/editar', { folio: prev.folio, answers })
            : await api('/api/calidad/' + kind.toLowerCase(), { planta: plant, answers, origen: prev?.folio || '' });
          views.qhecho(kind, r, edit);
        } catch (err) { showErr(err); btn.disabled = false; }
      };
      live();
    };
    await draw();
  },

  // Resultado de guardar un registro de Calidad: folio, lotes y el siguiente paso (p. ej. levantar el no conforme).
  qhecho(kind, r, edit) {
    const box = (cls, icon, html) => `<div class="rounded-xl p-4 flex items-start gap-3 ${cls}"><span class="material-symbols-outlined">${icon}</span><p class="text-body-md">${html}</p></div>`;
    const msg = kind === 'REC' ? (r.anomalia ? box('bg-tertiary-fixed text-on-tertiary-fixed', 'warning', 'Hay diferencia de conteo o algo en "No". Anótalo en la remisión antes de firmar y levanta el no conforme.') : '')
        + `<p class="text-body-md">Lote POLAR de la remisión: <b>${esc(r.partidas[0]?.lote)}</b> · ${r.partidas.map(p => `${esc(p.parte)}: ${esc(p.contada)} pza`).join(', ')}</p>`
      : kind === 'LIB' ? (r.status === 'RETENIDO' ? box('bg-error-container text-on-error-container', 'block', `El lote ${esc(r.lote)} quedó <b>RETENIDO</b>. Levanta ahora el no conforme (PL-FOR-30).`)
        : `<p class="text-body-md">Lote <b>${esc(r.lote)}</b>: ${statusChip(r.status)} · aceptación ${esc(r.pct)} %</p>`
          + (r.retenidas ? box('bg-error-container text-on-error-container', 'block', `Liberación parcial: salieron <b>${esc(r.aceptadas)}</b> piezas y <b>${r.retenidas}</b> quedan <b>RETENIDAS</b>. Sepáralas, identifícalas y levanta ahora el no conforme (PL-FOR-30).`) : '')
          + (r.quedan > 0 ? box('bg-tertiary-fixed text-on-tertiary-fixed', 'pending_actions', `Entrega parcial: quedan <b>${r.quedan}</b> piezas del lote por liberar. La recepción ${esc(r.rec)} sigue abierta hasta entregar todo.`) : ''))
      : kind === 'VIS' ? `<p class="text-body-md">Visita de <b>${esc(r.nombre)}</b> (${esc(r.empresa)}) registrada.</p>`
        + (r.tipo === 'Dependencia de gobierno' ? box('bg-error-container text-on-error-container', 'call', 'Dependencia de gobierno: ya se avisó a gerencia en la app. <b>Llámales también por teléfono.</b>') : '')
      : kind !== 'NC' ? `<p class="text-body-md">Resultado: ${statusChip(r.status)}${r.status.startsWith('RECHAZADA') ? ' · se avisó a gerencia' : ''}</p>`
        + (r.sin_respaldo === 'Sí' ? box('bg-tertiary-fixed text-on-tertiary-fixed', 'warning', 'Actualización de software <b>sin respaldo</b> previo.') : '')
      : `<p class="text-body-md">Estatus ${statusChip(r.estatus)} · ¿Requiere 8D? (sugerido): <b>${esc(r.sugiere_8d)}</b></p>${edit ? '' : '<p class="text-body-sm text-on-surface-variant">Se avisó a gerencia.</p>'}`;
    const nc = (kind === 'REC' && r.anomalia) || (kind === 'LIB' && r.requiereNC);
    $('#app').innerHTML = `
    <div class="flex flex-col items-center text-center gap-3 pt-6 ${WIDE ? 'max-w-xl mx-auto' : ''}">
      <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center"><span class="material-symbols-outlined text-[36px]">task_alt</span></div>
      <h1 class="text-2xl font-bold">${esc(r.folio)} ${edit ? 'actualizado' : 'guardado'}</h1>
      <div class="flex flex-col gap-3 w-full text-left">${msg}</div>
      ${nc ? `<a href="#/nc/${esc(r.folio)}" class="btn btn-primary w-full"><span class="material-symbols-outlined">report</span>Crear no conforme</a>` : ''}
      <a href="#/q/${esc(r.folio)}" class="btn border-[1.5px] border-[#cbd5e1] text-primary w-full"><span class="material-symbols-outlined">description</span>Ver / imprimir ${esc(r.folio)}</a>
      ${kind === 'VIS' ? '<a href="#/visita" class="btn border-[1.5px] border-[#cbd5e1] text-primary w-full"><span class="material-symbols-outlined">how_to_reg</span>Registrar otra visita</a>' : ''}
      <a href="${kind === 'VIS' ? '#/visitas' : '#/calidad'}" class="btn border-[1.5px] border-[#cbd5e1] w-full">Volver a ${kind === 'VIS' ? 'Visitantes' : 'Calidad'}</a>
    </div>`;
  },

  // Registro de Calidad: documento imprimible + siguientes pasos (entregar, levantar o cerrar el no conforme).
  async q(folio) {
    const r = await api('/api/calidad/registro?folio=' + encodeURIComponent(decodeURIComponent(folio)));
    const entrega = r.kind === 'LIB' && r.status === 'LIBERADO' ? r.sections.find(s => s.n === 5).fields.map(f => ({ ...f, required: ['entrega_fecha', 'remision_polar', 'recibio'].includes(f.id) })) : null;
    const needNC = !r.ligados.length && ((r.kind === 'REC' && r.status === 'CON OBSERVACIONES') || (r.kind === 'LIB' && (r.status === 'RETENIDO' || r.data.disposicion === 'LIBERADO PARCIAL')));
    $('#app').innerHTML = `
    <div class="no-print flex flex-wrap items-center justify-between gap-2 mb-4">
      <a href="${r.kind === 'VIS' ? '#/visitas' : '#/calidad'}" class="text-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined">arrow_back</span>${r.kind === 'VIS' ? 'Visitantes' : 'Calidad'}</a>
      <div class="flex flex-wrap gap-2">
        ${needNC ? `<a href="#/nc/${esc(r.folio)}" class="btn btn-primary"><span class="material-symbols-outlined">report</span>Crear no conforme</a>` : ''}
        ${r.kind === 'NC' && r.status === 'ABIERTO' ? `<a href="#/ncedit/${esc(r.folio)}" class="btn btn-primary"><span class="material-symbols-outlined">edit</span>Actualizar / cerrar</a>` : ''}
        ${me.role === 'admin' && ['CL21', 'CL22', 'CL23', 'PLA', 'MT', 'VIS'].includes(r.kind) ? `<a href="#/fmtedit/${esc(r.folio)}" class="btn btn-primary"><span class="material-symbols-outlined">edit</span>Corregir</a>` : ''}
        <button onclick="print()" class="btn border-[1.5px] border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">print</span>Imprimir</button>
      </div></div>
    <p id="err" class="text-sm text-error hidden no-print" role="alert"></p>
    ${r.lotes.length || r.ligados.length ? `<div class="no-print card p-3 mb-3 flex flex-col gap-1 text-body-md">
      ${r.lotes.length ? `<p>Lotes: ${r.lotes.map(l => `${esc(l.code)} ${statusChip(l.status)}`).join(' ')}</p>` : ''}
      ${r.ligados.length ? `<p>No conformes ligados: ${r.ligados.map(n => `<a href="#/q/${esc(n.folio)}" class="text-primary font-semibold">${esc(n.folio)}</a> ${statusChip(n.status)}`).join(' ')}</p>` : ''}</div>` : ''}
    ${entrega ? `<form id="entrega" class="no-print card p-4 mb-4 flex flex-col gap-3">
      <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">local_shipping</span>Registrar entrega del lote ${esc(r.data.lote)}</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${entrega.map(f => condField(f, input(f, f.id, f.type === 'date' ? ymd() : ''))).join('')}</div>
      <button class="btn btn-primary"><span class="material-symbols-outlined">save</span>Guardar entrega</button></form>` : ''}
    ${r.kind === 'REC' && r.avance?.total ? `<div class="no-print mb-3">${pendientesHtml([r.avance], false)}</div>` : ''}
    ${qDoc(r)}`;
    const form = $('#entrega');
    if (!form) return;
    const aviso = () => syncCond(form, 'aviso', form.elements.aviso_requiere?.value === 'Sí'); // "¿A quién?" solo si hay que avisar
    aviso();
    form.onchange = e => { aviso(); handleUpload(e, () => {}); };
    form.onclick = e => { const d = e.target.closest('[data-del-photo]'); if (d) d.closest('[data-photo]').remove(); };
    form.onsubmit = async e => {
      e.preventDefault();
      if (uploading) return showErr(new Error('Espera a que terminen de subir las fotos'));
      try { await api('/api/calidad/entrega', { folio: r.folio, answers: collect(form, []) }); views.q(r.folio); } catch (err) { showErr(err); }
    };
  },

  async pl(id) {
    const [r] = await api('/api/reports?id=' + Number(id));
    if (!r) throw new Error('Reporte no encontrado');
    const cll = await api(`/api/cll?planta=${encodeURIComponent(r.plant || '')}&fecha=${r.date}`).catch(() => null);
    $('#app').innerHTML = `
    <div class="no-print flex items-center justify-between mb-4">
      <a href="#/admin" class="text-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined">arrow_back</span>Reportes</a>
      <button onclick="print()" class="btn btn-primary"><span class="material-symbols-outlined">print</span>Imprimir</button>
    </div>
    ${plDoc(r)}
    ${cll?.registro ? `<div style="break-before:page" class="mt-6">${cllDoc({ ...cll.registro, plant: r.plant })}</div>` : ''}`;
  },
};

// El encargado ve calidad + retroalimentación; el admin ve además resumen IA y el PL-FOR-26 completo.
// canEdit: botón "Corregir" (el servidor vuelve a revisar que se pueda).
function reportCard(r, admin = false, canEdit = false) {
  const inc = nInc(r), blocked = inc > 0, fotos = photosOf(r);
  return `
  <details class="card p-4">
    <summary class="flex items-start gap-3">
      <div class="w-10 h-10 shrink-0 rounded-lg ${blocked ? 'bg-tertiary-fixed text-tertiary' : 'bg-secondary-container text-on-secondary-container'} flex items-center justify-center">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">${blocked ? 'warning' : 'assignment_turned_in'}</span></div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold">${admin ? esc(r.name) : fdate(r.date)}</p>
        <div class="flex flex-wrap items-center gap-2 mt-1">${qChip(r.score)}<span class="text-xs text-on-surface-variant">${admin ? fdate(r.date) + ' · ' : ''}${esc(r.plant || '')}${r.answers.turno ? ' · ' + esc(r.answers.turno) : ''}${inc ? ` · ${inc} ${inc === 1 ? 'incidencia' : 'incidencias'}` : ''}</span></div>
        ${admin && r.summary && WIDE ? `<p class="text-sm text-on-surface-variant mt-2 line-clamp-2">${esc(r.summary)}</p>` : ''}
      </div>
      <span class="material-symbols-outlined text-on-surface-variant">expand_more</span>
    </summary>
    ${admin && r.summary ? `<div class="mt-3 p-3 rounded-lg bg-surface-container-low"><p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">auto_awesome</span>Resumen IA</p><p class="text-sm mt-1">${esc(r.summary)}</p></div>` : ''}
    ${r.feedback ? `<div class="mt-3 p-3 rounded-lg bg-surface-container-low"><p class="text-xs font-semibold text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">lightbulb</span>Retroalimentación</p><p class="text-sm mt-1">${esc(r.feedback)}</p></div>` : ''}
    ${fotos.length ? `<div class="mt-3 flex flex-wrap gap-2">${fotos.map(([l, k]) => `<a href="/api/files/${esc(k)}" target="_blank" title="${esc(l)}"><img src="/api/files/${esc(k)}" alt="${esc(l)}" loading="lazy" class="w-16 h-16 object-cover rounded-lg"></a>`).join('')}</div>` : ''}
    <div class="flex gap-2 mt-3">
      ${admin ? `<a href="#/pl/${r.id}" class="btn btn-primary flex-1"><span class="material-symbols-outlined">description</span>Ver PL-FOR-26</a>` : ''}
      ${canEdit ? `<a href="#/editar/${r.id}" class="btn border-[1.5px] border-[#cbd5e1] text-primary flex-1"><span class="material-symbols-outlined">edit</span>Corregir</a>` : ''}
    </div>
  </details>`;
}

// ---------- Nómina (antes el artefacto "Nómina POLAR") ----------
// Admin: todo (pestaña Nómina con totales, sueldos, cierres y parámetros). Encargado con acceso (Cuentas → Nómina):
// Capturar, Incidencias, Bonos, Vacaciones y Empleados de su planta, sin montos — el servidor ni siquiera los manda.
const NT = {
  falta: { l: 'Falta', u: 'días', s: -1, b: 'dia', quita: 1 }, retardo: { l: 'Retardo', u: 'veces', s: 0, quita: 1 },
  permiso_sg: { l: 'Permiso sin goce', u: 'días', s: -1, b: 'dia', quita: 1 }, permiso_cg: { l: 'Permiso con goce', u: 'días', s: 0 },
  incapacidad: { l: 'Incapacidad', u: 'días', s: -1, b: 'dia', quita: 1 }, vacacion: { l: 'Vacaciones', u: 'días', s: 0 },
  te: { l: 'Tiempo extra', u: 'horas', s: 1, b: 'hora' }, dia_extra: { l: 'Día extra / domingo', u: 'días', s: 1, b: 'dia' },
  bono: { l: 'Bono', u: '$', s: 1, b: 'monto' }, bono_puntualidad: { l: 'Bono de puntualidad', u: '$', s: 1, b: 'monto' },
  descuento: { l: 'Descuento / préstamo', u: '$', s: -1, b: 'monto' },
};
const CAP_TIPOS = ['falta', 'te', 'dia_extra', 'vacacion', 'retardo', 'permiso_cg', 'permiso_sg', 'incapacidad', 'bono', 'descuento'];
const MOTIVOS = ['Productividad', 'Terminar trabajo urgente', 'Trabajo en fin de semana', 'Apoyo en otra planta', 'Desempeño del mes'];
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOWL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const pdate = s => { const [a, b, c] = String(s).split('-').map(Number); return new Date(a, b - 1, c); };
const addD = (s, n) => { const d = pdate(s); d.setDate(d.getDate() + n); return ymd(d); };
const nextSat = s => { const d = pdate(s); while (d.getDay() !== 6) d.setDate(d.getDate() + 1); return ymd(d); };
const weekNo = sat => { const f = new Date(pdate(sat).getFullYear(), 0, 1); while (f.getDay() !== 6) f.setDate(f.getDate() + 1); return Math.round((pdate(sat) - f) / 864e5 / 7) + 1; };
const dBetween = (a, b) => Math.round((pdate(b) - pdate(a)) / 864e5);
const fc = s => s ? fdate(s, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const fcy = s => s ? fdate(s, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const r2 = n => Math.round((+n || 0) * 100) / 100;
const mesL = m => `${MESL[+m.slice(5) - 1]} ${m.slice(0, 4)}`;
// Tipos de empleado (contrato). Los de confianza solo los ve el admin (el servidor no se los manda a nadie más).
const CONTRATO = [['planta', 'Empleados de planta', 'El personal de siempre.'],
  ['provisional', 'Empleados provisionales', 'Trabajadores temporales que no se quedan mucho tiempo (albañiles, apoyos por obra).'],
  ['confianza', 'Empleados de confianza', 'Jefes y personal de confianza. Solo los ve el administrador.']];
const NTABS = [['nomina', 'Nómina'], ['ia', 'Asistente IA'], ['capturar', 'Capturar'], ['incidencias', 'Incidencias'], ['bonos', 'Bonos'], ['vacaciones', 'Vacaciones'], ['empleados', 'Empleados']];
let N = null; // estado de la pantalla (se conserva al cambiar de pestaña)

const nomAdmin = () => N.d.admin;
const nomEmps = (all = false) => {
  const ord = N.d.areas;
  return N.d.emps.filter(e => all || !e.baja || e.baja >= addD(ymd(), -60))
    .sort((a, b) => ord.indexOf(a.planta) - ord.indexOf(b.planta) || a.nombre.localeCompare(b.nombre));
};
const empById = id => N.d.emps.find(e => e.id === Number(id));
// Cálculos en pesos: solo el admin tiene los datos (config y sueldos).
const P = () => ({ div: +N.d.config.diasDivisor || 6, hrs: +N.d.config.horasJornada || 8, fac: +N.d.config.factorTE || 2 });
const salDiario = e => e.pago === 'dia' ? +e.sueldo || 0 : (+e.sueldo || 0) / P().div;
const teManual = e => e.teModo === 'manual';
const teFormula = e => r2(salDiario(e) / P().hrs * P().fac);
const teRate = e => teManual(e) ? +e.te || 0 : teFormula(e);
const amountOf = (i, e) => {
  const t = NT[i.tipo];
  if (!t?.s) return 0;
  return r2(t.s * (+i.cantidad || 0) * (t.b === 'dia' ? salDiario(e) : t.b === 'hora' ? teRate(e) : 1));
};
// Periodo pagado: la semana del área que termina antes del sábado de pago.
// Periodo que se paga en ese día de pago: la semana de la planta (según su día de inicio), menos su desfase en semanas.
function periodo(area, payday) {
  const end = (+(N.d.config?.inicio?.[area] ?? 6) + 6) % 7, d = pdate(payday), lag = 7 * (+(N.d.config?.desfase?.[area]) || 0);
  while (d.getDay() !== end) d.setDate(d.getDate() - 1);
  return { ini: addD(ymd(d), -6 - lag), fin: addD(ymd(d), -lag) };
}
// Día de pago cuyo periodo (de esa planta) contiene la fecha: ahí queda la incidencia.
function paydayOf(area, f) {
  for (let k = -1; k < 6; k++) { const p = addD(nextSat(f), 7 * k), q = periodo(area, p); if (f >= q.ini && f <= q.fin) return p; }
  return nextSat(f);
}
const navArea = () => me.plant && N.d.areas.includes(me.plant) ? me.plant : N.d.areas[0];
// Periodo de la incidencia: el que guardó el servidor al capturarla (las viejas sin él se calculan por su fecha).
const incPay = i => i.payday || paydayOf(empById(i.empleadoId)?.planta || navArea(), i.fecha);
const enSemana = i => incPay(i) === N.payday;
// Selector de semana para Capturar e Incidencias (todos los usuarios): cada incidencia vive en la semana de su fecha.
const perNav = () => { const hoy = paydayOf(navArea(), ymd()), arrow = (d, ic, l) => `<button type="button" data-act="wk" data-d="${d}" class="btn border-[1.5px] border-[#cbd5e1] !px-3 shrink-0" aria-label="${l}"><span class="material-symbols-outlined">${ic}</span></button>`;
  return `<div class="mb-4"><p class="text-label-md text-on-surface-variant mb-1">Periodo de pago</p>
    <div class="flex items-center gap-2">${arrow(-1, 'chevron_left', 'Anterior')}
    <select data-per class="input flex-1 min-w-0" aria-label="Periodo de pago">${perList(hoy).map(p => { const n = N.d.incs.filter(i => incPay(i) === p).length;
      return `<option value="${p}" ${p === N.payday ? 'selected' : ''}>Semana ${weekNo(p)} · pago ${fc(p)}${p === hoy ? ' (actual)' : ''}${n ? ` · ${n} incidencia${n > 1 ? 's' : ''}` : ''}</option>`; }).join('')}</select>
    ${arrow(1, 'chevron_right', 'Siguiente')}</div>
    <p class="text-body-sm text-on-surface-variant mt-1">${N.d.areas.map(a => { const q = periodo(a, N.payday); return `${esc(a)}: del <b>${fc(q.ini)}</b> al <b>${fc(q.fin)}</b>`; }).join(' · ')}
      ${N.payday === hoy ? '· semana actual' : '· <button type="button" data-act="wkhoy" class="text-primary font-semibold">Ir a esta semana</button>'}</p></div>`; };
// Periodos para elegir: los que tienen incidencias guardadas + las últimas 8 semanas y las 2 siguientes.
const perList = hoy => [...new Set([...N.d.incs.map(incPay), N.payday, ...Array.from({ length: 11 }, (_, k) => addD(hoy, 7 * (2 - k)))])].sort().reverse();
// Renglones de la semana: sueldo base (proporcional si entró o salió a media semana) + incidencias de su periodo (no se acumulan; solo lo diferido pasa a la siguiente).
function calcSemana(payday) {
  return nomEmps(true).flatMap(e => {
    const p = periodo(e.planta, payday);
    if ((e.ingreso && e.ingreso > p.fin) || (e.baja && e.baja < p.ini)) return [];
    let base;
    if (e.pago === 'dia') base = (+e.sueldo || 0) * (+e.diasBase || 1);
    else {
      const dias = dBetween(e.ingreso > p.ini ? e.ingreso : p.ini, e.baja && e.baja < p.fin ? e.baja : p.fin) + 1;
      base = dias >= 7 ? +e.sueldo || 0 : Math.min(P().div, dias) * salDiario(e);
    }
    const items = N.d.incs.filter(i => i.empleadoId === e.id && !i.aplicado && (incPay(i) === payday || (i.diferido && incPay(i) < payday))).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const L = { e, p, base: r2(base), faltas: 0, te: 0, teH: 0, extras: 0, desc: 0, arr: 0, items, menor: false };
    for (const i of items) {
      i._amt = amountOf(i, e); i._arr = incPay(i) < payday;
      if (i.diferido) continue;
      if (i._arr) L.arr += i._amt;
      if (['falta', 'permiso_sg', 'incapacidad'].includes(i.tipo)) L.faltas += i._amt;
      else if (i.tipo === 'te') { L.te += i._amt; L.teH += +i.cantidad || 0; }
      else if (i.tipo === 'descuento') L.desc += i._amt;
      else if (i._amt > 0) L.extras += i._amt;
      if (esMenor(e) && ['te', 'dia_extra'].includes(i.tipo)) L.menor = true;
    }
    L.total = r2(L.base + L.faltas + L.te + L.extras + L.desc);
    return [L];
  });
}
// Bono de puntualidad: se pierde con falta, retardo, permiso sin goce o incapacidad en el mes.
function bonoStatus(e, mes) {
  const ini = mes + '-01', fin = ymd(new Date(pdate(ini).getFullYear(), pdate(ini).getMonth() + 1, 0)), mine = N.d.incs.filter(i => i.empleadoId === e.id);
  const ya = mine.find(i => i.tipo === 'bono_puntualidad' && i.mes === mes);
  if (ya) return { st: 'ya', inc: ya };
  if (e.pago === 'dia' || !(+e.bono > 0 || e.conBono)) return { st: 'na' };
  if (e.ingreso && e.ingreso > ini) return { st: 'no', why: 'Entró el ' + fcy(e.ingreso) };
  if (e.baja && e.baja < fin) return { st: 'no', why: 'Baja el ' + fcy(e.baja) };
  const malas = mine.filter(i => NT[i.tipo]?.quita && i.fecha >= ini && i.fecha <= fin);
  return malas.length ? { st: 'no', why: malas.map(i => `${NT[i.tipo].l} ${fc(i.fecha)}`).join(', ') } : { st: 'si' };
}
// Vacaciones LFT (reforma 2023): 12 el primer año, +2 por año hasta 20, luego +2 cada 5 años.
const vacTabla = y => y < 1 ? 0 : y <= 5 ? 10 + 2 * y : y <= 10 ? 22 : y <= 15 ? 24 : y <= 20 ? 26 : y <= 25 ? 28 : y <= 30 ? 30 : 32;
function vacInfo(e) {
  if (!e.ingreso) return null;
  const ing = pdate(e.ingreso), hoy = pdate(ymd());
  let y = hoy.getFullYear() - ing.getFullYear();
  if (new Date(hoy.getFullYear(), ing.getMonth(), ing.getDate()) > hoy) y--;
  const ini = y >= 1 ? ymd(new Date(ing.getFullYear() + y, ing.getMonth(), ing.getDate())) : e.ingreso;
  const prox = ymd(new Date(ing.getFullYear() + y + 1, ing.getMonth(), ing.getDate()));
  const tomados = N.d.incs.filter(i => i.empleadoId === e.id && i.tipo === 'vacacion' && i.fecha >= ini && i.fecha < prox).reduce((s, i) => s + (+i.cantidad || 0), 0) + (+e.vacAjuste || 0);
  return { anios: y, ini, prox, tocan: vacTabla(y), tomados, disp: vacTabla(y) - tomados, proxTocan: vacTabla(y + 1) };
}
// Texto de una incidencia; las de pesos sin monto para el encargado (el servidor no lo manda).
const incLabel = i => { const t = NT[i.tipo] || { l: i.tipo, u: '' };
  return `${t.l}${i.mes ? ' ' + mesL(i.mes) : ''}${i.cantidad == null ? '' : ' · ' + (t.u === '$' ? money(+i.cantidad) : `${+i.cantidad} ${t.u}`)}`; };
const nChip = (txt, cls = 'bg-surface-container text-on-surface-variant') => `<span class="chip ${cls}">${esc(txt)}</span>`;
// CURP (mismo formato que el servidor): la fecha de nacimiento va en las posiciones 5-10 (AAMMDD) y el siglo en la 17.
const CURP_RE = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
const curpNac = c => `${/\d/.test(c[16]) ? '19' : '20'}${c.slice(4, 6)}-${c.slice(6, 8)}-${c.slice(8, 10)}`;
const edadDe = f => { const [y, m, d] = f.split('-').map(Number), [Y, M, D] = ymd().split('-').map(Number); return Y - y - (M < m || (M === m && D < d) ? 1 : 0); };
// Expediente del empleado (mismo catálogo que DOCS_EMP en app.mjs): se marca con X. La INE es "si aplica": no cuenta como faltante.
const DOCS_EMP = [['acta', 'Acta de nacimiento'], ['nss', 'NSS'], ['domicilio', 'Comprobante de domicilio'], ['solicitud', 'Solicitud de empleo'],
  ['contrato', 'Contrato'], ['rfc', 'RFC'], ['ine', 'INE (si aplica)'], ['foto', 'Fotografía']];
const docsFaltan = e => DOCS_EMP.filter(([k]) => k !== 'ine' && !(e.docs || []).includes(k)).map(([, l]) => l);
// Menor de edad: con fecha de nacimiento se calcula (se mantiene al día); sin ella, la casilla que se marcó a mano.
const esMenor = e => e?.nacimiento ? edadDe(e.nacimiento) < 18 : !!e?.menor;
const OKC = 'bg-secondary-container text-on-secondary-container', WARN = 'bg-tertiary-fixed text-on-tertiary-fixed', BAD = 'bg-error-container text-on-error-container';
const tbl = (head, rows, empty) => `<div class="card overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-[11px] uppercase tracking-wide text-on-surface-variant">${head.map(h => `<th class="px-3 py-2 font-semibold whitespace-nowrap ${h.startsWith('#') ? 'text-right' : ''}">${esc(h.replace('#', ''))}</th>`).join('')}</tr></thead>
  <tbody>${rows || `<tr><td colspan="${head.length}" class="px-3 py-6 text-center text-on-surface-variant">${empty}</td></tr>`}</tbody></table></div>`;
const td = (v, right) => `<td class="px-3 py-2 border-t border-[#f1f5f9] align-top ${right ? 'text-right tabular-nums whitespace-nowrap' : ''}">${v}</td>`;
const sel = (attrs, opts, v) => `<select class="input" ${attrs}>${opts.map(([k, l]) => `<option value="${esc(k)}" ${String(k) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const weekNav = (act, title, sub, extra = '') => `<div class="flex flex-wrap items-center gap-3 mb-4">
  <button type="button" data-act="${act}" data-d="-1" class="btn border-[1.5px] border-[#cbd5e1] !px-3" aria-label="Anterior"><span class="material-symbols-outlined">chevron_left</span></button>
  <div class="min-w-0"><h2 class="text-headline-md">${title}</h2><p class="text-body-sm text-on-surface-variant">${sub}</p></div>
  <button type="button" data-act="${act}" data-d="1" class="btn border-[1.5px] border-[#cbd5e1] !px-3" aria-label="Siguiente"><span class="material-symbols-outlined">chevron_right</span></button>${extra}</div>`;

// Excel (.xlsx) o CSV a texto para el asistente, sin librerías: un .xlsx es un zip de XML y el navegador lo abre con DecompressionStream.
async function leerArchivo(file) {
  if (/\.(csv|txt)$/i.test(file.name)) return file.text();
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Sube un Excel .xlsx o un .csv (en Excel: Archivo → Guardar como → Libro de Excel)');
  const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer), files = {};
  let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; // fin del directorio del zip
  if (e < 0) throw new Error('El archivo no es un Excel válido');
  for (let i = 0, p = dv.getUint32(e + 16, true); i < dv.getUint16(e + 10, true); i++) {
    const n = dv.getUint16(p + 28, true), off = dv.getUint32(p + 42, true), start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
    files[new TextDecoder().decode(buf.subarray(p + 46, p + 46 + n))] = { method: dv.getUint16(p + 10, true), data: buf.subarray(start, start + dv.getUint32(p + 20, true)) };
    p += 46 + n + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  const xml = async name => { const f = files[name];
    const txt = !f ? '' : f.method ? await new Response(new Blob([f.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text() : new TextDecoder().decode(f.data);
    return new DOMParser().parseFromString(txt || '<x/>', 'application/xml'); };
  const tags = (doc, t) => [...doc.getElementsByTagName(t)], texto = el => tags(el, 't').map(t => t.textContent).join('');
  const strings = tags(await xml('xl/sharedStrings.xml'), 'si').map(texto);
  const rels = Object.fromEntries(tags(await xml('xl/_rels/workbook.xml.rels'), 'Relationship').map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
  const col = ref => [...ref.replace(/\d+/g, '')].reduce((t, ch) => t * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  let out = '';
  for (const sh of tags(await xml('xl/workbook.xml'), 'sheet')) {
    const tg = rels[sh.getAttribute('r:id')] || '', rows = tags(await xml(tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg), 'row').map(r => {
      const cells = [];
      for (const c of tags(r, 'c')) { const t = c.getAttribute('t'), v = tags(c, 'v')[0]?.textContent ?? '', ref = c.getAttribute('r');
        cells[ref ? col(ref) : cells.length] = t === 's' ? strings[v] : t === 'inlineStr' ? texto(c) : v; }
      return [...cells].map(v => String(v ?? '').trim()).join(' | ').replace(/( \|\s*)+$/, '');
    }).filter(r => r.replace(/[\s|]/g, ''));
    if (rows.length) out += `### Hoja: ${sh.getAttribute('name')}\n${rows.join('\n')}\n\n`;
  }
  return out;
}
// Aplica las propuestas marcadas (ya editadas por el admin) con las rutas normales: primero empleados, después incidencias.
async function nomAplicar() {
  const c = N.chat, sel = c.cambios.filter(x => x.incluir), errs = [], norm = v => String(v ?? '').trim().toLowerCase();
  let ok = 0;
  c.busy = true; nomDraw();
  for (const x of sel.filter(x => x.tipo === 'empleado')) {
    const { tipo, incluir, ...rest } = x, old = x.id ? empById(x.id) : null;
    const d = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v != null)); // vacío = sin cambio
    try { await api('/api/nomina/emp', { ...(old || {}), ...d, id: old?.id }); ok++; } catch (err) { errs.push(`${x.nombre}: ${err.message}`); }
  }
  N.d = await api('/api/nomina');
  for (const x of sel.filter(x => x.tipo === 'incidencia')) {
    const id = Number(x.empleadoId) || N.d.emps.find(e => norm(e.nombre) === norm(x.empleado))?.id;
    if (!id) { errs.push(`${x.empleado || '(sin nombre)'}: no existe ese empleado`); continue; }
    try { await api('/api/nomina/inc', { emps: [id], tipo: x.clase, fecha: x.fecha, cantidad: +x.cantidad, nota: x.nota }); ok++; }
    catch (err) { errs.push(`${x.empleado} · ${NT[x.clase]?.l || x.clase}: ${err.message}`); }
  }
  N.d = await api('/api/nomina');
  c.cambios = []; c.busy = false;
  c.msgs.push({ rol: 'sistema', texto: `Apliqué ${ok} cambio${ok === 1 ? '' : 's'}.${errs.length ? ' No se pudieron: ' + errs.join(' · ') : ''}` });
  nomDraw();
}
async function nomEnviar() {
  const c = N.chat, texto = c.draft.trim();
  if (!texto && !c.file) return showErr(new Error('Escribe un mensaje o adjunta un archivo'));
  c.msgs.push({ rol: 'admin', texto: texto || 'Revisa el archivo y propón los cambios.', archivo: c.file?.nombre });
  const archivo = c.file; c.draft = ''; c.file = null; c.busy = true; nomDraw();
  try {
    const r = await api('/api/nomina/ai', { mensajes: c.msgs.filter(m => m.rol !== 'sistema').map(({ rol, texto }) => ({ rol, texto })), archivo });
    c.msgs.push({ rol: 'ia', texto: r.respuesta || 'Listo.' });
    c.cambios = r.cambios.map(x => ({ ...x, incluir: true }));
  } catch (err) { c.msgs.push({ rol: 'sistema', texto: 'No se pudo: ' + err.message }); }
  c.busy = false; nomDraw();
}

const nomTabs = {
  // Asistente con IA (solo admin): conversa, lee Excel / CSV y PROPONE altas o cambios de empleados e incidencias.
  // Cada propuesta se puede editar a mano o quitar antes de aplicar; las demás pestañas siguen para capturar a mano.
  ia() {
    const c = N.chat, emps = nomEmps(true);
    const bubble = m => m.rol === 'sistema' ? `<p class="self-center text-center text-body-sm text-on-surface-variant max-w-[90%]">${esc(m.texto)}</p>`
      : `<div class="max-w-[85%] ${m.rol === 'admin' ? 'self-end bg-primary text-white' : 'self-start bg-surface-container-low'} rounded-2xl px-4 py-2.5 text-body-md whitespace-pre-wrap">${esc(m.texto)}${m.archivo ? `<span class="block mt-1 text-[11px] opacity-80">📎 ${esc(m.archivo)}</span>` : ''}</div>`;
    // Campos editables de cada propuesta, con su etiqueta (L = etiqueta).
    const L = (label, html, wide) => `<label class="flex flex-col gap-1 text-label-sm text-on-surface-variant ${wide ? 'col-span-2' : ''}"><span>${label}</span>${html}</label>`;
    const inp = (i, k, v, type = 'text', attrs = '') => `<input class="input !py-2" data-ci="${i}" data-k="${k}" type="${type}" value="${esc(v ?? '')}" ${attrs}>`;
    const extra = x => ['te', 'teModo', 'diasBase', 'baja', 'vacAjuste', 'menor', 'notas'].filter(k => x[k] !== undefined);
    const fila = (x, i) => `<div class="p-3 rounded-xl ${x.incluir ? 'bg-surface-container-low' : 'bg-surface-container-low/40 opacity-60'} flex flex-col gap-2">
      <label class="flex items-center gap-2 text-label-md"><input type="checkbox" data-ci="${i}" data-k="incluir" ${x.incluir ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">
        ${x.tipo === 'empleado' ? nChip(x.id ? 'Cambio de empleado' : 'Empleado nuevo', x.id ? WARN : OKC) : nChip('Incidencia')}</label>
      ${x.tipo === 'incidencia' ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        ${L('Empleado', sel(`data-ci="${i}" data-k="empleadoId"`, [['', x.empleado ? `(se da de alta) ${x.empleado}` : 'Elige…'], ...emps.map(e => [e.id, e.nombre])], x.empleadoId ?? ''), true)}
        ${L('Tipo', sel(`data-ci="${i}" data-k="clase"`, CAP_TIPOS.map(k => [k, NT[k].l]), x.clase), true)}
        ${L('Fecha', inp(i, 'fecha', x.fecha, 'date'))}${L(`Cantidad (${NT[x.clase]?.u === '$' ? 'pesos' : NT[x.clase]?.u || ''})`, inp(i, 'cantidad', x.cantidad, 'number', 'min="0" step="0.5"'))}
        ${L('Nota', inp(i, 'nota', x.nota), true)}</div>`
      : `<div class="grid grid-cols-2 lg:grid-cols-4 gap-2">${L('Nombre', inp(i, 'nombre', x.nombre), true)}
        ${L('Planta', sel(`data-ci="${i}" data-k="planta"`, N.d.areas.map(a => [a, a]), x.planta))}
        ${L('Forma de pago', sel(`data-ci="${i}" data-k="pago"`, [['', '(sin cambio)'], ['semana', 'Sueldo semanal'], ['dia', 'Por día']], x.pago ?? ''))}
        ${L('Sueldo ($)', inp(i, 'sueldo', x.sueldo, 'number', 'min="0" placeholder="(sin cambio)"'))}${L('Bono puntualidad ($)', inp(i, 'bono', x.bono, 'number', 'min="0" placeholder="(sin cambio)"'))}
        ${L('Fecha de ingreso', inp(i, 'ingreso', x.ingreso, 'date'), true)}</div>
        ${extra(x).length ? `<p class="text-body-sm text-on-surface-variant">También: ${esc(extra(x).map(k => `${k}: ${x[k]}`).join(' · '))}</p>` : ''}`}</div>`;
    const n = c.cambios.filter(x => x.incluir).length;
    return `${c.msgs.length && !c.busy ? `<div class="flex justify-end mb-2"><button type="button" data-act="ialimpiar" class="text-label-sm text-error font-semibold inline-flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px]">delete_sweep</span><span>Limpiar historial</span></button></div>` : ''}
    <div class="card p-4 flex flex-col gap-3 min-h-[240px]">
      ${c.msgs.length ? c.msgs.map(bubble).join('') : `<div class="text-body-md text-on-surface-variant flex flex-col gap-1"><p class="font-semibold text-on-surface">Asistente de nómina</p>
        <p>Pídele cosas como "Luis faltó el lunes y María hizo 3 horas extra el martes", "da de alta a Pedro Gómez en Silao con 2,300 semanales" o adjunta el Excel de asistencias o de personal para que proponga todo.</p>
        <p class="text-body-sm">Nada se guarda hasta que revisas las propuestas y das "Aplicar". Puedes editarlas o quitar las que no quieras.</p></div>`}
      ${c.busy ? '<p class="self-start flex items-center gap-2 text-body-md text-on-surface-variant"><span class="material-symbols-outlined animate-spin">progress_activity</span>Pensando…</p>' : ''}
    </div>
    ${c.cambios.length ? `<section class="card p-4 mt-3 flex flex-col gap-2"><h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">fact_check</span>Propuestas (${c.cambios.length}) · revisa y corrige antes de aplicar</h2>
      ${c.cambios.map(fila).join('')}
      <div class="flex flex-wrap gap-2 justify-end"><button type="button" data-act="iadescartar" class="btn border-[1.5px] border-[#cbd5e1]">Descartar</button>
        <button type="button" data-act="iaaplicar" class="btn btn-primary" ${n && !c.busy ? '' : 'disabled'}><span class="material-symbols-outlined">done_all</span>Aplicar ${n} cambio${n === 1 ? '' : 's'}</button></div></section>` : ''}
    <form id="iaForm" class="card p-3 mt-3 flex flex-col gap-2">
      <textarea class="input" name="texto" rows="2" maxlength="4000" placeholder="Escribe aquí… (puedes adjuntar un Excel)" aria-label="Mensaje para el asistente">${esc(c.draft)}</textarea>
      <div class="flex flex-wrap items-center gap-2">
        <label class="btn border-[1.5px] border-[#cbd5e1] text-primary cursor-pointer"><span class="material-symbols-outlined">attach_file</span>Excel / CSV
          <input type="file" accept=".xlsx,.csv" class="sr-only" data-iafile></label>
        ${c.file ? `<span class="chip bg-surface-container-high text-primary">📎 ${esc(c.file.nombre)} <button type="button" data-act="iaquitar" aria-label="Quitar archivo" class="ml-1">✕</button></span>` : ''}
        <span class="flex-1"></span>
        <button class="btn btn-primary" ${c.busy ? 'disabled' : ''}><span class="material-symbols-outlined">send</span>Enviar</button></div>
    </form>`;
  },

  nomina() {
    const cierre = N.d.cierres.find(c => c.payday === N.payday), actual = N.payday === nextSat(ymd());
    const head = weekNav('wk', `Semana ${weekNo(N.payday)}`, `Pago ${fc(N.payday)} ${pdate(N.payday).getFullYear()}${actual ? ' · semana actual' : ''}`,
      `${actual ? '' : '<button type="button" data-act="wkhoy" class="text-label-md text-primary font-semibold">Ir a esta semana</button>'}<span class="ml-auto">${cierre ? nChip('Cerrada', OKC) : nChip('Abierta', WARN)}</span>`);
    const pct = +N.d.config.porcentaje || 0;
    const cards = xs => `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">${xs.map(([l, v, w]) => `<div class="card p-4"><p class="text-[11px] uppercase tracking-wide text-on-surface-variant font-semibold">${l}</p><p class="text-xl font-bold mt-1 tabular-nums ${w ? 'text-tertiary' : ''}">${v}</p></div>`).join('')}</div>`;
    const cols = ['Empleado', '#Base', '#Faltas', '#T.E.', '#Bonos / extras', '#Descuentos', '#Total'];
    const csvBtn = '<button type="button" data-act="csv" class="btn border-[1.5px] border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">download</span>Descargar semana (CSV)</button>';
    if (cierre) {
      const ls = cierre.lineas || [];
      return head + cards([['Total pagado', money(cierre.total)], [`Depósito contador +${cierre.porcentaje ?? pct}%`, money(cierre.total * (1 + (cierre.porcentaje ?? pct) / 100))], ['Empleados', ls.length], ['Incidencias pagadas', (cierre.incIds || []).length]])
        + N.d.areas.map(a => { const x = ls.filter(l => l.planta === a); return x.length ? `<h3 class="text-label-lg text-primary mt-4 mb-2">${esc(a)}</h3>` + tbl(cols, x.map(l => `<tr>${td(`<b>${esc(l.nombre)}</b>${l.detalle ? `<br><span class="text-[11px] text-on-surface-variant">${esc(l.detalle)}</span>` : ''}`)}${[l.base, l.faltas, l.te, l.extras, l.desc].map(v => td(v ? money(v) : '—', 1)).join('')}${td(`<b>${money(l.total)}</b>`, 1)}</tr>`).join('')) : ''; }).join('')
        + `<div class="flex flex-wrap gap-2 mt-4">${csvBtn}<span class="flex-1"></span>${N.confirm === 'reabrir' ? `<span class="text-body-sm self-center">Las incidencias de esta semana vuelven a quedar pendientes.</span><button type="button" data-act="reabrir" class="btn bg-error text-white">Sí, reabrir</button><button type="button" data-act="cancel" class="btn border-[1.5px] border-[#cbd5e1]">Cancelar</button>`
          : '<button type="button" data-act="confirm" data-c="reabrir" class="btn border-[1.5px] border-error text-error">Reabrir semana</button>'}</div>`;
    }
    if (!N.d.emps.length) return head + '<div class="card p-5"><p class="font-semibold">Aún no hay empleados</p><p class="text-body-md text-on-surface-variant">Agrégalos en la pestaña Empleados con su sueldo y planta; después captura incidencias y la nómina se arma sola.</p></div>';
    const L = calcSemana(N.payday), total = r2(L.reduce((s, l) => s + l.total, 0));
    const arrN = L.reduce((s, l) => s + l.items.filter(i => i._arr && !i.diferido).length, 0), difN = L.reduce((s, l) => s + l.items.filter(i => i.diferido).length, 0);
    const bonos = nomEmps().filter(e => bonoStatus(e, N.bonoMes).st === 'si'), menores = L.filter(l => l.menor);
    const alert = (cls, b, t, btn = '') => `<div class="rounded-xl p-3 mb-2 flex flex-wrap items-center gap-2 ${cls}"><b>${b}</b><span class="flex-1 min-w-[200px] text-body-md">${t}</span>${btn}</div>`;
    return head + cards([['Total nómina', money(total)], [`Depósito contador +${pct}%`, money(total * (1 + pct / 100))], ['Horas extra', `${L.reduce((s, l) => s + l.teH, 0)} h`], ['Diferidos de semanas pasadas', arrN, arrN]])
      + (bonos.length ? alert(WARN, `Bonos de ${mesL(N.bonoMes)}`, `Le toca bono de puntualidad a ${esc(bonos.map(e => e.nombre.split(' ')[0]).join(', '))} y aún no está en nómina.`, '<a href="#/nomina/bonos" class="text-label-md text-primary font-semibold">Revisar</a>') : '')
      + (menores.length ? alert(BAD, 'Menores de edad', `${esc(menores.map(l => l.e.nombre).join(', '))} tienen tiempo extra o domingo capturado. La LFT prohíbe horas extra y domingos a menores de 18; si se trabajan, se pagan al 200 % adicional.`) : '')
      + (difN ? alert(WARN, `${difN} pago${difN > 1 ? 's' : ''} diferido${difN > 1 ? 's' : ''}`, 'Seguirán apareciendo cada semana hasta que los incluyas.') : '')
      + N.d.areas.map(a => {
        const ls = L.filter(l => l.e.planta === a);
        if (!ls.length) return '';
        return `<div class="flex flex-wrap items-baseline gap-2 mt-4 mb-2"><h3 class="text-label-lg text-primary">${esc(a)}</h3><span class="text-body-sm text-on-surface-variant">Periodo ${fc(ls[0].p.ini)} – ${fc(ls[0].p.fin)}</span><span class="ml-auto font-semibold tabular-nums">${money(r2(ls.reduce((s, l) => s + l.total, 0)))}</span></div>`
          + tbl(cols, ls.map(l => { const op = N.open.has(l.e.id); return `<tr data-act="toggle" data-id="${l.e.id}" class="cursor-pointer hover:bg-surface-container-low" aria-expanded="${op}">
            ${td(`<span class="font-semibold">${op ? '▾' : '▸'} ${esc(l.e.nombre)}</span> ${l.arr ? nChip('arrastra ' + money(l.arr), WARN) : ''} ${l.items.some(i => i.diferido) ? nChip('pago diferido') : ''} ${esMenor(l.e) ? nChip('menor', l.menor ? BAD : undefined) : ''} ${l.e.pago === 'dia' ? nChip('por día') : ''}`)}
            ${td(money(l.base), 1)}${td(l.faltas ? `<span class="text-error">${money(l.faltas)}</span>` : '—', 1)}${td(l.te ? `${money(l.te)}<br><span class="text-[11px] text-on-surface-variant">${l.teH} h</span>` : '—', 1)}
            ${td(l.extras ? money(l.extras) : '—', 1)}${td(l.desc ? `<span class="text-error">${money(l.desc)}</span>` : '—', 1)}${td(`<b>${money(l.total)}</b>`, 1)}</tr>
            ${op ? `<tr><td colspan="7" class="px-3 pb-3 bg-surface-container-low">${l.items.length ? `<ul class="flex flex-col gap-2 pt-2">${l.items.map(i => `<li class="flex flex-wrap items-center gap-2 text-body-md">
              <span class="text-on-surface-variant">${fc(i.fecha)}</span><b>${esc(incLabel(i))}</b>${i._arr ? nChip('diferido de otra semana', WARN) : ''}${i.diferido ? nChip('se paga después') : ''}${i.nota ? `<span class="text-on-surface-variant">${esc(i.nota)}</span>` : ''}
              <span class="ml-auto tabular-nums ${i._amt < 0 ? 'text-error' : ''}">${i._amt ? money(i._amt) : ''}</span>${i._amt > 0 ? `<button type="button" data-act="diferir" data-id="${i.id}" class="text-label-sm text-primary font-semibold">${i.diferido ? 'Incluir esta semana' : 'Pagar después'}</button>` : ''}</li>`).join('')}</ul>`
              : '<p class="pt-2 text-body-md text-on-surface-variant">Sin incidencias. Se paga el sueldo base.</p>'}
              <p class="text-[11px] text-on-surface-variant mt-2">Sueldo ${money(+l.e.sueldo || 0)} ${l.e.pago === 'dia' ? 'por día' : 'semanal'} · día ${money(salDiario(l.e))} · hora extra ${money(teRate(l.e))}${teManual(l.e) ? ' (tarifa propia)' : ''}</p></td></tr>` : ''}`; }).join(''));
      }).join('')
      + `<div class="flex flex-wrap items-center gap-2 mt-4">${csvBtn}<span class="flex-1"></span>${N.confirm === 'cerrar'
        ? `<span class="text-body-sm">Se marcarán como pagadas ${L.reduce((s, l) => s + l.items.filter(i => !i.diferido).length, 0)} incidencias. Lo diferido sigue pendiente.</span><button type="button" data-act="cerrar" class="btn btn-primary">Sí, cerrar semana</button><button type="button" data-act="cancel" class="btn border-[1.5px] border-[#cbd5e1]">Cancelar</button>`
        : '<button type="button" data-act="confirm" data-c="cerrar" class="btn btn-primary"><span class="material-symbols-outlined">lock</span>Cerrar semana y marcar pagado</button>'}</div>`;
  },

  capturar() {
    if (N.cap.pay !== N.payday) { const q = periodo(navArea(), N.payday); N.cap.pay = N.payday; N.cap.fecha = ymd() >= q.ini && ymd() <= q.fin ? ymd() : q.ini; } // fecha dentro de la semana elegida
    const c = N.cap, t = NT[c.tipo], menorSel = [...c.emps].some(id => esMenor(empById(id))) && ['te', 'dia_extra'].includes(c.tipo);
    let last = null;
    const picker = nomEmps().map(e => (e.planta !== last ? `<p class="col-span-full text-[11px] uppercase tracking-wide text-on-surface-variant font-semibold mt-2">${esc(last = e.planta)}</p>` : '')
      + `<label class="flex items-center gap-2 text-body-md py-1"><input type="checkbox" name="cemp" value="${e.id}" ${c.emps.has(e.id) ? 'checked' : ''} class="w-5 h-5 shrink-0 accent-[#2563eb]">${esc(e.nombre)}${esMenor(e) ? ' ' + nChip('menor') : ''}${e.contrato && e.contrato !== 'planta' ? ' ' + nChip(e.contrato) : ''}</label>`).join('');
    const nSem = N.d.incs.filter(enSemana).length;
    return perNav() + `<p class="text-body-md text-on-surface-variant mb-3">Cada incidencia se queda en la semana de su fecha (no se acumula). ${nSem ? `Esta semana: <a href="#/nomina/incidencias" class="text-primary font-semibold">${nSem} capturada${nSem > 1 ? 's' : ''}</a>.` : ''}</p>
    <form id="capForm" class="card p-4 flex flex-col gap-4">
      <div><p class="text-label-md text-on-surface-variant mb-2">Tipo</p><div class="flex flex-wrap gap-2">${CAP_TIPOS.map(k => `<button type="button" data-act="ctipo" data-t="${k}" aria-pressed="${c.tipo === k}" class="px-3 py-2 rounded-full text-label-md border-[1.5px] ${c.tipo === k ? 'bg-primary text-white border-primary' : 'border-[#cbd5e1]'}">${NT[k].l}</button>`).join('')}</div></div>
      <div><p class="text-label-md text-on-surface-variant mb-1">Empleado(s) <span class="font-normal">— marca varios si aplica a más de uno</span></p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 max-h-72 overflow-auto p-3 rounded-xl border-[1.5px] border-[#cbd5e1]">${picker || '<p class="text-on-surface-variant">Agrega empleados primero.</p>'}</div></div>
      <div class="grid grid-cols-2 gap-3">
        ${labeled({ label: `Fecha${c.tipo === 'vacacion' ? ' (primer día)' : ''}`, required: true }, `<input class="input" type="date" name="fecha" value="${esc(c.fecha)}" required>`)}
        ${labeled({ label: `Cantidad (${t.u === '$' ? 'pesos' : t.u})`, required: true }, `<input class="input" type="number" name="cant" min="0" step="${t.u === '$' ? 1 : 0.5}" value="${esc(c.cant)}" required inputmode="decimal">`)}
        ${labeled({ label: c.tipo === 'bono' ? '¿Por qué se le da el bono?' : 'Nota', required: c.tipo === 'bono', wide: true }, `<input class="input" name="nota" maxlength="240" value="${esc(c.nota)}" ${c.tipo === 'bono' ? 'required' : ''} placeholder="${c.tipo === 'te' ? 'Ej. Procesando material de Summit Silao' : c.tipo === 'falta' ? 'Ej. Se reportó enfermo, no trajo receta' : 'Detalle opcional'}">`)}
      </div>
      ${nomAdmin() && t.s > 0 ? `<label class="flex items-center gap-2 text-body-md"><input type="checkbox" name="efectivo" ${c.efectivo ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Ya se le pagó en efectivo (queda registrado, no suma a la nómina)</label>` : ''}
      ${!nomAdmin() && t.u === '$' ? '<p class="text-body-sm text-on-surface-variant">El monto queda guardado para el administrador; después ya no se muestra.</p>' : ''}
      ${menorSel ? `<p class="rounded-xl p-3 ${BAD} text-body-md"><b>Ojo:</b> elegiste a un menor de edad. La LFT prohíbe tiempo extra y domingos a menores de 18.</p>` : ''}
      <div class="flex flex-wrap items-center gap-3"><span id="cprev" class="text-body-sm text-on-surface-variant flex-1">${capPreview()}</span>
        <button class="btn btn-primary"><span class="material-symbols-outlined">save</span>Guardar</button></div>
    </form>`;
  },

  incidencias() {
    const F = N.fil, admin = nomAdmin();
    const L = N.d.incs.filter(i => enSemana(i) && (!F.emp || i.empleadoId === +F.emp) && (!F.tipo || i.tipo === F.tipo) && (F.estado === 'todas' || (F.estado === 'pend' ? !i.aplicado : i.aplicado)))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id), shown = L.slice(0, 300);
    return perNav() + `<div id="filtros" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
      ${sel('name="emp" aria-label="Empleado"', [['', 'Todos los empleados'], ...nomEmps(true).map(e => [e.id, e.nombre])], F.emp)}
      ${sel('name="tipo" aria-label="Tipo"', [['', 'Todos los tipos'], ...Object.entries(NT).map(([k, t]) => [k, t.l])], F.tipo)}
      ${sel('name="estado" aria-label="Estado"', [['pend', 'Pendientes de pago'], ['apl', 'Ya pagadas'], ['todas', 'Todas']], F.estado)}</div>
    <p class="text-body-sm text-on-surface-variant mb-2">${L.length} registro${L.length === 1 ? '' : 's'}</p>
    <div class="card divide-y divide-[#f1f5f9]">${shown.map(i => { const e = empById(i.empleadoId), amt = admin && e ? amountOf(i, e) : 0, can = admin || !i.aplicado; return `
      <div class="flex flex-wrap items-start gap-3 p-3">
        <span class="text-body-sm text-on-surface-variant w-24 shrink-0">${fc(i.fecha)}</span>
        <div class="flex-1 min-w-[180px]"><p class="font-semibold">${esc(e ? e.nombre : '(empleado borrado)')} · ${esc(incLabel(i))}</p>
          <p class="text-body-sm text-on-surface-variant">${i.nota ? esc(i.nota) + ' · ' : ''}${i.aplicado ? (i.efectivo ? 'Pagado en efectivo' : 'Pagado en la semana del ' + fc(i.aplicadoEn)) : i.diferido ? 'Pendiente · se paga después' : 'Pendiente'}${i.creadoPor ? ' · capturó ' + esc(i.creadoPor) : ''}</p></div>
        ${amt ? `<span class="tabular-nums ${amt < 0 ? 'text-error' : ''}">${money(amt)}</span>` : ''}
        ${can ? `<div class="flex gap-3"><button type="button" data-act="editinc" data-id="${i.id}" class="text-label-sm text-primary font-semibold">Editar</button>
          <button type="button" data-act="delinc" data-id="${i.id}" class="text-label-sm text-error font-semibold"><span>Borrar</span></button></div>` : ''}
      </div>`; }).join('') || '<p class="p-6 text-center text-on-surface-variant">No hay incidencias en esta semana con estos filtros.</p>'}</div>
    ${L.length > 300 ? '<p class="text-body-sm text-on-surface-variant mt-2">Se muestran las 300 más recientes. Usa los filtros para ver otras.</p>' : ''}`;
  },

  bonos() {
    const admin = nomAdmin(), mes = N.bonoMes, rows = nomEmps().map(e => ({ e, b: bonoStatus(e, mes) })).filter(r => r.b.st !== 'na'), si = rows.filter(r => r.b.st === 'si');
    const otros = N.d.incs.filter(i => i.tipo === 'bono').sort((a, b) => a.aplicado - b.aplicado || b.fecha.localeCompare(a.fecha)).slice(0, 60), f = N.bf;
    const quitar = i => `<button type="button" data-act="delinc" data-id="${i.id}" class="text-label-sm text-error font-semibold"><span>Quitar</span></button>`;
    return weekNav('bmes', 'Bono de puntualidad', `${mesL(mes)} · se pierde con falta, retardo, permiso sin goce o incapacidad en el mes`,
      si.length ? `<button type="button" data-act="bonoall" class="btn btn-primary ml-auto">Agregar los ${si.length} a nómina</button>` : '')
    + tbl(['Empleado', 'Planta', ...(admin ? ['#Monto'] : []), 'Estado', ''], rows.map(({ e, b }) => `<tr>${td(`<b>${esc(e.nombre)}</b>`)}${td(esc(e.planta))}${admin ? td(money(+e.bono || 0), 1) : ''}
      ${td(b.st === 'ya' ? nChip(b.inc.aplicado ? 'Pagado' : 'En nómina, por pagar', OKC) : b.st === 'si' ? nChip('Le toca', WARN) : `${nChip('No le toca', BAD)} <span class="text-[11px] text-on-surface-variant">${esc(b.why)}</span>`)}
      ${td(b.st === 'si' ? `<button type="button" data-act="bono" data-id="${e.id}" class="text-label-sm text-primary font-semibold">Agregar</button>` : b.st === 'ya' && !b.inc.aplicado ? quitar(b.inc) : '')}</tr>`).join(''),
      admin ? 'Nadie tiene bono asignado. Ponle monto de bono en Empleados.' : 'Nadie de tu planta tiene bono de puntualidad asignado.')
    + '<p class="text-body-sm text-on-surface-variant mt-2">Se revisan las incidencias capturadas en el mes; los meses antes de usar el sistema no tienen faltas registradas. Al agregar, el bono entra a la siguiente nómina abierta.</p>'
    + `<h2 class="text-headline-sm mt-6">Otros bonos</h2><p class="text-body-sm text-on-surface-variant mb-3">Bonos especiales con su motivo. Mientras no se paguen se pueden quitar.</p>
    <form id="bonoForm" class="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end mb-3">
      ${labeled({ label: 'Empleado', required: true, wide: true }, sel('name="emp" required', [['', 'Elige…'], ...nomEmps().map(e => [e.id, e.nombre])], f.emp))}
      ${labeled({ label: 'Monto ($)', required: true }, `<input class="input" type="number" name="monto" min="1" step="1" value="${esc(f.monto)}" required inputmode="decimal">`)}
      ${labeled({ label: 'Fecha', required: true }, `<input class="input" type="date" name="fecha" value="${esc(f.fecha)}" required>`)}
      ${labeled({ label: '¿Por qué se le da el bono?', required: true, wide: true }, `<input class="input" name="motivo" maxlength="160" required value="${esc(f.motivo)}" placeholder="Ej. Se quedó a terminar el material de Mitchell">`)}
      <div class="col-span-2 flex flex-wrap gap-2">${MOTIVOS.map(m => `<button type="button" data-act="bfmot" data-m="${esc(m)}" class="px-3 py-1.5 rounded-full text-label-sm border-[1.5px] border-[#cbd5e1]">${esc(m)}</button>`).join('')}</div>
      <button class="btn btn-primary col-span-2 lg:col-span-4"><span class="material-symbols-outlined">add</span>Agregar bono</button></form>
    <div class="card divide-y divide-[#f1f5f9]">${otros.map(i => `<div class="flex flex-wrap items-center gap-3 p-3">
      <span class="text-body-sm text-on-surface-variant w-24 shrink-0">${fc(i.fecha)}</span>
      <div class="flex-1 min-w-[160px]"><p class="font-semibold">${esc(empById(i.empleadoId)?.nombre || '(empleado borrado)')}</p><p class="text-body-sm text-on-surface-variant">${esc(i.nota || 'Sin motivo')}</p></div>
      ${i.cantidad != null ? `<span class="tabular-nums text-secondary font-semibold">${money(+i.cantidad)}</span>` : ''}
      ${i.aplicado ? nChip(i.efectivo ? 'Pagado en efectivo' : 'Pagado ' + fc(i.aplicadoEn), OKC) : nChip(i.diferido ? 'Se paga después' : 'Por pagar', WARN) + quitar(i)}</div>`).join('')
      || '<p class="p-6 text-center text-on-surface-variant">Sin bonos especiales todavía.</p>'}</div>`;
  },

  vacaciones() {
    return '<p class="text-body-md text-on-surface-variant mb-3">Días según la LFT (reforma 2023): 12 el primer año, +2 por año hasta 20, luego +2 cada 5 años.</p>'
    + tbl(['Empleado', 'Ingreso', '#Antigüedad', '#Le tocan', '#Tomados', '#Disponibles', 'Periodo'], nomEmps().filter(e => e.pago !== 'dia').map(e => {
      const v = vacInfo(e);
      if (!v) return `<tr>${td(`<b>${esc(e.nombre)}</b>`)}<td colspan="6" class="px-3 py-2 border-t border-[#f1f5f9]">${nChip('Falta fecha de ingreso', WARN)} <button type="button" data-act="editemp" data-id="${e.id}" class="text-label-sm text-primary font-semibold ml-2">Capturar</button></td></tr>`;
      const pct = v.tocan ? Math.min(100, v.tomados / v.tocan * 100) : v.tomados ? 100 : 0;
      return `<tr>${td(`<b>${esc(e.nombre)}</b>`)}${td(fcy(e.ingreso))}${td(v.anios < 1 ? '&lt; 1 año' : `${v.anios} año${v.anios > 1 ? 's' : ''}`, 1)}${td(v.anios < 1 ? '<span class="text-on-surface-variant">12 al cumplir</span>' : v.tocan, 1)}
        ${td(`${v.tomados}<div class="h-1.5 rounded-full bg-surface-container mt-1 min-w-[60px] overflow-hidden"><div class="h-full ${v.disp < 0 ? 'bg-error' : 'bg-primary'}" style="width:${pct}%"></div></div>`, 1)}
        ${td(`<b class="${v.disp < 0 ? 'text-error' : ''}">${v.disp}</b>${v.disp < 0 ? '<br><span class="text-[11px]">adelantadas</span>' : ''}`, 1)}
        ${td(`<span class="text-body-sm text-on-surface-variant">${fcy(v.ini)} → ${fcy(v.prox)}${v.anios < 1 ? '' : ` · luego ${v.proxTocan}`}</span>`)}</tr>`;
    }).join(''), 'Sin empleados.')
    + '<p class="text-body-sm text-on-surface-variant mt-2">"Tomados" cuenta las vacaciones capturadas desde el último aniversario más el ajuste inicial de cada empleado (días que ya había tomado antes de usar el sistema).</p>';
  },

  empleados() {
    const admin = nomAdmin(), cfg = N.d.config, today = ymd();
    const list = L => tbl(['Nombre', 'Planta', ...(admin ? ['#Sueldo', '#Diario', '#Hora extra', '#Bono mes'] : []), 'Ingreso'], L.map(e => `<tr>
      ${td(`<b>${esc(e.nombre)}</b> ${esMenor(e) ? nChip('menor', BAD) : ''} ${e.baja && e.baja <= today ? nChip('baja ' + fcy(e.baja)) : ''}${!e.curp || !e.nacimiento ? nChip('falta CURP / nacimiento', WARN) : ''}
        ${e.curp || e.nacimiento ? `<br><span class="text-[11px] text-on-surface-variant">${e.curp ? 'CURP ' + esc(e.curp) : ''}${e.curp && e.nacimiento ? ' · ' : ''}${e.nacimiento ? `nació ${fcy(e.nacimiento)} (${edadDe(e.nacimiento)} años)` : ''}</span>` : ''}
        <br>${docsFaltan(e).length ? `${nChip(`expediente: faltan ${docsFaltan(e).length}`, WARN)} <span class="text-[11px] text-on-surface-variant">${esc(docsFaltan(e).join(', '))}</span>`
          : nChip('expediente completo', 'bg-secondary-container text-on-secondary-container')}${e.notas ? `<br><span class="text-[11px] text-on-surface-variant">${esc(e.notas)}</span>` : ''}
        <span class="flex flex-wrap gap-x-4 mt-1 whitespace-nowrap"><button type="button" data-act="editemp" data-id="${e.id}" class="text-label-sm text-primary font-semibold py-1">Editar</button>
        ${e.baja && e.baja <= today ? `<button type="button" data-act="altaemp" data-id="${e.id}" class="text-label-sm text-secondary font-semibold py-1"><span>Reactivar</span></button>`
          : `<button type="button" data-act="bajaemp" data-id="${e.id}" class="text-label-sm text-tertiary font-semibold py-1" aria-label="Dar de baja a ${esc(e.nombre)}"><span>Dar de baja</span></button>`}
        ${me.role === 'admin' ? `<button type="button" data-act="delemp" data-id="${e.id}" class="text-label-sm text-error font-semibold py-1" aria-label="Borrar a ${esc(e.nombre)}"><span>Borrar</span></button>` : ''}</span>`)}${td(esc(e.planta))}
      ${admin ? td(`${money(+e.sueldo || 0)}<br><span class="text-[11px] text-on-surface-variant">${e.pago === 'dia' ? 'por día' : 'semanal'}</span>`, 1) + td(money(salDiario(e)), 1)
        + td(`${money(teRate(e))}<br><span class="text-[11px] text-on-surface-variant">${teManual(e) ? 'tarifa propia' : 'por fórmula'}</span>`, 1) + td(+e.bono ? money(+e.bono) : '—', 1) : ''}
      ${td(e.ingreso ? fcy(e.ingreso) : nChip('falta', WARN))}</tr>`).join(''), 'Sin empleados.');
    const activo = e => !e.baja || e.baja > today;
    const grupos = [...CONTRATO.filter(([k]) => admin || k !== 'confianza').map(([k, l, txt]) => [k, l, txt, nomEmps(true).filter(e => activo(e) && (e.contrato || 'planta') === k)]),
      ['baja', 'Dados de baja', 'Ya no trabajan aquí. Se conserva su historial; "Reactivar" los regresa.', nomEmps(true).filter(e => !activo(e))]].filter(g => g[0] !== 'baja' || g[3].length);
    const num = (k, l, step = 0.5, v = cfg?.[k]) => labeled({ label: l }, `<input class="input" type="number" min="0" step="${step}" data-cfg="${k}" value="${esc(v)}">`);
    const sinCurp = nomEmps(true).filter(e => activo(e) && (!e.curp || !e.nacimiento));
    return `<div class="flex flex-wrap items-center gap-3 mb-3"><p class="text-body-md text-on-surface-variant flex-1">${nomEmps(true).filter(e => !e.baja || e.baja >= today).length} activos${admin ? '' : ` · planta ${esc(me.plant || '')}`}</p>
      <button type="button" data-act="newemp" class="btn btn-primary"><span class="material-symbols-outlined">person_add</span>Agregar empleado</button></div>
    ${sinCurp.length ? `<p class="p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-body-md mb-3 flex items-start gap-2"><span class="material-symbols-outlined">badge</span>
      <span>${sinCurp.length} ${sinCurp.length === 1 ? 'empleado activo no tiene' : 'empleados activos no tienen'} CURP o fecha de nacimiento: dale "Editar" a cada uno para capturarla
      (${sinCurp.slice(0, 8).map(e => esc(e.nombre)).join(', ')}${sinCurp.length > 8 ? '…' : ''}).</span></p>` : ''}
    ${grupos.map(([k, l, txt, L]) => `<h2 class="font-semibold flex flex-wrap items-center gap-2 mt-5 mb-1">${l} <span class="chip bg-surface-container text-on-surface-variant">${L.length}</span>
      ${k === 'confianza' ? '<span class="chip bg-surface-container-high text-primary">solo admin</span>' : ''}</h2><p class="text-body-sm text-on-surface-variant mb-2">${txt}</p>${list(L)}`).join('')}
    ${admin ? `<form id="cfgForm" class="card p-4 flex flex-col gap-3 mt-6">
      <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">tune</span>Parámetros de cálculo <span class="chip bg-surface-container-high text-primary">solo admin</span></h2>
      <p class="text-body-sm text-on-surface-variant">Aplican a quien tiene la hora extra "por fórmula"; quien tiene tarifa propia conserva la suya.</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${num('diasDivisor', 'Días para sacar el sueldo diario')}${num('horasJornada', 'Horas por jornada')}
        ${labeled({ label: 'Factor de hora extra' }, sel('data-cfg="factorTE"', [[1, 'Sencilla (×1)'], [1.5, '×1.5'], [2, 'Doble (×2, LFT primeras 9 h)'], [3, 'Triple (×3, después de 9 h)']], cfg.factorTE))}
        ${num('bonoDefault', 'Bono de puntualidad por defecto', 1)}${num('porcentaje', 'Comisión del depósito al contador (%)', 0.1)}
        ${N.d.areas.map(a => `<div class="col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-container-low items-end">
          <p class="col-span-2 lg:col-span-3 font-semibold">${esc(a)} · periodo de pago</p>`
          + labeled({ label: 'La semana empieza en' }, sel(`data-inicio="${esc(a)}"`, DOWL.map((d, k) => [k, d]), cfg.inicio?.[a] ?? 6))
          + labeled({ label: 'Qué semana se paga' }, sel(`data-desfase="${esc(a)}"`, [[-1, 'La semana en curso (termina después del pago)'], [0, 'La última semana completa'], [1, 'Con 1 semana de desfase'], [2, 'Con 2 semanas de desfase']], cfg.desfase?.[a] ?? 0))
          + `<p class="col-span-2 lg:col-span-1 self-center text-body-sm">El pago del ${fc(N.payday)} cubre del <b>${fc(periodo(a, N.payday).ini)}</b> al <b>${fc(periodo(a, N.payday).fin)}</b></p></div>`).join('')}
      </div>
      <div class="p-3 rounded-xl bg-surface-container-low grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        ${labeled({ label: 'Calculadora: sueldo semanal' }, `<input class="input" type="number" min="0" step="50" id="calcSue" value="${esc(N.calcSue)}">`)}<div id="calcOut" class="text-body-md">${calcOut(N.calcSue)}</div></div>
      <button class="btn btn-primary self-start"><span class="material-symbols-outlined">save</span>Guardar parámetros</button></form>` : ''}`;
  },
};
const calcOut = sue => { const d = (+sue || 0) / P().div, h = d / P().hrs;
  return [['Sueldo diario', d], ['Valor de la hora', h], [`Hora extra (×${P().fac})`, h * P().fac], ['Mensual aprox. (×4.33)', (+sue || 0) * 4.33]]
    .map(([l, v]) => `<p class="flex justify-between gap-2"><span class="text-on-surface-variant">${l}</span><b class="tabular-nums">${money(v)}</b></p>`).join(''); };
function capPreview() {
  const c = N.cap, t = NT[c.tipo];
  if (!c.emps.size) return 'Elige al menos un empleado.';
  const n = `${c.emps.size} empleado${c.emps.size > 1 ? 's' : ''}`;
  const pe = empById([...c.emps][0]), wk = pe && c.fecha ? ` Queda en la semana del pago ${fc(paydayOf(pe.planta, c.fecha))}.` : '';
  if (!t.s) return `${n} · sin efecto en dinero${t.quita ? ' · quita el bono de puntualidad del mes' : ''}.${wk}`;
  if (!nomAdmin()) return `${n} · ${t.s < 0 ? 'descuenta' : 'suma'} en la nómina.${wk}`;
  const tot = [...c.emps].reduce((s, id) => { const e = empById(id); return e ? s + amountOf({ tipo: c.tipo, cantidad: +c.cant || 0 }, e) : s; }, 0);
  return `${n} · ${tot < 0 ? 'descuenta' : 'suma'} ${money(Math.abs(tot))}${c.efectivo ? ' (pagado en efectivo)' : ''}.${wk}`;
}
// Formularios para editar un empleado o una incidencia (en lugar de la pestaña).
function nomEditForm() {
  const { kind, x } = N.edit, admin = nomAdmin(), back = '<button type="button" data-act="cancel" class="btn border-[1.5px] border-[#cbd5e1]">Cancelar</button>';
  if (kind === 'inc') {
    const t = NT[x.tipo] || {};
    return `<form id="incForm" class="card p-4 grid grid-cols-2 gap-3"><h2 class="col-span-2 font-semibold">Editar incidencia</h2>
      ${labeled({ label: 'Empleado', wide: true }, sel('name="empleadoId"', nomEmps(true).map(e => [e.id, e.nombre]), x.empleadoId))}
      ${admin ? labeled({ label: 'Tipo' }, sel('name="tipo"', Object.entries(NT).map(([k, v]) => [k, v.l]), x.tipo)) : labeled({ label: 'Tipo' }, `<input class="input" value="${esc(t.l)}" disabled>`)}
      ${labeled({ label: 'Fecha' }, `<input class="input" type="date" name="fecha" value="${esc(x.fecha)}" required>`)}
      ${x.cantidad != null ? labeled({ label: `Cantidad (${t.u === '$' ? 'pesos' : t.u})` }, `<input class="input" type="number" name="cantidad" step="0.5" min="0" value="${esc(x.cantidad)}" required>`) : ''}
      ${labeled({ label: 'Nota', wide: true }, `<input class="input" name="nota" maxlength="240" value="${esc(x.nota || '')}">`)}
      ${admin ? `<label class="col-span-2 flex items-center gap-2 text-body-md"><input type="checkbox" name="aplicado" ${x.aplicado ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Ya pagada / aplicada</label>` : ''}
      <div class="col-span-2 flex justify-end gap-2">${back}<button class="btn btn-primary">Guardar</button></div></form>`;
  }
  const e = x || { pago: 'semana', planta: admin ? 'Querétaro' : me.plant, sueldo: 2200, bono: +(N.d.config?.bonoDefault ?? 500), teModo: 'auto', diasBase: 1 };
  return `<form id="empForm" class="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end"><h2 class="col-span-2 lg:col-span-4 font-semibold">${x ? 'Editar empleado' : 'Nuevo empleado'}</h2>
    ${labeled({ label: 'Nombre completo', required: true, wide: true }, `<input class="input" name="nombre" required maxlength="80" value="${esc(e.nombre || '')}">`)}
    ${labeled({ label: 'CURP', required: true }, `<input class="input uppercase" name="curp" required minlength="18" maxlength="18" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(e.curp || '')}">`)}
    ${labeled({ label: 'Fecha de nacimiento', required: true }, `<input class="input" type="date" name="nacimiento" required value="${esc(e.nacimiento || '')}">`)}
    <p id="enac" class="col-span-2 lg:col-span-4 text-body-sm text-on-surface-variant -mt-1">La fecha de nacimiento se llena sola con la CURP.</p>
    ${admin ? labeled({ label: 'Planta' }, sel('name="planta"', N.d.areas.map(a => [a, a]), e.planta)) : ''}
    ${labeled({ label: 'Tipo de empleado' }, sel('name="contrato"', [['planta', 'De planta'], ['provisional', 'Provisional'], ...(admin ? [['confianza', 'De confianza']] : [])], e.contrato || 'planta'))}
    ${labeled({ label: 'Forma de pago' }, sel('name="pago"', [['semana', 'Sueldo semanal'], ['dia', 'Por día (sabatinos)']], e.pago))}
    ${admin ? labeled({ label: 'Sueldo (semanal o por día)' }, `<input class="input" type="number" name="sueldo" step="0.01" min="0" value="${esc(e.sueldo ?? 0)}">`)
      + labeled({ label: 'Hora extra' }, sel('name="teModo"', [['auto', 'Por fórmula'], ['manual', 'Tarifa propia']], e.teModo))
      + labeled({ label: 'Pago por hora extra (tarifa propia)' }, `<input class="input" type="number" name="te" step="0.01" min="0" value="${esc(e.te ?? 0)}">`)
      + labeled({ label: 'Bono de puntualidad al mes' }, `<input class="input" type="number" name="bono" step="1" min="0" value="${esc(e.bono ?? 0)}">`) : ''}
    ${labeled({ label: 'Días que trabaja (solo por día)' }, `<input class="input" type="number" name="diasBase" step="1" min="1" max="7" value="${esc(e.diasBase || 1)}">`)}
    ${labeled({ label: 'Fecha de ingreso' }, `<input class="input" type="date" name="ingreso" value="${esc(e.ingreso || '')}">`)}
    ${labeled({ label: 'Fecha de baja' }, `<input class="input" type="date" name="baja" value="${esc(e.baja || '')}">`)}
    ${labeled({ label: 'Vacaciones ya tomadas en el periodo actual' }, `<input class="input" type="number" name="vacAjuste" step="0.5" value="${esc(e.vacAjuste || 0)}">`)}
    ${labeled({ label: 'Notas', wide: true }, `<input class="input" name="notas" maxlength="240" value="${esc(e.notas || '')}">`)}
    <label class="col-span-2 flex items-center gap-2 text-body-md h-12"><input type="checkbox" name="menor" ${esMenor(e) ? 'checked' : ''} class="w-5 h-5 accent-[#2563eb]">Menor de 18 años (avisa si se le captura T.E. o domingo; con fecha de nacimiento se marca sola)</label>
    <fieldset class="col-span-2 lg:col-span-4 p-3 rounded-xl bg-surface-container-low"><legend class="text-label-md text-on-surface-variant px-1">Documentos en el expediente — marca con X los que ya tenemos</legend>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">${DOCS_EMP.map(([k, l]) => `<label class="flex items-center gap-2 text-body-md"><input type="checkbox" name="docs" value="${k}" ${(e.docs || []).includes(k) ? 'checked' : ''} class="w-5 h-5 shrink-0 accent-[#2563eb]">${l}</label>`).join('')}</div></fieldset>
    ${admin ? '<p id="ederiv" class="col-span-2 lg:col-span-4 p-3 rounded-xl bg-surface-container-low text-body-md"></p>' : '<p class="col-span-2 lg:col-span-4 text-body-sm text-on-surface-variant">El sueldo y el bono los pone el administrador.</p>'}
    ${x ? `<input type="hidden" name="id" value="${x.id}">` : ''}
    <div class="col-span-2 lg:col-span-4 flex justify-end gap-2">${back}<button class="btn btn-primary">Guardar</button></div></form>`;
}
// CURP y fecha de nacimiento en vivo: la fecha sale de la CURP, avisa si no coinciden, muestra la edad y marca "menor" sola.
function empNac(f) {
  const c = f.elements.curp, n = f.elements.nacimiento, out = f.querySelector('#enac');
  if (!c || !n || !out) return;
  const cu = c.value.toUpperCase().replace(/\s+/g, ''), ok = CURP_RE.test(cu), deCurp = ok ? curpNac(cu) : '';
  if (ok && !n.value) n.value = deCurp;
  const malo = (cu.length >= 18 && !ok) ? 'La CURP no tiene el formato correcto: revisa letras y números.'
    : ok && n.value && n.value !== deCurp ? `La fecha no coincide con la CURP (según la CURP: ${fcy(deCurp)}).` : '';
  const ed = n.value ? edadDe(n.value) : null;
  if (ed !== null) f.elements.menor.checked = ed < 18;
  f.elements.menor.disabled = ed !== null;
  out.textContent = malo || (ed !== null ? `Edad: ${ed} años${ed < 18 ? ' — menor de edad' : ''}.` : 'La fecha de nacimiento se llena sola con la CURP.');
  out.classList.toggle('text-error', !!malo);
}
// Sueldo diario y hora extra en vivo mientras el admin edita un empleado.
function empDeriv(f) {
  const out = f.querySelector('#ederiv');
  if (!out) return;
  const e = { pago: f.elements.pago.value, sueldo: +f.elements.sueldo.value || 0, teModo: f.elements.teModo.value, te: +f.elements.te.value || 0 };
  f.elements.te.disabled = e.teModo !== 'manual';
  out.textContent = `${e.pago === 'dia' ? 'Pago por día' : `Sueldo diario (÷${P().div})`} ${money(salDiario(e))} · hora extra por fórmula (×${P().fac}) ${money(teFormula(e))} · se pagará ${money(teRate(e))} por hora extra`;
}

function nomDraw() {
  const tabs = NTABS.filter(([k]) => !['nomina', 'ia'].includes(k) || nomAdmin()); // Nómina y Asistente IA: solo admin
  if (!tabs.some(([k]) => k === N.tab)) N.tab = tabs[0][0];
  const pend = nomEmps().filter(e => bonoStatus(e, N.bonoMes).st === 'si').length;
  $('#app').innerHTML = `<div id="nom" class="${WIDE ? 'max-w-6xl' : ''}">
    <h1 class="${WIDE ? 'text-3xl font-bold' : 'text-2xl font-semibold'} tracking-tight">Nómina</h1>
    <p class="text-sm text-on-surface-variant mb-3">${nomAdmin() ? 'Todas las plantas · solo tú ves sueldos y totales' : `Planta ${esc(me.plant || '')} · captura de personal (los montos solo los ve el administrador)`}</p>
    <nav class="flex gap-1 overflow-x-auto border-b border-[#e2e8f0] mb-4" role="tablist">${tabs.map(([k, l]) => `<a href="#/nomina/${k}" role="tab" aria-selected="${N.tab === k}" class="px-3 py-2.5 whitespace-nowrap text-label-lg border-b-[3px] ${N.tab === k ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}">${l}${k === 'bonos' && pend ? ` <span class="chip bg-tertiary text-white !px-1.5">${pend}</span>` : ''}</a>`).join('')}</nav>
    <p id="err" class="text-sm text-error hidden mb-2" role="alert"></p>
    ${N.edit ? nomEditForm() : nomTabs[N.tab]()}</div>`;
  const root = $('#nom'), ef = $('#empForm');
  if (ef) { const live = () => { empDeriv(ef); empNac(ef); }; live(); ef.oninput = ef.onchange = live; }
  root.onclick = nomClick; root.onchange = nomChange; root.oninput = nomInput; root.onsubmit = nomSubmit;
}
// Guarda y vuelve a cargar los datos (con lo que el servidor deja ver).
async function nomSave(path, data, after) {
  try { await api(path, data); N.d = await api('/api/nomina'); after?.(); nomDraw(); }
  catch (err) { showErr(err); }
}
async function nomClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act, id = Number(b.dataset.id);
  if (a === 'wk') { N.payday = addD(N.payday, 7 * b.dataset.d); N.confirm = ''; }
  else if (a === 'wkhoy') N.payday = N.tab === 'nomina' ? nextSat(ymd()) : paydayOf(navArea(), ymd());
  else if (a === 'bmes') { const [y, m] = N.bonoMes.split('-').map(Number); N.bonoMes = ymd(new Date(y, m - 1 + Number(b.dataset.d), 1)).slice(0, 7); }
  else if (a === 'toggle') N.open.has(id) ? N.open.delete(id) : N.open.add(id);
  else if (a === 'confirm') N.confirm = b.dataset.c;
  else if (a === 'cancel') { N.confirm = ''; N.edit = null; }
  else if (a === 'ctipo') { N.cap.tipo = b.dataset.t; N.cap.cant = NT[b.dataset.t].u === '$' ? '' : '1'; N.cap.efectivo = false; }
  else if (a === 'editinc') N.edit = { kind: 'inc', x: N.d.incs.find(i => i.id === id) };
  else if (a === 'editemp') N.edit = { kind: 'emp', x: empById(id) };
  else if (a === 'newemp') N.edit = { kind: 'emp', x: null };
  else if (a === 'bfmot') { N.bf.motivo = b.dataset.m; $('#bonoForm [name=motivo]').value = b.dataset.m; return; }
  else if (a === 'iaquitar') N.chat.file = null;
  else if (a === 'iadescartar') N.chat.cambios = [];
  else if (a === 'ialimpiar') { if (!confirmed(b)) return; N.chat = { msgs: [], cambios: [], draft: '', file: null, busy: false }; }
  // Borrar empleado: solo la cuenta dueña; doble toque para confirmar.
  else if (a === 'delemp') { if (confirmed(b)) nomSave('/api/nomina/emp/delete', { id }); return; }
  // Dar de baja (hoy) o reactivar: se guarda como cualquier cambio del empleado; doble toque para la baja.
  else if (a === 'bajaemp') { if (confirmed(b)) nomSave('/api/nomina/emp', { ...empById(id), baja: ymd() }); return; }
  else if (a === 'altaemp') return nomSave('/api/nomina/emp', { ...empById(id), baja: '' });
  else if (a === 'iaaplicar') return nomAplicar().catch(err => { N.chat.busy = false; showErr(err); });
  else if (a === 'delinc') { if (confirmed(b)) nomSave('/api/nomina/inc/delete', { id }); return; }
  else if (a === 'diferir') return nomSave('/api/nomina/inc/diferir', { id });
  else if (a === 'bono') return nomSave('/api/nomina/bono', { emps: [id], mes: N.bonoMes });
  else if (a === 'bonoall') { b.disabled = true; return nomSave('/api/nomina/bono', { emps: nomEmps().filter(x => bonoStatus(x, N.bonoMes).st === 'si').map(x => x.id), mes: N.bonoMes }); }
  else if (a === 'cerrar') {
    b.disabled = true;
    const L = calcSemana(N.payday), incIds = [], lineas = L.map(l => { const inc = l.items.filter(i => !i.diferido); incIds.push(...inc.map(i => i.id));
      return { empleadoId: l.e.id, nombre: l.e.nombre, planta: l.e.planta, periodo: l.p, base: l.base, faltas: r2(l.faltas), te: r2(l.te), teH: l.teH, extras: r2(l.extras), desc: r2(l.desc), total: l.total,
        detalle: inc.map(i => incLabel(i) + (i._arr ? ` (pendiente ${fc(i.fecha)})` : '')).join('; ') }; });
    return nomSave('/api/nomina/cerrar', { payday: N.payday, semana: weekNo(N.payday), total: r2(lineas.reduce((s, l) => s + l.total, 0)), porcentaje: +N.d.config.porcentaje || 0, lineas, incIds }, () => { N.confirm = ''; });
  }
  else if (a === 'reabrir') return nomSave('/api/nomina/reabrir', { payday: N.payday }, () => { N.confirm = ''; });
  else if (a === 'csv') {
    const c = N.d.cierres.find(x => x.payday === N.payday), L = c ? c.lineas : calcSemana(N.payday).map(l => ({ nombre: l.e.nombre, planta: l.e.planta, base: l.base, faltas: r2(l.faltas),
      te: r2(l.te), teH: l.teH, extras: r2(l.extras), desc: r2(l.desc), total: l.total, detalle: l.items.filter(i => !i.diferido).map(incLabel).join('; ') }));
    const tot = r2(L.reduce((s, l) => s + l.total, 0)), pct = +(c?.porcentaje ?? N.d.config.porcentaje) || 0;
    return csv(`nomina-polar-sem${weekNo(N.payday)}-${N.payday}.csv`, [['Semana', 'Pago', 'Planta', 'Empleado', 'Base', 'Faltas', 'Tiempo extra', 'Horas extra', 'Bonos/extras', 'Descuentos', 'Total', 'Detalle'],
      ...L.map(l => [weekNo(N.payday), N.payday, l.planta, l.nombre, l.base, l.faltas, l.te, l.teH || 0, l.extras, l.desc, l.total, l.detalle || '']),
      [], ['', '', '', 'TOTAL', '', '', '', '', '', '', tot], ['', '', '', `DEPÓSITO +${pct}%`, '', '', '', '', '', '', r2(tot * (1 + pct / 100))]]);
  }
  else return;
  nomDraw();
}
// Una propuesta del asistente editada a mano (data-ci = índice, data-k = campo).
const iaSet = t => { const x = N.chat.cambios[+t.dataset.ci], k = t.dataset.k;
  if (k === 'incluir') { x.incluir = t.checked; return nomDraw(); }
  x[k] = k === 'empleadoId' ? (t.value ? Number(t.value) : null) : t.value;
  if (k === 'empleadoId' && x.empleadoId) x.empleado = empById(x.empleadoId)?.nombre || x.empleado; };
function nomChange(e) {
  const t = e.target;
  if (t.dataset.ci) return iaSet(t);
  if (t.dataset.iafile !== undefined && t.files[0]) {
    const file = t.files[0];
    return leerArchivo(file).then(texto => { N.chat.file = { nombre: file.name, texto: texto.length > 300_000 ? texto.slice(0, 300_000) + '\n(recortado)' : texto }; nomDraw(); }, showErr);
  }
  if (t.dataset.per !== undefined) { N.payday = t.value; N.confirm = ''; return nomDraw(); }
  if (t.name === 'cemp') { t.checked ? N.cap.emps.add(+t.value) : N.cap.emps.delete(+t.value); return nomDraw(); }
  if (t.name === 'efectivo') { N.cap.efectivo = t.checked; $('#cprev').textContent = capPreview(); }
  if (t.closest('#filtros')) { N.fil[t.name] = t.value; nomDraw(); }
  if (t.closest('#bonoForm')) N.bf[t.name] = t.value;
}
function nomInput(e) {
  const t = e.target;
  if (t.dataset.ci && t.type !== 'checkbox') return iaSet(t);
  if (t.closest('#iaForm') && t.name === 'texto') N.chat.draft = t.value;
  if (t.closest('#capForm') && ['fecha', 'cant', 'nota'].includes(t.name)) { N.cap[t.name] = t.value; $('#cprev').textContent = capPreview(); }
  if (t.closest('#bonoForm')) N.bf[t.name] = t.value;
  if (t.id === 'calcSue') { N.calcSue = t.value; $('#calcOut').innerHTML = calcOut(t.value); }
}
function nomSubmit(e) {
  e.preventDefault();
  const f = e.target, fid = f.getAttribute('id'), v = Object.fromEntries(new FormData(f));
  // getAttribute: un campo name="id" dentro del formulario tapa f.id (pasaba al editar un empleado).
  if (fid === 'iaForm') return nomEnviar();
  if (fid === 'capForm') {
    const c = N.cap;
    if (!c.emps.size) return showErr(new Error('Elige al menos un empleado'));
    f.querySelector('.btn-primary').disabled = true;
    return nomSave('/api/nomina/inc', { emps: [...c.emps], tipo: c.tipo, fecha: c.fecha, cantidad: +c.cant, nota: c.nota.trim(), efectivo: c.efectivo },
      () => { N.cap = { ...N.cap, emps: new Set(), nota: '', efectivo: false }; });
  }
  if (fid === 'bonoForm') return nomSave('/api/nomina/inc', { emps: [+v.emp], tipo: 'bono', fecha: v.fecha, cantidad: +v.monto, nota: v.motivo.trim() },
    () => { N.bf = { emp: '', monto: '', motivo: '', fecha: ymd() }; });
  if (fid === 'incForm') return nomSave('/api/nomina/inc/edit', { ...v, id: N.edit.x.id, tipo: v.tipo || N.edit.x.tipo, cantidad: v.cantidad ?? N.edit.x.cantidad, aplicado: !!v.aplicado }, () => { N.edit = null; });
  if (fid === 'empForm') return nomSave('/api/nomina/emp', { ...v, menor: !!v.menor, docs: [...f.querySelectorAll('[name=docs]:checked')].map(x => x.value) }, () => { N.edit = null; });
  if (fid === 'cfgForm') {
    const config = { inicio: {} };
    f.querySelectorAll('[data-cfg]').forEach(x => { config[x.dataset.cfg] = x.value; });
    f.querySelectorAll('[data-inicio]').forEach(x => { config.inicio[x.dataset.inicio] = Number(x.value); });
    config.desfase = {}; f.querySelectorAll('[data-desfase]').forEach(x => { config.desfase[x.dataset.desfase] = Number(x.value); });
    return nomSave('/api/nomina/config', { config });
  }
}
views.nomina = async tab => {
  if (!N || N.uid !== me.id) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
    N = { uid: me.id, payday: null, open: new Set(), confirm: '', edit: null, calcSue: 2200, bonoMes: ymd(d).slice(0, 7),
      chat: { msgs: [], cambios: [], draft: '', file: null, busy: false },
      cap: { tipo: 'falta', emps: new Set(), fecha: ymd(), cant: '1', nota: '', efectivo: false }, fil: { emp: '', tipo: '', estado: 'todas' }, bf: { emp: '', monto: '', motivo: '', fecha: ymd() } }; }
  N.d = await api('/api/nomina');
  N.payday ||= N.d.admin ? nextSat(ymd()) : paydayOf(navArea(), ymd());
  N.tab = tab || N.tab || (N.d.admin ? 'nomina' : 'capturar'); N.edit = null; N.confirm = '';
  nomDraw();
};

// ---------- PL-FOR-43 Check list diario del líder de grupo (MOD-009) ----------
// El líder lo llena desde el teléfono (SÍ / NO / N/A); se anexa al reporte diario de su planta y fecha, donde el encargado
// marca cada NO ATENDIDO o PENDIENTE. Gerencia (admin) edita el catálogo de puntos.
const ROLE_L = { admin: 'Admin', colaborador: 'Encargado', lider: 'Líder de grupo' };
const CLL_RES = { 'TODO EN ORDEN': ['✅', 'bg-secondary-container text-on-secondary-container'], 'CON OBSERVACIONES': ['🟡', 'bg-tertiary-fixed text-on-tertiary-fixed'],
  'REQUIERE ATENCIÓN URGENTE': ['🔴', 'bg-error text-white'] };
const cllChip = (res, hora) => res ? `<span class="chip ${CLL_RES[res]?.[1] || ''}">${CLL_RES[res]?.[0] || ''} ${esc(res)}${hora ? ' · ' + esc(hora) : ''}</span>`
  : '<span class="chip bg-surface-container text-on-surface-variant">⚪ Pendiente</span>';
const cllResOf = (cat, P) => { const no = cat.filter(p => P[p.id]?.r === 'NO'); return no.some(p => p.critico) ? 'REQUIERE ATENCIÓN URGENTE' : no.length ? 'CON OBSERVACIONES' : 'TODO EN ORDEN'; };
const thumbs = ks => ks?.length ? `<div class="flex flex-wrap gap-2">${ks.map(k => `<a href="/api/files/${esc(k)}" target="_blank"><img src="/api/files/${esc(k)}" alt="Foto" loading="lazy" class="w-14 h-14 object-cover rounded-lg"></a>`).join('')}</div>` : '';

// Documento PL-FOR-43 armado (ver / imprimir; también va como anexo del PL-FOR-26).
function cllDoc(r) {
  const kv = pairs => `<table><tbody>${pairs.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v) || '&nbsp;'}</td></tr>`).join('')}</tbody></table>`;
  const at = x => [x.estado, x.comentario].filter(Boolean).join(' — ');
  const fotos = [...r.puntos.flatMap(p => p.fotos.map(k => [`${p.id}. ${p.texto}`, k])), ...r.incidencias.flatMap((i, n) => i.fotos.map(k => [`Incidencia ${n + 1}`, k]))];
  return `<div class="pl">
    <table class="head"><tr><td rowspan="3" class="logo">POLAR</td><td rowspan="2" class="t">RETRABAJOS INDUSTRIALES Y LIMPIEZAS ESPECIALIZADAS POLAR</td><td class="k">Número de control</td><td>PL-FOR-43</td></tr>
      <tr><td class="k">Revisión</td><td>00</td></tr>
      <tr><td class="bar">CHECK LIST DIARIO DEL LÍDER DE GRUPO</td><td class="k">Fecha emisión</td><td>OCT-2026</td></tr></table>
    ${kv([['Folio', r.folio], ['Planta', r.plant], ['Fecha', dmy(r.fecha)], ['Hora', r.hora], ['Turno', r.turno], ['Líder de grupo', r.lider], ['Encargado de planta', r.encargado], ['Resultado', r.resultado]])}
    ${[...new Set(r.puntos.map(p => p.seccion))].map(s => `<div class="bar">${esc(s)}</div>
      <table><thead><tr><th>#</th><th>Punto</th><th>SÍ</th><th>NO</th><th>N/A</th><th>Observaciones</th><th>Encargado</th></tr></thead><tbody>
      ${r.puntos.filter(p => p.seccion === s).map(p => `<tr><td class="c">${p.id}</td><td>${esc(p.texto)}${p.critico ? ' (crítico)' : ''}</td>
        ${['SI', 'NO', 'NA'].map(x => `<td class="c">${p.r === x ? '☒' : '☐'}</td>`).join('')}<td>${esc(p.obs)}</td><td>${esc(at(p))}</td></tr>`).join('')}</tbody></table>`).join('')}
    <div class="bar">INCIDENCIAS DEL DÍA</div>
    <table><thead><tr><th>Hora</th><th>Descripción</th><th>Qué se hizo</th><th>Encargado</th></tr></thead><tbody>${r.incidencias.length
      ? r.incidencias.map(i => `<tr><td class="c">${esc(i.hora)}</td><td>${esc(i.desc)}</td><td>${esc(i.accion)}</td><td>${esc(at(i))}</td></tr>`).join('')
      : '<tr><td colspan="4" class="c">Sin incidencias</td></tr>'}</tbody></table>
    <table class="firmas"><tr><td>${esc(r.lider)}<br><b>LÍDER DE GRUPO</b></td><td>${esc(r.encargado)}<br><b>ENCARGADO DE PLANTA</b></td></tr></table>
    ${fotos.length ? `<div class="bar">ANEXOS — FOTOS</div><div class="fotos">${fotos.map(([l, k]) => `<figure><img src="/api/files/${esc(k)}" alt="${esc(l)}"><figcaption>${esc(l)}</figcaption></figure>`).join('')}</div>` : ''}
    ${controlado('PL-FOR-43', '00')}
  </div>`;
}

// Panel "CHECK LIST DEL LÍDER" (reporte diario, inicio y pantalla del check list): solo los NO y las incidencias del líder.
// canMark: el encargado / gerencia los marca ATENDIDO o PENDIENTE con comentario (se guarda al momento).
function cllPanel(reg, canMark) {
  const items = reg ? [...reg.puntos.filter(p => p.r === 'NO').map(p => ({ ...p, tipo: 'punto', i: p.id, titulo: `${p.id}. ${p.texto}`, txt: p.obs })),
    ...reg.incidencias.map((x, i) => ({ ...x, tipo: 'inc', i, titulo: `Incidencia${x.hora ? ' · ' + x.hora : ''}`, txt: [x.desc, x.accion && 'Se hizo: ' + x.accion].filter(Boolean).join(' · ') }))] : [];
  return `<section data-cllp="${esc(reg?.folio || '')}" class="card p-4 flex flex-col gap-2 border-l-4 ${!reg ? 'border-[#cbd5e1]' : reg.resultado.startsWith('REQUIERE') ? 'border-error' : items.length ? 'border-tertiary-fixed-dim' : 'border-secondary'}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-primary">fact_check</span>CHECK LIST DEL LÍDER</h2>${cllChip(reg?.resultado, reg?.hora)}</div>
    ${!reg ? '<p class="text-body-sm text-on-surface-variant">El líder todavía no envía el check list de este día. Aparece aquí en cuanto lo envíe.</p>' : `
    <p class="text-body-sm text-on-surface-variant">${esc(reg.lider)} · ${items.length ? `${items.length} ${items.length === 1 ? 'punto' : 'puntos'} por revisar` : 'Todos los puntos en orden y sin incidencias.'}</p>
    ${items.map(x => `<div data-item="${x.tipo}:${x.i}" class="py-2 border-t border-[#f1f5f9] flex flex-col gap-1.5">
      <p class="font-medium flex flex-wrap items-center gap-2">${esc(x.titulo)}${x.critico ? '<span class="chip bg-error text-white">Crítico</span>' : ''}
        <span data-estado class="chip ${x.estado === 'ATENDIDO' ? 'bg-secondary-container text-on-secondary-container' : x.estado === 'PENDIENTE' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container text-on-surface-variant'}">${esc(x.estado || 'Sin revisar')}</span></p>
      <p class="text-body-sm">${esc(x.txt)}</p>${thumbs(x.fotos)}
      ${x.comentario ? `<p class="text-[12px] text-on-surface-variant">Comentario: ${esc(x.comentario)}${x.por ? ' · ' + esc(x.por) : ''}</p>` : ''}
      ${canMark ? `<div class="grid grid-cols-2 gap-2"><input class="input !py-2 col-span-2" data-com placeholder="Comentario (qué se hizo / qué falta)" value="${esc(x.comentario || '')}" maxlength="500" aria-label="Comentario">
        <button type="button" data-mark="ATENDIDO" class="btn !min-h-0 !py-2 bg-secondary-container text-on-secondary-container">Atendido</button>
        <button type="button" data-mark="PENDIENTE" class="btn !min-h-0 !py-2 bg-tertiary-fixed text-on-tertiary-fixed">Pendiente</button></div>` : ''}
    </div>`).join('')}
    <a href="#/cllver/${esc(reg.folio)}" class="text-label-md text-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">description</span>Ver check list completo</a>`}
  </section>`;
}
// Botones Atendido / Pendiente de los paneles dentro de root.
function wireCll() {
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-mark]'), row = b?.closest('[data-item]'), panel = b?.closest('[data-cllp]');
    if (!row) return;
    const [tipo, i] = row.dataset.item.split(':'), chip = row.querySelector('[data-estado]');
    b.disabled = true;
    try {
      await api('/api/cll/atender', { folio: panel.dataset.cllp, tipo, i, estado: b.dataset.mark, comentario: row.querySelector('[data-com]').value });
      chip.textContent = b.dataset.mark;
      chip.className = `chip ${b.dataset.mark === 'ATENDIDO' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`;
    } catch (err) { alert(err.message); }
    b.disabled = false;
  });
}
const cllAvisos = avisos => (avisos || []).map(a => `<div class="rounded-xl p-3 flex items-start gap-2 ${a.nivel === 'red' ? 'bg-error text-white' : 'bg-tertiary-fixed text-on-tertiary-fixed'}">
  <span class="material-symbols-outlined">${a.nivel === 'red' ? 'emergency' : 'schedule'}</span><span class="text-body-md">${esc(a.text)}</span></div>`).join('');

// Pantalla del check list: el líder lo llena (también el encargado si falta el líder, o gerencia); si ya se envió, el resumen.
// El avance se guarda en el teléfono (uno por planta y día) y se recupera si se cierra la app o no hay señal.
const CLL_BTN = { SI: ['SÍ', 'bg-secondary-container text-on-secondary-container border-secondary'], NO: ['NO', 'bg-error text-white border-error'], NA: ['N/A', 'bg-surface-container-high text-on-surface border-[#64748b]'] };
views.cll = async arg => {
  const plant = me.role === 'admin' ? (PLANTS.includes(decodeURIComponent(arg || '')) ? decodeURIComponent(arg) : PLANTS[0]) : me.plant;
  const d = await api('/api/cll?planta=' + encodeURIComponent(plant)), cat = d.catalogo, reg = d.registro;
  const key = `cll:${me.id}:${plant}:${d.hoy}`;
  let S = null;
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('cll:') && !k.endsWith(':' + d.hoy)) localStorage.removeItem(k);
    S = JSON.parse(localStorage.getItem(key));
  } catch {}
  const draft = !!S;
  S ||= { puntos: {}, incidencias: [] };
  const save = () => { try { localStorage.setItem(key, JSON.stringify(S)); } catch {} };
  const card = p => { const x = S.puntos[p.id] || {};
    return `<div data-p="${p.id}" class="card p-3 flex flex-col gap-2 ${x.r === 'NO' ? 'ring-2 ring-error' : ''}">
      <p class="font-medium flex flex-wrap items-center gap-2"><span>${p.id}. ${esc(p.texto)}</span>${p.critico ? '<span class="chip bg-error text-white">Crítico</span>' : ''}${p.foto ? '<span class="chip bg-surface-container text-on-surface-variant" title="Si es NO hay que tomar foto">📷 foto si es NO</span>' : ''}</p>
      <div class="grid grid-cols-3 gap-2">${Object.entries(CLL_BTN).map(([v, [l, on]]) => `<button type="button" data-r="${v}" aria-pressed="${x.r === v}"
        class="h-14 rounded-xl text-lg font-bold border-2 ${x.r === v ? on : 'border-[#cbd5e1] text-on-surface-variant bg-surface-container-lowest'}">${l}</button>`).join('')}</div>
      ${x.r === 'NO' ? `<label class="flex flex-col gap-1 text-label-md text-on-surface-variant"><span>Observaciones: qué pasó y qué se hizo <span class="text-error">*</span></span>
        <textarea class="input" rows="2" data-obs maxlength="1000">${esc(x.obs || '')}</textarea></label>
        <div class="text-label-md text-on-surface-variant"><span>Foto ${p.foto ? '<span class="text-error">* obligatoria</span>' : '(opcional)'}</span>${input({ type: 'photos' }, `p.${p.id}`, x.fotos)}</div>` : ''}
    </div>`; };
  const incRow = (x = {}, i) => `<div data-inc class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-container-low">
    ${labeled({ label: 'Qué pasó', required: true, wide: true }, `<textarea class="input" rows="2" data-k="desc" maxlength="1000">${esc(x.desc || '')}</textarea>`)}
    ${labeled({ label: 'Hora' }, `<input class="input" type="time" data-k="hora" value="${esc(x.hora || '')}">`)}
    ${labeled({ label: 'Qué se hizo', wide: true }, `<textarea class="input" rows="2" data-k="accion" maxlength="1000">${esc(x.accion || '')}</textarea>`)}
    <div class="col-span-2 text-label-md text-on-surface-variant">Foto (opcional)${input({ type: 'photos' }, `inc.${i}`, x.fotos)}</div>
    <button type="button" data-del-inc class="col-span-2 justify-self-end text-label-sm text-error flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">delete</span>Quitar</button></div>`;
  const resNow = () => `<span class="text-label-sm text-on-surface-variant mr-1">${cat.filter(p => S.puntos[p.id]?.r).length}/${cat.length} contestados</span>${cllChip(cllResOf(cat, S.puntos))}`;
  const historial = d.historial.length ? d.historial.map(h => `<a href="#/cllver/${esc(h.folio)}" class="flex flex-wrap items-center justify-between gap-2 py-2 border-t border-[#f1f5f9]">
      <span class="text-body-md">${fdate(h.date, { weekday: 'short', day: 'numeric', month: 'short' })}${me.role !== 'lider' ? ` · ${esc(h.lider || '')}` : ''}</span>${cllChip(h.status, h.hora)}</a>`).join('')
    : '<p class="text-body-sm text-on-surface-variant">Aún no hay check list en los últimos 30 días.</p>';
  $('#app').innerHTML = `
    <p class="text-label-sm font-semibold text-primary">PL-FOR-43 · REV. 00</p>
    <h1 class="text-headline-lg-mobile tracking-tight">Check list del líder de grupo</h1>
    <p class="text-body-md text-on-surface-variant mb-3">${fdate(d.hoy)} · Planta ${esc(plant)}</p>
    ${me.role === 'admin' ? `<div class="flex gap-2 mb-3">${PLANTS.map(p => `<a href="#/cll/${encodeURIComponent(p)}" class="chip !px-3 !py-1.5 ${p === plant ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">${esc(p)}</a>`).join('')}</div>` : ''}
    <div class="flex flex-col gap-2 mb-3">${cllAvisos(d.avisos)}</div>
    <div class="${WIDE ? 'grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start' : 'flex flex-col gap-4'}">
    <div class="flex flex-col gap-4">
    ${reg ? `${cllPanel(reg, me.role !== 'lider')}<div class="card p-4 flex flex-col gap-1">
        <p class="font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-secondary">task_alt</span>Check list de hoy enviado</p>
        <p class="text-body-sm text-on-surface-variant">${esc(reg.folio)} · ${esc(reg.lider)} · ${esc(reg.hora)}. Una vez enviado ya no se edita.</p></div>` : `
    ${draft ? '<div class="rounded-xl p-3 flex items-center gap-2 bg-tertiary-fixed/50 text-body-md"><span class="material-symbols-outlined text-tertiary">history</span>Recuperamos lo que llevabas capturado.</div>' : ''}
    <section class="card p-4 grid grid-cols-2 lg:grid-cols-3 gap-2 text-body-sm">
      ${[['Folio', `CLL-${{ Querétaro: 'QRO', Silao: 'SIL' }[plant]}-${d.hoy.replaceAll('-', '')}-T1`], ['Planta', plant], ['Fecha', dmy(d.hoy)], ['Líder de grupo', me.name], ['Encargado', d.encargado || '—'], ['Turno', '1']]
        .map(([k, v]) => `<div><p class="text-label-sm text-on-surface-variant">${k}</p><p class="font-medium">${esc(v)}</p></div>`).join('')}
    </section>
    ${d.pendientes.length ? `<section class="card p-4 flex flex-col gap-1 border-l-4 border-tertiary-fixed-dim"><h2 class="font-semibold">Pendientes del check list anterior (${dmy(d.pendientes[0].fecha)})</h2>
      <p class="text-body-sm text-on-surface-variant">Revísalos para contestar "Incidencias del día anterior atendidas".</p>
      ${d.pendientes.map(x => `<p class="text-body-sm">• <b>${esc(x.texto)}</b>: ${esc(x.obs)} <span class="chip bg-surface-container text-on-surface-variant">${esc(x.estado)}</span></p>`).join('')}</section>` : ''}
    <form id="cllf" class="flex flex-col gap-3" novalidate>
      ${[...new Set(cat.map(p => p.seccion))].map(s => `<h2 class="rounded-xl bg-primary text-white px-4 py-2 font-semibold text-label-lg mt-2">${esc(s)}</h2>
        ${cat.filter(p => p.seccion === s).map(card).join('')}`).join('')}
      <h2 class="rounded-xl bg-primary text-white px-4 py-2 font-semibold text-label-lg mt-2">INCIDENCIAS DEL DÍA</h2>
      <div id="incs" class="flex flex-col gap-2">${S.incidencias.map(incRow).join('')}</div>
      <button type="button" data-add-inc class="btn border-[1.5px] border-dashed border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">add</span>Agregar incidencia</button>
      <div class="card px-3 py-2 flex flex-wrap items-center justify-between gap-2 sticky bottom-24 lg:bottom-4 z-10"><span class="text-label-sm text-on-surface-variant">Resultado</span><span id="cllres">${resNow()}</span></div>
      <p id="err" class="text-sm text-error hidden" role="alert"></p>
      <button class="btn btn-primary w-full"><span class="material-symbols-outlined">send</span>Enviar check list</button>
    </form>`}
    </div>
    <div class="flex flex-col gap-4">
      <section class="card p-4"><h2 class="font-semibold mb-1">${me.role === 'lider' ? 'Mis check list' : 'Historial'} (30 días)</h2>${historial}</section>
      ${d.config ? cllCatalogo(d.config) : ''}
    </div></div>`;
  if (d.config) wireCatalogo();
  const form = $('#cllf');
  if (!form) return;
  // Lo capturado en pantalla → S (y al teléfono).
  const collect = () => {
    form.querySelectorAll('[data-p]').forEach(c => { const x = S.puntos[c.dataset.p]; if (!x) return;
      const o = c.querySelector('[data-obs]'); if (o) x.obs = o.value;
      x.fotos = [...c.querySelectorAll('[data-photo] input')].map(i => i.value); });
    S.incidencias = [...form.querySelectorAll('[data-inc]')].map(r => ({ desc: r.querySelector('[data-k=desc]').value, hora: r.querySelector('[data-k=hora]').value,
      accion: r.querySelector('[data-k=accion]').value, fotos: [...r.querySelectorAll('[data-photo] input')].map(i => i.value) }));
    $('#cllres').innerHTML = resNow();
    save();
  };
  form.onclick = e => {
    const r = e.target.closest('[data-r]'), c = r?.closest('[data-p]');
    if (r) { collect(); const id = c.dataset.p; S.puntos[id] = { ...(S.puntos[id] || {}), r: r.dataset.r }; c.outerHTML = card(cat.find(p => String(p.id) === id)); collect(); return; }
    if (e.target.closest('[data-add-inc]')) { collect(); $('#incs').insertAdjacentHTML('beforeend', incRow({}, Date.now())); collect(); return; }
    const del = e.target.closest('[data-del-inc], [data-del-photo]');
    if (del) { del.closest(del.matches('[data-del-inc]') ? '[data-inc]' : '[data-photo]').remove(); collect(); }
  };
  form.oninput = collect;
  form.onchange = e => { if (!handleUpload(e, collect)) collect(); };
  form.onsubmit = async e => {
    e.preventDefault(); collect();
    const falla = (p, msg) => { const c = form.querySelector(`[data-p="${p.id}"]`); c.scrollIntoView({ block: 'center' }); c.classList.add('ring-2', 'ring-error'); showErr(new Error(msg)); };
    if (uploading) return showErr(new Error('Espera a que terminen de subir las fotos'));
    for (const p of cat) {
      const x = S.puntos[p.id];
      if (!x?.r) return falla(p, `Falta contestar: ${p.texto}`);
      if (x.r === 'NO' && !x.obs?.trim()) return falla(p, `Escribe qué pasó y qué se hizo en: ${p.texto}`);
      if (x.r === 'NO' && p.foto && !x.fotos?.length) return falla(p, `Toma una foto de: ${p.texto}`);
    }
    if (S.incidencias.some(i => !i.desc.trim() && (i.accion.trim() || i.fotos.length))) return showErr(new Error('Escribe qué pasó en cada incidencia (o quítala)'));
    const btn = form.querySelector('.btn-primary'), label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>Enviando…';
    try {
      await api('/api/cll', { planta: plant, puntos: S.puntos, incidencias: S.incidencias });
      try { localStorage.removeItem(key); } catch {}
      views.cll(arg);
    } catch (err) {
      btn.disabled = false; btn.innerHTML = label;
      showErr(err instanceof TypeError ? new Error('Sin conexión: lo capturado sigue guardado en este teléfono. Vuelve a enviar cuando tengas señal.') : err);
    }
  };
};
views.cllver = async folio => {
  const r = await api('/api/cll/registro?folio=' + encodeURIComponent(decodeURIComponent(folio)));
  $('#app').innerHTML = `
    <div class="no-print flex items-center justify-between mb-4">
      <a href="#/cll${me.role === 'admin' ? '/' + encodeURIComponent(r.plant) : ''}" class="text-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined">arrow_back</span>Check list</a>
      <button onclick="print()" class="btn btn-primary"><span class="material-symbols-outlined">print</span>Imprimir</button></div>
    ${me.role !== 'lider' ? `<div class="no-print mb-4">${cllPanel(r, true)}</div>` : ''}
    ${cllDoc(r)}`;
};

// Catálogo de puntos (gerencia): agregar, renombrar, foto obligatoria, crítico, abre mantenimiento, plantas y activo.
const catRow = (p = {}) => `<div data-cat class="grid grid-cols-2 lg:grid-cols-6 gap-2 p-3 rounded-xl bg-surface-container-low items-end">
  <input type="hidden" data-c="id" value="${esc(p.id ?? '')}">
  ${labeled({ label: 'Sección' }, `<input class="input" data-c="seccion" value="${esc(p.seccion || '')}" list="dl-cllsec" maxlength="40">`)}
  ${labeled({ label: `Punto${p.id ? ' #' + p.id : ' nuevo'}`, wide: true }, `<input class="input" data-c="texto" value="${esc(p.texto || '')}" maxlength="160">`)}
  <div class="col-span-2 lg:col-span-3 flex flex-wrap gap-x-4 gap-y-1 text-label-sm">
    ${[['foto', '📷 Foto si es NO'], ['critico', 'Crítico (urgente)'], ['mant', 'Abre mantenimiento'], ['activo', 'Activo']].map(([k, l]) =>
      `<label class="flex items-center gap-1.5"><input type="checkbox" data-c="${k}" ${(k === 'activo' ? p.activo !== false : p[k]) ? 'checked' : ''} class="w-4 h-4 accent-[#2563eb]">${l}</label>`).join('')}
    ${PLANTS.map(pl => `<label class="flex items-center gap-1.5"><input type="checkbox" data-pl="${esc(pl)}" ${(p.plantas || PLANTS).includes(pl) ? 'checked' : ''} class="w-4 h-4 accent-[#2563eb]">${esc(pl)}</label>`).join('')}
  </div></div>`;
const cllCatalogo = c => `<details class="card p-4"><summary class="font-semibold flex items-center gap-2 cursor-pointer"><span class="material-symbols-outlined text-primary">tune</span>Puntos del check list (gerencia)</summary>
  <form id="cllcat" class="flex flex-col gap-2 mt-3">
    <p class="text-body-sm text-on-surface-variant">Los puntos no se borran: desactívalos para que dejen de pedirse (el historial los conserva).</p>
    <datalist id="dl-cllsec">${[...new Set(c.puntos.map(p => p.seccion))].map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="grid grid-cols-2 gap-2">
      ${labeled({ label: 'Recordatorio al líder' }, `<input class="input" type="time" data-h="hora_lider" value="${esc(c.hora_lider)}">`)}
      ${labeled({ label: 'Aviso al encargado' }, `<input class="input" type="time" data-h="hora_encargado" value="${esc(c.hora_encargado)}">`)}</div>
    <div id="catrows" class="flex flex-col gap-2">${c.puntos.map(catRow).join('')}</div>
    <button type="button" data-add-cat class="btn border-[1.5px] border-dashed border-[#cbd5e1] text-primary"><span class="material-symbols-outlined">add</span>Agregar punto</button>
    <p id="caterr" class="text-sm text-error hidden" role="alert"></p>
    <button class="btn btn-primary"><span class="material-symbols-outlined">save</span>Guardar puntos</button>
  </form></details>`;
function wireCatalogo() {
  const f = $('#cllcat');
  f.onclick = e => { if (e.target.closest('[data-add-cat]')) $('#catrows').insertAdjacentHTML('beforeend', catRow()); };
  f.onsubmit = async e => {
    e.preventDefault();
    const v = (r, k) => r.querySelector(`[data-c="${k}"]`), puntos = [...f.querySelectorAll('[data-cat]')].map(r => ({ id: v(r, 'id').value || null,
      seccion: v(r, 'seccion').value, texto: v(r, 'texto').value, foto: v(r, 'foto').checked, critico: v(r, 'critico').checked, mant: v(r, 'mant').checked,
      activo: v(r, 'activo').checked, plantas: [...r.querySelectorAll('[data-pl]:checked')].map(x => x.dataset.pl) })).filter(p => p.texto.trim());
    const btn = f.querySelector('.btn-primary'); btn.disabled = true;
    try {
      await api('/api/cll/catalogo', { puntos, ...Object.fromEntries([...f.querySelectorAll('[data-h]')].map(x => [x.dataset.h, x.value])) });
      views.cll(location.hash.split('/')[2]);
    } catch (err) { $('#caterr').textContent = err.message; $('#caterr').classList.remove('hidden'); btn.disabled = false; }
  };
}

// ---------- Navegación ----------
const NAV = {
  lider: [['cll', 'fact_check', 'Check list'], ['visitas', 'how_to_reg', 'Visitantes']],
  colaborador: [['inicio', 'dashboard', 'Inicio'], ['nuevo', 'add_task', ''], ['historial', 'history', 'Historial'], ['calidad', 'verified', 'Calidad'], ['visitas', 'how_to_reg', 'Visitantes']],
  admin: [['admin', 'groups', 'Reportes'], ['semanal', 'auto_awesome', 'Semanal'], ['calidad', 'verified', 'Calidad'], ['cuentas', 'manage_accounts', 'Cuentas'],
    ['camiones', 'local_shipping', 'Camiones'], ['formulario', 'edit_note', 'Formulario'], ['cll', 'fact_check', 'Check list líder'], ['visitas', 'how_to_reg', 'Visitantes']],
};
// Nómina: el admin siempre; el encargado solo si el admin le dio acceso (Cuentas → Nómina).
const navItems = () => [...NAV[me.role], ...(me.role === 'admin' || me.nomina ? [['nomina', 'badge', 'Nómina']] : [])];
function renderNav(name) {
  // Calidad lleva el número de alertas pendientes (gerencia).
  const items = navItems().map(([p, icon, label]) => [p, icon, p === 'calidad' && alertN ? `${label} <span class="chip bg-error text-white !px-1.5">${alertN}</span>` : label]);
  // Computadora: menú lateral (panel admin y app en pantalla grande). Teléfono: barra inferior con botón central.
  $('#nav').innerHTML = WIDE ? `<div class="flex flex-col h-full">
    <div class="flex items-center gap-2 px-2 mb-8">${logo(30)}<div class="flex flex-col items-start gap-1"><span class="text-lg font-semibold tracking-tight leading-tight">Reporte Diario Polar</span><span class="chip bg-surface-container-high text-primary">${ROLE_L[me.role]}</span></div></div>
    <div class="flex flex-col gap-1">${items.map(([p, icon, label]) => `
      <a href="#/${p}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl ${p === name ? 'bg-surface-container-high text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}">
        <span class="material-symbols-outlined">${icon}</span>${{ Semanal: 'Resumen semanal', '': 'Nuevo reporte' }[label] ?? label}</a>`).join('')}</div>
    <div class="mt-auto flex items-center justify-between gap-2 px-2 pt-4 border-t border-[#f1f5f9]">
      <a href="#/cuenta" title="Mi cuenta" class="min-w-0 rounded-lg px-1 -mx-1 ${name === 'cuenta' ? 'text-primary' : 'hover:bg-surface-container-low'}"><p class="text-sm font-semibold truncate">${esc(me.name)}</p><p class="text-xs text-on-surface-variant truncate">${esc(me.email)} · Mi cuenta</p></a>
      <button data-logout class="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high" aria-label="Cerrar sesión" title="Cerrar sesión"><span class="material-symbols-outlined">logout</span></button>
    </div></div>`
  : `<div class="flex items-center justify-around h-20 px-4">${items.map(([p, icon, label]) => !label
    ? `<a href="#/${p}" class="relative -top-3 flex items-center justify-center w-14 h-14 rounded-full bg-primary-container text-white shadow-[0_8px_16px_rgba(37,99,235,0.35)]" aria-label="Nuevo reporte"><span class="material-symbols-outlined text-[28px]">${icon}</span></a>`
    : `<a href="#/${p}" class="flex flex-col items-center gap-1 flex-1 min-w-0 ${p === name ? 'text-primary font-semibold' : 'text-on-surface-variant'}"><span class="material-symbols-outlined">${icon}</span><span class="text-[11px]">${label}</span></a>`).join('')}</div>`;
}

// Opción del menú que se marca en pantallas que no están en el menú.
const QVIEWS = ['rec', 'lib', 'nc', 'ncedit', 'q', 'fmt', 'fmtedit', 'docs']; // pantallas de Calidad que no están en el menú
const navOf = name => ({ pl: 'admin', editar: me.role === 'admin' ? 'admin' : 'historial', cllver: 'cll', visita: 'visitas', ...(me.role === 'lider' && { q: 'visitas' }) })[name]
  ?? (QVIEWS.includes(name) ? 'calidad' : name);
async function route() {
  const [name, arg] = location.hash.slice(2).split('/');
  if (!me) return views.login();
  if (WEB && me.role !== 'admin') return views.soloAdmin();
  // pl/ID: PL-FOR-26, solo admin; editar/ID: corregir un reporte; cuenta: mi contraseña (ambos roles).
  // visita: registrar visitante (todos); el líder además solo abre registros (q) de visitas — el servidor no le da otros.
  const allowed = [...navItems().map(n => n[0]), 'cuenta', 'cllver', 'visita', ...(me.role === 'lider' ? ['q'] : ['editar', 'cll', ...QVIEWS]), ...(me.role === 'admin' ? ['pl'] : [])];
  if (!allowed.includes(name)) return location.hash = '#/' + allowed[0];
  renderNav(navOf(name));
  try { await views[name](arg); } catch (e) { $('#app').innerHTML = `<p class="text-error text-sm">${esc(e.message)}</p>`; }
  scrollTo(0, 0);
}
async function boot() {
  questions = await api('/api/questions');
  me = await api('/api/me').catch(() => null);
  const showChrome = me && (!WEB || me.role === 'admin');
  document.querySelectorAll('[data-chrome]').forEach(el => el.classList.toggle('hidden', !showChrome));
  document.body.classList.toggle('chrome', !!showChrome);
  if (me && $('#role-chip')) $('#role-chip').textContent = ROLE_L[me.role];
  route();
  // Gerencia: número de alertas de Calidad en el menú (nuevo no conforme, lotes detenidos…).
  if (me?.role === 'admin') api('/api/calidad').then(c => { alertN = c.alertas.length; renderNav(navOf(location.hash.slice(2).split('/')[0])); }).catch(() => {});
}
async function logout() { await api('/api/logout', {}).catch(() => {}); me = null; history.replaceState(null, '', location.pathname); boot(); }

addEventListener('DOMContentLoaded', () => {
  addEventListener('hashchange', route);
  // Si la ventana cruza el tamaño de computadora, solo se cambia el menú: redibujar la vista borraría un formulario a medio llenar.
  DESK.addEventListener('change', e => {
    WIDE = WEB || e.matches;
    const name = location.hash.slice(2).split('/')[0];
    if (me && !(WEB && me.role !== 'admin')) renderNav(navOf(name));
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-logout]')) logout(); });
  wireCll(); // botones Atendido / Pendiente de los paneles del check list del líder
  for (const ev of ['change', 'input']) document.addEventListener(ev, e => { if (e.target.form?.id === 'report') syncSubs(e.target.form); });
  boot();
});
